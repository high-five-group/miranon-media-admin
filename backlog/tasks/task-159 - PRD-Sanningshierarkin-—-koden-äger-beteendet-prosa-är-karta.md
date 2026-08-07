---
id: TASK-159
title: 'PRD: Sanningshierarkin — koden äger beteendet, prosa är karta'
status: To Do
assignee: []
created_date: '2026-08-07 13:44'
labels: []
dependencies: []
ordinal: 278000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Principen 'koden är enda sanningskällan' finns bara som färskt lessons-fragment; sanningsanspråken är splittrade (data-model.md 'AUKTORITATIV', ADR-036 'CI är sanningskällan', ADR-048 git) utan samlad hierarki. Dagens mekanik verifierar FORM, inte sanning (review_by är kalendergrind; tre punktgrindar är enda prosa-mot-verklighet-kontrollerna). Felklassen 'prosa om passerat läge konsumeras som fakta' är belagd återkommande (L477 ×3 · S99 Del 2-premisskorrektionen · kod-kommentars-driften 9-vs-14 i frontmatter-grindens skript).

### Lösning

Domänhierarkin kodifieras i ADR: EXAKT EN auktoritativ källa per kunskapsklass — KODEN äger systemets beteende & mekanik (config är kod); ADR:er varför; CI utfall; git + frys-märkta ögonblicksbilder historik; utpekad referens-fil externa system; kort + sessionsdok pågående arbete. Prosa är karta, aldrig kopia. Läsregeln (kod-verifiera före användning) lyfts från fragment till regel. Frys-banderoll-standarden appliceras. INGA nya grindar — tre decline-rationale bokförs; lesson→grind (ADR-039) är framtida väg. Termposten redan landad i hubbens SYSTEMET.md §0 (7913c16); ADR-numret förs in där vid mintningen (orkestreraren).

### Användarberättelser

1. Som agent vill jag veta vilken källa som äger en kunskapsklass, så att jag aldrig konsumerar karta som facit.
2. Som Marcus vill jag att styrande docs pekar i stället för kopierar, så att drift-ytorna minimeras.
3. Som framtida läsare vill jag förstå varför data-model.md är auktoritativ trots kod-principen, så att hierarkin inte ser motsägelsefull ut.
4. Som agent vill jag mekaniskt kunna skilja fryst historik från levande karta, så att L477-klassen inte upprepas.
5. Som uppdrag 9-auditör vill jag en fastslagen måttstock, så att auditen granskar mot kriterier (ISO 19011-mönstret).
6. Som agent vill jag att läsregeln är regel och inte kandidat, så att kod-verifiering före användning är obligatorisk.

### Implementationsbeslut

- ADR:n bär: hela domäntabellen · karta-inte-kopia · läsregeln · frys-banderoll-standarden (frusen-markör + frysdatum + pekare till levande källa; inget nytt frontmatter-fält) · decline ×3 (skript-existens-grind: noll belagda incidenter; hook-registrerings-grind: en incident i ofarlig riktning; semantisk verifiering: ADR-083 beslut 3) · relationen till ADR-083 (kompletterande: 083 förbjuder falska mekanism-påståenden, denna reglerar var sanningen bor).
- Spoke-CLAUDE.md får EN pekar-rad — inte tabellen (kopia vore brott mot beslutet självt); hub-CLAUDE.md vid nästa hub-sync.
- §0-postens ADR-nummer-komplettering: orkestreraren, vid landningsverifikatet (hub-direktpush).
- Städposten: frontmatter-grindskriptets kommentarer ska inte bära något hårdkodat antal alls — pekare till policy-filen som äger listan.
- Sekvens ADR → tillämpning bindande; uppdrag 9-korten mintas efter sin egen grillning med ADR-skivan som dep.

### Testbeslut

Docs-klass: befintliga 13 docs-grindar är skarven (räknings-grinden fångar README-talet, länk-grinden pekarna). Banderollernas form verifieras i QA-läsvandringen. Ingen ny grind (kvitterat, decline-rationale i ADR:n).

### Utanför omfattningen

- Uppdrag 9:s audit (egen grillning; denna ADR är dess måttstock).
- Nya grindar (declinade ×3).
- Hub-CLAUDE.md-raden (hub-sync-momentet).
- Memory-ytorna (uppdrag 7).

### Estimat

3 skivor, S.

### ADR-koppling

Ny ADR mintas (skiva 1; nästa lediga nummer disk-verifieras vid byggtillfället — 099 är RESERVERAT för TASK-158.1 och tas aldrig). Respekterar ADR-083 (kompletterande), ADR-039 (lesson→grind), ADR-036/ADR-048 (deras anspråk ordnas in i hierarkin, rivs inte).

### Ytterligare anteckningar

Samsyn: S99 Del 6, sex kvitterade frågor (2026-08-07). Research-belagd: ISO 19011 (kriterier före audit) · DRY/SSOT (Pragmatic Programmer) · Nygard-ADR (kod = vad, ADR = varför) · Anthropic context engineering (kuraterad CLAUDE.md, pekare).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → tillämpning är bindande: ADR-skivan landad före tillämpnings- och QA-skivorna exekveras
<!-- DOD:END -->
