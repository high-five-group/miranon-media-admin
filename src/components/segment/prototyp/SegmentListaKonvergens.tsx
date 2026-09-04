/**
 * [PROTOTYPE] SegmentListaKonvergens — B2-konvergenspasset (S114 Del 3
 * beslut 3, Marcus-kvitterad riktning 2026-08-31).
 *
 * FRÅGAN SOM BESVARAS: exakt vilken form av segment-startsidan är Marcus
 * helt nöjd med?
 *
 * Konvergens-only (divergensen överhoppad öppet). K0-baslinjen är skarpa
 * startvyn (VariantD:s SegmentLista på ?variant=null); K-stegen itererar
 * mot den kvitterade riktningen:
 *   (a) två sektioner: "Dina segment" (sparade) överst, "Färdiga grupper"
 *       (de fjorton) under
 *   (b) kompaktare kort à la Bilagor-formen (korthöjdslåsets VÄRDE
 *       omprövas öppet — principen fast höjd behålls, S114 Del 3 beslut 3)
 *   (c) täckningskvittensen som synlig rad ovanför listan
 *   (d) "senast använd" väntar 6h — byggs inte här
 *
 * K2 (S117, 2026-09-03). Marcus fynd på K1: *"skarpa vyn är mycket snyggare
 * än prototypen."* Mätt orsak: K1 la antalet i fetstil på namnets rad, tog
 * bort antalsraden som ankrade kortets botten, krympte radie/luft/avstånd
 * och la täckningen som en grå list med länk ovanför fel sektion. K2 är
 * därför SKARPA VYNS HANTVERK VERBATIM med riktningen lagd ovanpå:
 *   - kortet återfår facitets anatomi (namn / mening / antal med ikon
 *     längst ner), `rounded-2xl`, `p-4`, `gap-3` mellan kort. Kompaktionen
 *     tas ur namnets radreservation (2 → 1 rad, trunkerad med title) och
 *     antalsradens höjd (min-h-8 → min-h-6): 132 px mot facitets 168
 *     (DOM-mätt). K2 bar en korthöjds-växel i rälsen (`?kort=`) så värdet
 *     kunde omstämplas i browsern.
 *
 * K3 (S117, 2026-09-03). Marcus varv 2: *"Jag gillar prototyp variant 1
 * mer än 2"* — korthöjden LÅST till 132 px, växeln riven. Sektionsantalen
 * ("3", "14") som BRICKOR i Hem-mönstret (`ForfallnaBetalningar.tsx` §
 * "Att påminna": `rounded-md bg-bg-emphasized px-1.5 py-0.5 font-semibold
 * tabular-nums`), på Marcus fråga och orkestrerarens rekommendation. Två
 * justeringar mot Hem: textstorleken sätts explicit liten (Hem ärver sin
 * caption-rubrik; vår h2 är större och brickan får inte bli en andra
 * rubrik), och ingen bricka vid noll (Hem renderar blocket bara när
 * antalet är > 0; tomläget säger redan att inget finns).
 *   - hårlinjen under h1 och kapselklassen med ikoner är facitets; K1:s
 *     titel på infoboxen (tillägg utan beslut) är borta.
 *   - täckningen tar "Visa täckning"-radens plats och vikt (lågmäld
 *     textknapp med lagerikonen), bär kvittensen som etikett och bor hos
 *     "Färdiga grupper" som den gäller; klick fäller ut facitets gröna
 *     kvittensrad.
 *   - sektionsrubriker som h2 med dämpat antal; tomläget för "Dina
 *     segment" i facitets form (text + kapsel), ingen grå låda.
 *
 * Kastbar VÄXEL-kod (throwaway-kontraktet ii): formen promoveras vid
 * Marcus stämpel (ADR-102/103/104); det som rivs efteråt är varianten och
 * demodatat, aldrig formen.
 *
 * DATAT ÄR STATISK FORMDATA — öppet bokfört beslut på AFK-mandat (S114
 * Del 4): de fjortons namn/meningar/antal är avskrivna ur prod-mätningen
 * 2026-08-31 (Del 2-bilagan), "Dina segment"-exemplen är demo. Skälet:
 * formbedömningen kräver ingen datakoppling, och VariantD:s interna
 * datamaskineri (useQueries per segment) ska inte dupliceras i kastbar
 * kod. Promoverings-skivorna kopplar listSegments/compute-segment.
 * Dataläget ?data=tom visar "Dina segment"-tomläget.
 */
import { Check, CircleCheck, Group, Layers, ListPlus, Users } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useId, useRef, useState } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { SidRam } from '@/components/primitives/SidRam';

type DemoSegment = { namn: string; mening: string; antal: number };

/** Kopia av VariantD:s `KAPSEL_KLASS` (rad ~991) — promoveringen delar
 * konstanten, prototypen dubblerar den hellre än importerar ur 5 000
 * raders skarp kod. */
const KAPSEL_KLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors';

/** Samma böjning som VariantD:s `personform` + "0 personer ännu"-formen. */
function personform(n: number): string {
  if (n === 0) return '0 personer ännu';
  return n === 1 ? '1 person' : `${n} personer`;
}

