import { jobbDelutfall } from '@/components/betalningar/inkorg-harledningar';
import { MessageBox } from '@/components/primitives';
import { useJobbstatus } from '@/data/betalningar/useJobbstatus';
import { betalningarPa } from '@/lib/funktionsflaggor';

/**
 * Kvittojobbets banderoll på Hem — synlig ENDAST medan ett jobb faktiskt
 * arbetar, osynlig i alla andra lägen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR YTAN ÖVERLEVDE NÄR KORTET DOG
 * ═══════════════════════════════════════════════════════════════════════════
 * Banderollen satt inuti `BetalningarKort`, som Marcus underkände och som
 * `Hem.tsx` inte längre renderar (se dess § 4 för domen). Men PRD berättelse
 * 11 vill fortfarande att Hem säger att kvittona går, utan att Lotta gått
 * till inkorgen — och just den meningen bar aldrig kortets grundfel
 * (kortet blandade en LISTA över alla öppna betalningar med en KNAPP som
 * bara opererade på en delmängd). Banderollen har ingen sådan tvetydighet:
 * den säger en sak om ett pågående jobb och erbjuder ingen handling.
 *
 * Den lyfts därför ut som en egen, fristående yta i stället för att följa
 * med kortet i graven. Samma klass som `Bevakningsrad`: ett block som helt
 * enkelt inte finns när det inte har något att säga, och som därför inte kan
 * störa Morgonkollens Marcus-låsta blockordning.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ETT FÄRDIGT JOBB FRÅN I GÅR ÄR INTE DAGENS NYHET
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma mätta fälla som `BetalningsInkorg.tsx` bokför: banderollen visade
 * "1 kvitto skickade" innan Lotta gjort något, därför att det SENASTE
 * jobbet var TASK-346.4:s provkörning dagen innan. Hem har ingen egen
 * session-koppling till ett jobb, så villkoret är det strängare av
 * inkorgens två: visa bara ett jobb som fortfarande ARBETAR (`kvar > 0`).
 * Ett avslutat jobb tystas — även ett lyckat.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MILJÖFLAGGAN GATAS INUTI, INTE AV ANROPAREN
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma form som `JobbLyssnare` (se dess § MILJÖFLAGGAN): flaggan trådas in
 * i `useJobbstatus` i stället för att komponenten returnerar tidigt före
 * hook-anropet — hooks-reglerna förbjuder ett villkorat anrop. Med flaggan
 * av görs INGET nätverksanrop (`enabled: false`), vilket är avsikten i prod
 * där EF:en ännu inte är deployad, och i fixturvärlden där
 * `playwright.config.ts` sätter flaggan till `av` och WebSocket-/EF-vakterna
 * fäller varje omockat anrop.
 *
 * Hooken läser `jobbstatus(null)` — samma cache-nyckel `JobbLyssnare` redan
 * håller färsk för hela appen — så monteringen kostar inget extra anrop.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * [TASK-451.7] MEDVETET INGEN SKELETON-RESERVATION
 * ═══════════════════════════════════════════════════════════════════════════
 * Diagnoskartan (`docs/research/kallstarten-diagnoskarta-2026-09-18.md` § 6
 * punkt 7) namnger denna komponent som ETT av tre block som "KAN komma" och
 * därför principiellt kunde reservera plats (samma regel som motiverar
 * `Bevakningsrad`s nya pending-skelett). Valet här är ändå att INTE
 * reservera, av två skäl, mätta snarare än gissade:
 *
 * 1. Villkoret ovan (`betalningarPa()`) gatar hela hooken — flaggan är AV i
 *    hela acceptance-/webblasarbeteende-miljön (`playwright.config.ts`
 *    hårdkodar `VITE_FEATURE_BETALNINGAR: 'av'`), så komponenten renderar
 *    `null` OAVSETT laddningsläge i varje test denna skiva kan mäta mot. En
 *    reservation hade alltså varit en ren, evig SHRINK i just den miljö
 *    CLS-grinden kör i — motsatsen till avsikten.
 * 2. Banderollen visas per konstruktion bara medan ett kvittojobb faktiskt
 *    ARBETAR (`kvar > 0`) — en sällsynt, session-bunden händelse (Lotta
 *    startar ett jobb och lämnar sidan öppen), inte något som är sant vid en
 *    genomsnittlig sidladdning. "Reservera där blocket oftast finns,
 *    kollapsa mjukt där det oftast saknas" (uppdragets dilemma-regel) pekar
 *    här entydigt mot kollaps: att reservera en platshållare som nästan
 *    alltid inte fylls är en sämre avvägning än den ovanliga, riktiga
 *    insättningen när ett jobb väl pågår.
 *
 * Namngiven kvarstående lucka: startar ett kvittojobb EXAKT under en
 * pågående Hem-laddning (osannolikt — jobbet startas via en handling på en
 * redan laddad sida) skulle banderollens första framträdande fortfarande
 * knuffa `Genvagar`/`SenasteAktivitetKompakt` — samma insättnings-CLS som
 * `Bevakningsrad` hade innan denna skiva. Inte åtgärdat här: scenariot
 * kräver flaggan PÅ och en pågående Hem-laddning samtidigt, ett fönster som
 * varken denna miljö kan mäta eller produkt-datan visar vara vanligt.
 */
export function KvittojobbBanderoll() {
  const jobb = useJobbstatus(undefined, betalningarPa());
  const senaste = jobbDelutfall(jobb.data);
  const utfall = senaste && senaste.kvar > 0 ? senaste : null;

  if (!utfall) return null;

  return (
    <MessageBox intent={utfall.intent} title={utfall.rubrik}>
      Kvittona skickas i bakgrunden. Du kan lämna sidan.
    </MessageBox>
  );
}
