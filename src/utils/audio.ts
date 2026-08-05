let audioContext: AudioContext | null = null
let warned = false
let activeFinishMusic: { stop: () => void } | null = null

function getAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) {
    if (!warned) console.warn('이 브라우저는 Web Audio API를 지원하지 않습니다.')
    warned = true
    return null
  }
  audioContext ??= new AudioContextClass()
  return audioContext
}

export function unlockAudio(): void {
  try {
    const context = getAudioContext()
    if (context?.state === 'suspended') void context.resume()
  } catch (error) {
    console.warn('오디오를 준비하지 못했습니다.', error)
  }
}

export function playScoreSound(): void {
  try {
    audioContext = getAudioContext()
    if (!audioContext) return
    if (audioContext.state === 'suspended') void audioContext.resume()
    const start = audioContext.currentTime
    const notes = [523.25, 659.25, 783.99]

    notes.forEach((frequency, index) => {
      const oscillator = audioContext!.createOscillator()
      const gain = audioContext!.createGain()
      const noteStart = start + index * 0.16
      const noteEnd = noteStart + 0.42
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, noteStart)
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.09, noteStart + 0.035)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd)
      oscillator.connect(gain).connect(audioContext!.destination)
      oscillator.start(noteStart)
      oscillator.stop(noteEnd)
    })
  } catch (error) {
    console.warn('점수 효과음을 재생하지 못했습니다.', error)
  }
}

export function playFinishMusic(): { stop: () => void } {
  activeFinishMusic?.stop()
  try {
    const context = getAudioContext()
    if (!context) return { stop: () => undefined }
    if (context.state === 'suspended') void context.resume()

    const master = context.createGain()
    const start = context.currentTime + 0.02
    const end = start + 5
    master.gain.setValueAtTime(0.0001, start)
    master.gain.exponentialRampToValueAtTime(0.075, start + 0.12)
    master.gain.setValueAtTime(0.075, end - 0.5)
    master.gain.exponentialRampToValueAtTime(0.0001, end)
    master.connect(context.destination)

    const frequencies = [523.25, 659.25, 783.99, 659.25, 698.46, 880, 1046.5, 783.99, 1046.5, 1318.51]
    const oscillators = frequencies.flatMap((frequency, index) => {
      const noteStart = start + index * 0.46
      return [frequency, frequency * 1.25].map((tone, harmonyIndex) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = harmonyIndex ? 'sine' : 'triangle'
        oscillator.frequency.setValueAtTime(tone, noteStart)
        gain.gain.setValueAtTime(0.0001, noteStart)
        gain.gain.exponentialRampToValueAtTime(harmonyIndex ? 0.2 : 0.42, noteStart + 0.035)
        gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(noteStart + 0.4, end))
        oscillator.connect(gain).connect(master)
        oscillator.start(noteStart)
        oscillator.stop(Math.min(noteStart + 0.42, end))
        return oscillator
      })
    })

    let stopped = false
    let stopTimer = 0
    let disconnectTimer = 0
    const controller = {
      stop: () => {
        if (stopped) return
        stopped = true
        window.clearTimeout(stopTimer)
        window.clearTimeout(disconnectTimer)
        master.gain.cancelScheduledValues(context.currentTime)
        master.gain.setTargetAtTime(0.0001, context.currentTime, 0.02)
        oscillators.forEach((oscillator) => { try { oscillator.stop(context.currentTime + 0.08) } catch { /* already stopped */ } })
        disconnectTimer = window.setTimeout(() => master.disconnect(), 120)
        if (activeFinishMusic === controller) activeFinishMusic = null
      },
    }
    activeFinishMusic = controller
    stopTimer = window.setTimeout(() => controller.stop(), 5100)
    return controller
  } catch (error) {
    console.warn('종료 음악을 재생하지 못했습니다.', error)
    return { stop: () => undefined }
  }
}
