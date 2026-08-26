// Bilage-filnamnssaneringen (TASK-309.22) — api-pure (ren logik, ingen
// staging, inga creds). Regressionstest mot PRODUKTIONSKODEN, inte en
// lokal kopia — möjliggjort av att `sanitizeFilnamn`/`buildAttachmentLeaf`/
// `buildAttachmentPath` flyttades till en zod-fri `_shared/attachment-
// filename.ts` (se den filens docblock för varför flytten var nödvändig,
// inte bara städning: `_shared/attachments.ts` importerar zod från
// `esm.sh`, vilket Node/Playwright inte kan resolva — verifierat empiriskt
// under detta korts bygge, `ERR_UNSUPPORTED_ESM_URL_SCHEME`).
//
// ROTORSAK (Marcus prod-röktest 2026-08-26): uppladdning av
// `2025-HörlurarMiranonMedia.pdf` gav `upload-attachment` 502 `Invalid key:
// alla-event/…-2025-HörlurarMiranonMedia.pdf`. Supabase Storages
// nyckel-regex (`supabase/storage` `src/storage/limits.ts`,
// `VALID_OBJECT_KEY`, hämtad live mot `master` 2026-08-26) tillåter bara
// `/^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/` — å/ä/ö/é/… (och CJK, emoji, …)
// ligger utanför. `STORAGE_KEY_RE` nedan är en VERBATIM kopia av den
// regexen (minus `/`, se `_shared/attachment-filename.ts`s
// `STORAGE_UNSAFE_CHAR_RE`-docblock för varför) — varje test som påstår
// "giltig nyckel" bevisar det mot PLATTFORMENS EGEN regel, inte mot ett
// eget antagande om vad som borde vara giltigt.
//
// FORSKNINGSPRECEDENT (citerad i PR-beskrivningen): `supabase/supabase`
// #34596 är Supabases EGEN dropzone-fix för PRECIS detta InvalidKey-fel
// (`generateSafeFilename`, NFD + strippa combining marks + `[^\w\s-]`→`-`).
// Vår `toStorageSafe` (icke-exporterad, testad indirekt via
// `sanitizeFilnamn`) avviker MEDVETET på steg 2: `[^\w\s-]` hade skrivit om
// mellanslag/parenteser/`&`/`'` — alla GILTIGA enligt Storage-regexen — till
// bindestreck, vilket bryter regressionskravet "befintliga ASCII-namn
// oförändrade". Testerna "ASCII-namn ... OFÖRÄNDRADE" nedan bevisar att vårt
// snävare steg 2 (`STORAGE_UNSAFE_CHAR_RE`) håller den skillnaden.

import { expect, test } from '@playwright/test';
import {
  buildAttachmentLeaf,
  buildAttachmentPath,
  sanitizeFilnamn,
} from '../../supabase/functions/_shared/attachment-filename';

/** VERBATIM mot supabase/storage `src/storage/limits.ts`s `VALID_OBJECT_KEY`
 *  (hämtad live mot `master` 2026-08-26) — se filhuvudet. */
const STORAGE_KEY_RE = /^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/;

const ATTACHMENT_ID = '11111111-2222-3333-4444-555555555555';

test.describe('sanitizeFilnamn — ASCII-namn förblir BYTE FÖR BYTE oförändrade (regression)', () => {
  test('enkelt ASCII-namn', () => {
    expect(sanitizeFilnamn('kvitto-2026.pdf')).toBe('kvitto-2026.pdf');
  });

  test('mellanslag, parenteser, apostrof, ampersand — alla GILTIGA enligt Storage-regexen', () => {
    // Dessa tecken ligger ALLA inom STORAGE_KEY_RE — ett steg som (som
    // supabase/supabase#34596:s `[^\w\s-]`) skrev om dem till bindestreck
    // hade fällt just detta test.
    const name = "Meny (uppdaterad) & Roger's prislista 2026.pdf";
    expect(sanitizeFilnamn(name)).toBe(name);
    expect(STORAGE_KEY_RE.test(sanitizeFilnamn(name))).toBe(true);
  });

  test('$, @, ;, :, +, ,, ?, !, *, = — hela Storage-regexens ASCII-specialtecken oförändrade', () => {
    const name = 'pris$500@2026;test:ok+1,2?!*=.pdf';
    expect(sanitizeFilnamn(name)).toBe(name);
    expect(STORAGE_KEY_RE.test(sanitizeFilnamn(name))).toBe(true);
  });
});

