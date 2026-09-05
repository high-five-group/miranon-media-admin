import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/primitives';
import { InitialAvatar } from '@/components/primitives/InitialAvatar';
import { visaKronor } from '../belopp-inmatning';
import {
  antalRegistreradeKvitton,
  type BekraftelseRad,
  type BekraftelsestegModell,
  type Beloppsgenvag,
  markeringsSkal,
  radbelopp,
} from './bekraftelseSimulering';
import {
  BeloppInput,
  BetalsattSegment,
  DatumInput,
  InertaKvittoKnappar,
  KvittoKryss,
  RadMarken,
  RadUtfallRad,
  SaknasKontext,
} from './radfalt';

/**
 * [PROTOTYPE] Variant C — AVVIKELSE-FÖRST (S121 divergens).
 *
 * Bevisar: MINSTA ANTAL HANDLINGAR. Appen förvalar allt (belopp ur bulkvalet,
 * betalsätt = senast använda, datum = i dag) och Lotta rör bara undantagen.
 * Ett framträdande val överst — "Vad betalade de?" — sorterar raderna i två
 * högar: de som behöver hennes hand ligger öppna överst, de som är klara ligger
 * komprimerade under. När övre högen är genomgången är registreringen ett tryck.
 *
 * Svag där: sorteringen döljer rader. En rad som hamnat i "klara" på ett
 * felaktigt förval registreras utan att Lotta öppnade den — förtroendet för
 * förvalen måste vara högt. Den komprimerade högen gömmer också beloppen tills
 * hon fäller ut, vilket är motsatsen till variant B:s överblick.
 */

const VAL: { nyckel: Extract<Beloppsgenvag, 'avgift' | 'allt'>; etikett: string; under: string }[] =
  [
    { nyckel: 'avgift', etikett: 'Anmälningsavgift', under: 'de betalade sin plats' },
    { nyckel: 'allt', etikett: 'Allt som saknas', under: 'de betalade i sin helhet' },
  ];

function behoverHand(rad: BekraftelseRad): boolean {
  return (
    rad.ejGenomforbar !== null ||
    rad.inkorg.obekraftad ||
    rad.inkorg.forfallen ||
    radbelopp(rad) === null
  );
}

