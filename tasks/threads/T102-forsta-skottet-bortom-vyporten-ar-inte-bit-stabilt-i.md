---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T102 — Första skottet bortom vyporten är inte bit-stabilt i acceptance-klassen — men är det i e2e

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Första skottet bortom vyporten är inte bit-stabilt i acceptance-klassen — men är det i e2e.** Observerad 2026-07-27 (S91, `TASK-59.3`). Byte-identitetsprovet i `hem` tar en skärmdump av `main#main` (831 px) mot en 720 px vyport, alltså BORTOM vyporten. Mätt över fem skott i rad: **#1 skiljer sig från #2–#5, som är byte-identiska inbördes.** Avvikelsen är **38 px av 498 600**, samtliga ±1 i EN kanal och samtliga på den fasta tabbarens antialiasade rundade kant. **Fyra förklaringar falsifierade** av den implementerande agenten: `document.getAnimations()` tom före och efter · scrollpositionen står still · dubbel-rAF ändrar inget · `document.fonts.ready` ändrar inget. **Kontrollprov: samma fil i e2e-klassen ger bit-identiska skott redan från det FÖRSTA** (mätt före flytten), så det är klassbytet som utlöser det, inte testets form. **Åtgärdat med ett kasserat uppvärmningsskott** — noll tolerans behållen, ingen pixelmarginal införd, alla tre jämförda skott tas nu i samma regim. Det är en symptomåtgärd och bokförs som sådan. **OTESTAD LEDTRÅD (orkestrerarens, ej agentens):** den enskilt största miljöskillnaden mellan klasserna är AVLYSSNINGSLAGRET — e2e mockar med `page.route`, acceptance med MSW:s context-routes, vilket ändrar NÄR svaren levereras. Första skottet kan därför fånga svansen av layout-sättning snarare än något i sidan. Ingen compositor-trace togs. **Varför tråden finns:** sexton filer återstår i A5 och flera bär skärmdumps-jämförelser; återkommer instabiliteten vill nästa utredning ha mätningen och ledtråden nedskrivna i stället för att börja om. Besläktad: `T101` (oreproducerat `personer.spec.ts`-fall) · `T87`

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad)_
