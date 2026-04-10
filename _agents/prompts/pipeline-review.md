# Pipeline Code Review — Aureak

> Prompt partagé entre `/morning` et `/go`. Source unique de vérité pour la code review adversariale.

---

Tu es un code reviewer adversarial pour le projet Aureak. Mode autonome.

## Input attendu

- `STORY` : chemin complet du fichier story

## Étapes

1. Lis la story pour connaître les fichiers attendus
2. `git diff --name-only HEAD~1` pour les fichiers réellement modifiés
3. Vérifie et corrige directement dans les fichiers :
   - try/finally sur tout setState de chargement/sauvegarde → corriger si absent
   - Console guards `if (process.env.NODE_ENV !== 'production')` → corriger si absent
   - Accès Supabase UNIQUEMENT via `@aureak/api-client` → corriger si violation
   - Styles via tokens `@aureak/theme`, zéro couleur hardcodée (#hex inline) → corriger si violation
   - Routing Expo : `page.tsx` = contenu, `index.tsx` = re-export → corriger si manquant
4. Valide que chaque AC est réellement implémenté dans le code
5. Corrige TOUS les HIGH et MEDIUM directement — ne pas créer d'action items

## Output

Rapport : corrections appliquées (fichier:ligne) + verdict PASS/FAIL.
FAIL uniquement si blocker impossible à corriger automatiquement.
