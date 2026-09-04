// scripts/lib/review-backstopp.mjs — CI-backstoppens RENA verdikt-logik:
// bär en PR-kropp ett giltigt granskningsutlåtande för DEN commit som håller
// på att landa? (TASK-173.4, ADR-105 beslut 2/3.)
//
// ═══ VAD DETTA ÄR ═══
// Den deterministiska halvan av 173.4. Ingen I/O, ingen klocka, ingen
// slumpkälla, ingen LLM (AC #4) — samma lager-snitt som 173.2:s
// scripts/lib/review-policy.mjs och 173.3:s scripts/lib/review-risk-
// sektion.mjs. I/O (hämta PR-kroppen via `gh`) bor i
// scripts/review-backstopp.mjs.
//
// ═══ NOLL BEROENDEN — MED AVSIKT ═══
// Modulen importerar ENDAST scripts/lib/review-risk-sektion.mjs, som självt
// importerar ingenting (verifierat: filen har noll `import`-satser utöver en
// JSDoc-typreferens). Kedjan drar därför inte in `zod`, vilket betyder att
// CI-jobbet kan köra backstoppen UTAN `npm ci`. En backstopp ska vara det
// enklaste och mest robusta ledet i kedjan; att göra den beroende av att
// node_modules installerar rent vore att låta det led den ska skydda kunna
// släcka den.
//
// Markörerna och risk-etiketterna IMPORTERAS ur rendrerarens modul i stället
// för att kopieras hit. En kopia hade drivit isär vid nästa etikettändring —
// exakt den kopierings-drift repot städat bort flera gånger (CLAUDE.md
// § Bygg, testa, linta).
//
// ═══ VAD BACKSTOPPEN FAKTISKT BEVISAR — OCH INTE ═══
// Den bevisar att PR-kroppen BÄR en maskinrenderad Riskbedömnings-sektion
// vars `granskadSha` är den commit som landar. Den kan INTE bevisa att en
// granskning faktiskt ägt rum: PR-kroppen är skrivbar av PR:ens författare,
// så en tillräckligt beslutsam agent kan handskriva sektionen. Det är en
// medveten gräns i ADR-105 beslut 2 ("verifierar att PR:en bär ett
// granskningsutlåtande") — tilliten till att granskningen ÄGDE RUM bärs av
// orkestrerar-kontraktet (färsk kontext, aldrig samma agent som byggde),
// inte av denna grind. Skriv aldrig om denna rad till att påstå mer
// (ADR-083).

import { MARKER_END, MARKER_START, RISK_LABEL } from './review-risk-sektion.mjs';

/** Verdikt-koder. `OK` = grinden släpper igenom; allt annat FÄLLER. */
export const VERDIKT = {
  OK: 'ok',
  SAKNAS: 'saknas',
  KORRUPTA_MARKORER: 'korrupta-markorer',
  OPARSBAR_RUBRIK: 'oparsbar-rubrik',
  OKAND_NIVA: 'okand-niva',
  OPARSBAR_FOTNOT: 'oparsbar-fotnot',
  FEL_PR: 'fel-pr',
  STALE: 'stale',
};

/** Etikett → nivå, härledd ur rendrerarens EGEN tabell (aldrig en kopia). */
const NIVA_UR_ETIKETT = new Map(
  Object.entries(RISK_LABEL).map(([niva, etikett]) => [etikett, niva]),
);

/** Meta-raden som `renderaRiskbedomning` skriver först i sektionen:
 * `**Nivå:** … · **Runda:** N · **Granskad SHA:** \`sha\``. */
