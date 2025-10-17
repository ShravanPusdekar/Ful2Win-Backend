// controllers/otpController.js
import AWS from "aws-sdk";
import Otp from "../models/Otp.js";
import crypto from "crypto";

// Configure AWS with explicit settings
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

// Debug: Log AWS configuration (remove in production)
console.log('🔧 AWS Configuration:', {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? '***' : 'NOT_SET',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '***' : 'NOT_SET'
});

// Generate OTP and send via SNS
export const sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // generate random 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // expiry time (5 mins)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // store in DB (overwrite if exists)
    await Otp.findOneAndUpdate(
      { phone: phoneNumber },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // publish SMS via SNS
    const params = {
      Message: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    };

   const reply = await sns.publish(params, (err, data) => {
     if (err) {
       console.error("Error publishing SNS message:", err);
       throw new Error("SNS publish failed");
     }
     console.log("SNS publish success:", data);
   }).promise();
  console.log(reply);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const record = await Otp.findOne({ phone: phoneNumber });

    if (!record) {
      return res.status(400).json({ success: false, message: "No OTP found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP verified, delete from DB
    await Otp.deleteOne({ phoneNumber });

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
