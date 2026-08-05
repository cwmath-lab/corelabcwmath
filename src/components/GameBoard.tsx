import { useEffect, useReducer, useRef, useState } from 'react'
import CircularCard from './CircularCard'
import CategoryReview from './CategoryReview'
import EndCelebration from './EndCelebration'
import ScoreArea from './ScoreArea'
import ScoreToken from './ScoreToken'
import { generatedGameImages } from '../data/generatedGameImages'
import { CATEGORY_ICONS, DATA_CATEGORIES, PLAYER_POSITIONS } from '../data/gameTypes'
import { generateBalancedDeck } from '../utils/cardGenerator'
import { playFinishMusic, playScoreSound, unlockAudio } from '../utils/audio'
import { advanceAfterScore, awardScore, createReadyGameState, createScoreToken, finishCelebration, returnToReady, startGame } from '../utils/gameState'
import type { GameState, PlayerPosition } from '../types/game'

const TOTAL_CARDS = 20
const TRANSITION_DURATION = 500
const CELEBRATION_DURATION = 5000
const READY_IMAGES = DATA_CATEGORIES.flatMap((category) => {
  const image = generatedGameImages.find((candidate) => candidate.category === category)
  return image ? [image] : []
})

type GameAction =
  | { type: 'START'; deck: GameState['deck'] }
  | { type: 'CREATE_TOKEN' }
  | { type: 'SCORE'; position: PlayerPosition }
  | { type: 'ADVANCE' }
  | { type: 'SHOW_REVIEW' }
  | { type: 'READY' }

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': return startGame(state, action.deck)
    case 'CREATE_TOKEN': return createScoreToken(state)
    case 'SCORE': return awardScore(state, action.position)
    case 'ADVANCE': return advanceAfterScore(state)
    case 'SHOW_REVIEW': return finishCelebration(state)
    case 'READY': return returnToReady()
  }
}

export default function GameBoard() {
  const [game, dispatch] = useReducer(gameReducer, undefined, createReadyGameState)
  const [tokenOrigin, setTokenOrigin] = useState({ x: 0, y: 0 })
  const [highlightedPlayer, setHighlightedPlayer] = useState<PlayerPosition | null>(null)
  const scoreButtons = useRef<Partial<Record<PlayerPosition, HTMLButtonElement | null>>>({})
  const processingDrop = useRef(false)
  const transitionTimer = useRef<number | null>(null)
  const highlightTimer = useRef<number | null>(null)
  const celebrationTimer = useRef<number | null>(null)
  const finishMusic = useRef<{ stop: () => void } | null>(null)
  const startingGame = useRef(false)
  const currentCard = game.deck[game.currentCardIndex]

  useEffect(() => () => {
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current)
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
    if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current)
    finishMusic.current?.stop()
  }, [])

  useEffect(() => {
    if (game.phase === 'playing') startingGame.current = false
    if (game.phase !== 'celebrating') return
    finishMusic.current = playFinishMusic()
    celebrationTimer.current = window.setTimeout(() => dispatch({ type: 'SHOW_REVIEW' }), CELEBRATION_DURATION)
    return () => {
      if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current)
      celebrationTimer.current = null
      finishMusic.current?.stop()
      finishMusic.current = null
    }
  }, [game.phase])

  const beginGame = () => {
    if (startingGame.current) return
    startingGame.current = true
    unlockAudio()
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current)
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
    if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current)
    finishMusic.current?.stop()
    processingDrop.current = false
    setHighlightedPlayer(null)
    dispatch({ type: 'START', deck: generateBalancedDeck(generatedGameImages) })
  }

  const showReadyScreen = () => {
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current)
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
    if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current)
    finishMusic.current?.stop()
    processingDrop.current = false
    startingGame.current = false
    setHighlightedPlayer(null)
    dispatch({ type: 'READY' })
  }

  const activateCard = (rect: DOMRect) => {
    if (game.phase !== 'playing' || game.tokenCreated) return
    setTokenOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.48 })
    dispatch({ type: 'CREATE_TOKEN' })
  }

  const handleValidDrop = (position: PlayerPosition) => {
    if (game.phase !== 'tokenActive' || processingDrop.current) return
    processingDrop.current = true
    dispatch({ type: 'SCORE', position })
    setHighlightedPlayer(position)
    playScoreSound()

    highlightTimer.current = window.setTimeout(() => setHighlightedPlayer(null), 520)
    transitionTimer.current = window.setTimeout(() => {
      dispatch({ type: 'ADVANCE' })
      processingDrop.current = false
    }, TRANSITION_DURATION)
  }

  if (game.phase === 'review') {
    return <CategoryReview deck={game.deck} scores={game.scores} onNewGame={beginGame} onReady={showReadyScreen} />
  }

  return (
    <section className="game-board">
      <header className="game-header">
        <div className="title-group">
          <div className="title-icons" aria-hidden="true">
            {DATA_CATEGORIES.map((category) => <img key={category} src={CATEGORY_ICONS[category]} alt="" />)}
          </div>
          <h1>빠진 데이터 유형을 찾아라</h1>
        </div>
        <div className="progress" aria-label="현재 진행 카드 수">
          <span>진행 카드</span>
          <strong>{game.deck.length ? game.currentCardIndex + 1 : 0} <small>/ {TOTAL_CARDS}</small></strong>
        </div>
      </header>

      <div className="board-stage">
        <div className="ambient-shape ambient-shape--one" />
        <div className="ambient-shape ambient-shape--two" />
        {PLAYER_POSITIONS.map((position) => (
          <ScoreArea
            key={position}
            ref={(element: HTMLButtonElement | null) => { scoreButtons.current[position] = element }}
            position={position}
            score={game.scores[position]}
            highlighted={highlightedPlayer === position}
          />
        ))}
        <CircularCard
          key={currentCard?.id ?? 'ready'}
          placements={currentCard?.images}
          readyImages={currentCard ? undefined : READY_IMAGES}
          interactive={game.phase === 'playing'}
          tokenCreated={game.phase === 'tokenActive' || game.phase === 'transitioning'}
          onActivate={activateCard}
        />
        {game.phase === 'ready' && <button className="primary-game-button start-game-button" type="button" onClick={beginGame}>게임 시작</button>}
      </div>

      {game.phase === 'tokenActive' && (
        <ScoreToken origin={tokenOrigin} targets={scoreButtons.current} onDrop={handleValidDrop} />
      )}

      {game.phase === 'celebrating' && <EndCelebration scores={game.scores} />}
    </section>
  )
}
