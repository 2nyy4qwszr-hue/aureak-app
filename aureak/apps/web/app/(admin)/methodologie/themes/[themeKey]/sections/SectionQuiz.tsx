'use client'
// SectionQuiz — Réutilise la logique du quiz existant (quiz/page.tsx)
// Ne duplique pas la logique : charge les questions du thème et les affiche.
import React, { useEffect, useState } from 'react'
import {
  getThemeByKey,
  listAllByTheme,
  createQuestion,
  publishQuestion,
  unpublishQuestion,
  addOption,
  listOptionsByQuestionIds,
} from '@aureak/api-client'
import { colors, shadows, radius, transitions } from '@aureak/theme'
import type { QuizQuestion, QuizOption, Theme } from '@aureak/types'

type Props = {
  themeKey: string
  themeId: string
}

export default function SectionQuiz({ themeKey, themeId }: Props) {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [optionsMap, setOptionsMap] = useState<Record<string, QuizOption[]>>({})
  const [loading, setLoading] = useState(true)

  // New question form
  const [questionText, setQuestionText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ])
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    if (!themeId) {
      setLoading(false)
      return
    }
    try {
      const [themeResult, qResult] = await Promise.all([
        getThemeByKey(themeKey),
        listAllByTheme(themeId),
      ])
      if (themeResult.data) setTheme(themeResult.data)
      const qs = qResult.data ?? []
      setQuestions(qs)
      const allOptions = await listOptionsByQuestionIds(qs.map(q => q.id))
      const map: Record<string, QuizOption[]> = {}
      for (const opt of allOptions) {
        // PostgREST retourne question_id (snake_case) — fallback sur questionId si mapping présent
        const key = (opt as Record<string, unknown>).question_id as string ?? opt.questionId
        const arr = map[key] ?? []
        arr.push(opt)
        map[key] = arr
      }
      setOptionsMap(map)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [themeId, themeKey])

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    setOptions(prev => prev.map((opt, i) => {
      if (i !== index) return field === 'isCorrect' && value ? { ...opt, isCorrect: false } : opt
      return { ...opt, [field]: value }
    }))
  }

  const handleCreate = async () => {
    if (!themeId || !questionText.trim()) return
    const validOptions = options.filter(o => o.text.trim())
    if (validOptions.length < 3) return
    setCreating(true)
    try {
      const resolvedTheme = theme
      if (!resolvedTheme) return
      const { data: newQ } = await createQuestion({
        themeId,
        tenantId: resolvedTheme.tenantId,
        questionText: questionText.trim(),
        explanation: explanation.trim() || undefined,
      })
      if (newQ) {
        for (let i = 0; i < validOptions.length; i++) {
          await addOption({
            questionId: newQ.id,
            optionText: validOptions[i].text.trim(),
            isCorrect: validOptions[i].isCorrect,
            sortOrder: i,
          })
        }
      }
      setQuestionText('')
      setExplanation('')
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ])
      await load()
    } finally {
      setCreating(false)
    }
  }

  const handlePublish = async (questionId: string) => {
    await publishQuestion(questionId)
    load()
  }

  const handleUnpublish = async (questionId: string) => {
    await unpublishQuestion(questionId)
    load()
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1,2].map(i => <div key={i} style={{ height: 80, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 12 }} />)}
    </div>
  )

  const LABEL_STYLE: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: 1,
    textTransform: 'uppercase', color: colors.text.muted,
    display: 'block', marginBottom: 6,
  }

  const INPUT_STYLE: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: radius.xs,
    border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface,
    color: colors.text.dark, fontSize: 13, fontFamily: 'Poppins, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, resize: 'vertical' }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Poppins, sans-serif', margin: '0 0 4px' }}>
          Quiz de connaissance
        </h2>
        <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
          Questions de quiz pour valider la compréhension théorique du thème.
          {questions.length > 0 && ` (${questions.filter(q => q.status === 'published').length} publiées / ${questions.length} total)`}
        </p>
      </div>

      {/* Formulaire création */}
      <div style={{
        backgroundColor: colors.light.surface, borderRadius: radius.card,
        border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm,
        padding: '20px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.text.dark, marginBottom: 14 }}>
          ➕ Nouvelle question
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Question *</label>
          <textarea
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            rows={2}
            style={TEXTAREA_STYLE}
            placeholder="Question à poser au joueur..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Explication (optionnel)</label>
          <textarea
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            rows={2}
            style={TEXTAREA_STYLE}
            placeholder="Explication affichée après la réponse..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Options (3-4 — cocher la bonne réponse)</label>
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={opt.isCorrect}
                onChange={e => handleOptionChange(i, 'isCorrect', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: colors.accent.gold, flexShrink: 0 }}
              />
              <input
                type="text"
                value={opt.text}
                onChange={e => handleOptionChange(i, 'text', e.target.value)}
                style={{ ...INPUT_STYLE, flex: 1 }}
                placeholder={`Option ${i + 1}`}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {options.length < 4 && (
              <button
                onClick={() => setOptions(prev => [...prev, { text: '', isCorrect: false }])}
                style={{ fontSize: 11, padding: '4px 10px', backgroundColor: 'transparent', border: `1px solid ${colors.border.light}`, borderRadius: 6, cursor: 'pointer', color: colors.text.muted }}
              >
                + Option
              </button>
            )}
            {options.length > 3 && (
              <button
                onClick={() => setOptions(prev => prev.slice(0, -1))}
                style={{ fontSize: 11, padding: '4px 10px', backgroundColor: 'transparent', border: `1px solid ${colors.border.light}`, borderRadius: 6, cursor: 'pointer', color: colors.accent.red }}
              >
                - Option
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            padding: '8px 20px', backgroundColor: colors.accent.gold, color: '#fff',
            border: 'none', borderRadius: radius.button, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Poppins, sans-serif', transition: `all ${transitions.fast}`,
          }}
        >
          {creating ? 'Création...' : 'Créer (brouillon)'}
        </button>
      </div>

      {questions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucune question. Créez vos premières questions de quiz.
        </div>
      )}

      {questions.map(q => (
        <QuestionCard
          key={q.id}
          question={q}
          options={optionsMap[q.id] ?? []}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />
      ))}
    </div>
  )
}