export function VariantC({ modell }: { modell: BekraftelsestegModell }) {
  const klart = modell.fas === 'klart';
  const aktivC = modell.aktivGenvag === 'avgift' ? 'avgift' : 'allt';

  if (klart) return <ResultatC modell={modell} />;

  const handhogen = modell.rader.filter(behoverHand);
  const klarhogen = modell.rader.filter((r) => !behoverHand(r));

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">Registrera betalningar</h1>
        <p className="text-body text-text-secondary">
          Vi har förvalt allt. Titta på raderna som behöver dig, tryck sedan Registrera.
        </p>
      </header>

      {/* ═══ DET FRAMTRÄDANDE VALET ═══ */}
      <section
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
        aria-label="Vad betalade de?"
      >
        <span className="font-semibold text-lg">Vad betalade de?</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {VAL.map((v) => {
            const vald = aktivC === v.nyckel;
            return (
              <button
                key={v.nyckel}
                type="button"
                aria-pressed={vald}
                onClick={() => modell.sattGenvag(v.nyckel)}
                className={`flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors ${
                  vald
                    ? 'border-primary bg-primary-tint'
                    : 'border-border bg-bg-muted hover:bg-bg-emphasized'
                }`}
              >
                <span className="font-semibold text-body">{v.etikett}</span>
                <span className="text-caption text-text-muted">{v.under}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-end gap-4 border-border border-t pt-3">
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-small text-text-secondary">Alla betalar med</span>
            <BetalsattSegment
              label="Betalsätt för alla rader"
              value={modell.batchBetalsatt}
              onChange={modell.sattBetalsattAlla}
              size="sm"
            />
          </div>
          <div className="w-40">
            <DatumInput
              label="Datum för alla"
              value={modell.batchDatum}
              onChange={modell.sattDatumAlla}
              size="sm"
            />
          </div>
        </div>
      </section>

      {/* ═══ BEHÖVER DIN HAND (öppen överst) ═══ */}
      <section className="flex flex-col gap-2" aria-label="Behöver din hand">
        <h2 className="flex items-center gap-2 px-1 font-semibold text-lg">
          Behöver din hand
          <span className="rounded-full bg-warning-bg px-2 py-0.5 font-medium text-caption">
            {handhogen.length}
          </span>
        </h2>
        {handhogen.length === 0 ? (
          <p className="rounded-xl bg-bg-muted px-4 py-3 text-small text-text-secondary">
            Inget behöver dig. Allt ligger klart nedanför.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {handhogen.map((rad) => (
              <HandKort
                key={rad.nyckel}
                rad={rad}
                onBelopp={(v) => modell.sattRadBelopp(rad.nyckel, v)}
                onBetalsatt={(v) => modell.sattRadBetalsatt(rad.nyckel, v)}
                onKvitto={(v) => modell.sattRadKvitto(rad.nyckel, v)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ═══ KLARA ATT REGISTRERA (komprimerad under) ═══ */}
      <section className="flex flex-col gap-2" aria-label="Klara att registrera">
        <h2 className="flex items-center gap-2 px-1 font-semibold text-lg text-text-secondary">
          Klara att registrera
          <span className="rounded-full bg-success-bg px-2 py-0.5 font-medium text-caption">
            {klarhogen.length}
          </span>
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-transparent bg-bg-muted contrast-more:border-border-strong">
          {klarhogen.map((rad) => (
            <KlarRad
              key={rad.nyckel}
              rad={rad}
              onBelopp={(v) => modell.sattRadBelopp(rad.nyckel, v)}
              onBetalsatt={(v) => modell.sattRadBetalsatt(rad.nyckel, v)}
              onKvitto={(v) => modell.sattRadKvitto(rad.nyckel, v)}
            />
          ))}
        </ul>
      </section>

      {/* ═══ PRIMÄRHANDLING (sticky, se VariantA-noten) ═══ */}
      <div className="sticky bottom-0 z-20 -mx-4 border-border border-t bg-surface/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3">
          <span className="text-small text-text-secondary">
            {modell.summering.antal} rader · {visaKronor(modell.summering.summa)} kr
          </span>
          <Button
            className="ml-auto"
            intent="secondary"
            emphasis="outline"
            isDisabled={modell.summering.antal === 0}
            onPress={modell.registrera}
          >
            Registrera och skicka
          </Button>
          <Button size="lg" isDisabled={modell.summering.antal === 0} onPress={modell.registrera}>
            {`Registrera ${modell.summering.antal}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** En rad i "Behöver din hand" — alltid öppen, full redigering. */
function HandKort({
  rad,
  onBelopp,
  onBetalsatt,
  onKvitto,
}: {
  rad: BekraftelseRad;
  onBelopp: (v: string) => void;
  onBetalsatt: (v: BekraftelseRad['betalsatt']) => void;
  onKvitto: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <InitialAvatar namn={rad.inkorg.namn} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-medium text-body">{rad.inkorg.namn}</span>
          <SaknasKontext rad={rad} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <RadMarken rad={rad} />
        </div>
      </div>
      {(rad.ejGenomforbar !== null || radbelopp(rad) === null) && (
        <p className="text-caption text-warning">{markeringsSkal(rad)}</p>
      )}
      {rad.inkorg.obekraftad && (
        <p className="text-caption text-text-muted">
          Obekräftad anmälan. Registreras som vanligt och förblir märkt.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <BeloppInput rad={rad} onChange={onBelopp} size="sm" />
        </div>
        <BetalsattSegment
          label={`Betalsätt för ${rad.inkorg.namn}`}
          value={rad.betalsatt}
          onChange={onBetalsatt}
          size="sm"
        />
        <div className="ml-auto self-center">
          <KvittoKryss checked={rad.medKvitto} onChange={onKvitto} label="Kvitto" />
        </div>
      </div>
    </div>
  );
}

/** En komprimerad "klar" rad — en rad per person, utfällbar för ändring. */
function KlarRad({
  rad,
  onBelopp,
  onBetalsatt,
  onKvitto,
}: {
  rad: BekraftelseRad;
  onBelopp: (v: string) => void;
  onBetalsatt: (v: BekraftelseRad['betalsatt']) => void;
  onKvitto: (v: boolean) => void;
}) {
  const [oppen, setOppen] = useState(false);
  const belopp = radbelopp(rad);

  return (
    <li className="flex flex-col">
      <button
        type="button"
        aria-expanded={oppen}
        onClick={() => setOppen((v) => !v)}
        className="flex items-center gap-3 p-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        <InitialAvatar namn={rad.inkorg.namn} />
        <span className="min-w-0 flex-1 truncate font-medium text-body">{rad.inkorg.namn}</span>
        <span className="text-small text-text-secondary">{rad.betalsatt}</span>
        <span className="font-medium tabular-nums">
          {belopp === null ? 'inget belopp' : `${visaKronor(belopp)} kr`}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-text-secondary motion-safe:transition-transform ${
            oppen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {oppen && (
        <div className="flex flex-wrap items-end gap-3 px-3 pb-3 pl-16">
          <div className="w-32">
            <BeloppInput rad={rad} onChange={onBelopp} size="sm" />
          </div>
          <BetalsattSegment
            label={`Betalsätt för ${rad.inkorg.namn}`}
            value={rad.betalsatt}
            onChange={onBetalsatt}
            size="sm"
          />
          <div className="self-center">
            <KvittoKryss checked={rad.medKvitto} onChange={onKvitto} label="Kvitto" />
          </div>
        </div>
      )}
    </li>
  );
}

/** Efter registrering: högarna blir "Registrerade" och "Misslyckades". */
function ResultatC({ modell }: { modell: BekraftelsestegModell }) {
  const registrerade = modell.rader.filter((r) => r.utfall?.klass === 'registrerad');
  const misslyckade = modell.rader.filter((r) => r.utfall?.klass === 'fel');

  return (
    <div className="flex flex-col gap-5 pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">Registrerat</h1>
        <p className="text-body text-text-secondary">
          {registrerade.length} registrerade
          {misslyckade.length > 0 ? `, ${misslyckade.length} misslyckades` : ''}.
        </p>
      </header>

      {misslyckade.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Misslyckades">
          <h2 className="flex items-center gap-2 px-1 font-semibold text-lg">
            Misslyckades
            <span className="rounded-full bg-warning-bg px-2 py-0.5 font-medium text-caption">
              {misslyckade.length}
            </span>
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-transparent bg-bg-muted">
            {misslyckade.map((rad) => (
              <li key={rad.nyckel} className="flex items-center gap-3 p-3">
                <InitialAvatar namn={rad.inkorg.namn} />
                <span className="min-w-0 flex-1 truncate font-medium">{rad.inkorg.namn}</span>
                <RadUtfallRad rad={rad} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2" aria-label="Registrerade">
        <h2 className="flex items-center gap-2 px-1 font-semibold text-lg">
          Registrerade
          <span className="rounded-full bg-success-bg px-2 py-0.5 font-medium text-caption">
            {registrerade.length}
          </span>
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-transparent bg-bg-muted">
          {registrerade.map((rad) => (
            <li key={rad.nyckel} className="flex items-center gap-3 p-3">
              <InitialAvatar namn={rad.inkorg.namn} />
              <span className="min-w-0 flex-1 truncate font-medium">{rad.inkorg.namn}</span>
              <RadUtfallRad rad={rad} />
            </li>
          ))}
        </ul>
      </section>

      <InertaKvittoKnappar antal={antalRegistreradeKvitton(modell.rader)} />
    </div>
  );
}
