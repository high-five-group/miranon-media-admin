// scripts/lib/review-metrics.mjs — instrumenteringens LOGIK (TASK-173.6,
// ADR-105 § Konsekvenser: "Fångstrate-instrumenteringen är en del av BYGGET,
// inte ett tillägg").
//
// ═══ VAD DETTA ÄR ═══
// Den rena halvan av instrumenteringsytan: schema för loggradernas TVÅ
// typer, radbyggning ur redan validerad indata, JSONL-parsning, och
// summering till statistik. Ingen I/O här — samma lager-snitt som
// scripts/lib/review-loop.mjs (logik) mot scripts/review-loop-beslut.mjs
// (I/O + CLI). Append/läsning av själva loggfilen bor i CLI-lagren:
//   scripts/review-loop-beslut.mjs        appendar EN "korning"-rad per
//                                          körning (se dess §
//                                          INSTRUMENTERING)
//   scripts/review-metrics-kalibrering.mjs appendar EN "kalibrering"-rad
//                                          per Marcus-fångst
//   scripts/review-metrics.mjs             läser + summerar hela loggen
//
// ═══ BRANSCHENS EGET MÖNSTER: MÄT GRINDEN, INTE BARA GRINDVAKTEN ═══
// CodeRabbit, Danger.js och reviewdog bokför alla sina fynd som en
// STRUKTURERAD, maskinläsbar logg per granskningskörning (findings-JSON/
// SARIF) i stället för att bara rendera dem i en PR-kommentar och slänga
// underlaget — annars går det aldrig att i efterhand fråga "fångar grinden
// det den ska?". Samma disciplin som SRE-praxisen "measure the gate, not
// just the gatekeeper": en kvalitetsgrind som inte mäter sin EGEN
// träffsäkerhet kan inte skiljas från teater. Det är precis frågan ADR-105 §
// Konsekvenser ställer om review-grinden (C.4-2-sekvensen: mät före
// ribb-flytt) — den här modulen är svaret i kod.
//
// ═══ VARFÖR EN JSONL-FIL, INTE EN DATABAS ═══
// Samma val som scripts/flake-matserie.mjs gör för `resultat.jsonl`: en rad
// per händelse, denormaliserad, `git`-spårbar och `jq`-summerbar utan
// specialverktyg (AC #3). Precedens i repot: `.claude/hook-fallningar.jsonl`
// (en rad per hook-fällning, `jq`-summerbar). Två exempel-endradare som
// fungerar UTAN detta bibliotek eller `npm run review:metrics`:
//
//   jq -s 'map(select(.typ=="korning")) | group_by(.risk.niva) |
//          map({niva: .[0].risk.niva, n: length})' \
//     docs/reference/review-instrumentering.jsonl
//
//   jq -s 'map(select(.typ=="kalibrering"))' \
//     docs/reference/review-instrumentering.jsonl
//
// ═══ VARFÖR TVÅ RADTYPER I SAMMA FIL, INTE TVÅ FILER ═══
// `typ`-fältet diskriminerar. Samma append-punkt-motiv som gjorde
// ADR-105 beslut 4 låsa findings-per-runda och risk-kalibrering till SAMMA
// åtagande ("loggas från dag ett") — de besvarar samma fråga (fångar
// grinden det Marcus fångar?) och en läsare som vill re-derivera
// fångstraten (AC #3) ska inte behöva känna till två filnamn.
//
// ═══ EN RAD PER ANROP, MEDVETET INGEN DEDUPLICERING ═══
// Körs `review-loop-beslut.mjs` två gånger mot samma runda (t.ex. en
// orkestrerare som kontrollerar om ett beslut redan fattats) loggas TVÅ
// rader. Det är bokstavligt vad CLAUDE.md § Review-grinden ber om ("en rad
// per körning"), och en dedupliceringsregel (senaste rad per
// prNummer+granskadSha+runda vinner) är precis den typ av spekulativ
// komplexitet den dubbelriktade över-engineering-vakten avvisar innan en
// verklig konsument visat att dubbletter stör en analys. `summera()` räknar
// råa rader; en framtida dedup-regel läggs till HÄR, mot mätdata, om den
// någonsin behövs.
//
// Testfil: scripts/test-review-metrics.mjs (rena funktioner, fixtur-data).

