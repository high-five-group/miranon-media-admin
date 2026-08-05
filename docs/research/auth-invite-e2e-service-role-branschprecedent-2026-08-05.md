---
owner: marcus803
updated: 2026-08-05
review_by: 2027-02-05
status: stable
---

# Auth-inbjudningsflödets CI-bevisbarhet — hur branschledare löser mail-länk + privilegierad backend i e2e (2026-08-05)

> **Proveniens:** avgränsat research-pass, körd oisolerat i huvudkatalogen
> (`main` vid `3aae6c7e`). Ingen kod rörd, inga git-operationer utförda utöver
> läsning. Föregås av — och bygger vidare på, inte om — fyra befintliga pass:
> `ADR-063` § S91-not (Airtable-tvången), `parallell-e2e-mot-delad-backend-2026-07-26.md`
> (Airtables strukturella spärrar, oberoende av denna fråga),
> `hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md` (sex projekt lästa i
> källkod för hermetik-frågan i stort, inklusive den öppna frågan *"Är efemär
> Edge-funktions-stack en fjärde väg som inte prövats?"* — § Öppna frågor
> punkt 1, **oprövad där**, prövad här) och
> `task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md` (den live-bevisade
> mekanismen samt de två infrastruktur-luckorna). Detta pass tillför:
> (a) tre namngivna precedent-projekt lästa i faktisk, mergad testkod — inte
> blogginlägg — specifikt för AUTH-INBJUDNINGSFLÖDEN (ingen av de fyra tidigare
> passen sökte just detta), (b) mätt/dokumenterad CI-tidskostnad för
> `supabase start`, och (c) ett fynd som knyter TASK-127.9:s "lucka 2" till ett
> redan committat, daterat beslut i det egna repot (§8 nedan) — vilket ingen av
> de fyra tidigare passen kopplade ihop.

## Kort svar

**Branschledarna löser detta genom att INTE läsa mail alls.** Tre oberoende,
lästa-i-källkod exempel (Ghost, cal.com × två flöden, twenty) visar att
när ett CI-test behöver ett inbjudnings- eller återställningslänk-token
deterministiskt, hämtas det via **privilegierad backend-läsning** — direkt ur
databasen, ur backend-modellagret, eller ur den triggande API-anropets egen
svarskropp. **Ingen** av de granskade projekten läser en riktig mail-inkorg för
att konsumera en inbjudningslänk i CI. Riktig mail-läsning (Mailhog/Mailpit)
förekommer hos exakt ett granskat projekt (cal.com) — men för ett annat syfte:
verifiera mailets **innehåll** (ämnesrad, avsändare), inte för att komma åt
länken för att fortsätta ett UI-flöde. Det mönstret är dessutom feature-flaggat
av/på, inte alltid-på.

Det ger ett tydligt svar på frågan som ställdes: **Väg A (en snäv, staging-only
Edge Function bakom admin-JWT som exponerar `generateLink`/`deleteUser`) är
branschmönstret**, inte ett provisorium. Väg C (`supabase start` + Mailpit) är
en genuin, dokumenterad mekanism — men den är byggd för och använd till ett
ANNAT problem (verifiera mailinnehåll, eller testa en app vars data-of-record
själv bor i Postgres) än det problem TASK-127.9 faktiskt har (bevisa att
appens EGEN kod hanterar en riktig GoTrue-redirect-session korrekt).

**Den viktigaste nyanseringen, obelagd i TASK-127.9 men fastslagen här (§8):**
ingen av vägarna A eller C löser TASK-127.9:s "lucka 2" (redirect-domänen
matchar inte CI:s testserver) på egen hand fullt ut — och repot har **redan**,
sedan Session 5 (post-K4.2), ett daterat, Marcus-beslutat svar på exakt den
luckan: Fas 7:s Vercel-preview-pipeline. Det är inte en ny fråga att lösa nu.

## §1 — Vad ADR-063 redan avgör, och vad den INTE avgör

`ADR-063` § S91-not slår fast tre strukturella Airtable-tvång (ingen
per-körning-isolering, 5 anrop/sekund-tak, ingen efemär backend) och citerar
att *"Ghost, Supabase och cal.com kan alla det gratis"* duplicera sin backend
per körning. **Verifierat:** den observationen gäller uteslutande
Airtable-lagret. Auth-inbjudningsflödet i fråga (invite → mail-länk → lösenord
→ inloggning → autentiserad vy) rör **noll** Airtable-anrop — det är renodlat
Supabase Auth (GoTrue) plus en Edge Function. De tre tvången i ADR-063 gäller
alltså **inte** denna fråga. Detta bekräftar uppdragets egen hypotes.

