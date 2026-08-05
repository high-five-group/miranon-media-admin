---
id: TASK-143
title: 'Utöka Användarinbjudan med namn och inbjudare — invite-user-EF:ens kontrakt'
status: Done
assignee: []
created_date: '2026-08-05 12:42'
updated_date: '2026-08-05 16:06'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 228000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beslut 2026-08-05 (S96): 'Vi ska DEFINITIVT ha namn där vid inbjudan!'

BAKGRUND. TASK-127.6 byggde accept-sidan (/valkommen) mot det låsta designfacitet, men kunde inte återskapa facitets personliga hälsning. Orsaken är ett kontraktsglapp, inte ett byggfel: invite-user-EF:en (TASK-127.5, ADR-092) tar emot {email, role} och bär varken mottagarens namn eller vem som bjöd in. Att härleda ett namn ur e-postadressen är dessutom redan uttryckligen förbjudet i src/lib/auth/AuthProvider.tsx.

Bygg-agenten flaggade glappet öppet i stället för att fejka copyn — korrekt, eftersom EF-kontraktet ligger utanför en accept-sidas mandat.

OMFATTNING (att specificera vid plockning, inte låst här):
- invite-user-EF:ens indata utökas med mottagarnamn och inbjudarens identitet. Inbjudaren bör härledas SERVER-SIDE ur den verifierade JWT:n, inte tas som klient-indata — samma spoof-säkra mönster som create-event-note redan använder för författar-attribution (se supabase/config.toml § functions.create-event-note).
- Var namnet lagras: user_metadata vid inbjudan, eller egen kolumn. Påverkar 06b-datamodellens tenant_memberships-väg (ADR-092 bokför den migrationen som utanför sitt eget beslut).
- Accept-sidans copy (/valkommen) återställs till facitets personliga form.
- Invite-mallen supabase/templates/invite.html kan bära namnet — mallen är redan brandad och versionerad, men skrevs utan namn-variabel.
- Vem som bjuder in visas för mottagaren: ökar tilliten till mailet, vilket är en del av varför facit hade den.

BELÄGG: TASK-127.6:s Implementation Notes (öppen fråga 2) · TASK-127.5-kortet (EF:ens kontrakt) · ADR-092 (invite-/identitetsmodellen) · facit-bilagorna tasks/sessions/bilagor/s96-auth-prototyp-facit/.

BEROENDE: TASK-127.5 (Done) äger EF:en som ska ändras. Ingen hård blockering mot pågående skivor, men bör tas FÖRE QA-kortet TASK-127.10 — annars granskar Marcus en inbjudan som medvetet saknar det han bett om.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 invite-user-EF:en tar emot mottagarens namn och härleder inbjudarens identitet server-side ur verifierad JWT — aldrig som klient-indata
- [x] #2 Accept-sidan (/valkommen) visar den personliga hälsningen enligt designfacitet
- [x] #3 Invite-mailet namnger både mottagaren och vem som bjuder in
- [x] #4 Enumeration-neutraliteten och ADMIN_EMAILS-grinden är oförändrade — utökningen får inte öppna en ny yta
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KONTRAKT: invite-user (supabase/functions/invite-user/index.ts) tar nu emot
{email, role, name} — `name` (mottagarens namn) är klient-indata, validerad
deny-by-default (icke-tom sträng, ≤200 tecken). Inbjudarens identitet härleds
SERVER-SIDE ur den ANROPANDE adminens egen redan-verifierade JWT via en
duplicerad `readDisplayNameFromJwt`-hjälpare (ADR-026 <3-tröskeln, samma
motiv som `isAdminEmail`-dubbletten redan i filen — nu 2 konsumenter med
create-event-note, ingen _shared-extraktion). Fallback-kedjan
(display_name → e-post → user-id) matchar create-event-note exakt.

LAGRING: user_metadata (INTE egen kolumn — ADR-092 lämnade frågan öppen).
Valt eftersom `display_name` redan är den etablerade namekällan för
INLOGGADE users (AuthProvider.tsx, task-1.1) — detta fyller samma fält för
en helt ny user i stället för att uppfinna en parallell namekälla. Ingen ny
ADR mintad: beslutet följer ett redan etablerat mönster (inte överraskande),
är lätt att ändra (user_metadata är inte migrations-tungt) och ADR-092
själv pekade ut frågan som öppen för DENNA skiva att avgöra.

