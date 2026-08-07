# FK-referensbilder — målbild för UI-spåret

22 skärmdumpar från Försäkringskassans mobilapp (Marcus egna; 8 st
2026-07-05 + 5 st login-flödesserien 2026-07-12 + 9 st
vab-ansöknings-wizardserien 2026-07-19, adderad inför event-sidorna) +
3 st Airtable Eventmanager-interfacet (egen sektion sist — INNEHÅLLS-
referens, inte FK-formspråk).
Målbilds-underlag för UI-spårets FK-linje: Hem-arrangemang, list-mönster,
grupprubriker, badges, wizard-steg och pill-tabbaren. Beslutet (ljus bas i
Miranon-identitet, FK:s STRUKTUR — inte dess mörka färgvärld) bor i
sessionsdok `tasks/sessions/archive/2026-07/2026-07-05-session-52.md` Del 3; kortet
`PRD: UI-uppgradering Hem-vyn` pekar hit.

| Fil | Motiv |
|---|---|
| IMG_1538 | Hem: hälsningskort + 2-i-rad infokort + helbreddskort + aktionsknappar |
| IMG_1539 | Ärenden: list-kort med titel/status/datum + chevron |
| IMG_1540 | Utbetalningar (tom): segmented pill-toggle + illustration-tomläge |
| IMG_1541 | Mer: menyrader som kort + utloggning |
| IMG_1542 | Mina uppgifter: sektionsrubriker + key-value-rader + Ändra-rad |
| IMG_1543 | Utbetalningar: månadsgrupprubriker + outlined statusbadge |
| IMG_1544 | Wizard: Välj barn (tile-val) |
| IMG_1545 | Wizard: Sysselsättning (chips + Fortsätt/Avbryt) |
| `fk-login.jpeg` | Login: helskärms-hero + FK-logga + "Logga in med" BankID + Om appen-länk |
| `fk-bankid-vaxlingen.jpeg` | App-växlingen FK → BankID (grön loading-skärm ∥ BankID-splash) |
| `fk-loading-hamtar.jpeg` | Inloggnings-loading steg 1: "Hämtar dina uppgifter…" (grön helskärm) |
| `fk-loading-halsningen.jpeg` | Inloggnings-loading steg 2: **"Hej Marcus!"** — hälsningen bor i login-flödet, inte som Hem-rubrik (underlag till T69 rubrik-grillningens Hem-identitets-fork) |
| `fk-om-appen.jpeg` | Om appen: undersida med centrerad titel + bakåt, versions-rad + Läs mer-rader med extern-länk-ikon |
| IMG_1590 | Wizard vab: kalender-dagväljare (månadsnav < juli >, veckonummer-kolumn, dag-tiles; framtida dagar överstrukna/ej valbara; idag ring-markerad) + CTA "Lägg till dag" |
| IMG_1591 | Wizard vab: kalendern i flervals-läge (4 dagar streckat markerade); CTA:n räknar valet "Lägg till 4 dagar" + sekundär "Avmarkera valda dagar" |
| IMG_1592 | Wizard vab-steg "Dag 1 av 4": fråga + key-value-rad (Arbetstid: 8 tim 6 min) + chips-par (Hela arbetsdagen/Del av dagen, ovalda) + CTA "Spara dag" |
| IMG_1593 | Samma steg med valt chip: check-ikon + inverterad fyllnad (vald-tillståndet i chips-mönstret) |
| IMG_1594 | Wizard vab: "Kopiera dag"-dialogen — apply-to-all-mönstret ("samma arbetstid och vabbtid för de 4 dagarna?" Nej, ändra / Ja, använd) |
| IMG_1595 | Wizard vab: "Dagar i ansökan" — summeringslista med kort per dag (rubrik + key-value-rader + redigeringspenna) + CTA Fortsätt |
| IMG_1596 | Wizard vab: kalendern med bekräftat val (4 dagar grönt fyllda) + CTA Fortsätt — tredje kalender-tillståndet (tomt → markerat → bekräftat) |
| IMG_1597 | Wizard vab: "Anledning" — helbredds-valknappar i stapel (tre alternativ), Avbryt längst ned |
| IMG_1598 | Wizard vab: "Välj barn" — tile-val med ikon + namn + personnummer (samma tile-mönster som IMG_1544) |

## Airtable Eventmanager-interfacet (3 bilder, 2026-07-19)

Skärmdumpar av dagens Eventmanager-interface i Airtable — INNEHÅLLS-
referens för eventsidans bygge (vad Lotta hanterar per event idag), inte
FK-formspråk. Adderade vid S73:s konvergens-pass på detaljvyn
(Marcus-order; formen hämtas ur FK-bilderna, materian härifrån).

| Fil | Motiv |
|---|---|
| `airtable-eventmanager-01-oversikt.png` | Översikten: eventlista vänster (namn/ort/datum) + detalj höger — Eventinfo (Ort, Typ-chip, Start-/Slutdatum) + Kapacitet (max platser, anmälningar, mottagna avgifter, slutbetalning saknas, Anmäld beläggning + Bekräftad som staplar med %) + Inmatning externa anmälningar (Manuella platser) |
| `airtable-eventmanager-02-anmalda-betalningar.png` | Anmälda (personkort namn + e-post) + "Ej skickat full betalning"-tabellen (person, dagar kvar till deadline, mailto-påminnelselänk, Anmälningsavgift/Slutbetalning som Ej mottagen-chips) |
| `airtable-eventmanager-03-checkin-narvaro.png` | Check-in (Session-väljare + Markera alla närvarande, per session/alla) + Närvaro specifik-tabellen (person, status Ej avstämt, avstämt-datum, session Dag 1/Dag 2) |
