import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import app from "./app.js";
import jwt from "jsonwebtoken";
import Message from "./models/Message.js";

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
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, username, avatar? }
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
  const userId = socket.user.id;
  const username = socket.user.username;
  const avatar = socket.user.avatar || null;

  // =====================
  // 👤 CHAT JOIN
  // =====================
  onlineUsers.add(userId);
  io.emit("onlineCount", onlineUsers.size);
  socket.broadcast.emit("userJoined", username);

  // =====================
  // 💬 GLOBAL CHAT
  // =====================
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

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
  // 🎮 PLAY RANDOM
  // =====================
  socket.on("playRandom", () => {
    if (waitingPlayers.includes(socket.id)) return;

    if (waitingPlayers.length > 0) {
      const opponentId = waitingPlayers.shift();
      const roomId = `game_${socket.id}_${opponentId}`;

      const game = {
        roomId,
        players: { X: opponentId, O: socket.id },
        board: Array(9).fill(null),
        turn: "X",
        status: "playing",
      };

      games.set(roomId, game);

      socket.join(roomId);
      io.sockets.sockets.get(opponentId)?.join(roomId);

      io.to(roomId).emit("matchFound", {
        roomId,
        players: game.players,
        turn: game.turn,
      });
    } else {
      waitingPlayers.push(socket.id);
      socket.emit("waiting");
    }
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
      io.to(roomId).emit("gameOver", {
        result,
        board: game.board,
      });
    } else {
      io.to(roomId).emit("gameUpdate", {
        board: game.board,
        turn: game.turn,
      });
    }
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
  // 🔁 PLAY AGAIN (BOTH AGREE)
  // =====================
  socket.on("playAgain", ({ roomId }) => {
    if (!games.has(roomId)) return;

    if (!rematchVotes.has(roomId)) {
      rematchVotes.set(roomId, new Set());
    }

    rematchVotes.get(roomId).add(socket.id);

    if (rematchVotes.get(roomId).size === 2) {
      rematchVotes.delete(roomId);

      const game = games.get(roomId);
      if (!game) return;

      game.board = Array(9).fill(null);
      game.turn = "X";
      game.status = "playing";

      io.to(roomId).emit("rematchStarted", {
        board: game.board,
        turn: game.turn,
      });
    }
  });

  // =====================
  // 🚪 DISCONNECT (CHAT + GAME)
  // =====================
  socket.on("disconnect", () => {
    // 🔴 CHAT CLEANUP
    onlineUsers.delete(userId);
    io.emit("onlineCount", onlineUsers.size);
    socket.broadcast.emit("userLeft", username);

    // 🔴 REMOVE FROM QUEUE
    const index = waitingPlayers.indexOf(socket.id);
    if (index !== -1) waitingPlayers.splice(index, 1);

    // 🔴 GAME LOSE ON LEAVE
    for (const [roomId, game] of games) {
      if (Object.values(game.players).includes(socket.id)) {
        socket.to(roomId).emit("gameOver", {
          result: "opponent_left",
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