VIKTIGT FYND, VERIFIERAT MOT GOTRUES KÄLLKOD (internal/api/invite.go via
context7): `inviteUserByEmail`s `data`-param sätter user_metadata FÖRE
mailet skickas — men BARA för en HELT NY inbjudan. För ETT OMSKICK av en
REDAN EXISTERANDE obekräftad rad tar Invite-handlern grenen `if !isCreate`
som ALDRIG tillämpar det nya anropets `data` — GoTrue bygger mailet med
raden precis som den redan låg lagrad. Mildrat (inte helt löst) genom att
EF:ens egen `updateUserById`-anrop NU SÄTTER OM user_metadata (inte bara
app_metadata.role som innan) vid VARJE anrop oavsett fresh/omskick — så en
efterföljande omskick eller accept-sidans läsning blir korrekt, men just
DEN specifika mailen för ett omskick av en rad vars metadata ännu inte
hunnit uppdateras kan sakna namn. Praktiskt overifierbart idag (noll
utestående skarpa inbjudningar existerar — DoD #7 på förälderkortet TASK-127
är fortfarande öppet) men dokumenterat i EF:ens filhuvud + invite.html:s
kommentar, inte tyst antaget bort. invite.html:s personalisering är byggd
med `{{if}}`-vakter runt `.Data.display_name`/`.Data.inviter_name` av exakt
detta skäl — Go text/template skriver bokstavligen `<no value>` för en
saknad map-nyckel, inte tom sträng.

LIVE-VERIFIERAT MOT STAGING (pqtshyierkdgwdnxuirz, service-role-nyckel
engångshämtad + ALDRIG committad, samma mönster som TASK-127.5):
1. Deployade uppdaterad invite-user till staging (`supabase functions
   deploy invite-user --project-ref pqtshyierkdgwdnxuirz`) — krävs för att
   api-staging-sviten ska pröva NYA kontraktet, inte det gamla.
