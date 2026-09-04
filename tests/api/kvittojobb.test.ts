// Kvittojobbets kontraktstest — TASK-346.4 AC #3 och #4, DoD #5,
// ADR-128 beslut 4, ADR-129 beslut 2, 9, 10.
//
// api-pure: alla I/O-gränser injiceras som en in-memory-värld, ingen staging,
// inga creds, NOLL riktig Resend/DocRaptor/Postgres. Samma form som
// `tests/api/send-receipt.test.ts` (TASK-147.7) för den gamla kvittovägen.
//
// ═══════════════════════════════════════════════════════════════════════════
// VÄRLDEN NEDAN BÄR DATABASENS GARANTIER, INTE BARA DESS FORM
// ═══════════════════════════════════════════════════════════════════════════
// Ett testdouble som bara returnerar data bevisar ingenting om
// dubbelskicksspärren. `skapaKvitto` i världen nedan KASTAR ett
// unik-nyckel-fel när `inbetalning_id` redan finns — precis som
// `kvitton.inbetalning_id unique` gör (ADR-128 beslut 4). Det är den
// egenskapen kortets AC #4 ("dubbelskick fäller på unik nyckel") kräver
// bevisad, och den kan bara bevisas om världen faktiskt håller den.

import { expect, test } from '@playwright/test';
import {
  farStadaKomeddelande,
  type JobbRadStatus,
} from '../../supabase/functions/_shared/jobb-tillstand';
import {
  type BefintligtKvitto,
  type JobbRadVy,
  type KobatchPost,
  type KvittoJobbDeps,
  type KvittoUnderlag,
  korKvittobatch,
  kvittoIdempotensnyckel,
  kvittoLagringsnyckel,
  PDF_SAMTIDIGHETSTAK,
} from '../../supabase/functions/_shared/kvittojobb';

const NU = '2026-08-31T10:00:00.000Z';

type Rad = {
  id: string;
  jobbId: string;
  objektId: string;
  status: JobbRadStatus;
  skal: string | null;
  paborjadNar: string | null;
  avslutadNar: string | null;
};

type LedgerRad = {
  id: string;
  inbetalningId: string;
  ar: number;
  lopnummer: number;
  status: 'utfardat' | 'skickat' | 'makulerat';
  lagringsnyckel: string | null;
  mottagare: string | null;
  /** [TASK-346.9] `undefined` i befintliga fixturer betyder `'kvitto'`. */
  typ?: 'kvitto' | 'kreditkvitto';
  originalKvittoId?: string | null;
};

/** Vad som HÄNDE, i ordning. Ordningen är ett kontrakt, inte en detalj. */
type Handelse =
  | { typ: 'pagar'; radId: string }
  | { typ: 'slut'; radId: string; status: string; skal: string | null }
  | {
      typ: 'stadning';
      msgId: number;
      resultat: string;
      /** Radernas status I DET ÖGONBLICK städningen kördes — kontraktets regel 2. */
      radStatus: Record<string, JobbRadStatus>;
    }
  | { typ: 'nummer'; lopnummer: number }
  | {
      typ: 'pdf';
      kvittonummer: string;
      /** [TASK-346.9] Vad `forbered()` faktiskt skickade in i `byggPdf`. */
      dokumenttyp: 'kvitto' | 'kreditkvitto';
      hanvisning: string | null;
    }
  | { typ: 'lagring'; nyckel: string }
  | { typ: 'mail'; till: string; nyckel: string; dokumenttyp: 'kvitto' | 'kreditkvitto' }
  | { typ: 'finalisering'; kvittoId: string }
  | { typ: 'spegel'; anmalan: string; kvittonummer: string };

class UnikNyckelFel extends Error {
  readonly code = '23505';
  constructor() {
    super('duplicate key value violates unique constraint "kvitton_inbetalning_id_key"');
    this.name = 'UnikNyckelFel';
  }
}

type VarldsInstallning = {
  rader: Rad[];
  underlag: Record<string, Partial<KvittoUnderlag>>;
  /** Låt mailet avvisas för dessa inbetalningar. */
  avvisaMailFor?: string[];
  /** Låt PDF-byggandet kasta för dessa inbetalningar. */
  fallPdfFor?: string[];
  /** Ledger-rader som redan finns när batchen startar. */
  ledger?: LedgerRad[];
  /** Låt spegelskrivningen kasta. */
  fallSpegel?: boolean;
  /** Fördröjning per PDF, för att kunna mäta samtidighet. */
  pdfFordrojningMs?: number;
  /**
   * [TASK-346.9, ENTYDIGHETS-GUARDEN fix-runda 2] Vad `hittaOriginalKvitto`
   * svarar, i `byggVarld`s förenklade fixturform (mappas till det riktiga
   * `OriginalKvittoUppslag`-schemat i `deps.hittaOriginalKvitto` nedan):
   *
   *   `undefined`/`null`            → `{ utfall: 'inget' }` (AC #4:s
   *                                    negativa kontroll)
   *   `{ id, kvittonummer }`        → `{ utfall: 'entydigt', ... }`
   *   `{ flertydigt: N }`           → `{ utfall: 'flertydigt', antal: N }`
   *                                    (guarden — N levande kandidater,
   *                                    ingen vald)
   */
  original?: { id: string; kvittonummer: string } | { flertydigt: number } | null;
};

