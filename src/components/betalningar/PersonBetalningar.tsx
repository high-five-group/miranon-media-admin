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

/* [PASS 12] `SENASTE_ANTAL = 5` ÄR RIVEN. Konstanten kapade listan till fem
   rader och lät `InbetalningsLista`s "Visar 5 av 7"-rad förklara resten bort.
   Marcus 2026-09-01: *"Jag tror vi måste ha inline scroll … det kommer bli
   många inbetalningar på många personer."* Rullningen håller listan kort utan
   att gömma rader, så taket har inget jobb kvar — och en rad som finns ska gå
   att nå. */

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
      {/* ═══ STATUSKORTET: STATUS + EVENT + KNAPP SOM EN ENHET (pass 8) ═══
          Marcus dom 2026-09-01: *"Det är något med den översta raden i
          betalningsblocket som stör mig, borde vi inte boxa in den snyggare?"*

          MÄTT VAD SOM STÖRDE: sammanfattningsmeningen låg direkt på sektionens
          grå botten (vänsterkant 0), medan varje event-rad låg i ett eget
          `bg-bg-muted px-3`-kort — alltså en andra vänsterlinje 12 px in, i
          samma ton som botten bakom den. Tre fragment, tre kanter, ingen av dem
          en yta.

          KORTFORMEN ÄR INBETALNINGSRADERNAS, inte en ny: `rounded-2xl border
          border-transparent bg-surface p-3 contrast-more:border-border-strong`
          (`InbetalningsLista.tsx` § KORTYTAN). Vit yta på den grå botten, precis
          som raderna längre ned — så sektionen läser som en familj i stället för
          som två uppfinningar.

          EVENT-KORTENS EGNA `bg-bg-muted`-ytor ÄR RIVNA: de låg på en botten i
          exakt samma ton och avgränsade därför ingenting. Nu delar status, event
          och knapp EN vänsterlinje — kortets `p-3`. */}
      <div className="flex flex-col gap-4 rounded-2xl border border-transparent bg-surface p-3 contrast-more:border-border-strong">
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
          <div key={rad.nyckel} className="flex flex-col gap-2">
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

      {/* ═══ INGEN EGEN BAKGRUNDSYTA (pass 12, 2026-09-01) ═══
          Marcus: *"Det funkar inte, ta bort den mörkare grå bakgrund på
          'senaste inbetalningar'."*

          VAD SOM REVS: pass 8 gav gruppen en `bg-bg-emphasized`-behållare för
          att binda ihop rubrik och lista. Utfallet blev TRE nivåer nesting —
          sektionens ljusgrå yta, ett mörkare grått omslag, och vita kort inuti
          det. Grupperingen bärs nu i stället av eyebrow-etiketten plus listans
          egen sammanhållning; korten ligger direkt på samma botten som
          statuskortet ovanför, alltså två nivåer i stället för tre.

          RUBRIKEN ÄR EN EYEBROW — OCH DET MOTSÄGER INTE HEM-DOMEN. Marcus rev
          `font-medium text-caption uppercase tracking-wide` på Hem-blocket
          2026-09-01, och den rivningen står. Skillnaden är ROLLEN, inte
          formen: på Hem var eyebrown ENDA rubriken över en lista man skulle
          agera på, alltså en huvudrubrik som viskade. Här sitter den som
          UNDER-etikett under sektionens riktiga `h2` ("Betalningar",
          `PersonDetail.tsx` § `Sektion`) — samma roll som "NÄSTA EVENT"-
          overlinen har. Rätt form för rätt nivå. Skriv inte tillbaka den till
          `font-semibold text-body` utan att läsa båda domarna.

          SEMANTIKEN BESTÅR: elementet är fortfarande ett `h3`, alltså en
          rubrik för listan i tillgänglighetsträdet — bara dess visuella vikt
          är etikettens. Rullningsregionen bär dessutom sitt eget namn via
          `listEtikett`. */}
      <div className="flex flex-col gap-2">
        <h3 className="font-medium text-caption text-text-secondary uppercase tracking-wide">
          Senaste inbetalningar
        </h3>
        <InbetalningsLista
          kalla={{ personId: person.id }}
          aktiv
          listEtikett="Senaste inbetalningar"
          tomText="Ingen inbetalning registrerad på personen än."
        />
      </div>

      {/* [TASK-362] "Betalningsinkorgen" → "Betalningar" (Marcus 2026-09-02:
          *"ändra namn på 'Öppna betalningsinkorgen' till … 'Öppna
          betalningar', ja så gör vi, det är ännu renare"*). Enda
          användarsynliga förekomsten av den gamla termen i `src/` (mätt med
          repo-bred grep); komponentnamnet `BetalningsInkorg`/filnamnet är
          kodidentifierare och orörda. */}
      <Link to="/mer/betalningar" className="text-small underline">
        Öppna betalningar
      </Link>
    </div>
  );
}
