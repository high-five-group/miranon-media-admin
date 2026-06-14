# ADR-052: `lifecycle:` — dedikerat livscykel-fält, ortogonalt mot `status:`

- Status: Accepted (Session 20 — 2026-06-14; ratificerad av Marcus i direktion samma session, byggs omedelbart)
- Datum: 2026-06-14
- Fas: Session 20 — lifecycle-fundament (process-fundament, ingen byggfas)

## Kontext

Livscykel-tillstånd — är en session/fas `active`, `paused` eller `closed`? — uttrycks
idag enbart i dok-prosa, på ad-hoc-plats med inkonsekvent vokabulär: session 18 sa
"PAUSLÄGE/Pausorsak"; session 19 begravde "PÅGÅENDE" i en "Lessons + status"-rubrik.
Det är samma rotorsak som ADR-051 åtgärdade för VERB-sidan (A1/A2-forken vid
återupptagning). ADR-051 beslut 4 sätter redan "sessionsdokets status → PAUSED" — men
"PAUSED" levde bara i prosa, inte i ett O(1)-läsbart fält. L119 generaliserar
mönstret: en implicit tillstånds-axel fylls av närmaste grannstruktur och bär dess
semantik som bieffekt. Marcus pushback (2026-06-13/14): livscykel hör i ett dedikerat
fält, inte i kropp.

ADR-030 etablerade frontmatter-konventionen med `status:` (draft/stable/deprecated,
validerat av check-frontmatter.sh Check 4) — ett DOKUMENTKVALITETS-fält. Livscykel är
en OBEROENDE axel: ett dok kan vara `status: stable` OCH `lifecycle: paused` samtidigt.
Att lägga livscykel-värden i status-enumet vore ett kategori-fel — sammanslagning av
två ortogonala tillstånds-axlar i ett fält.

## Beslut

### 1. Dedikerat fält `lifecycle:`, enum `active` / `paused` / `closed`

Gemena strängar, konsekvent med `status:`-enumets format. Semantik: `active` =
sessionens arbete pågår eller är öppet (nyfött eller återupptaget); `paused` = durabelt
parkerat utan completion (ADR-051-paus); `closed` = avslutat (session-end). Tre
tillstånd, fyra verb: start/create-session-doc → `active`; paus → `paused`; resume →
`active`; end → `closed`.

### 2. Ortogonal mot `status:` — `status:` förblir orört

`status:` (ADR-030, Check 4) är dokumentKVALITET (draft/stable/deprecated). `lifecycle:`
är arbets-/sessions-TILLSTÅND. Axlarna korsar fritt: ett arkiverat sessionsdok är
`status: stable` + `lifecycle: closed`; ett pausat är `status: stable` +
`lifecycle: paused`. Livscykel-värden läggs ALDRIG i status-enumet, och vice versa.

### 3. Skill-ägt underhåll

Fältet sätts uteslutande av lifecycle-skillsen: `session-start` / `create-session-doc`
föder `active`; `session-paus` → `paused`; `session-resume` → `active`; `session-end`
→ `closed`. Manuell prosa-redigering av livscykel utgår — fältet blir sanningskällan.
Utan skill-ägarskap flyttas driften bara från kropp till fält (skuld, ej tillgång).

### 4. Validering via dedikerad lätt grind, SKILD från frontmatter-governing-regimen

`lifecycle:` valideras INTE genom att dra sessionsdok in i FRONTMATTER_GOVERNING_DOCS
(vars fem checkar inkluderar `review_by > today` och `updated`-git-match). Skälet:
sessionsdok är immutabla efter arkivering (ADR-023 + ADR-041-korrigeringen);
`review_by`-checken skulle fälla CI permanent på åldrande arkiverade dok som inte får
lagas. Istället införs en separat lätt grind som validerar (a) `lifecycle ∈
{active, paused, closed}` och (b) konsistens fält↔kropp (flagga t.ex. `active` på ett
dok med PAUS-rubrik). Egen axel → egen grind — ortogonalitet på mekanism-nivå.
Implementation: efterföljande inkrement i Session 20.

### 5. Applicerings-population: sessionsdok nu; schema-on-read för övriga

