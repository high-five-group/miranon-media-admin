// INGEN `@ts-nocheck` HÄR — till skillnad från `_shared/mall-render.ts` (som
// importerar `https://esm.sh/eta@4.6.0` + Deno-globaler) rör denna fil
// VARKEN `Deno.` direkt eller transitivt, och har INGA importer alls. Den
// står därför i `tsconfig.edge-shared.json`s include-lista och typkollas
// äkta av Node-tsc (`npm run typecheck`), inte bara av Deno vid deploy.
//
// [TASK-309.34 skiva (i)] HÖJDANPASSNINGENS trapp-logik + sidräknare —
// utbruten UR `_shared/mall-render.ts` (som bar dem sedan TASK-309.27,
// PR #2028, merge-SHA `a620b3f4`) till en EGEN, IMPORTFRI fil.
//
// ═══ VARFÖR UTBRYTNING OCH INTE ENBART DEPENDENCY-INJEKTION ═══
// `mall-render.ts` har `import { Eta } from 'https://esm.sh/eta@4.6.0'` på
// rad 83. ES-modulers samtliga top-level-importer resolvas INNAN modulkroppen
// körs, så EN esm.sh-import gör HELA filen ett strukturellt otestbart
// Node-import — oavsett vilken specifik export testet behöver. Minimalt
// repro, kört 2026-08-28 innan denna fil skrevs:
//
//   node -e "import('./supabase/functions/_shared/mall-render.ts')"
//   → Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in:
//     file and data are supported by the default ESM loader. Received
//     protocol 'https:'
//
// Att BARA injicera renderaren hade alltså inte hjälpt: testet kan inte
// importera trapp-funktionen från `mall-render.ts` för att injicera i den.
// Injektionen behövs ändå (renderaren är ett nätverksanrop), men den är
// verkningslös utan utbrytningen. Därför BÅDA: modulen är importfri OCH tar
// renderaren som argument.
//
// Detta är EXAKT samma lösning som TASK-309.22 (PR #1983, merge-SHA
// `f80ace72`) valde för `_shared/attachments.ts` → `_shared/attachment-
// filename.ts`: de pura funktionerna flyttas till en importfri fil,
// re-exporteras oförändrat från ursprungsfilen (noll konsument-ändringar),
// och läggs till `tsconfig.edge-shared.json`. Lärdomen som grundar valet:
// `tasks/lessons.d/esm-sh-toppimport-gor-hela-delad-fil-otestbar-i-node.md`
// ([UNIVERSAL]).
//
// ═══ HÖJDANPASSNINGEN (TASK-309.27, 2026-08-27) — ORDAGRANT FLYTTAD ═══
//
// Marcus krav: "Jag vill ha allt på en sida, punkt!" Bekräftelsebilagan rymde
// RIM 1:s verkliga innehåll efter att flexbox-buggen rättats, men bara så
// länge innehållet råkade få plats — mätt gräns ~1800 tecken beskrivning plus
// 16 agendapunkter. RIM 2, RIM 3, Fjärrskådning och Psionautics har ännu TOMMA
// standardtexter i båda baserna; när de fylls vet ingen om de ryms.
//
// Lösningen är den Lotta redan använder i PowerPoint: krymp texten tills den
// får plats. Prince kan inte göra det åt oss — DocRaptor exponerar inte
// Prince-objektet (`ReferenceError: Can't find variable: Prince`, mätt
// 2026-08-27), så den dokumenterade multi-pass-vägen med JS är stängd. I
// stället mäter vi UTFALLET: rendera, räkna sidorna, rendera om mindre.
//
// TRAPPAN är mätt, inte räknad. På ett fall 25 % större än RIM 1:s verkliga
// innehåll (1829 tecken + 20 punkter) gav 1,00 / 0,95 / 0,90 alla två sidor;
// 0,85 gav en. Stegen nedan har därför marginal mot den mätningen. Marginaler
// i mallen är satta i mm och skalar inte med font-size, vilket gör effekten
// mindre än proportionell — ännu ett skäl att mäta i stället för att räkna.
//
// GOLVET finns för att en oläslig bilaga är sämre än en tvåsidig. Når vi
// botten utan att rymmas skickas den tvåsidiga versionen, och raden loggas —
// det är signalen att någon behöver korta texten, inte något att dölja.
//
// KOSTNAD: normalfallet är OFÖRÄNDRAT, ett anrop. Bara innehåll som faktiskt
// spiller betalar extra anrop.

