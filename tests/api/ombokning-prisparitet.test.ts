// OMBOKNINGENS PRISSKILLNAD — PARITETSGRIND KLIENT ↔ SERVER (TASK-368.7 AC #2).
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD DEN BEVAKAR, OCH VARFÖR DEN MÅSTE FINNAS
// ═══════════════════════════════════════════════════════════════════════════
// Ombokningen säger prisskillnaden TVÅ gånger: en gång FÖRE bekräftelsen,
// räknad i klienten (`ombokning-pris.ts` § `prisskillnadFore`), och en gång EFTER, räknad av servern
// (`harledBetalning(...).saknas`, återgiven i svarets `prisskillnad`). Lotta
// läser dem med några sekunders mellanrum, i samma ordalydelse — så om de kan
// skilja sig blir den ena ett löfte den andra bryter.
//
// Kortets AC #2 formulerar kravet smalast möjligt: *"klientens och serverns
// prisskillnad kan inte skilja sig i tecken"*. Denna svit prövar det, och
// därtill det STARKARE kravet att de är samma TAL — ett teckenlikt men
// beloppsolikt par hade uppfyllt bokstaven och ändå visat två belopp för samma
// fråga.
//
// ═══════════════════════════════════════════════════════════════════════════
// METODEN: SAMMA INDATA GENOM BÅDA IMPLEMENTATIONERNA
// ═══════════════════════════════════════════════════════════════════════════
// Testet importerar BÅDA funktionerna och kör ett gemensamt korpus genom dem.
// Serversidan anropas som den faktiskt anropas i `rebook-registration`
// § Steg 4: `harledBetalning(inbetalningar, byggPrisbild(nyAnmalan, nyttEvent))`
// för den NYA anmälan — alltså `avtalatPris: null` (`skapaAnmalanRad` sätter
// aldrig fältet) och `eventPris` = det tal `Event.pris` bär.
//
// Klientsidan får samma två tal: eventets pris, och summan av de AKTIVA
// inbetalningarna. Att den summan är samma tal som serverns `summa` är inte
// antaget här utan BEVISAT av `summaAktiva`-fallen nedan, som kör exakt
// `hamta-inbetalningars` uttryck (`summeraKronor` över `status === 'aktiv'`)
// och jämför mot härledningens egen `summa`.
//
// api-pure: båda modulerna är importfria och Deno-fria, så de kör rakt i Node.
// Tests-projektet når `src/` via `@/`-aliaset (tsconfig.tests.json § paths) och
// `supabase/functions/_shared/` via relativ sökväg — samma form som
// `tests/api/betalningsbelopp-klientparitet.test.ts`, som denna fil är byggd
// efter.

import { expect, test } from '@playwright/test';
import { visaKronor } from '@/components/betalningar/belopp-inmatning';
import { prisbesked, prisskillnadFore } from '@/components/registrations/ombokning-pris';
import { summeraKronor } from '../../supabase/functions/_shared/betalningsbelopp';
import {
  harledBetalning,
  type InbetalningsBidrag,
} from '../../supabase/functions/_shared/betalningsharledning';

/**
 * KORPUSET. Varje rad är ett (eventpris, inbetalningar)-par som ombokningen
 * faktiskt kan möta. Listan är bred snarare än kort: en paritetsgrinds värde
 * står i proportion till hur många vägar genom formeln den går.
 */
