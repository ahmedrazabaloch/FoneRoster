/**
 * cloudinaryService.js — Browser-side unsigned image upload
 *
 * Accepts: image/jpeg, image/png, image/webp only
 * Max file size: 2MB
 * Client-side resize: max 600px height
 * Client-side crop: 1:1 square (center crop)
 *
 * Uses Cloudinary unsigned upload preset — no API secret exposed.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_HEIGHT = 600;

// ─── Client-side Image Processing ──────────────────────────────────

/**
 * Resize and square-crop an image on a canvas.
 * Returns a Blob (JPEG, quality 0.85).
 */
function processImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            // Square crop: use the smaller dimension
            const side = Math.min(img.width, img.height);
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;

            // Target size: min(side, MAX_HEIGHT)
            const target = Math.min(side, MAX_HEIGHT);

            const canvas = document.createElement('canvas');
            canvas.width = target;
            canvas.height = target;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Canvas conversion failed'));
                    resolve(blob);
                },
                'image/jpeg',
                0.85
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

// ─── Validation ────────────────────────────────────────────────────

function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed.');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Image must be under 2MB.');
    }
}

// ─── Upload ────────────────────────────────────────────────────────

/**
 * Upload an employee photo to Cloudinary.
 * Validates type/size, resizes to 600px square, then uploads.
 *
 * @param {File} file - Raw file from input
 * @param {string} [folder='employees'] - Cloudinary folder
 * @returns {Promise<string>} Secure HTTPS URL
 */
export async function uploadImage(file, folder = 'employees') {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error('Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    validateFile(file);

    // Resize + square crop
    const processed = await processImage(file);

    const formData = new FormData();
    formData.append('file', processed);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', `foneroster/${folder}`);

    const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Upload failed (${res.status})`);
    }

    const data = await res.json();
    return data.secure_url;
}

/**
 * Upload an authority signature image.
 */
export async function uploadSignature(file) {
    return uploadImage(file, 'authority');
}
