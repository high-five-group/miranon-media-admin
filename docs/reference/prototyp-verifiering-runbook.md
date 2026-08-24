# Prototyp-verifiering i browser — runbook

> Syfte: verifiera ett **prototyp-pass** (prototype-skillens divergens/konvergens)
> i riktig browser utan att återupptäcka miljöfakta varje gång. Fakta här är
> disk-verifierade 2026-07-25 (S88) mot `playwright.config.ts`, prototypytornas
> DEV-gejt och `tests/e2e/auth.setup.ts`.
>
> Bakgrund: T89 fynd F2 noterade att sex engångsskript ackumulerats under S83
> och att samma miljöfakta återupptäcktes i varje pass. **Verktygs-halvan av
> det fyndet är öppet avstyrkt** (se § Varför inget skript) — det som saknades
> var det här dokumentet, inte kod.
>
> Syskondokument: [`staging-verifiering-runbook.md`](staging-verifiering-runbook.md)
> (samma genre, annan yta — staging-bygge i stället för prototyp-pass).

## Portkartan

| Port | Ägare / syfte | Får en agent starta den? |
|---|---|---|
| **5173** | E2E + Marcus levande dev-server | **NEJ** — se nedan |
| 5199 | a11y-sviten (`A11Y_DEV_PORT`) | ja, sviten äger den |
| 5299 | visuell regression (`VISUAL_DEV_PORT`) | ja, sviten äger den |
| 4173 | `preview:staging` (`PREVIEW_PORT`) | ja |

## 5173-vägran är DESIGN, inte en bugg

`playwright.config.ts` sätter `reuseExistingServer: false` **plus**
`--strictPort` på `E2E_DEV_PORT = 5173`. En upptagen 5173 ger därför ett hårt
fel i stället för tyst port-byte. Det är task-5:s avsikt: stale server-state
gav tidigare falsk-grönt.

**Varför just 5173 och inte en dedikerad prototyp-port:** stagings
`CORS_ALLOWED_ORIGINS` allowlistar exakt `localhost:5173` (och 4173). En
dedikerad port blir CORS-blockerad och kan inte hämta data — vilket ser ut som
en trasig vy, inte som ett konfigurationsfel.

Slutsats: **starta aldrig en egen server på 5173.** Den är Marcus.

## Den bärande kringgången

Ett prototyp-pass behöver koppla upp mot den levande 5173 **utan** att döda den
och utan att trigga vägran ovan. Lösningen är att gå förbi Playwrights
test-runner helt:

```js
import { chromium } from '@playwright/test';
```

Ett plain node-skript som anropar `chromium.launch()` läser **aldrig**
`playwright.config.ts`. Alltså gäller varken `webServer`-blocket,
`reuseExistingServer: false` eller `--strictPort`. Skriptet blir en ren
browser-klient mot en server någon annan äger.

Detta är den enskilt viktigaste faktan i dokumentet och stod tidigare ingenstans.

## Bootstrap — klistra in, anpassa påståendet

```js
#!/usr/bin/env node
// [DEBUG-<id>] Städas efter passet.
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = process.env.OUT_DIR ?? '.';

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: 'playwright/.auth/user.json',
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

const fel = [];
page.on('pageerror', (e) => fel.push(e.message));

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

// ---- PÅSTÅENDET: det unika för passet skrivs här ----

// FULLPAGE ÄR MEDVETET BORTA — se § Bildtagningens två fällor nedan.
// Väx viewporten till det som ska fångas i stället.
await page.screenshot({ path: `${OUT}/resultat.png`, animations: 'disabled' });
console.log(fel.length ? fel.join('\n') : 'Inga sidfel.');
await browser.close();
```

## Bildtagningens två fällor — båda mätta 2026-08-24 (S108, skiva 9)

Mallen ovan bar `fullPage: true` fram till dess. Den formen producerade tre
defekta bilder i skiva 9:s facit-pass innan de fångades av manuell granskning.
Fällorna är oberoende av varandra och har olika motmedel.

### 1 · `fullPage: true` ljuger om varje viewport-fäst element

`fullPage` renderar sidan i sin fulla höjd — men element med `position: fixed`
mäts fortfarande mot den URSPRUNGLIGA viewporten. Mätt utfall i skiva 9:s pass:

- Bottennavigeringen (`AppShell/TabBar.tsx`, `fixed inset-x-4 bottom-4`)
  ockluderade blocket *"Sista betalningsdag"*.
- Dialogens overlay (`primitives/Modal.tsx`, `fixed inset-0`) dimmade bara
  **omkring två tredjedelar** av ytan — `inset-0` täcker exakt EN vyporthöjd,
  och sidan var cirka 1,5 vyporthöjder hög.

**Motmedlet är att växa viewporten**, inte att fånga hela sidan:

```js
await page.setViewportSize({ width: 1440, height: 1600 });
```

Det gäller varje bild som ska bli referens, och även engångsdiagnostik — en
diagnos som tittar på en ockluderad yta ställer fel fråga.

### 2 · Animationer måste stängas av, annars fryser du ett övergångstillstånd

Playwrights default är `animations: 'allow'`. Mobil-dialogerna i skiva 9:s pass
fångades **mitt i sin in-animation** och blev halvgenomskinliga i bilden. Ett
facit som bär ett övergångstillstånd fryser något som aldrig är det stabila
läget — och varje framtida jämförelse mot det facit blir ojämförbar av skäl som
inte har med den prövade ändringen att göra.

`animations: 'disabled'` står därför i mallen ovan. Ta inte bort det.

