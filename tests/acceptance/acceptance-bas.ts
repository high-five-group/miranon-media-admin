import { mergeTests } from '@playwright/test';
import { test as fixturvarld } from '../support/fixturvarld/hermetic';
import { test as matbas } from '../support/test-bas';

/**
 * Acceptance-klassens söm (task-59.3, ADR-080 beslut 1).
 *
 * ── VAD KLASSEN BEVISAR ──────────────────────────────────────────────────
 *
 * Att **appen** renderar och beter sig rätt GIVET ETT SVAR AV RÄTT FORM.
 * Ingenting annat. Den bevisar INTE att staging eller Airtable producerar svar
 * av den formen — det är API-svitens uppgift, och den ligger kvar bakom
 * staging-mutexen just därför (ADR-080 beslut 2).
 *
 * Snittet går vid PROTOKOLLET: handlers uttrycks mot Edge Function-gränssnittet
 * och svarar i EF:ens egen form, aldrig mot Airtables. Fogen mellan klasserna
 * är svarsformen, bevakad av att samma zod-scheman parsar fixturens svar som
 * parsar skarpa svar. Ett test som kringgår schemat kringgår hela argumentet
 * för klassen.
 *
 * DEN BEVAKNINGEN ÄR TVÅDELAD, och båda delarna behövs (TASK-63). Runtime-ledet
 * är parsningen ovan: adaptern `.parse()`:ar fixturens svar, så en trasig fixtur
 * ger rött när testet körs. Compile-ledet är att varje fils fixturrader TYPAS
 * `z.infer<typeof XSchema>` — aldrig `Record<string, unknown>`. Utan det andra
 * ledet fångas en fixtur som glider isär från schemat först av kontraktsvakten,
 * som kör NATTLIGT och avsiktligt icke-blockerande (ADR-080 beslut 3); med det
 * fälls glidningen av `npm run typecheck` i samma PR som orsakar den.
 *
 * DE TRE MEKANISMERNA BINDER OLIKA FOGAR — blanda inte ihop dem:
 *   • typningen  binder fixtur → schema      (presubmit, blockerande)
 *   • parsningen binder fixtur → schema      (runtime, vid testkörning)
 *   • vakten     binder schema → verkligheten (nattlig, icke-blockerande)
 * Ingen av dem ersätter någon annan. Skriver du en ny fil i klassen: härled
 * radtypen ur schemat och låt overrides vara `Partial<…>` — då fälls både ett
 * glidet fältnamn och en glidd fälttyp av kompilatorn, med förslag på rätt namn.
 *
 * Klassen testar EXTERNT BETEENDE — aldrig att en handler anropades eller hur
 * många gånger. Det vore att testa fixturen.
 *
 * ── VARFÖR mergeTests OCH INTE EN KOPIA ──────────────────────────────────
 *
 * Sömmen KOMPONERAS ur två befintliga fixturmoduler. Den ärver dem; den
 * kopierar dem inte, och den ärver dem inte via `.extend()` heller — bägge
 * vägarna hade skapat en andra sanning som kan drifta:
 *
 *   1. `tests/support/fixturvarld/hermetic.ts` — fixturvärlden. KLASSDELAD
 *      hemvist sedan task-59.1: den visuella regressionssviten och
 *      acceptance-klassen hänger på SAMMA värld. Två parallella fixturvärldar
 *      vore emot MSW:s uttalade designavsikt ("a single source of truth for
 *      your network across the entire stack") och emot ADR-080:s eget villkor
 *      att en fixtur och ett schema aldrig får divergera.
 *
 *   2. `tests/support/test-bas.ts` — mätinstrumentet (S91 steg 1). Det är
 *      en fullständig no-op utan `PLAYWRIGHT_HERMETIK_RAPPORT=1`. Att det följer
 *      med hit gör att en fil som lämnar e2e-sviten inte lämnar instrumentets
 *      räckvidd: klassningen av varje flyttad fil är HÄRLEDD ur mätdatan
 *      (ADR-080 beslut 2-noten) och ska gå att kontrollera i efterhand.
 *
 *      MEN SIFFRAN BETYDER NÅGOT ANNAT HÄR, och det ska läsas rätt. I
 *      e2e-klassen mockar varje test med page-routes, så instrumentets
 *      catch-all — också en page-route, registrerad sist och därmed prövad
 *      först — ser bara det som slank FÖRBI mockarna: restrafik. I
 *      acceptance-klassen sitter all mockning på CONTEXT-nivå (MSW), alltså
 *      UNDER catch-allen, som därför ser ALLT. Talet är en trafik-räkning, inte
 *      en läckage-räkning. Mätt 2026-07-28 på Hem-ytans två filer: 162 anrop
 *      fördelade på exakt två värdar — fixtur-originet och typsnitts-CDN:en —
 *      båda mockade. Att inget tredje värdnamn finns i listan är det
 *      instrumentet fortfarande bevisar; att inget anrop går ut är vaktens
 *      besked, inte instrumentets.
 *
 *      (Instrumentet flyttade till klassdelad hemvist `tests/support/`,
 *      liksom fixturvärlden i task-59.1, i task-110 — tråd T103. Vid flytten
 *      var 15 importrader berörda (14 e2e-specfiler + denna fil), inte de
 *      ~30 som ursprungligen antogs innan task-59.6 stabiliserade antalet.)
 *
 * `mergeTests` är Playwrights egen mekanism för precis detta, verifierad som
 * exporterad funktion i den installerade versionen (1.61.1) före beslutet.
 *
 * Ordningen mellan fixturerna är BEROENDE-BESTÄMD, inte argument-bestämd:
 * `page` (fixturvärldens, som seedar session/klocka/typsnitt) kräver `network`,
 * och `hermetikRapport` kräver `page`. Kedjan blir därför alltid
 * network → page → hermetikRapport oavsett hur modulerna listas här.
 *
 * ── VAKTEN ÄR AVBRYTANDE HÄR ─────────────────────────────────────────────
 *
 * Ett anrop som ingen handler täcker FÄLLER testet med sin egen URL namngiven
 * och instruktionstext i klartext (`hermetik-vakt.ts`, skärpt i task-57). Det
 * är villkoret för att klassen betyder något: en fil som flyttats hit för
 * tidigt ska bli RÖD, aldrig grön av fel skäl.
 *
 * ── SKRIVA ETT TEST I KLASSEN ────────────────────────────────────────────
 *
 * Normalläget — svaren varje test får utan att säga något — bor i
 * `tests/support/fixturvarld/handlers.ts`. Behöver ETT test ett annat svar
 * skrivs INGEN egen fixturvärld: testet destrukturerar `network` ur
 * testargumenten och överskuggar lokalt med `network.use(...)`. Mönstret,
 * isoleringen (strukturell — inget städsteg krävs) och den TYSTA FÄLLAN (en
 * överskuggning vars mönster inte matchar faller igenom till normalläget utan
 * att något fälls) är dokumenterade i `hermetic.ts` § Överskugga en delad
 * handler. Läs den innan du skriver överskuggningen.
 *
 * Bygg alltid mönstret med `EF(namn)` och svaret med `json(...)` ur
 * `handlers.ts` — då kan överskuggningen per konstruktion inte drifta ifrån
 * det normalläget matchar, och CORS-huvudet kan inte glömmas.
 *
 * TIDEN HÖR TILL KONTRAKTET — och till skillnad från fällorna ovan syns den
 * inte i mönstret. Ett test som väntar på en FELYTA väntar bakom två lager
 * retry, och båda bor UTANFÖR testfilen:
 *
 *   1. `src/data/utils.ts` — `fetchWithRetry`: 4 försök (`maxRetries = 3`) med
 *      backoff `200 · 2^n` ms + jitter ⇒ 1,4–1,7 s per anrop.
 *   2. `src/router.ts` — QueryClient-defaulten `retry: 3` med
 *      `retryDelay = min(200 · 2^n, 2000)` ⇒ 0,2 + 0,4 + 0,8 s ovanpå, och
 *      varje sådant försök kör om HELA lager 1.
 *
 * Räknat ur de konstanterna: ~7–8 s ren backoff innan en retryad felyta finns
 * att assertera på. Playwrights default-timeout för `expect()` är 5 s, och det
 * är DEN som biter — inte test-timeouten på 30 s. En felyte-assertion utan egen
 * timeout hinner därför inte fram, och faller som om appen vore trasig. Ge den
 * en timeout du kan räkna hem mot konstanterna ovan i stället för en rund
 * gissning — och räkna om den här, inte i testfilen, när konstanterna ändras.
 *
 * VILKA fel som betalar den kostnaden är PER VY, inte en regel för klassen:
 * 4xx kortsluter båda lagren (lager 1 returnerar dem direkt; lager 2 stängs av
 * per komponent med ett `retry`-predikat som undantar 4xx), medan 5xx och
 * nätverksfel går hela vägen. Vad som gäller för din vy står i vyns egen
 * `useQuery` — läs den innan du väljer felstatus. Att per-fil-kommentarerna i
 * klassen säger olika saker om 5xx följer av detta; de har rätt var för sig,
 * om sin egen vy, och ingen av dem är en regel för klassen.
 *
 * ── BEVISA ATT EN NY FIL FAKTISKT HÄNGER PÅ FIXTUREN (task-60) ────────────
 *
 * En grön svit visar att appen beter sig rätt GIVET fixturens svar. Den visar
 * inte att svaren bär testet — ett test som aldrig konsumerar ett EF-svar är
 * lika grönt, och bevisar inget om databeteendet. Det andra ledet körs med:
 *
 *     npm run test:acceptance:sjalvtest
 *
 * Regimen tömmer normalläget OCH gör testens egna `network.use()`
 * verkningslösa, så att varje anrop når vakten. Villkoret är att ALLA tester
 * fälls och att `OmockadRequestError` är orsaken i vart och ett — utfallet
 * ensamt räcker inte, eftersom en trasig assertion också gör en svit röd.
 *
 * DETTA ERSÄTTER HANDRUTINEN. Till och med task-59.4 patchades källfiler för
 * hand, kördes, lästes och återställdes ur en scratchpad-kopia; beviset levde
 * bara i rapporttexten. Kör aldrig den rutinen igen — kör skriptet, och lägg
 * dess utfall i skivans PR. Grinden kör steget i varje CI-körning
 * (`ci-suite.yml`, acceptance-jobbet), så en fil som inte hänger på fixturen
 * fälls när den migreras, inte långt senare.
 *
 * Att grinden själv kan fälla bevisas av `npm run
 * test:acceptance:sjalvtest:negativ` — den kör utan regimen och kräver att
 * bedömningen då faller.
 */
export const test = mergeTests(fixturvarld, matbas);

export { expect, type Page } from '@playwright/test';
