---
id: TASK-340
title: >-
  PRD: Skapa-flödet för genererade dokument — förhandsgranska, promovera
  utkastet, ersätt i stället för dubblett, bekräfta på plats
status: To Do
assignee: []
created_date: '2026-08-29 08:16'
labels: []
dependencies: []
ordinal: 619000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta förhandsgranskar sin bekräftelsebilaga (nytt fönster, PDF), är nöjd och trycker "Skapa bekräftelsebilaga". Då renderas dokumentet om från grunden, ett andra fönster öppnas med "samma" PDF, och en grön ruta med en "Öppna"-knapp visas under knapparna. Marcus röktest 2026-08-29: "Detta känns så ologiskt och klumpigt byggt … Detta kan omöjligen vara branschstandard." Research-passet (docs/research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md) bekräftar: sju av åtta undersökta leverantörer promoverar samma objekt över spara-gränsen — ingen renderar om — och DocRaptor slumpar PDF:ens /ID per anrop, så den fil Lotta sparar är BEVISLIGEN aldrig den fil hon granskade, inte ens med oförändrat underlag. Dessutom: ett andra tryck på "Skapa" skapar i dag en dubblett med samma filnamn som kollapsar bakom "+1 äldre fil" och inte går att radera från appen — en verklig defekt oberoende av flödesfrågan.

### Lösning

Förhandsgranska fungerar som i dag (eget fönster — det är hela poängen). Skapa promoverar det utkast Lotta redan granskat: samma bytes kopieras till eventets dokument, på ~1 sekund, utan nytt fönster. Har underlaget ändrats sedan förhandsgranskningen (t.ex. Roger redigerade eventet i Airtable) renderas dokumentet om och Lotta får veta det i klartext. Finns redan en bekräftelsebilaga för eventet ersätts den — knappen säger det ("Skapa om bekräftelsebilagan") — så inga oraderbara dubbletter uppstår. När det är klart ersätts formuläret av en tydlig bekräftelse i husets egen form (samma mönster som när ett event skapas): fokus flyttas dit, texten säger vad som hände (sparad · omgjord för att underlaget ändrats · ersatte den tidigare · platsens standard sparad), och nästa steg är Lottas VAL — "Visa dokumentet" eller "Till dokumenten". Ingen automatisk omdirigering, ingen toast, ingen tonad radmarkering. Research-passets skäl: husets egen skapa-precedent säger "kvitteras, inte bara hända"; GOV.UK:s regel för en linjär uppgift är en avslutande bekräftelse; markering av en ny rad saknar belägg hos 0 av 8 leverantörer och raden är oftast inte ny (listan kollapsar per filnamn).

### Användarberättelser

1. Som Lotta vill jag att det jag sparar är exakt det jag förhandsgranskade, så att jag kan lita på förhandsgranskningen.
2. Som Lotta vill jag att "Skapa" går snabbt och inte öppnar ännu ett fönster, så att flödet känns lugnt och logiskt.
3. Som Lotta vill jag få veta om underlaget ändrats sedan jag förhandsgranskade, så att jag kan granska igen innan jag skickar.
4. Som Lotta vill jag att ett andra "Skapa" för samma event ersätter den gamla bilagan i stället för att skapa en dubblett, så att listan inte fylls med filer jag inte kan ta bort.
5. Som Lotta vill jag att knappen säger "Skapa om …" när en bilaga redan finns, så att jag vet att jag skriver över.
6. Som Lotta vill jag se en tydlig bekräftelse när dokumentet är sparat, med vad som hände i klartext, så att jag inte undrar om det gick.
7. Som Lotta vill jag själv välja om jag vill titta på dokumentet eller gå till dokumentlistan, så att appen inte flyttar mig mot min vilja.
8. Som Lotta vill jag att förhandsgranskningen fortfarande öppnas direkt i ett eget fönster, så att jag kan läsa PDF:en i lugn och ro.
9. Som Lotta vill jag att "spara som platsens standard" fortfarande kvitteras i samma bekräftelse, så att jag ser att Rönninge fick sin parkering.
10. Som Lotta vill jag kunna göra allt med tangentbord och skärmläsare, så att bekräftelsen läses upp en gång — inte dubbelt.
11. Som Marcus vill jag att den sparade filens byte-identitet med utkastet bevisas i test, så att integritetsargumentet är mätt och inte påstått.
12. Som Marcus vill jag att beslutet om en inbäddad förhandsgranskning (option C) tas efter MIN scroll-mätning på dator och telefon, inte efter en diskussion, så att ADR-124:s enda avgörande axel respekteras.
13. Som Marcus vill jag att repots egen felaktiga determinism-källa rättas, så att kommande beslut inte bygger på ett byte-ANTAL som påstods vara byte-identitet.

