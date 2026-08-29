// RÄCKVIDDSBYTETS BESLUTSLOGIK (TASK-338.4, ADR-125 § Beslut 1) —
// regressionstest mot `_shared/rackvidd-matchning.ts` § `provaRackviddsbyte`,
// den rad-beroende auktorisationen i `update-attachment-scope`.
// api-pure (ren logik, ingen staging, inga creds) → körs lokalt OCH i CI,
// till skillnad från `update-attachment-scope.staging.test.ts` som skip:as
// utan creds. Samma tvånivå-uppdelning `rackvidd-matchning.test.ts` (338.2)
// och `plats-uppslag.test.ts` redan etablerar.
//
// ═══ VARFÖR DENNA NIVÅ ÄR NÖDVÄNDIG, INTE BARA SNABBARE ═══
// Ett av de tre hindren går INTE att framkalla mot staging. `fel-dokument-
// klass` kräver en rad som är BÅDE gemensam OCH mall-/person-genererad, och
// ingen skrivväg vi har producerar den kombinationen: `generate-event-
// attachment` skriver `Dokumentklass: Event-mallad` men ALDRIG något
// `Räckvidd` alls (verifierat 2026-08-29 — noll `Räckvidd`-skrivningar i
// den filen), så en sådan rad fälls redan av `ej-gemensam` och staging-
// testet hade bevisat FEL vakt medan det såg grönt ut.
//
// Kombinationen är ändå NÅBAR I DRIFT: ADR-063 slår fast att basen är en
// leverabel Lotta och Marcus arbetar direkt i, och ett handsatt
// `Räckvidd = Gemensam` på en mall-rad är exakt den situation vakten finns
// för. Vakten är alltså inte svagare för att den saknar skarpt bevis — den
// är flyttad dit den ÄR bevisbar (ADR-057).
//
// ═══ TVÅ RIKTNINGAR PER HINDER ═══
// Varje hinder prövas både i sitt FÄLLANDE fall och i ett grannfall som
// SKA släppa igenom. En funktion som alltid svarar `{ tillatet: false }`
// (eller alltid `true`) hade annars passerat halva sviten — och `true` är
// den farliga riktningen: den släpper fram ett byte som gör filen tyst
// oöppningsbar (`ankar-flytt`) eller lägger ett events kvitto i varje
// matchande events dokumentlista (`fel-dokumentklass`).
//
// ANKAR-ARGUMENTEN är förberäknade av anroparen (EF:en kör
// `buildStorageAnchor`, som bor i den zod-importerande `attachments.ts`).
// Strängarna nedan är därför de FORMER den funktionen faktiskt producerar
// — `recXXX` (event-länkat), `kurstyp/rim` (familjebunden, ASCII-slug) och
// `alla-event` (axellös/platsbunden) — inte påhittade värden.

import { expect, test } from '@playwright/test';
import {
  findDisallowedField,
  getOperation,
} from '../../supabase/functions/_shared/field-allowlists';
import {
  ATTACHMENT_CLASS_EVENT_MALLAD,
  ATTACHMENT_CLASS_PERSON_GENERERAD,
  ATTACHMENT_CLASS_UPPLADDAD,
  ATTACHMENT_SCOPE_ALLA_EVENT,
  ATTACHMENT_SCOPE_EVENT,
  ATTACHMENT_SCOPE_GEMENSAM,
  ATTACHMENT_SCOPE_KURSTYP,
  provaRackviddsbyte,
  VALID_ATTACHMENT_CLASSES,
} from '../../supabase/functions/_shared/rackvidd-matchning';

/** De tre ankar-formerna `buildStorageAnchor` kan producera. */
const ANKARE_EVENT = 'recBeLaGgNiNgEvEnT';
const ANKARE_RIM = 'kurstyp/rim';
const ANKARE_ALLA = 'alla-event';

