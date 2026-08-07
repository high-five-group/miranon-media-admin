---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: active
---

# T95 — "Riktig app" + professionell inbjudan för Roger & Lotta — Marcus mål: kunna visa appen. …

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
"Riktig app" + professionell inbjudan för Roger & Lotta — Marcus mål: kunna visa appen. **HÅRD GRIND 0: det finns ingen frontend-deploy alls** (ingen hosting-config i repo-roten, ingen deploy-workflow, BUILD-LOG:1656 säger det rakt ut; T46 bär den overifierade prod-frontend-deploy-kontrollen). Utan publik HTTPS-URL finns varken PWA-installation (secure context) eller något för en inbjudningslänk att peka på. Idén har levt sedan 2026-06-30 i EN mening i ett sessionsdok utan tråd-ID (S46:78-79, som själv säger att "Chrome-app" kräver definition: PWA vs extension vs desktop-wrapper). **Två spår, ett delat förkrav:** (a) app-känslan — manifestet saknar `id`, `scope`, `description`, `screenshots`, `display_override`, `launch_handler`, `shortcuts`, och det finns ingen install-prompt-kod alls; (b) inbjudan/auth — noll signup-/invite-/reset-routes existerar, login-vyn är rå Tailwind med en ouppfylld Fas 3-TODO i koden, Supabase default-SMTP vägrar leverera till adresser utanför projektets team (⇒ custom SMTP mot Resend är hårt krav), invite-länkens default-TTL är 1 TIMME mot branschmönstret 7 dagar. ASVS 5.0 V6 ger citerbara golv. Tre ADR-bara beslut: hosting/deploy · invite-/identitetsmodell · auth-faktor-strategi. ~4–6 sessioner, varav delar är Marcus-moment i DNS-/dashboard-paneler. **SPEC KLAR S95 (2026-08-02):** grillning 9/9 Marcus-kvitterad (sessionsdok S95 Del 2) → PRD-kort `TASK-126` (Spår A) + `TASK-127` (Spår B) + 15 skivor i beroendeordning; research R1 (Vercel STÅR, Pro-plan Marcus-kvitterad; CSP-nonce-mönstret FALSIFIERAT → hash/self) + R2 (ingen wrapper nu — Add to Dock är Gatekeeper-fri; brytpunkt → Tauri med minnesmätning) landade i `docs/research/`. Grind 0-paketet operationaliserat i T46-kartan; exekvering = nästa session(er)

**Ursprunglig Ingång-cell:**
kort: `TASK-126` + `TASK-127`; uppstod S87-spaningen, [`bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md`](../sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md) — bär full web-research mot Supabase-docs, ASVS, Resend och branschmönster; citera den i stället för att köra om (OBS två S95-rättade detaljer: 7-dagars-TTL:n är plattforms-omöjlig [taket 24 h] och CSP-nonce-rekommendationen är falsifierad av R1). Roger är fd. cybersäkerhetsexpert ⇒ DMARC-status, token-TTL och enumeration-skydd väger tyngre än designen. Systertrådar `T46` (go-live-kartan + Grind 0-paketet) · `T44` (root-vs-subdomän AVGJORD S95: `send.miranon.dev`) · `T47` (aktiveras via `TASK-126.3`)_