function byggVarld(installning: VarldsInstallning) {
  const rader = new Map(installning.rader.map((rad) => [rad.id, { ...rad }]));
  const ledger: LedgerRad[] = (installning.ledger ?? []).map((rad) => ({ ...rad }));
  const handelser: Handelse[] = [];
  const claimForsok: string[] = [];
  const kvarIKon = new Set<number>();
  let nastaLopnummer = 1003;
  let nastaKvittoId = 1;
  let pagaendePdf = 0;
  let maxSamtidigPdf = 0;

  const deps: KvittoJobbDeps = {
    nu: () => NU,

    async lasRad(radId): Promise<JobbRadVy | null> {
      const rad = rader.get(radId);
      if (!rad) return null;
      return {
        id: rad.id,
        jobbId: rad.jobbId,
        jobbtyp: 'kvitto',
        objektId: rad.objektId,
        status: rad.status,
      };
    },

    async markeraPagar(radId, uppdatering) {
      // FÖRSÖKEN räknas separat från de LYCKADE. Skillnaden är hela regel 1:
      // en rad som inte får plockas ska aldrig ens FÖRSÖKAS claimas. Utan
      // denna räknare hade en trasig `farPlockas` maskerats av den villkorade
      // claimen nedan — mätt: en `farPlockas` ändrad till `status !==
      // 'skickat'` fällde `jobb-tillstand`-sviten men INTE denna, eftersom
      // utfallet blev `hoppad` ändå.
      claimForsok.push(radId);
      const rad = rader.get(radId);
      // VILLKORAD CLAIM — speglar `.eq('status','vantar')` i den skarpa
      // implementationen. En värld som alltid returnerade `true` hade gjort
      // kapplöpnings-testet meningslöst.
      if (!rad || rad.status !== 'vantar') return false;
      rad.status = 'pagar';
      rad.paborjadNar = uppdatering.paborjad_nar;
      handelser.push({ typ: 'pagar', radId });
      return true;
    },

    async markeraRadSlut(radId, uppdatering) {
      const rad = rader.get(radId);
      if (!rad) throw new Error('okänd rad');
      rad.status = uppdatering.status;
      rad.skal = uppdatering.skal;
      rad.avslutadNar = uppdatering.avslutad_nar;
      handelser.push({
        typ: 'slut',
        radId,
        status: uppdatering.status,
        skal: uppdatering.skal,
      });
    },

    async stadaKomeddelande(msgId, resultat) {
      kvarIKon.delete(msgId);
      // ÖGONBLICKSBILDEN, inte bara ordningen. Ett index-test bevisar att
      // händelserna kom i rätt följd; detta bevisar att RADEN faktiskt var
      // avslutad när kön städades — egenskapen regel 2 handlar om, och den
      // överlever att någon lägger till en händelse emellan.
      const radStatus: Record<string, JobbRadStatus> = {};
      for (const [id, rad] of rader.entries()) radStatus[id] = rad.status;
      handelser.push({ typ: 'stadning', msgId, resultat, radStatus });
    },

    async hamtaUnderlag(inbetalningId): Promise<KvittoUnderlag | null> {
      const partiell = installning.underlag[inbetalningId];
      if (!partiell) return null;
      return {
        inbetalningId,
        anmalanRecordId: 'recAAAAAAAAAAAAAA',
        belopp: 2500,
        betalsatt: 'Swish',
        betalningsdatum: '2026-08-29',
        kundnamn: 'Bengt Bengtsson',
        email: 'delivered@resend.dev',
        eventNamn: 'Fjärrskådning, Skövde',
        eventTyp: 'Utbildning',
        eventStart: '2026-09-10',
        eventSlut: '2026-09-11',
        bokforingstext: null,
        betalning: 'slut',
        ...partiell,
      };
    },

    async hittaKvitto(inbetalningId): Promise<BefintligtKvitto | null> {
      const rad = ledger.find((post) => post.inbetalningId === inbetalningId);
      if (!rad) return null;
      const originalKvittoId = rad.originalKvittoId ?? null;
      const originalRad = originalKvittoId
        ? ledger.find((post) => post.id === originalKvittoId)
        : undefined;
      return {
        id: rad.id,
        kvittonummer: `MM-${rad.ar}-${rad.lopnummer}`,
        ar: rad.ar,
        lopnummer: rad.lopnummer,
        status: rad.status,
        lagringsnyckel: rad.lagringsnyckel,
        typ: rad.typ ?? 'kvitto',
        originalKvittoId,
        originalKvittonummer: originalRad ? `MM-${originalRad.ar}-${originalRad.lopnummer}` : null,
      };
    },

    async hittaOriginalKvitto() {
      const o = installning.original;
      if (o === undefined || o === null) return { utfall: 'inget' as const };
      if ('flertydigt' in o) return { utfall: 'flertydigt' as const, antal: o.flertydigt };
      return { utfall: 'entydigt' as const, id: o.id, kvittonummer: o.kvittonummer };
    },

    async allokeraNummer(ar) {
      const lopnummer = nastaLopnummer;
      nastaLopnummer += 1;
      handelser.push({ typ: 'nummer', lopnummer });
      return { kvittonummer: `MM-${ar}-${lopnummer}`, ar, lopnummer };
    },

    async skapaKvitto(spec) {
      // DATABASENS GARANTI, INTE EN ATTRAPP: unik nyckel per inbetalning.
      if (ledger.some((post) => post.inbetalningId === spec.inbetalningId)) {
        throw new UnikNyckelFel();
      }
      const id = `kvitto-${nastaKvittoId}`;
      nastaKvittoId += 1;
      ledger.push({
        id,
        inbetalningId: spec.inbetalningId,
        ar: spec.ar,
        lopnummer: spec.lopnummer,
        status: 'utfardat',
        lagringsnyckel: null,
        mottagare: null,
        typ: spec.typ,
        originalKvittoId: spec.originalKvittoId,
      });
      return { id };
    },

    async finaliseraKvitto(kvittoId, falt) {
      const rad = ledger.find((post) => post.id === kvittoId);
      if (!rad) throw new Error('okänt kvitto');
      rad.status = 'skickat';
      rad.lagringsnyckel = falt.lagringsnyckel;
      rad.mottagare = falt.mottagare;
      handelser.push({ typ: 'finalisering', kvittoId });
    },

    async byggPdf(spec) {
      pagaendePdf += 1;
      maxSamtidigPdf = Math.max(maxSamtidigPdf, pagaendePdf);
      try {
        if (installning.pdfFordrojningMs) {
          await new Promise((klar) => setTimeout(klar, installning.pdfFordrojningMs));
        }
        if (installning.fallPdfFor?.includes(spec.inbetalningId)) {
          throw new Error('DocRaptor svarade 500.');
        }
        handelser.push({
          typ: 'pdf',
          kvittonummer: spec.kvittonummer,
          dokumenttyp: spec.typ,
          hanvisning: spec.hanvisningTillKvittonummer,
        });
        return { filename: `${spec.kvittonummer}.pdf`, contentBase64: 'UERG' };
      } finally {
        pagaendePdf -= 1;
      }
    },

    async sparaPdf(spec) {
      const nyckel = kvittoLagringsnyckel(spec.ar, spec.kvittonummer);
      handelser.push({ typ: 'lagring', nyckel });
      return nyckel;
    },

    async skickaMail(spec, ctx) {
      handelser.push({
        typ: 'mail',
        till: spec.email,
        nyckel: ctx.idempotencyKey,
        dokumenttyp: spec.typ,
      });
      // Nyckeln BÄR inbetalningens id (`inbetalning/<id>/kvitto`), så
      // testvärlden kan avgöra vilken post mailet gäller utan ett eget
      // argument — och testet blir därmed också en kontroll av att nyckeln
      // faktiskt är inbetalnings-bunden.
      const avvisad = (installning.avvisaMailFor ?? []).some((id) =>
        ctx.idempotencyKey.includes(`/${id}/`),
      );
      if (avvisad) return { accepterat: false, skal: 'Resend avvisade adressen.' };
      return { accepterat: true };
    },

    async speglaKvittonummer(anmalanRecordId, kvittonummer) {
      if (installning.fallSpegel) throw new Error('Airtable svarade 503.');
      handelser.push({ typ: 'spegel', anmalan: anmalanRecordId, kvittonummer });
    },

    async kopplaKvitto() {
      // Den denormaliserade genvägen. Ingen händelse — den bärande
      // riktningen är `kvitton.inbetalning_id`, och den bevakas ovan.
    },
  };

  return {
    deps,
    handelser,
    claimForsok,
    ledger,
    rader,
    kvarIKon,
    get maxSamtidigPdf() {
      return maxSamtidigPdf;
    },
  };
}

