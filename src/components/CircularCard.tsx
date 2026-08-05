import type { MouseEvent as ReactMouseEvent } from 'react'
import type { CardImagePlacement, GameImage } from '../types/game'

interface CircularCardProps {
  placements?: CardImagePlacement[]
  readyImages?: GameImage[]
  interactive?: boolean
  tokenCreated?: boolean
  onActivate?: (rect: DOMRect) => void
}

export default function CircularCard({ placements, readyImages, interactive = false, tokenCreated = false, onActivate }: CircularCardProps) {
  const instruction = tokenCreated ? '정답자의 점수 버튼으로 옮기세요' : '카드를 눌러 점수 토큰을 꺼내세요'

  return (
    <section
      className={`circular-card${interactive ? ' is-interactive' : ''}`}
      aria-label={placements ? instruction : '게임 준비 카드'}
      onClick={(event: ReactMouseEvent<HTMLElement>) => interactive && onActivate?.(event.currentTarget.getBoundingClientRect())}
    >
      {placements ? (
        <div className="card-image-stage">
          {placements.map(({ image, order, xPercent, yPercent, sizePercent, rotationDeg }) => (
            <img
              className="card-question-image"
              key={image.id}
              src={image.src}
              alt={image.alt}
              draggable="false"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                width: `${sizePercent}%`,
                transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
                zIndex: order + 1,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="ready-icon-grid" aria-hidden="true">
          {readyImages?.map((image) => <img key={image.id} src={image.src} alt="" draggable="false" />)}
        </div>
      )}
      {placements && <p className="card-instruction">{instruction}</p>}
    </section>
  )
}
