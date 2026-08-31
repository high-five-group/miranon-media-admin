// Kvittojobbets ORKESTRATOR — TASK-346.4 AC #3, ADR-129 beslut 2, 9, 10.
//
// REN, DEPENDENCY-INJICERAD OCH DENO-GLOBAL-FRI i sin yta → Node-importerbar
// för `api-pure`-kontraktstestet (`tests/api/kvittojobb.test.ts`) OCH
// Deno-importerbar av `jobb-konsument`-EF:en. EXAKT samma uppdelning som
// `_shared/send-receipt.ts` (TASK-147.7) och `_shared/send-action-email.ts`
// (TASK-147.1) redan etablerat: I/O bor hos anroparen, ordningen bor här.
//
// ═══════════════════════════════════════════════════════════════════════════
// ORDNINGEN ÄR LASTBÄRANDE — TRE FASER, INTE EN LOOP
// ═══════════════════════════════════════════════════════════════════════════
// En naiv `for (const post of batch) { ...allt... }` hade brutit två av
// ADR-129:s beslut samtidigt. Faserna finns för att hålla båda:
//
//   FAS 1 — SEKVENTIELL (beslut 9: "numren allokeras sekventiellt, en i
//     taget"). Plocka raden, läs underlaget, hitta eller allokera
//     kvittonumret, skriv ledger-raden. Sekvensen är i sig atomär, men en
//     serie som delas ut i godtycklig ordning ger kvitton vars nummerordning
//     inte följer utfärdandeordningen — en bokföringsegenskap Roger läser.
//
//   FAS 2 — BEGRÄNSAD PARALLELLISM (beslut 10: "PDF-generering sker med
//     begränsad parallellism, under DocRaptors samtidighetstak, med taket som
//     en namngiven konstant och inte en tillfällighet"). Se
//     `PDF_SAMTIDIGHETSTAK` nedan.
//
//   FAS 3 — SEKVENTIELL (beslut 10: "mailen skickas ett anrop per kvitto —
//     Resends batch-API stödjer inte bilagor"). Skicka, finalisera ledgern,
//     spegla numret till basen, skriv radens slutstatus och FÖRST DÄREFTER
//     städa kömeddelandet (kontraktets regel 2).
//
// ═══════════════════════════════════════════════════════════════════════════
// DUBBELSKICK ÄR STRUKTURELLT OMÖJLIGT — OCH DET ÄR INTE DENNA FILS FÖRTJÄNST
// ═══════════════════════════════════════════════════════════════════════════
// `kvitton.inbetalning_id` är `unique` (ADR-128 beslut 4). Ett andra kvitto
// för samma inbetalning kan alltså inte SKRIVAS, oavsett hur många gånger ett
// jobb körs om. Denna orkestrator gör två saker runt den garantin:
//
//   (a) Frågar `hittaKvitto` FÖRE allokeringen. Ett befintligt, redan skickat
//       kvitto ⇒ raden sätts `skickat` utan att ett nummer bränns och utan
//       att ett andra mail går. Ett befintligt men OSKICKAT kvitto (en tidigare
//       körning dog efter ledger-raden) ⇒ SAMMA nummer återanvänds, aldrig ett
//       nytt.
//   (b) Fångar unik-nyckel-brottet ändå. Kontrollen i (a) är inte ett lås —
//       två körningar kan passera den samtidigt — och då fäller databasen den
//       andra. Raden blir `fel` med skäl, numret är brunnet (den accepterade
//       hål-i-serien-klassen, ADR-109 § Öppna punkter), och INGET andra mail
//       går. Det är den ordningen som gör dubbelskick omöjligt; (a) gör bara
//       att det normala fallet inte kostar ett nummer.
//
// ═══════════════════════════════════════════════════════════════════════════
// ETT FEL PÅ EN RAD FÄLLER ALDRIG BATCHEN
// ═══════════════════════════════════════════════════════════════════════════
// Varje post bär sitt eget utfall. Ett kastat fel i någon fas fångas, blir
// radens `skal` i klartext, och de övriga posterna fortsätter. "Ett halvt
// utfall får aldrig se helt ut" (ADR-129 beslut 2) läses här åt båda hållen:
// ett fel på en rad får heller aldrig se ut som ett fel på alla.

