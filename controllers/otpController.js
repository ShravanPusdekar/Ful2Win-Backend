// controllers/otpController.js
import AWS from "aws-sdk";
import Otp from "../models/Otp.js";
import crypto from "crypto";

const sns = new AWS.SNS({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Generate OTP and send via SNS
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // generate random 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // expiry time (5 mins)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // store in DB (overwrite if exists)
    await Otp.findOneAndUpdate(
      { phone },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // publish SMS via SNS
    const params = {
      Message: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      PhoneNumber: phone,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    };

    await sns.publish(params).promise();

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const record = await Otp.findOne({ phone });

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
    await Otp.deleteOne({ phone });

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
