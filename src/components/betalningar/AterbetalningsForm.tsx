import { Check } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button, Input, Select, SelectItem } from '@/components/primitives';
import { useRegistreraInbetalning } from '@/data/mutations/inbetalningar';
import { VALBARA_BETALSATT } from '@/domain/schemas';
import { beloppsFel, normaliseraBeloppKlient, visaKronor } from './belopp-inmatning';
import type { Betalsatt } from './betalsatt-minne';

export type AterbetalningsUtfall = {
  inbetalningId: string;
  /** Absolutbeloppet Lotta skrev, för kvittensen — den negativa signeringen sker server-side. */
  belopp: number;
  /** Lottas kryss: ska ett kreditkvitto köas direkt? */
  skickaKreditkvitto: boolean;
  kvittens: string;
};

type Props = {
  anmalanRecordId: string;
  idag: string;
  betalsatt: Betalsatt;
  onBetalsatt: (b: Betalsatt) => void;
  onAvbryt: () => void;
  onKlar: (utfall: AterbetalningsUtfall) => void;
};

/**
 * [TASK-346.9 AC #3] Återbetalningsformuläret — 'Registrera återbetalning'
 * på anmälan/rad.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EGEN, MINDRE KOMPONENT — INTE `RegistreraForm` MED EN `typ`-PROP
 * ═══════════════════════════════════════════════════════════════════════════
 * `RegistreraForm` (TASK-346.6) är byggd kring `InkorgsRad` (härledda
 * belopps-knappar ur eventets pris, "Skicka kvitto"-kryss, ⌘/Ctrl+Enter för
 * "registrera och skicka i ett tryck"). En återbetalning har inget naturligt
 * "härlett belopp" att erbjuda som knapp — Lotta skriver alltid det verkliga
 * återbetalda beloppet för hand — och kan gälla en anmälan som INTE längre
 * har ett öppet belopp (`InkorgsRad` existerar bara för öppna betalningar,
 * se `hamta-oppna-betalningar/index.ts`). Att tvinga återbetalningen genom
 * `RegistreraForm`s `rad`-krav hade gjort knappen osynlig exakt när den
 * oftast behövs: efter att en anmälan redan är fullbetald och sedan
 * avbokas. Formuläret tar därför bara `anmalanRecordId` direkt.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TECKNET SÄTTS AV SERVERN, INTE HÄR — SAMMA REGEL SOM `RegistreraForm`
 * ═══════════════════════════════════════════════════════════════════════════
 * Lotta skriver ett POSITIVT belopp ("1500"); `registrera-inbetalning`
 * negerar det när `typ: 'aterbetalning'` (samma skäl som där: en teknisk
 * detalj som inte ska ligga i hennes händer, och
 * `inbetalningar_tecken_foljer_typ` hade fällt ett felaktigt tecken med ett
 * rått databasfel i stället för ett begripligt meddelande).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "SKICKA KREDITKVITTO" ÄR FÖRBOCKAD — AC #3, ORDAGRANT
 * ═══════════════════════════════════════════════════════════════════════════
 * "'Registrera återbetalning' på anmälan/rad skapar negativ inbetalning
 * ... med ruta 'Skicka kreditkvitto' förbockad." Kryssrutans värde skickas
 * INTE till `registrera-inbetalning` (den EF:en känner ingen "skicka
 * kvitto"-parameter, se `RegistreraForm`s eget "NOTERINGSFÄLTET"-stycke för
 * samma mönster) — det är `AterbetalningsYta` som, efter en lyckad
 * registrering, avgör om `koa-kvitton` ska anropas.
 */
