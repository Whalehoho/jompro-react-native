import { IMGBB_API_KEY } from './apiConfig';

export const uploadImage = async (image) => {
    console.log('uploadImage:');
    const formData = new FormData();
    formData.append('image', image);
    formData.append('key', IMGBB_API_KEY);

    try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload image. Status: ' + response.status);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

export const deleteImage = async (deleteUrl) => {
    try {
        const response = await fetch(deleteUrl, {
            method: 'GET',
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


export const getImage = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error('Failed to get image. Status: ' + response.status);
        }

        const data = await response.blob();

        // Convert blob to URL
        const imageObjectURL = URL.createObjectURL(data);
        return imageObjectURL;
    } catch (error) {
        console.error('Error getting image:', error);
        throw error;
    }
};