/** Ett byte som INTE rör ankaret — grundfallet för varje hinder-prövning. */
function prova(over: {
  rackvidd?: string | null;
  klass?: string | null;
  ankarNu?: string | null;
  ankarEfter?: string | null;
}) {
  return provaRackviddsbyte({
    radensRackvidd: over.rackvidd === undefined ? ATTACHMENT_SCOPE_GEMENSAM : over.rackvidd,
    radensDokumentklass: over.klass === undefined ? ATTACHMENT_CLASS_UPPLADDAD : over.klass,
    ankarNu: over.ankarNu === undefined ? ANKARE_ALLA : over.ankarNu,
    ankarEfter: over.ankarEfter === undefined ? ANKARE_ALLA : over.ankarEfter,
  });
}

test.describe('provaRackviddsbyte — grundfallet släpper igenom', () => {
  test('gemensam + uppladdad + oförändrat anker → tillåtet', () => {
    expect(prova({})).toEqual({ tillatet: true });
  });

  test('platsbytet (skivans hela syfte) rör aldrig ankaret → tillåtet', () => {
    // "Alla event" → "Rönninge" och tillbaka: båda ligger under `alla-event`
    // eftersom ingen kursfamilj är satt. Plats-axeln har MEDVETET ingen egen
    // ankar-gren (buildStorageAnchor § Plats-axeln), och det är därför
    // Lottas faktiska användningsfall aldrig kan träffa `ankar-flytt`.
    expect(prova({ ankarNu: ANKARE_ALLA, ankarEfter: ANKARE_ALLA })).toEqual({ tillatet: true });
  });

  test('en gemensam bilaga som RÅKAR bära en Event-länk är fortfarande tillåten', () => {
    // TASK-275.2:s design: `Event` förblir satt även för gemensamma bilagor
    // när ett event var känt vid uppladdningen. Ankaret blir då event-ID:t
    // för BÅDA sidorna, alltså oförändrat.
    expect(prova({ ankarNu: ANKARE_EVENT, ankarEfter: ANKARE_EVENT })).toEqual({ tillatet: true });
  });
});

test.describe('provaRackviddsbyte — hindret ej-gemensam (403)', () => {
  test('räckvidd Event fälls', () => {
    const utfall = prova({ rackvidd: ATTACHMENT_SCOPE_EVENT });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('ej-gemensam');
    expect(utfall.hinder.status).toBe(403);
  });

  test('TOMT Räckvidd fälls — fail-closed, inte "antagligen gemensam"', () => {
    // arGemensam-docblocket mätte 34 av 49 staging-rader som event-bundna
    // med tomt Räckvidd. Att tolka dem som gemensamma hade gjort dem
    // bytbara — och därmed spridbara till varje event.
    const utfall = prova({ rackvidd: null });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('ej-gemensam');
  });

  test('okänt räckviddsvärde fälls — gissar aldrig', () => {
    const utfall = prova({ rackvidd: 'Något-vi-aldrig-sett' });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('ej-gemensam');
  });

  test('legacy Kurstyp SLÄPPS IGENOM — normaliseras till Gemensam', () => {
    // Prod-raderna migreras först i TASK-338.6. Att neka dem hade gjort
    // "Ändra räckvidd" oanvändbar på exakt de rader som mest behöver den.
    expect(
      prova({ rackvidd: ATTACHMENT_SCOPE_KURSTYP, ankarNu: ANKARE_RIM, ankarEfter: ANKARE_RIM }),
    ).toEqual({
      tillatet: true,
    });
  });

  test('legacy Alla event SLÄPPS IGENOM — normaliseras till Gemensam', () => {
    expect(prova({ rackvidd: ATTACHMENT_SCOPE_ALLA_EVENT })).toEqual({ tillatet: true });
  });
});

