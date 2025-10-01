import AWS from "aws-sdk";
import Device from "../models/Device.js";

AWS.config.update({ region: "ap-south-1" }); // choose your region
const sns = new AWS.SNS();

export const sendPushNotification = async (userId, message) => {
  const device = await Device.findOne({ userId });
  if (!device) return;

  const params = {
    Message: JSON.stringify({
      default: message,
      GCM: JSON.stringify({
        notification: {
          title: "New Message",
          body: message,
        },
      }),
    }),
    MessageStructure: "json",
    TargetArn: device.endpointArn,
  };

  await sns.publish(params).promise();
};
