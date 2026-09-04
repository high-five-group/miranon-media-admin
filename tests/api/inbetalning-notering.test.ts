// Noteringen på inbetalningen — hermetisk svit (Marcus 2026-09-01).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI utan creds. Samma
// klass som `coerce.test.ts` och `betalningsbelopp.test.ts`: normaliseringen
// bevisas där den bor, i den delade Edge Function-modulen, i stället för genom
// en deployad funktion.
//
// TVÅ SAKER LÅSES HÄR, och de är olika slags påståenden:
//   1. `lasNotering` — normaliseringen. Ren funktion, uttömmande fallista.
//   2. `InbetalningSchema.notering` — TOLERANSEN mot ett svar från en Edge
//      Function som ännu inte deployats med noteringsstödet. Det är inte en
//      stilfråga: utan `.default(null)` kastar `parse` på ett svar utan
//      nyckeln, och HELA registreringen ser ut att ha misslyckats för Lotta
//      trots att raden ligger i Postgres. Fönstret är verkligt (migration +
//      EF-deploy är en separat, seriell handling), så det testas.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { InbetalningSchema } from '../../src/domain/schemas/Betalningar.schema';
import {
  lasNotering,
  NOTERING_MAX_LANGD,
} from '../../supabase/functions/_shared/inbetalning-notering';

/* ═══════════════════════════ lasNotering ═══════════════════════════ */

test('frånvaro och tomhet ger ALLA samma svar: null', () => {
  // Tre skilda sätt att säga "ingen notering" får inte bli tre skilda värden i
  // databasen — kolumnen har en check som förbjuder den tomma strängen.
  expect(lasNotering(undefined)).toEqual({ ok: true, varde: null });
  expect(lasNotering(null)).toEqual({ ok: true, varde: null });
  expect(lasNotering('')).toEqual({ ok: true, varde: null });
  expect(lasNotering('   ')).toEqual({ ok: true, varde: null });
  expect(lasNotering('\n\t ')).toEqual({ ok: true, varde: null });
});

test('en riktig notering trimmas men behåller sin inre text', () => {
  expect(lasNotering('  Betalade kontant på plats  ')).toEqual({
    ok: true,
    varde: 'Betalade kontant på plats',
  });
  // Inre radbrytningar och dubbla mellanslag är Lottas egna — de rörs inte.
  expect(lasNotering('Rad ett\nRad två')).toEqual({ ok: true, varde: 'Rad ett\nRad två' });
});

test('fel TYP och för LÅNG text är två olika fel, inte ett', () => {
  // Skälet: Lotta ska aldrig få "högst 500 tecken" när felet var att fältet
  // inte var text alls. Anroparen formulerar meddelandet ur `skal`.
  expect(lasNotering(42)).toEqual({ ok: false, skal: 'typ' });
  expect(lasNotering({ text: 'nej' })).toEqual({ ok: false, skal: 'typ' });
  expect(lasNotering(['a'])).toEqual({ ok: false, skal: 'typ' });
  expect(lasNotering(true)).toEqual({ ok: false, skal: 'typ' });

  const forLang = 'x'.repeat(NOTERING_MAX_LANGD + 1);
  expect(lasNotering(forLang)).toEqual({
    ok: false,
    skal: 'langd',
    langd: NOTERING_MAX_LANGD + 1,
  });
});

test('taket mäts EFTER trimning — omgivande blanksteg fäller inte en giltig notering', () => {
  const exaktPaTaket = 'x'.repeat(NOTERING_MAX_LANGD);
  expect(lasNotering(exaktPaTaket)).toEqual({ ok: true, varde: exaktPaTaket });

  // Samma text med blanksteg runt om är fortfarande giltig: trimningen sker
  // före mätningen. Mäts den före trimningen fälls detta fall felaktigt.
  const medBlanksteg = `   ${exaktPaTaket}   `;
  expect(lasNotering(medBlanksteg)).toEqual({ ok: true, varde: exaktPaTaket });
});

test('taket är samma tal som makulerings-skälets — inte ett eget', () => {
  // `hantera-inbetalning/index.ts` § SKAL_MAX_LANGD och databasens
  // `inbetalningar_notering_form` bär samma 500. Talet står här som en
  // förankring: ändras det på ett ställe ska denna rad tvinga fram frågan om
  // de andra två.
  expect(NOTERING_MAX_LANGD).toBe(500);
});

