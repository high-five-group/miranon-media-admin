---
id: TASK-284
title: 'PRD: Eventlänkens vakt och åtgärdskön'
status: To Do
assignee: []
created_date: '2026-08-21 10:40'
labels: []
dependencies: []
ordinal: 515000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta kan inte lita på att en anmälan hamnar på rätt event, och hon har ingen
väg att märka när den inte gör det.

Webbplatsens anmälningslänkar skrivs för hand per kalenderpost. När en gammal
post dupliceras följer den gamla eventnyckeln med, och anmälan hamnar då under
fel event — tyst. Mätt över hela basen 2026-08-21: 1 anmälan utan event och 64
under fel event, varav 52 legat obekräftade sedan maj under ett event som redan
genomförts. Ingen del av kedjan jämför det anmälan säger (datum, ort, kurs) med
det event den länkats till, så felet syns ingenstans förrän någon råkar leta.

Klassen har städats tre gånger (2026-04-26, 2026-08-17, 2026-08-21) och
återkommit varje gång, eftersom städningen aldrig lämnat något efter sig som
fångar nästa instans.

Den halva som saknar prefix blir synlig av en slump — appen visar "Utan event".
Den farliga halvan har rätt prefix och fel nummer, och är osynlig överallt:
anmälan ser komplett ut, deltaganden skapas på fel event, beläggningen räknas
fel, och kommande-vyn filtrerar bort raden eftersom det felaktiga eventet redan
passerat.

### Lösning

Två saker som hänger ihop: en vakt som vägrar gissa, och en yta där Lotta ser
och löser det vakten stoppat.

Vakten sitter i anmälningskedjans första steg. Den normaliserar en eventnyckel
utan prefix, jämför anmälans egna textuppgifter mot det tilltänkta eventets
motsvarande uppgifter, och lämnar eventlänken TOM när de inte går ihop. En
anmälan som inte kan verifieras länkas alltså inte alls — den blir synlig i
stället för tyst, och inga följdposter skapas på fel event.

Vid sidan av vakten står ett beräknat fält på anmälan som hela tiden visar om
raden stämmer med sitt event: OK, avviker, eller utan event. Fältet beräknas av
datakällan själv och kan därför inte råka bli osynkat eller tyst utebli — det
gör den kontroll som hittills körts som engångssvep till något som alltid är
sant.

I appen blir det en åtgärdskö: en rad på Hem som är helt osynlig när allt
stämmer och blir en klickbar uppgift när något inte gör det, en markör på den
enskilda anmälan i listan där den bor, och en väg att koppla anmälan till rätt
event direkt i appen. Lotta ska aldrig behöva gå till datakällan för att lösa
det.

### Användarberättelser

1. Som Lotta vill jag att en anmälan vars uppgifter inte stämmer med sitt event
   lämnas okopplad i stället för kopplad till fel event, så att felet blir
   synligt i stället för tyst.
2. Som Lotta vill jag se på Hem att det finns anmälningar som behöver min
   uppmärksamhet, så att jag upptäcker dem i min dagliga genomläsning utan att
   leta.
3. Som Lotta vill jag att raden på Hem är helt borta när ingenting behöver
   åtgärdas, så att en tom vy betyder att allt är i ordning.
4. Som Lotta vill jag klicka på raden och komma direkt till de anmälningar som
   behöver hanteras, så att jag slipper söka upp dem en och en.
5. Som Lotta vill jag se på den enskilda anmälan i listan att just den har ett
   problem, så att jag kan upptäcka det även när jag är där av andra skäl.
6. Som Lotta vill jag koppla en anmälan till rätt event inne i appen, så att
   jag aldrig behöver öppna datakällan för att lösa problemet.
7. Som Lotta vill jag att kopplingen jag gör inte skrivs över av systemet
   efteråt, så att rättningen håller.
8. Som Lotta vill jag se vilket event anmälan säger att den hör till innan jag
   väljer, så att jag kan koppla rätt utan att gissa.
9. Som Lotta vill jag att en anmälan försvinner ur kön när jag löst den, så att
   kön alltid speglar vad som återstår.
10. Som Lotta vill jag att anmälningar med ofullständiga uppgifter inte
    behandlas som fel, så att gamla importerade rader inte fyller kön med brus.
11. Som Lotta vill jag att expressanmälningar fungerar som förut, så att en ny
    vakt inte stoppar ett flöde som aldrig burit problemet.
