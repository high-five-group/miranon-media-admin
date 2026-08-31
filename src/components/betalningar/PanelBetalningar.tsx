import { AlertTriangle, ChevronDown, Clock } from 'lucide-react';
import { useId, useState } from 'react';
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
 * Texten säger därför "enligt basen" i stället för att påstå "allt betalt".
 * Att gissa vilket av de två fallen som gäller hade krävt priset, som denna
 * yta inte har - och att påstå det starkare av dem hade varit att hitta på.
 * Fönstret stängs av DATA (pris-backfillen, TASK-346.8), inte av en gissning
 * här.
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
      <div className="flex flex-wrap items-center gap-2 text-small">
        <span className={saknas !== null && saknas > 0 ? 'font-medium' : 'text-text-muted'}>
          {saknas === null
            ? 'Inget öppet belopp enligt basen'
            : saknas > 0
              ? `Saknas ${visaKronor(saknas)} kr`
              : 'Allt betalt'}
        </span>

        {rad?.forfallen && (
          <span className="inline-flex items-center gap-1 rounded border border-transparent bg-bg px-2 py-0.5 text-caption">
            <Clock aria-hidden size={13} />
            Förfallen
          </span>
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

      {rad !== null && <RegistreraYta rad={rad} />}

      <div>
        <button
          type="button"
          onClick={() => setOppen((v) => !v)}
          aria-expanded={oppen}
          aria-controls={panelId}
          className="mm-fokusring-vid-fokus flex items-center gap-1 rounded text-caption text-text-muted hover:text-text"
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
