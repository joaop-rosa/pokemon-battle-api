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
export function addChallenge(socketIdOwner, userInvitedName) {
  challengesList = [
    ...challengesList,
    {
      challengeId: crypto.randomUUID(),
      owner: getUserById(socketIdOwner),
      userInvited: getUserByName(userInvitedName),
    },
  ]
}

export function removeChallenge(challengeId) {
  challengesList = challengesList.filter(
    (challenge) => challenge.challengeId !== challengeId
  )
}

/* BATTLES */
export function addBattles(owner, userInvited) {
  const newBattle = {
    battleId: owner.socketId,
    owner,
    userInvited,
    round: 1,
    battleLog: [],
    messages: [],
    isOver: false,
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
  const { owner, userInvited, round, battleLog, battleId } =
    findBattleByid(battleIdParam)
  const isOwner = owner.name === username
  if (battleLog.find((bl) => bl.round === round)) {
    battles = battles.map((battle) => {
      if (battle.battleId === battleId) {
        battle.battleLog = battle.battleLog.map((bl) => {
          if (bl.round === round) {
            return {
              ...bl,
              [isOwner ? "owner" : "userInvited"]: log,
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
            [isOwner ? "owner" : "userInvited"]: log,
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
      const user = battle.owner.name === username ? "owner" : "userInvited"
      let modifiedBattle = {
        ...battle,
      }

      modifiedBattle[user].party = changeActivePokemon(
        modifiedBattle[user].party,
        newPokemonId
      )

      return modifiedBattle
    }

    return battle
  })
}

export function processBattleEntries(battleId) {
  const { battleLog, round, owner, userInvited } = findBattleByid(battleId)
  const { owner: ownerLog, userInvited: userInvitedLog } = battleLog.find(
    (bl) => bl.round === round
  )
  battles = battles.map((battle) => {
    if (battle.battleId === battleId) {
      let modifiedBattle = {
        ...battle,
        round: battle.round + 1,
      }

      const ownerActivePokemon = Object.values(owner.party).find(
        (p) => p.isActive
      )

      const ownerMove = getMove(ownerActivePokemon, ownerLog.actionValue.name)

      const userInvitedActivePokemon = Object.values(userInvited.party).find(
        (p) => p.isActive
      )

      const userInvitedMove = getMove(
        userInvitedActivePokemon,
        userInvitedLog.actionValue.name
      )

      if (
        ownerLog.actionKey === "ATTACK" &&
        userInvitedLog.actionKey === "ATTACK"
      ) {
        const isChallengerAttackFirst = isChallegerFirst(
          ownerActivePokemon.stats.speed,
          ownerMove.priority,
          userInvitedActivePokemon.stats.speed,
          userInvitedMove.priority
        )

        if (isChallengerAttackFirst) {
          modifiedBattle.userInvited.party = processDamage(
            modifiedBattle.userInvited.party,
            ownerMove,
            ownerActivePokemon
          )

          if (isActivePokemonAlive(modifiedBattle.userInvited.party)) {
            modifiedBattle.owner.party = processDamage(
              modifiedBattle.owner.party,
              userInvitedMove,
              userInvitedActivePokemon
            )
          }
        } else {
          modifiedBattle.owner.party = processDamage(
            modifiedBattle.owner.party,
            userInvitedMove,
            userInvitedActivePokemon
          )

          if (isActivePokemonAlive(modifiedBattle.owner.party)) {
            modifiedBattle.owner.party = processDamage(
              modifiedBattle.owner.party,
              ownerMove,
              ownerActivePokemon
            )
          }
        }
      } else {
        if (ownerLog.actionKey === "CHANGE") {
          modifiedBattle.owner.party = changeActivePokemon(
            modifiedBattle.owner.party,
            ownerLog.actionValue.id
          )
        }

        if (userInvited.actionKey === "CHANGE") {
          modifiedBattle.userInvited.party = changeActivePokemon(
            modifiedBattle.userInvited.party,
            userInvited.actionValue.id
          )
        }

        if (ownerLog.actionKey === "ATTACK") {
          modifiedBattle.userInvited.party = processDamage(
            modifiedBattle.userInvited.party,
            ownerMove,
            ownerActivePokemon
          )
        }

        if (userInvited.actionKey === "ATTACK") {
          modifiedBattle.owner.party = processDamage(
            modifiedBattle.owner.party,
            userInvitedMove,
            userInvitedActivePokemon
          )
        }
      }

      const isAllPokemonDeadsUserInvited = isAllPokemonDeads(
        modifiedBattle.userInvited.party
      )
      const isAllPokemonDeadsChallenger = isAllPokemonDeads(
        modifiedBattle.owner.party
      )

      if (isAllPokemonDeadsUserInvited || isAllPokemonDeadsChallenger) {
        updateIsInBattle(modifiedBattle.owner.name, false)
        updateIsInBattle(modifiedBattle.userInvited.name, false)
        modifiedBattle.isOver = true
      }

      if (isAllPokemonDeadsUserInvited) {
        modifiedBattle.winner = modifiedBattle.owner.name
      }

      if (isAllPokemonDeadsChallenger) {
        modifiedBattle.winner = modifiedBattle.userInvited.name
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
      (battle.userInvited.name === username || battle.owner.name === username)
  )

  if (!hasBattleOngoing) {
    return null
  }

  let battle = null
  battles = battles.map((b) => {
    const isOwner = b.owner.name === username
    const isInvited = b.userInvited.name === username
    if (!b.isOver && (isChalleger || isInvited)) {
      const updatedBattle = {
        ...b,
        [isOwner ? "userInvited" : "owner"]: {
          ...b.battleInfos[isOwner ? "userInvited" : "owner"],
          socketId: socketId,
        },
      }
      battle = updatedBattle
      return updatedBattle
    }
    return battle
  })

  return battle
}
