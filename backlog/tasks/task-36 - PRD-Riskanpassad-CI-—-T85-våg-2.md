---
id: TASK-36
title: 'PRD: Riskanpassad CI — T85 våg 2'
status: Done
assignee: []
created_date: '2026-07-23 17:08'
updated_date: '2026-07-30 20:39'
labels: []
dependencies: []
ordinal: 89000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Varje ändring betalar samma CI-pris. En ren CSS-token-ändring drar hela sviten
inklusive den enda staging-mutexen (~10 min plus kötid), och efter merge körs
IDENTISKT innehåll en gång till på main-push — samma mutex, samma tio minuter.
Trögheten Marcus känner är alltså inte dokumentationen eller grindvakterna
(33 s) utan ETT jobb genom EN global mutex, körd två gånger per ändring.

Ovanpå det ligger tre öppna hål. Avsiktligt röda bevis-runs (7 av de 30 senaste)
konsumerar samma kö och urvattnar rött som signal — och bevisformen tappar TYST
sitt röda varv om PR:en öppnas efter fix-committen. Det finns ingen mätning: att
CI känns långsam är en upplevelse, inte en siffra, så ingen kan säga om en
åtgärd hjälpte. Och S77:s end-pass-incident lämnade en bevis-skuld — aggregatorns
FAIL-gren är konfig-verifierad men aldrig bevisad fyra skarpt, vilket är exakt
den klass av fel som orsakade incidenten från början.

### Lösning

Gör presubmit-svitens omfattning riskproportionell mot vad som faktiskt ändrats,
sluta köra om innehåll som redan bevisats grönt, och lägg ett post-submit-nät
under selektionen så att inget som skippas före merge förblir oprövat.

Fyra rörelser som hänger ihop. En NY riskklass D1 (UI-yta) kör lint, snabbtester,
a11y och visuell regression men INTE staging — vilket ger mer relevant signal för
en CSS-ändring än dagens fullsvit gör, på en bråkdel av tiden. Merge-dedup låter
main-push-runnen känna igen ett träd som redan körts grönt och hoppa över de
tunga jobben. En nattlig fullsvit med automatisk larmkedja fångar allt som
presubmit-selektionen släppte igenom. Ett mätskript gör hastigheten till siffror
i stället för känsla.

Parallellt byter rött-först-disciplinen bärare: det röda varvet bevisas lokalt
med citerat körutdrag i stället för genom en röd CI-run i den delade kön, och
grind-bevis flyttar till riktade workflow-avfyrningar. Röd CI återfår därmed sin
enda betydelse: oväntad regression.

### Användarberättelser

1. Som utvecklare vill jag att en ren CSS-ändring får svar på ett par minuter i
   stället för tio plus kö, så att jag kan iterera på utseende utan att tappa tråden.
2. Som utvecklare vill jag att en CSS-ändring ändå prövas mot a11y och visuell
   regression, så att snabbheten inte köps med sämre signal för just den ytan.
3. Som utvecklare vill jag att allt som inte uttryckligen matchar en lägre
   riskklass kör full svit, så att en ny filtyp aldrig tyst hamnar i snabbfilen.
4. Som utvecklare vill jag att en ändring av CI-konfigurationen, låsfilen eller
   byggkonfigurationen ALLTID kör full svit, så att infrastrukturändringar aldrig
   klassas som lågrisk.
5. Som utvecklare vill jag slippa vänta på att main kör om exakt det träd som
   nyss körts grönt i PR:en, så att mutexen är ledig för nästa PR.
6. Som utvecklare vill jag att dedupen hellre kör i onödan än hoppar över något
   oprövat, så att en besparing aldrig kan bli ett hål.
7. Som utvecklare vill jag att en nattlig fullsvit prövar allt som dagens
   selektion hoppade över, så att skippen har ett nät under sig.
8. Som utvecklare vill jag att en röd nattkörning automatiskt blir ett tilldelat
   ärende med länk till körningen och commit-spannet sedan senaste gröna natt, så
   att ingen nattlig regression dör osedd i ett flöde ingen läser.
9. Som utvecklare vill jag att ett nattärende bara kan stängas med åtgärd eller
   öppen motivering, så att larmkedjan inte blir en kyrkogård.
10. Som utvecklare vill jag kunna mäta ledtid, kötid, röd-orsak per jobb,
    flaky-frekvens och dedupens träffkvot, så att jag kan avgöra om en åtgärd
    faktiskt hjälpte i stället för att gissa.
