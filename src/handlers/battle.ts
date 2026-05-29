import crypto from "node:crypto"
import type { Server, Socket } from "socket.io"
import {
  addBattles,
  battleCanBeProcessed,
  findBattleByid,
  finishBattle,
  isBattleOver,
  processBattleEntries,
  updateBattleLog,
  updateBattleParty,
} from "../db/store.js"
import type { Action, BattleUser, Move, Pokemon, SocketData } from "../types/index.js"
import { emitConnectedList } from "../utils/commonEvents.js"
import { socketIsInBattle } from "../utils/socketHelpers.js"

export default function battleHandlers(io: Server, socket: Socket) {
  async function emitChallenges(
    userInvitedSocketId: string,
    confirmCallback: (success: boolean) => void,
  ) {
    const ownerSocket = await io.in(socket.id).fetchSockets()
    if (ownerSocket.length > 0) {
      const { id, data } = ownerSocket[0]
      io.to(userInvitedSocketId).emit("challenges", { id, name: data.name })
      confirmCallback(true)
    }
  }

  function userBattlePrepare(user: { id: string; data: SocketData }): BattleUser {
    return {
      name: user.data.name || "",
      socketId: user.id,
      party: (user.data.party || []).map((pokemon: Pokemon, index: number) => ({
        id: pokemon.partyId || pokemon.id,
        name: pokemon.name,
        isActive: index === 0,
        currentLife: pokemon.stats.hp,
        types: pokemon.types,
        stats: pokemon.stats,
        moves: (pokemon.movesSelected || pokemon.moves) as Record<string, Move>,
        sprites: {
          miniature: pokemon.sprites.miniature,
          front: pokemon.sprites.front,
          back: pokemon.sprites.back,
          battleFront: pokemon.sprites.battleFront,
          battleBack: pokemon.sprites.battleBack,
        },
      })),
    }
  }

  async function battleInviteResponse(ownerSocketId: string) {
    const socketsOwner = await io.in(ownerSocketId).fetchSockets()
    if (socketsOwner.length === 0) return

    const owner = socketsOwner[0]
    const ownerIsInBattle = socketIsInBattle(owner as unknown as Socket)

    if (ownerIsInBattle) {
      io.to(socket.id).emit("message", "User is already in a battle")
      return
    }

    const battleId = crypto.randomUUID()

    owner.join(battleId)
    socket.join(battleId)
    const battle = addBattles(battleId, userBattlePrepare(owner), userBattlePrepare(socket))
    io.to(battleId).emit("battle", battle)
    emitConnectedList(io)
  }

  function battleActions(battleId: string, action: Action) {
    const { actionKey, actionValue } = action
    const username = socket.data.name

    if (!username) return

    updateBattleLog(
      battleId,
      {
        actionKey,
        actionValue,
      },
      username,
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

  function battleActionChange(battleId: string, newPokemonId: string) {
    const username = socket.data.name
    if (!username) return

    updateBattleParty(battleId, username, newPokemonId)
    const battle = findBattleByid(battleId)
    io.to(battleId).emit("battle:action-response", battle)
  }

  socket.on("battle:invite", emitChallenges)
  socket.on("battle:invite-response", battleInviteResponse)
  socket.on("battle:actions", battleActions)
  socket.on("battle:action-change", battleActionChange)
}
