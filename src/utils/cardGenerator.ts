import { DATA_CATEGORIES } from '../data/gameTypes'
import type {
  CardImagePlacement,
  DataCategory,
  DeckValidationResult,
  GameCard,
  GameImage,
} from '../types/game'

const DEFAULT_CARD_COUNT = 20
const IMAGES_PER_CATEGORY = 10
const MAX_DECK_ATTEMPTS = 100
const SAFE_ZONES = [
  { x: 32, y: 35 },
  { x: 68, y: 35 },
  { x: 50, y: 68 },
]

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function makePlacements(images: GameImage[]): CardImagePlacement[] {
  const shuffledImages = shuffle(images)
  const shuffledZones = shuffle(SAFE_ZONES)

  return shuffledImages.map((image, order) => ({
    image,
    order,
    xPercent: shuffledZones[order].x + randomBetween(-2.5, 2.5),
    yPercent: shuffledZones[order].y + randomBetween(-2, 2),
    sizePercent: randomBetween(23, 31),
    rotationDeg: randomBetween(-8, 8),
  }))
}

function groupSourceImages(images: GameImage[]): Record<DataCategory, GameImage[]> {
  const ids = new Set<string>()
  const grouped: Record<DataCategory, GameImage[]> = {
    sound: [],
    image: [],
    text: [],
    number: [],
  }

  for (const image of images) {
    if (!DATA_CATEGORIES.includes(image.category)) throw new Error(`알 수 없는 이미지 유형입니다: ${image.category}`)
    if (ids.has(image.id)) throw new Error(`중복 이미지 ID가 있습니다: ${image.id}`)
    ids.add(image.id)
    grouped[image.category].push(image)
  }

  for (const category of DATA_CATEGORIES) {
    const count = grouped[category].length
    if (count !== IMAGES_PER_CATEGORY) {
      throw new Error(`${category} 유형 이미지가 10장 필요하지만 ${count}장입니다.`)
    }
  }
  return grouped
}

function buildDeckOnce(grouped: Record<DataCategory, GameImage[]>): GameCard[] {
  const missingCategories = shuffle(DATA_CATEGORIES.flatMap((category) => Array(5).fill(category) as DataCategory[]))
  const imagePools = Object.fromEntries(DATA_CATEGORIES.map((category) => {
    const firstCycle = shuffle(grouped[category])
    const repeatedFive = shuffle(grouped[category]).slice(0, 5)
    return [category, shuffle([...firstCycle, ...repeatedFive])]
  })) as Record<DataCategory, GameImage[]>

  return missingCategories.map((missingCategory) => {
    const selected = DATA_CATEGORIES
      .filter((category) => category !== missingCategory)
      .map((category) => imagePools[category].pop()!)
    const sortedIds = selected.map((image) => image.id).sort()

    return {
      id: `card-${sortedIds.join('--')}`,
      missingCategory,
      images: makePlacements(selected),
    }
  })
}

export function generateBalancedDeck(images: GameImage[], cardCount = DEFAULT_CARD_COUNT): GameCard[] {
  if (cardCount !== DEFAULT_CARD_COUNT) {
    throw new Error(`균형 반복 덱은 정확히 20장만 지원합니다. 요청된 카드 수: ${cardCount}`)
  }
  const grouped = groupSourceImages(images)
  let latestErrors: string[] = []

  for (let attempt = 1; attempt <= MAX_DECK_ATTEMPTS; attempt += 1) {
    const deck = buildDeckOnce(grouped)
    const validation = validateDeck(deck, images)
    if (validation.valid) return deck
    latestErrors = validation.errors
  }

  throw new Error(`정상 이미지 40장으로 ${MAX_DECK_ATTEMPTS}회 시도했지만 균형 덱 생성에 실패했습니다: ${latestErrors.join(' / ')}`)
}

export function validateDeck(deck: GameCard[], sourceImages: GameImage[]): DeckValidationResult {
  const errors: string[] = []
  const categoryAppearances = Object.fromEntries(DATA_CATEGORIES.map((category) => [category, 0])) as Record<DataCategory, number>
  const missingCategoryCounts = Object.fromEntries(DATA_CATEGORIES.map((category) => [category, 0])) as Record<DataCategory, number>
  const imageUsageCounts = Object.fromEntries(sourceImages.map((image) => [image.id, 0])) as Record<string, number>
  const combinations = new Set<string>()

  if (deck.length !== DEFAULT_CARD_COUNT) errors.push(`카드 수가 20장이 아닙니다: ${deck.length}장`)

  deck.forEach((card, cardIndex) => {
    if (card.images.length !== 3) errors.push(`${cardIndex + 1}번 카드의 이미지 수가 3장이 아닙니다.`)
    const categories = card.images.map(({ image }) => image.category)
    if (new Set(categories).size !== categories.length) errors.push(`${cardIndex + 1}번 카드에 같은 유형이 중복되었습니다.`)
    if (categories.includes(card.missingCategory)) errors.push(`${cardIndex + 1}번 카드에 빠진 유형 이미지가 포함되었습니다.`)
    missingCategoryCounts[card.missingCategory] += 1

    const combination = card.images.map(({ image }) => image.id).sort().join('|')
    if (combinations.has(combination)) errors.push(`${cardIndex + 1}번 카드의 이미지 조합이 중복되었습니다.`)
    combinations.add(combination)

    card.images.forEach(({ image }) => {
      categoryAppearances[image.category] += 1
      imageUsageCounts[image.id] = (imageUsageCounts[image.id] ?? 0) + 1
    })
  })

  for (const category of DATA_CATEGORIES) {
    if (missingCategoryCounts[category] !== 5) errors.push(`${category} 유형이 빠진 횟수는 ${missingCategoryCounts[category]}회입니다.`)
    if (categoryAppearances[category] !== 15) errors.push(`${category} 유형 등장 횟수는 ${categoryAppearances[category]}회입니다.`)
  }

  const usedSourceCount = sourceImages.filter((image) => imageUsageCounts[image.id] > 0).length
  if (sourceImages.length !== 40 || usedSourceCount !== 40) errors.push(`전체 40개 이미지 중 ${usedSourceCount}개가 사용되었습니다.`)
  for (const image of sourceImages) {
    const count = imageUsageCounts[image.id]
    if (count !== 1 && count !== 2) errors.push(`${image.id} 이미지 사용 횟수는 ${count}회입니다.`)
  }

  return { valid: errors.length === 0, errors, categoryAppearances, missingCategoryCounts, imageUsageCounts }
}
