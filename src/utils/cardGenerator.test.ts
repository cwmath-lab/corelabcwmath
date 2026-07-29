import { describe, expect, it } from 'vitest'
import { DATA_CATEGORIES } from '../data/gameTypes'
import type { DataCategory, GameImage } from '../types/game'
import { generateBalancedDeck, validateDeck } from './cardGenerator'

function makeImages(countPerCategory = 10): GameImage[] {
  return DATA_CATEGORIES.flatMap((category) =>
    Array.from({ length: countPerCategory }, (_, index) => ({
      id: `${category}-${index + 1}`,
      category,
      src: `/${category}/${index + 1}.svg`,
      alt: '',
    })),
  )
}

describe('generateBalancedDeck', () => {
  const sourceImages = makeImages()

  it('20장의 카드를 생성한다', () => {
    expect(generateBalancedDeck(sourceImages)).toHaveLength(20)
  })

  it('카드마다 서로 다른 세 유형이 들어간다', () => {
    for (const card of generateBalancedDeck(sourceImages)) {
      expect(card.images).toHaveLength(3)
      expect(new Set(card.images.map(({ image }) => image.category)).size).toBe(3)
    }
  })

  it('각 유형이 정확히 5번 빠진다', () => {
    const result = validateDeck(generateBalancedDeck(sourceImages), sourceImages)
    for (const category of DATA_CATEGORIES) expect(result.missingCategoryCounts[category]).toBe(5)
  })

  it('각 유형 이미지가 정확히 15번 등장한다', () => {
    const result = validateDeck(generateBalancedDeck(sourceImages), sourceImages)
    for (const category of DATA_CATEGORIES) expect(result.categoryAppearances[category]).toBe(15)
  })

  it('40개 이미지가 모두 최소 한 번 등장한다', () => {
    const result = validateDeck(generateBalancedDeck(sourceImages), sourceImages)
    expect(Object.values(result.imageUsageCounts).filter((count) => count > 0)).toHaveLength(40)
  })

  it('모든 이미지 사용 횟수가 1회 또는 2회다', () => {
    const result = validateDeck(generateBalancedDeck(sourceImages), sourceImages)
    expect(Object.values(result.imageUsageCounts).every((count) => count === 1 || count === 2)).toBe(true)
  })

  it('같은 이미지 조합의 카드가 중복되지 않는다', () => {
    const deck = generateBalancedDeck(sourceImages)
    const combinations = deck.map((card) => card.images.map(({ image }) => image.id).sort().join('|'))
    expect(new Set(combinations).size).toBe(20)
  })

  it('여러 번 생성한 모든 덱이 유효하다', () => {
    for (let iteration = 0; iteration < 50; iteration += 1) {
      expect(validateDeck(generateBalancedDeck(sourceImages), sourceImages)).toMatchObject({ valid: true, errors: [] })
    }
  })

  it.each(DATA_CATEGORIES)('%s 유형 이미지가 10장보다 적으면 명확한 오류를 낸다', (shortCategory: DataCategory) => {
    const insufficient = sourceImages.filter((image) => !(image.category === shortCategory && image.id.endsWith('-10')))
    expect(() => generateBalancedDeck(insufficient)).toThrow(`${shortCategory} 유형 이미지가 10장 필요하지만 9장입니다.`)
  })
})
