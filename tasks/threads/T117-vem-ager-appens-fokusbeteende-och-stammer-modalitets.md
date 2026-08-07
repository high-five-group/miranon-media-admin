---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T117 — Vem äger appens fokusbeteende — och stämmer modalitets-regeln?

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Vem äger appens fokusbeteende — och stämmer modalitets-regeln?** Registrerad 2026-08-03 (S96, prototyp-passet) ur Marcus fråga om formulärfälten får fokusring. **MÄTT på både prototyp-routen och `/dev/primitives` (ordinarie app-yta):** det som släcker ringen vid musklick är INTE `base.css`:s egen `*:focus:not(:focus-visible)` utan **React Arias** `[data-rac]:focus-visible:not([data-focus-visible]) { outline: none }` (specificitet 0,3,0). De sätter `data-focus-visible` endast vid tangentbordsfokus. Appens fokus-modalitet ägs alltså av ett bibliotek, inte av vår egen regel — vilket ingen dokumentation i repot säger. **Följdfynd om kaskaden:** `base.css` är OLAGRAD och slår därför alla Tailwind-lager oavsett specificitet; en `[&_input:focus]`-variant mättes och slog inte igenom. Filens egen kommentar om sökrute-undantaget sade redan detta (_"står EFTER släckaren i samma olagrade fil så den vinner ordningsvägen"_) — jag lade tid på att uppfinna det den visste. **Öppen fråga, ej beslutad:** ett andra undantag från modalitets-regeln är BYGGT och PRÖVAS för autentiseringsformulär (`.mm-auth-formular input[data-rac]:focus`, 0,3,1) på Marcus önskemål — enheten är formuläret, inte fältet, eftersom `autocomplete="email"` även används i `AddRegistrationModal`/`ManuellAnmalanForm` (mätt). Ett research-pass löper på om undantaget alls är rätt; faller det ska regeln rivas, inte ärvas in i skarp kod (`TASK-127.3`/`127.6`). **Bokförd mätfälla:** jag rapporterade fokusringens FÄRG som fel (`rgb(36,36,36)` mot tokenets `#1b4965`) — Marcus verifierade i riktig webbläsare att den är korrekt blå. Headless Chromium och Chrome rapporterar `outlineColor` olika; lita på riktig browser vid färgfrågor. A11y-golvet är ribba 11 utan undantag; WCAG 2.4.7 och 1.4.11 i spel. **RESEARCH-PASSET SVARADE JA — och bredare än frågan ställdes** (`docs/research/focus-ring-auth-musklick-2026-08-03.md`, commit `778ce02d`): ring vid musklick på skrivytor är webbläsarnas egen spec-dokumenterade default-heuristik, inte en stilistisk uppfinning — CSS Selectors L4 § 9.4:s heuristik-lista säger explicit att element som stödjer tangentbordsinmatning ska visa fokus oavsett modalitet, och WICG:s explainer bekräftar att mekanismen kodifierade REDAN existerande browserkonvention. Branschkonsekvent hos **9/9 live-mätta produkter**; tre designsystem (`govuk-frontend@5.14.0`, `@uswds/uswds@3.13.0`, `@carbon/styles@1.112.0`) kodifierar plain `:focus` på textfält, verifierat i kompilerad CSS. **Rekommendationen gäller VARJE textfält på appens `<Input>`-primitiv, inte bara auth** — vårt `.mm-auth-formular`-undantag är alltså rätt riktning men för smalt. **Passets egen oväntade fångst:** appens `/login` (fortfarande plain HTML-`input`) visar RING vid musklick redan idag. Skillnaden ligger i `Input.tsx` (React Aria `TextField`), där `base.css`:s `[data-rac]`-regel — byggd S73 K85 för popover-dropdowns — tystar ringen på ALLA React-Aria-ägda skrivytor, inte bara dropdowns. Regeln träffar alltså bredare än sitt syfte. **Ej beslutat:** om den breda ändringen ska göras, och om `[data-rac]`-regeln ska smalnas till sitt ursprungliga dropdown-syfte. Det är produktionskod utanför prototyp-passets scope — Marcus avgör. Vad passet INTE kunde belägga: Firefox/Safari (endast Chromium i miljön), React Arias exakta `isTextInput`-semantik vid rent musklick, Atlassians källkod. Besläktad: `T116` (samma pass) · `T110` (mätfelet är klass A)

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad)_
