// Story 87.1 — Helper partagé : décompose un display_name en { prenom, nom }.
// Convention Aureak : prénom = premier token, nom = tokens suivants joints.

export function splitName(displayName: string | null): { prenom: string; nom: string } {
  if (!displayName) return { prenom: '—', nom: '—' }
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return { prenom: parts[0], nom: '—' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}
