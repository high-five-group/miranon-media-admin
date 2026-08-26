/**
 * BlockDialog — husets block-redigeringsdialog (Del 2 § D beslut 1, 3, 5,
 * 6). UTBRUTEN ur `GenereringsVy.tsx` (TASK-309.7, ADR-125 § 7):
 * VERBATIM flytt av dialogformen, ingen formändring — samma tre-zons
 * `ProtoDialog`, samma `BlockDialog`/`AgendaEditor`/`DatumEnkel`/`Kryss`,
 * samma `Rad`/`Override`/`AgendaRad`-kontrakt som tidigare levde inline i
 * prototypfilen (tidigare rad ~468–479, ~537, ~756–759, ~797–825,
 * ~1802–1917, ~1919–2335).
 *
 * VARFÖR EN EGEN MODUL (AC #2, TASK-309.7): Mer-sidans Eventinnehåll-yta
 * ska redigera standardtexterna "med samma block-dialog som
 * genereringsvyn — ingen andra dialogform". En kopia hade kunnat glida
 * isär från förlagan (exakt den risk `blockDefinitioner.ts` redan bokför
 * för blockkartan); denna fil är den ENDA platsen dialogformen bor.
 * `GenereringsVy.tsx` importerar härifrån i stället för sin
 * tidigare inlinade version.
 *
 * EN TILLÄGGSPUNKT MOT FÖRLAGAN (medveten, bakåtkompatibel): `caption`-
 * proppen är NY. Utelämnad (genereringsvynets egen användning, oförändrad)
 * beräknas texten EXAKT som förut — `rad.egen`/`harStandard`-grenarna
 * nedan är en ordagrann kopia. Satt (Mer-sidans ytor, som redigerar en
 * standard DIREKT och alltså inte har någon "egen kopia hos ett event"
 * att skilja från) ersätts den beräknade texten av den givna — ren
 * utökning, ingen bakåtbrytande ändring av den befintliga callern.
 */
import { type CalendarDate, parseDate } from '@internationalized/date';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Dialog as AriaDialog,
  Checkbox,
  DateField,
  DateInput,
  DateSegment,
  Heading,
  I18nProvider,
} from 'react-aria-components';
import type { BlockDef, BlockId } from '@/components/dokument/blockDefinitioner';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { TextArea } from '@/components/primitives/TextArea';
import { cn } from '@/lib/cn';

/** En agendarad — verbatim samma form som Agendapunkter-tabellens
 *  Text/Tid/Meditation. */
export type AgendaRad = { text: string; tid: string; meditation: boolean };

export type Override = { typ: 'text'; varde: string } | { typ: 'agenda'; rader: AgendaRad[] };

export type Rad = {
  def: BlockDef;
  standardText: string | null;
  standardAgenda: AgendaRad[] | null;
  egen: Override | null;
  /** Texten som gäller (egen före standard). */
  text: string | null;
  agenda: AgendaRad[] | null;
  tomt: boolean;
};

const DAG_MANAD = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });

/** "10 oktober" — som förlagan skriver sista betalningsdag. Tom sträng om inget datum. */
export function datumUtanAr(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : DAG_MANAD.format(d);
}

/**
 * Från hur många dialograder en grupp bär BLÄDDRING i stället för
 * öppna–stäng–öppna-igen.
 *
 * Marcus bokstav vid beslutet var "fler än en rad", men avsikten i samma
 * andetag var att den GODKÄNDA bekräftelsebilagan inte får röras — och dess
 * Agenda har två redigerbara rader (Dag 1, Dag 2). "Fler än en" hade alltså
 * ändrat exakt den yta villkoret fanns för att skydda. Tre är därför
 * tröskeln: med två rader kostar omvägen ETT klick, från tre växer den
 * linjärt (Praktisk information: nio).
 */
export const NAV_TROSKEL = 3;

const KRYSSRUTA_KLASS =
  'flex size-4 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-(--mm-checkbox-selected-border) group-data-[selected]:bg-(--mm-checkbox-selected-bg)';
