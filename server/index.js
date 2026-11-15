import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST"],
  },
});

const users = ["Alan", "Bob", "Carol", "Dean", "Elin"];

// Temporary history: restarting the server clears it.
const messages = [];
const MAX_MESSAGES = 500;

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    message: "Chat server is running",
  });
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // New connections receive the current conversation.
  socket.emit("messages:history", messages);

  socket.on("message:send", (payload, acknowledge) => {
    const reply =
      typeof acknowledge === "function" ? acknowledge : () => {};

    if (!payload || typeof payload.text !== "string") {
      reply({ ok: false, error: "Invalid message." });
      return;
    }

    const text = payload.text.trim();

    if (!text) {
      reply({ ok: false, error: "Please enter a message." });
      return;
    }

    if (text.length > 10000) {
      reply({
        ok: false,
        error: "Messages must be 10,000 characters or fewer.",
      });
      return;
    }

    const message = {
      id: randomUUID(),
      senderId:
  typeof payload.clientId === "string"
    ? payload.clientId.slice(0, 100)
    : socket.id,
      name: users[Math.floor(Math.random() * users.length)],
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
      reactions: {},
      pinned: false,
      attachments: [],
    };

    messages.push(message);

    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }

    // Includes the sender so everyone receives the same message.
    io.emit("message:created", message);

    reply({ ok: true, id: message.id });
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(3001, "127.0.0.1", () => {
  console.log("Chat server running at http://localhost:3001");
});