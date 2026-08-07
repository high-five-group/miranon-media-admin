---
owner: marcus803
updated: 2026-07-12
review_by: 2026-10-12
status: stable
lifecycle: paused
---

# T77 — Notis-centret: ringklockan på Hem + system-notiser till Lotta

> Tråd-kort (ADR-053). Fött ur S64:s rubrik-/Hem-identitets-samsyn
> (Revision S64 i T69-kortet, Marcus-kvittens "Yes. Kvitterar!"):
> triage-klass "blockerar ej + värdefullt → defer till tråd-registret".
> Referensbild: `docs/reference/fk-referens/IMG_1538.PNG` (FK:s
> ringklocka i hälsningskortet på Hem).

- **Tråd-ID:** `T77-notis-centret`
- **Tillstånd:** se frontmatter `lifecycle`
- **Sessioner:** född S64 (2026-07-12); upptag när notis-substratet
  ska designas (Marcus initierar)
- **Styrande:** T69 Revision S64 punkt 3–4 (platsen på Hem
  reserverad); B2-principen "raden får inte ljuga" (ärvd styrande
  guard); ORDLISTA vid kristallisering av notis-termer
- **Commit-historik:** `git log --grep "\[T77\]"`

## Vad som väntar

**Designriktning (Marcus, S64):** en ringklocka på hälsningskortets
plats på Hem — FK-mönstret (IMG_1538) — som ingång till system-notiser
för Lotta. Exempel-klass (Marcus formulering): "X och Y har inte
betalat och det är två veckor kvar till eventet — skicka påminnelse";
fler hjälp-notiser adderas över tid. Datan för de första notis-typerna
finns redan i systemet (obetalda anmälningar + eventdatum; mail-infran
för påminnelse-aktionen).

**Hård guard (ärvd från T69-B2):** klockan byggs ALDRIG som död ikon —
den införs först när notis-substratet bakom den finns. Tills dess är
platsen bredvid hälsningen konceptuellt reserverad, inget mer.

## Beslutsbehov vid upptag (grillnings-kandidater)

1. Notis-datamodellen: var bor notiser (härledda vid läsning vs
   materialiserade), läst/oläst-tillstånd, livscykel.
2. Genererings-logiken: vilka regler producerar notiser
   (obetalt + tidströskel först?), var kör de.
3. Ytan: klockan + notis-lista (FK-mönstret) — badge-antal på klockan
   relaterar till T68-badge-frågans mönster.
4. Preferenser: notis-inställningar hör till T47 (Inställningar-ytan,
   "notis-preferenser" står redan i dess väntlista).

## Relaterade trådar

- `T69` (födelseplatsen; Hem-platsen reserverad via Revision S64)
- `T68` (badge-mönstret — antal på klockan är samma designfråga)
- `T47` (notis-preferenser när Inställningar-ytan byggs)

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
Notis-centret — ringklockan på Hem (FK-mönstret IMG_1538) som ingång till system-notiser för Lotta (exempel-klass: "X och Y har inte betalat, två veckor kvar till eventet — skicka påminnelse"; datan finns redan: obetalda + eventdatum + mail-infran). Hård guard ärvd från T69-B2: klockan byggs ALDRIG som död ikon — införs först med notis-substratet; tills dess är platsen bredvid hälsningen konceptuellt reserverad (T69 Revision S64 punkt 3–4). Beslutsbehov vid upptag: notis-datamodell · genererings-logik · yta (badge-antal ~ T68) · preferenser → T47

**Ingång (fullständig, ursprunglig):**
[T77-notis-centret.md](T77-notis-centret.md) · född S64 (2026-07-12, rubrik-/Hem-identitets-samsynen; ADR-053-triage: blockerar ej + värdefullt → defer) · besläktad `T69` `T68` `T47`
