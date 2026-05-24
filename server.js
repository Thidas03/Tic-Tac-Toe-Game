const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const initGameSocket = require("./socket/gameSocket");

const app = express();

// Configure CORS for Express
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));

// HTTP server wrapper
const server = http.createServer(app);

// Attach Socket.IO to HTTP server with CORS config
const io = new Server(server, {
  cors: corsOptions
});

// Basic route
app.get("/", (req, res) => {
  res.send("Tic Tac Toe Server Running");
});

// Connect game socket listeners
initGameSocket(io);

// Start server on PORT 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Tic Tac Toe server running on port ${PORT}`);
});
