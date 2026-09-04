import { useState } from 'react';
import { Button } from '@/components/primitives';
import { InitialAvatar } from '@/components/primitives/InitialAvatar';
import { visaKronor } from '../belopp-inmatning';
import {
  antalRegistreradeKvitton,
  type BekraftelseRad,
  type BekraftelsestegModell,
  grupperaRader,
} from './bekraftelseSimulering';
import {
  BeloppInput,
  BeloppsgenvagsKnappar,
  BetalsattSegment,
  DatumInput,
  InertaKvittoKnappar,
  KvittoKryss,
  Markering,
  RadMarken,
  RadUtfallRad,
  SaknasKontext,
} from './radfalt';

/**
 * [PROTOTYPE] Variant B — SAMMANSTÄLLNINGEN (S121 divergens).
 *
 * Bevisar: KONTROLL och TRYGGHET innan pengar bokförs. Överblicken leder — en
 * sammanställningspanel (antal, summa, summa per betalsätt, summa per event)
 * står bredvid raderna på desktop och som sticky ark i botten på iPad, och
 * bär primärknappen. Lotta ser HELHETEN — "registrerar jag verkligen 26 000
 * kr fördelat rätt?" — innan hon trycker.
 *
 * Svag där: panelen kostar plats och en extra läsning; för åtta snabba rader
 * på en lördag kan överblicken kännas som en omväg. På iPad konkurrerar
 * bottenarket med raderna om den nedre skärmhalvan.
 */
