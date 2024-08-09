const POKEMON_TYPES = {
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

const TYPE_EFFECTIVE = {
  [POKEMON_TYPES.STEEL]: {
    advantage: [POKEMON_TYPES.FAIRY, POKEMON_TYPES.ICE, POKEMON_TYPES.ROCK],
    disadvantage: [
      POKEMON_TYPES.FIRE,
      POKEMON_TYPES.WATER,
      POKEMON_TYPES.ELECTRIC,
      POKEMON_TYPES.STEEL,
    ],
    imune: [],
  },
  [POKEMON_TYPES.WATER]: {
    advantage: [POKEMON_TYPES.FIRE, POKEMON_TYPES.ROCK, POKEMON_TYPES.GROUND],
    disadvantage: [
      POKEMON_TYPES.WATER,
      POKEMON_TYPES.GRASS,
      POKEMON_TYPES.DRAGON,
    ],
    imune: [],
  },
  [POKEMON_TYPES.DRAGON]: {
    advantage: [POKEMON_TYPES.DRAGON],
    disadvantage: [POKEMON_TYPES.STEEL],
    imune: [POKEMON_TYPES.FAIRY],
  },
  [POKEMON_TYPES.ELECTRIC]: {
    advantage: [POKEMON_TYPES.WATER, POKEMON_TYPES.FLYING],
    disadvantage: [
      POKEMON_TYPES.ELECTRIC,
      POKEMON_TYPES.GRASS,
      POKEMON_TYPES.DRAGON,
    ],
    imune: [POKEMON_TYPES.GROUND],
  },
  [POKEMON_TYPES.FAIRY]: {
    advantage: [
      POKEMON_TYPES.DRAGON,
      POKEMON_TYPES.FIGHTING,
      POKEMON_TYPES.DARK,
    ],
    disadvantage: [
      POKEMON_TYPES.STEEL,
      POKEMON_TYPES.POISON,
      POKEMON_TYPES.FIRE,
    ],
    imune: [],
  },
  [POKEMON_TYPES.GHOST]: {
    advantage: [POKEMON_TYPES.GHOST, POKEMON_TYPES.PSYCHIC],
    disadvantage: [POKEMON_TYPES.DARK],
    imune: [POKEMON_TYPES.NORMAL],
  },
  [POKEMON_TYPES.FIRE]: {
    advantage: [
      POKEMON_TYPES.STEEL,
      POKEMON_TYPES.ICE,
      POKEMON_TYPES.BUG,
      POKEMON_TYPES.GRASS,
    ],
    disadvantage: [
      POKEMON_TYPES.WATER,
      POKEMON_TYPES.ROCK,
      POKEMON_TYPES.FIRE,
      POKEMON_TYPES.DRAGON,
    ],
    imune: [],
  },
  [POKEMON_TYPES.ICE]: {
    advantage: [
      POKEMON_TYPES.DRAGON,
      POKEMON_TYPES.GRASS,
      POKEMON_TYPES.GROUND,
      POKEMON_TYPES.FLYING,
    ],
    disadvantage: [
      POKEMON_TYPES.FIRE,
      POKEMON_TYPES.STEEL,
      POKEMON_TYPES.WATER,
      POKEMON_TYPES.ICE,
    ],
    imune: [],
  },
  [POKEMON_TYPES.BUG]: {
    advantage: [POKEMON_TYPES.GRASS, POKEMON_TYPES.PSYCHIC, POKEMON_TYPES.DARK],
    disadvantage: [
      POKEMON_TYPES.FIRE,
      POKEMON_TYPES.FLYING,
      POKEMON_TYPES.FIGHTING,
      POKEMON_TYPES.POISON,
      POKEMON_TYPES.ROCK,
      POKEMON_TYPES.STEEL,
      POKEMON_TYPES.FAIRY,
    ],
    imune: [],
  },
  [POKEMON_TYPES.FIGHTING]: {
    advantage: [
      POKEMON_TYPES.STEEL,
      POKEMON_TYPES.ICE,
      POKEMON_TYPES.NORMAL,
      POKEMON_TYPES.ROCK,
      POKEMON_TYPES.DARK,
    ],
    disadvantage: [
      POKEMON_TYPES.FAIRY,
      POKEMON_TYPES.PSYCHIC,
      POKEMON_TYPES.FLYING,
      POKEMON_TYPES.POISON,
      POKEMON_TYPES.BUG,
    ],
    imune: [POKEMON_TYPES.GHOST],
  },
  [POKEMON_TYPES.NORMAL]: {
    advantage: [],
    disadvantage: [POKEMON_TYPES.ROCK, POKEMON_TYPES.STEEL],
    imune: [POKEMON_TYPES.GHOST],
  },
  [POKEMON_TYPES.ROCK]: {
    advantage: [
      POKEMON_TYPES.FIRE,
      POKEMON_TYPES.ICE,
      POKEMON_TYPES.BUG,
      POKEMON_TYPES.FLYING,
    ],
    disadvantage: [
      POKEMON_TYPES.FIGHTING,
      POKEMON_TYPES.GROUND,
      POKEMON_TYPES.STEEL,
    ],
    imune: [],
  },
  [POKEMON_TYPES.GRASS]: {
    advantage: [POKEMON_TYPES.WATER, POKEMON_TYPES.ROCK, POKEMON_TYPES.GROUND],
    disadvantage: [
      POKEMON_TYPES.FIRE,
      POKEMON_TYPES.BUG,
      POKEMON_TYPES.FLYING,
      POKEMON_TYPES.DRAGON,
      POKEMON_TYPES.POISON,
      POKEMON_TYPES.GRASS,
      POKEMON_TYPES.STEEL,
    ],
    imune: [],
  },
  [POKEMON_TYPES.PSYCHIC]: {
    advantage: [POKEMON_TYPES.FIGHTING, POKEMON_TYPES.POISON],
    disadvantage: [POKEMON_TYPES.PSYCHIC, POKEMON_TYPES.STEEL],
    imune: [POKEMON_TYPES.DARK],
  },
  [POKEMON_TYPES.DARK]: {
    advantage: [POKEMON_TYPES.GHOST, POKEMON_TYPES.PSYCHIC],
    disadvantage: [
      POKEMON_TYPES.FIGHTING,
      POKEMON_TYPES.FAIRY,
      POKEMON_TYPES.DARK,
    ],
    imune: [],
  },
  [POKEMON_TYPES.GROUND]: {
    advantage: [
      POKEMON_TYPES.ELECTRIC,
      POKEMON_TYPES.FIRE,
      POKEMON_TYPES.ROCK,
      POKEMON_TYPES.STEEL,
      POKEMON_TYPES.POISON,
    ],
    disadvantage: [POKEMON_TYPES.BUG, POKEMON_TYPES.GRASS],
    imune: [POKEMON_TYPES.FLYING],
  },
  [POKEMON_TYPES.POISON]: {
    advantage: [POKEMON_TYPES.FAIRY, POKEMON_TYPES.GRASS],
    disadvantage: [
      POKEMON_TYPES.GROUND,
      POKEMON_TYPES.POISON,
      POKEMON_TYPES.ROCK,
      POKEMON_TYPES.GHOST,
    ],
    imune: [POKEMON_TYPES.STEEL],
  },
  [POKEMON_TYPES.FLYING]: {
    advantage: [POKEMON_TYPES.BUG, POKEMON_TYPES.FIGHTING, POKEMON_TYPES.GRASS],
    disadvantage: [
      POKEMON_TYPES.ELECTRIC,
      POKEMON_TYPES.STEEL,
      POKEMON_TYPES.ROCK,
    ],
    imune: [],
  },
}

export function effectivenessModifier(attackType, attackedPokemonTypes) {
  let modifier = 1.0

  attackedPokemonTypes.forEach((attackedPokemonType) => {
    console.log("attackType", attackType)
    console.log("attackedPokemonTypes", attackedPokemonType)
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

  console.log("modifier", modifier)
  return modifier
}

export function processDamage(party, move, attackerPokemon) {
  const isHitAttack =
    !move.accuracy || move.accuracy >= Math.floor(Math.random() * 101)

  if (!isHitAttack) {
    console.log(`${move.name} errou`)
    return party
  }

  return party.map((p) => {
    if (p.isActive) {
      const defaultLevel = 50
      const randomFactor =
        (Math.floor(Math.random() * (100 - 85 + 1)) + 85) / 100
      const statsFactor =
        move.damageClass === "Physical"
          ? Math.round(attackerPokemon.stats.attack / p.stats.defense)
          : Math.round(
              attackerPokemon.stats["special-attack"] /
                p.stats["special-defense"]
            )
      const hasStab = attackerPokemon.types.includes(move.type)

      const levelDamage = (2 * defaultLevel) / 5 + 2

      let damage = Math.round((levelDamage * move.power * statsFactor) / 50 + 2)

      damage = Math.round(damage * randomFactor)

      if (hasStab) {
        damage = Math.round(damage * 1.5)
      }

      damage = Math.round(damage * effectivenessModifier(move.type, p.types))

      console.log(`${move.name} acertou causando ${damage}`)

      return {
        ...p,
        currentLife: p.currentLife - damage,
      }
    }

    return p
  })
}

export function isActivePokemonAlive(party) {
  return party.find((p) => p.isActive).currentLife > 0
}

export function isAllPokemonDeads(party) {
  return !party.some((p) => p.currentLife > 0)
}

export function changeActivePokemon(party, newPokemonId) {
  return party.map((p) => {
    return {
      ...p,
      isActive: p.id === newPokemonId,
    }
  })
}

export function getMove(activePokemon, selectedMove) {
  return Object.values(activePokemon.moves)
    .filter(Boolean)
    .find((m) => {
      return m.name === selectedMove
    })
}

export function isChallegerFirst(
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
