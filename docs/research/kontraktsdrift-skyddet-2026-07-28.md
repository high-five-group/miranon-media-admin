---
owner: marcus803
updated: 2026-07-28
review_by: 2026-10-28
status: stable
---

# Kontraktsdrift mellan fixturvärlden och verkligheten — kartläggning

> Beställd av Marcus 2026-07-28 (S91) med frågan: **kan våra tester vara gröna
> samtidigt som en verklig Edge Function eller Airtable-integrationen har börjat
> returnera ett annat format eller beteende?** Utrett av tre parallella
> läs-pass; varje påstående nedan är belagt mot kod med filnamn och radnummer.
> Frågan gällde inte om fixturvärlden ska byggas om — den ska den inte.

## Kort svar

**Ja. Det har redan hänt, och det är dokumenterat i repot.**

`TASK-52`: Airtables `Motivering (text)` är ett lookup-fält och returnerar en
**array**. `get-person` skickar det rått, `PersonDetail.schema.ts:44` kräver
`z.string().nullable()`, zod fäller — och persondetaljen visar felvy för varje
person som fyllt i motivering. Kortets egen förklaring till varför defekten
kunnat leva:

> e2e-sviten och fixturvärlden använder schema-trogna strängar, så **ingen
> grind ser den**.

`fixture-data.ts:959-965` skriver ut samma sak medvetet: fixturen är
schema-trogen där verkligheten inte är det, för att vyn ska gå att rita.
Kontraktsvakten hade fällt på den första natten — men `get-person` står inte i
dess bevakningslista.

**Ett andra fall har redan inträffat och upptäcktes i denna utredning:**
`fixture-data.ts:1163` påstår att ett okänt person-ID besvaras med *"501 i
klartext (synligt fel, aldrig tyst tom vy)"*. Catch-allen som gav 501 togs bort
i `task-54.2` (`handlers.ts:102-116`). Resolvern returnerar i dag `undefined` →
`json(undefined)` → **HTTP 200 med tom kropp**, medan EF:en har ett uttryckligt
404-kontrakt (`get-person/index.ts:172-180`). Fixturen har glidit, dess egen
dokumentation beskriver ett borttaget beteende, och ingen grind har sagt något.

## 1. Vilka tester anropar de verkliga Edge Functions?

| Projekt | Skarpt mot EF? | Kör |
|---|---|---|
| `api-pure` | Nej | varje PR |
| `api-staging` | **Ja, direkt HTTP** | när `run_staging` |
| `chromium-authenticated` (e2e) | Delvis — mest `page.route`-mockat | när `run_staging` |
| `kontraktsvakt` | Ja, tre GET | **endast nattligt** |
| `acceptance` | Nej — MSW-hermetisk | varje PR |

**Alla 24 Edge Functions nås av minst ett skarpt test.** Ingen är helt otäckt.
Men djupet skiljer sig radikalt:

- **19** når Airtable och asserterar på basdata
- **3** når Airtable men asserterar inget basinnehåll (`get-mail-log`,
  `send-email`, `send-registration-confirmation`)
- **2** rör aldrig Airtable (`test-auth`, `create-admin-user`)

**E2E-sviten är nästan helt mockad.** Filerna heter `.staging.test.ts` men
`page.route` avlyssnar EF-anropen. Hermetik-mätningen (`.hermetik/rapport.jsonl`,
863 rader) visar att live-trafiken är **oavsiktlig restrafik** — mest
`get-event-notes` som ingen mockat. Enda skarpa skrivningen i hela e2e-sviten är
**ett** `create-event`-anrop.

## 2. Vilka verifierar kedjan EF → Airtable?

Elva tester gör **oberoende återläsning via en annan EF** — det starkaste
beviset. Sex i `update-record`, tre i `update-event`, plus `get-event-notes` och
`send-registration-confirmation`:s orörd-bevis.

Därutöver finns **skriv-eko ur Airtables eget svar** (beräknade fält som bara
basen kan producera: `EventKey`-lookup, `Event-nr`-autonumber, server-satt
`Författare`), **persistens via en andra läsning** (idempotens-replay med samma
record-ID; 409 med `existingName`), och **assertioner mot rollups och formler**
(`antalHamtningar`, `antalGenomfordaEvent` null-vs-tal, `personNamn` som aldrig
får matcha record-ID-regexen).

