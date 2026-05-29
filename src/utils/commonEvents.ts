import type { Server, Socket } from "socket.io"
import { socketIsInBattle } from "./socketHelpers.js"

export async function emitConnectedList(io: Server, socketId: string | null = null) {
  const sockets = await io.fetchSockets()

  const filteredList = sockets
    .filter((socket) => socket.data.party && socket.data.name)
    .map((socket) => {
      return {
        id: socket.id,
        data: socket.data,
        isInBattle: socketIsInBattle(socket as unknown as Socket),
      }
    })

  if (socketId) {
    return io.to(socketId).emit("connected-list", filteredList)
  }

  io.emit("connected-list", filteredList)
}
