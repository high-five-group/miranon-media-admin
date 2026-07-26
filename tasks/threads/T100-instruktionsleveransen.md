---
owner: marcus803
updated: 2026-07-27
review_by: 2026-10-27
status: stable
lifecycle: active
---

# T100 — Instruktionsleveransen: fyra artefakter konstitutionen bygger på men aldrig får

> Tråd-kort (ADR-053). Född 2026-07-27 i S91 ur ett research-pass om
> agent-instruktionsfilers branschpraxis — passet rapporterade en avvikelse
> ("cache-sökvägen finns inte") som vid verifiering visade sig vara ett
> strukturfel med mycket bredare räckvidd än den fil passet granskade.
> Commit-tagg: `[T100]`.
>
> ADR-053-triage: **blockerar ej + högt värde → tråd.** Blockerar inte pågående
> arbete, men urholkar tyst varje beslut som konstitutionen förutsätter ska
> filtreras genom artefakterna.

## Ursprung

Marcus fråga i S91: *"Du har ju också ändrat/lagt till saker i CLAUDE.md. Det vet
jag inte heller om det var branschledarmässigt, var det inte det så ska det
utredas."*

Passet som beställdes granskade hubbens nyskrivna §6 i
`templates/code-role-discipline.md`. Det rapporterade i förbigående att filen
inte fanns på den cache-sökväg det fått. Verifieringen av den avvikelsen
avtäckte fyndet nedan.

Marcus efterföljande fråga — *"har du dokumenterat det ordentligt, alltså riktigt
ordentligt så vi kan lösa det branschledarmässigt?"* — besvarades med **nej**,
och detta kort är åtgärden.

## Fyndet

**Fyra artefakter som hub-`CLAUDE.md` refererar levereras aldrig till en
Claude Code-session.**

|Fil|Rader|Vad konstitutionen säger om den|
|---|--:|---|
|**`IDENTITET.md`**|312|*"IDENTITET.md är filtret vid tvivel. När du är osäker på om något bör byggas, elimineras eller bevaras — konsultera de tre motorerna, grundfundamenten och Fem Kvaliteter. **Utan identitetsfilter blir Kaizen drift.**"* (rad 190)|
|`profile.md`|307|*"Komplett profil: Se `profile.md` i marcus-system för djup profilkarta (identitet, drivkrafter, kompetensmatris 1–5, beslutsfilter, vision)."* (rad 16)|
|`templates/code-role-discipline.md`|249|*"Full code-roll-disciplin (handover-protokoll, transparens-rapport-format, STOPPA-grindar som procedursteg) bor i `templates/code-role-discipline.md`; denna sektion bär principen, templaten bär stegen (ADR-042)."* (rad 53)|
|`schema_reference.md`|—|*"Formler och fält → läs `schema_reference.md` + `field_lookup.json` innan du säger 'fältet verkar bruten'"*. **Ligger dessutom i det FRYSTA Vue-repot** (`~/Repon/miranon-media-os/docs/`), inte i marcus-system.|

Samtliga filer **existerar** — det är inte döda referenser. De når bara aldrig
fram av sig själva.

## Verifieringsmetod (reproducerbar)

Tre oberoende kontroller, körda 2026-07-27:

```bash
# 1. Levereras filen med pluginet?
find ~/.claude/plugins/cache/marcus-hub -name "code-role-discipline.md"
#    → noll träffar över SAMTLIGA cachade versioner

# 2. Vad levererar pluginet faktiskt?
find ~/.claude/plugins/cache/marcus-hub/marcus-system/1.20.2 -maxdepth 2 -type d
#    → endast .claude-plugin/ + skills/ (19 skills). Ingen templates/, inga rot-md.

# 3. Importerar hub-CLAUDE.md dem?
grep -nE "^@|@templates|@/" ~/Repon/marcus-system/CLAUDE.md
#    → ingen @-import. Referenserna är ren prosa.
```

Svep över alla `.md`-referenser i hub-`CLAUDE.md` mot plugin-cachen ger de fyra
filerna ovan som ej levererade.