### Implementationsbeslut

Orkestrerarens beslut på Marcus mandat 2026-08-29, ur research-passets dom § 7 (A + E) och rekommendation 1–7; bokförda här för granskning vid QA.

**A — Skapa promoverar utkastet.** Preview-svaret returnerar den Källhash EF:en redan beräknar (i dag kastas den bort i preview-grenen). Skapa skickar med hashen; EF:en räknar om dagens hash server-side och: (a) vid likhet OCH befintligt utkast kopieras utkastets bytes till eventets prefix med Storage copy (samma bucket) — ingen rendering; (b) vid skillnad renderas om och svaret bär underlagAndrat: true; (c) saknas utkastet renderas tyst (degradering, aldrig fel). Hashen är ett klientpåstående som ALLTID verifieras mot serverns omräkning — klienten kan inte lura sig till en promovering av fel underlag. Bäraren är svaret/anropet (research § 4 väg b), inte Storage-metadata (odokumenterad, saknas i list(), kan inte uppdateras) och inte objektnamnet (bryter ADR-124 beslut 2:s upsert-invariant). Utkastet tas bort efter promovering som i dag (rensaUtkast). Byte-identiteten bevisas i staging-test (SHA-256 över den sparade filen = SHA-256 över utkastet).

**E — ett upprepat Skapa går ersätt-vägen.** Finns redan en event-mallad rad för (event × mall) använder EF:en sitt befintliga ersatt-läge (ADR-125 § 3, regenerering är ersättning) i stället för att skapa en ny rad; svaret bär ersatte: true. EF:en avgör själv (uppslag på event + Mall + Dokumentklass) så klienten inte kan skapa en dubblett av misstag. Knappen i genereringsvyn heter "Skapa om <dokumentnamnet>" när raden finns (samma verb som listans befintliga "Skapa om"), annars "Skapa <dokumentnamn>".

**Inget fönster vid Skapa.** window.open-anropet och laddningssidan för skapa-grenen rivs; förhandsgranskningens synkrona fönster (TASK-309.26/309.38) behålls oförändrat.

**Bekräftelsen på plats, i husets form.** Efter Skapa ersätts formuläret av en bekräftelseyta (MessageBox intent success i samma mönster som CreateEventForm: den knapp som trycktes försvinner ur DOM, därför flyttas fokus till bekräftelsen — avvikelsen från MDN:s status-regel namnges i docblocket med det skälet). Texten komponeras ur svaret: "Bekräftelsebilagan är sparad bland eventets dokument." · "… Underlaget hade ändrats sedan förhandsgranskningen, så dokumentet gjordes om — förhandsgranska gärna igen." · "… Den ersatte den tidigare bilagan." · "Rönninge har nu parkering som standard." Nästa steg som två val i bekräftelsen: "Visa dokumentet" (öppnar den signerade URL:en i nytt fönster i ETT direkt klick — som i dag) och "Till dokumenten" (dokumentvyn med ?typ=bilaga). Ingen auto-omdirigering, ingen toast (toast-klassen reserveras för incidentella kvittenser, ADR-121; flödets slutpunkt är en bekräftelse), ingen tonad radmarkering (bryter radens text-bärande badge-konvention, nuqs scrollar inte, raden är oftast inte ny). Förhandsgranskningens egen ruta ("… är klar att granska") behålls i dagens form med den kvarvarande "Öppna"-fallbacken ENDAST när webbläsaren blockerat fönstret. Marcus punkt 3/4 (ingen öppna-knapp i rutan; tillbaka till listan med markerad rad) är alltså MEDVETET inte byggda som föreslaget — skälen ovan; Marcus prövar formen i QA och kan styra om.

**Skärmläsare:** RouteAnnouncer annonserar routens titel vid query-ändring (härlett ur källkod, ej kört) — skivan mäter att bekräftelsen inte dubbelannonseras och att "Till dokumenten" ger exakt en annonsering.

**Option C (inbäddad förhandsgranskning) är återöppnad men inte beslutad:** iOS 26:s UnifiedPDF falsifierar den premiss som fällde den 2026-08-22, men ADR-124 beslut 5 gäller — bara Marcus scroll avgör. Egen skiva: en engångs-mätyta bakom dev-route med den signerade URL:en i en cross-origin iframe, Marcus scrollar på dator och telefon, samtidigt mäts SW-inblandning, headers på ett 200-svar och telefonens iOS-version. Faller scrollen är C borta för gott (ADR-124 får en andra bekräftelse); håller den öppnas flödets form på nytt i en egen grillning.

