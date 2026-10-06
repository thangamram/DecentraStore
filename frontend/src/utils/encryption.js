export async function encryptFile(file) {
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const fileData = await file.arrayBuffer();

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        fileData
    );

    return {
        encryptedData,
        iv,
        key
    };
}