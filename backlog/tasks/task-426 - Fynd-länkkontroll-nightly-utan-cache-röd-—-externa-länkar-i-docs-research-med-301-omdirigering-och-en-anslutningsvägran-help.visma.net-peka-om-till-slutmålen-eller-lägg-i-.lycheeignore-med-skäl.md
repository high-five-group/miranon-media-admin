---
id: TASK-426
title: >-
  Fynd: länkkontroll (nightly, utan cache) röd — externa länkar i docs/research/
  med 301-omdirigering och en anslutningsvägran (help.visma.net); peka om till
  slutmålen eller lägg i .lycheeignore med skäl
status: To Do
assignee: []
created_date: '2026-09-07 15:30'
updated_date: '2026-09-07 16:08'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 756000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Nightly-körning 34088565869 (2026-09-07 05:54 UTC), jobbet 'Länkkontroll (utan cache)' rött: 'Errors in' för tio filer under docs/research/ (task-103-deno-verktygskedjan-i-node-repo-2026-07-31, swish-rapport-exportformat-2026-08-30, segment-byggare-branschmonster-2026-08-16, prod-postgres-read-only-agentatkomst-2026-09-03, pdf-scrollprestanda-pdfium-chrome-2026-08-22, pdf-forhandsgranskning-serverlosning-natverkstjanst-2026-08-22, pdf-bifoga-eller-lanka-branschmonster-2026-08-19, parallella-sessioner-och-merge-van-2026-09-04, mcp-verktyg-apify-firecrawl-composio-devtools-higgsfield-2026-09-04, marcus-designpushbacks-bank-transkript-2026-09-05), t.ex. docs.customer.io 301 → /messaging/metrics/message-failed/ och '[ERROR] help.visma.net … Connection failed'. PR-CI:s Docs link check (med cache) är grön — driften syns bara utan cache. Åtgärd: kör nightly-jobbets lychee-kommando lokalt (läs run-blocket i .github/workflows/nightly.yml, utan cache), ersätt varje 301 med slutmålet, och bokför anslutningsfel som inte beror på oss i .lycheeignore med en kommentar per rad (skäl + datum). Ändra aldrig research-dokens sakinnehåll, bara länkmål.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nightly-jobbets länkkontroll körd lokalt utan cache: exit 0, utdatans slutrad bokförd i notes
- [x] #2 Varje 301 ersatt med slutmålet; varje kvarvarande fel i .lycheeignore med kommentar (skäl + datum), listade i notes
- [x] #3 Diffen rör enbart länkmål och .lycheeignore — ingen sakändring i research-doken
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS (ADR-086): uppdraget citerade nightly-run 34088565869 korrekt
i sina exempel (docs.customer.io, help.visma.net) men underskattade
räckvidden på två sätt, båda prövade mot `gh run view 34088565869 --log`:

1. "Tio filer" var fel — jobbet hade 26 fel över 16 filer (16 rader
   "### Errors in"), inte 10. De sex som saknades i uppdraget:
   forberedelseskarm-splash-branschmonster-2026-08-16.md,
   forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md,
   hook-beslut-ask-vs-deny-och-begriplighet-2026-08-04.md,
   ikon-optisk-centrering-2026-08-20.md,
   kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md,
   kvitto-vid-ombokning-2026-09-03.md. Samtliga 16 åtgärdade nedan —
   annars hade AC #1 (exit 0) inte kunnat uppfyllas.
2. Exemplet "docs.customer.io 301 → message-failed" är INTE en av de 26
   felen — det är en rad under lychees "## Redirects per input"
   (informativ, fäller inte exit-koden) i två HELT ANDRA filer
   (dynamiska-segmentregler-branschmonster-2026-08-10.md,
   post-send-tillstandet-bulkutskick-2026-08-08.md, ingen av dem i
   fel-listan). Ingen av de 26 faktiska felen var en 301 — samtliga var
   404/402/403 eller lychee [ERROR] (protokoll-/anslutningsfel). AC #2:s
   "peka om 301:or" tolkades därför som "peka om upptäckt flyttat
   innehåll" (samma anda, manuellt verifierat i stället för automatisk
   redirect), inte en bokstavlig 301-sökning. Det bredare korpus-omfånget
   (218 redirects, repo-brett, långt utanför docs/research/) rördes
   INTE — AC #3 skopar diffen till forskningsdoken + .lycheeignore.

