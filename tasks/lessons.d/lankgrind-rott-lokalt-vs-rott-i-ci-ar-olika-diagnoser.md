# Länkgrind röd LOKALT och röd i CI är olika diagnoser — bara den ena motiverar ett undantag

**Innan en URL läggs i `.lycheeignore`: kontrollera VAR den faller. Faller den i
CI men svarar lokalt är värden som avvisar CI-nätet, och undantaget är rätt.
Faller den lokalt men är grön i CI är det din egen körning, och undantaget är
FEL — det döljer framtida länkröta för att tysta ett artefakt.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27) — båda riktningarna inom samma timme:**

| Värd | CI | Lokalt (curl) | Diagnos | Åtgärd |
|---|---|---|---|---|
| `danger.systems` | ❌ `Connection reset by peer` i **två** oberoende körningar 13 min isär | ✅ 200 på 0,5 s | värden avvisar GitHub-runners | undantag **rätt** |
| `martinfowler.com` | ✅ `Docs link check: success` | ❌ **10** URL:er `Request timed out` | lycheens parallellism mot en strypande värd | undantag **fel** |

Curl mot `martinfowler.com` gav 200 på 0,99 s **samtidigt** som lychee timade ut
på tio URL:er från samma värd. Skillnaden är inte nåbarhet utan samtidighet:
lychee fyrar många parallella anrop mot samma host, och värden stryper. Ett
enskilt anrop går igenom.

**Varför den felaktiga åtgärden är frestande:** båda ser identiska ut i
terminalen — en röd grind med en lista URL:er. Reflexen är att tysta den, och
`.lycheeignore` ligger nära till hands. Men ett undantag är permanent och
rensas aldrig av sig självt (filen bär redan en not om det), medan ett lokalt
artefakt försvinner av sig självt.

**Kostnaden för fel åtgärd är osynlig:** `martinfowler.com` är en tungt citerad
källa i repots research-dokument. Ett undantag där hade betytt att den dagen
länkarna faktiskt ruttnar säger ingenting ifrån.

**Regeln:** CI är auktoritet för länkgrinden, inte den lokala körningen. Ett
lokalt rött som CI inte reproducerar bokförs som lokalt och åtgärdas inte i
repot. Vill man ändå slippa bruset är rätt spår grindens FORM — externa länkar
i en nattlig icke-blockerande kontroll — inte fler undantag. Se
[[verifiera-med-cis-exakta-kommando-inte-svagare-lokal-variant]] för den
näraliggande men motsatta fällan: att lita på en SVAGARE lokal körning än CI:s.
