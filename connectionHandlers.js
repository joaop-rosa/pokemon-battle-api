import { emitConnectedList } from "./commonEvents.js"

export default function connectionHandlers(io, socket) {
  function isValidLogin(name, party) {
    return (
      name &&
      name.trim().length > 0 &&
      name.trim().length < 20 &&
      party &&
      party.length >= 1
    )
  }

  function connectServer(name, party, callback) {
    console.log(`Logando: ${name}`)
    const canLogin = isValidLogin(name, party)
    callback(canLogin)

    if (canLogin) {
      socket.data.name = name
      socket.data.party = party
      socket.data.color =
        "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0")
      emitConnectedList(io)
    } else {
      socket.disconnect()
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
