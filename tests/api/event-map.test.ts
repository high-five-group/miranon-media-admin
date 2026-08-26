// Golden-test för `_shared/event-map.ts` (TASK-23) — api-pure, ingen staging-koppling.
//
// HÄRKOMST: strängarna i GOLDEN nedan är INTE handskrivna. De producerades av ett
// differentialtest som körde de FYRA inline-kopiorna verbatim som de stod på
// origin/main `1d853fa3` (get-events/index.ts:90, get-event/index.ts:114,
// update-event/index.ts:67+77, create-event/index.ts:88) sida vid sida med den
// extraherade modulen och krävde byte-identisk JSON. Golden ÄR alltså den
// FÖREGÅENDE kodens utdata, inte den nya kodens — så testet kan fälla en regression,
// vilket ett facit genererat ur koden det testar aldrig kan.
//
// Differentialtestet var ett engångsbevis och lever inte kvar i repot: att behålla
// det hade återinfört den fjärde kopia TASK-23 tog bort. Detta test tar över rollen
// framåt — det låser shapen OCH nyckelordningen (JSON.stringify bevarar
// insättningsordning, så en omkastad nyckel fäller här även när värdena stämmer).
//
// Negativt bevis, mätt före landning: en värde-mutation (`?? 0` → `?? 1` på
// antalAnmalda) fällde 12 av 17 differential-fall, och en ordnings-mutation
// (kursfamilj/kursniva ombytta) fällde 15 av 17. Testet biter i båda riktningar.

import { expect, test } from '@playwright/test';
import {
  deriveManadAr,
  mapEventBas,
  mapEventKategorifalt,
} from '../../supabase/functions/_shared/event-map';

const FIXTURER: { namn: string; record: { id: string; fields: Record<string, unknown> } }[] = [
  {
    namn: 'fullt fält-set',
    record: {
      id: 'recFULL0000000001',
      fields: {
        Eventlabel: 'Skövde 2026-03-14',
        'Event (source)': { name: 'Grundkurs' },
        Typ: { name: 'Kurs' },
        Ort: 'Skövde',
        Startdatum: '2026-03-14',
        Slutdatum: '2026-03-15',
        'Tid kvar till event': 'om 3 veckor',
        'Max antal platser': 24,
        'Antal anmälda': 18,
        'Platser kvar': 6,
        'Anmäld beläggning (%)': 0.75,
        'Bekräftad beläggning (%)': 0.5,
        'Antal nya anmälningar': 3,
        'Antal mottagna anmälningsavgifter': 12,
        'Antal mottagna slutbetalningar': 9,
        'Antal slutbetalning saknas': 3,
        Status: { name: 'Publicerad' },
        EventKey: 'Event-42',
        Kursfamilj: { name: 'Bas' },
        Kursnivå: { name: 'Steg 1' },
        'Extra platser': 2,
        'Manuella platser': 1,
        'Deltagarinfo schemalagd': '2026-03-01',
        'Deltagarinfo auto-utskick avstängt': true,
      },
    },
  },
  {
    namn: 'tomt fält-set (inget satt)',
    record: { id: 'recTOM00000000001', fields: {} },
  },
  {
    namn: 'specialValue-objekt (NaN/Infinity) på formel-/procent-fält',
    record: {
      id: 'recNAN00000000001',
      fields: {
        'Anmäld beläggning (%)': { specialValue: 'NaN' },
        'Bekräftad beläggning (%)': { specialValue: 'Infinity' },
        'Platser kvar': { specialValue: '-Infinity' },
        'Antal anmälda': { specialValue: 'NaN' },
        'Max antal platser': { specialValue: 'NaN' },
        'Extra platser': { specialValue: 'NaN' },
      },
    },
  },
  {
    namn: 'lookup-arrayer (1-element och fler-värt)',
    record: {
      id: 'recARR00000000001',
      fields: {
        Ort: ['Göteborg'],
        'Max antal platser': [30],
        'Manuella platser': [4, 9],
        'Deltagarinfo schemalagd': ['2026-04-02', '2026-04-03'],
        Typ: [{ name: 'Retreat' }],
      },
    },
  },
  {
    namn: 'checkbox utelämnad + falskt värde, eventKey icke-sträng',
    record: {
      id: 'recCHK00000000001',
      fields: {
        'Deltagarinfo auto-utskick avstängt': false,
        EventKey: 42,
        Status: null,
        Ort: '',
        Eventlabel: null,
      },
    },
  },
];

