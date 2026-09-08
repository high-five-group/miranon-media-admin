// [TASK-438] Härledningen inbetalning → tidslinje-händelse, prövad utan
// webbläsare (api-pure, creds-fritt). Ordvalen är betalningssidans
// (`InbetalningsLista.tsx`/`panel-harledningar.ts`) — ett avsteg här är ett
// avsteg från "samma sak heter samma sak var Lotta än står".
import { expect, test } from '@playwright/test';
import { Ban, Banknote, Undo2 } from 'lucide-react';
import { visaKronor } from '@/components/betalningar/belopp-inmatning';
import {
  arRentDatum,
  inbetalningsHandelser,
} from '@/components/betalningar/inbetalnings-handelser';
import type { Inbetalning, InbetalningarBatchGrupp, Kvitto } from '@/domain/schemas';

const INBET = 'a1a1a1a1-1111-4111-8111-000000000001';
const KVITTO = 'b2b2b2b2-2222-4222-8222-000000000001';

function inbet(overrides: Partial<Inbetalning> = {}): Inbetalning {
  return {
    id: INBET,
    anmalanRecordId: 'recANM0000000001',
    ogonblicksbildNamn: 'Eva Lindqvist',
    ogonblicksbildEvent: 'Resor i medvetandet 1',
    ogonblicksbildEventdatum: '2026-07-31',
    belopp: 1000,
    betalsatt: 'Swish',
    betalningsdatum: '2026-07-15',
    typ: 'inbetalning',
    status: 'aktiv',
    makuleradSkal: null,
    makuleradNar: null,
    bankreferens: null,
    kvittoId: null,
    notering: null,
    skapadAv: 'test@example.com',
    skapadNar: '2026-07-15T10:00:00.000Z',
    ...overrides,
  };
}

function kvitto(overrides: Partial<Kvitto> = {}): Kvitto {
  return {
    id: KVITTO,
    kvittonummer: '2026-0042',
    ar: 2026,
    lopnummer: 42,
    inbetalningId: INBET,
    lagringsnyckel: 'kvitton/2026-0042.pdf',
    skickadNar: '2026-07-15T10:05:00.000Z',
    mottagare: 'eva@example.com',
    typ: 'kvitto',
    originalKvittoId: null,
    status: 'skickat',
    skapadNar: '2026-07-15T10:04:00.000Z',
    ...overrides,
  };
}

function grupp(
  inbetalningar: Inbetalning[],
  kvitton: Kvitto[] = [],
  jobbfel: InbetalningarBatchGrupp['jobbfel'] = [],
): InbetalningarBatchGrupp {
  return { anmalanRecordId: 'recANM0000000001', inbetalningar, kvitton, jobbfel };
}

test.describe('inbetalningsHandelser (TASK-438)', () => {
  test('inbetalning: "Inbetalning <belopp> kr · <betalsätt>", kvittostatus som underrad, betalningsdatumet som tid', () => {
    const [h] = inbetalningsHandelser(grupp([inbet({ kvittoId: KVITTO })], [kvitto()]));
    // Tusentalsavgränsaren är formatterarens (hårt blanksteg, sv-SE) — aldrig ett
    // vanligt mellanslag inskrivet för hand här.
    expect(h?.text).toBe(`Inbetalning ${visaKronor(1000)} kr · Swish`);
    expect(h?.undertext).toEqual(['Kvitto 2026-0042 · skickat']);
    expect(h?.nar).toBe('2026-07-15');
    expect(h?.ikon).toBe(Banknote);
    expect(h?.id).toBe(`inbetalning-${INBET}`);
  });

  test('utan kvitto: "Inget kvitto" — samma ord som betalningssidan', () => {
    const [h] = inbetalningsHandelser(grupp([inbet()]));
    expect(h?.undertext).toEqual(['Inget kvitto']);
  });

  test('återbetalning: typordet bär riktningen, beloppet visas positivt, egen ikon', () => {
    const [h] = inbetalningsHandelser(
      grupp([inbet({ belopp: -500, typ: 'aterbetalning', betalsatt: 'Bankgiro' })]),
    );
    expect(h?.text).toBe(`Återbetalning ${visaKronor(500)} kr · Bankgiro`);
    expect(h?.text).not.toContain('-');
    expect(h?.ikon).toBe(Undo2);
  });

  test('makulerad: syns med sitt skäl och Ban-ikonen — historiken tystas aldrig (ADR-128)', () => {
    const [medSkal] = inbetalningsHandelser(
      grupp([inbet({ status: 'makulerad', makuleradSkal: 'Dubbelregistrering' })]),
    );
    expect(medSkal?.undertext).toEqual(['Inget kvitto', 'Makulerad: Dubbelregistrering']);
    expect(medSkal?.ikon).toBe(Ban);
    const [utanSkal] = inbetalningsHandelser(grupp([inbet({ status: 'makulerad' })]));
    expect(utanSkal?.undertext).toEqual(['Inget kvitto', 'Makulerad']);
  });

  test('noteringen står sist, med prefixet "Notering:" (betalningssidans form)', () => {
    const [h] = inbetalningsHandelser(
      grupp([inbet({ kvittoId: KVITTO, notering: 'Swishade från mammas konto' })], [kvitto()]),
    );
    expect(h?.undertext).toEqual([
      'Kvitto 2026-0042 · skickat',
      'Notering: Swishade från mammas konto',
    ]);
  });

  test('saknas betalningsdatum faller tiden tillbaka på skapadNar (ISO med klockslag)', () => {
    const [h] = inbetalningsHandelser(grupp([inbet({ betalningsdatum: null })]));
    expect(h?.nar).toBe('2026-07-15T10:00:00.000Z');
    expect(arRentDatum(h?.nar ?? '')).toBe(false);
    expect(arRentDatum('2026-07-15')).toBe(true);
  });

  test('kvittojobbets felskäl visas INTE i loggen — det hör till ytan där Lotta kan agera', () => {
    const [h] = inbetalningsHandelser(
      grupp([inbet()], [], [{ inbetalningId: INBET, skal: 'Entydighets-guarden: två kandidater' }]),
    );
    expect(h?.undertext).toEqual(['Inget kvitto']);
    expect(h?.undertext.join(' ')).not.toContain('Entydighets-guarden');
  });

  test('en tom grupp ger en tom lista, aldrig ett fel', () => {
    expect(inbetalningsHandelser(grupp([]))).toEqual([]);
  });
});