**Dokumentation:** ADR-124 § Updates (preview-svaret bär hashen; utkastet promoveras vid Skapa; upsert-invarianten oförändrad), ADR-125 § Updates (E: Skapa är ersättning när raden finns), rättelse i docs/research/docraptor-minimaltest-2026-08-22.md § om "byte-för-byte identiska" (mätte byte-ANTAL ur x-pdf-bytes — ADR-083-klassen), tråd T176 bokför att listfrågan hänger på detta.

### Testbeslut

Testa externt beteende: "det som sparas är utkastets bytes", "ändrat underlag → omrendering + besked", "saknat utkast → rendering utan fel", "andra Skapa → samma rad, ingen dubblett", "inget fönster vid Skapa", "bekräftelsen tar fokus, läses en gång, erbjuder två val". Skarvar, befintliga: (1) generate-event-attachment.staging.test.ts mot deployad staging-EF (SHA-256-bevis utkast = sparad fil; hash-mismatch; utkast saknas; ersatt-vägen vid befintlig rad); (2) ren enhetstestsvit för promoveringsbeslutet i _shared (deterministisk); (3) acceptance med MSW-fixturvärld: dokument-generering-fonster-direkt (skapa-grenen öppnar INGET fönster — negativt bevis med context.waitForEvent('page') som INTE ska fira), en ny bekräftelse-svit (fokus, text-varianter ur svaret, de två valen, axe, tangentbord) och popup-policy-testet oförändrat för förhandsgranskningen; (4) aria-/visual-snapshots för genereringsvyn regenererade — facit s108-generering är ostämplat, ny baslinje efter Marcus godkännande (ADR-074). Förebilder: TASK-309.26:s sviter och CreateEventForm:s kvittens-test.

### Utanför omfattningen

Option C:s bygge (bara mätytan ingår) · toast-klassens första instans (ADR-121) · radera-knapp för event-mallade rader (D:s reversibilitet — eget beslut) · option F (ingen separat Förhandsgranska-knapp — avvisad: Marcus bad just om att döpa om den, TASK-309.38) · kvittoflödet (preview-receipt/send-receipt-email) — samma mönster kan ärvas senare men rörs inte här · DocRaptor-konsekvenserna ur research § Oväntade fynd (tyst strippade prince_options, http_timeout 10 s) — egna fynd-kort.

### Estimat

5 skivor: 1 EF — hash i preview-svar, promovering via copy, E-uppslaget (M) · 2 klient — inget fönster, "Skapa om"-etikett, bekräftelseyta med fokus och två val (M) · 3 dokumentation — ADR-124/125 Updates, determinism-rättelsen, T176 (S) · 4 mätyta för C + Marcus scroll (S, ready-for-human i mätsteget) · 5 QA (Marcus).

### ADR-koppling

ADR-124 (utkastet i Storage — beslut 1–2 och 4 gäller vidare; beslut 5:s mätregel styr C), ADR-125 § 3 (regenerering är ersättning — E bygger på den) och § 5 (EF-topologin), ADR-121 (notistrappan — bekräftelse, inte toast), ADR-103/102/074 (facit och baslinje efter godkännande), ADR-057 (EF äger promoveringen), ADR-083 (determinism-rättelsen), ADR-086. ADR-bar prövad: promoveringen och E är implementationsdetaljer under ADR-124/125:s beslut — bokförs som § Updates, ingen ny ADR. Skulle C visa sig hålla vid mätningen är DET ett över-bar-beslut (river ADR-124 beslut 1:s leveransform) och mintas då separat.

### Ytterligare anteckningar

Research-passet kördes på Opus (bokförd avvikelse), 124 verktygsanrop; tre av uppdragets premisser föll mot disk och är rättade i filen. Kostnaden är INTE argumentet — DocRaptors flata plan gör den andra renderingen gratis i dagens volym; argumenten är integritet (/ID-slumpen), 1–3 sekunder och ett fönster mindre. Marcus punkt 3 och 4 ur röktestet 2026-08-29 är medvetet besvarade med en annan form än den föreslagna, med skälen i § Implementationsbeslut — QA-kortet ber uttryckligen om hans dom på just den punkten.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön — promovering, hash-verifiering och ersätt-uppslag bor i EF/_shared
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s108-generering/facit.json: avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->
