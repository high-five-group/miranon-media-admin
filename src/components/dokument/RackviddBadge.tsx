// [TASK-309.44] `Layers` = "den här filen ligger i FLERA lager", vilket är
// precis vad en delad räckvidd ÄR. Ikonvalet bryter en reservation som stått
// i denna fils grannar — se § TRE KANALER i docblocket nedan för varför den
// inte gäller här.
import { Layers } from 'lucide-react';
import { rackviddsBadgeText } from '@/components/dokument/rackviddsText';
import type { Attachment } from '@/domain/models/Attachment';
import { AttachmentScope, type AttachmentScopeValue } from '@/domain/types/Status';

/**
 * Räckviddsbadgen (TASK-275.3, ADR-118 beslut 2+5; OMBYGGD TASK-338.3,
 * ADR-125 § Beslut 1) — markerar en GEMENSAM bilaga (räckvidd `Gemensam`)
 * i Dokument-ytans listor (eventläget och räckviddsläget). Kortets AC #4
 * låser de två ytorna: badgen syns i BÅDA, men INTE i Åtgärds-sidans
 * bilageväljare (se TASK-339-stycket nedan).
 * RENDERAR INGET för `rackvidd` Event/`null` — en
 * bilaga som "bara" hör till DETTA event behöver ingen förklarande badge,
 * badgen finns för att förklara VARFÖR en rad dyker upp som INTE laddades
 * upp här (ADR-118 beslut 3: badgen "bär förklaringen" till varför
 * Ersätt/Radera saknas i eventkontext).
 *
 * [TASK-339, 2026-08-29] INTE LÄNGRE I ÅTGÄRDS-SIDANS BILAGEVÄLJARE. Badgen
 * fanns där fram till denna skiva (ADR-118 beslut 2:s ursprungsformulering,
 * amenderad i TASK-338.5 § Updates) — Marcus prod-röktest 2026-08-29 (S113,
 * TASK-309.11 punkt 8): "blir inte snyggt". I väljaren är räckvidden inte
 * ett beslutsunderlag (Lotta väljer VAD som ska bifogas, inte varifrån det
 * kommer) och pillen konkurrerade visuellt med kryssrutan/filnamnet.
 * Komponenten är ORÖRD — den renderas bara på en yta färre nu
 * (`AtgardsSida.tsx`s docblock vid det gamla anropsstället bär motivet).
 *
 * HUSETS PILL-GRAMMATIK, INGEN NY FORMUPPFINNING (Marcus kvalitetsdirektiv
 * 2026-08-17): samma `sm`-steg som `StatusBadge.tsx`s Pill-skala dokumenterar
 * (list-/kortmiljö, `px-2 py-0.5 text-caption`), samma `rounded-full`, och
 * samma `border border-transparent` som reserverar plats för
 * `contrast-more:border` utan layout-hopp (tre-regels-disciplinen i
 * `StatusBadge.tsx` § PILL_STORLEK).
 *
 * "Detta event"-pillen är därutöver EXAKT den neutrala metadata-strängen som
 * på tre andra ställen i appen (`Gruppdynamik.tsx` rad ~160,
 * `AtgardsSida.tsx` rad ~915, `Deltagare.tsx` rad ~1099): `bg-bg-muted` +
 * `text-text-secondary` + `contrast-more:border-border-strong`.
 *
 * ═══ [TASK-309.44, 2026-08-30] TRE KANALER PÅ DEN DELADE PILLEN ═══
 *
 * DE TVÅ PILLARNA ÄR INTE LÄNGRE SAMMA STRÄNG, och det är hela poängen.
 * Marcus mandat 2026-08-30 (Bilagor-ytans hierarki): den delade bilagan är
 * det AVVIKANDE fallet och ska synas som det. På en eventsida är "detta
 * event" normalfallet — det Lotta måste kunna se på en halv sekund är
 * *"påverkar jag ANDRA event om jag rör den här filen?"*. Den frågan bars
 * tidigare av texten ensam, i en pill som såg identisk ut med normalfallets.
 *
 * Signalen går nu på TRE kanaler, vilket är WCAG 1.4.1 (färg aldrig ensam
 * bärare) plus en marginal:
 *   1. IKON  — `Layers`, aria-hidden (texten bär redan betydelsen)
 *   2. TON   — `bg-info-bg` + ikonen i `text-info`
 *   3. TEXT  — `rackviddsBadgeText`, OFÖRÄNDRAD ("Alla event", "RIM · Steg 1
 *              · Rönninge" …), liksom `title`
 * Formen är `StatusBadge`s: tonal platta, ikon i tonfärgen, text i DEFAULT-
 * färgen. Ikonen bär ingen egen information — den är en igenkännings-
 * förstärkning, precis som `StatusBadge`s bock/triangel.
 *
 * TONEN ÄR `info`, INTE `warning`. En delad bilaga är ingen varning — den är
 * ett faktum om filens spridning. `--mm-info` är dessutom appens enda
 * neutrala icke-status-ton, vilket håller pillen utanför success/warning-
 * grammatiken där den inte hör hemma.
 *
 * MÄTT (node, WCAG 2.x-formeln, TASK-309.44) — inte ögonmätt:
 *   `--mm-text` #242424 mot `--mm-info-bg` #eff6ff → **14,26:1** (1.4.3 AA
 *      kräver 4,5:1 för `text-caption`, som inte är "large text")
 *   `--mm-info` #4a6b8a mot #eff6ff             → **5,13:1** (1.4.11 kräver
 *      3:1 för ett grafiskt objekt — ikonen håller med marginal, ingen
 *      mörkare ton ur blå-skalan behövdes)
 *   #eff6ff mot kortets #ffffff → ΔE00 **5,06** (neutrala pillens platta mot
 *      samma kort ligger på ΔE00 2,30 — den delade sticker alltså ut ~2×)
 *
 * `Layers`-RESERVATIONEN, ÖPPET BRUTEN: `DokumentYta.tsx` rad ~206 och ~623
 * samt `AnmalningarSida.tsx` rad ~534 avstår alla från `Layers` med
 * motiveringen att den är *"upptagen av segment-byggarens lager-begrepp"*
 * (`segment/prototyp/VariantD.tsx`). Reservationen gällde VÄLJAR- och
 * MENY-ikoner på ytor där segment-språket kan dyka upp; den gäller inte en
 * räckviddspill på Bilagor-ytan, där inget lager-begrepp finns och där
 * "flera lager" ÄR den bokstavliga betydelsen. `Files` — väljarens egen
 * ikon för delade bilagor — avvisades här av en annan orsak: raden bär redan
 * en filtyps-glyf (`TypGlyf`) längst till vänster, och två dokument-ikoner
 * på samma rad läser som två olika filer. Ändras segment-ytan någon gång så
 * att de två möts på samma skärm är detta stället att ompröva.
 *
 * TEXTEN, GUNILLA-LÄSBAR — [OMBYGGD, TASK-338.3, ADR-125 § Beslut 1] den
 * KOMPONERAS numera ur de tre axlarna i stället för att vara en fast sträng
 * per räckviddsvärde, eftersom räckvidden `Gemensam` ÄR ett filter över
 * Kursfamilj · Kursnivå · Plats: "Alla event" (inga axlar) · "RIM" ·
 * "RIM · Steg 1" · "Rönninge" · "RIM · Rönninge" · "RIM · Steg 1 · Rönninge".
 * Kompositionen — inklusive varför tomma axlar INTE längre skrivs ut som
 * "Alla steg", och varför ordet är "Steg" och inte "Nivå" — bor i
 * `rackviddsText.ts`, som är REACT-FRI just för att formerna ska kunna
 * enhetstestas en och en (kortets AC #4).
 *
 * Docblockets tidigare formulering ("<Kursfamilj> · Nivå N") var dessutom
 * FALSK redan innan denna skiva: `stegEtikett` har översatt 'Nivå 1' →
 * 'Steg 1' sedan 2026-08-17, så prosan beskrev en yta som inte fanns. Den
 * felklassen (prosa som påstår ett beteende koden inte har) är samma som
 * ADR-083 städar; texten är därför omskriven mot mätt utfall, inte mot
 * minnet av den.
 */
