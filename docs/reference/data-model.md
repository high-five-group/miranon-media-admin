---
owner: marcus803
updated: 2026-08-23
review_by: 2026-11-15
status: stable
---


<!-- markdownlint-disable MD041 -->  <!-- filen saknar h1 (data-doc utan toc-rubrik som default) -->
> **Äger:** Airtable-basens fältschema (tabeller, fält-ID:n, typer,
> skrivbarhet, formler) och datakvalitets-fällorna (§Kända fällor).
> **Kartlägger:** `docs/reference/schema_reference.md` (frusen
> historik-ögonblicksbild, se dess egen banderoll) och
> `docs/reference/airtable-constraints.md` (plattformens strukturella
> väggar). **Vid konflikt vinner:** detta dokument (`ADR-100` §2 domän
> 5-undantag — den avsedda, förvaltade kopian av Airtable-basens fakta).
> Denna deklaration konsoliderar dokumentets tidigare fyra spridda
> auktoritets-anspråk (denna callout + de tre nedan, per Ö9 i
> `docs/research/styrande-docs-audit-substrat-2026-08-07.md`) till en enda
> plats.
>
> **Primär version.** Kopia för psionautics-projektets Claude-chatt synkas
> separat till `~/Repon/psionautics/docs/data-model.md` efter varje
> uppdatering här. Vid arbete: redigera ALLTID denna fil först.

---

# Datamodell — Miranon Media & Psionautics

*Levande referens. Version 2. Skapad 2026-04-16. Senast verifierad 2026-04-28. Reconcilierad mot live + repo 2026-06-21 (Session 27, T16).*

---

## Vad det här dokumentet är

En **navigations- och förståelsekarta** över datamodellen. Det här dokumentet duplicerar inte befintlig dokumentation — det pekar på rätt ställen och förklarar det som är svårt att se när man tittar på fälten isolerat.

Läses av Claude Code (vid strategi, analys och implementation). Människor — Marcus, Roger, Lotta — läser [`hur-systemet-funkar.md`](./hur-systemet-funkar.md) istället.

Se ägar-deklarationen ovan. `schema_reference.md` är arkiverad för historik (1 845 rader, senaste git-uppdatering i källrepot 2026-04-03) — den saknar 5 fält som lagts till i april samt prod-speglingen 2026-07-23 och är inte längre korrekt sanningskälla för fält. Sedan 2026-08-01 finns den som projektnära kopia i [`docs/reference/schema_reference.md`](./schema_reference.md) (Marcus-beslut; original i frysta Vue-repot, käll-commit `42e32fe`): dess kvarvarande värde är ytorna detta dokument medvetet inte täcker — interfaces, vyer, formulär, Zapier/Make och automationerna A1–A11 i läsbar form med skriptkod.

### Principer

- **Verifieringsdisciplin:** detta dokument beskriver bara det som är verifierat. Osäkerheter markeras `[HYPOTES — EJ VERIFIERAD]`. Saknade bitar listas i avsnittet *Luckor*.
- **Fält-IDs och options:** se ägar-deklarationen ovan. Vyer, formulär och Zaps dokumenteras separat (eller delegeras till live MCP-pull mot bas `app8uGPrVCVOm6LfD`).
- **Uppdateras vid varje förändring.** Nytt fält, ändrad formel, ny automation → uppdatera detta dokument i samma commit.
- **Spårbarhet.** Påståenden om schema/options/fält-IDs spåras till live MCP-pull (datum). Påståenden om Edge Functions spåras till commit-hash. Påståenden om automationer spåras till `miranon_automations_COMPLETE.json` 2026-03-16. Påståenden om datakvalitet spåras till sessionsfil + datum.

---

## Karta — Var bor vad?

| Behöver du... | Läs... |
|---|---|
| Kanoniskt domänspråk (begreppen, sv↔en-mappningen) | `~/Repon/miranon-media-admin/ORDLISTA.md` (repo-rot) — begreppen bor där; mekaniken här. |
| Fält-för-fält-referens med typer, formler, relationer | **Detta dokument §Snabbreferens / Schema cheat sheet.** Live-pull i `~/Repon/miranon-media-admin/docs/research/datamodell-research/02-live-state.md` (2026-04-28, 18 tabeller × 358 fält). |
| Källextraktion + datamodell-skuldlista (under detta projekts gång) | `~/Repon/miranon-media-admin/docs/research/datamodell-research/` (manifest, extraktion, live-state, gap-analys) |
| Maskinläsbar fält-ID → namn-mapping | `~/Repon/miranon-media-os/docs/field_lookup.json` (genererad 2026-03, verifiera aktualitet vid behov) |
| Rå automation-JSON (triggers, actions, scripts) | `~/Repon/miranon-media-os/docs/miranon_automations_COMPLETE.json` (15 741 rader, export 2026-03-16) |
| Interfaces, vyer, formulär (Elfsight), Zapier-mappningar, Make.com-scenarier och automationerna A1–A11 i läsbar form med skriptkod | [`docs/reference/schema_reference.md`](./schema_reference.md) — frusen prod-ögonblicksbild mars 2026, projektnära kopia 2026-08-01 (original i frysta Vue-repot). Fält-data däri är superseded av detta dokument. |
| Sammanfattning med TypeScript-interfaces och HAR-metoden | `~/Repon/miranon-media-os/docs/AIRTABLE-REFERENS.md` (298 rader, arkiverad — historik) |
| TypeScript-domänmodeller för React-appen | `~/Repon/miranon-media-admin/src/domain/models/` och `src/domain/schemas/` |
| Förstå *varför* och *hur* systemet fungerar, utan jargong | `~/Repon/miranon-media-admin/docs/reference/hur-systemet-funkar.md` |
| Förstå flöden, beroenden, fällor och backfill-historik | *Det här dokumentet* |

---

## Snabbreferens — ID:n och nyckelfält

För när Claude Code behöver slå upp snabbt utan att söka.

### Base

```text
app8uGPrVCVOm6LfD
```

### Tabell-ID:n

| Tabell | ID | Antal fält | Anteckning |
|---|---|--:|---|
| Eventplanering | `tblVE3UKWl1CKrphV` | 45 | |
| Eventformat | `tbl8qhuJQ5ZWPMRk4` | 3 | |
| Anmälningar | `tbloOcrppVoyrHbrq` | 51 | |
| Personer | `tbl6ZyCm3V026iFTU` | 87 | Master registry. Innehåller mest formel/rollup-fält som speglar Anmälningar och Deltaganden. |
| Deltaganden | `tbldWHH6sSHWoQPHH` | 47 | En rad per Anmälan × Session. |
| Väntelista | `tbl2VxMx7JMkIxD4Q` | 14 | |
| Hämtade erbjudanden | `tblqFpgxEhJ95AEcM` | 16 | Lead-magnet-tabellen. |
| Engagemang | `tbl9H2SoGFfysBj5y` | 10 | Aggregerar lead-hämtningar per person × erbjudande. |
| Erbjudanden | `tblcCFGCVrnl1JZfg` | 7 | |
| Touchpoints | `tbl22SCvlHrgcAiZi` | 17 | |
| Kontaktlogg (rådata) | `tblzg4DsRzCCXH8Vy` | 20 | |
| Error-log | `tblnnmWswnRp9gFws` | 4 | Skrivs av A2 vid dubblett-fall. |
| Bulkutskick | `tblWarzSse85NI1Zx` | 12 | |
| Segment | `tbll2N6JKCj4u6y9o` | 13 | App-skrivet fält `App-segmentregel` tillagt Fas 6g (se Schema cheat sheet § Segment — write-fält). |
| Utskickslogg | `tblIesjbuSWNp6oxK` | 9 | |
| Email Opens | `tblXFJyGRahQDhhqc` | 2 | |
| Path to Conversion | `tblor5TK8HeryGXIj` | 1 | **Tom strukturell behållare** — bara `Name` (singleLineText). |
| Instagram Posts | `tblMpQI1crF521Xsp` | 1 | **Tom strukturell behållare** — bara `Name` (singleLineText). |

**18 tabeller. 358 fält totalt 2026-04-28.** (Proveniens: extraherat ur `02-live-state.md` §1–§2 — research-underlag, ej en parallell sanningskälla; detta dokument förblir bäraren, ADR-100 §2.)

#### Prod-basens additiva tillskott 2026-07-23 (S75 prod-deploy-vågen)

Event-familjens bygge (TASK-17/18/19) skapade fält i STAGING först per
ADR-063/ADR-050. Prod-speglingen utfördes 2026-07-23 som Marcus-auktoriserad
handling — **enbart additivt, ingen befintlig data eller något befintligt fält
rördes.** Fält-ID:n skiljer sig mellan baserna (Airtable tilldelar per bas);
EF-lagret adresserar därför fält på NAMN, aldrig ID (ADR-050:s
portabilitetsval — verifierat vid denna vågs forensik: `Idempotensnyckel` bär
olika ID i staging och prod).

| Yta | Prod-ID | Typ | Skiva |
|---|---|---|---|
| **Anteckningar** (ny tabell) | `tblaUhH1KF9k9imul` | Författare + Anteckning + Event-länk + **Person-länk** (prod `fldJiWGXe2Hv612H0` · staging `fldXvBRt7OE9tem4o`, NY 2026-08-10 / S103) | 18.11 / ADR-075 |
| Eventplanering → `Anteckningar` | `fldBhALs9OxAfj2Kv` | auto-fött spegelfält till tabellen ovan | 18.11 |
| Anmälningar → `Bor över` | `fld4Flif4NoFnNsxS` | checkbox | 18.7 |
| Anmälningar → `Notering anmälningsavgift` | `fldf60miCtMuP45WO` | multilineText | 18.8 |
| Anmälningar → `Notering slutbetalning` | `fldJyDlJWudYwBdxi` | multilineText | 18.8 |
| Anmälningar → `Påminnelse anmälningsavgift skickad` | `fldPAI0k3tRAmrJfR` | dateTime | 18.8 |
| Anmälningar → `Påminnelse slutbetalning skickad` | `fldYhYamzVOVnEb0Q` | dateTime | 18.8 |
| Eventplanering → `Publicerad på miranon.se` | `fldrjj61ovL3Zv1mN` | checkbox | 19.4 |
| Eventplanering → `Deltagarinfo schemalagd` | `flddBo4RPJvluWuQw` | date (ISO) | 18.6 |
| Eventplanering → `Deltagarinfo auto-utskick avstängt` | `fldoIwNdetKHkIeaL` | checkbox | 18.6 |

**KVARSTÅENDE DIVERGENS — `Väntelista.Event (länk)` speglades MEDVETET INTE.**
Motiveringen ovan löd tidigare att *"staging-basen har konverterat fältet, prod
har inte"* — **falsifierat vid bas-diffen 2026-08-11**
(`docs/research/prodbas-synk-staging-till-prod-2026-08-11.md` § Delfråga 3):
`Väntelista.Event` är `singleLineText` i BÅDA baserna med identiskt fält-ID
`fldC01Nf3lVWrOgdw` — staging konverterade aldrig, den la ett länkfält
`Event (länk)` BREDVID, vilket är additivt. Uppskjutandet står ändå kvar, på
starkare grund: ingen EF och ingen klientkod skriver till `Väntelista`, så
fältet i prod vore permanent tomt — ett synligt strukturellt gap blev ett
osynligt tomt fält. Harmonisering + backfill är egen Marcus-auktoriserad
operation, kandidat för bas-maximeringen (T16).

#### Prod-basens additiva tillskott 2026-08-11 (S102 bas-applyn)

Bas-diffens apply-fas (Marcus GO "GO bas-apply" i klartext; diff + plan i
`docs/research/prodbas-synk-staging-till-prod-2026-08-11.md`). Utfört via
Airtable-MCP:n per apply-planens exakta fältspec — enbart additivt, spegel-
fältens auto-födda namn LÄSTA efter skapelsen (aldrig antagna), alla tre
matchar stagings namn utan kollisions-suffix.

| Yta | Prod-ID | Typ | Skiva |
|---|---|---|---|
| **Bilagor** (ny tabell, 5 fält) | `tblevR1B54wFjp7QC` (staging `tblFamrna53MVf1nG` — namn är kontraktet, ID:n skiljer per bas) | Namn (primär) + Storlek (bytes) + Skapad (dateTime) + Event-länk + Lagringsnyckel | 146.2 / 147.5 |
| **Kvitton** (ny tabell, 12 fält) | `tblZC6jBQIHiuS24a` (staging `tblk8fZcArXPpRYnX`) | Kvittonummer (primär) + Löpnummer + År + Anmälan-länk + Betalning + Belopp + Betalsätt + Kundnamn + Event-länk + Skickad + Lagringsnyckel + Notering | 147.7 / ADR-109 |
| Eventplanering → `Bilagor` | `fldzc8H388p0hYVkY` | auto-fött spegelfält | 146.2 |
| Eventplanering → `Kvitton` | `fldFtNX64k3QIEUe3` | auto-fött spegelfält | 147.7 |
| Anmälningar → `Kvitton` | `fld16sYUYDqN1AUeT` | auto-fött spegelfält | 147.7 |

Fält som INTE behövde speglas (fanns redan i prod): `Antal platser`,
`Notering` (Anmälningar) och `Närvaropoäng` (Deltaganden, `fldwuo94BY46VUOm4`
— samma ID i båda baserna).

#### Bucket `bilagor` — Storage-path-formerna (TASK-302.3)

**Ingen tidigare karta av detta fanns i `docs/reference/` innan denna rad**
(uppdraget för `TASK-302.3` antog att en fanns — `git grep BILAGOR_BUCKET_ID
docs/reference/` gav noll träffar; premiss-divergens bokförd i skivans
slutrapport, inte tyst rättad). Bucket `bilagor` är PRIVAT (ingen publik
URL); all åtkomst går via en signerad URL (`SIGNED_DOWNLOAD_URL_TTL_SECONDS
= 300`, `_shared/attachments.ts`). De path-former som faktiskt förekommer:

| Path-form | Skrivs av | Formel |
|---|---|---|
| `<eventId>/<attachmentId>-<filnamn>` | Klass A/B, event-räckvidd | `buildAttachmentPath`, `_shared/attachments.ts` |
| `kurstyp/<kursfamilj>/<attachmentId>-<filnamn>` · `alla-event/<attachmentId>-<filnamn>` | Gemensamma bilagor (ADR-118 beslut 5) | `buildStorageAnchor`, `_shared/attachments.ts` |
| `utkast/<eventId>/<typ>.pdf` (`typ` ∈ `bilaga`\|`kvitto`\|`deltagarinformation`) | TASK-302, `ADR-124` — transient förhandsgransknings-utkast, `upsert: true` (högst ETT per event och typ) | `laggUtkast`, `_shared/utkast.ts` |

`utkast/`-prefixet skiljer sig från de två andra på tre punkter: det är
ALDRIG listat i appen (ingen Bilagor-rad pekar dit), det ÖVERSKRIVS i
stället för att ackumulera, och det TAS BORT av `rensaUtkast` (samma fil)
när en skarp generering/sändning för eventet lyckas. Känd rest: prod har
ingen tidsstyrd städning av utkast vars event aldrig får en skarp artefakt
— bokfört i `ADR-124` § "Öppet, och medvetet inte beslutat här" och i
`T171` § "Adjacent, lägre allvarlighetsgrad" (persondata-klassningen för
kvitto-utkastet specifikt).

#### Stagingbasens additiva tillskott 2026-08-16 (TASK-147.12) — prod-fältet skapat 2026-08-16, backfill + EF-deploy återstår

