import type { ReactNode } from 'react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger,
  Popover,
  Separator,
} from 'react-aria-components';
import { cn } from '@/lib/cn';

/**
 * ═══ MENY-PRIMITIVEN — EN ⋯-KNAPP I STÄLLET FÖR EN IKONRAD ═══
 *
 * Byggd på react-aria-components `MenuTrigger` + `Popover` + `Menu` +
 * `MenuItem` + `Separator` (ADR-044: husets primitiver bor på React Aria,
 * inte på egen tangentbords-logik). Det ger utan egen kod: piltangenter upp/
 * ner, Home/End, typeahead på postens text, Escape som stänger, klick
 * utanför som stänger, och att fokus återlämnas till TRIGGER-KNAPPEN när
 * menyn stängs — det sista är den del som handbyggda menyer nästan alltid
 * tappar och som gör dem obrukbara med tangentbord.
 *
 * ── VARFÖR EN EGEN PRIMITIV OCH INTE `Select` ──
 *
 * `Select.tsx` ser snarlik ut (trigger + `Popover` + lista) men modellerar
 * ett VÄRDE som väljs och blir kvar (`ListBox`/`ListBoxItem`, roll
 * `listbox`/`option`, `data-selected`). En radmeny modellerar HANDLINGAR som
 * utförs och inte har något valt tillstånd — WAI-ARIA:s `menu`/`menuitem`,
 * alltså `Menu`/`MenuItem`. Att låna Select hade gett skärmläsaren "vald
 * option" om något som är en knapp.
 *
 * POPOVER-STYLINGEN ÄR DÄREMOT MEDVETET SPEGLAD ur `Select.tsx` (samma
 * radie, samma `p-1`, samma kant- och skugg-grammatik) — två flytande ytor i
 * samma app ska inte se ut som två olika hus.
 *
 * ── TOKEN-IDENTITETEN ÄR MÄTT, INTE ANTAGEN ──
 *
 * Popovern är `--mm-meny-popover-bg` (= `--mm-surface-overlay`, #ffffff) och
 * svävar över ytor som är `--mm-surface` (#ffffff, dokumentlistan) och
 * `--mm-bg-muted` (#f5f5f3, kortet). Mot listan är bakgrunden alltså
 * IDENTISK — separationen bärs helt av kanten (`--mm-border`, #e1e3e1) och
 * `shadow-lg`. Det är samma lösning `Select`s popover redan bär, och den är
 * medveten: en flytande yta i annan ton hade läst som ett annat
 * innehållslager. Under `prefers-contrast: more` byts kanten till
 * `--mm-border-strong`.
 *
 * Dokument-ytan har haft SEX buggar av klassen "två ytor delar token och
 * blir osynliga" (se `DokumentYta.tsx`s filhuvud). Regeln som föll ut —
 * *tokenvalet följer NÄSTLINGEN, aldrig vanan, och prövningen är en mätning
 * av `backgroundColor`* — gäller lika mycket här: flyttas menyn någonsin in
 * i en ton-satt yta måste kanten mätas om, inte antas.
 *
 * ── VARJE POST BÄR IKON **OCH** TEXT (Gunilla-principen) ──
 *
 * `MenyPost` KRÄVER både `ikon` och `children`. En ensam ikon är en gåta för
 * den som inte redan vet vad den betyder — det var precis felet den här
 * primitiven finns för att rätta (räckviddslägets fem identiska grå
 * ikonlådor per rad, prod 2026-08-29).
 */
export interface MenyProps {
  /**
   * Knappen som öppnar menyn — husets `Button`, aldrig ett naket
   * `<button>`. `MenuTrigger` kopplar `aria-haspopup`/`aria-expanded` och
   * fokus-återlämningen till just detta element.
   */
  trigger: ReactNode;
  /** `MenyPost`/`MenyAvdelare`. */
  children: ReactNode;
  /**
   * Namn på själva menylistan. Trigger-knappens etikett namnger KNAPPEN,
   * inte listan — utan detta står `menu`-noden namnlös för skärmläsaren.
   */
  etikett: string;
  /**
   * Var menyn hamnar. Default `bottom end` — högerkanten linjerar med
   * triggerns, vilket är rätt för en ⋯-knapp längst ut i en rad.
   */
  placement?: 'bottom end' | 'bottom start' | 'top end' | 'top start';
  className?: string;
}

/**
 * Meny som öppnas ur en trigger-knapp.
 *
 * @example
 * ```tsx
 * <Meny
 *   etikett={`Fler val för ${namn}`}
 *   trigger={
 *     <Button aria-label={`Fler val för ${namn}`}>
 *       <Ellipsis aria-hidden="true" size={16} />
 *     </Button>
 *   }
 * >
 *   <MenyPost ikon={<Download aria-hidden="true" size={16} />} onAction={laddaNer}>
 *     Ladda ner
 *   </MenyPost>
 *   <MenyAvdelare />
 *   <MenyPost ton="fara" ikon={<Trash2 aria-hidden="true" size={16} />} onAction={radera}>
 *     Radera
 *   </MenyPost>
 * </Meny>
 * ```
 */
