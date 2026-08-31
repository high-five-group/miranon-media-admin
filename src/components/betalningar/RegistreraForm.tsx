import { Check } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useId, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button, Input, Select, SelectItem } from '@/components/primitives';
import { useRegistreraInbetalning } from '@/data/mutations/inbetalningar';
import { VALBARA_BETALSATT } from '@/domain/schemas';
import { beloppsFel, normaliseraBeloppKlient, visaKronor } from './belopp-inmatning';
import { beloppsutfall, harledBeloppsknappar, type InkorgsRad } from './inkorg-harledningar';

export type Betalsatt = (typeof VALBARA_BETALSATT)[number];

export type RegistreringsUtfall = {
  inbetalningId: string;
  namn: string;
  belopp: number;
  /** Lottas kryss: ska ett kvitto gå för den här inbetalningen? */
  medKvitto: boolean;
  /** True när ⌘/Ctrl+Enter eller "Registrera och skicka" användes. */
  skickaNu: boolean;
  /** Kvitteringstexten raden ska visa. */
  kvittens: string;
};

type Props = {
  rad: InkorgsRad;
  idag: string;
  betalsatt: Betalsatt;
  onBetalsatt: (b: Betalsatt) => void;
  onAvbryt: () => void;
  onKlar: (utfall: RegistreringsUtfall) => void;
};

/**
 * [TASK-346.6 AC #3, PRD § Inkorgen och formuläret] Registreringsformuläret,
 * PÅ PLATS I RADEN.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TRE HANDLINGAR, INTE SEX
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 6, ordagrant: "Som Lotta vill jag att betalsättet är förvalt
 * till det jag använde senast och datumet till i dag, så att en registrering
 * är tre handlingar." De tre är: öppna raden, tryck på ett belopp, tryck
 * Enter. Allt annat i formuläret är redan ifyllt.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * BELOPPET SKICKAS SOM RÅ STRÄNG
 * ═══════════════════════════════════════════════════════════════════════════
 * `RegistreraInbetalningInput.belopp` är en STRÄNG med avsikt: normaliseringen
 * sker server-side, där den kan bevisas hermetiskt (se schemats docblock).
 * Klientens `normaliseraBeloppKlient` används ENBART för att visa vad beloppet
 * kommer att täcka och för att ge ett felmeddelande vid fältet. Fältets råtext
 * är det som skickas, alltid.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTERINGSFÄLTET SAKNAS — MEDVETET, OCH BOKFÖRT
 * ═══════════════════════════════════════════════════════════════════════════
 * AC #3 räknar upp "notering" bland fälten. `RegistreraInbetalningInput`
 * (TASK-346.4, `Betalningar.schema.ts`) bär INGET sådant fält, och
 * `registrera-inbetalning` skriver ingen noteringskolumn. Ett fält som inte
 * kan nå servern hade varit en låtsas-kontroll: Lotta skriver, trycker Enter,
 * och texten försvinner utan ett ord. Fältet utelämnas därför, och gapet är
 * rapporterat i stället för tyst lappat — EF-ytan ägs av TASK-346.4, och en
 * ändring där ligger utanför denna skivas mandat.
 */
