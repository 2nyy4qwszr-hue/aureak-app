date: 2026-04-18
status: done

# ──────────── QUEUE DU JOUR ────────────
# Epic 86 Architecture Rôles & Permissions — fondation brainstorming 2026-04-18
# Ordre strictement séquentiel : 86-1 (migration enum) → 86-2 (multi-rôle) → 86-3 (permissions) → 86-4 (sidebar dyn)

new_queue:
  - story_id: story-86-1
    story_file: _bmad-output/implementation-artifacts/story-86-1-roles-db-manager-marketeur.md
    title: "DB — Ajout rôles manager + marketeur dans enum user_role (migration 00148)"
    priority: P0
    status: done
    gate1: SKIP (no .tsx — SQL + types only)
    gate2: SKIP (no .tsx — SQL + types only)

  - story_id: story-86-2
    story_file: _bmad-output/implementation-artifacts/story-86-2-multi-role-profile-roles-switcher.md
    title: "Multi-rôle — table profile_roles + API + hook useCurrentRole + RoleSwitcher UI"
    priority: P0
    status: done
    gate1: SKIP (review addressed 2 BLOCKER + 2 HIGH — see commit)
    gate2: SKIP (review addressed 2 BLOCKER + 2 HIGH — see commit)

  - story_id: story-86-3
    story_file: _bmad-output/implementation-artifacts/story-86-3-permissions-granulaires-matrice-admin.md
    title: "Permissions — tables section_permissions + user_section_overrides + page admin matrice"
    priority: P0
    status: done
    gate1: SKIP (review addressed 2 BLOCKER + 1 HIGH)
    gate2: SKIP (review addressed 2 BLOCKER + 1 HIGH)

  - story_id: story-86-4
    story_file: _bmad-output/implementation-artifacts/story-86-4-sidebar-dynamique-permissions.md
    title: "Sidebar dynamique — refactor _layout.tsx selon getEffectivePermissions + RoleSwitcher"
    priority: P0
    status: done
    gate1: SKIP (review PASS + 2 HIGH fixés — EffectivePermissions typing + skeleton contrast)
    gate2: SKIP (review PASS + 2 HIGH fixés — EffectivePermissions typing + skeleton contrast)