## Konsekvens

**ADR-042:s konstruktion är bruten i praktiken.** Uppdelningen "konstitutionen
bär principen, templaten bär stegen" förutsätter att båda når fram. Stegen gör
det aldrig. Filen har underhållits `v1.0 → v1.3` utan att läsas.

**Allvarligast: identitetsfiltret är frånvarande.** Konstitutionen kräver att
`IDENTITET.md` konsulteras vid varje tvivel om något bör byggas, elimineras eller
bevaras — och varnar uttryckligen att frånvaron ger drift. I S91 fattades ett
dussin sådana beslut utan att filen någonsin öppnades, därför att den för agenten
bara var ett namn i en mening.

**Detta är en skarpare form av vad §6-passet fann.** Passet konstaterade att §6
låg i *fel lager* — prosa-regler som borde mekaniserats, med mätdata på ~0 %
efterlevnad av skriven processregel mot 75 % när verktyget faktiskt togs bort.
Här är det ett steg värre: regeln är inte svag kontext, den är **ingen kontext
alls**.

## Vad som INTE är utrett — och ska vara det före åtgärd

**Ett research-pass ska köras FÖRE alternativen värderas.** Att lista lösningar
ur eget huvud var precis felet som avtäcktes två gånger tidigare i S91
(verktygsvalen, §6:s tillkomst). Passets fråga:

> Hur levererar branschledare instruktionskontext till kodagenter — vad hör hemma
> i en alltid-laddad fil, vad i en on-demand-läst artefakt, vad i
> verktygskonfiguration, och vad i agentdefinitioner?

Vad passet måste besvara:

1. **Anthropics egen mekanik för Claude Code:** `@`-import i `CLAUDE.md`, plugin-
   distribution, `.claude/agents/`-definitioner, skills, `settings.json`. Vad är
   avsett för vad?
2. **Konfiguration kontra kunskap kontra självdisciplin** — den distinktion som
   framkom i S91: regler om *vem som får göra vad* bör mekaniseras
   (`disallowedTools`, `permissions.deny`, `PreToolUse`-hook, `isolation`,
   `maxTurns`); *kunskap* (vad en bra brief innehåller) kan bo i fil; ren
   *självdisciplin i prosa* har nära noll effekt. Var går gränserna i praktiken?
3. **Kontextbudget:** fyra filer à ~870 rader kan inte alla alltid-laddas. Vad
   säger praxis om progressiv disclosure och on-demand-hämtning?
4. **Identitets-/profilkontext specifikt:** hur bär andra långlivade agent-
   uppsättningar användarprofil och värdefilter? Tunn precedent deklareras öppet.

## Åtgärdsalternativ — passet är kört, värderingen finns i det

> **Status 2026-07-27 (S91-resumen):** passet nedan är **KÖRT** och landat i
> [`instruktionsleverans-branschpraxis-2026-07-27.md`](../../docs/research/instruktionsleverans-branschpraxis-2026-07-27.md).
> Villkoret "ingen åtgärd innan passet är läst" är därmed uppfyllt. Alternativen
> står kvar oredigerade nedan som historik; deras värdering mot belägget bor i
> passet, inte här. **Beslutet är Marcus och är ännu inte taget.**
>
> **Premiss-korrigering (verifierad på disk):** `~/.claude/CLAUDE.md` är en
> **symlänk** till `~/Repon/marcus-system/CLAUDE.md`. "Hub-`CLAUDE.md`" och
> användar-scope-filen är alltså samma fil, och den laddas varje session.
> Fyndet står oförändrat — de fyra refererade artefakterna når fortfarande
> aldrig fram — men åtgärdsrymden är en annan än kortet antog.

Antecknade för att inte tappas, uttryckligen **inte** en rekommendation:

- lägg `templates/` och rot-`.md` i plugin-distributionen så de når cachen;
- `@`-importera från hub-`CLAUDE.md` så de alltid laddas (kostar kontextbudget);
- flytta reglerna till **agentdefinitioner** som bär dem som systemprompt;
- mekanisera det mekaniserbara och behåll bara kunskapen i fil;
- avveckla artefakter som ingen läser och flytta innehållet dit det faktiskt når.

