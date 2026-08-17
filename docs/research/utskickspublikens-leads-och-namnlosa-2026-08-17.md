---
owner: marcus803
updated: 2026-08-17
review_by: 2026-11-17
status: draft
---

# Utskickspublikens leads och namnlösa — rotorsaksutredning (2026-08-17)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> oisolerat i `.claude/worktrees/s104-segment-passet` på gren
> `docs/s104-stangning` @ `5b916c1e` (`origin/main` @ `83a98b91`).
> Modell-avvikelse bokförd per Marcus-order 2026-08-17: Opus i stället för
> research-passets Sonnet-default (svår felsökning, `ADR-089`).
> Läsande pass — noll kodändringar, noll Airtable-skrivningar. Alla
> live-tal är GET-mätningar mot prod-basen `app8uGPrVCVOm6LfD` 2026-08-17.
> Committar inget; orkestreraren äger landningen. Kort: `TASK-260`.

## Kort svar

Det är **två skilda fel med två skilda rötter**, och bara det ena är ett fel i
vår mening.

1. **"Leads/intresserade i publiken" är en FELLÄSNING — men av en trasig
   etikett i basen, inte av Marcus.** Publiken innehåller **noll** leads.
   Samtliga 247 mottagare har minst en anmälan och minst en
   `Närvaropoäng=1`-rad. Appens egen lead-definition (`get-leads`) ger 77
   personer, och snittet mot publiken är **0**. Men **Airtable-basens egen
   vy "Leads"** innehåller **448 av 670 personer (67 %)**, varav **267 finns
   i publiken** — inklusive personer med tre genomförda kurser. Slår man upp
   en mottagare i den vyn ser hon ut som en lead. **Rotorsaken är vyn, inte
   publiken.**

2. **"Ej tillgängligt" är ÄKTA — och betydligt värre än "ett fåtal i
   uppstarten".** **154 av 247 mottagare (62,3 %)** bär namnet
   `Ej tillgängligt`. Alla 154 spåras till **en enda källa**: backfillen
   2026-04-19 (`Från formulär = Backfill (historisk)`, `Inskickad = 2026-04`,
   **223 av 223 anmälningar**, noll undantag). Namnen har aldrig funnits
   digitalt (fälla 43). Marcus minnesbild stämmer om FORMULÄR-eran; den
   gäller inte den importerade historiken.

3. **Följdfelet i mailet är vår kod, och det finns EN rad som orsakar det.**
   `visatNamn` (`VariantD.tsx:999-1001`) behandlar basens
   platshållar-STRÄNG som ett riktigt namn, eftersom fallbacken bara utlöses
   på tomt värde. `{förnamn}` blir därför `"Ej tillgängligt".split(' ')[0]`
   = `"Ej"`.

**Det som gör detta pass värt att läsa utöver bekräftelsen:** den redan
specade bas-fixen `TASK-213.4` (byt `"Ej tillgängligt"` mot `BLANK()`)
**löser inte mailvägen — den gör den värre.** Med `BLANK()` blir
`{förnamn}` i stället `"(namn"` och `{namn}` blir `"(namn saknas)"`.
Se § Domen · punkt 4.

---

## Vad repot redan visste — inventeringen före första mätningen

