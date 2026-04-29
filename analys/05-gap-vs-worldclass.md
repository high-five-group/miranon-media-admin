# 05 - Gap vs Worldclass

> Status: Fas 3 Gate 3-underlag. Baserad pa live-state, arbetsdokument, 04-research, plan, direktiv och aldre dokument i den prioritetsordningen.
> Kallprincip: varje gap pekar tillbaka pa minst en av P1-P10 fran Fas 2. Gap utan principankare ar bortskuret eller omformulerat.

## Del A - Gap per domanomrade (M1)

### G1 - Personer saknar formaliserad identity/lead-lifecycle

| Falt | Varde |
| --- | --- |
| ID | G1 |
| Domanomrade | A1 Personer |
| Nulage | Personer bar bade fullstandiga personer och namnlosa leads. Det ar legitimt driftlage, men livscykeln ar implicit i falt och automationer snarare an en formaliserad modell. |
| Vardsklass-princip | P1 Lifecycle-first domain model, P2 Identity resolution as subsystem, P10 Tenant/readiness is a gate, not a guess |
| Impact i skarp drift | Risk att leads behandlas som trasig data, eller att personmatchning byggs pa falthojd i stallet for tydliga identitets- och livscykelregler. |
| Airtable 11/10-atgard | Bevara namnlosa leads. Dokumentera dem som giltig lead-state och forbjud cleanup som raderar dem utan domanbeslut. |
| Supabase target-implikation | Modellera identity cluster/person/lead-lifecycle explicit. Eventuell split av Personer ar en S-track-fraga, inte ett fas-3-beslut. |
| Risk | Overnormalisering innan G0.3 ar avgjord kan skapa fel tenant- och lifecycle-granser. |
| Rekommendation | Airtable preserve + Supabase target. H2 ska inte avgoras utifran "87 falt" utan utifran livscykler, invariants och G0.3. |
| Sparbarhet | DQ6, H2; docs/data-model.md:1110; analys/04-research.md:193; analys/04-research.md:243 |

### G2 - Kontaktidentitet ar inte constraint-backed

| Falt | Varde |
| --- | --- |
| ID | G2 |
| Domanomrade | A1 Personer |
| Nulage | Kontaktfalt som e-post ar inte fullt typade eller constraint-backed i Airtable. Canonical email och unikhetsregler ligger inte som robust domanmodell. |
| Vardsklass-princip | P2 Identity resolution as subsystem, P9 Constraint-backed relational target |
| Impact i skarp drift | Dubletter, case-varianter och semantiskt svaga kontaktfalt gor matchning och migrering skora. |
| Airtable 11/10-atgard | Gor bara saker cleanup/fix efter datagranskning. Undvik bred typkonvertering fore MK om automationer eller views kan bero pa nuvarande falt. |
| Supabase target-implikation | Normalisera e-post/telefon som typed identifiers med constraints, canonicalisering och konfliktlogik. |
| Risk | En mekanisk Airtable-typfix kan bryta formular, Zapier eller gamla data utan att losa identity-fragan. |
| Rekommendation | Migration transform + Supabase target. Airtable-fix endast om konsumenter ar kontrollerade. |
| Sparbarhet | DQ5, H12; analys/04-research.md:68; analys/04-research.md:140; analys/04-research.md:193 |

### G3 - Anmalningsstatus saknar fullstandig state-semantik

| Falt | Varde |
| --- | --- |
| ID | G3 |
| Domanomrade | A2 Anmalningar |
| Nulage | `Ar aktiv` exkluderar inte `Installt`, trots att installning ar en tydlig negativ state. |
| Vardsklass-princip | P3 Explicit state machines, P9 Constraint-backed relational target |
| Impact i skarp drift | Installda anmalningar kan raknas som aktiva i views, utskick, deltagarunderlag eller operationella beslut. |
| Airtable 11/10-atgard | Efter MK: uppdatera formel/logik sa `Installt` inte raknas som aktivt. Verifiera berorda views och automationer. |
| Supabase target-implikation | Definiera anmalningsstatus som state machine med tillatna transitions och explicit active/terminal-semantik. |
| Risk | Snabb formelandring utan view-/automationstest kan ge regressions i befintligt arbetssatt. |
| Rekommendation | Airtable fix. Detta ar ett driftkritiskt gap som kan atgardas innan stor redesign, men forst efter MK. |
| Sparbarhet | DS1; docs/data-model.md:1170; analys/04-research.md:68 |

