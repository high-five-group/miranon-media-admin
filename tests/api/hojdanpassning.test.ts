// [TASK-309.34 skiva (i)] Enhetstest av HÖJDANPASSNINGENS trapp-logik +
// sidräknare — STUBBAD renderare, ingen `DOCRAPTOR_API_KEY`, inget nätverk.
//
// VAD SOM PRÖVAS OCH VARFÖR DET GÅR: `supabase/functions/_shared/
// hojdanpassning.ts` är PRODUKTIONSKODEN, inte en testkopia. Den kunde
// importeras hit bara därför att TASK-309.34 bröt ut den ur
// `_shared/mall-render.ts`, vars `import { Eta } from
// 'https://esm.sh/eta@4.6.0'` gör HELA den filen omöjlig att importera i
// Node (`ERR_UNSUPPORTED_ESM_URL_SCHEME`; se den utbrutna modulens filhuvud
// för det minimala reprot). Trappan tar renderaren som ARGUMENT, så
// beslutslogiken kan drivas mot ett kontrollerat sidantal per anrop utan att
// ett enda DocRaptor-dokument debiteras.
//
// TVÅSIDIGHETEN ÄR INBYGGD, INTE ENGÅNGS: `anpassaHojd` tar `trappa` som
// injicerbar option, så sviten kan köra samma scenario mot en MUTERAD trappa
// och visa att utfallet FALLER (§ TVÅSIDIGT BEVIS nedan). Den varianten
// överlever i CI — till skillnad från en manuell mutation av källan, som bara
// bevisar något i det ögonblick någon råkar köra den. Den manuella
// mutationen kördes ÄVEN, en gång, under bygget (utfallet står i skivans
// slutrapport och på kortet).
//
// FIXTURERNA ÄR SYNTETISKA PDF-BYTES, INTE MOCKADE RÄKNARE: fallen nedan
// matar `anpassaHojd` med riktiga byte-strömmar och låter den DEFAULTA
// sidräknaren (`raknaSidor`) läsa dem. Det prövar trappan och räknaren
// TILLSAMMANS. Bara `null`-fallet (strömmen går inte att tolka) och
// ordnings-fallen använder en injicerad räknare, där det är själva
// beslutsvägen som är under lupp.

import { expect, test } from '@playwright/test';
import {
  anpassaHojd,
  type HojdanpassningsUtfall,
  raknaSidor,
  SKALTRAPPA,
} from '../../supabase/functions/_shared/hojdanpassning';

// ───────────────────────── PDF-fixturer ─────────────────────────

/**
 * En minimal, strukturellt trovärdig PDF med ett explicit `/Count N` i
 * sidträdet — formen Prince/DocRaptor faktiskt producerar. `latin1` är vad
 * `raknaSidor` avkodar med, så fixturen byggs byte för byte ur en ASCII-sträng
 * (identiskt i latin1 och UTF-8 för dessa tecken).
 */
function pdfMedCount(sidor: number): Uint8Array {
  const kids = Array.from({ length: sidor }, (_, i) => `${i + 2} 0 R`).join(' ');
  return latin1Bytes(
    [
      '%PDF-1.7',
      '1 0 obj',
      `<< /Type /Pages /Kids [${kids}] /Count ${sidor} >>`,
      'endobj',
      'trailer',
      '<< /Root 1 0 R >>',
      '%%EOF',
    ].join('\n'),
  );
}

/**
 * En PDF UTAN `/Count` — sidräknaren tvingas till sin `/Type /Page`-fallback.
 * Varje `/Type /Page` följs av ett icke-`s`-tecken, vilket regexen kräver.
 */
function pdfUtanCount(sidor: number): Uint8Array {
  const objekt = Array.from(
    { length: sidor },
    (_, i) => `${i + 1} 0 obj\n<< /Type /Page /MediaBox [0 0 595 842] >>\nendobj`,
  ).join('\n');
  return latin1Bytes(['%PDF-1.7', objekt, 'trailer', '<< >>', '%%EOF'].join('\n'));
}

/** Rå latin1-kodning: varje tecken blir exakt en byte (kodpunkt 0-255). */
function latin1Bytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

