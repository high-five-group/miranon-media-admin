// Bankimportens matchning och bekräftelselista — TASK-346.10 AC #2, #3, #4.
// PRD TASK-346 DoD #5.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARJE MATCHNINGSSTEG BÄR SIN EGEN NEGATIVA KONTROLL (DoD #5)
// ═══════════════════════════════════════════════════════════════════════════
// Uppdraget kräver "hermetiska tester + negativ kontroll PER steg". De tre
// stegen (telefon, namn+belopp, omatchad) prövas därför var för sig i TVÅ
// riktningar: den riktiga implementationen ger rätt svar, OCH en trasig
// variant (skriven här, aldrig i produktionskoden) ger ett annat svar på
// samma indata.
//
// TVÅ RIKTNINGAR PER AXEL, samma disciplin som `rackvidd-matchning.test.ts`
// bär: varje axel prövas både i sitt träffande fall OCH mot ett grannfall som
// INTE får matcha. En matchare som alltid svarar `saker` hade annars passerat
// halva sviten — och `saker` är den farliga riktningen här: den bokför
// pengar på fel anmälan utan att fråga.
//
// api-pure: modulerna importerar bara varandra, `lib/telefon.ts` och
// type-only domäntyper — de kör rakt i Node utan webbläsare.

import { expect, test } from '@playwright/test';
import {
  beloppStammer,
  matchaTransaktion,
  namnLiknar,
  namnord,
} from '@/components/betalningar/bankimport-matchning';
import type { ImporteradRad, Parsresultat } from '@/components/betalningar/bankimport-parser';
import {
  arDubblettfel,
  attHantera,
  byggImportrader,
  type Importradstillstand,
  raderAttRegistrera,
  radnyckel,
  redanImporterade,
  sammanfattaImport,
} from '@/components/betalningar/bankimport-rader';
import { harledRad, type InkorgsRad } from '@/components/betalningar/inkorg-harledningar';
import type { Transaktion } from '@/domain/models/Transaktion';
import type { OppenBetalning } from '@/domain/schemas';
import { normaliseraTelefon, sammaTelefonnummer, telefonnycklar } from '@/lib/telefon';

const IDAG = '2026-08-31';

/** Bygger en `OppenBetalning` med rimliga defaults; varje test sätter sitt. */
function betalning(over: Partial<OppenBetalning> = {}): OppenBetalning {
  return {
    anmalanRecordId: 'recAAAAAAAAAAAAAA',
    personNamn: 'Anna Swish',
    personEpost: 'anna@example.com',
    personTelefon: '070-987 98 79',
    eventId: 'ev1',
    eventNamn: 'Fjärrskådning',
    eventStartdatum: '2026-09-07',
    eventTyp: 'Utbildning',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: 2500,
    gallandePris: 2500,
    anmalningsavgift: 1000,
    summaInbetalt: 0,
    summaInbetaltSpegel: 0,
    spegelIFas: true,
    deadlineSlutbetalning: '2026-09-01',
    kvittonAttSkicka: 0,
    oskickadeKvitton: [],
    ...over,
  };
}

const rad = (over: Partial<OppenBetalning> = {}): InkorgsRad => harledRad(betalning(over), IDAG);

/** En banktransaktion med Handelsbanken-exempelfilens värden som default. */
function transaktion(over: Partial<Transaktion> = {}): Transaktion {
  return {
    datum: '2026-08-30',
    belopp: 2500,
    namn: 'Anna Swish',
    telefon: '+46709879879',
    meddelande: 'Fjärrskådning',
    bankreferens: '4469411476093487',
    ...over,
  };
}

/* ═══════════════════════════ TELEFONNORMALISERINGEN ═══════════════════════════ */

