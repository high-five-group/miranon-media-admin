---
id: TASK-165
title: 'Länkröta-ärendet #464 — nattliga fynden triageras och släcks'
status: To Do
assignee: []
created_date: '2026-08-08 17:11'
updated_date: '2026-08-08 17:34'
labels:
  - ready-for-agent
dependencies: []
ordinal: 308000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Stående ärende #464 (öppnat 2026-07-30, icke-blockerande per ADR-082 beslut 4) är rött; senaste fynd-kommentaren 2026-08-08 pekar på körning 31236116308 (HEAD b39ffa3c). Nattliga länkkontrollen täcker BÅDE intern och extern yta — PR-grinden ser sedan ADR-082 bara den interna. Uppgiften: läs den senaste röda körningens faktiska fynd, klassa varje träff (extern röta ⇒ .lycheeignore-post med motivering, precedent digg.se/gitlab-429 i L-historiken; intern ruttnad pekare ⇒ fixa pekaren), landa fixen, verifiera att nightly-links går grön, och stäng #464 enligt ärendets egen stängningsregel ('stäng när körningen är grön igen').
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje fynd i senaste röda körningen klassat extern/intern med motivering i kortet
- [x] #2 Fix landad (.lycheeignore och/eller pekar-fixar)
- [ ] #3 nightly-links-körning grön efter fixen (dispatch eller nästa natt)
- [ ] #4 Ärendet #464 stängt med motivering
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Klassning av senaste röda nightly-links-körningen (run 31236116308, HEAD b39ffa3c, 2026-08-08)

Källa: `gh run view 31236116308 --repo high-five-group/miranon-media-admin --job 93048813700 --log`.
Summary: 3682 Total · 3578 OK · 1 Timeout · 116 Redirected · 95 Excluded · **8 Errors**.
Samtliga 8 fel är EXTERNA — noll interna ruttnade pekare i denna körning.

