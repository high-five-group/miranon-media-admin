import { AlertTriangle, ChevronDown, Clock } from 'lucide-react';
import { useId, useState } from 'react';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { AterbetalningsYta } from './AterbetalningsYta';
import { visaKronor } from './belopp-inmatning';
import { InbetalningsLista } from './InbetalningsLista';
import type { InkorgsRad } from './inkorg-harledningar';
import { RegistreraYta } from './RegistreraYta';

type Props = {
  /** Anmälans record-ID, nyckeln till dess inbetalningar. */
  anmalanRecordId: string;
  /** Personens namn, för fällknappens tillgängliga etikett. */
  namn: string;
  /**
   * Radens plats i den globala listan över öppna betalningar, eller `null`
   * när anmälan INTE är öppen enligt basen.
   */
  rad: InkorgsRad | null;
};

/**
 * [TASK-346.7 AC #2] Betalningsblocket för EN person i Åtgärds-sidans panel
 * "Pricka av och notera".
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD BLOCKET LÄGGER TILL, OCH VAD DET INTE RÖR
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD § Ytorna (beslut 10): "Åtgärds-sidans panel: saknas-belopp, Registrera
 * betalning (samma formulär, förvald person), inbetalningsrader med
 * kvittostatus; kryssen flippas inte längre för hand."
 *
 * Kryssen och noteringsfälten bor kvar i `AtgardsSida.tsx` och rörs inte av
 * denna komponent - den monteras UNDER dem. Noteringarna är uttryckligen
 * kvar (AC #2), och kryssen blir läsande där de står.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `rad === null` ÄR ETT RIKTIGT LÄGE, INTE ETT FEL
 * ═══════════════════════════════════════════════════════════════════════════
 * `hamta-oppna-betalningar` returnerar bara anmälningar där basens
 * `Saknas (kr) > 0`. En fullbetald person har därför ingen rad, och det är
 * rätt svar: det finns inget öppet att registrera mot.
 *
 * MEN LÄGET ÄR TVETYDIGT, och tvetydigheten döljs inte. `Saknas (kr)` är
 * BLANK när basens formel inte kan räkna fram ett pris - och `BLANK() > 0`
 * är falskt i Airtable, så en anmälan med OKÄNT pris faller ur listan på
 * exakt samma sätt som en fullbetald. EF:ens eget filhuvud namnger fönstret
 * (`hamta-oppna-betalningar/index.ts` § TVÅ PRISNIVÅER I BASEN): ett event
 * vars pris bara finns i Eventinnehåll-standarden har ett känt pris i appen
 * men BLANK i basen.
 *
 * Texten sade därför länge "Inget öppet belopp enligt basen" i stället för
 * att påstå "Allt betalt". Att gissa vilket av de två fallen som gäller hade
 * krävt priset, som denna yta inte har - och att påstå det starkare av dem
 * hade varit att hitta på. Fönstret stängs av DATA (pris-backfillen,
 * TASK-346.8), inte av en gissning här.
 *
 * MARCUS DOM 2026-09-01 BYTTE ORDEN, och vad det kostar sägs rakt ut:
 * *"'enligt basen' är tekniksvenska - får inte nå Lotta."* Strängen är nu
 * "Inget kvar att betala". Hedgen är därmed TUNNARE - texten pekar inte
 * längre ut basen som den som talar - men den är inte borta: de två lägena
 * har fortfarande OLIKA meningar ("Inget kvar att betala" vid `rad === null`,
 * "Allt betalt" vid ett känt, fullbetalt pris), så ytan påstår aldrig det
 * starkare av dem om ett okänt pris. Att Lotta förstår raden vägde tyngre än
 * att den bar sin egen epistemologi (Gunilla-principen). Den fulla
 * tvetydigheten bor kvar här, i koden, och stängs fortfarande av DATA.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INBETALNINGARNA HÄMTAS FÖRST NÄR RADEN FÄLLS UT
 * ═══════════════════════════════════════════════════════════════════════════
 * Panelen kan visa tjugo personer. En läsning per person vid öppning hade
 * blivit tjugo Edge Function-anrop, var och en med en Airtable-läsning i
 * sig, mot ett tak som DELAS med Lottas egna klick och automationerna A1-A11
 * (ADR-063 § S91-not). `InbetalningsLista` får därför `aktiv` först när
 * fällningen är öppen.
 */
