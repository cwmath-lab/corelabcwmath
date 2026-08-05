import { DATA_CATEGORIES } from '../data/gameTypes'
import type { DataCategory, GameCard, GameImage } from '../types/game'

export type GroupedUsedImages = Record<DataCategory, GameImage[]>

export function groupUniqueUsedImages(deck: GameCard[]): GroupedUsedImages {
  const grouped: GroupedUsedImages = { sound: [], image: [], text: [], number: [] }
  const seenIds = new Set<string>()

  for (const card of deck) {
    for (const { image } of card.images) {
      if (seenIds.has(image.id)) continue
      seenIds.add(image.id)
      grouped[image.category].push(image)
    }
  }

  for (const category of DATA_CATEGORIES) {
    grouped[category].sort((first, second) => first.id.localeCompare(second.id, 'en'))
  }
  return grouped
}
