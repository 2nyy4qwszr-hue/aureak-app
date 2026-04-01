// Admin — Création de profil / invitation
// Deux modes : fiche locale (sans email) ou invitation (email envoyé)
// Rôles : enfant, parent, coach, club

import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'
import {
  createProfileFiche,
  inviteProfileUser,
  listImplantations,
  listGroupsByImplantation,
  listClubDirectory,
} from '@aureak/api-client'
import type { ProfileRole, InviteProfileUserParams } from '@aureak/api-client'
import type { Implantation, Group } from '@aureak/types'

// ── Types internes ─────────────────────────────────────────────────────────────

type Mode = 'fiche' | 'invite'

// Type minimal pour les entrées d'annuaire club retournées par listClubDirectory()
type ClubRow = { id: string; nom: string }

interface FormValues {
  // Identité
  firstName       : string
  lastName        : string
  email           : string
  phone           : string
  // Enfant — infos personnelles
  birthDate       : string
  gender          : string
  strongFoot      : string
  ageCategory     : string
  currentClubId   : string   // user_id du club (sélection depuis DB)
  // Enfant — académie
  implantationId  : string
  groupId         : string
  // Enfant — papa
  parentFirstName : string
  parentLastName  : string
  parentEmail     : string
  parentPhone     : string
  // Enfant — maman
  parent2FirstName: string
  parent2LastName : string
  parent2Email    : string
  parent2Phone    : string
  // Interne
  internalNotes   : string
}

const EMPTY_FORM: FormValues = {
  firstName: '', lastName: '', email: '', phone: '',
  birthDate: '', gender: '', strongFoot: '', ageCategory: '',
  currentClubId: '', implantationId: '', groupId: '',
  parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: '',
  parent2FirstName: '', parent2LastName: '', parent2Email: '', parent2Phone: '',
  internalNotes: '',
}

// Catégories football (migration 00040)
const AGE_CATEGORIES = [
  { value: 'Foot à 5',   label: 'Foot à 5'   },
  { value: 'Foot à 8',   label: 'Foot à 8'   },
  { value: 'Foot à 11',  label: 'Foot à 11'  },
  { value: 'Senior',     label: 'Senior'      },
] as const

// ── Composant principal ────────────────────────────────────────────────────────

