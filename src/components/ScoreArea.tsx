import { forwardRef } from 'react'
import type { PlayerPosition } from '../types/game'

interface ScoreAreaProps {
  position: PlayerPosition
  score: number
  highlighted: boolean
}

const POSITION_LABELS: Record<PlayerPosition, string> = {
  top: '위쪽',
  right: '오른쪽',
  bottom: '아래쪽',
  left: '왼쪽',
}

const ScoreArea = forwardRef<HTMLButtonElement, ScoreAreaProps>(function ScoreArea(
  { position, score, highlighted },
  ref,
) {
  return (
    <div className={`score-area score-area--${position}${highlighted ? ' is-highlighted' : ''}`}>
      <div className="score-display-wrap">
        <output className="score-display" aria-label={`${POSITION_LABELS[position]} 플레이어 ${score}점`}>
          {String(score).padStart(2, '0')}
        </output>
        {highlighted && <span className="score-float" aria-hidden="true">+10</span>}
      </div>
      <button
        ref={ref}
        className="score-button"
        type="button"
        data-player-position={position}
        aria-label={`${POSITION_LABELS[position]} 플레이어 점수 토큰 놓기 영역`}
      >
        <span>+10</span>
      </button>
    </div>
  )
})

export default ScoreArea
