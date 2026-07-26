/**
 * skala.mjs — genererar 12-stegsskalor i OKLCH och prövar dem mot rollkontrakt.
 *
 * Tolvstegsmodellen är Radix Colors rollindelning (radix-ui.com/colors/docs/
 * palette-composition/understanding-the-scale): varje steg är en UI-roll, inte
 * en godtycklig nyans. Skalan genereras i OKLCH därför att lika stora
 * ljushetssteg där också ser lika stora ut — samma skäl som fick Tailwind v4
 * att definiera om hela sin palett i den rymden.
 *
 * Ankaret är den befintliga varumärkesfärgen. Den flyttas aldrig: skalan byggs
 * runt den, så att steg 9 är exakt den kulör appen redan bär.
 */

import { kontrast, lch, maxKroma, oklch, oklchTillHex } from './farg.mjs';

/**
 * Under detta perceptuella avstånd räknas två färger som förväxlingsbara.
 * Satt med marginal: fokusringens igenkännbarhet är hela poängen med att den
 * är exklusiv, så gränsfall ska falla ut på den säkra sidan.
 */
const TROSKEL = 18;

/** Rollen varje steg fyller. Index 0 = steg 1. */
export const STEG_ROLLER = [
  'Sidbakgrund',
  'Subtil bakgrund',
  'Komponentyta',
  'Komponentyta, hover',
  'Komponentyta, aktiv',
  'Subtil kant',
  'Kant och fokusring',
  'Kant, hover',
  'Solid yta',
  'Solid yta, hover',
  'Text, låg kontrast',
  'Text, hög kontrast',
];

/** Ljusaste steget. Nära vitt, men inte vitt — steg 1 är en yta, inte papper. */
const LJUSAST = 0.993;

/**
 * Hur stegen 1–8 fördelar sig mellan LJUSAST och ankaret, som andel av
 * sträckan. Tätare i den ljusa änden eftersom ögat skiljer ljusa toner sämre
 * åt — samma fördelning som Radix ljusa skalor följer.
 */
const FORDELNING = [0, 0.06, 0.155, 0.27, 0.405, 0.56, 0.75, 0.88];

/**
 * Hur långt stegen 10–12 fortsätter nedanför ankaret, som andel av ankarets
 * ljushet. Relativt och inte absolut: ett mörkt ankare (Miranons koppar) ska
 * inte tvinga fram steg som kollapsar mot svart, och ett ljust ankare
 * (Miranons guld) ska ändå nå läsbar textkontrast.
 */
const UNDER_ANKARET = [0.935, 0.785, 0.56];

/**
 * Mättnadsprofil relativt ankarets mättnad. Toppar vid steg 9 (den solida) och
 * avtar åt båda håll: ljusa toner tål lite mättnad innan de blir skrikiga,
 * mörka toner tappar den naturligt när ljusheten sjunker.
 */
const KROMA_PROFIL = [0.14, 0.26, 0.42, 0.56, 0.68, 0.78, 0.88, 0.96, 1.0, 0.98, 0.9, 0.72];

/**
 * Bygger en tolvstegsskala runt en ankarfärg.
 *
 * @param {string} ankareHex - varumärkesfärgen; blir steg 9 oförändrad
 * @param {object} [opt]
 * @param {number} [opt.kulorton] - lås kulörtonen till detta gradtal i stället
 *   för ankarets egen (används när en befintlig skala driver i ton och ska
 *   rätas ut mot ankaret)
 * @param {number} [opt.kroma] - använd denna mättnad i stället för ankarets.
 *   Behövs för neutraler, där ankaret är kromatiskt rent och en skala med
 *   ärvd mättnad blir gråare än den ton huset faktiskt har
 * @param {Array<{hex: string, vad: string}>} [opt.reserverade] - färger skalan
 *   ska hålla sig undan från. Steg som hamnar för nära avmättas tills de går
 *   att skilja åt
 * @returns {Array<{steg: number, hex: string, roll: string, undanvek?: string}>}
 */