| Källa | Vad den redan täckte | Ålder / status |
|---|---|---|
| `data-model.md` § Kända fällor **43** | `Personer.Namn`-formeln, de 365 backfill-anmälningarna, återvinningsgrad 0/187, "namnen har aldrig existerat digitalt" | 2026-07-09, **håller** — mina mätningar bekräftar den exakt |
| `data-model.md` § Kända fällor **21/22** | Namnlösa leads från A4 = normaltillstånd | 2026-04-28, håller |
| `bas-defekt-konsumtionskarta-2026-08-14.md` §43 | "NÅR UI: Personlistan, persondetaljen, Intresserade" — 186 personer | 2026-08-14, **ofullständig i dag**: segment-/utskicksytan saknas i listan (den promoverades först `TASK-249.5/.6`, 2026-08-17) |
| `bas-atgardsplan-2026-08-14.md` § P1 · Å3 | Bas-fixen: byt formelgrenen mot `BLANK()`; "ta Å3 som bas-fix, inte app-fix" | 2026-08-14, **premissen behöver kompletteras** — se § Domen punkt 4 |
| `backlog/task-213.4` | Hela bas-fixen som skiva, AC #3 räknar upp `PersonsList`, `PersonDetail`, `Intresserade` | 2026-08-14, **AC-listan täcker inte den nya ytan** |
| `ADR-062` / `ADR-064` / `ADR-115` | Medlemskap beräknas ur källan, strikt närvaro-golv, DNF-regelspråk | Håller — och är precis skälet till att H1/H4 faller |
| `ADR-067` | `send-email`-kontraktet, consent-golvet | Håller |
| `T74` (tråd) | `{Ej godkänd för mailutskick}=TRUE()` ger 0 rader i prod | 2026-07-09 — **fortfarande 0**, ommätt i dag |

**Vad som är nytt i detta pass:** lead-frågan var aldrig utredd (ingen
befintlig källa nämner basens `Leads`-vy som problem); antalen var
uppmätta för *personytorna*, aldrig för *publiken*; och interaktionen
mellan `TASK-213.4`:s bas-fix och mailvägens platshållar-fyllning är
obeskriven i samtliga befintliga dokument.

---

## Delfråga 1 — Vad valde Marcus egentligen, och vad blev publiken?

`/mer/segment` monterar `VariantD` ovillkorligt
(`src/routes/_authenticated/mer/segment.tsx`, promoverad `TASK-249.5`).
`SavedSegmentsList.tsx` och `SegmentMailCompose.tsx` är **inte monterade
någonstans** (grep över `src/`: enbart kommentarsträffar).

**"RIM 1" och "Fjärrskådning" är inte sparade segment.** Prod-basens
`Segment`-tabell (`tbll2N6JKCj4u6y9o`) innehåller **noll rader** — mätt
2026-08-17. De två posterna kommer från `byggDeFjorton()`
(`VariantD.tsx:958-971`), de fjorton grupperna som byggs i minnet vid mount
ur den verkliga taxonomin.

**Grupperna är EXKLUSIVA.** `byggGrupp` sätter de icke-valda atomerna som
`exclude` — "har bara gått RIM 1, ingen av de andra tre". Regeln som gick
till `compute-segment` var alltså:

```text
"RIM 1"          include=[RIM|1]  exclude=[Fjärrskådning, RIM|2, Psionautics]
"Fjärrskådning"  include=[FS]     exclude=[RIM|1, RIM|2, Psionautics]
```

Räknat mot prod-basens `Deltaganden` (1 248 rader med `Närvaropoäng=1`,
full-walk, samma koercion som `toAttendanceRow`):

| Grupp | Mätt i dag | Bilagans facit (juli 2026) |
|---|---|---|
| "RIM 1" (bara RIM 1) | **188** | 188 |
| "Fjärrskådning" (bara FS) | **59** | 59 |
| **Unionen Marcus såg** | **247** | — |

Att båda talen träffar bilagans facit exakt är ett oberoende kvitto på att
min rekonstruktion av regeln är rätt.

## Delfråga 2 — H1: bär segmenten gamla regler med leads inbakade?

**FALSIFIERAD, på två oberoende grunder.**

1. Det finns **inga sparade segment alls** i prod (0 rader). Ingen legacy-rad
   kan bäras in i publiken eftersom ingen rad existerar.
2. Även om det fanns: `resolveSegmentMembers`
   (`segment-resolution.ts:230-257`) **fail-closed:ar** på en rad utan
   giltig `App-segmentregel` — `SegmentNotResolvableError`, hela sändningen
   stoppas. En legacy-Make-rad kan inte tyst bidra med medlemmar.

Den gamla Make-formeln (`Segmentformel`, `fld3jcCTY2FQ4vUTk`) finns kvar som
fält men har inga rader att verka på och läses inte av någon kodväg vi äger.