/* Bläddringens knappar. 40 px — MÄTT lika med Avbryt/Spara (`min-h-10`), så
   knappraden får en enda baslinje; 44 px gjorde paret 4 px högre än de riktiga
   knapparna och raden ojämn. */
export const BLADDRAKNAPP_KLASS = 'size-10 shrink-0 p-0';
export const IKON_STORLEK = 16;

export function Kryss({
  vald,
  onChange,
  children,
  label,
}: {
  vald: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
  label: string;
}) {
  return (
    <Checkbox
      isSelected={vald}
      onChange={onChange}
      aria-label={children ? undefined : label}
      className="group flex cursor-pointer items-center gap-2 text-small"
    >
      <span className={KRYSSRUTA_KLASS}>
        <Check
          aria-hidden="true"
          size={12}
          className="text-(--mm-checkbox-check) opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      {children && <span className="text-text-secondary">{children}</span>}
    </Checkbox>
  );
}

/**
 * Ett enda datum — samma segment-form som husets `DatumFalt` (som är ett
 * intervall och därför inte passar här). ISO-sträng ut, så värdet kan bo i
 * samma `Override`-typ som texterna.
 */
export function DatumEnkel({
  label,
  iso,
  onChange,
  hjalp,
  faltKlass,
  autoFocus,
}: {
  label: string;
  iso: string;
  onChange: (iso: string) => void;
  hjalp?: string;
  autoFocus?: boolean;
  /** Extra klass på själva fältytan (t.ex. varningsfärg när värdet saknas). */
  faltKlass?: string;
}) {
  const segKlass =
    'rounded tabular-nums outline-none data-[focused]:bg-bg-emphasized data-[placeholder]:text-(color:--mm-input-text-placeholder)';
  let value: CalendarDate | null = null;
  try {
    value = iso ? parseDate(iso) : null;
  } catch {
    value = null;
  }
  // Svensk segmentordning (åååå-mm-dd) oavsett webbläsarens locale — samma
  // lokala I18nProvider som OmEventet sätter runt husets DatumFalt.
  return (
    <I18nProvider locale="sv-SE">
      <DateField
        aria-label={label}
        value={value}
        autoFocus={autoFocus}
        onChange={(v) => onChange(v ? v.toString() : '')}
        className="flex w-full flex-col gap-1"
      >
        <DateInput
          className={cn(
            'flex min-h-10 w-full items-center gap-0.5 rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 text-body',
            faltKlass,
          )}
        >
          {(seg) => <DateSegment segment={seg} className={segKlass} />}
        </DateInput>
        {hjalp && <span className="text-caption text-text-muted">{hjalp}</span>}
      </DateField>
    </I18nProvider>
  );
}

/**
 * Agendan som radschema med EXPLICIT typ-ruta (beslut 3, § F): punkttext ·
 * valfri tid · kryss "meditation". Ingen textsniffning — krysset styr färgen.
 */
/** Den ÖPPNA agendaradens yta — RADENS EGEN GEOMETRI, ingen utfälld panel.
 *  `py-2` (16) + fält 32 = 48 px, exakt läsradens `py-3` (24) + text 24.
 *  Δ=0, samma princip som Inforutans morf. `-mx-6`/`px-6` går kant i kant
 *  med panelen, och `border-t-transparent` släcker `divide-y`:ns linje just
 *  där, som annars skar tvärs över zonens överkant.
 *
 *  AVFÄRDAT PÅ BILD: en utfälld zon med textfältet på egen rad plus en rad
 *  med "Meditation"-text, Tid-fält, raderaknapp och en "Klar"-knapp. Fyra
 *  element med fyra visuella vikter, där den rosa raderaknappen drog mest
 *  uppmärksamhet av allt — fast det destruktiva ska synas minst. "Klar"
 *  konkurrerade dessutom med dialogens "Spara": två knappuppsättningar i
 *  samma yta gör det oklart vad som gäller. En agendapunkt har bara två
 *  värden, text och tid; den hör hemma på EN rad. */
const AGENDA_OPPEN_KLASS = '-mx-6 flex items-center gap-2 border-t-transparent px-6 py-2';