Löser task-147.6:s fynd 1 (klass A/B strukturellt odelbara i Bilagor-metadatat)
I BASEN, per Marcus-GO 2026-08-16 och ADR-063. Skapat via Airtable MCP
`create_field` (inte `scripts/create-bilagor-table.mjs` självt —
`AIRTABLE_SCHEMA_TOKEN` saknades i lokal `.env.seed`; skriptets `CONFIG.fields`
speglar ändå exakt denna spec för framtida idempotenta körningar, se skriptets
egen kommentar). **Prod-fältet FINNS sedan 2026-08-16**: `Dokumentklass`
skapades i prod-Bilagor (`tblevR1B54wFjp7QC`) som `fldeB2dlwfk2KkKVT`
(sessionsdok S102 Del 14-eran, PR #1435-passet). Denna rad påstod fram till
2026-08-17 att fältet "ENDAST finns i staging" — falsifierat av fas 4-
underlagets driftkarta (samma svep fann att `task-147.12`-notes felaktigt
påstod att bilage-EF:erna aldrig prod-deployats; de deployades 08-10/08-11/
08-15 — noll prod-rader beror på att ingen laddat upp en bilaga i prod).
Kvarvarande prod-steg: backfill + EF-deploy-svepet (fas 4, Marcus-moment,
klicklista i `task-147.12`s Implementation Notes).

| Yta | Staging-ID | Typ | Skiva |
|---|---|---|---|
| Bilagor → `Dokumentklass` | `fldr2CwboZ3M4USCX` | singleSelect — `Uppladdad` (`selRJGlFuqzbY8V9w`), `Event-mallad` (`selkwZzOdrKEcKbky`), `Person-genererad` (`selg6QYcmNlNCtL8n`) | 147.12 |

**Skrivbarhet:** satt av den skrivande EF:en vid radskapelse — `upload-attachment`
och `finalize-attachment-upload` skriver `Uppladdad` (klass A),
`generate-event-attachment` skriver `Event-mallad` (klass B). `Person-genererad`
(klass C) har ÄNNU ingen skrivväg till DENNA tabell — kvittogenereringen
(TASK-147.7) skriver till den separata `Kvitton`-tabellen ovan, inte hit.
Klienten LÄSER fältet (`Attachment.dokumentklass`, `get-event-attachments`),
skriver aldrig — samma read/write-asymmetri som övriga skrivfält i denna bas.

**Backfill:** de 18 rader som fanns i staging FÖRE fältet skapades är
backfyllda (12 `Uppladdad`, 6 `Event-mallad`, 0 lämnade tomma — samtliga
härledbara ur `Namn`-mönstret, se `scripts/backfill-bilagor-dokumentklass.mjs`
§ KLASSIFICERINGSREGELN). Skriptet är idempotent och re-körbart; en `--dry-run`
efter backfillen bekräftade `0 rader att backfylla` (andra, oberoende
verifiering av MCP-backfillen).

#### Staging- och prodbasens additiva tillskott 2026-08-17 (S104 basstrukturen, ADR-115)

Segmentytans dimensionsmodell (familj + nivå) som riktiga datafält på
Eventplanering — Marcus beslut S104 Del 2 (*"Basen ska leverera vad appen
vill ha, punkt!"*), GO "Go staging + prod" 2026-08-17. Skapat via Airtable-MCP
`create_field`, staging FÖRST, prod därefter — enbart additivt, inget
befintligt fält rört. **Medvetet DATAFÄLT, inte formel över kursnamnet:** en
formel hade återinfört det sträng-matchnings-mönster som orsakade Lucka B
([ADR-062](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md));
fälten sätts när kursen/eventet skapas, så en ny kurs (t.ex. RIM 4) omfattas
automatiskt av familjevillkor. Styrande beslut:
[ADR-115](../decisions/ADR-115-segmentets-regelsprak-and-partition-tackning.md).

| Yta | Staging-ID | Prod-ID | Typ |
|---|---|---|---|
| Eventplanering → `Kursfamilj` | `fld1BLsgFLm1WPBPV` | `fldxBUGMfya0WEbFB` | singleSelect — `RIM` · `Fjärrskådning` · `Psionautics` |
| Eventplanering → `Kursnivå` | `fldWSwuWhrGD1cmgV` | `flduoLmR7zXFGBIYC` | singleSelect — `Intro` · `Nivå 1` · `Nivå 2` · `Nivå 3`; TOMT för nivålösa familjer (Fjärrskådning, Psionautics) |

**Backfill (mappningen = prototypens `KURS_KARTA`,
`src/components/segment/prototyp/VariantD.tsx`):** `Fjärrskådning` → familj
`Fjärrskådning` · `Resor i medvetandet N` → `RIM` + `Nivå N` · nakna
`Resor i medvetandet` (fälla #35) → `RIM` + `Intro` · `Psionautics` →
`Psionautics`. **Prod: 51/51 rader satta**, verifierat med
`{Kursfamilj} = BLANK()` → 0 träffar. **Staging: 83 rader satta; exakt 1 rad
utan värde** (`recPwJEj88Hj8C2gU`, saknar även `Event (source)` — utan
kursnamn ingen familj, korrekt per design). Ett CI-skapat ZZ-event föddes
MITT UNDER backfillen och fångades av blank-verifikatet (Event-7755, sattes i
efterhand) — instansbevis för kanten nedan.

**KÄND KANT — skapelsevägarna sätter INTE fälten än:** `create-event`-EF:en
(och staging-CI:ts ZZ-event-skapelser) föder rader utan
`Kursfamilj`/`Kursnivå`. Tills EF:en sätter dem vid skapelse (bokfört
PRD-krav för segment-passets promoveringsskivor) ackumulerar staging luckor —
harmlöst där (ZZ-data), men regeln är att fälten sätts när eventet skapas.
Prototypens `KURS_KARTA` är interimsbäraren app-side och dör med
promoveringen.

#### Staging- och prodbasens additiva tillskott 2026-08-17 (task-275.1, ADR-118 bilagors räckviddsmodell)

Räckviddsdimensionen på `Bilagor` — Marcus GO given i grillningens
slutkvittens 2026-08-17 ("Yes, kvitterar"). Skapat via Airtable-MCP
`create_field`, staging FÖRST och verifierat med `describe_table` innan
prod, enbart additivt — inget befintligt fält rört. `Kursfamilj`/`Kursnivå`
speglar Eventplanerings valslag (ADR-115-fälten ovan) EXAKT på namn; nya
option-ID:n autogenererades per fält/bas som vanligt (Airtable delar aldrig
option-ID:n mellan fält). Styrande beslut:
[ADR-118](../decisions/ADR-118-bilagors-rackviddsmodell.md).

| Yta | Staging-ID | Prod-ID | Typ |
|---|---|---|---|
| Bilagor → `Räckvidd` | `fldU6i9Ju5HRwSRBf` | `fldsEltfGx3y63hhF` | singleSelect — `Event` · `Kurstyp` · `Alla event` |
| Bilagor → `Kursfamilj` | `fldiJnZk66jlkUiX8` | `fld8Mc23OdJXFSBEx` | singleSelect — `RIM` · `Fjärrskådning` · `Psionautics` |
| Bilagor → `Kursnivå` | `fldep25m32Q3Cjh41` | `fldMAGsqnQ4ddFmaI` | singleSelect — `Intro` · `Nivå 1` · `Nivå 2` · `Nivå 3`; TOMT för nivålösa familjer (samma regel som Eventplanering) |

**Skrivbarhet [UPPDATERAD, task-275.2]:** `upload-attachment` (mönster 1)
och `finalize-attachment-upload` (mönster 2, steg 2) tar nu emot valfria
räckviddsparametrar (`rackvidd`/`kursfamilj`/`kursniva`), strikt Zod-
validerade (`_shared/attachments.ts` § `AttachmentScopeInputSchema`), och
skriver alla tre fält via en utökad `create-attachment`-allowlist-post
(`_shared/field-allowlists.ts`). `create-attachment-upload-ticket` (mönster
2, steg 1) rör dem INTE — den skriver ingen Bilagor-rad. `Event` FÖRBLIR
satt oavsett räckvidd (medveten avgränsning: storage-path-ankaret och den
befintliga ägarskaps-mekaniken i delete-attachment/get-attachment-download-
url hålls oförändrad — olycksskyddet mot radering ur eventkontext läser
`Räckvidd`, inte `Event`s satthet). `get-event-attachments` returnerar
UNIONEN av eventets egna + kurstyps-matchande (inkl. tom-nivå-regeln) +
alla-event-bilagor, var och en märkt med sin `rackvidd` i svaret (ADR-118
beslut 2). `delete-attachment` accepterar nu `eventId: null`
("räckviddsläge") för gemensamma bilagor (ADR-118 beslut 3). Klienten
(Dokument-ytans räckviddsval, UI) landar i task-275.3 — adapter-/mutations-
lagret (`AirtableAdapter.ts`/`DataSourceAdapter.ts`/`Attachment`-domän-
modellen) är redan utbyggt i task-275.2 och väntar bara på UI:t som
skickar räckviddsvalet.

**Migrering av befintliga rader (AC #2, `Räckvidd = Event` som default —
dagens sanning):** staging bar 24 rader (samtliga ZZ-testfixturer) FÖRE
migreringen; samtliga 24 PATCH:ade till `Räckvidd = Event`,
count-verifierat efter med `{Räckvidd} = BLANK()` → 0 träffar (24/24).
Prod-tabellen mättes TOM i S102 och är TOM alltjämt — `list_records` gav 0
rader både före och efter fältskapelsen (0/0, inget att migrera).

### Aktiva event

| Event | Record ID | Datum | Max antal platser |
|---|---|---|---|
| Medveten Kontakt | `recQ2TPsY69fQXA8a` | 1–3 maj 2026 | **88** (uppdaterad 2026-04-26 från ursprungliga 70 av Marcus i UI) |

### Kritiska länkfält mellan kärntabellerna

| Från | Fält | Till | Fält-ID | Anteckning |
|---|---|---|---|---|
| Anmälningar | Person | Personer | `fldQekqRlLfup8x5K` | Sätts av A2 |
| Anmälningar | Event | Eventplanering | `fldi3enUaMdbuGSlm` | Sätts av A1 (eller Edge Function direkt) |
| Anmälningar | Medföljande till | Anmälningar (self) | `fld39KEXJxyulXfsN` | Sätts av CompanionModal i admin |
| Anmälningar | From field: Medföljande till | Anmälningar (self, inverse) | `fldlP4z8Dirq00nqq` | Auto-skapat inverse-fält. Read-only — skrivs aldrig direkt. |
| Personer | Anmälningar | Anmälningar | `fld8pOivka8YdiywK` | |
| Personer | Deltaganden | Deltaganden | `fld5shm9UER5CMyTl` | |
| Deltaganden | Anmälan | Anmälningar | `fldwQdDpRK8vByNhb` | |
| Deltaganden | Event | Eventplanering | `fldaj5mbpU3yPw2np` | |
| Deltaganden | Person (länk) | Personer | `fldiU06kbTxSafkm4` | Sätts av A11 |
| Deltaganden | Person (lookup) | Personer | `fldF9DORzkIBcRT7F` | multipleLookupValues från Anmälan.Person. **Returnerar record-ID, INTE namn** — kräver separat Personer.Namn-batch för läsbart namn (S25-fynd, get-attendance väg D). |

### Nyckelformula — "lynchpin"-fält

Dessa är broarna som hela rollup-kedjan bygger på. Ändra aldrig utan att förstå konsekvenserna.

| Fält | Fält-ID | Tabell | Roll |
|---|---|---|---|
| Närvaropoäng | `fldwuo94BY46VUOm4` | Deltaganden | 1 om Status = "Närvarande"/"Deltog online", annars 0. **Allt kurshistorik räknas uppåt härifrån.** |
| Är aktiv (1/0) | `fld4j7PeckDViTdIB` | Anmälningar | Boolean för om anmälan ska räknas i aktiva rollups. **Skuld:** exkluderar inte "Inställt" — se §Kända fällor. |
| Genomfört event (1 rad per event) | `fldRfc4i7HHfc1dFU` | Deltaganden | Dedup-mekanism för tvådagars-event. Formel: `IF(AND(Närvaropoäng=1, OR(Session="Dag 1", Session="Föreläsning")), Eventlabel (text), BLANK())`. **Verifierad existens 2026-04-28 via MCP.** |

### Session-värden (singleSelect)

`Deltaganden.Session` (`fldBPZnsDL0bNIRHx`) accepterar:

- `Dag 1` (sel: `selc3wPOyp1joKBez`) — räknas i `Genomfört event`
- `Dag 2` (sel: `seljLxztZZUluCzNn`) — räknas INTE i `Genomfört event` (undviker dubbelräkning)
- `Föreläsning` (sel: `selSJcKA6ZDmIvwhV`) — räknas i `Genomfört event`

### Status-värden — Anmälningar

`Anmälningar.Status` (`fldWr5cCPNx9HEKtL`) — **6 val per 2026-04-28:**

| Namn | option-ID | Färg | Anteckning |
|---|---|---|---|
| Bekräftad (mail skickat) | `sel6QGCNQN30jbU9p` | greenLight1 | Sätts av `send-email` (`patchAfterSend` confirmation) |
| Betalningspåminnelse skickad | `sel4mvpii2dWX6ROd` | blueLight2 | |
| Avbokad/Ombokad | `selpxCJnPfU9AMlAB` | orangeLight1 | Användar-initierad — exkluderas från "Är aktiv" |
| Obekräftad | `selwdnWzeAfnr9GRk` | grayLight2 | Default vid create |
| Flytta till väntelista | `selM6aJv5Ja9OySra` | redLight2 | Tillagd i april 2026 |
| **Inställt** | `selebP2V3qmFRTtdP` | redBright | **Ny 2026-04-26.** Arrangör-initierat (Event-6 ställdes in). Semantiskt skild från Avbokad/Ombokad. |

### Status-värden — Eventplanering

`Eventplanering.Status` (`fld2nXlS1UG0aOHLt`) — 4 val:

| Namn | option-ID | Färg | Anteckning |
|---|---|---|---|
| Planerat | `selfj9TFpNTxtAUVQ` | blueLight2 | Default |
| Genomfört | `sel4pIbm5eOHEzLZA` | greenLight2 | |
| **Inställt** | `selmZw4rALZRJ5jg6` | redLight1 | 3 events markerade 2026-04-28: Event-6, Event-11, Event-12 |
| Flyttat | `selv1mc2uQQGF0dsu` | grayLight2 | |

### Källa-värden — Anmälningar

`Anmälningar.Källa` (`fldwk2sl7CkBv9epw`) — **3 val + tom:**

| Namn | option-ID | Färg | Sätts av |
|---|---|---|---|
| Manuell | `selBgWo8mevep0W3j` | purpleLight2 | `create-registration` när admin lägger till manuellt |
| +1 | `selKRBSc3mTmYiwZK` | tealLight2 | `create-registration` när CompanionModal används |
| Väntelista | `sely4zQsuvnXYTKKI` | blueLight2 | `create-registration` när person flyttas från Väntelista |
| *(tom)* | – | – | **Formuläranmälningar** (Huvudformulär, Expressformulär). Frånvaro = sanning. |

### Status-värden — Deltaganden

`Deltaganden.Status` (`fldRFOzNqVswqZ1mN`) — **6 val:**

| Namn | option-ID | Färg | Närvaropoäng |
|---|---|---|--:|
| Ej avstämt | `sel6U4DjySnASdN8C` | grayLight2 | 0 (default) |
| Närvarande | `selL6dOK1XDN8UmKQ` | greenLight1 | 1 |
| Frånvarande | `selhXfNgpF7dCoFn4` | redLight1 | 0 |
| Försenad | `selckiXY869eiLmrX` | yellowLight1 | 0 |
| **Avbröt** | `selJ1f9Yv9J7jjqrH` | redBright | 0 |
| **Deltog online** | `selWGhz7v8MPTVpT8` | yellowLight2 | 1 |

`Avbröt` och `Deltog online` finns i basen sedan tidigare men dokumenterades inte i tidigare versioner av denna fil.

### Schema cheat sheet — operationella fält-IDs

För Edge Functions, scripts, manuella PATCH-ops. Listar fält som ofta skrivs till + alla relevanta options. **Mål:** kunna utföra valfri PATCH/POST utan att slå upp `get_table_schema` mot basen.

#### Anmälningar — write-fält

| Syfte | Fält-ID | Typ | Options / kommentar |
|---|---|---|---|
| Förnamn | `fldMZAwDbygfYN5WY` | multilineText | – |
| Efternamn | `fldUIMY8mjBeem5BE` | multilineText | – |
| E-post | `fldVY310IdOIbTkE8` | multilineText | (typ-skuld — borde vara `email`. Normaliseras via formula `Normaliserad e-post`.) |
| Mobilnummer | `fldBLxAN1KnOUxNjG` | multilineText | – |
| Status | `fldWr5cCPNx9HEKtL` | singleSelect | Bekräftad (mail skickat), Betalningspåminnelse skickad, Avbokad/Ombokad, Obekräftad, Flytta till väntelista, **Inställt** |
| Anmälningsavgift | `fldJtKQ3qLxRKOvR6` | singleSelect | Mottagen, Ej mottagen |
| Slutbetalning | `fldIImadnJUZHr5Qh` | singleSelect | Mottagen, Ej mottagen, Ej relevant (för föreläsningar) |
| Källa | `fldwk2sl7CkBv9epw` | singleSelect | Manuell, +1, Väntelista, *(tom)* |
| Typ | `fldGyYPbxkgS3BqVb` | singleSelect | Utbildning, Föreläsning, Psionautics-event |
| Flagga | `fld6DHDYJZeK2r7OE` | singleSelect | Ny anmälan, Ej mottagen, Mottagen |
| Vill anmäla sig till | `fld6RC3r0R9tuKgdF` | multipleSelects | 8 val — case-dubletter finns (se §Kända fällor 24) |
| Från formulär | `fldCLVfJIHcuI1l83` | multipleSelects | Huvudformulär, Expressformulär, Obekräftad, Anmälan-Psionautics.se, Backfill (historisk) |
| Antal platser | `flduwoTPdI8elSNyD` | number | – |
| Notering | `fldPMsiRoLWcgUbsv` | multilineText | – |
| EventKey | `fldPlPLkpqm0X7Xs2` | multilineText | "Event-N" — matchas av A1 |
| Inskickad | `fldNtSHQivkL26B6L` | dateTime | Sätts av `create-registration` med ISO-timestamp. **Zap 3/4 mappar den INTE** (se §Kända fällor 49) — 294 rader backfillade 2026-08-17 ur `Rad skapad`; framåtgarantin är en separat, ännu ej stängd åtgärd |
| Person (länk) | `fldQekqRlLfup8x5K` | multipleRecordLinks → Personer | Sätts normalt av A2; Edge Functions kan PATCH:a direkt |
| Event (länk) | `fldi3enUaMdbuGSlm` | multipleRecordLinks → Eventplanering | Sätts av A1; Edge Functions sätter samtidigt med EventKey (idempotent) |
| Medföljande till | `fld39KEXJxyulXfsN` | multipleRecordLinks (self) | Sätts av CompanionModal när +1-anmälan skapas |
| Bekräftelse skickad | `fld0jnbkIbuFAumgG` | dateTime | Sätts av `send-email` (confirmation) |
| Betalningspåminnelse skickad | `fldE0cR4r9vI0rKiL` | dateTime | Sätts av `send-email` (payment) |
| Plus-one förfrågan skickad | `fld9BkFY8K5pF0xJ2` | dateTime | Sätts av `send-email` (plus_one) |
| Deltagarinfo skickad | `fld3WBS0QQrqLpYtK` | dateTime | Sätts av `send-email` (participant-info) |
| Betalning mottagen (psionautics-event) | `fldQE6aPiFfwVmJQ3` | checkbox | – |

#### Anmälningar — formulärfält (läs)

Fanns i basen men saknades i denna referens t.o.m. 2026-07-20 (S73
K65-fyndet: "fältet finns ej"-slutsatsen drogs ur referensen och föll
mot live-basen — Marcus-fångst). Endast existens + fält-ID:n verifierade
(identifiersOnly-läsning); typer ej verifierade. Verkliga svar spänner
en rad → ~600 tecken med radbrytningar.

| Fält | Fält-ID |
|---|---|
| Varför vill du gå den här utbildningen? | `fldAv80U5ssqOYguK` |
| Vilka kurser från Roger och Lotta har du deltagit i tidigare? | `fldFFRpBJ3Dhs6eFw` |
| Frågor eller funderingar? | `fldtaSHOvGjgu9v39` |
| Motivering (sammanfattning) | `fldrMT8cWP3NmBc9T` |
| Har du gått steg 1? | `fldE9RwOG42yX4oVA` |
| Uppdatera mig om fler event i framtiden? | `fldeBejosU8PzDtQM` |

#### Väntelista — write-fält

| Syfte | Fält-ID | Typ | Kommentar |
|---|---|---|---|
| Förnamn | `fldhcXiiLNY8JEDgR` | singleLineText | – |
| Efternamn | `fldWKbMYRKlwOmg89` | singleLineText | – |
| E-post | `fldbn9SyKemmI31H3` | singleLineText | – |
| Telefonnummer | `fldysS1swV4xpUsH5` | singleLineText | – |
| Event | `fldC01Nf3lVWrOgdw` | singleLineText | Bär BRAND-värdet, hårdkodat `"Psionautics"` av `create-waitlist-entry` (live-verifierat MCP-pull 2026-06-21, prod `app8uGPrVCVOm6LfD`, 5/5 stickprov). EJ event-namnet — väntelistan har hittills använts för ETT event ("Medveten Kontakt") under brandet Psionautics. Tidigare noterat "Medveten Kontakt" var en event/brand-förväxling. |
| Eventdatum-start | `fld86BydfvliidRBX` | singleLineText | Hårdkodat "2026-05-01" |
| Eventdatum-slut | `fldNSwatG61UaemCt` | singleLineText | Hårdkodat "2026-05-03" |
| utm_source / utm_medium / utm_campaign / utm_content | `fldouEa5AKkfjm7vf`, `fld2Mqil2Tm4N0SwS`, `fldac61BD71mK16nJ`, `fldBBGz0UT815UaQT` | singleLineText | Spårning från landningssidan |
| Flyttad till anmälan | `fldqMpSW5UJIhNdgm` | checkbox | Markeras vid flytt till Anmälningar |
| Informationsmail 1 skickad | `fldsUxLmHR0NQDiwH` | dateTime (UTC) | Sätts av `send-email` (waitlist-info-1) |

#### Eventplanering — write-fält

| Syfte | Fält-ID | Typ | Options / kommentar |
|---|---|---|---|
| Status | `fld2nXlS1UG0aOHLt` | singleSelect | Planerat, Genomfört, Inställt, Flyttat |
| Notering | `fld5Tb1opD3VCJMe7` | multilineText | – |
| Max antal platser | `fldbyEz8djcxCBO5r` | number | MK-eventet: 88 |
| Manuella platser | `fld8pUb6x2G3YIovs` | number | "Anmälningar som kommer in utanför formuläret" |
| Extra platser | `fldIHwVr8Wq5tp4o6` | number | "Reserverade av Roger och Lotta" |
| Arrangörsplatser | `fldfrlZcRW3PGILiN` | number | – |
| Markera alla närvarande | `fldN20OexhRJQr9XY` | checkbox | Triggar A9 (vald session) |
| Markera alla närvarande (alla sessioner) | `fldF5atXm9lV2nAeq` | checkbox | Triggar A10 |
| Check-in session | `fldjX1YN7DOhoKvt1` | singleSelect | Dag 1, Dag 2, Föreläsning — läses av A9 |
| Närvarostatus att sätta | `flddzMrhu30cXoaEf` | singleLineText | Default "Närvarande" — läses av A9/A10 |
| Eventtyp (länk) | `fldCAGA9NPnd9kEmi` | multipleRecordLinks → Eventformat | Avgör Sessionsmall-lookup |

> **Not (Session 38):** tabellen ovan är UPDATE-orienterad — den listar de fält automationerna (A9/A10) och update-vägarna rör på ett BEFINTLIGT event, inte de fält som krävs för att SKAPA ett event. Create-orienterade identitets-/datum-fält står i nästa avsnitt.

#### Eventplanering — create-fält (skapa nytt event)

De skrivbara fält som [ADR-066](../decisions/ADR-066-skapa-event-write-vertikal-idempotens.md):s create-event-vertikal sätter vid skapande av en NY Eventplanering-rad. Skilt från UPDATE-tabellen ovan: dessa bär eventets identitet + datum. **Live-belagt mot STAGING-schema (`tblVE3UKWl1CKrphV`) 2026-06-27 (Session 38 pre-pass).**

| Syfte | Fält (NAMN) | Fält-ID | Typ | Kommentar |
|---|---|---|---|---|
| Kursnamn | Event (source) | `flddlv4JA5C5CeH5R` | singleSelect | Fjärrskådning / Resor i medvetandet (+1/2/3) / Psionautics. `Event (text)` (`fldNIc8I2ynUoLkNn`) är en formel-spegel av detta — sätts ALDRIG. |
| Eventtyp-klass | Typ | `fldkiFRVYG0xTAhJ4` | singleSelect | Utbildning / Föreläsning |
| Ort | Ort | `fldRvwXnDsgjwva2L` | singleLineText | – |
| Start | Startdatum | `fldBYhXEHLCd1o2Je` | date (ISO) | Källa för härledd `Månad/år` (se §Kända fällor 36). |
| Slut | Slutdatum | `fldUMB4x3OyGQ31aL` | date (ISO) | – |
| Period | Månad/år | `fld2BjFdBd964TzVb` | singleSelect | **Manuellt** — sätts HÄRLETT ur `Startdatum` (ADR-066 b6); designbrist registrerad §Kända fällor 36. |
| Kapacitet | Max antal platser | `fldbyEz8djcxCBO5r` | number | – |
| Tillstånd | Status | `fld2nXlS1UG0aOHLt` | singleSelect | Default `Planerat`. |
| Sessionsstruktur | Eventtyp | `fldCAGA9NPnd9kEmi` | multipleRecordLinks → Eventformat | **KRÄVS vid create** (ADR-066 b5, prod-belagt) — driver `Sessionsmall`-lookupen. Pekar på BEFINTLIG Eventformat-rad (ingen ny post). |
| Dokument | PDF (URL) | `fldXIbT08897kV1Oa` | url | Valfritt. |
| Spårning | Touchpoints | `fldeRc98Xs7XJRCn8` | singleLineText | Valfritt. |
| Backfill | Backfill-ID | `fld2M7EdjCcocls0u` | singleLineText | Valfritt (historik-import). |
| Idempotens | Idempotensnyckel | `fldOWoh4WR5zG6XgQ` (staging) | singleLineText | Merge-nyckel för upsert (ADR-066 b3). **Staging-live (Session 38 L1); PROD-fält ej skapat** — hård prod-deploy-förutsättning, se §Kända fällor 37. |

**Sätts ALDRIG vid create** (system-genererat eller härlett från motsatt sida): `EventKey` (`fldhmhaz3ZnouAzDm`, formel `"Event-" & {Event-nr}`) + `Event-nr` (`fldl5By2a7jGBPpxF`, autoNumber) föds vid skapande; `Eventlabel` (primärfält, formel) + alla rollup/count/formel/lookup-fält beräknas; spegelfältet `Anmälningar (länkat fält)` (`fldUAjTutSM0fziMT`) + `Närvaro (records)` sätts från Anmälningar/Deltaganden-sidan (A1/A3) — ett nyfött event har noll.

#### Eventplanering — kvitto-benämning (TASK-306, 2026-08-23)

Frivilligt fält, INTE satt vid create — Lotta fyller i det manuellt per
event, `preview-receipt`/`send-receipt-email` läser det (tillsammans med
`Typ`/`Event (source)`/`Startdatum`/`Slutdatum` ur create-fält-tabellen
ovan) för att bygga kvittots benämningsrad (`kvittoBenamning()`,
`_shared/receipt-content.ts`, se `docs/mallar/bilagor/README.md` § Kvittots
FORM). Läses BY NAME i koden (samma mönster som alla fyra syskonfälten
ovan) — se `send-receipt-email/index.ts` § `readEventKvittoFalt` för det
fulla resonemanget bakom det valet.

| Syfte | Fält (NAMN) | Fält-ID | Typ | Kommentar |
|---|---|---|---|---|
| Bokföringstext | Bokföringstext (kvitto) | prod `fldof3z1V1duVZNjM` · staging `fldlYgrv3P4hKezJE` | singleLineText | Frivilligt. Lottas egna bokföringskategoriord (t.ex. "personlig utveckling, meditation") — sist i benämningen om ifyllt, utelämnat om tomt. Staging skapad av bygg-agenten (Airtable-MCP `create_field`); PROD skapad av orkestreraren på Marcus uttryckliga GO 2026-08-23 (mitt-i-sessionen-tillägg, TASK-306) — samma fältnamn i båda baserna, ID:t skiljer sig (nytt fält, tillagt EFTER bas-dupliceringen, se ID-topologi-noten i §Snabbreferens). |

#### Deltaganden — write-fält

| Syfte | Fält-ID | Typ | Options / kommentar |
|---|---|---|---|
| Status | `fldRFOzNqVswqZ1mN` | singleSelect | Ej avstämt, Närvarande, Frånvarande, Försenad, Avbröt, Deltog online |
| Session | `fldBPZnsDL0bNIRHx` | singleSelect | Dag 1, Dag 2, Föreläsning |
| Noteringar | `fldpCVTUC0C47ci0S` | multilineText | – |
| Anmälan (länk) | `fldwQdDpRK8vByNhb` | multipleRecordLinks → Anmälningar | Sätts av A3 |
| Event (länk) | `fldaj5mbpU3yPw2np` | multipleRecordLinks → Eventplanering | Sätts av A3 |
| Registrerad av | `fldhx3tludhu1gH7w` | lastModifiedBy | **Bokför INTE vem som checkade in** — se §Kända fällor 48. |

#### Personer — write-fält

| Syfte | Fält-ID | Typ | Kommentar |
|---|---|---|---|
| Förnamn | `fldx4jrCJDOtWUk4O` | multilineText | A2 Gren 1 fyller i från Anmälan om Personen är namnlös |
| Efternamn | `fldjcYkSmJBLRhwsO` | multilineText | – |
| E-post | `fldcd5HnYooVZY4Ts` | multilineText | (typ-skuld — borde vara `email`. Se §Kända fällor.) |
| E-post (manuell inmatning) | `fldhp3qXp2E6ekW5D` | email | Validerad fält-typ |
| Telefon | `fldmMYIUhIc1HMnZi` | multilineText | – |
| Manuella flagga | `fldNtwQt6tOCIdf4f` | singleSelect | **choices=[]** — tomt valslag, kan inte sättas. **AVLÖST 2026-08-10 av `Flagga` nedan**; se §Kända fällor 25. |
| Flagga | prod `fldsNDwACc8hWDPeA` · staging `fldCXSGQJEVlf1Sa7` | singleLineText | **NY 2026-08-10 (S103).** Lottas egen FRITEXT-flagga. Ersätter `Manuella flagga` — Marcus beslut: *"det ska vara en flagga som Lotta själv skriver i fritext"*. Skrivbar. Läst av `get-person` (`flagga`-fältet i `PersonDetailSchema`) sedan S103 steg 2; ingen skrivväg byggd ännu. |
| AI-flagga | `fldgB9iHDTAqd30Uf` | singleSelect | Särskilt stödbehov, Nybörjare, Stabil och mottaglig, Erfaren |
| Anteckningar | `fldWGlNr3ujRHo85w` | multilineText | Använt 2026-04-26 för spårbarhet av Avvikelse-fall |
| Ej godkänd för mailutskick | `fldbQB9BGJgB1HCg7` | checkbox | Filterflagga för bulkutskick |
| Inbjuden till community | `flduQ4Luh7XVp61R0` | checkbox | – |
| Skapat konto i community | `fldJzysWhaMGUo16B` | checkbox | – |

#### Segment — write-fält

App-skrivet fält (Fas 6g L3, [ADR-065](../decisions/ADR-065-segment-regel-persistens.md)). Schema-tillägg landat på staging + prod 2026-06-26 (Session 36 pass 2), additivt — inget befintligt fält ändrat. Segment-tabellen adresseras per NAMN (ADR-050 bas-portabilitet); fält-ID:t nedan är prod (`app8uGPrVCVOm6LfD`, den bas EF:erna kör mot).

| Syfte | Fält-ID (prod) | Typ | Skrivbar | Kommentar |
|---|---|---|---|---|
| Appens strukturerade segment-regel | `fldhN1wH6sXODdfb7` | multilineText | ✅ | Typad JSON `{include[], exclude[]}` (formen från `_shared/segment-membership.ts`); skrivs av app-write-vägen (senare pass). Migrations-mål för de 9 legacy-formelsträng-segmenten. Roll/format/migrations-väg: se [ADR-065](../decisions/ADR-065-segment-regel-persistens.md) (+ ADR-062 beslut 7 + T16). |

**Make-legacy-vägen (ORÖRD):** `Segmentformel` (`fld3jcCTY2FQ4vUTk`, Make-läst `filterByFormula`), `Antal i segment` (`fldn02khOce58O3oQ`, Make skriver), `Beräkna antal i segment` (`fldfng79bMW42UOiV`, Make-webhook-knapp) tillhör den gamla Make-vägen och lämnas orörda tills migrationen (ADR-065). App-radens form: `Namn på segment` ← namn; `App-segmentregel` ← `JSON.stringify(rule)`; `Segmentdefinition` ← klartext-spegling.

**ID-topologi staging↔prod (verifierat live 2026-06-26, Session 36 pass 2):** staging-basen (`apphjj8Q7lkXCMsL4`) och prod (`app8uGPrVCVOm6LfD`) delar IDENTISKA tabell- och fält-ID:n för de DUPLICERADE fälten (Segment-tabell-id `tbll2N6JKCj4u6y9o` på BÅDA) — motsäger [ADR-050](../decisions/ADR-050-isolerad-staging-miljo.md) T2:s antagande om "nya tabell-ID:n" på kopian. Data-isolationen håller ändå: `list_records` på staging-Segment = tomt, prod bär de 9 legacy-raderna, och `create_field` är empiriskt baseId-respekterande (staging-skrivning landade staging-only, prod orört — verifierat denna landning). NYA fält får dock DISTINKTA ID:n per bas: `App-segmentregel` = prod `fldhN1wH6sXODdfb7` ≠ staging `flduG7pKaHb9tTzBY`. `describe_table`-by-namn är opålitlig mot dessa baser → adressera Segment per id. **TODO:** en additiv [ADR-050](../decisions/ADR-050-isolerad-staging-miljo.md)-korrigerings-not (README § Korrigering vs supersedering) bör landas separat — denna data-model-not registrerar fyndet durabelt tills dess.

Proveniens för Schema cheat sheet: extraherat ur `02-live-state.md` §3 + `01-extraction.md` §A.4 + `01-extraction.md` §I (Edge Function-kontrakt) — research-underlag, ej en parallell sanningskälla (ADR-100 §2).

### Utskickslogg — fält + write-fält (Fas 6h)

Revisionslogg för bulk-mailutskick. **6h:s write-mål** ([ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)) — fylls av `send-email`-EF:en; läses av 6e:s `get-mail-log` (tom sedan S33, L188). Live-introspekterat 2026-06-28 (Session 39 L0, staging-bas `apphjj8Q7lkXCMsL4`, tabell `tblIesjbuSWNp6oxK`, 9 fält). Existerande tabell → fält-ID:n identiska staging↔prod (ID-topologi-noten ovan).

| Fält | Fält-ID | Typ | Skrivbar | Roll |
|---|---|---|---|---|
| Namn på utskick | `fldWRz9ap7fxHAMkW` | singleLineText | ✅ | Utskickets namn |
| Skickat till | `fldnNRJHfhEQLrQkp` | multipleRecordLinks → Personer (`tbl6ZyCm3V026iFTU`) | ✅ | Accepterade mottagar-record-ID:n |
| Filter snapshot | `fldM7DTUDljK3POWP` | multilineText | ✅ | Segment-/filter-ögonblicksbild |
| Mailutskick copy | `fldPCrRxwjuUa7J2R` | singleLineText | ✅ | Mailtext-kopia |
| Utskicks-ID | `fldqK5kGeVjVtJcS0` | multipleRecordLinks → Bulkutskick (`tblWarzSse85NI1Zx`) | ✅ (valfri) | **Valfri** länk — Bulkutskick är Make-legacy-kampanjbordet, EJ obligatorisk förälder; sätts ej av 6h L0 |
| `Idempotensnyckel` | `fldgB4EWDIksNCvN2` (staging) | singleLineText | ✅ | Merge-nyckel för upsert (ADR-067 D4b); skapad L2a (staging; prod vid deploy). Jfr Eventplanering.`Idempotensnyckel` |
| Antal skickade | `fldqJBTOwErzMdCAO` | formula `COUNTA({Skickat till})` | ❌ | Härleds ur `Skickat till` — skrivs ALDRIG |
| Datum | `fldBQjiy2KhuEFIfi` | createdTime | ❌ | Auto |
| Antal öppnade mail | `fldmDGQsMv8BbPWok` | multipleRecordLinks → Email Opens (`tblXFJyGRahQDhhqc`) | ❌ (opens-ingestion) | Fylls av webhook-leverans/öppning-ingestion (deferrad, T42) — EJ 6h-send-skrivning |
| Öppningsgrad (%) | `fldmrf9SaBcXLNJUl` | formula `{Antal öppnade mail}/{Antal skickade}` | ❌ | Percent-decimal 0–1; null vid 0 skickade |

**Send-skrivbara fält 6h:** 5 (Namn på utskick, Skickat till, Filter snapshot, Mailutskick copy, Utskicks-ID-valfri) + den additiva `Idempotensnyckel`-kolumnen (`fldgB4EWDIksNCvN2`, skapad L2a på staging; prod vid deploy). **Bulkutskick** (`tblWarzSse85NI1Zx`) är en full Make-legacy-kampanjtabell (Status singleSelect, Segment-länk, Ämne/Mailtext, `Skicka`-button → Make-webhook, Förhandsgranskning-formula) — coexistens lämnas orörd; 6h skapar ingen Bulkutskick-rad i L0-scope.

> **Schema-projektion vs live (L189-not):** den landade `MailLogEntrySchema` (read-projektion, S33) modellerar 8 av tabellens 9 fält — den **utelämnar** `Antal öppnade mail` (`fldmDGQsMv8BbPWok`, link → Email Opens). Ingen motsägelse (alla projicerade fält stämmer mot live till namn/typ/formelform); det utelämnade fältet hör till opens-ingestion (deferrad). Verifieras mot Airtable-live, inte mot detta dokuments egen prosa — Airtable äger ursprunget, detta dokument förblir bäraren i repot (ADR-100 §2).

---

## Grundarkitektur — Airtable-basen

- **Base ID:** `app8uGPrVCVOm6LfD`
- **18 tabeller** — tre är kärnan, resten är stöd
- **11 automationer** (A1–A11), alla `deployed` per JSON-export 2026-03-16; verifierat empiriskt levande genom nya Anmälningar 2026-04-27 (A1+A2+A3 körde inom 22 sekunder)
- **10 Zapier-zaps** (formulär → Airtable, plus Soundwise-integrationer) — [HYPOTES — EJ VERIFIERAD] räkning kommer från `schema_reference.md` 2026-03; aktualitet ej kontrollerad
- **2 Make.com-scenarier** (segmentering + bulkmail) — [HYPOTES — EJ VERIFIERAD] samma kommentar
- **Delas av:** Miranon Media (primär ägare) och Psionautics (gäst, delar tabellerna)

### De tre kärntabellerna

```text
Personer ─────────┬───────────────── Anmälningar
   (master        │                   (en rad per
   registry)      │                   person × event)
                  │                           │
                  └─── Deltaganden ───────────┘
                     (en rad per person
                     × event × session —
                     där närvaro markeras)
```

**Personer** — en rad per unik person. All kurshistorik och alla rollups samlas här.
**Anmälningar** — en rad per person per event. Datumstämpel, betalstatus, mailhistorik.
**Deltaganden** — en rad per person per sessionsdag. **Detta är platsen där närvaro markeras.** Allt som räknas som "genomförd kurs" utgår härifrån.

### Övriga tabeller

| Kategori | Tabeller |
|---|---|
| Event-domän | Eventplanering, Eventformat |
| Lead-magnet-domän | Erbjudanden, Hämtade erbjudanden, Engagemang |
| CRM/kontakt | Touchpoints, Kontaktlogg (rådata) |
| Bulkmail | Bulkutskick, Segment, Utskickslogg, Email Opens |
| Publik funnel | Väntelista |
| Systemstöd | Error-log, Path to Conversion (tom strukturell behållare), Instagram Posts (tom strukturell behållare) |

Se §Snabbreferens / Tabell-ID:n ovan för fullständig översikt med fält-räknare. Live-pull i `~/Repon/miranon-media-admin/docs/research/datamodell-research/02-live-state.md`.

---

## Fält tillagda i april 2026

Konsoliderad lista över schema-ändringar i basen sedan 2026-04-15. Alla bekräftade via MCP `get_table_schema` 2026-04-28.

### Anmälningar (`tbloOcrppVoyrHbrq`)

| Fält | ID | Typ | Skapat | Syfte |
|---|---|---|---|---|
| Källa | `fldwk2sl7CkBv9epw` | singleSelect | 2026-04-15 | Hur anmälan skapades. Val: Manuell, +1, Väntelista. Formuläranmälningar lämnar fältet tomt. Sätts av Edge Functions (`create-registration`). |
| Medföljande till | `fld39KEXJxyulXfsN` | multipleRecordLinks (self) | 2026-04-15 | Länkar en +1-anmälan till huvudanmälan. Sätts av CompanionModal i admin. |
| From field: Medföljande till | `fldlP4z8Dirq00nqq` | multipleRecordLinks (self, inverse) | 2026-04-15 | Auto-skapat inverse-fält. Read-only. |
| Deltagarinfo skickad | `fld3WBS0QQrqLpYtK` | dateTime | 2026-04-16 | Timestamp när deltagarinfo-PDF skickats via Resend-mall `medveten-kontakt-deltagarinformation`. Sätts av `send-email` Edge Function vid `type='participant-info'`. |
| Status="Inställt" | option `selebP2V3qmFRTtdP` på `fldWr5cCPNx9HEKtL` | singleSelect option | 2026-04-26 | Arrangör-initierat (Event-6 ställdes in). Semantiskt skild från Avbokad/Ombokad. Tillagd av Marcus i UI under åtgärdssessionen. |
| Status="Flytta till väntelista" | option `selM6aJv5Ja9OySra` | singleSelect option | tidigare april | Lila badge i admin. |
| Typ="Psionautics-event" | option `selBIFgu1Vgt228TR` | singleSelect option | tidigare april | – |
| "Backfill (historisk)" på Från formulär | option `selGi1iqC3lb8MSSh` | multipleSelects option | 2026-04-19 | Tillagd för backfill-sessionen. |

### Väntelista (`tbl2VxMx7JMkIxD4Q`)

| Fält | ID | Typ | Skapat | Syfte |
|---|---|---|---|---|
| Flyttad till anmälan | `fldqMpSW5UJIhNdgm` | checkbox | 2026-04-15 | Markeras automatiskt när personen flyttas från väntelistan till Anmälningar. Raden ligger kvar som historik men filtreras bort från aktiv väntelista i admin. |
| Informationsmail 1 skickad | `fldsUxLmHR0NQDiwH` | dateTime (UTC) | 2026-04-27 | Tidstämpel när informationsmail 1 skickats via Resend-mall `medveten-kontakt-vantelista-info-1`. Sätts av `send-email` Edge Function vid `type='waitlist-info-1'`. Timezone i Airtable-fältet: `utc` (Airtable-API accepterar inte `gmt`; identiskt offset). |

### Personer (`tbl6ZyCm3V026iFTU`)

| Fält | ID | Typ | Skapat | Syfte |
|---|---|---|---|---|
| RIM 3 × | `fld93OrTArvdkkYmk` | rollup | 2026-04-26 | Räknar närvaroposter på "Resor i medvetandet 3"-event. Rollar `fldL0YfWmdkOuxgsH` (RIM 3 eventkey) från Deltaganden. Tidigare saknades — symmetri mot RIM 1 ×, RIM 2 ×, Fjärrskådning ×. |
| Antal genomförda event | `flddy8JND3YnlgZxe` | formula | 2026-04-26 | Konverterad från rollup till formula: `{RIM 1 ×} + {RIM 2 ×} + {RIM 3 ×} + {Fjärrskådning ×}`. Konsoliderad efter formelfilter-divergens upptäckt 2026-04-24 (verifiering errata Fynd 3). |
| Antal genomförda event (gammal) | `flddymQaYJGVCInzq` | rollup | (befintligt) | Markerad för borttagning (deadline 2026-05-03 passerad utan åtgärd; fältet finns kvar i basen — borttagning ej utförd). Bevarad för fall där konsumenter pekar på gamla fält-IDt. |

### Eventplanering (`tblVE3UKWl1CKrphV`)

| Fält | ID | Typ | Skapat | Syfte |
|---|---|---|---|---|
| Status="Inställt" | option `selmZw4rALZRJ5jg6` på `fld2nXlS1UG0aOHLt` | singleSelect option | (befintlig 2026-04-28) | 3 events markerade 2026-04-28: Event-6 (Varberg, 2026-02-06), Event-11 (Falköping FS, 2026-03-19), Event-12 (Falköping RIM, 2026-03-20). Marcus bekräftade Event-6 som proxy 2026-04-26 (verifiering mot mejlhistorik ej genomförd). |
| Max antal platser för MK | `fldbyEz8djcxCBO5r` värde 70 → 88 | number-värdesändring | 2026-04-26 | Marcus utökade kapaciteten i UI under åtgärdssessionen. |

### Deltaganden (`tbldWHH6sSHWoQPHH`)

| Fält | ID | Typ | Skapat | Syfte |
|---|---|---|---|---|
| RIM 3 eventkey | `fldL0YfWmdkOuxgsH` | formula | 2026-04-26 | `IF(AND(Närvaropoäng=1, Kursnamn="Resor i medvetandet 3"), Eventkey, BLANK())`. Symmetri mot RIM 1/RIM 2/Fjärrskådning. |
| Status="Avbröt" | option `selJ1f9Yv9J7jjqrH` på `fldRFOzNqVswqZ1mN` | singleSelect option | (befintlig 2026-04-28) | Användar-initierat avbrott. Närvaropoäng = 0. Inte dokumenterad i tidigare versioner. |
| Status="Deltog online" | option `selWGhz7v8MPTVpT8` | singleSelect option | (befintlig 2026-04-28) | Räknas som närvaro (Närvaropoäng = 1). Inte dokumenterad i tidigare versioner. |

---

## Fält tillagda i augusti 2026 — anmälningsgrenen i `Senaste interaktion`

`TASK-184`, 2026-08-10. Åtta nya fält i BÅDA baserna plus två ändrade formler.
Alla nya fält är **beräknade** (lookup / formel / rollup) — de fick därmed värde
på samtliga befintliga rader i samma ögonblick de skapades. **Ingen backfill,
ingen automationsändring, inget nytt länkfält.** Den styrande utredningen:
[`touchpoint-kurs-och-ort-2026-08-10.md`](../research/touchpoint-kurs-och-ort-2026-08-10.md).
Väggen som stängde touchpoint-vägen står som **P30** i
[`airtable-constraints.md`](./airtable-constraints.md).

**Vad som ändrades för Lotta:** `Personer.Senaste interaktion (text)` sade för
anmälningsgrenen `Anmälde sig · 19 apr 2026`. Den säger nu
`Anmälde sig · RIM 1, Rönninge · 19 apr 2026`. Formen matchar de två grenar som
redan fanns (`Touchpoints.TP sammanfattning` `fldO3G3hY0iFLKopR`,
`Deltaganden.Deltog sammanfattning` `fldKaxHf6UzcHN94v`) — de rördes inte.

**Fält-ID:n skiljer sig mellan baserna** (nya fält får eget ID per bas, till
skillnad från de klonade — se ID-topologi-noten i §Snabbreferens).

### Anmälningar (`tbloOcrppVoyrHbrq`)

| Fält | ID prod | ID staging | Typ | Syfte |
|---|---|---|---|---|
| Ort (from Event) | `fld5560T3pQZSUBaJ` | `fldUhHceqBud4BHvf` | lookup via `fldi3enUaMdbuGSlm` av `fldRvwXnDsgjwva2L` | Eventets ort. Anmälans EGNA `Ort` duger inte — backfill-anmälningar har den tom. |
| Kurs (from Event) | `fldfqU6MfBQdaeLUk` | `fldcTDSzGBG0bHjl3` | lookup via `fldi3enUaMdbuGSlm` av `fldNIc8I2ynUoLkNn` | Eventets kursnamn. Anmälans EGNA `Vill anmäla sig till` duger inte — samma skäl. |
| Anmälan datetimekey | `fldfQqBjqGHLSazAs` | `fldDdlU7w1aItf8XA` | formula (number) | `YYYYMMDDHHmmss` ur `Rad skapad` i Europe/Stockholm. Samma idiom som `Deltaganden.Genomfört event datekey`. |
| Person - senaste anmälan datetimekey | `fldoSStIK36rdxKtj` | `fldBtpOlRnWXspbip` | lookup via `fldQekqRlLfup8x5K` | Personens högsta anmälningsnyckel, hämtad tillbaka. Samma idiom som `Deltaganden.Person - senast genomfört datekey`. |
| Senaste anmälan (sammanfattning) | `fldEos4UvVBpk2reB` | `fldwgo1fJirUwUiOC` | formula | Den färdiga meningen. Fylls ENDAST på personens senaste anmälan (se Grinden nedan). |

### Personer (`tbl6ZyCm3V026iFTU`)

| Fält | ID prod | ID staging | Typ | Syfte |
|---|---|---|---|---|
| Senaste anmälan datum | `fldmx8O7LQPdopD6T` | `fldEEdTZA9sUpVQaI` | rollup `MAX(values)` av `fldet9MU1rJBSpo3y` via `fld8pOivka8YdiywK` | Datum-kandidat för grenen. `Rad skapad` valdes framför `Inskickad` — `Inskickad` (`fldNtSHQivkL26B6L`) var ojämnt ifylld. **Rotorsaken är sedan 2026-08-17 känd och den historiska luckan åtgärdad** (Zap 3/4 mappade aldrig fältet; 294 rader backfillade — §Kända fällor 49). Valet av `Rad skapad` står ändå kvar som rätt: fältet är av typen `createdTime` och kan därför aldrig vara tomt, medan `Inskickad` är skrivbar och beror av att varje inskrivningsväg minns att sätta den. |
| Senaste anmälan datetimekey | `fldj5IxwmjJ3giZhT` | `fldeiyO7B8xDzBB2D` | rollup `MAX(values)` av anmälningsnyckeln | **Sekundupplöst** (`YYYYMMDDHHmmss`) — syskonfälten `Senaste touchpoint/deltagande datetimekey` är minutupplösta. Dividera med 100 vid jämförelse. |
| Senaste anmälan (text) | `fldmNo7XJBdfs8heT` | `fldIvGODBIoW9TZbn` | rollup `ARRAYJOIN(ARRAYUNIQUE(values), "")` | Text-kandidat för grenen. |

### Grinden — varför formeln är tom på alla utom EN anmälan

`Senaste anmälan (sammanfattning)` skriver bara ut sin mening när radens egen
`Anmälan datetimekey` är lika med `Person - senaste anmälan datetimekey`. Rollupen
på `Personer` får därför exakt ett värde, **utan att bero på radordning**.

Det är avsiktligt och inte en omväg. De befintliga syskonrollupparna
(`TP sammanfattning (rollup)` `fldgzFXqDGTdKEf60`, `Senast deltagande (rad)`
`fldvAQbWMNoj3oPqm`) levererar i stället en radbruten lista i **fallande**
datumordning, och `Senast touchpoint (text)` / `Senast deltagande (text)` plockar
första raden. **Den ordningen går inte att återskapa via API:t.** Mätt 2026-08-10:
länkcellens ordning är STIGANDE (person `recPyHkKMh7kJyZJ4`, touchpoints
23 mar → 19 apr 20:56) medan rollupens utdata är FALLANDE — ordningen kommer
alltså från en vy-/filterinställning på fältet som metadata-API:t varken visar
eller kan sätta (jämför **P24**). En ny rollup byggd via API:t hade fått
länkcellens ordning och tagit ÄLDSTA raden. Grinden gör frågan irrelevant.

### Tie-break — anmälan slår touchpoint samma dygn

A2 stämplar sin touchpoint med automationens KÖRTID, alltså några sekunder EFTER
anmälan (mätt spann 2026-08-10: **3,6–6,7 s** över fyra anmälningar). Utan en
explicit regel vinner touchpointen på datum varje gång, och den fattiga strängen
visas trots att den rika finns.

Regeln i `Senaste interaktion (text)` / `(datum)`: **anmälningskandidaten slår
touchpoint-kandidaten så länge touchpointen inte ligger på en SENARE DAG.**
Jämförelsen görs på heltalsnycklar (`FLOOR(tp/10000) <= FLOOR(anm/1000000)`),
inte på datumvärden — rollupens datumvärde exponeras som datum-typ och
tidsprecisionen får därför inte vara bärande. Deltagandegrenen jämförs oförändrat
mot originalets uttryck.

Två kända, medvetet accepterade kanter:

1. **Midnatt.** Anmälan 23:59:58 och touchpoint 00:00:03 nästa dygn hamnar på
   olika dagar → touchpointen vinner och den fattiga strängen visas. Kräver att
   A2:s körning korsar dygnsgränsen.
2. **Annan interaktion samma dag.** Anmäler sig kl. 09 och hämtar ett erbjudande
   kl. 18 samma dag → anmälan visas, inte hämtningen. Regeln flyttar aldrig ett
   datum och tappar aldrig en interaktion; den väljer bara vilken av dagens
   händelser som får meningen.

### Kvarvarande fattig sträng — 3 personer, redan känd klass

Efter ändringen visar 3 prod-personer fortfarande `Anmälde sig · <datum>` utan
kurs och ort. Samtliga har `Antal anmälningar (totalt) = 0`: de bär en
`Inskickad anmälan`-touchpoint utan någon länkad anmälan alls. Det är den
föräldralösa klassen A2:s grenordning skapar (§Reverse-flow F.1, §Kända fällor 12)
— inte en brist i denna ändring. Grenen faller tillbaka på originaluttrycket i
stället för att tappa interaktionen.

### Öppen skuld — tre systerfält som inte utvidgades

`Senaste interaktion datetimekey` (`fldT1yVpCFa5Zyrji`),
`Dagar sedan senaste interaktion` (`fld6wQp5K9VAcFskd`) och `Min av de två`
(`fld9wrmfhSParaxOz`) räknar fortfarande "senaste interaktion" som MAX av
**touchpoint och deltagande**, utan anmälningskandidaten. De divergerar därmed
från fälten de är namngivna efter. **Ingen av dem läses av appen** (verifierat med
sökning över `src/`, `supabase/`, `tests/` 2026-08-10) — därför lämnades de
utanför `TASK-184`:s scope i stället för att utvidgas oombedd. Skulden är öppen,
inte löst.

---

## Fält tillagda 2026-08-21 — eventlänkens vakt (TASK-284.1, ADR-122 beslut 3)

**I BÅDA BASERNA sedan 2026-08-22** — staging (`apphjj8Q7lkXCMsL4`) 2026-08-21
via `TASK-284.1`; prod (`app8uGPrVCVOm6LfD`) 2026-08-22 via `TASK-284.6` steg 1
(Marcus GO, S110 Del 10). Två nya fält på `Anmälningar` (`tbloOcrppVoyrHbrq`),
skapade via Airtable-MCP `create_field`/`update_field`. **Fält-ID:na DIVERGERAR
mellan baserna** (samma klass som `Ort (from Event)`/`Kurs (from Event)` ovan) —
prod-formeln är staging-formeln verbatim med tre ID:n ommappade
(`Ort (from Event)` → `fld5560T3pQZSUBaJ`, `Kurs (from Event)` →
`fldfqU6MfBQdaeLUk`, `Datum (from Event)` → prod-ID:t nedan); käll-ID:t
`fldc3aWz7CxO4rDdl` i `Eventplanering` är detsamma i båda:

| Fält | ID (prod) | ID (staging) | Typ | Syfte |
|---|---|---|---|---|
| Datum (from Event) | `fldho1zlmKxT4gZ0o` | `fldLCfZfk7zESNbno` | lookup via `fldi3enUaMdbuGSlm` av `Eventplanering.'Datum (visas i länk)'` (`fldc3aWz7CxO4rDdl`) | Facit-sidan för Eventmatchning: eventets formaterade visningsdatum. |
| Eventmatchning | `fld40RI3Jf7RaHpTa` | `fldYz2NRZJjyX8VWB` | formula | Jämför anmälans egna formulärtext (`Datum`/`Ort`/`Event (namn)`) mot eventets facit (`Ort (from Event)`/`Kurs (from Event)`/`Datum (from Event)`), normaliserat mot skiftläge + mellanslag runt tankstreck + upprepat årtal. Exakt tre värden: `OK` \| `Avviker` \| `Utan event`. Tomt jämförelsefält ger ALDRIG `Avviker` (trestegs-logik). |

**`LET()` stöds INTE av Airtable-API:ts fält-skapande-endpoint** — skarpt
prövat 2026-08-21: `create_field` med en `LET(x, 5, y, 10, x + y)`-formel
avvisas med `INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE` / `"Unknown field names:
x, y"`, trots att Airtables UI-editor stöder `LET()`. Formelfält skapade via
API:t måste vara HELT UTAN `LET()` — nästlade funktionsanrop i stället för
namngivna variabler. `Eventmatchning`s formel är därför medvetet lång och
upprepande (samma normaliserings-uttryck skrivet ut sex gånger: en per
own/facit-sida × tre jämförelsefält) i stället för att definiera en
återanvändbar variabel.

**`Event (namn)` (`fldK1aYEm3iCg8OOh`) är INTE en lookup från eventet** —
ADR-122 § Fynd 1 grupperar den bland "lookup-fält från det länkade eventet"
tillsammans med `Ort (from Event)`/`Kurs (from Event)`. Live-verifierat
(`describe_table`, både prod och staging, 2026-08-21): fältet är en
**FORMEL** `{Vill anmäla sig till}` — anmälans EGEN flerval-text, flödad till
sträng, inte eventets kanoniska kursnamn. `Eventmatchning`-formeln använder
fältet korrekt som den ENA av jämförelsens PÅSTÅENDE-sida (own-side, mot
facit `Kurs (from Event)`) — ADR-122:s prosa är alltså en dokumentationsfel,
fältet självt behöver ingen ändring.

Live-bevisade via fyra staging-fixturer (`ZZ-TASK-284.1 Fixtur *`,
`tests/api/fixtures.ts`, konsumerade av
`tests/api/get-registrations.staging.test.ts`): skiftläge + tankstreck-
mellanslag + upprepat årtal → `OK` (mirrors prod Event-59); tomt eget
`Ort`-fält (backfill-mönstret) → `OK`, aldrig `Avviker`; formulärtext som
pekar på ett annat event än länken → `Avviker` (mirrors prod anmälan-21);
ingen Event-länk → `Utan event`.

---

## Den kritiska distinktionen — två datakällor, två konsekvenser

**Det här är den viktigaste insikten i hela modellen.** Rollup-fälten på Personer kommer från två olika tabeller, och det avgör helt vad datan faktiskt betyder.

### Spår 1 — Räknar från Anmälningar (kräver INTE närvaro)

| Person-fält | Räknar |
|---|---|
| `Antal anmälningar (aktiva)` (`fldN8Qv3WCOm3Oheb`) | Summa av `Är aktiv (1/0)` på personens anmälningar |
| `Har en aktiv anmälan?` (`fld9Yr7aGST29Pbdf`) | "Aktiv" om kommande utbildning eller föreläsning finns |
| `Återkommande?` (`fld5npMbl3PaSlm4B`) | "Ja" om personen har BÅDE tidigare OCH kommande anmälningar |

Dessa fylls i så fort en Anmälan skapas och får sin Person-länk (via A2).

### Spår 2 — Räknar från Deltaganden (KRÄVER närvaro)

| Person-fält | Räknar |
|---|---|
| `RIM 1 ×` (`fldUwG9s0x071vOHc`) | COUNTA på `Deltaganden.RIM 1 eventkey` |
| `RIM 2 ×` (`fld6JzAkgeERQzLLI`) | COUNTA på `Deltaganden.RIM 2 eventkey` |
| `RIM 3 ×` (`fld93OrTArvdkkYmk`) | COUNTA på `Deltaganden.RIM 3 eventkey`. **Tillagt 2026-04-26** för symmetri. |
| `Fjärrskådning ×` (`fldlczklhguSg02H6`) | COUNTA på `Deltaganden.Fjärrskådning eventkey` |
| `Antal genomförda event` (`flddy8JND3YnlgZxe`) | **Formula** sedan 2026-04-26: `{RIM 1 ×} + {RIM 2 ×} + {RIM 3 ×} + {Fjärrskådning ×}`. Tidigare en rollup på `Genomfört event (1 rad per event)` — men formelfilter-divergens (Dag 1 OR Föreläsning) ledde till inkonsistens med RIM-räknarna (som saknar Session-filter). Konvertering till formula fixar konsistens. |
| `Antal genomförda event (gammal)` (`flddymQaYJGVCInzq`) | **Parallellt fält**, gammal rollup. Markerad för borttagning (deadline 2026-05-03 passerad utan åtgärd; fältet finns kvar i basen — borttagning ej utförd). Risk: konsumenter som pekar på gamla får data utan RIM 3. Se §Kända fällor 28. |
| `Erfarenhetsnivå` (`fldWSkxHJS2xWav4t`) | Formula utifrån RIM 1/2-antal. **Tar inte hänsyn till RIM 3** — se §Kända buggar i insiktskedjan. |
| `Erfarenhetsbadge` (`fld04qqDQLgbJbBef`) | SWITCH av Erfarenhetsnivå |
| `Genomförda event (lista)` (`fldfopt6vl3ZdOT5W`) | ARRAYJOIN av `Genomfört event` |
| `Kommande event` (`fldITyVMA9a4SHdgN`) | SUM av `Kommande poäng` |

Alla dessa är **tomma eller noll** tills `Deltaganden.Status` har satts till `Närvarande` eller `Deltog online`.

### Konsekvenserna i praktiken

- En rapport som visar "Ny/Återkommande" kan byggas **utan backfill** — data finns redan.
- En rapport som visar "Antal genomförda RIM 1-kurser" kräver **att närvaro är markerad** på tidigare event.

**Backfill genomförd 2026-04-19.** 459 historiska Anmälningar + 924 historiska Deltaganden importerade. 22 nya Eventplanering-records skapade. Verifierad 2026-04-24 (med erratablock 2026-04-26). Detaljer: `~/Repon/psionautics/docs/backfill/`. Se även §Backfill-strategier nedan.

### Aktuell datakvalitet (live-MCP 2026-04-28)

| Mått | Värde 2026-04-28 | Värde 2026-04-16 (pre-backfill) |
|---|--:|--:|
| Deltaganden totalt | **1 500** | 517 |
| Deltaganden — Närvarande | **1 012 (67.5%)** | 30 (5.8%) |
| Deltaganden — Ej avstämt | **488 (32.5%)** | 487 (94.2%) |
| Deltaganden — Frånvarande / Försenad / Avbröt / Deltog online | 0 / 0 / 0 / 0 | samma |

**Backfillen flippade dataset-distributionen.** Pre-backfill var 94% Ej avstämt → 33% efter import av Lottas historiska närvarodata.

**MK-eventet (`recQ2TPsY69fQXA8a`) — egen distribution 2026-04-28:**

| Mått | Värde | Källa |
|---|--:|---|
| Totalt antal Deltaganden för MK | 218 | MCP `list_records_for_table` med filter `Event=recQ2TPsY69fQXA8a` |
| Status "Ej avstämt" | 218 (100%) | Inget MK-deltagande markerat ännu — MK är 1–3 maj 2026 |

218 = 87 anmälda + arrangörsplatser/extra/medföljande, multiplicerat med 2 sessioner per anmälan. Differensen mot 174 (87×2) reflekterar de extra platserna som A3 förskapat Deltaganden för. Närvaro markeras efter eventet 1–3 maj 2026.

**Resterande 488 − 218 = 270 Ej avstämt** ligger på andra event (framtida + några edge-cases från åtgärdssessionen 2026-04-26 där backfillen inte täckte). Bryts ner per event vid behov via MCP-filter på `Deltaganden.Event`.

---

## Insiktskedjan — från Status till Erfarenhetsbadge

Detta är DAG:en som gör att närvaromarkering på Deltaganden blir till en badge på Personer. Varje pil är ett beroende.

```text
Deltaganden.Status
       │
       ▼
Deltaganden.Närvaropoäng (formula)
       IF(Status IN ["Närvarande","Deltog online"], 1, 0)
       │
       ├─────────────┬──────────────┬──────────────┬───────────────────┐
       ▼             ▼              ▼              ▼                   ▼
Deltaganden.    Deltaganden.   Deltaganden.   Deltaganden.       Deltaganden.
RIM 1 eventkey  RIM 2 eventkey RIM 3 eventkey Fjärrskådning      Genomfört event
(formula +      (formula +     (formula +     eventkey           (1 rad per event)
Kursnamn-filter) Kursnamn-filter) Kursnamn-    (formula +        (formula +
                                  filter)      Kursnamn-filter)   Session-filter)
       │             │              │              │                   │
       │ COUNTA      │ COUNTA       │ COUNTA       │ COUNTA            │ COUNTA
       ▼             ▼              ▼              ▼                   ▼
Personer.       Personer.      Personer.      Personer.          Personer.
RIM 1 ×         RIM 2 ×        RIM 3 ×        Fjärrskådning ×    Antal genomförda
                                                                  event (gammal,
                                                                  markerad för
                                                                  borttagning)
       │             │              │              │
       └──┬──────────┴──────┬───────┴──────────────┘
          │                 │
          │                 ▼ (summan via formula)
          │        Personer.Antal genomförda event
          │        = RIM 1 × + RIM 2 × + RIM 3 × + Fjärrskådning ×
          │
          ▼ (via Totala deltaganden och IF-kedja)
       Personer.Erfarenhetsnivå (formula)
                     │
                     ▼ (via SWITCH)
       Personer.Erfarenhetsbadge (formula)
```

### Varje steg i klartext

#### 1. Status → Närvaropoäng

```text
IF(Status="Närvarande" OR Status="Deltog online", 1, 0)
```

Alla statusar som inte innebär närvaro (Ej avstämt, Frånvarande, Försenad, Avbröt) ger 0.

**2. Närvaropoäng → Eventkey-formler**
Fyra parallella formler som filtrerar på kursnamn:

```text
RIM 1 eventkey      = IF(Närvaropoäng=1 AND Kursnamn="Resor i medvetandet 1", Eventkey, BLANK)
RIM 2 eventkey      = IF(Närvaropoäng=1 AND Kursnamn="Resor i medvetandet 2", Eventkey, BLANK)
RIM 3 eventkey      = IF(Närvaropoäng=1 AND Kursnamn="Resor i medvetandet 3", Eventkey, BLANK)
Fjärrskådning ek.   = IF(Närvaropoäng=1 AND Kursnamn="Fjärrskådning", Eventkey, BLANK)
```

**RIM 3-formeln tillagd 2026-04-26** (`fldL0YfWmdkOuxgsH`) för symmetri. Inget Session-filter på dessa fyra — räknar via Dag 1 OR Dag 2.

#### 3. Närvaropoäng → Genomfört event (1 rad per event)

```text
IF(Närvaropoäng=1 AND (Session="Dag 1" OR Session="Föreläsning"), Eventlabel, BLANK)
```

Session-filtret är kritiskt: det hindrar att ett tvådagars-event räknas dubbelt (eftersom både Dag 1 och Dag 2 är separata Deltaganden-poster).

**Konsekvens av filter-divergensen:** Eventkey-formlerna räknar Dag 1 OR Dag 2 (ingen filter), Genomfört event räknar bara Dag 1 OR Föreläsning. För dag2_only-events kan en person samtidigt ha "RIM 1 × = 1" och "Antal genomförda event (gammal) = 0". Den nya `Antal genomförda event` (formula 2026-04-26) summerar Eventkey-räknarna istället → konsistent med RIM-räknarna.

**4. Eventkey-formler → Personer.RIM 1 × / RIM 2 × / RIM 3 × / Fjärrskådning ×**
COUNTA (antal non-blank) på vardera rollup. RIM 3 × tillagt 2026-04-26.

**5. Personer.Erfarenhetsnivå**
Klassificerar personen utifrån RIM 1 × och RIM 2 × (full formel via MCP get_table_schema). Resultat i ordning från lägst till högst engagemang:

| Nivå | Villkor |
|---|---|
| Ej påbörjat | Totala deltaganden = 0 |
| Fjärrskådning | Fjärrskådning × > 0, inga RIM |
| RIM steg 1 | RIM 1 × = 1, RIM 2 × = 0 |
| RIM steg 1 – upprepat | RIM 1 × ≥ 2, RIM 2 × = 0 |
| Genomfört RIM steg 1–2 | RIM 1 × > 0 AND RIM 2 × > 0, totalt < 3 |
| Genomfört RIM steg 1–2 (upprepat) | RIM 1 × > 0 AND RIM 2 × > 0, totalt ≥ 3 |
| Avvikelse: RIM 2 utan RIM 1 | RIM 2 × > 0 AND RIM 1 × = 0 — fångar felordning |

> **Not — "Totala deltaganden":** villkoret ovan avser fältet `Totala deltaganden (gammal)` (`fldBP7xdEmpXDwUpz`), formel `{RIM 1 ×} + {RIM 2 ×} + {Fjärrskådning ×}` — **exkluderar RIM 3** (verifierat mot `02-live-state.md` §3). Erfarenhetsnivå ärver därmed RIM 3-blindheten (se §Kända buggar i insiktskedjan). Den nyare `Antal genomförda event` (`flddy8JND3YnlgZxe`) summerar däremot RIM 1 × + RIM 2 × + RIM 3 × + Fjärrskådning × (inkl. RIM 3).

**6. Personer.Erfarenhetsbadge**
Översätter teknisk nivå till human-readable badge:

| Erfarenhetsnivå | Badge |
|---|---|
| Ej påbörjat | Ej påbörjat |
| Fjärrskådning | Fjärrskådare |
| RIM steg 1 | Resenär steg 1 |
| RIM steg 1 – upprepat | Resenär steg 1 (upprepat) |
| Genomfört RIM steg 1–2 | Resenär steg 1–2 |
| Genomfört RIM steg 1–2 (upprepat) | Resenär steg 1–2 (upprepat) |
| Avvikelse: RIM 2 utan RIM 1 | Avvikelse |

### ⚠️ Kända buggar i insiktskedjan

**Dead branches i Erfarenhetsbadge.** SWITCH-formeln mappar också:

- `"Genomfört alla"` → `"Miranon Media stjärna"`
- `"Genomfört alla (upprepat)"` → `"Hängiven utforskare"`

Men `Erfarenhetsnivå`-formeln returnerar aldrig de värdena. Grenarna är döda. För att aktivera dem behöver Erfarenhetsnivå utökas med en nivå för "alla tre kurstyper genomförda" (RIM 1 + RIM 2 + Fjärrskådning).

**RIM 3-tillägget 2026-04-26 påverkar inte Erfarenhetsnivå-formeln.** Erfarenhetsnivå klassificerar fortfarande bara baserat på RIM 1 × och RIM 2 × — RIM 3 ingår ännu inte i klassificeringen. Konsekvens: en person som gått RIM 1, RIM 2 och RIM 3 visas som "Genomfört RIM steg 1–2" (RIM 3 syns bara i räknaren). [HYPOTES — EJ VERIFIERAD]: framtida revision av Erfarenhetsnivå-formeln skulle kunna lägga till en "Genomfört RIM steg 1–3"-nivå som mappar till en distinkt badge.

---

## Anmälningskedjan — parallellt flöde

Detta är det snabbare flödet som inte kräver närvaro. Det är det vi kan exportera idag.

```text
Anmälan skapas
       │
       ▼
A1 sätter Event-länk (via EventKey/Expresslabel-match)
       │
       ▼
A2 sätter Person-länk (söker via normaliserad e-post, skapar om ny)
       │
       ├─────────────────────────┬────────────────────────┐
       ▼                         ▼                        ▼
Anmälningar.             Anmälningar.             Anmälningar.
Är aktiv (1/0)           "Vill anmäla sig till"   Typ
(formula)                (multipleSelects)         (singleSelect)
       │                         │                        │
       │ SUM                     │ (rollup till Personer) │ (rollup till Personer)
       ▼                         ▼                        ▼
Personer.                Personer.                 Personer.
Antal anmälningar        Antal tidigare            Anmäld till antal
(aktiva)                 genomförda utbildningar   kommande utbildningar
       │                         │                        │
       │                         └─────────┬──────────────┘
       │                                   ▼
       │                         Personer.Återkommande?
       │                         IF(tidigare>0 AND kommande>0, "Ja", "Nej")
       │
       │                         Personer.Har en aktiv anmälan?
       └────────────────────────▶ IF(kommande utb. + kommande förel. > 0,
                                     "Aktiv", "Ingen aktiv anmälan")
```

### A2:s decision — 4 grenar

A2 söker Person via två separata FIND_RECORDS, sedan väljs gren baserat på resultaten:

| Gren | Villkor | Action | Sätter Anmälan.Person? |
|---|---|---|---|
| 1 | length(STEG_2) = 1 (en namnlös Person finns med matchande e-post) | UPDATE Personer (uppdatera namn på namnlös Person från Anmälans Förnamn/Efternamn) | **Nej** |
| 2 | length(STEG_1) = 1 (en namngiven Person finns med matchande e-post) | UPDATE Anmälningar (sätt Person-länk till befintlig Person) | **Ja** |
| 3 | length(STEG_1) > 1 (flera Person-records matchar — dubblett) | CREATE Error-log (logga dubblett-fall) | Nej |
| 4 | default (ingen träff) | CREATE Personer (ny Person) → UPDATE Anmälningar (sätt Person-länk till nya Person) | **Ja** |

Källa: `01-extraction.md` §B.A2 (10 actions explicit listade) + `miranon_automations_COMPLETE.json` workflow_id `wflRPMp5QNGEa7wH1` decision-noden `wdezdzNWaL1MYcrkE`.

**[BEKRÄFTAD 2026-07-08 — Session 60]:** Om en namnlös Person finns för trigger-mailen matchar Gren 1 och Gren 2 hoppas över → Anmälan-Person-länken förblir tom, bara Personens namn uppdateras. **Live-belagt** via Jasmin Haghighi (namnlös lead `recdea3cmbLQ3kTE8` → anmälan `recvl22JvgJVyd6TQ` okopplad, 0 Deltaganden tills manuell Person-PATCH; se §Kända fällor 21). Tidigare [HYPOTES — EJ VERIFIERAD]; konsekvenser i reverse-flow dokumenterade i §Kända fällor 21–22 och §Reverse-flow-scenarier / F.1.

**Verifieringsplan:** skapa testanmälan med email-adress som matchar en känd namnlös Person (t.ex. en lead-Person utan Förnamn/Efternamn skapad av A4). Kör automation. Kontrollera Anmälan.Person efter A2 — om tom = hypotesen bekräftad. Marcus markerade explicit i `psionautics/tasks/lessons.md` (Psionautics-specifikt-sektionen) att hypotesen aldrig verifierats.

### ⚠️ `Återkommande?` — missvisande namn

Formeln är:

```text
IF(tidigare genomförda utbildningar > 0 AND kommande utbildningar > 0, "Ja", "Nej")
```

**Detta mäter INTE "har personen gått kurs tidigare".** Det mäter **"är personen en aktiv återkommande kund som bokat om"**. En person som gått RIM 1 2024 men inte har någon kommande bokning → `Återkommande? = Nej`.

För en "Ny/Återkommande"-badge i admin-tabellen som betyder "har gått kurs tidigare" räcker *inte* det här fältet. Man behöver antingen:

- `Antal tidigare genomförda utbildningar > 0` direkt, eller
- `Antal genomförda event > 0` (som dock kräver närvaro-backfill)

### ⚠️ Självrapporterade tidigare kurser

`Antal tidigare genomförda utbildningar` på Personer är en rollup från Anmälningar-fältet `Vill anmäla sig till` (fld6RC3r0R9tuKgdF). Det räknar alltså vad personen *själv angett i formuläret* — inte vad som är verifierat i Deltaganden. Stämmer ofta men inte alltid.

---

## Reverse-flow-scenarier

> Scenarier där data flödar "baklänges" från det förväntade huvudflödet — ofta källor till buggar eller hidden state. Viktigt att läsa tillsammans med §Anmälningskedjan och §Kända fällor.

### F.1 Backfill-flödet (kontra A2:s designflöde)

**Designflödet (lead först → anmälan sedan):**

1. Person hämtar erbjudande på miranon.se → A4 skapar Person (ofta namnlös, bara e-post)
2. Person anmäler sig senare till kurs → A2 hittar Person via e-post → Gren 1 (uppdatera namn) eller Gren 2 (länka)

**Backfill-flödet (anmälan först — ingen existerande Person):**

1. Backfill-script POSTar Anmälan med E-post men ingen Person-länk
2. A2 söker Person → ingen → **Gren 4** (skapa Person + länka Anmälan)

**Fälla:** A2:s grenordning är optimerad för designflödet. När en namnlös lead-Person redan finns för anmälningens e-post triggar **Gren 1** istället för Gren 4 → Personens namn uppdateras men Anmälan-Person-länken förblir tom → A3 triggas aldrig (kräver `Anmälan.Person` isNotEmpty) → inget Deltagande skapas → A11 kedjar aldrig.

**Åtgärd (etablerad i backfill-script 2026-04-19):** Scriptet PATCH:ar `Anmälan.Person`-länken manuellt direkt efter create. PATCH:et triggar A3 → A11 kedjar korrekt.

**Källa:** `psionautics/tasks/lessons.md` Psionautics-specifikt + `psionautics/tasks/sessions/retrospektiv-2026-04-19-backfill.md` + `01-extraction.md` §F.1.

### F.2 EventKey-format-bug i Huvudformulär (öppet)

**Scenario:** Användare anmäler sig via Huvudformulär på psionautics.se (eller miranon.se) → formuläret skickar `EventKey="11"` istället för `EventKey="Event-11"` → A1 misslyckas matcha mot `Eventplanering.EventKey` (som är formula `"Event-" & {Event-nr}`) → Anmälan landar utan Event-länk → A3 triggas aldrig (kräver Event isNotEmpty) → inget Deltagande skapas.

**Drabbade records 2026-04-01 till 2026-04-23:** Anmälningar #220, #221, #222, #237, #847.

**Sanering 2026-04-26:** Alla 5 PATCH:ade i åtgärdssessionen (manuell Person + Event + EventKey + spårbarhetstext på Notering). Källa: `psionautics-session-2026-04-26-atgardssession.md`.

**Källa-bug status — LOKALISERAD 2026-08-21 (Session 110, `T158`); webbplats-fixen ägs av Marcus/Roger.** Hypotesen ovan var fel på två punkter. (1) Buggen sitter INTE i formulärets templatekod utan i **Elfsight Event Calendar-widgeten** på miranon.se:s startsida (`8d8c059d-05b7-4f64-8468-ab24d7c9cc57`, publik konfiguration hämtad ur `core.service.elfsight.com`): varje kalenderposts anmälningsknapp bär en **handskriven** URL, och när en gammal post dupliceras följer URL-parametrarna med oredigerade. `"11"` och `"10"` utan prefix var juli- respektive oktober-Fjärrskådningspostens kopierade nycklar — inte en template-gren. (2) Felklassen är dubbel: utan prefix blir raden **orphan** (synlig i appen som "Utan event"); med prefix men fel nummer (`Event-10` på tre höst-RIM 1-poster) **matchar A1 tyst fel event** — osynligt överallt, eftersom varken A1, EF:erna eller appen jämför formulärets `Datum`/`Ort`-kopior mot det länkade eventet. Mätt över hela basen 2026-08-21 (304 Huvudformulär-anmälningar): 1 orphan + **64 felmatchade** (52 under det genomförda Event-10, 5 under Event-11, 3 under Event-55, 3 historiska under Event-7/9) — alla 52 i Event-10-klassen obekräftade sedan maj. **April-saneringen var själv fel:** de fem raderna (#220 #221 #222 #237 #847) länkades till Event-11 (föreläsning 19 mars, Inställt) men formulärtexten sa 25–26 juli 2026 — de hör till Event-60. Städningen (tre nya event Event-62/63/64, 61 omlänkningar, ~130 Deltaganden, A7-restlistor) och städplanen: sessionsdok S110. **Vakt saknas fortfarande** (A1 har ingen Error-log-gren vid 0 träffar och ingen korsfältsvalidering) — designen grillas, se `T158`. Elfsight-endpointen är oofficiell; en driftdetektor kräver research-pass.

**Källa:** `01-extraction.md` §F.2 + `verifiering-2026-04-24.md` errata Fynd 2 · sessionsdok S110 Del 1–2 (rotorsak + mätning) · `TASK-232`.

### F.3 Mail-flödet (frontend → Edge Function → Airtable + Resend)

**Designflödet:**

```text
[Admin UI] → POST /functions/v1/send-email { type, to, name, recordId }
            ↓
       send-email Edge Function
            ↓
       Resend.send(template) → user-inbox
            ↓ (vid Resend-success)
       patchByType(type, recordId, token) — dispatcher
            ↓
       patchAfterSend (Anmälningar)  ELLER  patchWaitlistAfterSend (Väntelista)
            ↓
       PATCH Airtable (Bekräftelse skickad / Betalningspåminnelse / Plus-one /
                       Deltagarinfo / Informationsmail 1)
```

**Fälla:** Mail kan skickas men PATCH misslyckas (t.ex. Airtable rate-limit, fält-permission, eller fel record-ID). Edge Function loggar `console.error('Post-send PATCH failed: ...')` och returnerar **ändå ok-status** till frontend → user fick mail men UI visar inte timestamp och tror att mail misslyckades.

**Diagnos:** Cloud → Edge Functions → klicka på `send-email` → Logs → leta efter `Post-send PATCH failed`-rader.

**Åtgärd:** Ej implementerad. Se §Kända fällor 29.

**Källa:** `psionautics/supabase/functions/send-email/index.ts` rad 17–94 (kommit `1a07d1b` 2026-04-27) + `01-extraction.md` §F.3.

### F.4 Väntelista → Anmälningar-flytt

**Scenario:** Lotta klickar "Lägg till som anmäld" på en Väntelista-rad i admin.

**Flöde:**

1. Frontend POSTar `create-registration` med `kalla="Väntelista"` + namn/email/telefon
2. `create-registration` skapar ny rad i Anmälningar (Källa-fältet sätts explicit)
3. Frontend PATCH:ar Väntelista-raden: `Flyttad till anmälan = true`
4. Anmälan dyker upp i Anmälningar-tabellen, väntelistraden filtreras bort av `get-waitlist` (filter: `NOT({Flyttad till anmälan})`)

**Fälla:** Om steg 2 lyckas men steg 3 misslyckas (t.ex. nätverksfel mellan POST och PATCH) blir det **dubblett** — personen finns både på väntelistan (visad eftersom Flyttad-checkbox inte är satt) och i Anmälningar-tabellen.

**Felhantering oklar.** [HYPOTES — EJ VERIFIERAD]: Det finns ingen transaction-wrapper mellan steg 2 och 3 — om steg 3 failar idag rensar inget upp eller flaggar för manuell handling. Verifieringsplan: granska `psionautics/src/pages/Admin.tsx` "Lägg till som anmäld"-handlern för felhantering. Se §Kända fällor 30.

**Källa:** `01-extraction.md` §F.4 + `create-registration/index.ts` (kallas med `kalla="Väntelista"`) + `psionautics-session-2026-04-15.md` §Väntelisteflöde.

---

## Automationssekvenser

A1–A11 är grupperade i **3 kategorier** i Airtable Automations-UI:t (verifierat via screenshot 2026-04-28). Vi följer samma struktur här för att matcha Marcus' mentala modell — det är så automationerna är organiserade i Airtable-vyn där de underhålls.

| Grupp | Automationer | Roll |
|---|---|---|
| **Grupp 1: När någon anmäler sig till event** | A1, A2, A3 | Kärnflödet vid ny anmälan |
| **Grupp 2: Annat engagemang** | A4, A5 | Lead-magnet-flödet |
| **Grupp 3: Övervakning** | A6, A7, A8, A9, A10, A11 | Triggers på sidoeffekter och status-ändringar |

Alla 11 är `deployed` per JSON-export 2026-03-16 och verifierat empiriskt levande genom nya Anmälningar 2026-04-27 (A1+A2+A3 körde inom 22 sekunder).

### Grupp 1: När någon anmäler sig till event (A1, A2, A3)

#### Sekvens — Ny anmälan (A1 → A2 → A3 → A11)

A11 ligger i Grupp 3 (Övervakning) i UI:t men kedjas naturligt på A3:s Deltaganden-creates och måste därför nämnas här.

```text
Anmälan skapas
      │
      ▼
A1: Matcha event
      → Sätter Anmälningar.Event via EventKey eller Expresslabel
      │
      ▼ (parallellt)
A2: Koppla/skapa person
      → Matchar Person via e-post (eller skapar ny)
      → Sätter Anmälningar.Person (via Gren 2 eller Gren 4 — se §A2:s decision)
      → Skapar Touchpoint
      │
      ▼
A3: Förskapa deltaganden (villkor: Person + Event + tom Deltaganden)
      → Läser Event.Sessionsmall (lookup via Eventtyp → Eventformat.Format)
      → Skapar en Deltaganden-rad per session (ex: ["Dag 1", "Dag 2"])
      → Alla med Status = "Ej avstämt"
      │
      ▼
A11 (kedjas — Övervakning-gruppen): Koppla Deltagande till Person
      → Kopierar Anmälan.Person-länk till Deltaganden.Person (länk)
```

Efter sekvensen:

- Anmälan är kopplad till event och person
- Deltaganden-rader finns (en per sessionsdag), men närvaro är inte markerad
- Personer-rollups uppdateras: Anmälningar-baserade fylls i direkt, Deltaganden-baserade förblir noll tills A9/A10 körs

**A2:s 4 grenar** är dokumenterade i §Anmälningskedjan / A2:s decision — 4 grenar.

### Grupp 2: Annat engagemang (A4, A5)

#### Sekvens — Lead-magnet (A4 → A5)

```text
Rad skapas i Hämtade erbjudanden
      │
      ▼
A4: Koppla lead till person
      → Matchar erbjudande via Source key
      → Matchar/skapar Person via e-post
      → Sätter länkar, skapar Touchpoint ("Angett e-post för erbjudande")
      │
      ▼ (vid uppdatering — A5 triggar på record_updated på Hämtade erbjudanden)
A5: Skapa/uppdatera engagemang
      → Yttre IF: säkerställ Person + Erbjudande är satta
      → Inre IF: om Engagemang finns → uppdatera Senaste hämtning
                 annars → skapa nytt Engagemang
```

A4 trigger: `RECORD_CREATED` på `tblqFpgxEhJ95AEcM` (Hämtade erbjudanden). 10 actions inkl. DECISION (mönster likt A2). A5 trigger: `RECORD_UPDATED` på samma tabell — sannolikt när A4 sätter Person-länken.

### Grupp 3: Övervakning (A6, A7, A8, A9, A10, A11)

#### A6 — Event fullbokat

**Trigger:** `RECORD_MATCHES` på `tblVE3UKWl1CKrphV` (Eventplanering) med villkor `fldqkyeE7cVHMNRpH = 1` — dvs. **`Anmäld beläggning (%) = 100%`** (1 = 100% när Airtable lagrar percentage som decimal). **Verifierat från JSON-export** 2026-04-28 (workflow_id `wfl0filPx4wyAcaQ8`, trigger `wtrRbX1Bjn2gRPTMc`).

**Action:** 1 × `watBETUHIcuho4hit` (SEND_EMAIL Airtable native — fält: to, cc, bcc, subject, message, fromName, replyTo, attachments, inReplyTo).

**Effekt:** Skickar fullbokat-notis till Roger/Lotta när ett event når 100% beläggning.

#### A7 — Synka ej mottagna slutbetalningar per event

**Trigger:** `RECORD_UPDATED` på `tbloOcrppVoyrHbrq` (Anmälningar). **OBS:** triggas vid VARJE uppdatering, inte bara betalningsändring. Kostsamt vid massuppdateringar.

**Actions:** 2 (UPDATE-kedja). Tabeller berörda: Anmälningar, Eventplanering. Synkar `Ej betalda (records)` på eventraden.

#### A8 — Tidstämpel vid närvarostatus-ändring

**Trigger:** `RECORD_UPDATED` på `tbldWHH6sSHWoQPHH` (Deltaganden). Sannolikt på Status-fält-ändring.

**Action:** 1 × `watUPDATERECORD00` — sätter `Avstämt = NOW()`.

**Verifierad latens:** **<60 sekunder** efter PATCH (verifierat i `psionautics-session-2026-04-26-fortsattning.md` §Punkt 4-rättning där 8 records PATCH:ades och A8:s Avstämt-timestamp dök upp inom en minut).

#### A9 — Markera närvaro (vald session)

**Trigger:** `RECORD_MATCHES` på `tblVE3UKWl1CKrphV`. Trigger-villkor: checkbox `Markera alla närvarande` (`fldN20OexhRJQr9XY`) sätts till `true`.

**Action:** 1 × `watCUSTOMSCRIPT00`.

**Script-roll:** Iterera Deltaganden för Eventet där `Session` matchar `Check-in session` (`fldjX1YN7DOhoKvt1`) → sätt `Status = Närvarostatus att sätta` (`flddzMrhu30cXoaEf`, default "Närvarande"). Reseta sedan checkboxen.

#### A10 — Markera närvaro (alla sessioner)

**Trigger:** `RECORD_MATCHES` på `tblVE3UKWl1CKrphV`. Trigger-villkor: checkbox `Markera alla närvarande (alla sessioner)` (`fldF5atXm9lV2nAeq`) sätts till `true`.

**Action:** 1 × `watCUSTOMSCRIPT00`. Som A9 men över alla sessioner i Eventet (läser Sessionsmall eller fallback unika Session-värden i Deltaganden).

#### A11 — Koppla deltagande till person

**Trigger:** `RECORD_MATCHES` på `tbldWHH6sSHWoQPHH` (Deltaganden). Trigger-villkor: sannolikt Person-länk-rollup tom.

**Action:** 1 × `watCUSTOMSCRIPT00`.

**Roll:** Sätter Person-länk på nya Deltaganden — kopierar från `Anmälan.Person`. Kedjas på A3:s creates men listas under Övervakning i UI:t eftersom det är en sidoeffekt.

#### Sekvens — Närvaromarkering (A9/A10 → A8)

A9 och A10 triggar i sin tur A8 via Status-uppdateringen på Deltaganden:

```text
Eventplanering."Markera alla närvarande [...]" = TRUE
      │
      ▼
A9 (vald session) ELLER A10 (alla sessioner)
      → Uppdaterar Status + Avstämt på matchande Deltaganden
      → Resettar checkboxen
      │
      ▼ (Status-ändring triggar A8)
A8: Tidstämpel
      → Sätter Avstämt = NOW()
```

När A9/A10 kört färdigt fylls alla Deltaganden-baserade rollups på Personer i automatiskt (via Airtables formelmotor — se §Insiktskedjan).

---

## Edge Functions

> **Flyttad yta.** App↔Airtable-interaktionen (Edge Functions: vilka fält varje
> funktion läser/skriver, mappningar, hårdkodade värden, länkfält-filter-mönster)
> dokumenteras i ett dedikerat interaktions-dok:
> [`docs/reference/airtable-interaction.md`](airtable-interaction.md) (T19).
>
> Denna sektion beskrev tidigare Psionautics-repots Edge Functions (pre-Fas-6, april-
> commits) och har tagits bort 2026-06-21 (Session 27, T16) för att inte stå kvar som
> en stale duplikat i fel dokument. data-model.md äger schema + datakvalitet;
> interaktions-doket äger interaktions-kontraktet.

---

## Mail-flöden (Resend)

Mail går via Resend API från Edge Function `send-email`. 5 mallar per 2026-04-28.

### Mall-katalog

| Mall-alias | Variabler | Mail-typ (`type`) | Skapad / senaste ändring |
|---|---|---|---|
| `medveten-kontakt-bekraftelse` | `{{{name}}}` | `confirmation` | tidigare 2026 |
| `medveten-kontakt-betalning` | `{{{name}}}` | `payment` | tidigare 2026 |
| `medveten-kontakt-plus-one` | `{{{name}}}` | `plus_one` | tidigare 2026 |
| `medveten-kontakt-deltagarinformation` | `{{{name}}}`, `{{{pdfUrl}}}` | `participant-info` | 2026-04-16 |
| `medveten-kontakt-vantelista-info-1` | `{{{name}}}` | `waitlist-info-1` | 2026-04-27 |

### Avsändare och konfiguration

| Setting | Värde |
|---|---|
| Avsändare | `Psionautics <noreply@h5gruppen.se>` |
| Reply-to | `lotta@outsidereality.se` |
| DKIM | Signerad av h5gruppen.se (Gmail godkänner — ingen "via"-varning) |
| Pending domain-setup | `outsidereality.se` eller `psionautics.se` i Resend (kvarstår — backlog) |

### Skarpa skick — historik

| Datum | Mall | Antal mottagare | Anteckning | Källa |
|---|---|--:|---|---|
| 2026-04-16 09:48 | `medveten-kontakt-deltagarinformation` | 74 | Lotta körde själv i admin. 75 incheckning-aktiva minus 1 (Ulrika Arvas — saknar e-post). Bulk-utskick. | `psionautics-session-2026-04-16.md` |
| 2026-04-27 (skickas av Lotta efter sessionen) | `medveten-kontakt-vantelista-info-1` | 41 | Hela aktiva väntelistan. Första utskicket via nya `waitlist-info-1`-flödet. | `psionautics-session-2026-04-27.md` |

### Återkommande Resend-fällor

1. **Variabel-case-känslighet.** `{{{name}}}` ≠ `{{{Name}}}`. Lessons från **2026-04-16** dokumenterade redan denna fälla, men den dök upp igen 2026-04-27 vid ny mall-skapande. **Regel:** verifiera mall-variabler i Resend UI direkt efter skapande, INNAN frontend-test. Klistra in mall-aliaset + alla variabel-namn i sessionsdokumentet innan UI-testet körs.

2. **Markdown-länkar URL-encodas av Resend.** `[text]({{{pdfUrl}}})` → href blir bokstavligen `%7B%7B%7BpdfUrl%7D%7D%7D`. Resend renderar markdown FÖRE variabel-interpolering. **Lösning:** använd rich-text-editorns länk-funktion eller raw HTML `<a href="{{{pdfUrl}}}">`. Gäller alla mail-service-editors som renderar markdown före variabel-interpolering.

3. **Supabase Storage bucket-permissions.** PDF:er hostas i bucket `event-documents`. Buckets skapas som **private** by default. För att Resend-länkar ska fungera krävs SQL-migration: `UPDATE storage.buckets SET public = true WHERE id = 'event-documents'`. Lovable kan inte sätta detta via UI — kräver SQL-migration via Lovables Cloud-flik.

### Mail-prickar i admin-tabell

Admin visar prickar på Anmälningar-rader baserat på vilka mail som skickats. Kronologisk färgordning:

| Färg | Hex | Indikerar | Datakälla |
|---|---|---|---|
| Grön | `#4ADE80` | Bekräftelse skickad | `Bekräftelse skickad` (fld0jnbkIbuFAumgG) |
| Amber | `#F59E0B` | Betalningspåminnelse skickad | `Betalningspåminnelse skickad` (fldE0cR4r9vI0rKiL) |
| Blå | `#3B82F6` | Deltagarinfo skickad | `Deltagarinfo skickad` (fld3WBS0QQrqLpYtK) |
| Teal | `#2DD4BF` | Plus-one förfrågan skickad | `Plus-one förfrågan skickad` (fld9BkFY8K5pF0xJ2) |
| Lila | – | Informationsmail 1 skickad (Väntelista-tabell) | `Informationsmail 1 skickad` (fldsUxLmHR0NQDiwH) |

**Notera:** Betalningspåminnelse-pricken **ändrades från blå → amber** 2026-04-16 för att frigöra blå till deltagarinformation. Källa: `psionautics-session-2026-04-16.md` §A6 + §B "Prick-ordning fel".

Lila-pricken existerar bara på Väntelista-tabellen i admin (inte på Anmälningar-tabellen) — det är en egen mail-typ som rör väntelistan, inte anmälda.

---

## Kända fällor

Detta är saker som har bitit oss eller sannolikt kommer att bita oss.

> **Denna sektion är inte enbart en varnings-lista — den är KRAVSPECEN för Airtable-bas-maximeringen**
> (post-Fas-6-milstolpe, [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)).
> Varje post är en kandidat som ska LÖSAS UT när basen maxas till 11/10 / branschledarmässig (mall för
> Passionslyftet) — inte ett permanent tillstånd att gå runt. App-sidan läser källan-av-sanning där en
> projektion är lossy ([ADR-062](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md)
> Beslut 2) som leverans NU; resolution av posten sker I BASEN vid maximeringen.

<!-- markdownlint-disable-next-line MD028 -->

> För **strukturella** Airtable-begränsningar (plattform — migreras bort med Postgres i Fas E), se
> [`airtable-constraints.md`](./airtable-constraints.md). Denna sektion = **data-instans**-fällor i
> denna bas (löses ut vid bas-maximeringen — se kravspec-ramen ovan, ej "städas bort som biprodukt").
> Vissa poster har en rot där och en instans här — korsrefererade explicit.

1. **Anmälan ≠ Deltagande.** Att någon är anmäld betyder inte att de har gått kursen. Kurshistorik-rollups är nollade tills `Deltaganden.Status = "Närvarande"` har satts via A9/A10.

2. **Formula-fält går inte att skriva till.** `Namn`, `Normaliserad e-post`, `Erfarenhetsnivå` med flera är computed. Skriv till källfälten (Förnamn, Efternamn, E-post osv) istället.

3. **Spegelfält skapar inga relationer.** `Eventplanering.Anmälningar (länkat fält)` är read-only — det speglar länkar som skapats från Anmälningar-sidan. Skriv alltid från "ägar-sidan".

4. **Psionautics-event räknas inte in i RIM/FS-rollupsen.** Rollup-formlerna filtrerar på `Kursnamn = "Resor i medvetandet 1" | "Resor i medvetandet 2" | "Fjärrskådning"`. Psionautics-eventet heter "Psionautics" → ingen träff. Avsiktligt. **Konsekvens för segment:** Psionautics-deltagande surfar därför inte per person — se fälla 33 (Lucka C) + maximerings-kandidat T16.

5. **`Återkommande?` är missvisande.** Se avsnittet *Anmälningskedjan*.

6. **Dead branches i Erfarenhetsbadge.** Se avsnittet *Insiktskedjan*.

7. **Självrapporterade tidigare kurser.** `Antal tidigare genomförda utbildningar` räknar från formuläret, inte Deltaganden.

8. **Fjärrskådning är en fallback i Erfarenhetsnivå, inte en egen gren.** Formelns sista IF-gren returnerar `"Fjärrskådning"` bara om RIM 1 × = 0 AND RIM 2 × = 0 — dvs. personen har inga RIM-kurser alls. Om någon gått både RIM 1 och Fjärrskådning visas deras Erfarenhetsnivå som `"RIM steg 1"` och fjärrskådningen syns endast i `Fjärrskådning ×`-räknaren, inte i Erfarenhetsnivå eller Erfarenhetsbadge. Detta förklarar också de döda SWITCH-grenarna (`Genomfört alla`).

9. **A1 överskriver Event-fältet.** A1 triggas vid `Record created` men matchar varje gång — om en Edge Function skapat Event-länken direkt kan A1 nollställa den. Lösning (etablerad i `create-registration`): sätt EventKey OCH Event direkt. A1 matchar samma värde = idempotent.

10. **A7 triggas vid varje uppdatering av Anmälningar.** Inte bara betalningsförändringar. Kostsamt vid massuppdateringar.

11. **Manuella Deltaganden-poster länkas inte automatiskt.** Rader skapade direkt i Airtable (inte via A3) får ingen Event-länk om Sessionsmall inte är satt.

12. **A3 skapar inget om Sessionsmall är tom.** Det är då ingen närvaro kan markeras på eventet.

13. **Sessionsmall bor på Eventformat, inte Eventplanering.** `Eventplanering.Sessionsmall` (`fldFSQSopc87UBXpT`) är en lookup via `Eventtyp` → `Eventformat.Format`. För att ändra sessionsstrukturen för en eventtyp: gå till Eventformat-tabellen, inte till enskilda eventrader.

14. **Väntelistan flyttas inte — den kopieras.** En "flytt" från väntelista till Anmälningar skapar ny Anmälnings-rad + sätter checkboxen `Flyttad till anmälan` på väntelisteposten. Gamla raden ligger kvar som historik.

15. **Källa-fältet har ingen "Arrangör"-option.** Frontend-filter som `b.kalla !== "Arrangör"` är dead code.

16. **Manuella rader i Anmälningar kopplas inte automatiskt till eventet via formulärmatchning.** Skapad direkt i Airtable utan EventKey → A1 matchar inte → Event förblir tom → A3 triggas aldrig.

17. **Airtable formula-fält har beräkningsfördröjning.** Just-skapade rader (av automation) kan returnera tomt eller fel värde från formel-fält i upp till 30s innan Airtable hunnit beräkna klart. Läs ALDRIG formel-värden omedelbart efter automation-triggad create. Använd poll-med-timeout eller läs länkfältet direkt istället.

18. **Lookup-fält har egen uppdateringskedja, snabbare än formel-fält.** Vid programmatisk matchning på länkad data: föredra lookup framför formula.

19. **A1–A11 är async och rapporterar "Ran successfully" även när delresultat saknas.** Run-history bekräftar att trigger kördes, inte att alla action-steg slutförde sidoeffekter. Verifiera sidoeffekter direkt (t.ex. länkfält på mål-recordet), inte run-status.

20. **Airtable Restore skapar KOPIA, ersätter inte in-place.** Den ursprungliga basen är oförändrad. Rollback av delvis skrivning kräver manuell radering i original-basen.

21. **Namnlösa Personer är leads, inte skräp.** Rader i Lead-tabellen (från miranon.se) innehåller ofta endast e-post. När leads senare anmäler sig till kurs (där namn krävs), triggar A2 Gren 1 som uppdaterar Personen med namn från Anmälan. Detta är FEATURE, inte bug. Systemet är designat för lead först, anmälan sedan.

    Men: Gren 1 uppdaterar Personens namn men kopplar INTE Anmälan till Personen. Det är Gren 2 som gör det. I normalt flöde (lead först) spelar det ingen roll — framtida anmälningar från samma e-post matchar Gren 2 sedan Personen fått namn.

    I reverse-flöden (backfill av historisk anmälan på lead-Person): Gren 1 körs, namnet uppdateras, men Anmälan hänger lös utan Person-länk. Konsekvens: A3 triggas aldrig (kräver Anmälan.Person isNotEmpty) → inget Deltagande skapas → A11 kedjar aldrig. Scriptet måste kompensera genom att PATCH:a Person-länken manuellt efter create. Patch:et triggar A3 → A11 kedjar korrekt.

    **Live-stickprov 2026-04-28:** 2 namnlösa Personer (`receoF3BY3ZCMEJ0U` <tonetider@protonmail.com>, `rec0uNum3YVL1tb1L` <miranon.prominent654@passmail.net>) skapade 2026-04-26 21:47–48 av A4 från lead-process. Båda har formel-värdet "Ej tillgängligt" på Namn-fältet eftersom Förnamn+Efternamn är tomma. Bekräftar att leads fortsätter strömma in i normalt tillstånd.

    **Live-BEKRÄFTELSE av reverse-flow-buggen 2026-07-08 (Session 60):** Jasmin Haghighi (namnlös lead `recdea3cmbLQ3kTE8`) fick vid en historisk kursanmälan sitt namn ifyllt av A2 Gren 1, men Anmälan `recvl22JvgJVyd6TQ` förblev okopplad (0 Deltaganden) — exakt hypotesens utfall. Kompenserat: `Anmälan.Person` PATCH:ad → A3 triggade → 2 Deltaganden skapade. **Detta uppgraderar §A2-decision-hypotesen (nedan) från [HYPOTES] till bekräftad i det skarpa flödet** (tidigare endast härlett från backfill-script-scenariot).

22. **Namnlösa Personer är ett normalt tillstånd, inte ett fel.** Rader i Lead-tabellen (se Scenario 5 i hur-systemet-funkar.md) skapas ofta med endast e-post från miranon.se. A4 skapar då Person med Förnamn/Efternamn tomma. Personen förblir namnlös tills hen anmäler sig till en kurs, då A2 Gren 1 fyller i namnet från Anmälan.

    Operationella regler:
    - Radera ALDRIG namnlösa Personer — de är leads med potentiellt värdefull historik (Touchpoints, Hämtade erbjudanden).
    - Sätt ALDRIG placeholder-värden ("Okänd" etc) på Förnamn — det bryter A2 Gren 1:s `isEmpty(Förnamn)`-villkor och förhindrar automatisk namnkomplettering vid framtida kursanmälan.
    - Reverse-flöden (t.ex. backfill av historisk kursanmälan på en nuvarande lead) måste kompensera genom att scriptet manuellt PATCH:ar Anmälan.Person-länken, eftersom A2 Gren 1 uppdaterar Personens namn men kopplar inte Anmälan till Personen.

    **Live-stickprov 2026-04-28:** se fälla 21 ovan — 2 nya namnlösa Personer skapade 26-april bekräftar att lead-flödet är aktivt och fortsätter generera namnlösa records som förväntat.

23. **`RECORD_ID()`-formler i Deltaganden returnerar FEL record-ID.** Två fält ser ut att returnera länkat record's ID men gör det inte:

    | Fält-ID | Namn | Formel | Faktiskt beteende |
    |---|---|---|---|
    | `fldkTS2S8IDTsHibj` | "Anmälan (ID)" | `RECORD_ID({Anmälan})` | Returnerar **Deltagandets eget record-ID**, inte Anmälans |
    | `fld1PV4JDU0xkFrQ2` | "Event (ID)" | `RECORD_ID({Event})` | Returnerar **Deltagandets eget record-ID**, inte Eventets |

    **Orsak:** Airtables `RECORD_ID()` accepterar inga argument enligt formula-specen — den returnerar alltid current record's ID. Argumenten `{Anmälan}` och `{Event}` ignoreras tyst (formeln rapporteras ändå som `isValid: true`).

    **Verifiering 2026-04-28:** För Deltagande #1683 (rec0gBwp1ItzlgBtH): faktisk Anmälan-länk = recFaXedi3YB14m0F, faktisk Event-länk = rec6YyJSnP5V8IEaV, men båda formelfälten returnerar rec0gBwp1ItzlgBtH (Deltagandets ID). Verifierat via direkt MCP-jämförelse av länkfält vs formelfält.

    **Påverkan:** Konsumenter som läser dessa fält som "ID för länkat Anmälan/Event" får fel data. Andra konsumenter (Eventkey-formler) använder rätt mekanism (`fldGC2MziEfqIPeZP Eventkey (lookup)`). **Konkret konsument:** `Närvaro (nyckel)` (`fldra8QclmAyG4dKU`, formel `Anmälan-ID | Event-ID | Session`) bygger på dessa fält → nyckeln innehåller radens EGNA ID upprepat, inte Anmälan|Event-ID som namnet antyder. (Verifierat MCP 2026-06-21.)

    **Åtgärd-rekommendation:** Antingen ta bort fälten eller ersätt formlerna med `ARRAYJOIN(Anmälan-länk)` / `ARRAYJOIN(Event-länk)`. Inget akut, men flagga vid framtida revision.

24. **`Vill anmäla sig till` har case-dubletter.** Optionerna i `fld6RC3r0R9tuKgdF` (Anmälningar) inkluderar både:
    - "Resor i medvetandet 1" (`selaU0tDZplhTK3dC`) — kanonisk, lowercase "medvetandet"
    - "Resor i Medvetandet 1" (`selCYP1qT4eBptaoi`) — capitalised "Medvetandet"

    Samma för "2"-versionen (selqLalsJ0FkkXLoP vs selipzhJDcLRkNApB).

    **Påverkan:** Anmälningar kan landa under två olika options med "samma" innehåll. Drabbar segmentering, A1-matchning på Vill anmäla sig till, statistik, rapporter.

    **[HYPOTES — EJ VERIFIERAD]:** Sannolikt orsakad av att HTML-formuläret skickar in olika kapitalisering i olika grenar/versioner. Behöver granskas i formulärets options-lista.

    **Åtgärd-rekommendation:** Konsolidera till en option per kursnamn i Airtable (radera dubletter, byt till kanonisk). Verifiera att inga records pekar på dubblett-options före radering.

25. **Tomma singleSelects: `Manuella flagga` (Personer) + `Systemkälla` (Touchpoints) har choices=[].** Båda fält är singleSelect-typ men har inga options definierade. UI låter användaren välja från tom lista → fältet kan inte sättas.

    **`Manuella flagga`-halvan är LÖST 2026-08-10 (S103) — men genom AVLÖSNING, inte reparation.** Live-ombekräftad samma dag (`get_table_schema` mot prod `app8uGPrVCVOm6LfD`: `{"type":"singleSelect","config":{"choices":[]}}`), och **noll poster i prod OCH staging bar ett värde** — vilket följer av att fältet aldrig kunnat sättas. Marcus beslut: flaggan ska vara FRITEXT som Lotta skriver själv, inte ett val ur en lista. Ett nytt `Flagga`-fält (singleLineText) skapades därför i båda baserna, och `Manuella flagga` lämnades **kvar och tomt**. Två skäl till att det inte bara konverterades: (a) Airtables Meta-API kan ändra ett fälts `name`/`description` men **INTE dess `type`** — en konvertering hade krävt handgrepp i Airtable-UI:t, och (b) API:t stöder inte heller fältradering, så det gamla fältet kan bara tas bort manuellt. **Kvarstår som städ-post:** `Manuella flagga` bör strykas i UI:t när ingen kod läser det längre (`get-person`/`get-persons`/`get-leads` läser det fortfarande som `manuellFlagga`). `Systemkälla`-halvan är ORÖRD och kvarstår öppen.

    **Sannolik orsak:** Antingen designade men ingen option lagts till än, eller alla options togs bort utan att fältet ströks.

    **Åtgärd-rekommendation:** Antingen lägg till options eller ta bort fältet helt. I dag är det dead structure.

26. **`Hämtade erbjudanden.Källa (formulärkälla)` använder SHA256-hashar som option-namn.** `fldF9SgJS1Zv5kmtr` har två optioner med 64-tecken hash-strängar som namn:
    - `ae9a4975a6f8e77121ae6b8973e1e31411f49d45293638001a448de424a54d10`
    - `58947ba345f0013563663ba7916d05637403bcced327adb91dd81cd9c69fea9a`

    **[HYPOTES — EJ VERIFIERAD]:** Sannolikt webhook-källkoder eller formulär-IDs som av misstag förvandlats till option-värden. Möjligen från Zapier eller Make.com-integration som skickar käll-hash istället för läsbart namn.

    **Påverkan:** Skarpt rapporterad data är obegriplig — "Källa: ae9a4975..." säger inget för Lotta. Kräver mappningstabell hash → läsbart namn (Meditationen Kraftfältet vs Pyramidernas Vajrar).

    **Åtgärd-rekommendation:** (1) Lokalisera webhook-konfigurationen som triggar A4 (sannolikt Zapier-zap eller Make.com-scenarie), (2) byt option-namnen till läsbara, (3) backfilla befintliga records om relevant. Se §Luckor 11.

27. **`Är aktiv (1/0)` exkluderar inte "Inställt".** Formel `IF({Status}="Avbokad/Ombokad", 0, 1)` exkluderar bara Avbokad/Ombokad. **Inställt räknas som aktiv (=1).**

    **Konsekvens 2026-04-28:** Mia Hasselgren (#2) och Daniel Finnhult (#28) — båda Inställt-Status sedan 2026-04-26 — räknas som aktiva i `Personer.Antal anmälningar (aktiva)` rollup. Personer-rollups visar dem som "Aktiv" trots inställt event.

    **Åtgärd-rekommendation:** Uppdatera formeln till `IF(OR({Status}="Avbokad/Ombokad", {Status}="Inställt"), 0, 1)`. Inte gjord 2026-04-26 — sannolikt missad i samband med att Inställt-option lades till.

28. **Två parallella `Antal genomförda event`-formler.** På Personer finns både:
    - `flddymQaYJGVCInzq` ("Antal genomförda event (gammal)") — gammal **rollup** på Deltaganden.Genomfört event
    - `flddy8JND3YnlgZxe` ("Antal genomförda event") — ny **formula** sedan 2026-04-26: summan av RIM 1 × + RIM 2 × + RIM 3 × + Fjärrskådning ×

    Den gamla är **markerad för borttagning** (deadline 2026-05-03 passerad utan åtgärd; fältet finns kvar i basen — borttagning ej utförd; per backlog i `psionautics-session-2026-04-26-fortsattning.md`).

    **Risk:** Konsumenter (CSV-export, rapporter, admin-vyer) som fortfarande pekar på det gamla fält-IDt får data **utan RIM 3** (gamla formeln räknade bara via Genomfört event-rollup, som har Session-filter Dag 1 OR Föreläsning).

    **Åtgärd-rekommendation:** (1) Sök igenom alla konsumenter (`grep -r flddymQaYJGVCInzq`) och migrera till nya fältet, (2) radera gamla fältet efter MK. Verifiera ingen produktionskod pekar på gamla.

29. **Mail-PATCH-misslyckande är osynligt.** `send-email` Edge Function returnerar **ok-status även om `patchAfterSend` failar** — mail går iväg via Resend, men UI visar inte timestamp och tror att mail misslyckades. Felet loggas (`console.error('Post-send PATCH failed: ...')`) men nås bara via Cloud → Edge Functions → Logs.

    **Konsekvens:** Lotta kan skicka samma mail flera gånger i tron att första misslyckades. Mottagaren får dubbletter.

    **Åtgärd-rekommendation:** Returnera tydlig status från `send-email` som skiljer på "mail skickat + PATCH ok" vs "mail skickat + PATCH failed". Frontend ska visa varningston i andra fallet och föreslå manuell PATCH eller retry. Kort sikt: dokumentera i admin-manualen att Cloud Logs ska kollas vid oklarheter. Se §F.3.

30. **Väntelista→Anmälningar-flytt: dubblettsrisk.** Flytten från Väntelista → Anmälningar är inte transactional. Om steg 2 (POST `create-registration`) lyckas men steg 3 (PATCH `Flyttad till anmälan = true` på Väntelista-raden) misslyckas blir det dubblett — personen finns både på väntelistan (visad i admin) och i Anmälningar-tabellen.

    **[HYPOTES — EJ VERIFIERAD]:** Det finns ingen rollback eller retry idag. Verifieringsplan: granska `psionautics/src/pages/Admin.tsx` "Lägg till som anmäld"-handlern.

    **Åtgärd-rekommendation:** Antingen (a) flytta båda operationer till en transactional Edge Function `move-from-waitlist` som rollback:ar Anmälan-create om PATCH failar, eller (b) lägg till retry-logik på frontend med tydlig feedback om dubblett-risk. Se §F.4.

31. **LUCKA A — `Totala deltaganden` (`fldBP7xdEmpXDwUpz`) saknar RIM 3.** Formeln = `{RIM 1 ×} + {RIM 2 ×} + {Fjärrskådning ×}` — RIM 3 (`fld93OrTArvdkkYmk`) ingår INTE. Segment och vyer som filtrerar på `Totala deltaganden` (t.ex. "Tidigare deltagare", "Superdeltagare ≥ 2") är därför RIM 3-blinda. Den korrekta totalen är `Antal genomförda event` (`flddy8JND3YnlgZxe` = RIM 1 + RIM 2 + RIM 3 + FS — se fälla 28). `Erfarenhetsnivå (Miranon Media)` (`fldWSkxHJS2xWav4t`) bygger på `Totala deltaganden` + RIM 1/RIM 2 och ärver blindheten (jfr fälla 8:s döda RIM 3-/"Genomfört alla"-grenar). **Verifierat MCP 2026-06-25 (Session 33).** → **Maximerings-kandidat (T16):** konsolidera/deprecera den lossy totalen; låt segment läsa `Antal genomförda event` eller källan (Deltaganden) i stället.

32. **LUCKA B — `Fjärrskådning ×` (`fldlczklhguSg02H6`) blandar utbildning + föreläsning.** Räknaren rollar upp `Fjärrskådning eventkey` (`fldLLmr2QjcPNlBBm`), vars formel matchar `Kursnamn (lookup) = "Fjärrskådning"` AND `Närvaropoäng = 1` — `Session` refereras ALDRIG. FS-FÖRELÄSNINGAR har `Event (text) = "Fjärrskådning"` (Typ = Föreläsning) → räknas in som FS-kurs. RIM-axeln slipper detta av namn-slump: RIM-föreläsningar har `Event (text) = "Resor i medvetandet"` (utan siffra) som inte matchar "...1/2/3". **Konsekvens:** "har gått FS-KURS" (utbildning) kan INTE byggas på `Fjärrskådning ×` ensamt — utbildning och föreläsning är hopslagna i samma räknare. **Nytt fynd, verifierat MCP 2026-06-25 (Session 33).** → **Maximerings-kandidat (T16):** modalitets-distinkt FS-signal (skilj `Fjärrskådning-utbildning ×` från `Fjärrskådning-föreläsning ×`), alternativt läs (kurs × Typ) från källan.

33. **LUCKA C — föreläsnings-genomförande + Psionautics surfar INTE per person.** (a) Ingen per-person-räknare för GENOMFÖRDA föreläsningar finns; `Anmäld till antal kommande föreläsningar` (`fldZvHFuVGwerfJrF`) räknar KOMMANDE anmälningar (rollup av `Anmälningar.Typ`), inte historisk närvaro. (b) Ingen Psionautics-signal i Personer — Psionautics exkluderas avsiktligt ur RIM/FS-rollupsen (se fälla 4). Båda är härledbara ENDAST via join Deltaganden→Event (Session / Event typ resp. `Event (text) = "Psionautics"`). **Verifierat MCP 2026-06-25 (Session 33).** → **Maximerings-kandidat (T16):** per-person (kurs × modalitet)-signaler som täcker HELA taxonomin — inkl. föreläsning och Psionautics — inte bara RIM 1/2 + FS.

> **Luckor 31–33 — gemensam rot + segment-yta-relevans.** De tre är symptom på samma mönster: Personers förberäknade rollups projicerar en ren källa (Deltaganden, dimension (Event-namn × Typ) filtrerad på `Närvaropoäng = 1`) *lossy*. Maximerings-riktningen per [ADR-062](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) Beslut 2 är att läsa KÄLLAN i stället för projektionen — app-sidans segment-yta (Fas 6g) gör det och stänger Luckorna by construction. Posterna ovan är registrerade kandidater FÖR OM/NÄR Airtable-basen själv-maximeras (oberoende av app-sidans route-around — *route-around-but-register*, ADR-062:s maximerings-princip [förfinad — ADR-063]). Relaterat: Make-scenariot "Beräkna antal i segment" är trivialt (webhook → läs `Segment.Segmentformel` → kör som `filterByFormula` mot Personer → skriv tillbaka antalet; ingen logik i Make) → förenklings-/deprecierings-kandidat när appen beräknar medlemskap från källan. Spårat i tråd T16. **Förfinat (ADR-063):** registret = committad maximerings-KRAVSPEC, ej deferra-och-glöm; posterna LÖSES UT i basen vid post-Fas-6-maximeringen (resolution I BASEN, ej "designa-bort" i en efterträdare). Airtable-basen är en förstklassig leverabel, ej dödsdömd — ADR-062:s antagande att basen var ett ersättnings-mål var en Chat-felpremiss, korrigerad (ADR-062-erratum).

<!-- markdownlint-disable MD029 -->
34. **Oavstämda Föreläsnings-Deltaganden — modaliteten har aldrig avstämts.** Det finns 16 Deltaganden-rader i Föreläsning-modaliteten (`Event typ = "Föreläsning"`), spridda över 4 historiska event (98–140 dagar bakåt relativt 2026-06-25), men SAMTLIGA har `Status = "Ej avstämt"` → `Närvaropoäng = 0`. **Konsekvens för segment:** Föreläsnings-segment är TOMMA under strikt `Närvaropoäng=1` tills raderna avstäms — orsaken är inte att Föreläsning saknar deltagardata, utan att närvaron aldrig registrerats. **Verifierat MCP 2026-06-25 (Session 35).** → **Maximerings-kandidat (T16):** stäm av Föreläsnings-närvaron i basen — kravspec för post-Fas-6-bas-maximeringen ([ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)), ej app-fix. Böjs INTE in i segment-kontraktet (golvet lättas ej): [ADR-064](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md) beslut 4(a). RIM 3 + Psionautics noll-närvaro registreras INTE som defekt — ännu-ej-genomförda event är förväntat (ADR-064 beslut 2/3).

35. **Naket "Resor i medvetandet" (utan siffra) = distinkt kursnamn — namnkollisions-fälla.** Event-domänen (Eventplanering) har ett kursnamn "Resor i medvetandet" UTAN siffra (2 event, `Typ = Föreläsning`), distinkt från RIM 1/2/3-serien. **Konsekvens:** sammanblandningsrisk i `include[]/exclude[]`-design och i den svenska klartext-speglingen — kräver en tydlig klartext-etikett som skiljer det nakna namnet från RIM-serien. (Jfr fälla 32:s observation att RIM-axeln slipper Lucka B:s modalitets-blandning just av denna namn-slump.) **Verifierat MCP 2026-06-25 (Session 35).** → **Maximerings-kandidat (T16):** entydig kursnamns-etikettering i basen; [ADR-064](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md) beslut 4(b).

36. **`Månad/år` (`fld2BjFdBd964TzVb`) är ett MANUELLT singleSelect som duplicerar `Startdatum`-härledbar information.** Fältet bär ett valslag per månad (November 2025 … December 2026) och sätts för hand, trots att månad+år är entydigt härledbart ur `Startdatum` (`fldBYhXEHLCd1o2Je`) — samma datum som `Säsong`/`Datum (visas i länk)` redan beräknar via formel. **Konsekvens:** drift-risk — en create- eller update-väg som sätter `Startdatum` men glömmer (eller felsätter) `Månad/år` ger osamstämmig data. create-event ([ADR-066](../decisions/ADR-066-skapa-event-write-vertikal-idempotens.md) beslut 6) härleder därför `Månad/år` ur `Startdatum` server-side som route-around. **Verifierat live STAGING-schema 2026-06-27 (Session 38, pre-pass).** → **Maximerings-kandidat (T16):** konvertera `Månad/år` till ett formelfält (eller ta bort det till förmån för `Startdatum`-härledning) i basen — kravspec för post-Fas-6-bas-maximeringen ([ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)), ej app-fix.

37. **`Idempotensnyckel` på Eventplanering — STAGING-LIVE + PROD-LIVE (prerekvisit uppfyllt Session 38; se RESOLUTION).** [ADR-066](../decisions/ADR-066-skapa-event-write-vertikal-idempotens.md) beslut 3:s dedikerade skrivbara fält `Idempotensnyckel` (singleLineText) — merge-nyckel för create-event:s Airtable-nativa upsert (`performUpsert.fieldsToMergeOn: ['Idempotensnyckel']`). Merge-fält får per Airtable-API:t INTE vara beräknat → singleLineText. **Status (Session 38 L1):** skapat + live-verifierat i **STAGING** (`apphjj8Q7lkXCMsL4`, fält-ID `fldOWoh4WR5zG6XgQ`, singleLineText, tomt på alla befintliga rader). **PROD-fältet (`app8uGPrVCVOm6LfD`) är INTE skapat — medvetet prod-deferral.** ⚠️ **HÅRD FÖRUTSÄTTNING:** create-event-EF:en skriver `Idempotensnyckel` server-side → prod-EF-deployen FÅR INTE ske utan att prod-fältet `Idempotensnyckel` skapats först (annars fäller Airtable skrivningen). Prod-fält + prod-EF-deploy = EN atomisk separat-auktoriserad prod-handling (samma bundel; ADR-066-carry). Får ej glömmas — registrerat L192, ej deferra-och-glöm. **RESOLUTION (Session 38, prod-deploy):** prerekvisit UPPFYLLT — prod-fältet `Idempotensnyckel` (`fldkc33LVnbnz2ZmW`, singleLineText, tomt på alla 50 prod-rader) skapat FÖRE EF-deployen (hård ordning hållen); create-event + get-event-formats prod-deployade (ACTIVE v1) via kanoniskt `scripts/deploy-prod-functions.sh` + `ALLOWLIST_FILE`-override (endast de 2; de 5 redan-live oberörda); auth-grind prod-bevisad READ-only (anon→401, fel metod→405, anon-Bearer→401 — inget 200 utan äkta user). Ärligt: deployad + grind-bevisad + write-mål-bekräftad, men FULL idempotens-prod-create-smoke (autentiserad ZZ-create→replay→teardown mot prod-basen) DEFERRAD → tråd **T40** (precondition: prod-test-user via rätt kanal; mekanismen redan staging-live-bevisad).

38. **`Utskickslogg` saknar idempotens-kolumn — bulk-send-loggraden kan ej merge:as utan ett additivt fält.** Live-introspektion 2026-06-28 (Session 39 L0, staging `apphjj8Q7lkXCMsL4`, `tblIesjbuSWNp6oxK`, 9 fält) bekräftar: Utskickslogg har INGET fält för en idempotens-/merge-nyckel (jfr Eventplanering.`Idempotensnyckel`). **Konsekvens:** 6h:s revisionslogg-write ([ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) D4b) behöver Airtable-nativ upsert (`performUpsert.fieldsToMergeOn`) för exakt-en-gång-loggning vid batch-retry — utan merge-nyckel ger en retry dubbel loggrad. **Åtgärd (adresserad, ej app-route-around):** en NY additiv `Idempotensnyckel`-kolumn (singleLineText) **skapad L2a på STAGING** (`fldgB4EWDIksNCvN2`, additivt — inget befintligt fält ändrat); prod-kolumnen läggs vid prod-deploy (separat handling). Merge-fält får per Airtable-API:t ej vara beräknat → singleLineText. ⚠️ **HÅRD FÖRUTSÄTTNING (ADR-066-carry):** EF:en som skriver `Idempotensnyckel` får ej deployas mot en bas där kolumnen saknas (annars fäller Airtable skrivningen) → kolumn FÖRE EF, per miljö. Detta är en ADR-063-klass kravspec-anteckning (resolution I BASEN, ej app-lapp), ej en defekt i befintlig data. Jfr fälla 37 (samma mönster för Eventplanering).

39. **`Utskickslogg.Antal skickade` (`fldqJBTOwErzMdCAO`) felräknar — `COUNTA` på länkfältet `Skickat till` ger 1 oavsett antal mottagare.** **Symptom (verifierat observerat Session 40, Fas 6h L2d STEG 3, live staging):** vid ett bulk-utskick med 2 accepterade mottagare visade `Antal skickade` värdet **1**, trots att `Skickat till` korrekt bar **2** länkade Personer-records. **Fält-form:** formel `COUNTA({Skickat till})` där `Skickat till` (`fldnNRJHfhEQLrQkp`) = multipleRecordLinks → Personer. **Hypotes om rot (EJ verifierad — utreds vid bas-maximering):** `COUNTA` räknar inte ett länkfälts element separat utan behandlar cellen som ETT värde (Airtables länkfält-i-formel-beteende) → alltid 1 så länge minst en länk finns. **Affärspåverkan:** missvisande utskicks-statistik för Roger/Lotta; `Öppningsgrad (%)` (`fldmrf9SaBcXLNJUl` = `{Antal öppnade mail}/{Antal skickade}`) ärver fel nämnare. **Utanför app-skrivkontraktet:** `Antal skickade` är ett ❌-fält (härlett, skrivs ALDRIG av send-email — EF:en skriver de 5 skrivbara + `Idempotensnyckel` korrekt; raden `Skickat till` bar rätt 2 record-ID). **Resolution I BASEN (ej app-lapp nu):** ersätt `COUNTA` med en korrekt antals-mätning (rollup / `ARRAYJOIN`-baserad räkning, eller ett separat skrivet antal) vid bas-maximeringen. → **Maximerings-kandidat (T16 / [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)).**

40. **`Personer.E-post` matchas CASE-KÄNSLIGT av A2 → versal-/whitespace-varianter ger DUBBLETT-Personer.** A2:s person-matchning slår på det råa fältet `E-post` (`fldcd5HnYooVZY4Ts`, multilineText) case-känsligt; Personer-tabellen har INGET normaliserat e-post-fält (till skillnad från Anmälningar, som har `Normaliserad e-post` `fld0CIF2qC7ufa8UD`). **Konsekvens:** en Person vars `E-post` bär versaler eller whitespace (t.ex. `Lenehay@gmail.com`) matchas INTE av en senare anmälan med gemen adress → A2 skapar en DUBBLETT-Person. **Live-bekräftat 2026-07-08 (Session 60):** Lene Hay bar `Lenehay@gmail.com` (versal L); walk-in med `lenehay@…` matchade inte → dubblett `reclqYPq7sd4isEN2` skapad. Manuellt konsoliderad (anmälan + 2 Deltaganden + touchpoint re-pekade → original `rec5Edyvkfo7hHQ8n`; e-post normaliserad till gemener; dubbletten raderad). **Bredare än backfill:** träffar ALLA befintliga Person-`E-post` med versal/whitespace, inte bara backfill-flödet. → **Maximerings-kandidat (T16):** normalisera alla Person-`E-post` (gemener/trim) OCH inför ett normaliserat fält som A2 matchar på — annars återkommer dubbletten vid varje case-avvikande adress. ⚠️ **Skild mekanism från fälla 42:** denna fälla gäller SKIFTLÄGE (adressen finns men matchar inte); fälla 42 gäller FRÅNVARO (adressen saknas helt). Normalisering löser 40, men INTE 42.

41. **Orphan-Deltaganden utan anmälan-länk — A9/A10-bulk markerar dem felaktigt som Närvarande.** Deltaganden vars `Anmälan`-länk är tom (t.ex. anmälan raderad efter att A3 skapat Deltagandet) hänger kvar med giltig `Eventkey (lookup)` men saknar koppling till någon aktuell anmälan. En A9/A10-närvarobulk (som itererar eventets Deltaganden) markerar dem ändå → de blåser upp källästa segment med icke-existerande/dubblett-deltagare. **Live-bekräftat 2026-07-08 (Session 60), Event-17 (Psionautics):** 220 Deltaganden totalt, varav **44 orphans** (utan anmälan-länk) — 18 dubbletter hos 7 riktiga personer (som ÄVEN har korrekt anmälan-länkade Delt) + 26 hos **3 testpersoner** (`marcus@h5gruppen.se` "Marcus (test)" med 22 st, `test-kalla-delete@example.com`, `highfive.epost@gmail.com`). En initial "markera alla"-bulk gav "Marcus (test)" 22/22 (100 %) närvaro. Åtgärdat icke-destruktivt (Status → `Ej avstämt`; se [`../backfill/execute-log.md`](../backfill/execute-log.md)). → **Maximerings-kandidat (T16):** radera orphan-/dubblett-Deltaganden + testpersoner; framtida närvaro-bulk bör exkludera Deltaganden utan anmälan-länk. Jfr fälla 11 (manuella Deltaganden utan Event-länk). **Precisering 2026-07-09 (Session 60):** de 26 orphan-Deltagandena hängde på tre Person-records, men "3 testpersoner" är en oprecis etikett — `rec8sFNULpjfe0Lw9` (`highfive.epost@gmail.com`) är Marcus **riktiga privatadress**, inte ett testkonto; den bär 2 orphan-Deltaganden (skräp) men adressen tillhör en riktig, betalande Psionautics-deltagare. Orphan-egenskapen (avsaknad av anmälan-länk) är det som gör raderna till skräp — **inte** vems adress de hänger på. Se [`testkonton.md`](testkonton.md) för identiteternas faktiska roller; **klassa aldrig en record som testdata utifrån adress-match** (se fälla 44).

42. **Anmälan UTAN e-post → A2 Gren 4 skapar en Person som ALDRIG kan matchas igen (permanent omatchbar dubblett).** A2:s person-matchning (Gren 1/2) slår på anmälans `E-post` (`fldVY310IdOIbTkE8`). Är fältet TOMT matchar ingen gren → default Gren 4 skapar en ny Person och kopierar anmälans fält rakt av: `Förnamn`/`Efternamn` fylls, men `Personer.E-post` (`fldcd5HnYooVZY4Ts`) blir **tomt**. Den Personen är därmed osynlig för all framtida e-postmatchning: nästa anmälan från samma människa skapar YTTERLIGARE en Person. **Skild rot från fälla 40:** 40 = adressen finns men fel skiftläge (normalisering löser den); 42 = adressen finns inte alls (normalisering hjälper inte). **Live-bekräftat 2026-07-09 (Session 60), två oberoende instanser:** (a) **Ulrika Arvas** — Event-17-anmälan (`rec2ZnuEmEvUcvmQO`) saknade e-post → Person `rec3ERFZfQnMwMym6` (namn, ingen e-post, Psionautics-närvaro) vid sidan av hennes riktiga Person `recT8y8DvaZz09gtW` (adress-bärande, RIM 1). De två bar VAR SIN kurs → segment-exporten gav henne två rader i Skool-unionen. (b) **Stefan Martinsson** — den avbokade Event-17-anmälan (`reclipJKcGZgLiDId`) saknade e-post → Person `recXIThpV2FT2gB6I` vid sidan av `rec2uIwycYvJlWlPT` (adress-bärande). Namn-kollisionen mellan de två Stefan-recorden var samma sak som STOPPA-grinden fångade i Del 3. Båda konsoliderade 2026-07-09 (anmälan + Deltaganden + touchpoint re-pekade → behållen Person; dubbletten raderad); Ulrikas tomma anmälnings-e-post ifylld (värdet hämtat ur hennes Event-21-anmälan). → **Maximerings-kandidat (T16):** gör `E-post` obligatorisk på Anmälningar, ELLER låt A2 Gren 4 vägra skapa Person utan e-post (skriv Error-log i stället). Utan detta återkommer dubbletten vid varje e-postlös anmälan — och den är INTE upptäckbar via e-postmatchning i efterhand.

    **Förfining 2026-07-09 (Session 60): roten är TRIGGER-SNAPSHOTEN, inte anmälans sluttillstånd. [HYPOTES — mekanismen ej verifierad]** En tredje instans (`rectU34rbPfo6VD10`, Marcus Psionautics-anmälan `recbW1xZBot0MXumQ`, skapad 2026-02-21T22:15:57Z via `Anmälan-Psionautics.se`) motsäger den enkla formuleringen: anmälan bär i dag **Förnamn, Efternamn, E-post OCH Mobilnummer** — men A2 skapade ändå en Person där alla fyra är tomma. Dessutom fanns Personen `rec8sFNULpjfe0Lw9` (`highfive.epost@gmail.com`, skapad 2026-01-14) redan, så Gren 2 borde ha matchat och bara länkat. Eftersom A2 Gren 4 kopierar exakt dessa fyra fält från trigger-radens `cellValuesByFieldId` följer att **fälten var tomma vid RECORD_CREATED-ögonblicket** och fylldes strax därefter. Trolig mekanism (ej verifierad — kräver granskning av formulär/Zapier-flödet): raden skapas tom och PATCH:as i ett andra steg. Jfr A2 Gren 4:s egen `testResult.input.fields` i automations-källan, där alla fyra källfält är tomma strängar. **Konsekvens:** villkoret är inte "anmälan saknar e-post" utan "anmälan saknade e-post när A2 lästes" — en tidsberoende race, som förklarar varför även kompletta anmälningar kan producera tomma Person-records. → **T16:** en fältvaliderings-spärr på Anmälningar räcker INTE; A2 måste läsa aktuellt värde (t.ex. en FIND-nod som slår upp raden på nytt) eller triggern flyttas till en `Bekräftad`-övergång i stället för `RECORD_CREATED`.

43. **De 365 namnlösa Anmälningarna är DATAFÖRLUST VID KÄLLAN — inte en bugg. [BEKRÄFTAD 2026-07-09 — Session 60]** `Personer.Namn` (`fldnYys0Ac3UGOdpe`) är formeln `IF(AND(Förnamn="", Efternamn=""), "Ej tillgängligt", TRIM(...))`; `Anmälningar.Namn` (`fldCFYtMUs0Kpu8BE`) = `{Förnamn} & " " & {Efternamn}` → `" "`. **Omfattning:** 365 av 816 Anmälningar saknar Förnamn+Efternamn; 186 av de 414 personerna i Skool-unionen (dvs. med genomförd utbildningsnärvaro) är därmed namnlösa. **Rotorsak, verifierad mot TVÅ oberoende källor:** (1) alla 365 bär `Från formulär = Backfill (historisk)` och `Inskickad = 2026-04-19` — en enda importkörning; (2) `~/Repon/psionautics/docs/backfill/backfill-mapping.yaml` innehåller **exakt 365** `firstname: null` (perfekt korrelation); (3) ursprungskällan `~/Repon/psionautics/docs/Samlade-deltagare.xlsx` visar varför: flikarna från **2024-10 t.o.m. 2025-12 innehåller enbart e-postadresser** — Roger & Lotta noterade inga namn för de äldre eventen. Namn börjar förekomma först i flikarna från **2026-01** (format `Förnamn Efternamn <adress>` i en cell, resp. separata namn-/e-postkolumner). **Backfill-scriptet gjorde alltså rätt: det skrev `null` för att källan var `null`.** **Ej en kodväg:** `create-registration` kräver Förnamn OCH Efternamn (deny-by-default, `supabase/functions/create-registration/index.ts`), så formulär-/admin-vägen kan inte producera namnlösa anmälningar. **Återvinningsgrad: 0 av 187.** Korskörning av de namnlösa e-postadresserna mot (a) xlsx-källan (114 utvinnbara e-post→namn-par) och (b) mapping.yaml (129 namngivna adresser) gav **noll överlapp** i båda fallen; basens övriga tabeller bär dem inte heller (Kontaktlogg 0/187, Hämtade erbjudanden 0/187, Touchpoints saknar namnfält, Väntelista 2/187). **Namnen har aldrig existerat i något digitalt system vi äger.** Skiljs från fälla 21/22 (namnlösa **leads** från A4 = normalt tillstånd): dessa 186 har genomförd kursnärvaro och skulle enligt A2 Gren 1 ha fått namn — de fick det inte eftersom anmälan de kom in på också var namnlös. → **T16:** ej åtgärdbart i basen. Kan bara repareras om Roger/Lotta har namnen på annat håll (Marcus-verifierat 2026-07-09: **de gjorde det inte** — namn började föras först 2026-01). Konsekvens som ska bäras, inte jagas: personaliserade utskick till dessa 186 är omöjliga; e-postbaserad access (Skool) fungerar.

44. **Marcus e-postadresser har DUBBELROLL — de är både riktiga deltagar-identiteter och testadresser. Adress-match är INTE en testdata-klassificering. [BEKRÄFTAD 2026-07-09 — Session 60, via ett infört fel]** `highfive.epost@gmail.com` och `inbox@marcusemails.com` används av Marcus för tester **och** är hans riktiga adresser som betalande kursdeltagare. **Verifierat mot Lottas auktoritativa CSV** (`alla-anmalda-medveten-kontakt-2026-07-08.csv`): `"Marcus Johansson","highfive.epost@gmail.com",…,"Bekräftad (mail skickat)","Ja"[betalt],"Formulär","2026-02-21"` — en riktig formuläranmälan till Psionautics med bekräftelse, betalning och deltagarinfo. Likaså bär `inbox@marcusemails.com` tre Bekräftade anmälningar (Event-36/42/50) med korrekt anmälan-länkade Deltaganden i Fjärrskådning, RIM 1 och RIM 2. **Det införda felet:** vid segment-exporten klassades Person `rectU34rbPfo6VD10` som testkonto enbart för att dess anmälan bar `highfive.epost@gmail.com`, och dess 2 `Närvarande`-Deltaganden reverterades till `Ej avstämt` (Event-17 skrevs felaktigt om till 154/66). Lottas CSV lästes ALDRIG före reverteringen, trots att den var facit i Del 3:s korrektion och låg i `~/Downloads/`. Återställt samma dag: **Event-17 är och förblir 156 Närvarande + 64 Ej avstämt = 220** (Del 3 hade rätt). **Diskriminanten som skiljer skräp från verklighet:** en Deltagande-rad är skräp om den saknar `Anmälan`-länk (orphan, fälla 41) — aldrig för att en adress "ser ut som" en testadress. Marcus rena testartefakter är `recIynU41be2DcYup` (`marcus@h5gruppen.se`, 0 anmälningar, 22 orphans) och `rec3iFLEHuRHl1QZH` (`test-kalla-delete@example.com`). → **Regel:** testidentitet avgörs av [`testkonton.md`](testkonton.md) + orphan-egenskapen, och en klassificering som leder till skrivning mot närvarodata **måste** verifieras mot anmälnings-CSV:n först. Jfr fälla 41. Lärdom: [[L258]]. ⚠️ **Varför avstämningen inte fångade felet:** kontrollen `Σ statusar = 220` är en KONSERVERINGS-kontroll — den bevaras exakt när en rad flyttas mellan två kategorier (`156+64` → `154+66` summerar båda till 220). Den fångar tappade/dubblerade rader, aldrig fel kategori. Kategori-korrekthet kan bara verifieras mot en extern källa som bär kategorin (Lottas CSV: `Status` + `Betalning` per person). Se [[L259]].

45. **`Månad/år`-selectens options-horisont slutar vid "December 2026" — create-event 500:ar för event bortom horisonten. [LIVE-BEKRÄFTAD 2026-07-24 — Session 84, T40-prod-smoken]** `Månad/år` (`fld2BjFdBd964TzVb`, Eventplanering) är en **singleSelect** vars optioner löper November 2025 → December 2026. `create-event` härleder värdet server-side ur `Startdatum` (`deriveManadAr`, ADR-066 b6) och skriver det utan typecast (deny-by-default) — ett startdatum i januari 2027 gav "Januari 2027" → Airtable avvisar okänd option → EF svarar 500. Smoken gick igenom med december 2026-datum; koden är korrekt, gränsen bor i basens data-modell. **Konsekvens:** appen kan inte skapa event bortom 2026 i prod förrän optionerna fylls på — en årligen återkommande tickande gräns så länge fältet är select. → **Maximerings-kandidat (AT-Max/T16):** konvertera `Månad/år` till formel härledd ur `Startdatum` (eliminerar options-underhållet permanent); interim vid behov: fyll på 2027-optionerna manuellt. Staging-fältets form obekräftad (staging-testerna använder 2026-datum — samma fälla kan ligga latent där).

46. **`Motivering (text)` (`fld4ENxbma679wvcC`) deklarerar `result: singleLineText` men API:et returnerar en ARRAY — schemat motsäger sin egen utdata. [LIVE-BEKRÄFTAD 2026-07-30 — Session 91, `TASK-89`; app-konsekvensen STÄNGD 2026-08-10, `TASK-52`]** *(Fältnamnet/ID:t i denna post var tidigare felaktigt angivet som `Motivering (sammanfattning)` / `fldrMT8cWP3NmBc9T` — det ID:t hör till ett ANMÄLNINGAR-tabellfält som `Personer.Motiveringar (lista)` rullar upp, inte till fältet posten faktiskt analyserar. Rättat här, `TASK-52`.)* Formelns ELSE-gren returnerar rollup-referensen **orörd** i stället för att platta den till en sträng, medan fältet samtidigt deklarerar `singleLineText`. **BAS-SIDAN AV DEFEKTEN KVARSTÅR ÖPPEN** — typdeklarationen ljuger fortfarande om sin egen utdata. → **Maximerings-kandidat (T16, post-Fas-6):** platta ELSE-grenen i formeln så deklarerad typ och faktisk utdata överensstämmer, alternativt deklarera fältet som det den faktiskt är (multipleLookupValues/rollup-typ, ej singleLineText). Resolution I BASEN ([ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)) för just DEKLARATIONS-motsägelsen — ej rört av `TASK-52`.
    **APP-SIDANS KONSEKVENS ÄR STÄNGD (`TASK-52`, 2026-08-10):** `get-person/index.ts` coercade tidigare rakt av (`f['Motivering (text)'] ?? null`) och `PersonDetail.schema.ts:44` krävde `z.string().nullable()` → ZodError → felvy för varje person med motivering. Fixen ligger vid RÄTT lager utan att föregripa T16: `get-person` coercar nu med `stringArray` (samma mönster som `ort`/`allaHamtningar`, `supabase/functions/_shared/coerce.ts`) och schemat är `z.array(z.string())`. Detta är INTE "appen lär sig acceptera en typ basen påstår att den inte skickar" — det är motsatsen: appen modellerar den FAKTISKA, observerade formen (en array, eftersom fältet är en rollup-baserad formel över en 1-till-många-relation) i stället för att lita på en deklaration som redan bevisligen ljuger. En framtida T16-fix som redeklarerar fältets typ ärligt (i stället för att förlustfritt platta det till en skalär) kräver därför INGEN omgörning av app-schemat — de två är förenliga, inte i konflikt.
    **~~Omätt led, kvarstår~~ — BÅDA LEDEN MÄTTA 2026-08-10 (S103).** Posten sade tidigare att flerhet (>1 element) aldrig observerats live, och att tre syskonfält bar samma formelmönster som "strukturell misstanke, ej belagd". Båda halvorna är nu belagda, i samma pass:
    **(a) FLERHET OBSERVERAD.** Granskningsfixturen `Sofia Isaksson` (`recxF88ZKUbP9JUs1`, staging) bär `Motivering (text)` som en array med **fyra element** — första gången flerhet setts i live-data. `PersonDetailSchema`s flerhets-stöd är därmed inte längre enbart teoretiskt bevisat.
    **(b) ETT SYSKONFÄLT ÄR BEKRÄFTAT DRABBAT, OCH DEFEKTEN ÄR SYNLIG FÖR ANVÄNDAREN.** `Senaste interaktion (text)` (`fldRnujWHT3ADToC1`) väljer i sina grenar mellan `Senast deltagande (text)`/`Senast touchpoint (text)`/`Senaste anmälan (text)` och returnerar den valda rollupen **orörd** — exakt samma mönster. När källrollupen är fler-värd konkatenerar Airtable elementen **UTAN avgränsare**. Skarpt mätt på samma person, verbatim ur API:t:
    `"Anmälde sig till RIM 1 i FalköpingAnmälde sig till RIM 2 i FalköpingAnmälde sig till Fjärrskådning i Falköping"`
    Tre meningar, noll separatorer. **Detta är inte ett app-fel:** `get-person` coercar med `scalarString` och får en genuin sträng — klumpen skapas i basens formel. **Konsekvensen är LEVANDE i drift:** `senasteInteraktion` renderas i den PROMOVERADE personlistan (`PersonsList.tsx`) och i persondetaljens "Just nu"- och Interaktioner-ytor. Den syns bara när en person har flera interaktioner samma dag — vilket är exakt vad en aktiv deltagare har.
    → **Bas-fix krävs (ADR-063: resolution I BASEN, ej app-lapp):** formeln måste platta sin valda rollup med separator, alternativt deklareras ärligt som fler-värd. Kvarstående omätt: `Nästa event (text)` och `Senast deltagande (text)`/`Senast touchpoint (text)` var för sig — misstanken är nu stärkt av en bekräftad instans i samma familj, inte längre enbart strukturell.

47. **`Personer.Antal hämtningar` (`fld4UQOdKTvWixZ9F`) räknar INTE hämtningar.** Formeln är `COUNTA({Engagemang})` (`flddG1tVJyaKBxBYv`) — den räknar rader i tabellen **`Engagemang`**, inte i `Touchpoints` eller `Hämtade erbjudanden`. Fältnamnet säger något annat än fältet gör. **Live-belagt 2026-08-10 (S103):** `Sofia Isaksson` har tre faktiska touchpoint-hämtningar (`Alla hämtningar` bär alla tre med datum) medan `Antal hämtningar` visar **0**. **Konsekvens för app-design:** fältet får ALDRIG användas som facit mot en hämtningslista — persondetaljens D-variant visade en tid "räknaren säger N, listan M" som ärlighets-not, och den jämförelsen var själv missvisande: den ställde två fält bredvid varandra som mäter olika saker, och sådde tvivel om en lista som var korrekt. Raden är riven. → **Maximerings-kandidat (T16):** döp om fältet till vad det faktiskt räknar, eller peka om formeln mot touchpoint-relationen.

48. **`Deltaganden.Registrerad av` (`fldhx3tludhu1gH7w`, `lastModifiedBy`) bokför INTE vem som checkade in.** Fältet är varken skrivbart eller styrbart av appen — Airtable sätter det automatiskt till den som senast ändrade RADEN, och vid en API-skrivning (via `update-record`/`set-attendance-status` eller `create-attendance`, TASK-214.1) är det **integrationskontots token-ägare**, aldrig den inloggade Lotta. **Medvetet val, attribuerings-väg (a)** (förarbete: `tasks/sessions/bilagor/s90-checkin-forarbete/skarpt-underlag.md` § 2 — "acceptera och dokumentera"; PRD task-214 § Implementationsbeslut, S103 Del 15 F5): appen skriver bara `Status`, och `Registrerad av` blir därför aktivt VILSELEDANDE — det ser ut som en attribuering men svarar fel på "vem". `Avstämt` (`fld61tbzc2fqqf116`, satt av automationen A8) bär fortfarande NÄR incheckningen skedde. **Reversibelt:** väg (b) (ett additivt `singleLineText`-fält satt server-side ur JWT:ns verifierade identitet, ADR-075:s mönster) kan läggas till senare utan att riva detta beslut — utlösande signal är att fler än en person checkar in på samma event samtidigt (S90 § 2.4). Människo-attribueringen bärs annars av aktivitetsloggen (Fas 6.5) när den landar. → Ingen maximerings-åtgärd i basen: fältets BETEENDE är Airtable-plattformens (lastModifiedBy kan inte omkonfigureras), det är app-konsumtionen som måste veta bättre.

49. **`Anmälningar.Inskickad` (`fldNtSHQivkL26B6L`) fylls INTE av Huvudformulärets Zap — 294 av 868 prod-rader stod tomma. [LIVE-BEKRÄFTAD + ÅTGÄRDAD 2026-08-17, `TASK-248`, Marcus-mandat]** `Inskickad` är ett skrivbart `dateTime`-fält som bara sätts av de vägar som uttryckligen mappar det: Edge Function `create-registration` och **Zap 1** (`Anmälan-Psionautics.se`). **Zap 4** (`Huvudformulär`) mappar det inte ([`schema_reference.md`](./schema_reference.md) rad ~1160–1172) — dess anmälningar landar därför utan inskickstid. **Mätt omfattning (REST, paginerad, prod `app8uGPrVCVOm6LfD` 2026-08-17):** 294 av 868 rader saknade värde, fördelat `Huvudformulär` 273 · `Backfill (historisk)` 20 · helt utan `Från formulär` 1 (`rec8H1aVug1RMw3hq`, Björne Hellqvist — jfr fälla 42). Per formulärklass betyder det att **273 av 302** Huvudformulär-rader (90,4 %) saknade fältet, medan **0 av 49** Zap 1-rader gjorde det — rotorsaken är därmed isolerad till den mappning som saknas, inte till något i basen. ⚠️ **Zap 3 (`Expressformulär`) saknar mappningen likaledes men har NOLL rader i prod** (mätt: 0 av 868) — den är en latent, aldrig materialiserad rotorsak, och ska inte räknas som observerad instans. **Åtgärd:** de 294 backfillade med `Inskickad = Rad skapad` (`fldet9MU1rJBSpo3y`). Källvalet är exakt, inte approximativt: `Rad skapad` är av typen **`createdTime`**, alltså Airtables egen skapelsetidstämpel — verifierat instant-identisk med `record.createdTime` på samtliga 294 rader (0 avvikelser), och den kan per konstruktion aldrig vara tom. Skrivningen bevisades inert mot automationerna före full körning: **A7** (`wflDxN31sRJNWCqfu`) bär `watchFields = [Slutbetalning, Event]` och kan därför inte fyra på `Inskickad`, och **A3** (`wfl4qb2eP28SfKlck`, 26 av raderna matchade dess villkor) mättes med en enskild kanariefågel-rad — Deltaganden-antalet stod stilla på 1716 före och efter. ⚠️ **FRAMÅTGARANTIN ÄR INTE STÄNGD AV BACKFILLEN.** Hålet är levande: den senaste raden utan `Inskickad` skapades **2026-08-16**, dagen före åtgärden, och spannet löper 2025-11-27 → 2026-08-16. Utan en framåtgaranti — en automation som sätter fältet vid create, eller en rättad Zap 4-mappning — återkommer defekten på varje ny Huvudformulär-anmälan, och en ny backfill blir nödvändig. **Framåtgarantin finns skapad men är ännu inte i drift:** automationen **A12** (`wflVeU33Etsi8g8wh`, trigger `recordCreated` på Anmälningar → villkor `Inskickad isEmpty` → sätter `getWorkflowExecutionIsoDateTime()`, samma form som A8) skapades 2026-08-17 med `configurationStatus: valid` men **`deploymentStatus: undeployed`** — Airtable tillåter ingen agent-aktivering, så Marcus slår på den i UI:t. Tills dess är hålet öppet: en odeployad automation är en avsikt, inte en garanti. → **Maximerings-kandidat (T16 / [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)):** stäng vägen in, gör inte om städningen. **Dokumentationsdivergens att känna till:** [`schema_reference.md`](./schema_reference.md) listar `Rad skapad | Zapier | Current time` för Zap 1/3/4, men fältet är `createdTime` och kan därför inte skrivas av någon Zap — mappningen är verkningslös eller historisk, och `Rad skapad` speglar i praktiken alltid Airtables egen skapelsetid. Full skrivlogg: [`../backfill/execute-log.md`](../backfill/execute-log.md) § 2026-08-17.

50. **`Personer.Totalt antal hämtningar (erbjudande)` (`fldd782imiCRtFJ4t`) — ODOKUMENTERAT FÖRE DENNA POST, sedan `TASK-277` en LÄST yta i produktionskod.** ROLLUP över `Touchpoints`-länken (`fldnuqNqlVzt47AAN`), källfält `Touchpoint ID` (`fldv9JUvqCmnxh4wy`, `autoNumber`) i `Touchpoints`-tabellen (`tbl22SCvlHrgcAiZi`) — samma länk `Alla hämtningar` (`fldHchJXiIFw3BuFy`) rullar upp, alltså RÅLOGGET, inte en separat aggregeringstabell. **Skiljer sig strukturellt från fälla 47 ovan:** `Antal hämtningar` (`fld4UQOdKTvWixZ9F`) är `COUNTA({Engagemang})` — en SEPARAT tabell som automation A5 ska fylla (`data-model.md:1105-1122`) och som kan stå tom även när riktiga hämtningar skett (fälla 47:s Sofia Isaksson-instans). Detta fält läser i stället direkt ur `Touchpoints`, ett steg närmare källan, och missar därför inte de rader vars `Engagemang`-post aldrig skapades. **Live-belagt 2026-08-19 (`TASK-277` premisskontroll, prod `app8uGPrVCVOm6LfD`, Airtable-MCP READ-only):** fältet ÄR filtrerbart i `filterByFormula` (skarpt prövat, inget formelfel — detta var tidigare en OVERIFIERAD premiss i kortets AC #6). `AND({Totalt antal hämtningar (erbjudande)} > 0, {Antal hämtningar} = 0, {Antal anmälningar (totalt)} = 0)` gav **exakt 33 poster**, samtliga med en genuin `"Hämtade …"`-rad i `Senaste interaktion (text)` — bekräftar att fältet räknar RIKTIGA hämtningar där fälla 47:s syskonfält gav 0. Mätt bredare: **69 personer** bär rollup > 0 medan `Antal hämtningar` ger 0 (33 av dem med noll anmälningar — rena leads, tidigare osynliga i HELA appen). **Konsekvens för app-design (`TASK-277` AC #6):** `get-leads`s `LEAD_FILTER` läste tidigare `{Antal hämtningar}` och läckte därmed exakt den mängden — filtret pekar nu om till detta fält. **UPPDATERAT `TASK-278` (2026-08-19):** `get-leads`s `antalHamtningar`-VISNINGSFÄLT pekades likaså om till detta fält — öppen kant stängd (de 33 leads `TASK-277` gjorde synliga bar per definition `COUNTA(Engagemang) = 0`, så visningsfältet visade `0` på en rad som listades FÖR ATT personen hämtat något; live-belagt mot staging på `Sofia Isaksson`, rollup=3 mot COUNTA=0). `get-person` (singular) mappar FORTFARANDE `antalHamtningar` från `Antal hämtningar` — medvetet lämnat (`TASK-278` korsundersökning, AC #2): fältet renderas ingenstans i `PersonDetail.tsx` (jämförelse-blocket som en gång visade det revs 2026-08-10 av precis detta skäl) och skapar därför ingen synlig självmotsägelse på den ytan idag. → **Maximerings-kandidat (T16):** samma rotorsaksfix som fälla 47 föreslår (peka om/döp om `Antal hämtningar`) löser även denna dubblering — en PROD-SCHEMAÄNDRING, kräver Marcus uttryckliga GO.
51. **Sorterings-kollationen och filter-jämförelsen i `Personer.Namn` följer INTE samma regler — sort veckar Å/Ä/Ö mot basbokstaven, `=` gör det inte. [MÄTT 2026-08-21 — Session 109, prod `app8uGPrVCVOm6LfD`, Airtable-MCP READ-only]** `get-persons/index.ts:147` skickar `sort: [{ field: 'Namn', direction: 'asc' }]`, och den sorteringen är **diakritik-OKÄNSLIG**: samtliga fem Å-poster i basen (`Åsa Ganell`, `Åsa Jansson`, `Åsa Jeborn`, `Åsa Karner`, `Åsa Reinholdson`) sorterar mellan `Annika Svessar` och `Axel Andersson` — exakt där `"Asa"` utan diakrit hade hamnat — och `Anneli Åsblom` sorterar före `Anneli Clevenrot`. Det är alltså INTE svensk kollationsordning (Å, Ä, Ö efter Z). **Men `filterByFormula`-jämförelse med `=` är diakritik-KÄNSLIG:** `LEFT({Namn},1)="Å"` returnerar exakt de fem Åsa-posterna, och ett `LEFT({Namn},1)="A"`-filter kombinerat med prefixet `Ås`/`As` returnerar **noll** — Å läcker aldrig in i A-hinken. **Verifierat oberoende två gånger** (research-agent + orkestrerare, samma dag, olika formler). **Konsekvens för app-design:** ett bokstavsindex kan byggas **diakritik-korrekt** (A–Z, sedan Å, Ä, Ö, svensk konvention belagd via CLDR + iOS `sv_SE`-lokaldata) trots att bläddringsordningen inte följer den — filter och sortering är två olika mekanismer i Airtable. Priset är en synlig inkonsekvens: trycker användaren Å får hon rätt fem personer, men bläddrar hon utan filter ligger samma fem inne bland A:na. **Mätt på köpet:** noll poster i basen börjar på Ä eller Ö (`LEFT({Namn},1)="Ä"` och `="Ö"` gav båda tomma träfflistor), vilket gör "tom bokstav"-hanteringen konkret och nuvarande för just de två knapparna, inte hypotetisk. **Skiljs från fälla 43:** den posten bär att 186 av personlistans 559 har formelvärdet `"Ej tillgängligt"` på `Namn` (dataförlust vid källan, ej åtgärdbar). Sorterings-konsekvensen av DEN posten hör hit: `"Ej tillgängligt"` sorterar bokstavligen in mellan `Ei…` och `Ek…`, alltså **inuti E** — ett naivt `LEFT({Namn},1)="E"`-filter drar därför med sig samtliga 186. Sentinelen måste undantas explicit (`AND(LEFT({Namn},1)="E", {Namn}<>"Ej tillgängligt")`) och ges en egen namngiven hink; det är en **mätt korrekthetsbugg**, inte en smaksak ([ADR-121](../decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md)s systerbeslut för personlistan, S109). → **Maximerings-kandidat (T16):** basens sorteringskollation är en Airtable-plattformsegenskap vi inte styr; posten registreras som KÄND VÄGG, inte som åtgärdbar defekt. Full källbeläggning: [`bokstavsindex-personlista-branschmonster-2026-08-21.md`](../research/bokstavsindex-personlista-branschmonster-2026-08-21.md) § Fokusfråga 4.
52. **`Anmälningar.Deadline slutbetalning` (`fldGlznON7xqR3IE1`) — undantags-grenen är DÖD KOD, och utan den kraschar formeln på varje anmälan utan eventlänk. TVÅ defekter, EN rotorsak: ett valalternativs namn. [MÄTT 2026-08-21 — Session 110, prod `app8uGPrVCVOm6LfD` + staging, Airtable-MCP READ-only]** Formeln lyder `IF({Slutbetalning} = "Ej relevant", BLANK(), DATEADD({Startdatum}, -14, 'days'))`. Men valalternativet i `Slutbetalning` (`fldIImadnJUZHr5Qh`) heter **`"Ej relevant (för föreläsningar)"`** (`seljLR0FhWMMGSZRh`) — likhetstestet matchar därför **aldrig**, och `BLANK()`-grenen har varit oåtkomlig sedan den skrevs. **Följd 1 (den döda grenen):** en föreläsningsanmälan får en slutbetalnings-deadline trots att den uttryckligen markerats som irrelevant. **Följd 2 (kraschen):** eftersom grenen aldrig tas körs `DATEADD` alltid, och `Startdatum` (`fldAHtyo4P7Z08Vuj`) är ett UPPSLAGSFÄLT som är tomt när `Event`-länken saknas → `DATEADD(BLANK(), -14, 'days')` → **`#ERROR!`**. **Samma döda test finns i `Slutbetalning status visuellt` (`fldphHILC1eFiVHXD`)**, som därför klassar en föreläsning som `"Försenad"`/`"Snart dags"`/`"Väntar"` i stället för `"Ej relevant"` — en synlig felaktig status, inte bara ett internt värde. `Dagar kvar till deadline` (`fldZKPoOpziYbthYF`) ärver felet via sin `IF({Deadline slutbetalning}, …)`. **Appen läser fälten:** `get-registration/index.ts:189-190` mappar `deadlineSlutbetalning` + `dagarKvarTillDeadline`, och `AnmalanDetail.tsx:468` renderar datumet — ett `#ERROR!` når alltså ända fram till användarytan. **LATENT, INTE AKTIV — mätt, inte antaget:** `{Slutbetalning} = "Ej relevant (för föreläsningar)"` gav **0 poster** i prod, och `AND({Event} = BLANK(), {Slutbetalning} != "Mottagen")` gav likaså **0 poster** (2026-08-21, efter S110:s orphan-sanering). Ingen rad bär felet i dag; varje framtida orphan eller föreläsningsanmälan gör det. **Upptäckt** via `TASK-284.1`:s staging-fixtur `ZZ-TASK-284.1 Fixtur Utan event`, som är den första rad på länge som saknat eventlänk — bygg-agenten rapporterade kraschen, orkestreraren korsläste formeln mot fältets `choices` och fann den döda grenen bakom den. **Skiljs från fälla 10/F.2:** den posten rör FEL eventlänk (tyst felmatchning); denna rör INGEN eventlänk plus ett namnfel i en formel. → **Maximerings-kandidat (T16):** rättningen är två formler i prod (byt `"Ej relevant"` mot valets faktiska namn, eller testa på `FIND("Ej relevant", {Slutbetalning})`, plus ett `IF({Startdatum}, …)`-skydd runt `DATEADD`) — en PROD-SCHEMAÄNDRING, kräver Marcus uttryckliga GO.

<!-- markdownlint-enable MD029 -->

---

## Datakvalitetsstatus — historik (pre-backfill 2026-04-16)

> **Aktuella siffror finns i §Den kritiska distinktionen / Aktuell datakvalitet (live-MCP 2026-04-28)** ovan. Denna sektion bevaras som referenspunkt för backfillens påverkan — siffrorna nedan reflekterar tillståndet INNAN backfillen 2026-04-19.

### Deltaganden-tabellen — hela basen (snapshot 2026-04-16)

| Status | Antal | Andel |
|---|---|---|
| Ej avstämt | 487 | 94.2% |
| Närvarande | 30 | 5.8% |
| Frånvarande | 0 | 0% |
| Försenad | 0 | 0% |
| Avbröt | 0 | 0% |
| Deltog online | 0 | 0% |
| **Totalt** | **517** | **100%** |

**94.2% saknade närvaromarkering pre-backfill.** Detta var huvudanledningen till att kurshistorik-rapporter var nästan tomma. **Lösningen:** Backfill 2026-04-19 (se §Backfill — historik nedan).

### Medveten Kontakt (`recQ2TPsY69fQXA8a`) — pre-backfill snapshot

> **Namn-not (Session 60):** detta record är samma event som appen live labelar
> **"Psionautics"** (`Event (text)` / `Event (source)` = "Psionautics", EventKey
> **Event-17**, `Typ = Utbildning`, 1–3 maj 2026 Ödeshög). "Medveten Kontakt" är ett
> historiskt/alternativt namn i detta snapshot (2026-04-16). Avstämd 2026-07-08 →
> Genomfört, 156 Deltaganden Närvarande (se [`../backfill/execute-log.md`](../backfill/execute-log.md)).

| Mått | Värde 2026-04-16 |
|---|---|
| Totalt antal Deltaganden-poster | 202 |
| Dag 1-poster | 101 |
| Dag 2-poster | 101 |
| Status "Ej avstämt" | 202 (100%) |

A3 hade skapat 2 poster per anmälan (Dag 1 + Dag 2). Sessionsmallen fungerade.

**Per 2026-04-28** har MK växt till 218 Deltaganden (87 anmälda × 2 sessioner + extra/arrangörs-platser × 2). Se §Aktuell datakvalitet ovan.

### De 30 verifierade "Närvarande"-posterna (pre-backfill)

Kom från tre specifika event:

- RIM 1 Falköping 2026-03-21
- RIM 1 Rönninge 2025-12-13
- Fjärrskådning Rönninge 2025-11-29

### ~285 "Ej avstämt" på genomförda event (pre-backfill)

Resterande ≈285 Deltaganden-poster (`517 − 202 MK − 30 Närvarande`) hörde till andra genomförda event där närvaro aldrig markerats via A9/A10. Backfillen 2026-04-19 (Scenario B) löste denna volym.

---

## Backfill — historik

**Backfillen genomfördes 2026-04-19 enligt Scenario B (batch-markering).** Detaljer finns i `~/Repon/psionautics/docs/backfill/`. Detta avsnitt dokumenterar valet, resultatet och lärdomarna. Scenarie-beskrivningarna nedan bevaras som referensvärde — andra Miranon Media-projekt kan stå inför samma val.

### Resultat (verifierat 2026-04-24, errata 2026-04-26)

| Mått | Antal | Anteckning |
|---|--:|---|
| Backfill-Anmälningar (taggade `Backfill (historisk)` på Från formulär) | **459** | Importerade från Lottas historiska kurshistorik-Excel |
| Backfill-Deltaganden | **924** | Skapade av A3 efter Anmälan-import + Person-länk-PATCH |
| Nya Eventplanering-records | **22** | Historiska event som saknades i basen |
| Verifierad ren | ✅ | Alla rollups + länkar + automationer triggade korrekt |
| Errata-block | 2026-04-26 | 4 fynd identifierade i åtgärdssessionen — sanerade |

**Skyddade records under backfillen:** MK-eventet (`recQ2TPsY69fQXA8a`) och dess 174+ Deltaganden orörda — backfill-spärr i scriptet höll. Verifierat post-backfill via separat audit.

**Källa:** `psionautics/docs/backfill/verifieringsrapport.md` + `psionautics/docs/backfill/verifiering-2026-04-24.md` (med errata 2026-04-26).

### Lärdomar från backfillen

Tre huvudinsikter sammanfattas här. Full reflektion i `psionautics/tasks/sessions/retrospektiv-2026-04-19-backfill.md`:

1. **A2:s grenordning är optimerad för designflödet (lead först → anmälan sedan), inte reverse-flow.** Backfill-scriptet behöver kompensera för att A2 Gren 1 uppdaterar Personens namn men kopplar inte Anmälan till Personen — manuellt PATCH:a Anmälan.Person-länken efter create. Se §Reverse-flow-scenarier / F.1 + §Kända fällor 21–22.

2. **Multi-match-cleanup är värdefull men kräver source-jämförelse.** Whitespace-Personer (13 st) och dublettsfall identifierades pre-backfill via audit. Verifiering enbart "datan ser konsistent ut" räcker inte — datan måste jämföras mot källsanningen (Lottas Excel-lista i detta fall).

3. **Skyddade records-mönster fungerar.** MK-eventet markerades explicit som "off limits" i scriptet och spärr verifierades vid varje fas. Detta mönster är återanvändbart för framtida cleanup-operationer på live-data.

### Scenarier — referensvärde

Beskrivningarna nedan bevaras eftersom andra projekt kan stå inför samma val. **Genomfört val: Scenario B (batch-markering via API).**

#### Scenario A — Ingen backfill

Bygg rapporter enbart på Anmälningskedjan (Återkommande?, Har aktiv anmälan?, Antal anmälningar aktiva). Kurshistorik förblir tom. Snabbt men begränsat. **Inte valt** — Lotta hade explicit kurshistorik som behövdes.

#### Scenario B — Batch-markera alla avslutade event som "Närvarande" — VALT

Anta: alla anmälda till avslutade event deltog. Kräver bekräftelse från Lotta per event. Två tekniska vägar:

- **Via UI** — öppna varje genomfört event → bocka `Markera alla närvarande (alla sessioner)` → A10 fixar resten
- **Via API** — batch-PATCH `Status = "Närvarande"` på berörda Deltaganden. **Detta valdes** — script-baserat med YAML-källsanning, snabbare och spårbart.

Faktiskt resultat: 459 Anmälningar + 924 Deltaganden + 22 events. Tog ~6 timmar inklusive verifiering.

#### Scenario C — Event-för-event granskning

Lotta går igenom faktiska deltagarlistor (papper, Docs, minne) per event och markerar individuell närvaro (Närvarande vs Frånvarande). Ger sanning men tar tid. **Inte valt** — för tidsdyrt.

#### Hybrid

Batch-markera de event där antagandet är rimligt, granska de osäkra. **Effektivt valt** — backfill-YAML markerade vissa event som dag2_only eller med specifika unmark-instruktioner baserat på Lottas information om vilka som faktiskt deltog.

---

## Luckor — vad vi inte verifierat än

Code kan ta dessa när de blir relevanta för en specifik uppgift.

1. **Touchpoints-tabellens konsumenter.** A2 och A4 skapar Touchpoints — men vem läser dem? Används de i rapporter? Bulkmail? CRM-analys?

2. **Make.com-scenarierna i detalj.** Kartlagda på hög nivå ("Beräkna antal i segment", "Skicka mail" — inaktiv), men exakta datamappningar och error-hantering är odokumenterade.

3. **Zapier-zaps i produktionskontext.** 10 zaps dokumenterade i schema_reference.md (arkiverad) — men vilka är aktuella, vilka kan arkiveras, och finns det överlapp med Edge Functions?

4. **Path to Conversion-tabellens syfte.** Finns i basen men ingen dokumentation om vad den används till.

5. **Instagram Posts-tabellens syfte.** Samma som ovan. Kan vara tom.

6. **Miranon Media Admin — utbytbar datakälla.** React-projektet har `DataSourceAdapter`-mönstret förberett för Airtable → Supabase-migration. Exakt migrationsplan och trigger bor i `miranon-media-admin/docs/byggplan.md` + [ADR-056](../decisions/ADR-056-list-paginerings-port-cursor-dubbel-kalla.md), [ADR-057](../decisions/ADR-057-lager-oberoende-fitness-invariant.md), `docs/research/datamodell-research/07-migration-plan.md`.

7. **Datamodell-research för världsklass — STÄNGD 2026-06-21.** Research genomförd: se `docs/research/datamodell-research/` (`05-gap-vs-worldclass.md`, `06a-airtable-redesign.md`, `06b-supabase-target.md`, `07-migration-plan.md`). Ursprungligt uppdrag: identifiera principer för toppklass-datamodeller → gapanalys → migrationsplan.

8. **Webhooks i Airtable-basen.** Airtable-MCP kan inte läsa automationer, interfaces, vyer, formulär, extensions eller webhooks (per CLAUDE.md "Kritiska lärdomar"). Om webhooks finns konfigurerade utöver de Edge Functions vi ser i `psionautics/supabase/functions/` är de osynliga från denna dokumentation. Verifieringsväg: HAR-export från Airtable UI eller Airtable Web API direkt.

9. **A2-grenordnings-hypotesen.** Om en namnlös Person finns för trigger-mailen kan A2 Gren 1 matcha och Gren 2 hoppas över → Anmälan-Person-länken förblir tom. Dokumenterad som hypotes i §Anmälningskedjan / A2:s decision och §Reverse-flow-scenarier / F.1, men inte empiriskt verifierad. Marcus markerade explicit i `psionautics/tasks/lessons.md` att hypotesen aldrig prövats. Verifieringsplan finns i §A2:s decision (testanmälan med matchande email mot känd namnlös Person).

10. **EventKey-format-bug i Huvudformulär — orsak LOKALISERAD 2026-08-21 (S110, `T158`), vakt saknas.** 5 records (Anmälningar #220, #221, #222, #237, #847) hade EventKey="11" 2026-04-01 → 2026-04-23; saneringen 2026-04-26 länkade dem till Event-11 — **fel**, de hörde till Event-60 (25–26 juli), rättat S110. Roten är Elfsight-kalenderwidgetens handskrivna anmälningslänkar på miranon.se (kopierade poster, oredigerade URL-parametrar), inte formulärets templatekod. Felklassen omfattar även **tyst felmatchning** (rätt prefix, fel nummer → A1 länkar fel event) — 64 rader mätta 2026-08-21. Webbplats-länkarna ägs av Marcus/Roger; vakten i A1/appen är öppen designfråga. Se §Reverse-flow-scenarier / F.2.

11. **Hämtade erbjudanden.Källa SHA256-hashar.** `fldF9SgJS1Zv5kmtr` har två options med 64-tecken hash-strängar som namn (`ae9a4975...`, `58947ba3...`). [HYPOTES — EJ VERIFIERAD]: webhook-källkoder eller formulär-IDs som av misstag förvandlats till option-värden. Verifieringsväg: lokalisera webhook-konfigurationen som triggar A4 (Zapier-zap eller Make.com-scenarie) och kolla om hasharna mappar mot källor. Se §Kända fällor 26.

---

## Ändringslogg

| Datum | Ändring |
|---|---|
| 2026-04-16 | Första version. Snabbreferens, två datakällor, insiktskedja, anmälningskedja, automationssekvenser, 16 kända fällor, datakvalitet, backfill-strategier. Baserat på Code-extraktion ur schema_reference.md + Airtable MCP-verifiering. Dokumenterar 4 Psionautics-fält som saknas i schema_reference.md (ska synkas tillbaka). |
| 2026-04-28 (M1) | **Version 2 — Milstolpe 1 (steg 4.1–4.7).** Header omskriven (primär version, schema_reference avvecklad). Karta uppdaterad till live MCP-pull som källa. Snabbreferens utökad: Path to Conversion + Instagram Posts (tomma behållare), MK Max=88, From field: Medföljande till, fält-räknare per tabell, fldRfc4i7HHfc1dFU verifierad existens, Status-värden för Anmälningar+Eventplanering+Anmälningar.Källa+Deltaganden, **Schema cheat sheet** ny stor sektion. "Psionautics-tillägg" omstrukturerad till "Fält tillagda i april 2026" (utökad med From field: Medföljande till, Inställt-statusar, RIM 3 ×, RIM 3 eventkey, Antal genomförda event-konvertering, Avbröt+Deltog online, Backfill historisk-option). Den kritiska distinktionen: Spår 2 utökad med RIM 3 ×, Antal genomförda event uppdaterad till ny formula, datakvalitet uppdaterad till live-MCP 2026-04-28 (1500 records, 1012 Närvarande, 488 Ej avstämt — pre-/post-backfill-jämförelse). Insiktskedjan: DAG utökad med RIM 3-grenen, klartext-formler utökade, ny not om RIM 3 ej i Erfarenhetsnivå-formeln. |
| 2026-04-28 (M2) | **Version 2 — Milstolpe 2 (steg 4.8–4.13).** Anmälningskedjan: ny undersektion "A2:s decision — 4 grenar" med villkor + actions per gren + verifieringsplan för hypotesen. **Reverse-flow-scenarier** ny stor sektion (4 scenarier: F.1 backfill, F.2 EventKey-bug, F.3 mail-flöde, F.4 väntelista-flytt). Automationssekvenser **omstrukturerad** enligt Marcus' UI-grupper (Grupp 1: A1+A2+A3, Grupp 2: A4+A5, Grupp 3: A6–A11). A6 triggervillkor verifierat från JSON: `Anmäld beläggning (%) = 1` (= 100%). A8 latens "<60s verifierat 2026-04-26" tillagt. A11 explicit i Övervakning-gruppen. **Edge Functions** omstrukturerad: per-funktions-kontrakt med endpoint, request body, hårdkodade värden, felfall, kaskad-antaganden, commit-hash. Specialundersektion för send-email med TEMPLATE_MAP, patchAfterSend, patchWaitlistAfterSend, patchByType-dispatcher. **Mail-flöden (Resend)** ny sektion (5 mallar, avsändare, skarpa skick-historik, 3 Resend-fällor, mail-prickar med datum för amber-ändring). **Kända fällor** utökade från 22 → 30: fälla 21+22 utökade med live-stickprov 2026-04-28, 8 nya (23: RECORD_ID-bug, 24: case-dubletter, 25: tomma singleSelects, 26: SHA256-hashar, 27: Är aktiv exkluderar inte Inställt, 28: parallella formler, 29: mail-PATCH osynligt, 30: väntelista-dubblettsrisk). Datakvalitetsstatus + Backfill-strategier + Luckor orörda — uppdateras i Milstolpe 3 (steg 4.14–4.16). |
| 2026-04-28 (M3) | **Version 2 — Milstolpe 3 (steg 4.14–4.17, finishing).** §Aktuell datakvalitet (i Den kritiska distinktionen) utökad med MK-egen distribution: 218 Deltaganden för MK 2026-04-28 (verifierat via MCP), differensen mot 87×2=174 förklarad som extra/arrangörs-platser × 2 sessioner. O11-hypotesen löst med faktisk siffra. §Datakvalitetsstatus omdöpt till "Datakvalitetsstatus — historik (pre-backfill 2026-04-16)" med redirect-not till §Aktuell datakvalitet ovan — historiken bevaras som referenspunkt för backfillens påverkan. §Backfill-strategier omstrukturerad till **Backfill — historik**: tonläge ändrat från att-göra till genomförd, ny "Resultat"-undersektion (459 Anmälningar + 924 Deltaganden + 22 events, verifierat 2026-04-24), ny "Lärdomar från backfillen"-undersektion (3 huvudinsikter + pekare till retrospektiv), Scenarier bevarade som referensvärde med "Genomfört val: Scenario B"-markering. **Luckor** utökade från 7 → 11 (ny: 8 Webhooks ej via MCP, 9 A2-grenordnings-hypotesen, 10 EventKey-format-bug källa, 11 SHA256-hashar). §4.17 intern verifiering OK: alla schema_reference-referenser legitima (§Karta arkiverad / §Grundarkitektur källangivelse / §Luckor / Ändringslogg), 0 verkliga TODO-rader, 9 [HYPOTES]-flaggor med verifieringsplan. |
| 2026-08-19 | **Fälla 50 tillagd** (`TASK-277`): `Personer.Totalt antal hämtningar (erbjudande)` (`fldd782imiCRtFJ4t`) dokumenterad — saknades helt tidigare trots att den blev en LÄST yta i `get-leads`s `LEAD_FILTER`. Rollup över `Touchpoints` (rålogget), korsreferens till fälla 47:s `Antal hämtningar` (`COUNTA(Engagemang)`, en separat aggregeringstabell). Denna rad ensam är avsiktligt UTELÄMNAD från den fulla milstolpe-loggens detaljnivå ovan — övriga rader (M1–M3) är historiska och rörs inte. |
| 2026-08-19 (TASK-278) | **Fälla 50-noten amenderad**: `get-leads`s `antalHamtningar`-visningsfält pekades om till `Totalt antal hämtningar (erbjudande)` (samma fält `LEAD_FILTER` redan filtrerar på) — stänger `TASK-277`:s öppna kant, en självmotsägande rad på 33 av Intresserade-vyns leads. `get-person` (singular) korsundersökt och medvetet lämnat orört (fältet renderas ingenstans i `PersonDetail.tsx`); `allaHamtningar` korsundersökt och funnen redan korrekt (rollup direkt över Touchpoints, ej samma felklass). |
| 2026-08-21 (S110, `T158`) | **Fälla F.2 / Lucka 10 omskrivna — roten lokaliserad, hypotesen falsifierad:** Elfsight-kalenderwidgetens handskrivna anmälningslänkar på miranon.se (inte formulärets templatekod); felklassen utvidgad med tyst felmatchning (rätt prefix, fel nummer); April-saneringens Event-11-länkning rättad till Event-60; mätningen 1 orphan + 64 felmatchade av 304, städad i prod (Event-62/63/64 skapade, 61 omlänkningar, ~130 Deltaganden, A7-restlistor). Vakt-design öppen. Underlag: sessionsdok S110. |
| 2026-08-21 (S110, `TASK-284.1`) | **Fälla 52 tillagd** — `Deadline slutbetalning`s undantags-gren är död kod (valalternativet heter `"Ej relevant (för föreläsningar)"`, inte `"Ej relevant"`), och utan den kraschar `DATEADD` på anmälningar utan eventlänk. Samma döda test i `Slutbetalning status visuellt`. Mätt latent: 0 prod-poster i endera felläget 2026-08-21. Upptäckt via `TASK-284.1`:s staging-fixtur. |