**Två skrivvägar saknar positivt automatiserat bevis — och det är de två som
skickar mail till riktiga människor:**

| EF | Läge |
|---|---|
| `send-registration-confirmation` | Skriver `Status → Bekräftad` + tidsstämpel (`index.ts:126`). **Alla sex tester är negativa** — 401, 405, 400, 404, 422-orörd, already_confirmed. Happy-path prövas aldrig skarpt; e2e mockar den, acceptance mockar den |
| `send-email` | Alla fem tester är 401/405/400. Filens eget huvud (`L10-21`) bokför att happy-path, idempotens-rerun och 422-gaten verifierades **manuellt en gång i Session 40**, *"EJ som committade CI-tester"*, eftersom api-staging-runnern saknar seed-kapabilitet |

`save-segment` har bara skriv-eko, ingen oberoende återläsning.

## 3. Valideras verkliga EF-svar mot samma zod-scheman som frontenden?

**Ja — bevisat, och det är vaktens starkaste egenskap.** Ingen kopia, ingen
delmängd:

- `kontraktsfall.ts:1` importerar `EventNoteSchema`, `EventSchema`,
  `RegistrationSchema` ur `src/domain/schemas`
- `AirtableAdapter.ts:39` importerar ur samma barrel
- `kontraktsjamforelse.ts:252-267` kör `z.array(fall.schema)` på **båda** sidor

Men räckvidden är smal — se § 5.

## 4. Testas sökning, filtrering, paginering, cursor och detaljhämtning?

**Skarpt: delvis.** `get-persons.staging.test.ts` + `cursor-conformance.ts`
prövar `pageSize=2` → [2,2,1], opak cursor, terminering och exakt ordning.
`get-person.staging.test.ts` prövar 404 vid okänt ID, 400 vid saknat id,
noll-trunkering över chunk-gräns och datum-desc.

**Mot fixturens resolvers: nej, och de har redan glidit.**
`resolvePersonsResponse` och `resolvePersonResponse` är en **andra
implementation** av EF-beteende. Fjorton konkreta skillnader identifierade;
de fem allvarligaste:

| # | Skillnad | EF | Fixtur |
|---|---|---|---|
| D1 | Ogiltig cursor | `400 Invalid cursor` | **200 + sida 1** (fail-open) |
| D3 | Ogiltig filter-input | `400 Invalid filter input` | 200 med tom lista |
| D4 | `pageSize` utanför intervall | klämmer till 1 resp. 100 | ger 10 |
| D9 | Okänt person-ID | `404 Person not found` | **200 med tom kropp** |
| D2 | Sökterm med inledande blanksteg | ingen trim → noll träffar | `.trim()` → full träff |

D1 har ett extra lager: envelope-formatet är *identiskt* (`base64({"o": …})`)
men fixturens token är ett radindex medan EF:ens är Airtables offset-sträng. En
äkta EF-cursor mot fixturen ger `parseInt → NaN` → sida 1, tyst.

**Ingenting jämför resolvern med EF:en.** De tre acceptance-testerna för
personer överskuggar dessutom resolvern med egna mockar — `persons-list` bär en
**tredje** imitation av samma EF med hårdkodade cursors utan envelope. Det enda
som pinnar resolvern är en screenshot, alltså fixturen mot sig själv.

## 5. Kan MSW-handlers och fixture-data glida utan att CI upptäcker det?

**Ja, på fem oberoende sätt.** Kontraktsvaktens faktiska räckvidd:

| Dimension | Täckning |
|---|---|
| Fixturhandlers | **3 av 7** (`get-events`, `get-registrations`, `get-event-notes`) |
| Edge Functions adaptern anropar | **3 av 24** |
| Djup | **Endast toppnivå** — nästlade objekt profileras aldrig, och zod strippar okända nästlade nycklar tyst (inget schema använder `.strict()`) |
| Null-blindhet | Typjämförelse är avstängd för nycklar som är null på någon sida: **29 av 32** registreringsfält, **21 av 27** eventfält |
| Ordning · antal · paginering · datumformat | **Prövas inte alls** |