/* ═══════════════════════ KOLUMNLISTAN OCH DEPLOY-ORDNINGEN ═══════════════════════ */

/* KÄLLAN LÄSES SOM TEXT, INTE SOM MODUL — och det är inte lättja.
   `betalningar-db.ts` importerar `https://esm.sh/@supabase/supabase-js@2`, som
   Nodes ESM-laddare vägrar (mätt: sviten föll på exakt det innan denna form
   valdes). Textläsningen är alltså den ENDA vägen att vakta konstanten utan att
   deploya något. Den är trubbig — den ser en sträng, inte ett värde — och den
   räcker precis för den felklass som faktiskt hotar: att kolumnen finns i
   migrationen men glöms i select-listan, eller tvärtom. */
const las = (relativ: string) =>
  readFileSync(fileURLToPath(new URL(relativ, import.meta.url)), 'utf8');

test('notering står i BÅDE migrationen och select-listan — annars går de isär tyst', () => {
  const dbKalla = las('../../supabase/functions/_shared/betalningar-db.ts');
  const migration = las('../../supabase/migrations/20260901111500_inbetalning_notering.sql');

  // Kolumnlistan: utan `notering` här läses fältet aldrig tillbaka, och det
  // blir tyst `null` i hela appen trots att raden i Postgres bär texten.
  const listan = dbKalla.match(/export const INBETALNING_KOLUMNER =([\s\S]*?);/);
  expect(listan, 'INBETALNING_KOLUMNER hittades inte i källan').not.toBeNull();
  expect(listan?.[1]).toContain('notering');

  // Migrationen: utan kolumnen fäller PostgREST HELA select-anropet — och
  // eftersom nio Edge Functions delar listan slutar de alla att fungera.
  expect(migration).toContain('add column notering text');
  expect(migration).toContain('inbetalningar_notering_form');

  // Taket ska vara samma tal i koden och i databasens check.
  expect(migration).toContain(String(NOTERING_MAX_LANGD));
});

/* ═══════════════════════ SCHEMATS TOLERANS ═══════════════════════ */

const RAD_UTAN_NOTERING = {
  id: '11111111-1111-4111-8111-111111111111',
  anmalanRecordId: 'recANM0000000001',
  ogonblicksbildNamn: 'Astrid Almqvist',
  ogonblicksbildEvent: 'Fjärrskådning',
  ogonblicksbildEventdatum: '2026-09-07',
  belopp: 1000,
  betalsatt: 'Swish',
  betalningsdatum: '2026-08-30',
  typ: 'inbetalning',
  status: 'aktiv',
  makuleradSkal: null,
  makuleradNar: null,
  bankreferens: null,
  kvittoId: null,
  skapadAv: 'lotta@miranonmedia.se',
  skapadNar: '2026-08-30T09:00:00.000Z',
};

test('ett svar UTAN notering parsas och ger null — deploy-fönstret kraschar inte', () => {
  // Detta ÄR svaret från en Edge Function som ännu inte deployats med
  // noteringsstödet. Kastade schemat här skulle Lotta se ett fel trots att
  // inbetalningen registrerats.
  const parsad = InbetalningSchema.parse(RAD_UTAN_NOTERING);
  expect(parsad.notering).toBeNull();
});

test('ett svar MED notering bär texten igenom', () => {
  const parsad = InbetalningSchema.parse({
    ...RAD_UTAN_NOTERING,
    notering: 'Betalade kontant på plats',
  });
  expect(parsad.notering).toBe('Betalade kontant på plats');
});

test('explicit null accepteras, och ett tal gör det INTE', () => {
  expect(InbetalningSchema.parse({ ...RAD_UTAN_NOTERING, notering: null }).notering).toBeNull();
  // Toleransen gäller FRÅNVARO, aldrig fel typ — annars hade den dolt ett
  // verkligt kontraktsbrott mellan klient och server.
  expect(() => InbetalningSchema.parse({ ...RAD_UTAN_NOTERING, notering: 42 })).toThrow();
});