export default function NewUserScreen() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [step,   setStep]   = useState<1 | 2 | 3>(1)
  const [mode,   setMode]   = useState<Mode>('fiche')
  const [role,   setRole]   = useState<ProfileRole>('child')
  const [form,   setForm]   = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [groups,        setGroups]        = useState<Group[]>([])
  const [clubs,         setClubs]         = useState<ClubRow[]>([])
  const [clubsLoading,  setClubsLoading]  = useState(true)

  // Charger implantations et clubs annuaire au montage
  useEffect(() => {
    listImplantations().then(({ data }) => setImplantations(data ?? []))
    listClubDirectory({ actif: true, pageSize: 200 }).then(({ data }) => {
      setClubs((data ?? []).map(c => ({ id: c.id, nom: c.nom })))
      setClubsLoading(false)
    })
  }, [])

  // Charger groupes quand l'implantation change (cascade)
  useEffect(() => {
    if (!form.implantationId) { setGroups([]); return }
    listGroupsByImplantation(form.implantationId).then(({ data }) => setGroups(data ?? []))
  }, [form.implantationId])

  const set = (key: keyof FormValues) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  // ── Validation ───────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Partial<Record<keyof FormValues, string>> = {}
    if (!form.firstName.trim()) e.firstName = 'Prénom requis'
    if (!form.lastName.trim())  e.lastName  = 'Nom requis'
    if (mode === 'invite') {
      if (!form.email.trim())                       e.email = 'Email requis en mode invitation'
      else if (!/\S+@\S+\.\S+/.test(form.email))   e.email = 'Email invalide'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Soumission ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validate()) return
    if (!tenantId) { setResult({ ok: false, msg: 'Tenant non défini.' }); return }

    setSubmitting(true)
    setResult(null)

    // Résoudre le nom du club sélectionné (currentClub stocké en TEXT dans la DB)
    const selectedClub = clubs.find(c => c.id === form.currentClubId)

    const baseParams = {
      tenantId,
      role,
      firstName        : form.firstName,
      lastName         : form.lastName,
      email            : form.email          || undefined,
      phone            : form.phone          || undefined,
      internalNotes    : form.internalNotes  || undefined,
      birthDate        : form.birthDate      || undefined,
      gender           : (form.gender        as 'male' | 'female' | 'other') || undefined,
      strongFoot       : (form.strongFoot    as 'right' | 'left' | 'both')   || undefined,
      ageCategory      : (form.ageCategory   as 'Foot à 5' | 'Foot à 8' | 'Foot à 11' | 'Senior') || undefined,
      currentClub      : selectedClub?.nom   || undefined,
      implantationId   : form.implantationId || undefined,
      groupId          : form.groupId        || undefined,
      parentFirstName  : form.parentFirstName  || undefined,
      parentLastName   : form.parentLastName   || undefined,
      parentEmail      : form.parentEmail      || undefined,
      parentPhone      : form.parentPhone      || undefined,
      parent2FirstName : form.parent2FirstName || undefined,
      parent2LastName  : form.parent2LastName  || undefined,
      parent2Email     : form.parent2Email     || undefined,
      parent2Phone     : form.parent2Phone     || undefined,
    }

    try {
      const { error } = mode === 'fiche'
        ? await createProfileFiche(baseParams)
        : await inviteProfileUser(baseParams as InviteProfileUserParams)

      if (error) {
        setResult({ ok: false, msg: (error as { message?: string }).message ?? 'Erreur inconnue' })
      } else {
        setResult({
          ok: true,
          msg: mode === 'fiche'
            ? 'Fiche créée. L\'utilisateur peut être invité ultérieurement.'
            : 'Invitation envoyée par email.',
        })
      }
    } catch (e: unknown) {
      if (process.env.NODE_ENV !== 'production') console.error('[users/new] handleSubmit error:', e)
      setResult({ ok: false, msg: (e as Error)?.message ?? 'Erreur inattendue.' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Rendu succès ─────────────────────────────────────────────────────────────

  if (result?.ok) {
    return (
      <div style={s.page}>
        <style>{css}</style>
        <div style={s.card}>
          <div style={{ ...s.badge, background: 'rgba(76,175,80,0.15)', color: colors.status.success, marginBottom: 24 }}>
            Profil créé
          </div>
          <div style={s.successIcon}>✓</div>
          <p style={{ ...s.label, color: colors.text.dark, fontSize: 20, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, marginBottom: 8, margin: 0 }}>
            {result.msg}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button style={s.btnSecondary} onClick={() => { setResult(null); setStep(1); setForm(EMPTY_FORM) }}>
              Créer un autre profil
            </button>
            <button style={s.btnPrimary} onClick={() => router.push('/users' as never)}>
              Voir la liste
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Rendu principal ──────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => router.back()}>← Retour</button>
        <h1 style={s.title}>Nouveau profil</h1>
        <div style={s.steps}>
          {([1, 2, 3] as const).map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ ...s.stepDot, ...(step >= n ? s.stepDotActive : {}) }}>
                {step > n ? '✓' : n}
              </div>
              {n < 3 && <div style={{ ...s.stepLine, ...(step > n ? s.stepLineActive : {}) }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Carte principale */}
      <div style={s.card}>

        {/* ── ÉTAPE 1 : Mode ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <p style={s.stepLabel}>Étape 1 — Type de création</p>
            <h2 style={s.stepTitle}>Comment voulez-vous créer ce profil ?</h2>
            <div style={s.modeGrid}>
              <ModeCard
                active={mode === 'fiche'}
                onSelect={() => setMode('fiche')}
                icon="📋"
                title="Créer une fiche"
                desc="Profil local sans envoi d'email. L'invitation peut être envoyée ultérieurement."
                badge="Sans email"
              />
              <ModeCard
                active={mode === 'invite'}
                onSelect={() => setMode('invite')}
                icon="✉️"
                title="Envoyer une invitation"
                desc="Envoie un lien d'activation par email. L'utilisateur crée son mot de passe."
                badge="Email requis"
              />
            </div>
            <div style={s.footer}>
              <button style={s.btnPrimary} onClick={() => setStep(2)}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : Rôle ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <p style={s.stepLabel}>Étape 2 — Rôle</p>
            <h2 style={s.stepTitle}>Quel est le rôle de cet utilisateur ?</h2>
            <div style={s.roleGrid}>
              <RoleCard active={role === 'child'}  onSelect={() => setRole('child')}  icon="⚽" title="Enfant"  desc="Gardien ou joueur, avec fiche complète" />
              <RoleCard active={role === 'parent'} onSelect={() => setRole('parent')} icon="👤" title="Parent"  desc="Contact lié à un ou plusieurs enfants" />
              <RoleCard active={role === 'coach'}  onSelect={() => setRole('coach')}  icon="🏅" title="Coach"   desc="Intervenant dans les séances" />
              <RoleCard active={role === 'club'}   onSelect={() => setRole('club')}   icon="🏟️" title="Club"    desc="Structure partenaire externe" />
            </div>
            <div style={s.footer}>
              <button style={s.btnSecondary} onClick={() => setStep(1)}>← Retour</button>
              <button style={s.btnPrimary}   onClick={() => setStep(3)}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Formulaire ─────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <p style={s.stepLabel}>Étape 3 — Informations</p>
            <h2 style={s.stepTitle}>
              {role === 'child'  ? 'Fiche joueur'
              : role === 'parent' ? 'Fiche parent'
              : role === 'coach'  ? 'Fiche coach'
              : 'Fiche club'}
            </h2>

            {result && !result.ok && (
              <div style={s.errorBanner}>{result.msg}</div>
            )}

            {/* ── IDENTITÉ (tous les rôles) ── */}
            <Section title="Identité">
              <div style={s.row2}>
                <Field label="Prénom *" error={errors.firstName}>
                  <input style={{ ...s.input, ...(errors.firstName ? s.inputError : {}) }}
                    value={form.firstName} onChange={e => set('firstName')(e.target.value)}
                    placeholder="Prénom" />
                </Field>
                <Field label="Nom *" error={errors.lastName}>
                  <input style={{ ...s.input, ...(errors.lastName ? s.inputError : {}) }}
                    value={form.lastName} onChange={e => set('lastName')(e.target.value)}
                    placeholder="Nom" />
                </Field>
              </div>
              <div style={s.row2}>
                <Field
                  label={mode === 'invite' ? 'Email *' : 'Email (optionnel)'}
                  error={errors.email}
                >
                  <input style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
                    value={form.email} onChange={e => set('email')(e.target.value)}
                    placeholder="email@example.com" type="email" />
                </Field>
                <Field label="Téléphone">
                  <input style={s.input} value={form.phone}
                    onChange={e => set('phone')(e.target.value)} placeholder="+33 6 00 00 00 00" />
                </Field>
              </div>
            </Section>

            {/* ── CHAMPS ENFANT ── */}
            {role === 'child' && (
              <>
                {/* ── Informations personnelles ── */}
                <Section title="Informations personnelles">
                  <div style={s.row3}>
                    <Field label="Date de naissance">
                      <input style={s.input} type="date" value={form.birthDate}
                        onChange={e => set('birthDate')(e.target.value)} />
                    </Field>
                    <Field label="Sexe">
                      <select style={s.select} value={form.gender} onChange={e => set('gender')(e.target.value)}>
                        <option value="">— Sexe —</option>
                        <option value="male">Garçon</option>
                        <option value="female">Fille</option>
                        <option value="other">Autre</option>
                      </select>
                    </Field>
                    <Field label="Pied fort">
                      <select style={s.select} value={form.strongFoot} onChange={e => set('strongFoot')(e.target.value)}>
                        <option value="">— Pied fort —</option>
                        <option value="right">Droit</option>
                        <option value="left">Gauche</option>
                        <option value="both">Ambidextre</option>
                      </select>
                    </Field>
                  </div>
                  <div style={s.row2}>
                    <Field label="Catégorie">
                      <select style={s.select} value={form.ageCategory} onChange={e => set('ageCategory')(e.target.value)}>
                        <option value="">— Catégorie —</option>
                        {AGE_CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Club actuel">
                      {clubsLoading ? (
                        <div style={{ ...s.input, color: colors.text.muted, display: 'flex', alignItems: 'center' }}>
                          Chargement...
                        </div>
                      ) : clubs.length === 0 ? (
                        <div style={s.emptyClub}>
                          <span style={{ fontSize: 13, color: colors.text.muted }}>Aucun club enregistré.</span>
                          <a href="/admin/clubs" style={{ fontSize: 12, color: colors.accent.gold, textDecoration: 'none', marginTop: 2 }}>
                            Créer un club →
                          </a>
                        </div>
                      ) : (
                        <select style={s.select} value={form.currentClubId} onChange={e => set('currentClubId')(e.target.value)}>
                          <option value="">— Aucun club —</option>
                          {clubs.map(c => (
                            <option key={c.id} value={c.id}>{c.nom}</option>
                          ))}
                        </select>
                      )}
                    </Field>
                  </div>
                </Section>

                {/* ── Académie ── */}
                <Section title="Académie">
                  <div style={s.row2}>
                    <Field label="Implantation">
                      <select style={s.select} value={form.implantationId}
                        onChange={e => { set('implantationId')(e.target.value); set('groupId')('') }}>
                        <option value="">— Implantation —</option>
                        {implantations.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Groupe">
                      <select style={s.select} value={form.groupId} onChange={e => set('groupId')(e.target.value)}
                        disabled={!form.implantationId}>
                        <option value="">— Groupe —</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </Section>

                {/* ── Papa ── */}
                <Section title="Papa">
                  <div style={s.row2}>
                    <Field label="Prénom">
                      <input style={s.input} value={form.parentFirstName}
                        onChange={e => set('parentFirstName')(e.target.value)} placeholder="Prénom" />
                    </Field>
                    <Field label="Nom">
                      <input style={s.input} value={form.parentLastName}
                        onChange={e => set('parentLastName')(e.target.value)} placeholder="Nom" />
                    </Field>
                  </div>
                  <div style={s.row2}>
                    <Field label="Email">
                      <input style={s.input} type="email" value={form.parentEmail}
                        onChange={e => set('parentEmail')(e.target.value)} placeholder="email@example.com" />
                    </Field>
                    <Field label="Téléphone">
                      <input style={s.input} value={form.parentPhone}
                        onChange={e => set('parentPhone')(e.target.value)} placeholder="+33 6 00 00 00 00" />
                    </Field>
                  </div>
                </Section>

                {/* ── Maman ── */}
                <Section title="Maman">
                  <div style={s.row2}>
                    <Field label="Prénom">
                      <input style={s.input} value={form.parent2FirstName}
                        onChange={e => set('parent2FirstName')(e.target.value)} placeholder="Prénom" />
                    </Field>
                    <Field label="Nom">
                      <input style={s.input} value={form.parent2LastName}
                        onChange={e => set('parent2LastName')(e.target.value)} placeholder="Nom" />
                    </Field>
                  </div>
                  <div style={s.row2}>
                    <Field label="Email">
                      <input style={s.input} type="email" value={form.parent2Email}
                        onChange={e => set('parent2Email')(e.target.value)} placeholder="email@example.com" />
                    </Field>
                    <Field label="Téléphone">
                      <input style={s.input} value={form.parent2Phone}
                        onChange={e => set('parent2Phone')(e.target.value)} placeholder="+33 6 00 00 00 00" />
                    </Field>
                  </div>
                </Section>
              </>
            )}

            {/* ── NOTES INTERNES (tous les rôles) ── */}
            <Section title="Notes internes">
              <textarea
                style={{ ...s.input, minHeight: 90, resize: 'vertical' as const, fontFamily: 'inherit' }}
                value={form.internalNotes}
                onChange={e => set('internalNotes')(e.target.value)}
                placeholder="Informations internes, remarques..." />
            </Section>

            {/* ── BADGE MODE ── */}
            <div style={s.modeBadgeRow}>
              <div style={{
                ...s.badge,
                background: mode === 'fiche' ? 'rgba(193,172,92,0.12)' : 'rgba(76,175,80,0.12)',
                color: mode === 'fiche' ? colors.accent.gold : colors.status.success,
              }}>
                {mode === 'fiche' ? '📋 Fiche locale — aucun email envoyé' : '✉️ Invitation — email envoyé à la création'}
              </div>
            </div>

            <div style={s.footer}>
              <button style={s.btnSecondary} onClick={() => setStep(2)}>← Retour</button>
              <button
                style={{ ...s.btnPrimary, opacity: submitting ? 0.6 : 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? 'Création...'
                  : mode === 'fiche' ? 'Créer la fiche' : 'Envoyer l\'invitation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sous-composants ────────────────────────────────────────────────────────────

function ModeCard({ active, onSelect, icon, title, desc, badge }: {
  active: boolean; onSelect(): void
  icon: string; title: string; desc: string; badge: string
}) {
  return (
    <div
      className="mode-card"
      onClick={onSelect}
      style={{
        padding: 24,
        borderRadius: 12,
        border: `2px solid ${active ? colors.accent.gold : colors.border.light}`,
        background: active ? colors.accent.gold + '26' : colors.light.surface,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        flex: 1,
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: colors.text.dark, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: colors.text.muted, lineHeight: 1.5, marginBottom: 12 }}>{desc}</div>
      <div style={{
        display: 'inline-block', fontSize: 11, fontWeight: 600,
        padding: '3px 10px', borderRadius: 20,
        background: active ? colors.accent.gold + '26' : 'transparent',
        border: `1px solid ${active ? colors.accent.gold : colors.border.light}`,
        color: active ? colors.accent.gold : colors.text.muted,
      }}>
        {badge}
      </div>
    </div>
  )
}

function RoleCard({ active, onSelect, icon, title, desc }: {
  active: boolean; onSelect(): void
  icon: string; title: string; desc: string
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: 20,
        borderRadius: 10,
        border: `2px solid ${active ? colors.accent.gold : colors.border.light}`,
        background: active ? colors.accent.gold + '26' : colors.light.surface,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        textAlign: 'center' as const,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, color: active ? colors.accent.gold : colors.text.dark, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: colors.text.muted, lineHeight: 1.4 }}>{desc}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 3, height: 16, background: colors.accent.gold, borderRadius: 2 }} />
        <span style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 13,
          color: colors.accent.gold, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: colors.border.light }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5, flex: 1 }}>
      <label style={{ fontSize: 12, color: error ? colors.accent.red : colors.text.muted, fontWeight: 500 }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: colors.accent.red }}>{error}</span>}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#F3EFE7',
    padding: '24px 16px 48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 680,
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#71717A',
    fontSize: 13,
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: 'Geist, sans-serif',
  },
  title: {
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 700,
    fontSize: 26,
    color: '#18181B',
    margin: 0,
    flex: 1,
  },
  steps: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#71717A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
  },
  stepDotActive: {
    border: '2px solid #C1AC5C',
    background: 'rgba(193,172,92,0.15)',
    color: '#C1AC5C',
  },
  stepLine: {
    width: 32,
    height: 2,
    background: '#E5E7EB',
  },
  stepLineActive: {
    background: '#C1AC5C',
  },
  card: {
    width: '100%',
    maxWidth: 680,
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #E5E7EB',
    padding: 32,
  },
  stepLabel: {
    fontSize: 11,
    color: '#C1AC5C',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: '0 0 8px',
  },
  stepTitle: {
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 700,
    fontSize: 22,
    color: '#18181B',
    margin: '0 0 28px',
  },
  modeGrid: {
    display: 'flex',
    gap: 16,
    marginBottom: 32,
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 32,
  },
  row2: {
    display: 'flex',
    gap: 12,
  },
  row3: {
    display: 'flex',
    gap: 12,
  },
  input: {
    background: '#F8F6F1',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    color: '#18181B',
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
    width: '100%',
    fontFamily: 'Geist, sans-serif',
    boxSizing: 'border-box',
  },
  inputError: {
    border: '1px solid #E05252',
  },
  select: {
    background: '#F8F6F1',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    color: '#18181B',
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
    width: '100%',
    fontFamily: 'Geist, sans-serif',
    cursor: 'pointer',
    appearance: 'none' as never,
  },
  label: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: 500,
    margin: 0,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 20,
  },
  modeBadgeRow: {
    marginBottom: 24,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 24,
    borderTop: '1px solid #E5E7EB',
  },
  btnPrimary: {
    background: '#C1AC5C',
    color: '#1A1A1A',
    border: 'none',
    borderRadius: 8,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Rajdhani, sans-serif',
    letterSpacing: '0.04em',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    background: 'transparent',
    color: '#71717A',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Geist, sans-serif',
  },
  errorBanner: {
    background: 'rgba(224,82,82,0.12)',
    border: '1px solid rgba(224,82,82,0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#E05252',
    fontSize: 13,
    marginBottom: 20,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(76,175,80,0.15)',
    border: '2px solid #4CAF50',
    color: '#4CAF50',
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  emptyClub: {
    background: '#F8F6F1',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
}

// Styles globaux (hover, focus)
const css = `
  input:focus, select:focus, textarea:focus {
    border-color: #C1AC5C !important;
    box-shadow: 0 0 0 3px rgba(193,172,92,0.12);
  }
  select option {
    background: #FFFFFF;
    color: #18181B;
  }
  select:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .mode-card:hover {
    border-color: rgba(193,172,92,0.5) !important;
  }
`
