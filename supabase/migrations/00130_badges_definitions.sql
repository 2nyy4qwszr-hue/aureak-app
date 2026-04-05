-- Migration 00130 — Gamification : 20 badges système
-- Story 59-4 — Définition complète des badges officiels Aureak
-- Note : badge_definitions exige tenant_id NOT NULL.
-- Ces badges sont insérés pour chaque tenant existant (via sub-select).
-- ON CONFLICT (tenant_id, code) DO NOTHING : les 5 badges MVP d'Epic 12 ne sont pas écrasés.

INSERT INTO badge_definitions (tenant_id, code, label, description, icon_url, points, is_active)
SELECT
  t.id AS tenant_id,
  b.code,
  b.label,
  b.description,
  b.icon_url,
  b.points,
  true AS is_active
FROM tenants t
CROSS JOIN (VALUES
  -- Assiduité
  ('ASSIDU_5',      'Régulier',           '5 présences enregistrées à l''académie',          '/badges/ASSIDU_5.svg',      10),
  ('ASSIDU_20',     'Assidu',             '20 présences enregistrées à l''académie',          '/badges/ASSIDU_20.svg',     30),
  ('CENTENAIRE',    'Centenaire',         '100 présences — une saison complète de légende',   '/badges/CENTENAIRE.svg',   100),
  -- Progression
  ('PREMIER_PAS',   'Premier Pas',        'Premier thème pédagogique acquis',                 '/badges/PREMIER_PAS.svg',   15),
  ('PROGRESSIF',    'Progressif',         '5 thèmes pédagogiques acquis',                     '/badges/PROGRESSIF.svg',    35),
  ('EXPERT',        'Expert',             '15 thèmes pédagogiques acquis',                    '/badges/EXPERT.svg',        75),
  -- Performance
  ('STAR_SEANCE',   'Star de séance',     'Note ≥ 9/10 obtenue lors d''une séance',           '/badges/STAR_SEANCE.svg',   25),
  ('PERFECTIONNISTE','Perfectionniste',   '3 notes ≥ 8 consécutives obtenues',                '/badges/PERFECTIONNISTE.svg',50),
  ('MVP_SEMAINE',   'MVP de la semaine',  'Élu meilleur joueur de la semaine',                '/badges/MVP_SEMAINE.svg',   60),
  -- Stages
  ('STAGIAIRE',     'Stagiaire',          'Participation à un premier stage Aureak',           '/badges/STAGIAIRE.svg',     20),
  ('VETERAN_STAGE', 'Vétéran Stage',      'Participation à 5 stages Aureak',                  '/badges/VETERAN_STAGE.svg', 55),
  -- Social
  ('CAPITAINE',     'Capitaine',          'Badge décerné par un coach pour leadership',       '/badges/CAPITAINE.svg',     40),
  ('FAIR_PLAY',     'Fair Play',          'Badge décerné par un coach pour fair-play',        '/badges/FAIR_PLAY.svg',     40),
  -- Série
  ('SERIE_5',       'Série ×5',           '5 séances consécutives sans absence',              '/badges/SERIE_5.svg',       45),
  ('SERIE_10',      'Série ×10',          '10 séances consécutives sans absence',             '/badges/SERIE_10.svg',      80),
  ('INVINCIBLE',    'Invincible',         '20 séances consécutives sans absence',             '/badges/INVINCIBLE.svg',   150),
  -- Spéciaux
  ('AMBASSADEUR',   'Ambassadeur',        'Badge attribué manuellement par un admin',         '/badges/AMBASSADEUR.svg',   70),
  ('PIONNIER',      'Pionnier',           'Premier de l''académie à débloquer un badge',      '/badges/PIONNIER.svg',      90),
  ('LEGENDAIRE',    'Légendaire',         'Tous les niveaux XP atteints (tier Légende)',      '/badges/LEGENDAIRE.svg',   200),
  ('SAISON_OR',     'Saison Or',          'Top 3 du classement XP en fin de saison',         '/badges/SAISON_OR.svg',    175)
) AS b(code, label, description, icon_url, points)
ON CONFLICT (tenant_id, code) DO NOTHING;
