---
id: TASK-342
title: >-
  Fynd: DocRaptors prince_options[http_timeout] defaultar till 10 s, inte 60 —
  typsnitt/bilder från publik URL kan tysta fallera under last
status: Done
assignee: []
created_date: '2026-08-29 14:33'
updated_date: '2026-08-29 17:28'
labels:
  - ready-for-agent
dependencies: []
ordinal: 628000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur research-passet docs/research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md § Oväntade fynd (S113): DocRaptors http_timeout för resurser Prince hämtar (typsnitt, bilder via URL) defaultar till 10 s — inte 60 som antagits. Mallarna är i dag självbärande (inlinade typsnitt/bilder, ADR-125 § 4 + docraptor-sjalvbarande-porteringen), så exponeringen bör vara noll — men det är inte mätt. Uppdrag: (1) verifiera mot mall-render.ts att INGEN extern resurs-URL återstår i den HTML som skickas (grep i den självbärande utdatan för http(s)://); (2) om någon återstår: sätt http_timeout explicit och bokför, eller inlina resursen; (3) bokför utfallet i mall-render.ts filhuvud och i docs/mallar/bilagor/README.md § Fontstrategin. Ingen ändring om (1) ger noll träffar — då är kortet en bokförd frånvaro.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mätt: antal externa resurs-URL:er i den självbärande HTML:en per mall (bekräftelse, deltagarinfo, kvitto) — bokfört; vid > 0: åtgärdat eller http_timeout satt med skäl
- [x] #2 Filhuvudet i mall-render.ts och README § Fontstrategin nämner 10 s-defaulten och mätresultatet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Källa: https://docraptor.com/documentation/api, verifierad WebFetch + browser-kontroll (Playwright, document.body.innerText) 2026-08-29, verbatim: 'By default, DocRaptor will attempt to fetch any external resource for up to 10 seconds.'

MÄTNING (grep av de tre mallarnas faktiska HTML/CSS-källsträngar direkt ur supabase/functions/_shared/mallar/*.html.ts + *.css.ts): NOLL url(http...) i CSS (bilaga-delad.css.ts, kvitto.css.ts) och NOLL <img src=http...> i någon av de tre mallarna (bekraftelsebilaga, deltagarinformation, kvitto). Samtliga url()/img-src-referenser är relativa och bäddas in som data:-URI:er av gorSjalvbarande i mall-render.ts (FONT_BASE64_PER_FILNAMN/BILD_DATA_URI_PER_FILNAMN) — ingen nätverkshämtning sker vid rendering.

EN plaintext-förekomst av https://miranon.se/ finns i bekraftelsebilaga.html.ts: en <span class=ikonruta-bildtext>-bildtext BREDVID en inline <svg>-QR-kod (docs/mallar/bilagor/README.md § QR-koderna). Varken QR-SVG:n (vektormarkup, ingen extern referens) eller bildtexten (synlig text, inget href/src) hämtas av Prince. Motsvarande Instagram-bildtext skriver instagram.com/se.miranon/ utan protokoll-prefix.

UTFALL: bokförd frånvaro (kortets egen § 'Ingen ändring om (1) ger noll träffar'). Ingen kodändring, http_timeout sätts inte explicit — det finns ingen hämtning att skydda.

Låst av tests/api/mall-render-sjalvbarande-resurser.test.ts (9 test, källkods-nivå — importerar mall-/CSS-strängarna direkt och kör mall-render.ts:s EGNA CSS_URL_REGEX/IMG_SRC_REGEX kopierade under en KONFIG-PARITETSNOT). Bidirektionellt bevisat 2026-08-29: en injicerad extern URL i bilaga-delad.css.ts (Cavolini-Bold.ttf -> https://evil.example.com/...) fällde 3 test (ett per mall som använder den delade CSS-en), exakt som avsett. Reverterad efteråt (diff verifierad identisk mot backup).
<!-- SECTION:NOTES:END -->
