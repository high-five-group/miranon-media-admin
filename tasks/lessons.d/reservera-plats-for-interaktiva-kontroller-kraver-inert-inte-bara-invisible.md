# [UNIVERSAL] Reservera plats för INTERAKTIVA kontroller kräver `inert`, inte bara `invisible` — och byter testkontraktet från `toHaveCount(0)` till `not.toBeVisible()`

Husets etablerade "reservera alltid plats"-teknik (`Pill`s `dold`-prop i
`PersonsList.tsx`, S103: rendera alltid, dölj med `invisible`) räcker för
rent visuella platshållare utan fokuserbara barn. Den räcker INTE ensam när
det dolda innehållet bär riktiga kontroller (en `<Select>`, en knapp): en
`invisible` (`visibility: hidden`) yta må vara osynlig, men utan ytterligare
spärr kan JS-`.focus()` fortfarande flytta fokus dit, och beroende på
komponentbibliotek kan tangentbordsnavigering av misstag hamna där.

**Motmedlet är nativa `inert`** (React 19-attribut, `boolean`,
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)):
det gör HELA underträdet icke-fokuserbart och tar bort det ur
tillgänglighetsträdet i EN sats — ett enda attribut på behållaren i stället
för `tabIndex={-1}` + `aria-hidden` upprepat på varje kontroll för sig, en
form som lätt glöms när en tredje kontroll läggs till raden senare.
`invisible` sköter den visuella döljningen; `inert` sköter fokus-/AT-spärren.
De två är ORTOGONALA — det ena ersätter inte det andra.

**Konsekvensen för test som redan finns:** en kontroll som tidigare
monterades/avmonterades villkorligt (`{villkor && <Knapp/>}`, prövad med
`toHaveCount(0)`) blir efter fixen ALLTID monterad. `toHaveCount(0)` går då
från sann till falsk — inte för att fixen är fel, utan för att kontrollen nu
FINNS i DOM (bara dold). Rätt prövning efter en sådan omläggning är
`not.toBeVisible()` (Playwright räknar `visibility: hidden` som osynligt),
inte ett antal-påstående. Ett test som fortsätter påstå `toHaveCount(0)`
efter denna klass av fix kommer att fälla — inte som en regression i koden,
utan som ett kontrakt som inte längre stämmer med den nya, medvetna
DOM-formen.

**Skarpbevisat i båda riktningar** (negativ kontroll, TASK-309.23): samma
nya testfil kördes både mot den ofixade komponenten (föll — verklig
höjdskillnad mätt, `familjValjare(page)` existerade inte alls) och mot den
fixade (grön). Att bara köra grönt bevisar inte att grinden fäller när den
ska; en tillfällig `git checkout -- <fil>` av enbart komponentfilen (testet
orört) är en billig, mekanisk väg att bevisa båda hälfterna innan man litar
på en ny regressionsvakt.

Instans: `TASK-309.23`, 2026-08-26 (`DokumentYta.tsx`s uppladdningsdialog).
