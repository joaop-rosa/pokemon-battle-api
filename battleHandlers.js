import {
  addBattles,
  addChallenge,
  battleCanBeProcessed,
  challengesList,
  findBattleByid,
  getUserById,
  processBattleEntries,
  removeChallenge,
  updateBattleLog,
  updateBattleParty,
  updateIsInBattle,
} from "./db.js"
import crypto from "crypto"
import { emitConnectedList } from "./commonEvents.js"

export default function battleHandlers(io, socket) {
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

  function battleInvite(socketInvitedId) {
    addChallenge(socket.id, socketInvitedId)
    emitChallenges(socketInvitedId)
  }

  function battleInviteResponse(challengeId, response) {
    const { userInvited, challenger } = challengesList.find(
      (c) => c.challengeId === challengeId
    )

    // Aceitou e o desafiante não esta disponível
    if (response && getUserById(challenger.socketId).isInBattle) {
      // Enviar um warning para o cliente que aceitou
    }

    // Aceitou e o desafiante esta disponível
    if (response && !challenger.isInBattle) {
      // // Pode ser removido após impletação de tela de batalhas
      // removeChallenge(challengeId)
      // emitChallenges(userInvited.socketId)
      // emitChallenges(challenger.socketId)
      // ///////////////////////
      const roomID = crypto.randomUUID()
      updateIsInBattle(userInvited.name, true)
      updateIsInBattle(challenger.name, true)
      const battleInfos = {
        challenger: userBattlePrepare(challenger),
        userInvited: userBattlePrepare(userInvited),
      }
      const battle = addBattles(battleInfos)
      io.to(userInvited.socketId).emit("battle", battle)
      io.to(challenger.socketId).emit("battle", battle)
    }

    emitConnectedList(io)
    removeChallenge(challengeId)
    emitChallenges(userInvited.socketId)
    emitChallenges(challenger.socketId)
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
    const battle = findBattleByid(battleId)

    if (battleLogIsComplete) {
      processBattleEntries(battleId)

      io.to(battle.battleInfos.userInvited.socketId).emit(
        "battle:action-response",
        battle
      )
      io.to(battle.battleInfos.challenger.socketId).emit(
        "battle:action-response",
        battle
      )
    } else {
      io.to(socket.id).emit("battle:action-response", battle)
    }

    emitConnectedList(io)
  }

  function battleActionChange(battleId, newPokemonId, username) {
    updateBattleParty(battleId, username, newPokemonId)
    const battle = findBattleByid(battleId)
    io.to(battle.battleInfos.userInvited.socketId).emit(
      "battle:action-response",
      battle
    )
    io.to(battle.battleInfos.challenger.socketId).emit(
      "battle:action-response",
      battle
    )
  }

  socket.on("battle:invite", battleInvite)
  socket.on("battle:invite-response", battleInviteResponse)
  socket.on("battle:actions", battleActions)
  socket.on("battle:action-change", battleActionChange)
}
