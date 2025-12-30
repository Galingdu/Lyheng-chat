import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import app from "./app.js";
import jwt from "jsonwebtoken";
import Message from "./models/Message.js";
import User from "./models/User.js";
dotenv.config();


const PORT = process.env.PORT || 3000;

// =====================
// HTTP + SOCKET
// =====================
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// =====================
// 🔐 SOCKET AUTH
// =====================
io.use(async(socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "_id username avatar"
    );

    if (!user) return next(new Error("User not found"));

    socket.user = {
      id: user._id.toString(),
      username: user.username,
      avatar: user.avatar, // ✅ ALWAYS FRESH
    };
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// =====================
// 👥 CHAT STATE
// =====================
const onlineUsers = new Set();

// =====================
// 🎮 GAME STATE
// =====================
const waitingPlayers = [];
const games = new Map();
const rematchVotes = new Map();

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board) {
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.every(Boolean) ? "draw" : null;
}

// =====================
// 🔌 SOCKET CONNECTION
// =====================
io.on("connection", (socket) => {
  const { id: userId, username, avatar } = socket.user;

  // =====================
  // 👤 CHAT JOIN
  // =====================
  onlineUsers.add(userId);
  io.emit("onlineCount", onlineUsers.size);
  socket.broadcast.emit("userJoined", username);

  // =====================
  // 💬 GLOBAL CHAT
  // =====================
  socket.on("typing", () => socket.broadcast.emit("typing", username));
  socket.on("stopTyping", () => socket.broadcast.emit("stopTyping"));

  socket.on("sendMessage", async (data) => {
    const message = await Message.create({
      sender: userId,
      text: data.text || null,
      image: data.image || null,
    });

    const populatedMessage = await message.populate(
      "sender",
      "username avatar"
    );

    io.emit("newMessage", populatedMessage);
  });

  // =====================
  // 🎮 PLAY RANDOM (SAFE)
  // =====================
  socket.on("playRandom", () => {
    if (waitingPlayers.includes(socket.id)) return;

    while (waitingPlayers.length > 0) {
      const opponentId = waitingPlayers.shift();
      const opponentSocket = io.sockets.sockets.get(opponentId);

      // opponent disconnected → skip
      if (!opponentSocket) continue;

      const roomId = `game_${socket.id}_${opponentId}`;

      const game = {
        roomId,
        players: {
          X: opponentId,
          O: socket.id,
        },
        board: Array(9).fill(null),
        turn: "X",
        status: "playing",
      };

      games.set(roomId, game);

      socket.join(roomId);
      opponentSocket.join(roomId);

      io.to(roomId).emit("matchFound", {
        roomId,
        turn: game.turn,
        players: {
          X: {
            id: opponentSocket.user.id,
            username: opponentSocket.user.username,
            avatar: opponentSocket.user.avatar || null,
          },
          O: {
            id: socket.user.id,
            username: socket.user.username,
            avatar: socket.user.avatar || null,
          },
        },
      });

      return; // ✅ matched
    }

    // no valid opponent
    waitingPlayers.push(socket.id);
    socket.emit("waiting");
  });

  // =====================
  // 🎮 MAKE MOVE
  // =====================
  socket.on("makeMove", ({ roomId, index }) => {
    const game = games.get(roomId);
    if (!game || game.status !== "playing") return;

    const symbol =
      game.players.X === socket.id ? "X" :
      game.players.O === socket.id ? "O" : null;

    if (!symbol || symbol !== game.turn) return;
    if (game.board[index]) return;

    game.board[index] = symbol;
    game.turn = symbol === "X" ? "O" : "X";

    const result = checkWinner(game.board);

    if (result) {
      game.status = "ended";

      let winnerUserId = null;
      if (result === "X") {
        winnerUserId = io.sockets.sockets.get(game.players.X)?.user.id;
      } else if (result === "O") {
        winnerUserId = io.sockets.sockets.get(game.players.O)?.user.id;
      }

      io.to(roomId).emit("gameOver", {
        result, // X | O | draw
        board: game.board,
        winnerUserId,
      });

      return;
    }

    io.to(roomId).emit("gameUpdate", {
      board: game.board,
      turn: game.turn,
    });
  });

  // =====================
  // 💬 PRIVATE GAME CHAT
  // =====================
  socket.on("gameChat", ({ roomId, message }) => {
    io.to(roomId).emit("gameChat", {
      sender: username,
      avatar,
      message,
    });
  });

// =====================
// 🔁 PLAY AGAIN (SWAP X / O)
// =====================
socket.on("playAgain", ({ roomId }) => {
  if (!games.has(roomId)) return;

  if (!rematchVotes.has(roomId)) {
    rematchVotes.set(roomId, new Set());
  }

  const votes = rematchVotes.get(roomId);
  if (votes.has(socket.id)) return;

  votes.add(socket.id);

  if (votes.size === 2) {
    rematchVotes.delete(roomId);

    const game = games.get(roomId);
    if (!game) return;

    const temp = game.players.X;
    game.players.X = game.players.O;
    game.players.O = temp;

    game.board = Array(9).fill(null);
    game.turn = "X";
    game.status = "playing";

   const XSocket = io.sockets.sockets.get(game.players.X);
const OSocket = io.sockets.sockets.get(game.players.O);

io.to(roomId).emit("rematchStarted", {
  board: game.board,
  turn: game.turn,
  players: {
    X: {
      id: XSocket.user.id,
      username: XSocket.user.username,
      avatar: XSocket.user.avatar || null,
    },
    O: {
      id: OSocket.user.id,
      username: OSocket.user.username,
      avatar: OSocket.user.avatar || null,
    },
  },
});

  }
});


  // =====================
  // 🚪 DISCONNECT = LOSE
  // =====================
  socket.on("disconnect", () => {
    // remove from queue
    const idx = waitingPlayers.indexOf(socket.id);
    if (idx !== -1) waitingPlayers.splice(idx, 1);

    onlineUsers.delete(userId);
    io.emit("onlineCount", onlineUsers.size);
    socket.broadcast.emit("userLeft", username);

    for (const [roomId, game] of games) {
      if (Object.values(game.players).includes(socket.id)) {
        const winnerSocketId =
          game.players.X === socket.id ? game.players.O : game.players.X;

        const winnerUserId =
          io.sockets.sockets.get(winnerSocketId)?.user.id || null;

        socket.to(roomId).emit("gameOver", {
          result: "opponent_left",
          winnerUserId,
        });

        games.delete(roomId);
        rematchVotes.delete(roomId);
      }
    }
  });
});

// =====================
// START SERVER
// =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error(err));