/**
 * Agendan som LÄSLISTA med redigering per rad — inte fjorton formulär på
 * en gång.
 *
 * RADHÖJDEN ÄR LÅST TILL 48 px — EN tät rad: `py-3` (24 px) + 24 px text.
 * Alla rader lika höga utan att någon av dem är halvtom.
 *
 * AVFÄRDAT PÅ BILD: en tvåradsform (text + reserverad metarad) gav också
 * lika höjd — 73 px rakt igenom — men raderna blev GLESA, eftersom
 * metaraden stod tom på tio av fjorton punkter. Lika höjd får inte köpas
 * med tomrum. Meditationen behöver ingen egen markör: punkttexten bär den
 * redan ("Meditation: Eken Plus …"), precis som i mallen. Tiden står till
 * höger, där den inte tar plats från texten.
 *
 * MEDITATION ÄR EN PUNKTTYP, INTE EN KRYSSRUTA. Den sätts när punkten
 * skapas ("Lägg till meditation") i stället för att varje rad ska bära en
 * kryssruta den nästan aldrig använder — 14 kryssrutor för 4 meditationer
 * är brus, och redigeringsraden blir smalare utan den.
 *
 * Den gamla formen monterade 42 fältkontroller samtidigt (28 `Input`, 14
 * `Kryss`) i tvåradsrader, 1301 px innehåll i en `max-h-[40vh]`-ruta som
 * kapade listan mitt i en rad. Uppmätt kostnad
 * (`test-results/matlagg.mjs`): 170 ms montering mot 44 ms för en
 * enfältsdialog — den enda innehållsberoende termen i hela mätserien.
 */
export function AgendaEditor({
  rader,
  onChange,
}: {
  rader: AgendaRad[];
  onChange: (rader: AgendaRad[]) => void;
}) {
  // Bara EN rad är öppen i taget — listan förblir läsbar medan man ändrar.
  const [oppen, setOppen] = useState<number | null>(null);
  const satt = (i: number, patch: Partial<AgendaRad>) =>
    onChange(rader.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const taBort = (i: number) => {
    onChange(rader.filter((_, j) => j !== i));
    setOppen(null);
  };
  const laggTill = (meditation: boolean) => {
    onChange([...rader, { text: '', tid: '', meditation }]);
    setOppen(rader.length);
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border border-border border-b">
        {rader.map((r, i) =>
          oppen === i ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: raderna saknar egen identitet — ordningen ÄR identiteten
            <li key={i} className={AGENDA_OPPEN_KLASS}>
              <Input
                label={`Punkt ${i + 1}`}
                hideLabel
                size="sm"
                autoFocus
                className="min-h-8 flex-1"
                placeholder={r.meditation ? 'Vilken meditation?' : 'Vad händer på punkten?'}
                value={r.text}
                onChange={(v) => satt(i, { text: v })}
              />
              <Input
                label={`Tid, punkt ${i + 1}`}
                hideLabel
                size="sm"
                className="min-h-8 w-16 shrink-0"
                placeholder="Tid"
                value={r.tid}
                onChange={(v) => satt(i, { tid: v })}
              />
              {/* Husets raderaknapp (DokumentYta.tsx:1705 — intent danger +
                  emphasis subtle), nedskalad till radens 32 px så Δ=0 håller. */}
              <Button
                intent="danger"
                emphasis="subtle"
                size="sm"
                className="size-8 shrink-0 p-0"
                aria-label={`Ta bort punkt ${i + 1}`}
                onPress={() => taBort(i)}
              >
                <Trash2 aria-hidden="true" size={14} />
              </Button>
            </li>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: raderna saknar egen identitet — ordningen ÄR identiteten
            <li key={i}>
              <button
                type="button"
                className="flex w-full items-center gap-3 py-3 text-left"
                onClick={() => setOppen(i)}
              >
                <span className="min-w-0 flex-1 truncate text-body" title={r.text}>
                  {r.text || <span className="text-text-muted">Tom punkt</span>}
                </span>
                {r.tid && <span className="shrink-0 text-caption text-text-muted">{r.tid}</span>}
                <ChevronRight aria-hidden="true" size={16} className="shrink-0 text-text-muted" />
              </button>
            </li>
          ),
        )}
      </ul>
      {/* Staplade och LIKA BREDA — `w-fit` gav två olika breda knappar under
          varandra, vilket läses som slarv. Full bredd ger dem samma vikt och
          en större träffyta.
          VÄNSTERSTÄLLDA, INTE CENTRERADE (TASK-309.28, Marcus prod-röktest
          2026-08-26): `justify-center` (ärvt från `Button`s bas-klasser)
          lät ikon+text flyta i mitten av den fullbredda knappen — långt
          till höger om agendaradernas text ovanför. `justify-start` +
          `pl-0` (nollar `size="sm"`s `px-3` bara på vänstersidan, `pr-3`
          orört) ger samma vänsterkant som radernas text: båda är MÄTTA
          till x=456 (desktop) / x=40 (375 px) — knapparnas egen box låg
          redan där, det var bara INNEHÅLLET som centrerades bort från den. */}
      <div className="flex flex-col gap-2">
        <Button
          intent="secondary"
          emphasis="outline"
          size="sm"
          className="w-full justify-start pl-0"
          onPress={() => laggTill(false)}
        >
          <Plus aria-hidden="true" size={14} />
          Lägg till punkt
        </Button>
        <Button
          intent="secondary"
          emphasis="outline"
          size="sm"
          className="w-full justify-start pl-0"
          onPress={() => laggTill(true)}
        >
          <Plus aria-hidden="true" size={14} />
          Lägg till meditation
        </Button>
      </div>
    </div>
  );
}