import {
  arSlutstatus,
  byggPagarUppdatering,
  byggSlutUppdatering,
  farPlockas,
  type JobbRadStatus,
} from './jobb-tillstand.ts';

/**
 * Samtidighetstaket mot PDF-tjänsten (ADR-129 beslut 10). DocRaptors
 * dokumenterade tak för konton utan utökad kapacitet är ett litet ensiffrigt
 * tal; TVÅ är valt som ett medvetet konservativt värde UNDER det, inte som en
 * mätning av var taket går. Det är ändå en väsentlig vinst mot sekventiellt
 * för Lottas åtta kvitton, och en trång sektion som aldrig kan bli en
 * 429-storm.
 *
 * OBEVISAT, ÖPPET DEKLARERAT: vi har inte mätt DocRaptors faktiska tak för
 * VÅRT konto. Höjs värdet ska det ske efter en mätning, inte efter en gissning.
 */
export const PDF_SAMTIDIGHETSTAK = 2;

/** Kvittonumrets serie-identitet, som `public.allokera_kvittonummer()` ger den. */
export type AllokeratNummer = {
  kvittonummer: string;
  ar: number;
  lopnummer: number;
};

/** Kvittots PDF, base64-kodad — samma form som `_shared/send-receipt.ts` § ReceiptPdf. */
export type KvittoPdf = { filename: string; contentBase64: string };

/** Allt konsumenten behöver veta om EN inbetalning för att kunna skicka dess kvitto. */
export type KvittoUnderlag = {
  inbetalningId: string;
  /** Anmälans record-ID i basen — spegelns adress. */
  anmalanRecordId: string;
  /** Kronor. Positivt för en inbetalning, negativt för en återbetalning. */
  belopp: number;
  betalsatt: string;
  /** ISO-datum ur inbetalningen (kvittots "Betalningsdatum", TASK-346.5). */
  betalningsdatum: string | null;
  kundnamn: string;
  email: string;
  eventNamn: string | null;
  eventTyp: string | null;
  eventStart: string | null;
  eventSlut: string | null;
  bokforingstext: string | null;
  /**
   * Facket kvittots ledger-rad ska bära. HÄRLEDD (ADR-128 beslut 2), aldrig
   * vald av Lotta. Inert för kvittots SYNLIGA text sedan TASK-306:s
   * rättelsevarv (`kvittoBenamning` konsumerar den inte längre), men fältet
   * finns kvar i `KvittoradSpec` och trådas därför oförändrat vidare.
   */
  betalning: 'avgift' | 'slut';
};

/** Specen `byggPdf` får. Egen typ, MEDVETET inte `KvittoradSpec` importerad:
 * den bor i `receipt-content.ts`, som denna skiva inte får röra
 * (kollisionsyta med TASK-346.5). Mappningen sker hos EF:en.
 *
 * `typ`/`hanvisningTillKvittonummer` [TASK-346.9, AKTIVERAR TASK-346.5:s
 * förberedda tokenyta i `receipt-content.ts`/`mall-data.ts`] — ALLTID satta
 * av `forbered()` nedan, aldrig `undefined`: ett vanligt kvitto får
 * `typ: 'kvitto'` och `hanvisningTillKvittonummer: null`, ett kreditkvitto
 * `typ: 'kreditkvitto'` och originalets kvittonummer. */
export type KvittoPdfSpec = KvittoUnderlag & {
  kvittonummer: string;
  datum: string;
  typ: 'kvitto' | 'kreditkvitto';
  hanvisningTillKvittonummer: string | null;
};

/** En befintlig ledger-rad, som `hittaKvitto` returnerar den. */
export type BefintligtKvitto = {
  id: string;
  kvittonummer: string;
  ar: number;
  lopnummer: number;
  status: 'utfardat' | 'skickat' | 'makulerat';
  lagringsnyckel: string | null;
};

/** En post ur kön: kömeddelandets id plus radens id. Nyttolasten bor i tabellen. */
export type KobatchPost = { msgId: number; radId: string };

/** Radens vy, som `lasRad` returnerar den. */
export type JobbRadVy = {
  id: string;
  jobbId: string;
  jobbtyp: string;
  objektId: string;
  status: JobbRadStatus;
};

export type KvittoJobbUtfall =
  | { radId: string; utfall: 'skickat'; kvittonummer: string }
  | { radId: string; utfall: 'redan-skickat'; kvittonummer: string }
  | { radId: string; utfall: 'hoppad'; skal: string }
  | { radId: string; utfall: 'fel'; skal: string };

