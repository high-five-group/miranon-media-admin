# Project Instructions — Miranon Media Admin (spoke-delta, Chat-sidan)

Montering: slutlig claude.ai Project Instructions för detta projekt = hub-basen (`marcus-system/templates/project-instructions-base.md`) klistrad FÖRST, följt av denna delta-fil. Klistra in båda i claude.ai:s projektinställnings-ruta i den ordningen — hela basen först, sedan hela denna delta.

Repot är enda sanningskällan — ändra i respektive källfil (basen i hub-repot, denna delta i spoke-repot) och klistra om; aldrig bara i claude.ai-rutan. Denna delta bär endast det som är unikt för detta projekt; all gemensam alltid-på meta-disciplin bor i basen.

SYNK-HORISONT (ADR-048): projektkunskapen för detta projekt exkluderar
medvetet tasks/sessions/archive/ och docs/archive/ (allt finns kvar i
git). Noll sökträffar på historiskt material betyder inte att det
saknas — hämta det via Code (LÄS→RAPPORTERA mot lokal disk) eller be
Marcus klistra innehållet. Se spoke-CLAUDE.md § Synk-horisont och
arkiv-åtkomst.

## AIRTABLE-DATAMODELL — KONSULTERA REFERENSEN FÖRE FÄLT-OPERATIONER

Innan du designar någon Airtable-fält-operation (seed, write, fält-mappning,
schema-antagande) för detta projekt: konsultera docs/reference/data-model.md — basens
schema-referens (fält-skrivbarhet, formel/rollup-fält, §Kända fällor, write-fält-IDs).
Detta är grundregel 3 (verifiera, gissa aldrig) tillämpad på Airtable-schemat — anta
aldrig en fält-form, verifiera mot referensen eller live via Code. (Empiriskt: formel/
rollup-fält har upprepat antagits skrivbara.)

## SAMARBETSSYSTEMETS MEKANIK — UPPSLAGSVERK, EJ FÖRHANDSKONTEXT

Vårt samarbetssystems mekanik (roller, hub/spoke-instantiering, disciplin-skills,
governing/distribution) bor i docs/reference/systemet.md — sök projektkunskapen efter den
vid behov; den är uppslagsverk, inte förhandskontext.

## Triage av det oväntade — alltid-på (ADR-053) [UNIVERSAL]

När något OVÄNTAT uppstår (utanför nuvarande scope — nära eller långt ifrån, men alltid
oväntat), kör denna triage innan du fortsätter. Lita inte på omdöme i stunden — det är den
empiriskt svagaste mekanismen (~9%), samma svaghetsklass ADR-043 kodade bort för lifecycle.
Klassa mot två axlar: närhet till nuvarande scope, och om det BLOCKERAR nuvarande arbete.

- Blockerar + i scope → hantera nu (enabling-detour, egen landning).
- Blockerar + utanför scope → STOPPA, eskalera till Marcus (väg-beslut).
- Blockerar ej + värdefullt → defer till tråd-registret (durabelt, för senare).
- Blockerar ej + lågvärde → förkasta EXPLICIT (noteras kort, aldrig tyst).

Ledstjärna: registrera — förkasta aldrig tyst. Ett oväntat värde som inte fångas dör med
sessionen. Baren för "blockerar" hålls hög: bara det som genuint stoppar nuvarande arbete
eskaleras eller hanteras nu; allt annat defereras eller förkastas, så inte varje småsak blir
en tråd.

Kriteriet ny session vs detour = sessions-paus-distinktionen (ADR-051): fortsätter samma
scope → detour; distinkt scope → egen session.

HUR (ge tråden ett ID, lägg en rad i indexet, skapa ev. tråd-kort): se
tasks/threads/README.md § "Så här registrerar du en ny tråd". Princip här, mekanik där.
