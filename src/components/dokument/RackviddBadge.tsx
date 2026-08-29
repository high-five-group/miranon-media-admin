import { stegEtikett } from '@/components/dokument/nivaSprak';
import { AttachmentScope, type AttachmentScopeValue } from '@/domain/types/Status';

/**
 * Räckviddsbadgen (TASK-275.3, ADR-118 beslut 2+5) — markerar en GEMENSAM
 * bilaga (räckvidd Kurstyp/Alla event) i Dokument-ytans listor (eventläget
 * och räckviddsläget). RENDERAR INGET för `rackvidd` Event/`null` — en
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
 * 2026-08-17): EXAKT samma klass-sträng som den neutrala metadata-pillen på
 * tre andra ställen i appen (`Gruppdynamik.tsx` rad ~160, `AtgardsSida.tsx`
 * rad ~915, `Deltagare.tsx` rad ~1099) — `rounded-full border
 * border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption
 * text-text-secondary contrast-more:border-border-strong`. Samma
 * `sm`-steg som `StatusBadge.tsx`s Pill-skala dokumenterar (list-/kortmiljö,
 * `px-2 py-0.5 text-caption`) — men INTE `StatusBadge` självt: den bär bara
 * success/warning-toner, och en räckviddsbadge är ren METADATA (varken
 * lyckat eller varnande), samma semantiska klass som "Klass"-pillen den
 * härmar. `border-transparent` reserverar plats för `contrast-more:border`
 * utan layout-hopp — samma tre-regels-disciplin `StatusBadge.tsx` § PILL_
 * STORLEK dokumenterar.
 *
 * TEXTEN, GUNILLA-LÄSBAR: "Alla event" (rakt av) eller "<Kursfamilj> · Nivå
 * N" / "<Familj> · Alla steg" (tom-nivå-regeln, ADR-118 beslut 1 —
 * EXPLICIT utskriven i stället för underförstådd, samma "gissa aldrig eller
 * lämna tvetydigt"-linje som `Attachment`-modellens `dokumentklass: null` →
 * "Okänd").
 */
export function RackviddBadge({
  rackvidd,
  kursfamilj,
  kursniva,
}: {
  rackvidd: AttachmentScopeValue | null;
  kursfamilj: string | null;
  kursniva: string | null;
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
  if (rackvidd !== AttachmentScope.KURSTYP && rackvidd !== AttachmentScope.ALLA_EVENT) {
    return (
      <span
        className="inline-flex min-w-0 max-w-full items-center truncate rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong"
        title="Detta event"
      >
        Detta event
      </span>
    );
  }

  const text =
    rackvidd === AttachmentScope.ALLA_EVENT
      ? 'Alla event'
      : // "Okänd familj", inte "Okänd kursfamilj" — samma UI-språksbyte som
        // uppladdningsflödets Select-etikett (S107 QA-vandringen, Marcus:
        // "Kursfamilj" heter bara "Familj"). Prop-namnen `kursfamilj`/
        // `kursniva` är ORÖRDA med avsikt: de speglar Airtable-fälten, och
        // datakällans namn byts inte från en UI-copy-ändring.
        //
        // `stegEtikett` översätter basvärdet 'Nivå 1' → 'Steg 1' (Marcus
        // 2026-08-17). Mappningen bor i DokumentYta.tsx och är den ENDA
        // platsen ordet översätts — se dess docblock för den öppna
        // kollisionen mot wizardens egna "Steg 1"/"Steg 2".
        `${kursfamilj ?? 'Okänd familj'} · ${stegEtikett(kursniva) ?? 'Alla steg'}`;

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
    <span
      className="inline-flex min-w-0 max-w-full items-center truncate rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong"
      title={text}
    >
      {text}
    </span>
  );
}
