Feature: Os du genou bien placés et symétriques L/R dans anatomy.glb
  Spec : docs/spec-phase12-os-genou.md (bug remonté 2026-11-18 : os mal placé au genou)

  Scenario: Les paires R/L d'os ont des translations miroir
    Given on lit le GLB anatomy.glb
    Then les paires R/L sont symétriques en translation (tolérance 0.02)

  Scenario: Tibia = gros maillage au mi-tibia, des deux côtés
    Given on lit le GLB anatomy.glb
    Then les tibias ont un maillage long (y > 0.3) au mi-tibia (t.y < -0.1)

  Scenario: Patella = petit maillage au front du genou, des deux côtés
    Given on lit le GLB anatomy.glb
    Then les patellas ont un petit maillage (y < 0.08) au front du genou (t.y > -0.05, t.z > 0.02)

  Scenario: Fibula = maillage long côté externe au mi-tibia, des deux côtés
    Given on lit le GLB anatomy.glb
    Then les fibulas ont un maillage long (y > 0.3) côté externe (|t.x| > 0.02) au mi-tibia (t.y < -0.1)