export type KvittoJobbDeps = {
  /** Radens sanning (kontraktets regel 1). `null` = raden finns inte längre. */
  lasRad(radId: string): Promise<JobbRadVy | null>;
  /**
   * Villkorad claim: sätter `pagar` + `paborjad_nar` ENDAST om raden
   * fortfarande är `vantar`. Returnerar `false` när någon annan hann före.
   * Villkoret MÅSTE ligga i databasfrågan (`.eq('status','vantar')`), inte i
   * en läsning följd av en skrivning — annars är det ingen claim.
   */
  markeraPagar(radId: string, uppdatering: { status: 'pagar'; paborjad_nar: string }): Promise<boolean>;
  markeraRadSlut(
    radId: string,
    uppdatering: { status: 'skickat' | 'fel'; skal: string | null; avslutad_nar: string },
  ): Promise<void>;
  /** Radera (lyckat) eller arkivera (fel) kömeddelandet. ALDRIG före slutstatus. */
  stadaKomeddelande(msgId: number, utfall: 'skickat' | 'fel'): Promise<void>;

  hamtaUnderlag(inbetalningId: string): Promise<KvittoUnderlag | null>;
  hittaKvitto(inbetalningId: string): Promise<BefintligtKvitto | null>;
  /**
   * [TASK-346.9, ADR-128 § Kvittot: "kreditkvittot hänvisar till
   * originalet"] Kvittot en KREDITKVITTO ska referera, för EN anmälan.
   *
   * DESIGNVAL, bokfört (schemat bär ingen egen "avser"-kolumn för detta,
   * och kortets mandat medvetet lämnade avgörandet öppet, "designa mot
   * hittaKvitto/förbered-flödet"): originalet är det SENAST utfärdade
   * `typ: 'kvitto'`-kvittot, INTE makulerat, bland de inbetalningar som
   * delar `anmalanRecordId` — inte en explicit vald rad. Skälet är
   * schemat: `inbetalningar` bär ingen länk till "vilken tidigare
   * inbetalning denna återbetalning avser", och att lägga till en sådan
   * kolumn är en schemaändring `TASK-346.9` uttryckligen INTE fick göra
   * (uppdragets "ingen ny migration"). `anmalanRecordId` är den enda
   * länk som redan finns och som entydigt identifierar "den bokförings-
   * post detta gäller" i det VANLIGA fallet (en anmälan har som regel
   * högst en levande kvitto-serie åt gången).
   *
   * `null` = inget att kreditera hittades — AC #4:s negativa kontroll
   * ("kreditkvitto utan original fäller") kräver att `forbered()` då
   * FÄLLER raden i stället för att skapa ett kreditkvitto utan hänvisning
   * (vilket `kvitton_kreditkvitto_har_original`-constrainten ändå hade
   * stoppat, men med ett rått databasfel i stället för ett skäl Lotta
   * förstår).
   */
  hittaOriginalKvitto(anmalanRecordId: string): Promise<{ id: string; kvittonummer: string } | null>;
  allokeraNummer(ar: number): Promise<AllokeratNummer>;
  /**
   * Skriver ledger-raden. KASTAR vid unik-nyckel-brott (dubbelskicksspärren).
   *
   * `typ`/`originalKvittoId` [TASK-346.9]: `'kvitto'`/`null` för en vanlig
   * betalning, `'kreditkvitto'`/originalets id för en återbetalning — se
   * `hittaOriginalKvitto` ovan för hur originalet avgörs.
   */
  skapaKvitto(spec: {
    inbetalningId: string;
    ar: number;
    lopnummer: number;
    typ: 'kvitto' | 'kreditkvitto';
    originalKvittoId: string | null;
  }): Promise<{ id: string }>;
  finaliseraKvitto(
    kvittoId: string,
    falt: { lagringsnyckel: string; skickadNar: string; mottagare: string },
  ): Promise<void>;

  byggPdf(spec: KvittoPdfSpec): Promise<KvittoPdf>;
  /** Sparar PDF:en i den privata bucketen och returnerar lagringsnyckeln. */
  sparaPdf(spec: { ar: number; kvittonummer: string; pdf: KvittoPdf }): Promise<string>;
  /** `typ` [TASK-346.9]: mailets ämne/text skiljer "kvitto" från "kreditkvitto". */
  skickaMail(
    spec: {
      email: string;
      kundnamn: string;
      kvittonummer: string;
      pdf: KvittoPdf;
      typ: 'kvitto' | 'kreditkvitto';
    },
    ctx: { idempotencyKey: string },
  ): Promise<{ accepterat: boolean; skal?: string }>;

  /** Speglar kvittonumret till anmälan i basen. Best-effort — se `kor` steg 3f. */
  speglaKvittonummer(anmalanRecordId: string, kvittonummer: string): Promise<void>;
  /** Sätter `inbetalningar.kvitto_id` (den denormaliserade genvägen). */
  kopplaKvitto(inbetalningId: string, kvittoId: string): Promise<void>;

  /** Injicerad klocka — testet ska aldrig behöva systemtiden. */
  nu(): string;
};

