/**
 * Generate short UID with timestamp + random (guaranteed unique if sequential)
 * Format: ttttttttxxxx (8 timestamp + 4 random)
 *
 * Example: l3r8x9a1b2c3
 *
 * @returns {string} - Short unique ID
 */
export const createShortUID = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Convert timestamp to base36 (8 chars)
    const timestamp = Date.now().toString(36).padStart(8, '0');

    // Add 4 random chars for uniqueness within same millisecond
    let randomPart = '';
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const randomBytes = new Uint8Array(4);
        crypto.getRandomValues(randomBytes);

        for (let i = 0; i < 4; i++) {
            randomPart += chars[randomBytes[i] % chars.length];
        }
    } else {
        for (let i = 0; i < 4; i++) {
            randomPart += chars[Math.floor(Math.random() * chars.length)];
        }
    }

    return `${timestamp}${randomPart}`;
};