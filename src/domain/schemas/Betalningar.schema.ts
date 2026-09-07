import { z } from 'zod';

/**
 * [TASK-346.4, ADR-128/ADR-129] Betalningsdomänens klient-kontrakt:
 * inbetalningen, kvittot och kvittojobbet.
 *
 * VAR SANNINGEN BOR: inbetalningar, kvittoledger och jobbtabeller ligger i
 * Supabase Postgres (ADR-128 beslut 3), inte i Airtable. Airtable-basen är
 * fortsatt sanning för anmälan, event och priser, och bär en app-skriven
 * SPEGEL av summan (ADR-128 beslut 5). Ingen typ i denna fil läser pengar ur
 * spegeln; spegeln finns för basens egna konsumenter.
 *
 * VÄGEN: UI till adapterport till Edge Function till Postgres. Exakt samma
 * form som aktivitetsloggen redan bär (ADR-110), av samma skäl: klienten når
 * aldrig `service_role`, och RLS ger `authenticated` enbart SELECT
 * (ADR-128 beslut 3 som det står efter § Updates 2026-08-30).
 *
 * TAL, INTE STRÄNGAR: kolumnerna är `numeric(12,2)` och levereras av
 * PostgREST som STRÄNGAR (migrationens § KONSUMENT-VARNING). Konverteringen
 * sker EN gång, i Edge Function-lagret, så att varje konsument av dessa typer
 * får riktiga tal. Skulle en EF någon gång missa det faller `.parse()` här
 * vid systemgränsen — vilket är precis vad ett schema vid gränsen är till för.
 */

/**
 * Betalsätten. FYRA, inte tre: `Historik` tillkommer för
 * betalnings-backfillen (ADR-128 beslut 8) och är aldrig valbart i
 * formuläret.
 *
 * MEDVETET SKILT FRÅN `BETALSATT_VARDEN` i `SendReceipt.schema.ts` (Swish,
 * Bankgiro, Plusgiro). Den listan är den GAMLA kvittovägens, som skriver
 * Airtable-fältet `Kvitton.Betalsätt`; denna är inbetalningens, som skriver
 * Postgres-kolumnen `inbetalningar.betalsatt` och vars tillåtna värden
 * bestäms av check-constrainten `inbetalningar_betalsatt_varden`. Att slå
 * ihop dem hade knutit två oberoende scheman till varandra.
 */
export const INBETALNING_BETALSATT = ['Swish', 'Bankgiro', 'Plusgiro', 'Historik'] as const;
export type InbetalningBetalsatt = (typeof INBETALNING_BETALSATT)[number];

/** Betalsätten Lotta faktiskt VÄLJER. `Historik` sätts bara av backfillen. */
export const VALBARA_BETALSATT = ['Swish', 'Bankgiro', 'Plusgiro'] as const;

export const InbetalningsTypSchema = z.enum(['inbetalning', 'aterbetalning']);
export type InbetalningsTyp = z.infer<typeof InbetalningsTypSchema>;

export const InbetalningsStatusSchema = z.enum(['aktiv', 'makulerad']);
export type InbetalningsStatus = z.infer<typeof InbetalningsStatusSchema>;

/**
 * EN inbetalning. Speglar `public.inbetalningar` kolumn för kolumn, men i
 * camelCase.
 *
 * ÖGONBLICKSBILDEN ÄR INTE REDUNDANS utan verifikationskravet (ADR-128
 * beslut 1): en bokföringspost måste kunna läsas ensam, år efter att anmälan
 * ändrats eller tagits bort.
 */
