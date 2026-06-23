// Bevis-test för ADR-061 Pelare 2 (keystone) — den mode-medvetna koherens-grinden.
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI utan creds. Hermetiskt:
// literala test-URL:er (ej env) så grinden bevisas oberoende av maskinens .env-filer.
// Detta test är mekanismen som gör symptom-klassen icke-återuppståndlig — tas grinden
// bort failar detta test i CI (Test+Build), synligt i review.

import { expect, test } from '@playwright/test';
import {
  assertModeCoherent,
  assertTestSurfaceNotProd,
  isProdRef,
} from '../../src/lib/env-coherence';

// Literala referenser (ADR-061 Pelare 1: prod = lvjsf…, staging = pqtsh…).
const PROD_URL = 'https://lvjsfnphlauldxqlncpl.supabase.co';
const STAGING_URL = 'https://pqtshyierkdgwdnxuirz.supabase.co';

test.describe('ADR-061 Pelare 2 — assertModeCoherent (klient-yta)', () => {
  test('development + prod-ref → KASTAR', () => {
    expect(() => assertModeCoherent('development', PROD_URL)).toThrow(/ADR-061 Pelare 2/);
  });

  test('test + prod-ref → KASTAR', () => {
    expect(() => assertModeCoherent('test', PROD_URL)).toThrow(/MODE=test/);
  });

  test('staging + prod-ref → KASTAR (endast production får peka på prod)', () => {
    expect(() => assertModeCoherent('staging', PROD_URL)).toThrow(/ADR-061 Pelare 2/);
  });

  test('production + prod-ref → passerar (inget kast)', () => {
    expect(() => assertModeCoherent('production', PROD_URL)).not.toThrow();
  });

  test('development + staging-ref → passerar', () => {
    expect(() => assertModeCoherent('development', STAGING_URL)).not.toThrow();
  });
});

test.describe('ADR-061 Pelare 2 — assertTestSurfaceNotProd (test-yta, T12)', () => {
  test('prod-ref → KASTAR ovillkorligt', () => {
    expect(() => assertTestSurfaceNotProd(PROD_URL)).toThrow(/aldrig nå prod \(T12\)/);
  });

  test('staging-ref → passerar', () => {
    expect(() => assertTestSurfaceNotProd(STAGING_URL)).not.toThrow();
  });
});

test.describe('ADR-061 Pelare 2 — isProdRef', () => {
  test('prod-url → true, staging-url → false', () => {
    expect(isProdRef(PROD_URL)).toBe(true);
    expect(isProdRef(STAGING_URL)).toBe(false);
  });
});