function QuestionCard({
  question,
  options,
  onPublish,
  onUnpublish,
}: {
  question: QuizQuestion
  options: QuizOption[]
  onPublish: (id: string) => void
  onUnpublish: (id: string) => void
}) {
  const isPublished = question.status === 'published'

  return (
    <div style={{
      backgroundColor: colors.light.surface, borderRadius: radius.card,
      border: `1px solid ${isPublished ? colors.status.success + '40' : colors.border.light}`,
      boxShadow: shadows.sm, padding: '16px 20px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 999,
              backgroundColor: isPublished ? colors.status.success + '20' : colors.light.muted,
              color: isPublished ? colors.status.success : colors.text.muted,
              border: `1px solid ${isPublished ? colors.status.success + '40' : colors.border.light}`,
            }}>
              {isPublished ? '✓ Publiée' : 'Brouillon'}
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: colors.text.dark, lineHeight: 1.4 }}>
            🧠 {question.questionText}
          </div>
          {question.explanation && (
            <p style={{ fontSize: 12, color: colors.text.muted, margin: '6px 0 0', fontStyle: 'italic' }}>
              {question.explanation}
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {options.map(opt => (
          <div key={opt.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 0',
            color: opt.isCorrect ? colors.status.success : colors.text.muted,
            fontSize: 13,
          }}>
            <span>{opt.isCorrect ? '✓' : '○'}</span>
            <span>{opt.optionText}</span>
          </div>
        ))}
        {options.length === 0 && (
          <p style={{ fontSize: 12, color: colors.text.subtle }}>Aucune option définie.</p>
        )}
      </div>

      {isPublished ? (
        <button
          onClick={() => onUnpublish(question.id)}
          style={{
            padding: '6px 14px', backgroundColor: 'transparent', color: colors.text.muted,
            border: `1px solid ${colors.border.light}`, borderRadius: radius.button,
            fontSize: 12, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
          }}
        >
          Dépublier
        </button>
      ) : (
        <button
          onClick={() => onPublish(question.id)}
          style={{
            padding: '6px 14px', backgroundColor: colors.status.success, color: '#fff',
            border: 'none', borderRadius: radius.button,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
          }}
        >
          Publier
        </button>
      )}
    </div>
  )
}