import { z } from 'zod';
import { cell } from './review-risk-sektion.mjs';

/** Loggformatets egen version — bumpas vid en BRYTANDE formändring så en
 * framtida läsare kan skilja "gammal rad, okänt format" från "trasig rad". */
export const METRIK_LOGG_VERSION = 1;

/** Filnamnet, repo-relativt. Exporterad så CLI-lagren aldrig har var sin
 * sträng-kopia som kan glida isär (samma disciplin som LOOP_POLICY_FIL i
 * scripts/lib/review-loop.mjs). */
export const METRIK_LOGG_FIL = 'docs/reference/review-instrumentering.jsonl';

const RiskNiva = z.enum(['lag', 'medel', 'hog']);
const Beslut = z.enum([
  'konvergerad',
  'ny-runda',
  'eskalera-tak',
  'eskalera-risk',
  'eskalera-ask-user',
  'eskalera-ingen-andring',
]);

const FyndPerSeverity = z.strictObject({
  error: z.number().int().nonnegative(),
  warning: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
});

/** En rad per granskningskörning (AC #1) — byggs ur ETT redan validerat
 * utlåtande (scripts/lib/review-utlatande.mjs) + dess loop-beslut
 * (scripts/lib/review-loop.mjs `beslutaNastaSteg`). */
const KorningRad = z.strictObject({
  typ: z.literal('korning'),
  loggVersion: z.literal(METRIK_LOGG_VERSION),
  tidsstampel: z.string().datetime(),
  prNummer: z.number().int().positive(),
  kortId: z.string().min(1).nullable(),
  granskadSha: z.string().min(7),
  runda: z.number().int().positive(),
  beslut: Beslut,
  armeringTillaten: z.boolean(),
  risk: z.strictObject({ niva: RiskNiva, motivering: z.string() }),
  fyndPerSeverity: FyndPerSeverity,
  blockerandeAntal: z.number().int().nonnegative(),
  oppnaAntal: z.number().int().nonnegative(),
  tillByggAntal: z.number().int().nonnegative(),
  tillMarcusAntal: z.number().int().nonnegative(),
  /** Speglar utlåtandets policySha/policyRegler (173.2) — underlag för
   * D0-undantagets omprövning (AC #2): en körning utan matchande regler
   * (`policyRegelAntal: 0`) visar att path-policyn inte gav något till DEN
   * granskningen. */
  policySha: z.string().min(7).nullable(),
  policyRegelAntal: z.number().int().nonnegative(),
});

/** En rad per risk-kalibreringspost (AC #2) — bokförs manuellt via
 * `npm run review:kalibrering` när Marcus fångar något en granskning
 * missade eller stämplade fel. `stampladRisk: null` betyder att INGEN
 * granskningskörning föregick fångsten (t.ex. en D0-undantagen PR) — det är
 * signalen för D0-undantagets omprövning, skild från en LÅG-stämplad
 * grind-miss. */
const KalibreringRad = z.strictObject({
  typ: z.literal('kalibrering'),
  loggVersion: z.literal(METRIK_LOGG_VERSION),
  tidsstampel: z.string().datetime(),
  prNummer: z.number().int().positive(),
  kortId: z.string().min(1).nullable(),
  stampladRisk: RiskNiva.nullable(),
  fangst: z.string().min(1),
  kalla: z.string().min(1),
});

/** Diskriminerad union på `typ` — en okänd/felstavad typ FÄLLER i stället
 * för att tolkas som en av de två kända (samma `additionalProperties: false`
 * -disciplin som scripts/lib/review-utlatande.mjs). */
export const LoggRadSchema = z.discriminatedUnion('typ', [KorningRad, KalibreringRad]);

function zodFelTillSträngar(error) {
  return error.issues.map((issue) => `${issue.path.join('.') || '(rot)'}: ${issue.message}`);
}

