import type { LucideIcon } from 'lucide-react';
import { Check, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Button as AriaButton, Checkbox } from 'react-aria-components';
import { Button, Input, MessageBox, Select, SelectItem } from '@/components/primitives';
import { useSattAvtalatPris } from '@/data/mutations/avtalatPris';
import { useRegistreraInbetalning } from '@/data/mutations/inbetalningar';
import { VALBARA_BETALSATT } from '@/domain/schemas';
import { beloppsFel, normaliseraBeloppKlient, visaKronor } from './belopp-inmatning';
import type { Betalsatt } from './betalsatt-minne';
import { type Beloppsutfall, beloppsutfall, type InkorgsRad } from './inkorg-harledningar';

/**
 * UTFALLET ÄR EN BOX, INTE EN VIKTVÄXLANDE TEXTRAD (Marcus dom 2026-09-01):
 * *"typsnittet behöver ju inte växla i vikt, endast färg … boxa in texten och
 * så är det själva boxen som blir grön, gul eller röd, med ikon framför,
 * bock, info, och varning"*.
 *
 * Utfallets EGNA `ton` (härledd i `beloppsutfall`, se dess docblock) mappas
 * därför till husets `MessageBox`-intent i stället för till en font-vikt.
 * `tacker` → grön bock, `over` → gul varning, `delvis`/`okant` → info.
 * TEXTEN ÄR OFÖRÄNDRAD — bara bäraren är ny, och vikten är nu konstant över
 * alla fyra lägen.
 *
 * IKONEN LIGGER I `children`, INTE I PRIMITIVEN. Mätt 2026-09-01:
 * `MessageBox` bär INGEN ikon (den bär `border-l-4` i intent-färg plus tonad
 * bakgrund, S109-facit varv 4). Formen är LÅST av ADR-103 B2 steg 1, så
 * ikonen får inte adderas till primitiven i ett iterationspass — den bor i
 * konsumentens innehåll, där den inte kan läcka in i de andra ~30
 * konsumenterna.
 *
 * `Record` (inte `switch`) så TypeScript fäller om `Beloppsutfall['ton']`
 * någonsin får ett femte läge — en glömd branch här ska vara ett byggfel.
 */
const UTFALL_FORM: Record<
  Beloppsutfall['ton'],
  { intent: 'success' | 'warning' | 'info'; Ikon: LucideIcon }
> = {
  tacker: { intent: 'success', Ikon: CircleCheck },
  over: { intent: 'warning', Ikon: TriangleAlert },
  delvis: { intent: 'info', Ikon: Info },
  okant: { intent: 'info', Ikon: Info },
};

/**
 * Fördröjningen innan utfallet byts (Marcus: *"kanske 1 sekunds fördröjning"*).
 *
 * VARFÖR DEN INTE BARA ÄR KOSMETIK: utfallsregionen är en `aria-live`-yta.
 * Utan fördröjning annonserades den vid VARJE tangenttryck — "2 kr
 * registreras", "25 kr registreras", "250 kr registreras" — vilket är precis
 * den skräpannonsering WAI-ARIA APG varnar för i sitt live-region-avsnitt.
 * Fördröjningen gör alltså två saker med en ratt: boxen slutar blinka, och
 * skärmläsaren får ETT besked per belopp i stället för ett per siffra.
 */
const UTFALL_FORDROJNING_MS = 1000;

/**
 * PRISETS EGEN FELREGEL — som beloppets, men NOLL ÄR GILTIGT.
 *
 * MÄTT FYND (2026-09-01, när priset fick sin egen Spara-knapp): fältet
 * validerades med `beloppsFel`, som avvisar noll med "Beloppet kan inte vara
 * noll." Det är rätt för en INBETALNING — en betalning på 0 kr är ingen
 * betalning. Det är fel för ett PRIS: `betalningsharledning.ts` § `valjPris`
 * behandlar uttryckligen `avtalatPris: 0` som ett VINNANDE värde ("ett
 * avtalat pris med sanningsvärde — och `avtalatPris: 0` VINNER över eventets
 * pris"), alltså en gratisplats, och regeln har en egen negativ kontroll i
 * `tests/api/betalningsharledning.test.ts` (den trasiga varianten `avtalatPris
 * || eventPris` ger 2500 där den riktiga ger 0).
 *
 * Ytan blockerade alltså ett värde servern är byggd för att ta emot. Felet var
 * latent så länge priset buntades med registreringen (`kanSpara` bar
 * `prisFel === null`, så en gratisplats stoppade hela registreringen tyst);
 * med en egen Spara-knapp hade det i stället blivit ett rött fältfel bredvid
 * en fungerande knapp. Regeln bor här, inte i `beloppsFel`: den delade
 * funktionen är korrekt för sitt eget bruk och har flera andra konsumenter.
 */
function prisFelText(ratext: string): string | null {
  if (ratext.trim() === '') return null;
  return normaliseraBeloppKlient(ratext) === null
    ? 'Skriv priset med siffror, till exempel 2 500 eller 2 500,00.'
    : null;
}

export type RegistreringsUtfall = {
  inbetalningId: string;
  namn: string;
  belopp: number;
  /** Lottas kryss: ska ett kvitto gå för den här inbetalningen? */
  medKvitto: boolean;
  /** True när ⌘/Ctrl+Enter eller "Registrera och skicka" användes. */
  skickaNu: boolean;
  /** Kvitteringstexten raden ska visa. */
  kvittens: string;
};

/**
 * [TASK-402.2 AC #3] De ifyllda fältens RÅVÄRDEN i `redigera`-läget — INGEN
 * server har validerat dem ännu (den skarpa registreringen sker senare, i
 * bulk, se `lage`s eget docblock). Skiljer sig från `RegistreringsUtfall`
 * på just den punkten: det finns inget `inbetalningId` eftersom ingenting
 * registrerats.
 */
export type RedigeringsVarden = {
  belopp: string;
  betalsatt: Betalsatt;
  datum: string;
  notering: string;
  medKvitto: boolean;
};

type PropsGemensamt = {
  rad: InkorgsRad;
  idag: string;
  betalsatt: Betalsatt;
  onBetalsatt: (b: Betalsatt) => void;
  onAvbryt: () => void;
  /**
   * Hårlinjen mot innehållet ovanför. Default PÅ — den bär avgränsningen i de
   * konsumenter där formuläret fälls ut under något annat utan egen ram
   * (`RegistreraYta`: Åtgärds-panelen, anmälans detaljvy, personkortet).
   *
   * INKORGEN SLÅR AV DEN (Marcus dom 2026-09-01): där ligger formuläret inne i
   * ett grönt markerat kort tillsammans med sin person-header, och kortets ram
   * ÄR grupperingen. En linje mitt i kortet hade delat den enhet ramen precis
   * satt ihop — *"Inga fält som ser frikopplade ut under en separatorlinje"*.
   */
  visaAvdelare?: boolean;
  /**
   * [TASK-411, RUNDA 2 — granskningsfynd, Marcus 2026-09-06: "Ja, begränsa
   * till inkorgen."] Success-notisens botten. Default `'standard'` ⇒
   * `MessageBox`-primitivens EGEN `--mm-messagebox-success-bg` (grön, samma
   * hex som `--mm-success-bg`) — OFÖRÄNDRAT för de tre andra ytorna som
   * delar detta formulär via `RegistreraYta` (`AnmalansBetalningar.tsx`,
   * `PanelBetalningar.tsx`, `PersonBetalningar.tsx`): där ligger notisen
   * INTE i ett grönt markerat kort, och en vit botten hade tystat signalen
   * helt utan skäl.
   *
   * `'vit'` ger notisen en egen `--mm-surface`-botten i stället — bara
   * INKORGEN sätter detta (`BetalningsInkorg.tsx`s öppna, gröna kort), där
   * den 2026-09-01-kollisionen (grön notis mot grön platta) annars
   * återkommer sedan TASK-411 gav kortet hela `--mm-success-bg` tillbaka.
   *
   * RUNDA 1 satte den vita botten OVILLKORAT för alla fyra ytor — ett
   * granskningsfynd (runda 2) mätte att de tre andra ytorna oavsiktligt
   * tappade sin gröna success-ton. Bocken/ikonens gröna färg (se `Ikon`
   * nedan) rörs INTE av denna prop: den var ett rent BUGGFEL (ärvde
   * kroppens neutrala textfärg oavsett yta) och gäller därför överallt,
   * inte bara inkorgen.
   */
  notisBakgrund?: 'vit' | 'standard';
};

