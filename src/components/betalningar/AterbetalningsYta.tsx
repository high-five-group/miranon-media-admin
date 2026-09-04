import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, MessageBox } from '@/components/primitives';
import { useJobbstatus } from '@/data/betalningar/useJobbstatus';
import { useKoaKvitton } from '@/data/mutations/inbetalningar';
import { AterbetalningsForm, type AterbetalningsUtfall } from './AterbetalningsForm';
import { type Betalsatt, lasSenasteBetalsatt, sparaBetalsatt } from './betalsatt-minne';
import { idagIso } from './idag';
import { jobbDelutfall } from './inkorg-harledningar';

type Props = {
  /** Anmälans record-ID — den enda kontext återbetalningen behöver. */
  anmalanRecordId: string;
  /**
   * [TASK-368.3] DOM-id på trigger-knappen, så en annan yta på samma sida kan
   * skicka Lotta hit i ETT tryck. Utelämnat ⇒ knappen bär inget id alls, som
   * förut. Se `ATERBETALNINGS_TRIGGER_ID` nedan för hela kontraktet.
   */
  triggerId?: string;
};

/**
 * [TASK-368.3] Det ENDA id:t huset använder för denna trigger, och därmed
 * hela kontraktet mellan avbokningssteget och återbetalningsytan.
 *
 * Avbokningssteget (`AvbokningsBetallage`) behöver kunna ge Lotta en direkt
 * väg till "Registrera återbetalning" utan att bygga en andra kopia av ytan.
 * Alternativen var att lyfta `oppen`-state ur denna komponent (en kontrollerad
 * prop bara en enda anropare skulle använda) eller att leta upp knappen på
 * dess synliga text (som bryter så fort ordvalet ändras). Ett DEKLARERAT id,
 * satt av den anropare som faktiskt vill bli hittad, är det smalaste seamet:
 * ytan förblir självständig, och den som inte skickar id:t exponerar
 * ingenting.
 *
 * SÄTTS BARA AV `AnmalansBetalningar`. Ett id måste vara unikt i dokumentet,
 * och anmälans sida är den enda vy där avbokningssteget och återbetalningsytan
 * står samtidigt. Personkortets och panelens `AterbetalningsYta` lämnar
 * propen utelämnad och kan därför aldrig kollidera.
 */
export const ATERBETALNINGS_TRIGGER_ID = 'anmalan-registrera-aterbetalning';

/**
 * [TASK-346.9 AC #3] "Registrera återbetalning" som EN ÅTERANVÄNDBAR YTA —
 * knappen, formuläret på plats, och kreditkvittots kö-anrop.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SAMMA MÖNSTER SOM `RegistreraYta` (TASK-346.7), MEDVETET EN EGEN KOMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * Fokus-retur till trigger-knappen, kvittens-raden, jobbutfallets
 * `MessageBox` vid fel — allt kopierat i FORM ur `RegistreraYta`. Se
 * `AterbetalningsForm`s docblock för varför formuläret självt inte är
 * `RegistreraForm` med en `typ`-prop: den skillnaden (inget `InkorgsRad`,
 * inga härledda belopps-knappar) är stor nog att en delad komponent hade
 * blivit en `if (typ === 'aterbetalning')`-gren rakt igenom, snarare än en
 * ren återanvändning.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "SKICKA KREDITKVITTO" KÖAS HÄR, EFTER en lyckad registrering
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma tvåstegsform som `RegistreraYta`: `registrera-inbetalning` skapar
 * raden (typ `aterbetalning`), och OM kryssrutan var ibockad köas kreditkvittot
 * med `koa-kvitton` — SAMMA jobbmotor som ett vanligt kvitto (PRD berättelse
 * 18/33, AC #3: "går via samma jobbmotor"). `jobb-konsument`/`kvittojobb.ts`
 * avgör SJÄLVA att detta blir ett kreditkvitto (negativt belopp) och vilket
 * kvitto det hänvisar till — se `_shared/kvittojobb.ts`s
 * `KvittoJobbDeps.hittaOriginalKvitto`-docstring.
 */
