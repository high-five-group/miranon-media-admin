---
owner: marcus803
updated: 2026-08-14
review_by: 2026-11-14
status: draft
---

# Åtgärdsplan för den kontinuerliga bas-maxningen — syntesen av live-kartan och konsumtionskartan

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-14, kört
> oisolerat i huvudkatalogen på gren `proto/s103-checkin-d-konvergens` @
> `9e8e8e1d`. Syntes av dagens två leveranser plus fem egna live-mätningar.
>
> **Not om de två kartorna:** de lästes som ospårade filer i arbetsträdet och
> landades av orkestreraren i `7634267c` MITT under detta pass, på identiska
> sökvägar. Innehållet jag citerar är detsamma; länkarna nedan resolvar när
> denna fil ligger i samma träd som den commiten.
>
> **READ-ONLY hela vägen.** Inga fixar är körda. Ingen tabell, inget fält,
> ingen formel, ingen option, ingen automation och ingen datarad har skapats,
> ändrats eller raderats i någon Airtable-bas. Samtliga MCP-anrop var
> `describe_table` och `list_records` (GET) mot prod. Denna fil är den enda
> som skrivits. **Planen är exekverings-underlag, inte en utförd åtgärd.**

---

## Vad jag hittade i repot först

Inventeringen kördes före första anropet, per research-passets ordning.

| Yta | Vad den redan täckte | Ålder / status |
|---|---|---|
| [`bas-defekt-kartlaggning-live-2026-08-14.md`](bas-defekt-kartlaggning-live-2026-08-14.md) | **Bas-sidan.** 22 kvarstående defekter mot live, 2 avförbara, 8 omätta, formler verbatim, Carry 11 kvantifierad, två fix-mallar som redan finns i basen. | Samma dag — håller |
| [`bas-defekt-konsumtionskarta-2026-08-14.md`](bas-defekt-konsumtionskarta-2026-08-14.md) | **App-sidan.** 23 poster med bärande fält, 10 når UI varav 7 okompenserat, `fil:rad` per konsumtionspunkt, fyra oväntade fynd. | Samma dag — håller |
| `ADR-063` § Updates 2026-08-14 | **Det styrande beslutet.** Kontinuerlig maxning; milstolpen omdefinierad till slutgenomlysning. Ännu ej mergad till `main` — läst ur `origin/docs/adr-063-kontinuerlig-bas-maxning` @ `dccc077a`. | Samma dag — styr denna plan |
| [`data-model.md`](../reference/data-model.md) § Kända fällor | Registret, poster 1–47. Sista posten är 47 (rad 1340) — nästa lediga nummer är **48**. | Ingressen är **åldrad**, se § Oväntade fynd |
| [`airtable-constraints.md`](../reference/airtable-constraints.md) | Plattformsväggarna. Avgörande för att inte planera bort en vägg som om den vore vår. | håller |
| `T16` ([`tasks/threads/README.md`](../../tasks/threads/README.md) rad 59) | Registrets hemvist, `paused`. Ingen konkurrerande åtgärdsplan finns. | håller |
| [`ADR-062`](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) beslut 2 · [`ADR-064`](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md) beslut 4 · [`ADR-066`](../decisions/ADR-066-skapa-event-write-vertikal-idempotens.md) beslut 3/6 | Ramar in §31–§35 respektive §36/§37/§45. Läsna i sin helhet. | håller |

**Ingen ADR förkastar någon åtgärd som föreslås här.** `ADR-063` beslut 2
(resolution I BASEN, aldrig lappa i appen) och § Updates 2026-08-14
(kontinuerligt, inte uppsamlat) pekar tvärtom exakt hit. Två ställen i planen
går tvärtemot en tidigare *rekommendation* — inte ett beslut — och båda är
öppet motiverade: §43 (konsumtionskartan föreslog app-fix; jag föreslår
bas-fix) och §46b:s prioritet (konsumtionskartan rankade den fyra; live-datan
sänker den).

**Vad som därför är nytt i detta pass.** De två kartorna svarar var för sig på
*vad som är trasigt* och *vem som ser det*. Ingen av dem svarar på *i vilken
ordning det ska lagas, och vad som går sönder om ordningen bryts.* Detta pass
gör det, och producerar fyra saker som inte står i någondera kartan:

1. **Tre låsta ordningsvillkor** (ett ärvt, två nya).
2. **Två bundlings-krav** där en bas-fix ensam bryter något — varav ett
   (`Månad/år` → formel bryter två Edge Functions skrivning) inte är nämnt
   någonstans.
3. **Fem nya live-mätningar**, varav två avgör en prioritering som annars var
   en uppskattning.
4. **En rivning av konsumtionskartans §43-rekommendation** som flyttar fixen
   från appen till basen och därmed in under `ADR-063` beslut 2.

---

## Kort svar

**16 åtgärder, som täcker 24 registerposter plus 2 nya. Sex av dem kräver en
mätning INNAN fixen designas färdigt. Fem poster skjuts medvetet till
slutgenomlysningen.**

**Domen i prioritetsordning, topp fem:**

1. **`Månad/år`-optionerna fylls på till december 2027 (§45/§36, interim).**
   Enda posten med ett datum: `create-event` svarar 500 på varje event från
   2027-01-01. Cirka tolv handgrepp i Airtables UI, noll app-ändring, noll
   risk. Den permanenta fixen är en annan åtgärd och behöver inte vänta på
   den.
2. **`COUNTA`-roten (§39 + §47) — en rot, två fält, tre synliga fel.**
   Maillogens två tal är båda fel på den enda ytan där ett utskicks utfall
   syns, och §47:s hål är nu **mätt: 33 personer i prod är osynliga i hela
   appen** — de faller utanför både personlistans och lead-filtrets villkor.
   Det talet var en uppskattning i går.
3. **`Personer.Namn` slutar returnera platshållarsträngen (§43).** 186
   namnlösa personer renderas i dag som namnet "Ej tillgängligt" på tre ytor,
   eftersom en icke-tom sträng passerar varje truthiness-fallback. Byts
   grenen mot `BLANK()` börjar appens BEFINTLIGA fallbacks fungera — tre ytor
   lagas av en formelgren, utan en rad app-kod.
4. **§32 före §34 — låst ordning, och §34 är det som betalar.** De 16
   oavstämda föreläsnings-Deltagandena låser upp en hel segment-modalitet.
   Stäms de av innan `Fjärrskådning ×` är modalitets-distinkt aktiveras ett
   fel för 14 rader som i dag är osynligt.