test.describe('normaliseraTelefon — fyra skrivsätt, en nyckel', () => {
  test('de fyra formerna som faktiskt förekommer ger alla samma nyckel', () => {
    // Bankens form, internationellt prefix, basens form, redan kanonisk.
    expect(normaliseraTelefon('+46709879879')).toBe('46709879879');
    expect(normaliseraTelefon('0046709879879')).toBe('46709879879');
    expect(normaliseraTelefon('070-987 98 79')).toBe('46709879879');
    expect(normaliseraTelefon('46709879879')).toBe('46709879879');
  });

  test('NEGATIV KONTROLL: siffror-ensamt gör bankens och basens form till OLIKA nycklar', () => {
    // Detta är exakt felet importen finns för att undvika, och den enklaste
    // form någon skulle skriva i förbifarten. `inkorg-harledningar.ts` gör
    // just detta för SÖKNINGEN — där är det rätt, eftersom en delsträng ska
    // träffa. För matchning ger det noll träffar på ett nummer som är
    // detsamma.
    const trasigtSiffror = (text: string) => text.replace(/\D+/g, '');
    expect(trasigtSiffror('+46709879879')).toBe('46709879879');
    expect(trasigtSiffror('070-987 98 79')).toBe('0709879879');
    expect(trasigtSiffror('+46709879879')).not.toBe(trasigtSiffror('070-987 98 79'));

    // Och den riktiga implementationen gör dem lika.
    expect(normaliseraTelefon('+46709879879')).toBe(normaliseraTelefon('070-987 98 79'));
  });

  test('00 prövas FÖRE ledande 0 — ordningen mellan reglerna är lastbärande', () => {
    // Läses `0046...` som ett nationellt nummer blir riktnumret 046 (Lund),
    // och nyckeln blir 4646709879879 i stället för 46709879879.
    expect(normaliseraTelefon('0046709879879')).toBe('46709879879');
    expect(normaliseraTelefon('0046709879879')).not.toBe('4646709879879');
  });

  test('ett fast riktnummer normaliseras korrekt, det avvisas inte', () => {
    // 046 är Lund. E.164-formen är 4646..., och det är rätt svar.
    expect(normaliseraTelefon('046-12 34 56')).toBe('464612 34 56'.replace(/\D+/g, ''));
    expect(normaliseraTelefon('046-12 34 56')).toBe('4646123456');
  });

  test('för korta, för långa och obegripliga strängar ger null, aldrig ett halvt nummer', () => {
    expect(normaliseraTelefon('12345')).toBeNull();
    expect(normaliseraTelefon('070-12')).toBeNull();
    expect(normaliseraTelefon('1234567890123456789')).toBeNull();
    expect(normaliseraTelefon('')).toBeNull();
    expect(normaliseraTelefon('ingen telefon')).toBeNull();
    expect(normaliseraTelefon(null)).toBeNull();
  });

  test('NEGATIV KONTROLL: utan siffergolvet blir ett postnummer ett telefonnummer', () => {
    // `Mobilnummer` är multilineText, alltså fritext. Ett fält som råkar bära
    // "123 45" hade utan golvet blivit nyckeln 4612345 — och två anmälningar
    // med samma skräptext hade matchat varandra.
    const trasigUtanGolv = (text: string) => `46${text.replace(/\D+/g, '').replace(/^0/, '')}`;
    expect(trasigUtanGolv('123 45')).toBe('4612345');
    expect(normaliseraTelefon('123 45')).toBeNull();
  });

  test('ett tal som varken bär plus, ledande 0 eller landsnummer avvisas', () => {
    // 709879879 kan vara ett svenskt nummer utan nolla — eller vad som helst.
    // Att gissa hade gjort en främmande siffersträng till en matchningsnyckel.
    expect(normaliseraTelefon('709879879')).toBeNull();
  });
});

test.describe('telefonnycklar — ett fält kan bära flera nummer', () => {
  test('multilineText med två nummer ger BÅDA nycklarna', () => {
    // `Mobilnummer` är multilineText (data-model.md), så två rader är möjligt.
    expect(telefonnycklar('070-987 98 79\n073-111 22 33')).toEqual(['46709879879', '46731112233']);
  });

  test('NEGATIV KONTROLL: bara-första-numret missar en helt korrekt anmälan', () => {
    const trasigForsta = (text: string) => [normaliseraTelefon(text.split('\n')[0])];
    const falt = '073-111 22 33\n070-987 98 79';
    expect(trasigForsta(falt)).not.toContain('46709879879');
    expect(telefonnycklar(falt)).toContain('46709879879');
  });

  test('skräptext och tomt fält ger en TOM mängd, aldrig ett halvt nummer', () => {
    expect(telefonnycklar('saknas')).toEqual([]);
    expect(telefonnycklar('')).toEqual([]);
    expect(telefonnycklar(null)).toEqual([]);
  });

  test('sammaTelefonnummer är FAIL-CLOSED: okänt nummer är aldrig en träff', () => {
    expect(sammaTelefonnummer('+46709879879', '070-987 98 79')).toBe(true);
    expect(sammaTelefonnummer(null, '070-987 98 79')).toBe(false);
    expect(sammaTelefonnummer('+46709879879', null)).toBe(false);
    expect(sammaTelefonnummer('skräp', 'skräp')).toBe(false);
  });
});