### G4 - `Aterkommande?` blandar historik och framtida plan

| Falt | Varde |
| --- | --- |
| ID | G4 |
| Domanomrade | A2 Anmalningar |
| Nulage | Faltet later som historisk deltagarstatus, men betyder aktivt aterkommande-flode och inkluderar tidigare kurs, sjalvrapporterad erfarenhet och framtida anmalningar. |
| Vardsklass-princip | P1 Lifecycle-first domain model, P3 Explicit state machines |
| Impact i skarp drift | Personal kan tolka faltet som "har gatt tidigare" och fatta fel beslut om kommunikation, prioritet eller segmentering. |
| Airtable 11/10-atgard | Bevara nuvarande logik men byt namn eller dokumentera tydligare semantik efter konsumentkontroll. |
| Supabase target-implikation | Separera historiskt deltagande, sjalvrapporterad erfarenhet och aktiv aterkommande process i skilda read models eller state-flaggor. |
| Risk | Att "fixa" formeln for att matcha namnet kan bryta verkligt arbetsflode. |
| Rekommendation | Airtable preserve+rename. Detta ar semantisk skuld, inte nodvandigtvis fel logik. |
| Sparbarhet | DS2; docs/data-model.md:574; analys/04-research.md:68 |

### G5 - Kursintention i `Vill anmala sig till` ar svagt kanoniserad

| Falt | Varde |
| --- | --- |
| ID | G5 |
| Domanomrade | A2 Anmalningar |
| Nulage | Multiple select-varden har case-dubletter och fungerar som fri konfigurering snarare an kanonisk kursintention. |
| Vardsklass-princip | P2 Identity resolution as subsystem, P8 Airtable-native ergonomics |
| Impact i skarp drift | Segmentering, statistik och migrering kan splittras pa varianter av samma kursintresse. |
| Airtable 11/10-atgard | Rensa case-dubletter efter MK och efter kontroll av views/automationer/exporter. |
| Supabase target-implikation | Mappa till canonical course/program-intent i migrationen, med alias-tabell for historiska varden. |
| Risk | Direkt options-merge utan mapping kan dölja historiska skillnader eller bryta filter. |
| Rekommendation | Airtable cleanup + Migration transform. |
| Sparbarhet | DQ1; docs/data-model.md:1142; analys/04-research.md:68 |

### G6 - A2 personkoppling har oavklarad reverse-flow-risk

| Falt | Varde |
| --- | --- |
| ID | G6 |
| Domanomrade | A2 Anmalningar, A6 Integrations |
| Nulage | A2:s grenordning kan lata en namnlös Person existera utan att `Anmalan.Person` satts i samma flode. Det ar identifierad risk, inte verifierad fixpunkt i Fas 3. |
| Vardsklass-princip | P2 Identity resolution as subsystem, P6 Integration edges are products |
| Impact i skarp drift | Anmalningar kan sakna explicit personlank aven nar lead/person skapats, vilket forsvagar matchning, uppfoljning och migrering. |
| Airtable 11/10-atgard | Ingen A2-andring fore MK. Verifiera i sandbox eller med riktad test innan eventuell patch. |
| Supabase target-implikation | Ersatt branch-ordning med explicit identity-resolution och idempotent write path. |
| Risk | Att andra A2 utan verifiering kan forvarra personkoppling i skarp drift. |
| Rekommendation | Defer. Designa target for robust personkoppling; verifiera Airtable-fragan separat innan atgard. |
| Sparbarhet | H1, H5; docs/data-model.md:557; docs/data-model.md:607; analys/04-research.md:68 |

### G7 - Deltaganden har record-id-formler som ser auktoritativa ut