Fältet definieras generellt men appliceras konkret på sessionsdok i denna session — det
är där livscykel-driften uppstod. Befintliga dok UTAN fältet förblir giltiga (additivt,
valfritt attribut; ingen big-bang-migrering). Nya sessionsdok föds med fältet; sessions
18/19 retro-appliceras. Övriga dok-populationer (scope-frön, governing-dok) kan adoptera
fältet additivt senare — de tvingas inte nu.

### 6. Övergångsregel för dok utan fältet

Frånvaro av `lifecycle:` betyder "ej livscykel-spårat" — giltigt, inte ett fel. Grinden
(beslut 4) validerar endast dok SOM BÄR fältet; den kräver inte fältets närvaro på
godtyckliga dok. En läsare som inte finner fältet faller tillbaka på kropps-prosan, som
idag. Detta är schema-on-read: schemat utvidgas, läsningen degraderar grasiöst.

## Alternativ som övervägdes

- **Livscykel-värden i `status:`-enumet.** Förkastat: kategori-fel — sammanslår två
  ortogonala axlar (kvalitet vs tillstånd); ett dok kan vara `stable` OCH `paused`.
  Bryter ADR-030:s status-semantik.
- **Sessionsdok in i FRONTMATTER_GOVERNING_DOCS + ny check.** Förkastat: governing-
  regimens `review_by`/`updated`-checkar fäller immutabla arkiverade sessionsdok över
  tid (ADR-023-immutabilitet, ej lagbart) — latent grind-skuld inbyggd från dag ett.
  Den dedikerade lätta grinden undviker det.
- **Ren konvention, ingen grind.** Förkastat: ett oläst/ovaliderat fält driftar
  (felstavning, fel enum-värde) — passiv struktur, exakt det fältet ska bota.
- **Livscykel kvar enbart i prosa (status quo).** Förkastat: A1/A2-forkens rotorsak
  (L119); Marcus pushback.

## Konsekvenser

**Positivt:** livscykel blir O(1)-läsbart i frontmatter; skill-ägt → drift-fritt;
ortogonaliteten mot `status:` bevarad; additivt fält → ingen migrering, befintliga dok
orörda.

**Negativt / risker:** nytt fält + ny grind = nya rörliga delar (mitigeras: grinden är
minimal — enum + konsistens, ingen tung governing-regim); fältet blir tillgång först när
skill-editsen landar (efterföljande inkrement) — tills dess är det en deklaration utan
ägare; applicering på övriga dok-populationer kvarstår som framtida, frivilligt val.

**Reversibelt:** fält, grind och skill-edits är repo-källade projektioner.

## Forskningsgrund

- Veeva Vault (platform.veevavault.help — Document Lifecycles / Lifecycle States):
  branschstandard-DMS modellerar livscykel-states som förstaklass-konstruktion, skild
  från en separat kvalitets/status-flagga.
- InfoWorld (2025-11, "separating metadata and content"): nytt metadata-attribut läggs
  additivt/valfritt (schema-on-read) — befintliga poster fortsätter fungera utan det.
- Statechart orthogonal regions: två oberoende tillstånds-axlar modelleras i separata
  regioner, ej hopslagna i ett tillstånd.
- Intern: ADR-030 (frontmatter-konvention + status-enum), ADR-051 (paus-verb + beslut 4
  innehållsgräns), L119 (asymmetrisk/implicit axel = drift-källa).

## Relaterade ADR:er

- ADR-030 (frontmatter-konvention + status-enum) — `lifecycle:` är ett ortogonalt
  komplement; `status:` lämnas orört.
- ADR-051 (session-paus) — beslut 4 satte "status → PAUSED" i prosa; ADR-052
  formaliserar det till ett fält. Skill-ägarskapet (beslut 3) speglar ADR-051:s
  skill-arkitektur.
- ADR-043 (lifecycle-skill-arkitektur) — fältet är den durabla projektionen av
  lifecycle-verbens tillstånd.
- ADR-023 (sessions-arkivering) — immutabiliteten som motiverar beslut 4:s
  grind-separation.
- ADR-039 (ADR-räkning) — rot-README-räknaren bumpas 51→52 vid denna ADR:s landning.
