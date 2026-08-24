---
id: TASK-213
title: 'PRD: Kontinuerlig bas-maxning — våg 1'
status: To Do
assignee: []
created_date: '2026-08-14 17:16'
updated_date: '2026-08-24 14:43'
labels: []
dependencies: []
ordinal: 387000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Airtable-basen bär i dag 16 kända, oåtgärdade defekter (registret
`docs/reference/data-model.md` § Kända fällor, poster verifierade live
2026-08-14) som var och en tyst ger Lotta fel information: fel antal
anmälda, ett namn som säger "Ej tillgängligt" i stället för ett riktigt
namn, mailutskick som räknas fel, ett segment som visar noll deltagare fast
16 personer gick, och ett datumtak som ger ett skarpt fel så fort ett event
läggs 2027 eller senare. Basen är en förstklassig leverabel (ADR-063), inte
ett provisorium — men "förstklassig" har hittills betytt "väntar på en stor
milstolpe", vilket har låtit defekter samla sig i stället för att lagas när
de hittas.

### Lösning

ADR-063 § Updates 2026-08-14 river vänta-på-milstolpe-modellen: bas-maxning
blir KONTINUERLIG, en åtgärd i taget, i stället för uppsamlad till en
slutgenomlysning. Detta PRD-kort är den första vågen av det kontinuerliga
arbetet — nio prioriterade åtgärder (Å1–Å9) plus ett enabling-mätpass, valda
och ordnade av ett dedikerat syntes-pass (`docs/research/bas-atgardsplan-2026-08-14.md`)
som vägde två oberoende kartläggningar mot varandra: vad som är trasigt i
basen (`bas-defekt-kartlaggning-live-2026-08-14.md`) och vem i appen som ser
det (`bas-defekt-konsumtionskarta-2026-08-14.md`).

> **Marcus GO, verbatim (2026-08-14):** "det är definitivt GO på PRD-kortet,
> jag vill utföra alla 16 åtgärder på ett säkert och proffsigt sätt."

### Användarberättelser

1. Som Lotta vill jag att ett event med startdatum 2027 eller senare går att
   skapa utan fel, så att jag inte blockeras av ett datumtak jag inte visste
   fanns (Å1).
2. Som Lotta vill jag att maillogens "Antal skickade" stämmer med hur många
   som faktiskt fick mailet, så att jag litar på utskicksstatistiken (Å2a).
3. Som Lotta vill jag att ingen intresserad person är osynlig i appen, så att
   jag aldrig tappar bort en lead (Å2b).
4. Som Lotta vill jag se ett riktigt namn eller en tydlig, hjälpsam
   platshållare i stället för "Ej tillgängligt", så att personlistan känns
   pålitlig i stället för trasig (Å3).
5. Som Lotta vill jag att ett föreläsnings-segment visar det verkliga antalet
   deltagare, så att jag inte tror att ingen gick på föreläsningen (Å4+Å5).
6. Som Lotta vill jag att RIM 3-eventens deltaganden räknas med i en persons
   totala deltaganden, så att statistiken inte missar en hel eventtyp (Å6).
7. Som Lotta vill jag att avbokade och inställda anmälningar aldrig räknas
   som aktiva någonstans i appen, så att beläggning och register visar
   sanningen (Å7).
8. Som Lotta vill jag att "Antal anmälda" och "Platser kvar" stämmer även när
   någon avbokat, så att jag aldrig avvisar en anmälan till ett event som
   faktiskt har plats kvar (Å8).
9. Som Lotta vill jag att Månad/år alltid följer startdatumet automatiskt, så
   att risken för framtida drift mellan de två fälten försvinner för gott
   (Å9, permanent).
10. Som Marcus vill jag att varje bas-mutation har en beprövad, verifierad
    rollback-väg innan den rör prod, så att ett misstag i en bas delad med
    Psionautics går att ångra.
11. Som Marcus vill jag att de tre låsta ordningsvillkoren (O1, O2, O3) hålls
    som riktiga beroenden i backloggen, inte bara som prosa i en plan, så att
    ett senare kort inte råkar aktivera ett latent fel i basen.
12. Som Marcus vill jag att varje åtgärd verifieras i staging FÖRE prod, och
    att prod är ett eget, medvetet godkänt pass, så att en delad prod-bas med
    Psionautics och elva live automationer (A1–A11) aldrig muteras i blindo.
13. Som en framtida agent eller människa som läser registret vill jag att
    `data-model.md` § Kända fällor hålls i synk med varje löst post, så att
    registret förblir en pålitlig kravspec för fortsatt maxning (Å16, i
    QA-kortet).

### Implementationsbeslut