/**
 * Bygger och validerar en "korning"-rad ur ett VALIDERAT utlåtande
 * (`valideraUtlatande(raw).data`) + dess loop-beslut
 * (`beslutaNastaSteg(...)`s returvärde). Ren funktion — ingen klocka läses
 * här, `tidsstampel` ges av anroparen så testerna är deterministiska.
 *
 * @param {object} args
 * @param {object} args.utlatande  Ett VALIDERAT review-utlåtande.
 * @param {object} args.beslut     `beslutaNastaSteg(...)`s returvärde för SAMMA utlåtande.
 * @param {string} args.tidsstampel  ISO 8601.
 * @returns {{ok: true, data: object, errors: []} | {ok: false, data: null, errors: string[]}}
 */
export function byggKorningRad({ utlatande: u, beslut: b, tidsstampel }) {
  const fyndPerSeverity = { error: 0, warning: 0, info: 0 };
  for (const f of u.fynd) fyndPerSeverity[f.severity] += 1;

  const kandidat = {
    typ: 'korning',
    loggVersion: METRIK_LOGG_VERSION,
    tidsstampel,
    prNummer: u.prNummer,
    kortId: u.kortId,
    granskadSha: u.granskadSha,
    runda: u.runda,
    beslut: b.beslut,
    armeringTillaten: b.armeringTillaten,
    risk: { niva: u.risk.niva, motivering: u.risk.motivering },
    fyndPerSeverity,
    blockerandeAntal: b.blockerande.length,
    oppnaAntal: b.oppna.length,
    tillByggAntal: b.tillBygg.length,
    tillMarcusAntal: b.tillMarcus.length,
    policySha: u.policySha,
    policyRegelAntal: u.policyRegler.length,
  };
  const parsed = KorningRad.safeParse(kandidat);
  if (!parsed.success) return { ok: false, data: null, errors: zodFelTillSträngar(parsed.error) };
  return { ok: true, data: parsed.data, errors: [] };
}

/**
 * Bygger och validerar en "kalibrering"-rad. Ren funktion — samma
 * `tidsstampel`-disciplin som `byggKorningRad`.
 *
 * @param {object} args
 * @param {number} args.prNummer
 * @param {string|null} [args.kortId]
 * @param {'lag'|'medel'|'hog'|null} [args.stampladRisk]
 * @param {string} args.fangst   Fri text: vad Marcus fångade och varför grinden missade det.
 * @param {string} args.kalla    Vem som bokför posten (t.ex. git-identitet).
 * @param {string} args.tidsstampel  ISO 8601.
 * @returns {{ok: true, data: object, errors: []} | {ok: false, data: null, errors: string[]}}
 */
export function byggKalibreringRad({
  prNummer,
  kortId = null,
  stampladRisk = null,
  fangst,
  kalla,
  tidsstampel,
}) {
  const kandidat = {
    typ: 'kalibrering',
    loggVersion: METRIK_LOGG_VERSION,
    tidsstampel,
    prNummer,
    kortId,
    stampladRisk,
    fangst,
    kalla,
  };
  const parsed = KalibreringRad.safeParse(kandidat);
  if (!parsed.success) return { ok: false, data: null, errors: zodFelTillSträngar(parsed.error) };
  return { ok: true, data: parsed.data, errors: [] };
}

/**
 * Parsar JSONL-text till validerade rader. En trasig rad (ogiltig JSON eller
 * schema-brott) hamnar i `fel` med sitt radnummer — den stoppar ALDRIG
 * parsningen av resten (AC #3: läsbar utan specialverktyg, och ett enda
 * korrupt tillägg ska inte göra hela historiken oläsbar). Tomma rader
 * (trailing newline) hoppas tyst över.
 *
 * @param {string} text
 * @returns {{rader: object[], fel: {radnummer: number, meddelande: string}[]}}
 */
export function parsaLoggRader(text) {
  const rader = [];
  const fel = [];
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed === '') return;
    let raw;
    try {
      raw = JSON.parse(trimmed);
    } catch (error) {
      fel.push({ radnummer: idx + 1, meddelande: `ogiltig JSON: ${error.message}` });
      return;
    }
    const parsed = LoggRadSchema.safeParse(raw);
    if (!parsed.success) {
      fel.push({ radnummer: idx + 1, meddelande: zodFelTillSträngar(parsed.error).join('; ') });
      return;
    }
    rader.push(parsed.data);
  });
  return { rader, fel };
}