/**
 * Panelklassen för husets dialogform: LÅST ÖVRE KANT och bredd, höjden
 * innehållsdriven upp till ett tak — inte `Modal`-primitivens `w-fit` +
 * fritt centrerade panel.
 *
 * VARFÖR FÖRANKRAD, mätt och inte tyckt (2026-08-21,
 * `test-results/matlagg.mjs` + `matpos.mjs`, 390x844, 5 varv per dialog):
 * med primitivens default fick de nio blockdialogerna ett HÖJDSPANN på
 * 298 px (282-580) och ett POSITIONSSPANN på 149 px (top 132-281) — varje
 * dialog landade på sin egen y och skalade från sin egen mittpunkt
 * (`transform-origin` y = halva höjden, uppmätt 141/157/170/186/206/290 px).
 *
 * Samma mätning falsifierade duration-hypotesen: Hem-svepets overlay, som
 * Marcus pekar ut som FÖREBILD, mäter 406 ms från klick till klar mot en
 * enkel blockdialogs 208 ms — nästan dubbelt så långsam, och ändå den som
 * upplevs lugn. Skillnaden är att svepet är förankrat och alltid öppnar
 * likadant (358x717, top 64 i samtliga fem varv). ANKRINGEN är axeln, inte
 * hastigheten.
 *
 * AVFÄRDAT UNDER VARVET, med bild som grund: en helt LÅST höjd
 * (`h-[min(76vh,600px)]`) gav visserligen spann 0/0, men lämnade en
 * enfältsdialog med ~500 px tom yta under sitt enda fält — konsekvent och
 * fult. Ankringen ger samma stabila startpunkt utan tomrummet: dialogen
 * växer nedåt från en fast kant och slutar där innehållet slutar.
 */