/**
 * Skalstegen, i den ordning de prövas. Mätt, inte räknad — se filhuvudet.
 *
 * EXPORTERAD sedan TASK-309.34 så `tests/api/hojdanpassning.test.ts` kan
 * pröva den FAKTISKA trappan (inte en testkopia som tyst kan glida isär från
 * produktionens). `mall-render.ts` re-exporterar den inte — den har aldrig
 * haft någon extern konsument (`grep -rn "SKALTRAPPA" supabase/ src/ scripts/
 * tests/`, 2026-08-28: träffar endast i `mall-render.ts` självt).
 */
export const SKALTRAPPA = [1, 0.88, 0.8] as const;

/**
 * Loggprefixet är OFÖRÄNDRAT `[mall-render]` trots flytten hit.
 *
 * Prefixet är en observerbar yta: det som står i DocRaptor-anropens
 * Deno-loggar är vad någon grep:ar efter när en bilaga blev tvåsidig. Att
 * byta det till `[hojdanpassning]` hade varit en tyst beteendeändring utan
 * sakskäl — flytten är strukturell (testbarhet), inte funktionell.
 */
const LOGGPREFIX = '[mall-render]';

/**
 * Antal sidor i en PDF, läst direkt ur strömmen.
 *
 * `/Type /Page` (utan `s`) förekommer en gång per sida och ligger utanför
 * objektströmmarna även när Prince komprimerar resten — verifierat mot en
 * faktisk DocRaptor-PDF 2026-08-27 (3 komprimerade `/ObjStm`, ändå läsbar
 * sidräkning). Det gör att vi slipper ett PDF-bibliotek i EF-lagret.
 *
 * Returnerar `null` när strömmen inte går att tolka — anroparen behandlar det
 * som "vet inte" och avstår från att skala om, hellre än att gissa.
 *
 * KÄND KANT, BOKFÖRD I TASK-309.34 — INTE RÄTTAD HÄR (kortets AVGRÄNSNING:
 * "bygger INGEN ny render-logik"): `/Count` matchas GLOBALT och FÖRSTA
 * träffen vinner. I en PDF vars outline-träd (`/Outlines … /Count n`) råkar
 * ligga före sidträdets `/Count` blir svaret outline-nodens tal, inte
 * sidantalet. Prince/DocRaptor lägger i praktiken sidträdet först och
 * bilagorna saknar dessutom outline, så felet har aldrig observerats skarpt
 * — men det är en egenskap hos implementationen, inte en garanti. Testfallet
 * `raknaSidor: /Count-träffen är den FÖRSTA i strömmen` i
 * `tests/api/hojdanpassning.test.ts` LÅSER det faktiska beteendet så att en
 * framtida rättning blir ett medvetet, synligt beslut i stället för en tyst
 * drift.
 */
export function raknaSidor(pdf: Uint8Array): number | null {
  const text = new TextDecoder('latin1').decode(pdf);
  const viaCount = text.match(/\/Count\s+(\d+)/);
  if (viaCount) return Number(viaCount[1]);
  const sidor = text.match(/\/Type\s*\/Page[^s]/g);
  return sidor ? sidor.length : null;
}