12. Som Lotta vill jag att deltaganden inte skapas på ett event anmälan kanske
    inte hör till, så att närvarolistor och beläggning inte behöver städas i
    efterhand.
13. Som Roger vill jag att en felskriven anmälningslänk får konsekvenser som
    märks snabbt, så att jag hinner rätta kalenderposten innan fler anmäler sig.
14. Som Marcus vill jag att vakten fungerar även om dess egen körning fallerar,
    så att ett tyst fel i automationslagret aldrig kan släppa igenom en
    felkopplad anmälan.
15. Som Marcus vill jag kunna läsa vaktens logik i repot, så att en ändring i
    datakällan inte är osynlig för kodgranskning.
16. Som Marcus vill jag att antalet felkopplade anmälningar går att läsa av när
    som helst, så att jag inte behöver köra ett svep för att veta läget.
17. Som utvecklare vill jag att kopplingsoperationen prövas i samma testform som
    övriga skrivoperationer, så att den inte blir ett undantag i
    behörighetsmodellen.
18. Som utvecklare vill jag att åtgärdskön testas i sitt tomma läge lika noga
    som i sitt fyllda, så att den osynliga formen inte tyst går sönder.

### Implementationsbeslut

Fattade i ADR-122 efter grillning; här bara det som styr bygget.

**Vakten bor i anmälningskedjans matchningssteg i datakällan**, som ett
skriptsteg. En Edge Function-hemvist förkastades: datakällan kan inte anropa en
funktion vid radskapande utan att en automation gör det ändå, så den vägen
lägger till ett led i stället för att ersätta ett. Priset — inget versionslager,
ingen CI — betalas genom att skriptets kod checkas in i repot som källa.

**Vakten vägrar länka vid avvikelse.** Aldrig länka-och-flagga, aldrig
auto-korrigera mot texten. Skälet är att den formen är fail-closed by
construction: fallerar skriptet blir eventlänken tom, vilket är samma utfall som
en medveten fällning. Automationslagrets körstatus är dokumenterat opålitlig
("kördes utan fel" trots utebliven sidoeffekt), så en vakt vars enda spår är en
loggrad kan inte litas på. Att vägra länka har inte den svagheten.

**Jämförelsen är strängmatchning, inte datumtolkning.** Eventet bär redan
datumet i exakt den textform anmälan får det, och tre av jämförelsefälten finns
redan som uppslag från det länkade eventet. Ett uppslagsfält till, plus ett
beräknat fält, kompletterar jämförelsen.

**Tomt fält betyder "kan inte avgöras", aldrig "avviker".** Importerade rader
saknar ortsuppgift; en regel som fäller på tomt skulle döma varje sådan rad.
Valideringen är alltså trestegs.

**Vakten gäller huvudformuläret.** Expressformuläret bär ingen eventnyckel och
matchas på annan väg; en vakt som fäller på hela flödet skulle stoppa anmälningar
som aldrig burit felet.

**Kopplingsoperationen sätter både eventlänken och eventnyckeln i samma
skrivning.** Matchningssteget kör vid varje radskapande och kan annars nollställa
en länk som satts på annat håll; att skriva båda gör operationen idempotent.
Samma form som den befintliga operationen för att skapa anmälan redan använder.

**Åtgärdskön på Hem är en ny radtyp i den befintliga bevakningsraden, inte en ny
yta.** Bevakningsraden bär redan exakt rätt beteende: helt frånvarande vid noll
träffar, klickbar uppgiftsrad vid träff, och klicket öppnar en förfiltrerad
åtgärdsyta. Formen är godkänd sedan tidigare och ska inte uppfinnas igen.

**Hem-vyns facit amenderas additivt.** Vyns facit är stämplat och dess bilder
visar Hem utan denna radtyp. Promoveringsgrinden ankrar på aktivitetsspalten och
fälls därför inte av tillägget — mätt, inte antaget. Kvar är en koherensfråga,
och den följer den precedent som redan satts för motsvarande tillägg i
personlistan: tillägget byggs mot en orörd befintlig form, Marcus godkänner
visuellt, och först därefter uppdateras facit med hans citat som daterad
amendering. Ordningen är enkelriktad.

**Fältet är sanningen appen läser.** Kön, markören och räknaren härleds ur det
beräknade fältet, aldrig ur en egen klientberäkning — annars kan två ytor säga
olika saker om samma rad.

### Testbeslut

Testa det yttre beteendet: att en anmälan med motstridiga uppgifter INTE får
någon eventlänk, att kön räknar rätt, att raden är helt borta vid noll, och att
en genomförd koppling tar bort raden ur kön. Testa aldrig hur jämförelsen är
formulerad internt.

