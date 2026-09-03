import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { ATERBETALNINGS_TRIGGER_ID } from '@/components/betalningar/AterbetalningsYta';
import { visaKronor } from '@/components/betalningar/belopp-inmatning';
import { REGISTRERA_TRIGGER_ID } from '@/components/betalningar/RegistreraYta';
import { Button, MessageBox } from '@/components/primitives';
import { betalningarPa } from '@/lib/funktionsflaggor';
import { type Prisvag, prisbesked } from './ombokning-kvitto';

/**
 * [TASK-368.5 AC #2/#3] Kvittot i klartext på den NYA anmälans sida, direkt
 * efter en ombokning.
 *
 * Kortets AC #2 slutar med *"landar på den NYA anmälans sida med ett kvitto i
 * klartext på vad som hände"*, och AC #3 med *"efter bekräftelse visas samma
 * text med länk till Registrera återbetalning respektive registrera
 * inbetalning"*. Detta är båda.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ETT ENGÅNGSFAT UR NAVIGERINGENS HISTORY-STATE
 * ═══════════════════════════════════════════════════════════════════════════
 * Kvittot bärs i `history.state`, inte i URL:en och inte i en cache — samma
 * idiom och samma skäl som `ManuellAnmalanForm.tsx` § `mmAvsloja` och
 * `Deltagare.tsx` § `mmAtgardsUrval`: ett kvitto är varken durabelt eller
 * delbart (URL-STATE-SPEC § "allt som påverkar VAD som visas lever i URL:en"
 * gäller delbart state), och en länk till anmälan ska aldrig visa någon
 * annans kvitto.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * HÄRLETT VID VARJE RENDER — INTE FÅNGAT I EN `useState`-INITIALISERARE
 * ═══════════════════════════════════════════════════════════════════════════
 * Den formen prövades och FÖLL, mätt 2026-09-03 i den hermetiska
 * fixturvärlden: `AnmalanDetail` monteras av routen
 * `/event/$eventId/anmalan/$registrationId`, och ett PARAM-BYTE inom samma
 * route remountar inte komponenten (`ManuellAnmalanForm.tsx` säger det rakt
 * ut om sin egen route: *"param-byte remountar INTE komponenten → ifyllda
 * fält BEHÅLLS"*). En mount-fångst hade därför läst history-state från den
 * sida Lotta kom IFRÅN — alltså tomt — och kvittot syntes aldrig.
 * Ombokningens hela poäng är just ett param-byte, så formen var fel för
 * exakt detta fall.
 *
 * Härledningen är ren och billig, och det som ska överleva en omrendering är
 * i stället AVFÄRDANDET: `stangdFor` binder "Lotta stängde det" till det
 * SPECIFIKA kvittot, så ett nytt kvitto på samma sida visas igen medan ett
 * stängt aldrig återupplivas av mutationens invalideringar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ANMÄLANS ID VAKTAR MOT ETT KVITTO PÅ FEL SIDA
 * ═══════════════════════════════════════════════════════════════════════════
 * Varje history-post bär sitt eget state, så ett kvitto ska strukturellt inte
 * kunna följa med till en annan anmälan. Vakten är ändå kvar och kostar en
 * jämförelse: routern har `state`-former som överlever mer än man tror (en
 * spridning `...prev` i ett SENARE navigate-anrop bär med sig varje nyckel),
 * och ett kvitto som säger fel persons pengar är den dyraste sortens fel på
 * just denna sida. Med härledningen ovan är vakten dessutom det som gör
 * formen säker: den läser state vid VARJE render, och utan id-jämförelsen
 * hade en kvarhängande nyckel visats på vilken anmälan som helst.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VÄGEN VIDARE ÄR HUSETS TRIGGER-SEAM, INTE EN ANDRA BETALNINGSYTA
 * ═══════════════════════════════════════════════════════════════════════════
 * Precis som `AvbokningsBetallage` (TASK-368.3) rullar knappen fram och
 * aktiverar den BEFINTLIGA triggern i Betalningar-gruppen högre upp på samma
 * sida — `AterbetalningsYta`s när pengar ska tillbaka, `RegistreraYta`s när
 * något saknas. ID:na är deklarerade kontrakt som `AnmalansBetalningar`
 * skickar ned, aldrig DOM-gissningar, och saknas noden händer ingenting alls.
 *
 * BAKOM MILJÖFLAGGAN, av nödvändighet: hela Betalningar-gruppen monteras
 * endast när `betalningarPa()` är sann (`AnmalanDetail` § `AnmalansBetalningar`),
 * så det finns ingen trigger att rulla till med flaggan av. TEXTEN visas i
 * båda fallen — prisskillnaden är kortets krav, knappen är bekvämligheten.
 */
function TillBetalning({ vag }: { vag: Exclude<Prisvag, null> }) {
  const id = vag === 'aterbetalning' ? ATERBETALNINGS_TRIGGER_ID : REGISTRERA_TRIGGER_ID;

  function till() {
    const trigger = document.getElementById(id);
    if (!trigger) return;
    trigger.scrollIntoView({ block: 'center' });
    trigger.focus();
    trigger.click();
  }

  return (
    <Button intent="secondary" emphasis="outline" size="sm" onPress={till}>
      {vag === 'aterbetalning' ? 'Registrera återbetalning' : 'Registrera betalning'}
    </Button>
  );
}

export function OmbokningsKvitto({ registrationId }: { registrationId: string }) {
  const fran = useLocation({ select: (l) => l.state.mmOmbokningsKvitto });
  const [stangdFor, setStangdFor] = useState<string | null>(null);

  const kvitto = fran?.nyAnmalanId === registrationId ? fran : undefined;
  if (!kvitto || stangdFor === kvitto.nyAnmalanId) return null;

  const besked = prisbesked(kvitto.nyttPris, kvitto.prisskillnad);

  return (
    <div className="mx-4">
      <MessageBox
        intent="success"
        title={`Anmälan är ombokad till ${kvitto.nyttEventNamn}`}
        testId="ombokningskvitto"
        onDismiss={() => setStangdFor(kvitto.nyAnmalanId)}
        actions={
          besked.vag !== null && betalningarPa() ? <TillBetalning vag={besked.vag} /> : undefined
        }
      >
        <p className="my-0 text-small">
          {/* SUMMAN ÄR ETT TILLSTÅND, INTE EN RÄKNARE: `summaNyAnmalan` är vad
              som NU sitter på anmälan, inte vad detta anrop råkade flytta.
              `flyttadSumma` är `0` vid en omkörning trots att pengarna sitter
              rätt (`RebookRegistration.schema.ts`), och ett kvitto som sade
              "0 kr flyttades" om en lyckad ombokning vore falskt. */}
          {kvitto.summaNyAnmalan === 0
            ? 'Inga inbetalningar följde med: det fanns inga att flytta.'
            : `${visaKronor(kvitto.summaNyAnmalan)} kr sitter nu på den här anmälan.`}{' '}
          {besked.text}
        </p>
        {/* Omkörningen sägs rakt ut i stället för att döljas: att ingenting
            hände ÄR beskedet, och utan raden hade kvittot sett ut som en ny
            ombokning (`rebook-registration/index.ts` § IDEMPOTENSEN). */}
        {kvitto.aterupptaget && (
          <p className="my-0 pt-1 text-caption text-text-muted">
            Ombokningen var redan gjord sedan tidigare. Det här anropet ändrade ingenting.
          </p>
        )}
      </MessageBox>
    </div>
  );
}
