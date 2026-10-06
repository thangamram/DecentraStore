const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

let providers = [];
let rentals = [];

const storagePath = path.join(__dirname, "..", "storage-providers", "provider-1", "storage");
fs.mkdirSync(storagePath, { recursive: true });

const upload = multer({ dest: storagePath });

const blockchainProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", blockchainProvider);
const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const contractABI = [
    "function projectName() view returns (string)",
    "function registerFile(string,string)",
    "function getFileCount() view returns (uint256)",
    "function createRental(string,string,uint256,uint256,uint256,uint256,string[],uint256[])",
    "function expireRental(string)",
    "function isRentalActive(string) view returns (bool)"
];
const blockchainContract = new ethers.Contract(contractAddress, contractABI, signer);

app.get("/", (req, res) => {
    res.json({ message: "DecentraStore Backend is running!" });
});

// AUTH MOCK
app.post("/api/auth/login", (req, res) => {
    const { role, username } = req.body;
    if (!role || !username) return res.status(400).json({ message: "Role and username required" });
    
    // Check if provider exists, if not create them (to support dynamic logins)
    if (role === 'provider' && !providers.find(p => p.providerId === username)) {
        providers.push({
            providerId: username,
            providerName: username + " Node",
            totalStorageGB: 10,
            availableStorageGB: 10,
            rentedStorageGB: 0,
            pricePerGBMonth: 100,
            currency: "INR"
        });
    }

    res.json({
        message: "Login successful",
        user: {
            id: username, // Use dynamic username instead of hardcoding PROVIDER-001
            name: username,
            role
        }
    });
});

app.post("/api/providers/register", (req, res) => {
    const provider = req.body;
    if (!provider.pricePerGBMonth) provider.pricePerGBMonth = 100;
    providers.push(provider);
    res.json({ message: "Provider registered successfully", provider });
});

app.get("/api/providers", (req, res) => {
    res.json(providers);
});

app.put("/api/providers/:id/storage", (req, res) => {
    const { id } = req.params;
    const { totalStorageGB, pricePerGBMonth, currency } = req.body;
    
    const provider = providers.find(p => p.providerId === id);
    if (!provider) return res.status(404).json({ message: "Provider not found" });
    
    if (totalStorageGB < provider.rentedStorageGB) {
        return res.status(400).json({ message: "Total storage cannot be less than currently rented storage" });
    }
    
    provider.totalStorageGB = totalStorageGB;
    provider.availableStorageGB = totalStorageGB - provider.rentedStorageGB;
    
    if (pricePerGBMonth !== undefined) {
        provider.pricePerGBMonth = pricePerGBMonth;
    }
    if (currency !== undefined) {
        provider.currency = currency;
    }
    
    res.json({ message: "Storage updated successfully", provider });
});

