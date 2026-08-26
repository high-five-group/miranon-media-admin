import { useMutation } from '@tanstack/react-query';
import { type DokumentKalla, hamtaDokumentUrl } from '@/data/mutations/dokumentKalla';
import { useDataSource } from '@/data/useDataSource';

/**
 * Mutation: "förhandsvisa ett dokument i en ny flik" (TASK-273.4, ersätter
 * den rivna Visa-dialogen — se `DokumentYta.tsx`s filhuvud § IKONPAR för
 * hela resonemanget). Öppnar dokumentet i en RIKTIG ny webbläsarflik
 * (webbläsarens egen PDF-/bildvisare, ingen egen iframe/img-rendering).
 *
 * POPUP-BLOCKERAR-SÄKERT MÖNSTER — anroparen (`DokumentYta.tsx`) MÅSTE
 * anropa `window.open('', '_blank')` SYNKRONT i klick-handlern (innan
 * `mutate()`, alltså innan någon `await`) och skicka in det redan öppnade
 * fönster-handtaget som variabel — se `PrototypeSwitcher.tsx` rad 381 för
 * samma synkrona-öppning-princip. Adressen sätts EFTERÅT, i `mutationFn`,
 * när den asynkrona hämtningen är klar. Bevisat i ett skarpt Chrome-
 * beteendetest (AC #1, throwaway, kastat efter passet) att detta INTE
 * blockeras.
 *
 * [TILLÄGG, TASK-309.26 review-runda 1, AC #4] Anroparen skriver NUMERA
 * också en momentan laddningssida i fönstret direkt efter `window.open`,
 * innan `mutate()` (`skrivLaddningssida`, `@/lib/skriv-laddningssida`) —
 * samma delade mönster som `GenereringsVy.tsx`s `skapaDokument`. Fram till
 * denna skiva stod fönstret tomt (`about:blank`) under hela väntan, vilket
 * var precis den "abrupt tomt fönster"-upplevelse Marcus avvisade 22 aug
 * 2026 för genereringsvyn — samma defekt fanns här, bara aldrig påtalad för
 * just denna yta förrän konsekvens-kravet (AC #4) synliggjorde den vid
 * granskningen av den andra ytan. Denna hooks EGEN kontrakt är oförändrat:
 * den öppnar ingenting själv, den bara fyller `handle.location.href` när
 * datan är klar (eller skriver felsidan nedan).
 *
 * `noopener` är MEDVETET UTESLUTET ur `window.open`-anropet (anroparens
 * ansvar, inte denna hooks — men dokumenterat här eftersom skälet gäller
 * hela mönstret): verifierat (samma throwaway-pass) att
 * `window.open('', '_blank', 'noopener')` returnerar `null` i riktig
 * Chrome — noopener och "navigera handtaget senare" är ömsesidigt
 * uteslutande. Destinationen är alltid egen, betrodd data (signerad
 * Storage-URL i vår egen bucket, eller en `blob:`-URL byggd av vår egen
 * JS), aldrig en tredjeparts-länk, vilket gör reverse-tabnabbing-risken av
 * det uteblivna `noopener` försumbar här.
 *
 * Fel: lämnar aldrig den redan öppnade fliken tyst tom (Gunilla-principen)
 * — skriver ett ärligt felmeddelande direkt i den i stället för att
 * förlita sig på en global toast (appen har ingen).
 */
export function useForhandsvisaDokument() {
  const dataSource = useDataSource();

  return useMutation<void, Error, { kalla: DokumentKalla; handle: Window | null }>({
    mutationKey: ['forhandsvisa-dokument'],
    mutationFn: async ({ kalla, handle }) => {
      if (!handle) {
        throw new Error(
          'Webbläsaren blockerade den nya fliken. Tillåt popup-fönster för den här sidan och försök igen.',
        );
      }
      try {
        const url = await hamtaDokumentUrl(dataSource, kalla);
        handle.location.href = url;
      } catch (err) {
        if (!handle.closed) {
          handle.document.write(
            '<p style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 32rem;">' +
              'Kunde inte öppna dokumentet. Stäng fliken och försök igen.</p>',
          );
        }
        throw err;
      }
    },
  });
}