LOKAL KÖRNING — nightly-links.yml-blocket VERBATIM, ingen cache (lychee
läser .lycheeignore inbyggt, LYCHEE_IGNORE_FILE-konstanten i
lychee-bin/src/config/mod.rs, verifierat mot källkoden för v0.24.2):

FÖRE fix:
  Issues found in 12 inputs (lokalt just då — 4 av CI:s 16 filer
  reproducerade inte just detta ögonblick, känd intermittens för
  UA/fingerprint-klassen, se nedan).
  🔍 5603 Total (in 36s 12ms) 🔗 2625 Unique ✅ 5417 OK 🚫 20 Errors
  👻 163 Excluded ⛔ 3 Unsupported 🔀 227 Redirects
  LYCHEE_EXIT=2

EFTER fix (andra gröna körningen, se AC #1):
  🔍 5603 Total (in 26s 1ms) 🔗 2625 Unique ✅ 5414 OK 🚫 0 Errors
  👻 186 Excluded ⛔ 3 Unsupported 🔀 226 Redirects
  LYCHEE_EXIT=0

Fyra körningar totalt efter fixen: #2 grön (0 fel), #3 RÖD (43 fel, men
samtliga nya fel var "[ERROR] ... Network unreachable. Check internet
connectivity" på HELT ANDRA, orelaterade domäner — nextjs.org,
postmarkapp.com, forsakringskassan.se, camillehdl.dev m.fl. — signaturen
för ett lokalt nätverksavbrott på min maskin, inte ett repo-/dokument-
problem), #4 grön igen (0 fel). Körning #3 bokförs som brus, inte som en
ny grind-post — n=3 gröna av 4, det enda röda utfallet har en
förklarad, orelaterad orsak.

`npm run check:docs`: EXIT=0, "check:docs grönt — samtliga 14
dokumentations-grindar körda." Delsteg: lychee (offline-läge, ci.yml:s
interna docs-jobb) 0 Errors; markdownlint-cli2 0 issues i 621 filer;
Vale — endast befintliga 'suggestion'-nivå-poster (inga errors), orört
av denna ändring.

LÄNKAR ÅTGÄRDADE (peka-om, ingen sakändring — verifierat 200 på nytt mål):
  docs/research/forberedelseskarm-splash-branschmonster-2026-08-16.md (263, 514):
    github.com/Shopify/polaris/issues/10049
    → github.com/Shopify/polaris-react-archive/issues/10049
    (repo arkiverat/omdöpt, 301 bekräftat lokalt → 200)
  docs/research/hook-beslut-ask-vs-deny-och-begriplighet-2026-08-04.md (180, 465):
    dev-k8sref-io.web.app/docs/extend/validatingwebhookconfiguration-v1/
    → kubernetes.io/docs/reference/kubernetes-api/admissionregistration/validating-webhook-configuration-v1/
    (hela Firebase-sajten nedlagd, ROTEN gav också 404; officiell
    k8s.io-efterträdare hittad via WebSearch, verifierad 200)
  docs/research/prod-postgres-read-only-agentatkomst-2026-09-03.md (562):
    github.com/supabase-community/supabase-mcp/issues/112
    → github.com/supabase/mcp/issues/112
    (repo omdöpt — doc:ens EGEN citat-titel sa redan "supabase/mcp",
    bara URL:en var kvar på gamla namnet; 301 bekräftat → 200)
  docs/research/task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md (448):
    github.com/biomejs/website/blob/main/src/content/docs/guides/getting-started.mdx
    → .../docs/en/guides/getting-started.mdx
    (sajten fick i18n-locale-prefix, samma fil, verifierad 200)
  docs/research/task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md (434):
    github.com/supabase/cli/blob/main/apps/cli-go/internal/functions/deploy/deploy.go
    → .../apps/cli-go/pkg/function/deploy.go
    (CLI:ts Go-omskrivning flyttade internal/ → pkg/; innehållet —
    import-map-upplösningen — verifierat oförändrat på nya platsen)

