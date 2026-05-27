# ADR-040: Sessions-numreringskonvention — sekventiella heltal

- Status: Accepted (Session 8 K0b 2026-05-27)
- Datum: 2026-05-27
- Fas: Meta (Session 8 K0b — process-retrospektiv; syskon till ADR-023)

## Kontext

Det har aldrig funnits en formell definition av hur en arbetssession NUMRERAS.
[ADR-023](ADR-023-sessions-arkivering.md) täcker sessionsdok-filnamn och
arkivering; `docs/byggplan.md` definierar ADR-numrering — men ingen styrande
artefakt definierar tilldelningen av sessionsnumret självt (heltal vs decimal,
vem tilldelar, var det registreras). Frågan flaggades som öppen lessons-kandidat
i prep-arbete inför tidigare sessioner utan att lösas, och Session 8 K0a
identifierade den som samma klass av oklart-definierad styrande konvention som
ADR-023-vs-skill-tvetydigheten.

Det empiriska mönstret har varit sekventiella heltal med ad hoc decimal-
undernumrering för inskjutna sessioner: 6 → 6.5 → 6.6 → 6.6.5 → 6.6.6 → 6.6.7 →
6.7 → 7 → 8. Decimalerna skapade en olöslig ordnings-tvetydighet ("kommer 6.7
före eller efter 7?") och en oklar gräns mellan "ny session" och "fortsättning".

## Beslut

1. **Varje ny session får nästa heltal.** Inga decimaler, inga undantag —
   oavsett om sessionen är fas-arbete, en verifiering eller en retrospektiv.
2. **En session är en logisk arbetsenhet** oavsett hur många Chat-kontexter
   eller överlämningar den spänner. Mini-överlämningar är handoff-artefakter,
   inte nya sessioner. En paus renumreras inte.
3. **Numret deklareras av Marcus + Chat vid sessionsstart** och registreras i
   sessionsdok-titeln + `tasks/todo.md`.
4. **Faser är en separat axel.** Faser (Fas 2, Fas 2.5, …) tillhör byggplanens
   domän och rör INTE sessionsnumret. Ingen "session = fas"-koppling får läsas
   in; en session kan stänga noll, en eller flera faser.
5. **De historiska decimal-sessionerna grandfathras** (6.5/6.6/6.7/6.6.5–6.6.7)
   som praxis FÖRE denna konvention och skrivs INTE om — spårbarhet bevaras.

## Alternativ som övervägdes

- **Heltal, sekventiellt (VALT).** Etablerad branschpraxis för iterations- och
  sprint-numrering (Azure DevOps sprint/iteration-sekvens; SAFe / Targetprocess
  iteration-numrering; GitLab iterations). Entydig ordning, ingen gräns-tvetydighet.
- **Decimal-hierarki (avvisad).** Icke-standardiserad; gav den olösliga
  "6.7 vs 7"-ordnings-tvetydigheten och en luddig gräns mellan ny session och
  fortsättning.
- **Separat-axel-hierarki** (t.ex. session.subsession som formellt schema)
  **(avvisad).** Overkill för en enpersons-spoke; löser ett koordinations-problem
  som inte finns här.

## Konsekvenser

- Entydig, ordnings-bar sessionssekvens framåt; nästa session efter 8 är **9**.
- Decimal-historiken står kvar oförändrad (grandfathrad) — inga retroaktiva
  omskrivningar av sessionsdok, lessons eller ADR:er.
- Konventionen lever i en ADR (rationale + options bevarade), inte i
  konstitutionen — per [ADR-034](ADR-034-skill-arkitektur.md):s klassnings-princip
  (en ibland-relevant procedur hör inte i CLAUDE.md).
- Faser och sessionsnummer kan utvecklas oberoende utan att en koppling behöver
  underhållas.