## Delfråga 3 — H4: räknar membership-motorn rader den inte borde?

**FALSIFIERAD.** Motorn är strikt och läser bara `Deltaganden` med
`{Närvaropoäng}=1` (`NARVARO_FILTER`, `segment-resolution.ts:64`).
Både förhandsvisningen (`compute-segment` → `resolveRuleMembers`) och den
skarpa sändningen (`send-email` → `resolveSegmentMembers`) går genom **samma**
`fetchAttendanceRows` + `computeMembership` — en väg, per `ADR-067`.

Mätt mot prod:

| Fråga | Svar |
|---|---|
| Personer med `Antal hämtningar>0 AND Antal anmälningar=0` (appens lead-filter) | **77** |
| Av dem, med genomförd närvaro | **0** |
| Personer med 0 anmälningar men genomförd närvaro | **0** |
| Mottagare i publiken (247) utan anmälan | **0** |
| Mottagare i publiken utan e-post | **0** |

Motorn koercerade dessutom **0 av 1 248** rader till `null` — inga rader
tappas tyst, ingen rad bär avvikande form.

**Men premissen bakom `get-leads`-kommentaren är svagare än den låter.**
Kommentaren (`get-leads/index.ts:21-24`) motiverar att Deltaganden-klausulen
utelämnats som "BEVISAT redundant: 0 anmälningar ⟹ 0 deltaganden
nödvändigtvis". Det är sant i dagens data (mätt: 0), men det är en
DATA-observation, inte en strukturell garanti — fälla 21/22 beskriver just
hur en Anmälan kan bli liggande utan Person-länk. Redundansen bör mätas om,
inte antas.

## Delfråga 4 — H2: hur många namnlösa finns det, och i vilka kategorier?

**BEKRÄFTAD, och i en storleksordning ingen tidigare kartläggning uttalat
för publiken.**

### Antal-tabell — hela prod-basen (670 personer)

| Kategori | Antal | Andel |
|---|---|---|
| **Namnlösa totalt** (`Namn = "Ej tillgängligt"`) | **248** | 37,0 % |
| ├ med genomförd närvaro (`Antal genomförda event > 0`) | **186** | 27,8 % |
| ├ utan närvaro men med anmälan | **0** | — |
| ├ ren lead (0 anmälningar, hämtningar > 0) | **42** | 6,3 % |
| └ helt spårlösa (0 anmälningar, 0 hämtningar) | **20** | 3,0 % |
| Namngivna | 422 | 63,0 % |

### Antal-tabell — mängderna som rör utskicket

| Mängd | Storlek | Varav namnlösa | Andel |
|---|---|---|---|
| Motorns källmängd (alla med `Närvaropoäng=1`) | 417 | **186** | 44,6 % |
| Publiken RIM 1 ∪ Fjärrskådning, **inklusivt** läst | 373 | 185 | 49,6 % |
| **Publiken Marcus faktiskt valde (exklusiva grupper)** | **247** | **154** | **62,3 %** |
| ├ gruppen "RIM 1" | 188 | 117 | 62 % |
| └ gruppen "Fjärrskådning" | 59 | 37 | 63 % |

Andelen stiger ju smalare gruppen är, och det är väntat: de exklusiva
grupperna plockar ut engångsdeltagarna, och engångsdeltagarna är
övervägande den importerade historiken.

### Proveniensen — entydig

| Mängd | Anmälningar | `Backfill (historisk)` | Övriga källor |
|---|---|---|---|
| **Namnlösa i publiken (154→185 personer)** | 223 | **223 (100 %)** | 0 |
| Namngivna i publiken (188 personer) | 414 | 251 | 128 Huvudformulär, 19 tomt, 16 Psionautics.se |

Samtliga namnlösa mottagares anmälningar bär `Inskickad = 2026-04` — den
enda backfill-körningen. **Noll** kommer från formulärvägen.
`create-registration` kräver Förnamn OCH Efternamn (deny-by-default), så
formulärvägen kan strukturellt inte producera dem.

