#!/usr/bin/env node
// scripts/docraptor-minimaltest.mjs — S108 MARCUS-SEKVENS punkt 3
// (ADR-119 beslut 7, "minimaltestet").
//
// Kör de tre bilage-mallarna × 3 upprepningar mot den STAGING-deployade
// EF:en test-docraptor-render (supabase/functions/test-docraptor-render/)
// och mäter de fyra punkterna beslut 7 kräver:
//   (a) sökbar text med korrekt svensk teckenkodning
//   (b) uppmätt end-to-end-latens
//   (c) filstorlek
//   (d) ärligt felbeteende (timeout, ogiltig nyckel)
// samt ett negativt typsnittstest (Carlito medvetet uteslutet ur en av
// körningarna, för att bevisa att data-URI-inbäddningen faktiskt BÄR fonten
// i det positiva fallet).
//
// FÖRUTSÄTTNINGAR (kontrolleras, aldrig antas):
//   - supabase/.temp/project-ref pekar på STAGING (pqtshyierkdgwdnxuirz) —
//     scriptet vägrar köra mot annat.
//   - test-docraptor-render är redan deployad (manuell deploy, ADR-050 —
//     inget CI-steg gör detta åt dig).
//   - DOCRAPTOR_API_KEY-secret är satt till platshållaren YOUR_API_KEY_HERE
//     INNAN scriptet körs (S108-uppdragets steg 4).
//   - .env.test laddad (TEST_SUPABASE_URL/ANON_KEY/USER_EMAIL/PASSWORD) —
//     körs via `npm run docraptor:minimaltest`
//     (`node --env-file-if-exists=.env.test`, samma mönster som
//     seed:dokument).
//
// poppler-utils (pdftotext/pdffonts/pdfinfo/pdftoppm) krävs på PATH för
// verifieringen — samma verktyg som redan användes för premiss 1
// (curl-testet mot DocRaptors testnyckel, se slutrapporten).
//
// SIDOEFFEKT PÅ SECRETS: felfall-testet "ogiltig nyckel" sätter
// DOCRAPTOR_API_KEY till ett fel-värde TEMPORÄRT och återställer det till
// platshållaren i SAMMA körning (try/finally) — verifierat efteråt med
// `supabase secrets list`. Lämnas ALDRIG på ett felvärde (uppdragets
// § Gör INTE).

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gorSjalvbarande, REPOROT } from './docraptor-sjalvbarande.mjs';

const MALLAR = ['bekraftelsebilaga', 'deltagarinformation', 'kvitto'];
const REPS = 3;
const UT_DIR = join(REPOROT, 'test-results', 'docraptor');
const STAGING_REF = 'pqtshyierkdgwdnxuirz';
const KANT_ORD = 'Rönninge'; // finns i alla tre mallars ifyllda fixture-data

function kravEnv(namn) {
  const v = process.env[namn];
  if (!v) {
    throw new Error(
      `${namn} saknas i env — kör via \`npm run docraptor:minimaltest\` (laddar .env.test).`,
    );
  }
  return v;
}

function kravStagingLankad() {
  const refPath = join(REPOROT, 'supabase', '.temp', 'project-ref');
  if (!existsSync(refPath)) {
    throw new Error(
      'supabase/.temp/project-ref saknas — kör `supabase link --project-ref <staging>` först.',
    );
  }
  const ref = execFileSync('cat', [refPath], { encoding: 'utf8' }).trim();
  if (ref !== STAGING_REF) {
    throw new Error(
      `Länkat projekt är ${ref}, förväntade staging (${STAGING_REF}). Vägrar köra mot fel projekt.`,
    );
  }
}

async function loggaIn() {
  const baseUrl = kravEnv('TEST_SUPABASE_URL');
  const anonKey = kravEnv('TEST_SUPABASE_ANON_KEY');
  const email = kravEnv('TEST_USER_EMAIL');
  const password = kravEnv('TEST_USER_PASSWORD');

  const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login misslyckades: ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  if (!body.access_token) throw new Error('Login gav ingen access_token.');
  return { accessToken: body.access_token, baseUrl };
}

