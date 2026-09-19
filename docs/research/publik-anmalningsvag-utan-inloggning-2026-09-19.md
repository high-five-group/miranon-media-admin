---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: stable
---

# Publik anmälningsväg utan inloggning — hotbild, bot-skydd och arkitektur för nya miranon.se (Code, 2026-09-19)

> **Proveniens:** avgränsat research-pass (bakgrundsagent, Session 128), kört
> **oisolerat** i worktreen `s128-docs` (gren `docs/s128-fodelse`). Beställt
> av orkestreraren som ett av flera parallella S128-pass (de andra:
> intagskedjans inventering, Luma-studien, Shopify-innehållsexport). Ingen
> produktionskod eller -data rörd — passet är läsning av repot + webbforskning
> plus denna fil. Ingen Edge Function anropades, ingen bas skrevs till.

---

## Kort svar

**Domen:** en publik, oautentiserad skrivväg är **ny mark i detta repo** —
hela dagens Edge Function-lager kräver `requireUser` (VERIFIERAT,
`supabase/functions/_shared/auth.ts`) — men den kan byggas säkert genom att
återanvända nästan allt som redan finns: samma CORS-allowlist, samma
skriv-kärna (`_shared/create-registration.ts`), samma 429-härdade
Airtable-klient, och framför allt **samma jobbmotor som Fas 6 redan byggt och
mätt för kvittoutskick** (`ADR-129`: `pgmq` + `pg_cron` + jobbtabell +
`EdgeRuntime.waitUntil`-kick). Den **enskilt viktigaste arkitekturregeln** är
att den publika vägen **aldrig anropar Airtable synkront i request-cykeln** —
den skriver till en Postgres-inkorg och svarar direkt, medan en bakgrunds­
konsument (ny jobbtyp i samma motor) betar av Airtables delade
5 req/s-tak i sin egen takt. Det löser samtidigt DoS-risken mot kvoten
(krav 1), driftsäkerheten (krav 6) och att en anmälan aldrig tappas om
Airtable är nere (krav 6).

