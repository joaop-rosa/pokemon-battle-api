export function socketIsInBattle(socket) {
  let isInBattle = false
  console.log(socket.adapter.rooms)
  for (const [_, set] of socket.adapter.rooms) {
    if (set.size > 1 && set.has(socket.id)) {
      isInBattle = true
    }
  }

  return isInBattle
}