/**
 * [TASK-402.2 AC #3] Formulärets LÄGE, som en DISKRIMINERAD UNION i stället
 * för två oberoende optionella props — TypeScript kan då tvinga fram rätt
 * callback vid call site i stället för att lita på en runtime-vakt i
 * `spara()`.
 *
 * `'registrera'` (default, `lage` utelämnad) är inkorgens EGNA väg, HELT
 * OFÖRÄNDRAD: submit anropar den skarpa registrerings-mutationen
 * (`useRegistreraInbetalning`) och knapparna är "Registrera" / "Registrera
 * och skicka" / "Avbryt"; `onKlar` är obligatorisk.
 *
 * `'redigera'` är DET DELADE LÄGET bekräftelsestegets radformulär
 * återanvänder (TASK-402.3, facit `tasks/sessions/bilagor/
 * s121-bekraftelsesteget-konvergens/facit.json` § `RadFormular` — se även
 * DEV-konsumenten `/dev/registrera-form-redigera`): samma fält i samma
 * ordning, samma utfallsruta, samma fördröjning och autofokus — men INGET
 * serveranrop görs här. Knapparna blir "Klar"/"Avbryt"; "Registrera och
 * skicka" försvinner (facit har ingen tredje knapp i radformuläret —
 * bulkstegets EGNA "Registrera och skicka N kvitton" äger den handlingen).
 * `onRedigeringKlar` är obligatorisk, `onKlar` otillgänglig.
 *
 * "Avbryt" behöver ingen egen återställningslogik i NÅGOTDERA läget:
 * konsumenten monterar formuläret villkorat (`{oppen && <RegistreraForm
 * …/>}`, samma mönster `BetalningsradKort`/`RegistreraYta` redan bär), så en
 * stängning avmonterar all lokal fältstate — nästa öppning startar om från
 * `rad`/anroparens värden, alltså redan en fullständig återställning.
 */
type Props =
  | (PropsGemensamt & {
      lage?: 'registrera';
      onKlar: (utfall: RegistreringsUtfall) => void;
      onRedigeringKlar?: never;
    })
  | (PropsGemensamt & {
      lage: 'redigera';
      onKlar?: never;
      /** Anropas när Lotta trycker Klar (submit eller Enter i beloppsfältet). */
      onRedigeringKlar: (varden: RedigeringsVarden) => void;
      /**
       * [TASK-402.3] RADENS NUVARANDE VÄRDEN, när konsumenten redan har egna.
       *
       * BAKÅTKOMPATIBELT TILLÄGG: utelämnad beter sig formuläret EXAKT som
       * före (belopp = `forifyllt`, datum = `idag`, kvitto i, tom notering),
       * så `registrera`-läget och DEV-konsumenten `/dev/registrera-form-
       * redigera` är orörda.
       *
       * VARFÖR DEN BEHÖVS: bekräftelsesteget bär ett FÖRVAL PER RAD
       * (`forslagsbelopp` — avgiften för den som inte betalat något, resten
       * för den som betalat den), medan `forifyllt` alltid är HELA resten
       * (`rad.kvar`). För Erik Holm i facit-fixturen skiljer de sig: kortet
       * visar 1 000 kr (avgiften) och `forifyllt` hade gett 2 500 kr (hela
       * priset). Utan denna prop hade ett tryck på beloppet ändrat radens
       * belopp bara genom att öppna formuläret — och "Avbryt återställer
       * radens värden" (AC #7) hade varit omöjligt att uppfylla.
       */
      startvarden?: RedigeringsVarden;
    });

/**
 * [TASK-346.6 AC #3, PRD § Inkorgen och formuläret] Registreringsformuläret,
 * PÅ PLATS I RADEN.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TVÅ HANDLINGAR, INTE SEX
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 6, ordagrant: "Som Lotta vill jag att betalsättet är förvalt
 * till det jag använde senast och datumet till i dag, så att en registrering
 * är tre handlingar." De tre VAR: öppna raden, tryck på ett belopp, tryck
 * Enter. Sedan Marcus rev beloppschipsen (2026-09-01, se `forifyllt` nedan)
 * är de TVÅ: öppna raden, tryck Enter — beloppsfältet bär redan resten-talet
 * som chipset tryckte in. PRD:ns löfte är alltså inte sänkt utan överträffat;
 * raden står här i sin ursprungliga ordalydelse för att skillnaden ska synas.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * BELOPPET SKICKAS SOM RÅ STRÄNG
 * ═══════════════════════════════════════════════════════════════════════════
 * `RegistreraInbetalningInput.belopp` är en STRÄNG med avsikt: normaliseringen
 * sker server-side, där den kan bevisas hermetiskt (se schemats docblock).
 * Klientens `normaliseraBeloppKlient` används ENBART för att visa vad beloppet
 * kommer att täcka och för att ge ett felmeddelande vid fältet. Fältets råtext
 * är det som skickas, alltid.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTERINGSFÄLTET — BYGGT SOM HEL KEDJA (2026-09-01, ersätter "saknas"-noten)
 * ═══════════════════════════════════════════════════════════════════════════
 * Marcus dom, ordagrant och ställd två gånger: *"det är HÄR lotta noterar
 * något, inte på pricka av-blocket"*. Fältet finns nu, och det skriver till
 * en EGEN kolumn på inbetalningen — hela vägen:
 *
 *   `notering` (detta fält) → `RegistreraInbetalningInput.notering`
 *   (`Betalningar.schema.ts`) → porten spreadar inputen
 *   (`betalningsportar.ts`) → `registrera-inbetalning` normaliserar via
 *   `lasNotering` (`_shared/inbetalning-notering.ts`) → `inbetalningar.notering`
 *   (migration `20260901111500_inbetalning_notering.sql`) → läses tillbaka i
 *   `INBETALNING_KOLUMNER` och visas på raden i `InbetalningsLista`.
 *
 * DEN TIDIGARE NOTEN HÄR SADE ATT FÄLTET INTE KUNDE BYGGAS. Den var korrekt
 * när den skrevs — kedjan saknades — men skälet var att kedjan INTE FANNS, inte
 * att den var fel att bygga. Den byggdes i stället för att flyttas, och de tre
 * mätta fynden som stoppade FLYTTEN står kvar som skäl till varför:
 *
 *  1. Panelens noteringsfält (`events/atgarder/AtgardsSida.tsx` § `SkrivRad`)
 *     skriver till ANMÄLANS Airtable-fält `Notering anmälningsavgift` /
 *     `Notering slutbetalning`, via `update-registration-payment-note`. Det rör
 *     aldrig inbetalningsdomänen — de två noteringarna är alltså OLIKA SAKER
 *     och lever vidare sida vid sida, inte som en dubblett.
 *  2. De fälten är FACK-BUNDNA (avgift/slutbetalning) medan detta formulär
 *     bokför ett FRITT belopp utan fack. Vilket fack en notering här skulle
 *     hamna i var ett öppet designbeslut — den frågan försvinner helt när
 *     anteckningen bor på inbetalningen.
 *  3. Anteckningen hör till BOKFÖRINGSPOSTEN. Samma verifikationskrav som
 *     ögonblicksbilden bär (ADR-128 beslut 1): posten ska kunna läsas ensam,
 *     år efter att anmälan ändrats. En notering på anmälan dör med anmälan.
 *
 * ⚠️ FÖNSTRET FÖRE DEPLOYEN, ÖPPET BOKFÖRT. Migration + EF-deploy är en
 * SERIELL handling som ägs av orkestreraren och INTE ingår i denna commit.
 * Tills båda landat i miljön gäller: fältet syns och går att skriva i, texten
 * skickas med i payloaden, och den gamla Edge Function-versionen IGNORERAR
 * den okända nyckeln — inbetalningen registreras alltså korrekt, men
 * anteckningen sparas inte. Ingenting kraschar (`InbetalningSchema.notering`
 * bär `.default(null)` just för detta svar), och `spara` nedan säger det i
 * KLARTEXT i kvittensen i stället för att kvittera tyst — se `noteringsnot`.
 * Efter deployen är den grenen död kod som aldrig träffas.
 */
