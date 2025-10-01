import AWS from "aws-sdk";
import Device from "../models/Device.js"; // mongoose model

AWS.config.update({ region: "ap-south-1" }); // choose your region

const sns = new AWS.SNS();

// Register device
export const registerDevice = async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;

    // Create or reuse SNS PlatformEndpoint
    const params = {
      PlatformApplicationArn: process.env.SNS_PLATFORM_ARN, // FCM app registered in SNS
      Token: deviceToken,
    };

    const endpoint = await sns.createPlatformEndpoint(params).promise();

    // Save in MongoDB
    await Device.findOneAndUpdate(
      { userId },
      { deviceToken, endpointArn: endpoint.EndpointArn },
      { upsert: true }
    );

    res.json({ success: true, endpointArn: endpoint.EndpointArn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
