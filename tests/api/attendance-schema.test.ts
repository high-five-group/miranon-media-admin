// Kontrakts-regressionstest för AttendanceSchema — `personNamn`-utökningen (Fas 6b
// L3, VÄGVAL A).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI utan creds. Låser det
// utökade biblioteks-kontraktet: `personNamn` är nu DEL av den parsade formen, och
// schemat ändras ALDRIG igen utan att detta test bevisar den nya formen (L142:
// testet exercerar fältet, inte bara typen). Symmetri-grind: modellen
// (Attendance.ts) bär samma fält — divergens fångas av tsc, formen av detta test.

import { expect, test } from '@playwright/test';
import { AttendanceSchema } from '../../src/domain/schemas/Attendance.schema';

/** En komplett, giltig Attendance-rad (EF-svarets form). */
function attendanceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recATT0000000001',
    anmalanId: 'recANM0000000001',
    eventId: 'recEVT0000000001',
    personId: 'recPER0000000001',
    personNamn: 'Gunilla Andersson',
    session: 'Dag 1',
    status: 'Närvarande',
    noteringar: null,
    avstamt: '2026-05-02T10:00:00.000Z',
    ...overrides,
  };
}

test.describe('AttendanceSchema — personNamn-kontrakt (Fas 6b L3)', () => {
  test('personNamn satt (sträng) → parse passerar, fältet är del av resultatet', () => {
    const parsed = AttendanceSchema.parse(attendanceRow());
    expect(parsed.personNamn).toBe('Gunilla Andersson');
  });

  test('personNamn = null (namn-batch-miss / namnlös) → parse passerar', () => {
    const parsed = AttendanceSchema.parse(attendanceRow({ personNamn: null }));
    expect(parsed.personNamn).toBeNull();
  });

  test('personNamn = "Ej tillgängligt" (Personer.Namn för namnlös person) → parse passerar', () => {
    // Personer.Namn-formeln ger "Ej tillgängligt" när Förnamn+Efternamn är tomma;
    // get-attendance fäster den strängen rakt av (graciöst, ej fel).
    const parsed = AttendanceSchema.parse(attendanceRow({ personNamn: 'Ej tillgängligt' }));
    expect(parsed.personNamn).toBe('Ej tillgängligt');
  });

  test('personNamn SAKNAS helt → parse FAILAR (fältet är obligatoriskt i kontraktet)', () => {
    const { personNamn: _omit, ...utan } = attendanceRow();
    expect(() => AttendanceSchema.parse(utan)).toThrow();
  });

  test('befintliga fält orörda: session/status-enum + nullable-länkar håller', () => {
    // Additiv utökning får inte rubba det gamla kontraktet.
    const parsed = AttendanceSchema.parse(
      attendanceRow({
        session: 'Föreläsning',
        status: 'Ej avstämt',
        anmalanId: null,
        eventId: null,
        personId: null,
      }),
    );
    expect(parsed.session).toBe('Föreläsning');
    expect(parsed.status).toBe('Ej avstämt');
    expect(parsed.personId).toBeNull();
  });
});
