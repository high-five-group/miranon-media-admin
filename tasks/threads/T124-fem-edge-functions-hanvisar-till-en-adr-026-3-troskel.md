---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T124 — Fem Edge Functions hänvisar till en "ADR-026 ≥3-tröskel för `_shared`-extraktion" som ADR-026 inte innehåller

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Fem Edge Functions hänvisar till en "ADR-026 ≥3-tröskel för `_shared`-extraktion" som ADR-026 inte innehåller.** Registrerad 2026-08-05 (S96) ur granskningen av `test-invite-completion` — triage: blockerar ej, värdefullt, defereras (CLAUDE.md § Triage). **Vad ADR-026 faktiskt säger:** tröskeln är **≥5**, inte ≥3 (rad 54: _"Helper-tröskeln sätts till ≥5 calls i denna ADR"_), och den gäller `parseList<T>`-helpers i **`src/data/adapters/_shared/`** för runtime-validering vid datagräns (rad 83, _"per adapter, inte aggregerat"_) — alltså en helt annan yta än `supabase/functions/_shared/`. **Var felet bor:** `invite-user/index.ts` rad 11, 72, 146 · `create-event-note/index.ts` rad 62 · `create-registration/index.ts` rad 60 · och (om den landar oförändrad) `test-invite-completion/index.ts` § ADR-026-NOT. En grep över `docs/decisions/` visar att **ingen ADR sätter ≥3 för EF-lagret** — konventionen existerar bara som prosa i filhuvudena, som citerar varandra. **Varför det spelar roll:** en bygg-agent läste headern, drog slutsatsen att tröskeln var korsad, och byggde ett scope-beslut på den — resonemanget var korrekt givet premissen, men premissen var fel. Det är samma klass som `ADR-083` (prosa som påstår en täckning ingen mekanism bär), och den sprider sig eftersom varje ny EF kopierar föregående headers formulering. **Vad som ska avgöras (Marcus):** existerar EF-lagrets extraktionströskel som ett genuint beslut som bara aldrig bokfördes — och ska den då mintas som egen ADR med ett medvetet valt tal — eller ska hänvisningarna helt enkelt rättas till "lokal konvention, ingen ADR"? Frågan är liten i kod och stor i koherens; den avgörs inte av en agent. Besläktad: `ADR-026` (den felciterade) · `ADR-083` (klassen)

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad; den nya EF:ens egen instans rättas i S96:s följd-PR, de fyra befintliga rörs inte förrän formen är beslutad)_
