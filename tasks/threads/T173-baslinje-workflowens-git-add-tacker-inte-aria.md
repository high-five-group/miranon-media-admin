---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: stable
lifecycle: paused
---

# T173 — Baslinje-workflowens `git add` täcker inte `__aria__`: en ARIA-drift kastas tyst

> Registrerad 2026-08-22 (S109, sista bokföringspasset för S109-spåret) under
> ADR-053-triage: **blockerar ej, värdefullt → defer**. Upptäckt när
> `TASK-285.11`:s och `TASK-283.4`:s baslinje-lås stängdes och workflowens
> `git add`-rad lästes mot vad `--update-snapshots` faktiskt rör.
> **`paused`** — ingenting i S109-spåret väntar på den.

## Vad som är mätt

Mätt mot `.github/workflows/visual-baselines.yml` på `main` `918b6576`
(2026-08-22).

**Generering (rad 165–173) rör hela snapshot-ytan.** Steget kör
`npm run test:visual -- --update-snapshots` (utan filter) respektive
`npm run test:visual -- "${FILTER}" --update-snapshots`. Playwrights
`--update-snapshots` skriver om BÅDE `.png`-baslinjer och ARIA-referenser.
Att den rör ARIA-filer är inte härlett utan mätt i repot:
`TASK-283.4`:s bygg-agent körde samma flagga mot
`personer-promoverings-grind.spec.ts` och fick **2 av 6** ARIA-filer
omskrivna med preset `changed`, **6 av 6** med `=all`.

**Detektion och staging (rad 189–213) ser bara skärmbilder.**

```text
189: if git status --porcelain -uall -- tests/visual/__screenshots__ | grep -q .; then
190:   antal=$(git status --porcelain -uall -- tests/visual/__screenshots__ | wc -l | tr -d ' ')
...
213:   git add tests/visual/__screenshots__
```

**Ytan som ligger utanför är inte liten.** `git ls-files tests/visual/__aria__/`
ger **76 spårade filer**, samtliga `.yml`.

## Varför det spelar roll

1. **Drift kastas tyst.** En ARIA-referens som skrivs om i CI stageas aldrig,
   commitas aldrig och försvinner när runnern rivs. Ingen diff, inget fel,
   exit 0.
2. **Ett falskt besked är möjligt.** Ändras BARA ARIA-filer faller steget till
   `else`-grenen och skriver ut *"Inga baseline-ändringar (scope …) —
   renderingen matchar incheckade bilder."* Den andra halvan av meningen är då
   sann och den första falsk.
3. **Det som kastas är facit, inte bara en testartefakt.** `check-facit.sh`
   invariant (d) låser referenserna mot `sha256` i de stämplade manifesten —
   en drift som NÅTT git hade fällt en grind. Att den i stället kastas döljer
   ett facit-brott i stället för att visa det. Täckningen är dessutom partiell:
   endast **4 av 12** manifest namnger sina `__aria__`-sökvägar
   (`check-facit.sh` filhuvud).

## Lösningsrymden (ej utredd — det är trådens jobb)

- Vidga detektion + `git add` till `tests/visual/__aria__` och låta ARIA-drift
  bli en granskningsbar diff i baseline-PR:en. Kräver ställningstagande till
  PR-titelns bildräkning (ARIA-filer är inte bilder) och till hur en
  facit-låst referens ska hanteras när `check-facit` fäller på den nya sha256:n.
- Eller: aktivt NEKA ARIA-omskrivning i workflowen (`--update-snapshots` enbart
  mot screenshot-projekten) så att låset förblir orört och drift i stället
  fångas av en röd grind.

De två går åt motsatta håll — den ena gör drift synlig, den andra gör den
omöjlig — och valet är ett regim-beslut, inte en skript-detalj.

## Besläktade

- `T172` — facit-regimernas täckning (samma familj: vad ser vilken vakt).
- `T87` — visual-grind-aktivering (baslinje-workflowens hemvist).
- `TASK-298` — riktad baseline-dispatch; rörde samma workflow utan att röra
  denna rad.
