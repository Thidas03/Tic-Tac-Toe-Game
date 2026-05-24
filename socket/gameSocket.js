const crypto = require("crypto");
const { checkWinner } = require("../utils/gameLogic");

// In-memory room store
const rooms = {};

/**
 * Generate a random 6-character alphanumeric room ID.
 * @returns {string} - The room ID.
 */
function generateRoomId() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

/**
 * Get a unique room ID that does not exist in rooms dictionary.
 * @returns {string} - A unique room ID.
 */
function getUniqueRoomId() {
  let roomId;
  do {
    roomId = generateRoomId();
  } while (rooms[roomId]);
  return roomId;
}

/**
 * Initialize socket connection handlers.
 * @param {Server} io - The Socket.IO server instance.
 */
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 1. Create Room Handler
    socket.on("create_room", () => {
      const roomId = getUniqueRoomId();

      // Initialize room structure
      rooms[roomId] = {
        roomId: roomId,
        players: [{ id: socket.id, symbol: "X" }],
        board: Array(9).fill(""),
        turn: "X",
        gameActive: false
      };

      // Track details on socket
      socket.roomId = roomId;
      socket.playerSymbol = "X";

      // Join socket room
      socket.join(roomId);

      console.log(`Room created: ${roomId} by Player X (${socket.id})`);

      // Emit room_created event to the creator
      socket.emit("room_created", { roomId, player: "X" });
    });

    // 2. Join Room Handler
    socket.on("join_room", (roomId) => {
      const targetRoomId = roomId ? roomId.trim().toUpperCase() : "";
      const room = rooms[targetRoomId];

      if (!room) {
        socket.emit("error_room_not_found", { message: "Room not found" });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit("error_room_full", { message: "Room is full" });
        return;
      }

      // Add second player as "O"
      room.players.push({ id: socket.id, symbol: "O" });
      room.gameActive = true;

      // Track details on socket
      socket.roomId = targetRoomId;
      socket.playerSymbol = "O";

      // Join socket room
      socket.join(targetRoomId);

      console.log(`Player O (${socket.id}) joined room: ${targetRoomId}`);

      // Emit room_joined to creator/joiner
      socket.emit("room_joined", { roomId: targetRoomId, player: "O" });

      // Emit start_game with room state to all room players
      io.to(targetRoomId).emit("start_game", room);
    });

    // 3. Make Move Handler
    socket.on("make_move", ({ roomId, index }) => {
      const targetRoomId = roomId ? roomId.trim().toUpperCase() : "";
      const room = rooms[targetRoomId];

      // Validation 1: Room exists
      if (!room) {
        console.log(`Invalid move attempt: Room ${targetRoomId} not found. (Socket: ${socket.id})`);
        socket.emit("invalid_move", { message: "Room not found" });
        return;
      }

      // Validation 2: Game is active
      if (!room.gameActive) {
        console.log(`Invalid move attempt: Game in room ${targetRoomId} is not active. (Socket: ${socket.id})`);
        socket.emit("invalid_move", { message: "Game is not active" });
        return;
      }

      // Validation 3: Index bounds
      if (typeof index !== "number" || index < 0 || index > 8) {
        console.log(`Invalid move attempt: Index ${index} out of bounds in room ${targetRoomId}. (Socket: ${socket.id})`);
        socket.emit("invalid_move", { message: "Invalid cell index" });
        return;
      }

      // Validation 4: Cell empty
      if (room.board[index] !== "") {
        console.log(`Invalid move attempt: Cell ${index} already occupied in room ${targetRoomId}. (Socket: ${socket.id})`);
        socket.emit("invalid_move", { message: "Cell is already occupied" });
        return;
      }

      // Validation 5: Correct player's turn
      if (socket.playerSymbol !== room.turn) {
        console.log(`Invalid move attempt: Out-of-turn play by Player ${socket.playerSymbol} in room ${targetRoomId}. (Socket: ${socket.id})`);
        socket.emit("invalid_move", { message: "It is not your turn" });
        return;
      }

      // Apply move
      room.board[index] = socket.playerSymbol;
      console.log(`Move applied: Player ${socket.playerSymbol} marked cell ${index} in room ${targetRoomId}`);

      // Check win/draw state
      const winner = checkWinner(room.board);

      if (winner) {
        room.gameActive = false;
        // Broadcast final board update
        io.to(targetRoomId).emit("update_board", {
          board: room.board,
          turn: room.turn
        });
        // Emit game_over to all players
        io.to(targetRoomId).emit("game_over", { winner });
        console.log(`Game over in room ${targetRoomId}. Result: ${winner}`);
      } else {
        // Switch turn
        room.turn = room.turn === "X" ? "O" : "X";
        // Broadcast updated board and turn
        io.to(targetRoomId).emit("update_board", {
          board: room.board,
          turn: room.turn
        });
      }
    });

    // 4. Disconnect Handler
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      const roomId = socket.roomId;
      if (roomId && rooms[roomId]) {
        const room = rooms[roomId];

        // Remove player from the room players list
        room.players = room.players.filter((p) => p.id !== socket.id);
        console.log(`Player ${socket.playerSymbol} (${socket.id}) left room: ${roomId}`);

        if (room.players.length === 0) {
          // If room empty -> delete room
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted as it is empty.`);
        } else {
          // If one player left -> pause gameActive & emit player_left
          room.gameActive = false;
          io.to(roomId).emit("player_left", {
            message: `Player ${socket.playerSymbol} left the room. Game paused.`
          });
          console.log(`Room ${roomId} game paused. Remaining players: ${room.players.length}`);
        }
      }
    });
  });
};
