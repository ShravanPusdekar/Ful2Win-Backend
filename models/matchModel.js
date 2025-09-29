import mongoose from "mongoose";

const gameMatchSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true }, // 🔹 Make roomId unique
  gameId: { type: String, required: true },
  entryFee: { type: Number, required: true },
  players: {
    player1: {
      userId: { type: String, required: false },
      score: { type: Number, required: false, default: -1 }
    },
    player2: {
      userId: { type: String, required: false },
      score: { type: Number, required: false, default: -1 }
    }
  },
  winner: { type: String, required: false }, // Optional field to store the winner's userId
});

const GameMatch = mongoose.models.GameMatch || mongoose.model('GameMatch', gameMatchSchema);

export default GameMatch;