11. Som utvecklare vill jag bevisa att ett test är rött INNAN fixen genom ett
    citerat lokalt körutdrag, så att beviset inte kostar en plats i den delade kön.
12. Som utvecklare vill jag kunna bevisa att en enskild CI-grind faktiskt fyrar
    genom en riktad avfyrning, så att grind-bevis inte kräver att jag pushar rött
    till den delade sviten.
13. Som utvecklare vill jag att paraply-checken alltid rapporterar och failar
    explicit, aldrig uteblir, så att merge-grinden inte kan bli fail-open igen.
14. Som Lotta vill jag att rättningar och förbättringar når appen snabbare, så
    att vardagen påverkas av det som byggs samma dag i stället för dagen efter.

### Implementationsbeslut

**Klassrymden är en allowlist, aldrig en blocklist.** D0 (dokumentation, befintlig
och orörd), D1 (UI-yta: stilmallar, CSS, publika statiska filer) och D3 (allt
annat, default). Okänt givet klassas D3. D1 bär SAMMA exkluderingsmönster som D0
redan har — CI-workflow, paketmanifest, låsfil och byggkonfigurationer kan aldrig
bli D1. Ingen D2-klass i v1: copy-ändringar i komponentfiler är inte
path-detekterbara och klassas ärligt D3 tills en framtida testgrafs-designomgång.

**Klassningen förblir deklarativ i changed-files-steget** — inte flyttad till ett
eget klassnings-skript. Skarv-kvittensen 2026-07-23: D0 har levt deklarativt sedan
ADR-029 och dess enda verkliga bugg var en action-INPUT-bugg (quotepath, TASK-15)
som ett eget skript inte hade fångat bättre; det var kontrastbevis-runs som
fångade den. Ett eget skript hade dessutom tvingat fram en omimplementation av
glob-semantik som actionen redan äger, med divergens-risk mot D0.

**Jobb skippas internt med villkor, ALDRIG via path-filter på workflow-nivå.**
Paraply-checken måste alltid rapportera; ett workflow-nivå-filter ger den
pending-required-check-fällan. Paraply-checken behåller sitt alltid-körande
villkor ENSAMT plus steget som exit:ar med fel vid failure eller cancelled —
L322-invarianten får inte regressa när nya jobb läggs till dess beroendelista.

**Merge-dedupen bygger på git-föräldern plus körnings-API:t — INTE på cachen.**
Design-dokets ursprungliga cache-mekanism är FALSIFIERAD och öppet riven
2026-07-23: GitHubs dokumentation slår fast att en cache skapad av en
pull_request-körning skapas för merge-referensen och "can only be restored by
re-runs of the pull request". En cache skriven av PR-körningen är alltså osynlig
för main-körningen som skulle läsa den — mekanismen hade gett permanent
cache-miss, dvs noll besparing plus en onödig skrivning per PR, utan att någonsin
se trasig ut.

Ersättaren, bevisad mot faktisk disk och API 2026-07-23 på merge-commit db6ef53:

    HEAD^{tree}    == HEAD^2^{tree}     (1eaa2bb… — identiska)
    gh run list --commit <PR-head full SHA>  →  conclusion: success

Main-körningen läser alltså andra föräldern (PR-headen), verifierar att
merge-commitens träd är identiskt med PR-headens träd, och frågar körnings-API:t
om den SHA:n redan har en grön körning. Sunt TACK VARE merge-grindens strict
up-to-date-krav (ADR-076): en up-to-date-branch ger merge-commit vars träd är
identiskt med PR-headens. Fail-closed på varje avvikelse: ingen andra förälder,
träd-avvikelse, API-fel eller icke-grön körning ⇒ full svit. Steget bor i
changed-jobbet, som redan har full historik — fetch-depth-bärar-invarianten
(ADR-039/054, exakt tre bärande rader) förblir därmed ORÖRD.

**Sekvens-invariant: nightly landar FÖRE eller MED D1 och dedupen, aldrig efter.**
Nattnätet är förutsättningen som gör presubmit-selektionen försvarbar
(Google-modellens presubmit/postsubmit). Landar nätet efter står repot en period
med selektion utan nät.