| Falt | Varde |
| --- | --- |
| ID | G7 |
| Domanomrade | A3 Deltaganden |
| Nulage | Formel-ID:n i Deltaganden returnerar egna record-id:n eller ar semantiskt svaga, samtidigt som de kan misstas for robusta foreign keys. |
| Vardsklass-princip | P4 Derived data as read model, P9 Constraint-backed relational target |
| Impact i skarp drift | Migrering eller integration kan lasa fel ID som relationell sanning. |
| Airtable 11/10-atgard | Anvand inte dessa falt som sanningskalla. Cleanup endast efter konsumentkontroll. |
| Supabase target-implikation | Bygg Deltaganden pa riktiga foreign keys mot person/anmalan/event och lat display-id vara read model. |
| Risk | Mekanisk export kan cementera felaktiga ID:n i Supabase. |
| Rekommendation | Supabase target. Migrationen ska explicit ignorera eller transformera dessa falt. |
| Sparbarhet | DS6, DQ7, H4; docs/data-model.md:1127; analys/04-research.md:68 |

### G8 - Erfarenhets- och count-read models ar parallella och delvis doda

| Falt | Varde |
| --- | --- |
| ID | G8 |
| Domanomrade | A3 Deltaganden, A1 Personer |
| Nulage | Gamla badge-grenar, parallella count-falt och ett gammalt totalfalt som missar RIM3x finns kvar bredvid nyare read models. |
| Vardsklass-princip | P4 Derived data as read model, P8 Airtable-native ergonomics |
| Impact i skarp drift | Anvandare och automationer kan valja fel read model och fa olika bild av erfarenhet/genomforda event. |
| Airtable 11/10-atgard | Efter MK: sok konsumenter, markera canonical falt och ta bort eller pensionera gamla falt. |
| Supabase target-implikation | Definiera canonical read models for erfarenhet, deltagarhistorik och programniva. |
| Risk | Cleanup utan konsumentkarta kan bryta dashboards, views eller utskick som fortfarande laser gamla falt. |
| Rekommendation | Airtable cleanup. Target ska samtidigt gora derived data explicita read models. |
| Sparbarhet | DS3, DS4, DS5, H8, H9; docs/data-model.md:1176; analys/04-research.md:68; analys/04-research.md:123 |

### G9 - EventKey och event-ingest ar config-skuld

| Falt | Varde |
| --- | --- |
| ID | G9 |
| Domanomrade | A4 Eventplanering, A6 Integrations |
| Nulage | EventKey/form-template och hardcodade MK/Event-17-antaganden fungerar som integrationskonfig, men ar inte robust domanmodell. Kallan till EventKey-buggen ar fortfarande oppen. |
| Vardsklass-princip | P6 Integration edges are products, P9 Constraint-backed relational target |
| Impact i skarp drift | Fel event kan kopplas eller importer misslyckas nar formularkallor och eventkonfig driver isar. |
| Airtable 11/10-atgard | Ror inte MK-recordet eller Deltaganden fore MK. Kalla till EventKey-bugg far utredas separat. |
| Supabase target-implikation | Ersatt string-/template-beroenden med explicit event identity, ingest config och constraints. |
| Risk | Snabb patch i Airtable kan reparera ett symptom men bevara fel integration boundary. |
| Rekommendation | Supabase target + Defer for H13-kallutredning. |
| Sparbarhet | H3, H13; docs/data-model.md:615; analys/04-research.md:158; analys/04-research.md:211 |

### G10 - Tomma singleSelects ar doda eller ofardiga operational fields

| Falt | Varde |
| --- | --- |
| ID | G10 |
| Domanomrade | A5 Stoddomäner |
| Nulage | Falt som `Målgrupp` och `Nivå` har tomma option-listor och kan inte fungera som avsedd Airtable-konfiguration. |
| Vardsklass-princip | P8 Airtable-native ergonomics |
| Impact i skarp drift | Views och arbetsfloden kan ge falsk trygghet: falt ser strukturerade ut men ar inte anvandbara. |
| Airtable 11/10-atgard | Efter konsumentkontroll: ta bort om doda, eller satt verkliga options om de behovs. |
| Supabase target-implikation | Migrera inte tomma konfigfalt som domansanning utan beslut. |
| Risk | Att fylla pa options utan domanbeslut kan skapa ny, oanvand terminologi. |
| Rekommendation | Airtable cleanup. |
| Sparbarhet | DQ2, DQ3, H10, H11; docs/data-model.md:1154; analys/04-research.md:68 |

