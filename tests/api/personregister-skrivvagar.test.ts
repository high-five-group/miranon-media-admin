// PERSONREGISTRETS SKRIVVÄGAR — TÄCKNINGSGRINDEN (TASK-286.4 AC #1 + #2)
// api-pure (källkods-nivå, ingen staging, inga creds, ingen browser).
//
// Systerfil till `personregister-invalidering.test.ts`, som bevisar
// BETEENDET (stale + faktisk omhämtning mot en riktig QueryClient). Denna
// fil bevisar TÄCKNINGEN: att varje skrivväg svepet fann faktiskt anropar
// `invalideraPersonregistret` — och att anropet ligger i `onSuccess`, inte
// bara någonstans i filen. Tillsammans utgör de AC #2:s "test per skrivväg".
//
// KÄLLKODS-NIVÅ ÄR RÄTT NIVÅ HÄR, samma motivering som syskongrindarna
// (`mutation-hemvist-vakt.test.ts`, `ef-metod-vakt.test.ts`): "anropar denna
// skrivväg invalideringen" är en KÄLLKODS-egenskap, den mäts träffsäkrast i
// källan, körs utan creds i api-pure, och fäller i review innan en
// regression hinner landas. Repot bär dessutom ingen React-renderare i
// test-stacken (varken @testing-library/react eller jsdom finns i
// package.json), så en monterad hook är inte ett tillgängligt alternativ.
//
// LISTAN BOR I FILEN, inte i en `.policy.conf`. Repo-konventionen "grindvakts-
// VÄRDEN är config-drivna" gäller UNDANTAG som varierar per projekt
// (`.mutation-hemvist-policy.conf`); här är listan inte ett undantag utan
// grindens SUBJEKT — själva svepets träffyta, den artefakt AC #1 kräver
// bilagd. Samma form som `activity-log-hemvist-statements.test.ts`, som
// listar sina tre hooks i filhuvudet.
//
// TVÅ BEVIS I VARDERA RIKTNING (kontraktets krav):
//   1. POSITIVT: de fem riktiga filerna på disk bär anropet i `onSuccess`.
//   2. NEGATIVT: KONSTRUERADE strängar (aldrig riktiga filer) bevisar att
//      `onSuccessBlock` + träffkontrollen själva diskriminerar rätt — ett
//      anrop i `onSettled`, ett anrop i ett kommentarsblock och en fil helt
//      utan anrop ska alla FALLA.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MUTATIONS_DIR = path.join(REPO_ROOT, 'src', 'data', 'mutations');

const HJALPAREN = 'invalideraPersonregistret';

/**
 * Svepets träffyta (AC #1). Varje post är en skrivväg som skapar eller ändrar
 * en person, eller ett fält personlistan visar/söker på. Motiveringen per post
 * bor i `src/data/mutations/personregister-invalidering.ts` § Svepets träffyta,
 * tillsammans med de SVEPTA MEN UTANFÖR-vägarna och varför de faller utanför.
 */
const SKRIVVAGAR: readonly { fil: string; hook: string; varfor: string }[] = [
  {
    fil: 'useCreateRegistration.ts',
    hook: 'useCreateRegistration',
    varfor: 'create-registration → Anmälningar (CREATE): registrets MEDLEMSKAP självt',
  },
  {
    fil: 'useUpdatePersonNote.ts',
    hook: 'useUpdatePersonNote',
    varfor: "update-person-note → Personer.'Anteckningar', ett fält register-payloaden bär",
  },
  {
    fil: 'useUpdatePersonFlag.ts',
    hook: 'useUpdatePersonFlag',
    varfor: "update-person-flag → Personer.'Flagga', den andra Personer-skrivningen",
  },
  {
    fil: 'attendance.ts',
    hook: 'useSetAttendanceStatus',
    varfor: 'Deltaganden → senasteInteraktion/dagarSedanSenaste, RENDERADE i listan',
  },
  {
    fil: 'registrationEventLink.ts',
    hook: 'useRelinkRegistration',
    varfor: "relink-registration → Anmälningar.'Event', flippar harAktivAnmalan (RENDERAT)",
  },
];

/**
 * Returnerar kroppen av VARJE `onSuccess`-block i källan.
 *
 * Formen är smal med avsikt: från `onSuccess:` letas först pilen (`=>`), sedan
 * kroppens öppnande klammer. Att hoppa direkt till första `{` hade fångat
 * DESTRUKTURERINGEN i parameterlistan i stället för kroppen — precis vad
 * `registrationEventLink.ts` har (`onSuccess: (_data, { registration, ... }) =>`).
 * Klammer-räkning ger sedan slutet.
 */