**Marcus fråga "något känns lurt" är alltså befogad om storleken, men
rotorsaken är redan känd och redan avdömd:** namnen fanns aldrig i något
digitalt system vi äger (fälla 43, Marcus-verifierat 2026-07-09,
återvinningsgrad 0 av 187 mot två oberoende källor).

## Delfråga 5 — H3: faller läsvägen tillbaka trots att namn finns?

**FALSIFIERAD som mappnings-fel, BEKRÄFTAD som renderings-fel.** Det är två
olika påståenden och de har olika svar.

**Ingen data går förlorad i läsningen.** Mätt:

| Test | Utfall |
|---|---|
| Namnlösa i publiken med `Förnamn` eller `Efternamn` ifyllt i basen | **0 av 185** |
| Namnlösa vars namn finns på någon av deras `Anmälningar`-rader | **0 av 185** |
| Personer i hela basen med `Förnamn` ifyllt men `Namn = "Ej tillgängligt"` | **0 av 248** |

`get-persons` mappar `Namn` rakt av (`f['Namn'] ?? null`), och
`enrichMembers` koercerar via `scalarString`. Ingen omappning finns.

**Men appen behandlar basens sentinel som ett namn.** Basens formel
(`fldnYys0Ac3UGOdpe`) är:

```text
IF(AND(Förnamn="", Efternamn=""), "Ej tillgängligt", TRIM(Förnamn & " " & Efternamn))
```

Den returnerar en **icke-tom sträng**. Appens fallback är en falsy-test:

```ts
// VariantD.tsx:999-1001
function visatNamn(m: { namn: string | null }): string {
  return m.namn?.trim() || '(namn saknas)';
}
```

`"Ej tillgängligt"` är truthy → fallbacken **är död kod i drift**. Följden
propagerar till tre ytor i utskicket:

| Yta | Utfall |
|---|---|
| Publiklistans rad | `Ej tillgängligt` |
| Radens initial-rundel | `ET` |
| `{namn}` i mall | `Ej tillgängligt` → *"som Ej tillgängligt får det"* |
| `{förnamn}` i mall | `"Ej tillgängligt".split(' ')[0]` = `Ej` → *"Hej Ej,"* |

Detta är **exakt** det `PersonDetail.tsx:275-281` redan dokumenterar som ett
"DELAT problem" för persondetaljen — men det hade aldrig bokförts för
segment-/utskicksytan.

### Varför just "Hej Ej," och inte "Hej Daniel,"

Förhandsvisningen exemplifierar med `mottagare[0]`
(`VariantD.tsx:4374-4376`) — unionens första medlem i EF:ens svarsordning,
som är första-förekomst-ordningen i `Deltaganden`-walken. Reproducerat mot
prod:

| Segment först i valet | `mottagare[0]` | Förhandsvisningen säger |
|---|---|---|
| **"RIM 1"** | `recCtTpTWOPOltmFf`, namnlös | **"Hej Ej,"** |
| "Fjärrskådning" | `recyscqpq1fU36xsY`, Daniel Karlsson | "Hej Daniel," |

Marcus listade "RIM 1" först. Utfallet är alltså inte slumpmässigt — det är
deterministiskt givet valordningen, och en ren funktion av att 62 % av den
gruppen är namnlös.

**Andra ordningens defekt:** `fyllPlatshallare` returnerar `ofyllda` —
varningen som ska fånga oersatta platshållare. Den kan aldrig fälla här,
eftersom `{förnamn}` *blir* ersatt, med skräp. Grinden som finns för att
fånga just detta är blind för det.

## Delfråga 6 — Var kommer "Leads/intresserade" ifrån?

