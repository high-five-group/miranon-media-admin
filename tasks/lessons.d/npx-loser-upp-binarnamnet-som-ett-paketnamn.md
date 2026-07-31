# npx löser upp binärnamnet som ett PAKETnamn — och de är inte alltid samma

**`npx <namn>` frågar registret efter ett PAKET som heter `<namn>`, inte efter
ett verktyg vars binär heter så. Skiljer sig paketnamn och binärnamn åt är
kommandot en namnkollision med tyst exekvering av främmande kod — och npx
installerar utan att fråga när stdin inte är en TTY, vilket den aldrig är i CI.**
`[UNIVERSAL]`

**Empiri (T107 + TASK-102, 2026-07-30/31).** Repots kort-arbetsflöde vilar på
`backlog.md`, vars binär heter `backlog`. Grindens default var
`BACKLOG_CMD="${BACKLOG_CMD:-npx backlog}"` och fungerade lokalt — men bara för
att en global installation råkade fångas upp. Mätt i isolerad miljö (tom cache,
tomt prefix, ingen global installation):

```text
npm error npx canceled due to missing packages and no YES option: ["backlog@1.4.56"]
```

`backlog@1.4.56` är **ett annat paket av en annan författare**, deklarerar
`bin: {"backlog": …}` och saknar provenance. Tråden hade bokfört risken som *"ett
opinnat paket per anrop"*. Den formuleringen var för mild med en hel klass:
skillnaden mellan *fel version av rätt kod* och *rätt namn på fel kod*.

**Varför det inte upptäcks av att det fungerar.** Felläget uppstår bara i en
miljö utan den globala installationen — alltså aldrig på maskinen där det skrivs,
och alltid på en färsk CI-runner. Ett kommando som är korrekt i utvecklarens
`PATH` och farligt i CI:s ger noll signal förrän det kör skarpt.

**Åtgärden är strukturell, inte disciplinär.** En lokal bin
(`node_modules/.bin/<binär>`) från en pinnad `devDependency` KAN inte förväxlas
med ett registerpaket — uppslaget sker i filsystemet, inte mot npm. Det slår en
nedskriven regel om att komma ihåg `npx --package=<paket>@<version> --yes <bin>`,
som dessutom står på fel sida av OpenSSF:s CI-regel (*"only run npm commands that
treat the lockfile as read-only"* — `npx` och `npm install -g` gör inte det).

**Regeln:** anropa aldrig ett Node-CLI med bara binärnamnet via `npx`.
Kontrollera först om paketnamn ≠ binärnamn; gör de det är bara den deklarerade
lokala binären säker. Och en grind får aldrig skriva ut den osäkra formen som
åtgärds-tips — då lär den ut precis det fel den finns för att stänga.