/* ═══════════════════════════ NAMNJÄMFÖRELSEN ═══════════════════════════ */

test.describe('namnLiknar — två ord krävs', () => {
  test('mellannamn och skiftläge hindrar inte en träff', () => {
    expect(namnLiknar('Anna Swish', 'Anna Kristina Swish')).toBe(true);
    expect(namnLiknar('ANNA SWISH', 'anna swish')).toBe(true);
    expect(namnLiknar('Swish, Anna', 'Anna Swish')).toBe(true);
  });

  test('ETT gemensamt förnamn räcker INTE — grannfallet som inte får matcha', () => {
    expect(namnLiknar('Anna Swish', 'Anna Bergström')).toBe(false);
    expect(namnLiknar('Anna Swish', 'Sven Swish')).toBe(false);
  });

  test('NEGATIV KONTROLL: ett gemensamt ord räcker och slår ihop två personer', () => {
    // I en kurslista med tjugo deltagare finns flera Annor. Regeln hade gett
    // kandidater som ser kvalificerade ut utan att vara det.
    const trasigEttOrd = (a: string, b: string) =>
      namnord(a).some((ord) => namnord(b).includes(ord));
    expect(trasigEttOrd('Anna Swish', 'Anna Bergström')).toBe(true);
    expect(namnLiknar('Anna Swish', 'Anna Bergström')).toBe(false);
  });

  test('DIAKRITERNA BEVARAS: Öberg och Oberg är olika namn', () => {
    expect(namnLiknar('Karin Öberg', 'Karin Oberg')).toBe(false);
    expect(namnLiknar('Karin Öberg', 'Karin Öberg')).toBe(true);
  });

  test('NEGATIV KONTROLL: teckenvikning slår ihop Öberg och Oberg', () => {
    const trasigVikning = (a: string, b: string) =>
      a.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase() ===
      b.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    expect(trasigVikning('Karin Öberg', 'Karin Oberg')).toBe(true);
    expect(namnLiknar('Karin Öberg', 'Karin Oberg')).toBe(false);
  });

  test('enordsundantaget: ett ord på BÅDA sidor, och de är lika', () => {
    expect(namnLiknar('Anna', 'Anna')).toBe(true);
    expect(namnLiknar('Anna', 'Bo')).toBe(false);
    // Men ett ord mot två räcker inte — det är förnamnsfallet igen.
    expect(namnLiknar('Anna', 'Anna Swish')).toBe(false);
  });

  test('tomt eller saknat namn matchar aldrig', () => {
    expect(namnLiknar(null, 'Anna Swish')).toBe(false);
    expect(namnLiknar('', 'Anna Swish')).toBe(false);
    expect(namnLiknar('   ', 'Anna Swish')).toBe(false);
  });
});

/* ═══════════════════════════ BELOPPSJÄMFÖRELSEN ═══════════════════════════ */

test.describe('beloppStammer — de fyra tal en bankrad kan betyda', () => {
  test('hela priset, avgiften, resten och resten av avgiften stämmer alla', () => {
    const r = rad({ gallandePris: 2500, anmalningsavgift: 1000, summaInbetalt: 0 });
    expect(beloppStammer(r, 2500)).toBe(true);
    expect(beloppStammer(r, 1000)).toBe(true);

    const delbetald = rad({ gallandePris: 2500, anmalningsavgift: 1000, summaInbetalt: 1000 });
    expect(beloppStammer(delbetald, 1500)).toBe(true);
  });

  test('ett belopp som inte är något av de fyra stämmer inte', () => {
    expect(beloppStammer(rad(), 1234)).toBe(false);
  });

  test('ören jämförs exakt, utan flyttalsdrift', () => {
    const r = rad({ gallandePris: 2300.5, anmalningsavgift: null, summaInbetalt: 0 });
    expect(beloppStammer(r, 2300.5)).toBe(true);
    expect(beloppStammer(r, 2300.51)).toBe(false);
  });

  test('NEGATIV KONTROLL: strikt likhet på flyttal missar öresbelopp', () => {
    // 0.1 + 0.2 !== 0.3 är samma fälla `summeraKronorKlient` finns för.
    const trasigFlyttal = (a: number, b: number) => a === b;
    expect(trasigFlyttal(0.1 + 0.2, 0.3)).toBe(false);
    const r = rad({ gallandePris: 0.1 + 0.2, anmalningsavgift: null });
    expect(beloppStammer(r, 0.3)).toBe(true);
  });

  test('ett okänt pris stämmer aldrig — noll gissas inte fram', () => {
    const utanPris = rad({ gallandePris: null, anmalningsavgift: null, saknas: null });
    expect(beloppStammer(utanPris, 2500)).toBe(false);
    expect(beloppStammer(utanPris, 0)).toBe(false);
  });
});

