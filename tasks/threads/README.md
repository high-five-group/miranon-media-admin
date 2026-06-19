---
owner: marcus803
updated: 2026-06-17
review_by: 2026-09-17
status: stable
---

# Tråd-register — systemets navigerbara ryggrad

> Detta är ingången. Vill du förstå vad som hänt i systemet och följa en kausal
> tråd genom tiden — börja här. Varje rad är en TRÅD: en arbetsenhet (en fas, en
> feature, en utredning, en oväntad upptäckt) som spänner en eller flera sessioner.
> Sessionen är behållaren; tråden är den kausala tidslinjen tvärs behållare (ADR-053).

## Så här läser du registret

- **Tråd-ID** `T<NN>-<slug>` — stabil identitet. Trådens commit-historik hämtas med
  `git log --grep "\[T<NN>\]"` (commit-tagg-konventionen, ADR-053 beslut 3).
- **Tillstånd** — `lifecycle`-fältet (ADR-052), samma enum som sessioner:
  `active` (pågår/öppen) · `paused` (durabelt parkerad) · `closed` (avslutad).
- **Ingång** — var du börjar läsa tråden (tråd-kort, och/eller styrande ADR/sessionsdok).

## Aktiva och pausade trådar

| Tråd | Titel | Tillstånd | Ingång |
|---|---|---|---|
| `T01` | System-läsbarhet + triage av det oväntade | `active` | [T01-system-legibility.md](T01-system-legibility.md) · ADR-053 |
| `T02` | project-instructions/ CI-täckningsgap | `paused` | _(ingen kort än — endast registrerad)_ |
| `T03` | Session 20 BUILD-LOG-backfill | `paused` | _(ingen kort än — endast registrerad)_ |
| `T04` | Mekaniserad sessions-/BUILD-LOG-fullständighetsgrind (mekanisera ADR-041 killer item) | `paused` | _(ingen kort än — endast registrerad)_ |
| `T05` | Grind-täcknings-meta-grind (manifest: alla dok-kataloger × alla relevanta grind-globbar) — L127 | `paused` | _(ingen kort än — endast registrerad)_ |
| `T06` | Hub-sync-backlogg sessioner 17–20 (L103–L125 aldrig hub-lyfta) | `paused` | _(ingen kort än — endast registrerad)_ |
| `T07` | ADR-028 §2-amendering — skilj malware (full-regen) från icke-malware-advisory (kirurgisk bump räcker) | `paused` | _(ingen kort än — endast registrerad); ADR-028 ## Updates 2026-06-15 (fx2h-avvikelsen) bär kontexten_ |
| `T08` | Skala Check 2 (frontmatter updated-match) till ÄNDRADE governing-docs (changed-files-mönstret) → avveckla fetch-depth-apparaten (shallow-detektion + ADR-039-invariant + 6-bärare + errata) | `paused` | _(ingen kort än — endast registrerad); [ADR-054](../../docs/decisions/ADR-054-fetch-depth-full-historik.md) § Deferrad tråd bär kontexten_ |
| `T09` | BYGGPLAN-LÄTTLÄST-v3 strukturell + stale-drift (legibility-svep) | `paused` | _(ingen kort än — endast registrerad)_ |
| `T10` | Flip-of-a-switch dubbel-källa-conformance + paritets-grind (Fas E) | `paused` | _(ingen kort än — endast registrerad); ADR-056 bär kontexten_ |
| `T11` | Lägg "Proposed" i decisions/README §Format status-enum (format↔praktik-drift; använt ADR-043/053/056) | `paused` | _(ingen kort än — endast registrerad)_ |
| `T12` | `.env.test` pekar på PROD (`lvjsfnphlauldxqlncpl`) → `test:api:staging` = latent prod-mutations-risk | `paused` | _(ingen kort än — endast registrerad)_ |

> _T03-not: Session 20-glappet reser även frågan om Session 20:s egen `/session-end` do-confirm brast (distinkt från backfillen) — indata till T04._
>
> _T04-not: T04:s scope bör omfatta HELA klassen tyst-drivande do-confirm-killer-items (BUILD-LOG + hub-sync + ev. fler), bevisat av T03 + T06._
>
> _T09-not: §5 "Det här är redan klart" slutar vid Fas 2 fast Fas 2.5/3/3.5/5/5.5 är ✅ in-place-stämplade i §6/§7 (sektionsstruktur ↔ verklighet driftar); rad-58 stale skärmbild-not ("när Fas 5 är klar" — Fas 5 klar sedan 2026-06-12); Fas 5.5-body "ett enda fält (Betald: ja/nej)" mot faktiska Anmälningsavgift→Mottagen (ADR-049). Legibility-svep, ej brådskande (Session 23 L1-flagg)._
>
> _T10-not: ADR-056:s dubbel-källa-port (Airtable + Postgres) kräver att BETEENDE-paritet (ej bara typ-paritet) mellan adaptrarna bevisas före källa-flip i Fas E: en delad port-nivå-conformance-svit som båda adaptrarna körs mot + en paritets-grind (shadow-läs båda källor, jämför resultat) som villkorar flippen. Säkrar "flip-of-a-switch" mot tyst beteende-divergens._
>
> _T12-not: Upptäckt Session 23 L6b-grinden — lokala `.env.test` `TEST_SUPABASE_URL` pekar på prod-ref `lvjsfnphlauldxqlncpl`, så `source .env.test && npm run test:api:staging` skulle köra mutations-sviten (update-record allow-test) mot PROD. Lokalt skip:as sviten utan creds (ofarligt), men sourcing aktiverar foot-gunen. Durabel fix att överväga vid 6a-end/mini-session: repo-nivå fail-fast-grind som vägrar staging-mutations-sviten om mål-URL ≠ staging-ref (strukturell, à la L110). Marcus lokala `.env.test`-rättning till staging-ref = andra (ej committbara) halvan. Blockerar ej L6 — CI:s staging-secrets är korrekt isolerade (väg B)._

## Avslutade trådar

| Tråd | Titel | Tillstånd | Ingång |
|---|---|---|---|
| _(inga ännu)_ | | | |

## Så här registrerar du en ny tråd

När något oväntat uppstår, kör triage-mikroprocessen (alltid-på regel, se Project
Instructions + CLAUDE.md). Faller det ut som "defer till registret":

1. Ge tråden nästa `T<NN>` + en kort `<slug>`.
2. Lägg en RAD i tabellen ovan (`lifecycle` = oftast `paused` om den parkeras för senare,
   `active` om den tas upp nu). En rad räcker — det är den billiga ingången.
3. Förtjänar tråden mer än en rad (substantiell, spänner sessioner, har eget narrativ)?
   Skapa ett tråd-kort `T<NN>-<slug>.md` (se T01 som mall) och peka ingången dit.
4. Tagga commits i tråden med `[T<NN>]` så historiken blir git-härledbar.

Progressiv disclosure: rad först, kort när den växer. Överbygg inte — en tråd som
förblir en rad är helt i sin ordning (ADR-053, MEDIUM-på-MINIMAL).

## Commit-tagg-konvention

Beslutet bor i ADR-053 beslut 3; här bor mekaniken.

- Commits som tillhör en tråd taggas med `[T<NN>]` i commit-meddelandet (t.ex. `[T01]`).
- Trådens commit-historik hämtas med `git log --grep "\[T<NN>\]"` — så tidslinjen blir
  git-härledbar, inte handhållen.
- En commit kan tillhöra en tråd även om den landar i en annan sessions arbete: tråden är
  ortogonal mot sessionen (tråd ⊥ session).