export function PanelBetalningar({ anmalanRecordId, namn, rad }: Props) {
  const [oppen, setOppen] = useState(false);
  const panelId = useId();

  const saknas = rad === null ? null : (rad.kvar ?? rad.betalning.saknas);

  return (
    /* INGEN EGEN ÖVERKANT: blocket monteras som barn i Åtgärds-panelens
       `divide-y`-behållare, som redan ritar avdelaren mellan raderna. En
       egen `border-t` här hade gett två linjer på samma plats. */
    <div className="flex flex-col gap-2 py-3">
      {/* [TASK-346.14, designfynd 4b] Samma viktade radform som
          `AnmalansBetalningar.tsx` § "SAKNAS X KR" — det öppna beloppet är
          NYCKELTALET (Marcus ordagrant) och får radstrukturens vikt
          (etikett dämpad vänster, värdet högerställt och `font-semibold`).
          De två lugna lägena (null/allt betalt) förblir enkel text. */}
      {saknas !== null && saknas > 0 ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-small text-text-muted">Kvar att betala</span>
          <span className="text-right font-semibold text-body">{`${visaKronor(saknas)} kr`}</span>
        </div>
      ) : (
        <span className="text-small text-text-muted">
          {saknas === null ? 'Inget kvar att betala' : 'Allt betalt'}
        </span>
      )}

      {(rad?.forfallen || rad?.spegelSlapar) && (
        <div className="flex flex-wrap items-center gap-2 text-small">
          {rad?.forfallen && (
            /* SAMMA PILL SOM INKORGEN, NU BOKSTAVLIGT (Marcus dom 2026-09-01).
               Raden bar tidigare en handrullad KOPIA av inkorgens span — samma
               klasser, två ställen — med noten att "de två ytorna visar SAMMA
               märke och måste se likadana ut". Nu är det ingen kopia längre:
               båda går genom `StatusBadge`, så likheten är strukturell i
               stället för en överenskommelse två filer måste minnas.
               Se `BetalningsInkorg.tsx` § EN PILL-ANATOMI för hela domen. */
            <StatusBadge ton="warning" storlek="sm" ikon={Clock}>
              Förfallen
            </StatusBadge>
          )}

          {rad?.spegelSlapar && (
            <span
              className="inline-flex items-center gap-1 rounded border border-transparent bg-bg px-2 py-0.5 text-caption text-text-muted"
              title="Basen har inte hunnit uppdateras än"
            >
              <AlertTriangle aria-hidden size={13} />
              Basen släpar
            </span>
          )}
        </div>
      )}

      {/* [TASK-346.14 fix-runda D, D1] HORISONTELL KNAPPGRUPP PÅ ≥sm — samma
          fix och samma motivering som `AnmalansBetalningar.tsx` (se dess
          docblock för hela resonemanget: `DokumentYta.tsx`-mönstret, gap
          återanvänt från panelens egen `flex-col gap-2`, `sm:items-start`
          mot ojämn kolumnhöjd). Denna yta är DEL av det facit-låsta
          `atgarder-granskning`/`atgarder`-manifestet
          (`tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json`,
          `s93-hallplats-prototyp/facit.json`) — se AMENDERING-sidofilerna i
          båda katalogerna. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
        {rad !== null && <RegistreraYta rad={rad} />}
        {/* [TASK-346.9 AC #3] Se `AnmalansBetalningar.tsx` — samma skäl att
            återbetalningen inte gates på `rad !== null`. */}
        <AterbetalningsYta anmalanRecordId={anmalanRecordId} />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setOppen((v) => !v)}
          aria-expanded={oppen}
          aria-controls={panelId}
          className="flex items-center gap-1 rounded text-caption text-text-muted hover:text-text"
        >
          {oppen ? 'Dölj inbetalningarna' : 'Visa inbetalningarna'}
          <span className="sr-only">{` för ${namn}`}</span>
          <ChevronDown
            aria-hidden="true"
            size={14}
            className={`shrink-0 transition-transform ${oppen ? 'rotate-180' : ''}`}
          />
        </button>
        <div id={panelId} hidden={!oppen} className="pt-2">
          <InbetalningsLista kalla={{ anmalanRecordId }} aktiv={oppen} />
        </div>
      </div>
    </div>
  );
}
