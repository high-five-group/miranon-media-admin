---
id: TASK-165
title: 'Länkröta-ärendet #464 — nattliga fynden triageras och släcks'
status: Done
assignee: []
created_date: '2026-08-08 17:11'
updated_date: '2026-08-08 18:09'
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
- [x] #3 nightly-links-körning grön efter fixen (dispatch eller nästa natt)
- [x] #4 Ärendet #464 stängt med motivering
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

## Uppföljning — rest-fynd ur PR #1008:s post-merge bevis-dispatch (run 31269833863)

PR #1008 mergade som `2c4f6080`. Bevis-dispatchen jag startade mot PR-grenen
INNAN merge (körd 2026-08-08 17:36Z, EFTER armering, precis enligt uppdraget)
föll ändå: `Länkkontroll (utan cache)` gav **3 Errors + 5 Timeouts** — verifierat
själv mot jobbloggen (`gh run view 31269833863 --job 93133809435 --log`), inte
bara mot orkestrerarens sammanfattning.

Samtliga 8 rest-fynd klassade med samma bevisform som förra passet (lokal curl
plain- + Chrome-UA, 2026-08-08):

| # | Domän/URL | Fel i runner | Fil | Klass | Lokalt bevis |
|---|---|---|---|---|---|
| 1 | www.iso.org/standard/70017.html | 403 | docs/decisions/ADR-100-...md (r249) | UA/fingerprint (symmetriskt — INTE runner-nätvägen) | 403/403 plain+Chrome |
| 2 | wirfs-brock.com/rebecca/blog/2011/01/18/... | ERROR connection refused | docs/research/reversibilitet-som-delegeringsaxel-2026-07-29.md (r748) | Runner-IP (asymmetriskt) | 200/200 plain+Chrome |
| 3 | vite.dev/guide/static-deploy | ERROR connection failed | docs/research/t95-r1-hosting-vercel-2026-08-02.md (r453) | Runner-IP (asymmetriskt) — DOMÄN-BRED, se #7/#8 | 200/200 plain+Chrome |
| 4 | www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf | TIMEOUT | docs/research/hallplats-modellen-eventsidan-2026-07-26.md (r876) | Runner-IP (asymmetriskt) | 200/200 plain+Chrome |
| 5 | sunnyday.mit.edu/accidents/safetyscience-single.pdf (http://) | TIMEOUT | docs/research/nummerallokering-parallella-aktorer-2026-07-29.md (r1054) | Runner-IP (asymmetriskt) | 200/200 plain+Chrome |
| 6 | agilealliance.org/glossary/acceptance/ | TIMEOUT | docs/research/testklass-namn-och-support-kataloger-2026-08-02.md (r363) | UA/fingerprint — HYBRID, se not | plain-UA→301 (äkta flytt, ny sökväg 200); Chrome-UA→403 på BÅDA sökvägarna |
| 7 | vite.dev/guide/env-and-mode | TIMEOUT | docs/research/prototypkod-isolering-...2026-08-08.md (r481) | Runner-IP, domän-bred (3 sidvägar i samma körning) | 200/200 plain+Chrome |
| 8 | vite.dev/ | TIMEOUT | docs/specs/BYGGPLAN-LÄTTLÄST-v3.md (r585) | Runner-IP, domän-bred | 200/200 plain |

**Not om #6 (agilealliance.org) — hybridfall, INTE ren runner-nätväg:** plain-UA
avslöjar en ÄKTA flytt (301 → `/glossary/acceptance-testing/`, 200 där), men
Chrome-UA (lychees form) ger 403 på BÅDA sökvägarna — domän-brett WAF/Sucuri-
liknande bot-skydd, inte path-specifikt. Att uppdatera citatet till den nya
sökvägen hade INTE hjälpt CI (verifierat: även den nya vägen 403:ar mot
Chrome-UA). Citatet lämnas därför orört; posten är UA/fingerprint-klassad,
inte runner-IP-klassad, trots att den låg i Timeouts-kartan i denna körning.

**Not om #3/#7/#8 (vite.dev):** tre skilda sidvägar föll i EN OCH SAMMA
körning — starkare bevis än tvånatts-kravet i tanstack.com-precedenten.
Domän-bred post.

Samtliga tillagda i `.lycheeignore` (nytt block, "TASK-165 forts. 2").

**Verifiering:**
- Lokal `lychee` (0.24.2) mot de 8 berörda filerna: 0 Errors, exit 0.
- Lokal `lychee` mot nightly.yml:s fulla scope: 0 Errors, exit 0 (3839 total,
  119 excluded).
- `npm run check:docs`: 14/14 gröna.
- `npm run typecheck` / `biome check` / `npm run build`: gröna.
- `npm run test:api`: FÖRSTA körningen gav 15 fel, samtliga `502 Bad Gateway`
  från skarpa Supabase Edge Functions (staging-plattforms-blipp, inget med
  denna .lycheeignore-only-diff att göra). OMKÖRNING: 465/465 gröna — bekräftat
  transient.

AC #3/#4 förblir öppna. Ny dispatch mot denna gren startad efter armering
(se PR-beskrivningen för run-ID) — invänta INTE utfallet (ADR-096).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Två fix-pass: #1008 (run 31236116308:s 8+1 fynd) + #1011 (run 31269833863:s 8 rest-fynd på runner-nätvägen). Samtliga fynd klassade med bevis i båda riktningar (lokal curl plain+Chrome-UA); noll interna pekare ruttnade. Bevis: Länkkontroll (utan cache) GRÖN i run 31270626838. Ärendet #464 stängt 2026-08-08 med körnings-URL. DoD #3: kö-CI grön per jobb på båda PR:erna (docs-klass); länk-jobbets gröna är skarpbeviset.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
