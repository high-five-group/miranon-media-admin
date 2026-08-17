---
id: TASK-147.12
title: Dokumentklass-fältet i Bilagor-tabellen + skrivvägarna
status: Done
assignee: []
created_date: '2026-08-16 08:40'
updated_date: '2026-08-17 08:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-147
ordinal: 441000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur task-147.6:s fynd 1 (2026-08-16, Marcus-GO 'byggas idag', ADR-063: resolution I BASEN): Bilagor-tabellen bär inget dokumentklass-fält — klass A (uppladdad) och B (event-mallat genererad) kan inte särskiljas. Bygg: single-select-fält i STAGING-basen först (namn/optioner designas mot PRD 147:s klassdefinitioner + data-model.md-konventioner), skrivvägarna sätter klassen (upload-vägen → A; generate-event-attachment-EF:n → B), backfill av befintliga rader där klassen är härledbar, Dokument-ytans filter/grupper läser fältet. data-model.md uppdateras (fält-ID, skrivbarhet). Prod-fältet skapas EFTER staging-bevis, bokförs för dagens prod-moment.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fältet finns i staging-basen med designade optioner; data-model.md uppdaterad med fält-ID + skrivbarhet
- [x] #2 Båda skrivvägarna sätter klassen; staging-bevisat (ny uppladdning → A, ny generering → B)
- [x] #3 Backfill av befintliga staging-rader där klassen är härledbar; icke-härledbara lämnas tomma och bokförs
- [x] #4 Dokument-ytan läser fältet (filter/grupper mot verklig klass, inte gissning)
- [x] #5 Prod-steget (fält + backfill) bokfört som klicklista/MCP-steg för dagens prod-moment
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STAGING KLART (agent-bygge, 2026-08-16): fältet skapat, båda skrivvägarna
sätter klassen, backfill klar, Dokument-ytan läser fältet. Se PR-diffen och
data-model.md § "Stagingbasens additiva tillskott 2026-08-16" för detaljer.

PROD-KLICKLISTA (dagens prod-moment, Marcus/orkestrerare — INTE utfört av
byggagenten per uppdraget; deny-prod-ref.sh-hooken stoppar agenter från att
rikta kommandon mot prod mekaniskt):

1. Skapa fältet i PROD-basen via Airtable MCP create_field
   (baseId app8uGPrVCVOm6LfD, tableId tblevR1B54wFjp7QC "Bilagor"):
   - name: "Dokumentklass", type: "singleSelect"
   - choices: [{name: "Uppladdad"}, {name: "Event-mallad"}, {name: "Person-genererad"}]
   - description: samma text som staging-fältet (scripts/create-bilagor-table.mjs
     CONFIG.fields, sista posten) — kopiera verbatim.
   Verifiera efteråt med describe_table mot prod, notera det riktiga
   fält-ID:t + de tre choice-ID:na (blir ANDRA värden än stagings
   fldr2CwboZ3M4USCX/selRJGlFuqzbY8V9w/selkwZzOdrKEcKbky/selg6QYcmNlNCtL8n —
   Airtable tilldelar per bas).

2. Backfill PROD-raderna: kör SAMMA klassificeringslogik som
   scripts/backfill-bilagor-dokumentklass.mjs (mall-prefix "Deltagarinformation – "
   ⇒ Event-mallad, annars Uppladdad — regeln håller lika i prod eftersom
   Bilagor-tabellens ENDA skrivvägar är samma EF-kod). Skriptet är HÅRDKODAT
   mot staging (samma skyddsräcke som create-bilagor-table.mjs) — kör INTE
   om för att peka det mot prod. Gör backfillen i stället via Airtable MCP
   direkt (list_records på Bilagor-tabellen med fields Namn+Dokumentklass,
   klassificera enligt regeln ovan, update_records i batchar om max 10) —
   samma metod agenten använde skarpt mot staging (18 rader, 0
   oklassificerbara, senare +3 rader från en samtidig CI-körning under
   samma session — även de klassade). OBS: prod kan bära ÄKTA
   Lotta-uppladdade filnamn (till skillnad från stagings enbart
   testsentineler) — regeln gäller ändå entydigt eftersom endast
   generate-event-attachment någonsin skriver "Deltagarinformation – "-
   prefixet.

3. Deploya de FYRA ändrade EF:erna till prod (project-ref, se
   docs/reference/atkomst-och-nycklar.md/prod-driftsattning-runbook.md för
   den faktiska strängen — medvetet inte upprepad här, deny-prod-ref.sh
   fäller på ren förekomst av strängen i ett Bash-kommando):
   upload-attachment, finalize-attachment-upload, generate-event-attachment,
   get-event-attachments. Formen: `supabase functions deploy <namn>
   --project-ref <prod-ref>`. deny-prod-ref.sh kräver
   PROD_REF_GODKAND_AV_MARCUS=<prod-ref> satt i miljön för att släppa
   igenom kommandot om en agent kör det åt Marcus (se
   scripts/test-deny-prod-ref.sh för formen) — annars kör Marcus det
   själv i sin egen terminal, utanför Claude Code.

4. Skarpt bevis: gör en riktig uppladdning och en riktig generering mot prod
   (eller lita på de redan gröna staging-testerna, eftersom det är EXAKT
   samma kod som deployas — men en punktverifiering via MCP på EN ny rad
   rekommenderas ändå, samma disciplin som staging-beviset).

5. Uppdatera data-model.md: flytta Dokumentklass-raden ur
   "Stagingbasens additiva tillskott"-sektionen till en vanlig
   prod+staging-rad (mönster: se hur Lagringsnyckel/Bilagor-tabellen
   dokumenteras i "Prod-basens additiva tillskott 2026-08-11"), med det
   RIKTIGA prod-fält-ID:t från steg 1 — anta aldrig att det blir samma
   sträng som staging.

PROD-KLICKLISTANS PUNKT 1–2 UTFÖRDA (orkestreraren via Airtable-MCP, Marcus GO 2026-08-16): (1) Dokumentklass-fältet skapat i prod-basen (app8uGPrVCVOm6LfD, Bilagor tblevR1B54wFjp7QC) — fält-ID fldeB2dlwfk2KkKVT, choices Uppladdad=selzhVB3EU7vAGetM / Event-mallad=selRCThfTxaBeZuvU / Person-genererad=selu96NPchIercPeU, beskrivning verbatim ur create-bilagor-table.mjs. (2) Backfill: prod-tabellen bar NOLL rader (EF:erna aldrig prod-deployade ⇒ inga rader kunnat födas) — ingen klassning behövdes, utfall verifierat via list_records. Punkt 3 (EF-deploy-svepet) KVARSTÅR på HITL-klicklistan.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad via PR #1394 (merge 1dd90f98, 2026-08-16) genom merge-kön. Dokumentklass-fältet (fldr2CwboZ3M4USCX, Uppladdad/Event-mallad/Person-genererad per ORDLISTA A/B/C) i staging; båda skrivvägarna staging-bevisade; backfill 33/33, 0 oklassificerbara; DokumentYta läser fältet med Okänd-fallback; data-model.md uppdaterad; prod-klicklistan (5 steg) i Implementation Notes för dagens prod-moment. Rebase-läkning mot skärpningsvarvet utförd (9d9bac20).
<!-- SECTION:FINAL_SUMMARY:END -->
