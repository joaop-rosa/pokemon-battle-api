import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
import crypto from "crypto"

const port = 3001
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
  },
})

let connectedUsers = []
let challengesList = []

function getUserById(socketId) {
  return connectedUsers.find((u) => socketId === u.socketId)
}

function addUser(user) {
  if (getUserById(user.socketId)) return

  if (user.socketId && user.party && user.name) {
    connectedUsers.push(user)
    console.log("Usuário adicionado:", user.name)
    emitConnectedList()
  }
}

function removeUser(socketId) {
  connectedUsers = connectedUsers.filter((user) => user.socketId !== socketId)
}

function emitConnectedList(socketId = null) {
  console.log("connectedUsers", connectedUsers)
  if (socketId) {
    return io.to(socketId).emit("connected-list", connectedUsers)
  }

  io.emit("connected-list", connectedUsers)
}

function updateChallenges(socketId) {
  io.to(socketId).emit(
    "challenges",
    challengesList.filter((challenge) => {
      console.log("challenge", challenge)
      return challenge.userInvited.socketId === socketId
    })
  )
  console.log("All challenges", challengesList)
}

io.on("connect", (socket) => {
  console.log("Usuário conectado:", socket.id)

  socket.on("connect-server", (name, party) => {
    // Talvez adicionar validação de ataques da party
    addUser({
      name: name,
      party: party,
      socketId: socket.id,
      isInBattle: false,
    })
  })

  socket.on("desconnect-server", (socketId) => {
    removeUser(socketId)
    console.log("Usuário desconectado:", socket.id)

    emitConnectedList()
  })

  socket.on("connected-list", (socketId) => {
    emitConnectedList(socketId)
  })

  socket.on("battle-invite", (socketInvitedId) => {
    console.log("socketInvited", socketInvitedId)
    console.log("meu socket", socket.id)

    challengesList = [
      ...challengesList,
      {
        challengeId: crypto.randomUUID(),
        challenger: getUserById(socket.id),
        userInvited: getUserById(socketInvitedId),
      },
    ]
    updateChallenges(socketInvitedId)
  })

  socket.on("battle-invite-response", (challengeId, response) => {
    const { userInvited, challenger } = challengesList.find(
      (c) => c.challengeId === challengeId
    )

    // Aceitou e o desafiante esta disponível
    if (response && !challenger.isInBattle) {
      // Pode ser removido após impletação de tela de batalhas
      challengesList = challengesList.filter(
        (challenge) => challenge.challengeId !== challengeId
      )
      updateChallenges(userInvited.socketId)
      updateChallenges(challenger.socketId)
      ///////////////////////
      connectedUsers = connectedUsers.map((user) => {
        if (
          user.socketId === userInvited.socketId ||
          user.socketId === challenger.socketId
        ) {
          return { ...user, isInBattle: true }
        }
        return user
      })
      emitConnectedList()
      io.to(userInvited.socketId).emit("battle", challenger)
      io.to(challenger.socketId).emit("battle", userInvited)
      return
    }

    // Aceitou e o desafiante não esta disponível
    if (response && getUserById(challengerSocketId).isInBattle) {
      // Enviar um warning para o cliente que aceitou
    }

    challengesList = challengesList.filter(
      (challenge) => challenge.challengeId !== challengeId
    )
    updateChallenges(userInvited.socketId)
    updateChallenges(challenger.socketId)
  })

  // Batalha

  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id)
    removeUser(socket.id)
    emitConnectedList()
    console.log("Lista Atual de usuários conectados", connectedUsers)
  })
})

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})