export const InbetalningSchema = z.object({
  id: z.string().uuid(),
  anmalanRecordId: z.string(),
  ogonblicksbildNamn: z.string(),
  ogonblicksbildEvent: z.string(),
  ogonblicksbildEventdatum: z.string().nullable(),
  /** Kronor. Negativt för en återbetalning. */
  belopp: z.number(),
  betalsatt: z.enum(INBETALNING_BETALSATT),
  betalningsdatum: z.string().nullable(),
  typ: InbetalningsTypSchema,
  status: InbetalningsStatusSchema,
  makuleradSkal: z.string().nullable(),
  makuleradNar: z.string().nullable(),
  bankreferens: z.string().nullable(),
  kvittoId: z.string().uuid().nullable(),
  /**
   * Lottas fria anteckning om DENNA inbetalning (Marcus 2026-09-01). Frivillig.
   *
   * `.default(null)` OCH INTE BARA `.nullable()` — och skillnaden är
   * lastbärande. `.nullable()` ensamt kräver att nyckeln FINNS i svaret;
   * saknas den kastar `RegistreraInbetalningResultSchema.parse` och hela
   * registreringen ser ut att ha misslyckats för Lotta trots att raden ligger
   * i Postgres. Med `.default(null)` tolereras ett svar från en Edge Function
   * som ännu inte deployats med noteringsstödet: fältet blir `null`, allt
   * annat fungerar exakt som förut.
   *
   * Detta är alltså inte defensiv kod "ifall" — det är fönstret mellan att
   * denna commit finns och att migration + EF-deploy landat i miljön. När
   * bägge landat är defaulten aldrig aktiv, och den kostar ingenting att
   * lämna kvar som skydd vid en framtida rollback av EF-lagret.
   */
  notering: z.string().nullable().default(null),
  skapadAv: z.string(),
  skapadNar: z.string(),
});
export type Inbetalning = z.infer<typeof InbetalningSchema>;

export const KvittoStatusSchema = z.enum(['utfardat', 'skickat', 'makulerat']);

/** EN ledger-rad. `kvittonummer` är en GENERERAD kolumn och kan aldrig skrivas. */
export const KvittoSchema = z.object({
  id: z.string().uuid(),
  kvittonummer: z.string(),
  ar: z.number().int(),
  lopnummer: z.number().int(),
  inbetalningId: z.string().uuid(),
  lagringsnyckel: z.string().nullable(),
  skickadNar: z.string().nullable(),
  mottagare: z.string().nullable(),
  typ: z.enum(['kvitto', 'kreditkvitto']),
  originalKvittoId: z.string().uuid().nullable(),
  status: KvittoStatusSchema,
  skapadNar: z.string(),
});
export type Kvitto = z.infer<typeof KvittoSchema>;

export const JobbRadStatusSchema = z.enum(['vantar', 'pagar', 'skickat', 'fel']);
export type JobbRadStatus = z.infer<typeof JobbRadStatusSchema>;

/**
 * EN jobbrad. Radens tillstånd är SANNINGEN om arbetet; kön är bara
 * transport (ADR-129 beslut 2). `skal` bär felet i klartext, för Lotta.
 */
export const JobbRadSchema = z.object({
  id: z.string().uuid(),
  jobbId: z.string().uuid(),
  jobbtyp: z.string(),
  objektId: z.string().uuid(),
  status: JobbRadStatusSchema,
  skal: z.string().nullable(),
  forsok: z.number().int(),
  skapadNar: z.string(),
  paborjadNar: z.string().nullable(),
  avslutadNar: z.string().nullable(),
  uppdateradNar: z.string(),
  /** Kvittonumret när raden hunnit få ett. Läses ur ledgern, inte ur jobbet. */
  kvittonummer: z.string().nullable(),
});
export type JobbRad = z.infer<typeof JobbRadSchema>;

/** Jobbet = EN batch, ett klick ("Skicka 8 kvitton"). */
export const JobbSchema = z.object({
  id: z.string().uuid(),
  jobbtyp: z.string(),
  status: z.enum(['oppet', 'avslutat']),
  skapadAv: z.string(),
  skapadNar: z.string(),
  avslutadNar: z.string().nullable(),
});
export type Jobb = z.infer<typeof JobbSchema>;

/** Jobbets läge med sina rader — vad Hem och inkorgen visar. */
export const JobbstatusSchema = z.object({
  jobb: JobbSchema.nullable(),
  rader: z.array(JobbRadSchema),
  sammanfattning: z.object({
    totalt: z.number().int(),
    skickade: z.number().int(),
    fel: z.number().int(),
    kvar: z.number().int(),
  }),
});
export type Jobbstatus = z.infer<typeof JobbstatusSchema>;

