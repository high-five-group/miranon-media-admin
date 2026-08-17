# Amendering 2026-08-17 — Räckviddsval, gemensamt läge, badges (TASK-275.3)

> Denna sidofil finns för att `facit.json` är AGENT-FRUSEN: ADR-104-hooken
> nekar varje agent-Edit mot ett manifest vars `godkand` är satt (samma
> mekanism som `AMENDERING-2026-08-15-verbcopy.md` i
> `tasks/sessions/archive/bilagor/s55-hem-konvergens/` och
> `AMENDERING-2026-08-17-visa-till-ikonpar.md` i denna katalog dokumenterar).
> Inbakningen i manifestets not-fält är ett MARCUS-moment via `!`-kanalen
> (ADR-104 beslut 2) — tills den gjorts är DENNA fil amenderingens durabla
> bärare, refererad från TASK-275.3. `godkand`-fältet i `facit.json` är INTE
> rört av denna commit.

**Yta:** Dokument-ytan `/mer/dokument` — listan + uppladdningsflödet
(`facit.json`s enda `ytor`-post, godkänd 2026-08-16, källor
`src/components/dokument/DokumentYta.tsx` m.fl.). Denna amendering läggs
OVANPÅ `AMENDERING-2026-08-17-visa-till-ikonpar.md` (TASK-273.4, samma dag,
samma yta) — Ikonparet den amenderingen beskriver är OFÖRÄNDRAT av detta
kort.

**Avvikelse (PRD task-275 § Implementationsbeslut, ADR-118, grillad samsyn
S107 2026-08-17; Marcus kvalitetsdirektiv, verbatim: "snälla gör det bra vid
första försöket. Håll design och formspråket som redan är etablerat."):**

Dokument-ytan byggs ut med räckviddsmodellen (ADR-118) ovanpå det godkända
facitet, i tre delar:

1. **Uppladdningsflödet bär ett räckviddsval** (`UppladdningsFlode`,
   `DokumentYta.tsx`) — en `RadioGroup` (husets primitiv, `RadioGroup.tsx`)
   med tre alternativ: **Detta event** / **En kurstyp** / **Alla event**.
   Väljs "En kurstyp" visas en `Select` (husets primitiv, `Select.tsx`) för
   **Kursfamilj** (obligatorisk) och — bara för en nivåbärande familj (RIM)
   — ytterligare en `Select` för **Kursnivå** (valfri, tom = hela
   familjen). "Detta event" är `isDisabled` när inget event är valt.
   Formen återanvänder husets etablerade radioval-/select-primitiv rakt av
   — ingen ny kontroll uppfanns.

2. **Ett nytt läge UTAN valt event** (`GemensamtLage`, ORDLISTA.md §
   Räckvidd/Gemensam bilaga: "räckviddsläget"). Den tidigare texten "Välj
   ett event för att se dess bilagor." (facitets ursprungliga tomma-läge)
   är ERSATT: att lämna `EventValjare` tom är nu ett GILTIGT, aktivt läge
   som listar ALLA gemensamma bilagor (räckvidd Kurstyp/Alla event, oavsett
   event) och låter Lotta ladda upp/ersätta/radera dem där — den ENDA
   platsen en gemensam bilaga kan ersättas/raderas (ADR-118 beslut 3,
   server-sidan nekar 403 annars). En ny liten utträdesknapp ("Visa
   gemensamma dokument", husets `Button intent="ghost" size="sm"`) låter
   Lotta gå TILLBAKA till räckviddsläget från ett valt event — EventValjaren
   själv har inget "rensa val"-alternativ i sin popover.

3. **Räckviddsbadge** (`RackviddBadge.tsx`, ny delad komponent) — märker
   varje GEMENSAM bilaga (Kurstyp/Alla event) i eventlägets lista och i
   Åtgärds-sidans bilageväljare (`AtgardsSida.tsx` § `BilageValjare`).
   Renderar INGET för räckvidd Event. Formen är EXAKT den neutrala
   metadata-pillen som redan finns tre gånger i appen (`Gruppdynamik.tsx`,
   `AtgardsSida.tsx` § Klass-pillen, `Deltagare.tsx`) — `rounded-full
   border border-transparent bg-bg-muted px-2 py-0.5 font-medium
   text-caption text-text-secondary contrast-more:border-border-strong` —
   ingen ny formuppfinning.

**Konsekvens för Ersätt-knappen (eventläget):** en GEMENSAM bilagas rad
(`BilageRadRow`) visar INTE längre "Ersätt"-knappen i eventkontext — badgen
bär förklaringen (ADR-118 beslut 3, AC #4). Rader med räckvidd Event (eller
legacy/okänd räckvidd) är OFÖRÄNDRADE: exakt samma Ersätt-knapp som facitet
redan bar.

**Serverkontraktets utbyggnad (bakgrund, inte UI, men PÅVERKAR vad UI:t kan
göra):** `upload-attachment`/`get-attachment-download-url`/
`get-event-attachments` fick var sin räckviddsmedvetna utbyggnad
(event-lös uppladdning för Kurstyp/Alla event; räckviddsmedveten
ägarskaps-guard som tillåter en gemensam bilaga öppnas från VILKET event
eller räckviddsläge som helst; `eventId`-utelämnad-läge som listar ALLA
gemensamma bilagor) — se `supabase/functions/*/index.ts` § filhuvuden och
`_shared/attachments.ts` § `buildStorageAnchor` för den fulla mekaniken.
Detta är INTE en UI-avvikelse mot facitet, men är förutsättningen för att
punkt 1–3 ovan kan fungera ärligt (ingen UI-knapp erbjuds som servern ändå
skulle neka).

**Vad som INTE är amenderat:** de fem facit-bilderna i katalogen visar
varken räckviddsvalet, det nya läget eller badgen (de föregår TASK-275.3
helt, och redan `AMENDERING-2026-08-17-visa-till-ikonpar.md` konstaterar att
Visa-bilderna är missvisande sedan ikonparet). Listformen i övrigt (filter,
radernas namn/meta/klass, uppladdningsknappens grundform, sidkromet) är
OFÖRÄNDRAD. Nya bilder tas INTE av denna skiva.

**Väntar på Marcus omstämpling** (ADR-104 beslut 1–2, `!`-kanalen) —
`godkand`-fältet i `facit.json` rörs INTE av denna agent.
