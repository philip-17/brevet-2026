import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Hook pour utiliser l'API Web Speech (text-to-speech).
 * - Sélectionne automatiquement une voix française si disponible
 * - Expose play / pause / resume / stop
 * - Suit l'état "en train de parler" et la progression (mot en cours)
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(
    null
  )
  const [rate, setRate] = useState(1)
  const [charIndex, setCharIndex] = useState(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  // Charger les voix dispo (asynchrone sur certains navigateurs)
  useEffect(() => {
    if (!supported) return

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices()
      if (list.length === 0) return
      setVoices(list)

      // Préférer une voix française naturelle (Apple "Audrey", Google "fr-FR", etc.)
      const french = list.filter((v) => v.lang.toLowerCase().startsWith('fr'))
      if (french.length === 0) {
        setCurrentVoice((cur) => cur ?? list[0])
        return
      }
      // Trier : Apple "premium" voices d'abord, puis Google, puis le reste
      const sorted = french.sort((a, b) => {
        const score = (v: SpeechSynthesisVoice) => {
          const n = v.name.toLowerCase()
          if (n.includes('audrey') || n.includes('thomas')) return 3
          if (n.includes('google')) return 2
          if (v.localService) return 1
          return 0
        }
        return score(b) - score(a)
      })
      setCurrentVoice((cur) => cur ?? sorted[0])
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
    setCharIndex(0)
    utteranceRef.current = null
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return
      // Annule toute lecture en cours
      window.speechSynthesis.cancel()

      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fr-FR'
      u.rate = rate
      u.pitch = 1
      u.volume = 1
      if (currentVoice) u.voice = currentVoice

      u.onstart = () => {
        setSpeaking(true)
        setPaused(false)
      }
      u.onend = () => {
        setSpeaking(false)
        setPaused(false)
        setCharIndex(0)
        utteranceRef.current = null
      }
      u.onerror = () => {
        setSpeaking(false)
        setPaused(false)
        utteranceRef.current = null
      }
      u.onpause = () => setPaused(true)
      u.onresume = () => setPaused(false)
      u.onboundary = (ev) => {
        if (ev.name === 'word') setCharIndex(ev.charIndex)
      }

      utteranceRef.current = u
      window.speechSynthesis.speak(u)
    },
    [supported, currentVoice, rate]
  )

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    setPaused(true)
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.resume()
    setPaused(false)
  }, [supported])

  // Cleanup quand le composant se démonte
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  return {
    supported,
    speak,
    pause,
    resume,
    stop,
    speaking,
    paused,
    voices,
    currentVoice,
    setVoice: setCurrentVoice,
    rate,
    setRate,
    charIndex,
  }
}
