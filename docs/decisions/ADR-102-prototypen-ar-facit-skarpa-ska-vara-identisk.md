# ADR-102: Prototypen ÄR facit — skarpa bygget ska vara identiskt, och prototypen rivs först efter Marcus godkännande

- Status: Accepted (Marcus-order 2026-08-07, S93 Del 11)
- Datum: 2026-08-07
- Fas: Session 93, PRD `TASK-145`/`TASK-146`

## Kontext

Marcus ord som utlöste beslutet, verbatim:

> *"INGEN prototyp raderas förens jag godkänt att det skarpa bygget är EXAKT
> som prototypen."*

och

> *"Prototypen ÄR facit, finns ju inget annat som skulle kunna vara facit.
> Prototypen och skarpa version ska vara IDENTISKA det är ju för tusan hela
> poängen med att bygga en prototyp."*

Bakgrunden är att eventsidans ombyggnad (`TASK-145`, sex skivor) landade en
skarp yta som **inte** är identisk med den prototyp Marcus låste som facit
2026-08-06 (*"Jag är nöjd. Lås som facit."*). Divergensen upptäcktes först när
Marcus ifrågasatte varför ett designval ens var en fråga.

**Den mätta divergensen**, `src/components/events/EventDetail.tsx` rad 284–290:

```tsx
{isHallplatsVariant(variantParam) ? (
  <AtgarderKort />            // prototypen: EN knapp, "Gå till åtgärder"
) : (
  <Atgarder eventId={eventId} />   // skarpa: den gamla listan
)}
```

Prototypen bär Marcus order från 2026-08-05 (*"Åtgärdsgruppen högst upp måste
in på åtgärdssidan… en likadan 'knapp' som 'Gå till check-in' som heter 'Gå
till åtgärder'"*), citerad ordagrant i `Atgarder.tsx` § `AtgarderKort`. Den
skarpa vyn bär den inte. En agent landade dessutom ett **tredje** läge — fyra
rader rivna och omnumrerade — som varken är prototypen eller det passerade
utgångsläget.

### Rotorsakerna — samtliga mätta 2026-08-07

**R1. Facit försvinner i skill-kedjan.** Facit-bilderna föds i
prototyp-passet. Räknat i plugin `marcus-system@1.29.0`:

| Skill | Riktiga omnämnanden av facit/bild/screenshot |
|---|---|
| `/to-prd` | **0** (enda grep-träffen är ordet *"förebilder"*) |
| `/to-issues` | **0** |
| `/do-work` | **0** |

Kedjan `prototyp → /to-prd → /to-issues → agent` tappar facit i första
översättningen och återfår det aldrig. Skillen som SKRIVER acceptanskriterierna
vet inte att bilderna existerar och kan därför inte peka på dem.

**R2. Acceptanskriterierna beskriver problem i stället för mål.** Följden av
R1. `TASK-145.5` AC #4 lyder *"Åtgärds-radernas grå löften är hanterade"* — en
problembeskrivning. Den säger vad som är fel, aldrig hur ytan ska bli. En
mottagare som löser den beskrivna defekten kan landa godtycklig form och ändå
uppfylla kriteriet bokstavligt.

**R3. Facit-granskningen är en bock utan spärr.** DoD-posten *"Design-review
mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet"* stod
**okryssad** på BÅDA de landade skivorna (`TASK-145.3` `#929`, `TASK-145.5`
`#933`) — och båda landade gröna. Ingen mekanism i huset fäller en skiva vars
facit-granskning uteblivit. Samma `ADR-083`-klass som resten av repot bekämpar:
en text som utlovar en täckning ingen mekanism håller.

**R4. Facit går att förväxla med icke-facit.** `tasks/sessions/bilagor/s93-hallplats-prototyp/`
innehåller tretton `.png` i EN katalog, utan åtskillnad annat än ett prefix:

| Mönster | Datum | Status |
|---|---|---|
| `konvergens-a-*.png` | 2026-08-05 | passerat mellansteg, **före** låsningen |
| `facit-*.png` | 2026-08-06 | **låst facit** |

Elva iterationsvågor (10–20) ligger mellan dem. Förväxlingen är belagd skarpt:
orkestreraren öppnade `konvergens-a-markera-atgarder.png`, kallade den facit
inför Marcus, och byggde en slutsats på den — tjugo minuter efter att ha
beskrivit exakt den felklassen för honom, och en dag efter att själv ha skrivit
lärdomen `tasks/lessons.d/uppdragets-kallmarkning-maste-avse-gallande-text.md`
(*"Föråldrat citat som gällande facit"*). **Att lärdomen fanns nedskriven
räckte inte** — vilket är hela argumentet för att facit måste bäras av en
mekanism, inte av minne.

**R5. Facit-täckningen är ofullständig och det syns inte.** Det finns
`facit-*.png` för anteckningar, betalningar (×2) och gruppdynamik — **ingen för
åtgärds-ytan**. Ingenting deklarerar vilka ytor som HAR låst facit, så en
frånvaro är omöjlig att skilja från ett förbiseende.

**R6. "Frågan är besvarad" är odefinierat.** `/prototype` föreskriver *"radera
eller absorbera när frågan är besvarad"* (SKILL.md rad 138, throwaway-kontraktets
klausul iv) utan att definiera villkoret som *"Marcus har jämfört skarpa mot
prototypen och godkänt"*. Följden: rivningen schemalades som en vanlig skiva
(`TASK-145.6`) i beroendekön i stället för som en spärr efter godkännande.

