import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
import battleHandlers from "./battleHandlers.js"
import connectionHandlers from "./connectionHandlers.js"

const port = 3001
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
})

io.engine.on("connection_error", (err) => {
  console.log(err.req) // the request object
  console.log(err.code) // the error code, for example 1
  console.log(err.message) // the error message, for example "Session ID unknown"
  console.log(err.context) // some additional error context
})

function onConnection(socket) {
  console.log("Socket conectado:", socket.id)
  console.log("recovered?", socket.recovered)
  connectionHandlers(io, socket)
  battleHandlers(io, socket)
}

io.on("connection", onConnection)

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})
