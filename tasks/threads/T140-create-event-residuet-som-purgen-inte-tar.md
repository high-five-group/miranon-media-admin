---
owner: marcus803
updated: 2026-08-10
review_by: 2026-11-10
status: stable
lifecycle: paused
---

# T140 — `ZZ-create-event-test`-residuet som purgen inte tar

> Uppstod som sidofynd under S103:s carry 1-utredning (bas-filtret kontra
> cursor-testet), 2026-08-10. Triagerad enligt `ADR-053`: blockerar inte
> pågående arbete, men är för värdefull för att förkastas.

## Vad som är MÄTT

Live-läsning av staging-basen (`apphjj8Q7lkXCMsL4`, tabell Eventplanering
`tblVE3UKWl1CKrphV`) 2026-08-10:

- **69 event** med exakt `Ort = 'ZZ-create-event-test'`
- **2 event** med `Ort = 'ZZ-create-event-test-uppdaterad'`
- Samtliga bär `Antal anmälda: 0` och `Antal anmälningar: 0`

Purge-policyn HAR en target för dem — `.purge-staging-policy.json`,
`create-event-sentineler`: `filterByFormula: "{Ort} = 'ZZ-create-event-test'"`,
`exactMatchPattern: "^ZZ-create-event-test$"`, `linkGuard: true`,
`linkGuardExcludeFields: ["Eventtyp"]`.

Setup-purgen körs före varje staging-CI-jobb. Ändå ligger residuet kvar.

## Varför det troligen växer

`docs/research/staging-fixturinventering-2026-08-10.md` räknade samma morgon
**52 rader i HELA Eventplanering**. Några timmar senare är residuet ensamt 71.
Det pekar mot ackumulation per staging-CI-körning, inte mot en engångshög.

Talen är dock inte samma mätning: inventeringen räknade hela tabellen, denna
tråd räknade en filtrerad delmängd. Att inventeringens totalsiffra är LÄGRE än
delmängden några timmar senare är ändå oförenligt med ett stillastående
tillstånd.

## Hypotesen — OBEVISAD

`linkGuard: true` hoppar över poster som bär länkar till andra tabeller.
`Eventtyp` är redan undantagen. Hypotesen är att eventen bär någon ANNAN länk
(`Sessionsmall`, `Anteckningar`, `Bilagor`, `Event (source)`, `Touchpoints` …)
som får guarden att fälla, varvid raden hoppas över permanent.

**Detta är inte mätt.** Vad som är mätt är residuet, inte orsaken. Nästa steg är
att läsa en av de 69 raderna i sin helhet och se vilka länkfält som faktiskt är
ifyllda — inte att anta att guarden är boven.

## Besläktad, redan bokförd lucka

Inventeringen (rad ~119–127) beskriver en purge-läcka för
`ZZ-create-event-test-uppdaterad`: `exactMatchPattern` är ankrad i båda ändar,
så `-uppdaterad`-varianten matchar aldrig. Det förklarar 2 av 71 rader — inte
de 69 som matchar mönstret exakt.

## Varför den inte åtgärdas nu

Blockerar ingenting. Residuet är syntetiskt, ligger i staging, och rör varken
prod eller någon assertion. Att laga purge-mekaniken utan att först mäta
orsaken vore att gissa — och en felaktig lagning av en RADERANDE mekanism är
dyrare än residuet den skulle städa.

## Angränsande beslut som INTE får göras av misstag

`ZZ-GRANSKNING-*` får aldrig bli purge-bar (`CLAUDE.md` § Granskningsdata).
Den raden och denna tråd handlar om olika klasser med motsatta rätta svar —
gör inte analogin.
