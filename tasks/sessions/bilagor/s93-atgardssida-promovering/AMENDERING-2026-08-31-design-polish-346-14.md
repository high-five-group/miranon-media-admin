# Amendering 2026-08-31 — Betalningsblockets kompakta radform + on-demand notering (TASK-346.14)

**Yta:** `atgarder-granskning` i
`tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json` (Marcus
2026-08-11: *"ser okej ut"*, stämpel-SHA `efc4091a`). Skarp källa:
`src/components/events/atgarder/AtgardsSida.tsx`. Denna sidofil kompletterar
samma dags TASK-346.7-amendering
(`AMENDERING-2026-08-31-lasande-kryss-och-betalningsblock.md`) utan att
motsäga den — B3-mandatet där ("nytt betalningsblock per person") gäller
oförändrat; det som ändras här är BARA formen av det redan byggda blocket,
per designfynd 4a–4c
(`tasks/sessions/bilagor/s113-natt-slutvandring/designfynd-2026-08-31.md`).

**Klass:** *ny form, förhandsmandat S113 Del 13.*

---

## FÖRST: samma grind-läge som sibling-posten

Ingen av manifestets tre ytor bär `referenser`-nyckeln (oförändrat), och
ariaSnapshot-referenserna under `tests/visual/__aria__/atgardssida-
promoverings-grind.spec.ts/` täcker fortsatt INTE betalningspanelen (samma
mätning som sibling-posten upprepar inte här). `bash scripts/check-facit.sh`
→ exit 0, oförändrat.

## Vad som ändrades

Allt nedan gäller enbart med miljöflaggan PÅ.

### 1. Personblocken: kompakt radform, inte vita kort i grå container (4c)

Varje person bar en EGEN `bg-surface rounded-2xl`-kortyta nästlad i
panelens `bg-bg-muted`-skal (`KORT_KLASS`) — åtta sådana vita väggar radade
under varandra läste tyngre än sidans egen etablerade kompakta radform
(ÅTGÄRD-listans numrerade rader). Personerna delar nu EN `divide-y
divide-border`-lista (samma hårlinje-grammatik som `DetaljGrupp`/
`AnmalningarSida`s Mer-lista), och `bg-surface` är riven — panelens EGEN
`bg-bg-muted` syns rakt igenom. Namnet krympte `text-lg` → `text-body`
(fortsatt `font-semibold`) för att inte konkurrera med den nya, lättare
containerformen.

### 2. Noteringsfältet: ghost-styling, inte 16 permanent tomma rutor (4a)

Marcus: *"noteringen ska vara on-demand (affordance), inte permanent"* —
åtta personer × två alltid synliga tomma inputs var en vägg.

**Fältet döljs INTE strukturellt.** `tests/e2e/atgarder-betalningar.
staging.test.ts` § "Betalningarnas noteringsfält" fyller fältet direkt via
`getByRole('textbox', …)` UTAN ett föregående avslöjande klick — en
interaktion som krävde ett extra steg för att nå ett idag direkt nåbart
fält hade varit en BETEENDEändring, precis det uppdraget förbjuder
(`CLAUDE.md`/uppdragstexten: "aria-labels/rubriknivåer kan behöva följa
med — det är form, inte beteende"; ett extra klick är INTE den klassen).

Lösningen är en CSS-GHOST i stället: samma `<input>`, samma roll, samma
`aria-label`, samma `.fill()`-kontrakt — men TOM utan innehåll saknar den
kant/bakgrund (`[&_input]:border-transparent [&_input]:bg-transparent`)
tills den antingen BÄR text eller får hover/fokus
(`hover:[&_input]:border-… focus-within:[&_input]:bg-…`). Placeholder byter
från "Notering…" till "+ Lägg till notering" i det tomma läget. Samma
`[&_input]:`-descendant-teknik som `GenereringsVy.tsx` redan använder för
att styra `Input`-primitivens inre `<input>` utan att röra primitiven
själv.

### 3. Knappbredden (4b, delad fix)

`AterbetalningsYta.tsx`s trigger-knapp stod som ENDA barnet i en `flex
flex-col`-behållare och sträcktes till FULL bredd av flex-columns default
`align-items: stretch` — samma `<Button>` som `RegistreraYta`s blev en helt
annan form beroende på VILKEN förälder den råkade stå i. Fixad i den delade
komponenten (`flex flex-wrap items-center` runt triggern), så både
personblocket här OCH anmälans detaljvy (`AnmalansBetalningar.tsx`, samma
komponent) får konsekvent knappbredd i samma commit.

## Vad som INTE ändrats

- **Kryssens läsande status, `SkickaKvittoKnapp`-rivningen, saknas-beloppet
  och Registrera-flödet** — orörda, exakt TASK-346.7:s redan bokförda form.
- **Noteringens SKRIVLOGIK** (`useUpdatePaymentNote`, blur-commit,
  utkast-mönstret) — orörd, bara den VISUELLA vikten när fältet är tomt.
- **Mottagar-ytan, åtgärdsmenyn, arbetsytan, granskningssidan** — orörda.

## Testerna

`tests/e2e/atgarder-betalningar.staging.test.ts` § "notering: skriver
update-registration-payment-note vid blur" kör OFÖRÄNDRAT (samma
`getByRole('textbox', …)`-lokator, ingen extra interaktion krävs) — grönt
verifierat lokalt. De TIO redan skippade testerna (skrivvertikalens
kryss-klick) är opåverkade av denna diff.

## Omstämplings-läge

**Inget är omstämplat.** `godkand` står kvar med Marcus 2026-08-11-kvittens
och SHA `efc4091a`. `bash scripts/check-facit.sh` → exit 0, före och efter.
