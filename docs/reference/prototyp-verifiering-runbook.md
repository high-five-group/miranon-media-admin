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

await page.screenshot({ path: `${OUT}/resultat.png`, fullPage: true });
console.log(fel.length ? fel.join('\n') : 'Inga sidfel.');
await browser.close();
```

## Auth-state

`storageState` läses från `playwright/.auth/user.json` (cookies + localStorage
med Supabase-sessionen), producerad av `tests/e2e/auth.setup.ts`.

Är den utgången: kör e2e-setupen, eller logga in i skriptet mot `.env.test`
(fyll `#login-email` / `#login-password`, invänta `/hem`, spara
`context.storageState()`).

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
