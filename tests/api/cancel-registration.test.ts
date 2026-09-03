// cancel-registration — hermetisk svit för den delade orkestratorn
// (`_shared/cancel-registration.ts`), TASK-368.2.
//
// api-pure (ren logik, ingen staging) — samma klass som `betalningsbelopp.
// test.ts`/`inbetalning-notering.test.ts`: statusövergångstabellen och
// Notering-appendens exakta form bevisas UTTÖMMANDE här, i den delade modulen,
// i stället för att kräva en levande Airtable-fixtur per statuskombination
// (sex statusar × två åtgärder finns inte alla konstruerbara via befintliga
// Edge Functions — `create-registration` sätter t.ex. bara 'Obekräftad'; se
// `cancel-registration.staging.test.ts`s filhuvud för det fulla resonemanget
// om vad som därför INTE kan bevisas mot skarp staging).
//
// `beslutaCancelOvergang` kastar aldrig och har inga externa beroenden —
// samma "REN MODUL"-form som `confirm-registrations.ts` (api-pure-testad)
// och `betalningsharledning.ts`.

import { expect, test } from '@playwright/test';
import {
  appendNotering,
  beslutaCancelOvergang,
  byggNoteringsrad,
  STATUS_AVBOKAD,
  stockholmDatum,
} from '../../supabase/functions/_shared/cancel-registration';

const STATUS_BEKRAFTAD = 'Bekräftad (mail skickat)';
const STATUS_PAMINNELSE = 'Betalningspåminnelse skickad';
const STATUS_OBEKRAFTAD = 'Obekräftad';
const STATUS_VANTELISTA = 'Flytta till väntelista';
const STATUS_INSTALLT = 'Inställt';

/* ═══════════════════════ beslutaCancelOvergang — avboka ═══════════════════════ */

test.describe('avboka — de TRE tillåtna startstatusarna ger Avbokad/Ombokad', () => {
  for (const start of [STATUS_BEKRAFTAD, STATUS_PAMINNELSE, STATUS_OBEKRAFTAD]) {
    test(`${start} → avboka → ok, nyStatus=Avbokad/Ombokad`, () => {
      expect(beslutaCancelOvergang('avboka', start, null)).toEqual({
        ok: true,
        nyStatus: STATUS_AVBOKAD,
      });
    });
  }
});

test('avboka en redan avbokad anmälan → 409-grenen, kod redan_avbokad (idempotensens motor, AC #4)', () => {
  const beslut = beslutaCancelOvergang('avboka', STATUS_AVBOKAD, null);
  expect(beslut).toEqual({
    ok: false,
    kod: 'redan_avbokad',
    felmeddelande: 'Anmälan är redan avbokad.',
  });
});

test('avboka Inställt eller Flytta till väntelista → avvisas, kod status_ej_tillaten', () => {
  for (const start of [STATUS_INSTALLT, STATUS_VANTELISTA]) {
    const beslut = beslutaCancelOvergang('avboka', start, null);
    expect(beslut.ok).toBe(false);
    if (!beslut.ok) {
      expect(beslut.kod).toBe('status_ej_tillaten');
      expect(beslut.felmeddelande).toContain(start);
    }
  }
});

test('avboka en anmälan med okänd/null status → avvisas, kastar aldrig', () => {
  const beslut = beslutaCancelOvergang('avboka', null, null);
  expect(beslut).toEqual({
    ok: false,
    kod: 'status_ej_tillaten',
    felmeddelande: 'Anmälan kan inte avbokas från statusen "okänd".',
  });
});

/* ═══════════════════════ beslutaCancelOvergang — aterta ═══════════════════════ */

test('aterta med Bekräftelse skickad satt → härledd status Bekräftad (mail skickat)', () => {
  expect(beslutaCancelOvergang('aterta', STATUS_AVBOKAD, '2026-08-01T10:00:00.000Z')).toEqual({
    ok: true,
    nyStatus: STATUS_BEKRAFTAD,
  });
});

test('aterta UTAN Bekräftelse skickad → härledd status Obekräftad', () => {
  expect(beslutaCancelOvergang('aterta', STATUS_AVBOKAD, null)).toEqual({
    ok: true,
    nyStatus: STATUS_OBEKRAFTAD,
  });
  // Tom sträng räknas som "ej satt" — samma disciplin som appendNoterings
  // tomhets-kontroll.
  expect(beslutaCancelOvergang('aterta', STATUS_AVBOKAD, '')).toEqual({
    ok: true,
    nyStatus: STATUS_OBEKRAFTAD,
  });
  expect(beslutaCancelOvergang('aterta', STATUS_AVBOKAD, '   ')).toEqual({
    ok: true,
    nyStatus: STATUS_OBEKRAFTAD,
  });
});

test('aterta VARJE icke-avbokad status → avvisas, kod inte_avbokad', () => {
  for (const start of [
    STATUS_BEKRAFTAD,
    STATUS_PAMINNELSE,
    STATUS_OBEKRAFTAD,
    STATUS_VANTELISTA,
    STATUS_INSTALLT,
    null,
  ]) {
    const beslut = beslutaCancelOvergang('aterta', start, null);
    expect(beslut).toEqual({
      ok: false,
      kod: 'inte_avbokad',
      felmeddelande: 'Anmälan är inte avbokad och kan därför inte återtas.',
    });
  }
});