function vantandeRad(id: string, objektId: string): Rad {
  return {
    id,
    jobbId: 'jobb-1',
    objektId,
    status: 'vantar',
    skal: null,
    paborjadNar: null,
    avslutadNar: null,
  };
}

function post(msgId: number, radId: string): KobatchPost {
  return { msgId, radId };
}

// ═══════════════════════════════════════════════════════════════════════════
// § 1 — Lyckad väg, och ORDNINGEN som gör den säker
// ═══════════════════════════════════════════════════════════════════════════

test.describe('korKvittobatch — lyckad väg', () => {
  test('ett kvitto: nummer, PDF, lagring, mail, finalisering, spegel, slutstatus', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall).toEqual([{ radId: 'rad-1', utfall: 'skickat', kvittonummer: 'MM-2026-1003' }]);
    expect(varld.rader.get('rad-1')?.status).toBe('skickat');
    expect(varld.ledger).toHaveLength(1);
    expect(varld.ledger[0].status).toBe('skickat');
    expect(varld.ledger[0].lagringsnyckel).toBe('kvitton/2026/MM-2026-1003.pdf');
    expect(varld.ledger[0].mottagare).toBe('delivered@resend.dev');
  });

  test('KÖMEDDELANDET STÄDAS EFTER SLUTSTATUS — aldrig före (kontraktets regel 2)', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
    });
    await korKvittobatch([post(1, 'rad-1')], varld.deps);

    const typer = varld.handelser.map((h) => h.typ);
    expect(typer.indexOf('slut')).toBeGreaterThan(-1);
    expect(typer.indexOf('stadning')).toBeGreaterThan(typer.indexOf('slut'));
  });

  test('RADEN VAR REDAN AVSLUTAD när kön städades — inte bara "efteråt i listan"', async () => {
    // Granskningsfynd runda 1 ersatte här ett tautologi-test (en jämförelse
    // mellan två index i en litteral array, som aldrig rörde produktionskod).
    //
    // Denna kontroll prövar samma regel men som TILLSTÅND i stället för
    // ordning: när `stadaKomeddelande` kördes, vilken status BAR raden? Ett
    // index-test kan luras av en ny händelse som skjuts in emellan; en
    // ögonblicksbild av radens faktiska status kan det inte.
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
    });
    await korKvittobatch([post(1, 'rad-1')], varld.deps);

    const stadning = varld.handelser.find(
      (h): h is Extract<Handelse, { typ: 'stadning' }> => h.typ === 'stadning',
    );
    expect(stadning, 'kömeddelandet städades aldrig').toBeDefined();
    expect(stadning?.radStatus['rad-1']).toBe('skickat');
    // Och `farStadaKomeddelande` — produktionskodens egen grind — håller med
    // om att just det tillståndet får städas.
    expect(farStadaKomeddelande({ status: stadning?.radStatus['rad-1'] ?? 'vantar' })).toBe(true);
    // Motsatsen, för att visa att grinden diskriminerar: en `pagar`-rad hade
    // inte fått städas.
    expect(farStadaKomeddelande({ status: 'pagar' })).toBe(false);
  });

  test('MAILET SKICKAS EN GÅNG, med en nyckel som är deterministisk per INBETALNING', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
    });
    await korKvittobatch([post(1, 'rad-1')], varld.deps);

    const mail = varld.handelser.filter((h) => h.typ === 'mail');
    expect(mail).toHaveLength(1);
    expect(mail[0]).toMatchObject({ nyckel: kvittoIdempotensnyckel('inb-1') });
    // Nyckeln bär INBETALNINGEN, inte jobbet eller körningen — det är hela
    // skälet till att en omkörning inte kan ge ett andra mail.
    expect(kvittoIdempotensnyckel('inb-1')).toBe('inbetalning/inb-1/kvitto');
  });

  test('NUMREN DELAS UT SEKVENTIELLT, i batchens ordning (ADR-129 beslut 9)', async () => {
    const varld = byggVarld({
      rader: [
        vantandeRad('rad-1', 'inb-1'),
        vantandeRad('rad-2', 'inb-2'),
        vantandeRad('rad-3', 'inb-3'),
      ],
      underlag: { 'inb-1': {}, 'inb-2': {}, 'inb-3': {} },
    });

    await korKvittobatch([post(1, 'rad-1'), post(2, 'rad-2'), post(3, 'rad-3')], varld.deps);

    const nummer = varld.handelser
      .filter((h): h is Extract<Handelse, { typ: 'nummer' }> => h.typ === 'nummer')
      .map((h) => h.lopnummer);
    expect(nummer).toEqual([1003, 1004, 1005]);
    // Ledgern speglar samma ordning: kvitto N hör till inbetalning N.
    expect(varld.ledger.map((rad) => [rad.inbetalningId, rad.lopnummer])).toEqual([
      ['inb-1', 1003],
      ['inb-2', 1004],
      ['inb-3', 1005],
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2 — DUBBELSKICK FÄLLER PÅ UNIK NYCKEL (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('korKvittobatch — dubbelskicksspärren', () => {
  test('en rad vars kvitto REDAN ÄR SKICKAT ger inget andra mail', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-2', 'inb-1')],
      underlag: { 'inb-1': {} },
      ledger: [
        {
          id: 'kvitto-tidigare',
          inbetalningId: 'inb-1',
          ar: 2026,
          lopnummer: 1003,
          status: 'skickat',
          lagringsnyckel: 'kvitton/2026/MM-2026-1003.pdf',
          mottagare: 'delivered@resend.dev',
        },
      ],
    });

    const utfall = await korKvittobatch([post(9, 'rad-2')], varld.deps);

    expect(utfall).toEqual([
      { radId: 'rad-2', utfall: 'redan-skickat', kvittonummer: 'MM-2026-1003' },
    ]);
    expect(varld.handelser.filter((h) => h.typ === 'mail')).toHaveLength(0);
    // INGET NYTT NUMMER BRÄNNS i det normala fallet.
    expect(varld.handelser.filter((h) => h.typ === 'nummer')).toHaveLength(0);
    expect(varld.rader.get('rad-2')?.status).toBe('skickat');
  });

  test('KAPPLÖPNINGEN: en ledger-rad som dyker upp EFTER kontrollen fäller på unik nyckel', async () => {
    // Kontrollen i `hittaKvitto` är inget lås — två körningar kan passera
    // den samtidigt. Då är det databasen som fäller den andra, och det är
    // DEN garantin som gör dubbelskick strukturellt omöjligt.
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
    });

    // Simulerar den andra körningen: `hittaKvitto` svarar `null` (som i en
    // äkta kapplöpning, där båda körningarna hann läsa före den andra skrev),
    // men ledgern hinner få sin rad innan `skapaKvitto`.
    varld.deps.hittaKvitto = async (inbetalningId: string) => {
      varld.ledger.push({
        id: 'kvitto-annan-korning',
        inbetalningId,
        ar: 2026,
        lopnummer: 1002,
        status: 'utfardat',
        lagringsnyckel: null,
        mottagare: null,
      });
      return null;
    };

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall[0].utfall).toBe('fel');
    expect(utfall[0]).toHaveProperty('skal');
    expect((utfall[0] as { skal: string }).skal).toContain('unique constraint');
    // INGET MAIL GICK. Det är hela poängen: dubbelarbete är möjligt, dubbel
    // EFFEKT är det inte.
    expect(varld.handelser.filter((h) => h.typ === 'mail')).toHaveLength(0);
    expect(varld.rader.get('rad-1')?.status).toBe('fel');
    expect(varld.rader.get('rad-1')?.skal).toContain('unique constraint');
  });

  test('ETT OSKICKAT befintligt kvitto ÅTERANVÄNDS — samma nummer, aldrig ett nytt', async () => {
    // En tidigare körning dog efter ledger-raden men före mailet. Att
    // allokera ett nytt nummer hade bränt ett hål i serien i onödan OCH
    // fällts av unik-nyckeln.
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
      ledger: [
        {
          id: 'kvitto-halvfardigt',
          inbetalningId: 'inb-1',
          ar: 2026,
          lopnummer: 1042,
          status: 'utfardat',
          lagringsnyckel: null,
          mottagare: null,
        },
      ],
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall).toEqual([{ radId: 'rad-1', utfall: 'skickat', kvittonummer: 'MM-2026-1042' }]);
    expect(varld.handelser.filter((h) => h.typ === 'nummer')).toHaveLength(0);
    expect(varld.ledger).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2b — Makulerat kvitto: ALDRIG återupplivat (TASK-346.9, AC #4)
// ═══════════════════════════════════════════════════════════════════════════
//
// Fram till denna skiva täckte dubbelskicksspärren bara `status === 'skickat'`
// — se `_shared/kvittojobb.ts`s tidigare "ANTAGANDET SOM 346.9 MÅSTE PRÖVA".
// Ett `makulerat` kvitto föll då igenom skip-villkoret och behandlades som
// "oskickat, återanvänd raden": PDF ombyggd, nytt mail skickat, med SAMMA
// kvittonummer som redan står makulerat i bokföringen. Testerna nedan bevisar
// att den vägen nu är stängd, och att den ALDRIG rör kvittonumret (AC #4:s
// "makulerad rad påverkar inte kvittots nummer").

test.describe('korKvittobatch — makulerat kvitto återupplivas aldrig', () => {
  test('kvitto med status makulerat: raden fäller, inget mail, ingen PDF, numret orört', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
      ledger: [
        {
          id: 'kvitto-makulerat',
          inbetalningId: 'inb-1',
          ar: 2026,
          lopnummer: 1042,
          status: 'makulerat',
          lagringsnyckel: 'kvitton/2026/MM-2026-1042.pdf',
          mottagare: 'delivered@resend.dev',
        },
      ],
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall[0].utfall).toBe('fel');
    expect((utfall[0] as { skal: string }).skal).toContain('makulerat');
    // INGET MAIL, INGEN PDF, INGET NYTT NUMMER — kvittot behandlas som en
    // avslutad post, aldrig som "väntar på att skickas".
    //
    // DETTA ÄR SJÄLVA NEGATIVA KONTROLLEN (granskningsfynd runda 2, I6 —
    // rättad formulering, en tidigare version bar en EGEN, separat
    // "NEGATIV KONTROLL"-märkt test som bara reproducerade den trasiga
    // lambdan ISOLERAT och asserterade en sanning om SIG SJÄLV, utan att
    // någonsin köra `korKvittobatch` — den bevisade ingenting om SYSTEMET
    // och togs bort). Den gamla skip-logiken (`status === 'skickat'`) hade
    // för DENNA rad (status `makulerat`) sett `befintligt !== null` men
    // `status !== 'skickat'`, alltså INTE "redan skickat" — och hade fallit
    // genom till "återanvänd raden, skicka om": `utfall` hade blivit
    // `'skickat'` (inte `'fel'`), minst ett `mail`- och ett `pdf`-anrop
    // skett (inte noll), och samma kvittonummer skickats till en deltagare
    // för en post som redan är makulerad i bokföringen. Varje assertion
    // nedan hade alltså fallit mot den gamla implementationen.
    expect(varld.handelser.filter((h) => h.typ === 'mail')).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'pdf')).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'nummer')).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'lagring')).toHaveLength(0);
    // Ledger-raden är HELT ORÖRD — samma nummer, samma status, ingen ny post.
    expect(varld.ledger).toEqual([
      {
        id: 'kvitto-makulerat',
        inbetalningId: 'inb-1',
        ar: 2026,
        lopnummer: 1042,
        status: 'makulerat',
        lagringsnyckel: 'kvitton/2026/MM-2026-1042.pdf',
        mottagare: 'delivered@resend.dev',
      },
    ]);
    expect(varld.rader.get('rad-1')?.status).toBe('fel');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2c — Kreditkvitto (TASK-346.9, AC #3/#4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('korKvittobatch — kreditkvitto', () => {
  test('negativt belopp: kreditkvitto skapas med hänvisning till originalet, aktiveras i PDF och mail', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-aterbetalning')],
      underlag: { 'inb-aterbetalning': { belopp: -1500, anmalanRecordId: 'recBBBBBBBBBBBBB' } },
      original: { id: 'kvitto-original-1', kvittonummer: 'MM-2026-1007' },
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall).toEqual([{ radId: 'rad-1', utfall: 'skickat', kvittonummer: 'MM-2026-1003' }]);
    // Ledger-raden är ett KREDITKVITTO som pekar på originalet.
    expect(varld.ledger).toHaveLength(1);
    expect(varld.ledger[0]).toMatchObject({
      typ: 'kreditkvitto',
      originalKvittoId: 'kvitto-original-1',
    });
    // PDF:en och mailet fick BÅDA veta att detta är ett kreditkvitto, med
    // rätt hänvisningsnummer — det är TASK-346.5:s förberedda tokenyta som
    // denna skiva aktiverar.
    const pdfHandelse = varld.handelser.find((h) => h.typ === 'pdf');
    expect(pdfHandelse).toMatchObject({ dokumenttyp: 'kreditkvitto', hanvisning: 'MM-2026-1007' });
    const mailHandelse = varld.handelser.find((h) => h.typ === 'mail');
    expect(mailHandelse).toMatchObject({ dokumenttyp: 'kreditkvitto' });
  });

  test('AC #4 NEGATIV KONTROLL: kreditkvitto utan original fäller — inget nummer bränns, ingen ledger-rad', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-aterbetalning')],
      underlag: { 'inb-aterbetalning': { belopp: -1500, anmalanRecordId: 'recBBBBBBBBBBBBB' } },
      original: null, // inget kvitto att kreditera hittades
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall[0].utfall).toBe('fel');
    expect((utfall[0] as { skal: string }).skal.toLowerCase()).toContain('kreditera');
    // `skapaKvitto` anropades ALDRIG — den databas-constraint
    // (`kvitton_kreditkvitto_har_original`) som annars hade fällt detta med
    // ett rått fel prövas aldrig, för koden fäller FÖRE anropet.
    expect(varld.ledger).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'nummer')).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'mail')).toHaveLength(0);
    expect(varld.rader.get('rad-1')?.status).toBe('fel');
  });

  test('ENTYDIGHETS-GUARDEN [fix-runda 2]: FLERA levande kandidat-kvitton → fäller, INGET bränt nummer, ingen länk till någotdera', async () => {
    // Orkestrerar-beslut under Marcus mandat, 2026-08-31: bevarar beslutets
    // kärna ("aldrig fel länk") utan migration. Två levande kvitton för
    // samma anmälan (avgift `skickat` + slutbetalning `utfardat`, det
    // EXAKTA scenario granskningsfynd runda 1 pekade ut) → koden vägrar
    // gissa vilket som ska krediteras i stället för att tyst ta "senaste".
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-aterbetalning')],
      underlag: { 'inb-aterbetalning': { belopp: -1500, anmalanRecordId: 'recBBBBBBBBBBBBB' } },
      original: { flertydigt: 2 },
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall[0].utfall).toBe('fel');
    expect((utfall[0] as { skal: string }).skal).toContain('flera kvitton');
    expect((utfall[0] as { skal: string }).skal).toContain('2');
    // INTE en länk till NÅGOTDERA kandidat-kvittot — ingen ledger-rad alls,
    // exakt samma disciplin som "inget original hittades"-fallet.
    expect(varld.ledger).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'nummer')).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'mail')).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'pdf')).toHaveLength(0);
    expect(varld.rader.get('rad-1')?.status).toBe('fel');

    // NEGATIV KONTROLL: en regel som bara läste "finns det NÅGOT original"
    // (utan att räkna kandidaterna) hade sett `installning.original` som
    // "satt" och krediterat mot GODTYCKLIGT vilken — precis den gamla
    // "senaste"-buggen. `flertydigt` existerar just för att skilja det
    // läget från `entydigt`.
    const trasigHarNagot = (o: unknown) => o !== null && o !== undefined;
    expect(trasigHarNagot({ flertydigt: 2 })).toBe(true);
    expect(trasigHarNagot({ flertydigt: 2 })).not.toBe(utfall[0].utfall === 'skickat');
  });

  test('positivt belopp: kvittoTyp förblir "kvitto" och ingen hänvisning skrivs — oförändrat beteende', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} }, // default-underlaget har belopp: 2500 (positivt)
      original: { id: 'kvitto-som-ALDRIG-ska-las', kvittonummer: 'MM-2026-9999' },
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall[0].utfall).toBe('skickat');
    expect(varld.ledger[0]).toMatchObject({ typ: 'kvitto', originalKvittoId: null });
    const pdfHandelse = varld.handelser.find((h) => h.typ === 'pdf');
    expect(pdfHandelse).toMatchObject({ dokumenttyp: 'kvitto', hanvisning: null });
  });

  test('ÅTERUPPTAGEN kreditkvitto (halvfärdig ledger-rad, status utfardat) LÄSER DEN PERSISTERADE hänvisningen — räknar aldrig om', async () => {
    // En tidigare körning skapade kreditkvittots ledger-rad (hänvisning till
    // kvitto-original-1) men dog innan mailet gick (samma klass av
    // omkörning som "ETT OSKICKAT befintligt kvitto ÅTERANVÄNDS" ovan).
    //
    // GRANSKNINGSFYND RUNDA 2, W4 — testet DISKRIMINERAR nu, inte bara
    // upprepar: mockens `hittaOriginalKvitto` svarar HÄR ett ANNAT
    // kvitto (`kvitto-NYARE-2`) än det ledger-raden faktiskt pekar på — som
    // om ett nyare kvitto hunnit utfärdas för samma anmälan MELLAN
    // körningarna. Den GAMLA implementationen (omräknar ovillkorat) hade
    // gett hänvisningen "MM-2026-9999"; fixen läser i stället tillbaka
    // "MM-2026-1007" från ledgern, oberoende av vad en omkörd
    // `hittaOriginalKvitto` skulle svara nu.
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-aterbetalning')],
      underlag: { 'inb-aterbetalning': { belopp: -1500, anmalanRecordId: 'recBBBBBBBBBBBBB' } },
      original: { id: 'kvitto-NYARE-2', kvittonummer: 'MM-2026-9999' }, // ska INTE läsas
      ledger: [
        {
          id: 'kredit-halvfardigt',
          inbetalningId: 'inb-aterbetalning',
          ar: 2026,
          lopnummer: 1050,
          status: 'utfardat',
          lagringsnyckel: null,
          mottagare: null,
          typ: 'kreditkvitto',
          originalKvittoId: 'kvitto-original-1',
        },
        // Originalet den halvfärdiga raden FAKTISKT hänvisar till — måste
        // finnas i ledgern så mockens `hittaKvitto` kan slå upp dess nummer
        // (samma väg den skarpa `jobb-konsument`-implementationen går).
        {
          id: 'kvitto-original-1',
          inbetalningId: 'inb-avgift',
          ar: 2026,
          lopnummer: 1007,
          status: 'skickat',
          lagringsnyckel: 'kvitton/2026/MM-2026-1007.pdf',
          mottagare: 'delivered@resend.dev',
        },
      ],
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall).toEqual([{ radId: 'rad-1', utfall: 'skickat', kvittonummer: 'MM-2026-1050' }]);
    expect(varld.handelser.filter((h) => h.typ === 'nummer')).toHaveLength(0);
    const pdfHandelse = varld.handelser.find((h) => h.typ === 'pdf');
    // DEN PERSISTERADE hänvisningen (1007) — INTE mockens `original`-fixture
    // (9999). Det är beviset att koden läser tillbaka i stället för räknar om.
    expect(pdfHandelse).toMatchObject({ dokumenttyp: 'kreditkvitto', hanvisning: 'MM-2026-1007' });
    expect(pdfHandelse).not.toMatchObject({ hanvisning: 'MM-2026-9999' });
  });

  test('ENTYDIGHETS-GUARDEN × W4-fixen samverkar: en återupptagen rad LYCKAS trots att anmälan NU har flera levande kandidater', async () => {
    // Bevisar interaktionen requirement (c) frågar efter: om `forbered()`
    // av misstag anropade `hittaOriginalKvitto` igen vid återupptagning
    // hade DENNA fixture fällt HELA raden som `flertydigt` (3 kandidater)
    // — trots att raden redan har en giltig, persisterad hänvisning som
    // aldrig var tvetydig när den ursprungligen skapades. Testet visar att
    // den interaktionen INTE sker: W4-fixen (läs persisterat, räkna aldrig
    // om) gör att entydighets-guarden aldrig ens konsulteras för en
    // återupptagen rad — de två fixarna samverkar korrekt, ingen av dem
    // åsidosätter den andra.
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-aterbetalning')],
      underlag: { 'inb-aterbetalning': { belopp: -1500, anmalanRecordId: 'recBBBBBBBBBBBBB' } },
      original: { flertydigt: 3 }, // skulle fälla raden OM hittaOriginalKvitto frågades om
      ledger: [
        {
          id: 'kredit-halvfardigt',
          inbetalningId: 'inb-aterbetalning',
          ar: 2026,
          lopnummer: 1050,
          status: 'utfardat',
          lagringsnyckel: null,
          mottagare: null,
          typ: 'kreditkvitto',
          originalKvittoId: 'kvitto-original-1',
        },
        {
          id: 'kvitto-original-1',
          inbetalningId: 'inb-avgift',
          ar: 2026,
          lopnummer: 1007,
          status: 'skickat',
          lagringsnyckel: 'kvitton/2026/MM-2026-1007.pdf',
          mottagare: 'delivered@resend.dev',
        },
      ],
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    // LYCKAS — inte `fel` — trots att `original: { flertydigt: 3 }` hade
    // fällt en NY rad. Det är själva beviset.
    expect(utfall).toEqual([{ radId: 'rad-1', utfall: 'skickat', kvittonummer: 'MM-2026-1050' }]);
    expect(varld.handelser.filter((h) => h.typ === 'nummer')).toHaveLength(0);
    const pdfHandelse = varld.handelser.find((h) => h.typ === 'pdf');
    expect(pdfHandelse).toMatchObject({ dokumenttyp: 'kreditkvitto', hanvisning: 'MM-2026-1007' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 3 — At-least-once: kön får leverera om utan att något händer två gånger
// ═══════════════════════════════════════════════════════════════════════════

test.describe('korKvittobatch — kön är väckning, tabellen är sanning', () => {
  test('en rad i slutstatus hoppas över och meddelandet städas', async () => {
    const varld = byggVarld({
      rader: [{ ...vantandeRad('rad-1', 'inb-1'), status: 'skickat' }],
      underlag: { 'inb-1': {} },
    });

    const utfall = await korKvittobatch([post(7, 'rad-1')], varld.deps);

    expect(utfall[0].utfall).toBe('hoppad');
    expect(varld.handelser.filter((h) => h.typ === 'mail')).toHaveLength(0);
    expect(varld.handelser.filter((h) => h.typ === 'stadning')).toHaveLength(1);
  });

  test('en `pagar`-rad lämnas ORÖRD — meddelandet städas INTE', async () => {
    // Någon annan körning håller raden. Meddelandet ska komma tillbaka via
    // synlighetstimeouten, och står raden kvar för länge tar självläkningen
    // den. Att städa meddelandet här hade gjort raden osynlig för kön.
    const varld = byggVarld({
      rader: [{ ...vantandeRad('rad-1', 'inb-1'), status: 'pagar', paborjadNar: NU }],
      underlag: { 'inb-1': {} },
    });

    const utfall = await korKvittobatch([post(3, 'rad-1')], varld.deps);

    expect(utfall[0].utfall).toBe('hoppad');
    expect(varld.handelser.filter((h) => h.typ === 'stadning')).toHaveLength(0);
    expect(varld.rader.get('rad-1')?.status).toBe('pagar');
    // REGEL 1 PRÖVAS FÖRE CLAIMEN: raden ska inte ens FÖRSÖKAS claimas.
    // Utan denna rad maskeras en trasig `farPlockas` av den villkorade
    // claimen — mätt, se `markeraPagar` i testvärlden ovan.
    expect(varld.claimForsok).toHaveLength(0);
  });

  test('en rad som INTE finns städas ur kön (föräldralöst meddelande)', async () => {
    const varld = byggVarld({ rader: [], underlag: {} });
    const utfall = await korKvittobatch([post(5, 'rad-borta')], varld.deps);
    expect(utfall[0].utfall).toBe('hoppad');
    expect(varld.handelser.filter((h) => h.typ === 'stadning')).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 4 — Fel bär skäl, och fäller aldrig batchen
// ═══════════════════════════════════════════════════════════════════════════

test.describe('korKvittobatch — fel', () => {
  test('ett avvisat mail ger `fel` med skäl, och ledger-raden står kvar OSKICKAD', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
      avvisaMailFor: ['inb-1'],
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall[0]).toEqual({
      radId: 'rad-1',
      utfall: 'fel',
      skal: 'Resend avvisade adressen.',
    });
    expect(varld.rader.get('rad-1')?.skal).toBe('Resend avvisade adressen.');
    // Numret är brunnet men raden består — en omkörning återanvänder den.
    expect(varld.ledger[0].status).toBe('utfardat');
    expect(varld.handelser.filter((h) => h.typ === 'finalisering')).toHaveLength(0);
  });

  test('ETT FEL PÅ EN RAD FÄLLER ALDRIG DE ÖVRIGA', async () => {
    const varld = byggVarld({
      rader: [
        vantandeRad('rad-1', 'inb-1'),
        vantandeRad('rad-2', 'inb-2'),
        vantandeRad('rad-3', 'inb-3'),
      ],
      underlag: { 'inb-1': {}, 'inb-2': {}, 'inb-3': {} },
      fallPdfFor: ['inb-2'],
    });

    const utfall = await korKvittobatch(
      [post(1, 'rad-1'), post(2, 'rad-2'), post(3, 'rad-3')],
      varld.deps,
    );

    const perRad = new Map(utfall.map((rad) => [rad.radId, rad.utfall]));
    expect(perRad.get('rad-1')).toBe('skickat');
    expect(perRad.get('rad-2')).toBe('fel');
    expect(perRad.get('rad-3')).toBe('skickat');
  });

  test('saknad e-postadress ger ett skäl Lotta kan läsa, inte ett stacktrace', async () => {
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': { email: '' } },
    });
    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);
    expect(utfall[0].utfall).toBe('fel');
    expect((utfall[0] as { skal: string }).skal).toContain('saknar e-postadress');
  });

  test('ett SPEGEL-fel fäller INTE det redan skickade kvittot', async () => {
    // Mailet är skickat och ledgern finaliserad. Ett Airtable-fel får inte
    // göra ett fullbordat kvitto till ett `fel` Lotta försöker skicka om —
    // spegeln är en projektion, aldrig sanningen (ADR-128 beslut 6).
    const varld = byggVarld({
      rader: [vantandeRad('rad-1', 'inb-1')],
      underlag: { 'inb-1': {} },
      fallSpegel: true,
    });

    const utfall = await korKvittobatch([post(1, 'rad-1')], varld.deps);

    expect(utfall[0].utfall).toBe('skickat');
    expect(varld.rader.get('rad-1')?.status).toBe('skickat');
    expect(varld.ledger[0].status).toBe('skickat');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 5 — Begränsad parallellism mot PDF-tjänsten (ADR-129 beslut 10)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('korKvittobatch — PDF-parallellism', () => {
  test(`aldrig fler än ${PDF_SAMTIDIGHETSTAK} PDF:er samtidigt`, async () => {
    const varld = byggVarld({
      rader: Array.from({ length: 6 }, (_, i) => vantandeRad(`rad-${i}`, `inb-${i}`)),
      underlag: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`inb-${i}`, {}])),
      pdfFordrojningMs: 5,
    });

    await korKvittobatch(
      Array.from({ length: 6 }, (_, i) => post(i, `rad-${i}`)),
      varld.deps,
    );

    expect(varld.maxSamtidigPdf).toBeLessThanOrEqual(PDF_SAMTIDIGHETSTAK);
  });

  test('taket är en NAMNGIVEN konstant, inte en tillfällighet', () => {
    // ADR-129 beslut 10 kräver "taket som en namngiven konstant och inte en
    // tillfällighet". Att testet läser konstanten i stället för ett hårdkodat
    // tal är hela skillnaden.
    expect(PDF_SAMTIDIGHETSTAK).toBeGreaterThan(0);
    expect(Number.isInteger(PDF_SAMTIDIGHETSTAK)).toBe(true);
  });

  test('NEGATIV KONTROLL: en obegränsad Promise.all hade kört alla sex samtidigt', async () => {
    let samtidiga = 0;
    let max = 0;
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        samtidiga += 1;
        max = Math.max(max, samtidiga);
        await new Promise((klar) => setTimeout(klar, 5));
        samtidiga -= 1;
      }),
    );
    expect(max).toBe(6);
    expect(max).toBeGreaterThan(PDF_SAMTIDIGHETSTAK);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 6 — Lagringsnyckelns form
// ═══════════════════════════════════════════════════════════════════════════

test.describe('kvittoLagringsnyckel', () => {
  test('kvitton/<år>/<nummer>.pdf', () => {
    expect(kvittoLagringsnyckel(2026, 'MM-2026-1003')).toBe('kvitton/2026/MM-2026-1003.pdf');
  });

  test('året i sökvägen kommer ur SERIEN, inte ur kvittonumrets text', () => {
    // De sammanfaller normalt. Att båda skickas in separat gör att en
    // framtida serie-ändring inte tyst kan flytta filer till fel mapp.
    expect(kvittoLagringsnyckel(2027, 'MM-2026-1003')).toBe('kvitton/2027/MM-2026-1003.pdf');
  });
});
