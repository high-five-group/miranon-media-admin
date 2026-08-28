# ADR-099: Sessionsdok-rotens rullande fönster — kadens ersätter fas-avslut-bindningen

- Status: Accepted
- Datum: 2026-08-07
- Fas: Meta (Session 99, PRD `TASK-158`)

## Kontext

[ADR-023](ADR-023-sessions-arkivering.md) (2026-05-06) satte arkiveringskadensen
till generiskt "sessionsavslut". [ADR-041](ADR-041-session-end-do-confirm-roll.md)
beslut 6 (2026-05-28) harmoniserade detta additivt mot den praktik som redan
gällde sedan Session 7: arkivering är **fas-avslut-bunden**, inte
sessionsavslut-bunden. Premissen bakom det valet var att faser var korta nog
att en fas-gräns gav en rimlig arkiveringskadens.

Fas 6 har varat 30+ sessioner och falsifierat den premissen. Ommätt
2026-08-07 (samma metod som `ADR-098` — disk-mätning, inte antagande):
`tasks/sessions/`-roten bär **86 dokument** — 77 med `lifecycle: closed`,
3 med `lifecycle: active`, 3 med `lifecycle: paused`, och 3 äldre dokument
helt utan `lifecycle`-fält (`2026-06-12-session-16.md`,
`2026-06-13-session-17.md`, `session-20-scope-seed.md` — skrivna före
[ADR-052](ADR-052-lifecycle-frontmatter-falt.md) införde fältet, plus en
scope-frö-fil som aldrig var ett sessionsdok i vanlig mening). Roten växer
alltså **obegränsat** så länge Fas 6 pågår — det finns ingen kadens som
någonsin utlöses.

Detta har två konkreta kostnader, inte bara en estetisk:

1. **Synk-föroreningen.** claude.ai-projektkunskapen synkar hela
   `tasks/sessions/`-roten; arkivet är exkluderat
   ([ADR-048](ADR-048-synk-horisont-arkiv-atkomst.md)). En rot som aldrig
   krymper skickar allt mer HISTORIK in i den synk som ska spegla PÅGÅENDE
   arbete — sökträffar späds ut med 77 stängda dokument som inte är
   arbetsunderlag för någon aktiv session.
2. **Registerklassens tillväxt-mönster.** Samma sessions `ADR-098` visade för
   trådregistret att monoton tillväxt utan mekanisk kadens förr eller senare
   möter ett strukturellt tak (där: Read-verktygets 256 KB). Sessionsdok-
   roten är samma klass av problem i en annan form — en katalog utan
   arkiveringskadens, inte en enskild fil utan radtak — men mönstret är
   identiskt: en premiss (fas-avslut-bunden kadens) som höll vid låg volym
   och tystnar vid hög.

Fas-avslut-bindningen är i sig inte fel som IDÉ — den band bara kadensen till
fel händelse. En session avslutas ofta; en fas avslutas sällan (Fas 6:s 30+
sessioner). Fönsterregeln nedan byter händelse: kadensen drivs av rotens
egen storlek, inte av en extern milstolpe.

## Beslut

1. **Rullande fönster ersätter fas-avslut-bindningen som styrande regel för
   vad som får ligga i `tasks/sessions/`-roten.** Roten behåller:
   - de **N senast stängda** dokumenten (sorterat på stängningstillfället —
     samma ordning som `lifecycle: closed`-övergången skedde i), PLUS
   - **samtliga** dokument med `lifecycle: active` eller `lifecycle: paused`,
     oavsett ålder — ett pausat eller aktivt dok är per definition pågående
     arbete och rör sig aldrig ur roten på grund av fönstret.

   Äldre stängda dokument (allt utom de N senaste) flyttas till arkivet.
   Arkivets befintliga form ([ADR-023](ADR-023-sessions-arkivering.md):
   `tasks/sessions/archive/<år>-<månad>/`) är ORÖRD — denna ADR ändrar
   arkivets struktur i noll avseenden, bara vad som TRIGGAR en flytt dit.