test.describe('sanitizeFilnamn — icke-ASCII faller till en GILTIG Storage-nyckel (TASK-309.22 AC)', () => {
  test('rotorsaksfallet: "2025-HörlurarMiranonMedia.pdf" (Marcus prod-röktest 2026-08-26)', () => {
    const result = sanitizeFilnamn('2025-HörlurarMiranonMedia.pdf');
    expect(result).toBe('2025-HorlurarMiranonMedia.pdf');
    expect(STORAGE_KEY_RE.test(result)).toBe(true);
  });

  test('svenska å/ä/ö i båda kasus + vanliga europeiska diakritiska tecken', () => {
    const cases: Array<[string, string]> = [
      ['ÅÄÖåäö.pdf', 'AAOaao.pdf'],
      ['café.pdf', 'cafe.pdf'],
      ['über.pdf', 'uber.pdf'],
      ['piñata.pdf', 'pinata.pdf'],
      ['façade.pdf', 'facade.pdf'],
    ];
    for (const [input, expected] of cases) {
      const result = sanitizeFilnamn(input);
      expect(result).toBe(expected);
      expect(STORAGE_KEY_RE.test(result)).toBe(true);
    }
  });

  test('skript som INTE diakritik-dekomponerar (CJK) faller ändå till en giltig nyckel', () => {
    // NFKD gör ingenting för CJK-ideogram — fallback-ersättningen
    // (STORAGE_UNSAFE_CHAR_RE → '-') är vad som GARANTERAR giltighet här,
    // inte normaliseringssteget. Detta är den branschbelagda gränsen för
    // en deburrings-metod (samma gräns supabase/storage-issue #22974,
    // "填报指南.pdf", dokumenterar).
    const result = sanitizeFilnamn('填报指南.pdf');
    expect(STORAGE_KEY_RE.test(result)).toBe(true);
    expect(result.endsWith('.pdf')).toBe(true);
  });

  test('emoji (surrogatpar) — EN kodpunkt ger ETT bindestreck, inte två', () => {
    // Utan `u`-flaggan på STORAGE_UNSAFE_CHAR_RE hade JS matchat varje
    // UTF-16-halva av emojin separat (två bindestreck). Detta test
    // diskriminerar den skillnaden.
    const result = sanitizeFilnamn('😀emoji.pdf');
    expect(result).toBe('-emoji.pdf');
    expect(STORAGE_KEY_RE.test(result)).toBe(true);
  });
});

test.describe('sanitizeFilnamn — styrtecken och path-separatorer (OFÖRÄNDRAT beteende, TASK-146.4)', () => {
  test('styrtecken (kodpunkt 0–31, DEL/127) tas bort — inte ersätts', () => {
    expect(sanitizeFilnamn('bad\x00name\x1fx\x7f.pdf')).toBe('badnamex.pdf');
  });

  test('path-separatorer (/, \\) blir bindestreck', () => {
    expect(sanitizeFilnamn('a/b\\c.pdf')).toBe('a-b-c.pdf');
  });

  test('trimmas i kanterna, cappas vid 200 tecken', () => {
    expect(sanitizeFilnamn('  spaced.pdf  ')).toBe('spaced.pdf');
    const longAscii = `${'a'.repeat(250)}.pdf`;
    const result = sanitizeFilnamn(longAscii);
    expect(result.length).toBe(200);
    expect(result).toBe(longAscii.slice(0, 200));
  });

  test('cappning gäller även efter icke-ASCII-transformation (längden mäts EFTER fallet till ASCII)', () => {
    const longNonAscii = `${'ö'.repeat(250)}.pdf`;
    const result = sanitizeFilnamn(longNonAscii);
    expect(result.length).toBe(200);
    expect(STORAGE_KEY_RE.test(result)).toBe(true);
  });
});

test.describe('buildAttachmentLeaf / buildAttachmentPath — leaf/path-formeln i båda riktningar', () => {
  test('ASCII-namn: leaf/path oförändrade mot formeln <attachmentId>-<filnamn> / <anchor>/<leaf>', () => {
    const leaf = buildAttachmentLeaf(ATTACHMENT_ID, 'kvitto-2026.pdf');
    expect(leaf).toBe(`${ATTACHMENT_ID}-kvitto-2026.pdf`);
    expect(buildAttachmentPath('rec0123456789ABCD', ATTACHMENT_ID, 'kvitto-2026.pdf')).toBe(
      `rec0123456789ABCD/${leaf}`,
    );
  });

  test('icke-ASCII-namn: leaf/path är giltiga Storage-nycklar (regressionens motiv, se filhuvudet)', () => {
    const leaf = buildAttachmentLeaf(ATTACHMENT_ID, '2025-HörlurarMiranonMedia.pdf');
    expect(leaf).toBe(`${ATTACHMENT_ID}-2025-HorlurarMiranonMedia.pdf`);
    const path = buildAttachmentPath('alla-event', ATTACHMENT_ID, '2025-HörlurarMiranonMedia.pdf');
    expect(path).toBe(`alla-event/${leaf}`);
    // Hela PATHEN (inte bara leaf-segmentet) måste vara giltig — path
    // innehåller `/` som avsiktligt separator, så testa mot den FULLA
    // käll-regexen (som TILLÅTER `/`), inte den `/`-fria leaf-varianten.
    const FULL_STORAGE_PATH_RE = /^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/;
    expect(FULL_STORAGE_PATH_RE.test(path)).toBe(true);
  });
});
