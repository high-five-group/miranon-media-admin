/**
 * ÅTGÄRDS-SIDAN — PRODUKTIONSKOD sedan TASK-171.5 (ADR-103 B2 steg 4),
 * varv 4-formen promoverad. Marcus godkände formen i sin helhet 2026-08-09
 * (tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json,
 * "godkand": marcus, citat "Ser bra ut, godkänner") — nedanstående är
 * därmed den skarpa, permanenta ytan, inte längre en prototyp under
 * bedömning.
 *
 * FRÅGAN SOM BESVARADES (throwaway-kontraktet klausul i, S100):
 *   "Hur ska åtgärds-sidan se ut — den enda platsen där något verkställs?"
 *
 * VARV 4 STÄLLER OM HELA YTAN KRING EN FRÅGA VARV 3 ALDRIG STÄLLDE:
 * **hur kom Lotta hit?** Svaret (Marcus 2026-08-07): hon markerade ett eller
 * flera personkort i Anmälda deltagare-blocket på eventdetaljen och tryckte
 * Åtgärder. Ur det följer tre ändringar som inte är kosmetik:
 *
 *  · MOTTAGARNA ÄR `Deltagare` § `MarkerbartKort`, inte gruppdynamikens
 *    kompakta kort. Marcus: "Om hon har markerat 7 personkort på
 *    eventdetalj-sidan och tryckt på 'Åtgärder' då ska hon direkt se EXAKT
 *    SAMMA KORT IGEN … i markeringsläge, alltså gröna." Varv 3 mötte henne
 *    med en annan kortform än den hon just klickat på — kontinuiteten bröts
 *    i det ögonblick den behövdes mest.
 *  · RÄKNAREN FÖRST: "7 av 19 deltagare markerade" (Marcus ordval), före
 *    listan. Den svarar på "vad tog jag med mig hit?" innan något annat — och
 *    är sedan varv 4b också listans ACCORDION-HUVUD: korten är INFÄLLDA från
 *    början, så åtgärderna syns direkt utan att hon behöver scrolla förbi fem
 *    kort à ~170 px. Marcus: "Så hon direkt kan 'Se' åtgärderna och välja en
 *    åtgärd." Hon kom hit för att GÖRA något; det hon skulle göra måste synas.
 *  · ÖVERSTA BLOCKET BÄR BARA EVENTVÄLJAREN. Sammanfattningen och
 *    deadline-pillen sköt ned mottagarlistan; hon vet redan vilket event hon
 *    står i — hon kom från dess detaljsida. Deadline flyttade till
 *    Betalningar, där den gäller.
 *
 * Den kompakta `Gruppdynamik`-formen är KVAR, men bara i plockaren: "De
 * personkort du byggde in här är rätt för 'Lägg till fler personer från
 * eventet' men INTE för alla, inte för 'Mottagarna'."
 *
 * FORMEN ÄR B′ (Marcus-vald 2026-08-07): hubb med eventväljare överst,
 * PERMANENT REDIGERBAR mottagar-yta, och en åtgärdsmeny där den valda
 * åtgärden fälls ut IN-PLACE med de övriga raderna KVARSTÅENDE. Strukturen
 * stod fast genom varv 2:s underleverans — det var UTFÖRANDET som revs.
 *
 * VARV 3 RÄTTADE FYRA SAKER MARCUS PEKADE UT (2026-08-07), och alla fyra är
 * KOPIERINGAR ur befintliga ytor, inte nya påfund. Punkt 3 gäller sedan varv 4
 * bara plockaren; mottagarna bär deltagarkortet:
 *
 *  1. SIDHUVUDET är `ManuellAnmalanForm` § `Sidhuvud`, klass för klass: rund
 *     tillbaka-chevron (`size-11 rounded-full bg-bg-muted`, `ChevronLeft 26`),
 *     sedan `<header … border-border border-b px-4 pb-5>` med `h1
 *     font-semibold text-3xl`. Marcus: "det är ju likadant på de flesta sidor
 *     och så borde du byggt direkt." Varv 2 bar en naken `h1` utan linje.
 *
 *  2. ÖVERSTA BLOCKET är samma sidas Eventet-block: rubrikfritt kort
 *     (`divide-y divide-border rounded-2xl bg-bg-muted px-4`) med väljaren
 *     överst, sammanfattning som `dl`, och sekundär navigering sist. Bara det
 *     som påverkar HANDLINGEN står i sammanfattningen (18.18 punkt 4).
 *
 *  3. MOTTAGARNA ÄR PERSONKORT, ALDRIG RADER. Marcus: "det är big NO NO, Lotta
 *     måste känna igen sig!! Personerna ska listas på sina personkort EXAKT som
 *     dem gör på eventdetaljer." Formen är `Gruppdynamik` § `PersonKort` —
 *     som i sin tur ärvde den av `PersonMiniKort` på anmälans-detaljsidan
 *     (S93 våg 19): initial-cirkel `size-9` i `bg-bg-emphasized`, namn i
 *     `font-medium text-body`, allt i en `rounded-xl bg-surface`-yta med
 *     transparent kant. Ett kort som dras hit från eventdetaljen ser identiskt
 *     ut med kortet det kom ifrån — det är hela poängen.
 *
 *  4. SÖKNINGEN BEHÅLLS men träffarna listas också som kort. Marcus: "söka på
 *     den, de va bra. Men de ska listas på kort."
 *
 * DET SOM SAKNADES I VARV 2 SITTER NU PÅ KORTET: statusbadge (`StatusBadge`,
 * pill-skalans `sm` per `T127`), betalningsstatus per person i den linjerade
 * underraden, och deadline-signalen i eventblocket (`deadlineStatus` —
 * DELAD med betalningsvyn, inte en andra kopia av 14-dagars-regeln).
 *
 * GRAMMATIKEN ÄR ÄRVD, INTE UPPFUNNEN — `DetaljGrupp`/`EtikettVardeRad` ur
 * eventsidans S93-facit, radformens hover-platta och `NumRuta` ur
 * `detail/Atgarder.tsx`, och sändvertikalens kontrakt ur
 * `segment/SegmentMailCompose.tsx` (pessimistisk bulk, skriv-för-att-bekräfta,
 * grön knapp eftersom handlingen når utomstående — aldrig danger).
 *
 * [TASK-174, 2026-08-10] PRODUKTIONSSTATUS PER DEL — inte längre enhetligt
 * READ-ONLY. Mottagar-listan läses via `fetchRegistrations` genom
 * router-context-DI (adapter-gränsen kringgås aldrig, oförändrat sedan
 * prototyp-eran).
 *
 * BETALNINGARNA SKRIVER VERKLIGT sedan `TASK-171.5`s promovering:
 * `BetalningsSkrivYta` (nedan) muterar basen via `useSetPaymentStatus`/
 * `useUpdatePaymentNote` (`registrationPayments.ts`), takt-vaktad av
 * `TASK-147.4`. Ingen prototyp-flagga skyddar längre kryssen — se
 * `BetalningsSkrivYta`s egen docblock för hela historien.
 *
 * [ÄNDRAS AV TASK-147.2/147.3, GJORT] ALLA FYRA ÅTGÄRDER SKICKAR VERKLIGT:
 * varje rad i `ATGARDER` går genom `useSendActionEmail`
 * (`data/mutations/actionEmail.ts`) mot `TASK-147.1`s server-EF
 * (`send-action-email`, den bilage-fria batchgrenen) — servern löser
 * mottagarna, skickar, och (för bekräftelse/eventinfo/påminnelse) skriver
 * sitt eget stämpel-fält i EN operation; se `GranskningsSida` § `skicka()`.
 * TASK-147.2 kopplade "Skicka bekräftelsemail"; TASK-147.3 kopplade de tre
 * återstående (påminnelse/eventinfo/fritt) mot SAMMA väg — `simuleraUtfall`
 * (prototyp-grenens minnesbyggda svar) har inga kvarvarande anropare och är
 * riven i samma skiva. `PrototypRigg` STOD ÄNNU KVAR till och med TASK-147.3
 * — RIVEN i TASK-147.8 (se filens nedre del, där riggen bodde): dess knappar
 * hade sedan TASK-147.3 redan slutat styra något (`skicka()` går alltid den
 * verkliga vägen), och referens-specen (`tests/visual/atgardssida-
 * promoverings-grind.spec.ts`) nådde redan de tre utfallslägena via ett
 * mockat `send-action-email`-nätverkssvar i stället för riggens knappar —
 * rivningen tar alltså bort en redan-inert widget, ingen formändring på den
 * RENDERADE ytan (`granskning-yta` exkluderade riggen strukturellt sedan
 * TASK-171.1, se `GranskningsSida` nedan).
 *
 * BILAGOR ÄR SKARPA SEDAN TASK-147.5: bilageväljaren (`ArbetsYta` §
 * useQuery) läser eventets verkliga Bilagor-rader via
 * `dataSource.fetchEventAttachments` — se filens `BILAGEVÄLJAREN`-docblock
 * (§ BilageValjare) för varför klass A och B är oskiljbara i datat och
 * varför klass C strukturellt saknas. Den bilage-bärande sändvägen (loopad
 * singelsändning, ADR-067 D9) är kopplad in i `_shared/send-action-email.ts`
 * § `runActionSend` — grenvalet är automatiskt (AC #1), klienten skickar
 * bara `attachmentIds` (tom = oförändrad batchgren).
 *
 * MALLEN (ämnesrad/brödtext, `AtgardsTyp.mall`) FÖRBLIR STUBB — ingen
 * planerad skiva i `TASK-147`: en mall-editor för systemmallar är
 * uttryckligen senare (PRD § Utanför omfattningen), hårdkodningen är alltså
 * inte en lucka som väntar på nästa skiva.
 *
 * [RIVEN, TASK-171.5, ADR-103 B2 steg 4] `PrototypeSwitcher`-monteringen +
 * `PROTO_VARIANTS` i båda routerna (`routes/_authenticated/atgarder.tsx`,
 * `routes/_authenticated/event/$eventId/atgarder.tsx`) är rivna efter
 * Marcus godkännande. Ytan hade ingen variant-gren att flippa MOT
 * (171.1/171.2:s mätta divergens: `PROTO_VARIANTS` bar en enda post, ingen
 * kod läste `variantParam`) — rivningen är alltså ren
 * byggställningsborttagning, ingen formändring. `PrototypRigg` PRÖVADES DÅ
 * mot samma rivning och stod kvar med skäl (referens-specen nådde de tre
 * utfallslägena genom riggens knappar, och 147:s riktiga sändväg fanns inte
 * än) — den PRÖVNINGEN gäller inte längre, se rivnings-noten ovan:
 * `TASK-147.8` river riggen och dess båda monteringspunkter i sin helhet,
 * PrototypRigg-funktionen är riven ur filen (git bevarar, `git log -p --
 * src/components/events/atgarder/AtgardsSida.tsx`), och referens-specen
 * (`tests/visual/atgardssida-promoverings-grind.spec.ts`) är GRÖN mot detta
 * utan omtagning — den nådde redan de tre utfallslägena via ett mockat
 * nätverkssvar (se filens § 4–6 i sitt eget docblock), inte via riggens
 * knappar.
 */
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  History,
  Inbox,
  type LucideIcon,
  MailCheck,
  Paperclip,
  Plus,
  Send,
  Upload,
  UserPlus,
} from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { useAuth } from '@/auth/useAuth';
/* [TASK-346.7 AC #2] Betalningsdomänens delade delar. Panelen bygger inget
   eget formulär — `PanelBetalningar` monterar samma `RegistreraForm` som
   inkorgen (PRD § Ytorna: "samma formulär, förvald person"). */
import { idagIso } from '@/components/betalningar/idag';
import { harledRad, type InkorgsRad } from '@/components/betalningar/inkorg-harledningar';
import { PanelBetalningar } from '@/components/betalningar/PanelBetalningar';
import { Button } from '@/components/primitives/Button';
import { Dialog, DialogTrigger } from '@/components/primitives/Dialog';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Select, SelectItem } from '@/components/primitives/Select';
import { Skeleton } from '@/components/primitives/Skeleton';
import { SlideToConfirm } from '@/components/primitives/SlideToConfirm';
import { TextArea } from '@/components/primitives/TextArea';
import { displayName } from '@/components/registrations/registration-display';
import { formatMB } from '@/data/adapters/attachmentUpload';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { useSendActionEmail, useSendActionTestEmail } from '@/data/mutations/actionEmail';
import { useSendReceipt } from '@/data/mutations/receipts';
/* VARV 13 REV VARV 12:s MONTERING AV `BetalningsDetaljer`.
   Den var rätt ambition och fel mekanism: eventdetaljens arbetsyta KAN inte
   skriva, och det är dess uttalade DoD-krav sedan `TASK-145.4` — se
   `BetalningsSkrivYta` nedan för hela historien och belägget. Åtgärds-sidan
   bygger därför sin EGEN skrivyta, vilket är vad `TASK-147` § skiva 8 säger.

   `deadlineStatus` föll redan i varv 12 med den fristående pillen och kommer
   inte tillbaka: den nya skrivytan bär sin egen deadline-signal. */