app.post("/api/rentals", async (req, res) => {
    try {
        const { providerId, renterId, storageGB, durationMonths, allocations } = req.body;

        let finalAllocations = [];
        let requestedStorageGB = storageGB || 0;

        if (allocations && Array.isArray(allocations)) {
            finalAllocations = allocations;
            requestedStorageGB = allocations.reduce((sum, alloc) => sum + alloc.storageGB, 0);
        } else {
            if (!providerId) {
                return res.status(400).json({ message: "providerId or allocations array required" });
            }
            finalAllocations = [{ providerId, storageGB }];
        }

        if (requestedStorageGB <= 0) return res.status(400).json({ message: "Storage must be > 0" });

        let totalCost = 0;
        
        // Validate all providers
        for (const alloc of finalAllocations) {
            const provider = providers.find(p => p.providerId === alloc.providerId);
            if (!provider) return res.status(404).json({ message: `Provider not found: ${alloc.providerId}` });
            if (alloc.storageGB > provider.availableStorageGB) {
                return res.status(400).json({ message: `Not enough storage on provider ${alloc.providerId}` });
            }
            totalCost += (provider.pricePerGBMonth || 100) * alloc.storageGB * durationMonths;
        }

        // Deduct storage
        for (const alloc of finalAllocations) {
            const provider = providers.find(p => p.providerId === alloc.providerId);
            provider.rentedStorageGB += alloc.storageGB;
            provider.availableStorageGB -= alloc.storageGB;
        }

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (durationMonths || 1));

        const rentalIdStr = `RENTAL-${rentals.length + 1}`;
        const finalRenterId = renterId || "USER-001";

        const rental = {
            rentalId: rentalIdStr,
            renterId: finalRenterId,
            requestedStorageGB,
            durationMonths: durationMonths || 1,
            allocations: finalAllocations,
            status: "ACTIVE",
            totalCost,
            startDate: startDate.toISOString(),
            expiryDate: expiryDate.toISOString()
        };

        rentals.push(rental);

        // Blockchain Registration
        try {
            const providerIds = finalAllocations.map(a => a.providerId);
            const storageGBs = finalAllocations.map(a => a.storageGB);
            const tx = await blockchainContract.createRental(
                rentalIdStr,
                finalRenterId,
                requestedStorageGB,
                Math.floor(startDate.getTime() / 1000),
                Math.floor(expiryDate.getTime() / 1000),
                totalCost,
                providerIds,
                storageGBs
            );
            await tx.wait();
            rental.blockchainTx = tx.hash;
        } catch (bcError) {
            console.error("Blockchain rental creation failed:", bcError);
        }

        res.json({ message: "Storage rented successfully", rental });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post("/api/rentals/:id/expire", async (req, res) => {
    try {
        const { id } = req.params;
        const rental = rentals.find(r => r.rentalId === id);

        if (!rental) return res.status(404).json({ message: "Rental not found" });
        if (rental.status === "EXPIRED") return res.status(400).json({ message: "Rental is already expired" });

        rental.status = "EXPIRED";

        // Restore capacity to providers
        if (rental.allocations) {
            for (const alloc of rental.allocations) {
                const provider = providers.find(p => p.providerId === alloc.providerId);
                if (provider) {
                    provider.rentedStorageGB -= alloc.storageGB;
                    provider.availableStorageGB += alloc.storageGB;
                }
            }
        }

        try {
            const tx = await blockchainContract.expireRental(id);
            await tx.wait();
        } catch (bcError) {
            console.error("Blockchain expiry failed (may already be expired or error):", bcError.message);
        }

        res.json({ message: "Rental expired successfully", rental });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get("/api/rentals", (req, res) => {
    res.json(rentals);
});

// Periodic Expiry Monitor
setInterval(() => {
    const now = new Date();
    rentals.forEach(async (rental) => {
        if (rental.status === "ACTIVE" && new Date(rental.expiryDate) <= now) {
            console.log(`Auto-expiring rental ${rental.rentalId}`);
            rental.status = "EXPIRED";
            if (rental.allocations) {
                for (const alloc of rental.allocations) {
                    const provider = providers.find(p => p.providerId === alloc.providerId);
                    if (provider) {
                        provider.rentedStorageGB -= alloc.storageGB;
                        provider.availableStorageGB += alloc.storageGB;
                    }
                }
            }
            try {
                // Call smart contract if applicable
                const tx = await blockchainContract.expireRental(rental.rentalId);
                await tx.wait();
                console.log(`Blockchain updated for auto-expired rental ${rental.rentalId}`);
            } catch (e) {
                // Ignore if it fails on BC or already expired
            }
        }
    });
}, 10000); // Check every 10 seconds for prototype

let uploadedFiles = [];

app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const renterId = req.body.renterId || "USER-001";
    
    const fileRecord = {
        id: "FILE-" + Date.now(),
        renterId,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        sizeBytes: req.file.size,
        storagePath: req.file.path,
        uploadedAt: new Date().toISOString()
    };
    uploadedFiles.push(fileRecord);
    
    res.json({
        message: "File uploaded successfully",
        file: fileRecord
    });
});

app.get("/api/files/renter/:renterId", (req, res) => {
    const renterFiles = uploadedFiles.filter(f => f.renterId === req.params.renterId);
    res.json(renterFiles);
});

app.get("/api/files/:filename", (req, res) => {
    const filePath = path.join(storagePath, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.sendFile(filePath);
});

app.get("/api/blockchain", async (req, res) => {
    try {
        const name = await blockchainContract.projectName();
        res.json({ blockchain: "Connected", contract: contractAddress, projectName: name });
    } catch (error) {
        res.status(500).json({ blockchain: "Connection failed", message: error.message });
    }
});

app.post("/api/blockchain/register-file", async (req, res) => {
    try {
        const { fileHash, providerId } = req.body;
        const tx = await blockchainContract.registerFile(fileHash, providerId);
        await tx.wait();
        res.json({ message: "File registered on blockchain", transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ message: "Blockchain registration failed", error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:5000`);
});