const META_RE =
  /\*\*Nivå:\*\*\s*(.+?)\s*·\s*\*\*Runda:\*\*\s*(\d+)\s*·\s*\*\*Granskad SHA:\*\*\s*`([^`]+)`/;

/** Fotnoten som avslutar sektionen. Att den finns OCH är parsbar är i sig
 * ett strukturellt bevis för att sektionen är MASKINRENDERAD, inte
 * handskriven prosa som råkat hamna mellan markörerna. */
const FOTNOT_RE = /<sub>Genererat av review-agent · schemaVersion (\S+) · PR #(\d+)/;

/** Minsta SHA-längd som accepteras i `Granskad SHA` — samma golv som
 * utlåtande-schemats `granskadSha: z.string().min(7)`
 * (scripts/lib/review-utlatande.mjs). Kortare än så är inte en
 * commit-pinning, det är en gissning. */
const MIN_SHA_LANGD = 7;

/** Räknar markör-förekomster — samma analys som `uppdateraPrKropp` gör i
 * scripts/lib/review-risk-sektion.mjs, av samma skäl: en KORRUPT
 * markörsituation ska aldrig tolkas, bara rapporteras. */
function analyseraMarkorer(kropp) {
  const startPos = [];
  const endPos = [];
  let i = kropp.indexOf(MARKER_START);
  while (i !== -1) {
    startPos.push(i);
    i = kropp.indexOf(MARKER_START, i + 1);
  }
  i = kropp.indexOf(MARKER_END);
  while (i !== -1) {
    endPos.push(i);
    i = kropp.indexOf(MARKER_END, i + 1);
  }
  return { startPos, endPos };
}

function fall(kod, skal, atgard) {
  return { ok: false, kod, skal, atgard, sektion: null };
}

/**
 * Prövar en PR-kropp mot backstoppens fem invarianter. Ren funktion.
 *
 * Invarianterna, i den ordning de prövas:
 *   1. Sektionen FINNS, och markörerna är välformade (exakt en start, exakt
 *      en slut, i den ordningen).
 *   2. Meta-raden är parsbar och risknivån är en av rendrerarens tre kända
 *      etiketter — en oparsbar nivå är en sektion ingen maskin kan läsa.
 *   3. Fotnoten är parsbar (schemaVersion + PR-nummer) — strukturbeviset för
 *      att sektionen är renderad, inte handskriven.
 *   4. Fotnotens PR-nummer är DENNA PR — en sektion klippt från en annan PR
 *      är inte en granskning av den här diffen.
 *   5. `granskadSha` är den commit som faktiskt landar (prefix-match mot
 *      PR:ens head). En sektion från en tidigare commit är en STALE
 *      granskning: samma koppling GitHub gör med "dismiss stale pull request
 *      approvals when commits are pushed", Prow med sin lgtm-retraktion och
 *      Gerrit med patchset-bundna röster — och samma koppling rundtaks-
 *      loopen redan gör via `--foregaende-sha`
 *      (scripts/lib/review-loop.mjs).
 *
 * VAD SOM MEDVETET **INTE** PRÖVAS:
 *   · `schemaVersion`-VÄRDET. Att fotnoten är parsbar räcker; vilken
 *     schemaversion utlåtandet bar är rendrerarens och validatorns ansvar
 *     (173.1/173.3 validerar via zod FÖRE sektionen skrivs). Att låta
 *     backstoppen kräva en viss version hade gjort varje framtida
 *     SCHEMA_VERSION-bump till en landnings-blockad för redan granskade
 *     PR:er, utan att fånga något grinden inte redan fångar.
 *   · Risk-NIVÅN. `hog` blockerar ARMERING (ADR-105 beslut 5, en
 *     orkestrerar-/Marcus-regel) — men en PR som Marcus granskat och armerat
 *     ska landa. Att fälla `hog` här hade gjort Marcus egen granskning
 *     omöjlig att verkställa.
 *
 * @param {object} args
 * @param {string|null|undefined} args.kropp   PR-kroppen, rå.
 * @param {number} args.prNummer               PR:ens nummer.
 * @param {string} args.headSha                PR:ens head-SHA (den commit som landar).
 * @returns {{ok: true, kod: 'ok', skal: string, atgard: null, sektion: {niva: string, runda: number, granskadSha: string, schemaVersion: string}}
 *        | {ok: false, kod: string, skal: string, atgard: string, sektion: null}}
 */
export function provaPrKropp({ kropp, prNummer, headSha }) {
  const text = kropp ?? '';
  const atgardStandard =
    'Kör review-grinden på PR:en (review-agent i färsk kontext → ' +
    '`node scripts/uppdatera-review-sektion.mjs <utlatande.json>`) och armera om.';

  const { startPos, endPos } = analyseraMarkorer(text);

  if (startPos.length === 0 && endPos.length === 0) {
    return fall(
      VERDIKT.SAKNAS,
      'PR-kroppen bär ingen Riskbedömnings-sektion — inget granskningsutlåtande att verifiera.',
      atgardStandard,
    );
  }

  if (!(startPos.length === 1 && endPos.length === 1 && startPos[0] < endPos[0])) {
    return fall(
      VERDIKT.KORRUPTA_MARKORER,
      `PR-kroppen bär en KORRUPT markörsituation (${startPos.length} startmarkör(er), ` +
        `${endPos.length} slutmarkör(er)) — vägrar tolka den.`,
      'Städa PR-kroppen manuellt (ta bort alla markörpar) och skriv sektionen på nytt.',
    );
  }

  const inre = text.slice(startPos[0] + MARKER_START.length, endPos[0]);

  const meta = META_RE.exec(inre);
  if (meta === null) {
    return fall(
      VERDIKT.OPARSBAR_RUBRIK,
      'Sektionens meta-rad (Nivå · Runda · Granskad SHA) saknas eller går inte att läsa.',
      atgardStandard,
    );
  }
  const [, etikett, rundaText, granskadSha] = meta;

  const niva = NIVA_UR_ETIKETT.get(etikett.trim());
  if (niva === undefined) {
    return fall(
      VERDIKT.OKAND_NIVA,
      `Risknivån '${etikett.trim()}' är ingen känd etikett ` +
        `(${[...NIVA_UR_ETIKETT.keys()].join(', ')}).`,
      atgardStandard,
    );
  }

  const fotnot = FOTNOT_RE.exec(inre);
  if (fotnot === null) {
    return fall(
      VERDIKT.OPARSBAR_FOTNOT,
      'Sektionens fotnot (schemaVersion + PR-nummer) saknas eller går inte att läsa — ' +
        'sektionen ser inte maskinrenderad ut.',
      atgardStandard,
    );
  }
  const [, schemaVersion, fotnotPrText] = fotnot;

  const fotnotPr = Number(fotnotPrText);
  if (fotnotPr !== prNummer) {
    return fall(
      VERDIKT.FEL_PR,
      `Sektionen är renderad för PR #${fotnotPr}, men denna PR är #${prNummer} — ` +
        'utlåtandet granskade en annan diff.',
      atgardStandard,
    );
  }

  const sha = granskadSha.trim().toLowerCase();
  const head = String(headSha).trim().toLowerCase();
  if (sha.length < MIN_SHA_LANGD || !head.startsWith(sha)) {
    return fall(
      VERDIKT.STALE,
      `Sektionen granskade ${granskadSha.trim()}, men commiten som landar är ${headSha} — ` +
        'granskningen är STALE (senare commits är ogranskade).',
      atgardStandard,
    );
  }

  return {
    ok: true,
    kod: VERDIKT.OK,
    skal:
      `Riskbedömnings-sektionen är välformad, renderad för PR #${prNummer} och granskade ` +
      `${granskadSha.trim()} — samma commit som landar.`,
    atgard: null,
    sektion: { niva, runda: Number(rundaText), granskadSha: granskadSha.trim(), schemaVersion },
  };
}