**Ingen åtgärd tas innan passet är läst.** Det gäller även den till synes
självklara `@`-import-vägen.

## Bredare fråga tråden bär

Marcus formulerade den i S91: använder frontier-utvecklare instruktionsfiler på
det här sättet över huvud taget, eller är de i stället skickliga *operatörer* som
vet vilka kommandon, lägen och delegerings-former som finns och väljer rätt i
stunden?

Passets fynd stödjer delvis skepsisen. Och Code:s eget erkännande hör till
tråden: under S91 kördes sex sekventiella research-agenter, medan `/work-batch`,
ultracode, `Workflow` och plan mode aldrig användes — verktyg som fanns
tillgängliga hela tiden. Arbetet utfördes som regelföljning, inte som
verktygsbehärskning.

Om slutsatsen blir att operatörsskicklighet väger tyngre än skrivna regler, är
konsekvensen för hela konstitutionen större än denna tråds fyra filer.

## Nästa steg

1. Kör research-passet enligt frågan ovan.
2. Värdera alternativen mot passets fynd.
3. Åtgärda, och verifiera **mekaniskt** att artefakterna faktiskt når en session
   — samma tre kontroller som i verifieringsmetoden ovan, som grind eller manuell
   checklista.
4. Väg in om `IDENTITET.md` bör vara alltid-laddad (den är ett beslutsfilter, inte
   uppslagsverk) medan övriga blir on-demand.

## Trail

- **2026-07-27 (S91-resumen):** **research-passet KÖRT** och landat i
  [`instruktionsleverans-branschpraxis-2026-07-27.md`](../../docs/research/instruktionsleverans-branschpraxis-2026-07-27.md)
  (641 rader). Passets bärande claims **efterverifierade av Code** mot
  förstapartskällan innan de fördes vidare — samtliga höll:
  - *"A `CLAUDE.md` file at the plugin root is not loaded as project context.
    Plugins contribute context through skills, agents, and hooks rather than
    CLAUDE.md."* + *"Installed plugins cannot reference files outside their
    directory."* (`code.claude.com/docs/en/plugins-reference`) — **river
    alternativ 1**: filen i cachen är inte filen i sessionen.
  - *"imported files load at launch"* → `@`-import **sparar ingen kontext**;
    *"CLAUDE.md content is delivered as a user message after the system prompt"*
    → agentdefinitionens kropp är ett starkare lager än CLAUDE.md
    (`docs/en/memory`).
  - `~/.claude/rules/` finns som mekanism och laddas **ovillkorligt** utan
    `paths`-frontmatter — en väg kortet inte kände till. Katalogen finns **inte**
    på maskinen (verifierat), liksom `~/.claude/agents/`.
  - `InstructionsLoaded`-hooken finns och är **exakt** den mekaniska
    verifierings-grind steg 3 nedan efterlyser (`docs/en/hooks`); dokumentationen
    rekommenderar den uttryckligen för detta.
  - 200-raders-riktvärdet är **publicerat** förstaparts (*"target under 200 lines
    per CLAUDE.md file"*) — men dess empiriska grund är fortsatt odokumenterad,
    och faktorstudien som finner noll effekt av filstorlek står kvar.
  Ingen åtgärd vald — **beslutet är Marcus**.
- **2026-07-27 (S91):** tråden född. Fyndet verifierat i tre kontroller,
  omfattningen utvidgad från en fil till fyra efter Marcus fråga om
  dokumentationens kvalitet. Research-passet formulerat men **ej kört** — Marcus
  beslut: hela paketet tas som första punkt i nästa resume.
  Kontext: sessionsdok S91 Del 7 + PAUSLÄGE §
  "KRITISKT FYND", och
  [`agent-instruktionsfiler-branschpraxis-2026-07-27.md`](../../docs/research/agent-instruktionsfiler-branschpraxis-2026-07-27.md).