/**
 * Renderar-stubb: returnerar en PDF med sidantalet ur `sidantalPerVarv`,
 * ett värde per anrop i tur och ordning. Bokför de skalor den anropades med
 * så testet kan pröva BÅDE hur många renderingar som skedde och exakt vilka
 * steg som prövades.
 */
function stubbadRenderare(sidantalPerVarv: readonly number[]): {
  rendera: (skala: number) => Promise<Uint8Array>;
  anropadeSkalor: number[];
} {
  const anropadeSkalor: number[] = [];
  return {
    anropadeSkalor,
    rendera: (skala: number) => {
      const index = anropadeSkalor.length;
      anropadeSkalor.push(skala);
      const sidor = sidantalPerVarv[index];
      if (sidor === undefined) {
        throw new Error(
          `stubbadRenderare: anrop ${index + 1} saknar planerat sidantal — ` +
            'trappan renderade fler varv än fixturen förutsåg.',
        );
      }
      return Promise.resolve(pdfMedCount(sidor));
    },
  };
}

/** Samlar loggraderna i stället för att skriva dem till konsolen. */
function loggFangare(): { rader: string[]; logg: (rad: string) => void } {
  const rader: string[] = [];
  return { rader, logg: (rad: string) => rader.push(rad) };
}

// ───────────────────── Trappans FORM (invariant) ─────────────────────

test('SKALTRAPPA är exakt [1, 0.88, 0.8] — mätta steg, inte räknade', () => {
  // Låser trappans FAKTISKA värden. Ändras de ska detta test falla och tvinga
  // fram en ny mätning (TASK-309.27 § TRAPPAN), inte en tyst justering.
  expect([...SKALTRAPPA]).toEqual([1, 0.88, 0.8]);
});

test('trappan är strikt avtagande och startar på ofärgad skala 1', () => {
  expect(SKALTRAPPA[0]).toBe(1);
  for (let i = 1; i < SKALTRAPPA.length; i += 1) {
    expect(SKALTRAPPA[i]).toBeLessThan(SKALTRAPPA[i - 1]);
  }
});

// ─────────────────── (a) 1 sida vid skala 1 ───────────────────

test('(a) 1 sida vid skala 1 → ingen omrendering, skala 1', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([1]);
  const utfall = await anpassaHojd(rendera, { namn: 'a', logg: () => {} });

  expect(utfall.skala).toBe(1);
  expect(utfall.sidor).toBe(1);
  expect(utfall.renderingar).toBe(1);
  expect(utfall.golvNatt).toBe(false);
  expect(anropadeSkalor).toEqual([1]);
});

test('(a) normalfallet loggar INGENTING — tystnad är signalen att allt rymdes', async () => {
  const { rendera } = stubbadRenderare([1]);
  const { rader, logg } = loggFangare();
  await anpassaHojd(rendera, { namn: 'tyst', logg });

  expect(rader).toEqual([]);
});

// ─────────────── (b) 2 sidor vid 1, 1 sida vid 0.88 ───────────────

test('(b) 2 sidor vid 1, 1 sida vid 0.88 → skala 0.88, exakt två renderingar', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([2, 1]);
  const { rader, logg } = loggFangare();
  const utfall = await anpassaHojd(rendera, { namn: 'RIM 2', logg });

  expect(utfall.skala).toBe(0.88);
  expect(utfall.sidor).toBe(1);
  expect(utfall.renderingar).toBe(2);
  expect(utfall.golvNatt).toBe(false);
  expect(anropadeSkalor).toEqual([1, 0.88]);

  // Exakt EN loggrad: det misslyckade första varvet. Det lyckade andra
  // varvet loggar inget alls.
  expect(rader).toHaveLength(1);
  expect(rader[0]).toBe('[mall-render] RIM 2: 2 sidor vid skala 1 — renderar om mindre.');
});

// ─────────────────── (c) 2, 2, 1 → 0.8 ───────────────────