/** Utfallet av ett trapp-varv — vad som faktiskt valdes, och till vilket pris. */
export interface HojdanpassningsUtfall {
  /** PDF:en som ska skickas vidare. Alltid den senast renderade. */
  pdf: Uint8Array;
  /** Skalsteget `pdf` renderades med. */
  skala: number;
  /** Sidantalet i `pdf`, eller `null` när strömmen inte gick att tolka. */
  sidor: number | null;
  /** Antal renderingar trappan faktiskt kostade (1 i normalfallet). */
  renderingar: number;
  /**
   * `true` bara när hela trappan gicks igenom utan att innehållet rymdes —
   * det vill säga: den returnerade PDF:en är för lång och skickas ändå.
   * `false` när något steg gav en sida ELLER när sidräkningen gav `null`
   * (då vet vi inget och avstår från att gissa).
   */
  golvNatt: boolean;
}

/** Injicerbara delar — allt utom renderaren har en produktionsduglig default. */
export interface AnpassaHojdOpts {
  /** Dokumentets namn, för loggraden. */
  namn?: string;
  /** Skalstegen. Default: {@link SKALTRAPPA}. */
  trappa?: readonly number[];
  /** Sidräknaren. Default: {@link raknaSidor}. */
  raknaSidor?: (pdf: Uint8Array) => number | null;
  /** Loggkanalen. Default: `console.log`. */
  logg?: (rad: string) => void;
}

/**
 * Kör skaltrappan: rendera → räkna sidor → rendera om mindre.
 *
 * Avbryter vid FÖRSTA steget som ger högst en sida — eller vid ett steg där
 * sidräkningen ger `null` (strömmen gick inte att tolka; skala inte om på en
 * gissning). Håller innehållet inte på det sista steget heller returneras
 * ändå den sista PDF:en, med `golvNatt: true` och en loggrad — en oläslig
 * bilaga är sämre än en tvåsidig, och tystnad är sämre än båda.
 *
 * Renderaren injiceras därför att det är ett DocRaptor-nätverksanrop som
 * debiteras per dokument. Med den som argument kan trappans beslutslogik
 * prövas mot ett kontrollerat sidantal per anrop, utan API-nyckel och utan
 * kostnad — vilket är hela poängen med TASK-309.34 skiva (i).
 */
export async function anpassaHojd(
  rendera: (skala: number) => Promise<Uint8Array>,
  opts: AnpassaHojdOpts = {},
): Promise<HojdanpassningsUtfall> {
  const trappa = opts.trappa ?? SKALTRAPPA;
  const rakna = opts.raknaSidor ?? raknaSidor;
  const logg = opts.logg ?? ((rad: string) => console.log(rad));
  const namn = opts.namn ?? 'namnlos';

  // En tom trappa är ett programmeringsfel, inte ett driftläge: det finns
  // ingen PDF att returnera och ingen skala att rapportera. Kasta hellre än
  // att casta bort `null` och lämna en tom `Uint8Array` vidare till Storage.
  if (trappa.length === 0) {
    throw new Error('anpassaHojd: trappan är tom — minst ett skalsteg krävs.');
  }

  let sistaPdf: Uint8Array | null = null;
  let sistaSkala = trappa[0];
  let sistaSidor: number | null = null;
  let renderingar = 0;

  for (const skala of trappa) {
    const pdf = await rendera(skala);
    renderingar += 1;
    sistaPdf = pdf;
    sistaSkala = skala;
    const sidor = rakna(pdf);
    sistaSidor = sidor;
    // `null` = strömmen gick inte att tolka. Skala inte om på en gissning.
    if (sidor === null || sidor <= 1) {
      return { pdf, skala, sidor, renderingar, golvNatt: false };
    }
    const golvet = skala === trappa[trappa.length - 1];
    logg(
      `${LOGGPREFIX} ${namn}: ${sidor} sidor vid skala ${skala}` +
        (golvet
          ? ' — golvet nått, skickar ändå. Texten behöver kortas.'
          : ' — renderar om mindre.'),
    );
  }

  return {
    pdf: sistaPdf as Uint8Array,
    skala: sistaSkala,
    sidor: sistaSidor,
    renderingar,
    golvNatt: true,
  };
}
