---
id: TASK-127
title: 'PRD: Användarinbjudan och auth-flödet (T95 Spår B)'
status: To Do
assignee: []
created_date: '2026-08-02 14:16'
labels: []
dependencies: []
ordinal: 199000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Det finns i dag inget sätt att ge Roger & Lotta varsitt konto på ett
professionellt sätt: kontot skapas manuellt av Marcus och lösenordet
överlämnas via sidokanal. Det finns ingen glömt-lösenord-väg alls — den
dag Lotta glömmer sitt lösenord fastnar hon permanent. Första skärmen de
möter är rå och ligger utanför designsystemet, med en ouppfylld
refaktor-TODO sedan Fas 3. Och auth-mail kan inte ens levereras till deras
adresser: default-SMTP:n vägrar externa mottagare. Roger är f.d.
cybersäkerhetsexpert — mail-autentisering, tokenhantering och
enumeration-skydd ÄR förstaintrycket, inte teknisk bakgrund.

### Lösning

Ett komplett, brandat inbjudningsflöde (S95-grillningens beslut 3–8):
Marcus utlöser en användarinbjudan → mottagaren får ett brandat mail från
den sändande subdomänen → accept-sidan visar e-posten förifylld och LÅST
och låter mottagaren sätta lösenord enligt ASVS-golvet → inloggning sker
på en login-vy omskriven till designsystemet → efter första inloggningen
erbjuds passkey som frivillig uppgradering. Glömt-lösenord-flödet byggs i
samma svep. Auth-mailen går via custom SMTP mot Resend; domänen bär
DMARC p=reject.

### Användarberättelser

1. Som Lotta vill jag få en personlig inbjudan i min inkorg som ser ut
   att komma från Miranon Media, så att jag litar på den och vågar klicka.
2. Som Lotta vill jag kunna öppna inbjudan i morgon kväll och fortfarande
   komma in, så att jag inte straffas för att jag inte satt vid mailen.
3. Som Lotta vill jag att min e-postadress redan är ifylld och inte går
   att ändra på accept-sidan, så att jag inte kan råka skriva fel och
   låsa ute mig själv.
4. Som Lotta vill jag få tydlig, snäll vägledning när jag väljer
   lösenord, så att jag förstår vad som krävs utan att känna mig dum.
5. Som Lotta vill jag kunna klicka "glömt lösenord" och lösa det själv på
   en minut, så att jag aldrig behöver be någon om hjälp för att komma in.
6. Som Roger vill jag att inbjudningsmailet kommer från en korrekt
   autentiserad domän (SPF, DKIM, DMARC med skarp policy), så att min
   granskning av headern bekräftar att avsändaren gör rätt.
7. Som Roger vill jag att invite-länken är engångs och tidsbegränsad, så
   att en läckt länk är värdelös efter användning eller utgång.
8. Som Roger vill jag att inloggningen aldrig avslöjar om en adress finns
   i systemet — varken i felmeddelande eller svarstid — så att
   användarlistan inte går att kartlägga utifrån.
9. Som Roger vill jag kunna aktivera passkey efter första inloggningen,
   så att mitt konto bär en stark, nätfiskesäker faktor.
10. Som Roger vill jag att min roll är bestämd av inbjudan och inget jag
    själv väljer vid accept, så att flödet inte kan användas för att ta
    över eller höja behörighet.
11. Som Marcus vill jag utlösa en inbjudan utan att logga in i någon
    leverantörs-dashboard, så att inbjudan är ett arbetsmoment och inte
    ett administrationsärende.
12. Som Marcus vill jag kunna skicka om en inbjudan vars länk hunnit gå
    ut, så att undantagsfallet är en knapptryckning och inte felsökning.
13. Som Marcus vill jag att gamla vägen (manuellt konto + lösenord via
    sidokanal) dör med detta flöde, så att det inte finns två sanningar
    om hur användare föds.
14. Som framtida produktbyggare vill jag att invite-maskineriet är byggt
    så att en riktig roll-/medlemsmodell kan ersätta dagens
    admin-lista utan att flödet byggs om, så att investeringen bär nästa
    produkt.

### Implementationsbeslut

- Inbjudan utlöses via en egen Edge Function (admin-handling med secret
  key — aldrig från klienten), grindad bakom den befintliga
  admin-allowlistan och byggd icke-breaking mot den framtida
  medlemsmodell som koden redan pekar ut som ersättare.
- Roll och e-post låses av inbjudan; accept-sidan kan inte ändra någon av
  dem (account-takeover-vägen stängd by design).
