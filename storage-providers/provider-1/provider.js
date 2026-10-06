const http = require("http");

const provider = {
    providerId: "PROVIDER-001",
    providerName: "Provider 1",
    totalStorageGB: 10,
    rentedStorageGB: 0,
    availableStorageGB: 10
};

const data = JSON.stringify(provider);

const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/providers/register",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
    }
};

const request = http.request(options, (response) => {
    let responseData = "";

    response.on("data", (chunk) => {
        responseData += chunk;
    });

    response.on("end", () => {
        console.log("Backend Response:");
        console.log(responseData);
    });
});

request.on("error", (error) => {
    console.error("Error connecting to backend:", error.message);
});

request.write(data);
request.end();