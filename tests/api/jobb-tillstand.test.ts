// Jobbradens tillståndsmaskin — TASK-346.4 AC #4, DoD #5, ADR-129 beslut 2 och 4.
//
// api-pure: `_shared/jobb-tillstand.ts` är importfri och Deno-fri.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SVITEN BEVISAR
// ═══════════════════════════════════════════════════════════════════════════
// Migrationen `20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql` skriver
// TRE NUMRERADE REGLER vid självläkningen, under rubriken "LÄS DETTA FÖRE
// TASK-346.4". Modulen är de reglerna i kod; denna svit är beviset för att
// koden faktiskt bär dem — och att den fäller när de bryts.
//
// SJÄLVLÄKNINGEN mäts mot `PAGAR_TAK_MS`, som är en SPEGLING av SQL-sidans
// `interval '5 minutes'`. Att de två kan drifta isär är en känd, namngiven
// risk (modulens filhuvud); sviten låser åtminstone TS-sidans beteende, så
// en oavsiktlig ändring där fälls.

import { expect, test } from '@playwright/test';
import {
  arSlutstatus,
  byggLakningsUppdatering,
  byggPagarUppdatering,
  byggSlutUppdatering,
  farPlockas,
  farStadaKomeddelande,
  type JobbRadStatus,
  PAGAR_TAK_MS,
  sammanfattaJobb,
  skaLakas,
} from '../../supabase/functions/_shared/jobb-tillstand';

const ALLA_STATUS: JobbRadStatus[] = ['vantar', 'pagar', 'skickat', 'fel'];
const NU = '2026-08-31T10:00:00.000Z';

// ═══════════════════════════════════════════════════════════════════════════
// § 1 — REGEL 1: tabellen är sanning, kön är väckning
// ═══════════════════════════════════════════════════════════════════════════

