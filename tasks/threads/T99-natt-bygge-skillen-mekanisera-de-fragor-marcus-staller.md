---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T99 — Natt-bygge-skillen — mekanisera de frågor Marcus ställer när han ÄR där

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Natt-bygge-skillen — mekanisera de frågor Marcus ställer när han ÄR där.** Marcus-idé, formulerad direkt efter S90:s stängning (2026-07-26): _"vi måste bygga en natt-bygge-skill senare som påminner dig istället när jag inte är där."_ **Empirin från S90 är ovanligt ren, eftersom Marcus fanns tillgänglig och därför blev mätbar:** Code deklarerade sig klar TVÅ gånger och var det ingen av gångerna. (1) _"Är du verkligen säker på att du inte kan göra mer?"_ avslöjade att prototyperna aldrig verifierats i KÖRNING — bara i skärmdumpar och agentrapporter; smoke-passet som följde gav 13/13 renderade men också två egna fel (stale visual-baseline, röd länkgrind). (2) _"Du lägger med guidning på granskning av task-48 bygget också va?"_ avslöjade att review-guiden klämt in en FACIT-granskning i variantvalens mall — den saknade facit-jämförelse, byggkravs-avprickning och förklaringen av den avsiktliga WCAG-avvikelsen. Därtill fångade do-confirm-passet två poster till (osynkat trådregister trots att T92+T97 rörts; Del 3 saknades helt). **Fyra fångster, noll från self-review** — exakt ADR-041:s ~9 %-bild. **Skillens kärna vore inte en checklista över ARBETET utan över SJÄLVBILDEN:** har du kört det du byggt, eller läst en rapport om det? · har du granskat subagenternas output själv, eller litat på deras sammanfattning? · är dokumentationen på den nivå du skulle kräva av någon annan? · vad är du INTE nöjd med? Den sista är den bärande — S90 visar att svaret finns men inte artikuleras spontant. Avgränsning mot befintligt: `session-end` täcker AVSLUTET, `/work-batch` täcker AFK-EXEKVERING; luckan är den återkommande själv-prövningen MITT I ett långt autonomt pass. **SKA-KRAV NR 1 (Marcus, 2026-07-26, emfatiskt): Code arbetar ENDAST som ORKESTRERARE i nattpass.** Code lanserar workflows och subagenter som researchar och utför; Code själv håller ihop, granskar utfallet, fattar besluten och äger kontinuiteten. Code skriver inte produktionskod själv i ett nattpass. **Empirin är S90 självt, och den är obehaglig:** Code byggde task-48 för hand — läste 1 078 rader `Deltagare.tsx`, skrev hela e2e-sviten, implementerade, åtgärdade sju review-fynd — och brände därmed merparten av kontextfönstret på arbete en subagent kunde gjort med FÄRSK kontext. Marcus fick ingripa TVÅ gånger mid-turn: _"Outsourca så mycket som möjligt till subagenter, du har redan förbrukat 35 % av ditt kontextfönster. Du är natt-chef!"_ och senare _"använd subagenter för du har förbrukat 48 %"_. Först därefter började Code delegera på riktigt (tre workflows, nio agenter) — och kvaliteten GICK UPP, inte ned: research-passet vände check-in-forken, kartläggnings-passet gav fyra fynd Code missat, smoke-passet fångade två egna fel. **Slutsatsen är inte att delegering är billigare utan att den är BÄTTRE** — subagenten läser med full uppmärksamhet det orkestratorn läser med resten av sitt fönster. Kontextfönstret är natt-chefens enda icke-förnybara resurs: varje token spenderad på att läsa kod är en token som inte finns kvar för att hålla ihop natten, granska utfallet och fatta besluten. Skillen ska därför bära en HÅRD grind, inte en uppmaning — t.ex. att en implementations-uppgift i ett nattpass ALLTID går till subagent, och att orkestratorns egna verktygsanrop begränsas till orientering, granskning, beslut och landning. Hör till hub-repot (yt-oberoende), inte till spoken

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad); nummer taget efter S90:s kadens-rad per S82/T98-precedenten. Besläktad: `T92` (agent-mekanikens obetalda poster) · ADR-041 (fångst-raterna) · ADR-071 (granskningsfärdig-läget)_