.LYCHEEIGNORE — 16 nya mönster (14 unika URL:er/domäner + 2 för samma
ActiveCampaign-domän), varje rad med skäl + datum i själva filen:
  fortnox.helpjuice.com/sv_SE/.../forhandsgranska-fakturor-tips — 402
    Payment Required (symmetriskt)
  quickbooks.intuit.com/learn-support/.../L4XMWuh6i_US_en_US — HTTP/2
    protokollfel med Chrome-UA, 200 med plain-UA (asymmetriskt)
  helpx.adobe.com/acrobat/using/transparency-flattening-acrobat-pro.html
    — samma HTTP/2-protokollfel-klass som quickbooks
  doi.org/10.1068/p5518 — 403 via redirect till journals.sagepub.com
    (Pion/Perception-tidskriftens back-katalog, SAGE-värd, samma
    UA/fingerprint-block som befintlig 10.1177-post men annat DOI-prefix)
  help.acuityscheduling.com/hc/.../16676813537293-... — 403, doc:en
    självdeklarerar redan "403 vid direkt hämtning"
  pretix.readthedocs.io/.* — HELA projektet nedlagt (roten ger också
    404), doc:en självdeklarerar redan "sidan är BORTTAGEN"
  help.visma.net/.* — DNS-uppslagning fallerar HELT, även lokalt
    (curl: "Could not resolve host", nslookup mot 1.1.1.1: "No answer");
    www.visma.net löser upp fint, bara help.-subdomänen är död; ingen
    verifierad ersättning hittad (websökning gav samma döda URL som
    toppträff, vismaspcs.se-artiklarna gäller andra Visma-produkter)
  localhost:5173/event/reco44UBx6GXcxwu5?... — verbatim-citat ur en
    Slack-transkript (Marcus, 2026-08-07), aldrig en riktig extern länk
  github.com/composiohq/rube — repot finns inte (404 + GitHub Search-API
    bekräftar ingen träff), doc:en självdeklarerar redan osäkerheten
  openai.com/codex/ — Cloudflare-bot-block, 403 symmetriskt
  help.activecampaign.com/.* — Zendesk-hjälpcenter, bot-block, 2 distinkta
    artiklar i 2 filer (pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md
    + segment-byggare-branschmonster-2026-08-16.md, den senare
    självdeklarerar redan "403 på fyra separata tillfällen") → domän-bred
  bitbucket.org/chromiumembedded/cef/issues/2727/ — doc:en självdeklarerar
    redan "kräver inloggning, avvisad" vid ursprungscitering; nu 404
  assets.ctfassets.net/zrqoyh8r449h/.../Merchant_Integration_Guide.pdf —
    Contentful CDN-asset-block, 403 symmetriskt (annan värd än befintlig
    www.contentful.com-post)
  github.com/supabase/cli/blob/main/apps/cli-go/internal/init/templates/.vscode/settings.json
    och .../internal/functions/new/templates/deno.json — CLI:ts
    Go-omskrivning flyttade/tog bort dessa specifika mallfiler; till
    skillnad från deploy.go hittades INGEN entydig efterträdare (sökt via
    GitHub Code Search 2026-09-07) — en testfixtur (.golden-fil) och en
    TypeScript-mall hittades men representerar INTE samma körtidsartefakt,
    så ingen gissning gjordes
  simplesignup.se/.* — UPPTÄCKT UNDER EFTER-verifieringen (INTE en av de
    26 CI-felen): hela sajten (även roten) svarade 503 Service Unavailable
    med server: nginx + Phusion Passenger — signaturen för en kraschad
    applikationsserver, ett genuint sajt-brett driftavbrott just nu

AVVIKELSER MOT UPPDRAGET (bokförda, byggda på verkligheten per ADR-086):
  - 16 filer/26 fel, inte 10 (se premiss-pass ovan)
  - "docs.customer.io 301"-exemplet var missvisande: inte en av de
    faktiska felen, hörde till andra filer, är en icke-blockerande
    Redirects-rad
  - simplesignup.se (503, sajt nere just nu) upptäcktes och åtgärdades
    proaktivt eftersom den annars hade fällt AC #1 utan att vara en av
    uppdragets 26 ursprungliga fel
<!-- SECTION:NOTES:END -->
