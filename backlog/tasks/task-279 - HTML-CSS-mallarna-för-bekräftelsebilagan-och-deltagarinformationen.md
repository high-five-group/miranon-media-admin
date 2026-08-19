---
id: TASK-279
title: HTML/CSS-mallarna för bekräftelsebilagan och deltagarinformationen
status: To Do
assignee: []
created_date: '2026-08-19 09:53'
labels: []
dependencies: []
ordinal: 505000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Första skivan på PDF-vägen (`ADR-119`). **Kräver ingen extern tjänst och ingen
API-nyckel** — den kan därför byggas medan DocRaptor-kontot skapas.

## Varför denna skiva först

`ADR-119` beslut 2 valde HTML/CSS-driven rendering. Mallen är då den bärande
artefakten: den behövs oavsett vilken motor som renderar den, och den kan
verifieras mot förlagan i en vanlig webbläsare långt innan någon renderare
finns på plats. Att vänta på API-nyckeln vore att stå still i onödan.

## Underlaget finns redan

`docs/research/dokumentmallarnas-forlagor-2026-08-17.md` bär förlage-analysen
med **exakta färger uppmätta ur filerna** (t.ex. hyperlänk-blå `#0563C1`,
Words standardhyperlänkfärg). `docs/research/pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`
§ 2.1–2.2 mäter varje element mot förlagan. Läs BÅDA före du skriver en rad.

Förlagorna själva: `~/Downloads/exempelpdokument/`
(`bekräftelsebilaga-exempel.pdf`, `deltagarinformation-exempel.pdf`). De är
**PowerPoint-exporter** — 17-augusti-passets filer var Word-brev. Roger/Lotta
bygger mallar i minst två Office-verktyg; det påverkar vad "exakt som
förlagan" betyder.

## Den dynamiska ytan — mätt, inte antagen

`ADR-119` beslut 3 slår fast att bilagorna bär **enbart eventdata, ingen
persondata**. Mottagarens namn är dynamiskt i mailKROPPEN, aldrig i bilagan.

- **Bekräftelsebilagan:** kursnamn · datum/veckodagar · plats · pris ·
  anmälningsavgift · resterande belopp · sista betalningsdatum.
- **Deltagarinformationen:** TRE rader — kursnamn · datum/tid · plats.

All brödtext är statisk per kurstyp. Den dynamiska ytan är **infoboxen,
inget annat**.

## Vad som byggs

Två HTML-mallar med CSS, parametriserade på fälten ovan. Ingen
renderings-integration, ingen EF, inget Storage — bara mallarna plus ett sätt
att titta på dem med riktig data.

Fontfrågan är öppen (`Cavolini`-licensen är obelagd, se
`pdf-renderingsvagen`-passet § 4). Välj ett fritt alternativ som håller
formen och **bokför valet** — fonten kan bytas senare utan att mallen skrivs
om, vilket är hela poängen med CSS-vägen.

## Vad som INTE görs här

DocRaptor-integrationen, Edge Function-en, Storage-lagringen,
invalideringen och bilage-lanen. De är egna skivor och flera av dem kräver
Marcus API-nyckel eller prod-deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Två HTML/CSS-mallar finns: bekräftelsebilagan och deltagarinformationen, parametriserade på exakt den dynamiska yta ADR-119 beslut 3 anger
- [ ] #2 Ingen persondata förekommer i någon mall — mottagarnamn hör till mailkroppen, aldrig bilagan
- [ ] #3 Mallarna går att granska med riktig eventdata utan extern tjänst; hur man gör det är dokumenterat i kortet
- [ ] #4 Visuell jämförelse mot förlagorna gjord och redovisad — vad som matchar och vad som avviker, med skäl
- [ ] #5 Fontvalet bokfört med motivering; Cavolini-licensen förblir obelagd och antas aldrig
- [ ] #6 Ingen DocRaptor-integration, ingen EF, inget Storage — scope hålls
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