export function byggSkala(ankareHex, opt = {}) {
  const ankare = oklch(ankareHex);
  const h = opt.kulorton ?? ankare.h;
  const baskroma = opt.kroma ?? ankare.C;

  // Ljusheten byggs ut från ankaret åt båda håll i stället för från en fast
  // tabell. En fast tabell antar att varumärkesfärgen råkar ha den ljushet ett
  // steg 9 "brukar" ha; gör den inte det — Miranons koppar är märkbart mörkare
  // — blir skalan icke-monoton och stegen byter ordning mitt i.
  const ljushet = [
    ...FORDELNING.map((andel) => LJUSAST - andel * (LJUSAST - ankare.L)),
    ankare.L,
    ...UNDER_ANKARET.map((andel) => ankare.L * andel),
  ];

  const skala = ljushet.map((L, i) => {
    const steg = i + 1;
    if (steg === 9) return { steg, hex: ankareHex.toLowerCase(), roll: STEG_ROLLER[i] };

    const C = Math.min(baskroma * KROMA_PROFIL[i], maxKroma(L, h));
    return { steg, hex: oklchTillHex({ L, C, h }), roll: STEG_ROLLER[i] };
  });

  // Textstegen får inte vara ungefärliga. En handsatt ljushet som råkar landa
  // på 4,40:1 ser rätt ut i en tabell och är ändå ett brutet löfte, så de
  // mörknar tills kravet mot steg 2 faktiskt håller.
  for (const [steg, golv] of [
    [11, 4.5],
    [12, 7],
  ]) {
    skala[steg - 1] = morknaTills(skala[steg - 1], skala[1].hex, golv, h, ankare.C);
  }

  // Undanvikandet körs SIST, efter textkalibreringen. Kalibreringen sätter om
  // mättnaden för att nå sitt kontrastgolv och skulle annars återinföra just
  // den mättnad som nyss veks bort — ordningen är inte godtycklig.
  //
  // Steg som krockar med en reserverad färg avmättas tills de går att skilja
  // åt. Ljusheten hålls fast — den bär skalans ordning — så det är mättnaden
  // som får ge vika. Blå är fallet detta finns för: info-blå och fokusringen
  // har nästan identisk mättnad och ton och skiljs bara av ljushet, så en
  // skala som vandrar nedåt från info-blå går rakt genom fokusringen.
  if (opt.reserverade?.length) {
    for (let i = 0; i < skala.length; i++) {
      if (i + 1 === 9) continue; // ankaret flyttas aldrig
      const kvar = hittaKollisioner([skala[i]], opt.reserverade, TROSKEL);
      if (!kvar.length) continue;

      // Avmättning, inte uppmättning. Båda riktningarna prövades: att mätta upp
      // ger ett klarblått steg 10 men fungerar inte alls för steg 11, som
      // ligger på fokusringens exakta ljushet och därför måste bära hela
      // avståndet i mättnad — och blå når inte den mättnaden så mörkt. Resultatet
      // blev en skala som gick dov, klarblå, grå. Ett konsekvent dovt slut är
      // ärligare än en skala som byter karaktär tre gånger.
      //
      // Att stegen tappar sin blåhet är inte en brist i metoden utan i paletten:
      // se fynd F10. Fokusringen ockuperar den ljushet blåskalans textsteg
      // behöver, och det löses genom att flytta info-blå — inte genom att
      // finjustera här.
      const { L } = oklch(skala[i].hex);
      const bas = baskroma * KROMA_PROFIL[i];
      for (const faktor of [0.85, 0.7, 0.55, 0.4, 0.25, 0.1, 0]) {
        const kandidat = oklchTillHex({ L, C: Math.min(bas * faktor, maxKroma(L, h)), h });
        if (!hittaKollisioner([{ steg: i + 1, hex: kandidat }], opt.reserverade, TROSKEL).length) {
          skala[i] = { ...skala[i], hex: kandidat, undanvek: kvar[0].vad };
          break;
        }
      }
    }
  }

  return skala;
}

