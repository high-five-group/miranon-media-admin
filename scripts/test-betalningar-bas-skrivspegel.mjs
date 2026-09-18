#!/usr/bin/env node
// scripts/test-betalningar-bas-skrivspegel.mjs — tester för `skrivSpegel`s
// felsvars-väg (TASK-461, CodeQL js/stack-trace-exposure #7/#8/#9).
//
// Kör: node scripts/test-betalningar-bas-skrivspegel.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// SKRIPT, INTE `tests/api/*.test.ts` — MEDVETET (samma konvention som
// `scripts/test-backfill-inbetalningar.mjs`): `_shared/betalningar-bas.ts`
// importerar `airtable-client.ts`, som rör `Deno.env` — och är därför INTE
// med i `tsconfig.edge-shared.json`s enumererade, transitivt Deno-fria
// allowlist (den filens egen regel: "LÄGGER DU TILL EN MODUL HÄR: den måste
// vara transitivt Deno-fri"). En `tests/api/*.test.ts`-fil täcks av
// `tsconfig.tests.json` (`tsc -b` via project references) och FÄLLER
// `npm run typecheck` med TS2304 ("Cannot find name 'Deno'") så fort den
// importerar `betalningar-bas.ts` — mätt under byggsessionen (10 fel på
// `airtable-client.ts`s tio `Deno.env.get`-anrop). `scripts/**` täcks av
// INGEN tsconfig (`tsconfig.node.json`s `include` är bara `vite.config.ts` +
// `playwright.config.ts`) och körs direkt via `node` (Node 24, `.nvmrc`) med
// dess inbyggda TS-type-stripping — exakt vägen `test-backfill-
// inbetalningar.mjs` redan använder för samma klass av import.
//
// HERMETISK: `Deno.env` polyfillas minimalt (bara `.get`, de två nycklar
// `updateAirtableRecord` faktiskt läser) och `globalThis.fetch` mockas per
// test — inget riktigt nätverksanrop mot Airtable eller Supabase.
//
// VARFÖR DETTA TESTET FINNS: `hantera-inbetalning`, `registrera-inbetalning`
// och `rebook-registration` (två anrop) delar EN skrivande hjälpare —
// `skrivSpegel` — som tidigare returnerade den RÅA Airtable-feltexten
// (`fel.message`, kan bära fältnamn/tabell-ID/HTTP-status ur
// `airtable-client.ts`s `Airtable PATCH <status>: <rå kropp>`) i sitt
// `skal`-fält. Samtliga fyra anropsplatser lägger `spegel`/`spegelGammal`/
// `spegelNy` rakt av i sitt klientsvar (`JSON.stringify({..., spegel})`), så
// läckan var EN kod-plats men FYRA exponerade vägar. Detta test bevisar
// grundorsaken direkt i `skrivSpegel`, i stället för fyra separata,
// duplicerade prov mot varje EF:s `Deno.serve`-hanterare (overifierbart
// hermetiskt utan en full Deno-runtime — se
// `tests/api/test-static-files.staging.test.ts` för den klassen av bevis,
// som täcker #3).
//
// RÖTT FÖRE FIX (verifierat manuellt under byggsessionen, TASK-461): med
// `skal: sistaFel` (den gamla, råa varianten) matchade `resultat.skal` den
// mockade Airtable-kroppen ORDAGRANT — `INVALID_VALUE_FOR_COLUMN` och
// fältnamnet syntes i utfallet, och § A nedan föll. Efter fixen
// (`skal: SPEGEL_GENERISK_SKAL`) är § A grön.

import assert from 'node:assert/strict';

// Deno-polyfill — ENDAST `env.get`, den enda Deno-ytan `skrivSpegel` →
// `updateAirtableRecord` rör (funktionskropp, inte modul-scope — importen
// nedan går fint utan denna, men ANROPET till skrivSpegel kräver den).
globalThis.Deno = {
  env: {
    get(key) {
      if (key === 'AIRTABLE_BASE_ID') return 'appTESTSTAGINGBAS0';
      if (key === 'AIRTABLE_TOKEN') return 'patTESTTOKEN00000000';
      return undefined;
    },
  },
};

const { SPEGEL_FORSOK, SPEGEL_OPERATION, skrivSpegel } = await import(
  '../supabase/functions/_shared/betalningar-bas.ts'
);

let failed = 0;

function t(name, fn) {
  try {
    fn();
    console.log(`  OK  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  RÖD ${name}`);
    console.error(`      ${err.message}`);
  }
}

async function tAsync(name, fn) {
  try {
    await fn();
    console.log(`  OK  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  RÖD ${name}`);
    console.error(`      ${err.message}`);
  }
}

/** Airtables egen felkuvert (`{error:{type,message}}`) — samma form
 * `classifyAirtableWriteError` dokumenterar, verbatim vad en 422 på ett
 * fält-typ-brott faktiskt innehåller. */
