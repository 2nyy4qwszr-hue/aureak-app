# Story 52-4 : Toggle Galerie / Liste

Status: done
Epic: 52 — Player Cards
Priority: P1
Dependencies: 52-1

## Description

Toggle vue grille (PlayerCards) vs vue liste (tableau) sur la page Joueurs.
Persistance du choix via localStorage.
Page `/academie/joueurs`.

## Acceptance Criteria

- [x] AC1 : Bouton toggle grille/liste visible a cote du toggle AUREAK/PROSPECT
- [x] AC2 : Vue grille affiche les PlayerCards en grille responsive (gap tokens)
- [x] AC3 : Vue liste affiche le tableau existant (inchange)
- [x] AC4 : Persistance du choix dans localStorage (cle `aureak:joueurs:viewMode`)
- [x] AC5 : Icones SVG pour les deux modes (grille = GridIcon, liste = icone liste)
- [x] AC6 : Transition douce entre les deux vues

## Tasks

- [x] T1 : Ajouter state `viewMode` ('grid' | 'list') avec persistance localStorage
- [x] T2 : Creer toggle UI avec icones grille/liste
- [x] T3 : Creer vue grille PlayerCards responsive
- [x] T4 : Conditionner rendu table vs grille selon viewMode
- [x] T5 : Ajouter icone ListIcon dans `@aureak/ui/src/icons/`
