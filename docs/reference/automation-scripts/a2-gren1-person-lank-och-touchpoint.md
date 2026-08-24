# A2 Gren 1 — Person-länk och touchpoint även för namnlösa personer

> Syfte: den exakta ändringsspecifikationen för A2:s Gren 1, mätt mot
> automationens FAKTISKA nodstruktur i staging (`apphjj8Q7lkXCMsL4`,
> automation `wflRPMp5QNGEa7wH1`) 2026-08-24. Utförd i staging via
> MCP-ytan under `TASK-229.1`. Prod-utrullningen görs INTE här — den är
> `TASK-229.3` och följer § Prod-utrullning nedan.
>
> Rotorsaken kartlades i S112:s `TASK-229`-utredning. Registret som bär
> defekten: [`../data-model.md`](../data-model.md) § Kända fällor
> (A2:s grenordning, F.1 Backfill-flödet).

## Vad felet var, i klartext

När någon anmäler sig kör automation A2. Den letar upp personen i
personregistret och ska göra tre saker: fylla i namnet, koppla anmälan till
personen, och skriva en rad i Touchpoints om att en anmälan kommit in.

Men A2 väljer EN av fyra grenar, och grenarna gjorde olika mycket.

Fanns personen redan med namn valdes **Gren 2**, som gjorde allt. Fanns
personen som en **namnlös lead** — bara en e-postadress, formen A4 skapar när
någon hämtar ett erbjudande — valdes i stället **Gren 1**, som ENDAST fyllde i
namnet. Person-länken sattes aldrig, och ingen touchpoint skrevs.

Följden är en kedjereaktion: `Anmälningar.Person` styr automation A3
(förskapa deltaganden), som kräver att fältet är ifyllt. Tom länk betyder
inget deltagande, vilket i sin tur betyder att A11 aldrig kedjar vidare.
En anmälan såg alltså komplett ut i formuläret men blev osynlig i resten av
systemet.

## A2:s faktiska nodstruktur (läst live 2026-08-24)

Läst med `mcp__claude_ai_Airtable__get_automation` mot staging. Trigger:
`recordCreated` på Anmälningar (`tbloOcrppVoyrHbrq`).

Två sökningar körs FÖRE grenvalet, och de matchar på OLIKA fält:

| Nod | Typ | Matchar `Personer.E-post` mot |
|---|---|---|
| `wacGpA7qtiHjlwD1x` | findRecords | `fld0CIF2qC7ufa8UD` — Normaliserad e-post |
| `wacmPhj6tKzUl65Wk` | findRecords | `fldVY310IdOIbTkE8` — E-post (råtext) |

`wacmPhj6tKzUl65Wk` bär dessutom villkoret `Förnamn` (`fldx4jrCJDOtWUk4O`)
`isEmpty` — det är den som letar upp namnlösa personer.

Sedan följer conditionalGroup `wdezdzNWaL1MYcrkE` med **fyra** grenar, som
väljer den första vars villkor stämmer:

| # | Grennamn | Villkor | Noder FÖRE ändringen |
|---|---|---|---|
| 1 | Om person utan namn hittades | `length(wacmPhj6tKzUl65Wk.records) = 1` | `wacKY1MLhOdtIXxR7` (namn) |
| 2 | Om personen redan finns | `length(wacGpA7qtiHjlwD1x.records) = 1` | `wacGPdvix9kI22TNq` (länk) + `wacXk240STE9j0Ory` (touchpoint) |
| 3 | Om flera personer hittades | `length(wacGpA7qtiHjlwD1x.records) > 1` | `wac6h6C1Q8oXQzN5U` (Error-log) |
| 4 | Om personen inte finns | `null` (else) | `wacKlSgMwIrOzjE1P` + `wacyh2GuNw8IbUb9K` + `wacDCG3kSmETZg8lj` |

Gren 1 står FÖRST och vinner därför över Gren 2 när båda villkoren skulle
kunna stämma. Det är hela mekaniken bakom defekten.

## Ändringen

