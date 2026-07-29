import { useEffect, useRef } from 'react'
import HeartFireworks from './HeartFireworks'
import { PLAYER_POSITIONS } from '../data/gameTypes'
import { getWinningPositions } from '../utils/gameState'
import type { PlayerPosition, PlayerScores } from '../types/game'

const LABELS: Record<PlayerPosition, string> = { top: '상단 플레이어', right: '오른쪽 플레이어', bottom: '하단 플레이어', left: '왼쪽 플레이어' }

export default function EndCelebration({ scores }: { scores: PlayerScores }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const winners = getWinningPositions(scores)
  useEffect(() => { titleRef.current?.focus() }, [])

  return (
    <div className="end-overlay celebration-overlay" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <HeartFireworks />
      <section className="celebration-card">
        <span className="celebration-symbol" aria-hidden="true">♥</span>
        <h2 ref={titleRef} id="celebration-title" tabIndex={-1}>20장의 카드를 모두 해결했어요!</h2>
        <div className="end-score-grid">
          {PLAYER_POSITIONS.map((position) => (
            <article className={`end-score-card end-score-card--${position}${winners.includes(position) ? ' is-highest' : ''}`} key={position}>
              <span>{LABELS[position]}</span><strong>{scores[position]}점</strong>
            </article>
          ))}
        </div>
        <p>잠시 후 사용한 데이터를 유형별로 확인해요.</p>
      </section>
    </div>
  )
}