test.describe('provaRackviddsbyte — hindret fel-dokumentklass (403)', () => {
  test('Event-mallad fälls — kan inte framkallas mot staging, se filhuvudet', () => {
    const utfall = prova({ klass: ATTACHMENT_CLASS_EVENT_MALLAD });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('fel-dokumentklass');
    expect(utfall.hinder.status).toBe(403);
  });

  test('Person-genererad fälls', () => {
    const utfall = prova({ klass: ATTACHMENT_CLASS_PERSON_GENERERAD });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('fel-dokumentklass');
  });

  test('TOM Dokumentklass fälls — en rad vi inte kan klassa breddas aldrig', () => {
    const utfall = prova({ klass: null });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('fel-dokumentklass');
  });

  test('okänd Dokumentklass fälls', () => {
    const utfall = prova({ klass: 'Framtida-klass-D' });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('fel-dokumentklass');
  });

  test('exakt EN av de tre kända klasserna släpps igenom', () => {
    // Låser fast riktningen: listan får växa, men bara `Uppladdad` får byta
    // räckvidd. En framtida klass D ärver alltså INTE rätten av misstag.
    const slappsIgenom = VALID_ATTACHMENT_CLASSES.filter(
      (klass) => prova({ klass }).tillatet === true,
    );
    expect(slappsIgenom).toEqual([ATTACHMENT_CLASS_UPPLADDAD]);
  });
});

test.describe('provaRackviddsbyte — hindret ankar-flytt (409)', () => {
  test('familjebunden → axellös flyttar ankaret och fälls', () => {
    const utfall = prova({ ankarNu: ANKARE_RIM, ankarEfter: ANKARE_ALLA });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('ankar-flytt');
    expect(utfall.hinder.status).toBe(409);
  });

  test('axellös → familjebunden flyttar ankaret och fälls (andra riktningen)', () => {
    const utfall = prova({ ankarNu: ANKARE_ALLA, ankarEfter: ANKARE_RIM });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('ankar-flytt');
  });

  test('null-anker på ena sidan fälls — "kan inte härledas" är inte "lika"', () => {
    // buildStorageAnchor returnerar `null` när ankaret inte går att härleda
    // (t.ex. Kurstyp utan Kursfamilj på en historisk rad). Att låta null
    // matcha en riktig path hade släppt igenom just det fall som är minst
    // känt.
    const utfall = prova({ ankarNu: null, ankarEfter: ANKARE_ALLA });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('ankar-flytt');
  });

  test('null på BÅDA sidorna är oförändrat och släpps igenom', () => {
    expect(prova({ ankarNu: null, ankarEfter: null })).toEqual({ tillatet: true });
  });
});