Vad ADR-063 INTE avgör: om Supabase-halvan SKA testas med efemär backend per
körning. Det var uttryckligen en öppen fråga i det egna materialet —
`hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md` § Öppna frågor punkt 1:
*"Är efemär Edge-funktions-stack en fjärde väg som inte prövats? ... Ej prövat
i detta pass."* Detta pass prövar den, specifikt för auth-inbjudan (§6, §8).

## §2 — De tre alternativen mot repots faktiska tillstånd (verifierat denna dag)

| Fakta | Verifierat |
|---|---|
| CI-hemligheter | `gh secret list` — exakt 8 poster, ingen `SERVICE_ROLE`/`RESEND` (matchar TASK-127.9:s uppgift ordagrant) |
| `supabase/config.toml` lokala stack-sektioner | Grep på `^\[` — **noll** träffar på `[api]`, `[db]`, `[inbucket]`, `[studio]`. Enda sektionerna är `[functions.*]` och `[auth]`/`[auth.mfa.totp]`/`[auth.email]`/`[auth.email.smtp]`/`[auth.email.template.*]` — konfiguration för DEPLOY till fjärrprojektet, inte för en lokal körning |
| `test-auth`-precedent | `supabase/functions/test-auth` finns, `verify_jwt = false`, **medvetet exkluderad** ur `.prod-functions-allowlist.conf` med kommentaren *"test-auth saknas MEDVETET — den är test-only och får aldrig nå prod"* — exakt den formen Väg A skulle återanvända |
| `SUPABASE_SERVICE_ROLE_KEY` auto-injicerad i varje EF | Verifierat oberoende mot `supabase.com/docs/guides/functions/secrets`: *"Edge Functions have access to these secrets by default"*, listar `SUPABASE_SERVICE_ROLE_KEY` explicit under default-uppsättningen |
| `additional_redirect_urls` (motsvarar `uri_allow_list`) | `supabase/config.toml` rad 135–138: `["https://admin.miranon.dev/valkommen", "https://admin.miranon.dev/nytt-losenord"]`, satt under en LÅS-kommentar (rad 118–126) om att `supabase config push` är **deklarativ** och en ej-låst rad tystnande regredierar vid nästa push |
| `invite-user`-EF:ens svar | Läst i `supabase/functions/invite-user/index.ts` — anropar `inviteUserByEmail` (GoTrues `/admin/invite`), som per GoTrues eget REST-kontrakt returnerar användarobjektet, **inte** länken. Att få själva länken kräver ett SEPARAT anrop mot `/admin/generate_link` |

**Konsekvens för Väg A:** kräver noll nya CI-hemligheter (service-role är redan
EF-runtime-intern), men kräver en NY, staging-only EF-fil samt ett medvetet
beslut att INTE lägga den i `.prod-functions-allowlist.conf` — exakt
`test-auth`-mönstret, redan existerande i repot sedan tidigare.

**Konsekvens för Väg C:** kräver att introducera lokala stack-sektioner i
`config.toml` som INTE finns idag — inte en aktivering av en vilande
konfiguration, utan ett nytt konfigurationsytskikt. Se §6 för vad detta kostar
i CI-tid och §8 för vad det INTE löser automatiskt.

## §3 — Precedent: tre projekt lästa i faktisk, mergad kod

Sökningen gick specifikt efter **auth-inbjudan/lösenordsåterställning +
mail-länk-konsumtion i e2e**, en snävare fråga än det tidigare hermetik-passets
generella "hermetisk kontra skarp"-fråga. Alla rader nedan är läst direkt ur
GitHubs `contents`-API mot commit-SHA:n för respektive PR:s head, inte ur
blogginlägg.

### Ghost — `TryGhost/Ghost` PR #21637 (mergead 2024-11-18, `f2444b08`)

Fixar Linear-ärendet *"Add e2e browser test for staff invite and accept
flow"*. Testet (`ghost/core/test/e2e-browser/portal/invites.spec.js`) skickar
en riktig inbjudan via UI, men **läser aldrig mail**. I stället:

```js
// Get the token from database
const invite = await models.Invite.findOne({email: testEmail});
const token = invite.get('token');
const inviteUrl = `${adminUrl}/signup/${encodedToken}/`;
```

