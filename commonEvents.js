import { connectedUsers } from "./db.js"

export function emitConnectedList(io, socketId = null) {
  if (socketId) {
    return io.to(socketId).emit("connected-list", connectedUsers)
  }

  io.emit("connected-list", connectedUsers)
}
