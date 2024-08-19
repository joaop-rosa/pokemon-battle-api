import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
import battleHandlers from "./battleHandlers.js"
import connectionHandlers from "./connectionHandlers.js"

/*
  1 - Criação do servidor
*/
const port = 3001
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
})

function onConnection(socket) {
  console.log("Socket conectado:", socket.id)
  console.log("recovered?", socket.recovered)
  /*
    3 - Eventos padrões de conexão
  */
  connectionHandlers(io, socket)
  battleHandlers(io, socket)
}

/*
  2 - Definindo ações para cada evento
*/
io.on("connection", onConnection)

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})