/* ═══════════════════════════ STEG 1: TELEFON ═══════════════════════════ */

test.describe('matchning steg 1 — telefon ger SÄKER', () => {
  test('en telefonträff är säker, med exakt en kandidat', () => {
    const rader = [
      rad(),
      rad({
        anmalanRecordId: 'recBBBBBBBBBBBBBB',
        personNamn: 'Bo Berg',
        personTelefon: '073-111 22 33',
      }),
    ];
    const utfall = matchaTransaktion(transaktion(), rader);

    expect(utfall.klass).toBe('saker');
    expect(utfall.kandidater).toHaveLength(1);
    expect(utfall.kandidater[0].betalning.anmalanRecordId).toBe('recAAAAAAAAAAAAAA');
    expect(utfall.grund).toContain('Telefonnumret');
  });

  test('telefonen vinner även när NAMNET pekar åt ett annat håll', () => {
    // Bankens namn är den registrerade Swish-ägarens. Numret är personens.
    const utfall = matchaTransaktion(transaktion({ namn: 'Familjen Swish' }), [rad()]);
    expect(utfall.klass).toBe('saker');
  });

  test('FLERA telefonträffar är OSÄKERT, inte säkert — samma person, två event', () => {
    // PRD berättelse 1: "åtta betalningar för åtta event". Numret pekar ut
    // PERSONEN men inte BETALNINGEN.
    const rader = [
      rad({ anmalanRecordId: 'recAAAAAAAAAAAAAA', eventNamn: 'Fjärrskådning' }),
      rad({ anmalanRecordId: 'recBBBBBBBBBBBBBB', eventNamn: 'RIM 1' }),
    ];
    const utfall = matchaTransaktion(transaktion(), rader);

    expect(utfall.klass).toBe('osaker');
    expect(utfall.kandidater).toHaveLength(2);
    expect(utfall.grund).toContain('flera');
  });

  test('NEGATIV KONTROLL: "ta den första telefonträffen" bokför på fel event', () => {
    // Den troliga genvägen, och den är GRÖN i det vanliga fallet (en anmälan
    // per person) — vilket är precis varför ett lyckligt-fall-test inte hade
    // fångat den.
    const rader = [
      rad({ anmalanRecordId: 'recAAAAAAAAAAAAAA', eventNamn: 'Fjärrskådning' }),
      rad({ anmalanRecordId: 'recBBBBBBBBBBBBBB', eventNamn: 'RIM 1' }),
    ];
    const trasigForsta = (rr: InkorgsRad[]) => ({
      klass: 'saker' as const,
      kandidater: rr.slice(0, 1),
    });
    expect(trasigForsta(rader).klass).toBe('saker');
    expect(matchaTransaktion(transaktion(), rader).klass).toBe('osaker');
  });

  test('en transaktion UTAN telefon går vidare till steg 2, den fastnar inte', () => {
    // BgMax-filer saknar telefonnummer helt (research § 5). Steget måste
    // släppa igenom, inte fälla.
    const utfall = matchaTransaktion(transaktion({ telefon: null }), [rad()]);
    expect(utfall.klass).toBe('osaker');
  });
});

/* ═══════════════════════════ STEG 2: NAMN + BELOPP ═══════════════════════════ */

