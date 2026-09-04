// Klientspegelns PARITETSGRIND — TASK-346.6, PRD TASK-346 berättelse 4.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD DEN BEVAKAR
// ═══════════════════════════════════════════════════════════════════════════
// `src/components/betalningar/belopp-inmatning.ts` är en avsiktlig andra
// implementation av `supabase/functions/_shared/betalningsbelopp.ts`. Skälet
// står i spegelns eget filhuvud (tsconfig-projektgränsen). En andra
// implementation är kopierings-drift SÅ LÄNGE ingen mekanism upptäcker att de
// glidit isär — den här filen ÄR den mekanismen.
//
// Testet importerar BÅDA och kör ett gemensamt korpus genom dem. Divergerar en
// enda rad fäller sviten, med indatan utskriven.
//
// api-pure: båda modulerna är importfria och Deno-fria, så de kör rakt i Node.
// Tests-projektet når `src/` via `@/`-aliaset (tsconfig.tests.json § paths,
// samma mönster som `tests/api/activity-log-pilot-statements.test.ts`) och
// `supabase/functions/_shared/` via relativ sökväg (samma mönster som
// `tests/api/betalningsbelopp.test.ts`).

import { expect, test } from '@playwright/test';
import {
  BELOPP_MAX_KLIENT,
  beloppsFel,
  normaliseraBeloppKlient,
  summeraKronorKlient,
  visaKronor,
} from '@/components/betalningar/belopp-inmatning';
import {
  BELOPP_MAX,
  normaliseraBelopp,
  summeraKronor,
} from '../../supabase/functions/_shared/betalningsbelopp';

/**
 * KORPUSET. Varje rad är antingen ett fall serverns filhuvud uttryckligen
 * räknar upp, eller ett fall som skiljer en whitelist-parser från `Number`.
 *
 * Listan är avsiktligt bred snarare än kort: paritetsgrindens värde står i
 * proportion till hur många vägar genom koden den faktiskt går.
 */
const KORPUS: readonly string[] = [
  // Formerna Lotta och banken faktiskt skriver
  '2 500,00',
  '2500,50',
  '2500',
  '2 500 kr',
  '1000:-',
  '12.50',
  '-500',
  '0',
  '-0',
  '1 000',
  '2 500 kronor',
  '9 999 SEK',
  '   750   ',
  '1000 KR',
  // Tusentalsavgränsarna. De fyra raderna nedan SER identiska ut men bär
  // OLIKA kodpunkter: U+00A0 hårt blanksteg, U+2007 siffer-blanksteg, U+2009
  // tunt blanksteg, U+202F smalt hårt blanksteg. En kopierad bankrad bär ofta
  // just dem. Rör dem inte i en stadning - `paritetTecken`-testet nedan
  // värnar dem mekaniskt genom att bygga samma strängar ur kodpunkterna.
  '2 500',
  '2 500',
  '2 500',
  '2 500',
  "2'500",
  // Det som MÅSTE avvisas
  'abc',
  '1e3',
  '2.500',
  '',
  '   ',
  '0x10',
  'Infinity',
  '-Infinity',
  'NaN',
  '1,234',
  '12abc',
  '1,2,3',
  '1.2.3',
  '2,,5',
  '+500',
  '500-',
  'kr',
  ':-',
  '.',
  ',',
  '-',
  // Gränserna
  '9999999999.99',
  '9999999999,99',
  '10000000000',
  '-9999999999.99',
  '-10000000000',
  '0,00',
  '0,01',
  '-0,01',
];

test('paritet: normaliseraBeloppKlient ger EXAKT samma svar som servern, hela korpuset', () => {
  const divergenser: string[] = [];
  for (const indata of KORPUS) {
    const server = normaliseraBelopp(indata);
    const klient = normaliseraBeloppKlient(indata);
    if (!Object.is(server, klient)) {
      divergenser.push(`${JSON.stringify(indata)}: server=${server} klient=${klient}`);
    }
  }
  expect(divergenser, `spegeln har glidit isär från servern:\n${divergenser.join('\n')}`).toEqual(
    [],
  );
});

test('paritet: icke-strängar avvisas likadant av båda', () => {
  const ickeStrangar: unknown[] = [null, undefined, 0, 2500, {}, [], true, Number.NaN, () => 1];
  for (const indata of ickeStrangar) {
    expect(normaliseraBeloppKlient(indata)).toBe(normaliseraBelopp(indata));
  }
});

test('paritet: takvärdet är samma tal i båda modulerna', () => {
  expect(BELOPP_MAX_KLIENT).toBe(BELOPP_MAX);
});

test('paritet: summeringen räknar i ören i båda, med samma svar', () => {
  const serier: readonly number[][] = [
    [0.1, 0.2],
    [1000.1, 2000.2],
    [2500, -1000],
    [1000.05, 1000.05, 1000.05],
    [-500.5, 500.5],
    [],
    [9999999999.99, 0.01],
  ];
  for (const serie of serier) {
    expect(summeraKronorKlient(serie), `serie ${JSON.stringify(serie)}`).toBe(summeraKronor(serie));
  }
});

/* ═══════════════════════════ NEGATIVA KONTROLLER ═══════════════════════════
 * DoD #5: varje regel bär en negativ kontroll som visar att testet FÄLLER en
 * trasig implementation. Utan dem bevisar paritetsgrinden bara att två
 * funktioner returnerar samma sak — inte att jämförelsen kan upptäcka något.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Den självklara och tyst felaktiga spegeln: `Number`. */