2. SPOOF-IMMUNITETSBEVIS (AC#1, det säkerhetskritiska påståendet): anropade
   EF:en med en ÄKTA admin-JWT (staging-admin@miranon.test) och en payload
   som INKLUDERADE spoofade fält `inviter_name:"ATTACKER SPOOFED NAME"` och
   `invited_by:"ATTACKER"` i request-body. Admin-API-readback av den
   skapade raden (id 178dfafb-830c-4c30-9012-9b70c696ea77, RADERAD direkt
   efteråt, verifierad borta) visade `user_metadata.inviter_name =
   "staging-admin@miranon.test"` — den ANROPANDE adminens EGEN identitet,
   INTE det spoofade värdet. De spoofade body-fälten hade noll effekt,
   eftersom koden aldrig läser dem. `display_name` (klient-indata, korrekt)
   visade "Spoofcheck Namn" som skickat.
3. Städat: raden raderad via samma service-role-nyckel omedelbart efter
   läsning, verifierad borta via ett andra Admin-API-anrop.

DIFFERENTIAL-BEVIS FÖR DEN NYA name-VALIDERINGEN (bevis i båda riktningar):
temporärt avstängde name-kravet lokalt, deployade den PATCHADE versionen
till staging, körde ENDAST det nya deny-testet → RÖTT (fick 200 i stället
för väntat 400 — en riktig auth.users-rad skapades för `foo@test.local`,
samma id städat + verifierat borta via Admin-API efteråt). Återställde
KORREKT kod, redeployade, körde HELA `npm run test:api` igen → 451/451
gröna. Bevisar att grinden fäller när den ska, inte bara att den är grön.

TESTER: tests/api/invite-user.staging.test.ts — alla 6 befintliga payloads
fick `name` tillagt (annars hade "allow"/"omskick"-testerna fortsatt vara
gröna men INTE längre bevisa GoTrues redan-bekräftad-gren/idempotens, bara
råka träffa 400 på namn-valideringen först — en tyst driven testavsikt).
Ett nytt deny-test tillagt för saknat namn. tests/webblasarbeteende/
valkommen.test.ts — bygdSession/seedaInviteSession utökade med valfria
displayName/inviterName-överlägg; två nya tester bevisar BÅDA grenarna av
den personaliserade hälsningen (namn+inbjudare satta → "Välkommen, X" +
"Y har bjudit in dig…"; namn satt men inbjudare saknas → personlig rubrik,
ingen trasig "har bjudit in dig"-text). Befintliga tester (fallback utan
namn, "Du har bjudits in") lämnade OFÖRÄNDRADE — de bevisar fortfarande
den andra grenen. tests/acceptance/valkommen.acceptance.test.ts rörd EJ
(dess sessioner har tomt user_metadata sedan innan — prövar redan
fallback-grenen, ingen ändring behövdes för att förbli grön; bekräftat med
en körning).

MEDVETET UTANFÖR DETTA BYGGE: `supabase config push` av den uppdaterade
invite.html-mallen till staging. Templatet är uppdaterat och versionerat i
repot (§ ovan), men `config push` är en FULL deklarativ operation mot HELA
config.toml (dokumenterat i config.toml:s egna varningar: kräver en
snapshot-diff-före/efter-procedur, kan tyst nollställa fält som inte står i
filen). Ingen AC kräver en LIVE-verifierad mailrendering, och risken/
omfånget av en full config-push är oproportionerlig mot vad kortet ber om.
Kodgranskning + Go text/template-semantikens väldokumenterade
`{{if}}`-beteende bär AC#3:s bevis i stället. Flaggas öppet — naturlig
uppföljning om Marcus vill se den faktiska mailrenderingen live.

KÄND, OBERÖRD KANT (redan flaggad av orkestreraren, UTANFÖR detta kort):
prods mail-mallar/ämnesrader är Supabase-defaults på engelska medan staging
bär de svenska mallarna (config.toml:s content_path pekar på samma
invite.html för båda miljöerna, men prod har aldrig fått en `config push`
körd mot sig för mallarna). Rörd EJ — Marcus har redan en öppen
STOPPA-fråga om detta.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
invite-user-EF:ens kontrakt utökat till {email, role, name}. Mottagarens
namn är klient-indata (validerad, ≤200 tecken); inbjudarens identitet
härleds SERVER-SIDE ur den anropande adminens verifierade JWT (aldrig
klient-indata) — live-verifierat mot staging med ett spoof-försök i
request-body som INTE fick effekt på den lagrade metadatan. Båda fälten
lagras i user_metadata (display_name/inviter_name), samma icke-
säkerhetsbärande fält AuthProvider.tsx redan läser för inloggade users.

/valkommen visar nu "Välkommen, {namn}" + "{inbjudare} har bjudit in dig
till Miranon Media Admin. Du får rollen {roll}." när metadatan finns,
med graceful fallback till pre-TASK-143-copyn när den saknas (ingen
e-post-härledd namngissning — fortfarande förbjudet av Gunilla-principen).
invite.html personaliserar samma väg, bakom {{if}}-vakter (Go
text/template skriver annars bokstavligt "<no value>" för en saknad
map-nyckel).

Känd, dokumenterad kant: ett OMSKICK av en rad som redan var utestående
FÖRE detta korts deploy kan sakna namn i just den mailen (GoTrues
Invite-handler tillämpar aldrig ett omskicks `data`-param) — mildrat genom
att EF:ens updateUserById-anrop alltid uppdaterar user_metadata, så
efterföljande läsningar/omskick blir korrekta. Praktiskt overifierbart
idag (noll utestående skarpa inbjudningar finns).

Grindar: typecheck 0 fel, biome 0 fel (rörda filer), build grön,
npm run test:api 451/451 gröna (7 invite-user-tester, inkl. ett nytt
deny-test med differentialbevis: rött utan valideringen, grönt med).
webblasarbeteende/valkommen.test.ts 11/11 (2 nya), acceptance/
valkommen.acceptance.test.ts 4/4 (oförändrad, prövar fallback-grenen).

Medvetet UTANFÖR: `supabase config push` av invite.html till staging
(full deklarativ config-operation, oproportionerlig mot vad AC#3 kräver
— kodgranskning + Go-template-semantik bär beviset i stället). Prods
engelska mail-mallar rörda EJ (redan Marcus egen öppna STOPPA-fråga,
utanför detta kort).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