**Det avgörande fyndet i passet.** Appen har ingen lead-etikett i publiken
alls: `Erfarenhetsnivå` för de 373 fördelar sig på `RIM steg 1` (225),
`Genomfört RIM steg 1–2` (71), `Fjärrskådning` (62),
`Genomfört RIM steg 1–2 (upprepat)` (9), `RIM steg 1 – upprepat` (5),
`Avvikelse: RIM 2 utan RIM 1` (1). Ingen bär `Ej påbörjat`, och
`Intresserade`-vyn är en egen route (`/mer/intresserade`) som inte rör
publiken.

**Airtable-basens egen vy "Leads" (`viwu4QlLigtK2Bn3M`) är däremot trasig:**

| Mätning | Antal |
|---|---|
| Rader i vyn "Leads" | **448 av 670 (67 %)** |
| Av dem med genomförda event > 0 | **270** (max 4 genomförda) |
| Av dem med minst en anmälan | **336** (max 5 anmälningar) |
| **Vyn ∩ publiken (247→373)** | **267** |
| Vyn ∩ appens `get-leads`-filter (77) | 77 (vyn är en äkta övermängd) |

Stickprov ur snittet: `Beatrice Nilsson` — 3 anmälningar, 3 genomförda
event, deltagit i Fjärrskådning + RIM 1 + RIM 2 — **ligger i vyn "Leads"**.

Slår man upp en mottagare i basens `Leads`-vy för att kontrollera vem hon
är, får man alltså svaret "lead" för två tredjedelar av registret. Det är
den mest sannolika vägen till observation (a), och den är ett **bas-fel av
samma klass som §43** — inte ett fel i publiken.

## Domen

1. **H1 (gamla segmentregler med leads) — FALSIFIERAD.** Prod har noll
   sparade segment; `resolveSegmentMembers` fail-closed:ar på legacy-rader.
2. **H4 (motorn räknar fel rader) — FALSIFIERAD.** Närvaro-golvet håller.
   0 av 247 mottagare är lead enligt appens definition; 0 rader tappas i
   koercionen. Förhandsvisning och skarp sändning delar väg.
3. **H2 (fler namnlösa än uppstarts-fåtalet) — BEKRÄFTAD.** 248 av 670 i
   basen; **154 av 247 i den publik Marcus såg**. 100 % av de namnlösa
   mottagarnas anmälningar kommer från backfillen 2026-04-19.
4. **H3 — DELAD DOM.** Falsifierad som mappnings-fel (0 av 248 har ett namn
   appen missar). Bekräftad som renderings-fel: fallbacken är död kod
   eftersom basen skriver en icke-tom sentinel.
5. **Observation (a) "leads i publiken" — INGEN LEAD FANNS.** Rotorsaken är
   att basens vy `Leads` klassar 448 av 670 personer, varav 267 i publiken,
   som leads.
6. **Ingen skada har skett.** `sendEmail` och testmail är no-op-stubbar i
   `VariantD` (`VariantD.tsx:210-214`) — ytan når ingen mutation. Inget
   utskick har gått. Detta är ett blockerande fynd för att ta ytan skarp,
   inte en incident.

### Den avgörande delfrågan: bas-fixen ensam räcker inte

`TASK-213.4` byter `"Ej tillgängligt"` mot `BLANK()`, och dess AC #3
verifierar `PersonsList`, `PersonDetail` och `Intresserade`. De tre har
korrekt skrivna fallbacks. **Utskicksytan har det inte.** Med `BLANK()`
blir `member.namn = null`, och då gäller:

| Uttryck | Före fixen | **Efter `TASK-213.4` ensam** |
|---|---|---|
| Publiklistans rad | `Ej tillgängligt` | `(namn saknas)` ✔ |
| `{namn}` i mallen | `Ej tillgängligt` | **`(namn saknas)`** ✘ |
| `{förnamn}` i mallen | `Ej` | **`(namn`** ✘ |
| Mailtexten | *"Hej Ej,"* | ***"Hej (namn,"*** ✘ |

Bas-fixen är rätt och ska göras — men den flyttar felet i mailvägen från
pinsamt till obegripligt. **`TASK-213.4`:s AC-lista måste utökas med
segment-/utskicksytan innan skivan körs**, annars stängs kortet med felet
kvar.

