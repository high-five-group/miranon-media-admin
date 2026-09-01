import { AlertTriangle, Ban, Ellipsis, ExternalLink, Loader2, Send, Trash2 } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Button, Input, MessageBox, Skeleton } from '@/components/primitives';
import { Meny, MenyAvdelare, MenyPost } from '@/components/primitives/Meny';
import {
  useInbetalningarPerAnmalan,
  useInbetalningarPerPerson,
} from '@/data/betalningar/useBetalningar';
import {
  useKoaKvitton,
  useMakuleraInbetalning,
  useRaderaInbetalning,
} from '@/data/mutations/inbetalningar';
import { useKvittolank, useSkickaKvittoIgen } from '@/data/mutations/kvitton';
import type { Inbetalning, Kvitto } from '@/domain/schemas';
import { skrivLaddningssida } from '@/lib/skriv-laddningssida';
import { visaKronor } from './belopp-inmatning';
import {
  inbetalningsBeloppKolumn,
  inbetalningsText,
  inbetalningsUnderdelar,
  kanMakulera,
  kanRadera,
  kvittolage,
  sorteraInbetalningar,
} from './panel-harledningar';

/** Menyposternas ikonstorlek — samma 16 px som bilage-kortens `IKON_STORLEK`. */
const IKON_STORLEK = 16;

/**
 * ⋯-knappens geometri — samma `size-11 shrink-0 p-0` som bilage-kortets
 * `IKONKNAPP_KLASS` (`DokumentYta.tsx`). 44 px är husets träffytegolv.
 *
 * TONERNA ÄR SEMANTISKA, INTE BILAGEKORTETS KOMPONENT-TOKENS. Bilage-kortet
 * når dem via `--mm-bilagekort-ikonknapp-*`, men de tokens tillhör DEN
 * komponenten — att konsumera dem här vore den lager-3-läcka
 * `semantic.css` § "Kant som finns men inte syns" uttryckligen namnger. De
 * upplösta värdena (`--mm-text-secondary`, `--mm-bg-emphasized`) är
 * disk-verifierade i `components.css` rad 324–325 och skrivs därför som sina
 * semantiska klasser i stället.
 */
const IKONKNAPP_KLASS =
  'size-11 shrink-0 rounded-full p-0 text-text-secondary data-[hovered]:bg-bg-emphasized data-[hovered]:text-text data-[pressed]:bg-bg-emphasized data-[pressed]:text-text contrast-more:border contrast-more:border-current';

/**
 * Skälets längdgränser — speglar `hantera-inbetalning/index.ts`s
 * `SKAL_MIN_LANGD`/`SKAL_MAX_LANGD`. RÄTTAD, granskningsfynd runda 2, I7:
 * kommentaren påstod tidigare att BÅDA speglades, men bara MIN användes —
 * ett skäl över 500 tecken upptäcktes först efter submit (EF:ens 400 "Skälet
 * får vara högst 500 tecken."), i stället för direkt i fältet.
 */
const SKAL_MIN_LANGD = 3;
const SKAL_MAX_LANGD = 500;

export type Inbetalningskalla = { anmalanRecordId: string } | { personId: string };

type Props = {
  /** EN anmälan eller EN person. Hämtningen väljs efter formen. */
  kalla: Inbetalningskalla;
  /** Hämta först när ytan faktiskt visas - se hookarnas docblock. */
  aktiv: boolean;
  /**
   * Rullningsregionens tillgängliga namn.
   *
   * [PASS 12] ERSÄTTER DEN RIVNA `max`-PROPEN. `max` kapade listan till N
   * rader och lät en "Visar 5 av 7"-rad förklara resten bort; sedan listan
   * fick inline scroll (se renderingen) finns alla rader, och det som behövs i
   * stället är ett NAMN på den fokuserbara rullningsboxen. Konsumenten
   * bestämmer det, eftersom rubriken ovanför listan varierar per yta
   * ("Senaste inbetalningar" på personkortet, "Inbetalningar" på anmälan).
   */
  listEtikett?: string;
  /** Vad som står när det inte finns någon inbetalning alls. */
  tomText?: string;
};