const GOLDEN: Record<string, Record<string, string>> = {
  'fullt fält-set': {
    'get-events':
      '{"id":"recFULL0000000001","eventlabel":"Skövde 2026-03-14","eventNamn":"Grundkurs","typ":"Kurs","ort":"Skövde","startdatum":"2026-03-14","slutdatum":"2026-03-15","tidKvarTillEvent":"om 3 veckor","maxPlatser":24,"antalAnmalda":18,"platserKvar":6,"anmaldBelaggning":0.75,"bekraftadBelaggning":0.5,"antalNyaAnmalningar":3,"antalAnmalningsavgifter":12,"antalSlutbetalningar":9,"antalSlutbetalningFelande":3,"status":"Publicerad","eventKey":"Event-42","kursfamilj":"Bas","kursniva":"Steg 1","borOverAntal":7}',
    'get-event':
      '{"id":"recFULL0000000001","eventlabel":"Skövde 2026-03-14","eventNamn":"Grundkurs","typ":"Kurs","ort":"Skövde","startdatum":"2026-03-14","slutdatum":"2026-03-15","tidKvarTillEvent":"om 3 veckor","maxPlatser":24,"antalAnmalda":18,"platserKvar":6,"anmaldBelaggning":0.75,"bekraftadBelaggning":0.5,"antalNyaAnmalningar":3,"antalAnmalningsavgifter":12,"antalSlutbetalningar":9,"antalSlutbetalningFelande":3,"status":"Publicerad","eventKey":"Event-42","kursfamilj":"Bas","kursniva":"Steg 1","reserverade":2,"manuelltTillagda":1,"deltagarinfoSchemalagd":"2026-03-01","deltagarinfoAutoAvstangt":true,"viaFormular":11,"medfoljande":2,"vantelista":5,"borOverAntal":7}',
    'update-event':
      '{"id":"recFULL0000000001","eventlabel":"Skövde 2026-03-14","eventNamn":"Grundkurs","typ":"Kurs","ort":"Skövde","startdatum":"2026-03-14","slutdatum":"2026-03-15","tidKvarTillEvent":"om 3 veckor","maxPlatser":24,"antalAnmalda":18,"platserKvar":6,"anmaldBelaggning":0.75,"bekraftadBelaggning":0.5,"antalNyaAnmalningar":3,"antalAnmalningsavgifter":12,"antalSlutbetalningar":9,"antalSlutbetalningFelande":3,"status":"Publicerad","eventKey":"Event-42","kursfamilj":"Bas","kursniva":"Steg 1","reserverade":2,"manuelltTillagda":1,"deltagarinfoSchemalagd":"2026-03-01","deltagarinfoAutoAvstangt":true}',
  },
  'tomt fält-set (inget satt)': {
    'get-events':
      '{"id":"recTOM00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"borOverAntal":7}',
    'get-event':
      '{"id":"recTOM00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"deltagarinfoAutoAvstangt":false,"viaFormular":11,"medfoljande":2,"vantelista":5,"borOverAntal":7}',
    'update-event':
      '{"id":"recTOM00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"deltagarinfoAutoAvstangt":false}',
  },
  'specialValue-objekt (NaN/Infinity) på formel-/procent-fält': {
    'get-events':
      '{"id":"recNAN00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"borOverAntal":7}',
    'get-event':
      '{"id":"recNAN00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"deltagarinfoAutoAvstangt":false,"viaFormular":11,"medfoljande":2,"vantelista":5,"borOverAntal":7}',
    'update-event':
      '{"id":"recNAN00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"deltagarinfoAutoAvstangt":false}',
  },
  'lookup-arrayer (1-element och fler-värt)': {
    'get-events':
      '{"id":"recARR00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":"Göteborg","startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":30,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"borOverAntal":7}',
    'get-event':
      '{"id":"recARR00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":"Göteborg","startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":30,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"manuelltTillagda":4,"deltagarinfoSchemalagd":"2026-04-02","deltagarinfoAutoAvstangt":false,"viaFormular":11,"medfoljande":2,"vantelista":5,"borOverAntal":7}',
    'update-event':
      '{"id":"recARR00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":"Göteborg","startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":30,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"manuelltTillagda":4,"deltagarinfoSchemalagd":"2026-04-02","deltagarinfoAutoAvstangt":false}',
  },
  'checkbox utelämnad + falskt värde, eventKey icke-sträng': {
    'get-events':
      '{"id":"recCHK00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"borOverAntal":7}',
    'get-event':
      '{"id":"recCHK00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"deltagarinfoAutoAvstangt":false,"viaFormular":11,"medfoljande":2,"vantelista":5,"borOverAntal":7}',
    'update-event':
      '{"id":"recCHK00000000001","eventlabel":null,"eventNamn":null,"typ":null,"ort":null,"startdatum":null,"slutdatum":null,"tidKvarTillEvent":null,"maxPlatser":null,"antalAnmalda":0,"platserKvar":null,"anmaldBelaggning":null,"bekraftadBelaggning":null,"antalNyaAnmalningar":0,"antalAnmalningsavgifter":0,"antalSlutbetalningar":0,"antalSlutbetalningFelande":0,"status":null,"kursfamilj":null,"kursniva":null,"deltagarinfoAutoAvstangt":false}',
  },
};

