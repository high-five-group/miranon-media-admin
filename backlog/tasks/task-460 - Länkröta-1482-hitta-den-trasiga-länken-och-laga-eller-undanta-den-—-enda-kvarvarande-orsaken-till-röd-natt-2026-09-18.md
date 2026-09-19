---
id: TASK-460
title: >-
  Länkröta #1482: hitta den trasiga länken och laga eller undanta den — enda
  kvarvarande orsaken till röd natt 2026-09-18
status: Done
assignee: []
created_date: '2026-09-18 11:52'
updated_date: '2026-09-19 08:27'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 800000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt av orkestreraren 2026-09-18 (S126): natten 2026-09-18 hade ALLA åtta kontroller gröna och var röd enbart av 'Länkkontroll (utan cache)'. Det stående ärendet #1482 (etikett lankrota) är öppet sedan 2026-08-17 och får en kommentar per natt; ingen har lagat orsaken. S125 undantog chromium.googlesource.com (503 anti-bot mot GHA-runners, #2513, landad 2026-09-17 ~13:00Z) men natten efter var länkkontrollen fortfarande röd — något annat är alltså trasigt. Efter kortet är orsaken identifierad ur nattens lychee-logg (gh run view `<senaste natt>` --log, jobbet Länkkontroll), och varje trasig länk är antingen rättad i källfilen eller undantagen i .lycheeignore med mätt skäl (samma form som #2513: antal körningar, felkod, varför undantag är rätt). Undanta ALDRIG en länk som faktiskt är död — rätta den. Marcus GO 2026-09-18: 'ja till kortet för länkrötan'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje felande länk i den senaste nattens lychee-logg är listad i kortet med felkod och åtgärd (rättad / undantagen med mätt skäl)
- [x] #2 En manuell körning av länkkontrollen (workflow_dispatch eller lokalt lychee utan cache med samma flaggor som nightly.yml) är grön
- [x] #3 Efter första skarpa natten: #1482 stängt enligt stängningsregeln i CONTRIBUTING § Nattnätet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FYND (2026-09-19, ur nattens lychee-logg): senaste skarpa nattkörningen (nightly 35311984679, scheduled, 2026-09-18T05:44:23Z) hade ALLA ÅTTA övriga kontroller gröna — enbart 'Länkkontroll (utan cache)' röd, exit 2, 7 Errors.

Samtliga 7 fel var 503 Service Unavailable mot fyra distinkta gitlab.com/gitlab-org/gitlab/-/blob/master/-URL:er, citerade i docs/research/aktiveringssida-branschmonster-2026-08-03.md (rad 68, 287, 302, 521-524):

- app/controllers/invites_controller.rb (rad 68, 521) — [503] × 2
- app/views/devise/registrations/_password_input.html.haml (rad 287, 524) — [503] × 2
- app/views/devise/registrations/_signup_box_form.html.haml (rad 302, 523) — [503] × 2
- app/views/devise/registrations/new.html.haml (rad 522) — [503] × 1

VERIFIERAT FRISKA 2026-09-19: samtliga fyra URL:er gav HTTP 200 via `curl -A "Mozilla/5.0"` från icke-GHA-IP direkt efter att CI-loggen visade 503 — samma klass som den befintliga gitlab-429-posten (S84, .lycheeignore rad 137-146) och chromium.googlesource.com-precedenten (#2513, S125): WAF/anti-scraping mot GHA-runner-IP-intervall, inte en död länk.

MÖNSTRET ÄR INTERMITTENT, mätt över tre nätter (samtliga scheduled-körningar):

- 2026-09-16 (35061163532): grön, noll gitlab.com-fel
- 2026-09-17 (35187813487): röd, 3 av 4 URL:er (+ chromium.googlesource.com, redan undantaget samma dag senare via #2513)
- 2026-09-18 (35311984679): röd, samtliga 4 URL:er / 7 citeringar — 7/7 av nattens fel av denna klass, noll andra fel

ÅTGÄRD: path-scopat undantag tillagt i .lycheeignore (`^https://gitlab\.com/gitlab-org/gitlab/-/blob/`, dagens datum + mätt skäl, samma format som de befintliga anti-bot-posterna). Ingen länk rättad i källfilen — samtliga fyra är friska, det är GitLabs WAF mot GHA-IP som blockerar, inte länkarnas mål.

VERIFIERING (AC #2): lokal `lychee` (installerad binär 0.24.2, samma major som lychee-action v2.9.0) körd med EXAKT nightly.yml:s argument (--accept-timeouts --no-progress --verbose --header "User-Agent: ..." --exclude-path docs/archive --exclude-path docs/reference/pocock + samma fem input-globar), .lycheeignore auto-laddat av lychee själv (bekräftat i källkoden: lychee-bin/src/main.rs:196-198, `File::open(LYCHEE_IGNORE_FILE)` där `LYCHEE_IGNORE_FILE = ".lycheeignore"`, oberoende av CLI-flaggor):

🔍 6061 Total (in 28s 914ms) 🔗 2804 Unique ✅ 5839 OK 🚫 0 Errors 👻 219 Excluded ⛔ 3 Unsupported 🔀 237 Redirects
exit=0

Grönt, inga fel. (En tidigare körning samma dag visade transient två DNS-relaterade fel mot `www.bfn.se` från agentens sandbox-nätverk — "Could not resolve host" — som INTE förekommer i någon av de granskade nattloggarna och alltså är en lokal artefakt, inte ett repo-fynd; bekräftat borta vid omkörning.)

AC #3 (stängning av #1482 efter första skarpa gröna natten): EJ görbar i denna skiva — kräver att NÄSTA schemalagda nattkörning (efter denna PR:s landning) faktiskt är grön, vilket inte kan verifieras innan den kört. Lämnas obockad med avsikt; orkestreraren/nästa session stänger #1482 enligt CONTRIBUTING § Nattnätets stängningsregel när den gröna natten är bekräftad.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad i PR #2555 (`12153710`, buntad med N8): de felande länkarna lagade eller undantagna i `.lycheeignore` med mätt skäl per post. AC #3 stängd 2026-09-19 (S126 resume 3): första skarpa natten efter landningen — schemalagd körning 35424541948 — hade "Länkkontroll (utan cache)" grön och kanaljobbet "Länkröta — stående ärende" överhoppat; ärende #1482 stängt med skriven motivering enligt CONTRIBUTING § Nattnätet, väg (a). DoD #2/#3 belagda av landningen själv: PR:en gick genom merge-kön med grön CI, och dess sju filer hör alla till bunten N8+460.
<!-- SECTION:FINAL_SUMMARY:END -->
