import crypto from "crypto"

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

export function updateIsInBattle(socketId, isInBattle = true) {
  connectedUsers = connectedUsers.map((user) => {
    if (user.socketId === socketId) {
      return { ...user, isInBattle }
    }
    return user
  })
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

function isChallegerFirst(
  challengerActivePokemonSpeed,
  challergerSelectedMovePriority,
  userInvitedActivePokemonSpeed,
  userInvitedSelectedMovePriority
) {
  if (challergerSelectedMovePriority && userInvitedSelectedMovePriority) {
    return challengerActivePokemonSpeed > userInvitedActivePokemonSpeed
  }

  if (challergerSelectedMovePriority) {
    return true
  }

  if (userInvitedSelectedMovePriority) {
    return false
  }

  return challengerActivePokemonSpeed > userInvitedActivePokemonSpeed
}

function getMove(activePokemon, selectedMove) {
  return Object.values(activePokemon.moves)
    .filter(Boolean)
    .find((m) => {
      return m.name === selectedMove
    })
}

function processDamage(party, move) {
  const isHitAttack =
    !move.accuracy || move.accuracy >= Math.floor(Math.random() * 101)

  if (!isHitAttack) {
    console.log(`${move.name} errou`)
    return party
  }

  console.log(`${move.name} acertou causando ${move.power}`)

  return party.map((p) => {
    if (p.isActive) {
      return {
        ...p,
        currentLife: p.currentLife - move.power,
      }
    }

    return p
  })
}

function isActivePokemonAlive(party) {
  return party.find((p) => p.isActive).currentLife > 0
}

function isAllPokemonDeads(party) {
  return !party.some((p) => p.currentLife > 0)
}

function changeActivePokemon(party, newPokemonId) {
  return party.map((p) => {
    return {
      ...p,
      isActive: p.id === newPokemonId,
    }
  })
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

  console.log("battles", battles)
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
            challengerMove
          )

          if (
            isActivePokemonAlive(modifiedBattle.battleInfos.userInvited.party)
          ) {
            modifiedBattle.battleInfos.challenger.party = processDamage(
              modifiedBattle.battleInfos.challenger.party,
              userInvitedMove
            )
          }
        } else {
          modifiedBattle.battleInfos.challenger.party = processDamage(
            modifiedBattle.battleInfos.challenger.party,
            userInvitedMove
          )

          if (
            isActivePokemonAlive(modifiedBattle.battleInfos.userInvited.party)
          ) {
            modifiedBattle.battleInfos.userInvited.party = processDamage(
              modifiedBattle.battleInfos.userInvited.party,
              challengerMove
            )
          }
        }

        if (isAllPokemonDeads(modifiedBattle.battleInfos.userInvited.party)) {
          modifiedBattle.isOver = true
          modifiedBattle.winner = modifiedBattle.battleInfos.challenger.name
        }

        if (isAllPokemonDeads(modifiedBattle.battleInfos.challenger.party)) {
          modifiedBattle.isOver = true
          modifiedBattle.winner = modifiedBattle.battleInfos.userInvited.name
        }

        return modifiedBattle
      }

      if (challenger.actionKey === "CHANGE") {
        modifiedBattle.battleInfos.challenger.party = changeActivePokemon(
          modifiedBattle.battleInfos.challenger.party,
          challenger.actionValue.id
        )
      }

      if (userInvited.actionKey === "CHANGE") {
        modifiedBattle.userInvited.challenger.party = changeActivePokemon(
          modifiedBattle.battleInfos.userInvited.party,
          userInvited.actionValue.id
        )
      }

      if (challenger.actionKey === "ATTACK") {
        modifiedBattle.battleInfos.userInvited.party = processDamage(
          modifiedBattle.battleInfos.userInvited.party,
          challengerMove
        )
      }

      if (userInvited.actionKey === "ATTACK") {
        modifiedBattle.battleInfos.challenger.party = processDamage(
          modifiedBattle.battleInfos.challenger.party,
          userInvitedMove
        )
      }

      if (isAllPokemonDeads(modifiedBattle.battleInfos.userInvited.party)) {
        modifiedBattle.isOver = true
        modifiedBattle.winner = modifiedBattle.battleInfos.challenger.name
      }

      if (isAllPokemonDeads(modifiedBattle.battleInfos.challenger.party)) {
        modifiedBattle.isOver = true
        modifiedBattle.winner = modifiedBattle.battleInfos.userInvited.name
      }

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
