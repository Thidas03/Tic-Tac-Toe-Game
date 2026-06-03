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

      // Initialize room structure with strict 2-player model
      rooms[roomId] = {
        players: {
          X: socket.id,
          O: null
        },
        board: Array(9).fill(""),
        turn: "X",
        status: "waiting"
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
    socket.on("join_room", (data) => {
      // Support input as { roomId } per spec, and also fallback to string for robust handling
      let roomIdStr = "";
      if (data && typeof data === "object") {
        roomIdStr = data.roomId;
      } else if (typeof data === "string") {
        roomIdStr = data;
      }

      const targetRoomId = roomIdStr ? roomIdStr.trim().toUpperCase() : "";
      const room = rooms[targetRoomId];

      // VALIDATION: Room must exist
      if (!room) {
        console.log(`Join attempt failed: Room ${targetRoomId} not found.`);
        socket.emit("room_not_found", { message: "Room not found" });
        socket.emit("error_room_not_found", { message: "Room not found" });
        return;
      }

      // VALIDATION: Room must NOT be full (and must have empty O slot)
      if ((room.players.X && room.players.O) || room.players.O !== null) {
        console.log(`Join attempt failed: Room ${targetRoomId} is full.`);
        socket.emit("room_full", { message: "Room is full" });
        socket.emit("error_room_full", { message: "Room is full" });
        return;
      }

      // VALIDATION: Prevent joining same room twice (prevent duplicate X/O assignment)
      if (room.players.X === socket.id || room.players.O === socket.id) {
        console.log(`Join attempt failed: Socket ${socket.id} already in room.`);
        socket.emit("invalid_move", { message: "You are already in this room" });
        return;
      }

      // Assign socket.id to player O
      room.players.O = socket.id;
      room.status = "playing";

      // Track details on socket
      socket.roomId = targetRoomId;
      socket.playerSymbol = "O";

      // Join socket room
      socket.join(targetRoomId);

      console.log(`Player O (${socket.id}) joined room: ${targetRoomId}`);

      // Emit room_joined event to the joiner
      socket.emit("room_joined", { roomId: targetRoomId, player: "O" });

      // THEN EMIT TO BOTH PLAYERS: start_game
      // X player socket gets "X"
      if (room.players.X) {
        io.to(room.players.X).emit("start_game", {
          roomId: targetRoomId,
          symbol: "X",
          board: room.board,
          turn: room.turn
        });
      }

      // O player socket gets "O"
      if (room.players.O) {
        io.to(room.players.O).emit("start_game", {
          roomId: targetRoomId,
          symbol: "O",
          board: room.board,
          turn: room.turn
        });
      }

      // Emit system chat notifications that opponent joined and game started
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      io.to(targetRoomId).emit("receive_message", {
        user: "System",
        message: "Player O joined the room.",
        time: timeStr,
        isSystem: true
      });
      io.to(targetRoomId).emit("receive_message", {
        user: "System",
        message: "Game started! Player X vs Player O",
        time: timeStr,
        isSystem: true
      });
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
      if (room.status !== "playing") {
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
        room.status = "waiting";
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

    // 3.5. Request Restart Handler
    socket.on("request_restart", () => {
      const roomId = socket.roomId;
      if (!roomId || !rooms[roomId]) return;

      const room = rooms[roomId];

      if (!room.restartRequests) {
        room.restartRequests = new Set();
      }

      room.restartRequests.add(socket.playerSymbol);

      console.log(`Restart requested in room ${roomId} by Player ${socket.playerSymbol}`);

      // Notify all players in room of the restart request
      io.to(roomId).emit("restart_requested", {
        requestedBy: socket.playerSymbol,
        totalRequests: room.restartRequests.size
      });

      // If both players have requested, reset game
      if (room.restartRequests.size === 2) {
        room.board = Array(9).fill("");
        room.turn = "X";
        room.status = "playing";
        room.restartRequests.clear();

        // Send start_game to both to reset client state
        if (room.players.X) {
          io.to(room.players.X).emit("start_game", {
            roomId: roomId,
            symbol: "X",
            board: room.board,
            turn: room.turn
          });
        }
        if (room.players.O) {
          io.to(room.players.O).emit("start_game", {
            roomId: roomId,
            symbol: "O",
            board: room.board,
            turn: room.turn
          });
        }

        // Send chat notification
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        io.to(roomId).emit("receive_message", {
          user: "System",
          message: "Game restarted! Good luck!",
          time: timeStr,
          isSystem: true
        });
      }
    });


    // Helper to clean up room when a socket leaves or disconnects
    const handleLeave = () => {
      const roomId = socket.roomId;
      if (roomId && rooms[roomId]) {
        const room = rooms[roomId];

        // Set the leaving player's slot to null
        if (socket.playerSymbol === "X") {
          room.players.X = null;
        } else if (socket.playerSymbol === "O") {
          room.players.O = null;
        }
        
        console.log(`Player ${socket.playerSymbol} (${socket.id}) left room: ${roomId}`);

        // Clear restart requests if any
        if (room.restartRequests) {
          room.restartRequests.clear();
        }


        // If both slots are empty (null), delete the room
        if (!room.players.X && !room.players.O) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted as it is empty.`);
        } else {
          // Pause active gameplay
          room.status = "waiting";

          // Emit player_left to pause game
          io.to(roomId).emit("player_left", {
            message: `Player ${socket.playerSymbol} left the room. Game paused.`
          });

          // Emit system chat notification when player disconnects or leaves
          const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          io.to(roomId).emit("receive_message", {
            user: "System",
            message: `Player ${socket.playerSymbol} left the room.`,
            time: timeStr,
            isSystem: true
          });

          console.log(`Room ${roomId} game paused. A remaining player exists.`);
        }

        // Clear socket properties for clean state
        socket.roomId = null;
        socket.playerSymbol = null;
      }
    };

    // 4. Leave Room and Disconnect Handlers
    socket.on("leave_room", handleLeave);
    socket.on("disconnect", handleLeave);

    // 5. Send Message Handler
    socket.on("send_message", ({ roomId, user, message }) => {
      const targetRoomId = roomId ? roomId.trim().toUpperCase() : "";
      if (!targetRoomId || !message) return;

      const payload = {
        user,
        message,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      io.to(targetRoomId).emit("receive_message", payload);
    });

    // 6. Typing Handler
    socket.on("typing", ({ roomId, user, isTyping }) => {
      const targetRoomId = roomId ? roomId.trim().toUpperCase() : "";
      if (!targetRoomId) return;

      socket.to(targetRoomId).emit("player_typing", {
        user,
        isTyping
      });
    });
  });
};
