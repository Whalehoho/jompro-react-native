import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './apiConfig';

// ✅ Upload Image to Cloudinary
export const uploadImage = async (imageUri) => {
    console.log('Uploading image to Cloudinary...');

    const formData = new FormData();
    formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'upload.jpg' });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload image. Status: ' + response.status);
        }

        const data = await response.json();
        return {
            imageUrl: data.secure_url, // ✅ Image URL
            deleteToken: data.delete_token // ✅ Delete token (if enabled in settings)
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// ✅ Delete Image from Cloudinary (Requires API Secret)
export const deleteImage = async (publicId) => {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
        const signature = sha1(stringToSign); // Use an SHA-1 hashing function

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('signature', signature);
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to delete image. Status: ' + response.status);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

// ✅ Fetch Image from Cloudinary
export const getImage = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch image. Status: ' + response.status);
        }

        const blob = await response.blob();
        const imageObjectURL = URL.createObjectURL(blob);
        return imageObjectURL;
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
};
