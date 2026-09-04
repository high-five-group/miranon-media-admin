import { Link } from '@tanstack/react-router';
import { Coins, ListChecks, UserPlus } from 'lucide-react';
import {
  HANDLINGSRAD_KLASS,
  HANDLINGSRAD_OMSLAG_KLASS,
  HandlingsRadInnehall,
  HandlingsRadKort,
} from '@/components/primitives/HandlingsRad';
import { betalningarPa } from '@/lib/funktionsflaggor';

/**
 * Genvägar — manuell anmälan + Åtgärds-sidan (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/ui.tsx` Genvagar, facit "hem-vyn V1 Lugna morgonen").
 * BÅDA är REDAN skarpa, byggda routes (`/anmalan/ny`, `/atgarder`) vars
 * "tomt läge" ÄR eventväljar-steget (147.8-språket) — riktiga länkar, inte
 * döda ingångar. Ersätter den retirerade `CTA.tsx`.
 *
 * ═══ FORMEN ÄR EVENTDETALJSIDANS, INTE NAVCARDS (S107, Marcus-order
 * 2026-08-17: "de ska VARA EXAKT SAMMA PÅ HEM-VYN") ═══
 *
 * Raderna byggdes tidigare av `NavCard`, där kortet SJÄLVT är länken och
 * hela den rounded-2xl-stora ytan byter ton vid hover. Eventdetaljsidans
 * genvägar är i stället transparenta rader inuti ett kort, som hovrar till
 * en INDRAGEN rounded-lg-platta. Samma hover-klass och samma färgsteg i
 * båda — men helt olika avläsning, och det var skillnaden Marcus såg.
 *
 * `task-273.2` beskrev avvikelsen som avsiktlig i sin amenderings-sidofil
 * ("det exakta pixelvärdet för insetten är det inte, med avsikt"). Det var
 * fel läsning av ordern: identiskt betydde identiskt. Formen delas nu som
 * KOD via `primitives/HandlingsRad` — inte som en beskrivning två ytor var
 * för sig ska leva upp till.
 *
 * `NavCard` är orörd och bär fortsatt Mer-vyns åtta rader (M6-facitet).
 *
 * ═══ TREDJE RADEN: "REGISTRERA BETALNING", BAKOM MILJÖFLAGGAN ═══
 *
 * Raden bodde till 2026-09-01 i Hem-blocket `BetalningarKort`, som Marcus
 * underkände och `Hem.tsx` inte längre renderar (se dess § 4 för domen). Den
 * FÖRSVANN inte med kortet: den flyttade hit, eftersom det är exakt vad den
 * är — en genväg till en yta, inte en handling på Hems egen data. Formen är
 * oförändrad (`HandlingsRad`, `/mer/betalningar`). Ikonen är `Coins` på
 * Marcus explicita order 2026-09-01 ("en ikon med pengar, mynt staplade på
 * varann") — och Mer-navigeringen bär SAMMA `Coins` för samma destination
 * (`routes/_authenticated/mer/index.tsx`): en destination, en ikon.
 *
 * VILLKORAD PÅ `betalningarPa()` AV SAMMA SKÄL SOM ROUTEN ÄR DET: målet
 * `/mer/betalningar` kastar `redirect` till `/mer` med flaggan av
 * (`routes/_authenticated/mer/betalningar.tsx` § FLAGGAN GATAR ROUTEN), så en
 * ovillkorlig rad hade varit en synlig genväg som studsar tillbaka. Prod är
 * därmed oförändrad tills Marcus slår på flaggan — samma villkor som styrde
 * blockvalet på Hem innan växeln revs, och samma villkor som redan bär
 * Mer-vyns egen betalningsrad.
 *
 * Rivs av `TASK-346.12` tillsammans med resten av flaggan: villkoret tas
 * bort, raden blir ovillkorlig (`funktionsflaggor.ts` § RIVNINGSNOT punkt 4).
 */
export function Genvagar() {
  return (
    <section aria-labelledby="hem-genvagar" className="flex min-w-0 flex-col gap-3">
      <h2 id="hem-genvagar" className="font-semibold text-2xl">
        Genvägar
      </h2>
      <nav aria-label="Genvägar">
        <HandlingsRadKort data-testid="hem-genvagar-kort">
          <ul className="flex flex-col">
            <li className={HANDLINGSRAD_OMSLAG_KLASS}>
              <Link to="/anmalan/ny" className={HANDLINGSRAD_KLASS}>
                <HandlingsRadInnehall
                  ledande={<UserPlus aria-hidden="true" size={16} className="shrink-0" />}
                >
                  Lägg till manuell anmälan
                </HandlingsRadInnehall>
              </Link>
            </li>
            <li className={HANDLINGSRAD_OMSLAG_KLASS}>
              <Link to="/atgarder" className={HANDLINGSRAD_KLASS}>
                <HandlingsRadInnehall
                  ledande={<ListChecks aria-hidden="true" size={16} className="shrink-0" />}
                >
                  Gå till åtgärder
                </HandlingsRadInnehall>
              </Link>
            </li>
            {betalningarPa() && (
              <li className={HANDLINGSRAD_OMSLAG_KLASS}>
                <Link to="/mer/betalningar" className={HANDLINGSRAD_KLASS}>
                  <HandlingsRadInnehall
                    ledande={<Coins aria-hidden="true" size={16} className="shrink-0" />}
                  >
                    Registrera betalning
                  </HandlingsRadInnehall>
                </Link>
              </li>
            )}
          </ul>
        </HandlingsRadKort>
      </nav>
    </section>
  );
}
