---
owner: marcus803
updated: 2026-06-21
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
| `T13` | Hub-repot (`marcus-system`) saknar CI/docs-grindar — konstitution/plugin/templates omekaniskt grindade (besläktad med T02 men bredare: hela repot, ej bara `project-instructions/`) | `paused` | _(ingen kort än — endast registrerad)_ |
| `T14` | Event-listans temporal-filter (kommande/tidigare) vs Airtable `Status`-fält (planeringstillstånd) — begreppskrock | `paused` | _(ingen kort än — endast registrerad); uppstod i 6b L1_ |
| `T15` | `buildLinkedRecordFilter` matchar länk-display ej record-ID — klass-bugg (latent i get-registrations; get-attendance kringgår via record-ID-batch) | `paused` | _(ingen kort än — endast registrerad); uppstod i 6b L3_ |
| `T16` | data-model.md reconciliation (live-schema-diff) + avsluts-rutin-wiring — (a) forensisk fält-diff mot live Airtable FÖRE (b) DoD-rad | `paused` | _(ingen kort än — endast registrerad); uppstod Session 26_ |
| `T17` | System-/arbetssätts-dokument (Chat/Code/Marcus · hub/spoke · skills · plugin-distribution · governing-mekanik) — utöka `hur-systemet-funkar.md` eller nytt dok | `paused` | _(ingen kort än — endast registrerad); uppstod Session 26_ |
| `T18` | Hub-plugin distributions-gap (källa-vs-installerad) — session-end tråd-synk-steg inaktivt tills v1.4.0→1.5.0-bump + ominstallation | `paused` | _(ingen kort än — endast registrerad); uppstod Session 26 (rest av register-synk-passet A3)_ |
| `T19` | App↔Airtable-interaktions-dok (saknad yta: hur appen frågar/skriver mot basen + fällorna i interaktionen) | `paused` | _(ingen kort än — endast registrerad); uppstod Session 27 (T16-orientering)_ |
| `T20` | Levande styrdok utanför frontmatter-hook-scope (sessionsdok + tråd-register: updated: speglar ej verklig touch) | `paused` | _(ingen kort än — endast registrerad); uppstod Session 27 (Code STEG A-fynd)_ |

