import GameBoard from './components/GameBoard'
import OrientationNotice from './components/OrientationNotice'

export default function App() {
  return (
    <main className="app-shell">
      <OrientationNotice />
      <GameBoard />
    </main>
  )
}
