# Archive — Migrations historiques (00001–00090)

Ce dossier contient les migrations originales du projet (phase de prototypage).

## ⚠️ NE PAS UTILISER pour de nouvelles migrations

**Source de vérité unique : `supabase/migrations/` à la racine du dépôt**

Le dossier racine `supabase/migrations/` contient l'intégralité des migrations
dans l'ordre (00001–00110+), y compris toutes celles présentes ici.

## Pourquoi ce dossier existe-t-il ?

Les migrations 00001–00090 ont été développées dans `aureak/supabase/migrations/`
pendant la phase initiale du projet. À partir de la migration 00091, la racine
`supabase/migrations/` est devenue la source unique.

Le dossier racine a ensuite absorbé rétroactivement les anciennes migrations
(00001–00090) pour former un set complet et ordonné.

## Pour un nouveau projet Supabase

Utiliser `supabase/migrations/` (racine) — elle contient tout dans l'ordre.
