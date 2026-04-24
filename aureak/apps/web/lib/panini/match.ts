// Story 105.1 — Auto-match nom de fichier photo → enfant du stage

type Enfant = { id: string; prenom: string; nom: string }

export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Tente de matcher un nom de fichier avec un enfant du stage.
 * Retourne l'id si UN seul match est trouvé, sinon null.
 * Accepte match par prénom seul uniquement si ce prénom est unique dans le stage.
 */
export function autoMatch(filename: string, enfants: Enfant[]): string | null {
  const file = normalizeName(filename)
  if (!file) return null

  const fileWords = new Set(file.split(/\s+/).filter(Boolean))
  if (fileWords.size === 0) return null

  const prenomCount = new Map<string, number>()
  for (const e of enfants) {
    const p = normalizeName(e.prenom)
    prenomCount.set(p, (prenomCount.get(p) ?? 0) + 1)
  }

  const candidates: string[] = []

  for (const e of enfants) {
    const prenom      = normalizeName(e.prenom)
    const nom         = normalizeName(e.nom)
    const prenomWords = prenom.split(/\s+/).filter(Boolean)
    const nomWords    = nom.split(/\s+/).filter(Boolean)

    const hasPrenom = prenomWords.every((w) => fileWords.has(w))
    const hasNom    = nomWords.every((w) => fileWords.has(w))

    if (hasPrenom && hasNom) {
      candidates.push(e.id)
      continue
    }

    if (hasNom && !hasPrenom) {
      const uniqueNom =
        enfants.filter((other) => normalizeName(other.nom) === nom).length === 1
      if (uniqueNom) candidates.push(e.id)
      continue
    }

    if (hasPrenom && !hasNom) {
      const uniquePrenom = (prenomCount.get(prenom) ?? 0) === 1
      if (uniquePrenom) candidates.push(e.id)
    }
  }

  if (candidates.length === 1) return candidates[0]
  return null
}