/**
 * Idempotensnyckeln mot Resend — DETERMINISTISK PER INBETALNING, inte per
 * jobb eller per körning.
 *
 * Det är hela poängen: körs jobbet om (kön är at-least-once, självläkningen
 * återställer en död rad) ska Resend se SAMMA nyckel och vägra skicka en
 * andra gång. En nyckel som bar jobb-id:t hade gett ett nytt mail vid varje
 * omkörning — precis det användarberättelse 31 ("utan att något tappas eller
 * dubbleras") förbjuder.
 *
 * Skild namnrymd från `receiptIdempotencyKey` (`send-receipt.ts`,
 * `<jobId>/kvitto/<registrationId>/<betalning>`): den gamla vägen kvitterar
 * en BETALNINGSMARKERING i Airtable, den här en INBETALNING i Postgres. Två
 * olika saker får aldrig dela nyckel.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FÖNSTRET ÄR 24 TIMMAR — INTE FÖR EVIGT (granskningsfynd runda 1)
 * ═══════════════════════════════════════════════════════════════════════════
 * Resends idempotensnycklar gäller i ETT DYGN. Nyckeln ovan är alltså
 * deterministisk för alltid, men LEVERANTÖRENS minne av den är det inte, och
 * prosan får inte lova mer än mekanismen håller.
 *
 * NORMALVÄGEN ÄR SÄKRAD UTAN FÖNSTRET. Ett kvitto som utfärdats men inte
 * finaliserats plockas upp av självläkningens svep inom fem minuter
 * (`jobb_cron_tick()`), alltså långt innanför dygnet — och en omkörning
 * DÄRINNE får samma nyckel och ger inget andra mail.
 *
 * RESTRISKEN, utskriven i stället för bortdesignad: körs samma rad om MER än
 * 24 timmar efter att ett kvitto blivit `utfardat` men aldrig `skickat`
 * (raden manuellt återställd till `vantar`, eller ett jobb som legat stilla
 * över ett dygn) kan mottagaren få ett andra mail med SAMMA kvittonummer.
 * Ledgern förblir korrekt — numret och kopplingen är oförändrade, och
 * `kvitton.inbetalning_id` är fortsatt unik — så det är en DUBBLETT I
 * INKORGEN, aldrig ett andra kvitto i bokföringen. Vill man stänga även den
 * krävs ett eget "senast skickad"-fält och en tidskontroll före sändning;
 * det är en schemaändring och togs medvetet inte i denna skiva.
 */
export function kvittoIdempotensnyckel(inbetalningId: string): string {
  return `inbetalning/${inbetalningId}/kvitto`;
}

/** Bucket-nyckeln: `kvitton/<år>/<nummer>.pdf` (uppdragets form). */
export function kvittoLagringsnyckel(ar: number, kvittonummer: string): string {
  return `kvitton/${ar}/${kvittonummer}.pdf`;
}

/** Mellanläge mellan faserna. Bara poster som klarade fas 1 bär `forberedd`. */
type Forberedd = {
  post: KobatchPost;
  underlag: KvittoUnderlag;
  kvittoId: string;
  nummer: AllokeratNummer;
  /** Satt när en tidigare körning redan sparat PDF:en (omkörning efter fel). */
  befintligLagringsnyckel: string | null;
  /** [TASK-346.9] `'kreditkvitto'` för en återbetalning (`underlag.belopp < 0`), annars `'kvitto'`. */
  kvittoTyp: 'kvitto' | 'kreditkvitto';
  /** [TASK-346.9] Originalets kvittonummer för ett kreditkvitto, annars `null`. */
  hanvisningTillKvittonummer: string | null;
  pdf?: KvittoPdf;
  lagringsnyckel?: string;
};