> _T03-not: Session 20-glappet reser även frågan om Session 20:s egen `/session-end` do-confirm brast (distinkt från backfillen) — indata till T04._
>
> _T04-not: T04:s scope bör omfatta HELA klassen tyst-drivande do-confirm-killer-items (BUILD-LOG + hub-sync + ev. fler), bevisat av T03 + T06._
>
> _T09-not: §5 "Det här är redan klart" slutar vid Fas 2 fast Fas 2.5/3/3.5/5/5.5 är ✅ in-place-stämplade i §6/§7 (sektionsstruktur ↔ verklighet driftar); rad-58 stale skärmbild-not ("när Fas 5 är klar" — Fas 5 klar sedan 2026-06-12); Fas 5.5-body "ett enda fält (Betald: ja/nej)" mot faktiska Anmälningsavgift→Mottagen (ADR-049). Legibility-svep, ej brådskande (Session 23 L1-flagg)._
>
> _T10-not: ADR-056:s dubbel-källa-port (Airtable + Postgres) kräver att BETEENDE-paritet (ej bara typ-paritet) mellan adaptrarna bevisas före källa-flip i Fas E: en delad port-nivå-conformance-svit som båda adaptrarna körs mot + en paritets-grind (shadow-läs båda källor, jämför resultat) som villkorar flippen. Säkrar "flip-of-a-switch" mot tyst beteende-divergens._
>
> _T12-not: Upptäckt Session 23 L6b-grinden — lokala `.env.test` `TEST_SUPABASE_URL` pekar på prod-ref `lvjsfnphlauldxqlncpl`, så `source .env.test && npm run test:api:staging` skulle köra mutations-sviten (update-record allow-test) mot PROD. Lokalt skip:as sviten utan creds (ofarligt), men sourcing aktiverar foot-gunen. Durabel fix att överväga vid 6a-end/mini-session: repo-nivå fail-fast-grind som vägrar staging-mutations-sviten om mål-URL ≠ staging-ref (strukturell, à la L110). Marcus lokala `.env.test`-rättning till staging-ref = andra (ej committbara) halvan. Blockerar ej L6 — CI:s staging-secrets är korrekt isolerade (väg B)._
>
> _T13-not: Upptäckt Session 24 Inc 1 — `marcus-system` (hub) har ingen markdownlint-config, ingen `.vale.ini`, inget frontmatter-skript och inga `.github/workflows/` (`gh run list` = `[]`). Den governance-kritiska repon (konstitution, plugin-skills, templates) är alltså omekaniskt grindad medan spoken är tätt grindad. Triage: blockerar ej (låg churn, människo-granskad), deferrad. ÖPPEN FRÅGA: genuin kvalitetsrisk vs över-engineering att lägga CI på en låg-churn människo-granskad docs/config-repo — den dubbelriktade över-engineering-vakten (base-PI/CLAUDE Inc 1) talar emot reflexmässig CI. Beslut: Marcus, senare._
>
> _T14-not: Upptäckt Fas 6b L1 — /event-listans `?status=upcoming|past|all` härleds från `startdatum` (TEMPORALT), men Airtable-fältet `Status` är ett PLANERINGSTILLSTÅND (Planerat/Genomfört/Inställt/Flyttat). Namn-krocken ger rätt resultat nu (datum-härledningen är korrekt) men är begreppsligt grumlig och Lotta-synlig (hon ser "kommande/tidigare", inte "Status"). Tråden: reconciliera den användar-synliga terminologin mot Status-fältets planerings-semantik innan Fas 6b deklareras klar. Blockerar ej; defer per ADR-053-triage._
>
> _T15-not: KLASS, ej instans. `buildLinkedRecordFilter('Fält', recordId)` ger `FIND(recordId, ARRAYJOIN({Fält}))` — men `ARRAYJOIN` av ett länkfält exponerar länkens PRIMÄR-DISPLAY (t.ex. eventlabel), inte record-ID → `FIND(recordId, …)` matchar ALDRIG. Trasigt var helst ett länk-ID-filter byggs (verifierat tomt i prod OCH staging, BÅDE Deltaganden.Event och Anmälningar.Event). Latent i deployade get-registrations (dess `eventId`-filter saknar staging-test → aldrig kört mot skarp länk-data; smäller i 6c "Anmälda per event"). Enhetstesterna (`airtable-filter.test.ts`) verifierar formel-SYNTAX, aldrig match-SEMANTIK mot riktig data — det är luckan. Sido-fynd: Deltaganden `Event (ID)`-formeln (`RECORD_ID({Event})`) ger radens EGNA id, ej eventets (data-model §3.4 fel) → inget ID-exakt formelfält att filtrera på. get-attendance KRINGGÅR klassen helt (6b L3 väg D: record-ID-batch från event-hållet via `Närvaro (records)`-länken, speglar get-person; använder ej helpern) → get-attendance EJ drabbad. FIX-MALL för get-registrations (6c): record-ID-batch om event→Anmälningar har symmetriskt länkfält, annars en faktiskt fungerande ID-filter-helper. Uppstod 6b L3 conformance (första test som körde filtret mot skarp länk-data; jfr L152 NaN-klass, L5b 403≠404)._
>
> _T16-not: Uppstod Session 26. `data-model.md` är governing (auto-bump på `updated:`) men governing garanterar bara STÄMPEL-färskhet, inte INNEHÅLLS-korrekthet — 6a (Persons, Session 23) + 6b (Events, Session 25) schema-/fält-ändringar är ev. ej införda, och tidigare faser kan ha drivit odokumenterad drift. Två-delat, ordning kritisk: (a) RECONCILIATION — forensisk fält-för-fält-diff av data-model-påståenden vs LIVE Airtable-schema (Code/MCP, prod + ev. staging): vad driftat, vad saknas, vad är fel; SEDAN (b) AVSLUTS-RUTIN — wira en data-model-uppdaterings-rad i CONTRIBUTING per-session-DoD i villkorsform ("om sessionen ändrade datamodellen", parallellt med constraints-radens form). (b) utan (a) wirar bara en rutin som håller ett felaktigt dok felaktigt → (a) FÖRST. Substantiellt: (a) är en egen utrednings-pass-kedja (skörd → diff → uppdatering), egen session._
>
> _T17-not: Uppstod Session 26. Ingen sammanhängande yta beskriver hela samarbets-arkitekturen (Chat-halva/Code-halva, hub vs spoke, två git-träd, skills, plugin-distribution, governing-mekanik, installerad-vs-källa). Lucka som biter varje ny chatt-start. FÖRSTA frågan i tråden: `docs/reference/hur-systemet-funkar.md` FINNS redan — täcker den detta + är den aktuell? → UTÖKA den, eller skapa nytt dok. Avgör mot disk, anta ej. Kräver bred Code-kartläggning över BÅDA träd (hub `~/Repon/marcus-system/` + spoke) + plugin-struktur + skills-inventering, sedan detaljerad författning med korrekta refs. Flerpass-projekt (kartläggnings-skörd → författande → ev. granskning), à la Airtable-dokets Pass 1/2. Blir governing när det finns. Större än T16 — egen session, möjligen flera._
>
> _T18-not: Uppstod Session 26 (rest av register-synk-passet, A3). Hub session-end-skillens nya tråd-synk-steg ligger i KÄLLREPOT (`~/Repon/marcus-system/`, commit `df978d2`) men installerad plugin är cache-snapshot `marcus-system@marcus-hub` v1.4.0 (sha `e17438b`). Källediten propagerar INTE → de nya stegen är INAKTIVA i körande Code-sessioner tills version-bump (1.4.0→1.5.0) + ominstallation; Chat-halvan (`claude-app-skills/`) kräver separat claude.ai-uppladdning. Tills dess gäller register-synk-wiringen INTE i praktiken. Beslut (Marcus): bump + ominstallation + Chat-halva-uppladdning — lågt arbete men distributions-/release-beslut; fristående eller buntat med nästa hub-ändring. Egen liten utredning inom tråden: verifiera om källa och installerad v1.4.0 divergerat på MER än detta steg (andra odistribuerade hub-ändringar)._
>
> _T19-not: Uppstod Session 27 (T16-orientering). Marcus ifrågasatte om `data-model.md` borde vara ett RENT Airtable-schema-dok med interaktionen i ett eget dok (symmetri med constraints-doket som är rent plattform). Beslut (senior-analys): dokument-gränser skärs efter LÄSARE+UPPGIFT, inte efter fakta-ursprung. `data-model.md` är ett medvetet BLANDAT uppgifts-dok — en läsare ska kunna utföra en PATCH/POST mot rätt fält utan att korsreferera tre källrena dokument; schema + instans-fällor + viss interaktion är sammanflätade FÖR den uppgiftens skull. Att tömma det till "rent schema" vore att riva ett fungerande uppgifts-dok och tvinga korsreferens per operation (oordning förklädd till ordning). MEN: en äkta lucka finns — ingen sammanhållen yta beskriver app↔Airtable-KONTRAKTET (vilka fält varje EF läser/skriver, mappningar, länkfält-filter-mönster, hårdkodade event-värden som `create-registration`:s 'Event-17', och fällorna SPECIFIKT i interaktionen som T15:s länkfält-filter-klass). Den kunskapen ligger utspridd över `data-model.md`:s Edge Functions-sektion, `airtable-constraints.md`, EF-källkod (`supabase/functions/`), sessionsdok och trådar. VAD TRÅDEN BÖR GÖRA: skapa ett NYTT dok (preliminärt `docs/reference/airtable-interaction.md` eller liknande) som fyller interaktions-nischen — vid sidan av de tre befintliga reference-ytorna (`data-model` = blandad uppgiftskarta; `airtable-constraints` = plattform-migrationsspec; `hur-systemet-funkar` = mänsklig affärslogik), INTE genom att riva någon av dem. VARFÖR: interaktions-buggar (T15) är latenta tills de smäller mot skarp data just för att kontraktet inte är samlat och granskningsbart på ett ställe. FÖRSTA FRÅGAN i tråden (avgörs mot disk, anta ej): överlappar detta T17 (system-/arbetssätts-dok) — ska interaktions-doket vara en del av T17:s författning eller ett fristående reference-dok? Och: vad är rätt avgränsning mot `data-model.md`:s befintliga Edge Functions-sektion (flytta dit, eller peka dit)? Flerpass-projekt (kartläggnings-skörd av allt utspritt interaktions-vetande → författande → granskning mot EF-källkod), à la `airtable-constraints`-dokets Pass 1/2. Egen session, EFTER att 6c-vägen är klar (6c GENERERAR färsk interaktions-kunskap som doket bör fånga — bygg doket efter, inte före). Substantiellt → tråd-kort när den tas upp, rad räcker nu (progressiv disclosure)._
>
> _T20-not: Uppstod Session 27 (Code STEG A frontmatter-verifiering). Frontmatter-pre-commit-hooken (.githooks/pre-commit) auto-bumpar updated: endast för exakt-path-matchningar i FRONTMATTER_GOVERNING_DOCS (10 poster). tasks/sessions/*.md och tasks/threads/README.md står INTE i listan → deras updated: bumpas inte av hooken trots att de är levande styrdokument vars updated: semantiskt borde betyda "rördes när". I praktiken sätts sessionsdokets updated: manuellt vid födelse (create-session-doc steg 5/8) och tråd-registret bumpas för hand vid edit — fungerar men hänger på procedur/minne, inte mekanism (~9%-zonen, L67-klassen). VAD TRÅDEN BÖR ÖVERVÄGA: (1) lägga tasks/threads/README.md i FRONTMATTER_GOVERNING_DOCS (enkelt — en path, hook-bumpar då auto vid varje edit); (2) sessionsdok är klurigare — många filer, glob ej exakt-path, och ett sessionsdoks updated: betyder "dokumenterar vilken sessions arbete" (arbetsdatum, L67) snarare än "rördes när" (hook-datum) → de två semantikerna KROCKAR, så auto-bump kan vara FEL för sessionsdok (skulle skriva över arbetsdatum med touch-datum vid varje senare edit). FÖRSTA FRÅGAN (avgörs mot ADR-052/L67): ska sessionsdokets updated: vara touch-semantik eller arbets-semantik? Om arbets-semantik → sessionsdok ska medvetet INTE hook-bumpas, och då är dagens beteende korrekt, inte en lucka — bara odokumenterat. Tråden kan landa som "lägg threads i hook + dokumentera att sessionsdok medvetet är utanför" snarare än "fixa båda". Blockerar ej; ADR-053-defer. Rad räcker nu._

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
