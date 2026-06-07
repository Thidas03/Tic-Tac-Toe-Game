const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const initGameSocket = require("./socket/gameSocket");

const app = express();

// Configure CORS for Express and Socket.IO
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow request if origin is in the allowed list, if it is same-origin (no origin header), in production, or localhost/127.0.0.1
    const isLocalhost = origin && (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin));
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "production" || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
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

// Connect game socket listeners
initGameSocket(io);

// Serve static assets from the Vite frontend build folder
app.use(express.static(path.join(__dirname, "dist")));

// Fallback route for React Router (Single Page Application)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server on PORT 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Tic Tac Toe server running on port ${PORT}`);
});

