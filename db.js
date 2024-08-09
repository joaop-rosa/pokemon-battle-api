import crypto from "crypto"
import {
  changeActivePokemon,
  getMove,
  isActivePokemonAlive,
  isAllPokemonDeads,
  isChallegerFirst,
  processDamage,
} from "./battles-helpers.js"

export let connectedUsers = []
export let challengesList = []
export let battles = []

/* CONNECTED USERS */
export function getUserById(socketId) {
  console.log("connectedUsers", connectedUsers)
  return connectedUsers.find((u) => socketId === u.socketId)
}

export function getUserByName(name) {
  return connectedUsers.find((u) => name === u.name)
}

export function addUser(user) {
  connectedUsers = [...connectedUsers, user]
}

export function connectUser(user) {
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

export function removeUser(socketId) {
  connectedUsers = connectedUsers.map((user) => {
    if (user.socketId === socketId) {
      return { ...user, isOnline: false }
    }

    return user
  })
}

export function updateSocketId(newSocketId, oldSocketId) {
  connectedUsers = connectedUsers.map((user) => {
    if (user.socketId === oldSocketId) {
      return { ...user, isOnline: true, socketId: newSocketId }
    }

    return user
  })
}

export function updateIsOnline(name, socketId) {
  connectedUsers = connectedUsers.map((u) => {
    if (u.name === name) {
      return { ...u, socketId: socketId, isOnline: true }
    }

    return u
  })
}

export function updateIsInBattle(username, isInBattle) {
  connectedUsers = connectedUsers.map((user) => {
    if (user.name === username) {
      return { ...user, isInBattle }
    }
    return user
  })
  console.log("connectedUsers-updateIsInBattle", connectedUsers)
}

/* CHALLENGES */
// Utilizar nomes
export function addChallenge(socketIdChallenger, socketIdInvited) {
  challengesList = [
    ...challengesList,
    {
      challengeId: crypto.randomUUID(),
      challenger: getUserById(socketIdChallenger),
      userInvited: getUserById(socketIdInvited),
    },
  ]
}

export function removeChallenge(challengeId) {
  challengesList = challengesList.filter(
    (challenge) => challenge.challengeId !== challengeId
  )
}

/* BATTLES */
export function addBattles(battleInfos) {
  const newBattle = {
    battleId: crypto.randomUUID(),
    isOver: false,
    battleInfos,
    round: 1,
    battleLog: [],
    winner: "",
  }

  battles = [...battles, newBattle]

  return newBattle
}

export function findBattleByid(battleId) {
  return battles.find((b) => b.battleId === battleId)
}

export function battleCanBeProcessed(battleId) {
  const { battleLog, round } = findBattleByid(battleId)
  const roundLog = battleLog.find((bl) => bl.round === round)

  return roundLog && Object.keys(roundLog).length === 3
}

export function updateBattleLog(battleIdParam, log, username) {
  const { battleInfos, round, battleLog, battleId } =
    findBattleByid(battleIdParam)
  const isChalleger = battleInfos.challenger.name === username
  if (battleLog.find((bl) => bl.round === round)) {
    battles = battles.map((battle) => {
      if (battle.battleId === battleId) {
        battle.battleLog = battle.battleLog.map((bl) => {
          if (bl.round === round) {
            return {
              ...bl,
              [isChalleger ? "challenger" : "userInvited"]: log,
            }
          }
          return bl
        })
      }
      return battle
    })
  } else {
    battles = battles.map((battle) => {
      if (battle.battleId === battleId) {
        battle.battleLog = [
          ...battle.battleLog,
          {
            round,
            [isChalleger ? "challenger" : "userInvited"]: log,
          },
        ]
      }

      return battle
    })
  }
}

export function updateBattleParty(battleId, username, newPokemonId) {
  battles = battles.map((battle) => {
    if (battle.battleId === battleId) {
      const user =
        battle.battleInfos.challenger.name === username
          ? "challenger"
          : "userInvited"
      let modifiedBattle = {
        ...battle,
      }

      modifiedBattle.battleInfos[user].party = changeActivePokemon(
        modifiedBattle.battleInfos[user].party,
        newPokemonId
      )

      return modifiedBattle
    }

    return battle
  })
}

export function processBattleEntries(battleId) {
  const { battleLog, round, battleInfos } = findBattleByid(battleId)
  const { challenger, userInvited } = battleLog.find((bl) => bl.round === round)
  battles = battles.map((battle) => {
    if (battle.battleId === battleId) {
      let modifiedBattle = {
        ...battle,
        round: battle.round + 1,
      }

      const challengerActivePokemon = Object.values(
        battleInfos.challenger.party
      ).find((p) => p.isActive)

      const challengerMove = getMove(
        challengerActivePokemon,
        challenger.actionValue.name
      )

      const userInvitedActivePokemon = Object.values(
        battleInfos.userInvited.party
      ).find((p) => p.isActive)

      const userInvitedMove = getMove(
        userInvitedActivePokemon,
        userInvited.actionValue.name
      )

      if (
        challenger.actionKey === "ATTACK" &&
        userInvited.actionKey === "ATTACK"
      ) {
        const isChallengerAttackFirst = isChallegerFirst(
          challengerActivePokemon.stats.speed,
          challengerMove.priority,
          userInvitedActivePokemon.stats.speed,
          userInvitedMove.priority
        )

        if (isChallengerAttackFirst) {
          modifiedBattle.battleInfos.userInvited.party = processDamage(
            modifiedBattle.battleInfos.userInvited.party,
            challengerMove,
            challengerActivePokemon
          )

          if (
            isActivePokemonAlive(modifiedBattle.battleInfos.userInvited.party)
          ) {
            modifiedBattle.battleInfos.challenger.party = processDamage(
              modifiedBattle.battleInfos.challenger.party,
              userInvitedMove,
              userInvitedActivePokemon
            )
          }
        } else {
          modifiedBattle.battleInfos.challenger.party = processDamage(
            modifiedBattle.battleInfos.challenger.party,
            userInvitedMove,
            userInvitedActivePokemon
          )

          if (
            isActivePokemonAlive(modifiedBattle.battleInfos.challenger.party)
          ) {
            modifiedBattle.battleInfos.userInvited.party = processDamage(
              modifiedBattle.battleInfos.userInvited.party,
              challengerMove,
              challengerActivePokemon
            )
          }
        }
      } else {
        if (challenger.actionKey === "CHANGE") {
          modifiedBattle.battleInfos.challenger.party = changeActivePokemon(
            modifiedBattle.battleInfos.challenger.party,
            challenger.actionValue.id
          )
        }

        if (userInvited.actionKey === "CHANGE") {
          modifiedBattle.battleInfos.userInvited.party = changeActivePokemon(
            modifiedBattle.battleInfos.userInvited.party,
            userInvited.actionValue.id
          )
        }

        if (challenger.actionKey === "ATTACK") {
          modifiedBattle.battleInfos.userInvited.party = processDamage(
            modifiedBattle.battleInfos.userInvited.party,
            challengerMove,
            challengerActivePokemon
          )
        }

        if (userInvited.actionKey === "ATTACK") {
          modifiedBattle.battleInfos.challenger.party = processDamage(
            modifiedBattle.battleInfos.challenger.party,
            userInvitedMove,
            userInvitedActivePokemon
          )
        }
      }

      const isAllPokemonDeadsUserInvited = isAllPokemonDeads(
        modifiedBattle.battleInfos.userInvited.party
      )
      const isAllPokemonDeadsChallenger = isAllPokemonDeads(
        modifiedBattle.battleInfos.challenger.party
      )

      if (isAllPokemonDeadsUserInvited || isAllPokemonDeadsChallenger) {
        updateIsInBattle(modifiedBattle.battleInfos.challenger.name, false)
        updateIsInBattle(modifiedBattle.battleInfos.userInvited.name, false)
        modifiedBattle.isOver = true
      }

      if (isAllPokemonDeadsUserInvited) {
        modifiedBattle.winner = modifiedBattle.battleInfos.challenger.name
      }

      if (isAllPokemonDeadsChallenger) {
        modifiedBattle.winner = modifiedBattle.battleInfos.userInvited.name
      }

      console.log("modifiedBattle", modifiedBattle)

      return modifiedBattle
    }

    return battle
  })
}

export function findAndUpdateUserBattle(username, socketId) {
  const hasBattleOngoing = battles.some(
    (battle) =>
      !battle.isOver &&
      (battle.battleInfos.userInvited.name === username ||
        battle.battleInfos.challenger.name === username)
  )

  if (!hasBattleOngoing) {
    return null
  }

  let battle = null
  battles = battles.map((b) => {
    const isChalleger = b.battleInfos.challenger.name === username
    const isInvited = b.battleInfos.userInvited.name === username
    if (!b.isOver && (isChalleger || isInvited)) {
      const updatedBattle = {
        ...b,
        battleInfos: {
          ...b.battleInfos,
          [isChalleger ? "userInvited" : "challenger"]: {
            ...b.battleInfos[isChalleger ? "userInvited" : "challenger"],
            socketId: socketId,
          },
        },
      }
      battle = updatedBattle
      return updatedBattle
    }
    return battle
  })

  return battle
}
