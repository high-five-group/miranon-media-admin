# ADR-012: `conversion-plan.md` ersatt av `byggplan.md` — ramen "konvertering" var efterlöpare

- **Status:** Accepted
- **Datum:** 2026-05-05
- **Fas:** Meta (P3a)

## Kontext

`docs/conversion-plan.md` skrevs 2026-04-14 som det styrande fas-för-fas-direktivet för React-bygget. Ramen var "konvertera Vue → React" — och i den ramen var `~/Repon/miranon-media-os/` (Vue-versionen) primär referens, conversion-plan beskrev hur Vue-mönster översätts till React-mönster.

Mellan 2026-04-14 och 2026-05-04 hände tre saker som invaliderade ramen:

1. **Fas A (säkerhetshardening) etablerade nya arkitekturmönster** som inte fanns i Vue-versionen alls: operations-baserat API, AuthContext|Response, INVARIANT-mönster, klient-DSN för Sentry, structured JSON-loggning, requestId-propagering. Conversion-plan kunde inte beskriva "hur Vue-mönstret blir React-mönster" eftersom mönstret är *nytt*.

2. **Fas E target-research låste arkitekturen post-Vue.** `analys/06b-supabase-target.md` + `analys/07-migration-plan.md` + `analys/08-odoo-validation.md` definierade target som *inte* var Vue-baserat. Strangler-fig-migrationen (Persons → Events → Registrations) är target-driven, inte Vue-driven.

3. **Datamodell-research-projektet (gate 6 + Odoo-validering) frusen 2026-04-28** etablerade `data-model.md` som källa för status-typer. Vue-versionens `Status.ts` var källa för conversion-plan; nu är `data-model.md` källa.

P0-inventory (2026-05-04) klassade conversion-plan §D-påståenden mot dessa nya källor: 27 av ~281 bullets är "behöver justering / behöver omformuleras / försvinner". Ramen "konvertera Vue → React" är inte längre primär — den är efterlöpare till "bygg React-app från låst target-arkitektur, port mönster från Vue där relevant".

Direktivet `tasks/byggplan-direktiv.md` §12 formulerade insikten: "ramen 'konvertering' var efterlöpare". P3:s uppgift är att ersätta conversion-plan, inte uppdatera den till v2.

## Beslut

`docs/conversion-plan.md` arkiveras till `docs/archive/conversion-plan-2026-04-14.md` (datumet är skapelsedatum, inte arkiveringsdatum — arkivnamnet bevarar provenance). `docs/byggplan.md` (skapad 2026-05-05 i P3a K2) blir det nya styrande fas-för-fas-direktivet. Skiftet är **ersättning, inte uppdatering**.

Skälet för ersättning över uppdatering:

- v1→v2 hade krävt patch-på-patch på 27+ bullets, med risk för otidsenlig prosa kvar i sektioner som *inte* uppdateras (lager 4-drift per UNIVERSAL-lärdom från REG 2026-04-19).
- Ramen själv är fel — uppdatering hade kvarhållit Vue-jämförelser som inte längre är primär referens.
- byggplan utgår från **låst target-arkitektur post-Fas A + Fas E**, inte från Vue-versionens komponentstruktur. Det är annan utgångspunkt.
- conversion-plan har historiskt värde (fas-prompter användes för Fas 0+1) — arkivering bevarar det utan att förvirra om vilken plan som är aktiv.

## Alternativ som övervägdes

**Alt 1 — Uppdatera `conversion-plan.md` till v2 in-place.** Avvisat: 27 bullets behöver omformuleras + nya bullets (Fas 3.5, 5.5, 6a-e, Fas 8) tillkommer. Resultatet hade varit en hybrid-fil som bär två olika ramar samtidigt. Drift-risk hög.

**Alt 2 — Behåll conversion-plan och addera byggplan ovanpå.** Avvisat: två styrande dokument = två sanningskällor. Per UNIVERSAL "En repo-struktur ska ha en enda sanningskälla" (REG 2026-04-19). Drift inom 2-4 sessioner.

**Alt 3 — Radera conversion-plan helt utan arkivering.** Avvisat: BUILD-LOG.md Fas 0 + Fas 1-sektioner refererar conversion-plan-bullets som källor. Radera utan arkivering bryter spårbarhet retroaktivt.

## Konsekvenser

**Positiva:**

- En aktiv plan (`byggplan.md`) — ingen drift mellan parallella styrande dokument.
- Ramen explicit sagd: target-arkitektur-driven, inte Vue-konvertering-driven. Framtida läsare förstår *varför* byggplan ser ut som den gör.
- BUILD-LOG-spårbarhet bevaras via arkiverad fil.
- Fas 2+ kan startas mot byggplan utan tvetydighet om vilken plan som gäller.

**Negativa:**

- BUILD-LOG-referenser till conversion-plan-bullets måste justeras till `docs/archive/`-sökväg vid nästa uppdatering. Mitigation: P3b-DoD inkluderar verifikation av detta.
- Vue-port-jobb som fortfarande pågår (komponentbiblioteket Mm Component Library) refererar inte byggplan direkt utan via `docs/research/vue-project-analysis.md`. Det är OK — Mm-biblioteket är produkt-output, inte byggplan-leverans.
- Risk för förvirring under övergångsperioden (P3a K2 commit → P3b arkivering). Mitigation: byggplan.md-headern säger explicit "ersätter `docs/conversion-plan.md`".

**Verifiering:** Efter P3b-arkivering, kör `git log --follow docs/archive/conversion-plan-2026-04-14.md` — visar full historik från ursprunglig commit 2026-04-14 + arkivering. `docs/conversion-plan.md` återfinns INTE — `find docs/ -name 'conversion-plan.md'` ger 0 resultat.
