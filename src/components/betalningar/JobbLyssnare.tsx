import { useJobbRealtime, useJobbstatus } from '@/data/betalningar/useJobbstatus';
import { betalningarPa } from '@/lib/funktionsflaggor';

/**
 * [TASK-346.4 AC #5] Kvittojobbets lyssnare — RENDERAR INGENTING.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR EN KOMPONENT SOM INTE SYNS
 * ═══════════════════════════════════════════════════════════════════════════
 * ADR-129 beslut 8 kräver TVÅ saker av klienten: att den prenumererar på
 * `jobb_rad`, och att den LÄSER läget vid appöppning. Båda är effekter som
 * måste bindas till appens livscykel, och i React binds livscykel till en
 * monterad komponent.
 *
 * Alternativet — att lägga dem i den första betalningsVYN — hade gjort
 * kontraktet falskt: en iPad som öppnas på Hem, medan kvittona går i
 * bakgrunden, hade då varken prenumererat eller läst förrän Lotta navigerade
 * till Betalningar. Hem-kortet ska visa "8 kvitton skickade" utan att någon
 * gått dit (PRD berättelse 11).
 *
 * KOMPONENTEN RETURNERAR `null`, alltid. Den lägger ingen nod i DOM:en och
 * kan därför inte påverka layout, fokusordning, skärmläsarträd eller en
 * enda visuell baseline. Ytorna som VISAR jobbets läge byggs av TASK-346.6
 * och TASK-346.7 — de läser samma cache, som denna komponent håller färsk.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MILJÖFLAGGAN GATAR BÅDA EFFEKTERNA
 * ═══════════════════════════════════════════════════════════════════════════
 * Med flaggan av (prod, tills Marcus slår på den) öppnas ingen WebSocket och
 * görs ingen läsning. Det är inte kosmetika: i prod finns varken
 * migrationerna, cron-posten eller Vault-hemligheten ännu (ADR-129 § Negativa
 * och skuld), så en prenumeration hade lyssnat på en tabell som inte finns
 * och en läsning hade fått 404 från en odeployad funktion.
 *
 * Flaggan läses en gång per rendering, INTE i en `useEffect`: den är ett
 * byggtidsvärde och kan aldrig ändras i drift (se `funktionsflaggor.ts`).
 */
export function JobbLyssnare() {
  const pa = betalningarPa();

  // BÅDA hookarna anropas ALLTID, och gatas INUTI sig själva på `pa`.
  // Reglerna för hooks förbjuder ett villkorat hook-anrop, så flaggan trådas
  // in i stället för att komponenten returnerar tidigt före anropen. Med
  // flaggan av öppnas ingen kanal (`useJobbRealtime`) och görs inget
  // nätverksanrop (`enabled: false` i `useJobbstatus`).
  useJobbRealtime(pa);
  useJobbstatus(undefined, pa);

  return null;
}
