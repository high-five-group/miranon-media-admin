// Kontrakts-regressionstest för AttendanceSchema — `personNamn`-utökningen (Fas 6b
// L3, VÄGVAL A) + `narvaropoang`-utökningen (task-18.9, närvaro-registret).
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

test.describe('AttendanceSchema — närvaropoäng-utökningen (task-18.9: person × session + poäng-mappning)', () => {
  test('narvaropoang = 1 (Närvarande/Deltog online → poäng 1) → parse passerar, fältet är del av resultatet', () => {
    // Poäng-mappningen bor i basens formel `Närvaropoäng` (fldwuo94BY46VUOm4:
    // 1 om Status ∈ {Närvarande, Deltog online}, annars 0). get-attendance läser
    // det RÅ ur basen (scalarNumber) — registret räknar aldrig närvaro annorlunda
    // än rollup-kedjan. Fältet måste därför bäras genom parsen.
    const parsed = AttendanceSchema.parse(attendanceRow({ status: 'Närvarande', narvaropoang: 1 }));
    expect(parsed.narvaropoang).toBe(1);
  });

  test('narvaropoang = 0 (Frånvarande/Försenad/Avbröt/Ej avstämt → poäng 0) → parse passerar', () => {
    const parsed = AttendanceSchema.parse(
      attendanceRow({ status: 'Frånvarande', narvaropoang: 0 }),
    );
    expect(parsed.narvaropoang).toBe(0);
  });

  test('narvaropoang SAKNAS (deploy-gap: EF ännu ej deployad → additiv-optional) → parse passerar, undefined', () => {
    // Fältet är `.optional()`: den DEPLOYADE staging-EF:en returnerar ännu inte
    // Närvaropoäng (prod/staging-deploy är separat Marcus-auktoriserad, DoD #7).
    // Kontraktet får därför INTE kräva fältet — annars faller
    // get-attendance.staging-conformance-parsen mot den icke-deployade EF:en.
    // (Skiljer sig medvetet från personNamn som är required — det är redan deployat.)
    // Basfixturen bär medvetet INGEN narvaropoang → speglar den icke-deployade EF:en.
    const parsed = AttendanceSchema.parse(attendanceRow());
    expect(parsed.narvaropoang).toBeUndefined();
  });

  test('narvaropoang = null (scalarNumber-fallback: specialValue/NaN-objekt → null) → parse passerar', () => {
    const parsed = AttendanceSchema.parse(attendanceRow({ narvaropoang: null }));
    expect(parsed.narvaropoang).toBeNull();
  });

  test('narvaropoang icke-numerisk (sträng) → parse FAILAR (poängen är number-kontrakt)', () => {
    expect(() => AttendanceSchema.parse(attendanceRow({ narvaropoang: '1' }))).toThrow();
  });

  test('registrets cell-koordinat: raden bär person-identitet + session + poäng samtidigt', () => {
    // Registret placerar en cell på (person, session) och färgar den ur poängen.
    // En rad måste därför bära alla tre: person (raden), session (kolumnen) och
    // narvaropoang (cellens bock/streck) — det är "person × session + poäng-mappning".
    const parsed = AttendanceSchema.parse(
      attendanceRow({
        personId: 'recPER0000000009',
        personNamn: 'Ulrika Nilsson',
        session: 'Dag 2',
        status: 'Frånvarande',
        narvaropoang: 0,
      }),
    );
    expect(parsed.personId).toBe('recPER0000000009');
    expect(parsed.personNamn).toBe('Ulrika Nilsson');
    expect(parsed.session).toBe('Dag 2');
    expect(parsed.narvaropoang).toBe(0);
  });
});