/** De fjorton — avskrivna ur prod 2026-08-31 (Del 2, fullpage-bilagan). */
const FARDIGA_GRUPPER: DemoSegment[] = [
  {
    namn: 'RIM 1',
    mening: 'Har bara gått RIM 1 - ingen av de andra tre utbildningarna.',
    antal: 188,
  },
  {
    namn: 'Fjärrskådning',
    mening: 'Har bara gått Fjärrskådning - ingen av de andra tre utbildningarna.',
    antal: 59,
  },
  {
    namn: 'Psionautics',
    mening: 'Har bara gått Psionautics - ingen av de andra tre utbildningarna.',
    antal: 40,
  },
  {
    namn: 'RIM 1 + RIM 2',
    mening: 'Har gått både RIM 1 och RIM 2 - men ingen av de andra två utbildningarna.',
    antal: 34,
  },
  {
    namn: 'Fjärrskådning + RIM 1',
    mening: 'Har gått både Fjärrskådning och RIM 1 - men ingen av de andra två utbildningarna.',
    antal: 30,
  },
  {
    namn: 'Fjärrskådning + RIM 1 + RIM 2',
    mening: 'Har gått Fjärrskådning, RIM 1 och RIM 2 - men inte Psionautics.',
    antal: 24,
  },
  {
    namn: 'Fjärrskådning + RIM 1 + RIM 2 + Psionautics',
    mening: 'Har gått alla fyra utbildningarna.',
    antal: 14,
  },
  {
    namn: 'RIM 1 + Psionautics',
    mening: 'Har gått både RIM 1 och Psionautics - men ingen av de andra två.',
    antal: 9,
  },
  {
    namn: 'RIM 1 + RIM 2 + Psionautics',
    mening: 'Har gått RIM 1, RIM 2 och Psionautics - men inte Fjärrskådning.',
    antal: 8,
  },
  {
    namn: 'Fjärrskådning + RIM 1 + Psionautics',
    mening: 'Har gått Fjärrskådning, RIM 1 och Psionautics - men inte RIM 2.',
    antal: 3,
  },
  {
    namn: 'Fjärrskådning + Psionautics',
    mening: 'Har gått både Fjärrskådning och Psionautics - men ingen av de andra två.',
    antal: 3,
  },
  {
    namn: 'RIM 2',
    mening: 'Har bara gått RIM 2 - ingen av de andra tre utbildningarna.',
    antal: 3,
  },
  {
    namn: 'RIM 2 + Psionautics',
    mening: 'Har gått både RIM 2 och Psionautics - men ingen av de andra två.',
    antal: 1,
  },
  {
    namn: 'Fjärrskådning + RIM 2',
    mening: 'Har gått både Fjärrskådning och RIM 2 - men ingen av de andra två.',
    antal: 1,
  },
];

/** Demo-exempel på sparade segment (formen för "Dina segment"-sektionen). */
const DINA_DEMO: DemoSegment[] = [
  {
    namn: 'Skool - RIM-gruppen',
    mening: 'Har gått både RIM 1 och RIM 2 - oavsett övriga utbildningar.',
    antal: 42,
  },
  {
    namn: 'Höstutskicket 2026',
    mening: 'Har gått minst en av utbildningarna under 2026.',
    antal: 117,
  },
  {
    namn: 'Psionautics-alumner',
    mening: 'Har gått Psionautics - oavsett övriga utbildningar.',
    antal: 71,
  },
];

/** Antalet deltagare i de fjortons täckning — statiskt ur Del 2-mätningen. */
const TACKNING_DELTAGARE = 417;

/**
 * Segmentkortet i facitets anatomi (VariantD § SegmentKort): namn /
 * mening / antal med ikon längst ner. Namnet reserverar EN rad (trunkerad,
 * fullt namn i title; facitet reserverade två), antalsraden 24 px (facitet
 * 32). Meningen behåller sina två reserverade rader — den är ytans styrka
 * (Del 2 fynd 6) och får inte kapas. Fast höjd, 132 px, aldrig
 * innehållsberoende (Marcus varv 2).
 */
function SegmentKort({ segment }: { segment: DemoSegment }) {
  return (
    <li className="relative flex flex-col gap-1 rounded-2xl border border-transparent bg-bg-muted p-4 hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-border-strong">
      <span className="min-h-[1lh] truncate font-semibold text-body" title={segment.namn}>
        {segment.namn}
      </span>
      <span className="line-clamp-2 min-h-[2lh] text-small text-text-secondary">
        {segment.mening}
      </span>
      <div className="flex min-h-6 items-center">
        <span className="flex items-center gap-1.5 text-caption text-text-secondary">
          <Users aria-hidden="true" size={14} className="shrink-0" />
          {personform(segment.antal)}
        </span>
      </div>
    </li>
  );
}

/** Sektionsrubrik: h2 + antalet som BRICKA i Hem-mönstret
 * (`ForfallnaBetalningar.tsx` § "Att påminna"), explicit liten text så den
 * inte ärver h2:ans storlek; ingen bricka vid noll. Ingen ikon —
 * lagerikonen betyder täckning på denna yta och lånas inte ut. */
