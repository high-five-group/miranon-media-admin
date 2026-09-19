// Enhetstest för CORS-originbeslutets mönstermatchning (TASK-415.1, katalogpost
// "staging-EF:ernas CORS släpper Vercel-previews via ett mönster i egen variabel").
//
// api-pure (ren logik, ingen staging, ingen Deno): testet importerar
// cors-origin-policy.ts DIREKT, aldrig cors.ts. cors.ts läser Deno.env.get(...)
// och fäller typecheck med TS2304 "Cannot find name 'Deno'" om den dras in i
// tests-programmet — exakt samma skäl som airtable-retry.test.ts (TASK-53)
// importerar airtable-retry.ts i stället för airtable-client.ts. Se
// cors-origin-policy.ts:s eget filhuvud för den fulla motiveringen.
//
// Formen är föreskriven av kortets AC #2: "exakt träff, mönsterträff (båda
// Vercel-adressformerna), avvisad origin, bart *, saknad Origin på preflight."
// `decideOrigin` speglar HELA cors.ts:s isAllowedOrigin-beslut (exaktlista
// FÖRST, mönsterlista EFTER) och täcker därmed även "saknad Origin på
// preflight" utan att röra Deno-koden: handleCors() 403:ar exakt när
// decideOrigin(null, …).allowed är false.

import { expect, test } from '@playwright/test';
import {
  compileOriginPattern,
  compileOriginPatterns,
  decideOrigin,
  matchesAnyPattern,
  parseCommaSeparatedList,
} from '../../supabase/functions/_shared/cors-origin-policy';

// De två Vercel-adressformerna, källmärkta:
//
// - Commit-form: MÄTT skarpt 2026-09-06 mot GitHubs Deployments-API för
//   DETTA repo (`gh api repos/.../deployments/<id>/statuses`,
//   environment_url), två oberoende exempel: miranon-media-admin-462he0s8t
//   och miranon-media-admin-n3gl2rmal — INGEN team-scope-del. Detta
//   bekräftar (samma dag, annan metod) forskningspassets fynd
//   (docs/research/pr-forhandsvisningar-och-backend-branschmonster-2026-09-06.md
//   §1.4 "Mätt avvikelse … utan scope-del").
// - Gren-form: kortets EGEN dokumenterade form (trunkerat projektnamn +
//   "-git-<slug>"). Kunde INTE bekräftas skarpt i detta pass — Vercel MCP är
//   exkluderat ur bygg-agentens verktygskontrakt och gren-alias-gissningar
//   mot verkliga PR-grenar gav 404 (se slutrapportens avvikelse-avsnitt).
//   Mönstret nedan täcker båda GENOM att ankra på två kända prefix-varianter
//   i stället för att gissa en enda exakt form.
const COMMIT_FORM_1 = 'https://miranon-media-admin-462he0s8t.vercel.app';
const COMMIT_FORM_2 = 'https://miranon-media-admin-n3gl2rmal.vercel.app';
const BRANCH_FORM = 'https://miranon-media-ad-git-task-415-1-cors-preview-monster.vercel.app';

const STAGING_PATTERNS = [
  'https://miranon-media-admin-*.vercel.app',
  'https://miranon-media-ad-git-*.vercel.app',
];

