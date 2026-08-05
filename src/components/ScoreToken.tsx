import { useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { PlayerPosition } from '../types/game'
import { findDropTarget } from '../utils/dropTarget'

interface ScoreTokenProps {
  origin: { x: number; y: number }
  targets: Partial<Record<PlayerPosition, HTMLElement | null>>
  onDrop: (position: PlayerPosition) => void
}

export default function ScoreToken({ origin, targets, onDrop }: ScoreTokenProps) {
  const [position, setPosition] = useState(origin)
  const [dragging, setDragging] = useState(false)
  const [returning, setReturning] = useState(false)
  const pointerId = useRef<number | null>(null)
  const offset = useRef({ x: 0, y: 0 })

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (pointerId.current !== null) return
    pointerId.current = event.pointerId
    offset.current = { x: event.clientX - position.x, y: event.clientY - position.y }
    event.currentTarget.setPointerCapture(event.pointerId)
    setReturning(false)
    setDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerId.current !== event.pointerId) return
    event.preventDefault()
    const radius = 38
    setPosition({
      x: Math.min(window.innerWidth - radius, Math.max(radius, event.clientX - offset.current.x)),
      y: Math.min(window.innerHeight - radius, Math.max(radius, event.clientY - offset.current.y)),
    })
  }

  const releaseCapture = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointerId.current = null
    setDragging(false)
  }

  const returnToOrigin = () => {
    setReturning(true)
    setPosition(origin)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (pointerId.current !== event.pointerId) return
    const center = { x: event.clientX - offset.current.x, y: event.clientY - offset.current.y }
    const rects = Object.fromEntries(Object.entries(targets).flatMap(([key, element]) =>
      element ? [[key, element.getBoundingClientRect()]] : [],
    )) as Partial<Record<PlayerPosition, DOMRect>>
    const target = findDropTarget(center, rects)
    releaseCapture(event)
    if (target) onDrop(target)
    else returnToOrigin()
  }

  const handlePointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerId.current !== event.pointerId) return
    releaseCapture(event)
    returnToOrigin()
  }

  return (
    <button
      className={`score-token${dragging ? ' is-dragging' : ''}${returning ? ' is-returning' : ''}`}
      type="button"
      aria-label="점수 토큰 10점"
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={(event: ReactMouseEvent<HTMLButtonElement>) => event.stopPropagation()}
    >+10</button>
  )
}