test('(c) 2, 2, 1 → skala 0.8, tre renderingar, hela trappan prövad i ordning', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([2, 2, 1]);
  const { rader, logg } = loggFangare();
  const utfall = await anpassaHojd(rendera, { namn: 'RIM 3', logg });

  expect(utfall.skala).toBe(0.8);
  expect(utfall.sidor).toBe(1);
  expect(utfall.renderingar).toBe(3);
  expect(utfall.golvNatt).toBe(false);
  expect(anropadeSkalor).toEqual([1, 0.88, 0.8]);

  // Två loggrader (varv 1 och 2), båda i "renderar om mindre"-formen —
  // golvraden hör INTE hit: varv 3 rymdes.
  expect(rader).toEqual([
    '[mall-render] RIM 3: 2 sidor vid skala 1 — renderar om mindre.',
    '[mall-render] RIM 3: 2 sidor vid skala 0.88 — renderar om mindre.',
  ]);
});

// ───────── (d) 2 sidor även vid 0.8 — golvet, och HUR det rapporteras ─────────

test('(d) 2 sidor vid alla tre stegen → sista steget används, PDF:en skickas ändå', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([2, 2, 2]);
  // Loggraderna prövas i nästa test — här är returvärdet under lupp.
  const utfall = await anpassaHojd(rendera, { namn: 'Psionautics', logg: () => {} });

  // VERKLIGT beteende, inte önskat: funktionen KASTAR INTE och returnerar
  // INGET felvärde. Den returnerar den sista (fortfarande tvåsidiga) PDF:en.
  // En oläslig bilaga vore sämre än en tvåsidig — TASK-309.27 § GOLVET.
  expect(utfall.skala).toBe(0.8);
  expect(utfall.sidor).toBe(2);
  expect(utfall.renderingar).toBe(3);
  expect(utfall.golvNatt).toBe(true);
  expect(anropadeSkalor).toEqual([1, 0.88, 0.8]);

  // Den returnerade PDF:en är den SISTA renderingen, inte den första.
  expect(raknaSidor(utfall.pdf)).toBe(2);
});

test('(d) golvet RAPPORTERAS som en loggrad med annan lydelse än mellanstegen', async () => {
  const { rendera } = stubbadRenderare([2, 2, 2]);
  const { rader, logg } = loggFangare();
  await anpassaHojd(rendera, { namn: 'Psionautics', logg });

  // Kanalen är en loggrad — inte ett kastat fel, inte ett returvärde som
  // anroparen tvingas läsa. Detta test låser BÅDE kanalen och lydelsen.
  expect(rader).toEqual([
    '[mall-render] Psionautics: 2 sidor vid skala 1 — renderar om mindre.',
    '[mall-render] Psionautics: 2 sidor vid skala 0.88 — renderar om mindre.',
    '[mall-render] Psionautics: 2 sidor vid skala 0.8 — golvet nått, skickar ändå. Texten behöver kortas.',
  ]);
  // Golvraden ber uttryckligen om en mänsklig åtgärd — det är hela poängen
  // med att inte dölja den.
  expect(rader[2]).toContain('Texten behöver kortas.');
});

test('(d) ett fyrsidigt spill hanteras likadant — golvet är inte bundet till exakt 2 sidor', async () => {
  const { rendera } = stubbadRenderare([5, 4, 4]);
  const { rader, logg } = loggFangare();
  const utfall = await anpassaHojd(rendera, { namn: 'spill', logg });

  expect(utfall.golvNatt).toBe(true);
  expect(utfall.sidor).toBe(4);
  expect(rader[2]).toContain('4 sidor vid skala 0.8 — golvet nått');
});

// ───────────── `null` = vet inte → skala aldrig om på en gissning ─────────────

test('sidräkning null vid första varvet → returnera direkt, ingen omrendering', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([2, 1, 1]);
  const { rader, logg } = loggFangare();
  const utfall = await anpassaHojd(rendera, {
    namn: 'otolkbar',
    logg,
    raknaSidor: () => null,
  });

  expect(utfall.sidor).toBeNull();
  expect(utfall.skala).toBe(1);
  expect(utfall.renderingar).toBe(1);
  expect(utfall.golvNatt).toBe(false);
  expect(anropadeSkalor).toEqual([1]);
  expect(rader).toEqual([]);
});