function SektionsRubrik({ namn, antal }: { namn: string; antal: number }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-semibold text-lg">{namn}</h2>
      {antal > 0 && (
        <span className="rounded-md bg-bg-emphasized px-1.5 py-0.5 font-semibold text-small text-text tabular-nums">
          {antal}
        </span>
      )}
    </div>
  );
}

export function SegmentListaKonvergens() {
  const [dataMode] = useQueryState('data');
  // Kryssets minne är sessions-lokalt i prototypen — 349:s skarpa
  // localStorage-form äger persistensen och ärvs vid promoveringen.
  const [infoDold, setInfoDold] = useState(false);
  const [tackningOppen, setTackningOppen] = useState(false);
  const tackningPanelId = useId();
  const tomt = dataMode === 'tom';
  const dina = tomt ? [] : DINA_DEMO;
  // Rutt-fokus till rubriken vid mount — skarpa vyns `useVyFokus`-mönster
  // (VariantD rad ~1112) i IntresseradeKonvergens-formen; datat är statiskt
  // så ingen dataKlart-grind behövs. Granskningsfynd #2256 runda 1.
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    rubrikRef.current?.focus();
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Segment
        </h1>
      </header>

      {infoDold ? null : (
        <div className="px-4">
          <MessageBox intent="info" onDismiss={() => setInfoDold(true)}>
            Urval av personer som du kan skicka riktade mail till. Spara ett segment och återanvänd
            det - antalet räknas upp automatiskt, så antalet stämmer även när fler personer
            tillfaller segmentet.
          </MessageBox>
        </div>
      )}

      <div className="flex flex-col gap-6 px-4">
        {/* Handlingsraden: facitets tre kapslar med ikoner, Markera högerankrad.
            `print:hidden` som skarpa vyn (VariantD rad ~1964). */}
        <div className="flex min-h-10 flex-wrap items-center gap-2 print:hidden">
          <button type="button" className={KAPSEL_KLASS}>
            <ListPlus aria-hidden="true" size={18} className="shrink-0" />
            Nytt segment
          </button>
          <button type="button" className={KAPSEL_KLASS}>
            <Group aria-hidden="true" size={18} className="shrink-0" />
            Dela upp i grupper
          </button>
          <button type="button" className={`${KAPSEL_KLASS} ml-auto`}>
            <Check aria-hidden="true" size={18} className="shrink-0" />
            Markera
          </button>
        </div>

        {/* Riktning (a): Dina segment överst. */}
        <div className="flex flex-col gap-3">
          <SektionsRubrik namn="Dina segment" antal={dina.length} />
          {dina.length === 0 ? (
            // Tomläget i facitets form (VariantD § SegmentLista): lugn text +
            // kapsel, ingen grå låda. Ordet "urval" i stället för facitets
            // "grupp personer" — ORDLISTA:n reserverar grupp för uppdelningen.
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="font-medium text-body">Inga sparade segment än</p>
              <p className="max-w-prose text-small text-text-muted">
                Ett segment är ett urval personer du kan skicka till om och om igen. Du bygger det
                som en regel - och regeln fortsätter gälla när nya utbildningar tillkommer.
              </p>
              <button type="button" className={KAPSEL_KLASS}>
                <ListPlus aria-hidden="true" size={18} className="shrink-0" />
                Skapa ditt första segment
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {dina.map((s) => (
                <SegmentKort key={s.namn} segment={s} />
              ))}
            </ul>
          )}
        </div>

        {/* Riktning (a) + (c): Färdiga grupper med täckningen på rubrikraden.
            Knappen har "Visa täckning"-radens vikt (VariantD § SegmentLista)
            men bär kvittensen som etikett — synlig utan klick; klicket fäller
            ut facitets gröna kvittensrad (VariantD § TackningsPanel). */}
        <div className="flex flex-col gap-3 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SektionsRubrik namn="Färdiga grupper" antal={FARDIGA_GRUPPER.length} />
            <button
              type="button"
              aria-expanded={tackningOppen}
              aria-controls={tackningPanelId}
              onClick={() => setTackningOppen((v) => !v)}
              className={`-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium text-small motion-safe:transition-colors print:hidden ${
                tackningOppen ? 'bg-bg-emphasized' : 'text-text-secondary hover:bg-bg-emphasized'
              }`}
            >
              <Layers aria-hidden="true" size={16} className="shrink-0" />
              {`Full täckning · ${TACKNING_DELTAGARE} av ${TACKNING_DELTAGARE}`}
            </button>
          </div>
          <div id={tackningPanelId} hidden={!tackningOppen}>
            <p className="flex items-start gap-2 rounded-xl bg-success-bg px-4 py-2.5 text-small">
              <CircleCheck aria-hidden="true" size={18} className="mt-px shrink-0 text-success" />
              <span>
                {`100 % - Full täckning. Alla ${TACKNING_DELTAGARE} deltagare som gått minst en utbildning finns representerade i exakt en av grupperna.`}
              </span>
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {FARDIGA_GRUPPER.map((s) => (
              <SegmentKort key={s.namn} segment={s} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
