import { describe, expect, it } from 'vitest'
import { DATA_CATEGORIES } from '../data/gameTypes'
import type { GameCard, GameImage } from '../types/game'
import { groupUniqueUsedImages } from './imageReview'

function makeImages(): GameImage[] {
  return DATA_CATEGORIES.flatMap((category) => Array.from({ length: 10 }, (_, index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    category,
    src: `/${category}/${index}.svg`,
    alt: '',
  })))
}

function makeDeck(images: GameImage[]): GameCard[] {
  return Array.from({ length: 20 }, (_, cardIndex) => ({
    id: `card-${cardIndex}`,
    missingCategory: DATA_CATEGORIES[cardIndex % 4],
    images: [0, 1, 2].map((offset, order) => ({
      image: images[(cardIndex * 3 + offset) % images.length],
      order, xPercent: 50, yPercent: 50, sizePercent: 25, rotationDeg: 0,
    })),
  }))
}

describe('groupUniqueUsedImages', () => {
  it('덱에서 중복 없는 이미지 40개를 유형별 10개씩 추출한다', () => {
    const images = makeImages()
    const grouped = groupUniqueUsedImages(makeDeck(images))
    expect(Object.values(grouped).flat()).toHaveLength(40)
    for (const category of DATA_CATEGORIES) expect(grouped[category]).toHaveLength(10)
  })

  it('같은 이미지가 여러 카드와 같은 카드에 중복돼도 ID 기준 한 번만 표시한다', () => {
    const image = makeImages()[0]
    const placement = { image, order: 0, xPercent: 50, yPercent: 50, sizePercent: 25, rotationDeg: 0 }
    const deck: GameCard[] = [
      { id: 'one', missingCategory: 'number', images: [placement, placement] },
      { id: 'two', missingCategory: 'number', images: [placement] },
    ]
    expect(groupUniqueUsedImages(deck).sound).toEqual([image])
  })

  it('각 유형 안에서 이미지 ID를 안정적으로 정렬한다', () => {
    const images = makeImages().filter((image) => image.category === 'text').reverse()
    const grouped = groupUniqueUsedImages(makeDeck(images))
    expect(grouped.text.map((image) => image.id)).toEqual([...grouped.text.map((image) => image.id)].sort())
  })
})