test.describe('provaRackviddsbyte — hindrens ORDNING', () => {
  test('ej-gemensam rapporteras före fel-dokumentklass', () => {
    // Grövst först: Lotta ska se det mest grundläggande skälet, inte en
    // följdeffekt. En Event-mallad rad UTAN Räckvidd är det vanligaste
    // sammanfallet (generate-event-attachment skriver aldrig Räckvidd).
    const utfall = prova({ rackvidd: null, klass: ATTACHMENT_CLASS_EVENT_MALLAD });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('ej-gemensam');
  });

  test('fel-dokumentklass rapporteras före ankar-flytt', () => {
    const utfall = prova({
      klass: ATTACHMENT_CLASS_EVENT_MALLAD,
      ankarNu: ANKARE_RIM,
      ankarEfter: ANKARE_ALLA,
    });
    expect(utfall.tillatet).toBe(false);
    if (utfall.tillatet) return;
    expect(utfall.hinder.kod).toBe('fel-dokumentklass');
  });

  test('varje hinder bär ett skäl på Lottas språk, aldrig en tom sträng', () => {
    for (const fall of [
      prova({ rackvidd: ATTACHMENT_SCOPE_EVENT }),
      prova({ klass: ATTACHMENT_CLASS_EVENT_MALLAD }),
      prova({ ankarNu: ANKARE_RIM, ankarEfter: ANKARE_ALLA }),
    ]) {
      expect(fall.tillatet).toBe(false);
      if (fall.tillatet) continue;
      expect(fall.hinder.skal.length).toBeGreaterThan(20);
      // Gunilla-principen: inga tekniska termer i det Lotta läser.
      expect(fall.hinder.skal).not.toMatch(/anker|storage|räckvidd = |null|Dokumentklass/i);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FÄLT-ALLOWLISTEN (TASK-338.4 AC #2) — sub-fas-mönstrets deny/allow
// ═══════════════════════════════════════════════════════════════════════
//
// DENY-riktningen bevisas HÄR och inte mot staging, av en strukturell
// anledning: `update-attachment-scope` bygger sin `fields` SERVER-SIDE ur
// `buildScopeUpdateFields` (ett redan Zod-validerat `AttachmentScopeInput`),
// så en klient kan aldrig NÅ ett fältnamn utanför listan. Att skicka något
// sådant mot den deployade EF:en hade fällts av Zod långt före
// `findDisallowedField` — testet hade sett grönt ut och bevisat FEL grind.
// Listan är en SSOT-grind mot framtida KOD-drift, och kod-drift prövas i
// kod. (`field-allowlists.ts` har noll imports och är därför direkt
// Node-importerbar — samma egenskap `rackvidd-matchning.ts` bär.)
//
// ALLOW-riktningen bevisas SKARPT i `update-attachment-scope.staging.test.ts`:
// en lyckad ändring betyder per konstruktion att alla fyra fälten passerade
// `findDisallowedField` — hade ett av dem saknats i listan vore svaret 400,
// inte 200. Båda riktningarna finns alltså, var och en där den faktiskt
// bevisar något.

test.describe('field-allowlists — operationen update-attachment-scope', () => {
  test('operationen ÄR registrerad och pekar på Bilagor', () => {
    const operation = getOperation('update-attachment-scope');
    expect(operation).not.toBeNull();
    expect(operation?.tableId).toBe('Bilagor');
  });

  test('allow: de FYRA axel-fälten passerar', () => {
    const operation = getOperation('update-attachment-scope');
    expect(operation).not.toBeNull();
    if (!operation) return;
    // EXAKT den form `buildScopeUpdateFields` producerar, inklusive de
    // rensade axlarnas `null`/`[]` — nycklarna är det allowlisten gatar,
    // aldrig värdena.
    expect(
      findDisallowedField(operation, {
        Räckvidd: ATTACHMENT_SCOPE_GEMENSAM,
        Kursfamilj: null,
        Kursnivå: null,
        Plats: [],
      }),
    ).toBeNull();
    expect(
      findDisallowedField(operation, {
        Räckvidd: ATTACHMENT_SCOPE_GEMENSAM,
        Kursfamilj: 'RIM',
        Kursnivå: 'Nivå 1',
        Plats: ['rec17l2c64foUy6WU'],
      }),
    ).toBeNull();
  });

  test('deny: varje fält create-attachment får skriva men denna INTE fälls', () => {
    // Den skarpaste formen av deny-beviset: operationen är MEDVETET smalare
    // än 'create-attachment' (minsta privilegium, se field-allowlists.ts).
    // Skulle någon "förenkla" genom att kopiera create-listan hit faller
    // detta test — vilket är hela poängen.
    const operation = getOperation('update-attachment-scope');
    expect(operation).not.toBeNull();
    if (!operation) return;
    for (const falt of [
      'Namn',
      'Storlek (bytes)',
      'Skapad',
      'Event',
      'Lagringsnyckel',
      'Dokumentklass',
      'Mall',
      'Källhash',
    ]) {
      expect(findDisallowedField(operation, { [falt]: 'x' }), `${falt} borde fällas`).toBe(falt);
    }
  });

  test('deny: lookup-fältet Platsnamn fälls — beräknat, kan inte skrivas', () => {
    const operation = getOperation('update-attachment-scope');
    expect(operation).not.toBeNull();
    if (!operation) return;
    expect(findDisallowedField(operation, { Platsnamn: ['Rönninge'] })).toBe('Platsnamn');
  });

  test('deny: ett fält utanför listan fälls även när de fyra tillåtna finns med', () => {
    // Fångar den farliga formen: ett extra fält som smyger med i en annars
    // giltig skrivning, inte bara ett ensamt ogiltigt fält.
    const operation = getOperation('update-attachment-scope');
    expect(operation).not.toBeNull();
    if (!operation) return;
    expect(
      findDisallowedField(operation, {
        Räckvidd: ATTACHMENT_SCOPE_GEMENSAM,
        Kursfamilj: null,
        Kursnivå: null,
        Plats: [],
        Dokumentklass: ATTACHMENT_CLASS_UPPLADDAD,
      }),
    ).toBe('Dokumentklass');
  });
});
