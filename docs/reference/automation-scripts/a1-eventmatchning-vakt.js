/**
 * A1 - Matcha anmälan mot event: matchningssteget som skript.
 *
 * TASK-284.2 (ADR-122 beslut 2, 3 och 6). Körs i Airtable som ett
 * customScript-steg i automation wflDCKPAv2P6Yu9U6 (bas apphjj8Q7lkXCMsL4 i
 * staging, samma automations-ID i prod), och ERSÄTTER de två tidigare
 * stegen i sin helhet:
 *   - findRecords "Leta efter en match" (wacDkQMtkfCRwDYxK)
 *   - updateRecord "Koppla anmälan till eventet" (wacXLk4YN5AzohqCn)
 *
 * SKÄLET TILL ERSÄTTNING I STÄLLET FÖR ETT STEG FÖRE: det gamla
 * updateRecord-steget kör OVILLKORLIGT - vid noll träffar skriver det en
 * tom lista, inte ingenting (mätt live 2026-08-21, se MÄTNOT-blocket i
 * docs/reference/schema_reference.md under A1). En vakt som läggs FÖRE en
 * kvarvarande ovillkorlig koppling är fail-open. Denna vakt ERSÄTTER
 * kopplingen i stället och är därför fail-closed by construction: kraschar
 * skriptet, eller körs det inte alls, blir Event tomt - samma utfall som en
 * medveten fällning (ADR-122 beslut 2).
 *
 * EXPRESS-GRENEN (conditionalGroup wded6gggP5Gk0qSa9, villkor EventKey
 * isEmpty AND 'Datum och ort' isNotEmpty, ADR-122 beslut 5) är en SEPARAT
 * nod som körs OBEROENDE av detta steg, direkt efter det i automationen,
 * och rörs inte av detta skript - se express-tidig-returen nedan, som
 * lämnar en tom EventKey helt orörd så att den grenen får styra oberört.
 *
 * T168-RÄTTNING (2026-08-22): datum-axeln jämför inte längre bara formen.
 * Den strippade formen matchade "12-13 september 2025" mot "...2026" som
 * LIKA, vilket är exakt det fel duplicerade kalenderposter producerar.
 * Årtalen prövas nu som en EGEN axel (datumAvviker nedan), och samma
 * rättning är gjord i formelfältet - de två ytorna måste bedöma likadant.
 *
 * NORMALISERINGEN OCH JÄMFÖRELSEN är porterad FRÅN Eventmatchning-formeln
 * (Anmälningar.fldYz2NRZJjyX8VWB, TASK-284.1) - samma tre mätta
 * normaliseringsklasser (skiftläge, mellanslag runt tankstreck, upprepat
 * årtal vid månadsskifte) och samma trestegslogik (tomt jämförelsefält ger
 * ALDRIG avvikelse, ADR-122 beslut 4). Facit för kursnamnet är
 * Eventplanering."Event (text)" - INTE Anmälningar."Event (namn)", som bara
 * ekar anmälans egen "Vill anmäla sig till" och därför vore en tautologi
 * som jämförelsesida (ADR-122 § Fynd 1 felkarakteriserar fältet;
 * verifierat faktafel, T161).
 *
 * OBS FÄLT-ID-DIVERGENS PROD/STAGING (upptäckt vid byggandet av denna
 * skiva): ADR-122 § Fynd 1 och TASK-284.2-kortets Implementation Notes
 * anger PROD-fältID:n för "Ort (from Event)" (fld5560T3pQZSUBaJ) och
 * "Kurs (from Event)" (fldfqU6MfBQdaeLUk). Ingen av dem finns i
 * STAGING-basen apphjj8Q7lkXCMsL4 (verifierat live via get_table_schema,
 * 2026-08-21) - staging bär motsvarande fält under ANDRA ID:n
 * (fldUhHceqBud4BHvf respektive fldcTDSzGBG0bHjl3). Detta skript läser
 * fälten via NAMN direkt på Eventplanering (Scripting-API:t adresserar
 * celler per fältnamn inom en tabell, inte per fält-ID), så divergensen
 * påverkar inte skriptets körning - men den är bokförd här eftersom nästa
 * läsare annars kan luras av kortets fält-ID:n till att tro att de är
 * giltiga i båda baserna.
 */

// ================= CONFIG =================
const TABLE_ANM = 'Anmälningar';
const TABLE_EVENT = 'Eventplanering';
const TABLE_ERRORLOG = 'Error-log';

const FLD_ANM_EVENTKEY = 'EventKey';
const FLD_ANM_ORT = 'Ort';
const FLD_ANM_DATUM = 'Datum';
const FLD_ANM_KURS = 'Vill anmäla sig till';
const FLD_ANM_EVENT_LINK = 'Event';

const FLD_EVENT_EVENTKEY = 'EventKey';
const FLD_EVENT_ORT = 'Ort';
const FLD_EVENT_KURS = 'Event (text)';
const FLD_EVENT_DATUM = 'Datum (visas i länk)';

const FLD_ERR_MESSAGE = 'Felmeddelande';
const FLD_ERR_DATE = 'Datum';
const FLD_ERR_RELATES = 'Relaterar till';