**R7. Prototyp och skarpa delar kod i samma filer.** Mätt över
`src/components/events/`: **sju filer**, ~106 grenar på
`isHallplatsVariant`/`protoAktiv`/`protoDataMode`/`variantParam`.

| Fil | Träffar |
|---|---|
| `detail/Betalningar.tsx` | 44 |
| `detail/Deltagare.tsx` | 21 |
| `detail/Anteckningar.tsx` | 14 |
| `detail/Gruppdynamik.tsx` | 10 |
| `detail/Belaggning.tsx` | 10 |
| `EventDetail.tsx` | 4 |
| `atgarder/AtgardsSida.tsx` | 2 |

Formen valdes medvetet (`ADR-074`, växlar-standarden) för att Marcus ska kunna
växla live och jämföra. Priset är att rivning är riskabel: `protoAktiv`
defaultar till `false` (`Betalningar.tsx:424`, `:555`), så att enbart ta bort
propen flippar betalningsytan tillbaka till skrivbar form — och tre block
(`Belaggning`, `Anteckningar`, `Gruppdynamik`) läser `?variant` oberoende, så
en halv rivning ger blandläge. Priset är också att "identisk" inte kan
verifieras genom att jämföra två filer; det kräver jämförelse av två
renderingar.

**R8. Ingen mekanisk jämförelse mellan prototyp och skarpa existerar.** Ingen
grind renderar båda och fäller på skillnad. Den visuella regressionsvakten
(`npm run test:visual`) jämför mot en baslinje som är stale sedan FÖRE `145.1`
— `eventsida-visual-desktop-linux.png` visar `Obekräftade anmälningar`,
accordion-paret och ett eget Betalningar-block, alltså en sida som inte längre
finns. `*-darwin.png` är gitignorad (`.gitignore:97`), så posten kan bara
betalas ur en CI-artefakt.

**R9. Skivsnittet följde funktionsytan, inte facit.** `145.1` och `145.3` såg
ut som två skivor men var en gren i koden (`Deltagare.tsx:1652` + `:2103`).
Åtgärds-ytan fick ingen egen skiva alls — den hamnade som en delmening i
`145.5` AC #4. En yta som skiljer sig från facit måste ha en skiva som ÄGER
den, annars finns ingen post där avvikelsen kan upptäckas. Besläktat fragment:
`tasks/lessons.d/skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md`.

## Beslut

**B1. Prototypen ÄR facit.** När ett konvergens-pass avslutats med Marcus
låsning är den låsta prototypen den auktoritativa beskrivningen av ytan —
överordnad varje AC-text, skärmbild eller prosabeskrivning som säger något
annat. Vid motsägelse mellan prototyp och kravtext vinner prototypen, och
kravtexten är buggen.

**B2. Skarpa bygget ska vara IDENTISKT med prototypen.** Inte "likvärdigt",
inte "i samma anda". Avsteg är tillåtna endast som ett uttryckligt, bokfört
Marcus-beslut — aldrig som en agents eller orkestrerares tolkning.

**B3. Prototyp-kod rivs ALDRIG före Marcus godkännande.** Villkoret för
rivning är att Marcus sett skarpa och prototypen bredvid varandra och sagt att
de är identiska. Detta ersätter `/prototype`-skillens odefinierade *"när frågan
är besvarad"* för UI-grenen. En rivnings-skiva får inte schemaläggas som en
vanlig beroendepost i kön.

**B4. Ordningen är omvänd mot vad som skedde.** Rätt sekvens:

1. Skarpa görs identisk med prototypen
2. Marcus jämför sida vid sida
3. Marcus godkänner
4. **Först då** rivs prototyp-substratet

**B5. En yta med låst facit ska ha AC som PEKAR på facit**, inte beskriva en
delförändring. Formen är *"ytan är identisk med prototypen i läge X"*, inte
*"defekt Y är hanterad"*.

## Konsekvenser

- `TASK-145.6` (prototyp-substratets rivning) är **blockerad** tills B3:s
  villkor är uppfyllt. Kortet får inte plockas som en vanlig ready-for-agent-post.
- Eventsidans skarpa yta är i känt avvikande läge mot facit. Avvikelserna måste
  kartläggas och åtgärdas innan godkännande kan ges; åtgärds-ytan är den enda
  hittills BELAGDA, men frånvaron av en fullständig jämförelse (R8) betyder att
  listan inte kan antas vara komplett.
- R1–R6 kräver ändringar i hub-pluginets skills (`/to-prd`, `/to-issues`,
  `/prototype`) och i spokens DoD-mall. De är **inte** utförda av denna ADR —
  den slår fast principen; mekaniseringen bokförs separat och ska inte
  förväxlas med att problemet är löst.
- R7 rivs inte retroaktivt. Den delade formen är `ADR-074`:s medvetna val och
  bär ett verkligt värde (live-jämförelse). Beslutet här ändrar bara NÄR
  rivningen får ske, inte HUR prototypen byggs.

## Vad som INTE beslutas här

- **Om variant-formen ska överges för framtida prototyper.** R7 beskriver dess
  pris, men alternativet (separata filer/routes) har en egen kostnad —
  jämförelsen blir svårare, inte lättare — och kräver en egen avvägning mot
  `ADR-074`.
- **Hur den mekaniska prototyp-mot-skarp-jämförelsen (R8) ska byggas.** Att den
  BEHÖVS följer av B2; formen är ospecificerad.
- **Vad facit är för ytor som saknar `facit-*.png` (R5).** För åtgärds-ytan har
  Marcus svarat att prototypen gäller. Generellt förblir frågan öppen.