const TOMMA_SEVERITY = Object.freeze({ error: 0, warning: 0, info: 0 });
const NIVAER = /** @type {const} */ (['lag', 'medel', 'hog']);

/**
 * Summerar en uppsättning validerade rader (från `parsaLoggRader`) till
 * statistik: findings-per-runda (AC #1), risk-/beslutsfördelning, och
 * risk-kalibreringens härledda fångstrate per nivå (AC #2). Ren funktion —
 * ingen I/O, deterministisk för samma indata.
 *
 * `grindMissPerNiva[niva].rate` är `null` (inte 0) när `korningar === 0` —
 * en delning med noll ska aldrig läsas som "0 % fångstmiss" (samma
 * "läs alltid ut n"-disciplin som scripts/flake-matserie.mjs).
 *
 * @param {object[]} rader
 */
export function summera(rader) {
  const korningar = rader.filter((r) => r.typ === 'korning');
  const kalibreringar = rader.filter((r) => r.typ === 'kalibrering');

  const perRundaMap = new Map();
  const riskFordelning = { lag: 0, medel: 0, hog: 0 };
  const beslutFordelning = {};

  for (const k of korningar) {
    riskFordelning[k.risk.niva] += 1;
    beslutFordelning[k.beslut] = (beslutFordelning[k.beslut] ?? 0) + 1;

    if (!perRundaMap.has(k.runda)) {
      perRundaMap.set(k.runda, {
        runda: k.runda,
        antal: 0,
        fyndPerSeverity: { ...TOMMA_SEVERITY },
        beslutFordelning: {},
      });
    }
    const bucket = perRundaMap.get(k.runda);
    bucket.antal += 1;
    bucket.fyndPerSeverity.error += k.fyndPerSeverity.error;
    bucket.fyndPerSeverity.warning += k.fyndPerSeverity.warning;
    bucket.fyndPerSeverity.info += k.fyndPerSeverity.info;
    bucket.beslutFordelning[k.beslut] = (bucket.beslutFordelning[k.beslut] ?? 0) + 1;
  }

  const grindMissPerNiva = {};
  for (const niva of NIVAER) {
    const korningarMedNiva = korningar.filter((k) => k.risk.niva === niva).length;
    const kalibreringarMedNiva = kalibreringar.filter((k) => k.stampladRisk === niva).length;
    grindMissPerNiva[niva] = {
      korningar: korningarMedNiva,
      kalibreringar: kalibreringarMedNiva,
      rate: korningarMedNiva === 0 ? null : kalibreringarMedNiva / korningarMedNiva,
    };
  }

  const kalibreringarUtanKorning = kalibreringar.filter((k) => k.stampladRisk === null);

  return {
    totalKorningar: korningar.length,
    totalKalibreringar: kalibreringar.length,
    perRunda: [...perRundaMap.values()].sort((a, b) => a.runda - b.runda),
    riskFordelning,
    beslutFordelning,
    grindMissPerNiva,
    kalibreringarUtanKorning,
    kalibreringar,
  };
}

function procent(rate) {
  if (rate === null) return '—';
  return `${Math.round(rate * 100)} %`;
}

/**
 * Renderar en summering (från `summera`) till markdown, läsbar direkt i
 * terminalen eller i ett GitHub-gränssnitt (AC #3). Ren funktion: samma
 * summering ⇒ byte-identisk text.
 *
 * @param {ReturnType<typeof summera>} s
 * @param {{loggFil: string, tidsstampel: string, felAntal?: number}} meta
 */
