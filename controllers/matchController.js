import GameMatch from "../models/matchModel.js";
import User from "../models/User.js";

const registerMatch = async (data) => {
  try {
    const { userId, gameId, entryFee, roomId } = data;

    // 1. Initial validation
    if (!userId || !gameId || !entryFee || !roomId) {
      return { message: "Missing required fields", success: false };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { message: "User not found", success: false };
    }
    if (user.balance < entryFee) {
      return { message: "Insufficient balance", success: false };
    }

    let finalMatch;

    const potentialMatch = await GameMatch.findOneAndUpdate(
      {
        roomId,
        "players.player2.userId": null,       // The key: find an open slot
        "players.player1.userId": { $ne: userId } // Don't join your own game
      },
      {
        $set: { "players.player2.userId": userId } // Atomically claim the spot
      },
     
      { new: true } // Return the document *after* the update
    );

    if (potentialMatch) {
      // Successfully joined as player 2
      finalMatch = potentialMatch;
    } else {
      
      finalMatch = await GameMatch.findOneAndUpdate(
        {
          roomId,
          "players.player1.userId": null // Only create if no one is player1 yet
        },
        {
          $set: {
            gameId,
            entryFee,
            "players.player1": { userId, score: -1 },
            "players.player2": { userId: null, score: -1 }
          }
        },
        { new: true, upsert: true }
      );
    }

    // 4. Final check and balance deduction
    if (!finalMatch) {
        // This can happen in a rare race condition if the stars align.
        // It's safer to let the user know and have them try again.
        return { message: "Match is full or could not be registered. Please try again.", success: false };
    }

    user.balance -= entryFee;
    user.gameStats.totalMatches += 1;
    await user.save();

    return { message: "Match registered successfully", success: true, match: finalMatch };

  } catch (error) {
    console.error("Error registering match:", error);
    return { message: "An server error occurred", success: false };
  }
}; 



const saveScore = async (roomId, player, score) => {
  try {
    const match = await GameMatch.findOne({ roomId });
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.players.player1.userId === player) {
      match.players.player1.score = score;
    } else if (match.players.player2.userId === player) {
      match.players.player2.score = score;
    } else {
      throw new Error("Invalid player");
    }
   
    await match.save();
    //check the the both user save score or not
    if (match.players.player1.score != -1 && match.players.player2.score != -1) {
      match.winner = match.players.player1.score > match.players.player2.score
        ? match.players.player1.userId
        : match.players.player2.userId;
    }

   return {
     success: true,
     completed: match.players.player1.score != -1 && match.players.player2.score != -1,
     match
   };

  } catch (error) {
    console.error("Error saving score:", error);
    return { success: false, error: error.message };
  }
};



export { registerMatch, saveScore };