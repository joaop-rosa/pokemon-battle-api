import type { Move, Pokemon, PokemonType } from "../types/index.js"

export const POKEMON_TYPES: Record<string, PokemonType> = {
  NORMAL: "normal",
  FIRE: "fire",
  WATER: "water",
  GRASS: "grass",
  FLYING: "flying",
  FIGHTING: "fighting",
  POISON: "poison",
  ELECTRIC: "electric",
  GROUND: "ground",
  ROCK: "rock",
  PSYCHIC: "psychic",
  ICE: "ice",
  BUG: "bug",
  GHOST: "ghost",
  STEEL: "steel",
  DRAGON: "dragon",
  DARK: "dark",
  FAIRY: "fairy",
}

export const TYPE_EFFECTIVE: Record<
  PokemonType,
  { advantage: PokemonType[]; disadvantage: PokemonType[]; imune: PokemonType[] }
> = {
  steel: {
    advantage: ["fairy", "ice", "rock"],
    disadvantage: ["fire", "water", "electric", "steel"],
    imune: [],
  },
  water: {
    advantage: ["fire", "rock", "ground"],
    disadvantage: ["water", "grass", "dragon"],
    imune: [],
  },
  dragon: {
    advantage: ["dragon"],
    disadvantage: ["steel"],
    imune: ["fairy"],
  },
  electric: {
    advantage: ["water", "flying"],
    disadvantage: ["electric", "grass", "dragon"],
    imune: ["ground"],
  },
  fairy: {
    advantage: ["dragon", "fighting", "dark"],
    disadvantage: ["steel", "poison", "fire"],
    imune: [],
  },
  ghost: {
    advantage: ["ghost", "psychic"],
    disadvantage: ["dark"],
    imune: ["normal"],
  },
  fire: {
    advantage: ["steel", "ice", "bug", "grass"],
    disadvantage: ["water", "rock", "fire", "dragon"],
    imune: [],
  },
  ice: {
    advantage: ["dragon", "grass", "ground", "flying"],
    disadvantage: ["fire", "steel", "water", "ice"],
    imune: [],
  },
  bug: {
    advantage: ["grass", "psychic", "dark"],
    disadvantage: ["fire", "flying", "fighting", "poison", "rock", "steel", "fairy"],
    imune: [],
  },
  fighting: {
    advantage: ["steel", "ice", "normal", "rock", "dark"],
    disadvantage: ["fairy", "psychic", "flying", "poison", "bug"],
    imune: ["ghost"],
  },
  normal: {
    advantage: [],
    disadvantage: ["rock", "steel"],
    imune: ["ghost"],
  },
  rock: {
    advantage: ["fire", "ice", "bug", "flying"],
    disadvantage: ["fighting", "ground", "steel"],
    imune: [],
  },
  grass: {
    advantage: ["water", "rock", "ground"],
    disadvantage: ["fire", "bug", "flying", "dragon", "poison", "grass", "steel"],
    imune: [],
  },
  psychic: {
    advantage: ["fighting", "poison"],
    disadvantage: ["psychic", "steel"],
    imune: ["dark"],
  },
  dark: {
    advantage: ["ghost", "psychic"],
    disadvantage: ["fighting", "fairy", "dark"],
    imune: [],
  },
  ground: {
    advantage: ["electric", "fire", "rock", "steel", "poison"],
    disadvantage: ["bug", "grass"],
    imune: ["flying"],
  },
  poison: {
    advantage: ["fairy", "grass"],
    disadvantage: ["ground", "poison", "rock", "ghost"],
    imune: ["steel"],
  },
  flying: {
    advantage: ["bug", "fighting", "grass"],
    disadvantage: ["electric", "steel", "rock"],
    imune: [],
  },
}

