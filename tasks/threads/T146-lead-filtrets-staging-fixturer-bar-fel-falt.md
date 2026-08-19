---
owner: marcus803
updated: 2026-08-19
review_by: 2026-11-19
status: stable
lifecycle: closed
---

# T146 — `get-leads`s nya filter fäller tre staging-tester vid deploy: fixturerna bär fel fält

> Registrerad i S107 (2026-08-19) ur `TASK-277`s bygge. Triagerad enligt
> `ADR-053`: blockerar inte bygget — koden är korrekt och PR:en kan landa —
> men den **blockerar nästa staging-deploy** av `get-leads`. Fyndet gjordes
> FÖRE deploy: bygg-agenten kontrollerade om det var säkert i stället för att
> anta att det var det.

## Vad som är MÄTT

`TASK-277` AC #6 pekade om `get-leads`s `LEAD_FILTER`:

```text
FÖRE:  AND({Antal hämtningar} > 0,                        {Antal anmälningar (totalt)} = 0)
EFTER: AND({Totalt antal hämtningar (erbjudande)} > 0,    {Antal anmälningar (totalt)} = 0)
```

Skälet är fälla 47: `Antal hämtningar` är `COUNTA({Engagemang})` och räknar
rader i aggregeringstabellen, inte hämtningar.

**De permanenta staging-fixturerna faller ur det nya filtret.** Mätt
read-only mot staging (`apphjj8Q7lkXCMsL4`, Airtable-MCP, 2026-08-19):

| Fixtur | `Antal hämtningar` | `Totalt antal hämtningar (erbjudande)` | Överlever nya filtret? |
|---|--:|--:|---|
| `ZZ-Lead-person-01` | > 0 | **0** | **Nej** |
| `ZZ-Lead-person-02` | > 0 | **0** | **Nej** |

Båda bär en länkad `Engagemang`-rad men **ingen `Touchpoints`-rad**. Det är
exakt den divergens fälla 47 och fälla 50 beskriver — men inbyggd i själva
testdatan.

## Varför det är intressantare än en trasig fixtur

Fixturerna byggdes mot det fält som visade sig vara fel. De är alltså inte
"gamla" — de är **korrekt byggda mot en felaktig premiss**, och de har
verifierat lead-ytan mot den premissen sedan de skapades. Testdata som ärver
en produktionsdefekt gör defekten osynlig i precis den grind som finns för
att fånga den.

## Konsekvens om inget görs

En deploy av `get-leads` till staging fäller **tre tester** i
`tests/api/get-leads.staging.test.ts`. Det är inte ett trädfel — det är
grinden som korrekt rapporterar att fixturerna inte längre matchar filtret.

## Åtgärd — VIDTAGEN och verifierad (2026-08-19)

Två `Touchpoints`-rader skapade i staging (`tbl22SCvlHrgcAiZi`), en per fixtur:

| Touchpoint | Person | `Typ` | `Erbjudande` | `Datum` |
|---|---|---|---|---|
| `recL21qSD7lcZoxoL` (ID 980) | `ZZ-Lead Person 01` | Angett e-post för att ta del av ett erbjudande | Meditationen Kraftfältet | 2025-11-25T18:45:00Z |
| `recQiquDjgSnZSX6H` (ID 981) | `ZZ-Lead Person 02` | Angett e-post för att ta del av ett erbjudande | Meditationen Kraftfältet | 2025-11-25T18:45:00Z |

**Samma datum på båda med avsikt.** `get-leads.staging.test.ts`s cursor-walk
är uttryckligen ordnings-agnostisk med motiveringen *"båda fixturer saknar
interaktionsdatum"*. Olika datum hade gjort ordningen deterministisk och
tyst ändrat en förutsättning testet vilar på; identiska datum bevarar den.

Båda raderna bär ett `Metadata`-fält som förklarar varför de finns och att de
inte får röras.

**Verifierat efter skrivningen** (samma filter som `get-leads` nu kör):

```text
AND({Totalt antal hämtningar (erbjudande)} > 0, {Antal anmälningar (totalt)} = 0)
```

| Fixtur | `Antal hämtningar` | `Totalt antal hämtningar (erbjudande)` | Överlever filtret? |
|---|--:|--:|---|
| `ZZ-Lead Person 01` | 1 | **1** | **Ja** |
| `ZZ-Lead Person 02` | 1 | **1** | **Ja** |

`Alla hämtningar` blev `"Meditationen Kraftfältet (2025-11-25)"` på båda, och
`Senaste interaktion (text)` blev `"Hämtade Meditationen Kraftfältet"` — alltså
exakt den form de 33 riktiga leadsen i prod bär.

**Fixturen är nu robust mot BÅDA filtren:** `Antal hämtningar` är kvar på 1
(`Engagemang`-raden rördes inte), så varken den gamla eller den nya formeln
tappar den. Det gör också att `TASK-278`s ompekade VISNINGSfält (`antalHamtningar`
från rollupen) ger 1 — testets `antalHamtningar ≥ 1` håller i båda världar.

**Ingen kod ändrad.** Varningskommentaren i `tests/api/get-leads.staging.test.ts`
lämnades kvar med avsikt: den beskriver varför fixturerna ser ut som de gör, och
det är fortfarande sant.

## Ursprunglig åtgärdsbeskrivning (före verkställighet)

Ge `ZZ-Lead-person-01` och `-02` **en `Touchpoints`-rad vardera** i staging,
så att rollupen blir > 0 och fixturerna åter representerar en verklig lead.
Det är en **data**-ändring i staging-basen, inte en kodfix, och ligger
utanför `TASK-277`s mandat — därför registrerad här i stället för löst i
förbifarten.

Alternativet — att lätta på filtret så fixturerna passerar — vore att göra
produktionskoden fel för att blidka testdata. Det görs inte.

## Belägg

- PR [`#1614`](https://github.com/high-five-group/miranon-media-admin/pull/1614)
  — `TASK-277`s bygge
- Varningskommentar i `tests/api/get-leads.staging.test.ts` (satt av
  bygg-agenten i samma PR)
- Fälla 47 + fälla 50 i `docs/reference/data-model.md`
