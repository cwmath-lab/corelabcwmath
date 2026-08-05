import type { GameState, PlayerPosition } from '../types/game'

export const EMPTY_SCORES = { top: 0, right: 0, bottom: 0, left: 0 } as const

export function createReadyGameState(): GameState {
  return { phase: 'ready', deck: [], currentCardIndex: 0, scores: { ...EMPTY_SCORES }, tokenCreated: false }
}

export function startGame(state: GameState, deck: GameState['deck']): GameState {
  if (deck.length !== 20) throw new Error(`게임 시작에는 20장의 카드가 필요합니다: ${deck.length}장`)
  return { ...state, phase: 'playing', deck, currentCardIndex: 0, scores: { ...EMPTY_SCORES }, tokenCreated: false }
}

export function createScoreToken(state: GameState): GameState {
  if (state.phase !== 'playing' || state.tokenCreated) return state
  return { ...state, phase: 'tokenActive', tokenCreated: true }
}

export function awardScore(state: GameState, position: PlayerPosition): GameState {
  if (state.phase !== 'tokenActive' || !state.tokenCreated) return state
  return {
    ...state,
    phase: 'transitioning',
    tokenCreated: false,
    scores: { ...state.scores, [position]: state.scores[position] + 10 },
  }
}

export function advanceAfterScore(state: GameState): GameState {
  if (state.phase !== 'transitioning') return state
  if (state.currentCardIndex >= state.deck.length - 1) return { ...state, phase: 'celebrating', tokenCreated: false }
  return { ...state, phase: 'playing', currentCardIndex: state.currentCardIndex + 1, tokenCreated: false }
}

export function finishCelebration(state: GameState): GameState {
  return state.phase === 'celebrating' ? { ...state, phase: 'review' } : state
}

export function returnToReady(): GameState {
  return createReadyGameState()
}

export function getWinningPositions(scores: GameState['scores']): PlayerPosition[] {
  const highestScore = Math.max(...Object.values(scores))
  return (Object.entries(scores) as [PlayerPosition, number][])
    .filter(([, score]) => score === highestScore)
    .map(([position]) => position)
}