export function RegistreraForm({ rad, idag, betalsatt, onBetalsatt, onAvbryt, onKlar }: Props) {
  const [belopp, setBelopp] = useState('');
  const [datum, setDatum] = useState(idag);
  const [medKvitto, setMedKvitto] = useState(true);
  const [rort, setRort] = useState(false);
  const beloppRef = useRef<HTMLInputElement>(null);
  const felId = useId();

  const registrera = useRegistreraInbetalning();
  const knappar = harledBeloppsknappar(rad);
  const talet = normaliseraBeloppKlient(belopp);
  const fel = rort ? beloppsFel(belopp) : null;
  const utfall = talet !== null && talet !== 0 ? beloppsutfall(rad, talet) : null;
  const kanSpara = talet !== null && talet !== 0 && !registrera.isPending;

  function valjBelopp(varde: number) {
    setBelopp(visaKronor(varde));
    setRort(true);
    beloppRef.current?.focus();
  }

  function annatBelopp() {
    setBelopp('');
    setRort(false);
    beloppRef.current?.focus();
  }

  async function spara(skickaNu: boolean) {
    if (!kanSpara || talet === null) return;
    const resultat = await registrera.mutateAsync({
      anmalanRecordId: rad.betalning.anmalanRecordId,
      belopp,
      betalsatt,
      betalningsdatum: datum,
    });

    // KVITTENSEN LÄSER SERVERNS SVAR, ALDRIG FÄLTET. Servern normaliserar
    // beloppet och räknar om härledningen; att kvittera med det Lotta skrev
    // hade kunnat säga en annan sak än det som faktiskt sparades.
    const sparat = resultat.inbetalning.belopp;
    const saknasEfter = resultat.harledning.saknas;
    const kvittens =
      saknasEfter === null
        ? `${visaKronor(sparat)} kr registrerat.`
        : saknasEfter > 0
          ? `${visaKronor(sparat)} kr registrerat. Saknas ${visaKronor(saknasEfter)} kr.`
          : `${visaKronor(sparat)} kr registrerat. Allt betalt.`;

    onKlar({
      inbetalningId: resultat.inbetalning.id,
      namn: rad.namn,
      belopp: sparat,
      medKvitto,
      skickaNu,
      kvittens: resultat.spegel.skrivet
        ? kvittens
        : `${kvittens} Basen har inte hunnit uppdateras än.`,
    });
  }

  function vidSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void spara(false);
  }

  // ⌘/Ctrl+Enter = registrera OCH skicka (AC #3, PRD berättelse 9). Fångas på
  // formuläret och inte per fält: genvägen ska fungera var markören än står.
  function vidTangent(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void spara(true);
    }
  }

  return (
    <form
      onSubmit={vidSubmit}
      onKeyDown={vidTangent}
      aria-label={`Registrera betalning för ${rad.namn}`}
      className="flex flex-col gap-3 border-border border-t bg-surface px-3 py-3"
    >
      {knappar.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {knappar.map((knapp) => (
            <Button
              key={knapp.nyckel}
              intent="secondary"
              emphasis="outline"
              size="sm"
              onPress={() => valjBelopp(knapp.belopp)}
            >
              {visaKronor(knapp.belopp)} · {knapp.etikett}
            </Button>
          ))}
          <Button intent="ghost" size="sm" onPress={annatBelopp}>
            annat ...
          </Button>
        </div>
      )}

      <Input
        ref={beloppRef}
        label="Belopp i kronor"
        value={belopp}
        onChange={(v) => {
          setBelopp(v);
          setRort(true);
        }}
        // `decimal` och inte `numeric`: iPad ska ge decimaltecken, eftersom
        // banken visar "2 500,00" och det är precis den formen Lotta klistrar
        // in (PRD berättelse 4, AC #6 iPad-kravet).
        inputMode="decimal"
        autoComplete="off"
        placeholder="2 500,00"
        isInvalid={fel !== null}
        errorMessage={fel ?? undefined}
        aria-describedby={utfall ? felId : undefined}
      />

      {/* Vad beloppet täcker (AC #5). `role="status"` och inte `alert`: det är
          en upplysning som uppdateras medan Lotta skriver, inte ett fel.
          Regionen är ALLTID monterad så att skärmläsaren har något att
          annonsera IN i - en region som monteras samtidigt som sin text
          annonseras inte (Roselli-anatomin, se primitives/FilterRad.tsx). */}
      <p id={felId} role="status" aria-live="polite" className="min-h-5 text-small text-text-muted">
        {utfall?.text ?? ''}
      </p>

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
          label="Betalningsdatum"
          type="date"
          value={datum}
          onChange={setDatum}
          className="min-w-40 flex-1"
        />
      </div>

      {/* Rå RAC-Checkbox: huset har ingen Checkbox-primitiv, och det är en
          etablerad precedent (BorOverRad, task-18.8). Formen är kopierad ur
          `events/detail/Betalningar.tsx` § BetalKryss så att kryssen ser
          likadana ut i hela betalningsdomänen. */}
      <Checkbox
        isSelected={medKvitto}
        onChange={setMedKvitto}
        className="group flex cursor-pointer items-center gap-2 text-small"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
          <Check
            aria-hidden="true"
            size={14}
            className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
          />
        </span>
        <span>Skicka kvitto</span>
      </Checkbox>

      {registrera.isError && (
        <p role="alert" className="text-(color:--mm-input-error-text) text-small">
          {registrera.error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" isDisabled={!kanSpara} isLoading={registrera.isPending}>
          Registrera
        </Button>
        <Button
          intent="success"
          emphasis="outline"
          isDisabled={!kanSpara}
          onPress={() => void spara(true)}
        >
          Registrera och skicka
        </Button>
        <Button intent="ghost" onPress={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