export function VariantB({ modell }: { modell: BekraftelsestegModell }) {
  const grupper = grupperaRader(modell.rader);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">Registrera betalningar</h1>
        <p className="text-body text-text-secondary">
          Granska sammanställningen till <span className="lg:hidden">nedan</span>
          <span className="hidden lg:inline">höger</span> innan du registrerar.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-6">
        {/* ═══ RADERNA SOM KORT (vänster på desktop) ═══ */}
        <div className="flex flex-col gap-5">
          {grupper.map((grupp) => (
            <section
              key={grupp.eventId}
              className="flex flex-col gap-2"
              aria-label={grupp.eventNamn}
            >
              <h2 className="flex items-baseline gap-2 px-1 font-semibold text-lg">
                {grupp.eventNamn}
                <span className="font-normal text-caption text-text-muted">
                  {grupp.eventStartdatum ?? 'utan datum'}
                </span>
              </h2>
              <div className="flex flex-col gap-2">
                {grupp.rader.map((rad) => (
                  <KortB
                    key={rad.nyckel}
                    rad={rad}
                    onBelopp={(v) => modell.sattRadBelopp(rad.nyckel, v)}
                    onBetalsatt={(v) => modell.sattRadBetalsatt(rad.nyckel, v)}
                    onKvitto={(v) => modell.sattRadKvitto(rad.nyckel, v)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ═══ SAMMANSTÄLLNINGSPANEL (höger på desktop, sticky) ═══ */}
        <aside className="hidden lg:sticky lg:top-4 lg:block">
          <Sammanstallning modell={modell} />
        </aside>
      </div>

      {/* ═══ STICKY BOTTENARK (iPad/mobil) ═══ */}
      <div className="lg:hidden">
        <BottenArk modell={modell} />
      </div>
    </div>
  );
}

/** Hela sammanställningspanelen. Desktop höger, och inuti iPad-arkets detalj. */
function Sammanstallning({ modell }: { modell: BekraftelsestegModell }) {
  const { summering, fas } = modell;
  const klart = fas === 'klart';

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-lg">Sammanställning</span>
        <span className="text-caption text-text-muted">
          {klart ? 'Registreringen är klar.' : 'Uppdateras när du ändrar en rad.'}
        </span>
      </div>

      {klart ? (
        <Resultat modell={modell} />
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2 rounded-xl bg-primary-tint px-3 py-2.5">
            <span className="text-small text-text-secondary">Att registrera</span>
            <span className="font-semibold text-2xl">{visaKronor(summering.summa)} kr</span>
          </div>

          <TalRad etikett="Antal rader" varde={`${summering.antal} st`} />
          <TalRad etikett="Kvitton" varde={`${summering.antalKvitton} st`} />

          {summering.perBetalsatt.length > 0 && (
            <SummaLista rubrik="Per betalsätt">
              {summering.perBetalsatt.map((p) => (
                <TalRad
                  key={p.betalsatt}
                  etikett={`${p.betalsatt} (${p.antal})`}
                  varde={`${visaKronor(p.summa)} kr`}
                />
              ))}
            </SummaLista>
          )}

          {summering.perEvent.length > 0 && (
            <SummaLista rubrik="Per event">
              {summering.perEvent.map((p) => (
                <TalRad
                  key={p.eventNamn}
                  etikett={`${p.eventNamn} (${p.antal})`}
                  varde={`${visaKronor(p.summa)} kr`}
                />
              ))}
            </SummaLista>
          )}

          <div className="flex flex-col gap-2 border-border border-t pt-3">
            <span className="font-medium text-small text-text-secondary">Sätt på alla rader</span>
            <BeloppsgenvagsKnappar aktiv={modell.aktivGenvag} onValj={modell.sattGenvag} />
            <BetalsattSegment
              label="Betalsätt för alla rader"
              value={modell.batchBetalsatt}
              onChange={modell.sattBetalsattAlla}
              size="sm"
            />
            <DatumInput
              label="Datum för alla"
              value={modell.batchDatum}
              onChange={modell.sattDatumAlla}
              size="sm"
            />
          </div>

          <div className="flex flex-col gap-2 border-border border-t pt-3">
            <Button
              isDisabled={summering.antal === 0}
              onPress={modell.registrera}
              className="w-full"
            >
              {`Registrera ${summering.antal}`}
            </Button>
            <Button
              intent="secondary"
              emphasis="outline"
              isDisabled={summering.antal === 0}
              onPress={modell.registrera}
              className="w-full"
            >
              Registrera och skicka
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/** Resultatvyn i panelen efter registrering. */
function Resultat({ modell }: { modell: BekraftelsestegModell }) {
  const registrerade = modell.rader.filter((r) => r.utfall?.klass === 'registrerad');
  const misslyckade = modell.rader.filter((r) => r.utfall?.klass === 'fel');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl bg-success-bg px-3 py-2">
          <div className="font-semibold text-xl">{registrerade.length}</div>
          <div className="text-caption text-text-secondary">registrerade</div>
        </div>
        <div className="flex-1 rounded-xl bg-warning-bg px-3 py-2">
          <div className="font-semibold text-xl">{misslyckade.length}</div>
          <div className="text-caption text-text-secondary">misslyckades</div>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {modell.rader
          .filter((r) => r.utfall !== null)
          .map((rad) => (
            <li key={rad.nyckel} className="flex items-center justify-between gap-2">
              <span className="truncate text-small">{rad.inkorg.namn}</span>
              <RadUtfallRad rad={rad} />
            </li>
          ))}
      </ul>
      <InertaKvittoKnappar antal={antalRegistreradeKvitton(modell.rader)} />
    </div>
  );
}

/** iPad/mobil: sticky bottenark med det viktigaste + expanderbar detalj. */
function BottenArk({ modell }: { modell: BekraftelsestegModell }) {
  const [oppen, setOppen] = useState(false);
  const { summering, fas } = modell;
  const klart = fas === 'klart';

  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-border border-t bg-surface/95 backdrop-blur">
      {oppen && (
        <div className="max-h-[60dvh] overflow-y-auto border-border border-b p-4">
          <Sammanstallning modell={modell} />
        </div>
      )}
      <div className="mx-auto flex max-w-[640px] items-center gap-3 px-4 py-3">
        <button
          type="button"
          aria-expanded={oppen}
          onClick={() => setOppen((v) => !v)}
          className="flex flex-col text-left"
        >
          <span className="font-semibold text-lg">{visaKronor(summering.summa)} kr</span>
          <span className="text-caption text-text-muted underline">
            {oppen ? 'Dölj detaljer' : `${summering.antal} rader · visa detaljer`}
          </span>
        </button>
        {!klart && (
          <Button
            className="ml-auto"
            isDisabled={summering.antal === 0}
            onPress={modell.registrera}
          >
            {`Registrera ${summering.antal}`}
          </Button>
        )}
      </div>
    </div>
  );
}

function TalRad({ etikett, varde }: { etikett: string; varde: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-small">
      <span className="text-text-secondary">{etikett}</span>
      <span className="font-medium tabular-nums">{varde}</span>
    </div>
  );
}

function SummaLista({ rubrik, children }: { rubrik: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-border border-t pt-3">
      <span className="font-medium text-caption text-text-muted uppercase tracking-wide">
        {rubrik}
      </span>
      {children}
    </div>
  );
}

function KortB({
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
          <SaknasKontext rad={rad} visaEvent={false} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <RadMarken rad={rad} />
          {rad.ejGenomforbar !== null && rad.belopp === '' && <Markering rad={rad} />}
        </div>
      </div>

      {rad.utfall !== null ? (
        <RadUtfallRad rad={rad} />
      ) : (
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
      )}
    </div>
  );
}
