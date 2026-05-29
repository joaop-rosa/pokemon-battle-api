import {
  addBattles,
  battleCanBeProcessed,
  findBattleByid,
  updateBattleLog,
} from "../../src/db/store.js"
import type { BattleUser } from "../../src/types/index.js"

describe("Store", () => {
  it("should add and find a battle", () => {
    const owner = { name: "Ash", socketId: "1", party: [] } as BattleUser
    const userInvited = { name: "Gary", socketId: "2", party: [] } as BattleUser

    const newBattle = addBattles("battle-1", owner, userInvited)

    expect(newBattle.battleId).toBe("battle-1")
    expect(newBattle.owner.name).toBe("Ash")
    expect(newBattle.round).toBe(1)

    const foundBattle = findBattleByid("battle-1")
    expect(foundBattle).toBeDefined()
    expect(foundBattle?.battleId).toBe("battle-1")
  })

  it("should track battle log and know when it can be processed", () => {
    // Both players must send their action to be processed
    updateBattleLog("battle-1", { actionKey: "ATTACK", actionValue: { name: "Tackle" } }, "Ash")
    expect(battleCanBeProcessed("battle-1")).toBe(false) // Only Ash made a move

    updateBattleLog("battle-1", { actionKey: "CHANGE", actionValue: { id: "2" } }, "Gary")
    expect(battleCanBeProcessed("battle-1")).toBe(true) // Both made a move
  })
})
