import type { Move, Pokemon } from "../../src/types/index.js"
import {
  changeActivePokemon,
  effectivenessModifier,
  getMove,
  isActivePokemonAlive,
  isAllPokemonDeads,
  isChallegerFirst,
} from "../../src/utils/battleHelpers.js"

describe("battleHelpers", () => {
  describe("effectivenessModifier", () => {
    it("should return 2 for supereffective attacks (e.g. water vs fire)", () => {
      const modifier = effectivenessModifier("water", ["fire"])
      expect(modifier).toBe(2)
    })

    it("should return 0.5 for not very effective attacks (e.g. fire vs water)", () => {
      const modifier = effectivenessModifier("fire", ["water"])
      expect(modifier).toBe(0.5)
    })

    it("should return 0 for immune attacks (e.g. normal vs ghost)", () => {
      const modifier = effectivenessModifier("normal", ["ghost"])
      expect(modifier).toBe(0)
    })

    it("should handle dual types properly (e.g. electric vs water/flying)", () => {
      const modifier = effectivenessModifier("electric", ["water", "flying"])
      expect(modifier).toBe(4) // 2 * 2 = 4
    })
  })

  describe("isActivePokemonAlive", () => {
    it("should return true if active pokemon has HP > 0", () => {
      const party = [
        { isActive: true, currentLife: 10 } as Pokemon,
        { isActive: false, currentLife: 0 } as Pokemon,
      ]
      expect(isActivePokemonAlive(party)).toBe(true)
    })

    it("should return false if active pokemon has HP 0", () => {
      const party = [
        { isActive: true, currentLife: 0 } as Pokemon,
        { isActive: false, currentLife: 10 } as Pokemon,
      ]
      expect(isActivePokemonAlive(party)).toBe(false)
    })
  })

  describe("isAllPokemonDeads", () => {
    it("should return true if all pokemons have HP 0", () => {
      const party = [{ currentLife: 0 } as Pokemon, { currentLife: 0 } as Pokemon]
      expect(isAllPokemonDeads(party)).toBe(true)
    })

    it("should return false if at least one pokemon has HP > 0", () => {
      const party = [{ currentLife: 0 } as Pokemon, { currentLife: 10 } as Pokemon]
      expect(isAllPokemonDeads(party)).toBe(false)
    })
  })

  describe("changeActivePokemon", () => {
    it("should change the active pokemon by id", () => {
      const party = [
        { id: "1", isActive: true } as Pokemon,
        { id: "2", isActive: false } as Pokemon,
      ]
      const newParty = changeActivePokemon(party, "2")
      expect(newParty[0].isActive).toBe(false)
      expect(newParty[1].isActive).toBe(true)
    })
  })

  describe("getMove", () => {
    it("should find the move by name", () => {
      const pokemon = {
        moves: {
          move1: { name: "Tackle" } as Move,
          move2: { name: "Water Gun" } as Move,
        },
      } as unknown as Pokemon

      const move = getMove(pokemon, "Water Gun")
      expect(move?.name).toBe("Water Gun")
    })
  })

  describe("isChallegerFirst", () => {
    it("should be based on speed if priorities are undefined or equal", () => {
      expect(isChallegerFirst(100, undefined, 50, undefined)).toBe(true)
      expect(isChallegerFirst(50, undefined, 100, undefined)).toBe(false)
    })

    it("should prioritize the higher move priority", () => {
      expect(isChallegerFirst(50, 1, 100, undefined)).toBe(true)
      expect(isChallegerFirst(100, undefined, 50, 1)).toBe(false)
    })

    it("should fall back to speed if priorities are the same", () => {
      expect(isChallegerFirst(100, 1, 50, 1)).toBe(true)
      expect(isChallegerFirst(50, 1, 100, 1)).toBe(false)
    })
  })
})