export function RegistreraForm(props: Props) {
  /* [TASK-402.2] `lage`/`onKlar`/`onRedigeringKlar` LÄSES FRÅN `props`
     DIREKT i `spara()` nedan, INTE ur destrukturerade lokala kopior — det är
     det enda sättet TypeScript behåller den diskriminerade unionens
     korrelation (property access på SAMMA objekt narrowar, en destrukturerad
     kopia gör det inte). `lage` destruktureras ändå HÄR MED ETT DEFAULT-VÄRDE
     för JSX-jämförelser (`lage === 'redigera'`), där bara STRÄNGEN jämförs —
     ingen callback-typ är i spel där. */
  const {
    rad,
    idag,
    betalsatt,
    onBetalsatt,
    onAvbryt,
    visaAvdelare = true,
    notisBakgrund = 'standard',
  } = props;
  const lage = props.lage ?? 'registrera';
  /* ═══════════════════════════════════════════════════════════════════════
   * INGA SNABBVAL — FÄLTET ÄR FÖRIFYLLT MED RESTEN (Marcus dom 2026-09-01)
   * ═══════════════════════════════════════════════════════════════════════
   * Ordagrant: *"Vi behöver inte ha några 'snabb-val' som '1500 - resten'
   * eller 'annat…'"*. Beloppschipsen (`harledBeloppsknappar`) är därför rivna
   * ur formuläret.
   *
   * DE TRE HANDLINGARNA BLIR TVÅ. PRD berättelse 6 räknade "öppna raden,
   * tryck på ett belopp, tryck Enter". Chipset var handling nummer två — och
   * i det vanligaste fallet av alla tryckte det in exakt det tal fältet nu
   * redan bär. Kvar är: öppna raden, tryck Enter.
   *
   * FÖRIFYLLNADEN ÄR RESTEN, aldrig avgiften: `rad.kvar` är vad som återstår
   * av HELA priset enligt Postgres (`harledRad`), alltså det chipset kallade
   * "allt"/"resten". Avgifts-chipset hade ingen motsvarighet här — delbetalar
   * Lotta skriver hon talet, precis som hon skrev det i "annat belopp".
   *
   * TOMT FÄLT NÄR PRISET ÄR OKÄNT (`rad.kvar === null`) eller redan täckt
   * (`<= 0`). Att förifylla ett belopp ur ett okänt pris vore att hitta på ett
   * tal — samma regel `harledBeloppsknappar` bar när den härledde noll chips.
   *
   * FÖRSLAGET ÄR ORKESTRERARENS, inte Marcus egna ord — han bad om att chipsen
   * skulle bort, inte uttryckligen om en förifyllnad. Bokfört som eget
   * designval så att det kan rivas utan att chipsen behöver tillbaka.
   */
  /* [TASK-402.3] `startvarden` VINNER när konsumenten har egna värden — se
     propens eget docblock. `props.lage === 'redigera'` narrowar unionen på
     SAMMA objekt (samma skäl som `spara()` gör det), så åtkomsten är typad
     utan cast. */
  const startvarden = props.lage === 'redigera' ? props.startvarden : undefined;
  const forifyllt =
    startvarden?.belopp ?? (rad.kvar !== null && rad.kvar > 0 ? visaKronor(rad.kvar) : '');
  const [belopp, setBelopp] = useState(forifyllt);
  const [datum, setDatum] = useState(startvarden?.datum ?? idag);
  const [medKvitto, setMedKvitto] = useState(startvarden?.medKvitto ?? true);
  const [rort, setRort] = useState(false);
  /** Lottas fria anteckning om DENNA inbetalning. Se filhuvudet § NOTERINGSFÄLTET. */
  const [notering, setNotering] = useState(startvarden?.notering ?? '');

  /* ═══════════════════════════════════════════════════════════════════════
   * AVTALAT PRIS — DEN ANDRA SANNINGEN OM ETT RESTBELOPP (Marcus JA 2026-09-01)
   * ═══════════════════════════════════════════════════════════════════════
   * Scenariot: Lotta och deltagaren har kommit överens om ett LÄGRE pris.
   * Registreringen lämnar då ett restbelopp som inte är en skuld — "500 kr
   * kvar att betala" är helt enkelt fel bild tills det avtalade priset satts.
   * Ytan öppnas därför just i det läget (`ton === 'delvis'`), som en diskret
   * andra rad i utfallsboxen.
   *
   * MÄTT FÖRE BYGGET: det finns INGEN befintlig redigeringsyta att länka
   * till. `avtalatPris` hade noll UI-konsumenter i hela `src/` — fältet sattes
   * i dag direkt i Airtable (`Avtalat pris (kr)`, `fldZHwxOXOQqkFx33`, vanligt
   * talfält). Anmälningsdetaljen visar inget pris alls, så en länk dit hade
   * lovat en kontroll som inte finns.
   *
   * ═══════════════════════════════════════════════════════════════════════
   * PRISET HAR EN EGEN SPARA-KNAPP OCH EN EGEN SKRIVVÄG (Marcus 2026-09-01)
   * ═══════════════════════════════════════════════════════════════════════
   * Ordagrant: *"det finns ingen 'spara-knapp' ju?"*, *"'Behåll det gamla
   * priset' kan ersättas av en Avbrytknapp"*, *"texten 'Sätts på anmälan
   * när...' kan tas bort"*.
   *
   * VAD SOM REVS: priset BUNTADES tidigare med registreringen —
   * `RegistreraInbetalningInput.avtalatPris` skickades med i samma request och
   * sattes först när Lotta tryckte "Registrera". Buntningen är BORTA ur denna
   * yta (fältet finns kvar i schemat och i EF:en, orört — se nedan), och
   * priset skrivs i stället av `useSattAvtalatPris` direkt när hon trycker
   * Spara.
   *
   * VARFÖR BUNTNINGEN INTE FÅR STÅ KVAR "FÖR SÄKERHETS SKULL": två skrivvägar
   * till samma fält i samma flöde är inte redundans utan förvirring. Skrivningen
   * är visserligen idempotent (samma värde två gånger ger samma fält), men
   * felbilden är det inte: den bundna vägen har en EGEN felsemantik
   * (`spegel.skrivet === false` ⇒ priset BORTA, se den rivna spegelnoten
   * nedan) som skulle kunna larma om ett pris som redan sparats korrekt av
   * Spara-knappen. En väg, en sanning.
   *
   * DEN BOKFÖRDA GRÄNSEN "det finns ingen EF som sätter enbart priset" ÄR
   * FALSIFIERAD och riven. Den stämde för de dedikerade betalnings-EF:erna,
   * men missade den generiska `update-record`-ytan: operationen
   * `write-registration-payment-mirror` bär `'Avtalat pris (kr)'` i sin
   * allowlist mot `Anmälningar`, och allowlisten gatar FÄLT, inte kombination.
   * Hela mätningen — inklusive den OVERIFIERADE utrullningsfrågan — bor i
   * `src/data/mutations/avtalatPris.ts` filhuvud.
   *
   * KVAR SOM KÄND GRÄNS: värdet bor inte i Postgres (kolumnen `avtalat_pris`
   * finns inte), utan bara i Airtable. Går skrivningen fel är priset inte satt
   * — och det syns nu direkt vid knappen (`role="alert"`) i stället för i en
   * kvittens efter registreringen.
   */
  const [visaPris, setVisaPris] = useState(false);
  const [avtalatPris, setAvtalatPris] = useState('');
  /**
   * Priset som FAKTISKT sparats i denna session, i kronor.
   *
   * BÄR FÖRDRÖJNINGEN MELLAN SKRIVNING OCH REFETCH. `useSattAvtalatPris`
   * invaliderar `betalningar.all`, men Airtable-skrivningen plus refetchen tar
   * tid; utan detta hade utfallsboxen och "kvar att betala" hoppat tillbaka
   * till det GAMLA priset i det fönstret — direkt efter en kvittens som sagt
   * att priset sparats. Värdet blir överflödigt så fort refetchen landat (det
   * är då samma som `rad.betalning.gallandePris`) och kostar inget att låta
   * stå kvar tills formuläret avmonteras.
   */
  const [sparatPris, setSparatPris] = useState<number | null>(null);
  /** Kvittensen efter en lyckad prissparning. Läses av en `role="status"`. */
  const [prisKvittens, setPrisKvittens] = useState<string | null>(null);

  /** Vad UTFALLSBOXEN visar — `belopp`/`avtalatPris` fördröjda, se `UTFALL_FORDROJNING_MS`. */
  const [visat, setVisat] = useState({ belopp: forifyllt, pris: '' });
  const beloppRef = useRef<HTMLInputElement>(null);
  const prisRef = useRef<HTMLInputElement>(null);
  const prisKnappRef = useRef<HTMLButtonElement>(null);
  const felId = useId();
  /** Kopplar Spara-knappen till sin osparat-beskrivning (sr-only). */
  const osparatId = useId();

  const registrera = useRegistreraInbetalning();
  /* PRISETS EGEN SKRIVVÄG — skild från registreringen sedan 2026-09-01. Se
     komponentens docblock § PRISET HAR EN EGEN SPARA-KNAPP, och hookens eget
     filhuvud för allowlist-mätningen och den öppna utrullningsfrågan. */
  const sattPris = useSattAvtalatPris();

  /* ═══════════════════════════════════════════════════════════════════════
   * FOKUS IN VID ÖPPNING — BELOPPSFÄLTET, MED TEXTEN MARKERAD
   * ═══════════════════════════════════════════════════════════════════════
   * Granskningsfynd runda 1: formuläret ersätter trigger-knappen i DOM:en, så
   * utan detta faller fokus till `document.body` när raden öppnas.
   *
   * MÅLET ÄR NU ALLTID FÄLTET. Tidigare gick fokus till första belopps-chipet
   * med motiveringen att chipsen stod FÖRE fältet i DOM och annars hade legat
   * bakom användaren i tab-ordningen. Chipsen finns inte längre, så det skälet
   * är borta med dem — och fältet var redan den fallback som fanns i varje
   * läge.
   *
   * `select()` GÖR ÖVERSKRIVNINGEN TILL EN HANDLING: förifyllnaden är ett
   * FÖRSLAG, inte ett facit. Med texten markerad ersätter första siffran hela
   * talet — Lotta behöver aldrig radera först. Är förslaget rätt trycker hon
   * bara Enter.
   *
   * Effekten körs EN gång, vid montering: formuläret monteras när raden öppnas
   * och avmonteras när den stängs, så "vid montering" och "vid öppning" är
   * samma ögonblick.
   */
  useEffect(() => {
    const falt = beloppRef.current;
    if (!falt) return;
    falt.focus();
    falt.select();
  }, []);

  /* FÖRDRÖJNINGEN, ETT `setTimeout` PER TANGENTTRYCK — och det är avsikten:
     effekten städar sitt eget timeout i cleanup, så en ny tangenttryckning
     nollställer klockan i stället för att köa ännu ett byte. Utfallet byts
     alltså EN sekund efter att Lotta slutat skriva, inte en sekund efter att
     hon börjat. Vaktsatsen gör att monteringen med förifyllt värde inte kostar
     ett timeout alls — boxen står rätt direkt.

     BÅDA FÄLTEN DELAR KLOCKA. Avtalat pris räknar om SAMMA box som beloppet
     (se `radForUtfall` nedan), så två oberoende fördröjningar hade kunnat visa
     ett mellanläge där det ena talet hunnit fram och det andra inte. */
  useEffect(() => {
    if (visat.belopp === belopp && visat.pris === avtalatPris) return;
    const id = window.setTimeout(
      () => setVisat({ belopp, pris: avtalatPris }),
      UTFALL_FORDROJNING_MS,
    );
    return () => window.clearTimeout(id);
  }, [belopp, avtalatPris, visat]);

  /** Hoppar över fördröjningen. Marcus: *"vid Enter/blur visas utfallet direkt"*. */
  function visaUtfallNu() {
    setVisat({ belopp, pris: avtalatPris });
  }

  const talet = normaliseraBeloppKlient(belopp);
  // FELET ÄR LIVE, UTFALLET ÄR FÖRDRÖJT — två olika frågor, två olika takter.
  // "abc" ska säga ifrån vid fältet medan hon skriver (felvägen är oförändrad);
  // "vad täcker beloppet" är ett besked som bara är intressant när talet är
  // färdigskrivet.
  const fel = rort ? beloppsFel(belopp) : null;
  const prisFel = visaPris ? prisFelText(avtalatPris) : null;
  /** Priset Spara-knappen skulle skriva — `null` när fältet är tomt/ogiltigt. */
  const prisAttSpara =
    visaPris && avtalatPris.trim() !== '' ? normaliseraBeloppKlient(avtalatPris) : null;
  const kanSparaPris = prisAttSpara !== null && prisAttSpara >= 0 && !sattPris.isPending;

  /* BOXEN RÄKNAR MOT DET AVTALADE PRISET SÅ FORT DET ÄR SKRIVET — annars hade
     Lotta satt priset till 1 000, registrerat 1 000, och ändå fått läsa
     "500 kr kvar att betala" av den ruta som finns för att berätta vad hon
     just gjort. Överskrivningen är LOKAL.

     TVÅ KÄLLOR, I DEN ORDNINGEN (sedan Spara-knappen finns): det SPARADE
     priset vinner, och det som just skrivs i fältet gäller annars. Ordningen
     spelar roll först i sekunderna efter en sparning — då är fältet tömt och
     ytan stängd, men refetchen har ännu inte landat, och utan `sparatPris`
     hade boxen fallit tillbaka till det gamla priset direkt efter kvittensen
     "Avtalat pris sparat". */
  const visatPrisTalet = visaPris ? normaliseraBeloppKlient(visat.pris) : null;
  const gallandeOverdrag =
    sparatPris ?? (visatPrisTalet !== null && visatPrisTalet >= 0 ? visatPrisTalet : null);
  const radForUtfall =
    gallandeOverdrag !== null
      ? { ...rad, betalning: { ...rad.betalning, gallandePris: gallandeOverdrag } }
      : rad;

  const visatTalet = normaliseraBeloppKlient(visat.belopp);
  const utfall =
    visatTalet !== null && visatTalet !== 0 ? beloppsutfall(radForUtfall, visatTalet) : null;
  /* PRISFÄLTET GATAR INTE LÄNGRE REGISTRERINGEN. `prisFel === null` stod här
     medan priset BUNTADES med registreringen — då var en ogiltig prissträng
     ett fel i den payload som skulle skickas, och att stoppa submit var rätt.
     Sedan priset har en egen skrivväg är de två operationerna oberoende, och
     en halvskriven prissträng har inget med en inbetalning att göra. Sista
     resten av buntningen, riven med den. */
  const kanSpara = talet !== null && talet !== 0 && !registrera.isPending;

  /**
   * Har Lotta skrivit ett pris hon INTE tryckt Spara på?
   *
   * DEN ENDA VERKLIGA FÄLLAN FRIKOPPLINGEN SKAPAR, och därför bokförd och
   * hanterad i stället för bortresonerad: under buntningen sparades ett
   * skrivet pris automatiskt när hon tryckte Registrera. Nu gör det inte det,
   * och utan en signal hade värdet försvunnit tyst i exakt det ögonblick hon
   * trodde att allt gick igenom.
   *
   * SIGNALEN BLOCKERAR INGENTING — den påstår inte att hon gjort fel, för det
   * har hon inte: att öppna prisytan och sedan låta bli att spara är ett
   * giltigt val. Den säger bara vad läget är. Att i stället spärra Registrera
   * hade byggt tillbaka en koppling mellan de två operationerna, alltså
   * buntningen igen fast som en grind.
   */
  const osparatPris = visaPris && prisAttSpara !== null && prisAttSpara !== sparatPris;

  /** Ytan öppnas där den betyder något: en registrering som lämnar en rest. */
  const erbjudPris = utfall?.ton === 'delvis' || visaPris;

  function oppnaPris() {
    setVisaPris(true);
    // Fokus följer med in i fältet som just monterades — annars står markören
    // kvar på en knapp som försvann ur DOM (samma felklass som radens
    // `skaAterfaFokus` bär). `requestAnimationFrame` för att fältet ska finnas.
    requestAnimationFrame(() => prisRef.current?.focus());
  }

  /**
   * AVBRYT — stänger prisdelen utan ändring (Marcus: *"'Behåll det gamla
   * priset' kan ersättas av en Avbrytknapp"*).
   *
   * `sparatPris` NOLLSTÄLLS INTE HÄR, och det är avsiktligt: har Lotta redan
   * tryckt Spara ÄR priset skrivet till anmälan, och ett Avbryt efteråt
   * stänger fältet — det ångrar ingen skrivning. Att nolla överdraget hade
   * fått boxen att visa det gamla priset igen fast basen bär det nya.
   */
  function stangPris() {
    setVisaPris(false);
    setAvtalatPris('');
    setVisat({ belopp, pris: '' });
    sattPris.reset();
    requestAnimationFrame(() => prisKnappRef.current?.focus());
  }

  /**
   * SPARA — skriver priset till anmälan DIREKT, utan att bokföra en betalning.
   *
   * FOKUS EFTER LYCKAD SPARNING är trigger-länken, samma mål och samma
   * `requestAnimationFrame`-form som `stangPris` använder: fältet och
   * Spara-knappen avmonteras när ytan stängs, så utan en explicit flytt
   * faller fokus till `document.body`. Kvittensen renderas i en
   * `role="status"` så skärmläsaren hör utfallet utan att fokus rycks dit.
   *
   * VID FEL STÄNGS INGENTING. Fältet, värdet och knappen står kvar så att
   * Lotta kan försöka igen; felet visas i en `role="alert"` intill knappen.
   * Att stänga ytan vid fel hade gömt både orsaken och det hon skrev.
   */
  function sparaPris() {
    if (prisAttSpara === null || !kanSparaPris) return;
    sattPris.mutate(
      { anmalanRecordId: rad.betalning.anmalanRecordId, avtalatPris: prisAttSpara },
      {
        onSuccess: () => {
          setSparatPris(prisAttSpara);
          setPrisKvittens(`Avtalat pris sparat: ${visaKronor(prisAttSpara)} kr.`);
          setVisaPris(false);
          setAvtalatPris('');
          setVisat({ belopp, pris: '' });
          requestAnimationFrame(() => prisKnappRef.current?.focus());
        },
      },
    );
  }

  async function spara(skickaNu: boolean) {
    if (!kanSpara || talet === null) return;

    /* [TASK-402.2 AC #3] `redigera`-LÄGET GÖR INGET SERVERANROP. Klar lämnar
       bara de ifyllda RÅVÄRDENA till anroparen — den skarpa registreringen
       sker senare, i bulk, via inkorgens BEFINTLIGA registreringsväg (samma
       `useRegistreraInbetalning`, ett anrop per rad — PRD § "Körningen är
       ett steg"). `skickaNu` är meningslös här (ingen "Registrera och
       skicka"-knapp finns i detta läge, se `lage`s docblock) och ignoreras
       med avsikt. */
    if (props.lage === 'redigera') {
      props.onRedigeringKlar({ belopp, betalsatt, datum, notering, medKvitto });
      return;
    }

    /* TOM NOTERING SKICKAS INTE ALLS. Servern gör visserligen `''` → NULL
       (`lasNotering`), men en utelämnad nyckel gör payloaden IDENTISK med den
       före fältet fanns — vilket är exakt vad "bakåtkompatibelt" ska betyda,
       och vad som gör en jämförelse mot en äldre logg meningsfull. */
    const noteringAttSkicka = notering.trim() !== '' ? notering : null;
    const resultat = await registrera.mutateAsync({
      anmalanRecordId: rad.betalning.anmalanRecordId,
      belopp,
      betalsatt,
      betalningsdatum: datum,
      /* INGET `avtalatPris` HÄR LÄNGRE (Marcus 2026-09-01) — priset har en
         egen Spara-knapp och en egen skrivväg. Se komponentens docblock
         § PRISET HAR EN EGEN SPARA-KNAPP för varför buntningen inte får stå
         kvar parallellt. Fältet finns kvar i `RegistreraInbetalningInput` och
         i EF:en, orört: det är UI:ts bruk som rivits, inte kontraktet. */
      ...(noteringAttSkicka !== null ? { notering: noteringAttSkicka } : {}),
      // [TASK-367 review runda 1, FYND 2] `medKvitto` SKICKADES TIDIGARE
      // ALDRIG TILL SERVERN — den levde bara i `props.onKlar({..., medKvitto,
      // ...})` nedan, alltså i UI-svaret, aldrig i själva skrivningen.
      // Servern persisterar den nu (`kvitto_avbojt = !medKvitto`) så att den
      // durabla "kvitto att skicka"-härledningen kan skilja "väntar på att
      // köas" från "Lotta ville medvetet inte ha ett kvitto".
      medKvitto,
    });

    // KVITTENSEN LÄSER SERVERNS SVAR, ALDRIG FÄLTET. Servern normaliserar
    // beloppet och räknar om härledningen; att kvittera med det Lotta skrev
    // hade kunnat säga en annan sak än det som faktiskt sparades.
    const sparat = resultat.inbetalning.belopp;
    const saknasEfter = resultat.harledning.saknas;
    const kvittens =
      saknasEfter === null
        ? `${visaKronor(sparat)} kr registrerat.`
        : saknasEfter > 0
          ? // Löpande text ⇒ beloppet först (Marcus 2026-09-01, delad
            // domänterm "kvar att betala" över alla betalningsytor).
            `${visaKronor(sparat)} kr registrerat. ${visaKronor(saknasEfter)} kr kvar att betala.`
          : `${visaKronor(sparat)} kr registrerat. Allt betalt.`;

    /* SPEGELNOTEN ÄR NU ENKEL IGEN. Här stod en tvågrenad text som varnade
       för att det AVTALADE PRISET var borta när spegelskrivningen fallerat —
       den grenen hörde till buntningen och är riven med den. Priset skrivs
       sedan 2026-09-01 av `useSattAvtalatPris` i ett EGET anrop med sitt eget
       felläge vid Spara-knappen, så denna kvittens kan inte längre säga
       något sant om priset och ska därför inte säga något alls om det. */
    const spegelnot = resultat.spegel.skrivet ? '' : ' Basen har inte hunnit uppdateras än.';

    /* NOTERINGEN KVITTERAS BARA NÄR DEN FALLERAT — och den grenen är död kod
       efter deployen. Skrev Lotta en anteckning men svaret bär `null` tillbaka,
       då kör miljön en Edge Function-version UTAN noteringsstöd (se filhuvudet
       § FÖNSTRET FÖRE DEPLOYEN): den ignorerar den okända nyckeln tyst, och
       utan denna rad hade texten försvunnit "utan ett ord" — precis den
       låtsas-kontroll som var skälet att fältet inte byggdes tidigare.

       VILLKORET ÄR EXAKT, inte en gissning: `resultat.inbetalning.notering` är
       serverns EGET svar om den sparade raden. Har den sparats kommer texten
       tillbaka; kommer `null` tillbaka trots att vi skickade något, sparades
       den inte. Ingen versionssniffning, ingen flagga att städa. */
    const noteringsnot =
      noteringAttSkicka !== null && resultat.inbetalning.notering === null
        ? ' Noteringen sparades INTE. Den delen är inte utrullad än.'
        : '';

    props.onKlar({
      inbetalningId: resultat.inbetalning.id,
      namn: rad.namn,
      belopp: sparat,
      medKvitto,
      skickaNu,
      kvittens: `${kvittens}${spegelnot}${noteringsnot}`,
    });
  }

  function vidSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    visaUtfallNu();
    void spara(false);
  }

  // ⌘/Ctrl+Enter = registrera OCH skicka (AC #3, PRD berättelse 9). Fångas på
  // formuläret och inte per fält: genvägen ska fungera var markören än står.
  // [TASK-402.2] I `redigera`-läget FINNS INGEN "och skicka"-knapp (se
  // `lage`s docblock) — `spara(true)` grenar till `onRedigeringKlar` precis
  // som `spara(false)` gör, så genvägen blir en ofarlig synonym till Klar i
  // stället för att stängas av helt.
  //
  // ESC = AVBRYT, samma väg ut som knappen (granskningsfynd runda 1). Ett
  // formulär som öppnas på plats och tar fokus MÅSTE gå att lämna med
  // tangentbordet utan att leta upp en knapp - `Deltagare.tsx` § "alla vägar
  // ut" räknar upp Esc vid sidan av Avbryt av precis det skälet. Fokus-returen
  // till trigger-knappen sköts av `BetalningsradKort`, som äger knappen.
  //
  // `stopPropagation` därför att Esc är en delad genväg: utan den hade
  // tangenttryckningen fortsatt uppåt och kunnat stänga en omgivande yta
  // samtidigt som formuläret stängs.
  function vidTangent(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      visaUtfallNu();
      void spara(true);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onAvbryt();
    }
  }

  return (
    <form
      onSubmit={vidSubmit}
      onKeyDown={vidTangent}
      aria-label={`Registrera betalning för ${rad.namn}`}
      /* ETT RUTNÄT, INTE TRE VÄNSTERKANTER (Marcus dom 2026-09-01).
         Formuläret bar `px-3` OCH `bg-surface`, alltså en vit panel vars
         innehåll började 12 px in i raden — medan radens avatar började på
         0 och namn/metadata på 48 px (avatarens `size-9` + `gap-3`). Tre
         linjer i samma kort. Den horisontella paddingen och den vita
         panelen är därför borta: formuläret delar nu radens EGEN
         vänsterkant, och `border-t` ensam bär avgränsningen mot raden
         ovanför. Fälten är fortfarande vita (`--mm-input-bg` =
         `--mm-surface`), så kontrasten mot den tonade botten är oförändrad.

         GÄLLER BÅDA KONSUMENTERNA: formuläret monteras både av inkorgens
         `BetalningsradKort` och av `RegistreraYta` (Åtgärds-panelen,
         anmälans detaljvy, personkortet). Utan horisontell padding ärver
         det förälderns kant i båda fallen — vilket är precis vad "ett
         rutnät" betyder. */
      /* UTAN AVDELARE BÄR KORTET BOTTENPADDINGEN (pass 11). Med avdelare är
         `py-3` oförändrat — den vägen ligger i `RegistreraYta`s konsumenter och
         får inte röras. Utan avdelare bor formuläret i inkorgens markerade
         kort, vars egen `p-3` redan ger 12 px under; `pt-3` ensam undviker
         dubbel botten. */
      className={`flex flex-col gap-3 ${visaAvdelare ? 'border-border border-t py-3' : 'pt-3'}`}
    >
      <Input
        ref={beloppRef}
        label="Belopp i kronor"
        value={belopp}
        onChange={(v) => {
          setBelopp(v);
          setRort(true);
        }}
        // Lämnar hon fältet är talet färdigskrivet — då ska beskedet stå där,
        // inte komma en sekund senare när blicken redan flyttat.
        onBlur={visaUtfallNu}
        // `decimal` och inte `numeric`: iPad ska ge decimaltecken, eftersom
        // banken visar "2 500,00" och det är precis den formen Lotta klistrar
        // in (PRD berättelse 4, AC #6 iPad-kravet).
        inputMode="decimal"
        autoComplete="off"
        placeholder="2 500,00"
        isInvalid={fel !== null}
        errorMessage={fel ?? undefined}
        aria-describedby={utfall ? felId : undefined}
      />

      {/* ═══ UTFALLET: EN ALLTID-MONTERAD LIVE-REGION + EN SYNLIG BOX ═══
          Vad beloppet täcker (AC #5), i två separata bärare — och separationen
          är hela poängen.

          LIVE-REGIONEN (`sr-only`) är ALLTID monterad, med `role="status"` som
          ALDRIG byter värde. Roselli-anatomin (se `primitives/FilterRad.tsx`)
          kräver att regionen finns i DOM innan texten stoppas in — en region
          som monteras samtidigt som sin text annonseras inte. Boxen nedan är
          däremot VILLKORAD (den ska inte stå tom och grön innan Lotta skrivit
          något), och `MessageBox` byter dessutom `role` mellan `status` och
          `alert` med sin intent. Båda egenskaperna är oförenliga med en
          tillförlitlig live-region, så annonseringen görs inte av boxen.

          `aria-hidden` SITTER PÅ TEXTEN, INTE PÅ BOXEN — och den skillnaden är
          inte kosmetisk. Texten döljs för AT därför att den redan sägs av
          regionen ovan (utan det hade samma besked annonserats två gånger),
          men boxen SJÄLV måste förbli exponerad: den bär sedan A5 en
          interaktiv kontroll, och ett fokuserbart element inne i en
          `aria-hidden`-yta är en `serious`-överträdelse (axe
          `aria-hidden-focus`) — kontrollen hade gått att tabba till men inte
          gått att läsa.

          `sr-only` är `position: absolute` och alltså inget flex-item, så den
          alltid-monterade regionen kostar noll höjd i formulärets rytm (den
          tomma-hålet-fällan från pass 6 kan inte återuppstå).

          ANNONSERINGEN SKER EFTER FÖRDRÖJNINGEN, aldrig per tangenttryck: båda
          bärarna läser `utfall`, som är härlett ur det FÖRDRÖJDA `visat`.

          LUFTEN kommer ur formulärets egen `gap-3` — boxen är ett eget
          flex-syskon (inte inklämd i ett `gap-1`-block med fältet), plus
          `MessageBox` egen `px-4 py-3`. */}
      <p id={felId} role="status" aria-live="polite" className="sr-only">
        {utfall?.text ?? ''}
      </p>
      {utfall &&
        (() => {
          const { intent, Ikon } = UTFALL_FORM[utfall.ton];
          // TASK-411 (Marcus prod-fynd 2026-09-06): bara SUCCESS-utfallet
          // får den gröna ikonen (universellt buggfel-fix, se `Ikon` nedan)
          // och — RUNDA 2, "begränsa till inkorgen" — den vita botten ENDAST
          // när `notisBakgrund` är satt till `'vit'`. warning/info-boxarna
          // är ORÖRDA i båda fallen — Marcus bad uttryckligen bara om
          // success-notisen, och `over`/`delvis`/`okant` sitter aldrig
          // inuti ett grönmarkerat kort.
          const arSuccess = intent === 'success';
          const vitBotten = arSuccess && notisBakgrund === 'vit';
          return (
            <MessageBox
              intent={intent}
              /* ═══ EN RIKTIG BOX, INTE EN KANTLINJE-DEKORATION (pass 11) ═══
                 Marcus, om skärmavbilden 10:22: utfallet blev *"en tunn
                 vänsterkant + ikon"*, medan beställningen var *"boxa in texten
                 och så är det själva boxen som blir grön, gul eller röd"*.

                 `MessageBox` bär `rounded border-l-4` — 4 px accentkant till
                 VÄNSTER, och ingenting runt om (S109-facit varv 4, där Marcus
                 uttryckligen FÖRKASTADE en heltäckande kontur för primitiven).
                 `border-y border-r` sluter därför rutan HÄR, hos konsumenten:
                 1 px topp/höger/botten i den intent-färg varianten redan satt
                 som `border-color`. Ingen ny färg, ingen ny token, ingen
                 hårdkodning — bara tre kantbredder.

                 VARFÖR INTE I PRIMITIVEN: formen är LÅST av ADR-103 B2 och har
                 ~30 konsumenter. Att ändra den globalt vore att riva ett
                 stämplat Marcus-beslut åt alla ytor i ett iterationspass. Att
                 S113-Marcus nu vill ha en sluten box och S109-Marcus valde bort
                 den är en äkta spänning värd hans dom — flaggad i rapporten. Så
                 länge den är öppen bor avvikelsen på den ENDA yta han pekade
                 på.

                 FÄRGKROCKEN (fynd 2) ÄR TILLBAKA I INKORGEN, LÖST PÅ ANNAT
                 HÅLL [TASK-411, Marcus prod-fynd 2026-09-06]: rutan ligger
                 inuti ett grönt markerat kort DÄR, och sedan TASK-411 bär
                 det kortet ÅTER hela `--mm-success-bg` (se `components.css`
                 § "Markerat betalningskort" BESLUT 2). Utan motåtgärd vore
                 rutan återigen osynlig mot kortet — precis
                 2026-09-01-kollisionen. Marcus dom denna gång: *"Vi testar
                 med att success-notisen får vit bakgrund då, men konturen
                 behåller vi … och bocken sätter vi samma gröna färg på som
                 konturen."*

                 [RUNDA 2, GRANSKNINGSFYND — Marcus: "Ja, begränsa till
                 inkorgen."] Runda 1 satte `bg-(--mm-surface)` OVILLKORAT för
                 `success`, vilket läckte in i de tre ANDRA ytorna som delar
                 detta formulär via `RegistreraYta`
                 (`AnmalansBetalningar.tsx`, `PanelBetalningar.tsx`,
                 `PersonBetalningar.tsx`) — där notisen INTE ligger i ett
                 grönt kort, och den vita botten tystade dess gröna
                 success-signal helt utan skäl. `vitBotten` (ovan,
                 `arSuccess && notisBakgrund === 'vit'`) gör den vita botten
                 VILLKORAD på en explicit prop som ENDAST `BetalningsInkorg.
                 tsx`s öppna kort sätter — se `notisBakgrund`s docblock
                 (`PropsGemensamt`) för hela resonemanget. De tre andra
                 ytorna skickar inte propen och behåller därmed
                 `MessageBox`-primitivens EGNA gröna `success`-botten,
                 oförändrat sedan innan TASK-411.

                 KANTEN ÄR OFÖRÄNDRAD I BÅDA LÄGENA (fortsatt intent-färgens
                 `border-color` från primitiven, kompletterad av `border-y
                 border-r` här). Ingen ny token, ingen global ändring —
                 MessageBox-primitiven och dess ~30 andra konsumenter är
                 orörda (ADR-103 B2 fortsatt låst). */
              className={vitBotten ? 'border-y border-r bg-(--mm-surface)' : 'border-y border-r'}
            >
              <span aria-hidden="true" className="flex items-start gap-2">
                {/* Bocken får samma gröna som konturen (Marcus, samma dom):
                    `--mm-messagebox-success-text` ÄR `var(--mm-success)`,
                    identisk med kantens `--mm-messagebox-success-border`.
                    Utan detta ärver ikonen boxens neutrala kroppstext-färg
                    (`--mm-messagebox-body-text`) — mätt: den var INTE grön
                    förut, trots att bakgrunden var det. */}
                <Ikon
                  size={18}
                  className={
                    arSuccess
                      ? 'text-(color:--mm-messagebox-success-text) mt-0.5 shrink-0'
                      : 'mt-0.5 shrink-0'
                  }
                />
                <span>{utfall.text}</span>
              </span>

              {/* AVTALAT PRIS — DISKRET ANDRA RAD, ALDRIG EN ANDRA KNAPP.
                  Marcus: *"en sekundär rad/länk"*, och orkestreraren skärpte
                  det: ingen knappvikt som konkurrerar med Registrera. Formen är
                  därför husets diskreta länkform (`text-small underline`, samma
                  som `PersonBetalningar.tsx` och radens "registrera ändå") — en
                  `AriaButton` och inte en `Link`, eftersom den öppnar ett fält
                  på plats i stället för att navigera. Färgen ärvs ur boxens egen
                  brödtext, så ingen hårdkodad ton och ingen egen token behövs. */}
              {erbjudPris &&
                (visaPris ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {/* HJÄLPTEXTEN ÄR RIVEN (Marcus: *"texten 'Sätts på
                        anmälan när...' kan tas bort"*). Den löd "Sätts på
                        anmälan när betalningen registreras." och beskrev
                        BUNTNINGEN — en mekanik som inte finns längre. En
                        hjälptext som förklarar en riven mekanik är värre än
                        ingen: den lär ut fel modell. Vad knappen gör säger
                        knappen själv. */}
                    <Input
                      ref={prisRef}
                      label="Avtalat pris i kronor"
                      value={avtalatPris}
                      onChange={setAvtalatPris}
                      onBlur={visaUtfallNu}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={
                        rad.betalning.gallandePris !== null
                          ? visaKronor(rad.betalning.gallandePris)
                          : '2 500,00'
                      }
                      size="sm"
                      isInvalid={prisFel !== null}
                      errorMessage={prisFel ?? undefined}
                    />

                    {/* VIKTERNA ÄR VALDA SÅ ATT PRISET ALDRIG KONKURRERAR MED
                        REGISTRERA. Formulärets primära handling är submit-
                        knappen "Registrera" i full storlek; en andra primär i
                        boxen hade gjort ytan tvåhövdad — exakt det fel Marcus
                        rev i "EN PRIMÄR, INTE TVÅ" längre ned samma dag.

VIKT UPP, INTE STORLEK UPP (Marcus 2026-09-01: *"Borde inte
                        spara knappen synas lite mer?"*). Knappen bar
                        `secondary/outline` och lästes som ett alternativ
                        snarare än som handlingen. Den är nu husets PRIMÄRA
                        form — fylld, mörk — men i `size="sm"`, alltså exakt
                        samma familj som formulärets "Registrera" i mindre
                        format. Det är storleken, inte vikten, som håller isär
                        de två: en liten fylld knapp inuti en ruta kan inte
                        förväxlas med formulärets fullstora submit.
                        Avbryt förblir `ghost`. */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        isDisabled={!kanSparaPris}
                        isLoading={sattPris.isPending}
                        onPress={sparaPris}
                        aria-describedby={
                          osparatPris && !sattPris.isPending ? osparatId : undefined
                        }
                      >
                        Spara
                      </Button>
                      <Button intent="ghost" size="sm" onPress={stangPris}>
                        Avbryt
                      </Button>
                      {/* OSPARAT-SIGNALEN ÄR KVAR — MEN BARA FÖR SKÄRMLÄSARE
                          (Marcus: *"'Priset är inte sparat än' kan vi ta bort"*).

                          VAD SOM REVS ÄR DET SYNLIGA, inte semantiken. Texten
                          stod som en synlig `text-caption`-rad bredvid
                          knapparna och var visuellt brus i en ruta som redan
                          bär en tydlig Spara-knapp.

                          DEN BLIR STARKARE AV FLYTTEN, inte svagare: som
                          lös synlig text var den inte kopplad till någonting
                          alls i tillgänglighetsträdet — en skärmläsaranvändare
                          som tabbade till Spara hörde bara "Spara". Nu är den
                          knappens `aria-describedby`, så samma användare hör
                          "Spara — Priset är inte sparat än." precis när det
                          betyder något. Ingen live-region revs: noden var
                          aldrig en (`role="status"` sitter på KVITTENSEN, som
                          är orörd). */}
                      {osparatPris && !sattPris.isPending && (
                        <span id={osparatId} className="sr-only">
                          Priset är inte sparat än.
                        </span>
                      )}
                    </div>

                    {/* FELET BOR VID KNAPPEN, inte i registreringens kvittens.
                        Skrivningen är sin egen operation nu, så dess utfall
                        hör hemma där den avfyrades — och det är den enda
                        signalen som säger att priset INTE sparades. */}
                    {sattPris.isError && (
                      <span role="alert" className="text-(color:--mm-input-error-text) text-small">
                        {`Priset sparades inte: ${sattPris.error.message}`}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <AriaButton
                      ref={prisKnappRef}
                      onPress={oppnaPris}
                      className="mt-2 block text-left text-small underline"
                    >
                      {sparatPris !== null
                        ? 'Ändra det avtalade priset'
                        : 'Har ni kommit överens om ett nytt pris? Sätt avtalat pris'}
                    </AriaButton>
                    {/* KVITTENSEN LEVER KVAR EFTER ATT YTAN STÄNGTS — den är
                        det enda beviset Lotta får på att skrivningen gick
                        igenom, eftersom fältet är tömt och boxens omräkning
                        ensam inte skiljer "sparat" från "lokalt överdrag".
                        `role="status"` annonserar utan att rycka fokus, som
                        just flyttats till länken ovan. */}
                    {prisKvittens !== null && (
                      <span role="status" className="mt-1 block text-small">
                        {prisKvittens}
                      </span>
                    )}
                  </>
                ))}
            </MessageBox>
          );
        })()}

      <div className="flex flex-wrap gap-3">
        <Select
          label="Betalsätt"
          selectedKey={betalsatt}
          onSelectionChange={(nyckel) => onBetalsatt(nyckel as Betalsatt)}
          className="min-w-40 flex-1"
        >
          {VALBARA_BETALSATT.map((satt) => (
            <SelectItem key={satt} id={satt}>
              {satt}
            </SelectItem>
          ))}
        </Select>
        <Input
          label="Betalningsdatum"
          type="date"
          value={datum}
          onChange={setDatum}
          className="min-w-40 flex-1"
        />
      </div>

      {/* ═══ NOTERINGEN — DÄR LOTTA FAKTISKT NOTERAR NÅGOT ═══
          Marcus, två gånger: *"det är HÄR lotta noterar något, inte på pricka
          av-blocket"*. Hela datavägen och deploy-fönstret: filhuvudet
          § NOTERINGSFÄLTET.

          PLACERINGEN ÄR EFTER BETALSÄTT/DATUM OCH FÖRE KVITTOKRYSSET, med
          avsikt: fälten ovanför beskriver BETALNINGEN (vad, hur, när) och
          kryssrutan nedanför är en HANDLING (skicka kvitto). Anteckningen hör
          till beskrivningen, inte till handlingen — och den ligger därmed sist
          bland fälten, vilket är rätt för det enda frivilliga fältet i
          formuläret. Tab-ordningen följer DOM och blir alltså belopp → (pris)
          → betalsätt → datum → notering → kryss → knappar.

          `hideLabel` GÖR PLATSHÅLLAREN TILL DEN SYNLIGA ETIKETTEN — Marcus
          beställda form ("placeholder 'Notering…'"). `label` finns kvar och blir
          `aria-label` via primitivens egen mekanism, så fältet har ett
          tillgängligt namn (WCAG 4.1.2) trots att ingen `<Label>` renderas.
          BOKFÖRD AVVÄGNING: en platshållare försvinner när Lotta börjat skriva,
          och fältet står då som det enda i formuläret utan synlig etikett. Det
          är den kända kostnaden för den kompakta formen; vill Marcus ha en
          synlig etikett är ändringen att ta bort `hideLabel` och ge
          `placeholder` ett exempel i stället.

          INGEN `maxLength`: taket (500) bärs av servern OCH av databasens
          `inbetalningar_notering_form`. Ett hårt stopp i fältet hade tyst ätit
          tecken Lotta klistrade in; serverns svar säger i stället vad som gick
          fel, i klartext. */}
      <Input
        label="Notering"
        hideLabel
        value={notering}
        onChange={setNotering}
        placeholder="Notering…"
        autoComplete="off"
      />

      {/* Rå RAC-Checkbox: huset har ingen Checkbox-primitiv, och det är en
          etablerad precedent (BorOverRad, task-18.8). Formen är kopierad ur
          `events/detail/Betalningar.tsx` § BetalKryss så att kryssen ser
          likadana ut i hela betalningsdomänen. */}
      <Checkbox
        isSelected={medKvitto}
        onChange={setMedKvitto}
        className="group flex cursor-pointer items-center gap-2 text-small"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
          <Check
            aria-hidden="true"
            size={14}
            className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
          />
        </span>
        <span>Skicka kvitto</span>
      </Checkbox>

      {registrera.isError && (
        <p role="alert" className="text-(color:--mm-input-error-text) text-small">
          {registrera.error.message}
        </p>
      )}

      {/* EN PRIMÄR, INTE TVÅ (Marcus dom 2026-09-01). "Registrera" (submit)
          och "Registrera och skicka" bar tidigare primär- respektive
          `success`-vikt — två mättade, konkurrerande knappar sida vid sida,
          och ögat kunde inte avgöra vilken som var vägen framåt. Submit
          behåller primärvikten; syskonet går ner till samma
          `secondary`/`outline` som beloppschipsen; "Avbryt" är kvar `ghost`.

          FUNKTION, ORDNING OCH KORTKOMMANDON ÄR ORÖRDA: samma `spara(true)`,
          samma plats i raden, samma ⌘/Ctrl+Enter-genväg (den lever på
          formulärets `onKeyDown`, inte på knappen), samma `isDisabled={!kanSpara}`.
          Husets `Button` bär sitt eget disabled-uttryck via `data-[disabled]`
          — ingen egen nedtoning här.

          `pt-2` GER KRYSSRUTAN ANDRUM (Marcus punkt 6): "Skicka kvitto" hör
          ihop med fälten ovanför, inte med knapparna. Utan den låg den lika
          nära knappraden som fälten låg varandra, och lästes som en del av
          handlingszonen. */}
      <div className="flex flex-wrap gap-2 pt-2">
        {/* [TASK-402.2 AC #3] `redigera`-LÄGET: KNAPPEN HETER "Klar" OCH
            "Registrera och skicka" FINNS INTE — facit
            (`s121-bekraftelsesteget-konvergens/facit.json` § `RadFormular`)
            bär bara Klar/Avbryt; `isLoading` läser aldrig `registrera` här
            eftersom den mutationen aldrig anropas i detta läge (se `spara`). */}
        <Button
          type="submit"
          isDisabled={!kanSpara}
          isLoading={lage === 'registrera' && registrera.isPending}
        >
          {lage === 'redigera' ? 'Klar' : 'Registrera'}
        </Button>
        {lage === 'registrera' && (
          <Button
            intent="secondary"
            emphasis="outline"
            isDisabled={!kanSpara}
            onPress={() => void spara(true)}
          >
            Registrera och skicka
          </Button>
        )}
        <Button intent="ghost" onPress={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
