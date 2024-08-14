import { socketIsInBattle } from "./helpers.js"

export async function emitConnectedList(io, socketId = null) {
  const sockets = await io.fetchSockets()

  const filteredList = sockets
    .filter((socket) => socket.data.party && socket.data.name)
    .map((socket) => {
      return {
        id: socket.id,
        data: socket.data,
        isInBattle: socketIsInBattle(socket),
      }
    })

  if (socketId) {
    return io.to(socketId).emit("connected-list", filteredList)
  }

  io.emit("connected-list", filteredList)
}
