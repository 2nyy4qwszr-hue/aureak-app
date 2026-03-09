import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Switch } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getThemeByKey,
  listAllByTheme,
  createQuestion,
  publishQuestion,
  unpublishQuestion,
  addOption,
  listOptionsByQuestion,
} from '@aureak/api-client'
import { AureakButton, AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { QuizQuestion, QuizOption, Theme } from '@aureak/types'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: space.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 6,
    padding: space.sm,
    color: colors.text.dark,
    backgroundColor: colors.light.primary,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    gap: space.xs,
    flexWrap: 'wrap',
  },
})

export default function QuizPage() {
  const { themeKey } = useLocalSearchParams<{ themeKey: string }>()
  const router = useRouter()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)

  // New question form
  const [questionText, setQuestionText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ])

  const load = async () => {
    if (!themeKey) return
    const [themeResult] = await Promise.all([
      getThemeByKey(themeKey),
      theme ? listAllByTheme(theme.id) : Promise.resolve({ data: [] }),
    ])
    if (themeResult.data) {
      setTheme(themeResult.data)
      const qResult = await listAllByTheme(themeResult.data.id)
      setQuestions(qResult.data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [themeKey])

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    setOptions(prev => prev.map((opt, i) => {
      if (i !== index) return field === 'isCorrect' && value ? { ...opt, isCorrect: false } : opt
      return { ...opt, [field]: value }
    }))
  }

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions(prev => [...prev, { text: '', isCorrect: false }])
    }
  }

  const handleRemoveOption = () => {
    if (options.length > 3) {
      setOptions(prev => prev.slice(0, -1))
    }
  }

  const handleCreate = async () => {
    if (!theme || !questionText.trim()) return
    const validOptions = options.filter(o => o.text.trim())
    if (validOptions.length < 3) return

    const { data: newQ } = await createQuestion({
      themeId     : theme.id,
      tenantId    : theme.tenantId,
      questionText: questionText.trim(),
      explanation : explanation.trim() || undefined,
    })

    if (newQ) {
      for (let i = 0; i < validOptions.length; i++) {
        await addOption({
          questionId: newQ.id,
          optionText: validOptions[i].text.trim(),
          isCorrect : validOptions[i].isCorrect,
          sortOrder : i,
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
    load()
  }

  const handlePublish = async (questionId: string) => {
    await publishQuestion(questionId)
    load()
  }

  const handleUnpublish = async (questionId: string) => {
    await unpublishQuestion(questionId)
    load()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <AureakButton
            label="← Retour"
            onPress={() => router.back()}
            variant="secondary"
          />
          <AureakText variant="h2">
            Quiz — {theme?.name ?? themeKey}
          </AureakText>
        </View>
      </View>

      {/* Formulaire création */}
      <View style={styles.card}>
        <AureakText variant="label">Nouvelle question</AureakText>
        <TextInput
          style={styles.input}
          placeholder="Question..."
          placeholderTextColor={colors.text.muted}
          value={questionText}
          onChangeText={setQuestionText}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Explication (optionnel)"
          placeholderTextColor={colors.text.muted}
          value={explanation}
          onChangeText={setExplanation}
          multiline
        />

        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          Options (3-4 obligatoires, cocher la bonne réponse)
        </AureakText>

        {options.map((opt, i) => (
          <View key={i} style={styles.optionRow}>
            <Switch
              value={opt.isCorrect}
              onValueChange={(val) => handleOptionChange(i, 'isCorrect', val)}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={`Option ${i + 1}`}
              placeholderTextColor={colors.text.muted}
              value={opt.text}
              onChangeText={(val) => handleOptionChange(i, 'text', val)}
            />
          </View>
        ))}

        <View style={styles.row}>
          {options.length < 4 && (
            <AureakButton label="+ Option" onPress={handleAddOption} variant="secondary" />
          )}
          {options.length > 3 && (
            <AureakButton label="- Option" onPress={handleRemoveOption} variant="secondary" />
          )}
        </View>

        <AureakButton label="Créer (draft)" onPress={handleCreate} variant="primary" />
      </View>

      {loading && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      )}

      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />
      ))}

      {!loading && questions.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucune question pour ce thème.
        </AureakText>
      )}
    </ScrollView>
  )
}

function QuestionCard({
  question,
  onPublish,
  onUnpublish,
}: {
  question: QuizQuestion
  onPublish: (id: string) => void
  onUnpublish: (id: string) => void
}) {
  const [options, setOptions] = useState<QuizOption[]>([])

  useEffect(() => {
    listOptionsByQuestion(question.id).then(({ data }) => setOptions(data))
  }, [question.id])

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Badge
          label={question.status === 'published' ? 'Publiée' : 'Brouillon'}
          variant={question.status === 'published' ? 'present' : 'zinc'}
        />
        <AureakText variant="label" style={{ flex: 1 }}>{question.questionText}</AureakText>
      </View>

      {question.explanation && (
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          {question.explanation}
        </AureakText>
      )}

      {options.map((opt) => (
        <View key={opt.id} style={styles.optionRow}>
          <AureakText
            variant="body"
            style={{ color: opt.isCorrect ? colors.accent.gold : colors.text.dark }}
          >
            {opt.isCorrect ? '✓ ' : '○ '}{opt.optionText}
          </AureakText>
        </View>
      ))}

      <AureakText variant="caption" style={{ color: colors.text.muted }}>
        {options.length} option(s)
      </AureakText>

      {question.status === 'draft' ? (
        <AureakButton
          label="Publier"
          onPress={() => onPublish(question.id)}
          variant="primary"
        />
      ) : (
        <AureakButton
          label="Dépublier"
          onPress={() => onUnpublish(question.id)}
          variant="secondary"
        />
      )}
    </View>
  )
}
