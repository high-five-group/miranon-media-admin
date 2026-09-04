# ADR-048: Synk-horisont — arkivmaterial exkluderas ur projektkunskapen men förblir i git

- **Status:** Accepted
- **Datum:** 2026-06-13
- **Fas:** Mellanfas (Session 17 — repo-hygien, mellan Fas 5 och Fas 5.5)

## Kontext

claude.ai-projektkunskapen (Chat-ytans synk av detta repo) låg på 91 % av
sin kapacitet. Forensisk inventering (orienterings-pass 2026-06-12, HEAD
4254b90) visade: total spårad textvolym ~4,2 MB, varav 37 % är rena
arkiv-/historikkataloger — tasks/sessions/archive/ ensam 31 %, docs/archive/
4,3 % — och package-lock.json 8,9 %. Räknas avslutad research in är nästan
halva synkvolymen historik. Git-historiken är INTE problemet (synken läser
arbetsträdet via GitHub-remoten; gitignorerat material synkas aldrig).

Två krav styrde lösningen: (1) ingenting lämnar git — "alla projektfiler
lever i git, git är sanningskällan" (hub-princip) och ADR-023 binder
sessionsarkivet till repot; (2) exkludering ur synken får inte bli en tyst
minnesförlust för framtida Chat-sessioner — en session som söker
projektkunskapen och får noll träffar på historiskt material måste kunna
skilja "finns inte" från "finns, men utanför min synk-horisont".

Sekundärt empiriskt fynd (Session 16/17): arkivmoget material som ligger
kvar i lint-/lychee-scope kostar löpande underhåll (länk-lagningar i frusna
leveranser) — arkivering till docs/archive/ (utanför grind-scope) eliminerar
den bördan.

## Beslut

1. **Exkluderas ur projektkunskaps-synken** (claude.ai-inställning,
   Marcus-moment): `tasks/sessions/archive/`, `docs/archive/`, samt
   `package-lock.json` om fil-nivå-urval finns. Allt förblir spårat i git.
2. **Åtkomstregel (pekar-arkitekturen):** historik utanför synk-horisonten
   nås av Chat VIA CODE (LÄS→RAPPORTERA mot lokal disk/git) eller genom
   att Marcus klistrar innehållet. Noll träffar i projektkunskapen på
   historiskt material betyder inte att det saknas. Regeln bärs av tre
   synkade ytor: spoke-CLAUDE.md (§ Synk-horisont och arkiv-åtkomst),
   PI-deltat och denna ADR — plus README:er i arkivrötterna för mänskliga
   läsare.
3. **Villkorad framtida exkludering:** `docs/research/` (11,8 %) behålls i
   synk så länge Fas 6 pågår (sub-faserna konsumerar researchen aktivt,
   bl.a. 07-migration-plan.md som styr strangler-fig-ordningen) och
   exkluderas vid Fas 6-avslut.
4. **Struktur-flyttar (Session 17):** tre avslutade direktivfiler
   tasks/ → docs/archive/ (f343db3); docs/logs/ avvecklad → docs/archive/
   (39fe4ba); datamodell-research-katalogen in under sessions-arkivets
   månadsmönster (43648af); docs/analysis/ avvecklad — samtliga 5 filer
   → docs/archive/ med levande pekare (byggplan-DoD + Status.ts-kommentar)
   uppdaterade atomiskt (4550886). Inga filnamn ändrade; immutabla
   pathcitat i frusen trail orörda per ADR-021/ADR-023-disciplin.
5. **Git-historiken skrivs inte om** — filter-repo o.dyl. uttryckligen
   avvisat; historikens vikt påverkar inte synken.

## Alternativ som övervägdes

**Arkiv enbart lokalt (utanför git).** Avvisat: bryter git-som-
sanningskälla-principen och skapar single point of failure; löser
dessutom inte rätt problem.

**Separat arkiv-repo.** Reserv, inte huvudval: katalog-exkludering i
synk-inställningen ger samma effekt utan cross-repo-flyttar. Aktualiseras
om synk-taket nås igen trots exkluderingarna.

**Git-historik-bantning (filter-repo).** Avvisat: krymper .git men ändrar
inte en byte av det som synkas — fel måltavla, hög risk.

## Konsekvenser

**Positiva:** ~46–47 % av synkvolymen frigörs (ytterligare ~12 % vid
Fas 6-avslut via punkt 3); arkivmaterial blir underhållsfritt (utanför
markdownlint-/lychee-scope); repostrukturen samlar allt avslutat under
docs/archive/ respektive sessions-arkivet.

**Negativa/risker:** Chat ser inte arkivinnehåll direkt — mitigeras av
pekar-arkitekturen (punkt 2); synk-inställningen i claude.ai är manuell
konfiguration som Marcus måste underhålla när nya arkivkataloger
tillkommer; exkluderingslistan här och inställningen i claude.ai kan
drifta isär — vid ändring uppdateras båda.

## Updates

### 2026-08-24 (S112) — claude.ai-projektkunskapen avvecklad, beslutet historiskt

Marcus i klartext (S112, `TASK-318`): *"Kör inte med Claude.ai längre."*

Detta ADR:s hela beslut (punkt 1–3, 5) styrde synken mot en läsyta som inte
längre är i drift. Konsekvensen:

- **Synk-exkluderingarna (punkt 1) är moot** — det finns ingen aktiv synk
  kvar att exkludera material ur.
- **Pekar-arkitekturen (punkt 2)** — regeln att historik hämtas VIA CODE
  eller genom att Marcus klistrar innehåll — överlever som GENERELL princip,
  oberoende av claude.ai. Den flyttades till spoke-`CLAUDE.md`
  § Synk-horisont och arkiv-åtkomst i samma landning som denna post, formulerad
  yta-neutralt.
- **Villkorad framtida exkludering (punkt 3, `docs/research/` vid
  Fas 6-avslut)** är moot av samma skäl — det finns ingen synk att exkludera
  ur när Fas 6 avslutas.
- **Struktur-flyttarna (punkt 4)** är opåverkade — de gäller filers plats i
  git, inte synken, och står kvar som utförd historik.
- **Beslutet i sin helhet klassas historiskt.** Innehållet rivs inte —
  samma "omge, riv inte"-mönster repot använder på andra frusna beslut
  (jämför `docs/reference/schema_reference.md` "historisk karta"-markeringen).

Ingen ny ADR mintas för detta — avvecklingen är en konsekvens att bokföra,
inte en ny avvägning (ADR-BAR, `~/.claude/CLAUDE.md` § Instruktioner).
