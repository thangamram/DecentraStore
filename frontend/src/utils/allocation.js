export function findStorageAllocation(requiredStorage, providers) {
    // 1. Filter out providers with no space
    const availableProviders = providers.filter(p => p.availableStorageGB > 0);

    // 2. See if any single provider can satisfy the whole request
    // We prefer the one with the smallest available space that can fit the request (best fit)
    const singleProviders = availableProviders.filter(p => p.availableStorageGB >= requiredStorage);
    if (singleProviders.length > 0) {
        singleProviders.sort((a, b) => a.availableStorageGB - b.availableStorageGB);
        return {
            requestedStorage: requiredStorage,
            allocations: [{
                providerId: singleProviders[0].providerId,
                storageGB: requiredStorage
            }]
        };
    }

    // 3. If no single provider can satisfy, split across multiple
    // Sort providers by largest available space first
    availableProviders.sort((a, b) => b.availableStorageGB - a.availableStorageGB);

    let remainingStorage = requiredStorage;
    const allocations = [];

    for (const provider of availableProviders) {
        if (remainingStorage <= 0) break;

        const allocateAmount = Math.min(remainingStorage, provider.availableStorageGB);
        allocations.push({
            providerId: provider.providerId,
            storageGB: allocateAmount
        });
        remainingStorage -= allocateAmount;
    }

    if (remainingStorage > 0) {
        // Cannot satisfy the request
        return {
            requestedStorage: requiredStorage,
            error: "Insufficient storage available across all providers."
        };
    }

    return {
        requestedStorage: requiredStorage,
        allocations: allocations
    };
}