async function anropaEF(baseUrl, jwt, { html, namn, timeoutMs }) {
  const url = new URL(`${baseUrl}/functions/v1/test-docraptor-render`);
  if (timeoutMs !== undefined) url.searchParams.set('timeoutMs', String(timeoutMs));

  const t0 = performance.now();
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, namn }),
    });
  } catch (err) {
    const t1 = performance.now();
    return { ok: false, klientMs: t1 - t0, natverksfel: String(err) };
  }
  const t1 = performance.now();
  const klientMs = t1 - t0;
  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/pdf')) {
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ok: true,
      status: res.status,
      klientMs,
      efMs: Number(res.headers.get('x-docraptor-ms')),
      bytes: Number(res.headers.get('x-pdf-bytes')),
      testMode: res.headers.get('x-docraptor-test-mode'),
      pdf: buf,
    };
  }
  const jsonBody = await res.json().catch(() => ({}));
  return { ok: false, status: res.status, klientMs, body: jsonBody };
}

function renderaMall(mall) {
  execFileSync('node', ['scripts/render-bilage-mall.mjs', mall], { cwd: REPOROT, stdio: 'pipe' });
  return join(REPOROT, 'docs', 'mallar', 'bilagor', `${mall}.granskning.html`);
}

function pdftotextRad(pdfPath) {
  try {
    return execFileSync('pdftotext', ['-raw', pdfPath, '-'], { encoding: 'utf8' });
  } catch (err) {
    return `[pdftotext-fel: ${err.message}]`;
  }
}

function pdffontsRad(pdfPath) {
  try {
    return execFileSync('pdffonts', [pdfPath], { encoding: 'utf8' });
  } catch (err) {
    return `[pdffonts-fel: ${err.message}]`;
  }
}

function pdfinfoRad(pdfPath) {
  try {
    return execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
  } catch (err) {
    return `[pdfinfo-fel: ${err.message}]`;
  }
}

