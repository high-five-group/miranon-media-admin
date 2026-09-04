---
id: TASK-161.7
title: 'Skiva: hub-standarderna — frontmatter, kadens och grind i marcus-system'
status: Done
assignee: []
created_date: '2026-08-07 19:10'
updated_date: '2026-08-08 07:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.1
modified_files:
  - marcus-system/CLAUDE.md
  - marcus-system/SYSTEMET.md
  - marcus-system/IDENTITET.md
  - marcus-system/README.md
  - marcus-system/SKILLS-INVENTORY.md
  - marcus-system/.frontmatter-policy.conf
  - marcus-system/.githooks/pre-commit
  - marcus-system/scripts/check-frontmatter.sh
  - marcus-system/scripts/test-check-frontmatter.sh
  - CLAUDE.md
parent_task_id: TASK-161
ordinal: 297000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: hubbens styrande docs bär samma frontmatter-standard, kadensgrind och ägar-deklaration som spokens — byggt i den form som senare kan lyftas till central tjänst (T137). Täcker användarberättelser: 7, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: hubbens enforcement-ytor inventerade (NOLL CI-workflows mätt 2026-08-07; finns .githooks/pre-commit?) — vägvalet hub-CI kontra pre-commit-hook avgörs mot fyndet och bokförs; agenten kör OISOLERAT eller via git -C-vägen (spoke-matrisens form)
- [x] #2 Hubbens styrande docs (CLAUDE.md, SYSTEMET.md, IDENTITET.md m.fl. — inventeras) får frontmatter (owner/updated/review_by/status) + ägar-deklaration per 161.1:s form; check-frontmatter-logiken dupliceras som universellt skript + hubbens egen policy-conf (Lesson #6; centraliserings-KOMPATIBELT per T137 — föregrip INTE central tjänst)
- [x] #3 Ö8-dubbletterna (fem hub/spoke-dubblerade instruktionsrader inkl. kopierade mättal) löses: hubben behåller regeln, spoke-specialiseringen pekar; hubbens stale updated-fält synkas mot git-datum
- [x] #4 Grind-logiken tvåsidigt testad i hubben; spoke-docs-grindarna gröna för ev. spoke-pekar-ändringar; ändringar committade + pushade i hubben, plugin-bump ENDAST om skill-/plugin-filer rörs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS-DIVERGENS (bokförd öppet, ADR-086): uppdraget hänvisade Ö8-
instanserna (de fem hub/spoke-dubblerade raderna) till "PRD:n/Del 10-
underlaget" — verifierat mot disk: varken TASK-161-kortet eller
tasks/sessions/archive/2026-08/2026-08-07-session-99.md § Del 10 enumererar dem. Ingen
"Explore-kartan"-fil hittades i repot. Agenten identifierade de fem
raderna själv genom systematisk grep-jämförelse mellan hub-CLAUDE.md
§ Instruktioner och spoke-CLAUDE.md § Instruktioner — se slutrapport för
fil:rad-par och metod. Källan för AC#3:s "fem" var alltså en HYPOTES tills
denna skiva prövade den; den råkade stämma exakt (5/5).

Hub-inventeringen (AC#2, "m.fl. — inventeras") är agentens eget,
disk-motiverade urval: CLAUDE.md, SYSTEMET.md, IDENTITET.md, README.md,
SKILLS-INVENTORY.md. SYSTEM-INVENTORY.md, profile.md, projects.md m.fl.
uteslöts medvetet (generad ögonblicksbild resp. data/guide, inte
regelbärande styrande dok) — se .frontmatter-policy.conf (hub) för
resonemanget.

Vägval AC#1: hubben hade NOLL CI-workflows OCH noll git-hookar. Pre-commit-
hooken fick bära BÅDA rollerna (mjuk auto-bump + hård gate) eftersom
hubben saknar den andra mekanismen. Landningsform verifierad live: hub-
repot (high-five-group/marcus-system) har varken ruleset eller branch
protection på main — direktpush bekräftad som norm.

Worktreen var en commit bakom origin/main vid start (da654409 vs 8fd3441d)
— fast-forwardad innan arbete påbörjades (fångade ADR-100 § Updates
2026-08-08, redan landad via TASK-161.1/PR #961). Under spoke-fasen landade
även TASK-161.2 (PR #965, drift-rättning i CLAUDE.md) — worktreen
fast-forwardades igen före Ö8-editeringen; alla fem mål-rader verifierade
oförändrade på samma radnummer efter den landningen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08): spoke-PR #968 mergad 4df71eb0 per-jobb-grön (0 fail/pending) + hub-commit 0addc413 direktpushad till marcus-system main (landningsform verifierad live: rulesets tom lista, branch protection 404). Hubben: fem styrande docs (CLAUDE.md, SYSTEMET.md, IDENTITET.md, README.md, SKILLS-INVENTORY.md) fick frontmatter + ägar-deklaration per ADR-100-formen; check-frontmatter-logiken duplicerad som universellt skript + hubbens egen .frontmatter-policy.conf (Lesson #6, T137-kompatibel); ny pre-commit-hook bär BÅDA rollerna (auto-bump updated + hård review_by-gate) — vägvalet mot hub-CI bokfört (noll befintlig CI-infrastruktur). Tvåsidig svit 4/4 PASS + dogfooding: den riktiga hub-committen gick själv genom den nyaktiverade hooken. Spoke: fem Ö8-dubblettrader till pekare, specialiseringen bevarad. Divergens öppet bokförd i notes: Explore-kartan/Ö8-listan finns inte som filartefakt — paren re-deriverade via grep hub-mot-spoke (5/5); lesson-kandidat av kontinuitets-klassen (L26-familjen). Ingen plugin-bump (inget under plugins/ rört). test:api-fallet var staging-preflight-lås från samtidig post-merge-körning, ej diff-relaterat (verifierat vid omkörning; diffen är ren markdown = D0-klass).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