function onSuccessBlock(kalla: string): string[] {
  const block: string[] = [];
  let sok = 0;
  for (;;) {
    const start = kalla.indexOf('onSuccess:', sok);
    if (start === -1) break;
    sok = start + 'onSuccess:'.length;

    const pil = kalla.indexOf('=>', sok);
    if (pil === -1) break;
    const kroppStart = kalla.indexOf('{', pil);
    if (kroppStart === -1) break;

    let djup = 0;
    let i = kroppStart;
    for (; i < kalla.length; i += 1) {
      if (kalla[i] === '{') djup += 1;
      else if (kalla[i] === '}') {
        djup -= 1;
        if (djup === 0) break;
      }
    }
    block.push(kalla.slice(kroppStart, i + 1));
    sok = i + 1;
  }
  return block;
}

/** Ett FAKTISKT anrop, inte ordet i en kommentar (jfr `mutation-hemvist-vakt.test.ts`). */
function anroparHjalparen(kod: string): boolean {
  // Nollställ kommentarer först — annars räcker en docblock-rad som nämner
  // funktionen för att grinden ska bli grön på fel grund.
  const utanKommentarer = kod.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  return new RegExp(`\\b${HJALPAREN}\\s*\\(`).test(utanKommentarer);
}

// ─────────────────────────────────────────────────────────────────────────
// § 1 — POSITIVT: de riktiga filerna
// ─────────────────────────────────────────────────────────────────────────

for (const skrivvag of SKRIVVAGAR) {
  test(`${skrivvag.hook} (${skrivvag.fil}) invaliderar personregistret i onSuccess`, () => {
    const kalla = readFileSync(path.join(MUTATIONS_DIR, skrivvag.fil), 'utf8');

    expect(kalla, `${skrivvag.fil} ska importera hjälparen — ${skrivvag.varfor}`).toContain(
      `import { ${HJALPAREN} }`,
    );

    const block = onSuccessBlock(kalla);
    expect(block.length, `${skrivvag.fil} ska ha minst ett onSuccess-block`).toBeGreaterThan(0);

    const traffar = block.filter(anroparHjalparen);
    expect(
      traffar.length,
      `${skrivvag.fil}: anropet ska ligga i onSuccess — ${skrivvag.varfor}`,
    ).toBeGreaterThan(0);
  });
}

test('svepets träffyta är fem skrivvägar — en ändring ska vara ett synligt beslut', () => {
  expect(SKRIVVAGAR.length).toBe(5);
  expect(new Set(SKRIVVAGAR.map((s) => s.fil)).size).toBe(5);
});

// ─────────────────────────────────────────────────────────────────────────
// § 2 — NEGATIVT: konstruerade strängar, aldrig riktiga filer
// ─────────────────────────────────────────────────────────────────────────

test('grinden FÄLLER när anropet ligger i onSettled i stället för onSuccess', () => {
  const konstruerad = `
    useMutation({
      onSuccess: () => {
        alertScreenReader('Sparat');
      },
      onSettled: () => {
        ${HJALPAREN}(queryClient);
      },
    });
  `;
  const block = onSuccessBlock(konstruerad);
  expect(block.length).toBe(1);
  expect(block.some(anroparHjalparen), 'onSettled-anropet får inte räknas').toBe(false);
});

test('grinden FÄLLER på ordet i ett kommentarsblock — bara på anropet', () => {
  const konstruerad = `
    useMutation({
      /** Här SKULLE ${HJALPAREN}(queryClient) kunna anropas. */
      onSuccess: () => {
        // TODO: ${HJALPAREN}(queryClient)
        alertScreenReader('Sparat');
      },
    });
  `;
  const block = onSuccessBlock(konstruerad);
  expect(block.length).toBe(1);
  expect(block.some(anroparHjalparen), 'ordet i en kommentar är inte ett anrop').toBe(false);
});

test('grinden HITTAR anropet trots destrukturering i parameterlistan', () => {
  // Regressionsskydd för `registrationEventLink.ts`s form: en naiv
  // "första { efter onSuccess"-sökning hade landat i destruktureringen.
  const konstruerad = `
    useMutation({
      onSuccess: (_data, { registration, eventNamn }) => {
        alertScreenReader(eventNamn);
        ${HJALPAREN}(queryClient);
      },
    });
  `;
  const block = onSuccessBlock(konstruerad);
  expect(block.length).toBe(1);
  expect(block[0]).toContain('alertScreenReader');
  expect(block.some(anroparHjalparen)).toBe(true);
});

test('grinden FÄLLER på en fil helt utan anrop', () => {
  const konstruerad = `
    useMutation({
      onSuccess: () => {
        alertScreenReader('Sparat');
      },
    });
  `;
  expect(onSuccessBlock(konstruerad).some(anroparHjalparen)).toBe(false);
});