### G11 - Formular-/leadmagnet-kalla ar Zapier-config, inte form-input

| Falt | Varde |
| --- | --- |
| ID | G11 |
| Domanomrade | A5 Stoddomäner, A6 Integrations |
| Nulage | SHA256-liknande varden i `Källa (formulärkälla)` ar omklassade till Zapier-config-skuld. H6 ar REJECTED och ska inte aterupplivas som hypotes om form-input. |
| Vardsklass-princip | P6 Integration edges are products, P8 Airtable-native ergonomics |
| Impact i skarp drift | Operativ analys av lead-kalla blir olasbar och Zapier-konfig blandas ihop med anvandardata. |
| Airtable 11/10-atgard | Korrigera Zapier-konfig och historisk naming efter MK. Ingen ny hypotes om formularhashar. |
| Supabase target-implikation | Modellera integration source/config separat fran lead source och transformera historiska config-varden. |
| Risk | H6-resurrektion skulle leda analysen fel och skapa onodig jakt pa formularpayloads. |
| Rekommendation | Airtable cleanup + Migration transform. H6 forblir Reject. |
| Sparbarhet | DQ4, H6; tasks/sessions/2026-04-28-datamodell-research-projekt.md:52; analys/04-research.md:102 |

### G12 - Mailutskick har inte forstaklassig partial-success-state

| Falt | Varde |
| --- | --- |
| ID | G12 |
| Domanomrade | A6 Integrations |
| Nulage | `send-email` kan lyckas med Resend men misslyckas med Airtable PATCH utan att driftlaget far tydlig state, retry eller audit. |
| Vardsklass-princip | P5 Audit before event sourcing, P6 Integration edges are products, P7 Operational observability |
| Impact i skarp drift | Mail kan vara skickat medan Airtable sager nagot annat, vilket skapar osynliga avvikelser i uppfoljning och support. |
| Airtable 11/10-atgard | Efter MK: gor partial success synligt i UI/logg och definiera manuell retry/kompensation. |
| Supabase target-implikation | Inför communication log/outbox-liknande modell med status per steg och audit trail. |
| Risk | Att bara kasta hard error kan orsaka dubbla utskick vid retry. |
| Rekommendation | Airtable fix + Supabase target. |
| Sparbarhet | DQ8; docs/data-model.md:643; docs/data-model.md:1186; analys/04-research.md:177 |

### G13 - Vantelista till anmalan ar inte transaktionell

| Falt | Varde |
| --- | --- |
| ID | G13 |
| Domanomrade | A6 Integrations |
| Nulage | Flytt fran Vantelista till Anmalningar sker som flera steg och kan ge dubbletter eller halvt genomford operation vid fel. |
| Vardsklass-princip | P6 Integration edges are products, P9 Constraint-backed relational target, P5 Audit before event sourcing |
| Impact i skarp drift | Samma person kan hamna i inkonsistent vantelista/anmalningslage, vilket paverkar platser, mail och uppfoljning. |
| Airtable 11/10-atgard | Efter MK: samla flytten i en idempotent operation eller lagg till tydlig kompensation/retry. |
| Supabase target-implikation | Gor flytten som transaktion med uniqueness/idempotency och audit. |
| Risk | Frontend-only retry utan idempotency kan oka dubblettrisken. |
| Rekommendation | Airtable fix + Supabase target. |
| Sparbarhet | DQ9; docs/data-model.md:655; docs/data-model.md:1192; analys/04-research.md:158 |

### G14 - Zapier/Elfsight ar extern write path utan produktiserad edge-modell

| Falt | Varde |
| --- | --- |
| ID | G14 |
| Domanomrade | A6 Integrations |
| Nulage | Zapier ar fortfarande primar extern skrivvag for vissa floden, men config, ownership, idempotency och observability ar inte beskrivna som en produktiserad edge. |
| Vardsklass-princip | P6 Integration edges are products, P7 Operational observability, P10 Tenant/readiness is a gate, not a guess |
| Impact i skarp drift | Fel i Zapier eller formular-edge kan ge dataskuld utan tydlig logg, replay eller ownership. |
| Airtable 11/10-atgard | Inga Zapier- eller Elfsight-andringar fore MK. Kartlagg i Fas 5 enligt plan. |
| Supabase target-implikation | Definiera ingest endpoints, webhook config, idempotency keys, request logg och tenant/workspace-boundary om G0.3 leder dit. |
| Risk | Att ersatta Zapier innan write-path ar kartlagd riskerar regressions i skarp lead capture. |
| Rekommendation | Defer till Fas 5 for kartlaggning, med Supabase target-princip redan fastlagd. |
| Sparbarhet | H7; analys/04-research.md:158; analys/04-research.md:211; analys/04-research.md:220 |