test.describe('compileOriginPattern — fail-closed-validering (AC #1)', () => {
  test('giltigt mönster med literal prefix + suffix kompileras', () => {
    expect(compileOriginPattern('https://miranon-media-admin-*.vercel.app')).not.toBeNull();
  });

  test('bart "*" underkänns — inget literalt tecken alls', () => {
    expect(compileOriginPattern('*')).toBeNull();
  });

  test('"https://*" underkänns — host är enbart wildcard', () => {
    expect(compileOriginPattern('https://*')).toBeNull();
  });

  test('"https://*.*" underkänns — ENDAST wildcard-segment, ingen literal domän-del', () => {
    expect(compileOriginPattern('https://*.*')).toBeNull();
  });

  test('saknad https://-prefix underkänns (t.ex. http:// eller bar host)', () => {
    expect(compileOriginPattern('http://miranon-media-admin-*.vercel.app')).toBeNull();
    expect(compileOriginPattern('miranon-media-admin-*.vercel.app')).toBeNull();
  });

  test('mönster med path underkänns — Origin bär aldrig path', () => {
    expect(compileOriginPattern('https://miranon-media-admin-*.vercel.app/callback')).toBeNull();
  });

  test('tomt mönster underkänns', () => {
    expect(compileOriginPattern('')).toBeNull();
    expect(compileOriginPattern('   ')).toBeNull();
  });

  test('"*.vercel.app" GODKÄNNS av fail-closed-regeln (har literal ".vercel.app") — medvetet dokumenterad gräns', () => {
    // Regeln kortet ställer är "minst en literal domän-del", inte "tillräckligt
    // specifik för oss". *.vercel.app har en literal domän-del (vercel.app)
    // och passerar därför valideringen — vi VÄLJER ändå att aldrig konfigurera
    // så brett mönster (se cors-origin-policy.ts filhuvud + PR-beskrivningen).
    // Testet dokumenterar gränsen så att den aldrig av misstag skärps tyst.
    expect(compileOriginPattern('https://*.vercel.app')).not.toBeNull();
  });
});

test.describe('compileOriginPattern — punkten är en gräns wildcarden aldrig hoppar över', () => {
  test('mönstret matchar inte en underdomän-attack som lägger in en egen punkt', () => {
    const regex = compileOriginPattern('https://miranon-media-admin-*.vercel.app');
    expect(regex).not.toBeNull();
    // "x.evil.com" smugglat in i wildcard-segmentet ska INTE matcha —
    // `[^.]*` stannar vid första punkten, och `$` kräver att strängen tar slut
    // exakt vid ".vercel.app".
    expect(regex?.test('https://miranon-media-admin-x.evil.com.vercel.app')).toBe(false);
    expect(regex?.test('https://miranon-media-admin-462he0s8t.vercel.app')).toBe(true);
  });
});

test.describe('decideOrigin — exakt träff (AC #2)', () => {
  test('origin i exaktlistan tillåts, oavsett mönsterlista', () => {
    const result = decideOrigin('https://admin.miranon.dev', ['https://admin.miranon.dev'], []);
    expect(result.allowed).toBe(true);
    expect(result.rejectedPatterns).toEqual([]);
  });

  test('exaktlistan prövas FÖRE mönsterlistan — en exakt träff kräver ingen mönsterkompilering', () => {
    // Ogiltiga mönster i listan ska inte spilla över på rejectedPatterns när
    // exaktlistan redan avgjorde träffen (kortets ordning: exakt → mönster).
    const result = decideOrigin('https://admin.miranon.dev', ['https://admin.miranon.dev'], ['*']);
    expect(result.allowed).toBe(true);
    expect(result.rejectedPatterns).toEqual([]);
  });
});

test.describe('decideOrigin — mönsterträff, BÅDA Vercel-adressformerna (AC #2)', () => {
  test('commit-form (mätt skarpt, två oberoende exempel) matchar', () => {
    expect(decideOrigin(COMMIT_FORM_1, [], STAGING_PATTERNS).allowed).toBe(true);
    expect(decideOrigin(COMMIT_FORM_2, [], STAGING_PATTERNS).allowed).toBe(true);
  });

  test('gren-form (kortets dokumenterade trunkerade prefix) matchar', () => {
    expect(decideOrigin(BRANCH_FORM, [], STAGING_PATTERNS).allowed).toBe(true);
  });

  test('mönster prövas EFTER exaktlistan — matchar även när exaktlistan är befolkad men inte träffad', () => {
    const result = decideOrigin(COMMIT_FORM_1, ['https://admin.miranon.dev'], STAGING_PATTERNS);
    expect(result.allowed).toBe(true);
  });
});

