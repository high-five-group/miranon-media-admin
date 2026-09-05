import { CircleCheck } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/primitives';
import { useInbetalningarPerAnmalan, useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { ATERBETALNINGS_TRIGGER_ID } from './AterbetalningsYta';
import { visaKronor } from './belopp-inmatning';
import { idagIso } from './idag';
import { harledRad } from './inkorg-harledningar';

/**
 * [TASK-368.3 AC #2] Personens betalläge INUTI avbokningssteget: summa
 * inbetalt, kvar att betala, och en direkt väg till Registrera återbetalning
 * när det finns aktiva inbetalningar att betala tillbaka.
 *
 * PRD `TASK-368` berättelse 7 och 8, ordagrant: *"vill jag se personens
 * betalläge i bekräftelsesteget, så att jag vet om det finns pengar att
 * återbetala"* respektive *"vill jag ha en direkt väg till Registrera
 * återbetalning från avbokningen, så att återbetalningen inte glöms"*.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONENTEN MONTERAS BARA BAKOM MILJÖFLAGGAN — DÄRFÖR BOR HOOKARNA HÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * `AvbokningsYta` renderar denna komponent inuti `{betalningarPa() && …}`,
 * exakt som `AnmalanDetail` redan gör med `AnmalansBetalningar`. Poängen är
 * inte kosmetisk: hooks-reglerna förbjuder ett villkorat hook-anrop, så det
 * enda sättet att slippa BÅDA hämtningarna med flaggan av är att flaggan
 * avgör MONTERINGEN, inte anropet. Med flaggan av existerar denna komponent
 * inte, och ingen betalnings-EF anropas från avbokningssteget.
 *
 * SJÄLVA AVBOKNINGSKNAPPEN ÄR ALDRIG FLAGGAD (skivans uppdrag, ordagrant:
 * "Avboka-knappen ska INTE ligga bakom betalningsflaggan; bara betalläget i
 * steget villkoras av den"). En avbokning är en statusändring i basen och
 * kräver ingenting av betalningsdomänen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TVÅ KÄLLOR, TVÅ OLIKA FRÅGOR — INGEN AV DEM UPPFUNNEN HÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * "Kvar att betala" kommer ur `harledRad`, samma härledning och samma ORD
 * som `AnmalansBetalningar` visar en bit längre upp på samma sida. Att räkna
 * om det på ett eget sätt hade gett Lotta två tal för samma fråga på en och
 * samma sida.
 *
 * "Inbetalt" kommer ur `Inbetalningslista.spegel.summaPostgres` — POSTGRES,
 * inte basens spegel (`ADR-128`: inbetalningen är sanningen, spegeln är en
 * app-skriven kopia som kan släpa). Kortets AC säger uttryckligen "ur
 * Postgres", och det är den kolumnen.
 *
 * Frånvaron av en öppen-betalnings-rad är TVETYDIG och påstås aldrig vara
 * "allt betalt" — samma disciplin som `AnmalansBetalningar` § `rad === null`
 * och `PanelBetalningar`. Här blir den "Inget att betala.", ordagrant samma
 * nolläges-mening som anmälans betalningsyta redan bär (reviderad 2026-09-04,
 * S120, TASK-391, ur "Inget kvar att betala." — "kvar" förutsätter en skuld
 * som nolläget inte vet finns).
 */
export function AvbokningsBetallage({ anmalanRecordId }: { anmalanRecordId: string }) {
  const { data: oppna } = useOppnaBetalningar();
  const { data: inbetalningar, isPending } = useInbetalningarPerAnmalan(anmalanRecordId, true);
  const idag = useMemo(idagIso, []);

  const kvar = useMemo(() => {
    const betalning = (oppna?.betalningar ?? []).find((b) => b.anmalanRecordId === anmalanRecordId);
    if (!betalning) return null;
    const rad = harledRad(betalning, idag);
    return rad.kvar ?? rad.betalning.saknas;
  }, [oppna, anmalanRecordId, idag]);

  const summaInbetalt = inbetalningar?.spegel.summaPostgres ?? null;

  /**
   * "Aktiva inbetalningar" = rader som faktiskt bär pengar in och inte är
   * makulerade. En redan registrerad ÅTERBETALNING (`typ === 'aterbetalning'`,
   * negativt belopp) räknas inte som något att betala tillbaka igen, och en
   * makulerad rad är bokföringsmässigt struken.
   */
  const harAktivaInbetalningar = (inbetalningar?.inbetalningar ?? []).some(
    (i) => i.status === 'aktiv' && i.typ === 'inbetalning',
  );

  /**
   * DEN DIREKTA VÄGEN: rulla fram och aktivera den befintliga
   * "Registrera återbetalning"-triggern i Betalningar-gruppen högre upp på
   * SAMMA sida (`AterbetalningsYta`, `TASK-346.9`) i stället för att bygga
   * en andra återbetalningsyta här.
   *
   * ID:T ÄR SEAMEN, INTE EN DOM-GISSNING: `AnmalansBetalningar` skickar
   * uttryckligen ned `ATERBETALNINGS_TRIGGER_ID` till triggern, så det är ett
   * deklarerat kontrakt mellan de två ytorna. Saknas noden (t.ex. om ytan
   * inte renderats) händer ingenting alls, aldrig ett kast.
   *
   * `focus()` FÖRE `click()` med avsikt: triggern göms när formuläret öppnas,
   * och `AterbetalningsForm` flyttar då fokus till beloppsfältet i sin egen
   * monterings-effekt. Skulle klicket av någon anledning inte gå fram står
   * fokus kvar på en synlig, tryckbar knapp — degraderingen är alltså
   * fortfarande en fungerande väg fram.
   *
   * Avbokningssteget STÄNGS INTE. Det är hela vinsten med att steget är
   * inline och inte en modal: Lotta kan registrera återbetalningen och sedan
   * rulla tillbaka till sitt halvskrivna skäl, som står kvar orört.
   */
  function tillAterbetalning() {
    const trigger = document.getElementById(ATERBETALNINGS_TRIGGER_ID);
    if (!trigger) return;
    trigger.scrollIntoView({ block: 'center' });
    trigger.focus();
    trigger.click();
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface p-3">
      <h3 className="my-0 font-medium text-caption text-text-secondary uppercase tracking-wide">
        Betalläge
      </h3>

      {isPending ? (
        <p className="my-0 text-small text-text-muted" role="status">
          Hämtar betalläget…
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <span className="text-small text-text-muted">Inbetalt</span>
            <span className="text-right font-semibold text-body">
              {summaInbetalt === null ? '—' : `${visaKronor(summaInbetalt)} kr`}
            </span>
          </div>

          {/* Samma tre lägen och samma ord som `AnmalansBetalningar`s
              nyckeltalsrad — se den filens docblock § "KVAR ATT BETALA" för
              varför nollägena är fri text och bara det öppna beloppet får
              radens vikt. */}
          {kvar === null ? (
            <p className="my-0 text-small text-text-muted">Inget att betala.</p>
          ) : kvar > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-small text-text-muted">Kvar att betala</span>
              <span className="text-right font-semibold text-body">{`${visaKronor(kvar)} kr`}</span>
            </div>
          ) : (
            <p className="my-0 flex items-center gap-2 text-small text-text-secondary">
              <CircleCheck aria-hidden="true" size={16} className="shrink-0 text-success" />
              Allt betalt.
            </p>
          )}

          {harAktivaInbetalningar && (
            <div className="flex flex-col gap-2 pt-1">
              <p className="my-0 text-small text-text-muted">
                Det finns inbetalningar på anmälan. Avbokningen betalar inte tillbaka något av sig
                själv.
              </p>
              <div className="flex flex-wrap items-center">
                <Button intent="secondary" emphasis="outline" size="sm" onPress={tillAterbetalning}>
                  Registrera återbetalning
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
