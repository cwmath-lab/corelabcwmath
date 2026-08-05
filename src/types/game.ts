export type DataCategory = 'sound' | 'image' | 'text' | 'number'

export type PlayerPosition = 'top' | 'right' | 'bottom' | 'left'

export type GamePhase =
  | 'ready'
  | 'playing'
  | 'tokenActive'
  | 'transitioning'
  | 'celebrating'
  | 'review'

export interface GameImage {
  id: string
  category: DataCategory
  src: string
  alt: string
}

export interface CardImagePlacement {
  image: GameImage
  order: number
  xPercent: number
  yPercent: number
  sizePercent: number
  rotationDeg: number
}

export interface GameCard {
  id: string
  missingCategory: DataCategory
  images: CardImagePlacement[]
}

export interface DeckValidationResult {
  valid: boolean
  errors: string[]
  categoryAppearances: Record<DataCategory, number>
  missingCategoryCounts: Record<DataCategory, number>
  imageUsageCounts: Record<string, number>
}

export interface PlayerScore {
  position: PlayerPosition
  score: number
}

export interface PlayerScores {
  top: number
  right: number
  bottom: number
  left: number
}

export interface GameState {
  phase: GamePhase
  deck: GameCard[]
  currentCardIndex: number
  scores: PlayerScores
  tokenCreated: boolean
}
