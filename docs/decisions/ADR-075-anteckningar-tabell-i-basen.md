# ADR-075: Anteckningar-strömmen — additiv tabell i basen med server-satt författar-attribution

- Status: Accepted
- Datum: 2026-07-23
- Fas: 6 (task-18.11, eventsidan till S73-facit)

## Kontext

S73-facitet (K66–K71) låser eventsidans sista grupp: **Anteckningar** — en
tidsstämplad ström (composer överst, nyast först) där varje anteckning bär
*författare* och *tidpunkt*, och en fas-etikett (Under/Efter eventet) HÄRLEDS ur
tidpunkten mot eventets dagar. Marcus-kravet (K66) är ordagrant att anteckningar
sparas "som kommentarer så man ser **när** den är gjord och **av vem**". "Av vem"
— attributionen — är kravets kärna: Roger och Lotta måste kunna se vem som skrev
vad.

Basen bär idag `Eventplanering.Notering` (fld5Tb1opD3VCJMe7) — EN fritext-yta per
event, inte en ström, utan författare eller per-post-tidsstämpel. Den bär alltså
inte modellen. Två vägar prövades vid konvergensen (K66, live-verifierat
2026-07-20) och låstes vid skivan:

- **Väg A — Airtable record comments** på event-recorden (nativ författare +
  createdTime via comments-API:t).
- **Väg B — en additiv `Anteckningar`-tabell** (text + författare + Event-länk +
  createdTime), ADR-063-formen.

Marcus kvitterade vägvalet 2026-07-21: **väg B**. Beslutet är över ADR-baren —
(1) svårt att återställa (tabell-form + attributionsmodell blir data-kontrakt som
UI, EF:er och framtida Supabase-migration alla vilar på), (2) överraskande utan
kontext (varför en ny tabell när Airtable har nativa kommentarer?), (3) resultatet
av en verklig avvägning (attribution vs. nativ enkelhet) — och mintas därför som
egen ADR, refererad från PRD-kortet (task-18 beslut 13), aldrig inline.

## Beslut

**1. En additiv `Anteckningar`-tabell skapas i STAGING** (ADR-063 + ADR-050;
staging tbl87a23xDv19Mb6R, skapad 2026-07-23) med tre skrivbara fält, plus
Airtables nativa `createdTime`:

| Fält | Typ | Roll |
|------|-----|------|
| `Författare` | singleLineText (primär) | Vem som skrev anteckningen |
| `Anteckning` | multilineText | Texten (flerradig) |
| `Event` | multipleRecordLinks → Eventplanering | Vilket event |
| *(createdTime)* | Airtable-nativt | Tidpunkten (server-sanning) |

Skrivbarheten LIVE-VERIFIERADES (create + läs-tillbaka + radera) INNAN
allowlist-posten låstes (L294). Den omvända länken på Eventplanering heter
`Anteckningar` (fld5ExUmcDPtUnUiM, auto-skapad).

**2. Attributionen sätts SERVER-SIDE ur den inloggade användarens VERIFIERADE
identitet** — aldrig klient-buren. `create-event-note`-EF:en gatar auth
(requireUser), läser sedan `user_metadata.display_name` ur den redan verifierade
JWT:ns payload (base64url + UTF-8-säker avkodning — svenska namn manglas aldrig),
och sätter `Författare` = display_name → e-post → user-id (så fältet aldrig blir
tomt). Klienten skickar ENDAST `{ eventId, text }`.

**3. Läs- + skriv-EF:er i operations-mönstret** (ADR-066-formen):

- `get-event-notes` (läs): eventets omvända `Anteckningar`-länk → record-ID-batch
  (get-attendance-mallen, T15-säker: aldrig länkfält-filter) → domän-shape →
  sorterad nyast först server-side.
- `create-event-note` (skriv): server-byggd fält-shape + allowlist-SSOT-grind
  (`field-allowlists.ts`, deny-by-default), 404 på okänt event, deny-empty på text.

**4. Tidpunkten är Airtables `createdTime`** (server-sanning, aldrig ett skrivet
fält). Fas-etiketten (Under/Efter/omärkt) härleds KLIENT-side ur tidpunkten mot
eventets datum (tysta normen: Innan är omärkt, K67) — lagras aldrig.

**5. Ingen idempotensnyckel.** En anteckning saknar affärs-unikhet (två identiska
"Ringde igen" är båda giltiga), så en server-idempotensgrind utan lagring
(ADR-059) vore teater. Klient-sidans dubbel-submit-skydd (mutationKey-dedup +
disabled-knapp under in-flight) bär interimet.

## Alternativ som övervägdes

- **Airtable record comments (väg A) — FÖRKASTAD på attributionen.** Airtables
  comments-API bokför varje API-skriven kommentar på **token-ägaren** (PAT/service-
  identiteten), inte på den inloggade appanvändaren. Alla anteckningar hade då
  attribuerats till samma bot-identitet — "av vem" (K66:s kärna) hade fallit, och
  Roger kunde inte skiljas från Lotta. Äkta per-användar-attribution via record
  comments kräver att varje användare autentiserar mot Airtable direkt (finns inte
  i appen). Nativ createdTime/författare är alltså en chimär för vårt skrivmönster.
- **Återanvänd `Eventplanering.Notering` — FÖRKASTAD.** EN fritext-yta bär inte
  ström-modellen (ingen per-post författare/tidsstämpel); att lappa in en ström i
  ett textfält är exakt anti-mönstret ADR-063 river.
- **Klient-buren författare — FÖRKASTAD.** Att låta klienten skicka `forfattare`
  vore spoof-bart. Server-side-härledning ur den verifierade JWT:n är strikt
  starkare (samma server-side-truth-disciplin som create-registration/create-event
  bygger sina fält-shapes med) och kräver ingen ny betrodd klient-yta.
