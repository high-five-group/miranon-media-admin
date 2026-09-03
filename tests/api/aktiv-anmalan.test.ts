// arAktivAnmalan-kontraktstest — TASK-368.1/TASK-213.8, api-pure (ren
// logik, ingen staging-koppling): `src/lib/aktiv-anmalan.ts` importerar bara
// domäntyperna och är Node-körbar utan mock.
//
// Basformeln predikatet speglar (Anmälningar.Är aktiv (1/0), fld4j7PeckDViTdIB,
// TASK-368.1 2026-09-03): IF(OR({Status}="Avbokad/Ombokad", {Status}="Inställt"), 0, 1).
//
// Sviten pinnar ALLA SEX RegistrationStatus-värden explicit — inte bara de två
// exkluderade — så en framtida statustillökning måste ta ställning här
// (samma disciplin som betalningsharledning.test.ts).

import { expect, test } from '@playwright/test';
import type { Registration } from '../../src/domain/models/Registration';
import { RegistrationStatus, type RegistrationStatusValue } from '../../src/domain/types/Status';
import { arAktivAnmalan } from '../../src/lib/aktiv-anmalan';

/** Minimal Registration-fixtur — enda relevanta fältet är `status`. */
function reg(status: RegistrationStatusValue | null): Registration {
  return {
    id: 'recTest',
    namn: 'Test Testsson',
    fornamn: 'Test',
    efternamn: 'Testsson',
    email: null,
    telefon: null,
    eventNamn: null,
    ort: null,
    status,
    flagga: null,
    anmalningsavgift: null,
    slutbetalning: null,
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEvent',
    personId: null,
  };
}

test.describe('arAktivAnmalan — basens Är aktiv (1/0)-formel', () => {
  test('Avbokad/Ombokad är INTE aktiv', () => {
    expect(arAktivAnmalan(reg(RegistrationStatus.AVBOKAD))).toBe(false);
  });

  test('Inställt är INTE aktiv (TASK-213.8-fixen — tidigare felaktigt true)', () => {
    expect(arAktivAnmalan(reg(RegistrationStatus.INSTALLT))).toBe(false);
  });

  test('Obekräftad ÄR aktiv', () => {
    expect(arAktivAnmalan(reg(RegistrationStatus.OBEKRAFTAD))).toBe(true);
  });

  test('Bekräftad (mail skickat) ÄR aktiv', () => {
    expect(arAktivAnmalan(reg(RegistrationStatus.BEKRAFTAD))).toBe(true);
  });

  test('Betalningspåminnelse skickad ÄR aktiv', () => {
    expect(arAktivAnmalan(reg(RegistrationStatus.BETALNINGSPAMINNELSE))).toBe(true);
  });

  test('Flytta till väntelista ÄR aktiv (basformeln exkluderar den inte)', () => {
    expect(arAktivAnmalan(reg(RegistrationStatus.FLYTTA_TILL_VANTELISTA))).toBe(true);
  });

  test('null-status (aldrig observerat i basen, men typen tillåter det) ÄR aktiv', () => {
    expect(arAktivAnmalan(reg(null))).toBe(true);
  });
});
