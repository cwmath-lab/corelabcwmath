import { describe, expect, it } from 'vitest'
import type { GameCard, PlayerPosition } from '../types/game'
import { advanceAfterScore, awardScore, createReadyGameState, createScoreToken, finishCelebration, getWinningPositions, returnToReady, startGame } from './gameState'
import { findDropTarget } from './dropTarget'

function makeDeck(): GameCard[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `card-${index}`,
    missingCategory: 'sound',
    images: [],
  }))
}

describe('게임 점수 흐름', () => {
  it('게임 시작 시 네 점수와 카드 번호를 초기화한다', () => {
    const state = startGame(createReadyGameState(), makeDeck())
    expect(state.scores).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
    expect(state.currentCardIndex).toBe(0)
    expect(state.phase).toBe('playing')
  })

  it.each<PlayerPosition>(['top', 'right', 'bottom', 'left'])('%s 플레이어 점수만 10 증가한다', (position) => {
    const active = createScoreToken(startGame(createReadyGameState(), makeDeck()))
    const scored = awardScore(active, position)
    expect(scored.scores[position]).toBe(10)
    expect(Object.entries(scored.scores).filter(([key]) => key !== position).every(([, score]) => score === 0)).toBe(true)
  })

  it('한 카드에서 점수를 두 번 처리하지 않는다', () => {
    const active = createScoreToken(startGame(createReadyGameState(), makeDeck()))
    const scored = awardScore(active, 'top')
    expect(awardScore(scored, 'top')).toBe(scored)
    expect(scored.scores.top).toBe(10)
  })

  it('유효하지 않은 드롭에서는 점수를 변경하지 않는다', () => {
    const active = createScoreToken(startGame(createReadyGameState(), makeDeck()))
    const target = findDropTarget({ x: 500, y: 500 }, { top: { left: 0, right: 100, top: 0, bottom: 100 } })
    expect(target).toBeNull()
    expect(active.scores).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
    expect(active.phase).toBe('tokenActive')
  })

  it('유효한 드롭 처리 후 다음 카드 번호가 증가한다', () => {
    const active = createScoreToken(startGame(createReadyGameState(), makeDeck()))
    const next = advanceAfterScore(awardScore(active, 'right'))
    expect(next.currentCardIndex).toBe(1)
    expect(next.phase).toBe('playing')
    expect(next.tokenCreated).toBe(false)
  })

  it('20번째 카드 점수 처리 후 celebrating 상태가 된다', () => {
    const started = startGame(createReadyGameState(), makeDeck())
    const lastCard = { ...started, currentCardIndex: 19 } as const
    const celebrating = advanceAfterScore(awardScore(createScoreToken(lastCard), 'bottom'))
    expect(celebrating.phase).toBe('celebrating')
    expect(celebrating.scores.bottom).toBe(10)
    expect(finishCelebration(celebrating).phase).toBe('review')
  })

  it('처음 화면으로 돌아가면 ready 상태와 빈 덱이 된다', () => {
    expect(returnToReady()).toEqual(createReadyGameState())
  })

  it('가장 높은 점수의 동점자를 모두 반환한다', () => {
    expect(getWinningPositions({ top: 20, right: 30, bottom: 10, left: 30 })).toEqual(['right', 'left'])
    expect(getWinningPositions({ top: 0, right: 0, bottom: 0, left: 0 })).toEqual(['top', 'right', 'bottom', 'left'])
  })

  it('새 게임을 시작하면 점수, 카드 번호와 토큰을 초기화한다', () => {
    const active = createScoreToken(startGame(createReadyGameState(), makeDeck()))
    const scored = awardScore(active, 'left')
    const restarted = startGame(scored, makeDeck())
    expect(restarted.scores).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
    expect(restarted.currentCardIndex).toBe(0)
    expect(restarted.tokenCreated).toBe(false)
    expect(restarted.phase).toBe('playing')
  })
})

describe('findDropTarget', () => {
  const targets = {
    top: { left: 40, right: 100, top: 10, bottom: 70 },
    right: { left: 100, right: 160, top: 40, bottom: 100 },
  }

  it('중심점이 버튼 영역 안에 있으면 해당 위치를 반환한다', () => {
    expect(findDropTarget({ x: 65, y: 35 }, targets, 0)).toBe('top')
  })

  it('겹친 허용 영역에서는 중심이 더 가까운 버튼을 반환한다', () => {
    expect(findDropTarget({ x: 105, y: 65 }, targets, 12)).toBe('right')
  })

  it('중심점이 모든 버튼 밖에 있으면 null을 반환한다', () => {
    expect(findDropTarget({ x: 300, y: 300 }, targets)).toBeNull()
  })
})
