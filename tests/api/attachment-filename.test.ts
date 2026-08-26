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
// [REVIDERAT EFTER REVIEW-RUNDA 1] Denna svit täcker NU TVÅ separata
// funktioner med OLIKA jobb — se `_shared/attachment-filename.ts`s
// docblock för det fulla resonemanget:
//
//   - `sanitizeFilnamn` — IDENTITETS-bärande sanering (separator-/
//     styrtecken-städning, trim, 200-cap). Faller ALDRIG till ASCII. Detta
//     är strängen `upload-attachment/index.ts`s `deriveAttachmentId`
//     hashar (TASK-316:s idempotens-nyckel) — TVÅ OLIKA filnamn (oavsett
//     skript) ska alltid ge OLIKA `sanitizeFilnamn`-utdata.
//   - `buildAttachmentLeaf`/`buildAttachmentPath` — bygger STORAGE-nyckeln.
//     Applicerar ASCII-fallet (`toStorageSafe`, internt i
//     `buildAttachmentLeaf`) PÅ TOPPEN av `sanitizeFilnamn`s utdata. Detta
//     är den enda platsen icke-ASCII-tecken faktiskt transformeras.
//
// En TIDIGARE version av denna skiva lät `sanitizeFilnamn` SJÄLV falla till
// ASCII (och hashade DEN formen) — review-runda 1 visade empiriskt att
// detta kollapsar HELT OLIKA filnamn (inte bara diakritik-varianter) till
// samma hash-underlag: `填报指南.pdf`/`肆意妄为.pdf` och `😀`/`🎉` föll till
// identisk ASCII-form. Två filer med olika namn och byte-identiskt innehåll
// hade då fått SAMMA `attachmentId` — en genuint ny uppladdning hade blivit
// en falsk idempotent replay. Testerna nedan bevisar båda hälfterna: att
// `sanitizeFilnamn` INTE kollapsar (hash-underlaget), och att
// `buildAttachmentLeaf` GARANTERAT producerar en giltig Storage-nyckel
// (leaf-underlaget) — även när den kollapsar OLIKA filnamns ASCII-SUFFIX,
// eftersom UUID-PREFIXET (attachmentId, alltid unikt när hash-underlaget
// skiljer sig) bär den faktiska unikheten i den fulla nyckeln.
//
// FORSKNINGSPRECEDENT (citerad i PR-beskrivningen): `supabase/supabase`
// #34596 är Supabases EGEN dropzone-fix för PRECIS detta InvalidKey-fel
// (`generateSafeFilename`, NFD + strippa combining marks + `[^\w\s-]`→`-`).
// Vår `toStorageSafe` avviker MEDVETET på steg 2: `[^\w\s-]` hade skrivit
// om mellanslag/parenteser/`&`/`'` — alla GILTIGA enligt Storage-regexen —
// till bindestreck, vilket bryter regressionskravet "befintliga ASCII-namn
// oförändrade". Testerna "ASCII-namn ... OFÖRÄNDRADE" nedan bevisar att vårt
// snävare steg 2 (`STORAGE_UNSAFE_CHAR_RE`) håller den skillnaden.

import { expect, test } from '@playwright/test';
import {
  buildAttachmentLeaf,
  buildAttachmentPath,
  sanitizeFilnamn,
} from '../../supabase/functions/_shared/attachment-filename';

/** VERBATIM mot supabase/storage `src/storage/limits.ts`s `VALID_OBJECT_KEY`
 *  (hämtad live mot `master` 2026-08-26) — se filhuvudet. Utan `/` (gäller
 *  ett leaf-SEGMENT, inte en hel path). */