test.describe('farPlockas — regel 1', () => {
  test('ENDAST `vantar` får plockas', () => {
    expect(farPlockas({ status: 'vantar' })).toBe(true);
    for (const status of ['pagar', 'skickat', 'fel'] as JobbRadStatus[]) {
      expect(farPlockas({ status }), `${status} ska inte plockas`).toBe(false);
    }
  });

  test('NEGATIV KONTROLL: "plocka allt som inte är skickat" skickar om ett fel-läge', () => {
    // Den troliga genvägen. Kön är at-least-once, så ett meddelande för en
    // rad som redan är `pagar` hos EN ANNAN körning kommer tillbaka — och
    // den trasiga varianten låter båda arbeta samtidigt.
    const trasig = (status: JobbRadStatus) => status !== 'skickat';
    expect(trasig('pagar')).toBe(true);
    expect(farPlockas({ status: 'pagar' })).toBe(false);
  });

  test('arSlutstatus skiljer avslutade från öppna', () => {
    expect(arSlutstatus('skickat')).toBe(true);
    expect(arSlutstatus('fel')).toBe(true);
    expect(arSlutstatus('vantar')).toBe(false);
    expect(arSlutstatus('pagar')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2 — REGEL 2: kömeddelandet städas ALDRIG före slutstatus
// ═══════════════════════════════════════════════════════════════════════════

test.describe('farStadaKomeddelande — regel 2', () => {
  test('bara slutstatus tillåter städning', () => {
    expect(farStadaKomeddelande({ status: 'skickat' })).toBe(true);
    expect(farStadaKomeddelande({ status: 'fel' })).toBe(true);
    expect(farStadaKomeddelande({ status: 'vantar' })).toBe(false);
    expect(farStadaKomeddelande({ status: 'pagar' })).toBe(false);
  });

  test('NEGATIV KONTROLL: att städa vid `pagar` skapar en rad ingen kö kan väcka', () => {
    // Migrationens egen formulering: "Raderas meddelandet först och
    // konsumenten dör innan raden skrivs, blir raden en `pagar` som ingen kö
    // längre kan väcka — och då är svepet det ENDA som räddar den."
    const trasig = (status: JobbRadStatus) => status !== 'vantar';
    expect(trasig('pagar')).toBe(true);
    expect(farStadaKomeddelande({ status: 'pagar' })).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 3 — REGEL 3: `pagar` sätts ALLTID med `paborjad_nar`
// ═══════════════════════════════════════════════════════════════════════════

test.describe('byggPagarUppdatering — regel 3', () => {
  test('returnerar BÅDA fälten, alltid', () => {
    const uppdatering = byggPagarUppdatering(NU);
    expect(uppdatering).toEqual({ status: 'pagar', paborjad_nar: NU });
    // Formen är hela skyddet: en skrivväg kan inte sätta `pagar` utan
    // tidsstämpel om den bygger sin uppdatering här.
    expect(Object.keys(uppdatering).sort()).toEqual(['paborjad_nar', 'status']);
  });

  test('läkningens uppdatering nollar tidsstämpeln', () => {
    expect(byggLakningsUppdatering()).toEqual({ status: 'vantar', paborjad_nar: null });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 4 — SJÄLVLÄKNINGEN (AC #4: "jobbets tillståndsmaskin inkl. självläkning")
// ═══════════════════════════════════════════════════════════════════════════

test.describe('skaLakas', () => {
  const nuMs = Date.parse(NU);
  const iso = (ms: number) => new Date(ms).toISOString();

  test('en `pagar`-rad äldre än taket läks', () => {
    expect(skaLakas({ status: 'pagar', paborjadNar: iso(nuMs - PAGAR_TAK_MS - 1) }, NU)).toBe(true);
  });

  test('en `pagar`-rad PRECIS på taket läks INTE — gränsen är strikt', () => {
    // SQL-sidan är `paborjad_nar < now() - v_pagar_tak`, alltså strikt.
    // Skulle TS-sidan vara `<=` hade den läkt en rad en millisekund innan
    // databasen gjorde det, och de två hade svarat olika på samma fråga.
    expect(skaLakas({ status: 'pagar', paborjadNar: iso(nuMs - PAGAR_TAK_MS) }, NU)).toBe(false);
  });

  test('en färsk `pagar`-rad läks inte', () => {
    expect(skaLakas({ status: 'pagar', paborjadNar: iso(nuMs - 1000) }, NU)).toBe(false);
  });

  test('ingen annan status läks, hur gammal den än är', () => {
    const urgammal = iso(nuMs - 10 * PAGAR_TAK_MS);
    for (const status of ['vantar', 'skickat', 'fel'] as JobbRadStatus[]) {
      expect(skaLakas({ status, paborjadNar: urgammal }, NU), status).toBe(false);
    }
  });

  test('`pagar` UTAN tidsstämpel läks ALDRIG — samma som SQL:ens null-jämförelse', () => {
    // I SQL är `null < ...` varken sant eller falskt, alltså inte sant. Det
    // är inte en lucka utan skälet till att regel 3 finns: check-constrainten
    // `jobb_rad_pagar_har_start` gör tillståndet omöjligt att skriva.
    expect(skaLakas({ status: 'pagar', paborjadNar: null }, NU)).toBe(false);
  });

  test('NEGATIV KONTROLL: en läkning som ignorerar status återställer ett SKICKAT kvitto', () => {
    // Följden hade varit ett andra mail till deltagaren. Att `skaLakas`
    // prövar status FÖRST är alltså inte en optimering.
    const trasig = (paborjadNar: string) => Date.parse(paborjadNar) < nuMs - PAGAR_TAK_MS;
    const gammal = iso(nuMs - 10 * PAGAR_TAK_MS);
    expect(trasig(gammal)).toBe(true);
    expect(skaLakas({ status: 'skickat', paborjadNar: gammal }, NU)).toBe(false);
  });

  test('ogiltiga tidsstämplar läker inte (fail-closed)', () => {
    expect(skaLakas({ status: 'pagar', paborjadNar: 'inte-ett-datum' }, NU)).toBe(false);
    expect(skaLakas({ status: 'pagar', paborjadNar: iso(nuMs - 10 * PAGAR_TAK_MS) }, 'skräp')).toBe(
      false,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 5 — Slutstatus: ett fel utan skäl är omöjligt att bygga
// ═══════════════════════════════════════════════════════════════════════════

test.describe('byggSlutUppdatering', () => {
  test('skickat bär ingen skäl-text', () => {
    expect(byggSlutUppdatering({ status: 'skickat' }, NU)).toEqual({
      status: 'skickat',
      skal: null,
      avslutad_nar: NU,
    });
  });

  test('fel bär ALLTID sitt skäl, i klartext', () => {
    expect(byggSlutUppdatering({ status: 'fel', skal: 'Mailet avvisades.' }, NU)).toEqual({
      status: 'fel',
      skal: 'Mailet avvisades.',
      avslutad_nar: NU,
    });
  });

  test('båda bär avslutningstiden — check-constrainten kräver den', () => {
    // `jobb_rad_avslutad_har_tid`: status in (skickat, fel) ⇒ avslutad_nar
    // not null. En uppdatering utan tid hade fällts av databasen.
    expect(byggSlutUppdatering({ status: 'skickat' }, NU).avslutad_nar).toBe(NU);
    expect(byggSlutUppdatering({ status: 'fel', skal: 'x' }, NU).avslutad_nar).toBe(NU);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 6 — Jobbets sammanfattning: Hem-kortets tal
// ═══════════════════════════════════════════════════════════════════════════

test.describe('sammanfattaJobb', () => {
  test('räknar skickade, fel och kvarvarande', () => {
    const summering = sammanfattaJobb([
      { status: 'skickat' },
      { status: 'skickat' },
      { status: 'fel' },
      { status: 'vantar' },
      { status: 'pagar' },
    ]);
    expect(summering).toEqual({
      status: 'oppet',
      totalt: 5,
      skickade: 2,
      fel: 1,
      kvar: 2,
    });
  });

  test('alla rader i slutstatus stänger jobbet — även när någon fallerade', () => {
    const summering = sammanfattaJobb([{ status: 'skickat' }, { status: 'fel' }]);
    expect(summering.status).toBe('avslutat');
    expect(summering.kvar).toBe(0);
  });

  test('ETT JOBB MED NOLL RADER ÄR `oppet`, inte avslutat', () => {
    // `Array.prototype.every` på en tom lista är `true` — precis den fällan.
    // Ett tomt jobb uppstår i fönstret mellan att `jobb` skapats och dess
    // rader skrivits, och att kalla det avslutat hade fått Hem att säga
    // "klart" om ett arbete som inte börjat.
    expect(sammanfattaJobb([]).status).toBe('oppet');
  });

  test('NEGATIV KONTROLL: `every(arSlutstatus)` kallar det tomma jobbet avslutat', () => {
    const trasig = (rader: { status: JobbRadStatus }[]) =>
      rader.every((r) => arSlutstatus(r.status));
    expect(trasig([])).toBe(true);
    expect(sammanfattaJobb([]).status).toBe('oppet');
  });

  test('varje status ingår i exakt en räknare', () => {
    for (const status of ALLA_STATUS) {
      const summering = sammanfattaJobb([{ status }]);
      expect(summering.skickade + summering.fel + summering.kvar, status).toBe(1);
    }
  });
});
