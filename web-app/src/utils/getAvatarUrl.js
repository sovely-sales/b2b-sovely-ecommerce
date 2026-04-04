export const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;

    // If it's already a full URL, blob, or base64, return it as-is
    if (
        avatarPath.startsWith('http') ||
        avatarPath.startsWith('blob:') ||
        avatarPath.startsWith('data:')
    ) {
        return avatarPath;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const serverBase = apiBase.replace(/\/api\/v1\/?$/, '');

    // 1. Convert Windows backslashes to forward slashes
    let cleanPath = avatarPath.replace(/\\/g, '/');

    // 2. Remove 'public/' prefix if the backend multer saved it that way
    if (cleanPath.startsWith('public/')) {
        cleanPath = cleanPath.replace('public/', '');
    }

    // 3. Ensure leading slash
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

    // 4. Ensure it points to the avatars folder
    if (!cleanPath.startsWith('/avatars')) {
        cleanPath = `/avatars${cleanPath}`;
    }

    return `${serverBase}${cleanPath}`;
};