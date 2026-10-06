// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DecentraStore {
    string public projectName = "DecentraStore";

    struct FileRecord {
        string fileHash;
        string providerId;
        uint256 timestamp;
    }

    struct ProviderAllocation {
        string providerId;
        uint256 storageGB;
    }

    struct Rental {
        string rentalId;
        string renterId;
        uint256 totalStorageGB;
        uint256 startTime;
        uint256 expiryTime;
        uint256 totalCost;
        string status;
    }

    FileRecord[] public files;
    
    // Mapping from rentalId to Rental struct
    mapping(string => Rental) private rentals;
    // Mapping from rentalId to array of ProviderAllocations
    mapping(string => ProviderAllocation[]) private rentalAllocations;
    // Array to keep track of rental IDs
    string[] private rentalIds;

    event RentalCreated(string rentalId, string renterId, uint256 totalStorageGB, uint256 expiryTime);
    event ProviderAllocated(string rentalId, string providerId, uint256 storageGB);
    event RentalExpired(string rentalId);

    function registerFile(
        string memory _fileHash,
        string memory _providerId
    ) public {
        files.push(
            FileRecord(
                _fileHash,
                _providerId,
                block.timestamp
            )
        );
    }

    function getFileCount() public view returns (uint256) {
        return files.length;
    }

    function createRental(
        string memory _rentalId,
        string memory _renterId,
        uint256 _totalStorageGB,
        uint256 _startTime,
        uint256 _expiryTime,
        uint256 _totalCost,
        string[] memory _providerIds,
        uint256[] memory _storageGBs
    ) public {
        require(bytes(rentals[_rentalId].rentalId).length == 0, "Rental already exists");
        require(_providerIds.length == _storageGBs.length, "Arrays length mismatch");

        rentals[_rentalId] = Rental({
            rentalId: _rentalId,
            renterId: _renterId,
            totalStorageGB: _totalStorageGB,
            startTime: _startTime,
            expiryTime: _expiryTime,
            totalCost: _totalCost,
            status: "ACTIVE"
        });

        rentalIds.push(_rentalId);

        for (uint i = 0; i < _providerIds.length; i++) {
            rentalAllocations[_rentalId].push(ProviderAllocation({
                providerId: _providerIds[i],
                storageGB: _storageGBs[i]
            }));
            emit ProviderAllocated(_rentalId, _providerIds[i], _storageGBs[i]);
        }

        emit RentalCreated(_rentalId, _renterId, _totalStorageGB, _expiryTime);
    }

    function expireRental(string memory _rentalId) public {
        require(bytes(rentals[_rentalId].rentalId).length != 0, "Rental does not exist");
        require(keccak256(bytes(rentals[_rentalId].status)) == keccak256(bytes("ACTIVE")), "Rental is not active");
        require(block.timestamp >= rentals[_rentalId].expiryTime, "Rental has not expired yet");

        rentals[_rentalId].status = "EXPIRED";
        emit RentalExpired(_rentalId);
    }

    function getRental(string memory _rentalId) public view returns (Rental memory) {
        return rentals[_rentalId];
    }

    function getRentalAllocations(string memory _rentalId) public view returns (ProviderAllocation[] memory) {
        return rentalAllocations[_rentalId];
    }
    
    function isRentalActive(string memory _rentalId) public view returns (bool) {
        if (bytes(rentals[_rentalId].rentalId).length == 0) return false;
        if (keccak256(bytes(rentals[_rentalId].status)) != keccak256(bytes("ACTIVE"))) return false;
        if (block.timestamp >= rentals[_rentalId].expiryTime) return false;
        return true;
    }
}