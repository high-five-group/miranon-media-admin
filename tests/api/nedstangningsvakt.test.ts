// Realtime-nedstängningens ORDNINGSINVARIANT — TASK-346.6.
//
// ═══════════════════════════════════════════════════════════════════════════
// VILKET FYND DETTA BETALAR
// ═══════════════════════════════════════════════════════════════════════════
// Granskningen av PR #2150 (TASK-346.4, runda 2/3) bokförde ordningsinvarianten
// i `jobbRealtime.ts` som LASTBÄRANDE UTAN TESTSKYDD: flaggan måste sättas FÖRE
// `removeChannel`, annars hinner phoenix `leave()`-ekot fram till
// status-callbacken och en varning fyrar vid varje avmontering — alltså vid
// varje navigering, och i dev redan vid appstart (StrictMode monterar effekten
// en extra gång).
//
// Invarianten kunde inte testas där den låg: modulen importerar
// supabase-klienten vid inläsning. `nedstangningsvakt.ts` har DÄRFÖR noll
// importer, och kör rakt i Node (api-pure).
//
// VARJE PÅSTÅENDE PRÖVAS I BÅDA RIKTNINGAR (DoD #5): den rätta ordningen tystar
// ekot, och den OMVÄNDA gör det inte. Utan det andra ledet bevisar testet bara
// att koden gör något — inte att ordningen spelar roll.

import { expect, test } from '@playwright/test';
import {
  REALTIME_FELSTATUS,
  skapaNedstangningsvakt,
  stangNer,
} from '@/data/betalningar/nedstangningsvakt';

test('vakten rapporterar de tre felstatusarna INNAN nedstängning', () => {
  const vakt = skapaNedstangningsvakt();
  for (const status of REALTIME_FELSTATUS) {
    expect(vakt.arFel(status), `${status} före stang()`).toBe(true);
  }
});

test('vakten rapporterar ALDRIG något efter nedstängning, inte ens ett äkta fel', () => {
  const vakt = skapaNedstangningsvakt();
  vakt.stang();
  for (const status of REALTIME_FELSTATUS) {
    expect(vakt.arFel(status), `${status} efter stang()`).toBe(false);
  }
  // Bredden är avsiktlig: också ett CHANNEL_ERROR som landar mitt i
  // nedrivningen är ett eko av nedstängningen, inte ett fel någon kan åtgärda.
  expect(vakt.arFel('CHANNEL_ERROR')).toBe(false);
});

test('SUBSCRIBED och okända status-värden är aldrig fel', () => {
  const vakt = skapaNedstangningsvakt();
  expect(vakt.arFel('SUBSCRIBED')).toBe(false);
  expect(vakt.arFel('JOINING')).toBe(false);
  expect(vakt.arFel('')).toBe(false);
});

/* ═══════════════════════ ORDNINGEN, BÅDA RIKTNINGARNA ═══════════════════════ */

/**
 * Speglar den verkliga sekvensen: nedrivningen utlöser SYNKRONT ett
 * `'CLOSED'`-eko till status-callbacken. Det är precis vad phoenix `leave()`
 * gör, och hela skälet till att ordningen är lastbärande.
 */
function rivMedEko(vakt: ReturnType<typeof skapaNedstangningsvakt>, rapporterade: string[]) {
  return () => {
    if (vakt.arFel('CLOSED')) rapporterade.push('CLOSED');
  };
}

test('RÄTT ORDNING (stangNer): close-ekot rapporteras INTE', () => {
  const vakt = skapaNedstangningsvakt();
  const rapporterade: string[] = [];
  stangNer(vakt, rivMedEko(vakt, rapporterade));
  expect(rapporterade).toEqual([]);
});

test('NEGATIV KONTROLL: omvänd ordning rapporterar ekot som ett fel', () => {
  // Detta ÄR buggen granskningsfyndet beskriver, skriven ut. Fälls detta test
  // någon gång i framtiden betyder det att `arFel` slutat bero på flaggan -
  // och då är testet ovan grönt av fel skäl.
  const vakt = skapaNedstangningsvakt();
  const rapporterade: string[] = [];

  rivMedEko(vakt, rapporterade)(); // nedrivningen FÖRST
  vakt.stang(); // flaggan EFTERÅT - för sent

  expect(rapporterade).toEqual(['CLOSED']);
});

test('NEGATIV KONTROLL: ett predikat som bara läser status fyrar vid varje avmontering', () => {
  // Den naiva implementationen, som 346.4:s kommentar uttryckligen varnar för.
  // Den ser korrekt ut och är fel exakt en gång per navigering.
  const naivtPredikat = (status: string) => REALTIME_FELSTATUS.includes(status);

  const vakt = skapaNedstangningsvakt();
  const naivaRapporter: string[] = [];
  const vaktensRapporter: string[] = [];

  stangNer(vakt, () => {
    if (naivtPredikat('CLOSED')) naivaRapporter.push('CLOSED');
    if (vakt.arFel('CLOSED')) vaktensRapporter.push('CLOSED');
  });

  expect(naivaRapporter).toEqual(['CLOSED']);
  expect(vaktensRapporter).toEqual([]);
});

test('varje vakt är oberoende: en nedstängd kanal tystar inte en annan', () => {
  // Kanalen är delad i appen i dag, men vakten får inte bära modul-globalt
  // tillstånd: två samtidiga prenumerationer (t.ex. under en StrictMode-
  // dubbelmontering) skulle annars tysta varandras verkliga fel.
  const forsta = skapaNedstangningsvakt();
  const andra = skapaNedstangningsvakt();
  forsta.stang();
  expect(forsta.arFel('CHANNEL_ERROR')).toBe(false);
  expect(andra.arFel('CHANNEL_ERROR')).toBe(true);
});