5. **§27 + de tre JS-predikaten, sedan Fynd 1.** Basens `Är aktiv` och appens
   tre kopior av den måste landa i samma andetag, annars hamnar de tyst i
   osynk. Först därefter kan `Antal anmälningar` peka om till en aktiv-räknare
   — annars ärver den nya räknaren §27:s defekt. Automation **A6** ligger i
   blast-radien.

**Den avgörande delfrågan var prioriteringsaxeln.** Konsumtionskartans
rangordning och live-kartans rangordning ger INTE samma svar, och skillnaden
är inte kosmetisk: konsumtionskartan rankar §46b fyra (den "når UI rått på två
ytor"), medan live-kartan mätte **noll instanser i prod**. Omvänt rankar
live-kartan Carry 11 först (57 av 57 personer fel), medan konsumtionskartan
visar att **inget i appen läser fältet**. Produkten av de två axlarna — inte
någondera ensam — är det som styr planen nedan, och den flyttar fyra poster
flera steg.

**Fynd 1 är verifierat, och verifieringen ändrade slutsatsen.** Mekanismen är
bekräftad mot live prod (se § Nya mätningar): `Antal anmälningar` räknar
avbokade och inställda. Men **den nuvarande UI-divergensen är noll på
kommande event** — samtliga nio avbokningar i prod ligger på ett enda
genomfört event. Posten är alltså verklig och ska registreras, men den är inte
den dagliga felkälla konsumtionskartan härledde att den var.

---

## Hur prioriteten härleds

Två axlar, multiplicerade. Deadlines slår igenom allt.

| Axel | Källa | Vad den mäter |
|---|---|---|
| **Användarpåverkan** | Konsumtionskartan | Når defekten Lottas skärm? Okompenserat? Hur många rader/personer? |
| **Svårighetsgrad och risk** | Live-kartan + denna plans mätningar | Finns en fix-mall i basen? Rör den automation, typändring eller radering? Är den reversibel? |
| **Deadline** | Live-kartan | Ett datum då felet blir driftstopp, eller data som aktiverar en latent post. |

**Regeln vid konflikt mellan kartorna:** den som MÄTT vinner över den som
härlett. Live-kartan mätte basen; konsumtionskartan läste kod och citerade
frysta schema-dokument. Där konsumtionskartan bygger på ett fryst dok och
live-kartan på ett API-svar samma dag, gäller API-svaret.

**Riskklasserna** som används per åtgärd nedan:

- **R1** — reversibel, ingen känd konsument utanför appen. Formeländring på
  ett fält som bara appen läser.
- **R2** — reversibel, men rör automation, interface, vy eller formulär.
  Kräver kartläggning av bas-sidiga konsumenter först.
- **R3** — irreversibel eller destruktiv: typändring, fältradering,
  data-mutation utan sparad förbild. Kräver export före, och egen landning.

---

## Nya mätningar i detta pass

Samtliga read-only mot **prod** (`app8uGPrVCVOm6LfD`), 2026-08-14.

| # | Fråga | Utfall | Vad det avgör |
|---|---|---|---|
| **M-a** | Har `Eventplanering.Antal anmälningar` (`fldU5MCQmagdHtz4G`) ett filtervillkor? | `type: count`, `options` = `{isValid, recordLinkFieldId}` — **inget villkor exponerat** | Schemat pekar åt "räknar allt", men Meta-API:t döljer villkor på samma sätt som rollup-aggregat. **Ej ensamt avgörande** — därför M-b. |
| **M-b** | Räknar fältet faktiskt avbokade? | Eventet `Ödeshög – Utbildning – Psionautics – 2026-05-01` (`recQ2TPsY69fQXA8a`): `Antal anmälningar` = **88**, länkarrayen = **88 unika** records, och **samtliga 9** avbokade prod-anmälningar ligger i den arrayen | **Fynd 1 BEVISAT.** Fältet räknar avbokade. Härledningen är nu en mätning. |
| **M-c** | Hur stor är den faktiska UI-divergensen i dag? | Samma event: `Antal anmälda` = 88 = `Max antal platser` ⇒ `Platser kvar` = **0** ⇒ "Fullt". Sant aktivt antal = **79**. Men **noll** av de sex kommande eventen har en avbokning. | Fynd 1:s nuvarande skada är **ett genomfört event**, inte ett dagligt fel. Sänker prioriteten mot konsumtionskartans framing. |
| **M-d** | Hur stort är §47:s hål? | **33 personer** i prod har `Antal anmälningar (totalt)` = 0 **och** `Antal hämtningar` = 0 **och** icke-tom `Alla hämtningar` | **33 leads är osynliga i hela appen.** Falsifierar `get-persons/index.ts:104-108`:s påstående att de två filtren täcker basen "utan hål". Höjer §47 från uppskattning till mätt. |
| **M-e** | Är `Personer.Namn` = "Ej tillgängligt" verkligt i prod bland personer som personlistan visar? | Ja — strängen bärs av en stor mängd personer med `Antal anmälningar (totalt)` > 0 (samma storleksordning som konsumtionskartans 186; exakt tal ej omräknat) | Bekräftar att §43:s population passerar personlistans basfilter, alltså renderas. |

**Ett negativt fynd värt att skriva ut:** prod har **endast nio** anmälningar
med `Status = "Avbokad/Ombokad"` och **två** med `Inställt`. Statusvärdet är
EN option (`Avbokad/Ombokad`), inte två. Volymen är alltså låg — vilket
dämpar både §27:s och Fynd 1:s akuta skada, utan att röra deras strukturella
riktighet.

---

## Låsta ordningsvillkor

Tre. Bryts något av dem skapas ett nytt fel av en fix.

| # | Ordning | Belägg | Vad som går sönder vid fel ordning |
|---|---|---|---|
| **O1** | **§32 FÖRE §34** | Live-kartan: 322 FS-Deltaganden = 308 `Utbildning` + 14 `Föreläsning`; endast utbildningsraderna har `Närvaropoäng` = 1; `Fjärrskådning ×` refererar aldrig `Session`/`Typ` | Stäms de 16 av först får 14 föreläsningsrader `Närvaropoäng` = 1 och räknas in som FS-**kurs**. Ett latent fel aktiveras för 14 rader. |
| **O2** | **§33 FÖRE §28:s radering** | Live-kartan: 78 personer har högre värde i det GAMLA fältet, alla 78; orsaken är Psionautics + naket "Resor i medvetandet" som det nya fältet inte fångar | Raderas det gamla fältet först förloras 78 personers Psionautics-historik ur den räknade vyn. |
| **O3** | **§27 FÖRE Fynd 1:s fix** (NY) | `Antal anmälningar` bör peka om till en aktiv-räknare; den enda aktiv-signalen i basen är `Anmälningar.Är aktiv (1/0)`, som i dag räknar `Inställt` som aktiv (§27) | Görs Fynd 1 först ärver den nya event-räknaren §27:s defekt — felet flyttas i stället för att lagas. |

`O1` och `O2` är ärvda ur live-kartan. **`O3` är ny i detta pass.**

---

## Bundlings-krav

Fyra saker måste landa ihop. Två är kända, två är nya.

### B1 (känt) — §27 + de tre JS-predikaten, samma landning

App-koden replikerar bas-defekten med avsikt på tre ställen, verifierat mot
disk i detta pass. `RegistrationStatus.AVBOKAD` är `'Avbokad/Ombokad'` och
`INSTALLT` är `'Inställt'` (`src/domain/types/Status.ts`), och predikatet är
identiskt på alla tre:

```text
src/components/events/detail/Deltagare.tsx:153-156   r.status !== RegistrationStatus.AVBOKAD
src/components/events/detail/Gruppdynamik.tsx:49-52  r.status !== RegistrationStatus.AVBOKAD
src/components/events/atgarder/AtgardsSida.tsx:3105  r.status !== RegistrationStatus.AVBOKAD
```

Alla tre bär kommentaren *"Aktiv anmälan (basens 'Är aktiv'-formel): endast
Avbokad/Ombokad räknas bort."* Fixas basen ensam blir kommentaren en lögn och
appen fortsätter räkna `Inställt` som aktiv — tyst.

### B2 (NYTT — står inte i någon av kartorna) — `Månad/år` → formel bryter två Edge Functions

Konverteras fältet till formel blir det **beräknat och därmed inte
skrivbart**. Två Edge Functions skriver det i dag, verifierat mot disk:

```text
supabase/functions/create-event/index.ts:204   'Månad/år': deriveManadAr(startdatum)
supabase/functions/update-event/index.ts:222   fields['Månad/år'] = deriveManadAr(startdatum)
```

En skrivning mot ett beräknat fält avvisas av Airtable. **Den permanenta
fixen är alltså inte en ren bas-ändring — den kräver att båda skrivningarna
tas bort i samma landning.** `create-event/index.ts:98` läser dessutom fältet
via `selectName(f['Månad/år'])`; en formel returnerar en sträng, inte en
`{name}`-form, så läsvägen behöver ses över samtidigt.

Ingen av dagens två kartor noterar detta. Konsumtionskartan citerar båda
skrivningarna, men i sitt eget syfte (att visa att väggen når UI) — inte som
ett hinder för fixen.

### B3 (känt) — §39 + §47, samma rot

`COUNTA` mättas vid 1 på länkfält — bevisat i live-kartan mot 667
prod-personer (0 länkar → 0, 1 → 1, **2 → 1** för 8 personer). Båda fälten
behöver samma fix-form: en rollup med `COUNT`-aggregering, inte en formel.
§47 är dessutom **dubbel** (fel relation *och* `COUNTA`) — att bara peka om
relationen löser hälften.

### B4 (känt, form justerad) — registerhygienen i EN landning

Carry 11 registreras som post **48**, märkt *"ej konsumerad av appen"* per
konsumtionskartan, så att en framtida läsare inte prioriterar upp den. Fynd 1
registreras som post **49**. I samma landning: avför 37 och 38, rätta §28:s
motivering, bocka §28 steg 1 (grep utförd, noll träffar), utöka §46:s
app-konsekvens-not med Intresserade-vyn, och rätta § Kända fällor-ingressen
mot `ADR-063` § Updates 2026-08-14 (se § Oväntade fynd).

---

## Prioriterad åtgärdslista

Miljöordningen är **densamma för varje åtgärd** och upprepas inte per rad:
**staging först → mät där → prod som ett EGET verifierat pass.** Live-kartan
mätte att 21 av 22 nyckelfält är byte-identiska mellan baserna, så staging är
en giltig proxy — det är mätt, inte antaget. **Undantaget är
automationsdrivna poster** (9, 12, 16, 21, 42): stagings automationer är
`undeployed`, så de kan bara observeras i prod.

### P0 — daterad

#### Å1 · `Månad/år`-horisonten, interim (§45/§36)

- **Fix:** lägg till optionerna `Januari 2027` … `December 2027` på
  `Eventplanering.Månad/år` (`fld2BjFdBd964TzVb`) i **båda** baserna.
- **Varför interim och inte direkt permanent:** den permanenta fixen är
  R3 + B2 (typändring plus två EF-ändringar). Interimet tar bort
  driftstoppet på minuter och köper tid för den permanenta att göras lugnt.
- **Utförande:** Airtables UI. **API:t kan inte** lägga till select-optioner
  (se § Vad jag inte kunde belägga, punkt 2) och MCP:ns `update_field`
  exponerar bara namn och beskrivning.
- **Verifiering:** `describe_table` mot Eventplanering i båda baserna ⇒
  `Månad/år` har 26 optioner. Sedan skarpt: skapa ett event i **staging** med
  `Startdatum` 2027-01-15 ⇒ `create-event` svarar 200 (i dag 500).
- **Rollback:** ta bort de tillagda optionerna. Riskfritt så länge ingen post
  hunnit få ett 2027-värde.
- **Riskklass:** R1.
- **Korsverifiering i appen:** `src/components/event/CreateEventForm.tsx:123`
  (felytan), `create-event/index.ts:55-60` (huvudkommentaren beskriver väggen
  och bör noteras som fortsatt sann — interimet flyttar väggen, river den
  inte).

### P1 — högst användarpåverkan, mätt

#### Å2 · `COUNTA`-roten: `Utskickslogg.Antal skickade` + `Personer.Antal hämtningar` (§39 + §47)

- **Fix, del a (§39):** ersätt `COUNTA({Skickat till})` på
  `Utskickslogg.Antal skickade` (`fldqJBTOwErzMdCAO`) med en **rollup** över
  länkfältet med `COUNT`-aggregering. `Öppningsgrad (%)` behöver inte röras —
  den ärver rätt nämnare automatiskt.
- **Fix, del b (§47):** två fel i ett fält. (1) Relationen: `Antal
  hämtningar` (`fld4UQOdKTvWixZ9F`) räknar `Engagemang` (en rad per person ×
  erbjudande), inte hämtnings-händelser (Touchpoints). (2) Funktionen:
  `COUNTA` kapar vid 1. **Besluta först vad fältet SKA betyda** — namnet
  lovar händelser, lead-filtret behöver "har hämtat något alls".
- **Mätbehov FÖRE del b:** M-d är gjord (33 personer). Kvar: avgör om
  `LEAD_FILTER` ska peka om till touchpoint-relationen eller om
  Intresserade-vyns räknarrad ska rivas (precis som den revs ur
  persondetaljen 2026-08-10). **33 är inte försumbart** — det talar för att
  peka om filtret, inte bara städa vyn.
- **Verifiering, del a:** `Utskickslogg` är **tom i båda baserna** — utfallet
  kan inte mätas på befintlig data. Skapa en **syntetisk rad i staging** med
  minst tre länkade mottagare ⇒ fältet ska visa 3, inte 1. Detta är en
  staging-mutation och hör till fixpasset, inte hit.
- **Verifiering, del b:** kör om M-d:s fråga efter fixen ⇒ mängden "osynliga"
  ska vara 0 eller förklarad.
- **Rollback:** spara den gamla formeltexten verbatim på kortet före
  ändringen; återställ genom att klistra tillbaka.
- **Riskklass:** R2 för del a (Utskickslogg rör mail-domänen och dess
  automationer), R2 för del b (Personer-vyn `Leads`, `viwu4QlLigtK2Bn3M`, är
  en trolig bas-sidig konsument — omätt).
- **Korsverifiering i appen:** `get-mail-log/index.ts:31,33` ·
  `src/components/maillog/MailLog.tsx:52,54` · `get-leads/index.ts:23-24`
  (`LEAD_FILTER`) · `src/components/intresserade/Intresserade.tsx:52-53` ·
  `get-persons/index.ts:104-108` (kommentaren om "utan hål" måste rättas
  eller göras sann).

#### Å3 · `Personer.Namn` slutar returnera platshållarsträngen (§43)

**Detta river konsumtionskartans rekommendation, öppet.** Den föreslog en
app-fix (jämför mot strängen i stället för truthiness) med motiveringen att
§43 är "ej åtgärdbart i basen". Den motiveringen blandar ihop två saker:

- **Dataförlusten** — att 365 backfill-anmälningar saknar namn — är verkligen
  inte åtgärdbar. Marcus-verifierat 2026-07-09. Det står fast.
- **Platshållarsträngen** — att formeln returnerar `"Ej tillgängligt"` i
  stället för tomt — är ett bas-designval och fullt åtgärdbart i basen.

- **Fix:** i `Personer.Namn` (`fldnYys0Ac3UGOdpe`), byt den gren som
  returnerar `"Ej tillgängligt"` mot `BLANK()`. Appens tre
  `displayName`-fallbacks är redan korrekt skrivna och börjar då fungera:
  `PersonsList.tsx:107-111` faller till förnamn/efternamn och sedan
  `'Okänt namn'`; `Intresserade.tsx:16-23` faller till
  `` `Namnlös person - ${email}` `` — en unik, skärmläsarvänlig rad-etikett;
  `PersonDetail.tsx:283-288` samma form.
- **Varför detta är rätt hemvist:** `ADR-063` beslut 2 säger resolution I
  BASEN, aldrig lappa i appen. En app-fix hade lagt en strängjämförelse mot
  ett svenskt platshållarvärde på tre ställen — en lapp som dessutom går
  sönder tyst om basens sträng någonsin ändras.
- **Mätbehov FÖRE:** (a) läs formelns verbatim text i UI:t — jag har den
  endast ur frysta dokument. (b) **Kartlägg bas-sidiga konsumenter:** elva vyer
  på Personer, plus interfaces och formulär, kan sortera eller filtrera på
  strängen. Detta är den enda åtgärden i P1 där ett tomt `Namn` kan se ut som
  en regression i Airtables egna vyer.
- **Verifiering:** efter ändringen ska M-e:s fråga ge **noll** träffar, och
  `get-persons` sorterat på `Namn` ska inte längre ge ett sammanhängande
  E-kluster. Skarp verifiering i renderad form (`L450`-familjens lärdom:
  kodläsning räcker inte).
- **Rollback:** återställ formelgrenen. Fullt reversibel — inga lagrade
  värden berörs, fältet är beräknat.
- **Riskklass:** R2 (bas-sidiga konsumenter omätta).
- **Korsverifiering i appen:** `PersonsList.tsx:107-111` ·
  `PersonDetail.tsx:283-288` och dess docstring `276-281` (som bokför
  problemet och bör uppdateras när det är löst) · `Intresserade.tsx:16-23` ·
  `get-persons/index.ts:143` (sorteringen).
- **Om Marcus förkastar bas-vägen:** konsumtionskartans app-fix är det
  korrekta andrahandsvalet, och den är billig. Men den bör då märkas med sitt
  utgångsvillkor, på samma sätt som `segment-taxonomy.ts:52-58` märker sin
  fälla-35-gren.

### P2 — ordningslåst par plus mjuk deadline

#### Å4 · `Fjärrskådning ×` görs modalitets-distinkt (§32) — **måste före Å5**

- **Fix:** räknaren får skilja `Typ`/`Session` — antingen ett sessionsfilter i
  källformeln (mall B, `Genomfört event`-mönstret) eller en separat
  föreläsnings-räknare. Vilken form som är rätt beror på om fältet ska betyda
  "FS-kurs" eller "FS totalt"; `ADR-064`:s taxonomi styr.
- **Varför den görs trots noll UI-påverkan:** §32 konsumeras inte av appen
  (segmentmotorn räknar från Deltaganden). Åtgärden görs som **skyddsräcke
  för Å5**, inte för sitt eget värde. Det ska stå i kortet, annars ser den ut
  som lågprioriterat arbete och blir bortprioriterad — varpå Å5 aktiverar
  felet.
- **Verifiering:** före Å5, kontrollera att `Fjärrskådning ×` summerar över
  endast de 308 utbildningsraderna, inte 322.
- **Rollback:** spara formeltexten verbatim; återställ.
- **Riskklass:** R1.
- **Korsverifiering i appen:** ingen konsument (konsumtionskartan: noll
  träffar). Verifiera att det fortfarande gäller vid fixtillfället.

#### Å5 · Stäm av de 16 oavstämda föreläsnings-Deltagandena (§34)

- **Fix:** ren datahandling i basen. Ingen formel ändras.
- **Varför den betalar:** låser upp en hel segment-modalitet. I dag räknar
  ett föreläsnings-segment 0 personer — korrekt beteende på fel data
  (`segment-resolution.ts:40`, `NARVARO_FILTER = '{Närvaropoäng}=1'`, golvet
  medvetet ej lättat per `ADR-064` beslut 4a). Lotta kan läsa nollan som
  "ingen gick föreläsningen".
- **Mätbehov FÖRE:** bekräfta att Å4 är landad och verifierad. **`O1` är
  obligatorisk.**
- **Verifiering:** de 16 raderna får `Närvaropoäng` = 1; ett
  föreläsnings-segment i segmentbyggaren går från 0 till ett tal som matchar
  antalet distinkta personer.
- **Rollback:** **R3-detalj** — spara de 16 record-ID:na och deras tidigare
  `Status` FÖRE ändringen. Utan förbilden går handlingen inte att ångra
  exakt.
- **Riskklass:** R3 (data-mutation).
- **Korsverifiering i appen:** `segment-resolution.ts:40` ·
  `src/components/segment/SegmentBuilder.tsx` (ytan) · `segment-taxonomy.ts`
  (taxonomin).

#### Å6 · `Totala deltaganden` och RIM 3 (§31)

- **Fix:** peka konsumenter till `Antal genomförda event`
  (`flddy8JND3YnlgZxe`), eller utöka formeln med `{RIM 3 ×}`. Live-kartans
  fix-kandidat är den första.
- **Deadline, mjuk:** första RIM 3-eventet är **2026-09-05** (10 anmälda);
  ytterligare ett 2026-11-28 (9). 36 RIM 3-Deltaganden på 17 personer väntar.
- **Ärlig prioritering:** fältet når **inte** UI — det stannar i EF-lagret
  (`get-persons/index.ts:34,38,39` med flera) och renderas av ingen
  komponent. Deadlinen gäller alltså DATAKORREKTHET, inte en skärm.
  `Erfarenhetsnivå (Miranon Media)` ärver blindheten och är i samma läge.
  Därför P2 och inte P1, trots datumet.
- **Verifiering:** efter fixen ska en person med genomförd RIM 3 ha
  `Totala deltaganden` = `Antal genomförda event`.
- **Rollback:** formeltext sparad verbatim.
- **Riskklass:** R1.
- **Korsverifiering i appen:** `get-persons/index.ts:34,38,39` ·
  `get-person/index.ts:249,253,254,303` · `get-leads/index.ts:47,51,52` ·
  `src/domain/models/Person.ts:25-26`. Ingen `.tsx` — bekräfta att det
  fortfarande gäller.

### P3 — bas plus app i samma landning

#### Å7 · `Är aktiv (1/0)` + de tre JS-predikaten (§27) — **B1, en landning**

- **Fix, bas:** utöka `Anmälningar.Är aktiv (1/0)` (`fld4j7PeckDViTdIB`) så
  att `Inställt` exkluderas.
- **Fix, app:** samma semantik i de tre predikaten (se B1). Kommentarerna
  måste uppdateras samtidigt — de påstår i dag att endast Avbokad/Ombokad
  räknas bort, vilket blir falskt.
- **Nuvarande exponering, mätt:** 2 anmälningar med `Inställt` i prod, båda
  med `Är aktiv` = 1. Låg volym, strukturellt fel.
- **Verifiering:** de 2 raderna får `Är aktiv` = 0; eventsidans register,
  Gruppdynamik och Åtgärder visar samma antal som basen.
- **Rollback:** formeltext sparad; app-ändringen revert:as som commit.
- **Riskklass:** R2 (rollupen `Antal anmälningar (aktiva)` ändras för alla
  personer; bas-vyer kan filtrera på den).
- **Korsverifiering i appen:** de tre `fil:rad` i B1 ·
  `hallplats-steg-prototyp.ts:158` (hanterar `INSTALLT` som eget
  sorteringssteg — visningen är alltså redan rätt, det är räkningen som är
  fel).

#### Å8 · Fynd 1 — `Antal anmälningar` / `Antal anmälda` (ny post 49) — **efter Å7 (O3)**

- **Bevisat i detta pass** (M-a, M-b): fältet är ett ovillkorat `count` över
  länkfältet och räknar avbokade och inställda.
- **Fix:** ersätt `count` med en **rollup över `Anmälningar.Är aktiv (1/0)`
  med SUM** — förutsatt att Å7 är landad, annars ärvs §27:s defekt.
- **BLAST-RADIUS — läs denna innan något rörs.** Följdfälten
  `Anmäld beläggning (%)` (`fldqkyeE7cVHMNRpH`), `Platser kvar`
  (`fldaqwIdTNJ54Xn5P`) och `Antal slutbetalning saknas`
  (`fldgv8tekGEbNBZfw`) bygger alla på `Antal anmälda`. Och **automation A6
  triggar på `Anmäld beläggning (%) = 1`** (`schema_reference.md:1409`). Att
  ändra nämnaren ändrar alltså **när A6 fyrar** — i en delad prod-bas där
  Psionautics är gäst. `schema_reference.md:789-790` visar dessutom ett
  interface som exponerar `Antal anmälningar` och `Anmäld beläggning`.
- **Nuvarande UI-divergens, mätt (M-c):** noll på kommande event. Ett
  genomfört event visar 88 av 88 och "Fullt" där sanningen är 79.
- **Verifiering:** på Psionautics-eventet ska `Antal anmälningar` gå 88 → 79
  och `Platser kvar` 0 → 9; eventkortets tal ska matcha eventsidans register.
- **Rollback:** återskapa `count`-fältet. **Notera:** ett fält kan inte byta
  typ via API:t, så bytet kan behöva göras som nytt fält + omstyrning av
  följdfälten — vilket gör detta till en **R3**-åtgärd, inte R1.
- **Riskklass:** R3.
- **Korsverifiering i appen:** `src/components/events/EventCard.tsx:27,77,245-246`
  · `src/components/hem/NastaEventCard.tsx:87`.

#### Å9 · `Månad/år` permanent: formel + EF-skrivningarna bort (§45/§36) — **B2**

- **Fix, bas:** konvertera `Månad/år` till en formel härledd ur `Startdatum`.
  Ger permanent horisont och river drift-risken.
- **Fix, app:** ta bort skrivningarna i `create-event/index.ts:204` och
  `update-event/index.ts:222`, och se över läsningen på
  `create-event/index.ts:98`. **Utan detta börjar båda funktionerna fela.**
- **Verifiering:** skapa och ändra event i staging över en årsgräns;
  `Månad/år` följer `Startdatum` utan att någon skriver det.
- **Rollback:** typkonvertering är destruktiv för lagrade värden —
  **exportera kolumnen först**. App-ändringen revert:as som commit.
- **Riskklass:** R3.
- **Korsverifiering i appen:** de tre EF-raderna ovan ·
  `Anmälningar.Månad/år (from Event)` (`fldZ7h3GwTZnvyRfC`) är en lookup och
  följer med automatiskt · bas-vyer som grupperar på fältet (omätt).

### P4 — stabila fel, ingen deadline

| Åtgärd | Post | Fix i korthet | Risk | Korsverifiering |
|---|---|---|---|---|
| **Å10** | §46b | Platta `Senaste interaktion (text)` med separator | R1 | `PersonsList.tsx:589-597` · `Intresserade.tsx:54` · `PersonDetail.tsx:630-664` (undviker fältet redan) |
| **Å11** | §40 + §42 | Normaliserat e-postfält på Personer (Anmälningar har redan ett); obligatorisk e-post ELLER A2 som vägrar skapa Person utan e-post | R2 | `segment-resolution.ts:122-124` · personlistan · segment-exporten |
| **Å12** | §24 | Konsolidera case-dubbletterna: 55 + 7 records till kanonisk option | R3 (data) | `PersonDetail`:s motiveringsblock |
| **Å13** | §41 | Exkludera länklösa Deltaganden i närvarobulken (stoppar tillväxten); städningen av de 48 är en **separat** destruktiv handling | R3 | närvarobulken |
| **Å14** | Carry 11 (post 48) | Mall B: sessionsfiltret ur `Genomfört event` i båda formlerna; hantera även de ledande tomraderna | R1 | **Ingen** — noll träffar i `src/` + `supabase/functions/` |
| **Å15** | §23, §25, §26, §33, §35, §46a, §28-radering | Stryk döda fält, byt hash-optionernas namn, entydig etikett, per-person-räknare för föreläsning/Psionautics | R3 för raderingar | §28: grep redan utförd, noll träffar |
| **Å16** | Registerhygien | Se B4 | R1 (docs) | `npm run check:docs` |

**Å14 ligger sist med avsikt.** Live-kartan rankade Carry 11 först — 57 av 57
personer fel är registrets största mätta påverkan. Konsumtionskartan visar att
**inget i appen läser något av fälten**, och att de två ytor som ser samma
underliggande session-dubblering redan hanterar den oberoende
(`PersonDetail.tsx:423-458`, `_shared/segment-membership.ts:27-32`).
Produkten av axlarna placerar den sist. Den ska ändå **registreras nu**, som
dokumentation av en lurande fälla för framtida konsumenter.

---

## De åtta omätta punkterna — klassade

Live-kartans § Vad jag inte kunde belägga, klassad mot *behövs före fix* eller
*kan vänta till slutgenomlysningen*.

| # | Omätt punkt | Klass | Hur den mäts, och före vad |
|---|---|---|---|
| 1 | Rollup-aggregatets uttryck går inte att läsa via API:t | **FÖRE FIX** | Läs aggregatet i Airtables UI. Krävs före Å2, Å8 och Å14 — varje åtgärd som skriver om en rollup måste veta vad den ersätter. |
| 2 | §39:s felutfall kan inte reproduceras (`Utskickslogg` tom i båda baserna) | **FÖRE FIX** | Skapa en syntetisk rad i staging med ≥3 mottagare. Krävs för att kunna bevisa att Å2a tog. |
| 3 | `Öppningsgrad (%)`-ärvningen omätt av samma skäl | **FÖRE FIX** | Följer med punkt 2 — samma rad ger båda talen. |
| 4 | §26:s orsak (vilken integration skapade hash-optionerna) | **VÄNTA** | Kräver åtkomst till Zapier/Make, inte till basen. Städningen (byt namn, backfilla) kan göras utan att roten är känd — men källan bör stängas innan, annars återkommer optionerna. Flaggas i Å15:s kort. |
| 5 | §42:s trigger-snapshot-mekanism (hypotes) | **VÄNTA** | Kräver körhistorik. Fixen (obligatoriskt e-postfält) är **oberoende av roten** och kan göras utan mätningen. |
| 6 | Vyer, formulär, interfaces och extensions är oprövade | **FÖRE FIX — den viktigaste** | claude.ai-connectorns `list_views_for_table` / `list_pages_for_base` / `get_form_schema`. Krävs före Å3, Å8 och **varje radering i Å15**. Detta är den enda omätta punkten som kan göra en fix till en regression i Airtables egna ytor. |
| 7 | Ingen fix är prövad | **PER DEFINITION** | Staging-först-ordningen ÄR svaret på denna punkt. |
| 8 | Poster 1–22:s automations-beteenden (9, 12, 16, 21) | **VÄNTA** | Kräver observerad körning i prod (staging är `undeployed`). Hör till slutgenomlysningen. §12 och §16 har dessutom noll aktuella instanser. |

**Ny mätpunkt som tillkommer i denna plan:** om `options.formula` går att
PATCH:a via Meta-API:t (se § Vad jag inte kunde belägga, punkt 1). Den
avgör om formelfixarna kan skriptas och granskas i en diff, eller om varje
en av dem är handarbete i UI:t. **Prövas i staging på ett betydelselöst fält
som första handling i fixpasset.**

Summering: **6 mätbehov före fix** (punkt 1, 2, 3, 6, `options.formula`, plus
`Namn`-formelns verbatim text i Å3), **5 poster deferade** till
slutgenomlysningen (punkt 4, 5, 8 med sina fyra underposter).

---

## Blast-radius-disciplinen — ärvd oavkortad

Ingenting i denna plan är utfört. Vad som gäller vid utförande:

- **Prod-basen är delad.** Psionautics är gäst. En ändring på Personer,
  Anmälningar eller Deltaganden träffar deras data lika mycket som vår.
  M-b:s event (`recQ2TPsY69fQXA8a`) ÄR Psionautics-eventet — Å8:s fix ändrar
  synligt tal på gästens data.
- **A1–A11 är live i prod.** Å8 rör A6:s triggervillkor direkt. Å11 rör A2.
  Varje åtgärd som ändrar ett fält en automation läser eller triggar på ska
  läsa automationens skriptkod först (claude.ai-connectorns `get_automation`,
  read-only) — `schema_reference.md` är frusen mars 2026 och räcker inte.
- **Egen landning per åtgärd, egen verifiering.** `ADR-063` § Updates
  2026-08-14 säger det uttryckligen: den försiktighet milstolpen bar gäller
  lika mycket för en enskild kontinuerlig fix.
- **Meta-API:ts gränser styr vad som kan delegeras.** Typändring och radering
  går inte via API:t. Å1, Å8, Å9 och Å15:s raderingar är därför handarbete i
  Airtables UI — de kan inte AFK-delegeras till en agent.

---

## Föreslagen arbetsform

Detta är ett **förslag**. Inga kort är skapade, inga styrande dokument är
ändrade.

**Ett PRD-kort** — *"Kontinuerlig bas-maxning — våg 1"* — med **tio skivor och
ett QA-kort**, i beroendeordning:

| Skiva | Innehåll | Beroende | Läge |
|---|---|---|---|
| 1 | Å1 — `Månad/år` interim | — | HITL (Airtable-UI) |
| 2 | **Enabling-mätpass**: rollup-aggregaten, `options.formula`-provet, bas-sidiga konsumenter (vyer/interfaces/formulär), `Namn`-formeln verbatim | — | HITL, read-only + ett staging-prov |
| 3 | Å2 — §39 + §47 | 2 | HITL bas + AFK app |
| 4 | Å3 — §43 `Namn` | 2 | HITL bas |
| 5 | Å4 — §32 | 2 | HITL bas |
| 6 | Å5 — §34 | **5 (O1)** | HITL data |
| 7 | Å6 — §31 | 2 | HITL bas |
| 8 | Å7 — §27 + tre JS-predikat | 2 | **bas + app SAMMA landning** |
| 9 | Å8 — Fynd 1 | **8 (O3)** | HITL bas + AFK app |
| 10 | Å9 — `Månad/år` permanent | 1, 2 | **bas + app SAMMA landning** |
| QA | Registerhygienen (Å16) + korsverifiering av samtliga `fil:rad` ovan | alla | AFK |

Å10–Å15 (P4) hör inte till våg 1 — de bör bli **våg 2**, eller plockas
enskilt när något annat arbete ändå rör samma yta. Att buffra in dem i våg 1
gör kortet till en hink, vilket är precis det `ADR-063` § Updates 2026-08-14
avskaffade.

**Skiva 2 är inte administration.** Den bär fyra av de sex mätbehoven, och
utan den designas fyra fixar på gissningar om vad de ersätter.

---

## Vad jag inte kunde belägga

1. **Om formelfixarna kan göras via API:t alls.** Två primärkällor säger emot
   varandra. `airtable.com/developers/web/api/update-field` listar i sin
   request-body, verbatim: *"options: object — optional. Type-specific field
   options to update. formula: string — optional. The new formula expression
   (formula fields only). Field references can use field IDs (e.g.
   {fldXXXXXXXXXXXXXX}) or field names (e.g. {My Field})."* Men
   `airtable.com/developers/web/api/field-model` markerar formula-fältets
   `options` som read-only. Den troliga upplösningen är att field-model
   beskriver LÄS-schemat och update-field SKRIV-schemat — men det är min
   tolkning, inte en mätning. **Detta är planens enskilt mest hävstångsrika
   omätta fakta:** håller update-field-sidan kan varje formelfix skriptas och
   granskas i en diff; håller den inte är varje formelfix handarbete.
   MCP-vägen är stängd oavsett — `mcp__airtable__update_field` exponerar
   endast `name` och `description`. Prövas med ett PATCH mot ett
   betydelselöst formelfält i **staging**.
2. **Att select-optioner inte kan läggas till via API:t.** Field-model-sidan
   säger att choices inte kan läggas till, byta namn eller tas bort via
   update-field. Detta kommer från en webbläsande modells sammanfattning och
   är svagare belagt än punkt 1:s verbatim-citat. Om det ändå går blir Å1 ett
   API-anrop i stället för tolv handgrepp.
3. **Att fält inte kan raderas via API:t.** Live-kartan bokför det, och jag
   fann inget delete-field-endpoint — men jag lyckades inte hämta en
   auktoritativ endpoint-lista (introduction-sidan innehåller ingen). Ärvt
   påstående, inte omverifierat.
4. **`Personer.Namn`-formelns verbatim text.** Å3 bygger på formen som
   konsumtionskartan citerar ur frysta dokument. Jag mätte **utfallet**
   (strängen finns i prod, M-e), inte formeltexten. Måste läsas i UI:t innan
   grenen ändras.
5. **Exakt antal personer med `"Ej tillgängligt"`.** Live-frågan returnerade
   en full sida under 300-cappen; jag räknade inte posterna exakt.
   Storleksordningen matchar konsumtionskartans 186. Talet är inte bärande —
   fixen är densamma vid 150 som vid 200.
6. **Bas-sidiga konsumenter, fortfarande.** Personer har elva vyer, varav en
   heter `Leads` och sannolikt filtrerar på §47:s fält. Jag läste vy-NAMNEN,
   inte deras villkor. Interfaces och formulär är helt olästa i detta pass.
   Detta är mätbehov 6 ovan, och det gäller lika mycket för denna plan som
   för live-kartan.
7. **Om `Alla hämtningar` verkligen betyder "har hämtat något".** M-d:s 33
   vilar på att en icke-tom `Alla hämtningar` innebär minst en
   hämtnings-touchpoint. Fältet är en rollup över Touchpoints; om Touchpoints
   bär andra händelseslag kan talet vara något lägre. **Riktningen står** —
   ett hål finns och det är inte noll.
8. **Ingen fix är prövad.** Passet är read-only. Varje fix-design nedan är
   härledd ur ett mönster som redan fungerar i basen eller ur en formeltext
   jag läst — men ingen av dem är körd, någonstans.

---

## Rekommendation

Detta är en **rekommendation**, inte ett beslut. Hemvist, ordning och
scope är Marcus.

1. **Kör Å1 i dag eller i morgon.** Den är billig, riskfri och den enda som
   har ett datum. Att den ligger som "interim" gör den inte mindre värd — den
   tar bort ett daterat driftstopp för ungefär tolv klick.
2. **Lägg skiva 2 (mätpasset) före allt formelarbete.** Fyra av sex mätbehov
   bor där, och `options.formula`-provet avgör om resten av vågen är
   skriptbar eller handarbete. Det är skillnaden mellan en granskningsbar
   diff och tio odokumenterade UI-ändringar i en delad prod-bas.
3. **Ta Å3 som bas-fix, inte app-fix.** Det är det enda stället i planen där
   en enda formelgren lagar tre skarpa ytor utan en rad app-kod, och det är
   den form `ADR-063` beslut 2 föreskriver. Villkoret är mätbehov 6.
4. **Håll O1, O2 och O3.** De är billiga att hålla och dyra att bryta. Skriv
   in dem som beroenderader på korten, inte som prosa i en beskrivning —
   ordningsvillkor som bara står i löptext efterlevs inte.
5. **Registrera Carry 11 och Fynd 1 nu, fixa dem sent.** Båda är verkliga.
   Ingen av dem kostar något i UI i dag. Registrering är billig; en
   felprioriterad fix är det inte.
6. **Låt P4 bli våg 2.** Våg 1 är redan tio skivor.

---

## Oväntade fynd utanför frågan

Registrerade, inte tyst förkastade.

1. **`data-model.md` § Kända fällor-ingressen är åldrad sedan i dag.** Den
   säger att registret är kravspecen för *"post-Fas-6-bas-maximeringen"* och
   att *"resolution av posten sker I BASEN vid maximeringen"*. `ADR-063`
   § Updates 2026-08-14 river exakt den premissen. Ingressen läses av varje
   agent som öppnar registret och skickar dem till en milstolpe som inte
   längre är resolutions-hemmet. Hör i Å16.
2. **`Anmälningar.Status` har EN option för avbokning, inte två.** Värdet är
   `"Avbokad/Ombokad"`. Flera dokument och kommentarer talar om dem som om de
   vore separata tillstånd. Ingen praktisk följd i dag, men det påverkar hur
   §27:s fix formuleras.
3. **Tre av de nio avbokade anmälningarna saknar `Event (namn)`** trots att
   de ligger i eventets länkarray. Antingen är lookup-fältet tomt av ett
   annat skäl, eller så finns en tredje datafälla här. Omätt — noterad, inte
   utredd.
4. **Två kommande event är överbokade i basens egna tal:**
   `Resor i medvetandet 1 – 2026-08-22` visar `Platser kvar` = **-3** och
   `Resor i medvetandet 2 – 2026-10-03` visar **-1**. Negativa värden
   renderas i eventkortets beläggningsmätare. Det är inte en defekt i sig
   (fler anmälningar än platser är ett verkligt tillstånd), men hur ytan ska
   visa ett negativt "platser kvar" är en obesvarad designfråga.
5. **`Personer` har elva vyer, `Anmälningar` sju, `Eventplanering` elva.**
   Det är en betydande bas-sidig konsumtionsyta som ingen av de tre
   kartläggningarna (live, konsumtion, denna) har öppnat. Rimlig kandidat för
   ett eget litet pass före första raderingen.
6. **`Eventplanering.Antal mottagna anmälningsavgifter` och
   `Antal mottagna slutbetalningar` rollar upp SAMMA fält**
   (`fldWr5cCPNx9HEKtL`, `Anmälningar.Status`) via samma länkfält. Två fält
   med olika namn och identisk källa. Antingen skiljer aggregatet dem åt (går
   inte att läsa via API:t — samma vägg som mätbehov 1), eller så är ett av
   dem fel. **Ej registrerad någonstans; kandidat för ny registerpost.**
   `Bekräftad beläggning (%)` och `Antal slutbetalning saknas` bygger på
   dessa två.

---

## Källförteckning

**Primärkällor — live prod (`app8uGPrVCVOm6LfD`), read-only, 2026-08-14:**

- `describe_table` Eventplanering (`tblVE3UKWl1CKrphV`, full) — `Antal
  anmälningar`-fältets `count`-konfiguration, `Månad/år`-optionslistan (14
  choices, sista `December 2026`), följdfälten
- `describe_table` Anmälningar (`tbloOcrppVoyrHbrq`, identifiersOnly) och
  Personer (`tbl6ZyCm3V026iFTU`, identifiersOnly) — fält-ID:n och vy-listor
- `list_records` Anmälningar, `OR({Är avbokad/ombokad (1/0)}=1, {Är aktiv
  (1/0)}=0)` — 9 records
- `list_records` Anmälningar, `OR({Status}="Avbokad", "Ombokad",
  "Inställt")` — 2 records med `Inställt`, båda `Är aktiv` = 1
- `list_records` Eventplanering, `{Event (text)}="Psionautics"` — M-b och M-c
- `list_records` Eventplanering, kommande event + nakna RIM-event
- `list_records` Personer, `AND({Antal anmälningar (totalt)}=0, {Antal
  hämtningar}=0, {Alla hämtningar}!="")` — **M-d, 33 records**
- `list_records` Personer, `AND({Namn}="Ej tillgängligt", {Antal anmälningar
  (totalt)}>0)` — M-e

**Primärkällor — Airtable Web API-dokumentation:**

- [`https://airtable.com/developers/web/api/update-field`](https://airtable.com/developers/web/api/update-field)
  — request-body verbatim, inklusive `options.formula`
- [`https://airtable.com/developers/web/api/field-model`](https://airtable.com/developers/web/api/field-model)
  — fältmodellen; motsäger ovanstående om formel-mutabilitet

**Repo-källor (disk, `9e8e8e1d`):**

- [`bas-defekt-kartlaggning-live-2026-08-14.md`](bas-defekt-kartlaggning-live-2026-08-14.md)
  — bas-sidan, samtliga defektnummer och formler
- [`bas-defekt-konsumtionskarta-2026-08-14.md`](bas-defekt-konsumtionskarta-2026-08-14.md)
  — app-sidan, samtliga `fil:rad`
- `docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md`
  § Updates 2026-08-14, läst ur `origin/docs/adr-063-kontinuerlig-bas-maxning`
  @ `dccc077a` (ej mergad till `main` vid passets tid)
- [`data-model.md`](../reference/data-model.md) § Kända fällor rad 1146–1341
  (poster 1–47; sista posten 47 på rad 1340)
- [`schema_reference.md`](../reference/schema_reference.md) rad 127, 789–790,
  1409 — A6:s triggervillkor och interface-ytan
- [`airtable-constraints.md`](../reference/airtable-constraints.md) —
  plattformsväggarna
- `src/domain/types/Status.ts` · `src/components/events/detail/Deltagare.tsx`
  · `Gruppdynamik.tsx` · `src/components/events/atgarder/AtgardsSida.tsx` ·
  `src/components/persons/PersonsList.tsx` ·
  `src/components/intresserade/Intresserade.tsx`
- `supabase/functions/create-event/index.ts` (rad 55–60, 98, 204) ·
  `update-event/index.ts` (rad 222)
- [`ADR-062`](../decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md)
  · [`ADR-064`](../decisions/ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md)
  · [`ADR-066`](../decisions/ADR-066-skapa-event-write-vertikal-idempotens.md)
  · [`ADR-100`](../decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md)
- [`tasks/threads/README.md`](../../tasks/threads/README.md) rad 59 — `T16`