const STORAGE_KEY_RE = /^[A-Za-z0-9_!.*'() &$=@;:+,?-]*$/;

/** Samma regex, MED `/` — för hela paths (`buildAttachmentPath`s utdata). */
const STORAGE_PATH_RE = /^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/;

const ATTACHMENT_ID_A = '11111111-2222-3333-4444-555555555555';
const ATTACHMENT_ID_B = '99999999-8888-7777-6666-000000000000';

test.describe('sanitizeFilnamn — HASH-underlaget: identitetsbärande, faller ALDRIG till ASCII', () => {
  test('ASCII-namn: mellanslag, parenteser, apostrof, ampersand, $, @, ;, :, +, ,, ?, !, *, = — allt oförändrat', () => {
    expect(sanitizeFilnamn('kvitto-2026.pdf')).toBe('kvitto-2026.pdf');
    const name = "Meny (uppdaterad) & Roger's prislista 2026.pdf";
    expect(sanitizeFilnamn(name)).toBe(name);
    const special = 'pris$500@2026;test:ok+1,2?!*=.pdf';
    expect(sanitizeFilnamn(special)).toBe(special);
  });

  test('icke-ASCII BEVARAS oförändrat — sanitizeFilnamn faller INTE till ASCII', () => {
    expect(sanitizeFilnamn('2025-HörlurarMiranonMedia.pdf')).toBe('2025-HörlurarMiranonMedia.pdf');
    expect(sanitizeFilnamn('café.pdf')).toBe('café.pdf');
    expect(sanitizeFilnamn('填报指南.pdf')).toBe('填报指南.pdf');
  });

  test('KRITISKT (review-runda 1): olika diakritik-varianter av samma ord ger OLIKA hash-underlag', () => {
    // Detta ÄR fixen på review-fyndet: FÖRE denna revidering hashade
    // deriveAttachmentId den ASCII-fallna formen, och café.pdf/cafe.pdf
    // kolliderade. Nu ska de SKILJA sig, precis som två olika filnamn ska.
    expect(sanitizeFilnamn('café.pdf')).not.toBe(sanitizeFilnamn('cafe.pdf'));
  });

  test('KRITISKT (review-runda 1): två HELT OLIKA CJK-strängar ger OLIKA hash-underlag', () => {
    // Review visade att ASCII-fallet kollapsar dessa till IDENTISK sträng
    // ("----.pdf") — om HASHEN använde den formen hade två olika filer
    // fått samma attachmentId. sanitizeFilnamn (ej ASCII-fallen) håller
    // dem isär.
    expect(sanitizeFilnamn('填报指南.pdf')).not.toBe(sanitizeFilnamn('肆意妄为.pdf'));
  });

  test('KRITISKT (review-runda 1): två HELT OLIKA emoji ger OLIKA hash-underlag', () => {
    expect(sanitizeFilnamn('😀.pdf')).not.toBe(sanitizeFilnamn('🎉.pdf'));
  });

  test('IDEMPOTENS (TASK-316): samma filnamn två gånger → identiskt hash-underlag', () => {
    expect(sanitizeFilnamn('x.pdf')).toBe(sanitizeFilnamn('x.pdf'));
    expect(sanitizeFilnamn('2025-HörlurarMiranonMedia.pdf')).toBe(
      sanitizeFilnamn('2025-HörlurarMiranonMedia.pdf'),
    );
  });

  test('styrtecken (kodpunkt 0–31, DEL/127) tas bort — inte ersätts (OFÖRÄNDRAT, TASK-146.4)', () => {
    expect(sanitizeFilnamn('bad\x00name\x1fx\x7f.pdf')).toBe('badnamex.pdf');
  });

  test('path-separatorer (/, \\) blir bindestreck (OFÖRÄNDRAT)', () => {
    expect(sanitizeFilnamn('a/b\\c.pdf')).toBe('a-b-c.pdf');
  });

  test('trimmas i kanterna, cappas vid 200 tecken (OFÖRÄNDRAT)', () => {
    expect(sanitizeFilnamn('  spaced.pdf  ')).toBe('spaced.pdf');
    const longAscii = `${'a'.repeat(250)}.pdf`;
    const result = sanitizeFilnamn(longAscii);
    expect(result.length).toBe(200);
    expect(result).toBe(longAscii.slice(0, 200));
  });

  test('200-cappningen kan råka klippa ett surrogatpar mitt itu — sanitizeFilnamn kraschar INTE', () => {
    // Ett tvåenhets-tecken (emoji) placerat så att .slice(0, 200) landar
    // MELLAN dess hög- och lågsurrogat. sanitizeFilnamn kraschar inte (och
    // producerar en sträng med en ensam surrogathalva kvar sist) — det är
    // buildAttachmentLeaf/toStorageSafe:s jobb (nästa describe-block) att
    // garantera att LEAF-formen ändå blir en giltig Storage-nyckel.
    const straddling = `${'a'.repeat(199)}\u{1F600}${'b'.repeat(10)}`;
    expect(straddling.length).toBeGreaterThan(200);
    let result: string | undefined;
    expect(() => {
      result = sanitizeFilnamn(straddling);
    }).not.toThrow();
    expect(result?.length).toBe(200);
  });

  test('tomt filnamn (endast styrtecken) ger tom sträng — kraschar inte, tomt är giltigt underlag', () => {
    expect(sanitizeFilnamn('\x01\x02\x03')).toBe('');
  });
});

test.describe('buildAttachmentLeaf / buildAttachmentPath — STORAGE-nyckeln: alltid en giltig Storage-nyckel', () => {
  test('ASCII-namn: leaf/path oförändrade mot formeln <attachmentId>-<sanitizeFilnamn> / <anchor>/<leaf>', () => {
    const leaf = buildAttachmentLeaf(ATTACHMENT_ID_A, 'kvitto-2026.pdf');
    expect(leaf).toBe(`${ATTACHMENT_ID_A}-kvitto-2026.pdf`);
    expect(buildAttachmentPath('rec0123456789ABCD', ATTACHMENT_ID_A, 'kvitto-2026.pdf')).toBe(
      `rec0123456789ABCD/${leaf}`,
    );
  });

  test('rotorsaksfallet: "2025-HörlurarMiranonMedia.pdf" (Marcus prod-röktest 2026-08-26) → giltig nyckel', () => {
    const leaf = buildAttachmentLeaf(ATTACHMENT_ID_A, '2025-HörlurarMiranonMedia.pdf');
    expect(leaf).toBe(`${ATTACHMENT_ID_A}-2025-HorlurarMiranonMedia.pdf`);
    const path = buildAttachmentPath(
      'alla-event',
      ATTACHMENT_ID_A,
      '2025-HörlurarMiranonMedia.pdf',
    );
    expect(path).toBe(`alla-event/${leaf}`);
    expect(STORAGE_PATH_RE.test(path)).toBe(true);
  });

  test('svenska å/ä/ö i båda kasus + vanliga europeiska diakritiska tecken → giltig nyckel', () => {
    const cases: Array<[string, string]> = [
      ['ÅÄÖåäö.pdf', 'AAOaao.pdf'],
      ['café.pdf', 'cafe.pdf'],
      ['über.pdf', 'uber.pdf'],
      ['piñata.pdf', 'pinata.pdf'],
      ['façade.pdf', 'facade.pdf'],
    ];
    for (const [input, expectedSuffix] of cases) {
      const leaf = buildAttachmentLeaf(ATTACHMENT_ID_A, input);
      expect(leaf).toBe(`${ATTACHMENT_ID_A}-${expectedSuffix}`);
      expect(STORAGE_KEY_RE.test(leaf)).toBe(true);
    }
  });

  test('ø, æ, ß, Þ — bokstäver som INTE diakritik-dekomponerar mot ASCII → faller till "-"', () => {
    for (const ch of ['ø', 'æ', 'ß', 'Þ']) {
      const leaf = buildAttachmentLeaf(ATTACHMENT_ID_A, `${ch}${ch}.pdf`);
      expect(leaf).toBe(`${ATTACHMENT_ID_A}---.pdf`);
      expect(STORAGE_KEY_RE.test(leaf)).toBe(true);
    }
  });

  test('en-dash (–), citattecken ("), #, % — samtliga utanför Storage-regexen → faller till "-"', () => {
    expect(buildAttachmentLeaf(ATTACHMENT_ID_A, 'en–dash.pdf')).toBe(
      `${ATTACHMENT_ID_A}-en-dash.pdf`,
    );
    expect(buildAttachmentLeaf(ATTACHMENT_ID_A, 'quo"te.pdf')).toBe(
      `${ATTACHMENT_ID_A}-quo-te.pdf`,
    );
    expect(buildAttachmentLeaf(ATTACHMENT_ID_A, 'ha#h.pdf')).toBe(`${ATTACHMENT_ID_A}-ha-h.pdf`);
    expect(buildAttachmentLeaf(ATTACHMENT_ID_A, 'per%cent.pdf')).toBe(
      `${ATTACHMENT_ID_A}-per-cent.pdf`,
    );
  });

  test('\\ (backslash, path-separator) hanteras redan FÖRE ascii-fallet — oförändrat', () => {
    expect(buildAttachmentLeaf(ATTACHMENT_ID_A, 'back\\slash.pdf')).toBe(
      `${ATTACHMENT_ID_A}-back-slash.pdf`,
    );
  });

  test('ledande/avslutande mellanslag trimmas (ärvt från sanitizeFilnamn), inre mellanslag GILTIGA och orörda', () => {
    expect(buildAttachmentLeaf(ATTACHMENT_ID_A, '  spaced name  .pdf')).toBe(
      `${ATTACHMENT_ID_A}-spaced name  .pdf`,
    );
  });

  test('skript som INTE diakritik-dekomponerar (CJK) faller ändå till en giltig nyckel', () => {
    const leaf = buildAttachmentLeaf(ATTACHMENT_ID_A, '填报指南.pdf');
    expect(STORAGE_KEY_RE.test(leaf)).toBe(true);
    expect(leaf.endsWith('.pdf')).toBe(true);
  });

  test('emoji (surrogatpar) — EN kodpunkt ger ETT bindestreck, inte två', () => {
    const leaf = buildAttachmentLeaf(ATTACHMENT_ID_A, '😀emoji.pdf');
    expect(leaf).toBe(`${ATTACHMENT_ID_A}--emoji.pdf`);
    expect(STORAGE_KEY_RE.test(leaf)).toBe(true);
  });

  test('namn som blir TOMT efter sanering (endast styrtecken) → leaf är fortfarande giltig och UNIK (UUID-prefixet bär unikheten)', () => {
    const leafA = buildAttachmentLeaf(ATTACHMENT_ID_A, '\x01\x02\x03');
    const leafB = buildAttachmentLeaf(ATTACHMENT_ID_B, '\x01\x02\x03');
    expect(leafA).toBe(`${ATTACHMENT_ID_A}-`);
    expect(leafB).toBe(`${ATTACHMENT_ID_B}-`);
    expect(STORAGE_KEY_RE.test(leafA)).toBe(true);
    expect(STORAGE_KEY_RE.test(leafB)).toBe(true);
    // Två olika attachmentId (som deriveAttachmentId ALLTID producerar för
    // två olika filnamn, se sanitizeFilnamn-sviten ovan) → två olika,
    // giltiga leaves — trots att BÅDA saneras till samma tomma svans.
    expect(leafA).not.toBe(leafB);
  });

  test('KRITISKT (review-runda 1, "prova att UUID-prefixet räddar unikheten"): två HELT OLIKA filnamn vars ASCII-SUFFIX kollapsar till samma sträng ger ändå OLIKA, giltiga fulla leaves', () => {
    // 填报指南.pdf och 肆意妄为.pdf har OLIKA sanitizeFilnamn-utdata (bevisat
    // ovan) → deriveAttachmentId hade i produktionsflödet därför gett dem
    // OLIKA attachmentId. Här simulerar vi det med två olika (fejkade)
    // id:n för att isolera EXAKT den egenskap som gör den fulla nyckeln
    // unik trots ASCII-suffix-kollisionen.
    const leafA = buildAttachmentLeaf(ATTACHMENT_ID_A, '填报指南.pdf');
    const leafB = buildAttachmentLeaf(ATTACHMENT_ID_B, '肆意妄为.pdf');
    const suffixA = leafA.slice(ATTACHMENT_ID_A.length + 1);
    const suffixB = leafB.slice(ATTACHMENT_ID_B.length + 1);
    expect(suffixA).toBe(suffixB); // ASCII-suffixet KOLLAPSAR (kosmetiskt, ofarligt)
    expect(leafA).not.toBe(leafB); // men den FULLA nyckeln gör det ALDRIG — UUID-prefixet bär unikheten
    expect(STORAGE_KEY_RE.test(leafA)).toBe(true);
    expect(STORAGE_KEY_RE.test(leafB)).toBe(true);
  });

  test('200-cappningens surrogatpar-kant: leaf/path förblir GILTIGA Storage-nycklar även när sanitizeFilnamn klippte mitt i ett tvåenhets-tecken', () => {
    const straddling = `${'a'.repeat(199)}\u{1F600}${'b'.repeat(10)}`;
    const leaf = buildAttachmentLeaf(ATTACHMENT_ID_A, straddling);
    expect(STORAGE_KEY_RE.test(leaf)).toBe(true);
    const path = buildAttachmentPath('rec0123456789ABCD', ATTACHMENT_ID_A, straddling);
    expect(STORAGE_PATH_RE.test(path)).toBe(true);
  });

  test('IDEMPOTENS (TASK-316): samma (id, filnamn) → identisk leaf/path, alltid', () => {
    expect(buildAttachmentLeaf(ATTACHMENT_ID_A, 'x.pdf')).toBe(
      buildAttachmentLeaf(ATTACHMENT_ID_A, 'x.pdf'),
    );
  });
});
