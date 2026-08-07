---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T93 — AI-assistent i admin-appen — Marcus-vision, hittills HELT odokumenterad i repot (repo-brett grep på "AI-assistent"/"AI SDK" gav noll träffar före S87). …

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
AI-assistent i admin-appen — Marcus-vision, hittills HELT odokumenterad i repot (repo-brett grep på "AI-assistent"/"AI SDK" gav noll träffar före S87). Källa: [`docs/reference/miranon-arkitektur/`](../../docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md) § Spår 1. Kärnmönstret är verktygen, inte chatten: tools som tunna wrappers runt **samma service-lager som UI:t använder** — vilket repot REDAN har i operations-registret (`field-allowlists.ts`, 13 operationer, deny-by-default, CI-grindat deny/allow-par per operation). Assistenten är därmed ett TVÄRSNITT över allt byggt, inte en isolerad fas. Stack-kandidat Vercel AI SDK (ToolLoopAgent + `needsApproval` = human-in-the-loop på skrivningar); versionen MÅSTE verifieras mot aktuell dokumentation, ej citeras ur samtalet. **Öppna frågor (grillnings-/epok-klass):** Övning 2 eller Övning 3 — ADR-068 p.5 gör Fas E till Övning 2:s SISTA del, så en assistent efter Supabase är per definition Övning 3, och en assistent före kräver ett svar på varför den byggs mot ett datalager som ska bytas · ska Fas 6.5:s aktivitetslogg designas så den redan bär agent-actions (konversationens "allt loggas") · approval-UI:t (angränsande mönster: massmutations-grindens kontrollfråga) · modellval. Kommande korpus: Matt Pococks AI SDK v6 Crash Course (ej på disk än)

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad); född S87 (2026-07-25) vid arkitektur-korpusens landning. ADR-053-triage: blockerar ej + värdefullt → defer. Systertråd `T79` (custom miranon.se) — samma epok-fråga, beslutas ev. ihop_
