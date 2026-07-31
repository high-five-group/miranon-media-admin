# Täckning som uppstår som sidoeffekt är odeklarerad täckning

**En grind som råkar nå en fil därför att något annat drog in den skyddar den
bara så länge det andra finns kvar. Ingen invariant är uttalad, så ingen
uppsägning är synlig.** `[UNIVERSAL]`

**Empiri (`TASK-103`, 2026-07-31):** `supabase/functions/` var bokfört som repots
enda kodbas utan typkontroll. Mätningen visade att **9 av 40 filer typkollades
ändå** — de drogs in i `tsconfig.tests.json`-programmet därför att tester
importerade dem. Ingenting sade att det skulle gälla. Slutade ett test importera
en modul föll den ur täckningen utan att något blev rött.

Formen är farligare än en ren lucka, av samma skäl som ett verktyg som inte körs:
**en inventering ser komplett ut.** `npm run typecheck` var grön, filerna var
kollade, och ingen rapport var röd. Men grönt som vilar på en sidoeffekt är inte
samma sak som grönt som vilar på ett beslut.

Skärpningen här: `TASK-53` hade kort innan **designat** en modul Deno-fri just för
att den skulle kunna typkollas från testsidan. Den designen vilade alltså på en
invariant som ingen skrivit ned och ingen grind vaktade. Ett medvetet designval
kan bygga på en oavsiktlig egenskap utan att någon märker skillnaden.

**Motmedlet är att deklarera gränsen, inte att bredda grinden.** Rätt åtgärd var
inte att slänga in hela mappen — 28 av filerna kör Deno och hade gett 67 falska
fel. Rätt åtgärd var att skriva ned exakt vilken delmängd som ÄR kollbar och låta
grinden fälla när någon lämnar den.

**Två mätfällor som hör till fyndet, båda universella:**

- **`exclude` stoppar inte transitiva importer.** Den filtrerar bara glob-träffar.
  En `include` på en mapp med `exclude` på de olämpliga filerna drar ändå in dem
  via en `import` från en fil som fick vara kvar — mätt: 7 fel från en fil som
  stod explicit i `exclude`.
- **Grep på ett symbolnamn träffar kommentarer.** `grep -l 'Deno\.'` klassade en
  Deno-FRI modul som Deno-rörande, därför att dess dokumentationskommentar
  innehöll ordet. Det auktoritativa svaret på "vad ligger i programmet" kommer
  från kompilatorn (`tsc --listFilesOnly`), aldrig från en approximation av den.