| # | Domän/URL | Fel | Fil | Instanser | Klass | Källa (lokal curl 2026-08-08) |
|---|---|---|---|---|---|---|
| 1 | cakeinpanic.medium.com/stop-running-tests-on-precommit-hook-... | 403 | docs/research/ci-parity-lokal-trigger-branschmonster-2026-08-05.md (r238, r456) | 2 | UA/fingerprint (bot-block) | 403/403 plain+Chrome-UA. Sedd 2 nätter i rad (31145756912 2026-08-07 + 31236116308 2026-08-08). |
| 2 | dteare.medium.com/behind-the-scenes-of-1password-for-linux-... | 403 | docs/research/t95-r2-desktop-form-2026-08-02.md (r229, r375) | 2 | UA/fingerprint (bot-block) | 403/403 plain+Chrome-UA. Sedd 2 nätter i rad (samma två körningar). |
| 3 | blog.chromium.org/2020/01/introducing-quieter-permission-ui-for.html | 429 (google.com/sorry-redirect) | docs/research/hook-beslut-ask-vs-deny-och-begriplighet-2026-08-04.md (r268, r485) | 2 | GHA-IP (Googles rate-limiter mot delade GHA-IP-ranges, #464-klassen: testing.googleblog.com/leanessays.com) | 200/200 plain+Chrome-UA. Ny instans, inte sedd 2026-08-07. |
| 4 | developer.salesforce.com/docs/component-library/bundle/lightning-pill-container/documentation | 403 (Akamai Bot Manager) | docs/research/mottagar-preview-monster-2026-08-07.md (r395) | 1 | UA/fingerprint (bot-block) | plain-UA → 301 till ny sökväg (docs flyttade, 200 där); Chrome-UA (lychees form) → 403 direkt, `akamai-grn`-header närvarande. Sidan EXISTERAR bevisat. |
| 5 | workspaceupdates.googleblog.com/2021/10/visual-updates-for-composing-email-in-gmail.html | 429 (google.com/sorry-redirect) | docs/research/mottagar-preview-monster-2026-08-07.md (r404) | 1 | GHA-IP (samma familj som #3) | 200/200 plain+Chrome-UA. Ny instans, inte sedd 2026-08-07. |

Timeout (separat karta, ⚠️ INTE en av de 8 "Errors" — se ADR-082 beslut 2 om `--accept-timeouts`):

| Domän/URL | Fil | Instanser | Klass | Källa |
|---|---|---|---|---|
| ronjeffries.com/xprog/articles/practices/pracnotneed/ | docs/research/nummerallokering-parallella-aktorer-2026-07-29.md (r1046) | 2 (2026-08-07 + 2026-08-08, identisk sökväg) | GHA-IP-nivå-strypning (digg.se-precedenten) | Lokalt 200 på 1,1 s — frisk och snabb. |

**Fix:** alla 6 mönster (5 error-domäner + 1 timeout-domän) tillagda i `.lycheeignore` med motivering + datum, per ADR-082 beslut 5. Verifierat lokalt (lychee 0.24.2, samma version som CI) med nightly.yml:s exakta args mot de 5 berörda filerna: 0 Errors, exit 0 (tidigare: 8 Errors, exit 2).

## Divergens från uppdraget — fynd UTANFÖR run 31236116308:s scope (premiss-pass, ADR-086)

Arbetsträdet stod vid landning 45 commits före denna PR:s bas jämfört med körningens HEAD (b39ffa3c → 6d64ead6), eftersom kortet legat på main sedan 6d64ead6 och flera nya `docs/research/*.md`-filer landat mellan de två punkterna. En lokal full-scope-körning av nightly-links exakta args (för att verifiera fixen) avslöjade DÄRFÖR 4 fynd till som INTE fanns i run 31236116308 och INTE nämns i någon #464-kommentar:

- **help.brevo.com** (403, docs/research/post-send-tillstandet-bulkutskick-2026-08-08.md r133+r564) — UA/fingerprint-klass (403/403 lokalt plain+Chrome-UA), samma familj som help.shopify.com/help.tickettailor.com. Tillagd i `.lycheeignore`.
- **eng.uber.com/piranha/** (404, docs/research/prototypkod-isolering-och-parallella-strommar-branschmonster-2026-08-08.md r482) — genuint död sekundärlänk (404 lokalt, ingen redirect). Primärkällan (`www.uber.com/us/en/blog/piranha/`) är redan citerad på SAMMA rad och redan täckt av den befintliga `www.uber.com`-posten i `.lycheeignore`. Fixad genom att TA BORT den döda sekundärlänken ur citatet (samma mönster som commit 60c1a309/06a387ac — fixa pekaren, inte tysta den).
- **www.ncbi.nlm.nih.gov/books/NBK549899/** (500, docs/decisions/ADR-086-uppdragets-premisser-provas-av-mottagaren.md r118) — lokalt 200/200 (plain+Chrome-UA) vid TASK-165-verifieringen → sannolikt transient serverside-hicka, INTE åtgärdad (ingen `.lycheeignore`-post). Bevakas: återkommer den i en framtida körning krävs en ny instans för klassning.

Dessa tre (utom NCBI) fixades proaktivt i SAMMA landning, eftersom AC #3 (grön dispatch efter fixen) annars hade fallerat av en helt annan orsak än den kortet beskriver — en ny röd natt hade producerat en ny #464-kommentar och gjort AC #4 omöjlig.

## Kvarstår för orkestreraren (AC #3 + #4)

Denna PR fixar samtliga kända röda fynd (8+1 från run 31236116308, +3 nya från full-scope-reverifieringen). Lokal verifiering: `lychee` (0.24.2, samma version som CI) mot nightly.yml:s fulla scope = 0 Errors, exit 0 — men lokal mätning ≠ CI-nätväg (samma ärliga begränsning som ADR-082 § Ärlighet om underlaget).

1. Efter att denna PR är mergad till main: dispatcha `nightly.yml` (`gh workflow run nightly.yml --repo high-five-group/miranon-media-admin`) och verifiera att `nightly-links`-jobbet går grönt.
2. Grönt bevis: stäng #464 med `gh issue close 464 --repo high-five-group/miranon-media-admin --reason completed --comment "<länk till den gröna körningen>"` — matchar ärendets egen stängningsregel ("stäng när körningen är grön igen").
3. Rött bevis (osannolikt men möjligt — nätvägen är overifierad lokalt→GHA): en ny kommentar läggs automatiskt av `links-arende`-jobbet på #464; triagera enligt samma mönster som denna PR.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
