import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  deviceToken: { type: String, required: true },
  endpointArn: { type: String, required: true },
});
const deviceModel = mongoose.models.Device || mongoose.model('Device', deviceSchema);

export default deviceModel;