---
owner: marcus803
updated: 2026-07-31
review_by: 2026-10-31
status: stable
lifecycle: paused
---

# T110 — Går orkestrerarens fel att mekanisera bort?

> **Registrerad 2026-07-31 (S91, nittonde resumen) på Marcus fråga:** *"Har vi
> tillräckligt med empiri för att mekanisera bort orkestrerarens fel tror du?
> Det är en bra uppgift för agenter i nästa resume att titta på."*
>
> **Frågan är registrerad, inte besvarad.** Denna fil bär empirin och
> klassningen så att en utredning slipper rekonstruera dem — inte en föreslagen
> lösning. Trådens form väljs efter utforskning.

## Varför frågan uppstod

Sessionsdok S91 **Del 36.2** bokförde ett mönster som sedan upprepats:

> *"Felen uppstår i **orkestreringen**, inte i utförandet. Agenterna arbetar mot
> ett kontrakt med explicita AC och DoD och en grind som prövar dem.
> Orkestreraren arbetar mot sitt eget omdöme — den empiriskt svagaste mekanismen
> vi har, och den enda som saknar en grind."*

Under den nittonde resumen (2026-07-31) levererade **femton agenter**.
Orkestreraren gjorde **fem fel**, samtliga fångade av agenter och **noll av
Marcus**. Mönstret höll alltså en tredje gång.

## Empirin — cirka fjorton instanser över tre resumer

Källor: sessionsdok S91 **Del 35.4** (tre fel), **Del 36.2** (sex fel, kvällens
facit), **Del 38.6** (fem fel). Instanserna nedan är de som går att belägga ur
doken; listan är inte hävdad som uttömmande.

### Klass A — mätning med ett instrument som ser EN form men inte alla

| Instans | Vad instrumentet missade |
|---|---|
| `[UNIVERSAL]`-räkningen 59 mot verkliga **72** | grep såg rubrikraden; 13 poster (`L347`+) bär markören på egen rad under den feta titeln |
| Trådregistrets grovmätning: 110 rader / 14 `active` mot verkliga **109 / 13** | räknade tillstånds-orden var som helst på raden i stället för i tillståndskolumnen — registret nämner dem i löptext |

**Klassen är INTE orkestrerar-specifik — den är instrument-specifik.** Två
agenter gjorde samma fel samma dag: `git log --name-status` tappade **145 av
179** kort eftersom sökvägar med icke-ASCII citeras (`TASK-102`), och
`grep -l 'Deno\.'` klassade en fil på en **kommentar** (`TASK-103`). Båda
utfallen såg trovärdiga ut — `n=23` med rimlig fördelning i det första fallet.

**Det är klassens farlighet: ett mätfel som producerar ett trovärdigt resultat.**

### Klass B — en referens som skickas vidare utan att ha lästs

| Instans | Verkligheten |
|---|---|
| Uppdrag pekade ut en deny-smoke-testfil | `git log --all --diff-filter=A` över hela historiken: **noll träffar**, filen har aldrig funnits |
| *"nio grindar"* tillskrivet `CLAUDE.md` | Raden står i `.claude/agents/bygg-agent.md:55` — agenternas egen systemprompt, vilket förklarar tre oberoende rapporter |
| Ett SHA vars 33 sista tecken fylldes på ur ingenting | Vakten matchade noll objekt ⇒ **fail-open**, rapporterade "klart" utan att ha väntat (Del 35.4) |
| `TASK-98`-kortet: self-testen *"rad 623"* | Faktisk rad **674** |
| `lessons-hub-sync`-skillen: *"hub-CLAUDE.md rad 507-526"* | Filen är **196 rader** och saknar rubriken; den flyttades i `2a4a8c7` |

### Klass C — ofullständig läsning av ett kontrakt

Stängningen 2026-07-30 läste kortens **AC** (noll) och drog slutsatsen att inget
återstod. **DoD-blocket lästes aldrig** — och två punkter per kort var *Marcus
design-review*. Fångat av `TASK-90`:s grind, som fällde sin egen orkestrerare
(Del 36.1). Samma klass: *"tre äkta fel"* rapporterat 2026-07-31 där agentens
rapport sade **fem**.

### Klass D — slutsats generaliserad ur för få observationer

Påståendet att `autoMergeRequest` alltid är `null` under en merge queue landade i
`CLAUDE.md` ur **två** observationer som mätte fel sak — den ena togs post-merge,
då fältet nollas oavsett. Motbevisad av `#475`, PR:en som bar texten (Del 35.4).

## Det strukturella skälet till att grinden saknas

**Grindarna kör på commits. Orkestrerarens fel sitter i uppdragstexten, som
aldrig committas** — den går direkt till en agent och försvinner med sessionen.
En grind som ska fånga dem måste därför sitta i **uppdrags-ögonblicket**, inte i
landnings-ögonblicket. Det är en annan mekanism-klass än allt som byggts hittills.

Närmast liggande befintliga familj är `T108`:s hooks (`Stop`/`SubagentStop`), men
den bär ett känt hinder: **hooks kan inte distribueras via pluginet** (de tappas
tyst), så formen måste bo per repo och driver isär över tid.

## ⚠️ Empirins systematiska lucka — läs denna före något byggs

**Vi mäter fångade fel, inte begångna.**

Samtliga fem fel under nittonde resumen fångades av agenter som följde **regeln**
i sitt uppdrag i stället för **talet** orkestreraren gav dem. Hur många fel som
INTE fångades är omätt. Vi vet inte heller om fångsterna var tillförlitliga eller
lyckosamma — hub-lyftets agent räddade 13 poster just för att uppdraget råkade
formulera regeln före talet.

Detta är samma svaghet all incidentstatistik bär: **nämnaren är okänd.** En
mekanism designad mot en okänd nämnare riskerar att optimera fel sak.

Dessutom: n ≈ 14, från **en** orkestrerare i **en** session över tre resumer.
Det är inte oberoende data.

## Vad en utredning bör avgöra

1. **Är klassningen ovan rätt?** Den är gjord av den som begick felen — det är
   precis den granskning som empiriskt är svagast. Pröva den mot doken.
2. **Går nämnaren att uppskatta?** Finns en väg att mäta begångna fel, inte bara
   fångade? Utan den kan ingen effektsiffra hävdas.
3. **Klass B ser nästan trivialt mekaniserbar ut** — en pre-flight som validerar
   varje fil-, rad- och SHA-referens i ett uppdrag mot disk **innan** agenten
   spawnas. Håller det vid granskning, eller finns ett hinder?
4. **Klass A kräver korsvalidering av mätningar** (två oberoende metoder innan
   ett tal skickas vidare). Är det görbart för specifika mätklasser, eller blir
   det en regel utan mekanism — den form `L328` visade inte efterlevs?
5. **Klass C och D är omdömesfel.** Är de mekaniserbara alls, eller ska de
   hanteras av kontrakts-design i stället?
6. **Vad kostar mekanismen?** En pre-flight på varje agent-spawn har en
   latenskostnad som ingen mätt.

## Släktskap

`T108` (hook-familjen — närmaste mekanism-klass, och dess distributionshinder) ·
`ADR-083` (prosa som påstår mekanism — klass B är dess syskon) ·
`TASK-90` (stängnings-grinden, den enda mekanism som hittills fällt
orkestreraren) · `L328` (en regel utan mekanism efterlevs inte).