## Vad jag INTE kunde belägga

- **Vyn `Leads`:s faktiska filterdefinition.** Airtables metadata-API
  exponerar inte vy-filter (`describe_table` ger namn och typ, inget mer).
  Jag prövade tolv kandidatformler mot vyns 448 rader; ingen är identisk.
  `{Har en aktiv anmälan (Ja/Nej)}='Nej'` och
  `AND(kommande utb=0, kommande fkl=0)` är båda äkta ÖVERMÄNGDER (608, noll
  saknade) — vyns filter är alltså en konjunktion som innehåller något
  sådant villkor plus minst ett till. `claude.ai`-connectorn
  (`list_views_for_table`) hade svarat auktoritativt men kräver
  interaktiv OAuth som jag inte kan slutföra. **Detta är den enda punkten
  som blockerar en färdig åtgärds-spec för rekommendation 1.**
- **Att admin.miranon.dev kör exakt `origin/main` @ `83a98b91`.** Jag läste
  koden på disk i worktreen (`5b916c1e`) och verifierade att bygget pekar
  mot prod-basen, men jag mätte inte den deployade bundlen. Om deployen
  ligger före `TASK-249.6` kan ytan ha sett annorlunda ut än den kod jag
  läste. Marcus observation stämmer dock exakt med koden som den står nu,
  vilket gör avvikelsen osannolik — men den är omätt.
- **Om Marcus faktiskt slog upp mottagarna i basens `Leads`-vy.** Att den
  vyn klassar 267 av publiken som leads är MÄTT; att det är vägen till hans
  observation är den mest sannolika förklaringen, inte ett belägg. Frågan
  avgörs med en mening från Marcus.
- **Ordningen `mottagare[0]` i den skarpa EF:en.** Jag reproducerade
  ordningen med ett REST-anrop utan `view`-parameter, samma form som
  `fetchFromAirtable`. Airtable garanterar inte ordning utan explicit
  `sort`, så ordningen kan i princip variera mellan anrop. Slutsatsen
  ("`mottagare[0]` är oftast namnlös i denna grupp") är robust ändå —
  62 % av gruppen är namnlös — men den exakta personen är inte garanterad.
- **Om `get-leads`-kommentarens redundans-premiss håller strukturellt.**
  Mätt sann i dag (0 fall), ej bevisad som invariant.

## Rekommendation

> Detta är en REKOMMENDATION, inte ett beslut. Åtgärds-scope ägs av Marcus
> (`TASK-260`). Fördelningen följer `ADR-063` beslut 2: resolution sker i
> basen, ej lappas i appen — utom där felet bevisligen ÄR appens.

### I BASEN (`ADR-063`, T16-klassen)

**B1 — Laga vyn `Leads` (NY, ej tidigare registrerad).** Vyn klassar 448 av
670 personer, varav 267 med genomförd närvaro, som leads. Den är basens
motsvarighet till appens `get-leads`-filter och bör bära samma definition:
`AND({Antal hämtningar} > 0, {Antal anmälningar (totalt)} = 0)` → 77
personer. **Förutsättning:** läs vyns nuvarande filter först (öppen punkt
ovan) så att ändringen blir en rättelse och inte en rivning av något
medvetet. Föreslås som ny post i `data-model.md` § Kända fällor och ny
skiva under `TASK-213`.

**B2 — Kör `TASK-213.4` som planerat**, men **utöka AC-listan** med
segment-/utskicksytan (se K1 nedan) och lägg till ett AC som verifierar
mailmallens `{förnamn}`/`{namn}` för en person med tomt `Namn`. Utan det
tillägget stängs kortet med felet kvar i den enda yta där det når en
mottagare.

**B3 — Uppdatera konsumtionskartan §43.** `bas-defekt-konsumtionskarta-2026-08-14.md`
listar tre konsumentytor; segment-/utskicksytan (`/mer/segment`) är en
fjärde och den enda där strängen kan lämna systemet i ett mail.

