import { Check, CircleCheck, TriangleAlert } from 'lucide-react';
import { Checkbox } from 'react-aria-components';
import {
  Button,
  Input,
  MessageBox,
  Select,
  SelectItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@/components/primitives';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { beloppsFel, visaKronor } from '../belopp-inmatning';
import type { Betalsatt } from '../betalsatt-minne';
import {
  BETALSATT,
  type BekraftelseRad,
  type Beloppsgenvag,
  markeringsSkal,
} from './bekraftelseSimulering';

const GENVAGAR: { nyckel: Beloppsgenvag; etikett: string }[] = [
  { nyckel: 'avgift', etikett: 'Anmälningsavgift' },
  { nyckel: 'allt', etikett: 'Allt som saknas' },
  { nyckel: 'annat', etikett: 'Annat belopp' },
];

/**
 * Beloppsgenvägarna (beslut 2): tre knappar som sätter beloppet på alla rader.
 * Delad atom — alla tre varianter erbjuder samma tre val. Vanliga knappar (inte
 * en pill-toggel) därför att valet kan vara OSATT från början och först
 * FÖRSVINNA när Lotta skriver ett eget belopp; en `disallowEmptySelection`-pill
 * kan inte uttrycka "inget val". Den aktiva genvägen bär primärvikt.
 */
export function BeloppsgenvagsKnappar({
  aktiv,
  onValj,
}: {
  aktiv: Beloppsgenvag | null;
  onValj: (g: Beloppsgenvag) => void;
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">Sätt belopp på alla rader</legend>
      {GENVAGAR.map((g) => {
        const valdd = aktiv === g.nyckel;
        return (
          <Button
            key={g.nyckel}
            size="sm"
            intent={valdd ? 'primary' : 'secondary'}
            emphasis={valdd ? 'solid' : 'outline'}
            aria-pressed={valdd}
            onPress={() => onValj(g.nyckel)}
          >
            {g.etikett}
          </Button>
        );
      })}
    </fieldset>
  );
}

/**
 * [PROTOTYPE] De SMÅ delade fältkontrollerna för bekräftelsesteget (S121).
 * Varianterna A/B/C delar dessa atomer — belopp, betalsätt, datum, kvitto,
 * utfall, markering — men komponerar dem i helt olika layouter. Uppdragets
 * gräns: "ingen delad layoutkomponent; en liten delad radkomponent … är
 * tillåten." Ingen av dessa bär layout; de bär EN kontroll var.
 */

/** Beloppsfältet. `inputMode="decimal"` för iPad (samma val som RegistreraForm). */
export function BeloppInput({
  rad,
  onChange,
  hideLabel = false,
  size = 'md',
  label = 'Belopp i kronor',
}: {
  rad: BekraftelseRad;
  onChange: (v: string) => void;
  hideLabel?: boolean;
  size?: 'sm' | 'md';
  label?: string;
}) {
  const fel = beloppsFel(rad.belopp);
  return (
    <Input
      label={label}
      hideLabel={hideLabel}
      value={rad.belopp}
      onChange={onChange}
      inputMode="decimal"
      autoComplete="off"
      placeholder="2 500"
      size={size}
      isInvalid={fel !== null}
      errorMessage={fel ?? undefined}
    />
  );
}

/** Betalsätts-segment (Swish/Bankgiro/Plusgiro). Alltid ett val (pill-toggeln). */
export function BetalsattSegment({
  value,
  onChange,
  label,
  size = 'md',
}: {
  value: Betalsatt;
  onChange: (v: Betalsatt) => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <ToggleButtonGroup<Betalsatt> label={label} selectedKey={value} onSelectionChange={onChange}>
      {BETALSATT.map((satt) => (
        <ToggleButton key={satt} id={satt} size={size}>
          {satt}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** Kompakt betalsätts-väljare för täta rader (variant A). */
export function BetalsattMiniSelect({
  value,
  onChange,
  namn,
}: {
  value: Betalsatt;
  onChange: (v: Betalsatt) => void;
  namn: string;
}) {
  return (
    <Select
      label={`Betalsätt för ${namn}`}
      hideLabel
      size="sm"
      selectedKey={value}
      onSelectionChange={(nyckel) => onChange(nyckel as Betalsatt)}
      className="w-32"
    >
      {BETALSATT.map((satt) => (
        <SelectItem key={satt} id={satt}>
          {satt}
        </SelectItem>
      ))}
    </Select>
  );
}

/** Enkelt datumfält (`type="date"` — samma som RegistreraForm). */
export function DatumInput({
  value,
  onChange,
  label,
  hideLabel = false,
  size = 'md',
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  hideLabel?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <Input
      label={label}
      hideLabel={hideLabel}
      type="date"
      value={value}
      onChange={onChange}
      size={size}
    />
  );
}

/** Kvitto-krysset — samma rå RAC-Checkbox och copy som RegistreraForm. */
export function KvittoKryss({
  checked,
  onChange,
  label = 'Skicka kvitto',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <Checkbox
      isSelected={checked}
      onChange={onChange}
      className="group flex cursor-pointer items-center gap-2 text-small"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      <span>{label}</span>
    </Checkbox>
  );
}

/** Markering på en rad vars bulk-val inte gick ihop (beslut 2). */
export function Markering({ rad }: { rad: BekraftelseRad }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-warning-bg px-2 py-0.5 font-medium text-caption contrast-more:border-warning"
      title={markeringsSkal(rad)}
    >
      <TriangleAlert aria-hidden="true" size={13} className="shrink-0 text-warning" />
      Väntar på dig
    </span>
  );
}

/** Radens saknas-kontext (eventnamn · X kr kvar att betala), inkorgens form. */
export function SaknasKontext({
  rad,
  visaEvent = true,
}: {
  rad: BekraftelseRad;
  visaEvent?: boolean;
}) {
  const { eventNamn, gallandePris, summaInbetalt } = rad.inkorg.betalning;
  const kvar = gallandePris === null ? null : gallandePris - summaInbetalt;
  return (
    <span className="text-caption text-text-muted">
      {visaEvent && eventNamn ? `${eventNamn} · ` : ''}
      {kvar === null ? 'Pris saknas i basen' : `${visaKronor(kvar)} kr kvar att betala`}
    </span>
  );
}

/** Radens tillståndsmärken (Förfallen/Obekräftad), inkorgens form. */
export function RadMarken({ rad }: { rad: BekraftelseRad }) {
  return (
    <>
      {rad.inkorg.forfallen && (
        <StatusBadge ton="warning" storlek="sm">
          Förfallen
        </StatusBadge>
      )}
      {rad.inkorg.obekraftad && (
        <StatusBadge ton="neutral" storlek="sm">
          Obekräftad
        </StatusBadge>
      )}
    </>
  );
}

/** Radens utfall efter registrering (role="status"), SwishImportens form. */
export function RadUtfallRad({ rad }: { rad: BekraftelseRad }) {
  if (rad.utfall === null) return null;
  const Ikon = rad.utfall.klass === 'fel' ? TriangleAlert : CircleCheck;
  const farg = rad.utfall.klass === 'fel' ? 'text-warning' : 'text-success';
  return (
    <p role="status" className="flex items-center gap-1.5 text-small">
      <Ikon aria-hidden="true" size={16} className={`shrink-0 ${farg}`} />
      {rad.utfall.text}
    </p>
  );
}

/**
 * De inerta kvitto-knapparna efter registrering (beslut 4): "Förhandsgranska N"
 * och "Skicka N kvitton" — gör INGENTING (prototyp). Notisen säger det rakt ut.
 *
 * `antal` är kvittona för de FAKTISKT REGISTRERADE raderna (inte `summering`,
 * som efter registreringen räknar noll registrerbara — utfallet är satt).
 * Anroparen räknar det med `antalRegistreradeKvitton`.
 */
export function InertaKvittoKnappar({ antal }: { antal: number }) {
  return (
    <div className="flex flex-col gap-3">
      <MessageBox intent="info" title="Prototyp: inget skickas">
        Knapparna nedan är avstängda i prototypen. I den skarpa ytan går kvittona genom inkorgens
        kö.
      </MessageBox>
      <div className="flex flex-wrap gap-2">
        <Button intent="secondary" emphasis="outline" isDisabled>
          {`Förhandsgranska ${antal}`}
        </Button>
        <Button intent="success" isDisabled>
          {antal === 1 ? 'Skicka 1 kvitto' : `Skicka ${antal} kvitton`}
        </Button>
      </div>
    </div>
  );
}