const KORPUS: readonly {
  namn: string;
  eventPris: number | null;
  poster: readonly InbetalningsBidrag[];
}[] = [
  // ── De tre grenar Lotta läser ────────────────────────────────────────────
  {
    namn: 'samma pris — hela beloppet följer med',
    eventPris: 2500,
    poster: [{ belopp: 2500, status: 'aktiv' }],
  },
  {
    namn: 'dyrare event — mellanskillnad saknas',
    eventPris: 3200,
    poster: [{ belopp: 2500, status: 'aktiv' }],
  },
  {
    namn: 'billigare event — pengar att återbetala',
    eventPris: 1800,
    poster: [{ belopp: 2500, status: 'aktiv' }],
  },
  {
    namn: 'inget pris satt någonstans',
    eventPris: null,
    poster: [{ belopp: 2500, status: 'aktiv' }],
  },

  // ── Nollor och tomhet ────────────────────────────────────────────────────
  { namn: 'inga inbetalningar alls', eventPris: 2500, poster: [] },
  { namn: 'gratisevent utan inbetalningar', eventPris: 0, poster: [] },
  {
    namn: 'gratisevent MED inbetalningar — hela summan tillbaka',
    eventPris: 0,
    poster: [{ belopp: 900, status: 'aktiv' }],
  },
  { namn: 'inget pris OCH inga inbetalningar', eventPris: null, poster: [] },

  // ── Makulerade räknas ALDRIG (`.eq('status','aktiv')` i flytten) ─────────
  {
    namn: 'makulerad post räknas inte i någon av formlerna',
    eventPris: 2500,
    poster: [
      { belopp: 1000, status: 'aktiv' },
      { belopp: 1500, status: 'makulerad' },
    ],
  },
  {
    namn: 'enbart makulerade poster ⇒ summan är noll',
    eventPris: 2500,
    poster: [{ belopp: 2500, status: 'makulerad' }],
  },

  // ── Flera poster, delbetalningar, återbetalningar ────────────────────────
  {
    namn: 'tre delbetalningar',
    eventPris: 2500,
    poster: [
      { belopp: 1000, status: 'aktiv' },
      { belopp: 1000, status: 'aktiv' },
      { belopp: 500, status: 'aktiv' },
    ],
  },
  {
    namn: 'redan registrerad återbetalning drar ned summan (negativ post)',
    eventPris: 2500,
    poster: [
      { belopp: 2500, status: 'aktiv' },
      { belopp: -500, status: 'aktiv' },
    ],
  },
  {
    namn: 'överbetalning — summan större än priset ger negativ skillnad',
    eventPris: 2500,
    poster: [{ belopp: 3000, status: 'aktiv' }],
  },

  // ── Ören och flyttalsdrift ───────────────────────────────────────────────
  {
    namn: 'ören: 2500,55 minus 0,05',
    eventPris: 2500.55,
    poster: [{ belopp: 0.05, status: 'aktiv' }],
  },
  {
    namn: 'ören: klassiska 0.1 + 0.2 mot ett jämnt pris',
    eventPris: 1,
    poster: [
      { belopp: 0.1, status: 'aktiv' },
      { belopp: 0.2, status: 'aktiv' },
    ],
  },
  {
    namn: 'ören: summan träffar priset exakt trots tre decimaltermer',
    eventPris: 0.3,
    poster: [
      { belopp: 0.1, status: 'aktiv' },
      { belopp: 0.1, status: 'aktiv' },
      { belopp: 0.1, status: 'aktiv' },
    ],
  },
  {
    namn: 'ören: pris med udda öre mot summa med udda öre',
    eventPris: 1234.56,
    poster: [{ belopp: 999.99, status: 'aktiv' }],
  },
];

/** Serverns prisbild för den NYA anmälan, som `rebook-registration` bygger den. */
function serversidan(eventPris: number | null, poster: readonly InbetalningsBidrag[]) {
  return harledBetalning(poster, {
    // `skapaAnmalanRad` sätter ALDRIG `Avtalat pris (kr)` på den nya raden
    // (`rebook-registration/index.ts` § Steg 1) — nivå 1 är därför alltid null.
    avtalatPris: null,
    eventPris,
    // Avgiften och typen påverkar inte `saknas`; de sätts till de neutrala
    // värden en nyskapad anmälan har.
    anmalningsavgift: null,
    eventTyp: null,
  });
}

/** Klientens andra led: exakt `hamta-inbetalningars` `summaPostgres`-uttryck. */
function summaAktiva(poster: readonly InbetalningsBidrag[]): number {
  return summeraKronor(poster.filter((post) => post.status === 'aktiv').map((post) => post.belopp));
}

test.describe('ombokningens prisskillnad — klient och server ger samma tal', () => {
  for (const { namn, eventPris, poster } of KORPUS) {
    test(`identiskt tal: ${namn}`, () => {
      const server = serversidan(eventPris, poster);
      const klient = prisskillnadFore(eventPris, summaAktiva(poster));

      // STARKASTE FORMEN FÖRST: samma tal, inte bara samma tecken.
      expect(klient, `indata: pris=${eventPris}, poster=${JSON.stringify(poster)}`).toBe(
        server.saknas,
      );
    });

    test(`identiskt TECKEN (AC #2 ordagrant): ${namn}`, () => {
      const server = serversidan(eventPris, poster);
      const klient = prisskillnadFore(eventPris, summaAktiva(poster));
      expect(Math.sign(klient ?? 0)).toBe(Math.sign(server.saknas ?? 0));
      // `null` får aldrig uppstå på ena sidan ensam — det hade gjort
      // teckenjämförelsen ovan meningslös (0 mot 0).
      expect(klient === null).toBe(server.saknas === null);
    });

    test(`klientens summa ÄR serverns summa: ${namn}`, () => {
      // Ledet AC #2 hänger på: att `Inbetalningslista.spegel.summaPostgres`
      // och härledningens `summa` är samma tal. Uttrycket kopieras verbatim ur
      // `hamta-inbetalningar/index.ts`; glider någotdera isär fälls detta.
      expect(summaAktiva(poster)).toBe(serversidan(eventPris, poster).summa);
    });

    test(`SAMMA MENING i steget som i kvittot: ${namn}`, () => {
      // `prisbesked` är EN funktion med två anropare (steget före bekräftelsen,
      // kvittot efter). Att texterna är identiska följer alltså av att talen är
      // det — och det är precis vad detta fall låser: samma indata in i samma
      // formulering, från båda hållen.
      const server = serversidan(eventPris, poster);
      const foreBekraftelsen = prisbesked(
        eventPris,
        prisskillnadFore(eventPris, summaAktiva(poster)),
      );
      const efterBekraftelsen = prisbesked(server.gallandePris, server.saknas);
      expect(foreBekraftelsen).toEqual(efterBekraftelsen);
    });
  }
});