**B4 — Registrera de 20 spårlösa namnlösa.** 20 personer utan anmälningar,
utan hämtningar och utan närvaro (14 skapade 2025-11-25). Bland dem
`fornander33@gmail.com` och `formander33@gmail.com` — ett stavfelspar som
ser ut som en dubblett. Låg prioritet, men de hör hemma i registret.

### I KODEN (där felet bevisligen är vårt)

**K1 — `visatNamn` måste tåla BÅDA formerna, och `{förnamn}` behöver en
egen väg.** En fallback som testar falsy räcker inte mot en sentinel-sträng,
och en fallback-sträng får aldrig plockas isär med `split(' ')`. Formen bör
avgöras i bygget, men kravet är: en mottagare utan användbart namn ska ge
en mall som läser rätt utan namn (t.ex. att `{förnamn}` inte fylls med en
platshållare utan gör hälsningen namnlös), och `ofyllda`-varningen ska
kunna fälla för den mottagaren.

**K2 — Förhandsvisningens exempelmottagare ska väljas, inte råka bli
`mottagare[0]`.** Att exemplet blir en namnlös person i 62 % av fallen är
en funktion av walk-ordningen. En mottagare med användbart namn är ett
ärligare exempel — men ytan måste samtidigt visa hur mallen ser ut för de
namnlösa, eftersom de är majoriteten. Två exempel, inte ett.

**K3 — Publiken bör visa att den innehåller namnlösa.** 154 av 247 rader
som säger samma sak är inte en kontrollista man kan granska. Ett tal
("154 av 247 saknar registrerat namn") i `PublikSektion` gör mängden
begriplig — och hade gjort att detta QA-fynd besvarat sig självt.

**K4 — Ompröva `get-leads`-kommentarens redundans-premiss.** Byt
formuleringen "BEVISAT redundant" mot en mätt observation med datum, eller
lägg tillbaka Deltaganden-klausulen. Billig, och tar bort ett antagande som
ser ut som ett bevis.

### Ordning

`B1` först — den är billigast och stänger den observation som gjorde att
frågan ställdes. `K1` före `B2`, annars försämrar bas-fixen mailvägen.
`K3` bör följa med den skiva som gör ytan skarp.

---

## Oväntade fynd utanför frågan

1. **`Segment`-tabellen i prod är tom (0 rader).** `data-model.md` rad 458
   påstår att "prod bär de 9 legacy-raderna" (verifierat 2026-06-26). De
   finns inte längre. Registret bör rättas — och `ADR-065`:s premiss om
   legacy-Make-rader är därmed historisk, inte aktuell.
2. **`Antal genomförda event` är en lossy proxy för segment-medlemskap.**
   417 personer kvalificerar mot motorn; 377 har `Antal genomförda event > 0`.
   De **40** som skiljer är samtliga Psionautics-deltagare — kursen saknar
   eventkey-rollup. Samma familj som fälla 31 (Lucka A/C). Varje
   bas-sidig kontroll som räknar publik via det fältet räknar fel.
3. **`Har en aktiv anmälan (Ja/Nej)` och `Antal anmälningar (aktiva)`
   motsäger varandra.** Fältet säger 'Nej' för 608 personer, medan 551 har
   `Antal anmälningar (aktiva) > 0`. Minst ett av dem mäter inte vad namnet
   säger.
4. **`{Ej godkänd för mailutskick}` är fortfarande 0 i hela prod-basen**
   (ommätt 2026-08-17, samma som `T74` 2026-07-09). Consent-golvet i
   `ADR-067` D5 är alltså aldrig utövat mot verklig data — grinden finns,
   men har aldrig fällt.
5. **`SavedSegmentsList.tsx` och `SegmentMailCompose.tsx` är död kod** —
   inte monterade någonstans efter `TASK-249.5`-promoveringen. Kandidater
   för städkortet `TASK-258`.

---

## Källförteckning

**Kod, läst på disk i worktreen @ `5b916c1e` (`origin/main` @ `83a98b91`):**