export function renderaSummeringMarkdown(s, { loggFil, tidsstampel, felAntal = 0 }) {
  const rader = [];
  rader.push('# Review-grindens instrumentering — sammanfattning');
  rader.push('');
  rader.push(`_Genererad ${tidsstampel} ur \`${loggFil}\`._`);
  if (felAntal > 0) {
    rader.push('');
    rader.push(
      `⚠️ **${felAntal} rad(er) i loggfilen kunde inte tolkas** och är EXKLUDERADE ur summeringen nedan — kör med \`--json\` eller läs loggfilen direkt för detaljer.`,
    );
  }
  rader.push('');

  if (s.totalKorningar === 0 && s.totalKalibreringar === 0) {
    rader.push(
      '_Ingen körning eller kalibreringspost loggad ännu. Instrumenteringen gäller FRÅN OCH MED NU ' +
        '(TASK-173.6) — de 14 skarpa review-agent-körningarna från S112 (2026-08-26, se ' +
        'tasks/sessions/2026-08-24-session-112.md Del 6) är INTE backfyllda: deras utlåtande-JSON ' +
        'låg i agenternas scratchpad-kataloger och är inte längre åtkomlig (ADR-086 — obelagt ' +
        'påstående annars). Endast de aggregerade siffrorna i sessionsdoket finns kvar som prosa.',
    );
    return rader.join('\n');
  }

  rader.push(
    `Totalt **${s.totalKorningar}** granskningskörningar, **${s.totalKalibreringar}** kalibreringsposter.`,
  );
  rader.push('');

  rader.push('## Findings per runda');
  rader.push('');
  rader.push('| Runda | Körningar | error | warning | info | Beslut |');
  rader.push('|---|---|---|---|---|---|');
  for (const p of s.perRunda) {
    const beslutText = Object.entries(p.beslutFordelning)
      .map(([k, v]) => `${k}×${v}`)
      .join(', ');
    rader.push(
      `| ${p.runda} | ${p.antal} | ${p.fyndPerSeverity.error} | ${p.fyndPerSeverity.warning} | ` +
        `${p.fyndPerSeverity.info} | ${cell(beslutText)} |`,
    );
  }
  rader.push('');

  rader.push('## Risknivå-fördelning');
  rader.push('');
  rader.push('| Nivå | Körningar |');
  rader.push('|---|---|');
  for (const niva of NIVAER) rader.push(`| ${niva} | ${s.riskFordelning[niva]} |`);
  rader.push('');

  rader.push('## Beslutsfördelning');
  rader.push('');
  rader.push('| Beslut | Antal |');
  rader.push('|---|---|');
  for (const [k, v] of Object.entries(s.beslutFordelning)) rader.push(`| ${k} | ${v} |`);
  rader.push('');

  rader.push('## Risk-kalibrering — härledd fångstrate per nivå');
  rader.push('');
  rader.push(
    '_n är litet i början — läs alltid ut n innan ett noll- eller 0 %-resultat tolkas ' +
      '(samma disciplin som `npm run metrics:flake`, CLAUDE.md § Flakighet mäts med riggen). ' +
      "En rad utan matchande körning ('—' i tabellen) betyder att INGEN granskning föregick " +
      'kalibreringsposten — se D0-undantags-listan nedan, inte denna tabell._',
  );
  rader.push('');
  rader.push('| Nivå | Körningar (n) | Grind-missar | Andel |');
  rader.push('|---|---|---|---|');
  for (const niva of NIVAER) {
    const g = s.grindMissPerNiva[niva];
    rader.push(`| ${niva} | ${g.korningar} | ${g.kalibreringar} | ${procent(g.rate)} |`);
  }

  if (s.kalibreringarUtanKorning.length > 0) {
    rader.push('');
    rader.push(
      `### Kalibreringar UTAN matchande körning (${s.kalibreringarUtanKorning.length}) — underlag för D0-undantagets omprövning`,
    );
    rader.push('');
    for (const k of s.kalibreringarUtanKorning) {
      rader.push(
        `- PR #${k.prNummer}${k.kortId ? ` (${k.kortId})` : ''}: ${cell(k.fangst)} — ${cell(k.kalla)}, ${k.tidsstampel}`,
      );
    }
  }

  if (s.kalibreringar.length > 0) {
    rader.push('');
    rader.push('## Alla kalibreringsposter');
    rader.push('');
    rader.push('| PR | Kort | Stämplad risk | Fångst | Källa | Tidsstämpel |');
    rader.push('|---|---|---|---|---|---|');
    for (const k of s.kalibreringar) {
      rader.push(
        `| ${k.prNummer} | ${cell(k.kortId)} | ${k.stampladRisk ?? '—'} | ${cell(k.fangst)} | ${cell(k.kalla)} | ${k.tidsstampel} |`,
      );
    }
  }

  return rader.join('\n');
}
