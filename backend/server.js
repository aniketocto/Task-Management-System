require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportsRoutes = require("./routes/reportRoutes");
const notifyRoutes = require("./routes/notifyRoutes");

const app = express();
const server = http.createServer(app);

//  CORS on Express
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json()); // ✅ MUST come before routes

// Connect to DB
connectDB();

// Mounting express Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/notify", notifyRoutes);

// Static Server upload folder
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket IO Setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});
app.set("io", io);

io.on("connection", (socket) => {


  const token = socket.handshake.auth?.token;
  // console.log("Received token:", token);

  if (!token) {
    console.error("❌ No token provided by client.");
    socket.disconnect(true);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("✅ JWT verified:", decoded);
    const userId = decoded.id?.toString();
    socket.join(userId);
    // console.log(`👥 Socket joined room: ${userId}`);
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    socket.emit("connect_error", { message: "Authentication error" });
    socket.disconnect(true);
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