- `supabase/functions/_shared/segment-resolution.ts` — `NARVARO_FILTER` (r. 64), `enrichMembers` (r. 145-165), `resolveSegmentMembers` (r. 230-257)
- `supabase/functions/_shared/segment-membership.ts` — `computeMembershipVia` (r. 169-187), `parseSegmentRule` (r. 294-303)
- `supabase/functions/compute-segment/index.ts` — r. 75, `resolveRuleMembers`
- `supabase/functions/send-email/index.ts` — r. 182-199, `amne`/`mailtext` utan per-mottagar-substitution
- `supabase/functions/_shared/prepare-bulk-send.ts` — `SendSpec` (r. 37-42) bär inget namn
- `supabase/functions/get-persons/index.ts` — `mapPerson` (r. 20-52), `BAS_FILTER` (r. 121)
- `supabase/functions/get-leads/index.ts` — `LEAD_FILTER` (r. 25-26) + redundans-kommentaren (r. 21-24)
- `src/components/segment/prototyp/VariantD.tsx` — `visatNamn` (r. 999-1001), `fyllPlatshallare` (r. 1019-1027), `DE_FJORTON_DATA` (r. 939-953), `byggDeFjorton` (r. 958-971), `mottagare[0]` (r. 4374-4376), no-op-noten (r. 210-214)
- `src/components/persons/PersonDetail.tsx` — r. 275-288, den redan bokförda noten om fälla 43
- `src/routes/_authenticated/mer/segment.tsx` — monteringen av `VariantD`

**Live-mätningar, prod-basen `app8uGPrVCVOm6LfD`, 2026-08-17, enbart GET:**

- `Personer` (`tbl6ZyCm3V026iFTU`) — 670 rader, full dump av 10 fält
- `Deltaganden` (`tbldWHH6sSHWoQPHH`) — 1 716 rader totalt, 1 248 med `Närvaropoäng=1`, full dump
- `Anmälningar` (`tbloOcrppVoyrHbrq`) — 868 rader, full dump
- `Segment` (`tbll2N6JKCj4u6y9o`) — 0 rader
- Vyn `Leads` (`viwu4QlLigtK2Bn3M`) — 448 rader, full paginering
- Tolv kandidatformler prövade mot vyns medlemsmängd

**Repo-dokument:**

- [`docs/reference/data-model.md`](../reference/data-model.md) § Kända fällor 21, 22, 31, **43**; rad 458 (Segment-tabellens ID-topologi)
- [`docs/reference/schema_reference.md`](../reference/schema_reference.md) r. 237 (`Namn`-formeln verbatim)
- [`docs/research/bas-atgardsplan-2026-08-14.md`](bas-atgardsplan-2026-08-14.md) § P1 · Å3, § öppen punkt 6
- [`docs/research/bas-defekt-konsumtionskarta-2026-08-14.md`](bas-defekt-konsumtionskarta-2026-08-14.md) §43
- [`docs/decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md`](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md)
- [`docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)
- [`docs/decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md`](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md)
- [`docs/decisions/ADR-065-segment-regel-persistens.md`](../decisions/ADR-065-segment-regel-persistens.md)
- [`docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md`](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)
- [`docs/decisions/ADR-115-segmentets-regelsprak-and-partition-tackning.md`](../decisions/ADR-115-segmentets-regelsprak-and-partition-tackning.md)
- `backlog/tasks/task-213.4` (bas-fixen), `task-213` (PRD), `task-260` (detta pass)
- [`tasks/threads/T74-consent-far-tva-sanningskallor-nar-utskick-gar-via.md`](../../tasks/threads/T74-consent-far-tva-sanningskallor-nar-utskick-gar-via.md)

**Extern förstapartskälla:**

- Airtable Web API — [`filterByFormula` / list records](https://airtable.com/developers/web/api/list-records) och [metadata: get table](https://airtable.com/developers/web/api/get-base-schema) (vy-filter exponeras inte, vilket är grunden för den öppna punkten ovan)
