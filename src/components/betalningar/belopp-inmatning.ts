/**
 * [TASK-346.6, PRD TASK-346 berättelse 4] Beloppsfältets KLIENTSPEGEL av
 * `supabase/functions/_shared/betalningsbelopp.ts`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR EN SPEGEL OCH INTE EN IMPORT
 * ═══════════════════════════════════════════════════════════════════════════
 * Serverns modul är REN och importfri, så den vore i princip importerbar rakt
 * in i klienten. Den ligger ändå bakom en egen tsconfig-projektreferens
 * (`tsconfig.edge-shared.json` § include), och `tsconfig.app.json` har
 * `include: ["src"]`. En import från `src/` hade dragit in samma fil i TVÅ
 * projekt i samma `tsc -b`-graf. Ingen fil i `src/` gör det i dag (mätt
 * 2026-08-31: `grep` över hela `src/` ger noll faktiska importer ur
 * `supabase/functions/_shared/`, bara kommentarreferenser), och att vara
 * först med det på en nattkörning är fel plats att pröva byggkedjans
 * tolerans.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SPEGELN ÄR MEKANISKT BEVAKAD, INTE EN KOPIA PÅ HEDERSORD
 * ═══════════════════════════════════════════════════════════════════════════
 * En andra implementation av samma regel är exakt den kopierings-drift
 * `~/.claude/CLAUDE.md` varnar för — SÅ LÄNGE ingen mekanism upptäcker att de
 * glidit isär. `tests/api/betalningsbelopp-klientparitet.test.ts` importerar
 * BÅDA (tests-projektet når både `src/` via `@/`-aliaset och
 * `supabase/functions/_shared/` via relativ sökväg — bevisat mönster, se
 * `tests/api/activity-log-pilot-statements.test.ts` respektive
 * `tests/api/betalningsbelopp.test.ts`) och kör ett gemensamt korpus genom
 * dem. Divergerar en enda rad fäller sviten.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVERN ÄR ÄNDÅ FACIT — SPEGELN AVGÖR ALDRIG VAD SOM SPARAS
 * ═══════════════════════════════════════════════════════════════════════════
 * `RegistreraInbetalningInput.belopp` är en STRÄNG och normaliseras
 * server-side. Denna modul används enbart för att (a) visa vad beloppet
 * KOMMER att täcka innan Lotta trycker (AC #5) och (b) ge ett felmeddelande
 * vid fältet i stället för en rundtur till servern (AC #3). Skulle spegeln
 * någon gång vara mildare än servern blir utfallet ett serverfel som visas
 * vid fältet, aldrig en felaktig bokföringspost.
 */

/**
 * Tusentalsavgränsare som strippas bort, angivna som KODPUNKTER och inte som
 * råa tecken. Se serverns modul för skälet: hårt blanksteg, siffer-blanksteg,
 * tunt blanksteg och smalt hårt blanksteg är osynligt olika i en editor, och
 * en kopierad bankrad bär ofta just dem.
 */
const GRUPPTECKEN = [
  0x0020, // vanligt blanksteg
  0x00a0, // hårt blanksteg (no-break space)
  0x2007, // siffer-blanksteg (figure space)
  0x2009, // tunt blanksteg (thin space)
  0x202f, // smalt hårt blanksteg (narrow no-break space)
  0x0027, // apostrof (schweizisk/tysk tusentalsform)
] as const;

const GRUPPTECKEN_RE = new RegExp(
  `[${GRUPPTECKEN.map((kod) => String.fromCodePoint(kod)).join('')}]`,
  'g',
);

/** Valutasuffix Lotta/banken kan råka få med. Prövas efter trim, skiftlägesfritt. */
const VALUTASUFFIX_RE = /(?:\s*(?::-|kr|kronor|sek))+$/i;

/**
 * Kanonisk form: valfritt minustecken, minst en siffra, valfritt
 * decimaltecken med EXAKT en eller två siffror. Inget `e`, inget `0x`,
 * ingen `Infinity`, inget efterföljande skräp.
 */
const KANONISK_RE = /^-?\d+(?:\.\d{1,2})?$/;

/** Kolumnens bredd: `numeric(12,2)` ⇒ högst 10 heltalssiffror. */
export const BELOPP_MAX_KLIENT = 9_999_999_999.99;

/**
 * Normaliserar Lottas inmatning till kronor som `number`, eller `null` när
 * strängen inte ENTYDIGT är ett belopp.
 *
 * Accepterar: `'2 500,00'`, `'2500,50'`, `'2500'`, `'2 500 kr'`, `'1000:-'`,
 * `'-500'`, `'12.50'`. Avvisar: `'abc'`, `'1e3'`, `'2.500'`, `''`, `'0x10'`,
 * `'Infinity'`, `'1,234'`, `'12abc'`.
 *
 * NOLL RETURNERAS SOM 0, inte som `null` — "är noll ett giltigt belopp?" är
 * en domänfråga (nej), inte en parse-fråga. `beloppsFel` nedan skiljer dem.
 */
export function normaliseraBeloppKlient(ratext: unknown): number | null {
  if (typeof ratext !== 'string') return null;

  const utanValuta = ratext.trim().replace(VALUTASUFFIX_RE, '');
  const kanonisk = utanValuta.replace(GRUPPTECKEN_RE, '').replace(',', '.');

  if (!KANONISK_RE.test(kanonisk)) return null;

  const tal = Number(kanonisk);
  if (!Number.isFinite(tal)) return null;
  if (Math.abs(tal) > BELOPP_MAX_KLIENT) return null;

  return tal === 0 ? 0 : tal;
}

/**
 * Summerar kronbelopp UTAN flyttalsdrift genom att räkna i ören. Speglar
 * `summeraKronor` på servern; samma paritetsgrind bevakar den.
 */
export function summeraKronorKlient(belopp: readonly number[]): number {
  const oren = belopp.reduce((summa, kr) => summa + Math.round(kr * 100), 0);
  return oren / 100;
}

/**
 * Fältets felmeddelande, eller `null` när inmatningen duger (PRD berättelse
 * 30: "få fel förklarade i text vid fältet, så att jag aldrig står med en grå
 * knapp och undrar").
 *
 * TRE UTFALL, INTE TVÅ. Tomt fält är inte ett fel medan Lotta fortfarande
 * skriver — det är bara "inte klart än", och en röd rad som dyker upp så fort
 * hon rensar fältet är brus. Anroparen skiljer dem: `beloppsFel('')` är
 * `null`, och knappen är i stället inaktiv eftersom `normaliseraBeloppKlient`
 * gav `null`.
 */
export function beloppsFel(ratext: string): string | null {
  const trimmad = ratext.trim();
  if (trimmad === '') return null;

  const tal = normaliseraBeloppKlient(ratext);
  if (tal === null) {
    return 'Skriv beloppet med siffror, till exempel 2 500 eller 2 500,00.';
  }
  if (tal === 0) {
    return 'Beloppet kan inte vara noll.';
  }
  return null;
}

/**
 * Kronor i svensk form för visning: `2 500` respektive `2 500,50`. Hela
 * kronor visas UTAN decimaler, eftersom det är så banken och Lotta skriver
 * dem; ören visas alltid med två.
 *
 * `sv-SE` ger hårt blanksteg som tusentalsavgränsare, vilket är rätt
 * typografi och dessutom precis det tecken `GRUPPTECKEN` ovan accepterar
 * tillbaka vid inklistring.
 */
export function visaKronor(belopp: number): string {
  const heltal = Number.isInteger(belopp);
  return belopp.toLocaleString('sv-SE', {
    minimumFractionDigits: heltal ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
