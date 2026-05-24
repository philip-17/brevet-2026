import type { Question } from '../types'

/**
 * Mélange aléatoirement un tableau (algorithme Fisher-Yates).
 * Retourne une copie — n'altère pas l'original.
 */
export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Mélange l'ordre des choix d'une question et met à jour correctIndex
 * pour pointer vers la nouvelle position de la bonne réponse.
 *
 * Indispensable car certaines sources de questions ont un biais
 * (ex : toutes les bonnes réponses en position A).
 */
export function shuffleQuestionChoices(q: Question): Question {
  // Génère [0, 1, 2, 3] puis le mélange
  const indices = q.choices.map((_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  // Réorganise les choix selon le nouvel ordre d'indices
  const newChoices = indices.map((idx) => q.choices[idx])
  // La nouvelle position de la bonne réponse = la position où on a placé l'ancien correctIndex
  const newCorrectIndex = indices.indexOf(q.correctIndex)
  return {
    ...q,
    choices: newChoices,
    correctIndex: newCorrectIndex,
  }
}
