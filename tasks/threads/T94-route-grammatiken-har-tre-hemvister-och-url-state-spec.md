---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T94 — Route-grammatiken har tre hemvister och `URL-STATE-SPEC` har driftat. S83 avböjde en route-ADR — men som ett VAL MELLAN två kandidater, aldrig som en bar-pr

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Route-grammatiken har tre hemvister och `URL-STATE-SPEC` har driftat. S83 avböjde en route-ADR — men som ett VAL MELLAN två kandidater, aldrig som en bar-prövning (S83:496-498). Omprövad i S87: baren nås INTE (villkor 1 faller — återställningen är att radera en 21-radersfil och kollapsa en ternär; mönstret fick noll nya konsumenter i nattbygget, 18.19 lade till noll route-filer). MEN kunskapen saknar hem: `C1` "separata routes, inte flikar" bor i URL-STATE-SPEC, 19.2:s "EN hemvist + redirect, inga döda URL:er" i en kod-kommentar, 18.18:s "två routes, samma komponent" i ett backlog-kort — de två sista LÄSER som en motsägelse utan sin rationale. Dessutom är specen bevisligt föråldrad: den listar `/event/$eventId/betalning` som inte finns på disk och saknar samtliga fyra routes nattbygget rörde. Rätt fordon: spec-sektion i URL-STATE-SPEC (ADR-074 utsåg den till adress-grammatikens hem), INTE en ADR. Den app-breda frågan hör till konventions-hemmets grillning

**Ursprunglig Ingång-cell:**
_(inget kort än); uppstod S87-spaningen, [`bilagor/s87-spaning/a1-instant-routes-adr.md`](../sessions/bilagor/s87-spaning/a1-instant-routes-adr.md). Route-researchen (Linear/Rails/Jira) finns EJ som research-fil — lever som tre meningar i task-18.18 punkt 13 + kod-kommentar, utan URL-citat; behöver re-verifieras innan en spec-sektion bär dem_
