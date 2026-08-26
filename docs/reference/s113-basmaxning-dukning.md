# S113 — dukning: Airtable bas-maxning våg 1 (TASK-213-familjen)

> Syfte: exekveringsplan för S113, det session-fönster Marcus reserverat för
> TASK-213-familjen (PRD: Kontinuerlig bas-maxning — våg 1). Producerad av
> S112 mandatpasset (2026-08-24, beslut 3) — Marcus mandat 2026-08-24 att
> pröva omklassning av samtliga 213.1–213.12 mot AGENT-SÄKER/MARCUS-MOMENT.
>
> **Utfall av omklassningen:** ingen skiva omklassades till ready-for-agent.
> PRD:t (`task-213`) har en egen, avsiktlig governance-regel — *"Prod-basen
> muteras ALDRIG utan uttalat Marcus-GO per skiva"* — som är en policy, inte
> en tooling-begränsning. Den regeln väger tyngre än att en enskild
> operation råkar vara skriptbar, så samtliga bas-rörande skivor förblir
> MARCUS-MOMENT (etiketten `ready-for-human` orörd). Värdet av detta pass
> ligger i stället i **agent-säker förberedelse**: läs-mätningar,
> formeltexter, automationskod och rollback-förbilder är redan insamlade och
> dokumenterade per skiva — Marcus faktiska UI-/GO-tid i S113 ska bli
> betydligt kortare än om varje steg startade från noll.
>
> **Källa för varje faktapåstående i detta dokument:** kortens egen text
> (`npx backlog task <id> --plain`, läst 2026-08-24), samt live Airtable-läsningar
> denna session (citerade med bas-ID och tidpunkt). Se även Implementation
> Notes på respektive kort (`213`, `213.1`, `213.2`, `213.4`, `213.6`,
> `213.9`, `213.12`) — samma bevis, kortare form.

## Läs detta FÖRST — två premissdivergenser som ändrar S113:s första steg

1. **213.6 — "16 oavstämda" är nu 11.** Data-model.md §34 (verifierat
   2026-06-25) och 213.6:s eget AC-tal ("De 16 identifierade...") är
   omoderna. Live prod-mätning 2026-08-24 (samma filterformel) gav **11**
   rader över **3** event, inte 16 över 4 — se § Skiva 6 nedan för
   record-ID:n. Räkna om innan avstämningen görs; bygg inte på "16".
2. **213.12 — defekten är redan läkt.** De tre citerade Event-55-posterna
   (`rec1SD7i2467gPrJ9`, `rec3A0IJir34yoekd`, `recViNdItldmL6O8l`) är
   redan Person-länkade med Deltaganden-rader, och ett bas-brett sök i prod
   (`{Är aktiv (1/0)}=1, {Deltaganden}=""`) gav **0** träffar 2026-08-24.
   Oktober-eventets brådska (mission-bokförd "213.12 före oktober-eventet")
   är därför **moot mot nuvarande data** — se § Skiva 0 nedan.

Ingen av dessa är löst i detta pass (inga Airtable-skrivningar gjordes).
Båda kräver en omkörd, färsk mätning som S113:s första handling innan något
annat på respektive skiva görs.

## Ordning (dependency-grafen, redan kodad som `--dep` i backlog)

```text
213.12 (rot-orsak, fristående)         ← kör FÖRST, men re-mät innan (se ovan)
213.2  (enabling-mätpass)              ← låser upp 213.3/5/7/8/9/10 (213.4 också, men den är spärrad)
  ├─ 213.1  (Å1 interim, Månad/år-select)          → matar 213.10
  ├─ 213.8  (Å7, Är aktiv + 3 JS-predikat, O3)      → matar 213.9
  │    └─ 213.9 (Å8, Fynd 1 — Antal anmälningar)
  ├─ 213.5  (Å4, Fjärrskådning × modalitet, O1)     → matar 213.6
  │    └─ 213.6 (Å5, avstämning 11 rader)
  ├─ 213.3  (Å2, COUNTA-roten)
  ├─ 213.7  (Å6, RIM 3 — mjuk deadline 2026-09-05)
  └─ 213.10 (Å9, Månad/år permanent — beror även på 213.1)
213.11 (QA — beror på ALLA ovan)
213.4  (Å3, Namn-fixen) — EJ I DENNA VÅG, se § Skiva 4 nedan
```

