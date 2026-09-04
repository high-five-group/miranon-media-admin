// [TASK-370.4, review-runda 1 FYND 1] BINDNINGEN mellan EF:ens tak-avvisning
// och klientens tolkning av den — den enda plats i repot som importerar
// BÅDA SIDORNA av `forhandsgranskaAlla`s taköverskridande-gren i samma test.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR DENNA FIL BEHÖVS UTÖVER `kvitto-kombination.test.ts` OCH DEN NYA
// E2E-SVITEN
// ═══════════════════════════════════════════════════════════════════════════
// `tests/api/kvitto-kombination.test.ts` bevisar EF-sidan (`31 UUID:er
// avvisas`, `toThrow(/at most 30/)`) — men prövar aldrig klientens tolkare.
// `tests/e2e/betalningar-inkorg-forhandsgranska-alla.staging.test.ts` bevisar
// klient-RENDERINGEN av det begripliga meddelandet — men mockar en
// HANDSKRIVEN kopia av EF:ens felsträng (`'inbetalningIds may contain at
// most 30 entries (got 35)'`), vilket bara bevisar att regexen matchar sin
// egen förlaga. INGEN av de två testerna hade fällt om EF:ens ordalydelse
// (`_shared/kvitto-kombination.ts`s `valideraInbetalningIdLista`) ändrades
// på ett sätt som bröt klientens `tolkaTakfel`-regex — driften hade varit
// TYST (klienten hade visat EF:ens råa engelska text i stället för det
// begripliga svenska meddelandet, se `tolkaTakfel`s `null`-fallback).
//
// DENNA FIL KÖR DET VERKLIGA EF-ANROPET (31 UUID:er, INGEN mock av
// felsträngen) och matar det FAKTISKT KASTADE felets `.message` rakt in i
// klientens `tolkaTakfel` — en ändring i EF:ens text som bryter bindningen
// fäller HÄR, direkt, i stället för att upptäckas i produktion.
//
// api-pure: `_shared/kvitto-kombination.ts` är importfri (samma mönster som
// `_shared/hojdanpassning.ts`, se den filens eget filhuvud) och
// `inkorg-harledningar.ts` importerar bara typer + en syskonmodul — INGET
// nätverk, inga creds.

import { expect, test } from '@playwright/test';
import { tolkaTakfel } from '../../src/components/betalningar/inkorg-harledningar';
import {
  MAX_KOMBINERADE_KVITTON,
  valideraInbetalningIdLista,
} from '../../supabase/functions/_shared/kvitto-kombination';

/** Bygger N unika, giltiga UUID:er — samma teknik som `kvitto-kombination
 *  .test.ts`s egna hjälpare, oberoende kopia (denna fil ska inte bero på att
 *  den andra filens interna hjälpare exporteras). */
function unikaUuider(antal: number): string[] {
  return Array.from({ length: antal }, (_, i) => {
    const hex = i.toString(16).padStart(4, '0');
    return `cccccccc-cccc-cccc-cccc-cccccccc${hex}`;
  });
}

test('BINDNING: tolkaTakfel(EF:ens FAKTISKA felmeddelande) === MAX_KOMBINERADE_KVITTON', () => {
  const forManga = unikaUuider(MAX_KOMBINERADE_KVITTON + 1);

  let kastatFel: unknown;
  try {
    valideraInbetalningIdLista(forManga);
  } catch (fel) {
    kastatFel = fel;
  }

  expect(kastatFel, 'valideraInbetalningIdLista skulle ha kastat').toBeInstanceOf(Error);
  const meddelande = (kastatFel as Error).message;

  // Beviset: klientens tolkare, körd på EF:ens VERKLIGA sträng, ger EXAKT
  // det tak EF-modulen faktiskt är konfigurerad med — inte ett hårdkodat 30
  // i det här testet, utan samma `MAX_KOMBINERADE_KVITTON`-konstant EF-
  // modulen exporterar. Ändras konstanten (eller ordalydelsen kring den)
  // följer detta assert med, i stället för att glida isär tyst.
  expect(tolkaTakfel(meddelande)).toBe(MAX_KOMBINERADE_KVITTON);
});

test('BINDNING: en gräns på 45 (hypotetisk framtida höjning) tolkas korrekt ur EF:ens textform', () => {
  // Sanity mot att `tolkaTakfel` av misstag vore hårdkodad mot talet 30
  // (t.ex. genom att jämföra STRÄNGEN "30" i stället för att fånga siffror
  // generellt) — konstruerad EXAKT i EF-modulens egen ordalydelse
  // (`_shared/kvitto-kombination.ts`s `valideraInbetalningIdLista`), inte en
  // fri uppfinning.
  const meddelande = 'inbetalningIds may contain at most 45 entries (got 50)';
  expect(tolkaTakfel(meddelande)).toBe(45);
});

test('NEGATIVT: ett meddelande UTAN tak-mönstret ger null — ALDRIG ett gissat tal', () => {
  expect(tolkaTakfel('inbetalningIds must be a non-empty array of UUIDs')).toBeNull();
  expect(tolkaTakfel('inbetalningIds contains a duplicate id: xyz')).toBeNull();
  expect(tolkaTakfel('Internal error')).toBeNull();
  expect(tolkaTakfel('')).toBeNull();
});

test('NEGATIVT: ett ANNAT valideringsfel (dubblett) matchar INTE tak-mönstret', () => {
  // Samma disciplin som resten av husets sviter (uppdragets "två
  // riktningar per grind"): bevisa att bindningen är SPECIFIK för
  // tak-felet, inte att `tolkaTakfel` råkar returnera `null` för allt.
  const dubblett = [unikaUuider(1)[0], unikaUuider(1)[0]];

  let kastatFel: unknown;
  try {
    valideraInbetalningIdLista(dubblett);
  } catch (fel) {
    kastatFel = fel;
  }

  expect(kastatFel, 'en dubblett skulle ha kastat').toBeInstanceOf(Error);
  expect(tolkaTakfel((kastatFel as Error).message)).toBeNull();
});

test('diskrimineringskontroll — testet ovan fäller om EF-modulens tak-ordalydelse driver ifrån tolkaTakfel', () => {
  // Bevisar att BINDNINGS-testet faktiskt är kapabelt att falla: en
  // EF-text som INTE längre matchar formen "may contain at most N entries"
  // (t.ex. en omskrivning till "no more than N items allowed") ska ge
  // `null`, inte ett gissat tal — vilket är EXAKT den tysta driften denna
  // fils filhuvud beskriver.
  const omskriven = 'inbetalningIds: no more than 30 items allowed (received 35)';
  expect(tolkaTakfel(omskriven)).toBeNull();
});
