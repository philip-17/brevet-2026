import { useEffect, useRef, useState } from 'react'

// Affiche le HTML d'un cours importé tel quel, isolé dans un iframe.
// La hauteur de l'iframe est ajustée au contenu (mesure au chargement
// + recalcul sur clic, évite la boucle de croissance qu'aurait
// déclenchée un ResizeObserver sur documentElement).

interface Props {
  html: string
}

export default function RawHtmlLesson({ html }: Props) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(800)

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return

    const measure = () => {
      const doc = iframe.contentDocument
      if (!doc?.body) return
      // body.scrollHeight = hauteur réelle du contenu (évite la
      // boucle où documentElement grandit avec l'iframe)
      const h = doc.body.scrollHeight
      if (h) setHeight(h)
    }

    const handleLoad = () => {
      measure()
      // Re-mesure après le chargement des polices web et des images
      setTimeout(measure, 300)
      setTimeout(measure, 1000)

      // Re-mesure quand l'utilisateur clique sur « voir l'analyse »
      const doc = iframe.contentDocument
      if (!doc) return
      const buttons = doc.querySelectorAll('.reveal-btn')
      buttons.forEach((b) => {
        b.addEventListener('click', () => setTimeout(measure, 50))
      })
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [html])

  return (
    <iframe
      ref={ref}
      title="Cours"
      srcDoc={html}
      style={{
        width: '100%',
        height,
        border: 0,
        background: '#FBF9F4',
        borderRadius: 14,
        display: 'block',
      }}
      sandbox="allow-same-origin allow-scripts"
    />
  )
}
