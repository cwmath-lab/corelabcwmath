import type { DataCategory, PlayerPosition } from '../types/game'

export const DATA_CATEGORIES: DataCategory[] = ['sound', 'image', 'text', 'number']

export const CATEGORY_LABELS: Record<DataCategory, string> = {
  sound: '소리',
  image: '이미지',
  text: '문자',
  number: '숫자',
}

export const CATEGORY_ICONS: Record<DataCategory, string> = {
  sound: '/assets/images/sound/sound-01.svg',
  image: '/assets/images/image/image-01.svg',
  text: '/assets/images/text/text-01.svg',
  number: '/assets/images/number/number-01.svg',
}

export const PLAYER_POSITIONS: PlayerPosition[] = ['top', 'right', 'bottom', 'left']
