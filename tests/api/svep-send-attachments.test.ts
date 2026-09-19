// Svepets bilageforwarding (TASK-455 AC #2/#3) — api-pure (ren logik, ingen
// staging, inga creds, ingen browser, ingen React-renderare).
//
// BROTTET (docs/research/utskicksytan-karta-och-historik-2026-09-18.md § A1):
// svepets sändlager gjorde redan ETT `sendActionEmail`-anrop per
// event-grupp, men skickade ALDRIG med `attachmentIds` — fältet fanns i
// kontraktet (`SendActionEmailInput.attachmentIds?`, TASK-147.5) men
// ingenting i sändytans klientlager läste ett bilageurval och förde det
// vidare. Detta test bevisar RÖTT FÖRST: se filens § RÖTT-FÖRST-PROTOKOLL
// nedan för hur den mätningen gjordes (en tillfällig, återställd radering
// av forwarding-raden i `svepSendGrupper.ts`, körd och observerad röd
// innan denna fil skrevs klar).
//
// IMPORTVÄGEN ÄR `svepSendGrupper.ts`, INTE `svepSend.ts` — MEDVETET.
// `svepSend.ts` (hooken) importerar `useAuth` → `AuthProvider.tsx` →
// Supabase-klienten → `src/env.ts`, som kraschar vid MODUL-EVALUERING utan
// `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (api-pure kör avsiktligt utan
// dem, se `svepSendGrupper.ts`s docblock för den fullständiga kedjan och det
// mätta felet). `sendSvepGrupper` bor därför i en egen, lätt fil utan den
// kedjan — samma begränsning `personregister-invalidering.test.ts`s
// docblock redovisar för sin egen fil ("Repot har ingen React-renderare i
// test-stacken ... en useMutation-hook kan inte monteras här"). Den tar sin
// `dataSource`-deps som argument i stället för att läsa den via
// `useDataSource()`, vilket gör den prövbar med en enkel, handskriven fejk.
//
// § RÖTT-FÖRST-PROTOKOLL (utfört av den agent som byggde denna skiva, mätt
// och rapporterat i slutrapporten, inte upprepningsbart härifrån utan att
// tillfälligt sabotera källkoden): filens första test nedan
// ("gruppen med vald bilaga skickar attachmentIds…") pröver exakt den
// kod-rad (`attachmentIds: attachmentIds(grupp)`) som saknades innan denna
// skiva. Tas den raden bort ur `sendSvepGrupper` faller testet — bevisat i
// byggsessionen, se PR-beskrivningen för exit-koderna.

import { expect, test } from '@playwright/test';
import type { SvepEventGrupp } from '../../src/components/svep/types';
import type { DataSourceAdapter } from '../../src/data/adapters/DataSourceAdapter';
import { type SvepSendInput, sendSvepGrupper } from '../../src/data/mutations/svepSendGrupper';
import type { Event } from '../../src/domain/models/Event';
import type { Registration } from '../../src/domain/models/Registration';
import type { SendActionEmailInput, SendActionEmailResult } from '../../src/domain/schemas';