export function Meny({
  trigger,
  children,
  etikett,
  placement = 'bottom end',
  className,
}: MenyProps) {
  return (
    <MenuTrigger>
      {trigger}
      <Popover
        placement={placement}
        className={cn(
          // Bredden följer innehållet men får ett golv: en meny som är
          // smalare än sin trigger läser som ett misstag.
          'min-w-48 rounded-lg border border-(--mm-meny-popover-border) bg-(--mm-meny-popover-bg) p-1 shadow-lg contrast-more:border-border-strong',
          // Samma in-/uttoning som `Modal.tsx` — och samma skäl att den inte
          // bär `motion-safe:`: base.css nollar varje `transition-duration`
          // globalt under `prefers-reduced-motion: reduce`.
          'transition-opacity duration-150 data-[entering]:opacity-0 data-[exiting]:opacity-0',
          className,
        )}
      >
        {/* ═══ VARKEN BEHÅLLAREN ELLER POSTERNA MÅLAR EN RING VID MUS ═══
            Menyn ÄR en composite-widget: fokus bor på behållaren, men
            fokus-INDIKATIONEN bärs av den markerade POSTEN, precis som
            `Select`s ListBox/option-par.

            [TASK-309.45, 2026-08-30] INDIKATIONEN ÄR TVÅDELAD, och det är
            skillnaden som gör mus-läget rätt:
              `data-[focused]`-PLATTAN — bärs ALLTID, i båda modaliteterna.
                 Den är det som visar vilken post pekaren eller piltangenten
                 står på, och den rörs aldrig av någon släckare.
              RINGEN — bara vid TANGENTBORD. Vid musöppning skript-fokuserar
                 RAC menyn, musen glider över en post, RAC flyttar fokus dit
                 (focus-follows-hover) — och webbläsaren klassar skript-fokus
                 som tangentbord. Posten matchade då `:focus-visible` utan
                 `data-focus-visible`, och den globala regeln målade en blå
                 ring mitt i en ren musinteraktion. Marcus: *"Inte okej.
                 Något är fel där."*

            SLÄCKAREN BOR I `base.css`, INTE HÄR, och det är MÄTT och inte
            valt: en Tailwind-klass kan inte vinna över den globala
            `*:focus-visible`-regeln, eftersom utilities ligger i
            `@layer utilities` och olagrad author-CSS besegrar varje lagrad
            regel oavsett specificitet. Selektorlistan täcker sedan 309.45
            BÅDE behållaren (`[role="menu"]`) och posterna
            (`[role="menuitem"]`) — se base.css för hela den uppmätta
            kedjan. `outline-none` nedan står kvar för NON-focus-visible-
            läget (RAC:s egen default-outline). */}
        <AriaMenu aria-label={etikett} className="max-h-72 overflow-auto outline-none">
          {children}
        </AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}

export interface MenyPostProps {
  /**
   * Postens ikon (lucide, 16 px, `aria-hidden`). OBLIGATORISK — men ALDRIG
   * ensam: `children` bär alltid den lästa etiketten.
   */
  ikon: ReactNode;
  /** Postens etikett — ren text, så typeahead fungerar utan `textValue`. */
  children: ReactNode;
  onAction: () => void;
  isDisabled?: boolean;
  /**
   * `fara` = destruktiv handling (Radera). Röd ton, och per konvention sist
   * i menyn efter en `MenyAvdelare` — färgen ensam är aldrig budskapet
   * (WCAG 1.4.1), texten säger vad som händer.
   */
  ton?: 'neutral' | 'fara';
  /** Typeahead-sträng när `children` inte är ren text. */
  textValue?: string;
}

/** En handling i menyn — ikon + text, aldrig bara ikon. */
export function MenyPost({
  ikon,
  children,
  onAction,
  isDisabled,
  ton = 'neutral',
  textValue,
}: MenyPostProps) {
  return (
    <AriaMenuItem
      onAction={onAction}
      isDisabled={isDisabled}
      textValue={textValue}
      className={cn(
        // `min-h-11` — samma 44 px-träffytegolv som resten av huset
        // (DESIGN-SYSTEM-SPEC.md § checklista). En menypost är lika mycket
        // en touch-yta som en knapp.
        'flex min-h-11 cursor-default items-center gap-2.5 rounded border border-transparent px-3 py-2 text-body outline-none',
        // `data-[focused]`, inte `:hover` — React Aria ger samma tillstånd åt
        // pekare, tangentbord och touch, så alla tre ser identisk återkoppling.
        'data-[disabled]:opacity-50 contrast-more:data-[focused]:border-current',
        ton === 'fara'
          ? 'text-(color:--mm-meny-post-fara-text) data-[focused]:bg-(--mm-meny-post-fara-bg-focused)'
          : 'text-(color:--mm-meny-post-text) data-[focused]:bg-(--mm-meny-post-bg-focused)',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center',
          // Ikonen ärver farotonen men står dämpad i neutralt läge — den är
          // ett igenkänningsstöd, inte radens budskap.
          ton === 'fara' ? 'text-current' : 'text-(color:--mm-meny-post-ikon)',
        )}
      >
        {ikon}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </AriaMenuItem>
  );
}

/**
 * Visuell avdelare mellan grupper av poster. `Separator` (inte en `<div>`)
 * så att den exponeras som `separator` och skärmläsaren hör gruppbytet —
 * vilket är hela poängen med att lägga Radera för sig.
 */
export function MenyAvdelare() {
  return <Separator className="my-1 h-px border-0 bg-(--mm-meny-avdelare)" />;
}
