# ADR-091: Hosting och deploy — Vercel Pro för frontend-appen

- Status: Accepted (Marcus-kvitterad 2026-08-02 — riktningen i T95-grillningen
  beslut 2, kostnaden i klartext efter R1: "Vercel Pro är inga problem")
- Datum: 2026-08-02
- Fas: 7-framdragning (T95 Grind 0; fas-avvikelsen öppet bokförd i
  `docs/byggplan.md` §4 Fas 7-raden)

> **Om beslutsvägen — bokförd öppet.** Riktningen (Vercel) kvitterades i
> S95-grillningen på befintligt disk-underlag; ADR-mintningen villkorades på
> ett research-pass som skulle verifiera 2026-läget FÖRE lås (web-research-
> disciplinen). Passet ([`t95-r1-hosting-vercel-2026-08-02.md`](../research/t95-r1-hosting-vercel-2026-08-02.md),
> PR #605) **bekräftade plattformsvalet men falsifierade den medföljande
> CSP-planen empiriskt** — och fann en kostnadspremiss (Pro-kravet) som inte
> stod på disk. Marcus kvitterade båda samma dag. En läsare ska kunna se vem
> som vägde, inte bara vad som beslutades.

## Kontext

T95 ("riktig app" + professionell inbjudan för Roger & Lotta) har en hård
grind 0: **det fanns ingen frontend-deploy alls** — ingen hosting-config,
ingen deploy-workflow; appen levde enbart på Marcus dator mot staging. Utan
publik HTTPS-URL finns varken PWA-installation (secure context) eller något
mål för en invite-länk.

Tre dokument antog samtidigt Vercel utan att något beslut var fattat:
`SPA-ARCHITECTURE-DECISION.md` (rad 62–69), `SECURITY-SPEC.md` (rad
120–134, `_headers`-fil + Edge Middleware för CSP-nonce) och
`BYGGPLAN-LÄTTLÄST-v3.md` (rad 444, uttalat mot Roger/Lotta). Ett
oformaliserat antagande som tre ytor bygger på är exakt den koherens-risk
ADR-baren finns för: valet binder CSP-mekanik, DNS-schema och
CORS-konfiguration.

**R1-researchens tre bärande fynd** (fullt underlag med källor i
research-filen):

1. **Vercel står som val** mot färsk förstapartsdokumentation — men
   **Hobby-planen förbjuder uttryckligen kommersiell användning**, så
   Pro-plan (~20 USD/mån) är ett krav för Miranon-appen, inte ett val.
2. **CSP-nonce-mönstret i SECURITY-SPEC är falsifierat empiriskt** (mätt mot
   riktig Chromium med äkta CSP-headers): byggverktygets nonce bakas vid
   build medan Edge-mekanismen roterar nonce per request utan att skriva om
   HTML-kroppen → garanterad mismatch → blank sida i produktion. Dessutom är
   `_headers`-filen fel plattforms syntax (Netlify/Cloudflare — den finns
   inte i Vercels konfigurationsreferens). Googles egen vägledning
   (web.dev/strict-csp) föreskriver hash-baserad CSP eller `'self'` för en
   statisk SPA utan SSR.
3. Branschprecedent (verifierad via repo-API, inte hörsägen): jämförbara
   öppna Vite-SPA:er skeppar på exakt denna plattformsklass; `admin.*`-
   subdomänmönstret är etablerat.

## Beslut

1. **Frontend-appen hostas på Vercel, Pro-plan**, kopplad till repot med
   Vite-preset, SPA-rewrites för klient-routing och produktionsbygge.
2. **Appens origin är `admin.miranon.dev`** (domänschemat: S95 Del 2
   beslut 3; DNS och övriga panel-moment är Grind 0-paketet i T46-kartan).
3. **HTTP-säkerhetsheaders levereras via Vercels konfigurationsfil** — inte
   via `_headers`-fil (fel plattform) och inte via Edge Middleware för
   nonce (falsifierat mönster).
4. **Fas 7:s CSP-arbete ärver hash-/`'self'`-formen.** SECURITY-SPEC:s
   hosting-/CSP-avsnitt (rad 120–134) är härmed superseded och rättas mot
   denna ADR + R1 i samband med Grind 0-exekveringen eller Fas 7:s
   CSP-skiva — öppen rivning, inte tyst.

## Alternativ som förkastades

- **Cloudflare Pages** — tekniskt likvärdig för en statisk Vite-SPA och
  billigare (generös gratisnivå). Förkastad av koherens- och
  helhetsskäl: tre specs och Roger/Lotta-kommunikationen är redan skrivna
  mot Vercel, PR-preview-flödet ingår i plattformen, och Marcus kvitterade
  Pro-kostnaden uttryckligen. Omprövningsvägen är öppen om Vercels villkor
  eller prissättning ändras väsentligt — flytten är realistisk just för att
  appen är en ren statisk SPA utan plattformsspecifik serverkod.
- **Nonce-CSP via Edge Middleware** (SECURITY-SPEC:s ursprungsplan) —
  förkastad på empiriskt bevis, se Kontext punkt 2.

## Konsekvenser

- Löpande kostnad ~20 USD/mån (Marcus-kvitterad). Ingen kodsignering eller
  app-distribution — desktop-upplevelsen bärs av PWA:n (R2 + S95 beslut 9).
- `CORS_ALLOWED_ORIGINS` måste utökas med nya origin i staging + prod —
  annars deployad men datalös app (deny-by-default). Moment 3 i Grind
  0-paketet.
- Registrerat R1-sidofynd för Fas 7 (ADR-053-triage: värdefullt, ej
  blockerande): åtta komponentfiler använder inline-styles som ingen strikt
  CSP tillåter utan undantag — de saneras eller undantas medvetet när
  CSP-skivan byggs; listan står i R1-dokumentet.
- ADR-bar-prövningen: svår att återställa (CSP-form, DNS-schema, tre specs
  och Grind 0-paketet bygger ovanpå) · överraskande utan kontext (tre
  dokument antog valet utan beslut; nonce-planen såg beslutad ut men var
  obeprövad) · verklig avvägning (Cloudflare Pages var ett genuint,
  billigare alternativ). Alla tre villkor håller.

## Relaterat

- [R1-researchen](../research/t95-r1-hosting-vercel-2026-08-02.md) —
  underlaget, med samtliga källor och det empiriska CSP-testet.
- Sessionsdok S95 Del 2 (grillad samsyn, beslut 1–3) + Del 3.
- T46-kartan § Grind 0-paketet (operativ exekveringslista).
- [ADR-047](ADR-047-pwa-arkitektur-fas-5.md) (PWA-grunden som deployen gör
  publikt installerbar).

## Updates

### 2026-08-03 (S96) — `miranon.se` är kundens publika sajt, inte en konkurrent till domänvalet

Frågan uppstod i `TASK-127.2`:s konvergensfas: en prototyp-platshållare bar
`lotta@miranon.se`, vilket såg ut att motsäga detta besluts `miranon.dev`.

Marcus, verbatim: *"Allt går på miranon.dev just nu. Miranon.se är deras
publika sajt och denna app kanske hamnar på den domänen i framtiden, inget att
tänka på nu."*

**Ingen ändring av beslutet.** De två domänerna har olika roll och lever
parallellt: `miranon.dev` bär appen (`admin.miranon.dev`) och den sändande
subdomänen (`send.miranon.dev`, `ADR-092`/`TASK-127.4`), medan `miranon.se`
är Miranon Medias publika webbplats — utanför detta repos scope.

Att auth-mail går FRÅN `send.miranon.dev` TILL adresser på en annan domän är
normalfallet, inte en inkonsekvens. DMARC-, SPF- och DKIM-arbetet i Grind
0-paketet gäller därför `miranon.dev` och ska inte utvidgas till `.se`.

**Noterat som möjlig framtida flytt, ej beslutad:** appen kan komma att bo på
`miranon.se`. Det vore en omdirigerings- och DNS-fråga som rör
`additional_redirect_urls`, `CORS_ALLOWED_ORIGINS` och den sändande
subdomänen — men den är uttryckligen inte i scope nu, och ingen förberedelse
byggs för den (över-engineering-vakten). Raden finns för att nästa läsare som
stöter på `miranon.se` ska slippa dra slutsatsen att domänvalet är fel.