/**
 * ETT panelmått för HELA bilageredigeringen — samma dialog för löptexten,
 * agendorna och ämnesstyckena, i båda mallarna. Marcus, varv 16: *"EXAKT
 * samma modal överallt i bilageediteringen."*
 *
 * LÅST HÖJD, inte bara låst överkant. Varv 3 låste övre kanten och mätte
 * positionsspannet 149 → 0 px — men NEDRE kanten flöt fortfarande med
 * innehållet, så knappraden hoppade vid varje steg i bläddringen och pekaren
 * måste flyttas om för varje klick. `min(80vh, 680px)` är det största som
 * ryms under ankarpunkten (`clamp(2rem, 12vh, 7rem)` ≈ 101 px vid 844 px
 * höjd) med marginal kvar nedtill, och ligger i nivå med Hem-svepets
 * `max-h-[90vh]` i stället för det tidigare 600 px-taket.
 *
 * Tomrummet som fällde en fast höjd i varv 3 (*"~500 px tom yta under sitt
 * enda fält"*) uppstår inte: innehållet FYLLER panelen — textrutan via
 * `flex-1`, agendan genom att rulla i sin egen yta.
 *
 * `h-` OCH `max-h-` med samma värde: `h-` ensamt är bara en önskan när ett
 * ärvt `max-h` (primitivens `max-h-[85vh]`) ligger under.
 */
export const DIALOG_PANEL_KLASS =
  'flex h-[min(80vh,680px)] max-h-[min(80vh,680px)] w-(--mm-dialog-width-lg) max-w-full origin-top flex-col overflow-hidden';

/** Fast avstånd till viewportens överkant — dialogens ankarpunkt. Sätts via
 *  `style` på `Modal`, eftersom scrimmens `items-center` är hårdkodad i
 *  primitiven (`Modal.tsx:32-34`) och inte kan nås med `className`. Samma
 *  väg som `Hem.tsx:93` redan använder för scrim-färgen. */
export const DIALOG_ANKARE = {
  alignItems: 'flex-start',
  paddingTop: 'clamp(2rem, 12vh, 7rem)',
} as const;

/**
 * Husets dialogform i tre zoner — prövad här före promovering (ADR-103).
 *
 * Rubriken och knappraden STÅR STILLA; bara bodyn rullar. Rubriken hamnar
 * därmed på exakt samma pixel i varje dialog (ankringen ovan), och
 * knappraden ligger alltid direkt under innehållet i stället för att
 * flyta i ett tomrum.
 *
 * Panelen bär `overflow-hidden` (se `DIALOG_PANEL_KLASS`) i stället för
 * primitivens `overflow-auto`, annars rullar rubrik och knappar ut ur bild
 * tillsammans med innehållet. Den dubbelrullningen — panelen OCH en inre
 * `max-h-[40vh]`-lista — var precis det som klippte agendan mitt i en rad.
 *
 * `Heading slot="title"` behålls ur primitiven: den ger `aria-labelledby`
 * automatiskt (KVALITETSDEFINITIONER checklist 6.1).
 */
