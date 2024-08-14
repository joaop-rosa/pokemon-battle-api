import {
  changeActivePokemon,
  getMove,
  isActivePokemonAlive,
  isAllPokemonDeads,
  isChallegerFirst,
  processDamage,
} from "./battles-helpers.js"

export let battles = []

/* BATTLES */
export function addBattles(battleId, owner, userInvited) {
  const newBattle = {
    battleId: battleId,
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
  const { owner, round, battleLog, battleId } = findBattleByid(battleIdParam)
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

      return modifiedBattle
    }

    return battle
  })
}

export function isBattleOver(battleId) {
  const battle = findBattleByid(battleId)

  const isAllPokemonDeadsUserInvited = isAllPokemonDeads(
    battle.userInvited.party
  )
  const isAllPokemonDeadsOwner = isAllPokemonDeads(battle.owner.party)

  return isAllPokemonDeadsUserInvited || isAllPokemonDeadsOwner
}

export function finishBattle(battleId) {
  battles = battles.map((battle) => {
    if (battle.battleId === battleId) {
      const isAllPokemonDeadsUserInvited = isAllPokemonDeads(
        battle.userInvited.party
      )
      const isAllPokemonDeadsOwner = isAllPokemonDeads(battle.owner.party)

      if (isAllPokemonDeadsUserInvited) {
        battle.winner = battle.owner.name
      }

      if (isAllPokemonDeadsOwner) {
        battle.winner = battle.userInvited.name
      }

      battle.isOver = true
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