O1 (213.5 före 213.6) och O3 (213.8 före 213.9) är redan `--dep`-kodade i
backlog — CLI:t blockerar felaktig ordning mekaniskt, denna graf är en
läsbar karta ovanpå den, inte en ny regel.

**Mjuk tidskänslighet:** 213.7 har mjuk deadline 2026-09-05 (första RIM
3-eventet) — når inte UI, så ingen skärm Lotta ser bryts om den slinter,
men bör inte glömmas i en senare våg. 213.12 hade sin brådska mot
oktober-eventet (3–4 okt, Event-55) — se divergens ovan, sannolikt redan
omhändertagen.

---

## Skiva 0 — TASK-213.12 (Rot-orsaks-fixen) — kör FÖRST, men re-mät

**Vem:** Agent (re-mätning) → Marcus (GO per mutation, ENDAST om re-mätningen hittar nya instanser).

**Förkrav:** Inga (fristående skiva).

**Steg:**

1. **Agent, read-only, förgrund:** kör om exakt samma mätning som denna
   session redan gjorde, för att bekräfta att läget inte ändrats sedan
   2026-08-24:

   ```text
   mcp__airtable__list_records
     baseId: app8uGPrVCVOm6LfD
     tableId: tbloOcrppVoyrHbrq   (Anmälningar)
     filterByFormula: AND({Är aktiv (1/0)}=1, {Deltaganden}="")
   ```

   Förväntat resultat baserat på denna sessions mätning: **0 träffar**.
2. **Om 0 träffar (förväntat):** AC#2/AC#3 kräver ingen åtgärd — inget att
   Person-länka. Gå direkt till AC#4: agenten skriver fälla-instansen in i
   defekt-registret (`data-model.md` § Kända fällor, ny post eller
   uppdatering av existerande post om en sådan redan täcker detta) med
   rotorsak ("anmälan utan Person-länk bryter A3/A11-kedjan") och
   mätdata (denna sessions körning + S113:s omkörning, båda med tidsstämpel
   och antal). Ren dokumentation — agent-säkert, ingen Airtable-skrivning.
3. **Om > 0 träffar (oväntat, ny instans sedan 2026-08-14):** Marcus GO
   krävs per mutation (kortets egen HITL-regel). Agenten mäter och
   presenterar de nya raderna (record-ID, event, e-post) för Marcus, som
   sedan Person-länkar en i taget i Airtables UI (Personer-kolumnen på
   Anmälningar-raden). Efter varje länkning: agent verifierar A-kedjan
   (Deltaganden-raderna finns, korrekt sessionssatta) via samma
   `list_records`-mönster mot `tbldWHH6sSHWoQPHH` filtrerat på
   `{Anmälan}` = den länkade anmälans record-ID.
4. Kort stängs med AC#1–4 avbockade, ingen `--check-ac` görs i förväg av
   agenten i detta förberedande pass.

**Verifiering:** steg 2 eller 4 ovan; ingen render-verifiering (backend-data).

---

## Skiva 1 — TASK-213.2 (Enabling-mätpass)

**Vem:** Blandat — 3 av 4 uppgifter redan klara eller agent-klara denna
session, 1 kräver Marcus i UI:t.

**Förkrav:** Inga.

| Uppgift | Status efter S112 | Kvarstår för S113 |
|---|---|---|
| 1. Rollup-aggregatens uttryck (Utskickslogg.Antal skickade, Eventplanering.Antal anmälningar) | **Ej klar — bekräftat API-omätbart** (rollup-fälts `options` saknar helt aggregerings-/funktionsnyckel i både `describe_table` och `get_table_schema`) | Marcus öppnar fältets formel-/konfigurationspanel i Airtables UI för de två fälten, läser aggregeringsfunktionen, dikterar den till agenten som skriver in den i Implementation Notes |
| 2. `options.formula`-PATCH-prov (staging, betydelselöst fält) | Ej körd (skarp skrivning, förbjuden i detta pass) | Marcus GO:ar att agenten kör ETT `mcp__claude_ai_Airtable__update_field`-anrop med `options.formula` mot ett utpekat betydelselöst formelfält i staging (`apphjj8Q7lkXCMsL4`) — tool-schemat deklarerar redan stöd för parametern, så detta är ett riktigt funktionsprov, inte en gissning. Marcus behöver bara vara INFORMERAD (kortets egen skrivning), inte utföra klicket själv. |
| 3. Bas-sidiga konsumenter (vyer/interfaces/formulär) | **Vy-antal klart:** Personer 11, Anmälningar 7, Eventplanering 11 (bekräftat via `list_views_for_table`, matchar kortets tal) | Leads-vyns exakta FILTERVILLKOR är inte exponerat av verktygsytan — Marcus (eller agent med `list_pages_for_base`/interface-åtkomst om den täcker det) läser villkoret i UI:t |
| 4. Personer.Namn-formelns fullständiga text | **KLART** — läst via API, se citat nedan | Ingen |

