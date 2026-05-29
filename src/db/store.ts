import type { Action, Battle, BattleUser, Pokemon } from "../types/index.js"
import {
  changeActivePokemon,
  getMove,
  isActivePokemonAlive,
  isAllPokemonDeads,
  isChallegerFirst,
  processDamage,
} from "../utils/battleHelpers.js"

export let battles: Battle[] = []

/* BATTLES */
export function addBattles(battleId: string, owner: BattleUser, userInvited: BattleUser): Battle {
  const newBattle: Battle = {
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

export function findBattleByid(battleId: string): Battle | undefined {
  return battles.find((b) => b.battleId === battleId)
}

export function battleCanBeProcessed(battleId: string): boolean {
  const battle = findBattleByid(battleId)
  if (!battle) return false

  const { battleLog, round } = battle
  const roundLog = battleLog.find((bl) => bl.round === round)

  return !!(roundLog && Object.keys(roundLog).length === 3)
}

export function updateBattleLog(battleIdParam: string, log: Action, username: string): void {
  const battle = findBattleByid(battleIdParam)
  if (!battle) return

  const { owner, round, battleLog, battleId } = battle
  const isOwner = owner.name === username

  if (battleLog.find((bl) => bl.round === round)) {
    battles = battles.map((b) => {
      if (b.battleId === battleId) {
        b.battleLog = b.battleLog.map((bl) => {
          if (bl.round === round) {
            return {
              ...bl,
              [isOwner ? "owner" : "userInvited"]: log,
            }
          }
          return bl
        })
      }
      return b
    })
  } else {
    battles = battles.map((b) => {
      if (b.battleId === battleId) {
        b.battleLog = [
          ...b.battleLog,
          {
            round,
            [isOwner ? "owner" : "userInvited"]: log,
          },
        ]
      }
      return b
    })
  }
}

export function updateBattleParty(battleId: string, username: string, newPokemonId: string): void {
  battles = battles.map((battle) => {
    if (battle.battleId === battleId) {
      const isOwner = battle.owner.name === username
      const modifiedBattle = { ...battle }

      if (isOwner) {
        modifiedBattle.owner.party = changeActivePokemon(modifiedBattle.owner.party, newPokemonId)
      } else {
        modifiedBattle.userInvited.party = changeActivePokemon(
          modifiedBattle.userInvited.party,
          newPokemonId,
        )
      }

      return modifiedBattle
    }
    return battle
  })
}

function getActivePokemonFromParty(party: Pokemon[]): Pokemon | undefined {
  return party.find((p) => p.isActive)
}

export function processBattleEntries(battleId: string): void {
  const battle = findBattleByid(battleId)
  if (!battle) return

  const { battleLog, round, owner, userInvited } = battle
  const roundLog = battleLog.find((bl) => bl.round === round)

  if (!roundLog?.owner || !roundLog.userInvited) return

  const { owner: ownerLog, userInvited: userInvitedLog } = roundLog

  battles = battles.map((b) => {
    if (b.battleId === battleId) {
      const modifiedBattle: Battle = {
        ...b,
        round: b.round + 1,
      }

      const ownerActivePokemon = getActivePokemonFromParty(owner.party)
      const userInvitedActivePokemon = getActivePokemonFromParty(userInvited.party)

      if (!ownerActivePokemon || !userInvitedActivePokemon) return b

      const ownerMove = getMove(ownerActivePokemon, ownerLog.actionValue.name || "")
      const userInvitedMove = getMove(
        userInvitedActivePokemon,
        userInvitedLog.actionValue.name || "",
      )

      if (
        ownerLog.actionKey === "ATTACK" &&
        userInvitedLog.actionKey === "ATTACK" &&
        ownerMove &&
        userInvitedMove
      ) {
        const isOwnerAttackFirst = isChallegerFirst(
          ownerActivePokemon.stats.speed,
          ownerMove.priority,
          userInvitedActivePokemon.stats.speed,
          userInvitedMove.priority,
        )

        if (isOwnerAttackFirst) {
          const { message: userInvitedMessage, party: userInvitedParty } = processDamage(
            modifiedBattle.userInvited.party,
            ownerMove,
            ownerActivePokemon,
          )

          modifiedBattle.userInvited.party = userInvitedParty
          modifiedBattle.messages.push(userInvitedMessage)

          if (isActivePokemonAlive(modifiedBattle.userInvited.party)) {
            const { message: ownerMessage, party: ownerParty } = processDamage(
              modifiedBattle.owner.party,
              userInvitedMove,
              userInvitedActivePokemon,
            )

            modifiedBattle.owner.party = ownerParty
            modifiedBattle.messages.push(ownerMessage)
          }
        } else {
          const { message: ownerMessage, party: ownerParty } = processDamage(
            modifiedBattle.owner.party,
            userInvitedMove,
            userInvitedActivePokemon,
          )

          modifiedBattle.owner.party = ownerParty
          modifiedBattle.messages.push(ownerMessage)

          if (isActivePokemonAlive(modifiedBattle.owner.party)) {
            const { message: userInvitedMessage, party: userInvitedParty } = processDamage(
              modifiedBattle.userInvited.party,
              ownerMove,
              ownerActivePokemon,
            )

            modifiedBattle.userInvited.party = userInvitedParty
            modifiedBattle.messages.push(userInvitedMessage)
          }
        }
      } else {
        if (ownerLog.actionKey === "CHANGE" && ownerLog.actionValue.id) {
          modifiedBattle.owner.party = changeActivePokemon(
            modifiedBattle.owner.party,
            ownerLog.actionValue.id,
          )

          const newActivePokemon = getActivePokemonFromParty(modifiedBattle.owner.party)
          if (newActivePokemon) {
            modifiedBattle.messages.push(
              `${owner.name} trocou para o pokemon ${newActivePokemon.name}`,
            )
          }
        }

        if (userInvitedLog.actionKey === "CHANGE" && userInvitedLog.actionValue.id) {
          modifiedBattle.userInvited.party = changeActivePokemon(
            modifiedBattle.userInvited.party,
            userInvitedLog.actionValue.id,
          )

          const newActivePokemon = getActivePokemonFromParty(modifiedBattle.userInvited.party)
          if (newActivePokemon) {
            modifiedBattle.messages.push(
              `${userInvited.name} trocou para o pokemon ${newActivePokemon.name}`,
            )
          }
        }

        if (ownerLog.actionKey === "ATTACK" && ownerMove) {
          const { message: userInvitedMessage, party: userInvitedParty } = processDamage(
            modifiedBattle.userInvited.party,
            ownerMove,
            ownerActivePokemon,
          )

          modifiedBattle.userInvited.party = userInvitedParty
          modifiedBattle.messages.push(userInvitedMessage)
        }

        if (userInvitedLog.actionKey === "ATTACK" && userInvitedMove) {
          const { message: ownerMessage, party: ownerParty } = processDamage(
            modifiedBattle.owner.party,
            userInvitedMove,
            userInvitedActivePokemon,
          )

          modifiedBattle.owner.party = ownerParty
          modifiedBattle.messages.push(ownerMessage)
        }
      }

      return modifiedBattle
    }

    return b
  })
}

export function isBattleOver(battleId: string): boolean {
  const battle = findBattleByid(battleId)
  if (!battle) return false

  const isAllPokemonDeadsUserInvited = isAllPokemonDeads(battle.userInvited.party)
  const isAllPokemonDeadsOwner = isAllPokemonDeads(battle.owner.party)

  return isAllPokemonDeadsUserInvited || isAllPokemonDeadsOwner
}

export function finishBattle(battleId: string): void {
  battles = battles.map((battle) => {
    if (battle.battleId === battleId) {
      const isAllPokemonDeadsUserInvited = isAllPokemonDeads(battle.userInvited.party)
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

export function findAndUpdateUserBattle(username: string, socketId: string): Battle | null {
  const hasBattleOngoing = battles.some(
    (battle) =>
      !battle.isOver && (battle.userInvited.name === username || battle.owner.name === username),
  )

  if (!hasBattleOngoing) {
    return null
  }

  let battle: Battle | null = null
  battles = battles.map((b) => {
    const isOwner = b.owner.name === username
    const isInvited = b.userInvited.name === username
    if (!b.isOver && (isOwner || isInvited)) {
      const updatedBattle = {
        ...b,
      }

      if (isOwner) {
        updatedBattle.owner = {
          ...b.owner,
          socketId: socketId,
        }
      } else {
        updatedBattle.userInvited = {
          ...b.userInvited,
          socketId: socketId,
        }
      }

      battle = updatedBattle
      return updatedBattle
    }
    return b
  })

  return battle
}