export function AterbetalningsForm({
  anmalanRecordId,
  idag,
  betalsatt,
  onBetalsatt,
  onAvbryt,
  onKlar,
}: Props) {
  const [belopp, setBelopp] = useState('');
  const [datum, setDatum] = useState(idag);
  const [skickaKreditkvitto, setSkickaKreditkvitto] = useState(true);
  const [rort, setRort] = useState(false);
  const beloppRef = useRef<HTMLInputElement>(null);

  const registrera = useRegistreraInbetalning();

  // Fokus in vid öppning — samma anatomi som `RegistreraForm`: formuläret
  // ERSÄTTER trigger-knappen i DOM:en, så utan detta faller fokus till
  // `document.body`. Ingen belopps-knapp finns här (se docblocket ovan) —
  // fältet är alltid målet.
  useEffect(() => {
    beloppRef.current?.focus();
  }, []);

  const talet = normaliseraBeloppKlient(belopp);
  const fel = rort ? beloppsFel(belopp) : null;
  const kanSpara = talet !== null && talet !== 0 && !registrera.isPending;

  async function spara() {
    if (!kanSpara || talet === null) return;
    const resultat = await registrera.mutateAsync({
      anmalanRecordId,
      typ: 'aterbetalning',
      belopp,
      betalsatt,
      betalningsdatum: datum,
      // [TASK-367 review runda 1, FYND 2] `skickaKreditkvitto` ÄR denna
      // ytans "Skicka kvitto"-motsvarighet (samma roll som `medKvitto` i
      // `RegistreraForm.tsx`, bara döpt efter vad som faktiskt skickas —
      // ett KREDITkvitto, inte ett vanligt). Ett `false` här ska stänga av
      // den durabla "kvitto att skicka"-härledningen för denna rad precis
      // som för en vanlig registrering.
      medKvitto: skickaKreditkvitto,
    });

    // KVITTENSEN LÄSER SERVERNS SVAR (samma disciplin som `RegistreraForm`):
    // beloppet Lotta skrev normaliseras och negeras server-side, och
    // `Math.abs` här är bara för att visa "1 500 kr", inte "-1 500 kr" —
    // återbetalningen SPARAS med rätt tecken oavsett vad kvittensen visar.
    const sparat = Math.abs(resultat.inbetalning.belopp);
    onKlar({
      inbetalningId: resultat.inbetalning.id,
      belopp: sparat,
      skickaKreditkvitto,
      kvittens: resultat.spegel.skrivet
        ? `Återbetalning på ${visaKronor(sparat)} kr registrerad.`
        : `Återbetalning på ${visaKronor(sparat)} kr registrerad. Basen har inte hunnit uppdateras än.`,
    });
  }

  function vidSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void spara();
  }

  // ESC = AVBRYT — samma "alla vägar ut"-krav som `RegistreraForm` följer
  // (`Deltagare.tsx`s etablerade mönster). `stopPropagation` av samma skäl:
  // Esc är en delad genväg som annars fortsätter uppåt i DOM:en.
  function vidTangent(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onAvbryt();
    }
  }

  return (
    <form
      onSubmit={vidSubmit}
      onKeyDown={vidTangent}
      aria-label="Registrera återbetalning"
      className="flex flex-col gap-3 border-border border-t bg-surface px-3 py-3"
    >
      <Input
        ref={beloppRef}
        label="Återbetalat belopp i kronor"
        description="Skriv beloppet positivt: appen bokför det som en återbetalning."
        value={belopp}
        onChange={(v) => {
          setBelopp(v);
          setRort(true);
        }}
        inputMode="decimal"
        autoComplete="off"
        placeholder="1 500,00"
        isInvalid={fel !== null}
        errorMessage={fel ?? undefined}
      />

      <div className="flex flex-wrap gap-3">
        <Select
          label="Betalsätt"
          selectedKey={betalsatt}
          onSelectionChange={(nyckel) => onBetalsatt(nyckel as Betalsatt)}
          className="min-w-40 flex-1"
        >
          {VALBARA_BETALSATT.map((satt) => (
            <SelectItem key={satt} id={satt}>
              {satt}
            </SelectItem>
          ))}
        </Select>
        <Input
          label="Återbetalningsdatum"
          type="date"
          value={datum}
          onChange={setDatum}
          className="min-w-40 flex-1"
        />
      </div>

      {/* Rå RAC-Checkbox — samma form som `RegistreraForm`s "Skicka kvitto",
          kopierad ur `events/detail/Betalningar.tsx` § BetalKryss. */}
      <Checkbox
        isSelected={skickaKreditkvitto}
        onChange={setSkickaKreditkvitto}
        className="group flex cursor-pointer items-center gap-2 text-small"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
          <Check
            aria-hidden="true"
            size={14}
            className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
          />
        </span>
        <span>Skicka kreditkvitto</span>
      </Checkbox>

      {registrera.isError && (
        <p role="alert" className="text-(color:--mm-input-error-text) text-small">
          {registrera.error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" isDisabled={!kanSpara} isLoading={registrera.isPending}>
          Registrera återbetalning
        </Button>
        <Button intent="ghost" onPress={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