/**
 * Plockar PR-numret ur en merge_group-ref.
 *
 * GitHub namnger kö-grenen `gh-readonly-queue/<bas>/pr-<nr>-<bas-sha>`
 * (verifierat mot 30 skarpa merge_group-körningar i detta repo 2026-08-28
 * via `gh run list --workflow ci.yml --event merge_group`; SAMTLIGA följde
 * formen). `github.event.merge_group.head_ref` bär den med `refs/heads/`-
 * prefix — båda formerna accepteras.
 *
 * Fail-closed: en ref som inte matchar ger `ok: false`. Anroparen ska då
 * avbryta, ALDRIG anta att PR:en är granskad. Att gissa PR-nummer ur en
 * okänd ref-form vore att bygga grinden på en gissning.
 *
 * @param {string|null|undefined} ref
 * @returns {{ok: true, prNummer: number, fel: null} | {ok: false, prNummer: null, fel: string}}
 */
export function parsaMergeGroupRef(ref) {
  const text = String(ref ?? '').trim();
  const m = /^(?:refs\/heads\/)?gh-readonly-queue\/[^/]+\/pr-(\d+)-[0-9a-fA-F]{7,40}$/.exec(text);
  if (m === null) {
    return {
      ok: false,
      prNummer: null,
      fel:
        `Kunde inte läsa PR-numret ur merge_group-refen '${text || '<tom>'}' — ` +
        'väntade formen gh-readonly-queue/<bas>/pr-<nr>-<bas-sha>.',
    };
  }
  return { ok: true, prNummer: Number(m[1]), fel: null };
}
