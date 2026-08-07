---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T104 — Vaktens tvåsidiga bevis körs för hand och överlever inte körningen

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Vaktens tvåsidiga bevis körs för hand och överlever inte körningen.** Tre skivor i rad (`TASK-59.3`, `59.4`, och samma form i `59.2`) har bevisat hermetiken genom att MANUELLT patcha källfiler — neutralisera testets egna `network.use()`-överskuggningar och tömma normalläget — köra, läsa utfallet, och sedan återställa ur en scratchpad-kopia. **Beviset finns bara i agentens rapporttext; inget i repot kan köra om det.** Identifierad av den implementerande agenten i `59.4`, som också namngav precedenten: `tests/visual/hermetik-vakt.spec.ts` visar att fällningen GÅR att bevisa permanent — dess `test.fail()`-tester gör den röda körningen till leveransen, så en avstängd vakt kan inte se grön ut. **Föreslagen form:** en flagga (t.ex. `HERMETIK_SJALVTEST=1`) som tömmer normalläget, så att beviset blir ett testfall i stället för en rutin. **Varför det brådskar måttligt men verkligt:** `TASK-59.6` sätter sju filer i spel samtidigt, och handpåläggning skalar sämst just där. Rimlig åtgärdspunkt är FÖRE `59.6`. **Klassen är densamma som flera fynd i S91:s orkestrering** — något som ser verifierat ut men inte kan verifieras om. Besläktad: `T102` · `T103` · ADR-080 beslut 3 (vakten som villkor). **ÅTGÄRDAD 2026-07-28 (S91 åttonde resumen, `TASK-60`)** — Marcus tog Codes rekommendation att ta den som egen skiva FÖRE `59.5`. `HERMETIK_SJALVTEST=1` bär BÅDA leden (normalläget tömt + testens egna `network.use()` verkningslösa; vartdera ensamt lämnar en klass av tester obevisade), och `scripts/hermetik-sjalvtest.mjs` kräver att alla tester fälls MED `OmockadRequestError` som orsak — utfallet ensamt räcker inte, eftersom en trasig assertion också gör en svit röd. Mätt vid leverans: **51/51 fällda, 51/51 av vakten, noll timeouts**. Negativ kontroll bevisar att grinden kan fälla. Steget kör i CI:s acceptance-jobb (+~50 s mot 1,2–1,4 min uppmätt, tak 8 min). `test.fail()`-formen förkastades aktivt: den kontrollerar att ett test fälls, aldrig varför, och hade i en delad modul körts en enda gång av ESM-cachen

**Ursprunglig Ingång-cell:**
`TASK-60` · sömmens dokumentation i `tests/acceptance/support/acceptance-bas.ts`
