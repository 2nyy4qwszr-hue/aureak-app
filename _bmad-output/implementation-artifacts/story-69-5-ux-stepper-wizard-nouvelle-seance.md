# Story 69.5 : UX — Stepper visuel wizard nouvelle séance (6 étapes)

Status: done

## Story
En tant qu'admin, je veux voir un stepper horizontal indiquant l'étape courante parmi les 6 du wizard de création de séance, afin de savoir où j'en suis et combien d'étapes restent.

## Acceptance Criteria
1. En haut du wizard `/seances/new`, afficher un stepper horizontal avec 6 points numérotés (1 à 6) + label court sous chaque point
2. Labels : Contexte · Détails · Thèmes · Ateliers · Date · Récap
3. Étape active : cercle fond `colors.accent.gold`, chiffre `colors.text.dark` bold, label `colors.text.dark`
4. Étapes précédentes (complétées) : cercle fond `colors.status.present` (vert), chiffre `#FFFFFF`
5. Étapes futures : cercle fond `colors.light.muted`, chiffre `colors.text.muted`, label `colors.text.subtle`
6. Ligne de connexion entre les cercles en `colors.border.divider` (hauteur 1px, centrée sur la hauteur des cercles)
7. Le stepper est visible à chaque step du wizard, en haut de la ScrollView principale

## Tasks
- [ ] T1 — Dans `seances/new.tsx`, localiser la variable d'état `step` (type `Step = 1 | 2 | 3 | 4 | 5 | 6`, définie ligne ~58) et la ScrollView principale du wizard
- [ ] T2 — Créer le composant inline `WizardStepper` :
  - Props : `{ currentStep: Step }`
  - Structure : `View flexDirection:'row', alignItems:'center', justifyContent:'center'` avec 6 items + 5 connecteurs
  - Chaque item = `View alignItems:'center'` avec cercle 28×28px + label 9px en dessous
  - Connecteur = `View flex:1, height:1, backgroundColor:colors.border.divider` entre chaque item
- [ ] T3 — Insérer `<WizardStepper currentStep={step} />` en haut de la ScrollView principale, avant le contenu de l'étape courante, avec `paddingVertical: space.md, paddingHorizontal: space.xl`
- [ ] T4 — Vérifier que le stepper se met à jour correctement lors des transitions entre étapes (boutons Suivant / Précédent)

## Dev Notes
React Native Web — View + StyleSheet. La variable `step` est de type `Step = 1 | 2 | 3 | 4 | 5 | 6` (définie ligne ~58 du fichier). `colors`, `space`, `radius` sont déjà importés.

Exemple de structure `WizardStepper` :
```tsx
const STEP_LABELS = ['Contexte', 'Détails', 'Thèmes', 'Ateliers', 'Date', 'Récap']

function WizardStepper({ currentStep }: { currentStep: Step }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, paddingVertical: space.md }}>
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isDone   = stepNum < currentStep
        const circleBg = isActive ? colors.accent.gold : isDone ? colors.status.present : colors.light.muted
        const numColor = (isActive || isDone) ? (isActive ? colors.text.dark : '#FFFFFF') : colors.text.muted
        const labelColor = isActive ? colors.text.dark : colors.text.subtle
        return (
          <React.Fragment key={stepNum}>
            {i > 0 && (
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border.divider, marginBottom: 18 }} />
            )}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: circleBg, alignItems: 'center', justifyContent: 'center' }}>
                <AureakText style={{ fontSize: 11, fontWeight: '700', color: numColor } as never}>{stepNum}</AureakText>
              </View>
              <AureakText style={{ fontSize: 9, color: labelColor, fontWeight: isActive ? '700' : '400' } as never}>{label}</AureakText>
            </View>
          </React.Fragment>
        )
      })}
    </View>
  )
}
```

Fichiers : `aureak/apps/web/app/(admin)/seances/new.tsx` (modifier)

## Dev Agent Record
### Agent Model Used
### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/new.tsx` | À modifier |
