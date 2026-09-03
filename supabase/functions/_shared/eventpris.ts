// @ts-nocheck — Deno Edge Function-modul (importerar `airtable-client.ts`,
// som rör Deno-globaler; typas vid deploy, se ADR-010 § Fas 7-åtagande).
// Samma undantags-mönster som `_shared/betalningar-bas.ts` och
// `_shared/document-sources.ts`.
//
// EVENTINNEHÅLL-STANDARDEN, UPPSLAGEN FÖR EN HEL LÄSNING — TASK-368.7.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR FILEN FINNS
// ═══════════════════════════════════════════════════════════════════════════
// Eventets pris har TRE nivåer (`_shared/betalningar-bas.ts` § PRISETS TRE
// NIVÅER): anmälans avtalade pris, eventets eget `Pris (kr)`, och
// Eventinnehållets standard för paret `Event (source) × Typ`. Nivå 1 hör till
// en anmälan; nivå 2 står på eventraden och läses av `mapEventBas` direkt.
// Nivå 3 kräver ett UPPSLAG — det finns ingen lagrad länk
// Eventplanering→Eventinnehåll (`data-model.md`, raden för
// `Eventplanering.Pris (kr)`: *"Tomt = Eventinnehållets standard gäller
// (härleds i KOD)"*).
//
// Uppslaget är alltså I/O, och `event-map.ts` är en REN modul (Node-typkollad
// via `tsconfig.edge-shared.json`). Det bor därför här, i EN funktion som de
// tre läs-EF:erna delar, i stället för i tre kopior — samma skäl som gav
// `event-map.ts` sitt eget filhuvud.
//
// ═══════════════════════════════════════════════════════════════════════════
// ETT ANROP FÖR HELA LÄSNINGEN, ALDRIG ETT PER EVENT
// ═══════════════════════════════════════════════════════════════════════════
// `hamta-oppna-betalningar` gör samma uppslag med ETT anrop per DISTINKT par.
// Här hämtas hela Eventinnehåll-tabellen i stället, EN gång, och paren löses
// lokalt. Skälet är mätt, inte antaget: tabellen bär de sju Event×Typ-
// kombinationerna (`data-model.md` § Bilagornas datamodell; 7 rader i staging
// 2026-09-03), och `get-events` listar HELA eventregistret — ett anrop per par
// hade där kunnat bli sju anrop där ett räcker. `get-event-contents` läser
// redan samma tabell i sin helhet av samma skäl.
//
// ANROPET UTEBLIR HELT när varje rad i läsningen redan har ett eget pris:
// standarden kan då inte ändra ett enda utfall, och basens delade anropstak
// (5/sekund, ADR-063 § S91-not) är inget att betala i onödan.
//
// ═══════════════════════════════════════════════════════════════════════════
// ETT UPPSLAG SOM FALLERAR FÅR INTE FÄLLA LÄSNINGEN
// ═══════════════════════════════════════════════════════════════════════════
// Priset är ETT fält i ett eventsvar som bär trettio. Att låta ett fallerat
// Eventinnehåll-anrop göra hela `get-events` till ett 500 hade gjort
// eventlistan beroende av en tabell den annars inte rör. Felet loggas och
// uppslaget blir tomt — priset faller då tillbaka på eventets eget, alltså på
// exakt det värde raden hade utan denna modul. Ingen gissning, ingen tystnad.

import { fetchFromAirtable } from './airtable-client.ts';
import {
  byggStandardpriser,
  eventinnehallNyckelFor,
  standardprisNycklar,
} from './event-map.ts';

const EVENTINNEHALL_TABLE = 'Eventinnehåll';

/** Airtable-radens form modulen läser (samma i list- och single-get-svar). */
type AirtableRecord = { id: string; fields: Record<string, unknown> };

/**
 * Eventinnehåll-standardens pris per `Event (source) × Typ`, för de rader i
 * `records` som saknar ett EGET pris.
 *
 * Tom Map = inget att slå upp (varje rad har eget pris, ingen rad bär båda
 * nycklarna, eller uppslaget fallerade). En rad utan post i mappen får `null`
 * som standard, vilket `valjPris` behandlar som "ingen standard finns".
 */
export async function hamtaStandardpriser(
  records: readonly AirtableRecord[],
  loggPrefix: string,
): Promise<Map<string, number>> {
  // URVALET OCH INDEXERINGEN ÄR RENA och bor i `event-map.ts`
  // (`standardprisNycklar` / `byggStandardpriser`), hermetiskt testade i
  // `tests/api/event-map.test.ts`. Kvar här är enbart I/O:t — det är hela
  // skälet till snittet: denna modul kan inte köras i Node.
  const nycklar = standardprisNycklar(records);
  if (nycklar.size === 0) return new Map();

  let rader: AirtableRecord[];
  try {
    // HELA TABELLEN I ETT ANROP — se filhuvudet § ETT ANROP FÖR HELA LÄSNINGEN.
    rader = await fetchFromAirtable(EVENTINNEHALL_TABLE, {
      fields: ['Event', 'Typ', 'Pris (kr)'],
    });
  } catch (fel) {
    // Se filhuvudet § ETT UPPSLAG SOM FALLERAR: eventlistan är viktigare än
    // prisets tredje nivå, och tystnad är inte ett alternativ.
    console.warn(
      `${loggPrefix} Eventinnehåll-uppslaget fallerade — priset faller tillbaka på ` +
        `eventets eget fält | ${fel instanceof Error ? fel.message : String(fel)}`,
    );
    return new Map();
  }

  return byggStandardpriser(rader, nycklar);
}

/**
 * Standarden som gäller för EN eventrad, i den form `mapEventBas` tar emot.
 * `null` = ingen standard finns för radens par (eller raden bär inte båda
 * nycklarna) — `valjPris` faller då tillbaka på eventets eget pris.
 */
export function standardprisFor(
  standardpriser: ReadonlyMap<string, number>,
  record: AirtableRecord,
): number | null {
  const nyckel = eventinnehallNyckelFor(record);
  if (nyckel === null) return null;
  return standardpriser.get(nyckel) ?? null;
}