/**
 * Kör EN batch ur kön. Returnerar ett utfall per post — aldrig ett kastat
 * fel för en enskild rad.
 */
export async function korKvittobatch(
  batch: readonly KobatchPost[],
  deps: KvittoJobbDeps,
): Promise<KvittoJobbUtfall[]> {
  const utfall: KvittoJobbUtfall[] = [];
  const forberedda: Forberedd[] = [];

  // ── FAS 1: sekventiellt — plocka, läs, allokera, skriv ledger-raden ──
  for (const post of batch) {
    const resultat = await forbered(post, deps);
    if (resultat.typ === 'klar') {
      forberedda.push(resultat.forberedd);
    } else {
      utfall.push(resultat.utfall);
    }
  }

  // ── FAS 2: begränsad parallellism — PDF + lagring ──
  const misslyckadeIFas2 = await korMedTak(forberedda, PDF_SAMTIDIGHETSTAK, async (item) => {
    const pdf = await deps.byggPdf({
      ...item.underlag,
      kvittonummer: item.nummer.kvittonummer,
      datum: deps.nu(),
      typ: item.kvittoTyp,
      hanvisningTillKvittonummer: item.hanvisningTillKvittonummer,
    });
    item.pdf = pdf;
    // En omkörning efter ett mailfel behöver inte ladda upp PDF:en igen —
    // men den MÅSTE bygga om den, eftersom bytesen inte överlever mellan
    // körningar (bucketen är inte en cache vi läser tillbaka här).
    item.lagringsnyckel =
      item.befintligLagringsnyckel ??
      (await deps.sparaPdf({ ar: item.nummer.ar, kvittonummer: item.nummer.kvittonummer, pdf }));
  });

  const kvarStaende = forberedda.filter((item) => !misslyckadeIFas2.has(item.post.radId));
  for (const item of forberedda) {
    const skal = misslyckadeIFas2.get(item.post.radId);
    if (skal !== undefined) {
      utfall.push(await avslutaMedFel(item.post, skal, deps));
    }
  }

  // ── FAS 3: sekventiellt — ett mailanrop per kvitto, sedan finalisering ──
  for (const item of kvarStaende) {
    utfall.push(await skickaOchFinalisera(item, deps));
  }

  return utfall;
}

