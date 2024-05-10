import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"

const port = 3001
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
  },
})

let connectedUsers = []

function addUser(user) {
  if (connectedUsers.find((u) => user.socketId === u.socketId)) return

  if (user.socketId && user.party && user.name) {
    connectedUsers.push(user)
    console.log("Usuário adicionado:", user.name)
    emitConnectedList()
  }
}

function removeUser(socketId) {
  connectedUsers = connectedUsers.filter((user) => user.socketId !== socketId)
}

function emitConnectedList() {
  io.emit("connected-list", connectedUsers)
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

  socket.on("battle-invite", (socketInvited) => {
    console.log("socketInvited", socketInvited)
    console.log("meu socket", socket.id)

    // Enviar para o socket desafiado

    // Caso o invite esteja ok enviar para o socket desafiante que esta aguardando

    // Em caso negativo enviar resposta para socket desafiante

    // Em caso positivo enviar ambos para batalha

    // Atualizar algum status de inBattle
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
