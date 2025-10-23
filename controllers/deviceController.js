import AWS from "aws-sdk";
import Device from "../models/Device.js"; // mongoose model
import pushNotificationService from "../services/pushNotificationService.js";

AWS.config.update({ region: "ap-south-1" }); // choose your region

const sns = new AWS.SNS();

// Register device
export const registerDevice = async (req, res) => {
  try {
    const { deviceToken } = req.body;
    const userId = req.user.id; // assuming user is authenticated and user ID is in req.user

    if (!deviceToken) {
      return res.status(400).json({ error: "Device token is required" });
    }

    // Create or reuse SNS PlatformEndpoint
    

    
    // Save in MongoDB
    await Device.findOneAndUpdate(
      { userId },
      { deviceToken },
      { upsert: true }
    );
    
    // Send welcome notification
    const result = await pushNotificationService.sendToDevice(deviceToken, {
      title: "Device registered",
      body: "You will receive notifications on this device."
    });
    
    // Note: We don't delete the token here even if invalid, since we just registered it
    if (result.invalidToken) {
      console.warn('⚠️ Newly registered token appears invalid:', deviceToken.substring(0, 20) + '...');
    }

    res.json({ success: true, message: "Device registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