**Nattkörningen tar staging-mutexen** (tom kö nattetid) och kör full svit inklusive
full visuell regression, länkkontroll utan cache och bredare sårbarhetsgranskning.
Rött skapar automatiskt ett tilldelat ärende med etikett, körningslänk och
commit-spann sedan senaste gröna natt. Stängningsregeln (åtgärd eller öppen
motivering) skrivs in i bidragsguiden vid implementation.

**Mätskriptet är ett fristående Node-skript** mot körnings-API:t, körbart både i
nattkörningen och manuellt. Läsregler kodade: full SHA krävs vid
commit-uppslag (L314) och rerun-medvetenhet vid tolkning av avbrutna körningar,
som kan vara jobb-timeout snarare än användaravbrott (L319).

**Rött-först byter bärare, inte princip.** Det röda varvet förblir OBLIGATORISKT
lokalt med citerat körutdrag (testnamn, felutfall, antal) i kort och sessionsdok.
Rött och grönt pushas IHOP så CI kör en gång, på grön head; historiken behåller
båda commits och forensiken går via git. Grind-bevis flyttar till en riktad
avfyrningsbar workflow som kör ENDAST grinden i fråga. Verkställs som amendering
av det befintliga AFK-batch-kontraktet, vars fix-vågs-punkt om rött-först-bevis
i samma körform är den rad som ändras; beslutstexten bevaras oförändrad enligt
den ADR:ens etablerade amenderingsform.

**Bevis-skulden betalas i samma våg.** Den riktade avfyrnings-workflowen bär
gate-proof för paraply-checkens FAIL-gren: den tvingar ett jobb rött och
asserterar att paraply-checken blir failure — aldrig skipped, aldrig frånvarande.

### Testbeslut

Fyra artefaktklasser med olika bevisformer — högsta BEFINTLIGA skarv per klass,
ingen ny skarv uppfunnen. Skarv-valet Marcus-kvitterat 2026-07-23.

**Klassningen och dedupen bevisas med kontrastbevis-körningar** (TASK-15-precedenten
med sina två citerade körnings-ID:n är förebilden). Klassningen kräver en tripel:
ren UI-ändring ger D1 utan staging-jobb · UI plus komponentkod ger full svit · UI
plus CI-workflow ger full svit (exkluderingen biter). Ett fjärde kontrastfall fås
GRATIS ur hygien-posten nedan: låsfilen för ignorerade filer står i exkluderingen
och bevisar den utan konstruerat fall. Dedupen kräver ett par: merge med
träff-läge hoppar över tunga jobb · avvikelse ger full svit. Alla körnings-ID:n
bokförs på skivan — ett kontrastbevis utan citerat ID är inget bevis.

**Mätskriptet testas mot fixtur-data** enligt husets etablerade mönster: nio skript
i repot bär redan formen skript plus parallell testfil med samma namnstam, och
sentinel-purgens skript-och-testpar är närmaste förebild i storlek och form.
Testerna asserterar externt beteende — härledda mått ur känd fixtur-input — aldrig
interna hjälpfunktioner.

**Paraply-checkens FAIL-gren bevisas av gate-proof-workflowen själv**, som är både
leverabel och sitt eget test: en avfyrning som inte ger failure är ett underkänt
bygge.

**Workflow-filerna gatas av befintliga statiska grindar** (actionlint med
verifierad nedladdning, yamllint, shellcheck i strikt läge) som redan kör i
lint-jobbet och lämnas orörda.

Nattkörningen kan inte vänta på klockan för sitt bevis: den ges manuell
avfyrningsmöjlighet och bevisas genom en avfyrad körning, inte genom att invänta
nattens schemalagda.

### Utanför omfattningen

Visuell regression byggd från noll (egen skiva i denna kedja, publiceras nu men
BYGGS i egen session — testkatalogen saknas på disk medan projektdefinitionerna
för de två visuella vyporterna redan finns i testkonfigurationen). En framtida
D2-riskklass, som kräver taggning av e2e per yta och är egen designomgång.
Staging-per-run-isolering och mutexens avveckling (våg 3, samdesignas med
bas-maximeringen per ADR-063; tangerar T27 och T45). Merge-kö som mekanism
(avvisad öppet: ägarform). Maskininlärd testselektion (avvisad: fel storleksklass
för detta repo). Att flytta allt tungt till natten utan presubmit-relevans
(avvisad: sen återkoppling ersätter inte snabb). Retroaktiv dokumentationsbantning.

### Estimat

