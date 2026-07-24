# ADR-078: INSTANT-regeln — navigering väntar aldrig på data vi redan har

- Status: Accepted
- Datum: 2026-07-24
- Fas: Meta (Session 83 — pass 4, eventväljar-paret)

> Mintad på Marcus order vid S83:s sessionsavslut. Regeln föddes i
> prototyp-passet men gäller HELA appen, inte skivan den upptäcktes i —
> därför ADR och inte enbart byggkrav i två kort.

## Kontext

Under S83 pass 4 fångade Marcus att eventbytet i den nya väljaren tog
märkbar tid: *"det stör mig lite att raderna 'typ' eller kanske mest
'platser kvar' tar någon sekund innan den laddas in."* Formuleringen som
följde är regelns ursprung:

> **"helst vill jag att bytet ska vara INSTANT, ingen data som laddas,
> ALLT i denna app ska vara instant, det ska vara en regel också."**

Mätningen visade att väntan inte var oundviklig — den var självförvållad.
Edge Function-latensen mot Airtable är hög men känd:

| Anrop | Latens (mätt 2026-07-24) |
|---|---|
| `get-events` | ~1,2 s |
| `get-event` | ~1,1 s |
| `get-registrations` | ~1,4 s |
| `get-event-notes` | ~1,0 s |

Det avgörande fyndet var att `get-events`-svaret **redan bär** `typ`,
`ort`, `startdatum`, `slutdatum`, `maxPlatser`, `platserKvar`, `status`,
`eventKey` och `borOverAntal` — empiriskt verifierat mot svaret, inte
antaget. Detaljvyerna kastade den datan och väntade ut ett nytt anrop
för samma uppgifter. Vi väntade alltså på data vi höll i handen.

Marcus accepterar Airtable-golvet tills Supabase-migrationen stänger
det: *"om det inte går med Airtable som datakälla så accepterar jag det
så länge … men går det lösa med Airtable som källa så är det toppen."*

## Beslut

**1. Navigering får aldrig vänta på data som redan finns i cachen.**
En detaljvy vars förälder-lista bär delmängden seedas ur listcachen med
TanStacks `placeholderData` — aldrig `initialData`: listposten är
PARTIELL och får inte persisteras som om den vore hel. Detta är
TanStacks egen anvisning för list→detalj.

**2. Partiell placeholder kräver skydd för de fält som saknas.**
Ett fält som läses med `?? 0` och bara finns i detalj-svaret får INTE
renderas ur placeholdern — det ritar falska nollor. Sådana sektioner
hålls i skeleton tills riktig data landat. Beläggningsmätaren är
prejudikatet: `viaFormular`, `manuelltTillagda`, `medfoljande`,
`reserverade` och `vantelista` finns bara i `get-event`.

**3. Prefetch på avsikt.** Hover och fokus är den tidigaste ärliga
signalen om att en yta ska öppnas; anropen startar där, inte vid
klicket. React Query dedupar, så upprepad avsikt är gratis.

**4. Skeleton står i slutgeometri, annars är den inte tillåten.**
Ett skeleton som inte matchar sektionens sluthöjd byter en väntan mot
ett layouthopp — och layouthopp är förbjudet (Marcus: *"hopp i layouten
är absolut förbjudet i denna app"*). Där höjden genuint följer data
(listor av okänd längd) är skeleton i slutgeometri omöjlig; då är
prefetch enda vägen och restposten bokförs öppet.

**5. Golvet deklareras, det döljs inte.** Där datakällan gör instant
omöjligt bokförs gränsen mätt och öppet i stället för att maskeras med
spinners. Airtables EF-latens är den nuvarande gränsen.

## Konsekvenser

**Bevisat i skarp kod** (PR #163, eventsidan): direktklick 1315 ms →
hover 400 ms 971 ms → hover 1500 ms **278 ms**. CLS **0,000** vid
navigering. Beläggningen ritar aldrig falska nollor; skeletonet är
DOM-mätt till 336 px mot sektionens 337.

**Öppen restpost:** Anmälda deltagare växer 187 → 627 px när dess egen
query landar (CLS 0,045 om man scrollar dit under laddning). Höjden
följer antalet anmälda, så beslut 4:s slutgeometri är omöjlig där. Full
eliminering kräver varm registrations-cache för ALLA event = 11 × 2
Airtable-anrop vid listöppning, mot rate limit 5 req/s — ett
belastningsbeslut mot datakällan, bokfört i **T90** och ej taget av
Code.

**Gäller framåt:** varje ny detaljvy vars data delvis finns i en
listcache ärver beslut 1–2. Supabase-migrationen ändrar golvet (beslut
5), inte reglerna.

## Alternativ som förkastades

- **Enbart snyggare laddläge.** Adresserar symptomet. Marcus dom om
  skeletonen — *"den är inte branschledarmässig designmässigt, det ser
  helt enkelt inte snyggt ut"* — står kvar som egen designfråga i T90,
  men estetik löser inte en sekunds onödig väntan.
- **`initialData` i stället för `placeholderData`.** Skulle persistera
  ofullständig data som färsk och riskera att detaljanropet aldrig kör.
- **Prefetcha allt vid listladdning.** Ger garanterat instant men
  kostar 11 × 2 anrop mot en källa med 5 req/s. Kvar som öppet
  Marcus-beslut i T90, inte som regel.

## Källor

- [Placeholder Query Data — TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data)
- Mätningarna: sessionsdok S83 Del 6–7 + PR #163.
- Tråd [T90](../../tasks/threads/README.md) — laddupplevelsen och det
  öppna belastningsbeslutet.