import {
  BETALNING_LABEL,
  type Betalning,
  useSetPaymentStatus,
  useUpdatePaymentNote,
} from '@/data/mutations/registrationPayments';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { BETALSATT_VARDEN, type Betalsatt } from '@/domain/schemas';
import { PaymentStatus, RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { betalningarPa } from '@/lib/funktionsflaggor';
import { queryKeys } from '@/queries/keys';
import { AndraRad, DetaljGrupp } from '../detail/DetaljGrupp';
import { EventValjare } from '../EventValjare';
import {
  ATGARDER,
  type AtgardsTyp,
  DAG_MANAD_FORMAT,
  dagManad,
  fyllPlatshallare,
  type Granskning,
  obekraftad,
  obetald,
  saknarAnmalningsavgift,
  saknarSlutbetalning,
} from './atgardsmallar';
import { type Utfall, verkligtUtfallTillUtfall } from './atgardsutfall';

/* ------------------------------------------------------------------ *
 * Grammatik ärvd ur detail/Atgarder.tsx — hover-plattan skjuter 8 px
 * utanför kortets 16 px-inset utan att texten flyttas (K56).
 * ------------------------------------------------------------------ */
const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

/** Radnumret i VIT ruta — får aldrig dela färg med hover-plattan (18.15). */
function NumRuta({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface font-semibold text-caption text-text-secondary"
    >
      {n}
    </span>
  );
}

/** Kortytan — Eventet-blockets/DetaljGrupps tonala kort (18.18 punkt 2). */
const KORT_KLASS =
  'rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong';

/**
 * KRYSSRUTANS RUTA — EN form för sidans båda kryss-ytor (varv 14).
 *
 * Marcus 2026-08-07: "nu har vi också flera olika typer av checkboxar. En blå
 * och en svart. Jag gillar den blåa mer faktiskt."
 *
 * Han hade sett två former på SAMMA sida, och båda var mina: bilageväljarens
 * native `<input type="checkbox">` (varv 10) och betalningarnas RAC-kryss
 * (varv 13). De skilde sig i tre mått samtidigt — 16 mot 20 px, radie 0 mot
 * 4 px, och färg.
 *
 * FÄRGEN VAR EN BUGG, INTE ETT VAL. Se `components.css` § Kryssruta: den blå
 * kom ur att `--mm-color-primary` inte existerar, så `accent-color` föll till
 * webbläsarens `auto` — på macOS användarens EGEN systemaccent. Blått är nu en
 * riktig token (`--p-blue-9`), och därmed samma färg för Lotta som för Marcus.
 *
 * RAC-FORMEN VANN ÖVER NATIVE, av två skäl som båda är mätbara: den är appens
 * etablerade (4 av 5 kryss i `src/components/` bär exakt denna klassrad —
 * `Betalningar`, `Deltagare`, `EventCheckin` och denna fil), och `accent-color`
 * kan bara styra FÄRG — inte radie, storlek eller bockens form. Native hade
 * alltså aldrig kunnat matcha de andra fyra.
 *
 * INVENTERINGEN AV HELA APPEN ÄR EN EGEN TRÅD (`T134`), per Marcus: "samma sak
 * här som med pills och knappar, inventera och kolla". Denna konstant löser
 * ÅTGÄRDS-SIDAN; de tre andra filerna ägs av S93 och rörs inte härifrån.
 *
 * STORLEKEN ÄR 16 px SEDAN VARV 17 (Marcus: "Kan vi göra checkboxen lite
 * mindre? Känns ganska stor"), ned från förlagans `size-5` (20 px). Bocken
 * följde med 14 → 12 px så proportionen inuti rutan hålls.
 *
 * DETTA ÄR EN MEDVETEN AVVIKELSE FRÅN DE TRE ANDRA, inte en ny drift: de bär
 * fortfarande 20 px, och `T134`:s app-svep ska ta ställning till vilket mått
 * som blir appens. Åtgärds-sidan går först eftersom den är ytan Marcus
 * granskar; avvikelsen är bokförd i tråden så svepet ärver frågan i stället
 * för att upptäcka den.
 */
const KRYSSRUTA_KLASS =
  'flex size-4 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-(--mm-checkbox-selected-border) group-data-[selected]:bg-(--mm-checkbox-selected-bg)';

/**
 * TEXTYTANS MORF-PARITET — den låsta rutan och `TextArea` bär SAMMA höjd och
 * SAMMA inre padding, så inget flyttar sig när läget växlar (Marcus varv 9:
 * "jag avskyr sådana layoutförändringar").
 *
 * HÖJDEN ÄR HÄRLEDD, INTE VALD — `TextArea rows={7}` renderar:
 *
 *     7 rader × 24 px      = 168 px   (`text-body` = 1rem/1.5, tailwind.css 86–87)
 *   + `py-2`  (8 + 8)      =  16 px   (textAreaVariants bas)
 *   + kant    (1 + 1)      =   2 px
 *   ------------------------------
 *                            186 px
 *
 * `min-h-28` (112 px) ur `size="md"` är mindre och binder alltså inte — raderna
 * vinner. Talet gäller så länge `text-body` är 1.5 och `rows` är 7; ändras
 * något av dem måste konstanten räknas om. Det är samma beroende `DetaljGrupp`s
 * 48 px-paritet redan bär, och det är därför den är e2e-mätt där.
 *
 * DOM-MÄTT, INTE BARA RÄKNAT (2026-08-07, Chrome mot byggd CSS, isolerad
 * mätsida — appens egen route ligger bakom auth): låst 186,00 px mot
 * `TextArea rows={7}` 186,00 px, **Δ = 0**.
 *
 * `lh`-ENHETEN PRÖVADES OCH FÖLL — värd att veta, eftersom den ser ut som det
 * självklart bättre svaret (typografi-följsam, inget hårt tal). `h-[calc(7lh+
 * 1rem+2px)]` mätte **162,00 px, Δ = −24**: `+` utan omgivande mellanslag är
 * ogiltigt i CSS `calc()`, så hela regeln droppas tyst och elementet faller
 * till innehållets egen höjd. Formen `calc(7lh_+_1rem_+_2px)` hade sannolikt
 * fungerat, men den vinner bara robusthet vi inte behöver just nu — det hårda
 * talet är mätt, och över-engineering-vakten skär spekulativ robusthet ovanför
 * golvet.
 *
 * `border border-transparent` OCH `px-3 py-2` reserverar kantens och
 * paddingens pixlar i det låsta läget — samma princip som pill-skalans tredje
 * regel (T130): utan dem börjar texten på en annan rad än den gör i fältet, och
 * hoppet flyttar bara från rutans kant till dess innehåll.
 *
 * `overflow-auto` på den låsta rutan, eftersom `TextArea` rullar vid överflöd —
 * en text längre än sju rader får inte spränga en yta som fältet hade rullat.
 */
const TEXTYTA_KLASS = 'h-[186px] rounded border border-transparent px-3 py-2';

/**
 * Namn-previewns gräns. **7 sedan varv 7 — Marcus höjde den från 5 med öppna
 * ögon:** "7 borde vi i alla fall få plats med nu."
 *
 * FEMMAN VAR RESEARCH-HÄRLEDD OCH RIVS ÖPPET, inte tyst. Tre oberoende
 * förstapartskällor konvergerade på fem — MUI `AvatarGroup` (`max = 5`),
 * Fluent UI v8 `Facepile` (`maxDisplayablePersonas: 5`), Microsoft Learn ("the
 * default and recommended number"). Belägg:
 * `docs/research/mottagar-preview-monster-2026-08-07.md` § 2.
 *
 * VARFÖR HÖJNINGEN ÄR LEGITIM OCH INTE DRIFT: passet reserverade sig SJÄLVT
 * mot sin egen siffra — vårt scenario (read-only namn-bekräftelse utan foton)
 * ligger MELLAN de etablerade mönstren, och femman var lånad ur
 * avatargruppernas talkluster, aldrig belagd för den här formen. Talen gällde
 * dessutom AVATARER: cirklar som överlappar och äter bredd. Namn-pillar
 * radbryts i stället för att trängas, så bredd-argumentet bakom femman gäller
 * inte den form vi faktiskt byggde. Kvar av passet står spridningen (Gestalt 3
 * · Primer 4 med mönsterbyte · Ant Design inget default) som visar att det
 * aldrig fanns EN branschsiffra att avvika ifrån.
 */
const PREVIEW_GRANS = 7;

/**
 * Previewns innehåll i BÅDA sina former, ur EN beräkning.
 *
 * `pillar` + `rest` är det synliga (namn-pillar och en eventuell "och N till"),
 * `mening` är samma sak som sammanhållen svensk uppräkning för skärmläsaren:
 * "Anna, Bert, Cissi, David och Erik och 9 till."
 *
 * DE DELAR TRUNKERING MED AVSIKT. Formerna räknades tidigare var för sig —
 * meningen här, pillarnas `slice` på användningsstället — och två uttryck för
 * samma regel glider isär vid nästa ändring av gränsen. Nu är det omöjligt:
 * ändras regeln ändras båda formerna i samma andetag.
 *
 * Under gränsen: bara uppräkningen. Exakt EN över gränsen ger ingen "+1 till"
 * — då är det billigare att visa namnet än att räkna det (samma regel som
 * "frånvaron är informationen": en rest på ett är ingen rest).
 */
function namnPreview(namn: string[]): { pillar: string[]; rest: number; mening: string } {
  const uppraknat = (n: string[]) =>
    n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} och ${n[n.length - 1]}`;

  if (namn.length <= PREVIEW_GRANS + 1) {
    return { pillar: namn, rest: 0, mening: `${uppraknat(namn)}.` };
  }
  const pillar = namn.slice(0, PREVIEW_GRANS);
  const rest = namn.length - PREVIEW_GRANS;
  return { pillar, rest, mening: `${pillar.join(', ')} och ${rest} till.` };
}

/* ------------------------------------------------------------------ *
 * De FYRA åtgärdstyperna (varv 6, Marcus 2026-08-07) — `AtgardsTyp`,
 * `ATGARDER` (namnen/mallarna, verbatim ur den ursprungliga omstyrningen)
 * och predikaten `saknarAnmalningsavgift`/`saknarSlutbetalning`/`obetald`/
 * `obekraftad` FLYTTADE [TASK-241.2] till `./atgardsmallar` — samma innehåll,
 * importerat ovan — så att sändytan (`src/components/svep/`) kan återanvända
 * mallarna i stället för att bygga en egen kopia (ADR-114 § Implementations-
 * beslut: "Sändvägarna återanvänder Åtgärds-sidans befintliga sändkontrakt").
 * Se `atgardsmallar.ts` för hela historiken bakom fyra-listan.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * BILAGEVÄLJAREN — SKARP sedan TASK-147.5. Den hårdkodade fyra-post-stubben
 * (`BILAGOR`) är RIVEN: väljaren läser nu eventets VERKLIGA Bilagor-rader via
 * `dataSource.fetchEventAttachments` (get-event-attachments-EF:en, `ArbetsYta`
 * nedan) — samma `Attachment`-domänform TASK-146.4/146.5 redan producerar.
 *
 * KLASSERNA A OCH B ÄR ODELBARA I DATAT, INTE BARA I YTAN (ORDLISTA §
 * Bilaga). `generate-event-attachment/index.ts` § SAMTIDIGHETS-NOT
 * dokumenterar varför: Bilagor-tabellen fick ALDRIG ett dokumentklass-fält
 * (146.5 behövde det inte). Väljaren listar därför ALLA rader länkade till
 * eventet — det ÄR "klass A och klass B sändbara", eftersom det inte finns
 * någon klass-signal att filtrera bort något med. Skillnaden mellan en
 * uppladdad fil och en genererad Deltagarinformation-PDF syns bara i namnet,
 * precis som den gjorde i stubben (docblocken ovan hade redan denna
 * begränsning bokförd — den är alltså INGEN ny lucka TASK-147.5 öppnar).
 *
 * KLASS C (kvitto) ÄR STRUKTURELLT FRÅNVARANDE, INTE FILTRERAD BORT.
 * Kvittogenereringen (`TASK-147.7`) är inte byggd — det finns ingen Bilagor-
 * rad att lista för den, eftersom en person-genererad bilaga (SEX mottagare
 * = SEX filer, se den rivna docblockens ursprungliga resonemang) uppstår vid
 * SÄNDTILLFÄLLET, inte som en förberedd rad Lotta väljer i förväg. Det är en
 * egen designfråga för 147.7, inte en gissning att göra här.
 *
 * INGEN FÖRVALS-LOGIK (grillad samsyn beslut 5, bokstavligt, AC #4):
 * `useState(new Set())` i `ArbetsYta` är den ENDA källan till vilka bilagor
 * som är valda — listan som RENDERAS (nu server-data i stället för en
 * hårdkodad array) påverkar aldrig detta state. Ingen bilaga är, eller kan
 * bli, förvald bara för att den finns i listan.
 * ------------------------------------------------------------------ */

/* ================================================================== *
 * PLATSHÅLLARNA — granskningens skarpaste verktyg (varv 19). `deadlineDatum`,
 * `fyllPlatshallare` och `Granskning` FLYTTADE [TASK-241.2] till
 * `./atgardsmallar` (importerade ovan) av samma skäl som `ATGARDER` — se den
 * filens docblock för hela "de ofyllda är fyndet"-bakgrunden.
 * ================================================================== */

/* ================================================================== *
 * DELTAGARKORTET — samma kort Lotta MARKERADE på eventdetaljen.
 *
 * "HUR KOM LOTTA HIT?" är frågan som styr hela den här ytan (Marcus
 * 2026-08-07). Svaret: hon markerade personkort i Anmälda deltagare-blocket
 * och tryckte Åtgärder. Alltså måste det FÖRSTA hon ser vara exakt de korten
 * igen, i markeringsläge — gröna, i en lista, precis som hon lämnade dem.
 *
 * Varv 3 hade fel kort här. `Gruppdynamik` § `PersonKort` (initial-cirkel +
 * namn) är rätt för PLOCKAREN — en kompakt sökträff — men fel för mottagarna:
 * de har redan en form, och den formen är `Deltagare` § `MarkerbartKort`.
 * Marcus: "Om hon har markerat 7 personkort på eventdetalj-sidan och tryckt på
 * 'Åtgärder' då ska hon direkt se EXAKT SAMMA KORT IGEN."
 *
 * FORMEN, klass för klass ur `Deltagare.tsx`:
 *  · Kortet ÄR kryssrutan (rå RAC `Checkbox`, BorOverRad-precedenten) — inga
 *    länkar inuti, så L303 (interaktivt bor aldrig i interaktivt) håller.
 *  · Vald: `border-(--mm-success)` + `bg-(--mm-success-bg)`. Ovald: kortets
 *    vanliga `--mm-navcard-border`/`bg-surface`. Kant-boxen finns i BÅDA lägena
 *    så geometrin aldrig hoppar.
 *  · KANTEN ÄR WCAG 1.4.1-BÄRAREN — inte den gröna plattan. Ovalt kort har
 *    transparent kontur, valt får `--mm-success`: skillnaden är att en kontur
 *    UPPSTÅR, inte att en färg byts. Plattan mäter 1,05:1 mot vitt och bär i
 *    praktiken ingenting för den färgblinde. Tona aldrig ned kanten.
 *  · Identitetszonen: namn `font-semibold text-body`, etiketten "E-post" i
 *    `text-caption text-text-muted`, adressen i `text-small`.
 *  · Pill-slotten är RESERVERAD (`w-30 sm:w-[45%]`), inte innehålls-styrd —
 *    annars ärver identitetskolumnen pillarnas breddvariation och korten
 *    sågtandar (S91-mätningen: 157,95 mot 214,33 px identitetsbredd).
 *  · Obekräftad-pillen VIKER för markeringen (byggkrav 2) — ingen 'Vald'-pill
 *    ersätter den. Kategori-pillen står kvar i båda lägena.
 *  · Metaytan: Anmäld-raden, ENDAST utförda utskick, historikraden sist med
 *    hela namnet "Miranon Media".
 *
 * Länkarna VILAR (`lankat={false}`-grenen i förlagan) — i markeringsläget är
 * hela kortet en kryssruta, och det är precis det läget den här sidan bär.
 * ================================================================== */

const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });

/** Bekräftad ⟺ basens Status har lämnat 'Obekräftad' (ORDLISTA; S73 K53). */
function arBekraftad(r: Registration): boolean {
  return r.status !== RegistrationStatus.OBEKRAFTAD;
}

type DeltagarKategori = 'formular' | 'manuell' | 'medfoljande' | 'vantelista';

function kategori(r: Registration): DeltagarKategori {
  switch (r.kalla) {
    case RegistrationSource.MANUELL:
      return 'manuell';
    case RegistrationSource.MEDFOLJANDE:
      return 'medfoljande';
    case RegistrationSource.VANTELISTA:
      return 'vantelista';
    default:
      return 'formular';
  }
}

/** Pill-etikett per kategori — normen (via formulär) får inget märke (K37). */
const KATEGORI_PILL: Partial<Record<DeltagarKategori, string>> = {
  manuell: 'Manuellt tillagd',
  medfoljande: 'Medföljande',
  vantelista: 'Från väntelistan',
};

/* `dagManad` FLYTTAD [TASK-241.2] till `./atgardsmallar` (importerad ovan,
   samma `DAG_MANAD_FORMAT`-instans som `anmaldText` nedan återanvänder). */

/** "Anmäld 1 juli 09:00" på EN rad (K45); saknad tidsstämpel ⇒ raden uteblir. */
function anmaldText(reg: Registration): string | null {
  if (!reg.inskickad) return null;
  const d = new Date(reg.inskickad);
  if (Number.isNaN(d.getTime())) return null;
  return `Anmäld ${DAG_MANAD_FORMAT.format(d)} ${KLOCKSLAG.format(d)}`;
}

/** SENASTE påminnelsen över basens tre parallella tidsstämplar (T16 enar dem). */
function senastePaminnelse(reg: Registration): string | null {
  const kandidater = [
    reg.betalningspaminnelseSkickad,
    reg.paminnelseAnmalningsavgiftSkickad,
    reg.paminnelseSlutbetalningSkickad,
  ].filter((v): v is string => v != null && !Number.isNaN(Date.parse(v)));
  if (kandidater.length === 0) return null;
  return kandidater.reduce((senast, v) => (Date.parse(v) > Date.parse(senast) ? v : senast));
}

/** En rad i metaytan — ikon + text, aldrig interaktiv (K62/L303). */
function MetaRad({ ikon: Ikon, children }: { ikon: LucideIcon; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <Ikon aria-hidden="true" size={12} className="shrink-0" />
      {children}
    </span>
  );
}

/** Kortets innehåll — förlagans `KortInnehall` i sin `lankat={false}`-gren. */
function DeltagarKortInnehall({
  reg,
  vald,
  doljStatusPill = false,
}: {
  reg: Registration;
  vald: boolean;
  /** Resultatläget: "Obekräftad" säger fel sak om ett kort som just skickats.
      Se `UtfallsKort` för villkoret som gjorde flaggan nödvändig. */
  doljStatusPill?: boolean;
}) {
  const pill = KATEGORI_PILL[kategori(reg)];
  const anmald = anmaldText(reg);
  const bekraftelse = dagManad(reg.bekraftelseSkickad);
  const paminnelse = dagManad(senastePaminnelse(reg));
  const eventinfo = dagManad(reg.deltagarinfoSkickad);
  const genomforda = reg.antalGenomfordaEvent;

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span data-testid="deltagar-namn" className="break-words font-semibold text-body">
            {displayName(reg)}
          </span>
          <span className="text-caption text-text-muted">E-post</span>
          <span className="break-words text-small">
            {reg.email ?? <span className="text-text-muted">Saknas</span>}
          </span>
        </span>
        {/* Reserverad pill-slot — se blockets docblock (sågtand-mätningen). */}
        <span className="flex w-30 shrink-0 flex-wrap items-center justify-end gap-1.5 sm:w-[45%]">
          {!arBekraftad(reg) && !vald && !doljStatusPill && (
            <span className="rounded-full bg-(--mm-error-bg) px-2 py-0.5 font-medium text-caption text-error">
              Obekräftad
            </span>
          )}
          {pill && (
            <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
              {pill}
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-col gap-1 px-4 pt-2.5 pb-3 text-caption text-text-muted">
        {anmald && <MetaRad ikon={Inbox}>{anmald}</MetaRad>}
        {bekraftelse && <MetaRad ikon={MailCheck}>{`Bekräftelse ${bekraftelse}`}</MetaRad>}
        {paminnelse && <MetaRad ikon={MailCheck}>{`Påminnelse ${paminnelse}`}</MetaRad>}
        {eventinfo && <MetaRad ikon={MailCheck}>{`Deltagarinfo ${eventinfo}`}</MetaRad>}
        {genomforda != null && (
          <span className="mt-0.5 flex items-center gap-1.5">
            <History aria-hidden="true" size={12} className="shrink-0" />
            {genomforda === 0
              ? 'Första eventet hos Miranon Media'
              : `${genomforda} tidigare event hos Miranon Media`}
          </span>
        )}
      </div>
    </>
  );
}

/** Markerbart deltagarkort — `Deltagare` § `MarkerbartKort`, klass för klass. */
function MarkerbartDeltagarKort({
  reg,
  vald,
  onChange,
}: {
  reg: Registration;
  vald: boolean;
  onChange: (vald: boolean) => void;
}) {
  return (
    <Checkbox
      data-testid="markerbart-kort"
      isSelected={vald}
      onChange={onChange}
      // contrast-more-kanten bor i VARDERA grenen, aldrig i bas-klasserna:
      // varianten vinner annars över `border-(--mm-success)` och ger valda kort
      // den NEUTRALA kanten i förhöjd kontrast (förlagans review-fynd 6).
      className={`flex cursor-pointer flex-col rounded-xl border ${
        vald
          ? 'border-(--mm-success) bg-(--mm-success-bg) contrast-more:border-(--mm-success)'
          : 'border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)'
      }`}
    >
      <DeltagarKortInnehall reg={reg} vald={vald} />
    </Checkbox>
  );
}

/* ================================================================== *
 * PLOCKARENS KOMPAKTA KORT — `Gruppdynamik` § `PersonKort`.
 *
 * Marcus 2026-08-07: "De personkort du byggde in här är rätt för 'Lägg till
 * fler personer från eventet' men INTE för alla, inte för 'Mottagarna'."
 * Alltså: den kompakta formen BEHÅLLS här, där den är en sökträff — och bara
 * här. Initial-cirkel + namn + betalnings-underrad, DOM-mätt identiskt med
 * eventdetaljens gruppdynamik-kort (varv 3:s mätning står).
 * ================================================================== */

/**
 * Initialerna för cirkeln ("AA" ur "Anna Andersson") — max två, versala.
 *
 * Tredje duplikatet, med samma motiv som `Gruppdynamik` bokförde vid det
 * andra: `PersonMiniKort`s API är FÖRSEGLAT, så formen ärvs men inte koden.
 * Med tre förekomster är hjälparen en verklig `lib/`-kandidat — den noteras
 * för spec-ledet i stället för att lyftas i kastbar kod.
 */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/** Betalnings-underraden: ETT streck + EN utsaga, aldrig en tom uppräkning. */
function BetalRader({ reg }: { reg: Registration }) {
  const saknade: string[] = [];
  if (saknarAnmalningsavgift(reg)) saknade.push('Anmälningsavgift');
  if (saknarSlutbetalning(reg)) saknade.push('Slutbetalning');

  // Ej relevant (föreläsnings-semantiken) är INTE en brist och får aldrig
  // klassas som en — den utsagan står för sig själv.
  const ejRelevant =
    reg.anmalningsavgift === PaymentStatus.EJ_RELEVANT &&
    reg.slutbetalning === PaymentStatus.EJ_RELEVANT;

  const rader: { text: string; streck: string; klass: string }[] = ejRelevant
    ? [{ text: 'Betalning ej relevant', streck: 'bg-border-strong', klass: 'text-text-muted' }]
    : saknade.length > 0
      ? saknade.map((s) => ({
          text: `${s} saknas`,
          streck: 'bg-warning',
          klass: 'text-text-secondary',
        }))
      : [{ text: 'Betalning klar', streck: 'bg-success', klass: 'text-text-secondary' }];

  if (!reg.email) {
    rader.push({ text: 'Ingen e-postadress', streck: 'bg-error', klass: 'text-text-secondary' });
  }

  return (
    <ul className="flex flex-col gap-1 pl-12">
      {rader.map((r) => (
        <li
          key={r.text}
          data-testid="kandidat-statusrad"
          className="flex items-center gap-1.5 text-caption"
        >
          <span aria-hidden="true" className={`h-3.5 w-1 shrink-0 rounded-full ${r.streck}`} />
          <span className={`truncate ${r.klass}`}>{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Kompakt sökträff-kort med lägg-till-knapp. */
function KandidatKort({ reg, onLaggTill }: { reg: Registration; onLaggTill: () => void }) {
  const namn = displayName(reg);
  return (
    <div
      data-testid="kandidat-personkort"
      className="flex flex-col gap-2 rounded-xl border border-transparent bg-surface px-3 py-2.5 contrast-more:border-border-strong"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
        >
          {initialer(namn)}
        </span>
        <span className="min-w-0 truncate font-medium text-body">{namn}</span>
        <button
          type="button"
          onClick={onLaggTill}
          aria-label={`Lägg till ${namn} som mottagare`}
          className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-emphasized hover:text-text motion-safe:transition-colors"
        >
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
      <BetalRader reg={reg} />
    </div>
  );
}

/* ================================================================== *
 * MOTTAGAR-YTAN — markeringen hon kom hit med, oförändrad.
 *
 * Räknaren först ("7 av 19 deltagare markerade" — Marcus ordval), sedan de
 * markerade korten i en lista precis som i Anmälda deltagare-blocket, sedan
 * ingången till de omarkerade.
 *
 * AVMARKERING LÄMNAR KORTET KVAR I LISTAN, vitt — den är markeringslägets egen
 * grammatik, och den är oförändrad från eventdetaljen. Ett kort som FÖRSVANN
 * under fingret hade brutit den, och Lotta hade tappat platsen i listan. Det
 * omarkerade kortet räknas inte som mottagare någonstans; räknaren och alla
 * åtgärds-räknare går över de VALDA.
 *
 * Den permanenta redigerbarheten (Marcus-krav 2026-08-07: "hon kanske drar in
 * 7 stycken … men sen vill skicka tillbaka 1 person och hämta in 2 nya") bärs
 * alltså av två rörelser: avmarkera i listan, och plocka in ur "Lägg till fler".
 * ================================================================== */
function MottagarYta({
  eventId,
  valda,
  synliga,
  alla,
  onVaxla,
  onLaggTill,
}: {
  /** Eventet urvalet gäller. Saknas det finns inget att anmäla någon TILL,
      och den manuella vägen in utelämnas — se raden nedan. */
  eventId?: string;
  /** De markerade — mottagarna. */
  valda: ReadonlySet<string>;
  /** Korten som visas i listan: markeringen hon kom med, plus inplockade. */
  synliga: Registration[];
  /** Alla anmälda på eventet — nämnaren i räknaren. */
  alla: Registration[];
  onVaxla: (id: string, vald: boolean) => void;
  onLaggTill: (id: string) => void;
}) {
  /* LISTAN ÄR INFÄLLD FRÅN BÖRJAN (Marcus 2026-08-07: "Dem 5 som man ser direkt
     i listan nu måste nog också vara infällda från början. Så hon direkt kan
     'Se' åtgärderna och välja en åtgärd").

     Fem kort à ~170 px sköt ned Åtgärd-menyn under vikningen: hon kom hit för
     att GÖRA något, och det hon skulle göra syntes inte. Infälld blir sidan en
     halv skärm — räknaren svarar "vad tog jag med mig", åtgärderna står direkt
     under, och korten är ett klick bort när hon vill kontrollera dem.

     Räknar-raden ÄR accordion-huvudet: samma grammatik som `Gruppdynamik` §
     `NivaAccordion` — knappens `py-1.5` i en förälder med `py-2`, så
     hover-plattan läser som en KNAPP i raden, inte som raden själv. */
  const [listaOppen, setListaOppen] = useState(false);
  const [plockareOppen, setPlockareOppen] = useState(false);
  const [sok, setSok] = useState('');
  const listPanelId = useId();

  /** De MARKERADES namn i listordning — previewns innehåll. */
  const mottagarNamn = useMemo(
    () => synliga.filter((r) => valda.has(r.id)).map(displayName),
    [synliga, valda],
  );

  /** Previewns två former ur en beräkning — se `namnPreview`. */
  const preview = useMemo(() => namnPreview(mottagarNamn), [mottagarNamn]);

  const synligaIds = useMemo(() => new Set(synliga.map((r) => r.id)), [synliga]);
  const kandidater = useMemo(
    () =>
      alla
        .filter((r) => !synligaIds.has(r.id))
        .filter((r) =>
          sok.trim() === ''
            ? true
            : displayName(r).toLowerCase().includes(sok.trim().toLowerCase()) ||
              (r.email ?? '').toLowerCase().includes(sok.trim().toLowerCase()),
        ),
    [alla, synligaIds, sok],
  );

  return (
    <section aria-labelledby="grupp-mottagare" className="flex min-w-0 flex-col gap-2">
      <h2 id="grupp-mottagare" className="px-4 font-semibold text-lg">
        Mottagare
      </h2>

      <div data-testid="mottagar-kort" className={`divide-y divide-border ${KORT_KLASS}`}>
        {/* RÄKNAREN — det första hon ska se (Marcus: "typ '7 av 19 deltagare
            markerade'"), och tillika listans accordion-huvud. Antalet står som
            TEXT i knapp-etiketten så skärmläsaren får hela bilden; `aria-live`
            gör att ändringen annonseras när hon av-/påmarkerar inne i panelen.

            VIKTEN HÖJDES I VARV 4c (Marcus: "'14 av 16' syns inte så bra
            liksom, det fångas inte av ögat"). Raden bar `font-medium text-body`
            — samma grad som allt annat på sidan, alltså ingenting som drog
            blicken. Nu: `text-xl` på SIFFRORNA (grad-språnget bär), och en
            grön `CircleCheck` framför. Bocken är samma gröna signal som
            markerade kort bär, så räknaren och korten läser som samma sak
            — och den är `aria-hidden` dekor: texten är bäraren (WCAG 1.4.1). */}
        <div className="flex flex-col py-2">
          <button
            type="button"
            aria-expanded={listaOppen}
            aria-controls={listPanelId}
            onClick={() => setListaOppen((v) => !v)}
            className="-mx-2 flex w-auto items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-(--mm-success)" />
              {/* `aria-atomic="true"` (research-passet § 5, MDN:s aria-live-
                  guide): utan den annonserar en skärmläsare bara den ÄNDRADE
                  noden när siffran går 14 → 13 — alltså "13", utan "av 16
                  deltagare markerade". MDN:s eget exempel är en klocka som
                  läses upp som "34" i stället för "17:34". Systerkomponenten
                  `Deltagare` § `MarkeringsBatchBar` bär den redan; vår
                  saknade den. */}
              <span
                data-testid="markering-rakning"
                aria-live="polite"
                aria-atomic="true"
                className="text-body"
              >
                <span className="font-semibold text-xl tabular-nums">{valda.size}</span> av{' '}
                <span className="font-semibold text-xl tabular-nums">{alla.length}</span> deltagare
                markerade
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              size={18}
              className={`shrink-0 text-text-secondary motion-safe:transition-transform ${
                listaOppen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* NAMN-PREVIEWN (Marcus 2026-08-07): "en liten preview-lista med
              namnen på dem hon tog med sig … det kanske räcker som en liten
              bekräftelse på att 'Ja, alla är med'."

              FÖRSTA FÖRSÖKET VAR EN OGRÄNSAD `join(', ')` över alla 14 namnen
              — ett textstycke på 94 px. Marcus dom: "Jävlar vilken ful preview
              … oanvändbar och måste göras om." Formen är nu omgjord mot
              research-passet `docs/research/mottagar-preview-monster-2026-08-07.md`.

              GRÄNSEN ÄR 7 SEDAN VARV 7 — se `PREVIEW_GRANS` för hela
              härledningen och för varför höjningen från passets 5 är legitim
              och inte drift (kort: passet reserverade sig mot sin egen siffra,
              och talen gällde AVATARER som äter bredd genom att överlappa —
              namn-pillar radbryts i stället, så bredd-argumentet bakom femman
              gäller inte formen vi byggde).

              "OCH N TILL" ÄR REN TEXT, INTE EN KNAPP. Sidan har redan en
              fungerande "se alla"-mekanik: räknar-raden ovanför ÄR
              accordion-huvudet för hela kortlistan. En andra klickyta hade
              byggt parallellt maskineri för samma jobb, och APG erbjuder
              inget standardkontrakt för en sådan mini-popover — varje sådan
              yta blir ett eget, otestat mönster.

              AVATARSTAPEL AVVISAD och det står fast: den förutsätter foton som
              varken `Registration` eller `Person` bär, så den hade degraderat
              till initial-cirklar — strikt svagare än att visa namnet.

              PILL-FORMEN ÄR MARCUS BESLUT 2026-08-07 ("kan vi inte sätta
              namnen i pills?") OCH DEN RIVER INTE PASSET — den besvarar en
              fråga passet aldrig ställde. Passets chips-avsnitt vägde chip som
              INTERAKTIONSMÖNSTER mot en read-only yta, och landade rätt: en
              pill med x-knapp lovar en borttagning som inte sker här. Men det
              vägde aldrig avgränsade namn-enheter mot kommaseparerad löptext
              som LÄSBARHETSFRÅGA, vilket är den faktiska bristen — namnen
              drunknade i en mening.

              Passets egen text pekar ut vägen: en pill som "liknar
              `StatusBadge` … korrekt signalerar 'icke-interaktiv'" avvisades
              inte som FEL, utan som "ren dekoration utan chip-formens
              egentliga poäng". Dekoration är precis vad som behövdes.

              FORMEN ÄR DÄRFÖR STATUSBADGES, INTE EN NY: pill-skalans `sm`-steg
              (`px-2 py-0.5 text-caption`) — listmiljön, som previewn är — plus
              `border border-transparent`, T130:s tredje regel: kanten ritas
              aldrig men reserverar sin px så `contrast-more` kan tändas utan
              att layouten hoppar. INGEN x-knapp och INGEN ikon: det är precis
              det som skiljer den från Salesforce-pillen och gör den ärlig.

              `bg-bg-muted` mot previewns `bg-surface` är T130:s neutral-fall
              SPEGELVÄNT. Där misslyckades muted-på-muted (1.00) och svaret blev
              `bg-surface`; här står plattan på surface, så muted är den som
              syns. Samma två toner, omvänd ordning.

              TILLGÄNGLIGHETEN FÖLJER PINTEREST-MÖNSTRET passet identifierade
              som det etablerade svaret: EN sammanhållen accessible name för
              hela gruppen, inte N annonserade fragment. Utan det läser
              skärmläsaren "Anna Andersson Erik Berg Karin Dahl" utan
              separatorer — sämre än meningen den ersatte. Meningen finns därför
              kvar i `sr-only` och pillarna är `aria-hidden`; det synliga och
              det upplästa bär samma innehåll i två former.

              PASSETS EGEN RESERVATION, bokförd: vårt scenario (read-only
              namn-bekräftelse utan foton, 1–30 poster) ligger MELLAN de
              etablerade mönstren, inte på ett av dem. Det är den reservationen
              som gjorde höjningen till 7 möjlig utan att riva passet — den stod
              nedskriven i passet självt, inte konstruerad i efterhand. */}
          {mottagarNamn.length > 0 && (
            <div
              data-testid="mottagar-preview"
              className="mt-2 rounded-xl border border-(--mm-navcard-border) bg-surface p-2.5 contrast-more:border-(--mm-navcard-border-contrast)"
            >
              <span className="sr-only">{preview.mening}</span>
              <span aria-hidden="true" className="flex flex-wrap items-center gap-1.5">
                {preview.pillar.map((namn) => (
                  <span
                    key={namn}
                    className="inline-flex items-center rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong"
                  >
                    {namn}
                  </span>
                ))}
                {preview.rest > 0 && (
                  <span className="text-caption text-text-muted">och {preview.rest} till</span>
                )}
              </span>
            </div>
          )}

          {/* `pt-2` skiljer panelen från knappen; föräldern bär redan `py-2`
              nedåt så ingen egen `pb` behövs. Panelen renderas alltid i DOM:en
              med `hidden` — aria-controls måste peka på ett element som finns. */}
          <div id={listPanelId} hidden={!listaOppen} className="flex flex-col gap-2 pt-2">
            {synliga.length === 0 ? (
              <p className="text-small text-text-secondary">
                Inga deltagare markerade. Lägg till från eventet nedan.
              </p>
            ) : (
              synliga.map((r) => (
                <MarkerbartDeltagarKort
                  key={r.id}
                  reg={r}
                  vald={valda.has(r.id)}
                  onChange={(v) => onVaxla(r.id, v)}
                />
              ))
            )}
          </div>
        </div>

        {/* PLOCKAREN — de som INTE är markerade, utan att lämna sidan. */}
        <div className="flex flex-col py-1.5">
          <button
            type="button"
            onClick={() => setPlockareOppen(!plockareOppen)}
            aria-expanded={plockareOppen}
            className={RAD_KLASS}
          >
            <Plus aria-hidden="true" size={16} className="shrink-0" />
            Lägg till fler personer från eventet
            <span className="ml-auto flex shrink-0 items-center gap-2">
              <span className="text-small text-text-secondary tabular-nums">
                {alla.length - synliga.length}
              </span>
              <ChevronDown
                aria-hidden="true"
                size={18}
                className={`text-text-secondary motion-safe:transition-transform ${
                  plockareOppen ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>
        </div>

        {plockareOppen && (
          <div className="flex flex-col gap-3 py-3">
            {/* SÖKFÄLTET STÅR UTAN SYNLIG ETIKETT sedan varv 7 (Marcus: "kan vi
                ta bort 'Sök deltagare' … snyggare med rent där"). Panelen är
                redan rubricerad av raden som fällde ut den, så etiketten sade
                samma sak två gånger.

                `hideLabel` OCH INTE BORTTAGEN LABEL: propen flyttar texten till
                `aria-label`, så fältet behåller sitt tillgängliga namn (WCAG
                4.1.2). En placeholder är ALDRIG ett giltigt namn — den
                försvinner vid första tecknet och exponeras inte konsekvent av
                skärmläsare. Det visuella och det tillgängliga skiljer sig alltså
                åt här med avsikt, vilket är precis vad `hideLabel` finns för.

                PLACEHOLDERN BEHÖLLS, i Marcus andra form ("Sök på namn eller
                e-post…"): utan den är fältet en tom ruta som inte säger vad den
                accepterar, och frågan uppstår i exakt det ögonblick den kan
                besvaras gratis. Den kostar ingenting visuellt — den är borta så
                fort Lotta skriver. */}
            <Input
              label="Sök deltagare"
              hideLabel
              value={sok}
              onChange={setSok}
              placeholder="Sök på namn eller e-post…"
            />
            <div className="scrollbar-inline flex max-h-96 flex-col gap-2 overflow-auto">
              {kandidater.length === 0 ? (
                <p className="py-1 text-small text-text-muted">
                  {alla.length === synliga.length
                    ? 'Alla anmälda är redan i listan.'
                    : 'Ingen matchar sökningen.'}
                </p>
              ) : (
                kandidater.map((r) => (
                  <KandidatKort key={r.id} reg={r} onLaggTill={() => onLaggTill(r.id)} />
                ))
              )}
            </div>
          </div>
        )}

        {/* DEN ANDRA VÄGEN IN — personen som inte är anmäld till eventet alls.
            Marcus 2026-08-07: "Under 'lägg till fler personer från eventet'
            vill jag lägga '+ Lägg till en person manuellt', alltså flytta upp
            'manuell anmälan' dit."

            SYSKON TILL PLOCKAR-RADEN, INTE INUTI DEN: de två raderna svarar på
            samma fråga ("vem mer?") med varsin källa — eventets anmälda, och
            någon som inte finns där än. Hade den bott inuti plockarens utfällda
            panel vore den osynlig i det läge där Lotta faktiskt undrar, och
            hon hade fått öppna en lista med fel personer för att hitta vägen
            förbi den.

            CHEVRON HÖGER, inte ned: raden LEDER BORT. Det är samma ärlighets-
            princip åtgärdslistan bar tills den blev fyra utfällbara rader —
            semantiken flyttade hit tillsammans med funktionen.

            `fran: 'atgarder'` är hela tillbaka-vägen: manuell anmälan läser den
            och riktar sin pil hit i stället för till eventdetaljen. */}
        {eventId != null && (
          <div className="flex flex-col py-1.5">
            <Link
              to="/event/$eventId/ny-anmalan"
              params={{ eventId }}
              search={{ fran: 'atgarder' as const }}
              className={RAD_KLASS}
            >
              <UserPlus aria-hidden="true" size={16} className="shrink-0" />
              Lägg till en person manuellt
              <ChevronRight
                aria-hidden="true"
                size={18}
                className="ml-auto shrink-0 text-text-secondary"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* ================================================================== *
 * BETALNINGARNAS SKRIVYTA (varv 13) — åtgärds-sidans EGEN, inte en montering.
 *
 * VARFÖR EN EGEN OCH INTE EVENTDETALJENS: varv 12 monterade
 * `BetalningsDetaljer` och Marcus såg direkt att det inte gick att skriva
 * notisen. Han hade rätt, och orsaken var strukturell — `TASK-145.4` (landad
 * 2026-08-07 17:23, `c4160cae`) gjorde den ytan till en REN LÄSYTA:
 *
 *   `<BetalKryss … lugn disabled onChange={() => {}} />`
 *
 * Ovillkorligt `disabled`, tom `onChange`, och `<Input>`-fältet helt borta.
 * Filens egen docblock säger varför, ordagrant: "BÅDA betalnings-kryssen
 * flyttar till Åtgärds-sidan (TASK-147). Krysset här är därför ALLTID
 * `isDisabled` … (DoD #7: noll skriv-affordanser)" och "(a) `<Input>`-fältet är
 * BORTA. Ytan är för ÖVERBLICK — editering görs på åtgärds-sidan."
 *
 * Ingen flagg-kombination hade alltså gett skrivbarhet: att inte skriva ÄR
 * komponentens krav. `TASK-147` § skiva 8 ("betalningarnas skrivvertikal") och
 * § rad 39 säger var den bor i stället — här.
 *
 * FORMEN ÄR LÄSYTANS, SÅ LOTTA KÄNNER IGEN SIG: personens namn utanför kortet
 * (`DetaljGrupp`-grammatiken), kortet i `bg-surface` eftersom ytan står på
 * `KORT_KLASS`s muted botten (ett muted kort på muted botten mättes till
 * kontrast 1.00 i S93 våg 10 — osynligt), en rad per betalning med `divide-y`
 * emellan. Skillnaden mot läsytan är EN sak: kontrollerna lever.
 *
 * TVÅ VAKTER FÖLJER MED UR `TASK-147` § Implementationsbeslut, båda kodade:
 *
 *  (1) "Ej relevant" FÅR ALDRIG SKRIVAS ÖVER — föreläsnings-semantiken. En
 *      slutbetalning i det läget får radens form men ALDRIG ett kryss; en
 *      av-bock hade skrivit "Ej mottagen" och rivit basens semantik. Samma
 *      lösning som läsytan: `pl-7` (kryssets 20 px + gap-2:s 8 px) så ordet
 *      står på grannradernas vänsterlinje trots att rutan saknas.
 *  (2) [TASK-147.4] Basens takt tål inte obegränsad parallellitet. Ytan har
 *      fortfarande ingen dedikerad "markera alla"-knapp (Marcus varv 6-idé,
 *      parkerad — en sådan är en FORM-ändring och kräver Marcus, inte den
 *      här skivan) — men "batch" är här flera avprickningar i snabb följd,
 *      inte nödvändigtvis en egen massknapp, och DEN vägen finns redan: ett
 *      klick per rad, i tät följd. Vakten sitter därför i MUTATIONSLAGRET,
 *      inte i denna yta — `useSetPaymentStatus` (`registrationPayments.ts`
 *      § `TAKTVAKT_SCOPE`) ger alla avprickningar samma TanStack Query
 *      `scope.id`, vilket serialiserar dem (bibliotekets egna mekanism för
 *      seriella mutationer) oavsett hur många kryss Lotta hinner klicka
 *      innan det första svaret kommit. Mätt: `tests/e2e/atgarder-betalningar
 *      .staging.test.ts` § Taktvakten (tre klick i snabb följd, aldrig mer
 *      än 1 samtidig `update-record`). Bygger någon en dedikerad
 *      massknapp senare återanvänder den samma hook och ärver alltså
 *      samma vakt utan eget arbete.
 *
 * MUTATIONS-INSTANSERNA ÄR DELADE, en per operation, skapade här och skickade
 * ned — exakt förlagans motiv: den optimistiska uppdateringen kan avmontera en
 * rad, och per-rad-hooks hade tappat felläget vid rollback.
 * ================================================================== */
function SkrivKryss({
  text,
  namn,
  vald,
  lasande,
  onChange,
}: {
  text: string;
  /** Accessible name blir "<text> för <namn>" — WCAG 2.5.3-säkert, förlagans form. */
  namn: string;
  vald: boolean;
  /**
   * [TASK-346.7 AC #2] LÄSANDE läge — krysset visar den härledda statusen och
   * kan inte flippas.
   *
   * PRD § Ytorna (beslut 10): "kryssen flippas inte längre för hand." Sedan
   * ADR-128 härleds facken Anmälningsavgift/Slutbetalning ur inbetalningarna
   * mot eventets pris, och basens två valfält är en APP-SKRIVEN SPEGEL av
   * den härledningen (ADR-128 beslut 5) — inte längre något Lotta sätter.
   * Ett kryss som gick att flippa hade skrivit över härledningen med en
   * gissning, och nästa spegelskrivning hade tyst skrivit tillbaka den.
   *
   * `isReadOnly` OCH INTE `isDisabled`: ett inaktiverat kryss tas ur
   * tabordningen och blir osynligt för skärmläsaren som gick igenom raden —
   * statusen ÄR informationen här, så den måste gå att nå och läsa. React
   * Aria sätter `aria-readonly` och blockerar `onChange`; värdet annonseras
   * fortfarande.
   */
  lasande?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Checkbox
      isSelected={vald}
      isReadOnly={lasande}
      onChange={onChange}
      aria-label={`${text} för ${namn}`}
      className={`group flex items-center gap-2 text-small ${lasande ? '' : 'cursor-pointer'}`}
    >
      <span className={KRYSSRUTA_KLASS}>
        <Check
          aria-hidden="true"
          size={12}
          className="text-(--mm-checkbox-check) opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      {/* DÄMPAD, ALDRIG RÖD — läsytans `lugn`-form. Rött per rad upprepar bara
          flikens egen utsaga ("Saknar betalning (9)") och tömmer färgen på
          betydelse; krysset bär redan vilken betalning som saknas. */}
      <span className={vald ? 'text-text-secondary' : 'text-text-muted'}>{text}</span>
    </Checkbox>
  );
}

/**
 * [TASK-147.7, ADR-109] "Skicka kvitto" — kvittoseriens ENDA UI-ingång.
 * Synlig ENDAST när betalningen redan är markerad Mottagen (`SkrivRad`s
 * `vald`-villkor nedan) — kvittot är en AKTIV handling Lotta väljer EFTER
 * avprickningen, ALDRIG automatik som följer på krysset (Marcus-beslut a).
 *
 * BELOPP + BETALSÄTT ÄR LOTTA-INMATADE, MEDVETET: basen har inget prisfält
 * (varken Anmälningar eller Eventplanering — verifierat mot data-model.md,
 * ADR-086 premiss-pass 2026-08-10, se ADR-109 § Öppna punkter). Formuläret
 * validerar ETT positivt belopp + ETT av de tre betalsätten innan "Skicka"
 * aktiveras — samma "aktiv handling, ingen gissning"-linje.
 *
 * PESSIMISTISK, ingen optimistisk state: dialogen stannar öppen och visar
 * SERVERNS svar (kvittonummer vid 'sent', skälet vid 'failed') — precis som
 * `GranskningsSida` gör för åtgärdsutskicken, i miniatyr för en enda
 * mottagare.
 */
function SkickaKvittoKnapp({
  registration,
  eventId,
  betalning,
}: {
  registration: Registration;
  eventId: string;
  betalning: Betalning;
}) {
  const namn = displayName(registration);
  const label = BETALNING_LABEL[betalning];
  const skicka = useSendReceipt();
  const [belopp, setBelopp] = useState('');
  const [betalsatt, setBetalsatt] = useState<Betalsatt | null>(null);

  const beloppTal = Number(belopp.replace(',', '.'));
  const beloppGiltigt = belopp.trim() !== '' && Number.isFinite(beloppTal) && beloppTal > 0;
  const kanSkicka = beloppGiltigt && betalsatt !== null;

  const skickaKvitto = () => {
    if (!kanSkicka || !betalsatt) return;
    skicka.mutate(
      {
        registrationId: registration.id,
        eventId,
        betalning,
        belopp: beloppTal,
        betalsatt,
        // TASK-201.4 AKTIVITETSLOGGEN: klient-lokalt namn-underlag, se
        // `useSendReceipt`s docblock — skickas ALDRIG till servern.
        registration,
      },
      {
        onSuccess: (result) => {
          if (result.status === 'sent' && result.kvittonummer) {
            alertScreenReader(`Kvitto ${result.kvittonummer} skickat till ${namn}`);
          } else {
            alertScreenReader(`Kvittot kunde inte skickas till ${namn}`);
          }
        },
      },
    );
  };

  return (
    <DialogTrigger
      onOpenChange={(open) => {
        if (!open) {
          skicka.reset();
          setBelopp('');
          setBetalsatt(null);
        }
      }}
    >
      <Button
        intent="success"
        emphasis="outline"
        size="sm"
        aria-label={`Skicka kvitto - ${label} för ${namn}`}
      >
        Skicka kvitto
      </Button>
      <Modal isDismissable>
        <Dialog
          title={`Skicka kvitto - ${label}`}
          actions={({ close }) =>
            skicka.isSuccess ? (
              <Button intent="secondary" onPress={close}>
                Stäng
              </Button>
            ) : (
              <>
                <Button intent="ghost" onPress={close} isDisabled={skicka.isPending}>
                  Avbryt
                </Button>
                <Button
                  intent="success"
                  onPress={skickaKvitto}
                  isDisabled={!kanSkicka || skicka.isPending}
                >
                  {skicka.isPending ? 'Skickar …' : 'Skicka'}
                </Button>
              </>
            )
          }
        >
          {skicka.isSuccess ? (
            skicka.data.status === 'sent' ? (
              <MessageBox intent="success" title="Kvitto skickat">
                {skicka.data.kvittonummer} skickat till {namn}.
              </MessageBox>
            ) : (
              <MessageBox intent="error" title="Kvittot kunde inte skickas">
                {skicka.data.reason ?? 'Inget felmeddelande angavs. Försök igen.'}
              </MessageBox>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-small text-text-secondary">
                Kvittot går till {namn} för {label.toLowerCase()}.
              </p>
              <Input
                label="Belopp (kr)"
                placeholder="1250"
                value={belopp}
                onChange={setBelopp}
                isRequired
                inputMode="decimal"
              />
              <Select
                label="Betalsätt"
                placeholder="Välj betalsätt"
                selectedKey={betalsatt}
                onSelectionChange={(key) => setBetalsatt(key as Betalsatt)}
                isRequired
              >
                {BETALSATT_VARDEN.map((v) => (
                  <SelectItem key={v} id={v}>
                    {v}
                  </SelectItem>
                ))}
              </Select>
              {skicka.isError && (
                <MessageBox intent="error" title="Kunde inte skicka kvittot">
                  Försök igen.
                </MessageBox>
              )}
            </div>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}

/** En betalning: levande kryss + levande notering. Noteringen commitas vid
    blur (Stripe-klassens per-betalnings-memo, förlagans commit-punkt). */
function SkrivRad({
  registration,
  eventId,
  betalning,
  vald,
  lasande,
  notering,
  onStatus,
  onNotering,
}: {
  registration: Registration;
  eventId: string;
  betalning: Betalning;
  vald: boolean;
  /** [TASK-346.7 AC #2] Krysset är härlett; kvitto-dialogen är riven. */
  lasande: boolean;
  notering: string | null;
  onStatus: (v: boolean) => void;
  onNotering: (text: string) => void;
}) {
  const namn = displayName(registration);
  const label = BETALNING_LABEL[betalning];
  /** Lokalt utkast medan Lotta skriver; null = inget utkast (visa cache-värdet). */
  const [utkast, setUtkast] = useState<string | null>(null);

  const spara = () => {
    if (utkast === null) return;
    const trimmat = utkast.trim();
    setUtkast(null);
    if (trimmat === (notering ?? '')) return;
    onNotering(trimmat);
  };

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SkrivKryss text={label} namn={namn} vald={vald} lasande={lasande} onChange={onStatus} />
        {/* [TASK-147.7] Synlig ENDAST när betalningen redan är Mottagen — se
            SkickaKvittoKnapp-docblocken för varför (Marcus-beslut a).

            [TASK-346.7 AC #2] RIVEN NÄR MILJÖFLAGGAN ÄR PÅ. Dialogen bygger
            på ADR-109 beslut 7-flödet (Lotta skriver beloppet för hand i en
            ruta utan felmeddelanden), och det beslutet är rivet: kvittot
            avser numera exakt EN inbetalning, med dess belopp och datum
            (ADR-128). Ett kvitto med ett handskrivet belopp kan inte längre
            peka på en inbetalning, och Roger får en verifikation utan
            motpost.

            VARFÖR VILLKORAD OCH INTE BORTTAGEN: AC #6 och PRD § Miljöflagga
            (B2) kräver att flaggan AV ger dagens beteende EXAKT. `send-
            receipt-email` är fortfarande deployad i prod och är där Lottas
            enda kvittoväg tills Marcus slår på flaggan. En ovillkorlig
            rivning hade tagit bort funktionen ur prod i natt. Den slutliga
            rivningen — komponenten, `useSendReceipt` och deras importer —
            hör till TASK-346.12, som river flaggan och därmed den här
            grenen. */}
        {vald && !lasande && (
          <SkickaKvittoKnapp registration={registration} eventId={eventId} betalning={betalning} />
        )}
      </div>
      {/* NOTERINGEN TAR PLATTANS FULLA BREDD sedan varv 17 (Marcus: "Kan vi dra
          ut noteringsrutan hela vägen ut till kanten på checkboxen så dem tar
          hela bredden typ på den plattan de sitter på?").

          `pl-7`-indraget är BORTA. Det ärvdes ur läsytan, där noteringen är
          löpande TEXT och linjerar under betalningsordet för att läsas som en
          kvalificering av raden ovanför. Ett FÄLT är något annat: dess kant
          ritar en låda, och en låda som börjar 28 px in ser ut att sakna sin
          vänstra fjärdedel. Kortets egen `px-4` är nu enda marginalen, så
          fältet står kant i kant med rutan ovanför — samma vänsterlinje som
          kryssrutan, hela vägen ut till höger.

          FÄLTET ÄR ALLTID SYNLIGT — GHOST-STYLINGEN ÄR RIVEN (Marcus dom
          2026-09-01: *"Varför syns inte det vita fältet där man skriver
          noteringen förens man hovrar? Så var det inte förut."*).

          TASK-346.14 (designfynd 4a) gjorde fältet till en on-demand-
          affordans: samma `<input>` i DOM:en hela tiden, men utan kant och
          bakgrund tills det bar innehåll eller fick hover/fokus. Avsikten var
          att slippa "16 permanent tomma fält". Utfallet blev att ett fält
          Lotta använder varje morgon inte gick att SE — och en kontroll som
          måste letas fram med musen är dyrare än den visuella ron den köper.
          Formen är därför tillbaka i sitt läge före design-passet: husets
          vanliga `Input`, med sin vanliga kant, alltid.

          TILLGÄNGLIGHETSGOLVET HÖJS AV RIVNINGEN, det sänks inte. Ghost-
          formen krävde en egen a11y-lapp (`contrast-more:[&_input]:border-
          border-strong`, commit `120276ee`) just för att viloläget satte
          `border-transparent`. Utan ghost bär fältet primitivens egen
          `--mm-input-border` = `--mm-border-field` (`p-neutral-400`), som
          `semantic.css` dokumenterar som ≥3:1 mot vit yta (WCAG 1.4.11) — i
          ALLA kontrastlägen. Lappen pekade dessutom på `border-strong`
          (`p-neutral-300`, 1,55:1), alltså en SVAGARE kant än den fältet nu
          bär ovillkorligt.

          Placeholdern är också tillbaka i sin ursprungliga form
          ("Notering…"): "+ Lägg till notering" var affordansens egen text,
          den som skulle avslöja ett osynligt fält. En synlig ruta behöver
          ingen sådan inbjudan. */}
      <Input
        size="sm"
        label={`Notering ${label.toLowerCase()} för ${namn}`}
        hideLabel
        placeholder="Notering…"
        value={utkast ?? notering ?? ''}
        onChange={setUtkast}
        onBlur={spara}
      />
    </div>
  );
}

function BetalningsSkrivYta({
  eventId,
  registreringar,
}: {
  eventId: string;
  registreringar: Registration[];
}) {
  const status = useSetPaymentStatus(eventId);
  const notering = useUpdatePaymentNote(eventId);

  /* [TASK-346.7 AC #2] Miljöflaggan avgör om panelen SKRIVER facken eller
     LÄSER dem. Läses en gång per rendering, aldrig i en effekt: den är ett
     byggtidsvärde och kan inte ändras i drift (`funktionsflaggor.ts`). */
  const lasande = betalningarPa();

  /* Den globala listan över öppna betalningar, samma cache-nyckel som
     inkorgen och Hem — inte en fråga per person. `enabled` följer flaggan, så
     panelen gör noll extra anrop i prod. Uppslaget sker på anmälans
     record-ID: `OppenBetalning` bär inget person-ID, men anmälan ÄR nyckeln
     här och kan inte råka vara en namne. */
  const { data: oppna } = useOppnaBetalningar(lasande);
  const idag = useMemo(idagIso, []);
  const raderPerAnmalan = useMemo(() => {
    const karta = new Map<string, InkorgsRad>();
    for (const betalning of oppna?.betalningar ?? []) {
      karta.set(betalning.anmalanRecordId, harledRad(betalning, idag));
    }
    return karta;
  }, [oppna, idag]);

  const fel = status.isError ? status : notering.isError ? notering : null;

  if (registreringar.length === 0) {
    return <p className="py-3 text-small text-text-muted">Inga aktiva anmälningar på eventet.</p>;
  }

  return (
    <div className="flex flex-col gap-4 py-3">
      {fel && (
        // TASK-285.2 (S109-facit, familjeregeln): `error` bär ALDRIG en
        // stäng-knapp — den försvinner när ORSAKEN är borta, inte på ett
        // manuellt klick. `fel.reset()` behövs inte längre för att stänga
        // rutan: nästa `mutate()`-anrop (ett nytt försök att spara) sätter
        // `isError` till `false` automatiskt, vilket är exakt "orsaken är
        // borta". Tidigare `onDismiss={() => fel.reset()}` gav en manuell
        // stäng-knapp på en `error`-ruta, vilket `MessageBox`s nya
        // typ (`onDismiss` är `never` för `error`/`warning`) numera stoppar
        // vid `npm run typecheck`.
        <MessageBox intent="error" title="Kunde inte spara">
          Försök igen.
        </MessageBox>
      )}
      {/* KOMPAKT RADFORM, INTE VITA KORT I GRÅ CONTAINER (designfynd 4c):
          varje person bar tidigare en EGEN `bg-surface rounded-2xl`-kortyta
          nästlad i panelens `bg-bg-muted`-skal (`KORT_KLASS`) — åtta sådana
          vita väggar radade under varandra läste tyngre än sidans egen
          etablerade kompakta radform (ÅTGÄRD-listans numrerade rader,
          `rounded-xl bg-surface px-3 py-2.5`). Personerna delar nu EN
          `divide-y`-lista (samma hårlinje-grammatik som `DetaljGrupp`/
          `AnmalningarSida`s Mer-lista) i stället för en kortyta per person —
          panelens EGEN `bg-bg-muted` syns rakt igenom, ingen nästlad
          bakgrund. */}
      <ul className="divide-y divide-border">
        {registreringar.map((r) => (
          <li key={r.id} className="flex min-w-0 flex-col gap-2 py-3">
            {/* Namnet UTANFÖR den inre radgruppen — `DetaljGrupp`s h2-position,
                men medvetet inget rubrikelement: femton syskon-rubriker under
                en enda h2 vore en semantisk lögn (läsytans egen motivering). */}
            <span className="min-w-0 px-4 font-semibold text-body">{displayName(r)}</span>
            <div className="divide-y divide-border px-4">
              <SkrivRad
                registration={r}
                eventId={eventId}
                betalning="avgift"
                vald={r.anmalningsavgift === PaymentStatus.MOTTAGEN}
                lasande={lasande}
                notering={r.noteringAnmalningsavgift ?? null}
                onStatus={(v) =>
                  status.mutate({
                    registration: r,
                    betalning: 'avgift',
                    value: v ? PaymentStatus.MOTTAGEN : PaymentStatus.EJ_MOTTAGEN,
                  })
                }
                onNotering={(text) =>
                  notering.mutate({ registration: r, betalning: 'avgift', notering: text })
                }
              />
              {r.slutbetalning === PaymentStatus.EJ_RELEVANT ? (
                /* VAKT 1: "Ej relevant" får radens form men ALDRIG ett kryss —
                   en av-bock hade skrivit "Ej mottagen" och rivit basens
                   föreläsnings-semantik. `pl-7` = kryssets 20 px + gap-2:s 8 px,
                   så ordet står på grannradernas vänsterlinje ändå. */
                <p className="py-3 pl-7 text-small text-text-muted">
                  Slutbetalning · Ej relevant (föreläsning)
                </p>
              ) : (
                <SkrivRad
                  registration={r}
                  eventId={eventId}
                  betalning="slut"
                  vald={r.slutbetalning === PaymentStatus.MOTTAGEN}
                  lasande={lasande}
                  notering={r.noteringSlutbetalning ?? null}
                  onStatus={(v) =>
                    status.mutate({
                      registration: r,
                      betalning: 'slut',
                      value: v ? PaymentStatus.MOTTAGEN : PaymentStatus.EJ_MOTTAGEN,
                    })
                  }
                  onNotering={(text) =>
                    notering.mutate({ registration: r, betalning: 'slut', notering: text })
                  }
                />
              )}
              {/* [TASK-346.7 AC #2] Saknas-beloppet, Registrera betalning och
                  inbetalningsraderna. Sist i raden, UNDER facken: facken säger
                  VAD som är klart, detta säger vad som återstår och vad Lotta
                  kan göra åt det. Inbetalningarna hämtas först när raden fälls
                  ut — se komponentens docblock för anropsbudgeten. */}
              {lasande && (
                <PanelBetalningar
                  anmalanRecordId={r.id}
                  namn={displayName(r)}
                  rad={raderPerAnmalan.get(r.id) ?? null}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== *
 * BILAGEVÄLJAREN — utan förvals-logik. Kryssruta, namn, storlek.
 *
 * `antalMottagare`-proppen FÖLL MED KLASSTEXTERNA (varv 10): den fanns bara
 * för att klass C:s rad skulle kunna säga "Genereras för var och en — N st".
 * Den togs bort i stället för att lämnas oanvänd — en prop som inget läser
 * påstår ett beroende som inte finns.
 *
 * [TASK-147.5] `attachments` KOMMER NU FRÅN SERVERN (`ArbetsYta` § useQuery),
 * inte en hårdkodad array — se docblocken ovan (raden precis före denna
 * funktion). Storleken visas nu ALLTID (real data bär alltid en verklig
 * `storlekBytes`; stubbens "bara klass A har storlek"-villkor var en fiktion
 * som fanns för att härma att B/C:s filer inte existerar förrän sändningen
 * — sant för klass C, ALDRIG sant för en redan skapad Bilagor-rad).
 * `formatMB` ÄTERANVÄND ur `attachmentUpload.ts` (samma helper upload-flödet
 * redan visar fel med) — ingen ny kB-vs-MB-formatterare uppfunnen här.
 * ================================================================== */
function BilageValjare({
  attachments,
  laddar,
  fel,
  valda,
  onVaxla,
}: {
  attachments: Attachment[];
  laddar: boolean;
  fel: boolean;
  valda: Set<string>;
  onVaxla: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-small text-text-muted">
          <Paperclip aria-hidden="true" size={14} />
          Bilagor
        </span>
        <span className="text-small text-text-secondary">
          {valda.size === 0 ? 'Inga valda' : `${valda.size} valda`}
        </span>
      </div>

      {/* RADEN ÄR NU KRYSSRUTA + NAMN + STORLEK, inget mer (varv 10).

          IKONERNA ÄR BORTA (Marcus: "Ta bort alla ikoner för dokumenten,
          räcker med kryssrutan"). De bar klass-skillnaden visuellt — `FileText`
          för A, `Sparkles` för B/C — och den bärningen var svag redan innan:
          två ikoner för tre klasser, och `Sparkles` sade "genereras" bara för
          den som redan visste det.

          HOVER ÄR HELT BORTA (varv 11, Marcus: "Jag vill nog ta bort hover
          helt"). Vägen dit gick via en rättning: raden bar `hover:bg-bg-muted`,
          vilket är EXAKT `KORT_KLASS`-bakgrunden som arbetsytan står på — hover
          försvann in i omgivningen i stället för att lyfta raden. Den byttes
          först till `bg-bg-emphasized` (varv 10), och därefter valde Marcus bort
          hela effekten.

          VAD SOM BÄR AFFORDANSEN NU: `cursor-pointer` för mus, kryssrutans egen
          fokusring för tangentbord, och kryssrutans eget markerade läge som
          resultat-återkoppling. Raden är fortfarande klickbar i hela sin bredd
          (`<label>` runt kryssrutan) utan att signalera det visuellt vid hover —
          ett medvetet val, inte en glömska. Faller det vid granskning är
          mellantinget en ton som INTE är `bg-bg-muted`, eftersom just den färgen
          var det ursprungliga felet.

          `items-center` i stället för `items-start`: raden är enradig nu, så
          kryssrutans `mt-0.5`-justering mot en tvåradig text är onödig. */}
      {/* KRYSSET BYTTE FRÅN NATIVE TILL RAC (varv 14) — se `KRYSSRUTA_KLASS`.
          Den native-formen var sidans enda, och dess "blå" var webbläsarens
          default via en token som inte finns. Nu delar bilagorna och
          betalningarna exakt en form, en storlek och en färg.

          `<Checkbox>` ersätter `<label>` + `<input>`: RAC:s komponent ÄR sin
          egen etikett-yta, så hela raden förblir klickbar utan en wrapper. */}
      {laddar ? (
        <p className="px-3 py-2.5 text-small text-text-muted">Hämtar bilagor …</p>
      ) : fel ? (
        <MessageBox intent="warning" title="Bilagorna kunde inte hämtas">
          Prova att öppna åtgärden igen. Går det inte skickas mailet ändå, utan bilaga.
        </MessageBox>
      ) : attachments.length === 0 ? (
        <p className="px-3 py-2.5 text-small text-text-muted">
          Inga bilagor tillgängliga för det här eventet.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg bg-surface">
          {attachments.map((b) => (
            <Checkbox
              key={b.id}
              isSelected={valda.has(b.id)}
              onChange={() => onVaxla(b.id)}
              aria-label={`Bifoga ${b.namn}`}
              className="group flex cursor-pointer items-center gap-3 px-3 py-2.5"
            >
              <span className={KRYSSRUTA_KLASS}>
                <Check
                  aria-hidden="true"
                  size={14}
                  className="text-(--mm-checkbox-check) opacity-0 group-data-[selected]:opacity-100"
                />
              </span>
              {/* [TASK-339] Räckviddsbadgen (RackviddBadge, TASK-275.3) TAGEN
                  BORT härifrån — Marcus prod-röktest 2026-08-29 (S113,
                  TASK-309.11 punkt 8): "blir inte snyggt". Här väljer Lotta
                  VAD som ska bifogas; varifrån bilagan kommer (räckvidden)
                  är inte ett beslutsunderlag i DEN här listan och
                  konkurrerade visuellt med kryssrutan/filnamnet. Unionen
                  (event-egen + delad, TASK-275.2) är OFÖRÄNDRAD — bara
                  räckviddsmarkeringen är borta. Badgen behålls i
                  Dokument-ytans listor (ADR-118 beslut 3: den förklarar där
                  varför Ersätt/Radera saknas för en delad bilaga i
                  eventkontext — ett skäl som inte finns i DENNA väljare,
                  som varken ersätter eller raderar). */}
              <span className="min-w-0 flex-1 truncate font-medium text-body">{b.namn}</span>
              {/* Storleken höger-justerad — samma plats som räknarna på sidans
                  övriga rader (`RAD_KLASS` § `ml-auto`). */}
              <span className="ml-auto shrink-0 text-small text-text-muted">
                {formatMB(b.storlekBytes)}
              </span>
            </Checkbox>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== *
 * ÅTGÄRDENS ARBETSYTA — fälls ut in-place under sin egen rad.
 * ================================================================== */
function ArbetsYta({
  eventId,
  atgard,
  mottagare,
  onGranska,
}: {
  eventId: string;
  atgard: AtgardsTyp;
  mottagare: Registration[];
  onGranska: (g: Granskning) => void;
}) {
  const [amne, setAmne] = useState(atgard.amne);
  const [text, setText] = useState(atgard.mall);
  const [bilagor, setBilagor] = useState<Set<string>>(new Set());
  const [redigerar, setRedigerar] = useState(atgard.nyckel === 'fritt');

  const vaxlaBilaga = (id: string) =>
    setBilagor((f) => {
      const n = new Set(f);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  /* [TASK-147.5] Eventets VERKLIGA bilagor — se filens docblock ovan
     ("BILAGEVÄLJAREN — SKARP sedan TASK-147.5") för hela resonemanget.
     Samma cache-nyckel som `GranskningsSida` (nedan) läser för
     "valda bilagor"-summeringen — React Query dedupar/delar EN fetch när
     båda monteras kort efter varandra i samma navigering. */
  const dataSource = useDataSource();
  const attachments = useQuery({
    queryKey: queryKeys.attachments.byEvent(eventId),
    queryFn: () => dataSource.fetchEventAttachments(eventId),
  });

  /* URVALSFILTRETS DELMÄNGD — de av mottagarna åtgärden faktiskt är relevant
     för. Samma uträkning som åtgärdsraden visar ("5 av 7"); den låg tidigare
     bara i `AtgardsMeny` och konsumerades inte här, vilket var precis varför
     raden kunde informera utan att begränsa. Se granska-knappen nedan. */
  const iUrval = atgard.urvalsfilter ? mottagare.filter(atgard.urvalsfilter) : mottagare;

  const utanEpost = iUrval.filter((r) => !r.email).length;

  /* SKRIV-GRENEN ÄR BORTA MED "Markera betalda" (varv 6). Den bar den enda
     icke-utskicks-åtgärden och därmed den enda vakt som gällde basskrivning:
     statusvärdet "Ej relevant" får ALDRIG skrivas över av ett urval
     (föreläsnings-semantiken). Den vakten är INTE avskaffad — den följer med
     dit funktionen tar vägen, om Marcus tar "markera alla" i betalningsblocket. */

  return (
    <div className="flex flex-col gap-1 pb-3">
      {/* MEDDELANDET — mallens text visas och går att ändra (beslut 5).

          MORF-PARITETEN ÄR ÄRVD UR `DetaljGrupp`, INTE UPPFUNNEN HÄR (varv 9).
          Marcus: "När jag trycker på 'Ändra' så blir hela rutan mycket större,
          jag avskyr sådana layoutförändringar."

          Domen var riktig, och felet var att ytan ärvde grammatiken men inte
          GEOMETRIN. `EtikettVardeRad`s docblock säger regeln rakt ut: "py-3 +
          24 px textrad = 48 px, exakt lika med RedigeringsRad (py-2 + 32 px
          fält). Ändra ALDRIG ena sidan utan den andra — Δ=0 px är DOM-mätt i
          e2e." Ämne-raden här körde `py-2.5` i BÅDA lägena med ett fält i
          `size="md"` (`min-h-10` = 40 px) mot en 24 px textrad — 16 px hopp
          inbyggt i formen.

          RÄTTAT PÅ BÅDA AXLARNA, med förlagans egna tal:
           · Ämne låst:      `py-3` + 24 px textrad          = 48 px
           · Ämne redigerar: `py-2` + `size="sm"` (min-h-8)  = 48 px

          `text-body` är 1rem/1.5 = 24 px per rad (`tailwind.css` rad 86–87) —
          det är TALET hela pariteten vilar på, i förlagan såväl som här.

          HELA MORFEN DOM-MÄTT 2026-08-07 (Chrome mot byggd CSS, isolerad
          mätsida; appens route ligger bakom auth). Före → efter, per del:

            Ämne-raden     48 → 60 px  (Δ +12)   blev  48 → 48  (Δ 0)
            Textytan      144 → 186 px (Δ +42)   blev 186 → 186 (Δ 0)
            Knappraden     40 → 40 px  (Δ   0)   blev  48 → 48  (Δ 0)
            ------------------------------------------------------------
            TOTALT HOPP        +54 px                      0 px

          Marcus klagomål var alltså inte en känsla utan 54 px, och den största
          delen — 42 av dem — satt i textytan, där den låsta rutan bara var så
          hög som mallens text råkade vara. Knappraden hoppade inte, men den
          växte 40 → 48 px när den bytte till förlagans `AndraRad`; det är rätt
          riktning, eftersom 48 px ÄR eventdetaljens mått. */}
      <div className="divide-y divide-border rounded-lg bg-surface px-3">
        <div className={`flex items-center justify-between gap-4 ${redigerar ? 'py-2' : 'py-3'}`}>
          <span className="shrink-0 text-small text-text-muted">Ämne</span>
          {redigerar ? (
            <Input
              label="Ämne"
              hideLabel
              size="sm"
              value={amne}
              onChange={setAmne}
              className="w-full max-w-80"
            />
          ) : (
            <span className="truncate text-right text-body">{amne || '—'}</span>
          )}
        </div>

        {/* TEXTYTAN — förlagan har ingen FLERRADIG morf, så pariteten härleds
            här och delas via EN konstant. Se `TEXTYTA_KLASS`: båda lägena bär
            samma höjd OCH samma inre padding, så varken rutans kant eller
            textens första rad flyttar sig en pixel när läget växlar. */}
        <div className="py-2.5">
          {redigerar ? (
            <TextArea label="Meddelandetext" hideLabel value={text} onChange={setText} rows={7} />
          ) : (
            // TASK-171.3 (härdningen): `tabIndex={0}` — den låsta rutan är
            // `overflow-auto` och texten kan överstiga 186 px (axe
            // `scrollable-region-focusable`, WCAG 2.1.1: en scrollbar yta utan
            // fokuserbart innehåll är otillgänglig för tangentbord). Fokusordning
            // utan strukturändring — rollen/namnet/aria-trädet rörs inte
            // (36/36 gröna promoverings-grind-tester efter fixen, referens-
            // grindens sex ariaSnapshot-tester ORÖRDA). Samma precedent som
            // `NyaAnmalningarCard.tsx` (B6 AC #6) — INGEN `aria-label` här
            // dock: den precedenten saknar ett facit-låst referens-par (denna
            // ytas AC #3), och innehållet SJÄLVT är namnet en skärmläsare
            // läser vid fokus (löpande text, inte en lista av rader).
            <p
              // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx:139.
              tabIndex={0}
              className={`${TEXTYTA_KLASS} overflow-auto whitespace-pre-wrap text-body text-text-secondary`}
            >
              {text}
            </p>
          )}
        </div>

        {/* ÄNDRA-RADEN ÄR FÖRLAGANS EGEN KOMPONENT, inte en kopia av den
            (Marcus: "måste ju exakt matcha hur det ser ut på eventdetalj-sidan
            till exempel"). `AndraRad` importeras ur `DetaljGrupp` — då kan
            formerna inte glida isär, för det finns bara en.

            Den gamla raden var en KOPIA som redan glidit: `py-2` i stället för
            `py-3`, och penn-"ikonen" var unicode-tecknet `✎` (U+270E) i
            textsträngen — inte `<Pencil size={16} />` ur lucide. Ett tecken ur
            brödtextens font kan aldrig matcha en ikon i vikt, mått eller
            optisk linje, och det syntes.

            KLAR-LÄGET bär `AndraRad`s geometri exakt (py-3 + 24 px = 48 px) men
            behöver en annan etikett än "Ändra", vilket förlagan inte tar som
            prop. Att utvidga `AndraRad` för prototypens skull vore att ändra
            eventsidans facit-låsta komponent — därför en egen rad, med
            klasserna hämtade ur samma förlaga och beroendet öppet bokfört. */}
        {redigerar ? (
          <div className="py-3">
            <button
              type="button"
              onClick={() => setRedigerar(false)}
              className="flex w-full items-center justify-center gap-2 font-medium text-body"
            >
              Klar med texten
            </button>
          </div>
        ) : (
          <AndraRad onPress={() => setRedigerar(true)} />
        )}
      </div>

      <BilageValjare
        attachments={attachments.data ?? []}
        laddar={attachments.isLoading}
        fel={attachments.isError}
        valda={bilagor}
        onVaxla={vaxlaBilaga}
      />

      {utanEpost > 0 && (
        <MessageBox intent="warning" title="Några saknar e-post">
          {utanEpost} av {iUrval.length} mottagare har ingen e-postadress och kommer att
          undertryckas av servern.
        </MessageBox>
      )}

      {/* KNAPPEN ÄR MÖRKGRÅ SOLID, OCH DET FÖLJER INTENT-REGELN — det bryter den
          inte. Färgen tog två varv att landa, och båda stegen är värda att minnas:

          Varv 10 gjorde den `secondary` på Marcus order ("ta den gråa färgen").
          Varv 11 rev det: "Den syns knappt, jag skulle vilja ha en den vanliga
          mörkgråa." Diagnosen var exakt rätt — `--mm-button-secondary-bg` är
          `transparent` (`components.css` rad 34), alltså en ren outline utan
          fyllning. Den "gråa färgen" han menade var `primary`:
          `--mm-btn-primary-bg` = `--p-neutral-800` = `#282928`, appens vanliga
          mörkgrå solid-knapp.

          VARFÖR INTE GRÖN, FORTFARANDE: ursprungsformen var `intent="success"`
          därför att "handlingen når utomstående" (`Button.tsx` § intent-regeln,
          task-19.3 · task-18.16 grön-knapp-regeln · SegmentMailCompose-
          precedenten). Knappen SKICKAR fortfarande inte — den öppnar
          granska-steget, och det är DÄR sändningen sker. Texten "Granska och
          skicka" beskriver hela kedjan hon påbörjar, inte vad detta klick gör.
          Grönt ska betyda "nu går det iväg" den dag en knapp faktiskt gör det;
          spenderas färgen på ett mellansteg är den värdelös när det gäller.

          Mottagarantalet är kvar UTE ur texten (varv 10): räknaren finns redan i
          mottagar-ytans accordion-huvud och på åtgärdsraden, och knappens kopia
          var den minst synliga av de tre.

          HJÄLPTEXTEN BREDVID ÄR BORTA (varv 11, Marcus: "det är fortfarande
          självklart att alla får var sitt mail och att ingen ser vad den andre
          fick"). Den beskrev en EGENSKAP hos sändvägen — loopad singelsändning,
          aldrig en synlig mottagarlista — och den egenskapen är ett verkligt
          krav som lever i underlaget § 7, inte i den här meningen. Raden är
          alltså borta ur ytan utan att kravet rörs. */}
      {/* KNAPPEN LEDER NU NÅGONSTANS (varv 19). Till varv 18 saknade den
          `onPress` helt — texten lovade ett granska-steg som inte fanns, vilket
          är samma klass av tomt löfte som `leder: true` bar i varv 6.

          URVALSFILTRET FÖLJER MED, och det är ett BESLUT, inte en detalj:
          raden ovanför säger "5 av 7" när filtret biter, och till varv 18
          skickade knappen ändå till alla 7 — flaggat till Marcus vid andra
          pausen, obesvarat. Att bära över hela urvalet till en yta som säger
          "det här skickas till N personer" hade gjort den motsägelsen till en
          LÖGN i granskningen, alltså på exakt den yta som finns för att inte
          ljuga. Granskningen tar därför filtrets delmängd. Vill Marcus ha
          motsatt riktning är rätt fix att filtret slutar visas, inte att
          granskningen visar fel tal. */}
      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          isDisabled={iUrval.length === 0}
          onPress={() =>
            onGranska({
              atgard,
              amne,
              text,
              bilagor: [...bilagor],
            })
          }
        >
          Granska och skicka
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== *
 * ÅTGÄRDSMENYN — kvarstående rader, en utfälld åt gången (Marcus-val).
 * ================================================================== */
function AtgardsMeny({
  eventId,
  mottagare,
  oppen,
  onVaxla,
  onGranska,
}: {
  eventId: string;
  mottagare: Registration[];
  oppen: string | null;
  onVaxla: (nyckel: string) => void;
  onGranska: (g: Granskning) => void;
}) {
  return (
    <DetaljGrupp id="grupp-atgard" rubrik="Åtgärd">
      {ATGARDER.map((a) => {
        const arOppen = oppen === a.nyckel;
        const iUrval = a.urvalsfilter ? mottagare.filter(a.urvalsfilter).length : mottagare.length;

        return (
          <div key={a.nyckel} className="flex flex-col">
            <div className="flex flex-col py-1.5">
              <button
                type="button"
                onClick={() => onVaxla(a.nyckel)}
                aria-expanded={arOppen}
                className={RAD_KLASS}
              >
                <NumRuta n={a.nr} />
                {a.namn}
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  {iUrval !== mottagare.length && (
                    <span className="text-small text-text-secondary tabular-nums">
                      {iUrval} av {mottagare.length}
                    </span>
                  )}
                  {/* ALLA FYRA RADER FÄLLER UT HÄR sedan varv 6 — chevron ned
                      utan undantag. Den bort-ledande grenen (chevron höger) föll
                      med "Manuell anmälan", och dess semantik följde med till
                      mottagar-ytan där vägen bort numera bor. */}
                  <ChevronDown
                    aria-hidden="true"
                    size={18}
                    className={`text-text-secondary motion-safe:transition-transform ${
                      arOppen ? 'rotate-180' : ''
                    }`}
                  />
                </span>
              </button>
            </div>
            {arOppen && (
              <ArbetsYta eventId={eventId} atgard={a} mottagare={mottagare} onGranska={onGranska} />
            )}
          </div>
        );
      })}
    </DetaljGrupp>
  );
}

/* ================================================================== *
 * SIDHUVUDET — `ManuellAnmalanForm` § `Sidhuvud`, klass för klass.
 * Marcus 2026-08-07: "kopiera exakt var rubriken sitter, och strecket under,
 * det är ju likadant på de flesta sidor."
 * ================================================================== */
function Sidhuvud({
  tillbakaLank,
  rubrik = 'Åtgärder',
}: {
  tillbakaLank: ReactNode;
  rubrik?: string;
}) {
  return (
    <>
      {tillbakaLank}
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 className="font-semibold text-3xl">{rubrik}</h1>
      </header>
    </>
  );
}

/** Tillbaka-chevronen — rund, `bg-bg-muted`, samma mått som förlagan. */
const TILLBAKA_KLASS =
  'mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted';

/* ================================================================== *
 * UTFALLET — varv 21. Formen är styrd av research-passet
 * `docs/research/post-send-tillstandet-bulkutskick-2026-08-08.md`.
 *
 * DOMEN DÄRIFRÅN, i en mening: resultatet ersätter granskningens innehåll på
 * SAMMA yta — ingen navigation, ingen egen bekräftelse-sida, ingen
 * historik-redirect. Tre oberoende linjer konvergerade: GOV.UK Design Systems
 * namngivna kriterium (pågående resa → notifikation på plats, linjär tjänst
 * som TAR SLUT → egen bekräftelse-sida), vårt eget `ADR-067` D3 (status är
 * acceptans vid submit, aldrig leverans — en rapportsida hade inget att visa
 * som inte redan syns synkront), och storleksklassen (dussintal, mot
 * Intercoms uttalade 1 000-tröskel för bakgrundsjobbs-mönstret).
 *
 * DELNINGEN SOM GÖR YTAN ÄRLIG UTAN ATT BLI EN LOGG: `MessageBox` säger HUR
 * MÅNGA, korten säger VILKA OCH VARFÖR. Räknaren ensam är en halv upplysning
 * — "sex föll" utan att peka ut vilka sex tvingar Lotta att jämföra ett tal
 * mot en lista. Korten står redan utskrivna; de kan bära sitt eget utfall.
 *
 * DE FYRA KLASSERNA ÄR SERVERNS, INTE VÅRA (`ADR-067` D3, ORDLISTA §
 * Delutfall): `sent` alla gick fram · `partial` delutfallet · `failed` ingen
 * gick fram · `skipped` ingen fanns kvar efter serverns filter. Sedan
 * TASK-147.3 (alla fyra åtgärdstyper skickar verkligt) är servern den ENDA
 * källan till klassen — se `verkligtUtfallTillUtfall` nedan.
 * ================================================================== */
/* [TASK-241.3] `Utfall`-typen, `skalForSkip` och `verkligtUtfallTillUtfall`
   FLYTTADE (ren flytt, ingen beteendeändring) till `./atgardsutfall.ts` —
   sändytans svep (`src/data/mutations/svepSend.ts`) återanvänder EXAKT
   samma server-till-svensk-text-mappning, samma "atgardsmallar.ts"-mönster
   som TASK-241.2 redan etablerade för mallmotorn. Importerad överst i
   filen. */

/** Kortet i resultatläget — samma innehåll som mottagarkortet, plus utfallet. */
function UtfallsKort({ reg, skal }: { reg: Registration; skal: string | null }) {
  const lyckades = skal === null;
  return (
    <div
      className={`flex flex-col rounded-xl border ${
        lyckades
          ? 'border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)'
          : 'border-(--mm-success) bg-(--mm-success-bg) contrast-more:border-(--mm-success)'
      }`}
    >
      {/* FALLNA KORT BEHÅLLER MARKERINGS-FORMEN, och det är ett beslut värt att
          kunna försvara: grönt betyder VALD i markeringslägets grammatik, inte
          "lyckad". De fallna ÄR fortfarande valda — PRD berättelse 12 kräver att
          de ligger kvar markerade så omkörningen träffar just dem — medan de
          lyckade är avbetade och därför vita.

          RISKEN ATT GRÖNT LÄSES SOM FRAMGÅNG ÄR VERKLIG, och den bärs av
          utfallsraden nedanför: skälet står i fel-färg på de fallna och i dämpad
          ton på de lyckade. Färgen på RADEN säger utfallet; färgen på KORTET
          säger markeringen. Håller inte den delningen i din blick är det den här
          kommentaren som ska rivas först. */}
      {/* `doljStatusPill` — "Obekräftad"-pillen har ingen mening här (Marcus
          varv 22: "I det skickade läget så kan ju inte korten ha kvar
          'Obekräftade' pillen, den måste bort").

          Han har rätt, och felet var strukturellt och inte kosmetiskt: pillen
          renderas på villkoret `!arBekraftad(reg) && !vald` — alltså "obekräftad
          OCH inte markerad". I markeringsläget bär det villkoret mening, för
          där betyder omarkerad "den här står utanför det du håller på med". I
          resultatläget betyder omarkerad något helt annat — "den här är
          klar" — så villkoret slog till på exakt de kort som just fått sitt
          bekräftelsemail. Pillen sade "Obekräftad" om personer som nyss
          bekräftades. */}
      <DeltagarKortInnehall reg={reg} vald={!lyckades} doljStatusPill />
      <div
        className={`flex items-center gap-1.5 border-t px-4 py-2 text-caption ${
          lyckades ? 'border-border text-text-muted' : 'border-(--mm-success)/30 text-error'
        }`}
      >
        {/* BOCKEN ÄR APPENS EGEN (Marcus varv 22: "vill ja ska ha vår bock
            också, så det ser proffsigare ut") — samma `Check` ur lucide som
            kryssrutan och `SlideToConfirm` bär, aldrig ett unicode-tecken.
            Varv 3 lärde den läxan en gång: `✎` ur brödtextens font kunde inte
            matcha en riktig ikon i vikt, mått eller optisk linje, och det
            syntes. Måttet följer raden den sitter i (12 px = `text-caption`s
            egen storlek), inte kryssrutans 16. */}
        {lyckades && <Check aria-hidden="true" size={12} strokeWidth={3} className="shrink-0" />}
        {lyckades ? 'Skickat' : skal}
      </div>
    </div>
  );
}

/* ================================================================== *
 * GRANSKNINGS-SIDAN — varv 19, EGEN VY och inte en modal.
 *
 * MARCUS VALDE FORMEN 2026-08-07, och gav samtidigt skälet till att
 * `SegmentMailCompose`s bekräftelse-modal inte är facit: "modalen i
 * segmentutskicket är inte designad, den har inte gått igenom denna process,
 * den är byggd som 'baslinje' typ bara." Mekaniken därifrån bärs alltså över
 * där den håller — pessimistisk hållning, oåterkalleligheten sagd rakt ut,
 * grön knapp eftersom handlingen når utomstående — men formen byggs här.
 *
 * VARFÖR SIDA SLÅR MODAL, konkret och inte som smak: `TASK-147` § Estimat
 * lägger granskningen och den pessimistiska körningens ärliga delutfall i
 * SAMMA skiva (7). Ett utfall i formen "fjorton av tjugo, de sex ligger kvar
 * markerade" ska överleva att Lotta tittar bort — en modal tar det med sig när
 * den stängs. Sidan har dessutom plats för mottagarna i sin fulla form, vilket
 * modalen aldrig hade: den fick nöja sig med ett ANTAL.
 *
 * DÄRAV OCKSÅ GRINDENS FORM. Segment-modalen låter Lotta skriva mottagar-
 * ANTALET för att låsa upp (GitHub type-to-confirm) — ett rimligt val när
 * antalet är det enda hon ser, eftersom det tvingar fram läsningen av den
 * konsekvensbärande variabeln. Här är den läsningen redan framtvingad av
 * layouten: varje mottagare står utskriven ovanför. Kvar att skydda mot är
 * det OAVSIKTLIGA klicket, och det är precis vad `SlideToConfirm` är byggd
 * för (S73 K77–K84: "DRAGET är bekräftelsen"). Formen är alltså vald mot vad
 * som återstår att skydda, inte kopierad.
 *
 * ÖPPEN FÖR MARCUS: vill han ha talet tillbaka som grind är bytet en rad —
 * primitiven finns och är prövad. Detta är varv 1 av ytan.
 * ================================================================== */
function GranskningsSida({
  eventId,
  granskning,
  mottagare,
  valtEvent,
  onVaxla,
  onTillbaka,
}: {
  /** Eventet urvalet är bundet till (EF-kontraktets `eventId`, ADR-067-revisionen). */
  eventId: string;
  granskning: Granskning;
  mottagare: Registration[];
  valtEvent: Event | undefined;
  onVaxla: (id: string, vald: boolean) => void;
  onTillbaka: () => void;
}) {
  const [armerad, setArmerad] = useState(false);
  /* TRE LÄGEN PÅ SAMMA YTA (research-domen): granska → skickar → resultat.
     Hubben rörs inte, och `onTillbaka` fungerar i alla tre — vägen ut är
     densamma hela vägen. */
  const [lage, setLage] = useState<'granska' | 'skickar' | 'resultat'>('granska');
  const [utfall, setUtfall] = useState<Utfall | null>(null);
  /* [TASK-147.2/147.3] Samtliga fyra åtgärders enda sändväg — se `skicka()`
     nedan. Instansierad ovillkorat (samma mönster som `useSetPaymentStatus`
     m.fl.): hooken kostar inget att montera, och `GranskningsSida` remountar
     per öppnad granskning (state läcker aldrig mellan två åtgärder). */
  const sendActionEmail = useSendActionEmail(eventId);
  /* [TASK-147.10, T53 väg C] Testmailets EGNA mutation + resultat-state —
     medvetet SKILT från `sendActionEmail`/`utfall` ovan: ett testmail är
     diagnostik, inte den handling `armerad`/`lage` styr, och de två
     nätverksanropen ska kunna ske oberoende av varandra utan att dela status.
     `useAuth().user?.email` är den ENDA adress-källan i UI:t (ren visning —
     servern läser den EGNA gången ur `requireUser`, aldrig den klient-visade
     strängen). */
  const { user } = useAuth();
  /* `valtEvent?.eventNamn ?? null` (TASK-201.13): aktivitetsloggens objekt-
     namn för testmailet — hook-bundet, samma form som `useCreateEventNote`.
     Propen fanns redan; ingen ny trådning behövdes. */
  const sendActionTestEmail = useSendActionTestEmail(eventId, valtEvent?.eventNamn ?? null);
  const [testUtfall, setTestUtfall] = useState<{
    status: 'sent' | 'failed';
    reason?: string;
  } | null>(null);
  /* [RIVEN, TASK-147.8] PROTOTYP-RIGGENS VAL bodde här (`protoLage`,
     `UtfallsLage`) — matade sedan TASK-147.3 ingen konsument längre
     (`simuleraUtfall` var redan riven, `skicka()` läste aldrig detta state).
     `PrototypRigg` självt är riven i denna skiva (filens nedre del); state:et
     som bar dess val är riven med den. Git bevarar (senast i main före denna
     commit). */

  /* [TASK-147.5] SAMMA cache-nyckel som `ArbetsYta`s bilageväljare — löser
     `granskning.bilagor` (Bilagor-record-ID:n) till namn för "valda
     bilagor"-summeringen nedan. Eftersom väljaren redan hämtade listan
     precis innan Lotta tryckte "Granska och skicka" är detta i praktiken
     ALLTID en cache-träff (React Querys default gcTime överlever
     remounten), ingen synlig omladdning. */
  const dataSource = useDataSource();
  const eventAttachments = useQuery({
    queryKey: queryKeys.attachments.byEvent(eventId),
    queryFn: () => dataSource.fetchEventAttachments(eventId),
  });

  /* NY VY BÖRJAR HÖGST UPP (Marcus varv 22): "jag kommer inte in högst upp på
     sidan, utan jag kommer in i mitten typ."

     ORSAKEN ÄR ATT DET INTE ÄR EN NAVIGATION. Sidbytet sker genom att hubben
     byter ut sitt eget innehåll, inte genom en router-övergång — och då finns
     ingen som återställer rullningen. Lotta trycker "Granska och skicka" långt
     ned i en utfälld åtgärdsrad, och den rullningen ligger kvar när den nya
     ytan renderas; hon landar mitt i mottagarlistan i stället för på meningen
     som säger vad som ska hända.

     `lage` i beroendelistan täcker BÅDA övergångarna med samma rad: mount
     (åtgärder → granska) och bytet till resultatet, som annars hade haft exakt
     samma problem — den ytan är kortare, så man kunde landat nedanför hela
     dess innehåll.

     `behavior` lämnas åt webbläsarens default (`auto` = direkt). En mjuk
     rullning här hade varit en animation ovanpå ett vy-byte — inget att följa
     med blicken, bara fördröjning — och `prefers-reduced-motion` hade behövt
     bäras för hand.

     `skickar` ÄR UNDANTAGET, och det är ett designval som lint råkade tvinga
     fram. Biome fällde första formen (`useExhaustiveDependencies`: `lage`
     stod i beroendelistan utan att läsas i kroppen) — en riktig fångst, för
     mönstret "kör om vid tillståndsbyte" utan att röra tillståndet är precis
     så en effekt slutar betyda vad den ser ut att betyda.

     Rätt svar var inte att tysta regeln utan att fråga vad som SKA hända i
     varje läge, och då föll det ut självt: under körningen ska sidan INTE
     hoppa. Lotta står nere vid knappen hon just tryckt, "Skickar…" annonseras
     där, och att rycka henne till toppen mitt i väntan hade tagit bort det
     enda som svarar på om något händer. Resultatet scrollar upp; själva
     väntan gör det inte. */
  useEffect(() => {
    if (lage === 'skickar') return;
    window.scrollTo(0, 0);
  }, [lage]);

  /* FÖRHANDSVISNINGEN GÄLLER EN NAMNGIVEN MOTTAGARE, inte "en mottagare".
     Var och en får sitt eget mail (PRD berättelse 10), så det finns ingen
     enda sann text att visa — det finns N stycken. Att visa den FÖRSTA och
     säga vems den är, är ärligare än att visa mallen och låtsas att den är
     utskicket. */
  const forsta = mottagare[0];
  const forhandsvisning = fyllPlatshallare(granskning.text, forsta, valtEvent);
  const amneVisning = fyllPlatshallare(granskning.amne, forsta, valtEvent);
  const ofyllda = [...new Set([...forhandsvisning.ofyllda, ...amneVisning.ofyllda])];

  const utanEpost = mottagare.filter((r) => !r.email).length;
  const valdaBilagor = (eventAttachments.data ?? []).filter((b) =>
    granskning.bilagor.includes(b.id),
  );
  const kanSkicka = mottagare.length > 0;

  /* SERVERN ÄR FACIT — `L355`, och mönstret är `useConfirmAll`s
     (`registrationConfirmation.ts`): exakt de som lyckades avmarkeras, resten
     ligger kvar. Det är INTE en optimistisk mutation — skrivningen sker EFTER
     svaret, med serverns egen lista. Följden är att urvalet efter körningen
     redan ÄR omkörnings-urvalet: går Lotta tillbaka till hubben står de sex
     kvar markerade och de fjorton är borta.

     [TASK-147.2/147.3] EN ENDA VÄG genom `skicka()` sedan denna skiva — alla
     fyra åtgärdstyper (`AtgardsTyp.nyckel`, typad mot EF-kontraktet) går
     genom `useSendActionEmail` mot TASK-147.1s EF, serverns svar mappat via
     `verkligtUtfallTillUtfall`. TASK-147.2 kopplade "bekraftelse"; TASK-147.3
     kopplade de tre återstående (påminnelse/eventinfo/fritt) mot samma väg.
     `simuleraUtfall` (den tidigare prototyp-grenens minnesbyggda svar) hade
     ingen kvarvarande anropare efter den kopplingen och är riven i samma
     skiva — `PrototypRigg`, som en gång drev den, är riven i TASK-147.8
     (filens nedre del).

     Ingen konstgjord fördröjning behövs längre — mutationens FAKTISKA väntan
     bär `skickar`-lägets synlighet i samtliga fyra fall. */
  function skicka() {
    setLage('skickar');

    sendActionEmail.mutate(
      {
        actionType: granskning.atgard.nyckel,
        registrationIds: mottagare.map((r) => r.id),
        amne: granskning.amne,
        mailtext: granskning.text,
        // [TASK-147.5, AC #1] Grenvalet är AUTOMATISKT server-side: tom
        // lista (normalfallet) ⇒ bilage-fri batchgren, oförändrad. Klienten
        // skickar bara VILKA — mekanismen bor i _shared/send-action-email.ts.
        attachmentIds: granskning.bilagor,
        // [TASK-201.3] Klient-lokalt underlag för aktivitetsloggens
        // objekt-namn — se `useSendActionEmail`s docblock. Skickas ALDRIG
        // till servern.
        mottagare,
      },
      {
        onSuccess: (result) => {
          const nytt = verkligtUtfallTillUtfall(result, mottagare);
          setUtfall(nytt);
          for (const reg of nytt.lyckade) onVaxla(reg.id, false);
          setLage('resultat');
        },
        // Mutationens EGET fel (nätverk, 4xx/5xx-avvisning, icke-prod-
        // spärren) — SKILT från ett per-mottagare-delutfall (200 med
        // failed/skipped), som alltid går till onSuccess ovan. Ingen
        // Utfall-yta finns att visa: tillbaka till granska med felet synligt
        // (MessageBox nedan) och handtaget nollställt — samma "dra igen för
        // att försöka igen"-grammatik som ett oavsiktligt klick skyddas av.
        onError: () => {
          setArmerad(false);
          setLage('granska');
        },
      },
    );
  }

  /* [TASK-147.10, T53 väg C] Testmailet — urval på LÄNGD 1 (ADR-067 D10),
     alltid `forsta.id` (samma person förhandsvisningen ovan redan visar).
     Adressen mailet FAKTISKT går till bestäms server-side (den inloggade
     användarens egen, `requireUser`) — `forsta.id` läses av EF:en ENDAST för
     platshållar-data, aldrig för adressen. Ingen `onVaxla`/`setLage`-rörning:
     ett testmail flyttar ingen mottagare mellan lyckad/fallen och byter
     aldrig läge — det är helt vid sidan av den verkliga sändningens tillstånd. */
  function skickaTest() {
    if (!forsta) return;
    setTestUtfall(null);
    sendActionTestEmail.mutate(
      {
        actionType: granskning.atgard.nyckel,
        registrationIds: [forsta.id],
        amne: granskning.amne,
        mailtext: granskning.text,
      },
      {
        onSuccess: (result) => setTestUtfall(result),
        onError: (error) =>
          setTestUtfall({
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Inget felmeddelande angavs.',
          }),
      },
    );
  }

  /* RESULTATLÄGET RENDERAS FÖR SIG — det är en annan yta med samma sidhuvud,
     inte granskningen med ett meddelande ovanpå. Vägen ut (`onTillbaka`) är
     densamma i alla tre lägena, och urvalet den lämnar efter sig är redan
     omkörnings-urvalet. */
  if (lage === 'resultat' && utfall) {
    const antalLyckade = utfall.lyckade.length;
    const antalFallna = utfall.fallna.length;
    const totalt = antalLyckade + antalFallna;

    return (
      <section className="flex flex-col gap-6 pt-2 lg:pt-10">
        {/* [TASK-171.1] Wrappern bär grindens ariaSnapshot-fäste
            (`data-testid="granskning-yta"`, ADR-103 B4). Den avgränsade
            ursprungligen MEDVETET bort `PrototypRigg`, som stod som en syskon-
            nod utanför denna div — riggens egen docblock sa det rakt ut:
            "riggen, inte ytan". [TASK-147.8] Den avgränsningens SYFTE är nu
            infriat: `PrototypRigg` är riven i sin helhet (filens nedre del),
            och avgränsningen visade sig hålla precis det TASK-171.5 AC #3
            lovade — "gröna mot rivna ytan UTAN OMTAGNING": ingen referensfil
            under `tests/visual/__aria__/` behövde röras när riggen försvann,
            eftersom den aldrig låg innanför denna div. `flex flex-col gap-6`
            speglar sektionens EGEN klass exakt så att ingen synlig spalt
            ändras — samma testid delas mellan "granska"- och "resultat"-
            läget (mutuellt uteslutande DOM-träd), precis som `register-yta`
            delas mellan registrets fyra lägen. */}
        <div data-testid="granskning-yta" className="flex flex-col gap-6">
          <Sidhuvud
            rubrik={antalLyckade === 0 ? 'Inget skickades' : 'Skickat'}
            tillbakaLank={
              <button
                type="button"
                onClick={onTillbaka}
                aria-label="Tillbaka till åtgärderna"
                className={TILLBAKA_KLASS}
              >
                <ChevronLeft aria-hidden="true" size={26} />
              </button>
            }
          />

          {/* VILKA OCH VARFÖR — delningen som gör räknaren läsbar.
            Fallna först: de är det som återstår att göra något åt, och en
            lista som inleds med fjorton avbetade kort begraver de sex som
            behöver uppmärksamhet. */}
          <DetaljGrupp id="grupp-utfall-mottagare" rubrik="Mottagare">
            <div className="flex flex-col gap-2 py-4">
              {utfall.fallna.map(({ reg, skal }) => (
                <UtfallsKort key={reg.id} reg={reg} skal={skal} />
              ))}
              {utfall.lyckade.map((reg) => (
                <UtfallsKort key={reg.id} reg={reg} skal={null} />
              ))}
            </div>
          </DetaljGrupp>

          {/* SAMMANFATTNINGEN SITTER NED VID VÄGEN UT (Marcus varv 22): "den
            gröna rutan som är högst upp vill ja ha över knappen 'Tillbaka till
            åtgärderna'."

            DEN LÄSER RÄTT DÄR, och skälet är att den inte längre gör samma
            jobb som i granskningen. FÖRE skick är sammanfattningen en varning —
            den ska läsas innan man handlar, alltså överst. EFTER skick är den
            en kvittens, och en kvittens hör ihop med att lämna sidan: man
            skummar korten, ser att det stämmer, läser summan och går.

            HUR MÅNGA — intent- och titel-logiken ORDAGRANT ur
            `SegmentMailCompose` rad 306–347, som i sin tur bär regeln i sin
            egen kommentar: noll lyckade renderas ALDRIG som grön framgång,
            utan som neutral varning med en uppdelning som visar VARFÖR.

            `MessageBox` sätter själv `role="alert"` vid warning/error och
            `role="status"` annars (primitivens rad 63) — utfallet annonseras
            alltså för skärmläsare utan en rad extra kod, och en separat
            announcer ovanpå hade varit `L138`s överträdelse.

            EN SPÄNNING ATT DÖMA VID DELUTFALLET, öppet noterad: flytten är
            gjord i ALLA tre lägena. Vid "allt gick fram" är den självklar. Vid
            ett delutfall står korten först röda utan att rutan förklarat varför
            — och den förklaringen ("skälet står på korten") kommer nu efter det
            man redan sett. Marcus prövade "Allt gick fram"; delutfallet är inte
            dömt än. Håller det inte är rätt fix ett villkor på utfallsklassen,
            inte att flytta tillbaka den i båda. */}
          <div className="flex flex-col gap-4 px-4">
            <MessageBox
              intent={
                antalLyckade === 0 ? 'warning' : utfall.status === 'partial' ? 'info' : 'success'
              }
              /* "LYCKADES", INTE "SKICKADES" (Marcus varv 23). Orden är inte
               synonymer här, och skillnaden är precis den som gör ytan ärlig:
               ETT UTSKICK KAN SKICKAS UTAN ATT LYCKAS. Det var hela poängen
               med att riva stämplingslögnen — mailto-eran satte "skickad" på
               ett klick som bara öppnade ett fönster. "Skickades" beskriver
               vår handling; "lyckades" beskriver utfallet, vilket är vad
               raden faktiskt rapporterar. */
              title={
                antalLyckade === 0
                  ? 'Ingen fick mailet'
                  : utfall.status === 'partial'
                    ? 'Utskicket lyckades delvis'
                    : 'Utskicket lyckades'
              }
            >
              {antalLyckade > 0 && (
                <p>
                  <strong>
                    {antalLyckade} av {totalt}
                  </strong>{' '}
                  {antalLyckade === 1 ? 'person fick' : 'personer fick'} mailet.
                </p>
              )}
              {antalFallna > 0 && (
                <p>
                  {antalFallna} fick det inte - skälet står på{' '}
                  {antalFallna === 1 ? 'kortet' : 'korten'} ovanför.{' '}
                  {antalLyckade > 0
                    ? 'De ligger kvar markerade, så du kan gå tillbaka och köra om just dem.'
                    : 'De ligger kvar markerade.'}
                </p>
              )}
            </MessageBox>

            <div className="flex items-center gap-2">
              <Button intent="primary" onPress={onTillbaka}>
                Tillbaka till åtgärderna
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {/* [TASK-171.1] Samma anker som resultatlägets wrapper ovan — se den
          docblocken för hela skälet till varför denna div bär
          `data-testid="granskning-yta"` som EGET DOM-skal. */}
      <div data-testid="granskning-yta" className="flex flex-col gap-6">
        <Sidhuvud
          rubrik="Granska och skicka"
          tillbakaLank={
            <button
              type="button"
              onClick={onTillbaka}
              aria-label="Tillbaka till åtgärderna"
              className={TILLBAKA_KLASS}
            >
              <ChevronLeft aria-hidden="true" size={26} />
            </button>
          }
        />

        {/* KONSEKVENSEN FÖRST OCH STÖRST (NN/g) — vad som händer, i en mening.
          Åtgärdsnamnen inleds alla med verbet "Skicka" (varv 6), så meningen
          bygger sig själv utan att namnet behöver böjas. */}
        <p className="px-4 text-lg">
          <strong className="font-semibold">{granskning.atgard.namn}</strong> till{' '}
          <strong className="font-semibold text-xl tabular-nums">{mottagare.length}</strong>{' '}
          {mottagare.length === 1 ? 'person' : 'personer'}.
        </p>

        {/* FYNDEN — det granskningen faktiskt avslöjade. Står FÖRE innehållet:
          en varning under en 186 px textyta är en varning man scrollar förbi. */}
        {ofyllda.length > 0 && (
          <div className="px-4">
            <MessageBox intent="warning" title="Något i texten kunde inte fyllas i">
              {ofyllda.join(', ')} står kvar som det är och går ut ordagrant så. Fyll i det för hand
              i texten, eller gå tillbaka och ändra.
            </MessageBox>
          </div>
        )}

        {utanEpost > 0 && (
          <div className="px-4">
            <MessageBox intent="warning" title="Några saknar e-post">
              {utanEpost} av {mottagare.length} har ingen e-postadress och kommer att undertryckas
              av servern.
            </MessageBox>
          </div>
        )}

        {/* MOTTAGARNA I SIN FULLA FORM — samma kort hela vägen från eventdetaljen
          (varv 4:s "hur kom Lotta hit?"). De är AVMARKERINGSBARA även här:
          PRD berättelse 2 säger att sista kontrollen sker där handlingen sker,
          och handlingen sker numera på den här sidan. Markeringen är samma
          `valda`-state som hubben äger — ETT urval, två vyer, aldrig en kopia
          som kan glida isär. */}
        {/* RUBRIKEN BÄR INGET TAL (Marcus varv 20). Den sade "Mottagare · 8" två
          rader under "Skicka bekräftelsemail till 8 personer" — samma tal, samma
          skärmbild, ingen ny upplysning.

          VARFÖR DET INTE ÄR SAMMA SAK SOM HUBBENS RÄKNARE: mottagar-ytans
          accordion-huvud bär "7 av 19 deltagare markerade" och det talet BEHÖVS,
          eftersom listan där är INFÄLLD — räknaren är då det enda som svarar på
          "vad tog jag med mig hit?". Här är listan utfälld och står direkt under
          meningen som redan sagt talet. */}
        <DetaljGrupp id="grupp-granska-mottagare" rubrik="Mottagare">
          <div className="flex flex-col gap-2 py-4">
            {mottagare.length === 0 ? (
              <p className="text-body text-text-muted">
                Ingen är markerad längre. Gå tillbaka och markera minst en person.
              </p>
            ) : (
              mottagare.map((r) => (
                <MarkerbartDeltagarKort
                  key={r.id}
                  reg={r}
                  vald={true}
                  onChange={(vald) => onVaxla(r.id, vald)}
                />
              ))
            )}
          </div>
        </DetaljGrupp>

        {/* UTSKICKET SOM MOTTAGAREN SER DET. Ämnesraden bär `EtikettVardeRad`s
          geometri (py-3 + 24 px textrad = 48 px) och textytan `TEXTYTA_KLASS`
          — samma två mått arbetsytan landade i varv 9, så inget flyttar sig
          mellan de två vyerna. */}
        <DetaljGrupp id="grupp-granska-utskicket" rubrik="Utskicket">
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="shrink-0 text-small text-text-muted">Ämne</span>
            <span className="truncate text-right text-body">{amneVisning.text || '—'}</span>
          </div>

          <div className="py-2.5">
            {/* "FÖRHANDSVISNINGSEXEMPEL" ÄR HELA ETIKETTEN (Marcus varv 20).
              Raden sade tidigare "Visas som <Namn> får den. Var och en får sitt
              eget mail med sina egna uppgifter." — två meningar för att bära
              samma sak ordet "exempel" bär ensamt. Att texten är ETT exempel
              säger redan att det finns fler; att den namngav vem det var ett
              exempel för var en precision ingen bad om.

              INNEHÅLLET ÄR OFÖRÄNDRAT: platshållarna fylls fortfarande ur
              första mottagaren, så exemplet är ett verkligt utfall och inte en
              påhittad "Anna Andersson". Det är bara etiketten som krympt. */}
            {forsta && (
              <p className="pb-1.5 text-caption text-text-muted">Förhandsvisningsexempel</p>
            )}
            {/* TASK-171.3 (härdningen): `tabIndex={0}` — samma
                `scrollable-region-focusable`-fix som hubbens ArbetsYta-preview
                ovan (se den platsens kommentar för det fulla motivet). Fokusordning
                utan strukturändring. */}
            <p
              // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx:139.
              tabIndex={0}
              className={`${TEXTYTA_KLASS} overflow-auto whitespace-pre-wrap bg-surface text-body text-text-secondary`}
            >
              {forhandsvisning.text}
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 py-3">
            <span className="shrink-0 text-small text-text-muted">Bilagor</span>
            <span className="flex flex-col items-end gap-0.5 text-right text-body">
              {valdaBilagor.length === 0 ? (
                <span className="text-text-muted">Inga</span>
              ) : (
                valdaBilagor.map((b) => (
                  <span key={b.id} className="flex items-center gap-1.5">
                    <Paperclip aria-hidden="true" size={12} className="shrink-0" />
                    {b.namn}
                  </span>
                ))
              )}
            </span>
          </div>

          {/* [TASK-147.10, T53 väg C, ADR-067 D10] TESTMAILET — trygghetstriadens
            sista länk (förhandsvisning + adresslista + testmail; T53s avgörande
            drivare var Marcus egen sändrädsla vid T55 steg 1-granskningen,
            "Lotta kommer känna likadant"): se det FAKTISKA renderade mailet i
            EGEN inkorg innan handtaget ens dras. MEDVETET UTANFÖR `armerad`-
            grinden — testmailet är diagnostik, inte den oåterkalleliga
            handlingen SlideToConfirm skyddar, och provas hur många gånger som
            helst innan man bestämmer sig. Samma sändväg som `skicka()`
            (`useSendActionEmail`/`useSendActionTestEmail` delar EF, ADR-067
            D9/D10), men EGEN mutation och EGET resultat-state — de två
            anropen ska aldrig dela status. `forsta` styr synligheten: samma
            villkor som "Förhandsvisningsexempel"-etiketten ovan (utan en
            första mottagare finns ingen platshållar-källa att testa).

            PLATSEN (S102, Marcus form-beslut A): RADEN sitter nu i samma grupp
            som Ämne/Bilagor, inte längre en fristående knapp under kortet —
            sammanfattningens rad-grammatik (etikett vänster dämpad, handling/
            utfall höger). Knappen bytte samtidigt `intent="secondary"` (grå
            platta) mot `intent="ghost"` (samma lätta textknapps-affordance som
            `SkrivUtKort`, Atgarder.tsx:238) — Marcus underkände den grå formen
            som "tråkig och passar inte in".

            HOVERN VAR OSYNLIG (S102-iterationen, Marcus 2026-08-11: "Jag är
            inte nöjd med knappen, den har ingen hover."). DEN FANNS — den gick
            bara inte att se, exakt samma mätta fällan som
            `DeltagareHallplatsPrototyp.tsx` § "HOVERN VAR OSYNLIG" dokumenterar
            för sin egen Skriv ut-knapp: `intent="ghost"` hovrar till
            `--mm-button-ghost-bg-hover` = `--mm-bg-muted`, och raden ligger i
            EXAKT den ytan — `DetaljGrupp`s egen kortbakgrund är `bg-bg-muted`
            (`DetaljGrupp.tsx` rad 31). Identiska toner, hovern försvinner in i
            panelen den ligger på. Samma fix, samma repo-egna färg:
            `data-[hovered]:bg-bg-emphasized` — INTE `hover:`, av samma skäl
            syskonfilen mätte fram: en `hover:`-klass är en ANNAN
            tailwind-merge-modifierare än primitivens egen
            `data-[hovered]:`-bas och vinner aldrig mot den. Ingen ny token,
            samma mönster som `EventsList.tsx`/`EventValjare`/
            `ManuellAnmalanForm`s fot-knappar redan bär.

            OMKLICKSBESLUTET (S102-iterationen, öppen tolkning ur PR #1147
            avgjord av Marcus 2026-08-11: "Kör på din rekommendation, knappen
            står kvar, retry-möjlighet."): ett FEL-utfall ERSÄTTER inte längre
            knappen — den står kvar UNDER felraden så ett nytt klick (samma
            `skickaTest`, ingen särskild retry-väg) alltid är möjligt utan att
            först behöva en sidladdning. Ett LYCKAT utfall ersätter fortfarande
            knappen i samma höger-slot (oförändrat — Marcus beslut gällde
            uttryckligen fel-vägen, inte den lyckade), och grundläget (ingen
            `testUtfall` än) visar bara knappen — i båda de fallen är
            höger-sloten fortfarande EN rad, så `items-center`/`flex justify-end`
            hade räckt. Den växer bara i fel-fallet, därför `items-start` på
            YTTRE raden (samma grammatik som Bilagor-raden ovan, som redan bär
            `items-start` av samma skäl — flera rader i höger-sloten) och
            `flex-col items-end gap-1` på live-regionen i stället för
            `justify-end`; en ensam rad ser identisk ut i båda formerna. */}
          {forsta && (
            <div className="flex items-start justify-between gap-4 py-3">
              <span className="shrink-0 text-small text-text-muted">Testmail</span>
              {/* LIVE-REGIONEN OMSLUTER HÖGER-SLOTEN (knapp, knapp+fel, eller
                utfall) — samma `aria-live="polite"`, INGEN FOKUSFLYTT-grammatik
                som övriga mutations-utfall i filen. */}
              <div aria-live="polite" className="flex flex-col items-end gap-1">
                {testUtfall?.status === 'sent' ? (
                  <p className="text-small text-text-muted">
                    Skickat till {user?.email ?? 'din adress'}
                  </p>
                ) : (
                  <>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="data-[hovered]:bg-bg-emphasized"
                      isDisabled={sendActionTestEmail.isPending || lage === 'skickar'}
                      onPress={skickaTest}
                    >
                      <Send aria-hidden="true" size={12} className="shrink-0" />
                      {sendActionTestEmail.isPending ? 'Skickar test…' : 'Skicka till min inkorg'}
                    </Button>
                    {testUtfall?.status === 'failed' && (
                      <p className="text-error text-small">
                        Kunde inte skicka testmailet
                        {testUtfall.reason ? `: ${testUtfall.reason}` : '.'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DetaljGrupp>

        {/* GRINDEN. VARNINGSRADEN ÖVER DEN ÄR BORTA (Marcus varv 20): "Ett skickat
          utskick går inte att ångra. Mottagare som saknar e-post eller har
          tackat nej tas bort av servern." Hans skäl river den vid roten —
          *"de fattar man ändå och de är ju därför slide-to-confirm sitter där"*.
          Han har rätt i formen: ett handtag man måste DRA säger oåterkallelighet
          starkare än en mening som påstår den. Raden förklarade den mekanism
          som stod bredvid.

          MEN DEN BAR TVÅ SAKER, OCH BARA DEN ENA ÄR ERSATT. Consent-meningen —
          att servern tyst undertrycker den som tackat nej till utskick — har nu
          ingen bärare någonstans i ytan. Den lämnas MEDVETET obyggd i stället
          för att flyttas någon annanstans i granskningen: undertryckandet är ett
          UTFALL, inte en förutsägelse (klienten filtrerar aldrig själv — det är
          `SegmentMailCompose`s kontrakt, ADR-067), och att gissa det före skick
          vore att visa ett tal vi inte kan stå för. Rätt hemvist är därför
          resultatredovisningen, som är exakt den yta research-passet om
          post-send-tillståndet nu utreder. Saknad e-post har fortfarande sin
          egen varning högre upp, där den kan mätas. */}
        <div className="flex flex-col gap-4 px-4">
          <SlideToConfirm
            label="Bekräfta utskicket"
            prompt="Dra för att bekräfta"
            confirmedLabel="Bekräftat"
            isSelected={armerad}
            onChange={setArmerad}
          />

          {/* DYNAMISKA GRÖN-REGELN, samma som skapa-sidans knapprad: oarmerat når
            klicket ingen utomstående → primary; armerat går utskicket iväg →
            success. Grönt betyder "nu går det iväg" och spenderas aldrig på ett
            mellansteg — det var exakt skälet till att hubbens knapp INTE är
            grön (varv 11). Här är den det, för här är det sant. */}
          <div className="flex items-center gap-2">
            <Button
              intent={armerad ? 'success' : 'primary'}
              isDisabled={!armerad || !kanSkicka || lage === 'skickar'}
              onPress={skicka}
            >
              {lage === 'skickar'
                ? 'Skickar…'
                : `Skicka till ${mottagare.length} ${mottagare.length === 1 ? 'person' : 'personer'}`}
            </Button>
            <Button intent="secondary" onPress={onTillbaka} isDisabled={lage === 'skickar'}>
              Tillbaka
            </Button>
          </div>

          {/* [TASK-147.2] MUTATIONENS EGET FEL — skilt från ett per-mottagare-
            delutfall (som alltid landar i resultatläget, aldrig här).
            `SegmentMailCompose`-mönstret (`sendMutation.isError`, samma
            villkorsform): nätverksfel, en avvisad begäran (400/422/503) eller
            en icke-prod-spärr som fällde HELA anropet innan servern ens
            försökte något. `isPending` är alltid false i samma render som
            `isError` blir true (mutationen är avslutad), men villkoret
            speglar SegmentMailCompose ordagrant för att inte tysta räknas
            som en optimering som senare glider isär. */}
          {sendActionEmail.isError && !sendActionEmail.isPending && (
            <MessageBox intent="error" title="Kunde inte skicka utskicket">
              {sendActionEmail.error instanceof Error
                ? sendActionEmail.error.message
                : 'Inget felmeddelande angavs.'}
            </MessageBox>
          )}

          {/* IN-FLIGHT: LIVE-REGION, INGEN FOKUSFLYTT. Cloudscape (AWS) är
            explicit för just den här klassen — "Info, in Progress, progress
            bar → Do not move focus, use a live region component to announce
            the message". Regionen ligger ALLTID i DOM:en så att en ändring
            faktiskt annonseras; ett block som monteras in samtidigt som texten
            dyker upp missas av skärmläsare.

            INGEN RÄKNARE ("skickar 8 av 20") — MEDVETET UTELÄMNAD. Research-
            passet rekommenderade en sådan vid körningar över Nielsens
            10-sekundersgräns, men flaggade själv att rekommendationen vilar på
            ett RESONEMANG om den loopade sändvägens skalning och inte på en
            mätning. Att bygga den nu vore spekulativ komplexitet ovanför
            golvet. Mät först. */}
          <div aria-live="polite" aria-busy={lage === 'skickar'} className="min-h-6">
            {lage === 'skickar' && <p className="text-small text-text-muted">Skickar utskicket…</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * [RIVEN, TASK-147.8] PROTOTYP-RIGGEN bodde här — riggens knappar simulerade
 * de tre utfallslägena innan `TASK-147.3` gav `skicka()` en riktig sändväg;
 * sedan dess styrde riggen ingenting (`protoLage` matade ingen konsument).
 * TASK-147.8 river den i sin helhet, per kortets uttryckliga ägarskap
 * (`backlog task 147.8 --plain`, Description: *"PrototypRigg i
 * AtgardsSida.tsx rivs — dess egen docblock väntar på just 147:s riktiga
 * sändväg; referens-specen omriktas mot verkliga utfallslägen."*).
 * `tests/visual/atgardssida-promoverings-grind.spec.ts` behövde INGEN
 * omtagning: den nådde redan de tre utfallslägena via ett mockat
 * `send-action-email`-nätverkssvar (funktionen `valjArmeraSkicka`), aldrig
 * via riggens knappar — exakt den garantin `granskning-yta`s avgränsning
 * (se `GranskningsSida` ovan) fanns för att bevisa. Git bevarar hela
 * implementationen (senast i main före denna commit,
 * `git log -p -- src/components/events/atgarder/AtgardsSida.tsx`).
 * ================================================================== */

/* ================================================================== *
 * SIDAN
 * ================================================================== */
export function AtgardsSida({ eventId }: { eventId?: string }) {
  const dataSource = useDataSource();
  /* MARKERINGEN hon kom hit med (TASK-228, SKARP sedan denna skiva). Kommer
     hon från registret (eventdetaljens markera-läge → Åtgärder) levereras
     urvalet i navigeringens history-state, `mmAtgardsUrval` — ett
     engångsfat, satt av `Deltagare.tsx` § `MarkeringsBatchBar`, samma idiom
     som `ManuellAnmalanForm.tsx` § `mmAvsloja`. Fångas EN gång via en ren
     `useState`-initialiserare (StrictMode-säker — samma mönster som
     `mmAvsloja`), så en omrendering aldrig läser om ett urval hon redan
     backat ur.

     SAKNAS urvalet (direktlänk, eller vägen in via `/atgarder`s fristående
     eventväljare) SEEDAS den ur "obekräftade eller obetalda" i stället, så
     ytan ändå har något att visa — samma fallback som bar hela sidan innan
     TASK-228, nu en medveten reserv snarare än enda källan.

     `synligaIds` är LISTANS medlemskap, `valda` är MARKERINGEN — två olika
     saker sedan varv 4. Ett avmarkerat kort ligger kvar i listan (vitt) men
     räknas inte som mottagare; det är markeringslägets grammatik, oförändrad
     från eventdetaljen. Ett urvals-ID som inte längre finns i `alla` faller
     bort automatiskt: `synliga` nedan filtrerar mot den faktiskt hämtade
     listan, så ett urval som pekar på en försvunnen anmälan räknar aldrig
     fel. */
  const mmAtgardsUrval = useLocation({ select: (l) => l.state.mmAtgardsUrval });
  const [urval] = useState(() => mmAtgardsUrval);
  const [seedad, setSeedad] = useState(false);
  const [synligaIds, setSynligaIds] = useState<ReadonlySet<string>>(() => new Set());
  const [valda, setValda] = useState<ReadonlySet<string>>(() => new Set());
  const [oppenAtgard, setOppenAtgard] = useState<string | null>(null);
  const [betalningarOppna, setBetalningarOppna] = useState(false);
  /* GRANSKNINGEN — satt ⇒ sidan visar gransknings-vyn i stället för hubben.
     Utskickets INNEHÅLL fryses här (ämne, text, bilagor är arbetsytans lokala
     state), men MOTTAGARNA gör det inte: de läses live ur `valda` så
     avmarkering i granskningen är samma handling som avmarkering i hubben. */
  const [granskning, setGranskning] = useState<Granskning | null>(null);
  const betalningsPanelId = useId();

  const events = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  const anmalningar = useQuery({
    queryKey: queryKeys.registrations.byEvent(eventId ?? ''),
    queryFn: () => dataSource.fetchRegistrations({ eventId }),
    enabled: eventId != null,
  });

  const valtEvent: Event | undefined = events.data?.find((e) => e.id === eventId);

  const alla = useMemo(() => anmalningar.data ?? [], [anmalningar.data]);

  // Seedningen sker EN gång, när datan landat — därefter äger Lotta urvalet.
  // Urvalet hon kom med (TASK-228) styr när det finns; annars fallbacken.
  if (!seedad && alla.length > 0) {
    const start =
      urval && urval.length > 0
        ? new Set(urval)
        : new Set(alla.filter((r) => obekraftad(r) || obetald(r)).map((r) => r.id));
    setSynligaIds(start);
    setValda(start);
    setSeedad(true);
  }

  /** Korten i listan, i registrets ordning. */
  const synliga = useMemo(() => alla.filter((r) => synligaIds.has(r.id)), [alla, synligaIds]);
  /** MOTTAGARNA = de markerade. Allt nedströms räknar på dessa. */
  const mottagare = useMemo(() => synliga.filter((r) => valda.has(r.id)), [synliga, valda]);

  /* TOMT LÄGE — eventväljaren fristående som sidans enda handling.
     Samma "TVÅ TILLSTÅND, INTE TVÅ SIDOR"-form som manuell anmälan
     (task-18.18, S83 pass 4-facit; Linear/Rails-precedenten). */
  if (eventId == null) {
    return (
      // [TASK-171.1] data-testid ger promoverings-grinden ett stabilt fäste
      // för tomt-lägets ariaSnapshot-referens (ADR-103 B4) — samma mönster
      // som `register-yta` (TASK-162.1): en ren anker-attribut, ingen form
      // ändras eller flyttas.
      <section data-testid="atgardssida-tomt" className="flex flex-col gap-6 pt-2 lg:pt-10">
        <Sidhuvud
          tillbakaLank={
            <Link to="/hem" aria-label="Tillbaka" className={TILLBAKA_KLASS}>
              <ChevronLeft aria-hidden="true" size={26} />
            </Link>
          }
        />
        <EventValjare
          onByte={(id) => {
            window.location.href = `/event/${id}/atgarder${window.location.search}`;
          }}
        />
      </section>
    );
  }

  /* Deadline-signalen låg HÄR till varv 12 (`deadlineStatus`, delad med
     betalningsvyn — aldrig en andra kopia av 14-dagars-regeln). Den föll när
     `BetalningsDetaljer` monterades i betalnings-blocket: den ytan bär en EGEN
     pill i exakt samma form, och två hade stått två rader isär så fort ytan
     öppnades. Regeln "aldrig en andra kopia" gäller alltså fortfarande — det
     är just därför den här raden är borta och inte den i arbetsytan. */

  /* GRANSKNINGS-VYN ERSÄTTER HUBBEN — Marcus-valet 2026-08-07: egen sida, inte
     modal. Mottagarna räknas om ur `valda` VID VARJE RENDER, med åtgärdens
     urvalsfilter pålagt: avmarkerar Lotta någon i granskningen krymper både
     listan och talet i samma andetag, utan att hubben behöver veta om det. */
  if (granskning) {
    const filter = granskning.atgard.urvalsfilter;
    return (
      <GranskningsSida
        eventId={eventId}
        granskning={granskning}
        mottagare={filter ? mottagare.filter(filter) : mottagare}
        valtEvent={valtEvent}
        onVaxla={(id, vald) =>
          setValda((nu) => {
            const n = new Set(nu);
            if (vald) n.add(id);
            else n.delete(id);
            return n;
          })
        }
        onTillbaka={() => setGranskning(null)}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Sidhuvud
        tillbakaLank={
          <Link
            to="/event/$eventId"
            params={{ eventId }}
            aria-label="Tillbaka till eventet"
            className={TILLBAKA_KLASS}
          >
            <ChevronLeft aria-hidden="true" size={26} />
          </Link>
        }
      />

      {/* ÖVERSTA BLOCKET — BARA väljaren (Marcus 2026-08-07). Sammanfattningen
          och deadline-pillen som stod här i varv 3 sköt ned det Lotta kom hit
          för att se; hon vet redan vilket event hon står i, hon kommer från
          dess detaljsida. Väljaren är kvar eftersom sidan står på egna ben
          (TVÅ TILLSTÅND-formen, task-18.18). */}
      <div data-testid="eventet-block" className={KORT_KLASS}>
        <div className="py-4">
          <EventValjare
            valtEventId={eventId}
            valtEvent={valtEvent}
            onByte={(id) => {
              window.location.href = `/event/${id}/atgarder${window.location.search}`;
            }}
          />
        </div>
      </div>

      {anmalningar.isError && (
        <MessageBox intent="error" title="Kunde inte hämta anmälningarna">
          {anmalningar.error instanceof Error
            ? anmalningar.error.message
            : 'Inget felmeddelande angavs.'}
        </MessageBox>
      )}

      {anmalningar.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton variant="text" className="w-40 text-lg" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <MottagarYta
            eventId={eventId}
            valda={valda}
            synliga={synliga}
            alla={alla}
            onVaxla={(id, vald) =>
              setValda((nu) => {
                const n = new Set(nu);
                if (vald) n.add(id);
                else n.delete(id);
                return n;
              })
            }
            onLaggTill={(id) => {
              // Inplockad ⇒ både SYNLIG i listan och MARKERAD: hon plockade in
              // den för att skicka till den, inte för att titta på den.
              setSynligaIds((s) => new Set(s).add(id));
              setValda((s) => new Set(s).add(id));
            }}
          />

          <AtgardsMeny
            eventId={eventId}
            mottagare={mottagare}
            oppen={oppenAtgard}
            onVaxla={(n) => setOppenAtgard((o) => (o === n ? null : n))}
            onGranska={setGranskning}
          />

          {/* BETALNINGAR — egen ingång, inte en sjunde åtgärd. Hela
              skrivvertikalen som eventsidan gav upp bor här (underlaget § 5).

              [RIVEN, TASK-174] Detta stycke beskrev tidigare VARV 12:s
              montering av eventdetaljens `BetalningsDetaljer` här (samma
              arbetsyta, importerad — plus `protoAktiv`/`protoDataMode`-
              resonemanget om varför den read-only-invarianten fick rivas för
              just den monteringen). VARV 13 REV den monteringen (se filens
              docblock överst, rad ~127): eventdetaljens arbetsyta kan
              strukturellt inte skriva (`TASK-145.4`), så åtgärds-sidan fick
              sin EGEN skrivyta i stället. Den som faktiskt renderas här är
              `BetalningsSkrivYta` (nedan) — se dess docblock för
              arkitekturen och de två vakterna. `protoAktiv`/`protoDataMode`
              finns inte i den komponenten; hela resonemanget om att riva
              read-only-invarianten för en specifik flagga är därför moot —
              betalningsskrivningen ÄR produktionskoden, ovillkorat, sedan
              `TASK-171.5`s promovering.

              DEADLINE-PILLEN FLYTTADE IN I YTAN. Den stod tidigare fritt i
              blockets topp, men den monterade betalningsytan bär en EGEN
              pill i exakt samma form (rad ~1075–1083) — två hade stått två
              rader isär så fort ytan öppnades. Den kvarvarande är den
              monterade ytans. Kostnaden är att deadline-signalen nu kräver
              ett klick; syns det som en förlust är svaret en sammanfattning
              på raden, inte en andra pill. */}
          <section aria-labelledby="grupp-betalningar" className="flex min-w-0 flex-col gap-2">
            <h2 id="grupp-betalningar" className="px-4 font-semibold text-lg">
              Betalningar
            </h2>
            <div className={KORT_KLASS}>
              <div className="flex flex-col py-1.5">
                <button
                  type="button"
                  onClick={() => setBetalningarOppna(!betalningarOppna)}
                  aria-expanded={betalningarOppna}
                  aria-controls={betalningsPanelId}
                  className={RAD_KLASS}
                >
                  <Upload aria-hidden="true" size={16} className="shrink-0" />
                  {/* "…och påminn" ströks (varv 12, Marcus): påminnelsen är en
                      ÅTGÄRD och bor i åtgärdslistan ovanför ("Skicka
                      betalningspåminnelse"). Se `Betalningar.tsx` rad 493–497 —
                      Marcus rev påminn-ikonen ur den här ytan redan 2026-08-06
                      med samma motiv, så raden hade lovat en väg som beslutet
                      stängt. */}
                  Pricka av och notera
                  <span className="ml-auto flex shrink-0 items-center gap-2">
                    <span className="text-small text-text-secondary tabular-nums">
                      {alla.filter(obetald).length} saknar
                    </span>
                    {/* Chevron NED, inte höger: raden leder inte längre bort,
                        den fäller ut här. Samma ärlighetsprincip som styr
                        åtgärdsraderna och plockaren. */}
                    <ChevronDown
                      aria-hidden="true"
                      size={18}
                      className={`text-text-secondary motion-safe:transition-transform ${
                        betalningarOppna ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                </button>
              </div>
              {/* Panelen alltid i DOM:en med `hidden` — `aria-controls` måste
                  peka på ett element som finns (samma regel som mottagar-ytan). */}
              <div id={betalningsPanelId} hidden={!betalningarOppna}>
                {eventId && (
                  <BetalningsSkrivYta
                    eventId={eventId}
                    /* Basens 'Är aktiv'-formel: endast Avbokad räknas bort —
                       samma predikat läsytan använder. */
                    registreringar={alla.filter((r) => r.status !== RegistrationStatus.AVBOKAD)}
                  />
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
