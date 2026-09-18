---
id: TASK-455
title: >-
  Svepet får bilagor — bilageväljare per eventgrupp i Hem-vyns sändyta (Bekräfta
  alla, Påminnelse till alla, Eventinfo)
status: To Do
assignee: []
created_date: '2026-09-18 10:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-452
references:
  - docs/research/utskicksytan-karta-och-historik-2026-09-18.md
  - tasks/sessions/bilagor/s102-svep-konvergens/facit.json
priority: high
ordinal: 796000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problemet (Marcus 2026-09-18, ordagrant)

"Jag ser ett stort problem med bulkåtgärderna på hemvyn [...] kan ju inte använda dessa funktioner i nuläget eftersom det inte går att lägga till bilagor till varje utskick. Detta är ju ett stort problem. [...] För bilagor måste ju gå att lägga till eller hur?" — och efter underlaget: "GO på bilageväljaren i svepet."

## Vad som är mätt

- Aldrig diskuterat tidigare: TASK-147.5 (bilagekontraktet) landade 2026-08-10, sveparna (task-241, ADR-114) föddes 2026-08-16; ADR-114 har 0 träffar på "bilag". Genuin lucka, inget fattat beslut.
- Brottet sitter i KLIENTENS sändyta: `SendActionEmailInput` bär `attachmentIds` och EF:en väljer bilage-grenen själv (`_shared/send-action-email.ts:483–496`); `src/data/mutations/svepSend.ts:64–138` sänder redan ETT anrop per eventgrupp men har 0 förekomster av `attachmentIds`; inget i `SvepOverlay.tsx`/`Forhandsvisning.tsx`/`Adresslista.tsx` samlar in ett bilageval.
- Väggar: Resends batch-ändpunkt tappar bilagor TYST (ADR-067 D9) → bilage-bärande utskick går loopat; ~200 mottagare innan loopen kostar på riktigt (ADR-120, kö byggs vid mätt behov — INTE här); en bilaga måste höra till det sändande eventet (`send-action-email/index.ts:304–305`) → valet är PER EVENTGRUPP, aldrig globalt för hela svepet.

## Form

Sändytan är LÅST FACIT (`s102-svep-konvergens`, stämplad 2026-08-16). Arbetet går därför som konvergens på den befintliga ytan (prototyp-skillens UI-gren: start = exakt kopia av faktiska vyn, ADR-103 promoveringskontraktet), Marcus stämplar, facit amenderas — aldrig en tyst ändring av stämplad yta (ADR-102). Återbruka åtgärdssidans `BilageValjare` (`AtgardsSida.tsx:1067–1196`) och `fetchEventAttachments(eventId)`; bryt ut till delad komponent hellre än kopia (tre utskicksytor saknar redan delad kod — gör inte en fjärde). Ingen förvalslogik (samma regel som åtgärdssidan).

## Utanför omfattningen

Köad jobbmotor för stora utskick (ADR-120-tröskeln) · "mallen bär sina bilagor" (hör till mallväljar-grillningen, S127 punkt 3) · redigerbar text i svepet · SegmentMailCompose.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje eventgrupp i svepet visar sin egen bilageväljare med eventets tillgängliga bilagor (inkl. gemensamma, när TASK-452 landat); inget förval
- [ ] #2 svepSend skickar attachmentIds per eventgrupp; en grupp utan valda bilagor går batch-vägen som i dag (ADR-067 D9 oförändrad)
- [ ] #3 Rött-först: test som visar att ett svep med vald bilaga i dag sänder utan attachmentIds; grönt efter fix. API-test mot staging: mottagaren får bilagan (mail-låset respekterat — sentinel-adress)
- [ ] #4 Granskningssteget visar per grupp vilka bilagor som följer med, och att bilage-bärande grupper tar längre tid (loopad sändning) — begripligt för Lotta utan teknisk förklaring
- [ ] #5 Tillgänglighet 11: tangentbord, skärmläsare, prefers-contrast, reduced-motion; aria-mönstret följer åtgärdssidans väljare
- [ ] #6 Marcus stämplar formen i dev-server/staging; facit-manifestet s102-svep-konvergens amenderas med nya bilder (ADR-102/ADR-104) — landning sker först efter stämpeln
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