- **Scope våg 1 = planens P0–P3** (nio åtgärder, Å1–Å9) plus ett
  **enabling-mätpass** (skiva 2) som planen själv identifierar som den som
  bär fyra av sex mätbehov FÖRE fix. Ordningen i skivorna nedan följer
  planens § Föreslagen arbetsform-tabell exakt (tio skivor + ett QA-kort).
- **Tre låsta ordningsvillkor, kodade som `--dep` — inte prosa:**
  - **O1** — §32 (skiva 5) FÖRE §34 (skiva 6): stäms de 16 oavstämda
    föreläsnings-Deltagandena av innan `Fjärrskådning ×` är
    modalitets-distinkt, aktiveras ett latent fel för 14 rader.
  - **O2** — ärvd ur live-kartan (§33 före §28:s radering) — hör till våg 2,
    dokumenteras som villkor för den vågen, ingen skiva i denna våg berörs.
  - **O3** — §27 (skiva 8) FÖRE Fynd 1:s fix (skiva 9): görs Fynd 1 först
    ärver den nya event-räknaren §27:s defekt i stället för att laga den.
- **Två bundlings-krav, en landning:**
  - **B1** — §27:s bas-fix och de tre identiska JS-predikaten
    (`Deltagare.tsx:153-156`, `Gruppdynamik.tsx:49-52`,
    `AtgardsSida.tsx:3105`) landar i SAMMA PR (skiva 8) — annars blir
    kommentaren som redan står i koden en lögn.
  - **B2** — `Månad/år` → formel (skiva 10, permanent) river skrivningarna i
    `create-event/index.ts:204` och `update-event/index.ts:222` i samma
    landning; utan det börjar båda Edge Functions fela.
- **Miljöordning, samma för varje skiva som rör basen:** staging FÖRST → mät
  där → prod som ETT EGET, medvetet verifierat pass. Live-kartan mätte att 21
  av 22 nyckelfält är byte-identiska mellan baserna — staging är en giltig
  proxy, mätt, inte antaget.
- **Riskklasser ärvda från planen** och skrivna in per skiva: R1 (reversibel,
  ingen bas-sidig konsument känd), R2 (reversibel, rör automation/vy/
  formulär/interface — kräver kartläggning av bas-sidiga konsumenter först),
  R3 (irreversibel eller destruktiv — typändring, radering, datamutation
  utan sparad förbild; kräver export/förbild FÖRE och egen landning).
- **Prod-basen muteras ALDRIG utan uttalat Marcus-GO per skiva.** Varje skiva
  som rör en bas-mutation i prod bär en explicit HITL-not om detta i sin
  beskrivning (mission-kontraktet, oberoende av om staging-delen i teorin
  hade kunnat scriptas).
- **API-gränser styr vad som ens KAN delegeras:** typändring och
  fält-radering går inte via Airtables Meta-API; select-optioner kan
  troligen inte läggas till via API (svagare belagt, ovederifierat); om
  `options.formula` går att PATCH:a är OVERIFIERAT och avgörs FÖRST i skiva 2
  (planens enskilt mest hävstångsrika omätta fakta). Till dess är varje
  formelfix i denna våg planerad som handarbete i Airtables UI.

### Testbeslut

Ingen ny testskarv. Bas-mutationer är inte enhetstestbara — deras "test" är
en verifierad före/efter-mätning via Airtable MCP (`describe_table` /
`list_records`) mot staging, dokumenterad i skivans Implementation Notes, och
en andra mätning mot prod efter den egna, godkända prod-landningen. App-kod
som rör vid samma åtgärd (Å2b:s `LEAD_FILTER`, Å7:s tre JS-predikat, Å9:s
EF-skrivningar) testas i den skarv som redan täcker filen (`test:api`,
förebild: befintliga EF-kontraktstester). A11y berörs inte av denna våg —
inga nya vyer eller komponenter skapas.

### Utanför omfattningen

- **Våg 2 (P4, planens Å10–Å15):** `Senaste interaktion (text)`-flatning
  (§46b), normaliserat e-postfält på Personer (§40+§42), case-dubbletterna
  (§24), länklösa Deltaganden i närvarobulken (§41), Carry 11-fixen (post
  48), samt döda fält/hash-optioner/etikett-städning (§23, §25, §26, §33,
  §35, §46a, §28-radering). Bokförs i denna beskrivning som våg 2-rest, blir
  INTE skivor i detta kort.
- **De fem deferade omätta punkterna** (planens § De åtta omätta punkterna,
  punkt 4, 5 och 8 med sina fyra automations-underposter 9/12/16/21): kräver
  Zapier/Make-åtkomst respektive observerad automations-körning i prod —
  hör till en framtida slutgenomlysning, inte till denna våg.
