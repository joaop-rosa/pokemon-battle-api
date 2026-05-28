import type { Socket } from "socket.io"

export function socketIsInBattle(socket: Socket): boolean {
  let isInBattle = false
  for (const [_, set] of (socket as any).adapter.rooms) {
    if (set.size > 1 && set.has(socket.id)) {
      isInBattle = true
    }
  }

  return isInBattle
}