const BELAGGNING = { viaFormular: 11, medfoljande: 2, vantelista: 5, borOverAntal: 7 };

/** Exakt de tre kompositioner EF:erna gör — håll dem i takt med anroparna. */
const KOMPOSITIONER: Record<
  string,
  (r: { id: string; fields: Record<string, unknown> }) => Record<string, unknown>
> = {
  'get-events': (r) => ({ ...mapEventBas(r), borOverAntal: BELAGGNING.borOverAntal }),
  'get-event': (r) => ({
    ...mapEventBas(r),
    ...mapEventKategorifalt(r),
    viaFormular: BELAGGNING.viaFormular,
    medfoljande: BELAGGNING.medfoljande,
    vantelista: BELAGGNING.vantelista,
    borOverAntal: BELAGGNING.borOverAntal,
  }),
  'update-event': (r) => ({ ...mapEventBas(r), ...mapEventKategorifalt(r) }),
};

test.describe('event-map — läs-shapen är oförändrad mot de fyra inline-kopiorna', () => {
  for (const { namn, record } of FIXTURER) {
    for (const form of ['get-events', 'get-event', 'update-event'] as const) {
      test(`${form} — ${namn}`, () => {
        const faktisk = JSON.stringify(KOMPOSITIONER[form](record));
        expect(faktisk).toBe(GOLDEN[namn][form]);
        // Nyckelordningen låses explicit: JSON.stringify ovan fångar den redan, men
        // en separat assertion gör felmeddelandet läsbart när bara ordningen glidit.
        expect(Object.keys(JSON.parse(faktisk))).toEqual(
          Object.keys(JSON.parse(GOLDEN[namn][form])),
        );
      });
    }
  }
});

test.describe('deriveManadAr — härledningen och dess kända gräns', () => {
  test('bygger basens option-form "Månad ÅÅÅÅ" ur ISO-datum', () => {
    expect(deriveManadAr('2026-03-14')).toBe('Mars 2026');
    expect(deriveManadAr('2025-11-01')).toBe('November 2025');
    expect(deriveManadAr('2026-12-31')).toBe('December 2026');
    expect(deriveManadAr('2026-01-01')).toBe('Januari 2026');
  });

  test('datum BORTOM options-horisonten härleds ändå — felet ska synas i basen, inte maskeras', () => {
    // §Kända fällor 45: basens singleSelect löper Nov 2025 → Dec 2026. Ett datum
    // utanför den ger en giltig sträng här, och Airtable avvisar den okända optionen
    // (typecast:false → 500). Det är MEDVETET — härledningen får aldrig tyst klampa
    // ett out-of-range-datum till något som råkar finnas i listan.
    expect(deriveManadAr('2027-01-05')).toBe('Januari 2027');
  });

  test('månad utanför 1–12 ger undefined-namn i stället för att kasta', () => {
    // Ren karakterisering av dagens beteende (oförändrat av TASK-23): en ogiltig
    // månad ger "undefined ÅÅÅÅ", vilket Airtable avvisar på samma väg som ovan.
    expect(deriveManadAr('2027-13-01')).toBe('undefined 2027');
  });
});