Därtill:

- **Kuvertets syskonnycklar jämförs aldrig.** `nextCursor` kan byta namn eller
  försvinna utan larm.
- **Per-post-närvaro räknas men jämförs aldrig** — ett fält som går från 43/43
  poster till 1/43 ger noll avvikelser. Detta är den **enda blindfläck som inte
  är bokförd någonstans**; övriga står öppet i larmets egen *"VAD VAKTEN INTE
  SER"*.
- **`get-registrations` bevakas bara i sin event-lösa gren**, alltså aldrig med
  personberikningen — inklusive kontraktets enda nästlade array, `kurshistorik`.

**Urvalet valdes på anropsvolym, inte på kontraktsrisk** (`kontraktsfall.ts:14-35`).
`get-person` har ett anrop och står i den uttalat obevakade svansen — och det är
där den verifierade produktionsdefekten sitter.

## 6. Minsta testlager som stänger risken

Ordnat efter effekt per krona. Inget av detta gör den hermetiska sviten
långsammare — allt utom lager 3 bor i nattkörningen.

**Lager 1 — utöka `KONTRAKTSFALL` till alla sju handlers.** Fyra GET till i
nattjobbet, alltså sekunder. Ingen ny mekanism, bara fler poster i en befintlig
lista. **Hade fångat `TASK-52` första natten.** Detta är den enskilt största
riskreduktionen i hela kartläggningen.

**Lager 2 — låt vakten pröva felkontrakten, inte bara happy-path.** Statuskoder
och felkroppar är kontrakt precis som svarsformen: `404` vid okänt ID, `400` vid
ogiltig cursor och ogiltig filter-input. Kräver att vaktens fall kan bära
förväntad statuskod, vilket i dag är hårdkodat till 200
(`kontraktsjamforelse.ts:195-206`).

**Lager 3 — bind fixturraderna till schemat vid kompilering.** Redan mintat som
`TASK-63`: 0 av 18 acceptance-filer typar med `z.infer`, 17 av 18 använder
`Record<string, unknown>`. Flyttar fångsten av en glidande fixtur från natten
till presubmit.

**Lager 4 — dual-run för resolvers.** Ett kontraktstest som ställer samma frågor
(sökning, sidstorlek, cursor, okänt ID) till både resolvern och den skarpa EF:en
och jämför svaren. Dyrast, och enda sättet att fånga *beteende*-drift — vakten
jämför form och kan per konstruktion inte se D1–D14.

**Vad som INTE behövs:** fler skarpa e2e-tester (de är dyra och redan till 90 %
mockade), och att göra acceptance-sviten mindre hermetisk (det vore att riva
A5:s hela vinst).

## Osäkerheter, öppet deklarerade

- **Airtables sorterings-kollation** är inte verifierad någonstans i repot.
  Fixturen kör `localeCompare(…, 'sv')`, EF:en delegerar till Airtable.
  Skillnaden i mekanism är belagd, magnituden inte. Osynlig i dag eftersom alla
  17 fixturnamn börjar på A–P.
- **`ARRAYJOIN`-separatorn** för ort-sökning är antagen (`", "` per API-dok),
  inte mätt mot vår bas.
- **Airtable-offsetens beteende vid exakt jämn sista sida** är oexercerat på
  båda sidor.
- **Hermetik-mätningen är en ögonblicksbild**, inte en invariant.
  `.hermetik/rapport.jsonl` är gitignorerad och två av de kvarvarande
  e2e-filerna ändrades efter mätningen.
- **Prod-allowlisten** (`.prod-functions-allowlist.conf`) listar 13 av 24
  EF:er. De skarpa testerna mäter staging; vad som faktiskt är deployat i prod
  kontrollerades inte i detta läs-pass.

## Relaterat

- [ADR-080](../decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
  beslut 3 — kontraktsvakten som villkor för hermetiseringen
- [`airtable-constraints.md`](../reference/airtable-constraints.md) P26/P27 —
  varför den skarpa restmängden måste dela en långlivad miljö
- `TASK-52` — den live-verifierade defekten i vaktens blindfläck
- `TASK-63` — fixturrader utan kompileringstidsbindning (lager 3 ovan)