/**
 * EN öppen betalning i inkorgen. Härledd ur BASEN (anmälan, event, pris,
 * `Saknas (kr)`) plus Postgres-summan — inte ur en enda källa.
 *
 * `saknas` kommer ur Airtable-formeln `Saknas (kr)`, alltså ur SPEGELN, och
 * är därför precis så färsk som spegeln är (ADR-128 § Konsekvenser: "så länge
 * `Saknas (kr)` är en Airtable-formel över spegelvärden är den lika färsk som
 * spegeln, aldrig färskare"). `summaInbetalt` kommer ur POSTGRES och är
 * alltid sann. Skiljer de två sig har spegelskrivningen släpat efter, och
 * `spegelIFas` säger det rakt ut i stället för att dölja det.
 */
export const OppenBetalningSchema = z.object({
  anmalanRecordId: z.string(),
  personNamn: z.string(),
  personEpost: z.string().nullable(),
  personTelefon: z.string().nullable(),
  eventId: z.string().nullable(),
  eventNamn: z.string().nullable(),
  eventStartdatum: z.string().nullable(),
  eventTyp: z.string().nullable(),
  anmalanStatus: z.string().nullable(),
  /** Kronor som fattas enligt basen. Kan vara negativt vid överbetalning. */
  saknas: z.number().nullable(),
  /** Priset som gäller (avtalat pris vinner). */
  gallandePris: z.number().nullable(),
  anmalningsavgift: z.number().nullable(),
  /** Summan av AKTIVA inbetalningar i Postgres. Sanningen. */
  summaInbetalt: z.number(),
  /** Basens spegelvärde. Skiljer det sig från `summaInbetalt` släpar spegeln. */
  summaInbetaltSpegel: z.number().nullable(),
  spegelIFas: z.boolean(),
  /** Slutbetalningens deadline ur basen — grunden för "förfallen". */
  deadlineSlutbetalning: z.string().nullable(),
  /** Antal kvitton som väntar på att skickas för denna anmälan. */
  kvittonAttSkicka: z.number().int(),
  /**
   * [TASK-367] Aktiva inbetalningar för DENNA anmälan som saknar `kvitto_id`
   * OCH saknar en köad/pågående jobbrad (`vantar`/`pagar`) — härlett i
   * Postgres, VARJE hämtning, oberoende av flikens minne. Tomt array = inget
   * kvitto att skicka. `belopp` är DEN ENSKILDA inbetalningens belopp (inte
   * anmälans `summaInbetalt`), eftersom en anmälan kan bära flera
   * inbetalningar som var för sig behöver ett eget kvitto.
   *
   * SKILD FRÅN `kvittonAttSkicka` OVAN (ETT TAL, redan köat) — namnen är
   * medvetet olika (singular kontra plural-med-n) för att inte glida ihop:
   * `kvittonAttSkicka` räknar det Lotta REDAN tryckt på och som jobbmotorn
   * arbetar av; `oskickadeKvitton` är det som ÅTERSTÅR att köa. Se
   * `hamta-oppna-betalningar/index.ts` § "KVITTO ATT SKICKA" för
   * härledningen och S115 Del 2 för fyndet.
   *
   * `.default([])` ÄR AVSIKTLIGT, INTE EN GENVÄG: repots
   * `page.route`-mockade e2e-svit (`betalningar-inkorg-*.staging.test.ts`
   * m.fl.) bygger sina svar för hand, fält för fält, och känner INTE till
   * detta nya fält. Utan defaulten fäller `OppnaBetalningarSchema.parse()`
   * (`betalningsportar.ts`) VARJE sådant test med ett ZodError, trots att
   * inget av dem testar just detta fält — en bakåtkompatibilitets-brytning
   * som inte hör hemma i en `TASK-367`-fix. Med defaulten tolkas en saknad
   * nyckel som "inget att skicka", exakt det EF:en själv svarar för en rad
   * utan kandidater.
   */
  oskickadeKvitton: z
    .array(
      z.object({
        inbetalningId: z.string(),
        belopp: z.number(),
      }),
    )
    .default([]),
});
export type OppenBetalning = z.infer<typeof OppenBetalningSchema>;
export type OskickatKvitto = OppenBetalning['oskickadeKvitton'][number];

