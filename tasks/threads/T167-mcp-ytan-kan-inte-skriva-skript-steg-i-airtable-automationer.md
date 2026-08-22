---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-21
status: stable
lifecycle: closed
---

# T167 — MCP-ytan kan inte skriva skript-steg i Airtable-automationer

> Registrerad i S110 (2026-08-21) när `TASK-284.2` blockerades. **`active`,
> inte `paused`** — den blockerar den bärande skivan i `TASK-284`-familjen
> och väntar på Marcus väg-beslut.

## Vad som är blockerat

`TASK-284.2` — vakten i A1:s matchningssteg — kräver att ett **skript-steg**
(`customScript`) ersätter automationens `findRecords` + `updateRecord`.
`ADR-122` beslut 5 låste den hemvisten: vakten bor i A1, som skript-steg.

Ytan kan inte skriva den noden.

## Mätningen

**Bygg-agentens live-försök:** `mcp__claude_ai_Airtable__update_automation`
avvisade `customScript` med `isValid:false` / `readOnlyNodeType`.

**Orkestrerarens oberoende kontroll** (`get_create_automation_instructions`
mot `apphjj8Q7lkXCMsL4`, 1 618 rader): `customScript` förekommer **inte
någonstans** i dokumentet — varken i den kuraterade katalogen, i
"Available but not yet fully supported nodes", eller i "Exists but not
creatable here" (den listan bär `slackSendActionableMessage`,
`googleSheetsCreateRow`, `googleFormsCreateResponse`,
`salesforceCreateRecord`, `salesforceUpdateRecord`, `googleDocsUpdateDoc`).

Agentens rapport sade att typen stod i två av listorna. Den står i ingen —
slutsatsen blir starkare, inte svagare.

**Ingen deploy-väg heller.** Instruktionsdokumentets egen text: *"the
automation is off... tell the user to open the automationUrl in the Airtable
UI"*. Ytan kan läsa `deploymentStatus` men inte ändra det.

## Vad som INTE är blockerat

- **Skriptets logik är byggd och bevisad**, incheckad som
  `docs/reference/automation-scripts/a1-eventmatchning-vakt.js` (AC 7, den
  enda uppnådda). Bevisad i båda riktningar i en Node-`vm`-sandbox mot
  LIVE-hämtade fältvärden från `TASK-284.1`:s permanenta fixturer: fäller på
  verklig avvikelse, fäller INTE på de tre formateringsklasserna, fäller
  INTE på tomt jämförelsefält, och lämnar expressgrenen orörd.
- **A1 är oförändrad.** `deploymentStatus: undeployed`, samma tre noder,
  verifierat av orkestreraren med egen `get_automation` efter agentens
  misslyckade skrivförsök.
- De tre andra skivorna (`284.1`, `284.3`, `284.4`) är landade och stängda.
  Synlighet, kö och resolution fungerar — det som saknas är att felet stoppas
  vid källan.

## Vägvalen — Marcus avgör

1. **Marcus klistrar in skriptet i Airtable-UI:t** och deployar A1 i staging.
   Agenten verifierar därefter ände-till-ände och skivan stängs normalt.
   Billigast, och skriptet är redan skrivet och bevisat.
2. **Omklassa `284.2` till `ready-for-human`** och foga in A1-ändringen i
   `284.6`:s prod-utrullningssekvens (där A1-ändringen redan står SIST och
   är Marcus moment). Då blir staging-verifieringen en del av samma manuella
   pass.
3. **Byt hemvist för vakten** — bort från A1, till en Edge Function eller
   annan yta som ytan kan skriva. Det river `ADR-122` beslut 5 och kräver
   omprövning av fail-closed-egenskapen: A1 kör vid varje radskapande, en EF
   gör det inte.

Väg 3 är den enda som ändrar designen och bör inte väljas för att verktyget
är obekvämt. Väg 1 och 2 skiljer sig bara i NÄR det manuella momentet sker.

## Vad detta INTE är

Detta är **ingen Airtable-plattformsvägg** och hör därför inte i
`airtable-constraints.md`. Airtables UI kan skapa skript-steg utan problem;
det är vår MCP-verktygsyta som saknar noden. Klassen är verktygsfakta, inte
migrations-kravspec.

## Besläktat

- `ADR-122` beslut 5 — vakten bor i A1, som skript-steg.
- `T164` — en research-fork deployade en EF till staging utan mandat.
- `T162` — två sessioners agenter muterar samma staging.

## Hur tråden stängdes (2026-08-22)

**Väg 1 valdes och genomfördes två gånger** — Marcus klistrade in
`docs/reference/automation-scripts/a1-eventmatchning-vakt.js` i Airtables
UI, först i staging (S110 Del 7, 2026-08-22) och sedan i prod (Del 11 samma
dag). Mätningen som grundade tråden står fast och breddades i Del 7: tre
former prövades (skapa · uppdatera befintlig nod med bevarad key ·
placering), samtliga `readOnlyNodeType` — ingen skrivning skedde.

Vad som är värt att ta med:

1. **Verktygsytans gräns är stabil, inte en bugg att vänta ut.** Skrivverktygets
   schema listar `customScript` bara för att kunna läsa befintliga noder —
   dess egen feltext säger det. Nästa skriptsteg planeras med UI-vägen från
   start, inte som fallback.
2. **UI-vägen har två mätta fällor** (Del 7 § B): input-variabler skapas bakom
   `< > Edit code`, inte i Properties-panelen, och namnet är skiftlägeskänsligt
   (`anmID` ≠ `anmId`). En tredje mättes i prod (Del 11): Airtables "Test"
   på skriptsteget återanvänder en **cachad trigger-rad** som kan vara
   raderad — `Anmälan not found` är då testdatat, inte skriptet.
3. **Verifiera deployen via API, inte via UI:t.** `get_automation` visar
   nodkey, inputObj-mappningen, deploymentStatus och skriptet ordagrant —
   det var så prod-bytet bevisades korrekt trots det röda UI-testet.

Kvar, bokfört på `TASK-293`: nästa ändring av vaktskriptet tar samma UI-väg
i båda baserna.