test('golvNatt är false när räkningen gav null — vi vet inte, alltså larmar vi inte', async () => {
  const { rendera } = stubbadRenderare([2, 2, 2]);
  let varv = 0;
  const utfall = await anpassaHojd(rendera, {
    namn: 'sent-null',
    logg: () => {},
    // Två läsbara varv, sedan en otolkbar ström på sista steget.
    raknaSidor: () => {
      varv += 1;
      return varv < 3 ? 2 : null;
    },
  });

  expect(utfall.renderingar).toBe(3);
  expect(utfall.sidor).toBeNull();
  expect(utfall.golvNatt).toBe(false);
});

// ───────────── (e) raknaSidor mot riktiga PDF-byte-strömmar ─────────────

test('(e) raknaSidor läser /Count — en sida', () => {
  expect(raknaSidor(pdfMedCount(1))).toBe(1);
});

test('(e) raknaSidor läser /Count — två sidor', () => {
  expect(raknaSidor(pdfMedCount(2))).toBe(2);
});

test('(e) raknaSidor faller tillbaka på /Type /Page när /Count saknas — en sida', () => {
  expect(raknaSidor(pdfUtanCount(1))).toBe(1);
});

test('(e) raknaSidor faller tillbaka på /Type /Page när /Count saknas — två sidor', () => {
  expect(raknaSidor(pdfUtanCount(2))).toBe(2);
});

test('(e) /Pages (med s) räknas ALDRIG som en sida — regexens [^s] är avsikten', () => {
  const bara_pages_nod = latin1Bytes('%PDF-1.7\n1 0 obj\n<< /Type /Pages /Kids [] >>\nendobj\n');
  // Ingen /Count, ingen /Type /Page följd av icke-s → oläsbar, alltså null.
  expect(raknaSidor(bara_pages_nod)).toBeNull();
});

test('(e) raknaSidor returnerar null för en ström som inte går att tolka', () => {
  expect(raknaSidor(latin1Bytes('inte en pdf alls'))).toBeNull();
  expect(raknaSidor(new Uint8Array(0))).toBeNull();
});

test('(e) komprimerade objektströmmar med råa binärbytes stör inte sidräkningen', () => {
  // TASK-309.27 mätte detta mot en FAKTISK DocRaptor-PDF (3 komprimerade
  // /ObjStm, ändå läsbar sidräkning). Fixturen här återskapar formen: binär
  // skräpdata med bytes > 127 mellan de läsbara nycklarna. latin1-avkodningen
  // får inte kasta, och /Count ska fortfarande hittas.
  const binart = new Uint8Array([0x00, 0x80, 0xff, 0xfe, 0x7f, 0x01, 0xa0]);
  const huvud = latin1Bytes(
    '%PDF-1.7\n1 0 obj\n<< /Type /Pages /Count 1 >>\nendobj\n5 0 obj\n<< /Type /ObjStm /Filter /FlateDecode >>\nstream\n',
  );
  const svans = latin1Bytes('\nendstream\nendobj\n%%EOF');
  const pdf = new Uint8Array(huvud.length + binart.length + svans.length);
  pdf.set(huvud, 0);
  pdf.set(binart, huvud.length);
  pdf.set(svans, huvud.length + binart.length);

  expect(raknaSidor(pdf)).toBe(1);
});

test('(e) KÄND KANT: /Count-träffen är den FÖRSTA i strömmen, inte nödvändigtvis sidträdets', () => {
  // Detta test LÅSER en känd svaghet i implementationen — det beskriver vad
  // koden GÖR, inte vad den borde göra. En PDF vars outline-träd ligger före
  // sidträdet ger outline-nodens /Count. Prince/DocRaptor lägger i praktiken
  // sidträdet först och bilagorna saknar outline, så felet har aldrig
  // observerats skarpt. Bokfört i TASK-309.34; kortets AVGRÄNSNING förbjuder
  // uttryckligen att ny render-logik byggs här. Faller detta test har någon
  // ÄNDRAT beteendet — vilket då ska vara ett medvetet beslut, inte en tyst
  // drift.
  const outlineForst = latin1Bytes(
    [
      '%PDF-1.7',
      '1 0 obj',
      '<< /Type /Outlines /Count 7 >>',
      'endobj',
      '2 0 obj',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      'endobj',
      '%%EOF',
    ].join('\n'),
  );
  expect(raknaSidor(outlineForst)).toBe(7);
});