test.describe('matchning steg 2 — namn plus belopp ger OSÄKER, aldrig säker', () => {
  const utanTelefon = { telefon: null };

  test('namn och belopp som stämmer ger osäker med kandidaten', () => {
    const utfall = matchaTransaktion(transaktion(utanTelefon), [rad({ personTelefon: null })]);
    expect(utfall.klass).toBe('osaker');
    expect(utfall.kandidater).toHaveLength(1);
    expect(utfall.grund).toContain('beloppet stämmer');
  });

  test('SÄKER kräver telefon — ett perfekt namn plus belopp räcker inte', () => {
    // Bankens namn kan vara en förälder som betalar för sitt barn, och två
    // personer kan heta samma sak. Det är indicier, aldrig ett svar.
    const utfall = matchaTransaktion(transaktion(utanTelefon), [rad({ personTelefon: null })]);
    expect(utfall.klass).not.toBe('saker');
  });

  test('NEGATIV KONTROLL: "namn + belopp = säker" förbockar en gissning', () => {
    // Den trasiga regeln ger `saker`, vilket enligt AC #4 betyder FÖRBOCKAD
    // — alltså en inbetalning som registreras utan att Lotta valt något.
    const trasigSaker = (namnTraff: boolean, beloppTraff: boolean) =>
      namnTraff && beloppTraff ? 'saker' : 'osaker';
    expect(trasigSaker(true, true)).toBe('saker');
    expect(matchaTransaktion(transaktion(utanTelefon), [rad({ personTelefon: null })]).klass).toBe(
      'osaker',
    );
  });

  test('DELBETALNING: namnet stämmer men beloppet gör det inte — kandidaten står kvar', () => {
    // 1 000 kr på en anmälan där varken pris, avgift eller rest är 1 000.
    // Ett hårt beloppskrav hade filtrerat bort en helt legitim delbetalning.
    const utfall = matchaTransaktion(transaktion({ ...utanTelefon, belopp: 750 }), [
      rad({ personTelefon: null }),
    ]);
    expect(utfall.klass).toBe('osaker');
    expect(utfall.kandidater).toHaveLength(1);
    expect(utfall.grund).toContain('delbetalning');
  });

  test('NEGATIV KONTROLL: ett hårt beloppskrav gör delbetalningen omatchad', () => {
    const rr = [rad({ personTelefon: null })];
    const trasigtKrav = (belopp: number) => rr.filter((r) => beloppStammer(r, belopp));
    expect(trasigtKrav(750)).toHaveLength(0);
    expect(
      matchaTransaktion(transaktion({ ...utanTelefon, belopp: 750 }), rr).kandidater,
    ).toHaveLength(1);
  });

  test('kandidater RANKAS: beloppsträff först, sedan förfallna', () => {
    const rader = [
      rad({
        anmalanRecordId: 'recAAAAAAAAAAAAAA',
        personTelefon: null,
        gallandePris: 5000,
        anmalningsavgift: null,
      }),
      rad({
        anmalanRecordId: 'recBBBBBBBBBBBBBB',
        personTelefon: null,
        gallandePris: 2500,
        anmalningsavgift: null,
      }),
    ];
    const utfall = matchaTransaktion(transaktion({ ...utanTelefon, belopp: 2500 }), rader);
    expect(utfall.kandidater[0].betalning.anmalanRecordId).toBe('recBBBBBBBBBBBBBB');
  });
});

/* ═══════════════════════════ STEG 3: OMATCHAD ═══════════════════════════ */

test.describe('matchning steg 3 — omatchad', () => {
  test('varken telefon eller namn ger omatchad, med NOLL kandidater', () => {
    const utfall = matchaTransaktion(
      transaktion({ telefon: '+46700000000', namn: 'Okänd Person' }),
      [rad()],
    );
    expect(utfall.klass).toBe('omatchad');
    expect(utfall.kandidater).toEqual([]);
  });

  test('en TOM lista öppna betalningar ger omatchad, inte ett krasch', () => {
    expect(matchaTransaktion(transaktion(), []).klass).toBe('omatchad');
  });

  test('en transaktion utan både namn och telefon är omatchad', () => {
    const utfall = matchaTransaktion(transaktion({ telefon: null, namn: null }), [rad()]);
    expect(utfall.klass).toBe('omatchad');
  });

  test('NEGATIV KONTROLL: "första öppna betalningen" bokför på en främling', () => {
    const trasigFallback = (rr: InkorgsRad[]) => rr.slice(0, 1);
    const rader = [rad()];
    expect(trasigFallback(rader)).toHaveLength(1);
    expect(
      matchaTransaktion(transaktion({ telefon: '+46700000000', namn: 'Okänd' }), rader).kandidater,
    ).toEqual([]);
  });

  test('INVARIANTEN: saker har exakt en kandidat, osaker minst en, omatchad noll', () => {
    const fall: { transaktion: Transaktion; rader: InkorgsRad[] }[] = [
      { transaktion: transaktion(), rader: [rad()] },
      {
        transaktion: transaktion(),
        rader: [rad(), rad({ anmalanRecordId: 'recBBBBBBBBBBBBBB' })],
      },
      { transaktion: transaktion({ telefon: null }), rader: [rad({ personTelefon: null })] },
      { transaktion: transaktion({ telefon: null, namn: 'Ingen Alls' }), rader: [rad()] },
    ];

    for (const { transaktion: tr, rader } of fall) {
      const utfall = matchaTransaktion(tr, rader);
      if (utfall.klass === 'saker') expect(utfall.kandidater).toHaveLength(1);
      if (utfall.klass === 'osaker') expect(utfall.kandidater.length).toBeGreaterThan(0);
      if (utfall.klass === 'omatchad') expect(utfall.kandidater).toEqual([]);
    }
  });
});

