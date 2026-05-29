import express from "express"
import "dotenv/config"
import { createServer } from "node:http"
import { type DefaultEventsMap, Server, type Socket } from "socket.io"
import battleHandlers from "./handlers/battle.js"
import connectionHandlers from "./handlers/connection.js"
import type { SocketData } from "./types/index.js"

const port = process.env.WEBSOCKET_PORT || 3001
const corsOrigin = process.env.CORS_ORIGIN || "*"
const app = express()
const server = createServer(app)

const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(server, {
  cors: {
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(","),
  },
  pingInterval: 20000,
  pingTimeout: 5000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
  transports: ["websocket", "polling"],
  allowUpgrades: true, // use WebSocket first, if available
})

function onConnection(socket: Socket) {
  console.log("Socket connected:", socket.id)
  if (socket.recovered) {
    console.log("Reconnected: ", socket.data.name)
  }
  connectionHandlers(io, socket)
  battleHandlers(io, socket)

  socket.on("chat:message", (message: string) => {
    io.emit("chat:message", {
      name: socket.data.name,
      color: socket.data.color,
      message,
      hour: Date.now(),
    })
  })
}

io.on("connection", onConnection)

server.listen(port, () => {
  console.log(`server running at ${port}`)
})