- **Utöka `requireUser` att returnera display_name — FÖRKASTAD (yta).** `auth.ts`
  är delad, immutabilitets-känslig `_shared`-yta; en JWT-payload-läsning lokalt i
  create-event-note (claimen är redan signatur-verifierad av requireUser) ger samma
  resultat utan att bredda den delade auth-kontraktsytan.

Branschprecedent: CRM-notes-klassen (HubSpot/Pipedrive/Attio) — composer överst,
nyast först, en post per anteckning med författare + tidsstämpel — är det etablerade
mönstret för "objektets minne"; anteckningar är minnesstöd, inte konversation
(GitHub/Linear-ordningen äldst-först gäller dialog). Attributions-fällan (API-
klienter attribueras till token-ägaren) är dokumenterad Airtable-mekanik.

## Konsekvenser

- **Bas-ändringen är ADDITIV och staging-först** (ADR-063/ADR-050). PROD-tabellen +
  prod-EF-deployen är en SEPARAT Marcus-auktoriserad handling (DoD #7; tabell FÖRE
  EF, per miljö — samma ordning som `Idempotensnyckel` / `Bor över`). Tills dess är
  api-conformance-sviterna (`create-event-note`/`get-event-notes`) deploy-gatade.
- **Författaren visas som display_name** — Gunilla-läsbart namn (matchar facitets
  "Lotta"/"Roger"), aldrig en e-postadress i normalfallet. Fallback till e-post/
  user-id gäller endast ett felkonfigurerat konto (surface:ar misskonfigurationen
  hellre än att dölja den).
- **Tabellen blir en del av basen-som-leverabel** (ADR-063): den maxas och blir
  mall-material i Passionslyftet, inte ett provisorium.
- **Supabase-migrations-spåret** ärver en ren shape (text + författare + created +
  event-referens) — en rak `event_notes`-tabell utan lappade fält.
- Läs-EF:en är kopplad till den omvända länkens NAMN (`Anteckningar`) — samma
  namn-koppling som get-attendance (`Närvaro (records)`), accepterad precedent.

## Tillägg (additivt) — 2026-08-10 (S103, T97-bygg-spåret)

Tabellen UTÖKAS med ett andra länkfält: `Person` (multipleRecordLinks →
Personer; staging `fldXvBRt7OE9tem4o`, prod `fldJiWGXe2Hv612H0` — NYTT, LIVE-
VERIFIERAT via `describe_table` mot BÅDA baserna). Persondetaljens
antecknings-ström (`get-person-notes`/`create-person-note`) återanvänder
SAMMA tabell och SAMMA attributionsmodell som event-strömmen ordagrant —
ingen ny ADR mintas, eftersom besluten den skulle fatta redan är fattade här
(tabell-form, attributionsvägvalet). Detta är den formen ADR-BAR-regeln
föreskriver för en mekanisk utökning av ett redan avgjort mönster.

**Invarianten (kritisk, mekaniskt testad):** en rad bär `Event` ELLER
`Person`, ALDRIG BÅDA. `create-event-note`/`create-person-note` sätter var och
en STRUKTURELLT bara sitt eget länkfält — ingen av dem nämner det andra fältet
i sin `fields`-map, så invarianten går inte att bryta via klient-input.
`get-event-notes`/`get-person-notes` läser var och en bara record-ID:n ur SIN
EGEN sidas omvända länk (batch-join, aldrig ett tabell-scan), vilket gör
läckage strukturellt omöjligt snarare än något som råkar hålla. Bevisat i
`tests/api/notes-event-person-isolation.staging.test.ts` (skapar en ren
person-anteckning och verifierar att den inte dyker upp i ett events ström,
och tvärtom).

**Namn-kollisionen på Personer-sidan, värd att minnas:** Airtable auto-namnger
en omvänd länk efter käll-tabellen (`Anteckningar`) — men Personer bar REDAN
ett fält med det namnet (`fldWGlNr3ujRHo85w`, det gamla odelade fritext-fältet
från Fas 6a). Kollisionen löstes av Airtable genom att döpa den NYA omvända
länken **`Anteckningar 2`** (staging `fldgz1pFKGs0a3np0`, prod
`fldkEnLpYjB9tsAtQ`, LIVE-VERIFIERAT). `get-person-notes` läser alltså
`Anteckningar 2`, inte `Anteckningar` — att anta det senare hade tyst gett en
tom lista (fel typ, ingen krasch) i stället för ett fel. Samma "anta aldrig
fält-form"-fälla `data-model.md` varnar för generellt, instansierad här.

**Två ytor lever BREDVID varandra på Personer, medvetet:** det gamla
`Personer.Anteckningar`-fältet (`update-person-note`, `PersonNoteEditor`) och
den nya strömmen. Migrering av det gamla fältets innehåll till strömmen är EN
SEPARAT, senare Marcus-beslutad handling — inte en del av denna utökning.

**Miljöstatus (S103-bygget):** Person-fältet finns i BÅDA baserna (prod
inkluderat — Marcus GO 2026-08-10 gällde båda). `get-person-notes`/
`create-person-note` samt den omdeployade `update-record` (nya
`update-person-flag`-operationen, se `field-allowlists.ts`) är STAGING-
deployade och conformance-bevisade (`tests/api/get-person-notes.staging.
test.ts`, `create-person-note.staging.test.ts`,
`notes-event-person-isolation.staging.test.ts`). PROD-EF-deploy av de två nya
funktionerna är, precis som event-strömmens ursprungliga våg, en SEPARAT
Marcus-auktoriserad handling — ingen UI-yta konsumerar dem ännu.