/* ═══════════════════════════ BEKRÄFTELSELISTAN (AC #4) ═══════════════════════════ */

const parsat = (transaktioner: Transaktion[]): Parsresultat => ({
  rader: transaktioner.map((t, index): ImporteradRad => ({ radnummer: index + 2, transaktion: t })),
  bortfiltrerade: [],
  fel: [],
});

test.describe('byggImportrader — de tre defaultvärdena ur AC #4', () => {
  test('SÄKER rad är förbockad och har anmälan förvald', () => {
    const rader = byggImportrader(parsat([transaktion()]), [rad()], new Map());
    expect(rader[0].matchning.klass).toBe('saker');
    expect(rader[0].ibockad).toBe(true);
    expect(rader[0].vald).toBe('recAAAAAAAAAAAAAA');
  });

  test('OSÄKER rad är INTE förbockad och har inget förvalt — det vore en gissning', () => {
    const rader = byggImportrader(
      parsat([transaktion({ telefon: null })]),
      [rad({ personTelefon: null })],
      new Map(),
    );
    expect(rader[0].matchning.klass).toBe('osaker');
    expect(rader[0].ibockad).toBe(false);
    expect(rader[0].vald).toBeNull();
  });

  test('OMATCHAD rad är varken bockad eller vald', () => {
    const rader = byggImportrader(
      parsat([transaktion({ telefon: null, namn: 'Ingen Alls' })]),
      [rad()],
      new Map(),
    );
    expect(rader[0].matchning.klass).toBe('omatchad');
    expect(rader[0].ibockad).toBe(false);
    expect(rader[0].vald).toBeNull();
  });

  test('NEGATIV KONTROLL: "bocka i allt som har en kandidat" registrerar osäkra utan att fråga', () => {
    // Detta är AC #4:s hela poäng: importen får aldrig gissa åt Lotta.
    const rader = byggImportrader(
      parsat([transaktion({ telefon: null })]),
      [rad({ personTelefon: null })],
      new Map(),
    );
    const trasigBock = (r: Importradstillstand) => r.matchning.kandidater.length > 0;
    expect(trasigBock(rader[0])).toBe(true);
    expect(rader[0].ibockad).toBe(false);
  });

  test('kvittorutan är i som default, samma som formulärets', () => {
    const rader = byggImportrader(parsat([transaktion()]), [rad()], new Map());
    expect(rader[0].medKvitto).toBe(true);
  });
});

/* ═══════════════════════════ DUBBLETTERNA (AC #3) ═══════════════════════════ */

