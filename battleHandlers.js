import {
  addBattles,
  battleCanBeProcessed,
  findBattleByid,
  finishBattle,
  isBattleOver,
  processBattleEntries,
  updateBattleLog,
  updateBattleParty,
} from "./db.js"
import { emitConnectedList } from "./commonEvents.js"
import { socketIsInBattle } from "./helpers.js"
import crypto from "crypto"

export default function battleHandlers(io, socket) {
  async function emitChallenges(userInvitedSocketId, confirmCallback) {
    const ownerSocket = await io.in(socket.id).fetchSockets()
    const { id, data } = ownerSocket[0]
    io.to(userInvitedSocketId).emit("challenges", { id, name: data.name })
    confirmCallback(true)
  }

  function userBattlePrepare(user) {
    return {
      name: user.data.name,
      socketId: user.id,
      party: user.data.party.map((pokemon, index) => ({
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

  async function battleInviteResponse(ownerSocket) {
    const socketsOwner = await io.in(ownerSocket).fetchSockets()
    const owner = socketsOwner[0]
    const ownerIsInBattle = socketIsInBattle(owner)

    if (ownerIsInBattle) {
      io.to(socket.id).emit("message", "Usuário já está em batalha")
      return
    }

    const battleId = crypto.randomUUID()

    owner.join(battleId)
    socket.join(battleId)
    const battle = addBattles(
      battleId,
      userBattlePrepare(owner),
      userBattlePrepare(socket)
    )
    io.to(battleId).emit("battle", battle)
    emitConnectedList(io)
  }

  function battleActions(battleId, action) {
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
    let battle = findBattleByid(battleId)

    if (battleLogIsComplete) {
      processBattleEntries(battleId)
      battle = findBattleByid(battleId)

      if (isBattleOver(battleId)) {
        finishBattle(battleId)
        battle = findBattleByid(battleId)
        io.to(battleId).emit("battle:action-response", battle)
        io.socketsLeave(battleId)
      } else {
        io.to(battleId).emit("battle:action-response", battle)
      }
    } else {
      io.to(socket.id).emit("battle:action-response", battle)
    }

    emitConnectedList(io)
  }

  function battleActionChange(battleId, newPokemonId, username) {
    updateBattleParty(battleId, username, newPokemonId)
    const battle = findBattleByid(battleId)
    io.to(battleId).emit("battle:action-response", battle)
  }

  socket.on("battle:invite", emitChallenges)
  socket.on("battle:invite-response", battleInviteResponse)
  socket.on("battle:actions", battleActions)
  socket.on("battle:action-change", battleActionChange)
}