Token hämtas direkt ur Ghosts egna Node-modellager (körs i samma
testprocess/DB som applikationen), URL:en byggs manuellt, och **sedan drivs
hela UI-flödet** (signout, navigera till länken, fylla i formuläret, verifiera
inloggat resultat) precis som ett riktigt klick skulle. Källa:
[`TryGhost/Ghost` PR #21637](https://github.com/TryGhost/Ghost/pull/21637),
fil vid `e497af119fb3e4cc68a6d5941282494883f0218e`.

### cal.com — lösenordsåterställning (`apps/web/playwright/auth/forgot-password.e2e.ts`)

**Den mest talande enskilda raden i hela passet.** Kommentaren i koden är
explicit:

```ts
// As a workaround, we query the db for the last created password request
// there should be one, otherwise we throw
const { id } = await prisma.resetPasswordRequest.findFirstOrThrow({...});
```

och senare, om att INTE logga in via UI efter lösenordsbytet:

```ts
// now we check our DB to confirm the password was indeed updated.
// we're not logging in to the UI to speed up test performance.
```

Cal.com — ett projekt som **har** Mailhog i sin CI-stack (se nästa avsnitt) —
väljer ändå bort mail-läsning för just denna länk-konsumtion, och kallar det
uttryckligen ett "workaround", inte ett ideal. Källa:
[`calcom/cal.com`](https://github.com/calcom/cal.com),
`apps/web/playwright/auth/forgot-password.e2e.ts` (huvudgren, läst 2026-08-05).

### cal.com — team-inbjudan (`apps/web/playwright/lib/testUtils.ts`)

```ts
export async function getInviteLink(page: Page) {
  const json = await submitAndWaitForJsonResponse(page, "/api/trpc/teams/createInvite?batch=1", {
    action: () => page.locator(`[data-testid="copy-invite-link-button"]`).click(),
  });
  return json[0].result.data.json.inviteLink as string;
}
```

En TREDJE variant, distinkt från både Ghost och forgot-password: länken hämtas
**ur den egna triggande API-anropets svarskropp** — `createInvite`-endpointen
är designad att returnera länken direkt. Ingen databas-fråga, ingen mail,
ingen separat admin-endpoint.

### cal.com — mail-INNEHÅLLS-verifiering (`signup.e2e.ts` + `fixtures/emails.ts`)

Det enda stället i cal.com där en riktig mail-inkorg faktiskt läses:

```ts
test.skip(!EmailVerifyFlag || !IS_MAILHOG_ENABLED, "Skipping check - Email verify disabled");
...
const receivedEmails = await getEmailsReceivedByUser({ emails, userEmail: ... });
const verifyEmail = receivedEmails?.items[0];
expect(verifyEmail?.subject).toBe(`${APP_NAME}: Verify your account`);
```

`fixtures/emails.ts` slår fast en produktions-relevant disciplin för
delad-inkorg-problemet (samma klass som föranleddes-fakta i uppdraget):

```ts
if (!hasUUID(query)) {
  throw new Error(
    `You should not use "from" or "to" queries without UUID in emails. Because mailhog
    maintains all the emails sent through tests, you should be able to uniquely
    identify the email among those. Found query: ${query}`
  );
}
```

och testet väntar en **fast** 5 sekunder (`waitForEmailMs = 5000`) innan det
söker — inte en poll-till-klar-mekanism. **Detta är alltså inte perfekt
deterministiskt** ens hos cal.com; det är "tillräckligt deterministiskt givet
en lokal SMTP-catcher och en generös fast väntetid". Mekanismen är gated
(`IS_MAILHOG_ENABLED`, sätts av `E2E_TEST_MAILHOG_ENABLED=1`) — den körs alltså
INTE i varje CI-jobb per default, bara när miljön uttryckligen startar en
Mailhog-container. Källa: samma repo,
`apps/web/playwright/fixtures/emails.ts` + `signup.e2e.ts` rad ~160–165 (läst
2026-08-05).

### twentyhq/twenty — PR #9332 (mergead 2025-01-12, `c1847054`)

`signup_invite_email.e2e-spec.ts` bygger på en FJÄRDE variant: en
"Copy invite link"-knapp i produkt-UI:t kopierar länken till clipboard, testet
läser clipboarden (`navigator.clipboard.readText()`). Detta är en
**produktfunktion** som råkar tjäna testbarhet, inte ett test-only-bygge. Ingen
mail läses. Teardown sker via en självbetjänings-"radera konto"-UI-funktion,
inte en admin-API-radering. Källa:
[`twentyhq/twenty` PR #9332](https://github.com/twentyhq/twenty/pull/9332).

### `supabase-community/e2e` — motexemplet, förklarat

Uppdraget flaggade detta repo som en spänning värd att förstå. Läst README:
testerna körs mot **hostade** produktions- och staging-Supabase-projekt, med
autentisering via **redan inloggad session** (*"Authentication is handled
automatically via the setup project"*, *"All tests will run with your
logged-in Supabase session"*). Repot testar **inte** invite/signup-flöden med
mail-konsumtion alls — det är en svit som verifierar Supabases EGNA
dashboard-produkt (Studio-liknande ytor) mot riktig hostad infrastruktur, inte
en app som bygger ovanpå Supabase Auth. Detta är alltså **produkt-testning**
(Supabase testar sin egen molntjänst mot verkliga projekt) snarare än
**app-testning** (en app testar sitt eget bruk av Auth-tjänsten) — precis den
distinktion uppdraget bad om att reda ut. Källa:
[`supabase-community/e2e`](https://github.com/supabase-community/e2e).

### `supabase/supabase` (Studio) — infrastrukturkostnaden, inte flödet

Studio-teamets egen e2e-svit (redan dokumenterad i det tidigare hermetik-passet
som "mest jämförbar stack") kör `supabase start` per CI-jobb — men Studio
testar Supabases EGEN administrationsgränssnitt för projekt/organisationer,
inte ett applikations-Auth-inbjudningsflöde. Verifierat i detta pass, i workflow-filen
`studio-e2e-test.yml`: jobbet kör på
`runs-on: blacksmith-8vcpu-ubuntu-2404` (en betald, prestandaoptimerad
tredjeparts-runner, inte standard GitHub-hosted) och autentiserar mot AWS ECR
(`docker/login-action` mot `public.ecr.aws`) uttryckligen **"to avoid rate
limiting"** vid image-pull. Även Supabases eget team behövde alltså särskild
infrastruktur-investering för att göra `supabase start` snabbt nog i CI — det
är inte en gratis default. Källa:
[`supabase/supabase`](https://github.com/supabase/supabase),
`.github/workflows/studio-e2e-test.yml` (läst 2026-08-05).

## §4 — Vad bevisar respektive väg, vad bevisar den INTE (fråga 1)

| | Väg A (staging-only EF) | Väg C (`supabase start` + Mailpit) |
|---|---|---|
| Testar den DEPLOYADE Edge Function-koden på staging? | **Ja** — samma `invite-user`, samma hostade GoTrue, samma custom SMTP-config | **Nej** — en lokalt körd `supabase functions serve`-instans är ett annat artefakt än det som faktiskt är deployat |
| Testar den hostade projektets `additional_redirect_urls`/allowlist-enforcement? | **Ja** — det är den skarpa, gemensamma inställningen | **Nej** — lokal GoTrue läser samma `config.toml`, men en lokal testprofil kan (och bör) sätta ett eget, engångs-lokalt värde utan att röra det delade hostade projektets allowlist (se §8 — obelagd, ej testad i detta pass) |
| Testar den custom SMTP-leveranspipen (Resend, `[auth.email.smtp]`)? | Delvis — själva GENERERINGEN av länken är identisk oavsett leveransväg; verktyget kringgår SMTP-hoppet helt, precis som `generateLink()`s egen dokumentation beskriver (*"will not send links or OTPs to the end user"*) | **I princip ja, om konfigurerat** — men community-trådar (`supabase/supabase` diskussion #22677, #27054) visar att custom SMTP i den lokala CLI-stacken är ett omtvistat/inkonsekvent stöttat område; ingen förstapartskälla i detta pass bekräftade det entydigt |
| Bevisar att appens EGNA sidor (`/valkommen`, `/login`, `/hem`) hanterar en RIKTIG GoTrue-redirect-session (hash-fragment, `access_token`) korrekt? | **Ja, om kombinerad med en CI-nåbar frontend** (se §8) — mekanismen (steg 1–9 i TASK-127.9) är redan live-bevisad mot skarp staging | **Ja, om kombinerad med samma sak** — ingen skillnad här; frontend-reachability är oberoende av vilken väg som löser mail-lucka |
| Kräver en ny, prod-exkluderad kapacitetsyta i kodbasen? | **Ja** — en ny EF, samma klass som `test-auth` | **Nej** — men kräver ett nytt KONFIGURATIONSYTSKIKT (`[api]`/`[db]`/`[inbucket]` i `config.toml`) som inte finns idag |

**Ingen av vägarna testar den deployade frontend-koden mot en riktig hostad
domän UTAN att också lösa frontend-reachability-frågan separat** (§8). Det är
den viktigaste gränsen ingen av de tre alternativen i uppdraget löser på egen
hand.

## §5 — Full UI-kedja kontra genväg (fråga 2)

**Samtliga tre granskade projekt som bygger sitt EGET admin-/produkttest
(Ghost, cal.com, twenty) kör den FULLA UI-kedjan efter att ha kortat just
mail-hoppet.** Ingen av dem hoppar över inloggning/formulär-interaktionen som
helhet (utom cal.coms forgot-password-test, som medvetet hoppar
login-verifieringssteget "för hastighet" — en enskild avvikelse, inte normen).
Mönstret är alltså: **korta EN specifik, icke-deterministisk länk mellan
mail-server och app — men kör allt annat, inklusive formulär, redirects och
den slutliga autentiserade vyn, genom riktig UI-interaktion.**

Det matchar exakt vad TASK-127.9:s manuella bevis redan gjorde (steg 4–7:
konsumera länken → sätt lösenord → logga in → nå autentiserad vy), fast via
råa HTTP-anrop i stället för en riktig webbläsare. Väg A:s uppgift är alltså
inte att uppfinna ett nytt mönster — det är att paketera exakt den redan
bevisade sekvensen bakom en admin-JWT-gated EF, och sedan driva Playwright
genom `/valkommen` → `/login` → `/hem` med den EF:ens data, precis som Ghost
kör sin `sharedPage` genom motsvarande sidor.

**Supabase rekommenderar genvägen (Admin API för att skapa bekräftade
användare) uttryckligen** — men den rekommendationen (redan citerad i
uppdragets egna, tidigare mätta fakta) gäller att **hoppa förbi hela
signup-flödet för tester som INTE handlar om att verifiera signup/invite
själva.** Den är inte skriven för fallet "jag vill bevisa att
invite-flödet fungerar" — då är flödet SJÄLVA testobjektet, och genvägen
skulle bevisa mindre än den ser ut att bevisa. Det är samma distinktion Ghost,
cal.com och twenty alla respekterar: de skippar mail, men **aldrig** det
UI-flöde de facto testar.

## §6 — CI-tidskostnad för `supabase start` (fråga 3)

**Mätt/dokumenterat, inte gissat.** Tre oberoende community-källor
(`supabase/cli` issue #2724, discussion #9351, samt en tredjeparts
Medium-artikel om lokal maskin) samstämmer:

- **Kallt läge (typisk GitHub-hostad runner, ingen cache):** 2–3 minuter är den
  vanligaste rapporterade siffran; ett tidigt rapporterat värsta-fall var
  5 minuter (ökning från en 40–60 sekunders baslinje utan Supabase).
- **Varmt läge (bilder redan cachade, lokal maskin):** ~38 sekunder på Apple
  M2, men detta gäller INTE en GitHub Actions-runner, som alltid startar rent
  om inte Docker-lager explicit cachas separat.
- **Huvudorsaken till kostnaden är sekventiell Docker-image-hämtning**, inte
  själva uppstarten av containrarna — `supabase/cli`-teamet har ingen skriven
  åtgärd för parallell-hämtning i det granskade materialet.
- **Även Supabases EGET team behövde extra infrastruktur** för att hålla detta
  snabbt: en betald tredjeparts-runner (Blacksmith, 8 vCPU) plus en
  ECR-registry-inloggning uttryckligen för att undvika Docker Hub-rate-limits
  (§3, Studio-fyndet).

**Konsekvens för oss:** vår staging-svit är redan mutex-hållen och
`ADR-080` lade ett helt beslut på att pressa just den mutex-hållningen från
9,25 till ~2,4 minuter. Att lägga 2–5 minuters `supabase start`-kostnad OVANPÅ
den mutex-hållna körningen (eftersom en lokal Supabase-stack fortfarande måste
köra SEKVENSERAT med den delade Airtable-basens mutex, om samma jobb rör
bådadera) skulle med stor sannolikhet upphäva en betydande del av den vinsten.
**Detta är en rimlig slutsats byggd på verifierade siffror, inte en egen
mätning av just vårt CI** — vi har aldrig kört `supabase start` i vår runner
och siffran bör mätas om den vägen någonsin väljs.

## §7 — Underhållskostnad över tid (fråga 4)

**Väg A (staging-only EF):** underhållsytan är en tunn, autentiserad proxy mot
riktiga Supabase Admin-API-anrop (`generateLink`, `deleteUser`) — inte en fake
eller mock av GoTrues beteende. Draget mot Googles *"mocks become stale"*-
kritik (redan dokumenterad i det tidigare hermetik-passet) träffar detta
SVAGT: det finns inget eget beteende att låta ruttna, bara ett kontrakt
(`{email, redirect_to}` in, `{action_link, hashed_token}` ut) som är GoTrues
eget REST-API och därmed förändras i samma takt som `invite-user` redan måste
följa. Den EGNA underhållsrisken är att EF:en måste hållas i synk med
`invite-user`s + `valkommen.tsx`s kontrakt (TASK-143-klassen av ändringar) —
samma risk som redan gäller `invite-user.staging.test.ts` idag.

**Väg C (lokal stack):** underhållsrisken är strukturellt större och av en
annan KLASS — det är en genuin miljö-parity-risk, inte ett kontrakt-drift.
Tre konkreta vektorer, alla källbelagda:

1. **CLI-versionens GoTrue-image kan lagom hosted-projektets faktiska
   GoTrue-version**, med divergerande beteende mellan lokalt och skarpt (ingen
   primärkälla i detta pass motbevisade detta — det är den generella
   emulator-vs-produktion-risken som redan är dokumenterad i det tidigare
   hermetik-passet via Firebase-emulatorns egna paritets-erkännanden).
2. **Custom SMTP-stödet i den lokala CLI-stacken är omtvistat** i community-
   trådarna (§4-tabellen) — vår faktiska staging/prod-config kör en riktig
   SMTP-leverantör (`[auth.email.smtp]` i `config.toml`), och en lokal
   Mailpit-catcher testar per definition INTE den leveransvägen om den inte
   är korrekt konfigurerad, vilket i sig är en löpande konfigurationsyta att
   hålla i synk.
3. **`config.toml` bär idag noll lokala stack-sektioner.** Att införa Väg C
   är inte att aktivera något vilande — det är att bygga och sedan
   VIDMAKTHÅLLA ett helt nytt konfigurationsytskikt parallellt med det
   redan existerande deploy-fokuserade `[auth]`-blocket, med den regressions-
   risk `config.toml`s egen kommentar (rad 118–126) redan varnar för: *sju
   oavsiktliga regressioner vid en enda `config push`* när fält inte var
   explicit låsta. Ett nytt lokalt lager multiplicerar den ytan.

## §8 — Den dolda kopplingen mellan "lucka 2" och Fas 7 (eget fynd, ej i TASK-127.9)

TASK-127.9 namnger korrekt att redirect-domän-mismatchen
(`admin.miranon.dev` mot CI:s `localhost:5173`) är *"en SEPARAT fråga"* från
service-role-luckan, och lämnar den öppen. Detta pass hittade att repot
REDAN har ett daterat, Marcus-beslutat svar på den separata frågan:
`tests/e2e/auth-flow.staging.test.ts` rad 24–31, skrivet vid K4.2 (Session 5):

> *"När Fas 7 etablerar Vercel-deployment-pipeline ska samma test-suite
> kompletteras att köra mot Vercel preview-URL via `PLAYWRIGHT_TEST_BASE_URL`-
> env i CI-steget ... Per Marcus' beslut (Session 5, post-K4.2) flyttas
> Vercel-aktivering INTE hit; den är Fas 7-arbete per fas-disciplin-policy."*

Detta är inte en ny öppning — det är en BEFINTLIG roadmap-post som redan
förutsåg exakt detta problem (en CI-testserver som inte matchar en hostad
domän) för login-flödet, tolv sessioner innan TASK-127.9 stötte på samma
problem för invite-flödet. `ci-suite.yml` rad 278 och 493 bekräftar att
`PLAYWRIGHT_TEST_BASE_URL` medvetet lämnas osatt idag, med kommentarer som
pekar mot samma väntan.

**Konsekvens:** oavsett om Väg A byggs nu eller inte, kommer ett fullt grönt
Playwright-baserat rundtur-test i `chromium-authenticated` mot en domän som
matchar `additional_redirect_urls` sannolikt inte vara möjligt förrän Fas 7:s
Vercel-preview-pipeline finns — INTE för att Väg A är otillräcklig, utan för
att frontend-reachability alltid varit en separat, redan schemalagd
förutsättning. Att bygga Väg A nu är fortfarande rätt (den löser den delen som
INTE är bunden till Fas 7 och gör mekanismen redo att koppla in samma dag
Vercel-pipen landar) — men AC #1 i sin helhet (grön i CI, riktig domän) bör
bokföras som beroende av Fas 7, inte som blockerad enbart av service-role.

## §9 — En fjärde väg? (fråga 5)

**Ja, delvis — men den är en produktbeslut, inte en test-arkitektur-fix.**
Twentys "Copy invite link"-knapp (§3) visar ett mönster där en ADMIN-UI-
funktion (kopiera inbjudningslänk till urklipp) tjänar både verkliga
administratörer (Roger/Lotta kan behöva skicka länken via ett annat kanal, om
mail dröjer eller hamnar i skräppost) OCH testbarhet, utan att bygga en
test-only backdoor alls. Om Miranon Media-adminvyn någonsin får en sådan
funktion skulle Playwright kunna läsa clipboard precis som Twenty gör — och
det vore en PRODUKTFÖRBÄTTRING som råkar lösa testproblemet, snarare än
tvärtom. Detta ligger dock utanför scope för en ren CI-arkitekturfråga och
noteras här som ett registrerat, inte rekommenderat, sidofynd (ADR-053-
triage: värdefullt, blockerar inte, defer till trådregistret om Marcus vill
gå vidare).

Ingen annan fjärde väg identifierades i det granskade materialet.

## Dom

**Väg A (staging-only EF bakom admin-JWT) är den branschmässigt korrekta
lösningen för det uttalade problemet**, med tre oberoende, källäsbara
precedent (Ghost, cal.com × två flöden) som alla väljer exakt samma
grundmönster — privilegierad backend-läsning i stället för mail-konsumtion —
när uppgiften är att bevisa att APPENS EGEN hantering av en länk fungerar.
Väg C löser ett annat problem (mailinnehålls-verifiering, eller en app vars
data-of-record bor i den lokala stacken) och kommer med en mätt, dokumenterad
CI-tidskostnad (2–5 minuter kallt) samt en strukturellt bredare
underhålls-/paritetsrisk än Väg A. Väg B (manuell verifiering) är en giltig,
redan-etablerad brygga — TASK-127.5 gjorde exakt samma val för sin egen
"lyckade anrop"-gren — men ger ingen regressionsvakt.

**Den fråga som avgjorde utfallet:** frågan "vad bevisar respektive väg, och
vad bevisar den INTE" (§4/§5) — när alla tre precedent-projekt visade samma
svar (korta mail-hoppet, kör resten av UI-kedjan skarpt), föll valet mellan A
och C undan för sig: A är den formen precedenten faktiskt har, C är formen
ingen av dem valde för DETTA problem.

Precedent-rymden är **inte** tunn för denna specifika fråga (till skillnad
från Airtable-frågan i `ADR-063`) — tre oberoende, aktivt underhållna projekt
med läsbar, mergad kod gav samstämmigt svar utan att någon behövde leta
längre. Det ska sägas rakt ut eftersom CLAUDE.md:s bar annars kunde
misstolkas som att räkningen alltid är svår att nå.

## Vad jag inte kunde belägga

1. **Om custom SMTP faktiskt går att peka mot en riktig extern SMTP-server
   från en lokal `supabase start`-instans utan att förlora Mailpit-fångsten.**
   Community-diskussionerna (#22677, #27054) är motsägelsefulla och jag
   fick ingen entydig förstapartskälla att luta mig mot. Skulle Väg C någonsin
   utredas vidare måste detta testas skarpt, inte antas.
2. **Om `config.toml`s `[auth]`-sektion (redan satt till `admin.miranon.dev`)
   går att override:a för en lokal testkörning utan att röra den delade,
   hostade konfigurationen.** Jag bedömer det troligt (CLI:t stöder
   miljövariabel-interpolation i `config.toml` för andra fält) men har inte
   verifierat mekanismen specifikt för `additional_redirect_urls`, och har
   inte kört `supabase start` i detta repo för att bekräfta.
3. **Exakt CI-tidskostnad i VÅR runner.** Alla siffror i §6 är från andra
   projekts miljöer. Vi har aldrig kört `supabase start` här.
4. **Om GoTrue-versionen i den installerade CLI:n (2.111.0, nämnt i
   `config.toml`s egna kommentarer) faktiskt divergerar från hostad
   GoTrue-version på ett sätt som skulle påverka just detta flöde.** Ingen
   källa i detta pass jämförde versionerna direkt.
5. **Om ett fjärde, ännu obeaktat mönster finns hos projekt jag inte
   granskade.** Sökningen var riktad (Ghost, cal.com, twenty, Grafana,
   PostHog, `microsoft/playwright`, `supabase-community/e2e`,
   `supabase/supabase-studio`) men inte uttömmande över hela ekosystemet av
   Auth-byggande produkter (t.ex. Directus, Appwrite, Keycloak-baserade
   projekt söktes aldrig).

## Rekommendation

**Detta är en rekommendation, inte ett beslut.**

Bygg Väg A: en ny, staging-only Edge Function (t.ex.
`supabase/functions/test-invite-completion/`), gated bakom samma
`ADMIN_EMAILS`-mönster som `invite-user`, som exponerar `generateLink` (type
`invite`) och `deleteUser` för en admin-JWT-anropare — medvetet UTELÄMNAD ur
`.prod-functions-allowlist.conf`, exakt `test-auth`-precedenten. Koppla in
`invite-user.staging.test.ts`/en ny fil i `tests/e2e/` mot den, och driv
Playwright genom `/valkommen` → `/login` → `/hem` precis som Ghosts
`invites.spec.js` gör mot sina motsvarande sidor.

Bokför explicit, i samma beslut, att detta INTE ensamt gör AC #1 grönt i CI —
den delen väntar på Fas 7:s Vercel-preview-pipeline (§8), och den väntan är
redan ett existerande, daterat beslut, inte en ny eftersläpning att uppfinna.
Fram tills dess kvarstår TASK-127.9:s Väg B (manuell verifiering, redan
utförd en gång med städning) som den ärliga statusen för AC #1/#2.

**Osäkerheten i denna rekommendation, angiven explicit:** den vilar på tre
precedent-projekt, vilket är över CLAUDE.md:s bar men inte ett stort urval,
och på §Vad jag inte kunde belägga-punkterna 1–2 ovan, som direkt påverkar hur
enkel Väg C faktiskt hade varit om den ändå valdes. Faller den
Ghost/cal.com-precedenten (t.ex. om Marcus av produktskäl ändå vill ha riktig
mail-leverans testad end-to-end, inte bara länk-mekanismen) bör frågan tas om
med det uttryckliga målet omformulerat — se §5:s distinktion mellan att testa
"appens hantering av länken" och att testa "att mailet faktiskt anländer".

## Källförteckning

### Förstapart — Supabase

- [Edge Functions — Secrets](https://supabase.com/docs/guides/functions/secrets) — auto-injicerad `SUPABASE_SERVICE_ROLE_KEY`
- [`auth-admin-generatelink` (JS-referens)](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) — *"will not send links or OTPs to the end user"*, service_role-krav
- [CLI config-referens](https://supabase.com/docs/guides/local-development/cli/config) — `[auth.email.smtp]`-defaultvärden, InBucket/Mailpit-portar
- [`supabase/cli` issue #2724](https://github.com/supabase/cli/issues/2724) — 2–3 minuter kallstart, sekventiell image-hämtning som orsak
- [`supabase/cli` discussion #9351](https://github.com/orgs/supabase/discussions/9351) — 40–60s → 5 min, förslag på `--exclude` + bakgrundsstart
- [`supabase/supabase` discussion #22677](https://github.com/orgs/supabase/discussions/22677), [#27054](https://github.com/orgs/supabase/discussions/27054) — omtvistat lokalt custom-SMTP-stöd
- [`supabase-community/e2e`](https://github.com/supabase-community/e2e) — hostad, inte lokal; ingen invite/signup-testning

### Förstapart — precedent-projekt (mergad kod, läst i källan)

- [`TryGhost/Ghost` PR #21637](https://github.com/TryGhost/Ghost/pull/21637) — `invites.spec.js`, DB-token-läsning + full UI-kedja
- [`calcom/cal.com`](https://github.com/calcom/cal.com) — `apps/web/playwright/auth/forgot-password.e2e.ts` (Prisma-läsning, explicit "workaround"), `apps/web/playwright/lib/testUtils.ts` (`getInviteLink`, `getEmailsReceivedByUser`), `apps/web/playwright/fixtures/emails.ts` (Mailhog-fixtur, UUID-disambiguering), `signup.e2e.ts` (gated mail-innehålls-test)
- [`twentyhq/twenty` PR #9332](https://github.com/twentyhq/twenty/pull/9332) — `signup_invite_email.e2e-spec.ts`, clipboard-baserad länk, UI-driven kontoradering
- [`supabase/supabase` `.github/workflows/studio-e2e-test.yml`](https://github.com/supabase/supabase) — Blacksmith-runner + ECR-mirror för att göra `supabase start` snabbt nog

### Internt (läst, ej ändrat)

- `docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md` § S91-not — Airtable-tvången, bekräftat orelevanta för denna fråga
- `docs/decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md` — mutex-tidsbudgeten Väg C skulle lägga sig ovanpå
- `docs/research/parallell-e2e-mot-delad-backend-2026-07-26.md`, `docs/research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md` — grundmaterialet denna fråga bygger vidare på
- `docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md` — den live-bevisade mekanismen och de två infrastruktur-luckorna
- `tests/e2e/auth-flow.staging.test.ts` rad 24–31 — Fas 7/Vercel-kopplingen (§8)
- `.github/workflows/ci-suite.yml` rad 278, 493 — `PLAYWRIGHT_TEST_BASE_URL` medvetet osatt
- `supabase/config.toml` rad 117–163 — `[auth]`, `additional_redirect_urls`, deklarativ-push-varningen
- `supabase/functions/invite-user/index.ts`, `.prod-functions-allowlist.conf`, `supabase/functions/test-auth/` — Väg A:s återanvända mönster
- `tests/api/invite-user.staging.test.ts` — TASK-127.5:s egen, redan etablerade "ingen unilateral privilegie-utökning"-disciplin
