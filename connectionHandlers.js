import { emitConnectedList } from "./commonEvents.js"

export default function connectionHandlers(io, socket) {
  function connectServer(name, party) {
    console.log(`Tentativa de login: ${name}`)
    socket.data.name = name
    socket.data.party = party
    emitConnectedList(io)
  }

  function connectedList() {
    emitConnectedList(io, socket.id)
  }

  function disconnect() {
    console.log("Socket desconectado:", socket.id, socket.data.name)
    emitConnectedList(io)
  }

  socket.on("connect:server", connectServer)
  socket.on("connected-list", connectedList)
  socket.on("disconnect", disconnect)
}
