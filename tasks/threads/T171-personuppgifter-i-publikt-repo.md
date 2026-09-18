---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: stable
lifecycle: active
---

# T171 — Verkliga personuppgifter ur Airtable-basen ligger i det publika repot

> Registrerad i S108 (2026-08-22) på Marcus order (*"Regga tråden är du
> snäll"*), efter att en bygg-agent flaggade ett kundnamn i en test-fixture
> och orkestrerarens mätning visade att det var ett mönster, inte ett
> undantag. **`active`** — repot är `PUBLIC` (`gh repo view`), och
> uppgifterna är läsbara för vem som helst i dag.

## Vad som är mätt (2026-08-22, `origin/main` `9d4f3167`)

| Klass | Exempel | Var | Mätt med |
|---|---|---|---|
| Kundnamn ur kvittoförlagan, kopplat till ett köp | (pseudonymiserad i `#1786`) | 7 ytor: test-fixture, kodkommentar, `ADR-109`, research, `T170`, tre sessionsdok | `git grep` |
| Verkliga personnamn ur basen, citerade som dubblett-/defektbevis | fem kända namn | **≥ 13 filer**: `docs/reference/data-model.md`, `docs/BUILD-LOG.md`, `docs/backfill/execute-log.md`, `docs/backfill/segment-export/export.mjs`, fyra research-dok, `task-229`, `tasks/lessons/vol-04.md`, `todo.md`, `threads/README.md` | `git grep -l -E` på fem namn — **undre gräns**, fler namn finns säkert |
| **Live-dump av anmälda** med fullständiga namn, tidsstämpel, status | tabellen `\| ID \| Skapat \| Namn \| Status \| Typ \|` | `docs/research/datamodell-research/02-live-state.md` rad ~608 ff | läsning |
| Verkliga e-postadresser | `K***@hotmail.com` (maskad i `#1786`) + minst fyra gmail-adresser | research/backfill | regex över repot, allowlist för test-/exempel-domäner |

Det som INTE är personuppgift och får stå kvar: Airtable record-ID:n
(`recXXXX`), anmälnings-ID:n, belopp, datum utan namn, Roger & Lottas egna
firma-uppgifter (publika på ett kvitto de själva skickar).

## Varför det hände — arbetssättet, inte slarv

Basdefekt-kartläggningen (S102–S106) och backfillen bevisar dubbletter och
länkfel genom att citera de verkliga records som är fel: *"Ulrika X bär två
Person-records"* är beviset. Det är rätt metod — och fel medium. Beviset
behöver record-ID:t och EN stabil pseudonym, aldrig namnet. Samma sak för
kvittoförlagan: vi behövde strukturen och talen, aldrig kunden.

## Vad tråden ska leverera

1. **Pseudonymisera på `main`** — alla klasser ovan, en stabil pseudonym per
   person (så dubblett-bevisen fortfarande går att följa), e-post maskad
   till `X***@domän`. Live-dumpen i `02-live-state.md`: ersätt namnkolumnen
   eller ta bort tabellen (ID + tidsstämpel räcker för dess poäng).
2. **Citeringsregel** i `CLAUDE.md` § Instruktioner eller `data-model.md`:
   basdata citeras med record-ID + pseudonym; förlagor med persondata
   pseudonymiseras vid FÖRSTA citatet, inte vid upptäckt. Lesson-kandidat
   `[UNIVERSAL]`.
3. **Grind, om Marcus vill:** en e-postregex-vakt i `check:docs` med
   allowlist (`example.com`, `*.test`, `miranon.se`, firmadomänerna) —
   billig, fångar klassen som är lättast att matcha mekaniskt. Namn går
   inte att grinda; där bär regeln.
4. **Git-historiken** — separat Marcus-beslut. Uppgifterna finns kvar i
   commits även efter punkt 1. History-rewrite (`git filter-repo` +
   force-push + GitHub-support för cachade vyer) är irreversibel och
   påverkar alla worktrees och parallella sessioner; görs i så fall i ett
   eget, tomt fönster.

## Adjacent, lägre allvarlighetsgrad — kvitto-utkast i Storage (TASK-302.3, ADR-124)

Inte samma klass som tabellen ovan (den handlar om persondata COMMITTAD i
det PUBLIKA GIT-repot; detta är ett Supabase Storage-objekt, aldrig
committat) — bokfört här ändå eftersom det är samma UNDERLIGGANDE
persondata (köparuppgifter ur ett kvitto) i en NY leveransväg som tillkom
2026-08-22 (`ADR-124`, transient utkast för PDF-förhandsgranskning).

- **Vad som exponeras:** kvitto-utkastet (`typ: 'kvitto'`, `_shared/
  utkast.ts` § `laggUtkast`) innehåller SAMMA köparuppgifter
  (`kvittoRader`, `_shared/receipt-content.ts`) som det slutgiltiga,
  skickade kvittot — kundnamn, belopp, betalsätt, event.
- **Kompenserande kontroller, redan på plats:** bucket `bilagor` är privat
  (ingen publik URL fungerar), åtkomst kräver en SIGNERAD URL med
  `SIGNED_DOWNLOAD_URL_TTL_SECONDS` = 300 sekunder (samma konstant klass A
  redan bär), och det finns HÖGST ETT utkast per event (`upsert: true`,
  `utkast/<eventId>/kvitto.pdf`) — mängden växer aldrig.
- **Borttaget vid skarp sändning:** en lyckad kvittosändning
  (`_shared/send-receipt.ts` § `sendReceipt`, steg 7) tar bort utkastet
  EFTER lyckad, finaliserad sändning — `rensaUtkast`, `_shared/utkast.ts`.
- **Känd rest, medvetet inte löst här:** prod saknar TIDSSTYRD städning.
  Ett event vars kvitto ALDRIG skickas (Lotta börjar men avbryter) behåller
  sitt utkast på obestämd tid — mängden är bunden PER EVENT, inte
  eliminerad. Samma öppna punkt som `ADR-124` § "Öppet, och medvetet inte
  beslutat här" redan bokför; ingen ny status här, bara en tydlig länk från
  T171 till den. Byggs när en mätning visar att det kostar något
  (dubbelriktad över-engineering-vakt — ingen `pg_cron`/`waitUntil` utan en
  nuvarande användare).
- Om `T171`:s punkt 2 (citeringsregel/policy för persondata) landar i en
  striktare form: denna leveransväg följer den, eftersom den redan är den
  strängaste tillgängliga (privat + signerad + kortlivad + bunden mängd).

## Vad som är gjort

- `#1786` (S108, 2026-08-22): kvittoförlagans kund pseudonymiserad i alla
  sju ytor, den lokala PDF:en omdöpt, en e-postadress maskad.
- `TASK-302.3` (2026-08-22): kvitto-utkastets exponeringsklass bokförd ovan
  (§ Adjacent) — ingen kod ändrad av DENNA post, endast bokföring.
- **Punkt 1 + 2 KLARA (S126, 2026-09-18, Marcus GO).** 100 verkliga personer
  → `Deltagare NN` (stabil pseudonym, samma nummer överallt) och 13
  e-postadresser → `X***@domän`, över **34 filer**. Citeringsregeln ligger i
  `CLAUDE.md` § Instruktioner — Alltid gäller, med lesson-fragment
  `tasks/lessons.d/basdata-citeras-med-record-id-och-pseudonym-aldrig-med-namn.md`
  `[UNIVERSAL]`. Record-ID:n, anmälnings-ID:n, belopp och datum står kvar —
  dubblett-bevisen är fortfarande följbara (stickprov: fälla 40:s
  case-e-post-dubblett och fälla 42:s två Person-records går att följa mellan
  `data-model.md`, `execute-log.md`, `segment-export/export.mjs` och
  sessionsdok S60).

### Omfattningen var ~20× tabellens uppskattning

Tabellen ovan säger *"fem kända namn"* och *"≥ 13 filer"*, båda märkta som
undre gränser. Den faktiska mätningen 2026-09-18 gav **100 personer i 34
filer** — inklusive ytor tabellen inte nämnde: två fullständiga
närvarolistor med ~47 namn (S60), fyra prod-stickprov i
`02-live-state.md`, en rad ur backfillens touchpoint-tabell med åtta
namngivna personer, nio namn i ett bokstavsindex-research, **sju
backlog-kort** (två bar dessutom ett namn i sin TITEL, alltså i filnamnet),
en kodkommentar i `PersonsList.tsx`, tre i `segment-export/export.mjs` och
**ett namn som läckt in i en enhetstest-fixtur**
(`tests/api/betalningar-inkorg.test.ts` — personen är belagd som verklig i
prod via `TASK-372`/S115, inte en seed-fixtur).

Undre gränser ska läsas som undre gränser: den som tar dem för totalsiffror
städar en femtedel och tror sig klar.

## Öppet

- **Punkt 3 — e-postvakten:** ej byggd, Marcus-beslut. Regeln i `CLAUDE.md`
  är PROSA och bärs av disciplin, inte av en grind (ADR-083). En regex-vakt
  med allowlist skulle fånga e-postklassen billigt; **namn går inte att
  grinda** — samma sträng var en verklig person, en staging-fixtur och ett
  generiskt bokstavsexempel i tre olika filer under detta pass.
- **Punkt 4 — git-historiken:** kvarstår som Marcus-beslut, och det är värt
  att säga rakt ut: **uppgifterna finns kvar i varje commit som införde dem,
  även efter punkt 1.** Städningen skyddar framtida läsare av arbetsträdet,
  inte historiken. Repot är publikt i dag; en synlighetsändring tar inte
  heller tillbaka det som redan hämtats eller arkiverats av tredje part
  (`docs/research/repo-privat-konsekvenser-2026-09-18.md` § B6).
  History-rewrite (`git filter-repo` + force-push + GitHub-support för
  cachade vyer) är irreversibel och påverkar alla worktrees och parallella
  sessioner; görs i så fall i ett eget, tomt fönster.
- **Tveksamt fall, ej rört:** `Björn Sjöberg` i
  `src/components/betalningar/prototype/fixtur.ts` och de ARIA-snapshots som
  genereras därifrån. Namnet förekommer i INGEN prod-kontext och ser ut som
  konstruerad prototypdata, men efternamnet finns inte i seed-skriptets
  fasta listor — så det är inte maskinellt bevisat fiktivt. Lämnat orört och
  flaggat hellre än gissat.