**Bot-skyddsdomen:** för Miranon Medias volym (en arrangör, tiotals event/år)
är **honeypot + tidsfälla + ett själv-verifierat proof-of-work-lager
(ALTCHA, öppen källkod)** golvet — noll tredjepartswidget, noll CSP-hål,
noll GDPR-tredjelandsfråga, och **byggt för att inte kunna utestänga någon**
(W3C: fullt icke-interaktiva metoder är "a most welcome development
direction for accessibility"). Cloudflare Turnstile är den dokumenterade
eskaleringsvägen om incidensdata senare visar behov (WCAG 2.2 AA-hävdat,
starkast integritetsprofil av CAPTCHA-klassen) — reCAPTCHA v3 avråds på
grund av dess dokumenterade tredjelands-dataflöde till Google (noyb: 101
klagomål om just EU–USA-överföringar).

**Den avgörande delfrågan** visade sig inte vara bot-skyddet utan
**kapacitetskontrollen** (krav 5): eftersom **varje** anmälan i detta system
— admin-skapad såväl som webbformulär — redan startar som `Status:
Obekräftad` och kräver Lottas manuella granskning (VERIFIERAT,
`_shared/create-registration.ts` rad 184, `STATUS_CREATE_DEFAULT`), är
"sista platsen"-racet **redan idag** ett läge Lotta hanterar manuellt, inte
en atomisk garanti systemet ger. Den rätta lösningen är därför **(b)** ur
uppdragets alternativ — optimistisk klassificering (Anmäld/Väntelista) mot
en färsk, ENKELRIKTAD Postgres-cache av beläggningen, aldrig en hård
Postgres-lås-reservation — och Postgres-inkorgen som helhet är en **buffert,
aldrig en andra sanning**: den bär jobbstatus ("har vi skrivit klart till
Airtable än"), aldrig anmälningssanningen, som förblir Airtable
`Anmälningar` precis som idag.

**ADR-059 (idempotens-lagring defer:ad till Fas E) behöver INTE omprövas** —
den publika vägen ärver exakt samma kontrakt (klient-UUID i
`Idempotency-Key`, loggad men ej lagrad) rakt av. Vad som ÄR nytt är att
klienten nu är obekant/anonym, vilket gör `mutationKey`-dedupen (TanStack,
körs i webbläsaren) svagare som skydd mot en SKRIPTAD avsändare — men det
mönstret var redan explicit accepterat i ADR-059 för single-admin-fönstret,
och den publika vägens verkliga skydd mot skriptad dubblering är
rate-limiten och den servers-ide 409-kontrollen, inte klientkoden. Se § 4.

---

## Vad jag redan hade innan jag sökte

**Läst i sin helhet före första externa sökningen, i denna ordning:**
`docs/research/`-katalogens filnamn (170 filer via `ls`) följt av full läsning
av de två pass som uttryckligen delar detta uppdrags datum och kontext —
[`miranon-se-intagskedjan-idag-2026-09-19.md`](miranon-se-intagskedjan-idag-2026-09-19.md)
(669 rader) och
[`luma-studie-monster-for-nya-miranon-se-2026-09-19.md`](luma-studie-monster-for-nya-miranon-se-2026-09-19.md)
(594 rader) — samt `docs/decisions/ADR-059`, `ADR-128`, `ADR-129`, `ADR-080`
i sin helhet, `docs/reference/airtable-constraints.md` §A–§B i sin helhet,
`docs/reference/data-model.md` (fältinventering för `Anmälningar` och
`Väntelista`), `docs/byggplan.md` §3.1, samt källkoden för
`supabase/functions/_shared/{auth,cors,create-registration,field-allowlists,
airtable-retry,errors,belaggning}.ts`, `create-registration/index.ts` och
`send-registration-confirmation/index.ts`. `tasks/sessions/2026-09-19-
session-128.md` Del 1 lästes för uppdragets ordagranna bakgrund.

**Vad som redan var avgjort, och som detta pass respekterar snarare än
omprövar:**

- **Väg A** (formulär → Supabase EF → Airtable tills Fas E) är redan Marcus
  beslut (sessionsdok Del 1, rad 75). Detta pass designar EF-lagret för den
  vägen — det ifrågasätter inte vägvalet.
- **`ADR-080`** slår fast att "snittet går vid protokollet" (rad 75) för
  testhermetik vid EF-gränsen. Sessionsdoket (rad 93) återanvänder samma
  princip för Fas E-gränsen: sajten läser/skriver **genom EF-kontraktet**,
  aldrig direkt mot datakällan. Detta pass bygger vidare på den principen i
  § 9 (vad som överlever Fas E).
- **`ADR-129`** (2026-08-30) är den enskilt viktigaste befintliga byggstenen
  för hela detta uppdrag: en generisk, redan mätt-i-staging jobbmotor
  (`pgmq` + `pg_cron` + jobbtabell + `EdgeRuntime.waitUntil`-kick) byggd för
  KVITTOUTSKICK men **uttryckligen designad för att bära fler konsumenter
  utan att transporten ändras** (beslut 1, beslut 11: *"Motorn bär alla
  framtida utskick utan att transporten byts"*). Detta pass föreslår en NY
  konsument (publika anmälningar) i SAMMA motor — se § 6 och § 9.
- **`ADR-059`** (2026-06-20/21) avgjorde redan att server-side
  idempotens-LAGRING skjuts till Fas E, med klient-UUID bevarat i
  kontraktet. Prövningen av om den publika vägen rubbar det beslutet är
  krav 4 i uppdraget — svaret är nej, se § 4.
- **`airtable-constraints.md` P1–P4** (ingen unique-constraint, inga
  transaktioner, server-side idempotens strukturellt omöjlig, 5 req/s
  delat tak) är redan katalogiserade väggar, inte något detta pass upptäcker
  — det NYA är att appliceringen av dem på en OAUTENTISERAD, publik yta
  skärper konsekvenserna (en anonym avsändare kan inte "lita på" på samma
  sätt som Lotta via admin-appen).

**Vad som var åldrat eller behövde omprövas:** inget av ovanstående var
åldrat — samtliga är från 2026-06 till 2026-08-30, tre veckor eller mindre
gamla relativt detta pass, och `ADR-129`s minimaltest i staging är mätt
samma dag ADR:n skrevs. Jag sökte däremot om de externa branschstandarderna
(OWASP-cheatsheets, bot-skydds-leverantörernas dokumentation, GDPR-text) från
grunden, eftersom repot inte hade någon tidigare research om
bot-skydd/CAPTCHA/publika formulär — VERIFIERAT: `grep -rn -i
"captcha|honeypot|turnstile|hcaptcha|bot-skydd"` mot `tasks/lessons.md`,
`tasks/lessons.d/` och `docs/decisions/` gav noll träffar. Detta är alltså
den FÖRSTA strukturerade genomlysningen av ämnet i repot.

**Kompletterande fynd, inte i något tidigare pass:** dagens
**kontaktformulär** på miranon.se (`/pages/kontakt`, Elfsight Contact Form)
är redan skyddat av **reCAPTCHA** (VERIFIERAT via
`miranon-se-intagskedjan-idag-2026-09-19.md` § 1.3, mätt live 2026-09-19) —
alltså finns redan en levande precedent på sajten, om än en jag i § 2 avråder
från att kopiera rakt av till den nya publika skrivvägen. Detta noteras som
kontext, inte som argument för eller emot.

---

## Frågan

Hur bygger branschledarna en publik anmälningsväg utan inloggning som är
säker, missbrukstålig, tillgänglig och driftsäker — och vilken konkret
arkitektur bör Miranon Media lägga för vägen formulär → Edge Function
→ (Airtable nu, Postgres sedan)?

---

## 1. Hotbilden, rangordnad för DENNA yta

OWASP:s Denial of Service Cheat Sheet ger den strukturella grunden för hela
avsnittet:

> *"Puzzles serve a purpose against functionality abuse but this kind of
> technology will not help defend against DoS attacks."*
> [OWASP Denial of Service Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html),
> hämtad 2026-09-19

Det är skälet till att listan nedan inte har EN lösning (ett CAPTCHA) utan en
**lagrad** uppsättning kontroller — se § 9.

Rangordningen är gjord mot Miranon Medias FAKTISKA risk-profil (liten volym,
en arrangör, `Status` startar alltid `Obekräftad` och kräver mänsklig
granskning — VERIFIERAT, `create-registration.ts` rad 56, 184), inte mot en
generisk e-handelsprofil.

### 1.1 DoS mot Airtables delade kvota — HÖGST, för att den skadar ALLA, inte bara den publika ytan

5 req/s är ett DELAT tak per bas (`airtable-constraints.md` P4, rad 100–106)
— en burst mot den publika vägen kan låsa hela basen i **minst 30 sekunder**
(Airtables dokumenterade lockout, samma källa rad 93) för **Lottas egen
admin-app samtidigt**. En oautentiserad yta som anropar Airtable synkront är
alltså strukturellt den farligaste av de åtta punkterna, eftersom den enda
punkten kan slå ut ett internt verktyg en betalande verksamhet är beroende
av. Detta är skälet till arkitekturregeln i § 9: den publika vägen rör
ALDRIG Airtable i request-cykeln.

### 1.2 Skript som fyller eventet med falska anmälningar — HÖG, men lågstakes GIVET nuvarande status-modell

En skriptad avsändare som postar hundratals påhittade identiteter skulle i
en autokonfirmerande bokningsmotor (Ticketmaster-klass) vara katastrofal.
Här startar **varje** rad `Obekräftad` (§ Kort svar) — Lotta ser och
godkänner manuellt. Skadan av en attack är alltså "Lotta får städa en hög
skräprader", inte "riktiga kunder blev bortträngda från en bekräftad plats".
Det sänker allvarlighetsgraden ett steg jämfört med en generisk
bedömning, men höjer samtidigt kravet på RATE LIMITING (§ 3) — annars
blir städningen ändå ett återkommande arbetsmoment för Lotta.

### 1.3 Kapacitets-race ("sista platsen") — MEDEL, se § 5 för hela resonemanget

Samma logik som 1.2: eftersom ingen anmälan är bekräftad vid skrivning är
racet en fråga om KLASSIFICERING (Anmäld vs. Väntelista), inte om en
korrupt bokning. Se § 5.

### 1.4 Enumering — MEDEL, och ett KONKRET, kodverifierat fynd i den BEFINTLIGA EF:en

**Detta är det viktigaste enskilda säkerhetsfyndet i detta pass.**
`create-registration/index.ts` rad 213–221 returnerar vid en dubblett:

```ts
return new Response(
  JSON.stringify({
    error: 'Personen är redan anmäld till eventet',
    existingName: utfall.befintligtNamn,   // ⚠️ avslöjar NAMNET
    requestId,
  }),
  { status: 409, ... },
);
```

`existingName` är korrekt för DAGENS anropare (en inloggad admin som redan
vet vem hon letar efter). **Återanvänds detta svar rakt av på en publik,
anonym yta blir det en namn-orakel**: vem som helst kan iterera e-postadresser
mot ett event och få tillbaka riktiga namn för de som redan anmält sig — ett
brott mot OWASP:s princip för kontoregistrering:

> *"The objective is to prevent the creation of a discrepancy factor,
> allowing an attacker to mount a user enumeration action against the
> application."* Rekommenderat svar vid en krock: *"A link to activate your
> account has been emailed to the address provided"* — samma generiska
> besked oavsett om kontot redan finns.
> [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html),
> hämtad 2026-09-19

**Konsekvens för arkitekturen (§ 9, K6):** den publika EF:en MÅSTE använda en
EGEN, generisk 409-text utan `existingName` — `create-registration.ts`s
`sokBefintligAnmalan`-funktion återanvänds (den läser redan bara `Namn` för
internt bruk), men namnet får aldrig lämna servern på den publika vägen.

### 1.5 Dubbel-inskick — MEDEL, se § 4

Dubbelklick och browser-retry, samma klass ADR-059 redan adresserat för
admin-vägen. Den publika vägens svagare punkt är att `mutationKey`-dedupen
är klient-kod och kan förbigås av ett skript — men det fångas i stället av
409-kontrollen server-side (samma e-post + samma EventKey).

### 1.6 Injektion i fält som renderas i admin-appen eller i mail — MEDEL/HÖG, ett andra kodverifierat fynd

Admin-appen (React) auto-escapar textinnehåll i JSX — lagrad DOM-XSS-risk
i SJÄLVA React-vyerna är därför låg. Men **mail-mallmotorn gör INTE det**:

```ts
// _shared/action-mail-template.ts, fillPlaceholders():
const text = template.replace(/\{([a-zåäöA-ZÅÄÖ]+)\}/g, (traff, nyckel) => {
  const varde = varden[nyckel];
  ...
  return varde;   // ⚠️ ingen HTML-encoding
});
```

Detta är en RÅ sträng-substitution in i ett HTML-mail (Resend `html`-fältet).
Fälten som i dag matas in via Elfsight-formuläret och skulle matas in via
den nya publika EF:en — motivering, notering, tidigare-kurs-fritext — är
FRIA TEXTFÄLT en anonym besökare kontrollerar helt. Ett fält som innehåller
`<img src=x onerror=...>` och senare citeras in i ett åtgärdsmail (Lotta
skickar ett fritt mail som citerar anmälans motivering) skulle exekvera i
mottagarens e-postklient. **Detta är inte en ny bugg denna arkitektur skapar
— det är en BEFINTLIG lucka i `action-mail-template.ts` som blir FARLIGARE
den dag indata kommer från en oautentiserad, anonym källa i stället för
Elfsight-widgetens egen enkla textinmatning.** Rekommendation (golv, § 9):
`skapaAnmalanRad` MÅSTE HTML-encoda (eller strippa farliga tecken ur) varje
fritextfält innan skrivning, ELLER `fillPlaceholders` måste HTML-encoda vid
insättning — den senare är rätt fix eftersom den skyddar ALLA anropare av
mallmotorn, inte bara den nya vägen. **Flaggat som en förutsättning för
lansering, inte som en del av detta pass** (det är kodändring, inte
research) — se § 10.

### 1.7 Mail-bombning av tredje part via bekräftelsemailet — LÄGRE, redan strukturellt begränsad

`send-registration-confirmation` löser mottagaren **server-side ur den redan
skrivna Airtable-raden** (VERIFIERAT, filhuvudet: *"MOTTAGARNA LÖSES
SERVER-SIDE: klienten skickar ENDAST record-ID:n ... En klient kan därför
aldrig styra vem mailet går till"*). Samma disciplin på den publika vägen
gör att en attackerare inte kan mata in en godtycklig "skicka-bekräftelse-
till"-adress skild från anmälans egen e-post — den enda skadan är att
attackeraren kan få MILDLIGT ett enda bekräftelsemail skickat till en
tredje parts adress genom att skriva in den som sin egen (samma risk alla
publika formulär utan e-postverifiering bär). Rate-limiten (§ 3) begränsar
hur många gånger.

### 1.8 Spam/botar generellt — täcks av § 2 och § 9, inte en egen post

---

## 2. Bot-skydd jämfört

| | Effekt | Tillgänglighet | Integritet/GDPR | CSP-påverkan | Kostnad | Drift |
|---|---|---|---|---|---|---|
| **Cloudflare Turnstile** | Icke-interaktiv, "runs a series of small non-interactive JavaScript challenges ... proof-of-work, proof-of-space, probing for web APIs" | **"WCAG 2.2 AA compliant"** (förstapart) | "processes only the data strictly necessary" — men EU-persondata passerar Cloudflares infrastruktur; egen Privacy Addendum krävs | Kräver `script-src`/`frame-src`/`connect-src` mot Cloudflare-domäner — kolliderar med Fas 7:s hash-/self-CSP-plan | Gratis-tier finns (uppgift ej verifierad i detta pass för aktuell prisnivå) | Extern beroende, egen `siteverify`-nätverksväg vid varje anrop |
| **hCaptcha** | Utmaning → token → server-`siteverify` | Ej verifierat i detta pass (dokumentationssidan som fetchades saknade tillgänglighets-avsnittet) | Ej verifierat i detta pass | `script-src`/`frame-src`/`style-src`/`connect-src` mot `*.hcaptcha.com` — dokumentationen varnar uttryckligen: *"Please do **not** hard-code specific subdomains"* | Free/Pro/Enterprise-tiers, prisnivå ej verifierad | Samma externa beroende-klass som Turnstile |
| **reCAPTCHA v3** | Poäng 0.0–1.0, "will never interrupt your users" — men sidan Google själva fetchade är **markerad "deprecated"** | Ingen tillgänglighets-dokumentation hittad | **Svagast av klassen.** noyb har drivit **101 klagomål om just EU–USA-dataöverföringar** där reCAPTCHA/liknande tjänster pekas ut; Google skiftade 2026-04-02 sin roll till personuppgiftsbiträde men datan går fortfarande till USA, "no EU-only option" | Kräver Google-domäner i CSP | Ej verifierat (ingen prisinfo på den fetchade sidan) | Extern beroende |
| **ALTCHA (öppen källkod, proof-of-work)** | "A silent cryptographic challenge runs in the background. Real users never see a thing" — eskalerar till "accessible code challenge" med "Audio in 50+ languages" vid förhöjd risk | **"WCAG 2.2 AA conformant"**, "Full keyboard navigation", "Screen-reader labelled", **"No visual puzzles"** | **"100% GDPR compliant"**, "No personal data collected", öppen-källkod-läget kräver INGEN tredjepartsserver alls (verifieringen körs i EGEN Edge Function) | **Ingen** — självhostad, ingen extern domän behövs i CSP | **Gratis** öppen källkod ("Free forever"); molnläge från 47 €/mån om självhosting inte önskas | Låg — ingen extern nätverksväg krävs i öppen-källkod-läget |
| **Friendly Captcha** | Proof-of-work, "solved automatically" vid formulärstart | **"WCAG 2.2"**-hävdat | "compliant with GDPR, CCPA", tysk leverantör, "data centers in the EU" — men molntjänst, inte självhostad | Kräver Friendly Captcha-domän i CSP | Från 9 €/mån (1 000 requests/mån) | Extern beroende, men EU-fokuserad |
| **Honeypot + tidsfälla** | Fångar enkla skriptbotar (dolt fält ifyllt, formulär postat < N sekunder efter render) — fångar INTE en riktad, mänskligt styrd attack eller en väl skriven bot | **Perfekt** — helt osynligt, inget extra interaktionssteg för NÅGON användare. W3C: honeypots hör till de rekommenderade "fully non-interactive" metoderna | **Perfekt** — ingen data lämnar servern alls | **Ingen** | **Gratis** | Noll drift, ingen extern part |
| **E-postverifiering (double opt-in) som ENDA spärr** | Höjer tröskeln för REN spam-scriptning (kräver att en riktig inkorg klickar en länk) men stoppar INTE en riktad kapacitets-attack eller en bot som kör headless-mail-klick | Ett extra steg för LEGITIMA användare — Gunilla-kostnad: hon måste lämna sajten, öppna sin mail, klicka en länk, komma tillbaka | Bra (kräver äkta adress) men löser inte fält-injektion eller kapacitets-fyllning | Ingen | Gratis (Resend-anrop redan i budget) | Kräver en extra tillstånds-övergång (`väntar_verifiering`) i jobbmotorn |

**Källor:** [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/),
[hCaptcha docs](https://docs.hcaptcha.com/),
[Google reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3),
[ALTCHA](https://altcha.org/),
[Friendly Captcha](https://friendlycaptcha.com/),
[W3C — Inaccessibility of CAPTCHA](https://www.w3.org/TR/turingtest/),
[noyb — 101 complaints on EU-US transfers](https://noyb.eu/en/101-complaints-eu-us-transfers-filed)
(genom sökresultat, sidan själv ej djup-fetchad i detta pass — se § Vad jag
inte kunde belägga), samtliga hämtade 2026-09-19.

**OWASP:s eget ramverk för VAL mellan dessa, inte bara en lista:**

> *"Combine controls at three layers: Edge layer — CDN, WAF, or anti-bot
> service; Application layer — session-aware rate limits, identity-bound
> quotas, behavioral signals, honeypots, CAPTCHA challenges; Backend /
> business layer — anomaly detection on transactions, account-velocity
> rules, fraud scoring, async review queues."* Och: *"A single control is
> brittle."* Om synliga CAPTCHA: *"a last-resort step-up, not a primary
> defense"*, och OBLIGATORISKT: *"Provide an accessible alternative when
> challenging users with CAPTCHAs (audio CAPTCHA, support contact)."*
> Respons-strategin ska vara **graderad, inte binär**: *"Hard blocks teach
> attackers what worked. A graduated response is more durable"* — logga →
> steg-upp-utmaning → tarpitting → mjuk blockering → bekräftad-missbruk-håll.
> [OWASP Bot Management and Anti-Automation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html),
> hämtad 2026-09-19

**W3C:s slutsats, som väger tyngst för Gunilla-principen:**

> *"Whenever an interactive CAPTCHA is implemented, a variety of alternative
> challenges must be made available"* — och fullt icke-interaktiva metoder
> (honeypots, proof-of-work, heuristik) är *"a most welcome development
> direction for accessibility"*.
> [W3C — Inaccessibility of CAPTCHA](https://www.w3.org/TR/turingtest/),
> hämtad 2026-09-19

**Domen för Miranon Media (se även § 9):** honeypot + tidsfälla + ALTCHA i
öppen-källkod-läge som GOLV; graderad eskalering till en synlig utmaning
ENDAST vid förhöjd risksignal, aldrig som förstahandsval — och ALDRIG
reCAPTCHA, givet tredjelandsfrågan och att sidan Google själv publicerar är
markerad `deprecated`.

---

## 3. Rate limiting på Supabase Edge Functions

**Verifierat mot Supabase 2026-09-19:** Supabase har **inget inbyggt,
konfigurerbart rate-limiting-lager för egna Edge Functions.** Deras egna
Auth-rate-limits (`supabase.com/docs/guides/auth/rate-limits`) gäller bara
Auth-endpoints, inte kundens kod. Den dokumenterade lösningen för en EGEN
funktion är en fristående receptsida:

> Recept: rate-limiting av Edge Functions med **Upstash Redis**
> ("HTTP/REST based Redis client ... works well with Supabase Edge
> Functions"), exempelkod i
> `supabase/examples/edge-functions/supabase/functions/upstash-redis-ratelimit`.
> [Supabase — Rate Limiting Edge Functions](https://supabase.com/docs/guides/functions/examples/rate-limiting),
> hämtad 2026-09-19

**Alternativen, och valet för Miranon Media:**

1. **Upstash Redis** (Supabase-dokumenterat) — kräver en NY leverantör, ett
   nytt API-nyckel-par att förvara, och en ny extern nätverksväg per anrop.
   Motiverat vid hög trafik (många samtidiga edge-instanser som behöver dela
   en räknare snabbt).
2. **Vercel WAF/Firewall framför** — repot är redan Vercel Pro-hostat
   (`t95-r1-hosting-vercel-2026-08-02.md`), men Vercels edge-nätverk sitter
   framför den STATISKA sajten, inte framför Supabase Edge Functions (som
   körs på Supabases infrastruktur, inte Vercels). En Vercel Firewall-regel
   skyddar alltså miranon.se-SIDAN mot volymattacker men inte EF-anropet
   direkt — relevant komplement, inte en ersättning.
3. **Postgres-baserad räknare** (rekommenderas): en liten tabell i SAMMA
   databas som jobbmotorn redan lever i (`ADR-129`), en sliding-window- eller
   fixed-window-räkning per IP-hash + event-ID, med en `UNIQUE`/`UPSERT`-sats
   som ger atomicitet UTAN extern tjänst. Detta är samma avvägning
   `ADR-129` alternativ E redan gjorde för själva kön ("Extern kötjänst …
   Avvisat på samma linje som ADR-110 alternativ 3: ny leverantör, nytt
   auth-flöde och ny kostnadsrad för något en Postgres-instans som redan är
   i drift kan bära") — jag återanvänder samma resonemang här: vid
   Miranon Medias volym (tiotals event/år) är en extra Postgres-tabell
   billigare än en ny leverantör, och undviker en fjärde autentiserings-yta
   att bevaka.

**Rimlig nivå vid vår volym:** ett par lager, per IP OCH per event
(en ensam attackerare mot ETT event ska inte kunna gömma sig bakom ett
globalt-men-utspritt tak) — t.ex. 5 anmälningar/IP/10 minuter och
30 anmälningar/event/timme som ett första, medvetet löst valt golv (INTE en
mätt siffra — flaggat som en STARTBEDÖMNING i linje med hur `ADR-129`
själv deklarerade sitt rundtak som "öppet deklarerad startbedömning, inte
mätning"). OWASP:s ASVS-influerade råd stödjer separata hinkar:

> *"Rate limits should be applied at IP, identity, and endpoint levels,
> using a sliding window."*
> [OWASP Bot Management and Anti-Automation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html),
> hämtad 2026-09-19

---

## 4. Idempotens och dubbel-inskick — omprövar detta ADR-059?

**Nej — ADR-059 kvarstår oförändrad. Sagt rakt ut, inte antytt.**

ADR-059:s beslut var: klientgenererad UUID i `Idempotency-Key`, LOGGAD men
INTE lagrad förrän Fas E, med `mutationKey`-dedup + disabled submit som
skydd i webbläsaren, och ett EXPLICIT accepterat smalt race-fönster
motiverat av **single-admin-användning**.

Den publika vägen förändrar EN premiss (avsändaren är nu anonym/obekant i
stället för en känd, betrodd admin) men INTE de två som bar beslutet:

1. **Lagringsmekanismen är fortfarande omöjlig i Airtable** (P1–P3,
   `airtable-constraints.md`) — ingenting i den publika vägen gör en
   Airtable-unique-constraint möjlig. Premissen står.
2. **Fas E-planen för att stänga racet skarpt är oförändrad** — en
   `UNIQUE INDEX`-reservation i Postgres, additiv aktivering av samma
   klient-kontrakt.

Det som ÄR nytt, och som jag flaggar som en SKÄRPNING snarare än en
omprövning: klientkodens `mutationKey`-dedup (TanStack, körs i webbläsaren)
är ett skydd MOT EN LEGITIM ANVÄNDARES eget dubbelklick — den skyddar
INTE mot en skriptad avsändare som medvetet postar samma payload två gånger
med olika `Idempotency-Key`-värden. Det skyddet ligger i stället i den
SERVER-SIDE 409-kontrollen (normaliserad e-post + EventKey,
`sokBefintligAnmalan` — VERIFIERAT, redan byggd och återanvänd oförändrat)
plus rate-limiten (§ 3). Detta var redan sant för admin-vägen (en admin
KUNDE i teorin skripta två anrop) — den publika vägen gör det bara mer
sannolikt att någon faktiskt försöker, inte principiellt annorlunda.

**Stripes mönster, som ADR-059 redan följer i sak:**

> *"Stripe's idempotency works by saving the resulting status code and body
> of the first request … Subsequent requests with the same key return the
> same result … We suggest using V4 UUIDs … Avoid using sensitive data (for
> example, email addresses or personal identifiers) as idempotency keys …
> keys removed automatically after they're at least 24 hours old."*
> [Stripe — Idempotent requests](https://docs.stripe.com/api/idempotent_requests),
> hämtad 2026-09-19

**IETF-utkastet, som bär samma kontrakt standardiserat:**

> *"The idempotency key MUST be unique and MUST NOT be reused with another
> request with a different request payload … It is RECOMMENDED that a UUID
> or a similar random identifier be used."*
> [draft-ietf-httpapi-idempotency-key-header](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-07),
> hämtad 2026-09-19 (version 07, oktober 2025 — arbetsutkast, ej RFC)

Den publika EF:en bör därför: (a) KRÄVA `Idempotency-Key` precis som
`create-registration` redan gör (rad 144–149), (b) logga nyckeln
UTAN persondata i loggraden (redan mönstret — `create-registration.ts`
loggar aldrig e-post, bara `eventKey`), och (c) **när Fas E:s
`UNIQUE INDEX`-aktivering byggs, gäller den identiskt för BÅDA vägarna**
(admin och publik) eftersom de delar samma nyckel-kontrakt.

---

## 5. Kapacitetskontroll utan transaktioner — inkorg som buffert, inte en andra sanning

**Det strukturella problemet, VERIFIERAT:** Airtable har ingen unique-
constraint (P1) och inga transaktioner (P2) — `airtable-constraints.md`
rad 44–75. `_shared/belaggning.ts` (den enda befintliga
kapacitets-räkningen) är en RÄKNING vid LÄSTILLFÄLLET, aldrig ett lås —
den svarar frågan "hur många är anmälda just nu", inte "reservera en plats
åt mig atomärt".

**Provat mot uppdragets tre alternativ:**

**(a) Postgres som durabel inkorg + serialiserad skrivare (outbox).** Löser
driftsäkerheten (§ 6) perfekt men löser INTE kapacitetsracet i sig — att
lägga en rad i en kö garanterar inte att kön BEHANDLAS i den ordning som
respekterar en hård platsgräns, om inte kön SJÄLV bär ett atomärt
platsräknarsteg. Ett sådant steg (en Postgres-sida `event_platser_kvar`
med `CHECK`/`UPDATE ... WHERE platser_kvar > 0`) ÄR byggbart, men gör
Postgres-räkningen till den auktoritativa sanningen om beläggning —
en sanning som måste hållas i synk med Airtables egna platsfält
(`Max antal platser`, `Manuella platser`, `Extra platser`,
`Arrangörsplatser` — VERIFIERAT, `data-model.md` rad 1119–1122) OCH med
admin-appens egna, oberoende skapade rader (`Källa=Manuell`). Två
skrivvägar till "hur många platser är kvar" är precis den TVÅ-SANNINGAR-
risk arkitektur-destillatet varnar för (§ Spår 3: *"Airtable fasas ut eller
blir läskopia (aldrig två sanningar)"*, `arkitektur-destillat-och-gap-
2026-07-25.md` rad 123).

**(b) Optimistisk skrivning + efterkontroll + vänlig "du hamnade på
intresselistan".** Detta är REKOMMENDATIONEN, med ett skäl specifikt för
Miranon Media: **statusmodellen gör "fel klassificering" billig att rätta.**
Eftersom varje ny rad startar `Obekräftad` oavsett `Källa`, är en
felklassificerad "Anmäld" som egentligen borde varit "Väntelista" (eller
tvärtom) en fråga Lotta redan löser manuellt varje dag — det är inte en
bokningskrasch, det är en triage-uppgift av samma klass som hela hennes
befintliga arbetsflöde (`ADR-128` § Kontext: *"Lotta kollar bankkontot …
letar upp dem en efter en"*). Klassificeringen (Anmäld vs. Väntelista) görs
mot en FÄRSK, ENKELRIKTAD Postgres-cache av Airtables platsläge — analogt
med `ADR-128` beslut 6:s spegel-princip men i motsatt riktning (Airtable →
Postgres, uppdaterad av samma bakgrundskonsument varje gång en rad faktiskt
skrivs, plus en periodisk avstämning) — **aldrig läst av någon annan del av
appen, aldrig visad som "sanning" för Lotta**, bara använd som en
BEST-EFFORT-gissning vid intagsögonblicket. Luma gör exakt detta
(§ 8): väntelistan promoveras HELT MANUELLT, ingen automatisk
plats-tilldelning.

**(c) Annat — hybrid, avvisad som spekulativ komplexitet vid denna volym.**
En "riktig" distribuerad lås-reservation (Postgres advisory lock eller
en tvåfas-commit-liknande mekanism mot Airtable) löser ett problem
Miranon Media inte har ännu: `ADR-059`s exakta resonemang ("ny
distribuerad-transaktions-felmod … för EN tabell, i EN EF, före Fas E")
gäller lika starkt här. Byggs den ändå är den en FALLBACK att aktivera OM
mätt incidens visar motsatsen — samma mönster `ADR-059` själv lämnade
öppet ("Alt X … Noterat som fallback om empirisk incidens senare motiverar
skarpt interim-skydd").

**Svaret på uppdragets direkta fråga:** Postgres-inkorgen är **en buffert,
aldrig en andra sanning** — under tre villkor, alla uppfyllda av
designen ovan: (1) inkorgsraden bär bara JOBBSTATUS ("skrivet till Airtable
eller inte"), aldrig anmälningssanningen, som förblir Airtable
`Anmälningar` (samma distinktion `ADR-129` redan gör mellan kö/tabell som
TRANSPORT och Airtable/Postgres som DOMÄN-sanning); (2)
kapacitets-cachen som gate:ar Anmäld/Väntelista är uttryckligen märkt
icke-auktoritativ, läses ENDAST vid intagsögonblicket, och läcker aldrig ut
som en siffra Lotta eller appen litar på; (3) en periodisk avstämning mot
Airtables faktiska läge håller drift begränsad och SYNLIG, aldrig tyst
växande — samma `ADR-128` beslut 6-konsistensvakt-princip
("den tvålagers-risken tystas inte, den bevakas").

---

## 6. Driftsäkerhet — återanvänd jobbmotorn, bygg ingen ny

**Frågan uppdraget ställer** ("vad händer med en anmälan när Airtable är
nere eller kvoten slagen? En tappad anmälan är en förlorad kund") är
**redan besvarad av `ADR-129`, för ett annat men strukturellt identiskt
problem** (kvitton som måste skickas garanterat, även om PDF-tjänsten
eller Resend är nere en stund). Jag föreslår INGEN ny mekanism — jag
föreslår att den publika vägen blir konsument #2 av samma motor
(`ADR-129` beslut 11: *"Motorn är generisk från dag ett, men får EN
konsument nu … Migreringen … till samma motor är en egen PRD"* — publika
anmälningar är en naturlig kandidat till just den platsen).

**Vad som redan är mätt, byggt och därmed BARA ska återanvändas
(fil-/mekanism-för-fil):**

| Mönster | Redan byggt av | Bär | Källa |
|---|---|---|---|
| Durabel kö | `pgmq` (utökning) | Meddelandet är generiskt: `{jobbtyp, radId}` — ny `jobbtyp: 'publik_anmalan'` läggs till utan att transporten ändras | `ADR-129` beslut 1 |
| Sanning om jobbets läge | Jobbtabell (`väntar → pågår → skickat/fel`) | Per-rad-status, försöksräknare, felskäl — exakt vad Lotta/appen behöver visa | `ADR-129` beslut 2 |
| Omedelbar känsla | `EdgeRuntime.waitUntil`-kick | Svarar direkt, betar kön i bakgrunden — kicken kan misslyckas GRATIS, cron tar över | `ADR-129` beslut 3 |
| Garanti + självläkning | `pg_cron` var 10:e sekund | Sveper `pågår`-rader som fastnat tillbaka till `väntar` — motsvarar Pretix läkningssvep | `ADR-129` beslut 4 |
| 429-härdning mot Airtable | `_shared/airtable-retry.ts` | Exponentiell backoff från 30 s, jitter uppåt, tak 2 omförsök — mätt, testat, oförändrat | `TASK-53`, `airtable-constraints.md` P4 |
| Skriv-kärna | `_shared/create-registration.ts` (`skapaAnmalanRad`) | Samma fält-bygge, samma allowlist-grind, samma EventKey-logik — konsumenten anropar den OFÖRÄNDRAD | VERIFIERAT, kodläsning |

**Konsekvens:** en publik anmälan är **durabel från det ögonblick EF:en
svarar 201/202** — exakt samma egenskap `ADR-129` redan bevisade för
kvitton ("ett klick, direkt svar, och ett jobb som överlever en stängd
flik, en serveromstart och ett fel mitt i"). Ingen ny infrastrukturdel
krävs utöver en ny rad i en redan existerande tabell och en ny gren i en
redan existerande konsumentfunktion.

---

## 7. Persondata — vad samlas faktiskt in, och vad kräver den nya vägen

**MÄTT, inte antaget:** en sökning i `docs/reference/data-model.md` efter
`kost|hälsa|allergi|diet|hälsotillstånd` gav **noll träffar**. Uppdragets
premiss om "ev. kost/hälsa" är alltså en **HYPOTES som faller för DAGENS
fält** — inga särskilda kategorier (GDPR artikel 9) samlas in via
`Anmälningar`-flödet i dag. Blir relevant först om ett framtida fält
(t.ex. specialkost till en fysisk kurs) läggs till.

**Fälten som FAKTISKT samlas in i dagens webbformulär** (VERIFIERAT,
`miranon-se-intagskedjan-idag-2026-09-19.md` § 2 fältinventering +
`data-model.md` rad 1090–1096): Förnamn, Efternamn, E-post, Mobilnummer,
fri text ("Varför vill du gå den här utbildningen?"), checkbox-grupp
(tidigare kurser), och en SEPARAT marknadsförings-opt-in ("Uppdatera mig
om fler event i framtiden?").

**Rättslig grund (artikel 6):**

> Art 6(1)(a): *"the data subject has given consent to the processing …
> for one or more specific purposes"*; Art 6(1)(b): *"processing is
> necessary for the performance of a contract to which the data subject
> is party or in order to take steps at the request of the data subject
> prior to entering into a contract"*.
> [GDPR Art. 6](https://gdpr-info.eu/art-6-gdpr/) (engelsk
> översättning; auktoritativ källa EUR-Lex — se § Vad jag inte kunde
> belägga för varför den inte kunde fetchas direkt), hämtad 2026-09-19

De KÄRN-registreringsfälten (namn, e-post, telefon) vilar naturligt på
Art 6(1)(b) — anmälan är ett steg mot ett kursdeltagande-avtal.
**Marknadsförings-opt-in-fältet måste vila på Art 6(1)(a) SEPARAT**, och
IMY är entydig om att det INTE får buntas:

> *"Det ska vara lika lätt att återkalla ett samtycke som att lämna det"*,
> och samtycke kräver *"en otvetydig viljeyttring"* — inga förikryssade
> rutor. Organisationer får inte *"require consent as a condition for
> services when that data isn't necessary for the service itself"*.
> [IMY — Samtycke som rättslig grund](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/rattslig-grund/samtycke/),
> hämtad 2026-09-19

**Konkret krav på formuläret:** anmälan (kärnfälten) och
marknadsförings-opt-in måste vara TVÅ separata kryssrutor — en enda
"jag godkänner" som täcker båda vore ett brott mot no-bundling-principen.

**Informationsplikt (artikel 13):** IMY listar exakt vad som måste
kommuniceras — *"varför dina uppgifter kommer att användas"*,
*"den rättsliga grunden"*, *"hur länge dina uppgifter kommer att lagras"*,
*"vem som kommer att ta del av dina uppgifter"*, *"dina rättigheter"*,
*"om dina uppgifter kommer att överföras till ett tredjeland"*,
*"din rätt att lämna in klagomål"*, *"kontaktuppgifterna till den
organisation som ansvarar"* —
*"kostnadsfritt i en lättillgänglig, skriftlig form skrivet med ett klart
och tydligt språk"*.
[IMY — Rätt till information](https://www.imy.se/privatperson/dataskydd/dina-rattigheter/ratt-till-information/),
hämtad 2026-09-19

Detta är ett **byggblockerande krav, inte kod**: formuläret behöver en
länk till en integritetspolicy INNAN lansering, och den texten måste
skrivas av Marcus/Roger/Lotta (juridiskt innehåll, inte kod Code kan
generera) — se § 10.

**Dataminimering:** fälten ovan är redan minimala (fyra identitetsfält +
en motivering + ett samtycke) — jag hittar ingen anledning att skära
något givet att motiveringstexten redan används av Lotta för att bedöma
en sökande (funktionellt nödvändig, inte spekulativ). Om ett framtida
kost/hälsa-fält läggs till KRÄVER det ett SEPARAT, uttryckligt samtycke
per Art 9(2)(a) utöver Art 6-grunden:

> *"Processing of personal data … data concerning health … shall be
> prohibited"* om inte ett undantag i 9(2) tillämpas.
> [GDPR Art. 9](https://gdpr-info.eu/art-9-gdpr/), hämtad 2026-09-19

**Loggning utan persondata:** redan etablerat mönster att följa —
`create-registration.ts` loggar `eventKey` och `caller_user_id`, ALDRIG
e-post eller namn (VERIFIERAT, rad 145–153, 206–213). Den publika EF:en
ska hålla samma disciplin; utan `caller_user_id` (ingen inloggad
avsändare) blir loggraden `idempotencyKey` + `eventKey` + IP-HASH (aldrig
rå IP i loggraden om det går att undvika, som en extra försiktighetsåtgärd
— inte ett belagt krav, en rekommendation).

**Lagringstid — INGET FYND.** Sökning efter `lagringstid|gallring` i
`data-model.md` och samtliga ADR:er gav noll träffar. Detta är en
FÖREXISTERANDE lucka, inte något detta pass skapar, men den blir mer
akut när en anonym allmänhet (inte bara Lottas egna kontakter) börjar
mata in data. Flaggat i § 10.

---

## 8. Precedenter

Tre primärkällor, som uppdraget kräver minst. Precedent-rymden för
"litet event-företag bygger en egen publik anmälan" är i övrigt TUNN — de
flesta jämförbara produkter (Eventbrite, Luma) är SaaS-plattformar som
löser problemet ÅT sina kunder, inte kodexempel att läsa källkod på.
Detta sägs öppet, inte gömt.

**1. pretix (öppen källkod, självhostad biljett-/eventplattform).**
Cart-baserad reservation: *"pretix's built-in checkout automatically
reserves tickets in a user's cart for a configurable amount of time to
ensure users will actually get their tickets"*, och atomär
order-skapelse: *"Creating orders is an atomic operation: The order is
either created as a whole or not at all"* — via ett `consume_carts`-
parameter som krediterar en tidigare reservation och FÖRSTÖR
kort-vagnen bara om order-skapelsen lyckas. [pretix — Creating an
external checkout process](https://docs.pretix.eu/dev/api/guides/custom_checkout.html),
hämtad 2026-09-19. **Relevans:** pretix bygger en ÄKTA, tidsbunden
reservation eftersom deras produkt (biljetter, ofta betalda direkt) har
högre stakes än Miranon Medias `Obekräftad`-modell — precis den skillnad
§ 5 använder för att MOTIVERA att Miranon Media INTE behöver samma
mekanism ännu.

**2. Luma (fullständigt undersökt i ett SYSTERPASS samma dag, se
[`luma-studie-monster-for-nya-miranon-se-2026-09-19.md`](luma-studie-monster-for-nya-miranon-se-2026-09-19.md)).**
Central relevans för DENNA fråga: väntelistan promoveras **HELT
MANUELLT** — *"hosts must manually approve waitlisted guests when spots
become available … no automatic 'first come, first served' assignment"*
(citerat i systerpasset, `help.luma.com/waitlist`). Detta är exakt
alternativ (b)s modell i § 5, oberoende bekräftad av en tredje
plattform.

**3. Supabase egna dokumenterade mönster för publika, oautentiserade
skrivningar via RLS.** Standardmönstret är en `anon`-roll-policy med
`WITH CHECK` för INSERT, kombinerat med grants — *"Use both controls
for every exposed object … RLS is what makes Supabase safe for direct
client access. Without it, any client with your anon key can read/write
any row."* [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security),
hämtad 2026-09-19 (via sökresultats-sammandrag, se § Vad jag inte kunde
belägga). **Relevans, och en viktig SKILLNAD:** detta mönster föreslår
att klienten skriver DIREKT till Postgres via `anon`-nyckeln och RLS.
Miranon Medias val (§ 9) går via en Edge Function i stället — samma
val `ADR-110`/`ADR-128`/`ADR-129` redan gjort för varje annan
skrivväg i repot (service_role bakom en EF, aldrig `anon`-direktskrivning),
av samma skäl: en EF kan köra rate-limiting, bot-skydd och
fält-allowlist FÖRE något skrivs, vilket en ren RLS-policy inte kan
uttrycka lika rikt.

**4. Formspree/Basin-klassen ("skicka formulär till en tjänst, få
mail") — INTE djupt undersökt i detta pass** (fetch-försök mot
`formspree.io` gav 404 på den specifika sidan jag försökte). Klassens
KÄNDA mönster (allmän branschkunskap, ej källbelagt i detta pass):
honeypot + valfri CAPTCHA-integration + serverside spam-filter. Flaggat
som en OBEKRÄFTAD precedent — se § Vad jag inte kunde belägga.

**Dom över precedent-rymden:** tre av fyra begärda klasser gav verklig,
källbelagd substans (pretix, Luma, Supabase); Formspree/Basin-klassen
förblir en allmän branschreferens utan djup källbeläggning i detta pass.
Ingen av de tre bekräftade källorna bygger EXAKT Miranon Medias
situation (litet, ett-varumärke, Airtable-som-mellanlager-tills-Fas-E) —
rymden är alltså TUNN specifikt för den kombinationen, vilket är skälet
till att § 9 syntetiserar i stället för att kopiera en enda förlaga.

---

## 9. Rekommenderad arkitektur

**Detta är en rekommendation, inte ett beslut** — samma markering
`ADR-059` och `ADR-129` själva höll isär mellan forskningsunderlag och
Marcus-ratificerat beslut.

### Sekvensen, klick till bekräftelsemail

1. **K1 — Besökaren fyller i formuläret** på nya miranon.se. Honeypot-
   fältet (dolt, `aria-hidden`, `tabindex="-1"`, namngivet för att undvika
   autofyll) och en klient-renderad tidsstämpel finns i formuläret men
   syns aldrig för en människa eller skärmläsare.
2. **K2 — ALTCHA löser en osynlig proof-of-work-utmaning** i bakgrunden
   medan besökaren fyller i fälten (öppen källkod, ingen tredjepartsserver,
   ingen CSP-ändring). Vid förhöjd risksignal (se K4) eskalerar UI:t till
   ALTCHAs "accessible code challenge" (ljud på 50+ språk, ingen bild) —
   ALDRIG som förstahandsläge.
3. **K3 — Submit → POST** till en NY, oautentiserad Edge Function
   (`public-create-registration`), UTAN `Authorization`-header, MED
   `Idempotency-Key` (klientgenererad UUIDv7, samma kontrakt som
   `create-registration` redan har).
4. **K4 — Metod- och CORS-vakt.** Samma `handleCors`/`corsHeadersFor`
   (`_shared/cors.ts`) återanvänds OFÖRÄNDRAD — `miranon.se` läggs till i
   `CORS_ALLOWED_ORIGINS`. POST-only-vakt återanvänd rakt av.
5. **K5 — Rate limiting** mot en liten Postgres-tabell (§ 3): per-IP-hash
   och per-event, `UPSERT`-baserad, atomär. Överträdelse → 429 (samma
   HTTP-semantik som Airtables eget kontrakt, bekant mönster i repot) och
   en HÖJD risksignal till K2:s ALTCHA-eskalering vid nästa försök.
6. **K6 — Honeypot/tidsfälla-kontroll.** Ifyllt honeypot-fält ELLER
   submit < ~2 sekunder efter render → **TYST 201-svar utan att skriva
   något** (samma "svara identiskt, avslöja aldrig" princip som § 1.4:s
   enumerings-fix — en bot ska inte kunna skilja "accepterad" från
   "tyst kastad").
7. **K7 — Zod-validering server-side**, delad schema-fil
   (`_shared/public-registration-schema.ts`, ny men byggd på samma
   `EMAIL_RE`/typ-mönster som `create-registration.ts` redan har). Zod
   `^4.4.3` finns redan i repot och är redan Deno-importerad av minst en
   EF-modul (VERIFIERAT, `activity-statement-schema.ts`).
8. **K8 — Eventuppslag**, `hamtaEventNyckel` (återanvänd OFÖRÄNDRAD ur
   `_shared/create-registration.ts`) — 404 om eventet inte finns ELLER
   inte är publicerat/bokningsbart (kräver att livscykel-fältet från
   arkitektur-destillatets Spår 2 — `Publicerad på miranon.se` — läses;
   se § 10 för att den frågan är ÖPPEN och inte avgörs här).
9. **K9 — Enumerings-säker dubblettkontroll.** `sokBefintligAnmalan`
   (återanvänd) körs, men svaret vid träff är ALLTID generiskt: *"Tack —
   vi har redan din anmälan till det här eventet, hör av dig till oss om
   något behöver ändras"* — `existingName` lämnar ALDRIG den publika EF:en
   (§ 1.4).
10. **K10 — Kapacitetsklassificering** (§ 5): en läsning mot den
    enkelriktade Postgres-platscachen avgör om raden märks `Anmäld` eller
    `Väntelista` i sitt jobbmetadata — icke-auktoritativt, alltid
    omprövningsbart av Lotta.
11. **K11 — Atomär skrivning till Postgres-inkorgen**
    (`publika_anmalningar`, ny tabell, samma migrations-familj som
    `ADR-129`): `idempotencyKey` UNIQUE, status `väntar`, all formulärdata,
    klassificeringen från K10.
12. **K12 — EF svarar DIREKT** (201, `{status: 'mottagen', klass:
    'anmald'|'vantelista'}`) — INGEN Airtable-anrop har ännu skett.
    Besökaren väntar aldrig på Airtables 5 req/s-tak.
13. **K13 — Kick**: `EdgeRuntime.waitUntil` startar bakgrundsarbete som
    omedelbart plockar den nya jobbtypen `publik_anmalan` ur SAMMA kö som
    `ADR-129` redan byggt.
14. **K14 — Bakgrundskonsumenten anropar `skapaAnmalanRad`** (återanvänd
    OFÖRÄNDRAD) mot Airtable, härdat av `withAirtable429Retry`
    (återanvänd OFÖRÄNDRAD) — `Källa` sätts till ett NYTT, additivt värde
    `"Webbformulär"` (ny option i ett befintligt `singleSelect`-fält,
    samma additiva disciplin som `ADR-063`/`ADR-109` redan följer) i
    stället för dagens Zapier-tomma fält, så nya EF-skrivna rader syns
    tydligt skilda från den historiska Elfsight/Zapier-populationen.
15. **K15 — `pg_cron`-svepet** (oförändrat, var 10:e sekund) betar av
    allt kicken missade och läker fast `pågår`-rader — samma garanti som
    kvittoflödet redan har mätt (§ 6).
16. **K16 — Bekräftelsemail**: en NY jobbtyp-gren (eller en andra kö-post
    kedjad från K14:s lyckade skrivning) anropar mottagar-server-side-
    upplösnings-mönstret från `send-registration-confirmation`
    (VERIFIERAT-mönster, återanvänd disciplin, inte kod rakt av eftersom
    den EF:en i dag kräver `requireUser`) — adressen som mailas är EXAKT
    den som skrevs till Airtable-raden, aldrig ett separat klientfält.

### Vad som återanvänds (fil för fil)

`_shared/cors.ts` · `_shared/create-registration.ts`
(`hamtaEventNyckel`, `sokBefintligAnmalan`, `skapaAnmalanRad`, `EMAIL_RE`)
· `_shared/field-allowlists.ts` (ny operation-post, samma
deny-by-default-mekanism) · `_shared/airtable-client.ts` +
`_shared/airtable-retry.ts` · `_shared/belaggning.ts` (läsning, aldrig
skrivning) · `_shared/errors.ts` · `_shared/coerce.ts` ·
`ADR-129`s jobbmotor i sin helhet (`pgmq`, `pg_cron`, jobbtabell,
`security definer`-wrapper, Realtime-publikationen) · ADR-059:s
klient-idempotens-kontrakt · `send-registration-confirmation`s
server-side-mottagarupplösnings-DISCIPLIN (mönster, inte kod rakt av).

### Vad som är nytt

`supabase/functions/public-create-registration/index.ts` ·
`_shared/public-registration-schema.ts` (zod) · Postgres-tabellerna
`publika_anmalningar` (inkorg) och en liten rate-limit-tabell · en ny
jobbtyp i `ADR-129`s befintliga jobbtabell · en enkelriktad
kapacitets-cache-tabell (icke-auktoritativ) · ett nytt `Källa`-värde
"Webbformulär" i Airtable · en ny operation i `field-allowlists.ts` ·
ALTCHA-integrationen på klienten · HTML-encoding-fixen i
`fillPlaceholders` (§ 1.6 — GOLV, oavsett om den byggs i detta uppdrag
eller separat, eftersom den publika vägen skärper en befintlig lucka).

### Vad som överlever Fas E oförändrat

Per `ADR-080`s princip ("snittet går vid protokollet"), applicerad på
Fas E-gränsen som sessionsdoket redan gör (rad 93: *"sajten läser och
skriver genom EF-kontraktet, aldrig direkt mot datakällan"*): EF:ens
HTTP-KONTRAKT (endpoint-sökväg, JSON-form, `Idempotency-Key`-kravet,
statuskoderna 201/400/404/409/429) är helt oförändrat efter Fas E.
Klienten (nya miranon.se) märker ingenting. Postgres-inkorgen, kön och
jobbtabellen är REDAN Postgres — de flyttar ingenstans. Det ENDA som
byter är vad K14 anropar: `skapaAnmalanRad`-motsvarigheten pekar mot en
Postgres-skrivning i stället för Airtable, bakom SAMMA adapter-gräns
`ADR-057` redan kräver ("port-pariteten gäller — nya portar måste in i
BÅDA adaptrarna"). Detta är samma mönster `ADR-128` redan bevisat i
praktiken för betalningsdomänen.

### Golv (får aldrig skäras) kontra spekulativ komplexitet (skärs vid vår volym)

**Golv:** ingen synkron Airtable-anrop i request-cykeln (§ 1.1) ·
generisk 409 utan namn (§ 1.4) · HTML-encoding i mailmallmotorn (§ 1.6)
· `Idempotency-Key`-krav (§ 4) · rate limiting per IP+event (§ 3) ·
honeypot+tidsfälla (kostar noll, skär aldrig) · Art 6/13-information och
separat marknadsförings-opt-in (§ 7, juridiskt obligatoriskt) ·
återanvändning av `ADR-129`s jobbmotor i stället för en ny mekanism
(§ 6).

**Spekulativ komplexitet att skära vid Miranon Medias volym:** en tredje-
parts CAPTCHA-tjänst som förstahandsval (§ 2 — ALTCHA öppen källkod
räcker) · en ÄKTA atomisk Postgres-lås-reservation för "sista platsen"
(§ 5 — den asymmetriska kostnaden av fel gör den optimistiska modellen
rätt just nu) · Upstash Redis eller annan extern rate-limit-tjänst (§ 3
— en Postgres-tabell räcker vid denna volym) · en dedikerad
e-postverifierings-flow (double opt-in) som PRIMÄRT bot-skydd (§ 2 —
för mycket Gunilla-friktion för den marginella vinsten vid vår hotbild).

---

## 10. Vad som INTE besvarades

1. **Var den nya sajtens frontend-kod faktiskt bor** (separat Vite-app i
   samma repo? nya routes i TanStack Router-appen? ett tredje repo trots
   att uppdraget säger "i detta repo"?) — sessionsdok Del 1 nämner bara
   att den ska byggas "i detta repo", inte den konkreta kod-placeringen.
   Detta avgör var ALTCHA-widgeten och formulärkoden faktiskt landar och
   är en förutsättning för att bygga K1–K3 — men det är en
   ARKITEKTUR-/scope-fråga för grillningen (sessionsdok Del 1 punkt 3),
   inte en research-fråga.
2. **Livscykel-/publiceringsfältet** (`Publicerad på miranon.se`,
   arkitektur-destillatets Spår 2) är en checkbox i dag, inte en riktig
   livscykel (`draft/scheduled/published/archived` + bokningsbarhet skild
   från synlighet) — K8 FÖRUTSÄTTER att den frågan är löst, men den är
   explicit ÖPPEN i `arkitektur-destillat-och-gap-2026-07-25.md` och
   INTE avgjord av detta pass.
3. **Exakt vilken rate-limit-siffra som är rätt** — § 3:s tal är en
   medvetet öppen STARTBEDÖMNING, inte en mätning, precis som
   `ADR-129`s eget rundtak.
4. **Formspree/Basin-klassens faktiska mekanismer** — fetch-försöket
   404:ade, se § 8 punkt 4.
5. **Lagringstid för persondata** — ingen befintlig policy hittad i
   repot (§ 7), och detta pass sätter ingen ny.
6. **Den fullständiga integritetspolicy-texten** som Art 13 kräver —
   juridiskt innehåll, inte kod eller arkitektur, och därmed utanför
   detta pass mandat.
7. **Prod-versionen av Postgres och exakta väggklocks-gränser** för den
   nya jobbtypen — samma obelagda punkt `ADR-129` redan öppet lämnar
   (prod-ref är mekaniskt spärrad för agenter).
8. **Hur ALTCHAs öppen-källkod-server-komponent konkret deployas i Deno/
   Supabase Edge Functions-miljön** — jag har läst produktens
   marknadsföringssida, inte dess integrations-dokumentation för Deno
   specifikt. Ett minimaltest (repots egen standardregel — "testa alltid
   nytt bibliotek med minimalt test innan full implementation") är
   obligatoriskt innan byggarbete, inte gjort i detta research-pass.

---

## Dom

En publik, oautentiserad anmälningsväg är byggbar på Miranon Medias
befintliga grund utan att uppfinna någon ny infrastrukturklass — den
STÖRSTA arkitektoniska vinsten i detta pass är att `ADR-129`s
kvitto-jobbmotor redan löser den svåraste delen av problemet
(driftsäkerhet mot en trög, kvoterad, transaktionslös datakälla) och bara
behöver en ny konsument-gren. Bot-skyddet är löst bäst med de BILLIGASTE,
mest tillgängliga lagren (honeypot + tidsfälla + öppen-källkod-PoW), inte
en tredjeparts-SaaS-widget, given Miranon Medias volym och
Gunilla-tillgänglighetsgolvet. Det enskilt farligaste fyndet är inte i
den NYA koden utan i den BEFINTLIGA `create-registration`-EF:en:
namn-läckan i 409-svaret (§ 1.4) och HTML-injektionsluckan i mailmallmotorn
(§ 1.6) — båda måste stängas oavsett om den publika vägen byggs, och blir
akuta OM den byggs utan att stängas först.

---

## Vad jag inte kunde belägga

- **EUR-Lex-texten direkt** — två fetch-försök mot officiella EUR-Lex-URL:er
  (`eur-lex.europa.eu/eli/reg/2016/679/oj` och `.../legal-content/EN/TXT/
  HTML/?uri=CELEX:32016R0679`) gav tomt innehåll (sidan renderas
  sannolikt klient-sidigt och går inte att hämta som statisk HTML).
  Artikeltexterna i § 7 är därför citerade via `gdpr-info.eu`, en
  välkänd, ofta använd konvenienspegling av den engelska EUR-Lex-texten
  — INTE den primära EUR-Lex-sidan själv. Legal exakthet bör verifieras
  mot EUR-Lex av en människa innan integritetspolicyn skrivs (§ 10 punkt 6).
- **hCaptchas och Friendly Captchas exakta tillgänglighetsmekanismer**
  (finns en "accessibility cookie", ett explicit ljud-alternativ?) —
  dokumentationssidorna jag fetchade gav inte den detaljnivån; endast
  deras EGNA WCAG-hävdanden citeras, inte en oberoende granskning.
- **reCAPTCHAs och Turnstiles exakta prisnivåer 2026** — inte verifierat i
  detta pass, endast att gratis-nivåer existerar för de flesta.
- **Formspree/Basin-klassens faktiska spam-skyddsmekanismer** — 404 vid
  fetch-försök, se § 8 och § 10.
- **Supabase RLS-artikeln för publika INSERT-policyer** lästes via
  sökresultats-SAMMANDRAG, inte en direkt sidfetch — citaten i § 8 punkt 3
  är därför något svagare källbelagda än övriga primärkällecitat i denna
  fil.
- **ALTCHAs konkreta Deno/Supabase Edge Function-integrationsväg** — bara
  produktens marknadsföringssida är läst, inte en teknisk
  integrationsguide för just vår runtime (§ 10 punkt 8).
- **Om nyare Elfsight-kontaktformulärets reCAPTCHA-version (v2/v3)**
  eller dess exakta konfiguration — noterat som en observation ur
  systerpasset, inte djupundersökt här.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut** — den kräver Marcus
grillning (sessionsdok Del 1 punkt 3) innan den blir ett PRD-kort.

1. Bygg den publika vägen som § 9 beskriver: EF → Postgres-inkorg →
   `ADR-129`s jobbmotor → Airtable, ALDRIG synkront.
2. Bot-skydd: honeypot + tidsfälla + ALTCHA öppen källkod som golv,
   Cloudflare Turnstile som dokumenterad eskaleringsväg om incidensdata
   visar behov — aldrig reCAPTCHA.
3. Stäng de två säkerhetsfynden i den BEFINTLIGA koden (§ 1.4 namn-läcka,
   § 1.6 HTML-injektion) som ett FÖRSTA, litet, oberoende steg — de
   skärps av den publika vägen men existerar redan i dag.
4. Skriv integritetspolicyn (Art 13) och lås marknadsförings-opt-in till
   en separat kryssruta INNAN lansering — juridiskt, inte tekniskt,
   arbete.
5. Låt kapacitetsfrågan (§ 5) förbli optimistisk/manuell tills mätt
   incidens säger annat — bygg inte en atomisk lås-reservation "ifall".
6. Lös livscykel-/publiceringsfältet (§ 10 punkt 2) INNAN K8 byggs — det
   är en förutsättning, inte ett parallellt spår.

---

## Källförteckning

### Förstapart — säkerhet och standarder

- [OWASP Denial of Service Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html) — hämtad 2026-09-19
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html) — hämtad 2026-09-19
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — hämtad 2026-09-19
- [OWASP Bot Management and Anti-Automation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html) — hämtad 2026-09-19
- [W3C — Inaccessibility of CAPTCHA](https://www.w3.org/TR/turingtest/) — hämtad 2026-09-19

### Förstapart — leverantörer

- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) — hämtad 2026-09-19
- [hCaptcha Documentation](https://docs.hcaptcha.com/) — hämtad 2026-09-19
- [Google reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3) — hämtad 2026-09-19 (sidan markerad "deprecated" av Google själva)
- [ALTCHA](https://altcha.org/) — hämtad 2026-09-19
- [Friendly Captcha](https://friendlycaptcha.com/) — hämtad 2026-09-19
- [Stripe — Idempotent requests](https://docs.stripe.com/api/idempotent_requests) — hämtad 2026-09-19
- [Supabase — Rate Limiting Edge Functions](https://supabase.com/docs/guides/functions/examples/rate-limiting) — hämtad 2026-09-19
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — hämtad 2026-09-19 (via sökresultat)
- [pretix — Creating an external checkout process](https://docs.pretix.eu/dev/api/guides/custom_checkout.html) — hämtad 2026-09-19

### Förstapart — standardisering

- [draft-ietf-httpapi-idempotency-key-header-07](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-07) — hämtad 2026-09-19

### Förstapart/myndighet — GDPR

- [GDPR Art. 6](https://gdpr-info.eu/art-6-gdpr/), [Art. 9](https://gdpr-info.eu/art-9-gdpr/), [Art. 13](https://gdpr-info.eu/art-13-gdpr/) — konveniensspegling av EUR-Lex-texten, hämtad 2026-09-19 (se § Vad jag inte kunde belägga)
- [IMY — Samtycke som rättslig grund](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/rattslig-grund/samtycke/) — hämtad 2026-09-19
- [IMY — Rätt till information](https://www.imy.se/privatperson/dataskydd/dina-rattigheter/ratt-till-information/) — hämtad 2026-09-19

### Tredjepart

- [noyb — 101 complaints on EU-US transfers filed](https://noyb.eu/en/101-complaints-eu-us-transfers-filed) — via sökresultat, hämtad 2026-09-19

### Interna källor (detta repo)

- [`miranon-se-intagskedjan-idag-2026-09-19.md`](miranon-se-intagskedjan-idag-2026-09-19.md)
- [`luma-studie-monster-for-nya-miranon-se-2026-09-19.md`](luma-studie-monster-for-nya-miranon-se-2026-09-19.md)
- [`asynkront-kvittojobb-byggstenar-2026-08-30.md`](asynkront-kvittojobb-byggstenar-2026-08-30.md)
- [ADR-059](../decisions/ADR-059-idempotens-lagring-defer-fas-e.md)
- [ADR-080](../decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
- [ADR-128](../decisions/ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md)
- [ADR-129](../decisions/ADR-129-jobbmotorn-ko-cron-och-kick.md)
- [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md)
- [`docs/reference/data-model.md`](../reference/data-model.md)
- [`docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md`](../reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md)
- `supabase/functions/_shared/{auth,cors,create-registration,field-allowlists,airtable-retry,errors,belaggning,action-mail-template}.ts`
- `supabase/functions/create-registration/index.ts`, `send-registration-confirmation/index.ts`
- `tasks/sessions/2026-09-19-session-128.md` Del 1