test.describe('dubbletter — hoppas över och RÄKNAS', () => {
  const tre = [
    transaktion({ bankreferens: 'r1' }),
    transaktion({ bankreferens: 'r2' }),
    transaktion({ bankreferens: 'r3' }),
  ];

  test('en känd referens hamnar i sin egen hög och bockas ALDRIG i', () => {
    const logg = new Map([['r2', '2026-08-30']]);
    const rader = byggImportrader(parsat(tre), [rad()], logg);

    expect(redanImporterade(rader)).toHaveLength(1);
    expect(redanImporterade(rader)[0].tidigareImporterad).toBe('2026-08-30');
    expect(redanImporterade(rader)[0].ibockad).toBe(false);
    expect(attHantera(rader)).toHaveLength(2);
  });

  test('OMIMPORT AV SAMMA FIL GER NOLL NYA (AC #3, bevisat)', () => {
    // Första importen: tre säkra rader, alla att registrera.
    const forsta = byggImportrader(parsat(tre), [rad()], new Map());
    expect(raderAttRegistrera(forsta)).toHaveLength(3);

    // Loggen bokför de tre. Andra importen av SAMMA fil:
    const efter = new Map([
      ['r1', '2026-08-30'],
      ['r2', '2026-08-30'],
      ['r3', '2026-08-30'],
    ]);
    const andra = byggImportrader(parsat(tre), [rad()], efter);

    expect(raderAttRegistrera(andra)).toHaveLength(0);
    expect(sammanfattaImport(andra).redanRegistrerade).toBe(3);
    expect(sammanfattaImport(andra).attRegistrera).toBe(0);
  });

  test('NEGATIV KONTROLL: utan dubblettkontroll ger omimporten tre nya inbetalningar', () => {
    // Utan spärren skulle Lotta få tre extra inbetalningar, tre extra kvitton
    // och tre fel i Rogers bokföring. (Databasens partiella unika index hade
    // fångat det ändå — men först EFTER att listan lovat henne motsatsen.)
    const utanKontroll = byggImportrader(parsat(tre), [rad()], new Map());
    expect(raderAttRegistrera(utanKontroll)).toHaveLength(3);

    const medKontroll = byggImportrader(
      parsat(tre),
      [rad()],
      new Map([
        ['r1', '2026-08-30'],
        ['r2', '2026-08-30'],
        ['r3', '2026-08-30'],
      ]),
    );
    expect(raderAttRegistrera(medKontroll)).toHaveLength(0);
  });

  test('serverns 409 räknas i SAMMA tal som loggens träffar', () => {
    // Två vägar till samma sanning: loggen kände till en, servern avvisade en
    // annan. För Lotta är det ett faktum, inte två.
    const rader = byggImportrader(parsat(tre), [rad()], new Map([['r1', '2026-08-30']]));
    const efterKorning = rader.map(
      (r, i): Importradstillstand => (i === 1 ? { ...r, utfall: { klass: 'dubblett' } } : r),
    );
    expect(sammanfattaImport(efterKorning).redanRegistrerade).toBe(2);
  });

  test('arDubblettfel känner igen serverns 409, och bara den', () => {
    // `registrera-inbetalning` svarar 409 med code `dubblett_bankreferens`
    // när det partiella unika indexet avvisar referensen. Det är den enda
    // källan som vet sanningen om HELA databasen.
    expect(arDubblettfel({ status: 409, message: 'dubblett' })).toBe(true);
    expect(arDubblettfel({ status: 400, message: 'formfel' })).toBe(false);
    expect(arDubblettfel({ status: 500 })).toBe(false);
    expect(arDubblettfel(new Error('nätverket bröt'))).toBe(false);
    expect(arDubblettfel(null)).toBe(false);
    expect(arDubblettfel(undefined)).toBe(false);
  });

  test('NEGATIV KONTROLL: "allt som kastar är en dubblett" gömmer riktiga fel', () => {
    // Den enkla genvägen i en catch-sats. Ett nätverksfel eller ett 400 hade
    // då räknats som "redan registrerad", och Lotta hade trott att raden var
    // tagen när den aldrig nådde fram. Det är det farligaste utfallet i hela
    // importen: pengar som ser bokförda ut men inte är det.
    const trasigCatch = () => true;
    expect(trasigCatch()).toBe(true);
    expect(arDubblettfel(new Error('nätverket bröt'))).toBe(false);
    expect(arDubblettfel({ status: 400 })).toBe(false);
  });

  test('en rad UTAN bankreferens kan aldrig kännas igen av loggen', () => {
    // Formatet bär ingen referenskolumn. Raden får importeras, men den bär
    // inget dubblettskydd — och det sägs rakt ut i UI i stället för att
    // låtsas.
    const rader = byggImportrader(
      parsat([transaktion({ bankreferens: null })]),
      [rad()],
      new Map([['r1', '2026-08-30']]),
    );
    expect(rader[0].tidigareImporterad).toBeNull();
    expect(radnyckel(rader[0].rad)).toBe('rad-2');
  });

  test('radnyckel är ALLTID radnummer-baserad — den kolliderar aldrig när flera rader delar bankreferens', () => {
    // Fix-runda 2 (granskning runda 1, fynd 7): mappningsdialogen låter Lotta
    // peka ut VILKEN kolumn som helst som "Bankens referens" — pekar hon på
    // en kolumn med ett konstant värde får flera rader SAMMA bankreferens.
    // Nyckeln bär tre laster (React-key, `andraRad`-uppslag, utfallskartan i
    // `bekrafta()`), så en kollision hade lett en ändring på EN rad till en
    // ANNAN, och den sista radens utfall skrivit över den förstas.
    const deladReferens = '5566778899';
    const rader = byggImportrader(
      parsat([
        transaktion({ bankreferens: deladReferens, namn: 'Anna Swish' }),
        transaktion({ bankreferens: deladReferens, namn: 'Sven Svensson' }),
      ]),
      [rad(), rad({ anmalanRecordId: 'recBBBBBBBBBBBBBB', personNamn: 'Sven Svensson' })],
      new Map(),
    );

    expect(rader).toHaveLength(2);
    // Samma bankreferens på båda — precis scenariot som kolliderade förut.
    expect(rader[0].rad.transaktion.bankreferens).toBe(rader[1].rad.transaktion.bankreferens);

    const nycklar = rader.map((r) => radnyckel(r.rad));
    expect(nycklar).toEqual(['rad-2', 'rad-3']);
    expect(new Set(nycklar).size).toBe(2);
  });

  test('NEGATIV KONTROLL: bankreferens-baserad nyckel kolliderar på samma indata', () => {
    // Den TRASIGA varianten (den gamla implementationen), skriven här —
    // aldrig i produktionskoden — visar att kollisionen är verklig, inte
    // hypotetisk: två olika rader ger EN gemensam nyckel.
    const trasigRadnyckel = (r: ImporteradRad) =>
      r.transaktion.bankreferens ?? `rad-${r.radnummer}`;
    const deladReferens = '5566778899';
    const rader = parsat([
      transaktion({ bankreferens: deladReferens, namn: 'Anna Swish' }),
      transaktion({ bankreferens: deladReferens, namn: 'Sven Svensson' }),
    ]).rader;

    const trasigaNycklar = rader.map(trasigRadnyckel);
    expect(trasigaNycklar).toEqual([deladReferens, deladReferens]);
    expect(new Set(trasigaNycklar).size).toBe(1);

    // Den riktiga implementationen ger två olika nycklar på samma indata.
    const rattaNycklar = rader.map(radnyckel);
    expect(new Set(rattaNycklar).size).toBe(2);
  });

  test('en registrerad rad skickas inte igen i samma körning', () => {
    const rader = byggImportrader(parsat(tre), [rad()], new Map());
    const efter = rader.map(
      (r, i): Importradstillstand =>
        i === 0
          ? { ...r, utfall: { klass: 'registrerad', inbetalningId: 'x', kvittens: 'ok' } }
          : r,
    );
    expect(raderAttRegistrera(efter)).toHaveLength(2);
  });
});