test('aterta en redan-aktiv anmälan två gånger i rad ger samma avvisning båda gångerna (idempotens, AC #4)', () => {
  // Simulerar sekvensen avboka → aterta → aterta igen: efter första
  // återtagandet är statusen den härledda (t.ex. Obekräftad), och ETT till
  // återtagande-anrop mot den statusen läser samma inte_avbokad-kod.
  const forsta = beslutaCancelOvergang('aterta', STATUS_AVBOKAD, null);
  expect(forsta.ok).toBe(true);
  if (!forsta.ok) throw new Error('ovan');
  const andra = beslutaCancelOvergang('aterta', forsta.nyStatus, null);
  expect(andra).toEqual({
    ok: false,
    kod: 'inte_avbokad',
    felmeddelande: 'Anmälan är inte avbokad och kan därför inte återtas.',
  });
});

/* ═══════════════════════════ byggNoteringsrad ═══════════════════════════ */

test('avboka-raden bär exakt formen, med skäl', () => {
  expect(byggNoteringsrad('avboka', '2026-09-03', 'Lotta Miranon', 'Blev sjuk')).toBe(
    '[Avbokad 2026-09-03 av Lotta Miranon] Blev sjuk',
  );
});

test('avboka-raden UTAN skäl saknar avslutande blanksteg (ingen trailing space)', () => {
  const rad = byggNoteringsrad('avboka', '2026-09-03', 'Lotta Miranon', null);
  expect(rad).toBe('[Avbokad 2026-09-03 av Lotta Miranon]');
  expect(rad.endsWith(' ')).toBe(false);
});

test('avboka-raden med tomt/whitespace-skäl behandlas som frånvarande skäl', () => {
  expect(byggNoteringsrad('avboka', '2026-09-03', 'Lotta Miranon', '')).toBe(
    '[Avbokad 2026-09-03 av Lotta Miranon]',
  );
  expect(byggNoteringsrad('avboka', '2026-09-03', 'Lotta Miranon', '   ')).toBe(
    '[Avbokad 2026-09-03 av Lotta Miranon]',
  );
});

test('aterta-raden bär den andra etiketten och trimmar skälet', () => {
  expect(byggNoteringsrad('aterta', '2026-09-04', 'Roger Miranon', '  Kunde komma ändå  ')).toBe(
    '[Avbokning återtagen 2026-09-04 av Roger Miranon] Kunde komma ändå',
  );
});

/* ═══════════════════════════ appendNotering ═══════════════════════════ */

test('tomt/null fält ger raden ensam, utan inledande radbrytning', () => {
  expect(appendNotering(null, '[Avbokad 2026-09-03 av X]')).toBe('[Avbokad 2026-09-03 av X]');
  expect(appendNotering('', '[Avbokad 2026-09-03 av X]')).toBe('[Avbokad 2026-09-03 av X]');
  expect(appendNotering('   ', '[Avbokad 2026-09-03 av X]')).toBe('[Avbokad 2026-09-03 av X]');
});

test('befintlig text BEVARAS ORÖRD och ny rad läggs sist med en tom rad emellan', () => {
  expect(appendNotering('Ringde och bytte telefonnummer', '[Avbokad 2026-09-03 av X]')).toBe(
    'Ringde och bytte telefonnummer\n\n[Avbokad 2026-09-03 av X]',
  );
});

test('befintlig text med egna radbrytningar/whitespace rörs INTE (ingen trim av innehållet)', () => {
  const befintlig = '  Rad ett\nRad två  ';
  expect(appendNotering(befintlig, '[Avbokad 2026-09-03 av X]')).toBe(
    `${befintlig}\n\n[Avbokad 2026-09-03 av X]`,
  );
});

test('flera append i rad staplas — avboka följt av återtagning bevarar BÅDA raderna', () => {
  const efterAvboka = appendNotering(
    null,
    byggNoteringsrad('avboka', '2026-09-03', 'Lotta', 'Sjuk'),
  );
  const efterAterta = appendNotering(
    efterAvboka,
    byggNoteringsrad('aterta', '2026-09-04', 'Lotta', null),
  );
  expect(efterAterta).toBe(
    '[Avbokad 2026-09-03 av Lotta] Sjuk\n\n[Avbokning återtagen 2026-09-04 av Lotta]',
  );
});

/* ═══════════════════════════ stockholmDatum ═══════════════════════════ */

test('stockholmDatum ger ÅÅÅÅ-MM-DD, sommartid (UTC+2)', () => {
  // 2026-09-03 22:30 UTC är fortfarande 2026-09-04 (00:30) i Stockholm — CEST.
  expect(stockholmDatum(new Date('2026-09-03T22:30:00.000Z'))).toBe('2026-09-04');
});

test('stockholmDatum ger ÅÅÅÅ-MM-DD, vintertid (UTC+1)', () => {
  // 2026-01-15 23:30 UTC är 2026-01-16 (00:30) i Stockholm — CET.
  expect(stockholmDatum(new Date('2026-01-15T23:30:00.000Z'))).toBe('2026-01-16');
});

test('stockholmDatum mitt på dagen är samma datumsträng oavsett årstid', () => {
  expect(stockholmDatum(new Date('2026-09-03T10:00:00.000Z'))).toBe('2026-09-03');
  expect(stockholmDatum(new Date('2026-01-15T10:00:00.000Z'))).toBe('2026-01-15');
});
