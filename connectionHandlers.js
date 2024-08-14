import { emitConnectedList } from "./commonEvents.js"

export default function connectionHandlers(io, socket) {
  function connectServer(name, party) {
    console.log(`Tentativa de conexão: ${name}`)
    socket.data.name = name
    socket.data.party = party
    emitConnectedList(io)
  }

  // function reconect(reconnectedPlayer) {
  //   console.log("Tentando reconexão de: ", reconnectedPlayer)
  //   const oldSocketId = reconnectedPlayer.id
  //   const existingPlayer = getUserById(oldSocketId)

  //   if (existingPlayer) {
  //     console.log(`Reconexão de ${reconnectedPlayer.id} com sucesso`)
  //     if (existingPlayer.isInBattle) {
  //       console.log(`Reconectando: ${existingPlayer.name}  na batalha`)

  //       const battleInProgress = findAndUpdateUserBattle(
  //         existingPlayer.name,
  //         socket.id
  //       )

  //       // TODO - fazer update da party

  //       if (battleInProgress) {
  //         console.log(
  //           `Reconexão de ${reconnectedPlayer.id} com para batalha com sucesso`
  //         )
  //         console.log("socket.id", socket.id)
  //         io.to(socket.id).emit("battle", battleInProgress)
  //       }
  //     }
  //   } else {
  //     console.log(
  //       `Reconexão de ${reconnectedPlayer.id} falhou pq usuário não existia`
  //     )
  //   }
  //   emitConnectedList(io)
  // }

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
  // socket.on("reconnect", reconect)
}