**Personer.Namn, verbatim** (`fldnYys0Ac3UGOdpe`, läst live 2026-08-24):

```text
IF(
  AND({Förnamn} = "", {Efternamn} = ""),
  "Ej tillgängligt",
  TRIM({Förnamn} & " " & {Efternamn})
)
```

**Kommando för uppgift 2** (körs av agenten EFTER Marcus GO, riktat mot ett
fält Marcus pekar ut i staging):

```text
mcp__claude_ai_Airtable__update_field
  baseId: apphjj8Q7lkXCMsL4
  tableId: <Marcus pekar ut>
  fieldId: <Marcus pekar ut, ETT betydelselöst formelfält>
  options: { formula: "<samma formel + en harmlös kommentar/whitespace-ändring>" }
```

Dokumentera HTTP-status och svarskropp i Implementation Notes oavsett utfall
(AC#2 kräver båda utfallen dokumenterade, inte bara framgång).

**Verifiering:** samtliga 4 AC avbockas när ovanstående är gjort.

---

## Skiva 2 — TASK-213.1 (Å1, Månad/år-interim)

**Vem:** Marcus (UI-klick), agent har förberett resten.

**Förkrav:** Inga.

**Redan gjort (denna session):** nuvarande 14 val bekräftade (November 2025
– December 2026), matchar AC#1:s förväntade 14+12=26 exakt. Ingen post
använder ännu ett 2027-värde → rollback (AC#3) är trivialt säker.

**Marcus klick, i BÅDA baserna** (staging `apphjj8Q7lkXCMsL4` FÖRST, prod
`app8uGPrVCVOm6LfD` EFTER Marcus GO för just prod-halvan):

1. Öppna `Eventplanering` → fältet `Månad/år` (`fld2BjFdBd964TzVb`) →
   redigera fält → lägg till 12 nya val, i ordning:
   `Januari 2027, Februari 2027, Mars 2027, April 2027, Maj 2027, Juni 2027,
   Juli 2027, Augusti 2027, September 2027, Oktober 2027, November 2027,
   December 2027`.
2. Spara.

**Agent, direkt efter Marcus bekräftar staging-halvan klar:**

```text
POST (via create-event Edge Function) med Startdatum: "2027-01-15"
```

Förväntat: **200**, inte dagens 500. Detta är AC#2, redo att köras direkt.

**Verifiering:** `describe_table` mot fältet i respektive bas → 26 val
totalt; create-event-anropet ovan svarar 200 i staging.

---

## Skiva 3 — TASK-213.8 (Å7, Är aktiv + tre JS-predikat, B1)

**Vem:** Blandat — appkoden kan förberedas AFK av agent, bas-halvan är
Marcus.

**Förkrav:** 213.2 landad.

**Agent, AFK, FÖRE Marcus rör basen:** förbered de tre JS-predikaten på en
egen gren (ej mergad): `Deltagare.tsx:153-156`, `Gruppdynamik.tsx:49-52`,
`AtgardsSida.tsx:3105` — utöka villkoret så `Status="Inställt"` exkluderas
på samma sätt som `Avbokad/Ombokad`, rätta kommentarerna som i dag felaktigt
påstår att endast Avbokad/Ombokad räknas bort. **Committa INTE ensam** —
B1 kräver att bas-fixen och app-fixen landar i SAMMA PR.

**Marcus, UI, staging FÖRST:** öppna `Anmälningar.Är aktiv (1/0)`
(`fld4j7PeckDViTdIB`), utöka formeln så `Status="Inställt"` ger 0 (samma
mönster som `Avbokad/Ombokad` redan har). Spara formeltexten FÖRE-ändring
verbatim (rollback, AC#4) innan sparning.

**Efter Marcus GO:** agenten mergar sin förberedda app-branch med bas-fixens
landning i samma PR, verifierar de 2 kända `Inställt`-anmälningarna i prod
går från `Är aktiv=1` till `0`.

**Verifiering:** eventsidans register, Gruppdynamik och Åtgärder visar
samma antal efter fixen (renderad, ej bara kodläsning).

---

## Skiva 4 — TASK-213.9 (Å8, Fynd 1 — Antal anmälningar/anmälda)

**Vem:** Marcus (fälttypbyte i UI, live automation).

**Förkrav:** 213.8 landad och verifierad (O3).

**Redan gjort (denna session, AC#2 KLART):** Automation A6 läst i sin
helhet.

- **Trigger:** `Anmäld beläggning (%)` (`fldqkyeE7cVHMNRpH`) **= 1** exakt
  (inte tröskel-överskridande).
- **Åtgärd:** statiskt mail till `lotta@outsidereality.se` +
  `marcus@h5gruppen.se`, ingen dynamisk formel i innehållet.
- **Konsekvens:** fixen ändrar täljaren (`Antal anmälda` exkluderar
  avbokade/inställda efter 213.8), så A6 fyrar vid ett ANNAT faktiskt antal
  aktiva anmälningar än i dag — samma 100%-tröskel, mindre population.
  Ingen ändring av A6 krävs, men Marcus bör känna till timingskiftet innan
  GO.
- Bekräftat: `Antal anmälningar` är i dag `type: count` (ovillkorat), inte
  rollup — matchar kortets premiss. De tre följdfälten (`Anmäld beläggning
  (%)`, `Platser kvar`, `Antal slutbetalning saknas`) är samtliga formler
  som läser `Antal anmälda` direkt.

**Marcus, UI, staging FÖRST:** eftersom fälttypen inte kan bytas via API
(R3): skapa ett NYTT rollup-fält över `Anmälningar.Är aktiv (1/0)` med
`SUM`, verifiera det ger samma tal som det gamla `count`-fältet för alla
event UTOM de med avbokade/inställda anmälningar, styr om följdfälten
(`Anmäld beläggning (%)`, `Platser kvar`, `Antal slutbetalning saknas`) till
det nya fältet, exportera/spara det gamla fältets värden FÖRE borttagning
(rollback, AC#4).

**Efter Marcus GO för prod:** verifiera Psionautics-eventet
(`recQ2TPsY69fQXA8a`) går `Antal anmälningar` 88→79, `Platser kvar` 0→9.

**Verifiering:** ovanstående tal + A6:s körhistorik efter landning
(kontrolleras i 213.11, inte här).

---

## Skiva 5 — TASK-213.5 (Å4, Fjärrskådning × modalitets-distinkt, O1)

**Vem:** Marcus (formeländring UI).

**Förkrav:** 213.2 landad.

**Karaktär:** skyddsräcke-skiva — konsumeras inte av appen i dag, men
MÅSTE landa före 213.6 (O1), annars aktiveras ett latent fel för 14
föreläsningsrader.

**Marcus, UI, staging FÖRST:** öppna `Fjärrskådning ×`
(`fldlczklhguSg02H6`) → besluta formvalet mot ADR-064:s taxonomi
(sessionsfilter i källformeln vs. separat föreläsningsräknare) → spara
gamla formeltexten verbatim FÖRE ändring → implementera.

**Verifiering:** efter fixen summerar `Fjärrskådning ×` endast över de 308
utbildningsraderna (Event typ ≠ Föreläsning), inte alla 322.

---

## Skiva 6 — TASK-213.6 (Å5, avstämning — OBS: 11 rader, inte 16)

**Vem:** Marcus (datamutation, R3, en rad i taget).

**Förkrav:** 213.5 landad och verifierad (O1).

**PREMISSDIVERGENS — läs § ovan.** Faktiskt antal 2026-08-24: **11 rader,
3 event** (inte 16/4). Rollback-förbild redan insamlad (read-only,
denna session):

| Event | Antal rader | Record-ID:n |
|---|---|---|
| Varberg – Föreläsning – Fjärrskådning – 2026-02-05 | 4 | `recPhYgKEz49Up5Tq`, `recfeh2sNe3bmywNh`, `rectGNsXqPp9l2xI9`, `recut1m0Uwzr8pztY` |
| Falköping – Föreläsning – Fjärrskådning – 2026-03-19 | 5 | `recVXJqNRH1juZAGz`, `recXdnLkSUP1FHavo`, `recoBN6545z2CTIof`, `recwnrzB2k9KOoZRt`, `recx2zXe5oFAWP1Ci` |
| Varberg – Föreläsning – Resor i medvetandet – 2026-02-06 | 2 | `recA31AxDBiFL6MeJ`, `recLdjKa3HRTs2sFM` |

Samtliga har `Status = "Ej avstämt"` idag (rollback-förbild = detta värde).

**Stagingfälla:** samma filter mot staging (`apphjj8Q7lkXCMsL4`) gav bara 1
rad, en synthetic `ZZ-Checkin-fixtur`-post — staging speglar INTE denna
defekt. AC#1:s "verifierat i staging"-krav kräver antingen en seedad
motsvarighet i staging, eller att Marcus/agent kommer överens om en
alternativ verifieringsväg (t.ex. verifiera direkt i prod, eftersom detta
är en ren datahandling utan formeländring). **Flaggas för Marcus-beslut vid
S113-start, inte förhandslöst här.**

**Marcus, UI (prod, efter GO), en rad i taget:** sätt `Status` från
`"Ej avstämt"` till `"Närvarande"` för respektive rad (om segmentbyggarens
avsedda semantik är "genomförd föreläsning" — bekräfta mot ADR-064 att
detta är rätt målstatus innan första raden ändras).

**Verifiering:** ett föreläsnings-segment i segmentbyggaren räknar det
verkliga antalet distinkta personer i stället för 0.

---

## Skiva 7 — TASK-213.3 (Å2, COUNTA-roten)

**Vem:** Marcus (rollup-typändring UI, R2).

**Förkrav:** 213.2 landad.

**Marcus, UI, staging FÖRST:**

1. `Utskickslogg.Antal skickade` (`fldqJBTOwErzMdCAO`): spara gamla
   formeln (`COUNTA({Skickat till})`) verbatim, konvertera till en rollup
   med `COUNT`-aggregering över `Skickat till`. Verifiera med en syntetisk
   rad med ≥3 länkade mottagare (Utskickslogg är tomt i båda baserna, så
   detta kräver en testpost).
2. `Personer.Antal hämtningar` (`fld4UQOdKTvWixZ9F`): dagens formel
   bekräftad denna session: `COUNTA({Engagemang})` — räknar fel relation.
   Spara verbatim, peka om till en `COUNT`-rollup över `Touchpoints`
   (`fldnuqNqlVzt47AAN`).
3. **Beslut krävs (AC#3):** styr `LEAD_FILTER`
   (`get-leads/index.ts:23-24`) om till den nya relationen, eller riv
   Intresserade-vyns räknarrad. 33 osynliga leads-kandidater talar för
   omstyrning — men beslutet är Marcus, inte förhandsfattat här.

**Agent, AFK, parallellt:** förbered `LEAD_FILTER`-omstyrningen på egen
gren om beslutet i punkt 3 blir "styr om" — landar EFTER staging-fixen är
verifierad, inte samtidigt.

**Verifiering:** testraden visar 3, inte 1; M-d:s fråga (33 osynliga) ger 0
träffar eller en dokumenterad förklaring efter fixen.

---

## Skiva 8 — TASK-213.7 (Å6, Totala deltaganden + RIM 3)

**Vem:** Marcus (formeländring UI, R1).

**Förkrav:** 213.2 landad. **Mjuk deadline 2026-09-05** (första RIM
3-eventet) — bör inte glida långt förbi S113.

**Marcus, UI, staging FÖRST:** besluta mellan (a) peka konsumenter till
`Antal genomförda event` (`flddy8JND3YnlgZxe`) eller (b) utöka
`Totala deltaganden`-formeln med `{RIM 3 ×}`. Spara gamla formeltexten
verbatim FÖRE ändring.

**Verifiering:** en person med genomfört RIM 3-event har `Totala
deltaganden` = `Antal genomförda event`.

---

## Skiva 9 — TASK-213.10 (Å9, Månad/år permanent, B2)

**Vem:** Marcus (fälttypskonvertering UI, R3), app-halvan AFK-förberedbar.

**Förkrav:** 213.1 OCH 213.2 landade (213.2 avgör om konverteringen kan
skriptas — se § Skiva 1 uppgift 2 ovan).

**Agent, AFK, FÖRE Marcus rör basen:** förbered på egen gren, ej mergad:

- Ta bort skrivningen i `supabase/functions/create-event/index.ts:204`.
- Ta bort skrivningen i `supabase/functions/update-event/index.ts:222`.
- Uppdatera läsningen `create-event/index.ts:98`
  (`selectName(f['Månad/år'])`) för att hantera formelns strängutdata i
  stället för `{name}`-formen.
- **Committa INTE ensam** — B2 kräver samma PR som bas-konverteringen.

**Marcus, UI, staging FÖRST:** exportera/spara `Månad/år`-kolumnen i BÅDA
baserna FÖRE konvertering (R3, destruktivt). Konvertera
`Eventplanering.Månad/år` (`fld2BjFdBd964TzVb`) till en formel härledd ur
`Startdatum` (samma mönster som `Säsong`/`Datum (visas i länk)`).

**Efter Marcus GO:** agenten mergar sin förberedda app-branch med
bas-konverteringen i samma PR.

**Verifiering:** skapa/ändra ett event över en årsgräns i staging —
`Månad/år` följer utan manuell inmatning.

---

## Skiva 10 — TASK-213.11 (QA)

**Vem:** Marcus (Del B, manuell browserkorsverifiering) + agent
(Del A, progressivt).

**Förkrav:** SAMTLIGA av 213.1–213.3, 213.5–213.10 landade (213.4 ingår
INTE i denna våg, se nedan).

**Del A (registerhygien) — agent, men PROGRESSIVT, inte i förväg:**
`data-model.md` § Kända fällor-poster 27, 31, 32, 34, 36, 39, 43, 45, 47
bockas/uppdateras EN I TAGET i takt med att respektive skivas PR faktiskt
landar — inte som en batch i förväg. Ingressen rättas mot ADR-063 §
Updates 2026-08-14 samtidigt (den pekar i dag felaktigt mot en
"post-Fas-6-milstolpe"). `npm run check:docs` grönt efter varje ändring.

**Del B — Marcus, browser, per landad skiva:** manuell korsverifiering
enligt kortets åtta punkter (Månad/år, maillog+leads, namn, föreläsnings-
segment, RIM 3, aktiv-status, anmälda/platser kvar, fil:rad-korsreferenser).

---

## Skiva 4 (Å3) — TASK-213.4 — EJ I DENNA VÅG

**Status:** SPÄRRAD. Rörd endast med en bekräftelse-not denna session,
inget annat.

Aktiv regressionsvarning står kvar (orkestreraren S104, 2026-08-17):
byt-till-`BLANK()`-fixen gör mailvägens `visatNamn` (`VariantD.tsx`
~999-1001) värre — en falsy-fallback som med `BLANK()` ger `(namn saknas)`
→ mailhälsningen blir `Hej (namn,`. Nuvarande AC-lista saknar utskicksytan
och mail-förhandsvisningen.

**Måste hända FÖRE denna skiva kan köras, i denna ordning:**

1. K1-kodfixen: `visatNamn` görs tålig mot båda formerna (tom sträng ELLER
   `"Ej tillgängligt"`) och `{förnamn}` får en egen väg i
   `VariantD.tsx` — egen PR, ingen basändring.
2. AC-listan på 213.4 utökas med utskicksytans rendering + en
   mail-förhandsvisning som explicit AC.
3. Först därefter: bas-formeländringen (`BLANK()`-bytet) enligt kortets
   nuvarande övriga steg.

Detta läggs INTE in i S113:s huvudsvep ovan — det är ett separat,
föregående spår. Om K1 hinner landas under S113 kan 213.4 köras sist i
samma fönster; annars skjuts den till en senare session.

---

## Sammanfattning: vad som redan är klart inför S113

- 213.2 AC#4 (Personer.Namn-formeln) — klar, citerad ovan.
- 213.2 AC#3 (vy-antal) — klar för Personer/Anmälningar/Eventplanering.
- 213.9 AC#2 (A6:s automationskod) — klar, citerad ovan.
- 213.1:s rollback-säkerhet (inga 2027-värden i data ännu) — bekräftad.
- 213.6:s rollback-förbild (11 record-ID:n + Status) — insamlad, men OBS
  antalet ändrat mot kortets "16".
- 213.12:s AC#1-mätning — körd, gav 0 träffar; behöver EN omkörning vid
  S113-start för att bekräfta att inget nytt tillkommit.

Allt ovan är read-only-arbete gjort i detta pass. Ingen Airtable-skrivning
har skett — samtliga faktiska bas-mutationer väntar på Marcus GO i S113,
som planerat.