- Token-livslängd 24 timmar — plattformens verifierade tak, globalt för
  alla e-postlänkar; att även reset-länken lever 24 h är öppet bokfört
  och bärs av engångs-egenskapen. EF:en bär en omskicks-väg för utgångna
  länkar.
- Lösenord vid accept enligt ASVS 5.0 V6-golvet: minst 8 tecken med 15
  starkt rekommenderat, kontroll mot läckta lösenord,
  enumeration-neutrala svar inklusive svarstid, engångstoken som dör vid
  användning.
- Passkey erbjuds EFTER första inloggningen som frivillig yta —
  beta-risken i plattforms-API:t isoleras där; lösenordet är alltid
  fallback. TOTP-MFA byggs inte i v1 (öppen decline med trigger).
- Auth-mail via custom SMTP mot Resend från den sändande subdomänen
  (S95-beslut 3); leverantörsmallarna brandas. DMARC p=reject med
  rua-rapportering sätts innan första mailet går (S95-beslut 4).
- Login-vyn skrivs om till designsystemet som egen skiva — klar INNAN
  första skarpa inbjudan går ut; koordination med parallella UI-sessionen
  bokförs på skivan.
- Accept- och återställningssidorna ligger utanför det autentiserade
  skalet och bär samma designsystem som resten av appen.
- Omdirigeringsmål för mail-länkarna registreras i plattformens
  allowlist; ny app-origin kräver CORS-utökning (Grind 0-paketet, T46).

### Testbeslut

- Invite-EF:ens externa beteende (grind, validering, deny-beteende,
  omskick) testas i api-skarven enligt repots etablerade EF-testmönster
  med deny-triple.
- Nya sidor och flödestillstånd (login, accept, glömt/återställ) testas i
  acceptance- + a11y-skarvarna; enumeration-neutralitet testas som
  externt beteende (svar och timing), aldrig som implementationsdetalj.
- HELA rundturen — inbjudan → mail-länk → accept → inloggning — bevisas
  med ETT staging-e2e-flöde i den autentiserade e2e-skarven; en rundtur,
  inte många.
- Förebild: EF-familjens befintliga api-sviter och login-flödets
  befintliga e2e.

### Utanför omfattningen

- Self-service invite-yta i appen (öppen decline tills fler användare än
  två — S95 Del 2).
- TOTP-MFA (skjuten; trigger: Roger efterfrågar eller L2-ambition uttalas).
- Team-/rollmodellen (medlemsmodellen) — eget framtida spår; detta kort
  får inte försvåra den.
- Bulk-mail till deltagare och Grind F (T55) — annan kanal, blandas
  aldrig ihop med auth-mail.
- Publik deploy, DNS-records, SMTP-koppling i leverantörspaneler —
  Grind 0-paketet i T46:s go-live-karta (Marcus-moment + Code på
  repo-sidan).

### Estimat

8–12 skivor, klass M/L. Sex distinkta ytor varav fyra är helt nya sidor;
grönfält utan befintlig kod att luta sig mot, full ribba + e2e per yta.

### ADR-koppling

- Ur detta kort mintas TVÅ ADR:er FÖRE första skivans bygge:
  invite-/identitetsmodellen samt auth-faktor-strategin (båda över baren:
  svåra att återställa i koherens, överraskande utan kontext, verkliga
  avvägningar — S95 Del 2). Skivorna refererar dem, inget beslut inline.
- Hosting-/deploy-ADR:n mintas separat på research-pass R1:s underlag och
  gatear Grind 0, inte detta korts skivbyggen.
- Säkerhetsspecens passkey-avsnitt är dokumenterat föråldrat och rättas i
  samband med auth-faktor-ADR:n.

### Ytterligare anteckningar

- PROTOTYP-GRIND (Marcus-kvitterad JA, S95): tvåfas UI-prototyp
  (T66-formen: divergens → Marcus väljer → konvergens) på login-vyn och
  accept-sidan FÖRE deras skivbyggen — de två skärmarna är hela
  förstaintrycket.
- Ordlistetermen "Användarinbjudan" är kanoniserad i ORDLISTA.md i samma
  landning som detta kort — den får inte förväxlas med "Anmälan"
  (event-deltagande).
- Mail-avsändarbytet från root till sändande subdomän stänger tråd T44:s
  öppna fråga; bokförs där vid verkställande.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prototyp-pass (tvåfas, T66-formen) Marcus-godkänt FÖRE login- och accept-skivornas bygge
- [ ] #6 Rundturs-e2e (inbjudan → accept → inloggning) grön mot staging före kortets Done
- [ ] #7 Ingen skarp inbjudan till Roger/Lotta före login-omskrivningen är landad och DMARC-posten satt
<!-- DOD:END -->