**Tre befintliga skarvar, ingen ny testfil.** Snittet är avgjort och motiverat:

- **Kopplingsoperationen** prövas i `update-record.staging.test.ts`, som redan
  bär allowlist-mönstret i tre lägen (okänd operation nekas, fält utanför
  listan nekas, tillåten operation muterar och restaurerar). Den nya
  operationen faller rakt in i den formen och ska pröva samma tre lägen plus
  att båda fälten skrivs.
- **Kön på Hem** prövas i `hem.acceptance.test.ts`, som redan bär två
  bevakningsradstester — ett för radens plats mellan sina grannar när den finns,
  ett för att den är HELT frånvarande ur DOM:en vid noll träffar. Den nya
  radtypen prövas i samma två former.
- **Markören** prövas i `mer-anmalningar.acceptance.test.ts`, som redan testar
  att en rad utan event visas olänkad. Markören för avvikande rad hör till
  samma test.

Tillgänglighet prövas i den befintliga axe-körningen på Hem; markören får aldrig
bära betydelse enbart genom färg.

Det tomma läget är lika viktigt som det fyllda: en kö som felaktigt visar sig vid
noll träffar är en regression, inte en skönhetsfläck.

### Utanför omfattningen

- Redigering av kalenderposterna på webbplatsen — rotfixen ägs av Marcus och
  Roger och är en förutsättning, inte en del av bygget.
- Driftdetektor mot kalenderwidgeten — medvetet bortval, registrerad som egen
  tråd med nedskriven omprövningstrigger.
- De historiska rader som väntar på Lottas besked om vilket event de hör till.
- Migrering av vakten till serverlogik — hör till ett senare spår.
- Övriga klasser av avvikelse än eventkopplingen; kön får sin första instans
  här, inte sin fulla katalog.

### Estimat

Fyra skivor plus ett QA-kort. Medelstor arbetsenhet — merparten av mekaniken
finns redan (bevakningsraden, allowlist-formen, jämförelsefälten), och det som
byggs nytt är ett skriptsteg, två fält, en operation och en radtyp.

### ADR-koppling

- **ADR-122** — styrande för hela arbetsenheten: vaktens verkningsgrad,
  fältformen, hemvisten, åtgärdsköns tre delar, och familjegränsen mot
  notisfamiljen. Åtta beslut, fem förkastade alternativ.
- **ADR-063** — datakällan som förstklassig leverabel; skälet till att
  resolution sker i basen och inte som kompensation ovanpå.
- **ADR-121** — notistrappan; åtgärdskön ligger uttryckligen VID SIDAN av den,
  eftersom trappans klasser är händelsebundna och en åtgärdspost är
  tillståndsbunden.
- **ADR-102 / ADR-103** — facitkontraktet; styr den additiva amenderingen av
  Hem-vyns facit.
- Inget nytt över-bar-beslut väntas i skivorna. Uppstår ett, mintas det separat
  och refereras — aldrig inline.

### Ytterligare anteckningar

**Fem poster är overifierade och öppet bokförda** i sessionsdokets Del 3 § E.
Ingen av dem påverkar designen, alla landar i skivorna: att matchningsstegets
skript kan villkora själva länkningen (formen är bevisad av ett systersteg i
samma kedja, men steget självt är inte läst live i denna session) · om två
datumfält på anmälan är uppslag eller egna fält · att de två kända falskt
positiva är en tidigare klassning och inte egen mätning — de är facit för
valideringens tröskel · att uppslagsfält returnerar listor, vilket jämförelsen
måste hantera · om Lotta faktiskt använder kön, vilket är obelagt och bör
observeras snarare än antas.

**Skivningen är inte avgjord i förväg.** En skiva som bara ger synlighet är
horisontell och strider mot arbetsformen; den vertikala formen är sannolikt en
yta hela vägen — markör, val av event, genomförd koppling — före kön som egen
ingång med räknare. Avgörs vid nedbrytningen.

**Falsk-positiv-risken är högst FÖRE rotfixen, inte efter.** Så länge
länktexterna skrivs för hand kan en korrekt anmälan bära en avvikande
formulering; när länkarna hämtas ur datakällans egen kanoniska form byggs texten
av samma fält som valideringen jämför mot, och matchningen blir definitionsmässigt
exakt. Det är motsatt den ordning man intuitivt antar, och värt att minnas när
tröskeln sätts.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