### G15 - Automationer saknar action-level diff och audit

| Falt | Varde |
| --- | --- |
| ID | G15 |
| Domanomrade | A7 Observability |
| Nulage | 11 automationer ar deployed och versionsspridda, men analysen har inte action-level diff eller auditlogg over side effects. |
| Vardsklass-princip | P5 Audit before event sourcing, P6 Integration edges are products, P7 Operational observability |
| Impact i skarp drift | Side effects kan andra data utan att felsokning kan svara exakt vilken automation/action som gjorde vad. |
| Airtable 11/10-atgard | Ingen ny extraction i Fas 3. Planera action-level diff i Fas 5 utan att andra A1-A11 fore MK. |
| Supabase target-implikation | Inför audit/event-logg for skrivningar och integration actions innan eventuell full event sourcing. |
| Risk | Att hoppa direkt till event sourcing kan gora modellen tung utan att losa dagens felsokningsgap. |
| Rekommendation | Defer. Audit/observability ska designas i target och kartlaggas i Fas 5. |
| Sparbarhet | DS7; analys/02-live-state.md:406; analys/02-live-state.md:719; analys/04-research.md:177; tasks/sessions/2026-04-28-datamodell-research-projekt.md:52 |

## M1 sanity-check

- Del A innehaller 15 gap och varje gap ar anknytt till minst en av P1-P10.
- H6 ar inte aterupplivad: den forekommer endast som Reject inom G11/DQ4.
- G0.3 ar inte avgjord: beroenden markeras i G1 och G14, men inga tenantval fattas.
- Off-limits respekteras: inga forslag kraver andring av A1-A11, Zapier/Elfsight, Resend, MK-recordet eller Deltaganden fore MK.

## Del B - DS/DQ/H-matris med rekommendation (M2)

