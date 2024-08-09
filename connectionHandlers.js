import { emitConnectedList } from "./commonEvents.js"
import {
  connectedUsers,
  connectUser,
  findAndUpdateUserBattle,
  getUserById,
  removeUser,
  updateSocketId,
} from "./db.js"

export default function connectionHandlers(io, socket) {
  function connectServer(name, party) {
    console.log(`Tentativa de conexão: ${name}`)
    // Talvez adicionar validação de ataques da party
    connectUser({
      name: name,
      party: party,
      socketId: socket.id,
      isInBattle: false,
      isOnline: true,
    })
    emitConnectedList(io)
  }

  function reconect(reconnectedPlayer) {
    console.log("Tentando reconexão de: ", reconnectedPlayer)
    const oldSocketId = reconnectedPlayer.id
    const existingPlayer = getUserById(oldSocketId)

    if (existingPlayer) {
      console.log(`Reconexão de ${reconnectedPlayer.id} com sucesso`)
      updateSocketId(socket.id, oldSocketId)
      if (existingPlayer.isInBattle) {
        console.log(`Reconectando: ${existingPlayer.name}  na batalha`)

        const battleInProgress = findAndUpdateUserBattle(
          existingPlayer.name,
          socket.id
        )

        // TODO - fazer update da party

        if (battleInProgress) {
          console.log(
            `Reconexão de ${reconnectedPlayer.id} com para batalha com sucesso`
          )
          console.log("socket.id", socket.id)
          io.to(socket.id).emit("battle", battleInProgress)
        }
      }
    } else {
      console.log(
        `Reconexão de ${reconnectedPlayer.id} falhou pq usuário não existia`
      )
    }

    emitConnectedList(io)
  }

  function connectedList() {
    emitConnectedList(io, socket.id)
  }

  function disconnectUser(username) {
    console.log("Usuário desconectado:", username)
    removeUser(socket.id)
    emitConnectedList(io)
  }

  function disconnect() {
    console.log("Socket desconectado:", socket.id)
    removeUser(socket.id)
    emitConnectedList(io)
  }

  socket.on("connect:server", connectServer)
  socket.on("reconnect", reconect)
  socket.on("connected-list", connectedList)
  socket.on("disconnect:user", disconnectUser)
  socket.on("disconnect", disconnect)
}
