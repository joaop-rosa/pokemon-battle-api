import { emitConnectedList } from "./commonEvents.js"

export default function connectionHandlers(io, socket) {
  function isValidLogin(name, party) {
    return name && name.trim().length > 0 && party && party.length >= 1
  }

  function connectServer(name, party) {
    console.log(`Logando: ${name}`)
    if (isValidLogin(name, party)) {
      socket.data.name = name
      socket.data.party = party
      emitConnectedList(io)
    }
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