/* ═══════════════════════════ SAMMANFATTNINGEN ═══════════════════════════ */

test.describe('sammanfattaImport — åtta rader i banken blir åtta rader i appen', () => {
  test('varje rad ligger i exakt EN hög', () => {
    const rader = byggImportrader(
      parsat([
        transaktion({ bankreferens: 'r1' }),
        transaktion({ bankreferens: 'r2', telefon: null }),
        transaktion({ bankreferens: 'r3', telefon: null, namn: 'Ingen Alls' }),
        transaktion({ bankreferens: 'r4' }),
      ]),
      [rad({ personTelefon: '070-987 98 79' })],
      new Map([['r4', '2026-08-30']]),
    );

    const summa = sammanfattaImport(rader);
    expect(summa.lasta).toBe(4);
    expect(summa.sakra + summa.osakra + summa.omatchade + summa.redanRegistrerade).toBe(4);
    expect(summa.sakra).toBe(1);
    expect(summa.osakra).toBe(1);
    expect(summa.omatchade).toBe(1);
    expect(summa.redanRegistrerade).toBe(1);
  });

  test('NEGATIV KONTROLL: en klassning som räknar de redan importerade två gånger spricker', () => {
    // De ligger inte i arbetsytan, och att räkna dem både som "säkra" och som
    // "redan registrerade" hade gett fem högar för fyra rader.
    const rader = byggImportrader(
      parsat([transaktion({ bankreferens: 'r1' })]),
      [rad()],
      new Map([['r1', '2026-08-30']]),
    );
    const trasigSakra = (rr: Importradstillstand[]) =>
      rr.filter((r) => r.matchning.klass === 'saker').length;
    expect(trasigSakra(rader)).toBe(1);
    expect(sammanfattaImport(rader).sakra).toBe(0);
    expect(sammanfattaImport(rader).redanRegistrerade).toBe(1);
  });

  test('utfallen räknas efter körningen', () => {
    const rader = byggImportrader(
      parsat([
        transaktion({ bankreferens: 'r1' }),
        transaktion({ bankreferens: 'r2' }),
        transaktion({ bankreferens: 'r3' }),
      ]),
      [rad()],
      new Map(),
    );
    const efter = rader.map((r, i): Importradstillstand => {
      if (i === 0)
        return { ...r, utfall: { klass: 'registrerad', inbetalningId: 'x', kvittens: 'ok' } };
      if (i === 1) return { ...r, utfall: { klass: 'dubblett' } };
      return { ...r, utfall: { klass: 'fel', skal: 'Nätverket bröt.' } };
    });

    const summa = sammanfattaImport(efter);
    expect(summa.registrerade).toBe(1);
    expect(summa.redanRegistrerade).toBe(1);
    expect(summa.misslyckade).toBe(1);
  });
});