export const OppnaBetalningarSchema = z.object({
  betalningar: z.array(OppenBetalningSchema),
  /** Hur många av posterna som är förfallna (deadline passerad). */
  forfallna: z.number().int(),
});
export type OppnaBetalningar = z.infer<typeof OppnaBetalningarSchema>;

/**
 * Spegelns utfall för EN skrivning. ADR-128 beslut 5: "Spegeln skrivs i samma
 * operation som inbetalningen, med omförsök. Eftersläpning kan uppstå (P2:
 * ingen transaktion över två system) och SYNS I APPEN i stället för att
 * tystas."
 *
 * Detta är den synligheten. `skrivet: false` betyder att Postgres-raden
 * finns men basen inte hunnit med — inbetalningen är alltså registrerad,
 * och det är spegeln som släpar.
 */
export const SpegelUtfallSchema = z.object({
  skrivet: z.boolean(),
  forsok: z.number().int(),
  skal: z.string().nullable(),
});
export type SpegelUtfall = z.infer<typeof SpegelUtfallSchema>;

/**
 * Registreringens write-shape. Belopp skickas som STRÄNG, precis som Lotta
 * skrev det, och normaliseras SERVER-SIDE (`_shared/betalningsbelopp.ts`).
 *
 * Att skicka en redan parsad `number` hade flyttat den mest felbenägna
 * tolkningen till klienten och gjort den omöjlig att bevisa hermetiskt på
 * servern — och `Number('1e3')` ger 1000 utan att någon märker det.
 */
export type RegistreraInbetalningInput = {
  anmalanRecordId: string;
  /** Rå inmatning: '2 500,00', '2500,50', '1000:-'. Normaliseras på servern. */
  belopp: string;
  betalsatt: (typeof VALBARA_BETALSATT)[number];
  /**
   * [TASK-367 review runda 1, FYND 2] "Skicka kvitto"-kryssrutan
   * (`RegistreraForm.tsx`). Servern skriver `kvitto_avbojt = !medKvitto` på
   * inbetalningen (migration `20260906165100_inbetalning_kvitto_avbojt.sql`)
   * — den durabla "kvitto att skicka"-härledningen (`hamta-oppna-
   * betalningar`) läser den flaggan för att aldrig återuppliva en betalning
   * Lotta MEDVETET registrerade utan kvitto. OBLIGATORISKT (inte `?:`) med
   * avsikt: ett valfritt fält hade kunnat glömmas av en ANNAN anropskälla än
   * `RegistreraForm.tsx` utan att TypeScript sa ifrån — exakt den tysta
   * glidningen som gjorde fältet nödvändigt att lägga till i första läget.
   */
  medKvitto: boolean;
  /** ISO-datum (YYYY-MM-DD). Utelämnat = i dag, satt server-side. */
  betalningsdatum?: string;
  typ?: InbetalningsTyp;
  /** Bankens referens vid import — dubblettnyckeln. */
  bankreferens?: string;
  /** Frivilligt avtalat pris att sätta på anmälan i samma operation. */
  avtalatPris?: string;
  /**
   * Lottas fria anteckning om inbetalningen (Marcus 2026-09-01). Frivillig.
   * Rå text — servern trimmar, gör tomt till NULL och fäller över 500 tecken
   * (`_shared/inbetalning-notering.ts` § `lasNotering`). Utelämnad = ingen notering,
   * vilket är byte för byte samma rad som före fältet fanns.
   */
  notering?: string;
};

export const RegistreraInbetalningResultSchema = z.object({
  inbetalning: InbetalningSchema,
  harledning: z.object({
    summa: z.number(),
    gallandePris: z.number().nullable(),
    saknas: z.number().nullable(),
    avgiftKlar: z.boolean(),
    alltKlart: z.boolean(),
    arForelasning: z.boolean(),
  }),
  spegel: SpegelUtfallSchema,
});
export type RegistreraInbetalningResult = z.infer<typeof RegistreraInbetalningResultSchema>;

/** Radera (före kvitto) eller makulera (efter). Skälet KRÄVS vid makulering. */
export type HanteraInbetalningInput =
  | { atgard: 'radera'; inbetalningId: string }
  | { atgard: 'makulera'; inbetalningId: string; skal: string };