Gren 1 får två nya noder EFTER den befintliga namn-uppdateringen. De speglar
Gren 2:s två noder exakt, med en enda skillnad: de refererar
`wacmPhj6tKzUl65Wk` (Gren 1:s egen sökning) i stället för
`wacGpA7qtiHjlwD1x`. Grenarna 2, 3 och 4 rörs inte alls.

Ny nod 1 — `updateRecord` på Anmälningar (`tbloOcrppVoyrHbrq`):

```json
{
  "type": "updateRecord",
  "description": "Koppla anmälan till personen",
  "inputs": {
    "updateRecordMethod": "customFields",
    "tableId": "tbloOcrppVoyrHbrq",
    "rowId": { "template": [{ "$ref": "trigger", "path": ["id"] }] },
    "fields": {
      "obj": {
        "fldQekqRlLfup8x5K": {
          "template": [{
            "fn": "map",
            "args": [
              { "$ref": "wacmPhj6tKzUl65Wk", "path": ["records"] },
              { "fn": "propertyGetter", "args": ["id"] }
            ]
          }]
        }
      }
    }
  }
}
```

Ny nod 2 — `createRecord` på Touchpoints (`tbl22SCvlHrgcAiZi`):

```json
{
  "type": "createRecord",
  "description": "Registrera händelsen i Touchpoints",
  "inputs": {
    "createRecordMethod": "customFields",
    "tableId": "tbl22SCvlHrgcAiZi",
    "fields": {
      "obj": {
        "fldLiC0ZiUAdxXu9u": {
          "template": [{
            "fn": "map",
            "args": [
              { "$ref": "wacmPhj6tKzUl65Wk", "path": ["records"] },
              { "fn": "propertyGetter", "args": ["id"] }
            ]
          }]
        },
        "fldL8gMBzkMHyUoiK": { "obj": { "id": "sel8DlybaDi9slhD3" } },
        "fldcq8oJWTyc8p8dA": {
          "template": [{ "fn": "getWorkflowExecutionIsoDateTime", "args": [] }]
        }
      }
    }
  }
}
```

### Fältkontraktet, verifierat i STAGING

Fält-ID:na kom PROD-mätta ur `TASK-229`-utredningen. Samtliga är verifierade
mot staging-schemat med `get_table_schema` 2026-08-24 — ingen avvikelse:

| Fält | ID | Typ i staging |
|---|---|---|
| `Anmälningar.Person` | `fldQekqRlLfup8x5K` | multipleRecordLinks → Personer |
| `Touchpoints.Person` | `fldLiC0ZiUAdxXu9u` | multipleRecordLinks → Personer |
| `Touchpoints.Typ` | `fldL8gMBzkMHyUoiK` | singleSelect |
| — valet `Inskickad anmälan` | `sel8DlybaDi9slhD3` | choice i fältet ovan |
| `Touchpoints.Datum` | `fldcq8oJWTyc8p8dA` | dateTime |

## Vad som faktiskt utfördes i staging

MCP-ytan KAN skriva dessa nodtyper. Två skrivförsök, båda `isValid: true`:

| # | Vad | Utfall |
|---|---|---|
| 1 | Identitets-skrivning (samma config tillbaka) | `isValid: true`, `actionId: actgdLjzEESRxdHRO` |
| 2 | Ändringen (två nya noder i Gren 1) | `isValid: true`, `actionId: actFYYR7BqQiOwZim` |

Försök 1 gjordes FÖRE ändringen med avsikt: det skiljer "ytan accepterar
nodtyperna" från "ytan skriver troget". Återläsningen var **semantiskt
byte-identisk** med före-läget (normaliserad nyckelsortering, `diff` exit 0) —
alla nodkeys och uttryck bevarade. Först därefter kunde försök 2:s diff
tolkas som ren addition.

Airtable tilldelade de två nya noderna persistenta ID:n:

- `wachkIpvrX0FnbdvB` — updateRecord, Person-länken
- `wacSOcz26EBGzr661` — createRecord, touchpointen