test.describe('prisskillnadFore — de tre grenarna och deras ordalydelse (AC #2)', () => {
  test('gren 1: priset okänt ⇒ null, och beskedet säger just det', () => {
    expect(prisskillnadFore(null, 2500)).toBeNull();
    expect(prisbesked(null, prisskillnadFore(null, 2500)).text).toBe(
      'Priset på det nya eventet är inte satt, så prisskillnaden går inte att räkna ut.',
    );
  });

  // ORDALYDELSEN låses ordagrant; BELOPPEN byggs med `visaKronor` i stället
  // för att skrivas av. Skälet är inte bekvämlighet: husets tusentalsavgränsare
  // är ett smalt hårt blanksteg som ser ut som ett vanligt mellanslag i en
  // diff, och en avskriven sträng med fel kodpunkt hade fällt sviten med ett
  // felmeddelande där de två raderna ser identiska ut.
  const kr = (belopp: number) => `${visaKronor(belopp)} kr`;

  test('gren 2: samma pris', () => {
    expect(prisskillnadFore(2500, 2500)).toBe(0);
    const besked = prisbesked(2500, prisskillnadFore(2500, 2500));
    expect(besked.text).toBe(`Nya eventet kostar ${kr(2500)}, samma pris.`);
    expect(besked.vag).toBeNull();
  });

  test('gren 3a: dyrare event ⇒ positivt tal, beloppet saknas', () => {
    expect(prisskillnadFore(3200, 2500)).toBe(700);
    const besked = prisbesked(3200, prisskillnadFore(3200, 2500));
    expect(besked.text).toBe(
      `Nya eventet kostar ${kr(3200)}, ${kr(700)} saknas på den nya anmälan.`,
    );
    expect(besked.vag).toBe('inbetalning');
  });

  test('gren 3b: billigare event ⇒ negativt tal, beloppet återbetalas', () => {
    expect(prisskillnadFore(1800, 2500)).toBe(-700);
    const besked = prisbesked(1800, prisskillnadFore(1800, 2500));
    expect(besked.text).toBe(`Nya eventet kostar ${kr(1800)}, ${kr(700)} blir att återbetala.`);
    expect(besked.vag).toBe('aterbetalning');
  });

  test('SUMMAN okänd ⇒ null — men det är en ANNAN okändhet än gren 1', () => {
    // Funktionen kan inte skilja dem åt, och det är därför anroparen
    // (`OmbokningsSteg`) döljer hela beskedet när summan saknas i stället för
    // att låta gren 1:s text påstå att ett känt pris vore osatt.
    expect(prisskillnadFore(2500, null)).toBeNull();
    expect(prisskillnadFore(null, null)).toBeNull();
  });

  test('0 ÄR ETT SATT PRIS på båda leden', () => {
    // Ett gratisevent utan inbetalningar går jämnt ut; med inbetalningar ska
    // hela summan tillbaka. Ingetdera får läsas som "okänt".
    expect(prisskillnadFore(0, 0)).toBe(0);
    expect(prisskillnadFore(0, 900)).toBe(-900);
  });

  test('avrundningen är differensens, inte termernas (avrundaOre-formen)', () => {
    // `summeraKronorKlient([0.005, -0.005])` avrundar varje term för sig och
    // ger 0,01. Serverns `avrundaOre(0.005 - 0.005)` ger 0 — och det är
    // serverns tal som ska återges. Fälls detta har formen bytts.
    expect(prisskillnadFore(0.005, 0.005)).toBe(0);
    // Och driften som gör avrundningen nödvändig alls:
    expect(prisskillnadFore(2500.55, 0.05)).toBe(2500.5);
  });
});