export const HanteraInbetalningResultSchema = z.object({
  atgard: z.enum(['radera', 'makulera']),
  inbetalningId: z.string().uuid(),
  harledning: z.object({
    summa: z.number(),
    gallandePris: z.number().nullable(),
    saknas: z.number().nullable(),
    avgiftKlar: z.boolean(),
    alltKlart: z.boolean(),
    arForelasning: z.boolean(),
  }),
  spegel: SpegelUtfallSchema,
});
export type HanteraInbetalningResult = z.infer<typeof HanteraInbetalningResultSchema>;

/** Inbetalningarna för EN anmälan eller EN person, med spegelns färskhet. */
export const InbetalningslistaSchema = z.object({
  inbetalningar: z.array(InbetalningSchema),
  kvitton: z.array(KvittoSchema),
  /**
   * [TASK-352] Senaste kvittojobbets FELSKÄL, per inbetalning — bara för de
   * inbetalningar vars SENASTE jobbrad (`jobb_rad`, `jobbtyp = 'kvitto'`)
   * faktiskt fallerade. En lyckad omkörning gör att raden försvinner
   * härifrån: det är den SENASTE jobbraden som räknas, inte historiken (se
   * `hamta-inbetalningar/index.ts` § SENASTE KVITTOJOBBETS FELSKÄL).
   *
   * Mätt fynd, S113-slutvandringen 2026-08-31: `jobb_rad.skal` bar redan ett
   * Gunilla-klart felskäl (t.ex. entydighets-guardens
   * "Anmälan har flera kvitton som skulle kunna vara originalet") men nådde
   * aldrig klienten via denna port — raden visade tyst "Inget kvitto".
   */
  jobbfel: z.array(z.object({ inbetalningId: z.string().uuid(), skal: z.string() })),
  spegel: z.object({
    summaPostgres: z.number(),
    summaBasen: z.number().nullable(),
    iFas: z.boolean(),
  }),
});
export type Inbetalningslista = z.infer<typeof InbetalningslistaSchema>;

/** "Skicka N kvitton" — ETT klick, ETT jobb, N rader. */
export type KoaKvittonInput = { inbetalningIds: string[] };

export const KoaKvittonResultSchema = z.object({
  /**
   * `null` när INGEN post var köbar (alla redan skickade, makulerade eller
   * redan i kön). Inget tomt jobb skapas då: ett jobb utan rader hade legat
   * kvar som `oppet` för alltid och gjort Hem-kortets räknare fel.
   */
  jobbId: z.string().uuid().nullable(),
  /** Rader som faktiskt köades. */
  koade: z.number().int(),
  /**
   * Inbetalningar som HOPPADES ÖVER med skäl — redan kvitterade, redan i kö,
   * eller makulerade. Aldrig tyst: ett halvt utfall får inte se helt ut.
   */
  hoppade: z.array(z.object({ inbetalningId: z.string().uuid(), skal: z.string() })),
  /** Om kicken (`EdgeRuntime.waitUntil`) startades. Optimering, aldrig garanti. */
  kickad: z.boolean(),
});
export type KoaKvittonResult = z.infer<typeof KoaKvittonResultSchema>;

/** Signerad, tidsbegränsad länk till kvittots PDF i den privata bucketen. */
export const KvittolankSchema = z.object({
  url: z.string().url(),
  utgar: z.string(),
  kvittonummer: z.string(),
});
export type Kvittolank = z.infer<typeof KvittolankSchema>;

/**
 * "Skicka igen" — SAMMA PDF, SAMMA nummer, valfri annan adress
 * (PRD berättelse 12 och 13). Ett nytt nummer hade gjort kvittot till ett
 * ANNAT kvitto, och verifikationskedjan hos Roger bygger på att det inte gör
 * det.
 */
export type SkickaKvittoIgenInput = {
  kvittoId: string;
  /** Utelämnad = originalets mottagare. */
  mottagare?: string;
};

export const SkickaKvittoIgenResultSchema = z.object({
  status: z.enum(['skickat', 'fel']),
  kvittonummer: z.string(),
  mottagare: z.string().nullable(),
  skal: z.string().nullable(),
});
export type SkickaKvittoIgenResult = z.infer<typeof SkickaKvittoIgenResultSchema>;
