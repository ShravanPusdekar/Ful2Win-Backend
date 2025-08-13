import mongoose from "mongoose";

const Matchmaching =new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId:{
    type :String,
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  entryFee: {
    type: Number,
    default: 0
  },
});
const ModelMatchmaching = mongoose.models.Matchmaching || mongoose.model('Matchmaching', Matchmaching);
export default ModelMatchmaching;