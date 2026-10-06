export async function decryptFile(encryptedData) {
    const keyArray = JSON.parse(
        localStorage.getItem("decentraStoreKey")
    );

    const ivArray = JSON.parse(
        localStorage.getItem("decentraStoreIV")
    );

    if (!keyArray || !ivArray) {
        throw new Error("Encryption key or IV not found");
    }

    const key = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(keyArray),
        {
            name: "AES-GCM"
        },
        false,
        ["decrypt"]
    );

    const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(ivArray)
        },
        key,
        encryptedData
    );

    return decryptedData;
}