> Fällorna är skördade som lärdomar i `tasks/lessons.d/`
> (`en-fullpage-bild-ljuger-om-varje-viewport-fast-element.md` respektive
> `ett-facit-taget-med-animationer-pa-fryser-ett-overgangstillstand.md`).

## Auth-state

`storageState` läses från `playwright/.auth/user.json` (cookies + localStorage
med Supabase-sessionen), producerad av `tests/e2e/auth.setup.ts`.

Är den utgången: kör e2e-setupen, eller logga in i skriptet mot `.env.test`
(fyll `#login-email` / `#login-password`, invänta `/hem`, spara
`context.storageState()`).

## När det INTE är 5173:s kod som ska verifieras — en egen ports CORS-vägg

Bootstrappen ovan förutsätter att koden som ska synas ÄR den som redan körs
på 5173. Det håller inte när ett pass sitter i en EGEN worktree (annan
filsystems-sökväg) och 5173 tillhör huvudträdet på en ANNAN cwd — att koppla
upp mot 5173 hade då visat FEL kod (S93 review-fix-våg 2, 2026-08-02).

En egen dev-server på en ANNAN port är i sig ofarlig (`vite --port <N>
--strictPort`, plain node-skript, rör aldrig 5173) — men § Portkartans skäl
gäller fortfarande: `CORS_ALLOWED_ORIGINS` allowlistar exakt 5173/4173, så
ALLA `get-event`/`get-registrations`-fetchar från den nya porten blockeras
(`ERR_FAILED`, "blocked by CORS policy" — mätt, inte antaget). En prototyp-
sida som beror på riktig backend-data (Beläggning/Gruppdynamik i skarpt läge,
t.ex.) blir därför tom/trasig, oavsett att appen i övrigt fungerar.

**Kringgången:** `page.route()` fångar de två läsvägarna INNAN webbläsarens
CORS-kontroll appliceras på svaret, och fyller dem med data hämtad
SERVER-SIDAN (Node, i Playwright-skriptets egen process) — Node har ingen
CORS-policy, den är en browser-specifik regel. Svaret är därför RIKTIG
staging-data, inte en syntetisk mock:

```js
const { status, body } = await (async () => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: anonKey },
  });
  return { status: res.status, body: await res.text() };
})();
await page.route('https://<project>.supabase.co/functions/v1/get-event**', async (route) => {
  await route.fulfill({ status, contentType: 'application/json', body });
});
```

`accessToken` läses ur samma `playwright/.auth/user.json` som Auth-state-
avsnittet ovan (`origins[].localStorage[]`, nyckeln `sb-<ref>-auth-token`,
fältet `access_token` i dess JSON-värde) — ingen extra inloggning behövs.
`anonKey` är `VITE_SUPABASE_ANON_KEY` ur `.env.development` (publik, säker att
läsa in i ett skript per samma fils egen kommentar).

Intercepta ENDAST läsvägarna (`get-event`/`get-registrations`/
`get-event-notes`) — mutations-endpoints ska INTE mockas: lämnas de orörda
syns en missad skrivväg i proto-läget fortfarande som ett riktigt (om än
CORS-blockerat) nätverksanrop, vilket är precis den signalen ett
interceptions-pass (0 mutations-anrop) behöver.

## Prototypytorna är DEV-gejtade

- `src/routes/dev/prototyper.tsx` returnerar tidigt om `!import.meta.env.DEV`.
- `src/components/dev/PrototypeSwitcher.tsx` bär samma gejt (ADR-044-mekaniken).

**Konsekvens som kostat tid förut:** ett produktionsbygge (`vite preview`) har
`import.meta.env.DEV === false`. Där finns `/dev/prototyper` inte, och
`?variant=`-formen på en riktig route är död. **En preview-baserad mätloop kan
därför aldrig bära ett prototyp-pass** — den hör till testsvit-sidan
(tråd `T92` punkt a), som har motsatt krav: isolation *från* 5173, inte
anslutning *till* den. Ett dokument, två recept.

## Städkontraktet

Skript märks `[DEBUG-<id>]` och raderas när passet är klart.

**Efterlevnaden har brustit:** sex `[DEBUG-S83]`-skript ligger kvar på
`proto/s83-18-18-19-eventvaljaren` och `…-iter` trots headern "Städas efter
passet". Proto-branchar mergas aldrig, så de når aldrig `main` — men de är inte
städade heller. Kontrollera egna branch-tippar vid passets slut.

## Varför inget skript

T89 F2 föreslog ett incheckat parametriserat `scripts/proto-verify.mjs`.
**Avstyrkt, öppet bokfört** (S88):

- Den gemensamma kärnan är ~16 rader bootstrap — ovan. Allt annat är
  *påståendet*, och det var olika i alla sex skripten: element-scopad
  screenshot, hover + computed style, URL-assertion efter combobox-val,
  print-media-emulering, loop över demo-anmälningar.
- Ett parametriserat skript hade behövt återexponera Playwrights API som
  CLI-flaggor.
- **Alla sex konsumenter är redan raderade** per throwaway-kontraktet. Repots
  över-engineering-vakt är uttrycklig: ingen abstraktion utan faktisk nuvarande
  användare.
- Ett `scripts/`-skript är permanent kod under Biome och typecheck — som skulle
  betjäna efemära konsumenter.

**Uppgraderings-trigger:** om ett framtida pass faktiskt återanvänder
bootstrappen oförändrad, är formen en ~20-raders modul `withProtoPage(fn)` —
aldrig en flagg-CLI. Byggs först när den återanvändningen inträffat, inte
i förväg.
