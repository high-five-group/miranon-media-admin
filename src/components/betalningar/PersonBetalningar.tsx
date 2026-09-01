import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import type { PersonDetail } from '@/domain/schemas';
import { visaKronor } from './belopp-inmatning';
import { InbetalningsLista } from './InbetalningsLista';
import { idagIso } from './idag';
import { harledRad } from './inkorg-harledningar';
import { personOversikt } from './panel-harledningar';
import { RegistreraYta } from './RegistreraYta';

/** Hur många av personens senaste inbetalningar som visas utan omväg. */
const SENASTE_ANTAL = 5;

/**
 * [TASK-346.7 AC #4] Personkortets Betalningar-sektion: vad personen har
 * öppet över ALLA event, och de senaste inbetalningarna.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FRÅGAN SEKTIONEN SVARAR PÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 24, ordagrant: "Som Lotta vill jag se personens betalningar
 * på personkortet, så att 'Cecilia swishade - vad har hon öppet?' har ett
 * svar." Det är en fråga om PERSONEN, inte om ett event - därför ligger
 * svaret här och inte bara i eventets panel.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * URVALET GÖRS PÅ ANMÄLNINGS-ID, ALDRIG PÅ NAMN
 * ═══════════════════════════════════════════════════════════════════════════
 * `OppenBetalning` bär inget person-ID (`Betalningar.schema.ts`), och
 * inkorgens sökläge löser det med en namn-matchning som den själv kallar "en
 * känd grovhet" - en namne kan filtreras bort. Personkortet behöver inte ta
 * den grovheten: persondetaljen känner sina EGNA anmälnings-record-ID:n
 * (`motiveringar[].id` är Anmälningar-poster, `historik[].registrationId`
 * är anmälnings-länken ur Deltaganden), och ett record-ID kan inte råka vara
 * en namne.
 *
 * BÅDA KÄLLORNA LÄSES, inte den ena. `motiveringar` bär de anmälningar
 * `Personer.Anmälningar` länkar; `historik` bär dem som har ett Deltagande.
 * En anmälan utan deltagande-rad finns bara i den första, och en gammal
 * anmälan vars länk saknas kan finnas bara i den andra. Unionen är den
 * fullständiga mängd denna vy kan känna till.
 *
 * INBETALNINGARNA hämtas däremot på PERSON-ID via `hamta-inbetalningar`, som
 * löser person till anmälningar SERVER-SIDE. Den listan är alltså fullständig
 * oavsett vad klienten känner till om länkarna.
 */
export function PersonBetalningar({ person }: { person: PersonDetail }) {
  const { data } = useOppnaBetalningar();
  const idag = useMemo(idagIso, []);

  const anmalningsIds = useMemo(() => {
    const ids = new Set<string>();
    for (const motivering of person.motiveringar) ids.add(motivering.id);
    for (const post of person.historik) {
      if (post.registrationId !== null) ids.add(post.registrationId);
    }
    return [...ids];
  }, [person.motiveringar, person.historik]);

  const oversikt = useMemo(() => {
    const rader = (data?.betalningar ?? []).map((b) => harledRad(b, idag));
    return personOversikt(rader, anmalningsIds);
  }, [data, idag, anmalningsIds]);

  return (
    <div className="flex flex-col gap-4 py-3">
      <div className="flex flex-col gap-3">
        <p className="text-body">
          {oversikt.rader.length === 0
            ? 'Inget kvar att betala.'
            : // BÅDA räkneorden böjs. Mätt i acceptansvandringen 2026-08-31:
              // meningen löd "Saknas 2 500 kr på 1 anmälan, varav 1 förfallna"
              // - substantivet var böjt, adjektivet inte. Gunilla-principen
              // gäller texten Lotta läser varje morgon, inte bara de svåra
              // orden.
              //
              // TERMEN BYTTES 2026-09-01 (Marcus): "Saknas X kr på …" är nu
              // "X kr kvar att betala på …". I LÖPANDE TEXT står beloppet
              // först — "2 500 kr kvar att betala på 2 anmälningar" läser som
              // svenska, medan etikett-först ("Kvar att betala 2 500 kr på …")
              // läser som en tabellrad som råkat hamna i en mening. Som
              // ETIKETT (panelen, anmälans detaljvy) står termen först; det är
              // samma term, böjd efter sin plats.
              `${visaKronor(oversikt.saknasTotalt)} kr kvar att betala på ${oversikt.rader.length} ${oversikt.rader.length === 1 ? 'anmälan' : 'anmälningar'}${oversikt.forfallna > 0 ? `, varav ${oversikt.forfallna} ${oversikt.forfallna === 1 ? 'förfallen' : 'förfallna'}` : ''}.`}
        </p>

        {/* EN RAD PER ÖPPEN ANMÄLAN, var och en med sitt eget formulär.
            Personen kan ha öppna betalningar på flera event samtidigt, och
            en inbetalning hör ALLTID till exakt en anmälan (ADR-128) - ett
            gemensamt formulär hade tvingat Lotta att välja event i en
            rullgardin som ytan inte behöver. */}
        {oversikt.rader.map((rad) => (
          <div key={rad.nyckel} className="flex flex-col gap-2 rounded bg-bg-muted px-3 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-small">
                {rad.betalning.eventNamn ?? 'Utan event'}
              </span>
              <span className="text-caption text-text-muted">
                {rad.kvar === null
                  ? 'Pris saknas i basen'
                  : `${visaKronor(rad.kvar)} kr kvar att betala`}
                {rad.forfallen ? ' · förfallen' : ''}
              </span>
            </div>
            <RegistreraYta rad={rad} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-medium text-caption text-text-secondary uppercase tracking-wide">
          Senaste inbetalningar
        </h3>
        <InbetalningsLista
          kalla={{ personId: person.id }}
          aktiv
          max={SENASTE_ANTAL}
          tomText="Ingen inbetalning registrerad på personen än."
        />
      </div>

      <Link to="/mer/betalningar" className="text-small underline">
        Öppna betalningsinkorgen
      </Link>
    </div>
  );
}
