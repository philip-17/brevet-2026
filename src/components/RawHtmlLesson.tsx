import { useEffect, useRef, useState } from 'react'

// Affiche un cours HTML autonome (servi depuis /public) tel quel, isolé
// dans un iframe. On charge un VRAI fichier via `src` (et non `srcdoc`) :
// c'est indispensable pour que les liens d'ancrage du sommaire (#sujet,
// #cod…) défilent À L'INTÉRIEUR du cours. Avec `srcdoc`, ces ancres se
// résolvent sur l'URL de l'app et rechargent toute l'application dans le
// cadre — ce qui cassait la navigation par sujet.
//
// Règle de hauteur :
// - si le cours tient dans l'écran → hauteur exacte du contenu ;
// - sinon → on plafonne à la hauteur visible : le cours défile dans son
//   cadre, ce qui fait fonctionner le sommaire collant, les ancres et la
//   surbrillance de section, comme si on ouvrait le fichier directement.

interface Props {
  /** URL du cours (ex. /cours/fonctions-dans-la-phrase.html). */
  url: string
}

function computeAvailable(): number {
  if (typeof window === 'undefined') return 700
  // window.innerHeight reflète déjà la zone visible (barres mobiles incluses).
  // On retire l'en-tête de l'app (bouton retour + titre ≈ 84px).
  return Math.max(420, window.innerHeight - 84)
}

export default function RawHtmlLesson({ url }: Props) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const [available, setAvailable] = useState(computeAvailable)

  // Hauteur disponible recalculée au redimensionnement / rotation
  useEffect(() => {
    const onResize = () => setAvailable(computeAvailable())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return

    const measure = () => {
      const doc = iframe.contentDocument
      if (!doc?.body) return
      setContentHeight(doc.body.scrollHeight)
    }

    const handleLoad = () => {
      measure()
      // Re-mesure après le chargement des polices web et des images
      setTimeout(measure, 300)
      setTimeout(measure, 1000)
      // Re-mesure quand l'utilisateur révèle une analyse (le contenu grandit)
      iframe.contentDocument
        ?.querySelectorAll('.reveal-btn')
        .forEach((b) => b.addEventListener('click', () => setTimeout(measure, 60)))
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [url])

  const height = contentHeight ? Math.min(contentHeight, available) : available

  return (
    <iframe
      ref={ref}
      title="Cours"
      src={url}
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
