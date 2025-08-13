import { Server } from 'socket.io';
import ModelMatchmaching from '../models/Machqueue.js';
import ModelMatch from '../models/matchModel.js';
import { registerMatch, saveScore } from '../controllers/matchController.js';
import { v4 as uuidv4 } from 'uuid';


// Example: "12345_550e8400-e29b-41d4-a716-446655440000"


let io;

const initSocket = (server) => {
  // Allow multiple origins for Socket.io CORS
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173'
  ];
  const prodOrigins = [
    'https://ful2win.vercel.app',
    'https://ful-2-win.vercel.app',
    'https://fulboost.fun',
    'https://www.fulboost.fun'
  ];
  let allowedOrigins = [...prodOrigins];
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins = [...prodOrigins, ...devOrigins];
  }
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
  }
  if (process.env.LOCAL) {
    allowedOrigins.push(process.env.LOCAL.replace(/\/$/, ''));
  }
  console.log('[Socket.io] Allowed origins:', allowedOrigins);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow server-to-server
        const normalized = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalized)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by Socket.io CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    const socketId = socket.id;

    // Handle joining a room (e.g., for chat or game room)
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Handle joining a user-specific room for personal messages
    socket.on('join_user_room', (userId) => {
      socket.join(userId);
      console.log(`User ${socket.id} joined user room ${userId}`);
    });

    // Handle leaving a room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
    });
    socket.on('join_match', async (data) => {
      const { userId, gameId,  entryFee } = data;
      const socketId = socket.id;
      console.log(`User ${userId} is looking for a match in game ${gameId} with entry fee ${entryFee}`);
      const opponent = await ModelMatchmaching.findOne({ gameId, entryFee, userId: { $ne: userId }, socketId: { $ne: socketId } });
      if (opponent) {
        console.log(`Match found for user ${userId} with opponent ${opponent.userId}`);
        const matchData = await ModelMatchmaching.findOneAndDelete({ userId: opponent.userId, gameId, entryFee, socketId: opponent.socketId });
        if (!matchData) {
          console.error(`Failed to remove match data for opponent ${opponent.userId}`);
        }
        const roomId = `${gameId}_${uuidv4()}`;
        const opponentSocket = io.sockets.sockets.get(opponent.socketId);
          socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);
         if (opponentSocket) {
        opponentSocket.join(roomId); // The opponent's socket joins
        console.log(`Both users successfully joined room ${roomId}`);
         }
        
        // Update opponent's socketId to the current user's
      


        io.to(socketId).emit('match_found', { opponent: opponent.userId, gameId, roomId, entryFee });
        io.to(opponent.socketId).emit('match_found', { opponent: userId, gameId, roomId, entryFee });
        socket.emit('match_found', { opponent: opponent.userId, gameId, roomId, entryFee });
          

      } else {
        console.log(`No match found for user ${userId}, waiting for an opponent...`);
        const matchData = new ModelMatchmaching({ userId, gameId, socketId, entryFee });
        await matchData.save();
      }
    });
    socket.on('not_found', async (data) => {
      const { userId, gameId,  entryFee } = data;
      console.log(`No match found `);
      const matchData = await ModelMatchmaching.findOneAndDelete({ userId, gameId, entryFee });
      if (!matchData) {
        console.error(`Failed to remove match data for user ${userId}`);
      }
    });
    socket.on('register', async (data) => {
      const { userId, gameId, entryFee, roomId } = data;
      try {
        console.log(data);
       const result = await registerMatch({ userId, gameId, entryFee, roomId });
       console.log(result);
       if(result.success) {
         console.log(`Match registered successfully for user ${userId} in room ${roomId}`);
         socket.emit('register_success', { message: "Match registered successfully" });
       }
       else{
         socket.emit('register_error', { message: "Failed to register match" });
       }
        
      } catch (error) {
        socket.emit('register_error', { message: error.message });
      }
    });
    socket.on('game_over', async(data) => {
      const { userId, roomId, score } = data;
      console.log(`Game over for user ${userId} in room ${roomId} with score ${score}`);
       const saveResult = await saveScore(roomId, userId, score);
      if (saveResult.completed) {
        console.log(saveResult.completed);
        console.log(socketId ,"for")
        io.to(roomId).emit('game_over_response', { message: "Game over", result: saveResult.match });
      }

    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export { initSocket, getIO };