test.describe('decideOrigin — avvisad origin (AC #2)', () => {
  test('origin utanför både exaktlista och mönsterlista nekas', () => {
    const result = decideOrigin(
      'https://attacker.example.com',
      ['https://admin.miranon.dev'],
      STAGING_PATTERNS,
    );
    expect(result.allowed).toBe(false);
  });

  test('en SNARLIK men inte matchande Vercel-adress nekas (fel projektnamn)', () => {
    const result = decideOrigin(
      'https://ett-helt-annat-projekt-462he0s8t.vercel.app',
      [],
      STAGING_PATTERNS,
    );
    expect(result.allowed).toBe(false);
  });

  test('tom exaktlista + tom mönsterlista → deny-by-default', () => {
    const result = decideOrigin('https://admin.miranon.dev', [], []);
    expect(result.allowed).toBe(false);
    expect(result.rejectedPatterns).toEqual([]);
  });
});

test.describe('decideOrigin — bart "*" i konfigurationen (AC #2, fail-closed)', () => {
  test('CORS_ALLOWED_ORIGIN_PATTERNS="*" matchar ALDRIG något — faller aldrig tillbaka till "tillåt allt"', () => {
    const result = decideOrigin(COMMIT_FORM_1, [], ['*']);
    expect(result.allowed).toBe(false);
    expect(result.rejectedPatterns).toEqual(['*']);
  });

  test('en giltig mönster-granne räddar inte ett bart "*" i samma lista — och tvärtom, "*" förstör inte grannen', () => {
    const result = decideOrigin(
      COMMIT_FORM_1,
      [],
      ['*', 'https://miranon-media-admin-*.vercel.app'],
    );
    expect(result.allowed).toBe(true); // grannen matchar
    expect(result.rejectedPatterns).toEqual(['*']); // men "*" bokförs ändå som avvisat
  });
});

test.describe('decideOrigin — saknad Origin på preflight (AC #2)', () => {
  // handleCors() i cors.ts kallar isAllowedOrigin bara när origin finns; en
  // OPTIONS UTAN Origin-header 403:as direkt (`!origin || !isAllowedOrigin(origin)`).
  // decideOrigin(null, …) är den rena motsvarigheten till den grenen.
  test('null-origin nekas oavsett hur breda listorna är', () => {
    expect(decideOrigin(null, ['https://admin.miranon.dev'], ['*.vercel.app']).allowed).toBe(false);
  });

  test('tom sträng som origin nekas', () => {
    expect(decideOrigin('', ['https://admin.miranon.dev'], STAGING_PATTERNS).allowed).toBe(false);
  });

  test('undefined-origin nekas (samma gren som null)', () => {
    expect(decideOrigin(undefined, [], STAGING_PATTERNS).allowed).toBe(false);
  });
});

test.describe('parseCommaSeparatedList — delad av exaktlista och mönsterlista', () => {
  test('trimmar och filtrerar bort tomma segment', () => {
    expect(parseCommaSeparatedList(' https://a.example.com ,, https://b.example.com,')).toEqual([
      'https://a.example.com',
      'https://b.example.com',
    ]);
  });

  test('null/undefined/tom sträng ger tom lista (deny-by-default-grunden)', () => {
    expect(parseCommaSeparatedList(null)).toEqual([]);
    expect(parseCommaSeparatedList(undefined)).toEqual([]);
    expect(parseCommaSeparatedList('')).toEqual([]);
  });
});

test.describe('compileOriginPatterns + matchesAnyPattern — lagret decideOrigin bygger på', () => {
  test('rejected innehåller ENDAST de ogiltiga mönstren, i original-sträng-form', () => {
    const { compiled, rejected } = compileOriginPatterns([
      'https://miranon-media-admin-*.vercel.app',
      '*',
      'https://*.*',
    ]);
    expect(compiled).toHaveLength(1);
    expect(rejected).toEqual(['*', 'https://*.*']);
  });

  test('matchesAnyPattern true om NÅGOT kompilerat mönster matchar', () => {
    const { compiled } = compileOriginPatterns(STAGING_PATTERNS);
    expect(matchesAnyPattern(COMMIT_FORM_1, compiled)).toBe(true);
    expect(matchesAnyPattern(BRANCH_FORM, compiled)).toBe(true);
    expect(matchesAnyPattern('https://attacker.example.com', compiled)).toBe(false);
  });
});