/**
 * [TASK-346.7 AC #2/#3/#4, TASK-352] Inbetalningsraderna med KVITTOSTATUS,
 * plus Visa och Skicka igen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD RADEN SVARAR PÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 12, ordagrant: "Som Lotta vill jag kunna se och skicka om
 * ett kvitto från raden, så att jag kan svara 'vad skickade vi till Bengt?'
 * utan att be Bengt vidarebefordra." Raden bär därför beloppet, betalsättet,
 * datumet OCH kvittots läge - inte bara en summa.
 *
 * VILKEN KNAPP SOM ERBJUDS ÄR EN HÄRLEDNING, INTE EN BEDÖMNING I JSX.
 * `kvittolage` (`panel-harledningar.ts`) avgör `kanVisa`/`kanSkickaIgen`/
 * `kanKoaOm` och har egna tester med negativa kontroller. Ett kvitto som
 * ännu bara är UTFÄRDAT får ALDRIG "Skicka igen" (`skickaKvittoIgen` - den
 * förutsätter ett REDAN utskickat kvitto och en knapp där hade bett Lotta
 * åtgärda något som redan är på väg) - men får sedan TASK-352 en EGEN
 * "Skicka igen" via `koaKvitton` (`kanKoaOm`), eftersom raden annars var den
 * enda ytan i appen där ett FALLERAT kvittoutskick blev osynligt så fort
 * Lotta lämnade inkorgens transienta utfallsregion (S113-slutvandringen
 * 2026-08-31, se `panel-harledningar.ts` § `kanKoaOm`).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "VISA" FÖLJER HUSETS POPUP-SÄKRA MÖNSTER, INTE SITT EGET
 * ═══════════════════════════════════════════════════════════════════════════
 * Länken är SIGNERAD och hämtas asynkront, så adressen finns inte när Lotta
 * klickar. `DokumentYta.tsx` och `GenereringsVy.tsx` löste redan exakt det:
 * öppna fönstret SYNKRONT i klickets egen tick (annars stoppar
 * popup-blockeraren det), skriv en laddningssida i det, och sätt adressen
 * när svaret kommer. Mönstret och dess mätningar bor i
 * `src/lib/skriv-laddningssida.ts` - denna yta återanvänder det i stället
 * för att uppfinna ett tredje.
 *
 * `fonster.closed`-VAKTEN är obligatorisk vid den SENARE, asynkrona
 * href-sättningen: Lotta kan hinna stänga fliken medan EF:en signerar, och
 * att skriva `location.href` på ett stängt fönster kan kasta.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RADENS ANATOMI — BANKENS TRANSAKTIONSLISTA (Marcus dom 2026-09-01, pass 14)
 * ═══════════════════════════════════════════════════════════════════════════
 * Marcus jämförde listan med sin egen banks transaktionslista och dömde vår
 * form *"barnsligt … inte klart"*. Facit är alltså bankens anatomi, byggd i
 * ljust tema med husets egna tokens — INTE en ny uppfinning:
 *
 *   1. EN SAMMANHÄNGANDE LISTYTA, inte ett kort per rad. Behållaren bär
 *      kortformen; raderna inuti skiljs av TUNNA HÅRLINJER.
 *   2. BELOPPET I EGEN HÖGERKOLUMN, på titelradens baslinje.
 *   3. VÄNSTERKOLUMNEN TÄT: rad 1 = betalsättet, rad 2 = datum ·
 *      kvittostatus i sekundär ton.
 *   4. TÄTARE RADRYTM än kortformens.
 *   5. ⋯-MENYN ytterst till höger. Ingen chevron — raderna navigerar inte.
 *
 * VAD SOM REVS, OCH VARFÖR DET INTE ÄR EN OLYCKA:
 * Föregående form (pass 8) var bilage-kortets grammatik — `rounded-2xl
 * border-transparent bg-surface p-3` per rad, beloppet som primärled i
 * vänsterkolumnen, metadatan som ett `·`-svep under. Den var RÄTT mot sin
 * egen förlaga (dokumentlistan) och löste de fyra fel den ersatte. Men en
 * dokumentlista och en transaktionslista är olika djur: dokumentet ÄR ett
 * objekt man öppnar, transaktionen är ett BELOPP man skannar. En pelare av
 * vita rutor tvingar ögat att läsa varje rad; en hårlinjelista med
 * högerställda tal låter ögat läsa kolumnen. Spänningen mot `AtgardsSida.tsx`
 * § designfynd 4c ("åtta sådana vita väggar radade under varandra läste
 * tyngre") stod bokförd i denna docblock i sex pass — den är nu upplöst åt
 * 4c:s håll, inte längre en öppen fråga.
 *
 * FORMEN ÄR HUSETS EGEN, KOPIERAD OCH INTE UPPFUNNEN. Klassuppsättningen
 * `divide-y divide-border rounded-xl border border-transparent bg-surface
 * px-3 contrast-more:border-border-strong` är ORDAGRANT den
 * `EventinnehallYta.tsx` (rad 180, 221) och `PlatserYta.tsx` (rad 137, 228)
 * redan bär för exakt detta: en sammanhängande listyta med hårlinjer. Enda
 * tilläggen är inline-scrollens fyra klasser (nedan) och
 * `contrast-more:divide-border-strong`, som förlagorna saknar — hårlinjen
 * `--mm-border` mot `--mm-surface` mäter **1,29:1**, och den som bett om
 * förstärkt kontrast ska få hårlinjen förstärkt, inte bara ytterkanten
 * (`--mm-border-strong` ger 1,75:1).
 *
 * KOLUMNERNA, led för led:
 *
 *   • TITELLEDET är BETALSÄTTET (`font-medium text-body`) — "Swish",
 *     "Bankgiro", "Historik". Det är radens identitet på samma plats som
 *     banken sätter mottagaren.
 *   • SEKUNDÄRLEDET är `inbetalningsUnderdelar` + kvittostatusen, ETT
 *     `·`-svep i `text-caption text-text-muted`: datum · kvittostatus, och
 *     ordet "Återbetalning" först på de rader typen är det. Uppdelningen bor
 *     i härledningarna (`panel-harledningar.ts`), aldrig i denna JSX.
 *   • BELOPPSKOLUMNEN (`font-medium text-body tabular-nums`, högerställd)
 *     bär `inbetalningsBeloppKolumn` — beloppet med DATANS EGET TECKEN, se
 *     den funktionens docblock för varför ordet "återbetalt" flyttade till
 *     sekundärledet i stället för att försvinna. `tabular-nums` är vad som
 *     gör pelaren till en pelare: proportionella siffror ger olika bred
 *     "1 111" och "8 888", och då slutar högerkanten vara en linje.
 *   • `Ban`-GLYFEN FÖLJDE MED BELOPPET till högerkolumnen. Den satt som
 *     ledande glyf i vänsterkanten fram till pass 14; makuleringens plats är
 *     bredvid det tal den upphäver, inte i en egen kolumn tre led bort.
 *     `aria-hidden` oförändrat — makuleringen sägs i TEXT nedan (WCAG 1.4.1),
 *     glyfen är ett skanningsstöd. Genomstrykningen sitter på SIFFRAN, inte
 *     på svepet som rymmer glyfen: ett streck genom en förbudsikon läser som
 *     grafiskt brus.
 *   • ⋯-MENY för handlingarna, husets `Meny`-primitiv (React Aria
 *     `MenuTrigger`/`Menu`/`MenuItem`): piltangenter, typeahead, Escape och
 *     fokus-återlämning utan egen kod. Destruktiva poster bär `ton="fara"`
 *     efter en `MenyAvdelare`, konventionen primitivens egen docblock slår
 *     fast.
 *
 * DE LÅNGA SEKUNDÄRRADERNA (makulering, notering, felskäl, kvittenser) och
 * de inline panelerna BOR KVAR I TEXTKOLUMNEN och trunkeras inte. Bankens
 * rader är enradiga; våra bär ibland ett skäl som är hela svaret på "varför
 * gick det inte?". Att klippa dem för en symmetri ingen mekanism kräver vore
 * att offra information — samma avvägning som stod här före pass 14, och den
 * gäller ordagrant fortfarande.
 */