const RA_AIRTABLE_KROPP = JSON.stringify({
  error: {
    type: 'INVALID_VALUE_FOR_COLUMN',
    message: 'Field "Avtalat pris (kr)" cannot accept the provided value.',
  },
});

const GRUNDFALT = {
  summaInbetalt: 1500,
  anmalningsavgift: null,
  slutbetalning: null,
};

function mockaAlltidFallerandeFetch() {
  return async () => new Response(RA_AIRTABLE_KROPP, { status: 422 });
}

/* ══════════════════════════════════════════════════════════════════════
   A. skal läcker ALDRIG Airtables råa feltext — den positiva OCH negativa
      kontrollen i samma test (vakuöst annars, se test-backfill-
      inbetalningar.mjs § filhuvud om kontrastpar-disciplinen)
   ══════════════════════════════════════════════════════════════════ */

await tAsync(
  'ALLA omförsök fallerar → skal är GENERISK, aldrig fältnamn/typ/status ur Airtable-svaret',
  async () => {
    const ursprungligFetch = globalThis.fetch;
    globalThis.fetch = mockaAlltidFallerandeFetch();
    try {
      const resultat = await skrivSpegel('recTESTANMALAN0001', GRUNDFALT, '[test]');

      assert.equal(resultat.skrivet, false);
      assert.equal(resultat.forsok, SPEGEL_FORSOK);
      // Den positiva kontrollen: `skal` är den stabila, generiska texten.
      assert.equal(
        resultat.skal,
        'Basen kunde inte uppdateras just nu. Detaljer finns i serverloggen.',
      );

      // Den negativa kontrollen — detta ÄR röd-bevis-raden: med den gamla
      // koden (`skal: sistaFel`) hade VARJE assert nedan FALLERAT, eftersom
      // `skal` bokstavligen VAR den råa kroppen.
      assert.notEqual(resultat.skal, null);
      assert.doesNotMatch(resultat.skal, /INVALID_VALUE_FOR_COLUMN/);
      assert.doesNotMatch(resultat.skal, /Avtalat pris/);
      assert.doesNotMatch(resultat.skal, /422/);
      assert.doesNotMatch(resultat.skal, /Airtable PATCH/);
    } finally {
      globalThis.fetch = ursprungligFetch;
    }
  },
);

await tAsync(
  'server-loggen BEHÅLLER den råa detaljen (AC #2 — felsökbarheten består)',
  async () => {
    const ursprungligFetch = globalThis.fetch;
    const ursprungligWarn = console.warn;
    const loggrader = [];
    console.warn = (...args) => {
      loggrader.push(args.map(String).join(' '));
    };
    globalThis.fetch = mockaAlltidFallerandeFetch();
    try {
      await skrivSpegel('recTESTANMALAN0002', GRUNDFALT, '[test-loggning]');

      // Den råa Airtable-detaljen ska finnas KVAR server-side — annars är
      // felsökbarheten försämrad, precis det uppdraget varnar för.
      const trafFel = loggrader.some(
        (rad) => rad.includes('INVALID_VALUE_FOR_COLUMN') && rad.includes('Avtalat pris'),
      );
      assert.ok(trafFel, `serverloggen saknar den råa detaljen: ${JSON.stringify(loggrader)}`);
      // Korrelerbar mot anropet: anmalanRecordId + loggPrefix syns i samma rad.
      const trafKorrelation = loggrader.some(
        (rad) => rad.includes('recTESTANMALAN0002') && rad.includes('[test-loggning]'),
      );
      assert.ok(
        trafKorrelation,
        `serverloggen saknar korrelationsspåret: ${JSON.stringify(loggrader)}`,
      );
    } finally {
      globalThis.fetch = ursprungligFetch;
      console.warn = ursprungligWarn;
    }
  },
);

await tAsync(
  'LYCKAD skrivning — skal är null (regression mot självläkande vägen, orörd av fixen)',
  async () => {
    const ursprungligFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          id: 'recTESTANMALAN0003',
          fields: {},
          createdTime: '2026-09-18T00:00:00.000Z',
        }),
        { status: 200 },
      );
    try {
      const resultat = await skrivSpegel('recTESTANMALAN0003', GRUNDFALT, '[test-ok]');
      assert.deepEqual(resultat, { skrivet: true, forsok: 1, skal: null });
    } finally {
      globalThis.fetch = ursprungligFetch;
    }
  },
);

t(
  'operationen är fortfarande write-registration-payment-mirror (formvakt oförändrad av fixen)',
  () => {
    assert.equal(SPEGEL_OPERATION, 'write-registration-payment-mirror');
  },
);

process.on('beforeExit', () => {
  if (failed > 0) {
    console.error(`\n${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\nAlla skrivSpegel-tester gröna.');
});