- **Slutgenomlysningen som helhet** (ADR-063:s omdefinierade milstolpe) —
  framtida, separat arbetsenhet.
- **Supabase-migrationen** — separat spår per repots CLAUDE.md-ingress, inte
  en ersättning för bas-maxningen.
- **O2** (§33 före §28:s radering) — hör till våg 2:s scope, endast
  dokumenterad här som ett villkor att hålla när den vågen planeras.

### Estimat

Tio skivor + ett QA-kort. Storleksklass: flera sessioner, inte en — varje
bas-berörande skiva kräver Marcus-GO omedelbart före sin egen prod-mutation
(HITL), så arbetsenheten kan inte AFK-batchas i sin helhet även om enskilda
mät- och förberedelsesteg kan förberedas i förväg.

### ADR-koppling

Styrande: **ADR-063** § Updates 2026-08-14 (kontinuerlig bas-maxning,
milstolpen omdefinierad — det beslut som gör denna våg möjlig utan att
vänta). Ramar in enskilda åtgärder: **ADR-062** beslut 2 (segment-yta,
route-around-but-register-principen) · **ADR-064** beslut 4a (segment-
taxonomins strikta närvaro-golv, berör §32/§34) · **ADR-066** beslut 3/6
(skapa-event-idempotens, `Månad/år`-härledning som route-around, berör Å9).
Sanningshierarkin: **ADR-100** (denna PRD:s källor rangordnas därefter).
Källmärkning i skiv-uppdragen: **ADR-086**. Inga nya över-bar-ADR:er
identifierade för denna våg; om ett åtgärds-genomförande visar att ett
formelval är svårt att återställa mintas en egen ADR i den skivan, inte
här.

### Ytterligare anteckningar

**Blast-radius-disciplinen, ärvd oavkortad från planen:**

- **Prod-basen är delad.** Psionautics är gäst. Å8:s mätevent
  (`recQ2TPsY69fQXA8a`) ÄR ett Psionautics-event — fixen ändrar ett synligt
  tal på gästens egen data.
- **A1–A11 är live i prod.** Å8 rör automation A6:s triggervillkor
  (`Anmäld beläggning (%) = 1`) direkt. Varje skiva som ändrar ett fält en
  automation läser eller triggar på ska läsa automationens skriptkod först
  (claude.ai-connectorns `get_automation`, read-only) — `schema_reference.md`
  är frusen mars 2026 och räcker inte ensamt.
- **Egen landning per åtgärd, egen verifiering.** Ingen skiva slås ihop med
  en annan bara för att de rör samma tabell.
- **Rollback-väg per skiva, sparad FÖRE mutationen:** formeltext verbatim för
  formelfixar; record-ID:n + tidigare värden för datamutationer (Å5, R3).
- **Staging är staging, prod är prod** (`app8uGPrVCVOm6LfD` FÖRBJUDEN att
  förväxla med staging `apphjj8Q7lkXCMsL4`). Ingen skiva rör prod förrän
  staging-passet är verifierat och Marcus gett explicit GO för just den
  skivan.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [ ] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112 mandatpasset (2026-08-24, beslut 3, Marcus mandat 2026-08-24 att pröva omklassning): premiss- + omklassningspass kört mot samtliga 213.1–213.12. Utfall: samtliga bas-rörande skivor (213.1–213.3, 213.5–213.10, 213.12) klassade MARCUS-MOMENT — PRD:ts egen governance ("Prod-basen muteras ALDRIG utan uttalat Marcus-GO per skiva", DoD #6 på varje skiva) är en avsiktlig policy, inte en tooling-begränsning, och omklassas inte bort av att en operation råkar vara skriptbar. 213.4 RÖRD EJ (spärr bekräftad, se dess egna notes). 213.11 MARCUS-MOMENT (beror på samtliga övriga + manuell browserverifiering).
Trots detta: omfattande agent-säker förberedelse gjord och dokumenterad per skiva (läs-mätningar, formeltexter, automationskod, rollback-förbilder) som krymper Marcus faktiska UI/GO-tid kraftigt. Fullständig körplan: docs/reference/s113-basmaxning-dukning.md.
Två väsentliga premissdivergenser hittade (byggs INTE vidare på utan flagg, ADR-086): (1) 213.6:s "16 oavstämda" är nu 11 (3 event, ej 4) — prod mätt 2026-08-24, se 213.6:s notes. (2) 213.12:s tre citerade Event-55-poster (rec1SD7i2467gPrJ9, rec3A0IJir34yoekd, recViNdItldmL6O8l) är REDAN Person-länkade med Deltaganden-rader — prod-brett sök gav 0 träffar på aktiva anmälningar utan Deltaganden. Se 213.12:s notes.
<!-- SECTION:NOTES:END -->
