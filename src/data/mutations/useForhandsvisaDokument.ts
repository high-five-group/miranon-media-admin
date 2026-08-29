import { useMutation } from '@tanstack/react-query';
import { type DokumentKalla, hamtaDokumentUrl } from '@/data/mutations/dokumentKalla';
import { useDataSource } from '@/data/useDataSource';

/**
 * Mutation: "förhandsvisa ett dokument i en ny flik" (TASK-273.4, ersätter
 * den rivna Visa-dialogen — se `DokumentYta.tsx`s filhuvud § IKONPAR för
 * hela resonemanget). Öppnar dokumentet i en RIKTIG ny webbläsarflik
 * (webbläsarens egen PDF-/bildvisare, ingen egen iframe/img-rendering).
 *
 * TVÅ ANROPARE (sedan TASK-340.2): `DokumentYta.tsx`s Öppna-ikon
 * (§ IKONPAR) och `GenereringsVy.tsx`s bekräftelseyta ("Visa dokumentet",
 * efter ett lyckat Skapa). Docblocket nedan talade fram till dess om
 * "anroparen" i SINGULAR och namngav bara den första — läs det som en
 * regel för BÅDA.
 *
 * POPUP-BLOCKERAR-SÄKERT MÖNSTER — anroparen MÅSTE
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
 * samma delade mönster som `GenereringsVy.tsx` använder i sin
 * förhandsgranskning (`startaForhandsgranskning`; funktionen hette
 * `skapaDokument` när denna rad skrevs och delades i TASK-340.2). Fram till
 * denna skiva stod fönstret tomt (`about:blank`) under hela väntan, vilket
 * var precis den "abrupt tomt fönster"-upplevelse Marcus avvisade 22 aug
 * 2026 för genereringsvyn — samma defekt fanns här, bara aldrig påtalad för
 * just denna yta förrän konsekvens-kravet (AC #4) synliggjorde den vid
 * granskningen av den andra ytan. Denna hooks EGEN kontrakt är oförändrat:
 * den öppnar ingenting själv, den bara fyller `handle.location.href` när
 * datan är klar (eller skriver felsidan nedan).
 *
 * [RÄTTAT, TASK-309.26 review-runda 2, severity ERROR] Felvägens
 * `handle.document.write(...)` APPENDADE tidigare felmeddelandet UNDER
 * laddningssidan i stället för att ersätta den — Lotta såg "Öppnar
 * dokument…" och "Kunde inte öppna dokumentet…" staplade i samma fönster.
 * Grundorsaken (empiriskt verifierad, `@/lib/skriv-laddningssida`s
 * docblock har hela mätserien): `document.write` APPENDAR på ett
 * dokument som fortfarande är ÖPPET (`readyState: 'loading'`) — den
 * implicita "töm dokumentet"-effekten (HTML-spec/MDN) triggar bara när
 * `write()` anropas på ett REDAN STÄNGT dokument. `skrivLaddningssida`
 * anropar numera `document.close()` efter sin skrivning, vilket räcker för
 * att lösa buggen i normalfallet — men felvägen HÄR gör dessutom explicit
 * `document.open()` FÖRE sin egen `write()` (och `document.close()`
 * efteråt): försvar i djup, så felsidan garanterat ERSÄTTER allt tidigare
 * innehåll OAVSETT om anroparen städade sin ström eller ej. Verifierat
 * (samma mätpass): ett explicit `document.open()`-anrop tömmer dokumentet
 * lika säkert oavsett om det var `'loading'` eller redan `'complete'`.
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
 * [RÄTTAT, TASK-309.26 review-runda 3] Felvägen skriver ETT ärligt
 * felmeddelande DIREKT I FLIKEN (Gunilla-principen: fliken ska aldrig stå
 * tyst tom) — en tidigare formulering här påstod att detta var nödvändigt
 * "eftersom appen har ingen [global toast]", vilket var FEL: DokumentYta.tsx
 * HAR en lokal `MessageBox` för just denna mutation
 * (`forhandsvisaMutation.isError && <MessageBox .../>`, `DokumentYta.tsx`
 * rad ~813). De två felytorna är en MEDVETEN DUBBLERING, inte en glömska:
 * den öppnade fliken kan vara SKYMD (bakom appfönstret, minimerad, på en
 * annan skärm) medan Lotta tittar på appen, eller tvärtom — vilken yta hon
 * FAKTISKT ser när felet inträffar går inte att veta i förväg, så båda
 * bär meddelandet oberoende av varandra.
 *
 * AVVIKELSEN GÄLLER GenereringsVy.tsx:s FÖRHANDSGRANSKNING, INTE HELA DEN
 * FILEN (omskrivet i TASK-340.2 review-runda 3 — stycket löd tidigare
 * "AVVIKELSEN MOT GenereringsVy.tsx" rakt av, som om den ytan inte alls
 * använde denna hook. Den gör det numera, för sin bekräftelseyta).
 * Genereringsvyn bär alltså BÅDA mönstren, ett per knapp:
 *
 *   · FÖRHANDSGRANSKNINGEN (`startaForhandsgranskning`, går INTE via denna
 *     hook) stänger i stället det öppnade fönstret vid fel
 *     (`stangOanvantFonster`) och visar enbart sin egen `MessageBox`, med
 *     en fallback-knapp ("Öppna <dokumentet>") som öppnar den utkast-URL
 *     svaret redan bar. Den kan det, eftersom den håller URL:en i
 *     komponent-state — ett konkret återförsök i EN yta.
 *   · BEKRÄFTELSEN ("Visa dokumentet") går via DENNA hook och får därmed
 *     dess form: felet skrivs både i fliken och i appens egen yta.
 *
 * Skillnaden är motiverad av vad de två knapparna har att återförsöka MOT.
 * Denna hook har inget lagrat tillstånd alls — varje klick startar en helt
 * ny hämtning, och en signering är transient — så en flik som redan finns
 * och redan väntar på Lotta är den bättre platsen att också bära felet.
 * Förhandsgranskningen har en färsk URL i handen och kan därför erbjuda
 * knappen i stället.
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
        // [RÄTTAT, TASK-309.26 review-runda 3] Lotta kan ha stängt fliken
        // SJÄLV medan `hamtaDokumentUrl` väntade på nätverket — `handle` är
        // då icke-null men `.closed`, och `.location.href` på ett stängt
        // fönster kan kasta i vissa webbläsare (MDN), samma felklass som
        // GenereringsVy.tsx:s `onSuccess`-vakt (review-runda 1). Kastar ett
        // eget, Gunilla-läsbart fel i stället för att låta det råa
        // webbläsarfelet nå `MessageBox` oformaterat — `catch`-blocket
        // nedan hoppar korrekt över att skriva i fliken (den är ju stängd,
        // `!handle.closed`-vakten där är oförändrad) och kastar detta fel
        // vidare till mutationens `error`.
        if (handle.closed) {
          throw new Error('Fönstret stängdes innan dokumentet hann öppnas. Tryck på Visa igen.');
        }
        handle.location.href = url;
      } catch (err) {
        if (!handle.closed) {
          // [RÄTTAT, TASK-309.26 review-runda 2] explicit open()/close() —
          // se docblocket ovan: garanterar att felsidan ERSÄTTER, aldrig
          // APPENDAS efter, laddningssidan (eller något annat tidigare
          // skrivet innehåll), oavsett anroparens städning.
          handle.document.open();
          handle.document.write(
            '<p style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 32rem;">' +
              'Kunde inte öppna dokumentet. Stäng fliken och försök igen.</p>',
          );
          handle.document.close();
        }
        throw err;
      }
    },
  });
}
