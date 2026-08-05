import { useEffect, useMemo, useRef } from 'react'
import { CATEGORY_ICONS, CATEGORY_LABELS, DATA_CATEGORIES, PLAYER_POSITIONS } from '../data/gameTypes'
import { getWinningPositions } from '../utils/gameState'
import { groupUniqueUsedImages } from '../utils/imageReview'
import type { GameCard, PlayerPosition, PlayerScores } from '../types/game'

const PLAYER_LABELS: Record<PlayerPosition, string> = { top: '상단', right: '오른쪽', bottom: '하단', left: '왼쪽' }

interface CategoryReviewProps {
  deck: GameCard[]
  scores: PlayerScores
  onNewGame: () => void
  onReady: () => void
}

export default function CategoryReview({ deck, scores, onNewGame, onReady }: CategoryReviewProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const groupedImages = useMemo(() => groupUniqueUsedImages(deck), [deck])
  const winners = getWinningPositions(scores)

  useEffect(() => {
    titleRef.current?.focus()
    if (import.meta.env.DEV) {
      console.info('[image-review]', Object.fromEntries(DATA_CATEGORIES.map((category) => [category, groupedImages[category].length])))
    }
  }, [groupedImages])

  return (
    <main className="review-screen" aria-labelledby="review-title">
      <header className="review-header">
        <div><h1 ref={titleRef} id="review-title" tabIndex={-1}>게임에서 만난 데이터 유형</h1><p>사용한 이미지들을 네 가지 데이터 유형으로 다시 살펴보세요.</p></div>
        <div className="review-actions"><button className="review-primary-button" type="button" onClick={onNewGame}>새 게임</button><button className="review-secondary-button" type="button" onClick={onReady}>처음 화면으로</button></div>
      </header>

      <section className="review-final-scores" aria-label="최종 점수">
        {PLAYER_POSITIONS.map((position) => <div className={`review-score review-score--${position}${winners.includes(position) ? ' is-highest' : ''}`} key={position}><span>{PLAYER_LABELS[position]} 플레이어</span><strong>{scores[position]}점</strong></div>)}
      </section>

      <section className="category-review-grid">
        {DATA_CATEGORIES.map((category) => (
          <article className={`category-review-card category-review-card--${category}`} key={category}>
            <header><img src={CATEGORY_ICONS[category]} alt="" /><div><h2>{CATEGORY_LABELS[category]} 데이터</h2><span>{groupedImages[category].length}개 이미지</span></div></header>
            <div className="review-thumbnail-grid">{groupedImages[category].map((image) => <div className="review-thumbnail" key={image.id}><img src={image.src} alt="" /></div>)}</div>
          </article>
        ))}
      </section>

      <section className="review-questions" aria-labelledby="questions-title"><h2 id="questions-title">함께 생각해 봐요</h2><p>어떤 특징을 보고 데이터 유형을 구분했나요?</p><p>같은 대상도 서로 다른 데이터 유형으로 표현할 수 있을까요?</p></section>
    </main>
  )
}
