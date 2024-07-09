import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
import {
  addBattles,
  addChallenge,
  addUser,
  battleCanBeProcessed,
  challengesList,
  connectedUsers,
  findAndUpdateUserBattle,
  findBattleByid,
  getUserById,
  getUserByName,
  processBattleEntries,
  removeChallenge,
  removeUser,
  updateBattleLog,
  updateBattleParty,
  updateIsInBattle,
  updateIsOnline,
  updateSocketId,
} from "./db.js"

const port = 3001
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
  },
})

function connectUser(user) {
  if (!user.socketId || !user.party || !user.name) {
    return console.log("Falha na conexão de:", user.name)
  }

  const userFromList = getUserByName(user.name)

  if (userFromList) {
    if (userFromList.isOnline) {
      console.log("Usuário " + user.name + " já está conectado")
      return
    }
    updateIsOnline(user.name, user.socketId)
    return console.log("Usuário conectado:", user.name)
  }

  addUser(user)
  console.log("Usuário adicionado:", user.name)
}

function emitConnectedList(socketId = null) {
  if (socketId) {
    return io.to(socketId).emit("connected-list", connectedUsers)
  }

  io.emit("connected-list", connectedUsers)
}

function emitChallenges(socketId) {
  io.to(socketId).emit(
    "challenges",
    challengesList.filter(
      (challenge) => challenge.userInvited.socketId === socketId
    )
  )
}

function userBattlePrepare(user) {
  return {
    name: user.name,
    socketId: user.socketId,
    party: user.party.map((pokemon, index) => ({
      id: pokemon.partyId,
      name: pokemon.name,
      isActive: index === 0,
      currentLife: pokemon.stats.hp,
      types: pokemon.types,
      stats: pokemon.stats,
      moves: pokemon.movesSelected,
      sprites: {
        miniature: pokemon.sprites.miniature,
        front: pokemon.sprites.front,
        back: pokemon.sprites.back,
      },
    })),
  }
}

io.on("connect", (socket) => {
  console.log("Usuário conectado:", socket.id)

  socket.on("connect-server", (name, party) => {
    // Talvez adicionar validação de ataques da party
    connectUser({
      name: name,
      party: party,
      socketId: socket.id,
      isInBattle: false,
      isOnline: true,
    })
    emitConnectedList()
  })

  socket.on("reconnect", (reconnectedPlayer) => {
    console.log("Reconnect", reconnectedPlayer)
    const oldSocketId = reconnectedPlayer.id
    const existingPlayer = getUserById(oldSocketId)

    if (existingPlayer) {
      updateSocketId(socket.id, oldSocketId)
      if (existingPlayer.isInBattle) {
        const battleInProgress = findAndUpdateUserBattle(
          existingPlayer.name,
          socket.id
        )

        if (battleInProgress) {
          io.to(socket.id).emit("battle", battleInProgress)
        }
      }
    }

    emitConnectedList()
  })

  socket.on("connected-list", (socketId) => {
    emitConnectedList(socketId)
  })

  socket.on("battle-invite", (socketInvitedId) => {
    addChallenge(socket.id, socketInvitedId)
    emitChallenges(socketInvitedId)
  })

  socket.on("battle-invite-response", (challengeId, response) => {
    const { userInvited, challenger } = challengesList.find(
      (c) => c.challengeId === challengeId
    )

    // Aceitou e o desafiante esta disponível
    if (response && !challenger.isInBattle) {
      // Pode ser removido após impletação de tela de batalhas
      removeChallenge(challengeId)
      emitChallenges(userInvited.socketId)
      emitChallenges(challenger.socketId)
      ///////////////////////
      updateIsInBattle(userInvited.socketId)
      updateIsInBattle(challenger.socketId)
      emitConnectedList()
      const battleInfos = {
        challenger: userBattlePrepare(challenger),
        userInvited: userBattlePrepare(userInvited),
      }
      const battle = addBattles(battleInfos)
      io.to(userInvited.socketId).emit("battle", battle)
      io.to(challenger.socketId).emit("battle", battle)
      return
    }

    // Aceitou e o desafiante não esta disponível
    if (response && getUserById(challengerSocketId).isInBattle) {
      // Enviar um warning para o cliente que aceitou
    }

    removeChallenge(challengeId)
    emitChallenges(userInvited.socketId)
    emitChallenges(challenger.socketId)
  })

  // Batalha
  socket.on("battle-actions", (battleId, action) => {
    const { actionKey, username, actionValue } = action

    updateBattleLog(
      battleId,
      {
        actionKey,
        actionValue,
      },
      username
    )

    const battleLogIsComplete = battleCanBeProcessed(battleId)

    if (battleLogIsComplete) {
      processBattleEntries(battleId)
      const battle = findBattleByid(battleId)
      io.to(battle.battleInfos.userInvited.socketId).emit(
        "battle-action-response",
        battle
      )
      io.to(battle.battleInfos.challenger.socketId).emit(
        "battle-action-response",
        battle
      )
    }
  })

  socket.on("battle-action-change", (battleId, newPokemonId, username) => {
    updateBattleParty(battleId, username, newPokemonId)
    const battle = findBattleByid(battleId)
    io.to(battle.battleInfos.userInvited.socketId).emit(
      "battle-action-response",
      battle
    )
    io.to(battle.battleInfos.challenger.socketId).emit(
      "battle-action-response",
      battle
    )
  })

  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id)
    removeUser(socket.id)
    emitConnectedList()
  })
})

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})
