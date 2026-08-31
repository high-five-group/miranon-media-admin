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
 *   (b) kompaktare kort à la Bilagor-formen: namn + antal på samma rad,
 *       människomeningen som sekundärrad (korthöjdslåsets VÄRDE omprövas
 *       öppet — principen fast höjd behålls, S114 Del 3 beslut 3)
 *   (c) täckningskvittensen som synlig rad ovanför listan
 *   (d) "senast använd" väntar 6h — byggs inte här
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
import { CheckCircle2, Layers } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { SidRam } from '@/components/primitives/SidRam';

type DemoSegment = { namn: string; mening: string; antal: number };

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

/** Kompakt segmentkort (riktning b): namn + antal på samma rad, meningen
 * som sekundärrad. Fast höjd i NY, lägre form — `min-h-[2lh]` på meningen
 * behåller radreservationen så korten är lika höga oavsett meningslängd. */
function SegmentKort({ segment }: { segment: DemoSegment }) {
  return (
    <li className="rounded-xl bg-bg-muted px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-semibold text-body">{segment.namn}</span>
        <span className="shrink-0 font-semibold text-body tabular-nums">
          {segment.antal === 1 ? '1 person' : `${segment.antal} personer`}
        </span>
      </div>
      <p className="mt-0.5 line-clamp-2 min-h-[2lh] text-small text-text-secondary">
        {segment.mening}
      </p>
    </li>
  );
}

export function SegmentListaKonvergens() {
  const [dataMode] = useQueryState('data');
  // Kryssets minne är sessions-lokalt i prototypen — 349:s skarpa
  // localStorage-form äger persistensen och ärvs vid promoveringen.
  const [infoDold, setInfoDold] = useState(false);
  const tomt = dataMode === 'tom';
  const dina = tomt ? [] : DINA_DEMO;

  return (
    <section className="flex flex-col gap-6">
      <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />

      <header className="flex flex-col gap-3 px-4">
        <h1 className="font-semibold text-3xl">Segment</h1>
        {infoDold ? null : (
          <MessageBox intent="info" title="Vad är ett segment?" onDismiss={() => setInfoDold(true)}>
            Urval av personer som du kan skicka riktade mail till. Spara ett segment och återanvänd
            det - antalet räknas upp automatiskt, så antalet stämmer även när fler personer
            tillfaller segmentet.
          </MessageBox>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3 px-4">
        <button
          type="button"
          className="rounded-full bg-bg-muted px-4 py-2 font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors"
        >
          Nytt segment
        </button>
        <button
          type="button"
          className="rounded-full bg-bg-muted px-4 py-2 font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors"
        >
          Dela upp i grupper
        </button>
        <button
          type="button"
          className="ml-auto rounded-full bg-bg-muted px-4 py-2 font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors"
        >
          Markera
        </button>
      </div>

      {/* Riktning (c): täckningen som synlig kvittensrad ovanför listan. */}
      <div className="mx-4 flex items-center gap-2 rounded-lg bg-bg-muted px-3 py-2 text-small">
        <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-text-secondary" />
        <span>
          <span className="font-medium">Full täckning</span>
          <span className="text-text-secondary">
            {' - de färdiga grupperna når alla 417 deltagare, var och en i exakt en grupp.'}
          </span>
        </span>
        <button type="button" className="ml-auto shrink-0 font-medium text-small underline">
          Visa detaljer
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4">
        <h2 className="font-semibold text-lg">Dina segment</h2>
        {dina.length === 0 ? (
          <p className="rounded-xl bg-bg-muted px-4 py-6 text-center text-small text-text-muted">
            Inga sparade segment ännu. Skapa ett med Nytt segment, så hamnar det här.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {dina.map((s) => (
              <SegmentKort key={s.namn} segment={s} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 px-4 pb-8">
        <div className="flex items-center gap-2">
          <Layers aria-hidden="true" className="size-4 text-text-secondary" />
          <h2 className="font-semibold text-lg">Färdiga grupper</h2>
          <span className="text-small text-text-muted">
            {`${FARDIGA_GRUPPER.length} grupper, alltid aktuella`}
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {FARDIGA_GRUPPER.map((s) => (
            <SegmentKort key={s.namn} segment={s} />
          ))}
        </ul>
      </div>
    </section>
  );
}