function ev(overrides: Partial<Event> = {}): Event {
  return {
    id: 'recEventDefault',
    eventlabel: 'EVT',
    eventNamn: 'Sommarkurs i akvarell',
    typ: 'Kurs',
    ort: 'Uppsala',
    startdatum: '2099-06-01',
    slutdatum: '2099-06-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 5,
    platserKvar: 15,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.2,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

function reg(overrides: Partial<Registration> = {}): Registration {
  return {
    id: 'recRegDefault',
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Sommarkurs i akvarell',
    ort: 'Uppsala',
    status: 'Obekräftad',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-09-01T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEventDefault',
    personId: 'recPersonDefault',
    ...overrides,
  };
}

function okResultat(completed: string[]): SendActionEmailResult {
  return {
    status: 'sent',
    requested: completed.length,
    attempted: completed.length,
    completed,
    skipped: [],
    failed: [],
  };
}

/** Fejk-adapter — spelar bara in de anropen `sendSvepGrupper` faktiskt gör
 *  och svarar deterministiskt. `Pick<DataSourceAdapter, 'sendActionEmail'>`
 *  (funktionens egen parametertyp) gör att denna behöver implementera
 *  EXAKT en metod, inte hela adaptern. */
function fejkDataSource(): {
  dataSource: Pick<DataSourceAdapter, 'sendActionEmail'>;
  anrop: SendActionEmailInput[];
} {
  const anrop: SendActionEmailInput[] = [];
  return {
    anrop,
    dataSource: {
      sendActionEmail: async (input) => {
        anrop.push(input);
        return okResultat(input.registrationIds);
      },
    },
  };
}

const EVENT_MED_BILAGA = ev({ id: 'recEventBilaga0001', eventNamn: 'Hantverkshelg', ort: 'Falun' });
const EVENT_UTAN_BILAGA = ev({
  id: 'recEventUtanBilaga01',
  eventNamn: 'Novemberretreat',
  ort: 'Åre',
});
const REG_BILAGA = reg({ id: 'recRegBilaga01', eventId: EVENT_MED_BILAGA.id });
const REG_UTAN_BILAGA = reg({ id: 'recRegUtanBilaga01', eventId: EVENT_UTAN_BILAGA.id });

function grundInput(overrides: Partial<SvepSendInput> = {}): SvepSendInput {
  const grupper: SvepEventGrupp[] = [
    { event: EVENT_MED_BILAGA, mottagare: [REG_BILAGA] },
    { event: EVENT_UTAN_BILAGA, mottagare: [REG_UTAN_BILAGA] },
  ];
  return {
    svepTyp: 'bekraftelse',
    eventGrupper: grupper,
    amne: () => 'TASK-455 svep-test',
    mailtext: () => 'TASK-455 svep-test-brödtext.',
    attachmentIds: (grupp) => (grupp.event.id === EVENT_MED_BILAGA.id ? ['recBilagaXYZ'] : []),
    ...overrides,
  };
}

test.describe('sendSvepGrupper — attachmentIds per event-grupp (TASK-455 AC #2)', () => {
  test('gruppen med vald bilaga skickar attachmentIds; gruppen utan skickar tom lista', async () => {
    const { dataSource, anrop } = fejkDataSource();

    await sendSvepGrupper(dataSource, grundInput());

    expect(anrop).toHaveLength(2);
    const perEvent = new Map(anrop.map((a) => [a.eventId, a]));

    const medBilaga = perEvent.get(EVENT_MED_BILAGA.id);
    expect(medBilaga?.attachmentIds).toEqual(['recBilagaXYZ']);

    const utanBilaga = perEvent.get(EVENT_UTAN_BILAGA.id);
    // ADR-067 D9: en grupp utan valda bilagor går batch-vägen som i dag —
    // klienten skickar en TOM lista, aldrig `undefined`, aldrig ett annat
    // fält. Grenvalet sker server-side (`runActionSend`, `attachments.length
    // > 0`), oförändrat av denna skiva.
    expect(utanBilaga?.attachmentIds).toEqual([]);
  });

  test('flera valda bilagor för SAMMA grupp förs vidare i sin helhet, oberoende ordning', async () => {
    const { dataSource, anrop } = fejkDataSource();

    await sendSvepGrupper(
      dataSource,
      grundInput({
        eventGrupper: [{ event: EVENT_MED_BILAGA, mottagare: [REG_BILAGA] }],
        attachmentIds: () => ['recBilagaA', 'recBilagaB'],
      }),
    );

    expect(anrop).toHaveLength(1);
    expect(anrop[0]?.attachmentIds).toEqual(['recBilagaA', 'recBilagaB']);
  });

  test('attachmentIds-funktionen anropas MED rätt grupp — inte en global/delad lista', async () => {
    const { dataSource, anrop } = fejkDataSource();
    const settaGrupper: string[] = [];

    await sendSvepGrupper(
      dataSource,
      grundInput({
        attachmentIds: (grupp) => {
          settaGrupper.push(grupp.event.id);
          return grupp.event.id === EVENT_MED_BILAGA.id ? ['recBilagaXYZ'] : [];
        },
      }),
    );

    // Funktionen anropas en gång PER grupp — samma disciplin som `amne`/
    // `mailtext` redan har (`SvepSendInput`s befintliga form).
    expect(new Set(settaGrupper)).toEqual(new Set([EVENT_MED_BILAGA.id, EVENT_UTAN_BILAGA.id]));
    expect(anrop).toHaveLength(2);
  });

  test('övriga fält (eventId, registrationIds, amne, mailtext, actionType) OFÖRÄNDRADE av bilagetillägget', async () => {
    const { dataSource, anrop } = fejkDataSource();

    await sendSvepGrupper(dataSource, grundInput());

    const medBilaga = anrop.find((a) => a.eventId === EVENT_MED_BILAGA.id);
    expect(medBilaga).toMatchObject({
      actionType: 'bekraftelse',
      eventId: EVENT_MED_BILAGA.id,
      registrationIds: [REG_BILAGA.id],
      amne: 'TASK-455 svep-test',
      mailtext: 'TASK-455 svep-test-brödtext.',
    });
    expect(typeof medBilaga?.idempotencyKey).toBe('string');
    expect(medBilaga?.idempotencyKey.length).toBeGreaterThan(0);
  });
});
