export async function hashFile(fileData) {
    const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        fileData
    );

    const hashArray = Array.from(
        new Uint8Array(hashBuffer)
    );

    return hashArray
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}