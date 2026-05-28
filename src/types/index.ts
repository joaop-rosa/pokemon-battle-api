export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "grass"
  | "flying"
  | "fighting"
  | "poison"
  | "electric"
  | "ground"
  | "rock"
  | "psychic"
  | "ice"
  | "bug"
  | "ghost"
  | "steel"
  | "dragon"
  | "dark"
  | "fairy"

export interface Stats {
  hp: number
  attack: number
  defense: number
  "special-attack": number
  "special-defense": number
  speed: number
}

export interface Sprites {
  miniature: string
  front: string
  back: string
  battleFront?: string
  battleBack?: string
}

export interface Move {
  name: string
  url: string
  type: PokemonType
  power: number
  accuracy: number
  pp: number
  damageClass: "Physical" | "Special" | "Status"
  priority: number
}

export interface Pokemon {
  id: string
  partyId?: string // Usado na montagem da party antes da batalha
  name: string
  isActive: boolean
  currentLife: number
  types: PokemonType[]
  stats: Stats
  moves: Record<string, Move>
  movesSelected?: Move[] // Usado na party antes da batalha
  sprites: Sprites
}

export interface BattleUser {
  name: string
  socketId: string
  party: Pokemon[]
}

export interface ActionValue {
  name?: string
  id?: string
}

export interface Action {
  actionKey: "ATTACK" | "CHANGE"
  actionValue: ActionValue
}

export interface BattleLogEntry {
  round: number
  owner?: Action
  userInvited?: Action
}

export interface Battle {
  battleId: string
  owner: BattleUser
  userInvited: BattleUser
  round: number
  battleLog: BattleLogEntry[]
  messages: string[]
  isOver: boolean
  winner: string
}

export interface SocketData {
  name?: string
  party?: Pokemon[]
  color?: string
}
