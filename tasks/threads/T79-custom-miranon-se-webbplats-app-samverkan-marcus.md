---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T79 — Custom miranon.se — webbplats/app-samverkan (Marcus-visionen, S73 K76): egen custom-byggd webbplats ersätter Shopify-mallen + Elfsight-widgetarna (kalendern

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Custom miranon.se — webbplats/app-samverkan (Marcus-visionen, S73 K76): egen custom-byggd webbplats ersätter Shopify-mallen + Elfsight-widgetarna (kalendern + anmälningsformulären) så webbplatsen och admin-appen delar samma datakälla (basen via EF-lagret) och samarbetar direkt — skapa event i appen → publiceras på webben. Första konkreta fröet: publicerings-avsnittet på skapa-event-sidan (K76-prototypen, Resend-klassens switch) + PRD-kravet publiceringsflagga i basen (additivt per ADR-063; fältet FINNS EJ — live-fältlistan S73). Vid upptag: publicerings-KONTRAKTET (vad flaggan styr: kalender-synlighet · anmälningsformulär · event-sida på webben) · webbplats-stacken · anmälningsflödets flytt från Elfsight

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad); född S73 (2026-07-20, skapa-sidans konvergens; ADR-053-triage: blockerar ej + värdefullt → defer); S74 (2026-07-21): PRD-gränssnittet låst — publiceringsflaggan blir additivt bas-fält via TASK-19 skiva 4, kontraktet (vad flaggan styr) kvar i tråden; **S87 (2026-07-25): ARKITEKTURKÄLLAN FINNS NU** — [`docs/reference/miranon-arkitektur/`](../../docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md) besvarar två av tråd-kortets tre öppna frågor: publicerings-kontraktet (publicering = statusändring på EN källa, aldrig kopiering; push-till-Shopify metaobjects nu → pull + `revalidateTag` vid custombygge, datamodellen ORÖRD genom bytet) och anmälningsflödets flytt (server action → kapacitetskontroll → Supabase → Resend). **DIVERGENS att triagera:** källan föreskriver livscykel `draft` → `scheduled` → `published` → `archived` + synlighet skild från bokningsbarhet, medan basfältet `Publicerad på miranon.se` (`fldrjj61ovL3Zv1mN`) är en CHECKBOX. Hemvist öppen: AT-Max-krav (ADR-063), T79-krav, eller eget kort ihop med TASK-32 (publiceringsflaggan saknar läs-väg). Webbplats-stacken förblir obesvarad — pull-modellen förutsätter Postgres och binds därmed till efter Fas E_