/** FAS 1 för EN post. */
async function forbered(
  post: KobatchPost,
  deps: KvittoJobbDeps,
): Promise<{ typ: 'klar'; forberedd: Forberedd } | { typ: 'utfall'; utfall: KvittoJobbUtfall }> {
  try {
    const rad = await deps.lasRad(post.radId);

    // Raden borta (jobbet raderat) — meddelandet är föräldralöst. Städa det,
    // annars kommer det tillbaka var tionde sekund för evigt.
    if (rad === null) {
      await deps.stadaKomeddelande(post.msgId, 'fel');
      return {
        typ: 'utfall',
        utfall: { radId: post.radId, utfall: 'hoppad', skal: 'Jobbraden finns inte längre.' },
      };
    }

    // KONTRAKTETS REGEL 1: tabellen är sanning. Kön är at-least-once, så ett
    // meddelande för en redan avslutad rad är NORMALT, inte ett fel.
    if (!farPlockas(rad)) {
      if (arSlutstatus(rad.status)) {
        await deps.stadaKomeddelande(post.msgId, rad.status === 'skickat' ? 'skickat' : 'fel');
        return {
          typ: 'utfall',
          utfall: { radId: post.radId, utfall: 'hoppad', skal: `Raden är redan ${rad.status}.` },
        };
      }
      // `pagar`: någon annan körning håller raden. Meddelandet lämnas ORÖRT
      // — synlighetstimeouten lämnar tillbaka det, och står raden kvar för
      // länge tar självläkningen den (`jobb_cron_tick()`).
      return {
        typ: 'utfall',
        utfall: { radId: post.radId, utfall: 'hoppad', skal: 'Raden hanteras av en annan körning.' },
      };
    }

    // KONTRAKTETS REGEL 3: `pagar` sätts alltid med `paborjad_nar`.
    const tog = await deps.markeraPagar(post.radId, byggPagarUppdatering(deps.nu()));
    if (!tog) {
      return {
        typ: 'utfall',
        utfall: { radId: post.radId, utfall: 'hoppad', skal: 'Raden togs av en annan körning.' },
      };
    }

    const underlag = await deps.hamtaUnderlag(rad.objektId);
    if (underlag === null) {
      return {
        typ: 'utfall',
        utfall: await avslutaMedFel(
          post,
          'Inbetalningen finns inte längre — kvittot kan inte skapas.',
          deps,
        ),
      };
    }
    if (!underlag.email) {
      return {
        typ: 'utfall',
        utfall: await avslutaMedFel(
          post,
          'Anmälan saknar e-postadress — kvittot kan inte skickas.',
          deps,
        ),
      };
    }

    // Dubbelskickspärren, del (a) — se filhuvudet.
    //
    // ═══ ANTAGANDET LÖST (granskningsfynd runda 1 → TASK-346.9) ═══
    // Skip-villkoret täckte fram till denna skiva BARA `skickat`. Ett kvitto
    // med status `makulerat` föll då igenom och hade behandlats som
    // "oskickat" — raden återanvänd, PDF:en ombyggd, mailet skickat. TASK-346.9
    // inför `makulerat` (via `hantera-inbetalning`s nya kvitto-skrivning), och
    // det tillståndet får ALDRIG återupplivas: ett återanvänt nummer plus ett
    // omskick av en ogiltig verifikation. Grenen nedan fäller raden i stället
    // — MEDVETET VAL, inte ett skickat-om-igen-försök: ett makulerat kvitto är
    // en avslutad bokföringspost, aldrig en väntande.
    const befintligt = await deps.hittaKvitto(underlag.inbetalningId);
    if (befintligt !== null && befintligt.status === 'skickat') {
      await deps.markeraRadSlut(post.radId, byggSlutUppdatering({ status: 'skickat' }, deps.nu()));
      await deps.stadaKomeddelande(post.msgId, 'skickat');
      return {
        typ: 'utfall',
        utfall: {
          radId: post.radId,
          utfall: 'redan-skickat',
          kvittonummer: befintligt.kvittonummer,
        },
      };
    }
    if (befintligt !== null && befintligt.status === 'makulerat') {
      return {
        typ: 'utfall',
        utfall: await avslutaMedFel(
          post,
          'Kvittot är makulerat och kan inte skickas eller byggas om.',
          deps,
        ),
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // KREDITKVITTO [TASK-346.9] — ADR-128 § Kvittot, PRD berättelse 18/33
    // ═══════════════════════════════════════════════════════════════════════
    // Tecknet BÄR typen (samma invariant som `inbetalningar_tecken_foljer_typ`
    // i schemat): ett negativt belopp är strukturellt alltid en återbetalning,
    // aldrig ett vanligt kvitto med råkat negativt tal. Originalet slås upp
    // INNAN dubbelskicksspärrens `befintligt`-gren avgör om raden är NY eller
    // en omkörning — annars hade en omkörning av ett halvfärdigt kreditkvitto
    // (ledger-raden skapad, mailet aldrig skickat) saknat sin hänvisning i
    // fas 2:s PDF-bygge.
    const arAterbetalning = underlag.belopp < 0;
    let original: { id: string; kvittonummer: string } | null = null;
    if (arAterbetalning) {
      original = await deps.hittaOriginalKvitto(underlag.anmalanRecordId);
      if (original === null) {
        // AC #4:s negativa kontroll: "kreditkvitto utan original fäller".
        // Databasens `kvitton_kreditkvitto_har_original`-constraint hade
        // stoppat ett INSERT utan `original_kvitto_id` ändå — men med ett
        // rått databasfel i stället för ett skäl Lotta förstår. Fäll HÄR,
        // före `skapaKvitto` ens anropas.
        return {
          typ: 'utfall',
          utfall: await avslutaMedFel(
            post,
            'Inget kvitto att kreditera hittades för anmälan — kreditkvittot kan inte utfärdas.',
            deps,
          ),
        };
      }
    }
    const kvittoTyp: 'kvitto' | 'kreditkvitto' = arAterbetalning ? 'kreditkvitto' : 'kvitto';
    const hanvisningTillKvittonummer = arAterbetalning ? (original?.kvittonummer ?? null) : null;

    if (befintligt !== null) {
      // Enda kvarvarande statusen här är `utfardat` — en tidigare körning dog
      // efter ledger-raden men före mailet. SAMMA nummer återanvänds.
      return {
        typ: 'klar',
        forberedd: {
          post,
          underlag,
          kvittoId: befintligt.id,
          nummer: {
            kvittonummer: befintligt.kvittonummer,
            ar: befintligt.ar,
            lopnummer: befintligt.lopnummer,
          },
          befintligLagringsnyckel: befintligt.lagringsnyckel,
          kvittoTyp,
          hanvisningTillKvittonummer,
        },
      };
    }

    // ADR-129 beslut 9: sekventiell allokering. Året tas ur betalningsdatumet
    // när det finns — ett kvitto för en betalning i december ska ligga i
    // DECEMBERS serie även om det utfärdas i januari.
    const ar = arForKvitto(underlag.betalningsdatum, deps.nu());
    const nummer = await deps.allokeraNummer(ar);
    // Dubbelskickspärren, del (b): `skapaKvitto` KASTAR vid unik-nyckel-brott.
    const skapat = await deps.skapaKvitto({
      inbetalningId: underlag.inbetalningId,
      ar: nummer.ar,
      lopnummer: nummer.lopnummer,
      typ: kvittoTyp,
      originalKvittoId: arAterbetalning ? (original?.id ?? null) : null,
    });

    return {
      typ: 'klar',
      forberedd: {
        post,
        underlag,
        kvittoId: skapat.id,
        nummer,
        befintligLagringsnyckel: null,
        kvittoTyp,
        hanvisningTillKvittonummer,
      },
    };
  } catch (fel) {
    return { typ: 'utfall', utfall: await avslutaMedFel(post, felText(fel), deps) };
  }
}

/** FAS 3 för EN post. */
async function skickaOchFinalisera(
  item: Forberedd,
  deps: KvittoJobbDeps,
): Promise<KvittoJobbUtfall> {
  const { post, underlag, nummer } = item;
  try {
    const pdf = item.pdf;
    const lagringsnyckel = item.lagringsnyckel;
    if (pdf === undefined || lagringsnyckel === undefined) {
      // Kan bara inträffa om fas 2 ändrats utan att fas 3 följt med.
      return await avslutaMedFel(post, 'PDF saknas efter renderingsfasen.', deps);
    }

    const utfall = await deps.skickaMail(
      {
        email: underlag.email,
        kundnamn: underlag.kundnamn,
        kvittonummer: nummer.kvittonummer,
        pdf,
        typ: item.kvittoTyp,
      },
      { idempotencyKey: kvittoIdempotensnyckel(underlag.inbetalningId) },
    );

    if (!utfall.accepterat) {
      // Ledger-raden och numret står kvar (utfärdat, ej skickat). En omkörning
      // återanvänder BÅDA — se dubbelskickspärren del (a).
      return await avslutaMedFel(
        post,
        utfall.skal ?? 'Okänt fel — mailet avvisades av leverantören.',
        deps,
      );
    }

    const nu = deps.nu();
    await deps.finaliseraKvitto(item.kvittoId, {
      lagringsnyckel,
      skickadNar: nu,
      mottagare: underlag.email,
    });
    await deps.kopplaKvitto(underlag.inbetalningId, item.kvittoId);

    // SPEGELN ÄR BEST-EFFORT HÄR, MEDVETET (ADR-128 beslut 6: spegeln är en
    // projektion, aldrig sanningen). Mailet är skickat och ledgern
    // finaliserad; ett Airtable-fel får inte göra ett fullbordat kvitto till
    // ett `fel` som Lotta försöker skicka om. Eftersläpningen är synlig via
    // `hamta-inbetalningar`s spegeljämförelse.
    try {
      await deps.speglaKvittonummer(underlag.anmalanRecordId, nummer.kvittonummer);
    } catch (fel) {
      console.error(
        `[kvittojobb] spegling av kvittonummer misslyckades (fäller inte det redan skickade kvittot) | ` +
          `inbetalning=${underlag.inbetalningId} | fel=${felText(fel)}`,
      );
    }

    await deps.markeraRadSlut(post.radId, byggSlutUppdatering({ status: 'skickat' }, nu));
    // KONTRAKTETS REGEL 2: kömeddelandet städas SIST.
    await deps.stadaKomeddelande(post.msgId, 'skickat');

    return { radId: post.radId, utfall: 'skickat', kvittonummer: nummer.kvittonummer };
  } catch (fel) {
    return await avslutaMedFel(post, felText(fel), deps);
  }
}

/**
 * Skriver radens `fel` med skäl och städar sedan kömeddelandet — i den
 * ordningen (kontraktets regel 2). Ett fel HÄR sväljs: misslyckas
 * status-skrivningen står raden kvar som `pagar` och självläkningen tar den,
 * vilket är exakt rätt utfall.
 */
async function avslutaMedFel(
  post: KobatchPost,
  skal: string,
  deps: KvittoJobbDeps,
): Promise<KvittoJobbUtfall> {
  try {
    await deps.markeraRadSlut(post.radId, byggSlutUppdatering({ status: 'fel', skal }, deps.nu()));
    await deps.stadaKomeddelande(post.msgId, 'fel');
  } catch (fel) {
    console.error(
      `[kvittojobb] kunde inte skriva felstatus | rad=${post.radId} | fel=${felText(fel)}`,
    );
  }
  return { radId: post.radId, utfall: 'fel', skal };
}

/**
 * Kör `arbete` över `poster` med högst `tak` samtidiga. Returnerar en karta
 * radId → felskäl för de som kastade; de som lyckades har muterat sitt eget
 * objekt.
 *
 * VARFÖR EN EGEN LÖPARE OCH INTE `Promise.all` PÅ SLICES: en chunkad
 * `Promise.all` väntar in HELA chunken innan nästa startar, så en enda långsam
 * PDF låser upp till `tak - 1` lediga platser. Löparen nedan startar nästa
 * post så fort en plats blir ledig — samma form som en enkel arbetskö.
 */
async function korMedTak<T extends { post: KobatchPost }>(
  poster: readonly T[],
  tak: number,
  arbete: (post: T) => Promise<void>,
): Promise<Map<string, string>> {
  const fel = new Map<string, string>();
  let nasta = 0;

  async function arbetare(): Promise<void> {
    while (nasta < poster.length) {
      const index = nasta;
      nasta += 1;
      const item = poster[index];
      if (item === undefined) return;
      try {
        await arbete(item);
      } catch (orsak) {
        fel.set(item.post.radId, felText(orsak));
      }
    }
  }

  const antalArbetare = Math.max(1, Math.min(tak, poster.length));
  await Promise.all(Array.from({ length: antalArbetare }, () => arbetare()));
  return fel;
}

/**
 * Kvittoseriens år. Betalningsdatumet vinner över dagens datum: serien är
 * bokföringens, och en betalning som kom in i december hör till december års
 * serie även när kvittot utfärdas i januari.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ÅRSSKIFTET KRÄVER ETT MÄNSKLIGT STEG — OCH DET ÄGS AV PROD-RUNBOOKEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Granskningsfynd runda 1. `public.allokera_kvittonummer()` är FAIL-CLOSED
 * mot ett saknat golv: finns ingen rad i `kvittoserie_golv` för året kastar
 * den `P0002` i stället för att gissa 1001 (migrationens egen motivering:
 * en gissning hade kunnat kollidera med den gamla Airtable-serien).
 *
 * Följden är att det FÖRSTA kvittot 2027 fallerar med "golv saknas for ar
 * 2027" om ingen seedat raden — ett tydligt fel vid rätt tillfälle, alltså
 * exakt det fail-closed betyder, men ett fel ändå.
 *
 * Steget ägs av prod-runbooken (`TASK-346.11`), inte av denna kod: att låta
 * en Edge Function seeda golvet själv hade återinfört gissningen fail-closed
 * finns för att förhindra. Kravet är infört i `346.11`:s uppdrag av
 * orkestreraren.
 */
export function arForKvitto(betalningsdatum: string | null, nu: string): number {
  const kalla = betalningsdatum ?? nu;
  const ar = new Date(kalla).getUTCFullYear();
  return Number.isFinite(ar) ? ar : new Date(nu).getUTCFullYear();
}

/** Felets text i klartext — radens `skal` läses av Lotta, inte av en utvecklare. */
function felText(fel: unknown): string {
  if (fel instanceof Error) return fel.message;
  return String(fel);
}