export function AterbetalningsYta({ anmalanRecordId, triggerId }: Props) {
  const [oppen, setOppen] = useState(false);
  const [kvittens, setKvittens] = useState<string | null>(null);
  const [betalsatt, setBetalsatt] = useState<Betalsatt>(lasSenasteBetalsatt);
  const [jobbId, setJobbId] = useState<string | undefined>(undefined);
  const idag = useMemo(idagIso, []);

  const koa = useKoaKvitton();
  const jobb = useJobbstatus(jobbId, jobbId !== undefined);

  // Fokus-retur — se `RegistreraYta`s docblock för hela anatomin.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const varOppen = useRef(false);
  const skaAterfaFokus = useRef(false);

  useEffect(() => {
    if (varOppen.current && !oppen && skaAterfaFokus.current) {
      skaAterfaFokus.current = false;
      triggerRef.current?.focus();
    }
    varOppen.current = oppen;
  }, [oppen]);

  function avbryt() {
    skaAterfaFokus.current = true;
    setOppen(false);
  }

  function vidKlar(resultat: AterbetalningsUtfall) {
    setKvittens(resultat.kvittens);
    setOppen(false);
    sparaBetalsatt(betalsatt);

    if (resultat.skickaKreditkvitto) {
      koa.mutate(
        { inbetalningIds: [resultat.inbetalningId] },
        { onSuccess: (svar) => setJobbId(svar.jobbId ?? undefined) },
      );
    }
  }

  // BARA DENNA YTAS EGET JOBB, ALDRIG DET SENASTE I APPEN — samma
  // `jobbId`-villkorade anatomi som `RegistreraYta` (mätt i acceptans-
  // vandringen 2026-08-31, se den komponentens docblock för hela förklaringen).
  const utfall = jobbId !== undefined ? jobbDelutfall(jobb.data) : null;

  return (
    <div className="flex flex-col gap-2">
      {/* KNAPPBREDDEN (designfynd 3c/4b): triggern stod tidigare som ENDA
          barnet i denna `flex flex-col`-behållare, och flex-columns default
          `align-items: stretch` sträckte den till FULL bredd — samma
          `<Button>` som `RegistreraYta`s (`intent … emphasis="outline"
          size="sm"`) blev därmed en helt annan form beroende på VILKEN
          förälder den råkade stå i, inte på avsikt. `flex flex-wrap
          items-center` runt triggern (samma rad-mönster `RegistreraYta`
          redan använder) ger knappen sin egen intrinsic bredd i BÅDA ytorna. */}
      {!oppen && (
        <div className="flex flex-wrap items-center">
          <Button
            ref={triggerRef}
            id={triggerId}
            intent="secondary"
            emphasis="outline"
            size="sm"
            onPress={() => setOppen(true)}
          >
            Registrera återbetalning
          </Button>
        </div>
      )}

      {kvittens && (
        <p role="status" className="text-small text-text-muted">
          {kvittens}
        </p>
      )}

      {koa.isError && (
        <p role="alert" className="text-(color:--mm-input-error-text) text-small">
          {koa.error.message}
        </p>
      )}

      {utfall &&
        (utfall.intent === 'warning' ? (
          <MessageBox intent="warning" title={utfall.rubrik}>
            {(jobb.data?.rader ?? [])
              .filter((jobbrad) => jobbrad.status === 'fel')
              .map((jobbrad) => jobbrad.skal ?? 'okänt skäl')
              .join('. ') || 'Raden nedan visar utfallet.'}
          </MessageBox>
        ) : (
          <p role="status" className="text-small text-text-muted">
            {utfall.rubrik}
          </p>
        ))}

      {oppen && (
        <AterbetalningsForm
          anmalanRecordId={anmalanRecordId}
          idag={idag}
          betalsatt={betalsatt}
          onBetalsatt={setBetalsatt}
          onAvbryt={avbryt}
          onKlar={vidKlar}
        />
      )}
    </div>
  );
}
