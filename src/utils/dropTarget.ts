import type { PlayerPosition } from '../types/game'

export interface Point { x: number; y: number }
export interface RectLike { left: number; right: number; top: number; bottom: number }

export function findDropTarget(
  tokenCenter: Point,
  targets: Partial<Record<PlayerPosition, RectLike>>,
  tolerance = 12,
): PlayerPosition | null {
  const matches = (Object.entries(targets) as [PlayerPosition, RectLike][]).filter(([, rect]) =>
    tokenCenter.x >= rect.left - tolerance && tokenCenter.x <= rect.right + tolerance
    && tokenCenter.y >= rect.top - tolerance && tokenCenter.y <= rect.bottom + tolerance,
  )
  if (!matches.length) return null

  matches.sort(([, first], [, second]) => {
    const firstDistance = Math.hypot(tokenCenter.x - (first.left + first.right) / 2, tokenCenter.y - (first.top + first.bottom) / 2)
    const secondDistance = Math.hypot(tokenCenter.x - (second.left + second.right) / 2, tokenCenter.y - (second.top + second.bottom) / 2)
    return firstDistance - secondDistance
  })
  return matches[0][0]
}