/**
 * Mörknar ett steg i små kliv tills det når sitt kontraktsgolv mot en given
 * yta. Kulörtonen hålls fast; mättnaden följer ljusheten nedåt så att steget
 * inte blir grumligt när det mörknar.
 */
function morknaTills(steg, motYta, golv, h, ankarKroma) {
  let { L } = oklch(steg.hex);
  let hex = steg.hex;

  for (let i = 0; i < 60 && kontrast(hex, motYta) < golv && L > 0.12; i++) {
    L -= 0.005;
    hex = oklchTillHex({ L, C: Math.min(ankarKroma * (L / 0.56) * 0.9, maxKroma(L, h)), h });
  }
  return { ...steg, hex };
}

/**
 * Prövar en skala mot de kontrakt Radix garanterar för sina egna.
 *
 * Kontrakten är vad som gör tolv steg användbara i stället för dekorativa: om
 * steg 11 inte når läsbar kontrast mot steg 2 är "text, låg kontrast" ett tomt
 * löfte, och den som väljer ur skalan blir lurad.
 *
 * @returns {Array<{krav: string, uppmatt: number, golv: number, haller: boolean}>}
 */
export function provaKontrakt(skala) {
  const s = (n) => skala[n - 1].hex;
  const prov = [
    ['Steg 9 mot vit yta (UI-komponent, WCAG 1.4.11)', kontrast(s(9), '#ffffff'), 3],
    ['Steg 11 mot steg 2 (brödtext, WCAG AA)', kontrast(s(11), s(2)), 4.5],
    ['Steg 12 mot steg 2 (rubriktext, WCAG AAA)', kontrast(s(12), s(2)), 7],
    ['Steg 12 mot steg 1', kontrast(s(12), s(1)), 7],
    ['Steg 7 mot steg 2 (kant urskiljbar)', kontrast(s(7), s(2)), 1.4],
  ];
  return prov.map(([krav, uppmatt, golv]) => ({
    krav,
    uppmatt,
    golv,
    haller: uppmatt >= golv,
  }));
}

/**
 * Perceptuellt avstånd mellan två färger i CIE LCh.
 *
 * Grovt mått, inte ΔE2000 — men tillräckligt för frågan det ställs för: ligger
 * ett genererat steg så nära en färg som reserverats för ett annat syfte att de
 * kan förväxlas?
 */
function avstand(a, b) {
  const x = lch(a);
  const y = lch(b);
  const dh = (((x.h - y.h + 180) % 360) - 180) * 0.5;
  return Math.hypot(x.L - y.L, x.C - y.C, dh);
}

/**
 * Letar efter steg som kolliderar med en färg reserverad för annat bruk.
 *
 * Bakgrunden är fokusringen: `tasks/lessons.md` (Session 25, UNIVERSAL) slår
 * fast att den ska bära en färg som inte används till något annat, eftersom
 * exklusiviteten är det som gör den omisskännlig. En fullständig blåskala
 * producerar ett steg som är dess tvilling — den konflikten ska synas i
 * atlasen, inte tunas bort i tysthet.
 *
 * @param {Array} skala
 * @param {Array<{hex: string, vad: string}>} reserverade
 * @param {number} [trosklen] - avstånd under vilket färgerna räknas som förväxlingsbara
 */
export function hittaKollisioner(skala, reserverade, trosklen = TROSKEL) {
  const traffar = [];
  for (const steg of skala) {
    for (const r of reserverade) {
      const d = avstand(steg.hex, r.hex);
      if (d < trosklen) traffar.push({ steg: steg.steg, hex: steg.hex, ...r, avstand: d });
    }
  }
  return traffar;
}