export function effectivenessModifier(
  attackType: PokemonType,
  attackedPokemonTypes: PokemonType[],
): number {
  let modifier = 1.0

  attackedPokemonTypes.forEach((attackedPokemonType) => {
    if (TYPE_EFFECTIVE[attackType].advantage.includes(attackedPokemonType)) {
      modifier *= 2
    }
    if (TYPE_EFFECTIVE[attackType].disadvantage.includes(attackedPokemonType)) {
      modifier *= 0.5
    }
    if (TYPE_EFFECTIVE[attackType].imune.includes(attackedPokemonType)) {
      modifier *= 0
    }
  })

  return modifier
}

export function processDamage(
  party: Pokemon[],
  move: Move,
  attackerPokemon: Pokemon,
): { message: string; party: Pokemon[] } {
  let message = ""
  let partyModified = party

  const isHitAttack = !move.accuracy || move.accuracy >= Math.floor(Math.random() * 101)

  if (!isHitAttack) {
    message = `${attackerPokemon.name} missed the attack ${move.name}`
  } else {
    partyModified = party.map((p) => {
      if (p.isActive) {
        const defaultLevel = 50
        const randomFactor = (Math.floor(Math.random() * (100 - 85 + 1)) + 85) / 100
        const statsFactor =
          move.damageClass === "Physical"
            ? Math.round(attackerPokemon.stats.attack / p.stats.defense)
            : Math.round(attackerPokemon.stats["special-attack"] / p.stats["special-defense"])
        const hasStab = attackerPokemon.types.includes(move.type)

        const levelDamage = (2 * defaultLevel) / 5 + 2

        let damage = Math.round((levelDamage * move.power * statsFactor) / 50 + 2)

        damage = Math.round(damage * randomFactor)

        if (hasStab) {
          damage = Math.round(damage * 1.5)
        }

        const modifier = effectivenessModifier(move.type, p.types)
        damage = Math.round(damage * modifier)

        if (modifier >= 2) {
          message = `${attackerPokemon.name} used ${move.name} and dealt ${damage} super effective damage`
        } else if (modifier === 0) {
          message = `${attackerPokemon.name} used ${move.name} but it had no effect on the opponent`
        } else if (modifier < 1) {
          message = `${attackerPokemon.name} used ${move.name} and dealt ${damage} not very effective damage`
        } else {
          message = `${attackerPokemon.name} used ${move.name} and dealt ${damage} damage`
        }

        return {
          ...p,
          currentLife: p.currentLife - damage,
        }
      }

      return p
    })
  }

  return { message, party: partyModified }
}

export function isActivePokemonAlive(party: Pokemon[]): boolean {
  const activePokemon = party.find((p) => p.isActive)
  return activePokemon ? activePokemon.currentLife > 0 : false
}

export function isAllPokemonDeads(party: Pokemon[]): boolean {
  return !party.some((p) => p.currentLife > 0)
}

export function changeActivePokemon(party: Pokemon[], newPokemonId: string): Pokemon[] {
  return party.map((p) => {
    return {
      ...p,
      isActive: p.id === newPokemonId,
    }
  })
}

export function getMove(activePokemon: Pokemon, selectedMove: string): Move | undefined {
  return Object.values(activePokemon.moves)
    .filter(Boolean)
    .find((m) => {
      return m.name === selectedMove
    })
}

export function isChallegerFirst(
  challengerActivePokemonSpeed: number,
  challergerSelectedMovePriority: number | undefined,
  userInvitedActivePokemonSpeed: number,
  userInvitedSelectedMovePriority: number | undefined,
): boolean {
  if (challergerSelectedMovePriority && userInvitedSelectedMovePriority) {
    if (challergerSelectedMovePriority === userInvitedSelectedMovePriority) {
      return challengerActivePokemonSpeed > userInvitedActivePokemonSpeed
    }
    return challergerSelectedMovePriority > userInvitedSelectedMovePriority
  }

  if (challergerSelectedMovePriority) {
    return true
  }

  if (userInvitedSelectedMovePriority) {
    return false
  }

  return challengerActivePokemonSpeed > userInvitedActivePokemonSpeed
}