export function InbetalningsLista({ kalla, aktiv, listEtikett = 'Inbetalningar', tomText }: Props) {
  const anmalanId = 'anmalanRecordId' in kalla ? kalla.anmalanRecordId : '';
  const personId = 'personId' in kalla ? kalla.personId : '';

  // BÅDA hookarna anropas ALLTID (hooks-reglerna), men bara den som hör till
  // källan är `enabled`. Den andra gör inget nätverksanrop alls.
  const perAnmalan = useInbetalningarPerAnmalan(anmalanId, aktiv && anmalanId !== '');
  const perPerson = useInbetalningarPerPerson(personId, aktiv && personId !== '');
  const query = anmalanId !== '' ? perAnmalan : perPerson;

  if (!aktiv) return null;

  if (query.isPending) {
    return (
      <div aria-busy="true" role="status" className="flex flex-col gap-2">
        <span className="sr-only">Laddar inbetalningar ...</span>
        <Skeleton variant="listRow" aria-hidden />
      </div>
    );
  }

  if (query.isError) {
    // [TASK-346.7.1] Gunilla-klar text, ALDRIG query.error.message rakt ut
    // (T177-klassen: tekniska "Edge Function "…" 500: …"-strängar hör inte
    // hemma i Lottas UI). Försök igen-knappen speglar husmönstret
    // (SectionError.tsx, AtgardsSida.tsx) — MessageBox `actions`-slotten,
    // aldrig en egenplacerad knapp bredvid rutan.
    return (
      <MessageBox
        intent="error"
        title="Inbetalningarna kunde inte hämtas"
        actions={
          <Button intent="secondary" size="sm" onPress={() => void query.refetch()}>
            Försök igen
          </Button>
        }
      >
        Kontrollera att du är uppkopplad och försök igen.
      </MessageBox>
    );
  }

  const alla = sorteraInbetalningar(query.data.inbetalningar);
  const spegel = query.data.spegel;
  // [TASK-352] EN uppslagning för hela listan, aldrig en sökning per rad —
  // samma princip som kvittona ovan. `kvittolage` tar bara emot resultatet
  // (se dess docblock).
  const jobbfelPerInbetalning = new Map(query.data.jobbfel.map((f) => [f.inbetalningId, f.skal]));

  if (alla.length === 0) {
    return (
      <p className="text-small text-text-muted">{tomText ?? 'Ingen inbetalning registrerad än.'}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* SPEGELNS EFTERSLÄPNING SÄGS RAKT UT (ADR-128 beslut 5: den "SYNS I
          APPEN i stället för att tystas"). Talen kommer ur samma svar, så
          detta kostar inget extra anrop. */}
      {!spegel.iFas && (
        <p className="flex items-center gap-1.5 text-caption text-text-muted">
          <AlertTriangle aria-hidden size={13} className="shrink-0" />
          {`Basen har inte hunnit uppdateras än. Appen har ${visaKronor(spegel.summaPostgres)} kr, basen ${spegel.summaBasen === null ? 'saknar värde' : `${visaKronor(spegel.summaBasen)} kr`}.`}
        </p>
      )}

      {/* HÅRLINJER, INTE KORTFORM (Marcus dom 2026-09-01, pass 14) — se
          komponentens docblock § RADENS ANATOMI. Listytan är EN yta med
          `divide-y`-hårlinjer; kortformen bor på behållaren, inte på raden.
          Klassuppsättningen är `EventinnehallYta.tsx`/`PlatserYta.tsx`
          ordagrant, plus inline-scrollens fyra klasser och
          `contrast-more:divide-border-strong`.

          ═══ INLINE SCROLL I STÄLLET FÖR ETT TAK (pass 12, 2026-09-01) ═══
          Marcus: *"Jag tror vi måste ha inline scroll som vi har på så många
          andra ställen här, det kommer bli många inbetalningar på många
          personer."*

          FÖRLAGAN ÄR KOPIERAD, INTE UPPFUNNEN: `focus-ring-inset
          scrollbar-inline flex max-h-96 flex-col overflow-y-auto` är
          ordagrant klassuppsättningen `hem/NyaAnmalningar.tsx` och
          `hem/ForfallnaBetalningar.tsx` (tre listor) redan bär. Förlagornas
          `pr-3` (luft mot scrollmarkören) är sedan pass 14 ersatt av
          listytans egen `px-3` — samma 12 px, men symmetriskt, eftersom
          behållaren nu ÄR en yta med två synliga kanter i stället för en
          transparent stapel.

          `tabIndex={0}` + `aria-label` ÄR WCAG-GOLVET, inte pynt: en
          rullningsbar region måste gå att nå och rulla med tangentbord (axe
          `scrollable-region-focusable`, WCAG 2.1.1). Samma `biome-ignore` och
          samma motiv som förlagan bär.

          ⋯-MENYERNA KLIPPS INTE — MÄTT, INTE ANTAGET: `DokumentYta.tsx`
          (rad ~2833) kör redan husets `Meny` med `Ellipsis` i rader inuti en
          `scrollbar-inline`-lista med `overflow-y-auto`. Det är en levererad,
          granskad yta, alltså ett empiriskt bevis som väger tyngre än att läsa
          bundlad RAC-källa: popovern portalas ut ur rullningsboxen.

          TAKET OCH "VISAR X AV Y" ÄR RIVNA med scrollen. `max`-propen hade
          exakt EN konsument (personkortets `SENASTE_ANTAL = 5`) och dess enda
          syfte var att hålla listan kort — vilket rullningen nu gör utan att
          gömma rader. En rad som finns ska gå att nå. */}
      <ul
        // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv och samma form som hem/NyaAnmalningar.tsx.
        tabIndex={0}
        aria-label={listEtikett}
        className="focus-ring-inset scrollbar-inline flex max-h-96 flex-col divide-y divide-border overflow-y-auto rounded-xl border border-transparent bg-surface px-3 contrast-more:divide-border-strong contrast-more:border-border-strong"
      >
        {alla.map((inbetalning) => (
          <InbetalningsRad
            key={inbetalning.id}
            inbetalning={inbetalning}
            kvitton={query.data.kvitton}
            felskal={jobbfelPerInbetalning.get(inbetalning.id) ?? null}
          />
        ))}
      </ul>
    </div>
  );
}

/** Vilket inline-underläge raden befinner sig i. Bara ETT åt gången (AC #1/#2). */
type Radatgard = 'vy' | 'radera-bekrafta' | 'makulera-skal';

function InbetalningsRad({
  inbetalning,
  kvitton,
  felskal,
}: {
  inbetalning: Inbetalning;
  kvitton: readonly Kvitto[];
  /** [TASK-352] Senaste kvittojobbets felskäl för DENNA rad, om något fallerat. */
  felskal: string | null;
}) {
  const lage = kvittolage(inbetalning, kvitton, felskal);
  const lank = useKvittolank();
  const skickaIgen = useSkickaKvittoIgen();
  const koaOm = useKoaKvitton();
  const radera = useRaderaInbetalning();
  const makulera = useMakuleraInbetalning();
  const [skickatTill, setSkickatTill] = useState<string | null>(null);
  const [koaUtfall, setKoaUtfall] = useState<string | null>(null);
  const [atgard, setAtgard] = useState<Radatgard>('vy');
  const [skal, setSkal] = useState('');
  const [skalRort, setSkalRort] = useState(false);
  const skalId = useId();

  const makulerad = inbetalning.status === 'makulerad';
  const visaRadera = kanRadera(inbetalning, kvitton);
  const visaMakulera = kanMakulera(inbetalning, kvitton);
  // [TASK-346.14, designfynd 3d] Har raden NÅGON handling att visa på sin
  // egen rad? En makulerad rad utan kvitto kan sakna alla fem — utan detta
  // villkoret hade en tom, högerställd rad ändå lagt till ett `gap-2`-mellanrum.
  /* MENYNS ICKE-DESTRUKTIVA POSTER, som en egen härledning — den avgör både
     `harHandlingar` nedan och om avdelaren före Radera/Makulera ska ritas.
     Marcus dom 2026-09-01: *"Varför är det en separatorlinje över 'radera'?"*
     En avdelare mellan EN grupp och ingenting avdelar inte, den ser bara ut som
     en bugg — och det läget är det VANLIGA på en färsk inbetalning utan kvitto,
     där Radera är enda posten. */
  const harOvrePoster =
    lage.kanVisa || (lage.kanSkickaIgen && lage.kvitto !== null) || lage.kanKoaOm;
  // [TASK-346.14, designfynd 3d] Har raden NÅGON handling att visa på sin
  // egen rad? En makulerad rad utan kvitto kan sakna alla fem — utan detta
  // villkoret hade en tom, högerställd rad ändå lagt till ett `gap-2`-mellanrum.
  const harHandlingar = harOvrePoster || (atgard === 'vy' && (visaRadera || visaMakulera));

  // FOKUS-RETUR TILL ⋯-KNAPPEN — bara vid AVBRYT/ESC (samma anatomi som
  // `RegistreraYta`/`AterbetalningsYta`). En LYCKAD radering tar bort raden
  // helt (ur listan efter invalidering) och en lyckad makulering tar bort
  // posten som öppnade panelen (`kanMakulera` blir falsk) — i BÅDA de fallen
  // finns inget meningsfullt fokusmål kvar att återgå till, och det är
  // BOKFÖRT här, inte förbisett: statusraden nedan (`role="status"`) bär då
  // annonseringen i stället för fokus.
  //
  // EN REF, INTE TVÅ — OCH DET RÄTTAR EN LATENT DEFEKT. Här stod tidigare
  // `raderaTriggerRef`/`makuleraTriggerRef` på de två trigger-KNAPPARNA, som
  // renderades under `atgard === 'vy'`. De avmonterades alltså i samma
  // render som panelen öppnades, så deras `.current` var `null` när
  // `avbrytAtgard()` senare försökte fokusera dem — Avbryt och Escape
  // lämnade fokus på `document.body`. Trigger är nu ⋯-knappen, som står
  // kvar så länge raden har någon handling alls, och återgången sker i
  // effekten nedan (efter att React monterat om menyn) i stället för
  // synkront i avbryt-anropet.
  const menyTriggerRef = useRef<HTMLButtonElement>(null);

  // ── FOKUS IN när en panel öppnas (granskningsfynd runda 2, W5) ──────────
  //
  // Samma anatomi som `AterbetalningsForm`/`RegistreraForm`: trigger-knappen
  // som ÄGDE fokus AVMONTERAS i samma render som panelen visas (`atgard ===
  // 'vy' && ...` slutar rendera de knapparna ovan) — utan en explicit
  // flytt faller webbläsaren tillbaka på `document.body`, och varken
  // skärmläsaren annonserar kontextväxlingen eller Escape-hanterarna
  // (`vidRaderaTangent`/`vidMakuleraTangent`, som sitter PÅ fieldset/form)
  // tar emot något förrän Lotta tabbat in för hand.
  //
  // DETTA ÄR INGEN MOUNT-EFFEKT: `AterbetalningsForm` är en EGEN komponent
  // som monteras/avmonteras när den öppnas, så dess `useEffect(fn, [])`
  // räcker. Panelerna här är i stället villkorad JSX i SAMMA
  // komponentinstans (`InbetalningsRad` byter bara `atgard`-state) — en
  // tom dependency-lista hade bara fokuserat vid FÖRSTA render, aldrig vid
  // en senare övergång 'vy' → 'radera-bekrafta'. Effekten är därför keyad
  // på `atgard` och körs om vid VARJE övergång.
  //
  // RADERA-PANELEN FOKUSERAR "Avbryt", INTE "Radera": WAI-ARIA APG:s
  // alertdialog-mönster ("Initial focus placement... on the least
  // destructive action button") gäller ordagrant här — panelens egen text
  // säger "Det går inte att ångra", och ett fokuserat "Radera" hade gjort
  // ett oavsiktligt Enter-tryck direkt efter öppning till en oåterkallelig
  // radering. MAKULERA-PANELEN fokuserar skäl-fältet i stället: åtgärden
  // KRÄVER ändå att Lotta skriver något innan den går att skicka, så
  // fältet är den naturliga första stoppen.
  //
  // ÅTERGÅNGEN BOR I SAMMA EFFEKT, inte i `avbrytAtgard`: ⋯-knappen kan vara
  // avmonterad i det ögonblick avbrytet sker (stängs panelen är den kvar bara
  // om raden har någon handling alls), och en synkron `.focus()` skulle då
  // träffa en ref som ännu inte pekar på det ommonterade elementet. Effekten
  // kör EFTER commit, alltså när menyn finns igen. `foregaendeAtgard` gör att
  // återgången bara sker vid en FAKTISK stängning — aldrig vid första render.
  const raderaAvbrytRef = useRef<HTMLButtonElement>(null);
  const makuleraSkalRef = useRef<HTMLInputElement>(null);
  const foregaendeAtgard = useRef<Radatgard>('vy');
  useEffect(() => {
    if (atgard === 'radera-bekrafta') raderaAvbrytRef.current?.focus();
    else if (atgard === 'makulera-skal') makuleraSkalRef.current?.focus();
    else if (foregaendeAtgard.current !== 'vy') menyTriggerRef.current?.focus();
    foregaendeAtgard.current = atgard;
  }, [atgard]);

  function avbrytAtgard() {
    setAtgard('vy');
    setSkal('');
    setSkalRort(false);
  }

  function vidRaderaTangent(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      avbrytAtgard();
    }
  }

  function vidMakuleraTangent(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      avbrytAtgard();
    }
  }

  const skalLangd = skal.trim().length;
  const skalFel =
    skalRort && skalLangd < SKAL_MIN_LANGD
      ? `Skriv ett skäl (minst ${SKAL_MIN_LANGD} tecken).`
      : skalRort && skalLangd > SKAL_MAX_LANGD
        ? `Skälet får vara högst ${SKAL_MAX_LANGD} tecken.`
        : null;

  function vidMakuleraSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (skalLangd < SKAL_MIN_LANGD || skalLangd > SKAL_MAX_LANGD) {
      setSkalRort(true);
      return;
    }
    makulera.mutate(
      { inbetalningId: inbetalning.id, skal: skal.trim() },
      { onSuccess: () => setAtgard('vy') },
    );
  }

  function visaKvitto() {
    if (lage.kvitto === null) return;
    // SYNKRONT i klickets tick - se komponentens docblock.
    const fonster = window.open('', '_blank');
    skrivLaddningssida(fonster, {
      titel: 'Öppnar kvittot ...',
      text: 'Ett ögonblick, kvittot öppnas här om några sekunder.',
    });
    lank.mutate(lage.kvitto.id, {
      onSuccess: (svar) => {
        if (fonster && !fonster.closed) fonster.location.href = svar.url;
      },
      onError: () => {
        if (fonster && !fonster.closed) fonster.close();
      },
    });
  }

  return (
    /* INGEN `opacity` PÅ EN MAKULERAD RAD - MÄTT, INTE RESONERAT.
       Raden bar `opacity-70` fram till acceptansvandringen 2026-08-31. Axe
       fällde den då med FYRA `color-contrast`-överträdelser (serious): den
       nedtonade texten (`text-text-muted`, #949494 mot #f5f5f3) föll till
       2,77:1, långt under WCAG 2 AA:s 4,5:1 - opaciteten multiplicerar mot en
       färg som redan är dämpad, och just de raderna bär den viktigaste texten
       på ytan ("Makulerad: <skäl>").
       Makuleringen sägs i stället med genomstruken text OCH i klartext på egen
       rad. Båda överlever nedsatt syn; en opacitet gör det inte. */
    <li>
      {/* RADEN — bankens tre kolumner (se komponentens docblock § RADENS
          ANATOMI). `items-start`: beloppet och ⋯ hör till TITELRADEN, inte
          till radens mitt. En rad med en utfälld panel växer nedåt, och en
          `items-center` här hade dragit ned både beloppet och menyn till
          mitten av den panelen.

          `py-2` ÄR TÄTHETSVALET. Husets täthetsreferens är
          `hem/NyaAnmalningar.tsx` (`py-3` runt ett tvåradigt led ≈ 66 px);
          denna rad landar på ≈ 60 px — tätare än referensen, som bankformen
          kräver, utan att träffytorna krymper (se ⋯-knappen nedan). */}
      <div className="flex flex-nowrap items-start gap-3 py-2 text-small">
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          {/* TITELLEDET: betalsättet. `w-full` krävs för att `truncate` ska ha
              en bredd att förhålla sig till — kolumnen är `items-start`, så
              barnen är annars krymp-till-innehåll. */}
          <span className="w-full truncate font-medium text-body">{inbetalning.betalsatt}</span>

          {/* SEKUNDÄRLEDET: (Återbetalning ·) datum · kvittostatus, ETT svep.
              Ingen `truncate`: se docblocket § DE LÅNGA SEKUNDÄRRADERNA. */}
          <span className="w-full text-caption text-text-muted">
            {[...inbetalningsUnderdelar(inbetalning), lage.text].join(' · ')}
          </span>

          {makulerad && inbetalning.makuleradSkal && (
            <span className="w-full text-caption text-text-muted">
              {`Makulerad: ${inbetalning.makuleradSkal}`}
            </span>
          )}

          {/* NOTERINGEN — Lottas egen anteckning om DENNA inbetalning
              (Marcus 2026-09-01). Exakt samma visuella klass som
              makulerings-noten ovan och felskälet nedan: en sekundär rad i
              `text-caption text-text-muted`, `w-full` därför att kolumnen är
              `items-start`.

              INGEN GENOMSTRYKNING PÅ EN MAKULERAD RAD, och det är ett val:
              primärledet stryks över för att säga att BELOPPET inte längre
              räknas, men anteckningen är fortfarande sann och ofta det enda
              som förklarar varför raden makulerades. Samma skäl som
              makulerings-skälet självt står oöverstruket.

              PREFIXET "Notering:" STÅR KVAR ÄVEN NÄR TEXTEN ÄR UPPENBAR.
              Raden bär redan tre andra sekundärrader (metadata-svepet,
              makuleringen, felskälet), och en fri text utan etikett hade varit
              den enda av dem som inte säger vad den är. */}
          {inbetalning.notering && (
            <span className="w-full text-caption text-text-muted">
              {`Notering: ${inbetalning.notering}`}
            </span>
          )}

          {/* [TASK-352] Felskälet i klartext, SAMMA visuella klass som
              makulerings-noten ovan — mätt fynd ur S113-slutvandringen: raden
              teg helt om ett fallerat kvittojobb (entydighets-guarden, eller
              adressvakten i staging) och visade bara "Inget kvitto" eller
              "väntar på att skickas". */}
          {lage.felskal !== null && (
            <span className="w-full text-caption text-text-muted">
              {`Kvittot kunde inte skickas: ${lage.felskal}`}
            </span>
          )}

          {koaUtfall !== null && (
            <span role="status" className="w-full text-caption text-text-muted">
              {koaUtfall}
            </span>
          )}

          {skickatTill !== null && (
            <span role="status" className="w-full text-caption text-text-muted">
              {`Kvittot skickades till ${skickatTill}.`}
            </span>
          )}

          {/* AC #1: "kan raderas från raden (bekräftelse)". Inline, samma
              "öppnas på plats"-mönster som `RegistreraForm`/`AterbetalningsForm`
              — ingen modal för en engångsfråga.

              PANELERNA BOR I TEXTKOLUMNEN, inte utanför kortet: samma val som
              bilage-kortet gör för sina felrutor (`DokumentRadSkal` §
              "FELEN BOR I TEXTKOLUMNEN"). `w-full` behövs eftersom kolumnen
              är `items-start` — utan den krymper panelen till sitt innehåll. */}
          {atgard === 'radera-bekrafta' && (
            <fieldset
              onKeyDown={vidRaderaTangent}
              className="mt-1 flex w-full flex-wrap items-center gap-2 rounded border border-border bg-bg-muted px-2 py-2"
            >
              <legend className="sr-only">{`Radera inbetalningen: ${inbetalningsText(inbetalning)}?`}</legend>
              <span className="text-caption">
                Radera denna inbetalning? Det går inte att ångra.
              </span>
              <Button
                intent="danger"
                size="sm"
                isLoading={radera.isPending}
                onPress={() => radera.mutate(inbetalning.id, { onSuccess: () => setAtgard('vy') })}
              >
                Radera
              </Button>
              <Button ref={raderaAvbrytRef} intent="ghost" size="sm" onPress={avbrytAtgard}>
                Avbryt
              </Button>
            </fieldset>
          )}

          {/* AC #2: "får 'Makulera' med skäl (obligatoriskt)". */}
          {atgard === 'makulera-skal' && (
            <form
              onSubmit={vidMakuleraSubmit}
              onKeyDown={vidMakuleraTangent}
              aria-label={`Makulera inbetalningen: ${inbetalningsText(inbetalning)}`}
              className="mt-1 flex w-full flex-col gap-2 rounded border border-border bg-bg-muted px-2 py-2"
            >
              <Input
                ref={makuleraSkalRef}
                label="Skäl till makuleringen"
                value={skal}
                onChange={(v) => {
                  setSkal(v);
                  setSkalRort(true);
                }}
                isInvalid={skalFel !== null}
                errorMessage={skalFel ?? undefined}
                aria-describedby={skalId}
              />
              <p id={skalId} className="sr-only">
                Skälet läses av Roger i efterhand och syns på raden.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" intent="danger" size="sm" isLoading={makulera.isPending}>
                  Makulera
                </Button>
                <Button intent="ghost" size="sm" onPress={avbrytAtgard}>
                  Avbryt
                </Button>
              </div>
            </form>
          )}

          {lank.isError && (
            <span role="alert" className="text-(color:--mm-input-error-text) w-full text-caption">
              {lank.error.message}
            </span>
          )}
          {skickaIgen.isError && (
            <span role="alert" className="text-(color:--mm-input-error-text) w-full text-caption">
              {skickaIgen.error.message}
            </span>
          )}
          {koaOm.isError && (
            <span role="alert" className="text-(color:--mm-input-error-text) w-full text-caption">
              {koaOm.error.message}
            </span>
          )}
          {radera.isError && (
            <span role="alert" className="text-(color:--mm-input-error-text) w-full text-caption">
              {radera.error.message}
            </span>
          )}
          {makulera.isError && (
            <span role="alert" className="text-(color:--mm-input-error-text) w-full text-caption">
              {makulera.error.message}
            </span>
          )}
        </span>

        {/* BELOPPSKOLUMNEN — bankens sifferpelare. `text-body` matchar
            titelledet, så de två delar baslinje i en `items-start`-rad utan
            att någon offset behöver räknas fram.

            `Ban` SITTER HÄR, INTE I VÄNSTERKANTEN (pass 14): makuleringens
            plats är bredvid det tal den upphäver. `aria-hidden` oförändrat —
            makuleringen sägs i TEXT på egen rad nedan (WCAG 1.4.1), glyfen är
            ett skanningsstöd.

            GENOMSTRYKNINGEN SITTER PÅ SIFFRAN, inte på svepet: `line-through`
            på föräldern hade dragit strecket genom förbudsikonen också, vilket
            läser som grafiskt brus i stället för som ett upphävt belopp.

            INGEN `opacity` — se `<li>`-kommentaren ovan för mätningen. */}
        <span className="flex shrink-0 items-center gap-1 font-medium text-body">
          {makulerad && (
            <Ban aria-hidden="true" size={16} className="shrink-0 text-text-secondary" />
          )}
          <span className={`tabular-nums ${makulerad ? 'line-through' : ''}`}>
            {inbetalningsBeloppKolumn(inbetalning)}
          </span>
        </span>

        {/* ⋯-KOLUMNEN HAR ALLTID SIN BREDD (`w-11`), även när raden saknar
            handlingar. Utan den hade beloppets högerkant hoppat 44 px i sidled
            mellan en rad med meny och en utan — och en sifferpelare vars
            högerkant inte är en linje är ingen pelare. Det är hela skälet att
            en tom kolumn får kosta 44 px här.

            `-my-2.5` LYFTER KNAPPEN TILL TITELRADENS LINJE UTAN ATT KRYMPA
            TRÄFFYTAN. `size-11` är 44 px — husets träffytegolv och en
            icke förhandlingsbar iPad-egenskap. Marginalen drar in 10 px i
            över- och underkant, så knappens LAYOUT-fotavtryck blir 24 px
            (titelradens radhöjd, `text-body` × 1.5) medan dess TRÄFFYTA
            förblir 44 px och växer ut i radens `py-2`-luft. Två grannknappar
            kan inte överlappa: raderna ligger ≈ 60 px isär och knapparna är
            44 px höga, alltså ≈ 16 px mellanrum.

            VILLKOREN ÄR OFÖRÄNDRADE: samma `lage.kanVisa`/`kanSkickaIgen`/
            `kanKoaOm`/`visaRadera`/`visaMakulera` som förut. Särskilt: en
            MAKULERAD inbetalning erbjuder ALDRIG "Skicka igen" — `kvittolage`
            sätter `kanSkickaIgen: aktiv` och `kanKoaOm: false` för ett skickat
            kvitto, och den invarianten är mätt (se `panel-harledningar.ts`
            § EN MAKULERAD INBETALNING). */}
        <span className="flex w-11 shrink-0 justify-end">
          {harHandlingar && (
            <Meny
              etikett={`Fler val för ${inbetalningsText(inbetalning)}`}
              trigger={
                <Button
                  ref={menyTriggerRef}
                  intent="ghost"
                  size="sm"
                  className={`${IKONKNAPP_KLASS} -my-2.5`}
                  aria-label={`Fler val för ${inbetalningsText(inbetalning)}`}
                >
                  <Ellipsis aria-hidden="true" size={IKON_STORLEK} />
                </Button>
              }
            >
              {lage.kanVisa && (
                <MenyPost
                  ikon={
                    lank.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        size={IKON_STORLEK}
                        className="motion-safe:animate-spin"
                      />
                    ) : (
                      <ExternalLink aria-hidden="true" size={IKON_STORLEK} />
                    )
                  }
                  isDisabled={lank.isPending}
                  textValue="Visa"
                  onAction={visaKvitto}
                >
                  {lank.isPending ? 'Öppnar…' : 'Visa'}
                </MenyPost>
              )}
              {lage.kanSkickaIgen && lage.kvitto && (
                <MenyPost
                  ikon={
                    skickaIgen.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        size={IKON_STORLEK}
                        className="motion-safe:animate-spin"
                      />
                    ) : (
                      <Send aria-hidden="true" size={IKON_STORLEK} />
                    )
                  }
                  isDisabled={skickaIgen.isPending}
                  textValue="Skicka igen"
                  onAction={() => {
                    const kvittoId = lage.kvitto?.id;
                    if (kvittoId === undefined) return;
                    skickaIgen.mutate(
                      { kvittoId },
                      { onSuccess: (svar) => setSkickatTill(svar.mottagare) },
                    );
                  }}
                >
                  {skickaIgen.isPending ? 'Skickar…' : 'Skicka igen'}
                </MenyPost>
              )}
              {/* [TASK-352] Ett kvitto som ALDRIG gått i väg — utfärdat men inte
                skickat, eller inte ens skapat efter ett fallerat försök — köas
                om via SAMMA EF-väg (koaKvitton) som utfallsregionens egna
                "Skicka igen"-knapp i BetalningsInkorg.tsx, inte via
                `skickaKvittoIgen` (den kräver ett redan utskickat kvitto, se
                `lage.kanSkickaIgen` ovan). `lage.kanKoaOm` avgör; se dess
                docblock i panel-harledningar.ts för de två grenarna.

                DE TVÅ ÄR ÖMSESIDIGT UTESLUTANDE — `kvittolage` returnerar
                exakt EN gren, och i 'skickat'-grenen är `kanKoaOm` falsk medan
                `kanSkickaIgen` är falsk i alla andra. Menyn kan alltså aldrig
                visa två poster som båda heter "Skicka igen". */}
              {lage.kanKoaOm && (
                <MenyPost
                  ikon={
                    koaOm.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        size={IKON_STORLEK}
                        className="motion-safe:animate-spin"
                      />
                    ) : (
                      <Send aria-hidden="true" size={IKON_STORLEK} />
                    )
                  }
                  isDisabled={koaOm.isPending}
                  textValue="Skicka igen"
                  onAction={() => {
                    koaOm.mutate(
                      { inbetalningIds: [inbetalning.id] },
                      {
                        onSuccess: (svar) => {
                          const hoppadSkal = svar.hoppade[0]?.skal;
                          setKoaUtfall(
                            svar.koade > 0
                              ? 'Kvittot köades för nytt utskick.'
                              : (hoppadSkal ?? 'Kvittot kunde inte köas.'),
                          );
                        },
                      },
                    );
                  }}
                >
                  {koaOm.isPending ? 'Skickar…' : 'Skicka igen'}
                </MenyPost>
              )}
              {/* [TASK-346.9 AC #1/#2] Radera/Makulera — bara EN kan någonsin
                vara sann samtidigt (`kanRadera`/`kanMakulera` är varandras
                motsatser via kvittots existens), men villkoren skrivs var för
                sig i stället för `else if`: härledningarna bor i
                `panel-harledningar.ts`, inte i denna JSX.

                DESTRUKTIVT SIST, EFTER EN AVDELARE — `Meny`-primitivens egen
                konvention (`ton="fara"`, se dess docblock). Avdelaren
                exponeras som `separator`, så skärmläsaren hör gruppbytet.

                AVDELAREN KRÄVER NU ATT DET FINNS NÅGOT ATT AVDELA FRÅN
                (`harOvrePoster`, Marcus dom 2026-09-01). Villkoret var
                tidigare bara "finns en destruktiv post", vilket ritade en linje
                ovanför en ENSAM Radera-post — det vanligaste läget av alla, en
                färsk inbetalning utan kvitto. En avdelare som inte avdelar två
                grupper är inte en gruppmarkör, den är en artefakt; och för
                skärmläsaren blev det ett annonserat gruppbyte som inte hände. */}
              {atgard === 'vy' && harOvrePoster && (visaRadera || visaMakulera) && <MenyAvdelare />}
              {atgard === 'vy' && visaRadera && (
                <MenyPost
                  ton="fara"
                  ikon={<Trash2 aria-hidden="true" size={IKON_STORLEK} />}
                  textValue="Radera"
                  onAction={() => setAtgard('radera-bekrafta')}
                >
                  Radera
                </MenyPost>
              )}
              {atgard === 'vy' && visaMakulera && (
                <MenyPost
                  ton="fara"
                  ikon={<Ban aria-hidden="true" size={IKON_STORLEK} />}
                  textValue="Makulera"
                  onAction={() => setAtgard('makulera-skal')}
                >
                  Makulera
                </MenyPost>
              )}
            </Meny>
          )}
        </span>
      </div>
    </li>
  );
}