function trasigSpegel(ratext: unknown): number | null {
  if (typeof ratext !== 'string') return null;
  const tal = Number(ratext);
  return Number.isNaN(tal) ? null : tal;
}

test('negativ kontroll: en Number-baserad spegel FÄLLS av korpuset', () => {
  const divergenser = KORPUS.filter(
    (indata) => !Object.is(normaliseraBelopp(indata), trasigSpegel(indata)),
  );
  // Om detta någonsin blir tomt har korpuset tappat sin diskriminerande kraft,
  // och paritetsgrinden ovan är en tom formalitet.
  expect(divergenser.length).toBeGreaterThan(5);
  // De två klassiska: exponentnotation blir ett tal, svensk form blir NaN.
  expect(divergenser).toContain('1e3');
  expect(divergenser).toContain('2 500,00');
});

test('negativ kontroll: en spegel som glömmer takvärdet FÄLLS av korpuset', () => {
  // Den trasiga varianten är verklig: allt utom takkontrollen. Det är precis
  // den rad en förbipasserande skulle stryka som onodig.
  const utanTak = (text: string): number | null => {
    const kanonisk = text.trim().replace(/[\s']/g, '').replace(',', '.');
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(kanonisk)) return null;
    return Number(kanonisk);
  };
  expect(normaliseraBelopp('10000000000')).toBeNull();
  expect(utanTak('10000000000')).toBe(10000000000);

  const divergenser = KORPUS.filter(
    (indata) => !Object.is(normaliseraBelopp(indata), utanTak(indata)),
  );
  expect(divergenser).toContain('10000000000');
  expect(divergenser).toContain('-10000000000');
});

test('paritetTecken: varje deklarerad tusentalsavgränsare accepteras av BÅDA', () => {
  // Kodpunkterna skrivs ut som TAL, inte som tecken: en teckenklass ingen kan
  // LASA ar en teckenklass ingen kan granska (serverns eget filhuvud).
  const kodpunkter = [0x0020, 0x00a0, 0x2007, 0x2009, 0x202f, 0x0027];
  for (const kod of kodpunkter) {
    const indata = `2${String.fromCodePoint(kod)}500`;
    expect(normaliseraBelopp(indata), `server, U+${kod.toString(16)}`).toBe(2500);
    expect(normaliseraBeloppKlient(indata), `klient, U+${kod.toString(16)}`).toBe(2500);
  }
  // NEGATIV KONTROLL: ett tecken som INTE star i listan far inte tolkas bort.
  expect(normaliseraBelopp('2_500')).toBeNull();
  expect(normaliseraBeloppKlient('2_500')).toBeNull();
});

/* ═══════════════════════════ SPEGELNS EGNA TILLÄGG ═══════════════════════════
 * `beloppsFel` och `visaKronor` finns bara på klienten och har därför ingen
 * serversida att jämföras mot. De prövas för sig.
 * ═══════════════════════════════════════════════════════════════════════════ */

test('beloppsFel: tomt fält är INTE ett fel, obegripligt och noll är olika fel', () => {
  expect(beloppsFel('')).toBeNull();
  expect(beloppsFel('   ')).toBeNull();
  expect(beloppsFel('2 500,00')).toBeNull();
  expect(beloppsFel('-500')).toBeNull();

  const obegripligt = beloppsFel('abc');
  const noll = beloppsFel('0');
  expect(obegripligt).not.toBeNull();
  expect(noll).not.toBeNull();
  // TVÅ OLIKA MEDDELANDEN. "Obegripligt" och "noll" är olika saker för Lotta,
  // och ett gemensamt felmeddelande hade sagt fel sak i ett av fallen.
  expect(obegripligt).not.toBe(noll);
});

/**
 * `toLocaleString('sv-SE')` ger HÅRT blanksteg (U+00A0) som
 * tusentalsavgränsare. Skillnaden mot ett vanligt blanksteg är osynlig i en
 * editor, så de förväntade strängarna byggs ur kodpunkten i stället för att
 * skrivas av - annars ger ett fällt test två identiska rader i utskriften.
 */
const NBSP = String.fromCodePoint(0x00a0);

test('visaKronor: hela kronor utan decimaler, ören alltid med två', () => {
  expect(visaKronor(2500)).toBe(`2${NBSP}500`);
  expect(visaKronor(1000)).toBe(`1${NBSP}000`);
  expect(visaKronor(500)).toBe('500');
  expect(visaKronor(2500.5)).toBe(`2${NBSP}500,50`);
  expect(visaKronor(0.5)).toBe('0,50');
});

test('visaKronor -> normaliseraBelopp är en rundtur: det som visas kan skrivas in igen', () => {
  // Detta är inte kosmetik. Belopps-knapparna FYLLER fältet med `visaKronor`,
  // och fältets råtext är det som skickas till servern. Kunde servern inte
  // läsa tillbaka den formen hade varje knapptryck gett ett serverfel.
  for (const tal of [2500, 1000, 500, 1500.5, 0.05, 12345.67, 9999999999.99]) {
    expect(normaliseraBelopp(visaKronor(tal)), `rundtur för ${tal}`).toBe(tal);
  }
});