function textCheck(text) {
  const harA = text.includes('å');
  const harO2 = text.includes('ä');
  const harO = text.includes('ö');
  const harKantOrd = text.includes(KANT_ORD);
  const harMojibake = /Ã[¥¤¶]|Â/.test(text);
  return {
    harAaOAaAO: harA && harO2 && harO,
    harKantOrd,
    harMojibake,
    ok: harA && harO2 && harO && harKantOrd && !harMojibake,
  };
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

async function setSecret(varde) {
  execFileSync('npx', ['supabase', 'secrets', 'set', `DOCRAPTOR_API_KEY=${varde}`], {
    cwd: REPOROT,
    stdio: 'pipe',
  });
}

async function lasSecretsLista() {
  const raw = execFileSync('npx', ['supabase', 'secrets', 'list'], {
    cwd: REPOROT,
    encoding: 'utf8',
  });
  return JSON.parse(raw);
}

async function main() {
  kravStagingLankad();
  await mkdir(UT_DIR, { recursive: true });

  const { accessToken, baseUrl } = await loggaIn();
  console.log(`Inloggad mot ${baseUrl}`);

  const resultat = { mallar: {}, felfall: {}, negativtTypsnittstest: null };

  // ── Steg A: huvudmätning — 3 mallar × 3 repetitioner ──────────────────
  for (const mall of MALLAR) {
    console.log(`\n=== ${mall} ===`);
    const granskningPath = renderaMall(mall);
    const html = await gorSjalvbarande(granskningPath);
    const namn = `${mall}-minimaltest`;

    const reps = [];
    for (let i = 1; i <= REPS; i++) {
      const svar = await anropaEF(baseUrl, accessToken, { html, namn });
      if (!svar.ok) {
        throw new Error(`Oväntat fel-svar för ${mall} rep ${i}: ${JSON.stringify(svar)}`);
      }
      const pdfPath = join(UT_DIR, `${mall}-rep${i}.pdf`);
      await writeFile(pdfPath, svar.pdf);
      reps.push({ ...svar, pdfPath });
      console.log(
        `  rep ${i}: klientMs=${svar.klientMs.toFixed(1)} efMs=${svar.efMs.toFixed(1)} bytes=${svar.bytes} testMode=${svar.testMode}`,
      );
    }

    const forstaText = pdftotextRad(reps[0].pdfPath);
    const forstaFonts = pdffontsRad(reps[0].pdfPath);
    const forstaInfo = pdfinfoRad(reps[0].pdfPath);
    const textkoll = textCheck(forstaText);

    resultat.mallar[mall] = {
      reps: reps.map((r) => ({
        klientMs: r.klientMs,
        efMs: r.efMs,
        bytes: r.bytes,
        testMode: r.testMode,
      })),
      medianEfMs: median(reps.map((r) => r.efMs)),
      maxEfMs: Math.max(...reps.map((r) => r.efMs)),
      medianKlientMs: median(reps.map((r) => r.klientMs)),
      maxKlientMs: Math.max(...reps.map((r) => r.klientMs)),
      textkoll,
      pdftotext: forstaText,
      pdffonts: forstaFonts,
      pdfinfo: forstaInfo,
    };
    console.log(`  text-check: ${JSON.stringify(textkoll)}`);
  }

  // ── Steg B: felfall — timeout (kräver platshållar-nyckel, honoreras då) ─
  console.log('\n=== Felfall: timeout (?timeoutMs=1) ===');
  {
    const granskningPath = renderaMall('kvitto');
    const html = await gorSjalvbarande(granskningPath);
    const svar = await anropaEF(baseUrl, accessToken, { html, namn: 'timeout-test', timeoutMs: 1 });
    resultat.felfall.timeout = svar;
    console.log(
      `  ${JSON.stringify({ ok: svar.ok, status: svar.status, klientMs: svar.klientMs, body: svar.body })}`,
    );
    if (svar.ok) {
      throw new Error(
        'FÖRVÄNTAT FEL: timeoutMs=1 gav ett OK-svar (PDF) i stället för ett timeout-fel.',
      );
    }
  }

  // ── Steg C: negativt typsnittstest — Carlito medvetet uteslutet ────────
  console.log('\n=== Negativt typsnittstest (Carlito uteslutet) ===');
  {
    const granskningPath = renderaMall('kvitto');
    const htmlUtanCarlito = await gorSjalvbarande(granskningPath, {
      uteslutTypsnitt: [
        'Carlito-Regular.ttf',
        'Carlito-Bold.ttf',
        'Carlito-Italic.ttf',
        'Carlito-BoldItalic.ttf',
      ],
    });
    const svar = await anropaEF(baseUrl, accessToken, {
      html: htmlUtanCarlito,
      namn: 'negativt-typsnittstest',
    });
    if (!svar.ok) throw new Error(`Negativt typsnittstest gav fel-svar: ${JSON.stringify(svar)}`);
    const pdfPath = join(UT_DIR, 'kvitto-utan-carlito.pdf');
    await writeFile(pdfPath, svar.pdf);
    const fonts = pdffontsRad(pdfPath);
    resultat.negativtTypsnittstest = { bytes: svar.bytes, pdfPath, pdffonts: fonts };
    console.log(`  bytes=${svar.bytes}`);
    console.log(fonts);
  }

  // ── Steg D: felfall — ogiltig nyckel (secret muteras temporärt) ────────
  console.log('\n=== Felfall: ogiltig nyckel ===');
  {
    const foreListaRaw = await lasSecretsLista();
    const foreUpdated = foreListaRaw.secrets.find(
      (s) => s.name === 'DOCRAPTOR_API_KEY',
    )?.updated_at;
    console.log(`  DOCRAPTOR_API_KEY updated_at FÖRE: ${foreUpdated}`);

    try {
      await setSecret('fel-nyckel');
      console.log('  secret satt till "fel-nyckel"');

      const granskningPath = renderaMall('bekraftelsebilaga');
      const html = await gorSjalvbarande(granskningPath);
      const svar = await anropaEF(baseUrl, accessToken, { html, namn: 'ogiltig-nyckel-test' });
      resultat.felfall.ogiltigNyckel = svar;
      console.log(
        `  ${JSON.stringify({ ok: svar.ok, status: svar.status, klientMs: svar.klientMs, body: svar.body })}`,
      );
      if (svar.ok) {
        throw new Error(
          'FÖRVÄNTAT FEL: ogiltig nyckel gav ett OK-svar (PDF) i stället för ett fel.',
        );
      }
    } finally {
      await setSecret('YOUR_API_KEY_HERE');
      console.log('  secret återställd till platshållaren YOUR_API_KEY_HERE');
    }

    const efterListaRaw = await lasSecretsLista();
    const efterEntry = efterListaRaw.secrets.find((s) => s.name === 'DOCRAPTOR_API_KEY');
    console.log(`  DOCRAPTOR_API_KEY updated_at EFTER återställning: ${efterEntry?.updated_at}`);
    if (!efterEntry) {
      throw new Error(
        'DOCRAPTOR_API_KEY saknas i secrets-listan efter återställning — KRITISKT, verifiera manuellt.',
      );
    }
  }

  await writeFile(join(UT_DIR, 'matdata.json'), JSON.stringify(resultat, null, 2), 'utf8');
  console.log(`\nMätdata skriven: ${join(UT_DIR, 'matdata.json')}`);
  console.log('\nKLART.');
}

main().catch((err) => {
  console.error('\nFEL:', err);
  process.exitCode = 1;
});