// ─────────────────────── TVÅSIDIGT BEVIS ───────────────────────
//
// Samma scenarier som (c) och (d) ovan, körda mot en MUTERAD trappa. Om
// trappan vore verkningslös — eller om `anpassaHojd` ignorerade sina steg —
// skulle utfallen nedan vara identiska med originalens. De är de inte.

test('TVÅSIDIGT: utan 0.8-steget konvergerar (c):s scenario ALDRIG — golvet nås vid 0.88', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([2, 2, 1]);
  const { rader, logg } = loggFangare();
  const utfall = await anpassaHojd(rendera, {
    namn: 'muterad',
    logg,
    trappa: [1, 0.88], // 0.8-steget BORTTAGET
  });

  // Med full trappa: skala 0.8, 3 renderingar, golvNatt false (se (c)).
  // Med det sista steget borttaget faller allt tre.
  expect(utfall.skala).toBe(0.88);
  expect(utfall.renderingar).toBe(2);
  expect(utfall.golvNatt).toBe(true);
  expect(utfall.sidor).toBe(2);
  expect(anropadeSkalor).toEqual([1, 0.88]);
  expect(rader[1]).toContain('golvet nått');
});

test('TVÅSIDIGT: en ENSTEGS-trappa gör höjdanpassningen verkningslös', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([2, 1, 1]);
  const utfall = await anpassaHojd(rendera, {
    namn: 'enstegs',
    logg: () => {},
    trappa: [1],
  });

  // Ett enda varv, golvet omedelbart nått, tvåsidig PDF skickad. Exakt det
  // läge trappan finns för att undvika.
  expect(utfall.renderingar).toBe(1);
  expect(utfall.golvNatt).toBe(true);
  expect(utfall.sidor).toBe(2);
  expect(anropadeSkalor).toEqual([1]);
});

test('TVÅSIDIGT: en LÄNGRE trappa når längre — beslutet följer stegen, inte en hårdkodning', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([2, 2, 2, 1]);
  const utfall = await anpassaHojd(rendera, {
    namn: 'langre',
    logg: () => {},
    trappa: [1, 0.88, 0.8, 0.7],
  });

  expect(utfall.skala).toBe(0.7);
  expect(utfall.renderingar).toBe(4);
  expect(utfall.golvNatt).toBe(false);
  expect(anropadeSkalor).toEqual([1, 0.88, 0.8, 0.7]);
});

test('TVÅSIDIGT: en tom trappa kastar i stället för att returnera en tom PDF', async () => {
  const { rendera, anropadeSkalor } = stubbadRenderare([1]);
  await expect(anpassaHojd(rendera, { trappa: [] })).rejects.toThrow(/trappan är tom/);
  expect(anropadeSkalor).toEqual([]);
});

// ─────────────────────── Kontraktsyta ───────────────────────

test('utfallet bär alla fem fälten — konsumenten behöver aldrig gissa', async () => {
  const { rendera } = stubbadRenderare([2, 1]);
  const utfall: HojdanpassningsUtfall = await anpassaHojd(rendera, { logg: () => {} });

  expect(Object.keys(utfall).sort()).toEqual(['golvNatt', 'pdf', 'renderingar', 'sidor', 'skala']);
  expect(utfall.pdf).toBeInstanceOf(Uint8Array);
});

test('renderaren matas med skalan, inte med ett index — regressionsvakt', async () => {
  const skalor: number[] = [];
  await anpassaHojd(
    (skala) => {
      skalor.push(skala);
      return Promise.resolve(pdfMedCount(skalor.length < 3 ? 2 : 1));
    },
    { logg: () => {} },
  );

  // Skulle någon råka skicka loopens index (0, 1, 2) i stället för skalan
  // skulle bilagan renderas med `innehallsSkala: 0` — osynlig text.
  expect(skalor).toEqual([...SKALTRAPPA]);
});
