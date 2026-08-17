---
id: TASK-274
title: 'Utskicks-spärren: central flip Blockera/Öppna (Marcus beslut B)'
status: To Do
assignee: []
created_date: '2026-08-17 14:59'
updated_date: '2026-08-17 15:30'
labels:
  - ready-for-agent
dependencies: []
ordinal: 494000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus vill kunna säga Blockera alla utskick respektive Öppna utskick från appen med ETT kommando, utan process. Bygget: en dedikerad spärr-hemlighet läst per anrop i den delade utskicksvakten (samma ställe som miljö-grinden), tydligt UI-fel när spärrad, semantik där frånvaro = öppet och allt oväntat = blockerat. Kontext: agent-/chattvägen är redan mekaniskt blockerad (mail-låset + prod-ref-låset) och RÖRS INTE — detta kort gäller appens egen sändväg. Marcus beslut B 2026-08-17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Central spärr-vakt i den delade utskickshjälparen som redan bär miljö-fail-closed-logiken; SAMTLIGA fyra utskicks-EF:er (åtgärdsmail, segmentutskick, kvitto, anmälningsbekräftelse) konsumerar den och ingen kan skicka förbi — testbevis per EF i API-sviten
- [x] #2 Spärr PÅ: varje verklig sändning nekas med tydlig maskinläsbar felkod och ett människoläsbart meddelande som UI:t visar begripligt (Gunilla-nivå: Utskick är blockerade just nu), oavsett miljö
- [x] #3 Semantik fail-closed åt rätt håll: frånvarande hemlighet eller uttryckligt av-värde = öppet (dagens beteende exakt oförändrat); VARJE annat värde = blockerat — en felskriven flip blockerar hellre än släpper
- [x] #4 Staging-skarptest: hemlighets-flip UTAN omdeploy bevisad slå igenom, tidsatt och bokförd i rapporten (antagandet att secrets läses per anrop får inte antas — det mäts)
- [x] #5 Kortets rapport bokför exakt kommandoform för Blockera respektive Öppna (Marcus enda moment vid flip), samt att prod-deploy av EF-ändringen är Marcus separata moment via allowlist-skriptet (prod-ref-låset)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGE (TASK-274, Marcus beslut B 2026-08-17):

Ny hemlighet: UTSKICK_SPARR. Semantik (AC #3): frånvarande ELLER exakt
värdet "av" = öppet (dagens beteende); VARJE annat värde = blockerat.
Pure klassificerare `isUtskickSparrat()` i _shared/send-bulk.ts (Node-
importerbar, ingen Deno.env-läsning där). Varje EF:s index.ts läser
`Deno.env.get('UTSKICK_SPARR')` PER ANROP (samma mönster som isProd) och
skickar det klassificerade booleanet som `utskickSparrat` in i orkestratorn,
som kastar `UtskickSparratError` FÖRST — före icke-prod-spärren, före
kvitto-nummer-allokering, oavsett `isProd`.

Central plats: samtliga fyra orkestratorer (runBulkSend, runActionSend +
runActionTestSend, sendReceipt, confirmRegistrations) importerar samma
UtskickSparratError/isUtskickSparrat ur _shared/send-bulk.ts — ingen egen
kopia. HTTP-svar: 423 Locked, { error: "Utskick är blockerade just nu.",
code: "utskick_blockerat" } — samma deny-triple-form som non_prod_address_
refused/resend_not_configured.

MARCUS MOMENT — exakt kommandoform (AC #5). Prod-ref lämnas ut som
placeholder här (agent-Bash-kommandon mot prod-refen fälls mekaniskt av
scripts/deny-prod-ref.sh, TASK-203) — den faktiska prod-refen står i
docs/reference/atkomst-och-nycklar.md och prod-driftsattning-runbook.md:
  Blockera alla utskick (prod):
    npx supabase secrets set UTSKICK_SPARR=blockera --project-ref <PROD_REF>
  Öppna utskick igen (prod):
    npx supabase secrets unset UTSKICK_SPARR --project-ref <PROD_REF>
    (ekvivalent: npx supabase secrets set UTSKICK_SPARR=av --project-ref <PROD_REF>)
  Prod-deploy av EF-ändringen (allowlist-skriptet — alla fyra send-*-EF:er
  var redan allowlistade i .prod-functions-allowlist.conf, ingen ny rad
  krävdes):
    bash scripts/deploy-prod-functions.sh --project-ref <PROD_REF>

STAGING-SKARPTEST (AC #4), utfört mot staging-projektet
(pqtshyierkdgwdnxuirz), EN deploy av send-registration-confirmation
(+ _shared-deps), sedan TRE hemlighets-flippar UTAN ny deploy mellan dem:
  1. Baseline (UTSKICK_SPARR frånvarande): POST send-registration-
     confirmation mot ARBETSKO_EXPECTED.bekraftadId → 200, status
     "skipped"/"already_confirmed" (oförändrat dagens beteende).
  2. `supabase secrets set UTSKICK_SPARR=blockera` (CLI-anropet tog 8,49 s).
     Nästa anrop (utan redeploy) → 423, code "utskick_blockerat", body
     {"error":"Utskick är blockerade just nu.","code":"utskick_blockerat"}.
     Observerat inom ~6,9 s efter att secrets-set-kommandot returnerat
     (övre gräns — inkluderar mitt eget skripts uppstartstid, inte renodlad
     Supabase-propagering).
  3. `supabase secrets set UTSKICK_SPARR=av` → nästa anrop → 200 igen
     (explicit av-värde bekräftat öppet).
  4. `supabase secrets unset UTSKICK_SPARR` → nästa anrop → 200 igen
     (frånvaro bekräftat öppet — full cirkel utan någon redeploy).
  Staging lämnad i URSPRUNGSLÄGET: UTSKICK_SPARR unset (verifierat med
  `supabase secrets list` före och efter — identisk namnlista).

UI-YTA (AC #2): src/data/mutations/actionEmail.ts → AtgardsSida.tsx rad
~2618 visar redan `sendActionEmail.error.message` rakt av i en MessageBox
(SAMMA generiska mönster som redan bär non_prod_address_refused/
resend_not_configured — dokumenterat i komponentens egen kommentar rad
2609-2617). Ingen kodändring behövdes där: kravet löses av att server-
meddelandet SJÄLVT är Gunilla-nivå ("Utskick är blockerade just nu.").
SegmentMailCompose.tsx (send-email) har samma generiska mönster. UPPTÄCKT
GAP, EJ RÖRT (utanför scope, registrerat enligt ADR-053): AtgardsSida.tsx
rad ~1282-1286 (kvitto-sändningens MessageBox) visar en HÅRDKODAD "Försök
igen." i stället för error.message — en spärr-blockering där ser alltså
INTE "Utskick är blockerade just nu." utan en missvisande "försök igen"-
text. Ingen kod-koppling verifierad för send-registration-confirmation
(bekräftelse)-flödets fel-yta heller. Föreslås som separat litet kort om
Marcus vill ha Gunilla-nivå på alla fyra ytor, inte bara åtgärdssidan.
<!-- SECTION:NOTES:END -->
