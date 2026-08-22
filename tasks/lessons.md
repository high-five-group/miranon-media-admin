---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk. Brand-rule-aktivering bevarad — endast Vale.Terms täcks av helfil-disable. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# tasks/lessons.md — Projektets organisatoriska minne (index)

> **Äger:** registret över volymfilerna (`tasks/lessons/vol-01..06.md`) —
> vilken volym som är aktiv och dess L-nummer-span. **Kartlägger:**
> volymfilerna själva (den faktiska lärdomstexten bor där, inte här). **Vid
> konflikt vinner:** volymfilerna för lärdomsinnehåll; detta index för
> navigering (aktiv volym, L-nummer-span) — domänerna är disjunkta, så ingen
> egentlig konflikt är möjlig.
>
> Aggregerade lärdomar från detta projekt. Varje korrigering, insikt och
> mönster fångas och märks `[UNIVERSAL]` när den bör lyftas till hub-repot
> (marcus-system). **Innehållet bor i volymfiler under `tasks/lessons/` — den
> här filen är registret över dem och den enda ingången.** Formen (tunt index
> · frysta volymer · en aktiv volym) följer Node.js-changelog-modellen och är
> beslutad i hubbens [ADR-085](../docs/decisions/ADR-085-hubbens-lessons-i-volymer.md)
> — tillämpad här som precedent (`TASK-161.9`, ingen ny formfråga) sedan
> monoliten passerade 794 000 tecken / 10 100 rader, långt över Read-verktygets
> 256 KB-gräns.
>
> **Läses INTE i sin helhet vid sessionsstart.** Den auktoritativa läsregeln
> är session-start-skillens sub-disciplin "stora statusfiler"
> (`plugins/marcus-system/skills/session-start/SKILL.md`, hub-repot): slå upp
> enskilda lärdomar on-demand (`grep -n "^### L3" tasks/lessons/` → `Read` med
> `offset`), eller läs de senaste via `offset` mot den aktiva volymens slut.
>
> **Senaste lyft till hubben:** `L512`–`L521`:s `[UNIVERSAL]`-poster
> (Session 109, 10 poster) → hub `K109.1`–`K109.10` (hub-commit
> `4cd2ffe`, spoke-commit `8b993fdc`). Hela spannet är lyft — samtliga
> tio bär markören, ingen olyft rest ur S109. Samma pass synkade
> `L485`:s tredje instans in i hubbens `K93.16`, som låg efter sin
> källa. Föregående lyft: `L469`–`L511` (Session 93 tionde resumen, 39
> poster) → hub `K93.1`–`K93.39` (hub-commit `a205132`, spoke-commits
> `7c06377c` + `aa2b802c`); EJ lyfta ur det spannet, med skäl: `L470`
> (bär ingen markör — ren empiri-bokföring) · `L493`/`L504`/`L509`
> (uttrycklig "Varför INTE"-rationale).
>
> **Olyft rest utanför S109:** `tasks/lessons.d/` bär 66 nummerlösa
> fragment, varav 35 med `[UNIVERSAL]`, från S102 och framåt plus några
> äldre utan sessionstagg. Deras konsolidering och hub-lyft är egna
> moment per session, inte denna rads ansvar.

---

## Volymer

| Volym | Span | Innehåll | L-rymd | Status |
|---|---|---|---|---|
| [vol-01](lessons/vol-01.md) | 2026-03-19 → 2026-05-04 | Tematisk pre-numrerings-era: Kritiska regler · Stack-specifika lärdomar · Design och UI · Arbetsflöde och process · Klient-specifikt · Mönster som fungerar · Audit och kvalitetsprocess · Arkiv: Vue-projektets lärdomar (referens) | före L-numreringen | Stängd |
| [vol-02](lessons/vol-02.md) | 2026-05-06 → 2026-06-12 | Session 3 → Session 16 (Fas 2-start → Fas 5 fas-avslut); L-numrering införs (Session 6.6.5) och löper nästlad i H2-sessionsblock | `L1` → `L102` | Stängd |
| [vol-03](lessons/vol-03.md) | 2026-06-13 → 2026-07-07 | Session 17 → Session 58 (repo-hygien, Fas 5.5–6h, MIGRERINGS-HUB-SESSION 1–3), fortsatt H2-nästlad L-numrering | `L103` → `L251` | Stängd |
| [vol-04](lessons/vol-04.md) | 2026-07-08 → 2026-07-26 | Session 59:s H2-block, därefter flat L-numrering utan ny H2 per session (källans konventionsskifte — se not) | `L252` → `L359` | Stängd |
| [vol-05](lessons/vol-05.md) | 2026-07-27 → 2026-07-30 | Session 91:s huvuddel (CI-paritet-fyndet, upphävande-räckvidd, m.fl.), flat L-numrering | `L360` → `L421` | Stängd |
| [vol-06](lessons/vol-06.md) | 2026-07-31 → | **Aktiv volym** — alla nya lärdomar landar här, flat L-numrering. **3 436 rader efter `L512`–`L521`** — nästa tillägg passerar rotationströskeln 3 000 och ska föregås av `vol-07` | `L422` → `L521` | **Aktiv** |