Sju skivor plus ett QA-kort. Storleksklass S–M per skiva; tyngst är
visual-skivan (egen session) och nattkörningen med sin larmkedja. Skivordningen
STYRS av sekvens-invarianten: nattnätet först, därefter klassningen, därefter
dedupen.

### ADR-koppling

Ny ADR mintas vid 2a-implementationen: "Riskanpassad CI — klassning, dedup,
nightly" (över ADR-baren: svår att återställa i koherens, överraskande utan
kontext, resultat av verklig avvägning). Visual-bygget dokumenteras i samma
ADR:s konsekvensdel. Rött-först-bärarbytet landar som amendering av
AFK-batch-kontraktet, inte som egen ADR.

Styrande i området: ADR-029 (CI-arkitekturen, changed-files-idiomet,
säkerhetshärdningen) · ADR-039 och ADR-054 (fetch-depth-bärar-invarianten, som
denna våg INTE får rubba) · ADR-045 (a11y-runnerns egen dev-server, därför
mutex-fri) · ADR-060 (sentinel-purgen som föregår staging-stegen) · ADR-063
(basen som förstklassig leverabel — våg 3:s designfönster) · ADR-071
(AFK-batch-kontraktet — bärarbytets värd) · ADR-073 (mutexens beslutsgrund) ·
ADR-076 (merge-grinden — dedupens sundhetsvillkor).

### Ytterligare anteckningar

Underlaget är designdoket från S77, framtaget på Marcus delegationsmandat och
grundat i den externa processgranskningen plus Codes verifikation mot repo och
API. Delegationsmandatet gäller fortsatt: ingen ny grillning krävdes.

EN punkt i det underlaget är riven och ersatt (cache-mekanismen ovan) efter
web-research mot förstapartsdokumentation 2026-07-23. Rivningen är öppen, aldrig
tyst: designdoket bär en rättelse-not och den nya ADR:ns kontextdel bär den.

Medföljande hygien-post: katalogen med browser-verktygets artefakter läggs i
ignorerade filer och rider med klassnings-skivan (som ändå kör full svit —
marginalkostnad noll, eftersom den låsfilen står i exkluderingen och alltid drar
full körning). Forensik: katalogen har rapporterats ospårad i åtta sessioner, blev
"gitignore-kandidat" i S75:s end-pass-lista utan durabel bärare och dog med den
sessionens stängning (L321-klassen), och har stagats av misstag två gånger. Aldrig
committad ⇒ rent additiv rad. Denna gång är bäraren ett acceptanskriterium.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
- [x] #6 Kontrastbevis körda och körnings-ID:n citerade på kortet — ett bevis utan ID räknas inte
- [x] #7 L322-invarianten oregresserad: paraply-checken har alltid-kör-villkoret ENSAMT och exit:ar 1 vid failure/cancelled
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
PRD-behållare utan egna AC — fullbordan definieras av barnen, och samtliga ÅTTA är Done: 36.1 gate-proof-workflowen, 36.2 nattnätet, 36.3 D1-klassen, 36.4 merge-dedupen, 36.5 mätskriptet, 36.6 rött-först-bärarbytet, 36.7 visuell regression från noll, 36.8 QA-vandringen. Stängd 2026-07-30 (S91 artonde resumen) sedan TASK-90:s nya förälder/barn-invariant fällde den — TASK-36 var den FJÄRDE, tidigare okända träffen i klassen, funnen av agenten och inte av fyndkortet. ÖPPEN BOKFÖRING SOM FÖLJER MED, ej dold av stängningen: 36.7 stängdes med AC 7-8 (grind-jobbet + nightly) medvetet PARKERADE i tråd T87 på Marcus beslut A — aktiveringsjobbet är komplett i barnkortet, triggern är att UI-takten lugnar sig. Förälderns stängning ändrar inte det; T87 är fortfarande vilande och ägs av Marcus trigger.

— DoD KVITTERAD 2026-07-30 efter grindens fällning. Samtliga 8 barn har noll obockade DoD-punkter och status Done — inklusive #6 kontrastbevis med citerade körnings-ID:n och #7 L322-invarianten oregresserad. Verifierat mot disk. NOTERA: T87:s parkerade AC 7-8 i 36.7 är oberörda av detta — de är parkerade PÅ ett Done-kort med öppen bokföring, inte ett obockat krav.
<!-- SECTION:FINAL_SUMMARY:END -->
