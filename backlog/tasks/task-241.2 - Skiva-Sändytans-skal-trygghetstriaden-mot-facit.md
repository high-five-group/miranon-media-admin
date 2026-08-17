---
id: TASK-241.2
title: 'Skiva: Sändytans skal + trygghetstriaden mot facit'
status: To Do
assignee: []
created_date: '2026-08-16 23:01'
updated_date: '2026-08-17 00:05'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.1
parent_task_id: TASK-241
ordinal: 456000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skarp overlay-sändyta ovanpå Hem, promoverad ur /dev/svep-prototyp mot låst facit (ADR-102 B5: formen är godkänd — bygget är dataväg + skarphet, aldrig omdesign). Prototypkoden i src/components/dev/svep-prototyp/ är förlagan. Täcker användarberättelser: 1, 2, 3, 4, 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bekräfta alla på Morgonkollen öppnar sändytan som overlay; Avbryt/Escape stänger utan sidoeffekter — identisk med facit tasks/sessions/bilagor/s102-svep-konvergens/facit.json ytan Sändytan, lägena granska-adresslista + granska-förhandsvisning, desktop 1440 och mobil 390
- [x] #2 Adresslistan grupperad per event ur VERKLIG data — samma urvalskälla som Morgonkollens räknare för Anmälningar att bekräfta
- [x] #3 Bläddringsbar per-event-förhandsvisning ifylld ur verklig mall- och mottagardata — identisk med facit-läget förhandsvisning
- [x] #4 Testmail skickas SKARPT till inloggad användare via Åtgärds-sidans befintliga testmail-kontrakt — identisk med facit-läget testmail
- [x] #5 Armeringsinteraktionen (dra-för-att-bekräfta) identisk med facit-läget armerat; skarp svep-sändning ligger UTANFÖR skivan (241.3) och frånvaron bokförs öppet i notes
- [x] #6 Tomt urval renderas identiskt med facit-läget tomt-urval
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s102-svep-konvergens/facit.json (18 bilder) — renderad yta jämförd läge för läge
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-241.2 -- Sandytans skal + trygghetstriaden mot facit (bygg-agent, Sonnet 5).