**Not om konventionsskiftet (vol-04–vol-06):** källfilen slutade skriva ett
nytt `## <datum> — Session N (…)`-block per session efter Session 59
(2026-07-08) — därefter tillkom lärdomar som platta `### Lnnn`-poster utan
H2-omslutning ända till `L479`. Volymgränserna för vol-04–vol-06 följer därför
`### Lnnn`-gränser i stället för H2-gränser; vol-01–vol-03 följer H2-gränser
rakt av, per ADR-085:s bokstav. Hubbens egen fil (ADR-085:s facit) är
enhetligt H2-per-lyft hela vägen och gav aldrig upphov till denna fråga — det
är en spoke-specifik divergens i källstrukturen, inte ett nytt formbeslut:
samma krav (verbatim kropp, aldrig bruten mitt i en post, kronologisk
ordning) gäller båda gränstyperna.

## Så här används filerna

- **Slå upp en post:** L-numret pekas ut av volymtabellens L-rymd-kolumn.
  Mekaniskt: `grep -rn '^### L360' tasks/lessons/`. 17 äldre poster i
  punktlistform (utan egen `###`-rubrik, `L103`–`L119`) hittas med
  `grep -rn '\*\*L[0-9]* —' tasks/lessons/`.
- **Nya poster:** alltid SIST i den aktiva volymen (`vol-06.md` just nu), som
  en ny `### Lnnn`-rubrik. Aldrig i denna indexfil, aldrig i en stängd volym.
  Formulera som en **regel**, inte en berättelse — "Gör X" eller "Gör aldrig
  Y". Om samma misstag händer två gånger: uppgradera till Kritisk regel. Vid
  normala tillägg rörs indexet inte alls — bara rotation ändrar tabellen.
- **Rotation:** är den aktiva volymen > 3 000 rader när ett nytt tillägg
  börjar — skapa `vol-<NN+1>.md` FÖRE tillägget, markera den som Aktiv här
  och stäng föregående rad med slutdatum + L-rymd. Volymfiler byter aldrig
  namn.
- **Stängda volymer är frysta:** nya poster tillkommer aldrig; en rättelse av
  en befintlig post görs i posten där den bor, som synlig ändring.
- **Vid sessionsstart:** läs INTE denna fil i sin helhet utöver vad
  session-start-skillens läsregel föreskriver (se blockquoten ovan) — samma
  läsdisciplin som gällde före uppdelningen, nu mekaniskt möjlig eftersom
  ingen enskild volym längre passerar Read-gränsen.

## Referens-invarianten

Uppdelningen 2026-08-08 (`TASK-161.9`) bevarade allt innehåll verbatim: 89
H2-block, 550 H3-rubriker (varav 462 numrerade `### Lnnn`-poster; resterande
88 är tematiska underrubriker, t.ex. i vol-01:s Stack-specifika
lärdomar-sektion, samt enstaka interna sub-rubriker inom långa L-poster) och
211 `[[Lnnn]]`-wikilänkar — summerade per volym och diff-verifierade
byte-identiska mot källfilen vid delningen (nollresultat på samtliga sex
`diff`-körningar). `[[Lnnn]]`-referenser är fil-oberoende (grep-uppslag), så
volymgränserna bryter inga pekare. 17 ytterligare poster (`L103`–`L119`) bor i
äldre punktlistform utan egen `###`-rubrik och ingår inte i H3-summan —
462 + 17 = 479 = högsta numrerade posten, ingen lucka.

**Två H2-rubriker utöver de 89 är REDAKTIONELLA, inte källinnehåll** — en
vardera i `vol-05.md` och `vol-06.md` ("Fortsättning: flat L-numrering …"),
tillagda enbart för giltig rubrik-hierarki (MD001) där källan saknade en
`## Session N`-omslutning för den sträckan. Volymernas H2-summa är därför 91,
men Referens-invariantens 89 gäller allt **bevarat** innehåll — de två är
tydligt märkta som tillägg i sin egen brödtext, inte dolda i räkningen.

Interna `../docs/decisions/`-länkar i lärdomskropparna justerades till
`../../docs/decisions/` (ett extra kataloglevel — volymerna bor på
`tasks/lessons/`, ett steg djupare än den gamla `tasks/lessons.md`). Samma
mekaniska justering som `git mv` en nivå ner hade krävt av VARJE verktyg;
själva länkmålen och all lärdomstext är oförändrade. 8 länkar i `vol-02.md`,
`vol-03.md` och `vol-06.md` berördes — verifierat med `lychee` före/efter.

Externa filer som länkar en specifik rad in i den gamla monolitfilen (t.ex.
formen `[L416](../../tasks/lessons.md)`) förblir länk-giltiga (filen finns
fortfarande) men pekar inte längre på exakt innehåll — känt, inte i denna
skivas scope, bokfört i landningens sessionsdok.