export function RackviddBadge({
  rackvidd,
  kursfamilj,
  kursniva,
  plats,
}: {
  rackvidd: AttachmentScopeValue | null;
  kursfamilj: string | null;
  kursniva: string | null;
  /** Plats-axeln ur `Attachment.plats` — `null` för en icke platsbunden bilaga. */
  plats: Attachment['plats'];
}) {
  // ═══ RENDERAR NU ÄVEN "Detta event" — TIDIGARE `return null` ═══
  //
  // Badgen returnerade `null` för räckvidd Event/`null`, med motiveringen att
  // "en bilaga som bara hör till DETTA event behöver ingen förklarande
  // badge". Det höll så länge raderna fick vara olika höga.
  //
  // Marcus 2026-08-17 låste radhöjden: *"alla dokumentrader [ska vara] lika
  // höga … Dokumentnamn / Täckning / Uppladdningsdatum PÅ ALLA rader,
  // alltid."* En rad utan badge hade då antingen blivit lägre än de andra
  // (bryter låsningen) eller burit ett tomrum där de andra bär information.
  //
  // "Detta event" är ÄRLIGARE än tomrummet och försvagar inte ADR-118
  // beslut 3:s signal — den blir tydligare: nu står täckningen på VARJE rad,
  // så "Detta event" mot "Alla event"/"RIM · Steg 1" är en jämförelse man
  // kan göra med ögat i stället för en frånvaro man ska tolka. Att
  // Ersätt/Radera saknas för de gemensamma har fortfarande sin förklaring
  // i badgen — den säger nu bara vad DEN HÄR raden gäller också.
  //
  // [TASK-338.3] Villkoret är NU en enda jämförelse mot `Gemensam` i stället
  // för två mot `Kurstyp`/`Alla event`. Legacy-värdena kan strukturellt inte
  // nå hit längre: läsvägen normaliserar dem till `Gemensam` vid datagränsen
  // (`normaliseraRaAttachment`, `domain/schemas/Attachment.schema.ts`), så
  // komponenten behöver aldrig känna till att de har funnits.
  if (rackvidd !== AttachmentScope.GEMENSAM) {
    return (
      <span
        className="inline-flex min-w-0 max-w-full items-center truncate rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong"
        title="Detta event"
      >
        Detta event
      </span>
    );
  }

  // Prop-namnen `kursfamilj`/`kursniva` är ORÖRDA med avsikt: de speglar
  // Airtable-fälten, och datakällans namn byts inte från en UI-copy-ändring
  // (UI-språket säger "Familj"/"Steg", basen säger Kursfamilj/Kursnivå).
  //
  // PLATSENS NAMN kan vara tomt medan `id` är satt — `Platsnamn`-lookupen
  // kan halka efter en nyss skapad länk (`Attachment.plats`s docblock).
  // `rackviddsBadgeText` behandlar tom sträng som "axeln är inte satt", så
  // badgen visar då de övriga axlarna i stället för en pill med ett hål i.
  const text = rackviddsBadgeText({ kursfamilj, kursniva, platsNamn: plats?.namn ?? null });

  return (
    // ═══ `bg-surface`, INTE `bg-bg-muted` — OCH DET ÄR EN BUGGFIX ═══
    //
    // Pillen bar `bg-bg-muted` fram till S107 QA-vandringens fjärde rond.
    // Det är husets kanoniska metadata-pill-sträng (samma som
    // `Gruppdynamik.tsx:160` och `AtgardsSida.tsx:916`), så formen var rätt —
    // men den renderas INUTI Dokument-ytans listkort, och det kortet bär
    // också `bg-bg-muted`. Mätt i renderad yta: pillens bakgrund
    // `rgb(245,245,243)`, kortets bakgrund `rgb(245,245,243)`. IDENTISKA.
    // Kanten är `border-transparent` utom i `contrast-more`, så det fanns
    // ingenting kvar som avgränsade pillen — den läste som fri text.
    //
    // Marcus fångade den exakt så ("Räckvidds ettiketten hänger ju fritt som
    // text bara, borde det inte vara pills eller något") — invändningen var
    // rätt, men orsaken var inte att formen saknades utan att den var
    // osynlig.
    //
    // DETTA ÄR TREDJE INSTANSEN AV SAMMA FELKLASS i denna yta: `ghost`s
    // hover-token ÄR `bg-bg-muted` och gav samma osynlighet på Visa-knappen
    // (två gånger) och på Ersätt/Radera. `bg-bg-muted` används både som
    // KORTETS bakgrund och som "svag yta"-token för element INUTI kortet —
    // allt som bär den mot ett sådant kort försvinner. Fråga alltid vad
    // underlaget bär innan denna token väljs.
    //
    // ═══ VÄNT TILLBAKA TILL `bg-bg-muted` 2026-08-18 — OCH DET LAGAR TVÅ YTOR ═══
    //
    // Resonemanget ovan var riktigt för sitt underlag, men underlaget bytte:
    // Dokument-ytans lista fick sin EGEN `bg-surface`-yta (Marcus: *"ge
    // inline-scroll-ytan en annan färg/toning"*), och då blev en
    // `bg-surface`-pill osynlig mot den. MÄTT: `pill=rgb(255,255,255)`,
    // `lista=rgb(255,255,255)`.
    //
    // FALSIFIERAT SAMTIDIGT, av en andra mätning: raden ovan påstod att
    // pillen *"på en yta som INTE är `bg-bg-muted` — t.ex. Åtgärds-sidans
    // bilageväljare — läser den fortfarande som en pill"*. Den ytan är
    // `divide-y divide-border rounded-lg bg-surface` (`AtgardsSida.tsx`), och
    // mätningen där gav `badge=rgb(255,255,255)`, `underlag=rgb(255,255,255)`.
    // Badgen har alltså varit OSYNLIG på Åtgärds-sidan sedan den byttes —
    // en levande bugg som friskrevs i prosa utan att mätas.
    //
    // Bytet till `bg-bg-muted` gör pillen synlig på BÅDA ytorna, eftersom
    // båda numera är `bg-surface`. Det är inte en kompromiss mellan dem.
    //
    // REGELN SOM FALLER UT, dyrköpt över sex instanser: tokenvalet följer
    // NÄSTLINGEN, aldrig vanan — och "syns den?" besvaras med en mätning av
    // `backgroundColor` i renderad yta, aldrig med en blick på klassnamnet
    // eller ett resonemang om vilken yta som "brukar" bära vad.
    //
    // ═══ `min-w-0 max-w-full truncate`, INTE `shrink-0` — TASK-309.20 ═══
    //
    // Pillen bar `shrink-0` sedan tillkomsten. Mätt vid 375 px (räckviddsläget,
    // badgetexten "RIM · Alla steg", Playwright mot hermetisk fixturvärld,
    // se TASK-309.20s Final Summary för hela mätserien): badgens box
    // `x=62 width=103` mot första ikonknappens `x=131` — badgen fortsatte
    // 34 px IN i knapp-kolumnen, och knappen (senare i DOM-ordningen, samma
    // stapelkontext) målades ovanpå. Ground truth: den stämplade facit-bilden
    // `tasks/sessions/bilagor/s108-dokumentytan/facit-dokumentyta-rackviddslage-mobil.png`
    // visar exakt detta — badgens högra kant syns bakom den röda
    // Radera-knappen.
    // `shrink-0` förbjuder krympning, så när badgens naturliga textbredd är
    // större än kolumnens tilldelade utrymme finns bara en väg ut: den flyter
    // över `overflow: visible` (default) rakt in i grannkolumnen.
    //
    // Fixen är samma idiom filnamnet redan bär (`DokumentYta.tsx`s
    // `DokumentRadSkal`-docblock: "NAMNET TRUNKERAS I STÄLLET FÖR ATT
    // RADBRYTA … truncate kräver min-w-0"): tillåt krympning (utelämna
    // `shrink-0`, default är `flex-shrink: 1`), `min-w-0` river det implicita
    // `min-width: auto` som annars vägrar krympa under textens egen bredd, och
    // `truncate` klipper med ellips i stället för att låta texten svämma över
    // pillens rundade kant. Behållaren måste ÄVEN vara bredd-bunden
    // (`DokumentYta.tsx`s badge-rad bär nu `w-full min-w-0` av samma skäl) —
    // annars finns inget "tillgängligt utrymme" att krympa MOT.
    //
    // ═══ [TASK-309.44] TONEN ÄR `info`, OCH TRUNKERINGEN HAR FLYTTAT IN ═══
    //
    // Hela `bg-surface`/`bg-bg-muted`-historiken ovan gäller den NEUTRALA
    // strängen, som "Detta event"-grenen fortfarande bär oförändrad. Den
    // DELADE pillen har lämnat den (se docblocket § TRE KANALER): `bg-info-bg`
    // är varken kortets vita eller behållarens grå, så den token-identitets-
    // fälla styckena ovan handlar om kan strukturellt inte träffa den —
    // mätt ΔE00 5,06 mot kortet, alltså mer än dubbla den neutrala pillens
    // 2,30. Regeln som föll ut ("tokenvalet följer NÄSTLINGEN … och 'syns
    // den?' besvaras med en mätning") är alltså följd, inte kringgången.
    //
    // `truncate` sitter nu på det INRE spannet, inte på pillen. Ikonen ligger
    // utanför den trunkerande noden med `shrink-0`, så ett långt platsnamn
    // ("RIM · Steg 1 · Rönninge") klipps med ellips medan ikonen ALDRIG kan
    // klippas bort — hade `truncate` legat kvar på ytterspannet vore ikonen
    // en del av det överflödande innehållet. `min-w-0` på det inre spannet
    // river dess implicita `min-width: auto` av samma skäl som ovan.
    <span
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-transparent bg-info-bg px-2 py-0.5 font-medium text-caption text-text contrast-more:border-info"
      title={text}
    >
      <Layers aria-hidden="true" size={13} className="shrink-0 text-info" />
      <span className="min-w-0 truncate">{text}</span>
    </span>
  );
}