export function ProtoDialog({
  title,
  meta,
  children,
  actions,
  navigering,
  rullNyckel,
  ariaDescription,
}: {
  title: string;
  /** Liten text i rubrikens högerkant — positionen i en bläddring. */
  meta?: ReactNode;
  children: ReactNode;
  actions: ReactNode;
  /** Bläddringen. Vänsterställd i knappraden, mot `actions` — den kostar
   *  därmed ingen höjd i en panel vars tak redan är mätt (600 px). */
  navigering?: ReactNode;
  /** Byter värde när bodyn byter innehåll; rullytan går då till toppen. */
  rullNyckel?: string;
  ariaDescription?: string;
}) {
  const rullRef = useRef<HTMLDivElement>(null);
  // Sant bara nar det FINNS orullat innehall nedanfor — se uttoningen nedan.
  const [merNedanfor, setMerNedanfor] = useState(false);

  useEffect(() => {
    const el = rullRef.current;
    if (!el) return;
    const mat = () =>
      setMerNedanfor(Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight - 1);
    mat();
    el.addEventListener('scroll', mat, { passive: true });
    // Innehallet andrar hojd nar en agendarad oppnas/stangs — ResizeObserver
    // pa rullytan fangar det utan att varje konsument behover rapportera in.
    const ro = new ResizeObserver(mat);
    ro.observe(el);
    for (const barn of Array.from(el.children)) ro.observe(barn);
    return () => {
      el.removeEventListener('scroll', mat);
      ro.disconnect();
    };
  }, []);

  /* Bläddringen byter innehåll i en panel som står kvar. Utan detta ärver
     nästa fält föregående rullposition och öppnas mitt i sin egen text.
     Nyckeln LÄSES i effekten, inte bara listas som beroende: en dialog utan
     bläddring har ingen nyckel och ska då inte rulla någonstans alls. */
  useEffect(() => {
    if (rullNyckel === undefined) return;
    rullRef.current?.scrollTo({ top: 0 });
  }, [rullNyckel]);

  return (
    <AriaDialog
      aria-description={ariaDescription}
      className="flex min-h-0 w-full flex-1 flex-col p-6 outline-none"
    >
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <Heading slot="title" className="min-w-0 text-xl">
          {title}
        </Heading>
        {meta}
      </div>
      {/* -mx-6 + px-6: rullytans kant gar ut till panelkanten sa den lasas
          som en yta, medan innehallet behaller dialogens padding.
          Uttoningen gor en avskuren rad till en SIGNAL ("det finns mer") i
          stallet for ett renderingsfel — utan den klipptes agendans nionde
          punkt mitt i sin textrad. Den ar MATT villkorad, inte alltid pa:
          med innehallsdriven panelhojd slutar innehallet exakt vid
          rullytans nederkant nar det far plats, sa en ovillkorad mask hade
          tonat ut sista raden i VARJE dialog. */}
      <div
        ref={rullRef}
        className="scrollbar-inline -mx-6 mt-4 min-h-0 flex-1 overflow-y-auto px-6 text-body"
        style={
          merNedanfor
            ? { maskImage: 'linear-gradient(to bottom, black calc(100% - 1.5rem), transparent)' }
            : undefined
        }
      >
        {children}
      </div>
      {/* justify-between med en tom platshållare när bläddring saknas: utan
          navigering ligger knapparna kvar exakt där de låg förut (höger). */}
      <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-border border-t pt-4">
        {navigering ?? <span aria-hidden="true" />}
        <span className="flex items-center gap-3">{actions}</span>
      </div>
    </AriaDialog>
  );
}