| ID | Kort beskrivning | Princip(er) | Klass enligt §8 | Rekommendation | Gap | G0.3-beroende |
| --- | --- | --- | --- | --- | --- | --- |
| DS1 | `Ar aktiv` exkluderar inte `Installt` | P3, P9 | Airtable fix | Justera aktiv-semantik efter MK och verifiera views/automationer. | G3 | Nej |
| DS2 | `Aterkommande?` har missvisande namn | P1, P3 | Airtable preserve+rename | Bevara logik, byt namn/dokumentera semantik efter konsumentkontroll. | G4 | Nej |
| DS3 | Doda badge-grenar/read model-brus | P4, P8 | Airtable cleanup | Markera canonical read model och pensionera doda grenar efter konsumentkontroll. | G8 | Nej |
| DS4 | Gammalt totalfalt missar RIM3x | P4, P8 | Airtable cleanup | Sluta anvanda gammalt totalfalt; ta bort eller arkivera efter konsumentsokning. | G8 | Nej |
| DS5 | Parallella count-falt skapar forvirring | P4, P8 | Airtable cleanup | Valj canonical count och dokumentera read model. | G8 | Nej |
| DS6 | Formel-ID:n i Deltaganden ser ut som relationer | P4, P9 | Supabase target | Ignorera som sanningskalla i migration; ersatt med riktiga FK. | G7 | Nej |
| DS7 | Automationer saknar action-level diff | P5, P6, P7 | Defer | Kartlagg action-level diff/audit i Fas 5. | G15 | Nej |
| DQ1 | Case-dubletter i `Vill anmala sig till` | P2, P8 | Airtable cleanup + Migration transform | Rensa options efter MK och alias-mappa historiska varden i migration. | G5 | Nej |
| DQ2 | Tom `Målgrupp` singleSelect | P8 | Airtable cleanup | Ta bort om dod, annars definiera verkliga options efter domanbeslut. | G10 | Nej |
| DQ3 | Tom `Nivå` singleSelect | P8 | Airtable cleanup | Ta bort om dod, annars definiera verkliga options efter domanbeslut. | G10 | Nej |
| DQ4 | Hashliknande kallvarden ar Zapier-config | P6, P8 | Airtable cleanup + Migration transform | Ratta Zapier-config och transformera historiska config-varden. | G11 | Nej |
| DQ5 | E-post ar svagt typad/canonicaliserad | P2, P9 | Migration transform | Normalisera i migration; Airtable-typfix bara efter konsumentkontroll. | G2 | Nej |
| DQ6 | Namnlosa Personer ar legitima leads men implicit modellerade | P1, P2 | Airtable preserve + Supabase target | Bevara i Airtable; formalisera lead lifecycle i target. | G1 | Nej |
| DQ7 | Record-id-formler ar inte relationell sanning | P4, P9 | Supabase target | Ersatt med constraints/FK i target. | G7 | Nej |
| DQ8 | Mail partial success ar osynligt | P5, P6, P7 | Airtable fix | Synliggor partial success/retry efter MK; target communication log. | G12 | Nej |
| DQ9 | Vantelista-flytt ar icke-transaktionell | P6, P9 | Airtable fix + Supabase target | Gor idempotent flytt eller kompensation; target transaktion. | G13 | Nej |
| H1 | A2 branch-order kan missa personlank | P2, P6 | Defer | Verifiera i sandbox/test fore Airtable-andring; designa robust target. | G6 | Nej |
| H2 | Personer kan behova split i target | P1, P2, P10 | Supabase target | Avgor i S-track utifran livscykler/invariants och G0.3, inte falthojd. | G1 | Ja |
| H3 | EventKey ar svag target-identity | P6, P9 | Supabase target | Modellera event identity/config explicit i target. | G9 | Nej |
| H4 | RECORD_ID-falt ska inte migreras som FK | P4, P9 | Supabase target | Bygg FK fran lankar/exportrelationer, inte display-formler. | G7 | Nej |
| H5 | A2 personkoppling kan vara reverse-flow-problem | P2, P6 | Defer | Verifiera innan patch; target identity-resolution tar over. | G6 | Nej |
| H6 | Hashar som form-input-hypotes | P6, P8 | Reject | Forblir REJECTED. Hanteras som DQ4 Zapier-config, inte ny hypotes. | G11 | Nej |
| H7 | Zapier/Elfsight write path behover edge-modell | P6, P7 | Defer | Kartlagg i Fas 5; target kraver ingest/idempotency/logg. | G14 | Ja, om target ska hantera flera workspaces/produkter |
| H8 | Gamla count-falt bor bort | P4, P8 | Airtable cleanup | Ta bort/arkivera efter konsumentsokning. | G8 | Nej |
| H9 | RIM3x-rollup som read model | P4, P8 | Airtable preserve | Bevara som Airtable-native read model; definiera canonical target-read model senare. | G8 | Nej |
| H10 | Tom `Målgrupp` tyder pa dod struktur | P8 | Airtable cleanup | Ta bort eller fyll med beslutad taxonomi efter kontroll. | G10 | Nej |
| H11 | Tom `Nivå` tyder pa dod struktur | P8 | Airtable cleanup | Ta bort eller fyll med beslutad taxonomi efter kontroll. | G10 | Nej |
| H12 | Kontaktfalt ska bli typed identifiers | P2, P9 | Migration transform | Canonicalisera och constraint-backa i Supabase. | G2 | Nej |
| H13 | EventKey-templatekalla fortfarande oppen | P6 | Defer | Utred kallan separat; target ska inte bero pa string-template. | G9 | Nej |

## M2 sanity-check

- Alla 29 registerposter DS1-DS7, DQ1-DQ9 och H1-H13 ar klassade.
- H6 har klass `Reject`; DQ4 bar den verkliga Zapier-config-skulden.
- Varje rad pekar till ett Del A-gap och minst en P-princip.
- G0.3-beroenden ar markerade for H2 och villkorat for H7; inga multi-tenant-val ar fattade.

## Del C - Prioriteringskarta (M3)

### Driftkritisk Airtable-fix efter MK