2. **Fönstertalet N är ett KONFIG-VÄRDE, inte en frusen konstant i denna ADR
   eller hårdkodad i skriptets logik.** Detta följer samma disciplin som
   redan gäller för repots övriga custom CI-grindvakter (hub-`CLAUDE.md` §
   "Instruktioner — Alltid gäller": skriptlogik är universell, värden lever
   i `.<grindvakt>-policy.conf` per projekt — samma mönster som
   `.purge-staging-policy.json`, `.heartbeat-svep-policy.conf` m.fl.).
   Policy-konfigfilen och läsvägen byggs i arkiverings-skriptets skiva
   (`TASK-158.2`) — den hör inte hemma i en ADR-text, av samma skäl som
   `.purge-staging-policy.json`s targets aldrig stod inskrivna i en ADR.

   **Startvärdet är N ≈ 10** — den samsyn som grillades i S99 Del 5
   (`tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 5, 2026-08-07). Talet är
   ett startvärde, inte en helig konstant: det omprövas mot uppmätt
   rotstorlek och faktisk sessionstakt utan att kräva en ny ADR — bara en
   konfig-ändring. Denna ADR fastslår REGELN (rullande fönster + vad som
   alltid stannar i roten), inte det exakta talet.

3. **Ingenting raderas.** Precis som `ADR-023` redan slog fast: flytten är en
   `git mv` till arkivet, aldrig en radering. All historik förblir nåbar via
   git och via arkivets befintliga README-pekare.

4. **Synk-horisonten ([ADR-048](ADR-048-synk-horisont-arkiv-atkomst.md)) är
   OFÖRÄNDRAD.** Arkivet är redan exkluderat ur claude.ai-projektkunskapens
   synk — denna ADR lägger ingen ny rad till den exkluderingslistan, den
   ökar bara hur mycket som med tiden hamnar där (vilket är själva poängen:
   synken renas genom att MER av historiken flyttar in under en redan
   exkluderad katalog, inte genom att exkluderingsreglerna ändras).

5. **Mekaniseringen är separata skivor, i bindande ordning.** Denna ADR är
   `TASK-158.1` — regeln. Arkiverings-skriptet + engångsmigrationen av de
   ~70 äldre stängda dokumenten (idempotent, atomisk länk-omskrivning för de
   ~77 filer i repot som länkar in mot roten) är `TASK-158.2`/`.3`;
   drift-grinden i nattnätet är `TASK-158.4`; hub-steget i session-end är
   `TASK-158.5`. Ordningen ADR → migration → grind är bindande (PRD
   `TASK-158`s Definition of Done #5) — ingen av de senare skivorna
   exekveras före denna ADR är landad.

## Alternativ som övervägdes

- **Status quo — fas-avslut-bunden kadens (avvisad).** Premissen (faser är
  korta) är falsifierad av Fas 6:s 30+ sessioner; regeln utlöses aldrig i
  praktiken så länge en fas pågår, vilket är exakt vad som hänt.
- **Arkivera vid varje sessionsavslut, ADR-023:s ord-för-ord-tolkning
  (avvisad).** För finkornigt: skulle churna arkivet vid varje enskild
  session och komplicera synligheten för dokument som pausas och återupptas
  samma dag. Rullande fönster ger samma "roten speglar pågående arbete"-
  egenskap utan att ett dok arkiveras samma dag det stänger.
- **Hårdkodat fönstertal i skript eller i denna ADR (avvisad).** Bryter
  config-driven-disciplinen som redan gäller för varje annan custom
  grindvakt i repot (se Beslut 2) — samma resonemang, inget nytt undantag.
- **Statuspartitionering / separat vy för stängda dokument (ej relevant
  här).** `ADR-098` avvisade detta för trådregistret på grund av avsaknad av
  primärkällsstöd (Kubernetes håller `Deferred`/`Rejected` synliga för
  alltid i SAMMA lista). Sessionsdok är en annan artefaktklass — hela filer
  i ett filsystem, inte rader i ett handskrivet register — så frågan är inte
  direkt jämförbar, men samma riktning gäller: flytt till ett separat,
  navigerbart arkiv (redan `ADR-023`s form) slår att partitionera INOM
  roten.

## Konsekvenser

- **`ADR-041` beslut 6 rivs ÖPPET** med ett amenderings-block i `ADR-041`
  självt (se `ADR-041` § Updates, 2026-08-07-posten) — fas-avslut-bindningen
  är inte längre den styrande regeln för arkiverings-kadens. `ADR-041`s
  övriga beslut (session-end som do-confirm-verifiering, tre-lagers-
  kadensen, killer items) är HELT OFÖRÄNDRADE — bara beslut 6 rörs.
- **`ADR-023`s frusna text rörs INTE.** Dess befintliga korrigeringsnot
  pekar redan mot `ADR-041`; kedjan `ADR-023` → `ADR-041` → `ADR-099`
  löser upp sig för en läsare som följer pekarna, precis som
  immutabilitets-disciplinen (L53) föreskriver.
- `session-end`-skillen får ett nytt arkiverings-moment (`TASK-158.5`,
  egen skiva).
- Nattnätets larmkedja får en ny drift-grind som larmar när roten
  överskrider fönstret (`TASK-158.4`).
- README-räkningen (rot-`README.md` + `docs/decisions/README.md`s index)
  stiger 98 → 99 i samma commit som denna ADR — `scripts/check-adr-count.sh`
  är den mekaniska grinden som hävdar detta.
- Ingen ändring i synk-horisonten, i arkivstrukturen eller i någon annan
  dokklass (research, ADR:er, trådregistret) — allt utanför scope per PRD
  `TASK-158` § "Utanför omfattningen".

## Research-källor

Inget nytt web-research-pass krävdes för detta beslut — det är en intern
kadens-regel för ett internt substrat, inte ett tekniskt verktygsval eller
en branschstandard-fråga. Grunden är disk-mätning (denna ADR, ovan),
S99 Del 5s grillade samsyn, och syskonbeslutet `ADR-098` från samma session
(samma sessions register-tillväxt-mönster, redan branschforskat där).