export function BlockDialog({
  rad,
  ort,
  somStandard,
  syskon,
  caption,
  resterandeBeloppHjalp,
  onVaxla,
  onSpara,
  onStang,
}: {
  rad: Rad;
  ort: string | null;
  somStandard: boolean;
  /** Gruppens dialograder när den bär bläddring — annars tom. */
  syskon: Rad[];
  /** [TASK-309.7] Ersätter den beräknade hjälptexten under fältet — för en
   *  caller som redigerar en standard DIREKT (Mer-sidans Eventinnehåll/
   *  Platser-ytor) och alltså saknar "egen text hos ett event" att skilja
   *  från. Utelämnad: exakt samma beräkning som förlagan alltid bar. */
  caption?: ReactNode;
  /** [TASK-309.7] `sistaBetalningsdag`-blockets (`def.datum`) hjälptext
   *  citerar "Resterande <belopp> betalas senast …" — beloppet är
   *  callerns fixtur/data (`EVENTINNEHALL.resterandeBelopp` i
   *  genereringsvyn), inte något denna delade dialog kan känna till.
   *  Blocket har `kalla: 'event'` och nås aldrig av Mer-sidans
   *  Eventinnehåll-/Platser-ytor (de redigerar bara `eventinnehall`-/
   *  `plats`-kalla block) — propen är därför optional. */
  resterandeBeloppHjalp?: string | null;
  /** Lämna raden för en annan: utkastet skrivs, dialogen står kvar. */
  onVaxla: (id: BlockId, nytt: Override | null, blirStandard: boolean) => void;
  onSpara: (nytt: Override | null, blirStandard: boolean) => void;
  onStang: () => void;
}) {
  const { def } = rad;
  const harStandard = rad.standardText != null || rad.standardAgenda != null;

  // Utkastet startar från det som gäller (egen text före standard).
  const [text, setText] = useState(rad.text ?? '');
  const [agenda, setAgenda] = useState<AgendaRad[]>(
    rad.egen?.typ === 'agenda' ? rad.egen.rader : (rad.standardAgenda ?? []),
  );
  const [blirStandard, setBlirStandard] = useState(somStandard);

  /* Bläddringen byter RAD i en dialog som står kvar monterad. Utkastet måste
     följa med — men en remount (`key`) hade slagit ut fokus från bläddrings-
     knappen mitt i en tangentbordsgenomgång, och det är just den genomgången
     mekanismen finns för. React-mönstret "adjusting state when props change"
     byter värdena under render i stället, med DOM:en och fokus kvar. */
  const [visadeId, setVisadeId] = useState(def.id);
  if (visadeId !== def.id) {
    setVisadeId(def.id);
    setText(rad.text ?? '');
    setAgenda(rad.egen?.typ === 'agenda' ? rad.egen.rader : (rad.standardAgenda ?? []));
    setBlirStandard(somStandard);
  }

  /** Utkastet som ett värde — samma beräkning oavsett om raden lämnas via
   *  Spara eller via bläddringen, så de två vägarna aldrig kan glida isär. */
  const utkast = (): { nytt: Override | null; blirStandard: boolean } => {
    if (def.agenda) {
      return {
        nytt: { typ: 'agenda', rader: agenda.filter((r) => r.text.trim()) },
        blirStandard: false,
      };
    }
    // Samma text som standarden = ingen egen text (följer standarden igen).
    const nytt: Override | null =
      rad.standardText != null && text === rad.standardText ? null : { typ: 'text', varde: text };
    return { nytt, blirStandard: blirStandard && !!text.trim() };
  };

  const sparaUtkast = () => {
    const u = utkast();
    onSpara(u.nytt, u.blirStandard);
  };

  /* Bläddringen går genom HELA gruppen, inte bara de tomma: annars gick det
     inte att vända tillbaka till något man just fyllt i. Vägen till nästa
     tomma är gruppens egen ingång, ovanför listan. */
  const platsINav = syskon.findIndex((s) => s.def.id === def.id);
  const harNav = syskon.length >= NAV_TROSKEL && platsINav >= 0;
  const forra = harNav ? syskon[platsINav - 1] : undefined;
  const nasta = harNav ? syskon[platsINav + 1] : undefined;
  const gaTill = (mal: Rad | undefined) => {
    if (!mal) return;
    const u = utkast();
    onVaxla(mal.def.id, u.nytt, u.blirStandard);
  };

  return (
    <ProtoDialog
      title={def.etikett}
      rullNyckel={def.id}
      meta={
        harNav ? (
          <span className="shrink-0 text-caption text-text-muted tabular-nums">
            {platsINav + 1} av {syskon.length}
          </span>
        ) : undefined
      }
      navigering={
        harNav ? (
          /* `ghost` = husets NEUTRALA platta. Listans ikonknapp bär
             `intent="primary"` eftersom den är radens enda handling; här står
             paret bredvid Spara, och två primärtonade vikter i samma rad gör
             navigationen lika tung som handlingen den ska tjäna.
             gap-0.5 håller pilarna som EN kontroll, inte två knappar. */
          <span className="flex items-center gap-0.5">
            <Button
              intent="ghost"
              className={BLADDRAKNAPP_KLASS}
              isDisabled={!forra}
              aria-label={forra ? `Föregående: ${forra.def.etikett}` : 'Föregående fält'}
              onPress={() => gaTill(forra)}
            >
              <ChevronLeft aria-hidden="true" size={IKON_STORLEK} />
            </Button>
            <Button
              intent="ghost"
              className={BLADDRAKNAPP_KLASS}
              isDisabled={!nasta}
              aria-label={nasta ? `Nästa: ${nasta.def.etikett}` : 'Nästa fält'}
              onPress={() => gaTill(nasta)}
            >
              <ChevronRight aria-hidden="true" size={IKON_STORLEK} />
            </Button>
          </span>
        ) : undefined
      }
      actions={
        <>
          <Button intent="secondary" emphasis="outline" onPress={onStang}>
            Avbryt
          </Button>
          <Button intent="primary" onPress={sparaUtkast}>
            Spara
          </Button>
        </>
      }
    >
      <div className="flex h-full flex-col gap-4">
        {def.agenda ? (
          <AgendaEditor rader={agenda} onChange={setAgenda} />
        ) : def.datum ? (
          <DatumEnkel
            label={def.etikett}
            iso={text}
            onChange={setText}
            hjalp={`I bilagan: "Resterande ${resterandeBeloppHjalp ?? ''} betalas senast ${
              datumUtanAr(text) || '…'
            }. Anmälan är bindande."`}
          />
        ) : (
          /* Loptexten: rutan FYLLER dialogens body och rullar I SIG SJALV,
               sa rullisten sitter dar texten ar — inte utanfor rutan.
               Tva matta felsteg bakom den har formen:
               (1) `max-h-none` rakt pa `className` gjorde INGENTING (falt
                   256 px mot 1288 px innehall) — primitivens `className` gar
                   till TextField-WRAPPERN, `<textarea>` far bara
                   `textAreaVariants(...)`. Darav barnvarianterna.
               (2) `autoGrow` utan tak lat rutan vaxa till 1288 px inuti en
                   600 px dialog, sa DIALOGEN rullade och rullisten hamnade
                   utanfor textrutan. Nu ar det tvartom.
               `whitespace-pre-wrap` bevarar styckesbrytningarna ur mallen —
               utan den blir Rogers tre stycken en enda klump. */
          <TextArea
            label={def.etikett}
            hideLabel
            /* Panelen har låst höjd, så rutan TAR RESTEN av den — ett enda
               läge för alla textfält, i båda mallarna.
               `flex-1 min-h-0`, inte `h-full`: rutan har syskon under sig i
               samma flex-kolumn (kryssrutan, hjälptexten), och `h-full` hade
               krävt hela höjden av dem också.
               Två MÄTTA felsteg bakom barnvarianterna:
               (1) `max-h-none` rakt på `className` gjorde INGENTING (föll
                   256 px mot 1288 px innehåll) — primitivens `className` går
                   till TextField-WRAPPERN, `<textarea>` får bara
                   `textAreaVariants(...)`.
               (2) `autoGrow` utan tak lät rutan växa till 1288 px inuti en
                   600 px dialog, så DIALOGEN rullade och rullisten hamnade
                   utanför textrutan. Nu är det tvärtom: rutan rullar i sig
                   själv, rullisten sitter där texten är.
               `whitespace-pre-wrap` bevarar styckesbrytningarna ur mallen —
               utan den blir Rogers tre stycken en enda klump. */
            autoGrow={false}
            className="min-h-0 flex-1 [&_textarea]:h-full [&_textarea]:max-h-none [&_textarea]:min-h-0 [&_textarea]:resize-none [&_textarea]:whitespace-pre-wrap [&_textarea]:leading-relaxed"
            value={text}
            onChange={setText}
            rows={def.kalla === 'event' || def.id === 'plats' ? 2 : 5}
            placeholder={def.id === 'plats' ? 'Gatuadress och ort' : undefined}
          />
        )}

        {def.platsFalt && ort && (
          <Kryss
            label={`Använd som standard för ${ort}`}
            vald={blirStandard}
            onChange={setBlirStandard}
          >
            Använd som standard för {ort} framöver
          </Kryss>
        )}

        <div className="flex items-start justify-between gap-3">
          <p className="text-caption text-text-muted">
            {caption !== undefined
              ? caption
              : rad.egen
                ? 'Egen text för det här eventet. Ändras standarden senare påverkas inte eventet.'
                : harStandard
                  ? 'Följer standarden. Ändras standarden senare markeras bilagan som inaktuell.'
                  : 'Ingen standard finns. Texten gäller bara det här eventet om du inte använder den som standard.'}
          </p>
          {rad.egen && harStandard && (
            <Button
              intent="secondary"
              emphasis="outline"
              size="sm"
              className="shrink-0"
              onPress={() => onSpara(null, false)}
            >
              Återgå till standard
            </Button>
          )}
        </div>
      </div>
    </ProtoDialog>
  );
}
