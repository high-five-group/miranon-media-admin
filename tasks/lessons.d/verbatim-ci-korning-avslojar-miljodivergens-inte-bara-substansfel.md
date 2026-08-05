# Ett lokalt kommando som kör CI:s steg verbatim avslöjar miljö-divergens, inte bara substansfel

**[UNIVERSAL]**

**Fångad:** 2026-08-05, vid bygget av `scripts/verify-ci-parity.mjs` — ett
lokalt kommando som härleder och kör `ci.yml`/`ci-suite.yml`s grind-steg
verbatim ur workflow-YAML:en i stället för att duplicera dem i en handhållen
lista (så att en ny CI-grind aldrig kan glömmas i den lokala speglingen).

**Vad som hände:** vid det första fulla körningsförsöket föll tre steg som
INTE hade något med förändringens sakinnehåll att göra:

1. **`pip install --quiet yamllint`** — CI:s runner har en bar `pip` på
   PATH; en macOS/Homebrew-maskin har ofta bara `pip3`/`python3 -m pip`, även
   när `yamllint` redan är installerat via en annan väg. Verbatim-körning av
   HELA steget föll på bootstrap-raden, inte på YAML-innehållet.
2. **En befintlig deletion-vakt (marker-string-scanner för en annan grind)**
   fällde det NYA skriptets egen fil — den nämnde en secret-variabels NAMN i
   ett förklarande dokumentationsstycke ("varför vi utesluter X"), och vakten
   skiljer per konstruktion inte på kod som läser variabeln och prosa som
   bara nämner den.
3. **Biome-lint** fällde det nya skriptets egna, precis skrivna filer —
   formatering ohanterad, och en sträng som innehöll bokstavligt `${{ … }}`
   (GH Actions-syntax) lästes av `noTemplateCurlyInString` som ett misstänkt
   glömt mall-literal.

Ingen av de tre hade något att göra med förändringens SAKINNEHÅLL (CI-
parity-mekaniken själv). Alla tre var äkta — inte falska larm att undertrycka
— men av en annan KLASS än den grinden primärt existerar för att fånga.

**Lärdomen:** ett verktyg som kör CI:s steg verbatim (i stället för att bygga
en förenklad egen variant) ärver INTE bara CI:s substansgrindar — det ärver
också varenda outtalat antagande CI:s recept gör om sin körmiljö (en
namngivning som `pip` i stället för `pip3`, en förutsättning att verktyget
inte redan finns, en förutsättning att den körande koden är gammal och redan
klassad av angränsande vakter). Bygg därför IN från början med förväntan att
de FÖRSTA felen ett sånt verktyg visar inte är substansfel i det man ville
verifiera, utan miljö-skarvar mellan "var CI antar att den körs" och "var
detta faktiskt körs". Diagnostisera var och en INDIVIDUELLT (kör grinden
direkt, isolerat från resten av kommandot) innan den klassas som antingen
"verktygets bugg" eller "verkligt fel i det som grindas" — de tre exemplen
ovan krävde tre helt olika fixar (special-hantering av en kombinerad
install+kör-rad, en explicit undantags-post i en annan grinds config, och
vanlig lokal lint-fix) och ingen av dem var en bugg i själva parity-
mekaniken.

**Varför `[UNIVERSAL]`:** gäller varje verktyg i vilken kodbas som helst som
väljer "härled och kör CI:s recept verbatim" framför "bygg en egen förenklad
variant" — designen som generellt är RÄTT (den stänger drift-risken en
handhållen lista alltid har) betalar detta pris regelbundet, och priset ska
förväntas, inte tolkas som att designvalet var fel.