// ================= NORMALISERING (porterad från Eventmatchning-formeln) =================
function normSimple(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normDatum(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/\d{4}/g, '')
    .replace(/\s*[-–—]\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function axisAvviker(a, b, normalizer) {
  const na = normalizer(a);
  const nb = normalizer(b);
  if (na === '' || nb === '') return false; // tomt = kan inte avgöras (ADR-122 beslut 4)
  return na !== nb;
}

// T168: normDatum stryker ALLA fyrsiffriga årtal, så "12-13 september 2025"
// och "12-13 september 2026" normaliseras identiskt. Rotorsaken bakom T158
// är att Roger DUPLICERAR gamla kalenderposter, vilket gör årsfallet till
// det mest sannolika framtida felet - kurs, ort och dag/månad passerar alla,
// bara årtalet skiljer. Formen jämförs därför som förut (den löser de tre
// MÄTTA formateringsklasserna), och årtalen prövas som en EGEN axel.
// Spegling av Eventmatchning-formeln (fldYz2NRZJjyX8VWB) efter samma
// rättning - de två ytorna måste bedöma likadant.
function forstaArtal(value) {
  const traff = String(value == null ? '' : value).match(/\d{4}/);
  return traff ? traff[0] : '';
}

function datumAvviker(a, b) {
  const na = normDatum(a);
  const nb = normDatum(b);
  if (na === '' || nb === '') return false; // tomt = kan inte avgöras (ADR-122 beslut 4)
  if (na !== nb) return true; // formen skiljer - avgjort utan årtalen
  // Formen är lika. Pröva årtalen separat: saknas årtal på någon sida kan
  // året inte avgöras, och tomt ger ALDRIG avvikelse (samma beslut 4).
  const ya = forstaArtal(a);
  const yb = forstaArtal(b);
  if (ya === '' || yb === '') return false;
  const rawA = String(a == null ? '' : a);
  const rawB = String(b == null ? '' : b);
  // Tvåvägs-prövning gör jämförelsen symmetrisk och tål att facit upprepar
  // årtalet vid månadsskifte ("31 oktober 2026 - 1 november 2026").
  return rawB.indexOf(ya) === -1 || rawA.indexOf(yb) === -1;
}

function normalizeEventKey(raw) {
  const trimmed = String(raw == null ? '' : raw).trim();
  if (trimmed === '') return '';
  const stripped = trimmed.replace(/^event-\s*/i, '');
  return `Event-${stripped}`;
}

function selectNamesJoined(cellValue) {
  if (!Array.isArray(cellValue)) return '';
  return cellValue
    .map((v) => (typeof v === 'string' ? v : v?.name))
    .filter(Boolean)
    .join(', ');
}

// ================= INPUT =================
const { anmId } = input.config();
if (!anmId) throw new Error('Missing anmId');

const anmTbl = base.getTable(TABLE_ANM);
const eventTbl = base.getTable(TABLE_EVENT);
const errorTbl = base.getTable(TABLE_ERRORLOG);

const anmRec = await anmTbl.selectRecordAsync(anmId);
if (!anmRec) throw new Error(`Anmälan not found: ${anmId}`);

const rawEventKey = anmRec.getCellValue(FLD_ANM_EVENTKEY);
const normalizedKey = normalizeEventKey(rawEventKey);

// Tom nyckel: expressformuläret bär ingen EventKey (det matchas via sin
// egen gren på Expresslabel, ADR-122 beslut 5) - och en rad utan EventKey
// har inget för DETTA steg att pröva. Absolut tystnad här, aldrig en
// Error-log-rad, är vad som låter expressgrenens EGEN vakt styra oberört.
if (normalizedKey === '') {
  console.log('Tom EventKey - express eller ofullständig rad, ingen åtgärd.');
} else {
  const candidates = await eventTbl.selectRecordsAsync({
    fields: [FLD_EVENT_EVENTKEY, FLD_EVENT_ORT, FLD_EVENT_KURS, FLD_EVENT_DATUM],
  });
  const match = candidates.records.find(
    (r) => r.getCellValue(FLD_EVENT_EVENTKEY) === normalizedKey,
  );

  if (!match) {
    await errorTbl.createRecordAsync({
      [FLD_ERR_MESSAGE]: 'A1: ingen Eventplanering-post matchar normaliserad EventKey',
      [FLD_ERR_DATE]: new Date(),
      [FLD_ERR_RELATES]: `Anmälan ${anmId} - EventKey "${rawEventKey}" -> "${normalizedKey}" - ingen träff`,
    });
    console.log(`Ingen match för ${normalizedKey}. Event lämnas tomt.`);
  } else {
    const anmOrt = anmRec.getCellValue(FLD_ANM_ORT);
    const anmDatum = anmRec.getCellValue(FLD_ANM_DATUM);
    const anmKurs = selectNamesJoined(anmRec.getCellValue(FLD_ANM_KURS));

    const eventOrt = match.getCellValue(FLD_EVENT_ORT);
    const eventDatum = match.getCellValue(FLD_EVENT_DATUM);
    const eventKurs = match.getCellValue(FLD_EVENT_KURS);

    const avviker =
      axisAvviker(anmOrt, eventOrt, normSimple) ||
      axisAvviker(anmKurs, eventKurs, normSimple) ||
      datumAvviker(anmDatum, eventDatum);

    if (avviker) {
      await errorTbl.createRecordAsync({
        [FLD_ERR_MESSAGE]: 'A1: anmälan avviker från det tilltänkta eventet - länkas inte',
        [FLD_ERR_DATE]: new Date(),
        [FLD_ERR_RELATES]:
          `Anmälan ${anmId} - EventKey "${rawEventKey}" -> "${normalizedKey}" - ` +
          `Ort "${anmOrt || ''}" vs "${eventOrt || ''}" - ` +
          `Kurs "${anmKurs || ''}" vs "${eventKurs || ''}" - ` +
          `Datum "${anmDatum || ''}" vs "${eventDatum || ''}"`,
      });
      console.log(`Avvikelse mot ${normalizedKey}. Event lämnas tomt.`);
    } else {
      await anmTbl.updateRecordAsync(anmId, {
        [FLD_ANM_EVENT_LINK]: [{ id: match.id }],
      });
      console.log(`Match mot ${normalizedKey}. Länkad.`);
    }
  }
}