Normaliserad diff före/efter ändringen visar EXAKT tre ändringar och inget
annat: grenbeskrivningen på Gren 1, plus de två nya noderna. Grenarna 2–4 och
de två findRecords-noderna: noll rader i diffen.

`deploymentStatus` var `undeployed` FÖRE och `undeployed` EFTER båda
skrivningarna — **MCP-skrivningar ändrar inte deployment-status.**

## Öppen skuld: ändringen är INTE i drift

Ändringen ligger i A2:s **draft** i staging. Automationen står
`deploymentStatus: undeployed` och kör därför inte alls.

Detta mättes, det härleddes inte ur statussträngen. Två testanmälningar
skapades i staging 2026-08-24 (en mot en namnlös person, en mot en person med
namn). Utfallet:

- Den namnlösa personen fick **inget** namn — alltså körde inte ens Gren 1:s
  BEFINTLIGA namn-steg, det som funnits där hela tiden.
- Motprovs-anmälan mot en person MED namn fick **ingen** Person-länk — och
  Gren 2 är den oförändrade väg som bevisligen fungerar i prod.

Motprovet är det bärande beviset: det är inte de nya noderna som fallerar,
det är A2 som helhet som är avstängd i staging. Samtliga testposter städades
och städningen verifierades (noll träffar efter radering).

**Ytan kan inte lyfta detta.** `update_automation` har ingen
deployment-parameter, och `T167` mätte samma vägg för A1: statusen är läsbar
men inte skrivbar, och instruktionsdokumentets egen text hänvisar till UI:t.
Att slå på A2 i staging är därför ett Marcus-moment.

⚠️ **Att deploya A2 i staging aktiverar HELA A2, inte bara denna ändring.**
Staging är en delad testmiljö (`T162`) — andra sessioners testposter börjar
då trigga person-skapande, länkning och touchpoints. Det är ett medvetet val
att fatta, inte en bieffekt att upptäcka i efterhand.

## Prod-utrullning (TASK-229.3 — görs INTE i detta kort)

Prod-A2 har samma automation-ID (`wflRPMp5QNGEa7wH1`) i
`app8uGPrVCVOm6LfD`. Nodstrukturen antas spegla staging men **ska läsas live
före ändringen** — anta aldrig fält-form eller nod-ID.

Skillnaden mot staging är avgörande: **prod-A2 är `deployed` och kör skarpt.**
En skrivning mot draften påverkar inte live-beteendet förrän någon trycker
Update i UI:t — vilket betyder att ändringen kan förberedas riskfritt, men
också att den inte är klar förrän det momentet gjorts.

Tar prod-vägen UI:t i stället för MCP gäller de fällor `T167` mätte:

1. **Input-variabler VISAS i Properties-panelen men SKAPAS bakom
   `< > Edit code`.** Att fylla i panelen räcker inte.
2. **Namn är skiftlägeskänsliga** — `anmID` är inte `anmId`.
3. **Airtables "Test" återanvänder en cachad trigger-rad** som kan vara
   raderad. Ett rött test kan alltså vara testdatat, inte ändringen.
4. **Verifiera via API, inte via UI:t.** `get_automation` visar nodkeys,
   fältmappning och deploymentStatus ordagrant.

## Mätt sidofynd: sökningarnas e-postaxlar är asymmetriska

De två findRecords-noderna matchar mot olika fält (tabellen ovan):
Gren 2:s sökning mot `Normaliserad e-post` (`LOWER(TRIM(...))`, formelfält),
Gren 1:s mot `E-post` i råtext.

Det betyder att en anmälan vars e-post bär versaler eller kantmellanslag kan
hitta personen på den ena axeln men inte på den andra. Ändringen ovan RÖR
INTE denna asymmetri — den speglar medvetet Gren 1:s egen sökning, så att
länken pekar på exakt den person grenen valdes för.

Asymmetrin är bokförd som eget fynd och inte åtgärdad här: att byta axel
skulle ändra vilka poster Gren 1 alls träffar, vilket är en annan och större
ändring än den detta kort bär.