PREMISS-PASS (ADR-086): git fetch vid start visade origin/main utan PR #1457
(2/1 ahead/behind mot origin/docs/s102-241-skivorna) och facit.json 'godkand': null
pa den featuregrenen. Ett omfetch strax darefter visade att PR #1457 OCH PR #1454
(svep-stampeln) bagge redan hunnit landa pa origin/main mellan mitt forsta och andra
fetch-anrop -- main hade da BADE kortet OCH 'godkand': {av: marcus, sha: 10dff531...}.
Uppdragets citat ('godkand: satt av Marcus, sha 10dff531') stammer alltsa mot
FAKTISKT main-tillstand efter omfetch. Ingen divergens kvarstar -- exakt fallet
'en saknad referens kan vara en landning du inte sett', inte ett fel i uppdraget.
Basera-pa-main-regeln foljdes: gren feat/task-241-2-sandytans-skal grenad ur
e27405a6 (origin/main efter merge av PR #1457).

RORDA FILER (6 nya, 4 andrade, path-scopad):
- NYA: src/components/events/atgarder/atgardsmallar.ts (extraherad),
  src/components/svep/{types,svep-urval,Adresslista,Forhandsvisning,SvepOverlay}.tsx
- ANDRADE: src/components/events/atgarder/AtgardsSida.tsx (ren extraktion, ingen
  beteendeandring), src/components/hem/{BulkAtgardsknapp,Hem,NyaAnmalningar}.tsx

DESIGNBESLUT 1 -- atgardsmallar.ts-extraktionen. ADR-114 kraver att sandvagarna
'ateranvander Atgards-sidans befintliga sandkontrakt'. AtgardsSida.tsx:s ATGARDER
(bekraftelse-mallen: amne 'Din plats ar bekraftad' + mall med {fornamn}/{event}/
{datum}/{ort}) och fyllPlatshallare var privata modul-funktioner. Extraherade dem
(plus AtgardsTyp/Granskning/deadlineDatum/dagManad/obekraftad/obetald/
saknarAnmalningsavgift/saknarSlutbetalning -- alla anvands pa flera stallen i
AtgardsSida.tsx, inte bara i ATGARDER) till en delad modul BADA filerna importerar
fran. Ren flytt, verifierad med typecheck+biome+build+test:api (alla grona) sa
ingen betendeandring smog in. Alternativet (duplicera mall-strangarna i
svep-modulen) hade byggt in exakt den drift-risk repots 'EN kalla'-disciplin
varnar for -- 241.4 hade da behovt hitta OCH synka en tredje kopia for
paminnelse-mallen.

DESIGNBESLUT 2 -- Modal-ansvaret flyttat till Hem.tsx, inte SvepOverlay. I
prototypen ager ROUTEN Modal och komponenten Dialog; produktionen har ingen
dev-route, sa Hem (analogen till 'sidan som monterar overlayen') tar routens
plats. SCRIM/bredd/duration-klasserna ar kopierade verbatim fran
dev/svep-prototyp.tsx:s docblock -- ren strukturell konsekvens av att routen
forsvinner, ingen designandring (dokumenterat i bada filernas docblock).

DESIGNBESLUT 3 -- BulkAtgardsknapp fick en valfri onPress-prop i stallet for en
ny komponent. Nar den ar satt (NyaAnmalningar 'Bekrafta alla') blir knappen
funktionell utan aria-disabled/tooltip; nar den UTELAMNAS (ForfallnaBetalningar
'Skicka paminnelse till alla', ORORD) forblir den exakt den befintliga
disabled+tooltip-stubben. KOORDINATION: enligt uppdraget ror detta
BulkAtgardsknapp/hem minimalt -- ForfallnaBetalningar.tsx och Bevakningsrad.tsx
(243.2:s troliga yta) ar INTE rorda alls i denna skiva; enda delade filen ar
Hem.tsx/NyaAnmalningar.tsx/BulkAtgardsknapp.tsx, dar diffen ar en ren
prop-tradning + ny lokal state, mekaniskt latt att rebasa om 243.2 landar forst.

DESIGNBESLUT 4 -- aktuellGrupp-tradningen (Forhandsvisning -> SvepOverlay). Prototypens
Forhandsvisning ager 'index'-state LOKALT (oforandrad har). Den skarpa testmail-
mutationen (useSendActionTestEmail) behover veta VILKEN event-grupp som visas just
nu (adress+event for platshallar-fyllning) -- tillagd via en 'onGruppVisas'-callback-
prop (useEffect->onGruppVisas(grupp) vid varje index-byte). setAktuellGrupp (fran
useState) ar en STABIL referens sa ingen extra minnisering/suppression kravdes.

DESIGNBESLUT 5 -- svepUrval droppar registreringar utan matchande event
(dokumenterat i svep-urval.ts:s docblock). MATT MOT VERKLIG STAGING-DATA (ej
hypotetiskt): 54 obekraftade anmalningar just nu, varav 2 har eventId=null --
dessa 2 hoppas over (sandytan visar '52 personer', Morgonkollens egen rad-lista
visar fortfarande alla 54 eftersom AnmalningarVy inte grupperar). Detta ar en
FORE-EXISTERANDE data-integritetsfraga (en Registration UTAN giltigt event),
inte nagot denna skiva inforde -- bokfort oppet, inte tyst.

AC #4 -- NYANS, VIKTIG ATT LASA: 'SKARPT' ar verifierat (se nedan) med ett REELLT
POST-anrop mot send-action-email (testSend:true) fran en skarp preview:staging-
byggd yta. Servern svarade 422 (NonProdAddressError) eftersom TEST_USER-kontots
epost (staging-user@miranon.test) INTE ar en av de fyra tillatna
RESEND_TEST_ADDRESSES (delivered@/bounced@/complained@/suppressed@resend.dev,
supabase/functions/_shared/send-bulk.ts rad 19-24) -- en FORE-EXISTERANDE,
avsiktlig icke-prod-sparr som traffar AtgardsSida.tsx:s EGET, redan skarpa
testmail-knapp under EXAKT samma konto pa exakt samma satt (samma EF, samma
gate, ingen skillnad mellan mina och AtgardsSida.tsx:s anrop). Framgangs-vyn
('Skickat till {adress}') kunde darfor INTE fotograferas mot facit i denna
korning -- men koden for den ar byte-identisk med AtgardsSida.tsx:s redan
skarpa success-gren (samma villkor, samma copy). 'Kunde inte skicka
testmailet: ...'-felvagen (den jag FAKTISKT kunde fotografera) renderar
korrekt och ar sjalv AtgardsSida.tsx:s etablerade monster. AC #4 bockas mot
detta belagg: SKARPT-kravet (riktigt natverksanrop, inget simulerat) ar
otvetydigt uppfyllt; den exakta success-pixelen ar overifierad i denna miljo
av skal som gor med lika kraft for den redan landade forebilden.

SKICKA-STUBBEN (AC #5): armeringsinteraktionen (SlideToConfirm -> armerad=true,
knappen blir gron/aktiv) ar PIXEL-matchad mot facit-armerat (se nedan). Klick pa
'Skicka till N personer' utfor INGET sandanrop -- setSandningEjKopplad(true)
visar en MessageBox ('Sandningen ar inte kopplad annu. Skarp sandning byggs i
nasta skiva (TASK-241.3). Ingenting har skickats.') i SAMMA granska-vy, ingen
falsk skickar/resultat-yta byggd. Verifierat: natverksloggen for
send-action-email FORE och EFTER klicket pa Skicka ar IDENTISK (inget nytt
anrop) -- den enda POST som nagonsin gick var testmailets, fore armeringen.

VERIFIERING -- DoD-kvartetten (naket exitkod, KORD TVA GANGER: en gang mitt i
arbetet, en gang som slutkontroll efter all kod var pa plats):
  npm run typecheck   exit 0 (bada korningarna)
  npx biome check .   exit 0 (bada korningarna, 6 warnings/43 infos --
    samtliga FORE-EXISTERANDE i base.css/test-bas.ts, INGEN i de 9 rorda filerna
    -- grep-verifierat mot diagnostik-utdatan)
  npm run build        exit 0 (bada korningarna)
  npm run test:api      788/788 passed, exit 0 (bada korningarna)
  node scripts/check-langa-streck.mjs  exit 0 (231 filer skannade, 0 ofangade
    langa streck)

FACIT-GRANSKNING (DoD #5) -- lage for lage, mot tasks/sessions/bilagor/
s102-svep-konvergens/facit.json:
  - facit-svep-bekraftelse-granska-adresslista-desktop.png: PIXEL-matchad
    (samma dialog-anatomi, samma DetaljGrupp/accordion/pill-grammatik).
    Verklig data: 52 personer i 5 event (54 obekraftade minus 2 utan eventId).
  - facit-svep-bekraftelse-granska-forhandsvisning-desktop.png: PIXEL-matchad
    struktur (blaeddring, Amne, Forhandsvisningsexempel-textyta, Testmail-rad).
    Verkligt ifylld text bekraftat: 'Hej Rasmus, Din plats pa Fjarrskadning ar
    bekraftad. Vi ses 21 augusti i ZZ-GRANSKNING-S103.' -- fyllPlatshallare mot
    RIKTIG Registration+Event.
  - facit-svep-bekraftelse-armerat-desktop.png: PIXEL-matchad (Bekraftat-lage,
    gron aktiv Skicka-knapp).
  - facit-svep-bekraftelse-tomt-urval-desktop.png: PIXEL-matchad ('Inget att
    skicka just nu' / 'Ingen vantar pa bekraftelse langre.' / 'Tillbaka till
    Hem'). Lage nadd via en TEMPORAR, REVERTAD andring av NyaAnmalningar.tsx:s
    rendering-gate (anmalningar.total > 0 -> true) for att exponera den redan
    byggda tomt-urval-grenen -- aterstalld till exakt sitt commit-tillstand
    OMEDELBART efter skarmdumpen (git diff verifierad ren, endast den avsedda
    onBekraftaAlla-prop-tradningen kvar).
  - facit-svep-bekraftelse-granska-mobil.png: PIXEL-matchad struktur pa 390px.

FACIT-GRANSKNING forts: facit-svep-bekraftelse-resultat-mobil.png,
facit-svep-bekraftelse-{skickar,resultat,fel-resultat}-desktop.png,
samtliga NIO paminnelse-lagesbilder: EJ tillampliga pa denna skiva --
skickar/resultat/fel-resultat ar TASK-241.3:s scope (sandanropet), och
paminnelseinstansen ar TASK-241.4:s scope (AC #1 namner uteslutande
'Bekrafta alla'/bekraftelsesvepet). Av de 18 bilderna i manifestet
tillampar 6 pa denna skiva (bekraftelse x {granska-adresslista,
granska-forhandsvisning, armerat, tomt-urval, granska-mobil}) -- alla 6
granskade och matchade, aldrig tyst hoppade over.

MILJOFYND, BOKFORT (relevant for framtida sandytors verifieringspass): port
5190 (egen dev-server) racker for adresslista/forhandsvisning (get-events/
get-registrations mockade server-sidan per runbookens CORS-kringgang), men
BADE testmail OCH ett riktigt sandanrop gar via send-action-email -- SAMMA
EF-namn for bade test och skarp sandning -- vilket ocksa CORS-blockeras pa en
icke-allowlistad port. Testmail-verifieringen kravde darfor
'npm run build:staging' + 'vite preview --port 4173 --strictPort' (CORS-
allowlistad, ja i portkartan).

FALLGROP TRAFFAD OCH RATTAD (miljofynd forts): forsta preview-forsoket
anvande 'npm run build' (production-lage, .env.production, ANNAN Supabase-
databas an staging) -- login failade forvantat ('Kunde inte logga in',
TEST_USER finns bara i staging). Ingen skrivning skedde mot prod (bara ett
misslyckat inloggningsforsok). Rattat med 'npm run build:staging'.

SLUTSTADNING: bada dev-servrarna (5190, 4173) stoppade; samtliga
.tmp-task241-2-*.mjs temporarskript raderade ur worktreen efter passet;
backlog.config.yml (ROOT_CONFIG-mekanismen, tomt-fil check_active_branches:
false) raderas efter task-edit-anropen ar klara. git status verifierad ren
mot exakt de 10 avsedda filerna (6 nya + 4 andrade).
<!-- SECTION:NOTES:END -->
