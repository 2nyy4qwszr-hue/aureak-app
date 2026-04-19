date: 2026-04-19
status: pending

# ──────────── QUEUE DU JOUR — 2026-04-19 ────────────
#
# 🎯 FOCUS : Epic 89 Prospection Gardiens MVP (séance gratuite)
#
# Les 3 stories de cette queue sont ready-for-dev (fichiers complets avec AC + tasks + dev notes).
# Pattern séance gratuite = levier commercial critique pour conversion prospects gardiens.
#
# Ordre : 89-4 (invitation) → 89-5 (liste attente) → 89-6 (usage unique traçable)
#   - 89-4 pose le mécanisme d'invitation + email parent (dépendance pour 89-5)
#   - 89-5 ajoute la liste d'attente avec notif push sur absence détectée
#   - 89-6 ferme la boucle — traçabilité usage unique, éviter abus
#
# Dépendances techniques :
#   - Epic 86 DB live ✅ (migrations 00148-00152 appliquées)
#   - Table child_directory existante (pas besoin nouvelle table pour 89-4/5/6)
#   - Edge Function Resend (email) déjà configurée pour autres stories
#
# ─────────────────────────────────────────────────────────────────────────────

new_queue:
  - story_id: story-89-4
    story_file: _bmad-output/implementation-artifacts/89-4-invitation-seance-gratuite-depuis-app.md
    title: "Prospection Gardiens — Invitation séance gratuite depuis l'app (bouton + email parent)"
    priority: P1
    status: pending
    gate1: null
    gate2: null

  - story_id: story-89-5
    story_file: _bmad-output/implementation-artifacts/89-5-liste-attente-intelligente-notification-absence.md
    title: "Prospection Gardiens — Liste d'attente intelligente + notif push sur absence détectée"
    priority: P1
    status: pending
    gate1: null
    gate2: null

  - story_id: story-89-6
    story_file: _bmad-output/implementation-artifacts/89-6-seance-gratuite-usage-unique-tracable.md
    title: "Prospection Gardiens — Séance gratuite usage unique traçable"
    priority: P1
    status: pending
    gate1: null
    gate2: null

# ──────────── ROADMAP POST-QUEUE ────────────
#
# Après Epic 89 MVP (3 stories ci-dessus), il reste à :
#
# 📦 Story Factory requis (24 stories à créer — fichiers .md absents) :
#   - Epic 87 Académie Commerciaux/Marketeurs/Managers (3 stories)
#       → nouvelles pages /academie/commerciaux, /marketeurs, /managers + fiche universelle
#   - Epic 88 Prospection Clubs hub complet (6 stories)
#       → consolide Epic 85 existant + multi-contacts + closer detection + attribution
#   - Epic 89 reste (3 stories) :
#       · 89-1 recherche + ajout gardien par scout terrain mobile-first
#       · 89-2 note/évaluation scout rapide (5 étoiles + commentaire)
#       · 89-3 visibilité données conditionnelle par rôle (RGPD)
#   - Epic 90 Prospection Entraîneurs (2 stories)
#       → funnel 4 étapes + recommandation coach
#   - Epic 91 Marketing hub multi-canal (2 stories)
#       → médiathèque + sous-pages stub (réseaux, blog, pub)
#   - Epic 92 Partenariat sponsors/ambassadeurs (3 stories)
#       → sponsors + ambassadeurs + récap clubs partenaires
#
#   Lancer via : sous-agent Story Factory sur prompt brainstorming 2026-04-18
#
# 🧹 Dette technique (hors queue /go, corrections ad-hoc) :
#   - Task #15 : dead code handleTogglePresence (seances/[sessionId]/page.tsx L1589-1627)
#   - ~130 hex hardcodés restants (polish progressif, PR #32 a fait 37)
#   - 3 cellules seed permissions à réviser (Marketeur Académie, Club Performances, Coach Prospection)
#
# 📝 Ordre recommandé après Epic 89 :
#   1. Story Factory Epic 89 reste (89-1/2/3) — MVP scout terrain
#   2. Story Factory Epic 87 — débloque fiches nouveaux rôles
#   3. Story Factory Epic 88 — CRM clubs complet (consolide Epic 85)
#   4. Story Factory Epic 90/91/92 en parallèle
#
# 🎯 Objectif V1 "Business Dev complet" :
#   Épic 86 (fait) + Epic 87 + Epic 88 + Epic 89 + Epic 90 + Epic 91 + Epic 92
#   = ~30 stories total, ~3-5 semaines de dev selon vélocité
