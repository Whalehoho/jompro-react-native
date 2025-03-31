import { RNS3 } from "react-native-aws3";
import { AWS_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "../config";

export const uploadImageToS3 = async (imageUri, filename) => {
    const file = {
      uri: imageUri,
      name: filename,
      type: "image/jpeg",
    };
  
    const options = {
      keyPrefix: "uploads/",
      bucket: AWS_BUCKET_NAME,
      region: AWS_REGION,
      accessKey: AWS_ACCESS_KEY_ID,
      secretKey: AWS_SECRET_ACCESS_KEY,
      successActionStatus: 201,
      acl: null,
    };
  
    try {
      const response = await RNS3.put(file, options);
      console.log("S3 Response:", response); // ✅ Log full response
  
      if (response.status !== 201) {
        console.error("S3 Upload Error:", response.body);
        throw new Error(`S3 Upload Failed: ${JSON.stringify(response.body)}`);
      }
  
      return response.body.postResponse.location; // ✅ Return uploaded file URL
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  };