| Gap | Varfor har |
| --- | --- |
| G3 | Fel aktiv-semantik kan paverka skarpa views och beslut. |
| G12 | Mail partial success ar ett operativt avvikelsegap. |
| G13 | Vantelista-flytt behover idempotency/kompensation for att minska dubblett- och halvskrivningsrisk. |

### Airtable cleanup post-MK

| Gap | Varfor har |
| --- | --- |
| G4 | Namn/semantik ska tydliggoras utan att andra befintlig logik. |
| G5 | Case-dubletter kan rensas nar konsumenter och historisk mapping ar klara. |
| G8 | Parallella read models och gamla counts ska pensioneras efter konsumentsokning. |
| G10 | Tomma singleSelects ska tas bort eller fyllas med beslutad taxonomi. |
| G11 | Zapier-config-varden ska goras lasbara och historiken transformeras. |

### Redesign Supabase target

| Gap | Varfor har |
| --- | --- |
| G1 | Lead/person-lifecycle och identity cluster ar target-modellering. |
| G2 | Typed identifiers och constraints hor hemma i relational target och migration. |
| G7 | Record-id-formler far inte bli FK; target behover riktiga relationer. |
| G9 | Event identity och ingest config ska ersatta EventKey-/templateberoenden. |
| G14 | Integration edges ska bli explicita produkter med ingest, idempotency och observability. |

### Preserve eller defer

| Gap | Varfor har |
| --- | --- |
| G6 | A2-risk kravs verifiering innan patch; ingen A2-andring fore MK. |
| G15 | Action-level automation diff hor till Fas 5-kartlaggning och target-observability. |

## M3 sanity-check

- Varje Del A-gap forekommer exakt en gang i prioriteringskartan.
- Driftkritisk-kategorin innehaller endast forslag som kan bli Airtable-atgarder efter MK, inte fore.
- Supabase-kategorin fattar inga G0.3-beslut; den markerar target-designbehov.
- Preserve/defer-kategorin skyddar mot otestade andringar i A2 och automationer.

## Del D - Oppna fragor till Fas 4

1. G0.3 multi-tenant: Ska Supabase target vara single-tenant for Miranon eller forberedas for flera workspaces/produkter? P10 galler: tenant readiness ar en gate, inte en gissning.
2. H2 Personer-split: Vilka livscykler och invariants motiverar eventuell uppdelning av Personer i identity/contact/lead/customer-liknande entiteter?
3. A2 reverse-flow: Bekraftas H1/H5 i sandbox eller logg, och vilken minsta sakra patch finns efter MK om risken ar verklig?
4. DQ4 historik: Vilka lasbara source/config-namn ska SHA256-liknande Zapier-varden mappas till?
5. H13 EventKey-kalla: Vilken template eller vilket formularflode genererar fel EventKey, och behover detta fixas i Airtable eller endast designas bort i target?
6. DQ8 mail-state: Ska partial success visas som varning, blockande fel, retrybar state eller manuell support-queue?
7. DQ9 vantelista: Ska kortsiktig fix vara Edge Function, frontend-kompensation eller strikt manuell process tills Supabase-migrationen?
8. Cleanup-konsumenter: Vilka views, automationer, formular, Zapier-steg och exporter laser gamla count-, badge- och tomma configfalt?
9. DS7 automation diff: Vilken kallmetod ger action-level diff utan att andra A1-A11 i skarp drift?

## Gate 3-fragor

1. Ja. Del A ar en battre gapkarta an 03-gap-analysis for nasta fas eftersom den ar principankrad i P1-P10 och skiljer driftfix, cleanup, target-design och defer.
2. Ja. Del B klassar alla DS/DQ/H till Airtable fix, Airtable cleanup, Airtable preserve, Airtable preserve+rename, Supabase target, Migration transform, Defer eller Reject.
3. Ja. Del C ger en anvandbar prioriteringskarta med driftkritisk Airtable-fix, Airtable cleanup post-MK, Supabase target-redesign och preserve/defer.
4. Ja. Del D listar oppna fragor for Fas 4, inklusive G0.3, utan att fatta tenantbeslut.
5. Ja. H6 ar korrekt stangd som REJECTED och G0.3 ar korrekt markerad som oppen gate.
