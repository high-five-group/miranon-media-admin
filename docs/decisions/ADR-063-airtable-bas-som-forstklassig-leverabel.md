# ADR-063: Airtable-basen som förstklassig leverabel — maximering till 11/10, ej ersättning

- **Status:** Accepted
- **Datum:** 2026-06-25
- **Fas:** Projekt-grundande (gäller hela appen + dess datakälla; konsumeras av post-Fas-6-maximerings-milstolpen)
- **Relation:** Förfinar ADR-062 (korrigerar dess maximerings-princips premiss — se Öppen rivning nedan)

> **S81-not (2026-07-24, additiv — ursprungstexten orörd): samdesign-poster
> vid milstolpens dekomponering.** När maximerings-milstolpen dekomponeras
> (grillning → kort) ska två vilande trådar tas med i samma pass, båda med
> denna milstolpe som namngiven trigger: **T85 våg 3** (staging-per-run-
> isolering — mutexen avvecklas; samdesignas med basens datamodell-arbete)
> och **T87** (visual-grindens aktivering — trigger-kandidaten "UI-takten
> lugnar" sammanfaller naturligt med milstolpen). Motpekaren finns här för
> att trådarnas framåt-pekare inte ska vara enda bäraren (kontinuitet:
> dubbelriktad länkning; Marcus-fråga S81).

## Kontext

ADR-062 (segment-yta) etablerade principen "beräkna från källan (Deltaganden), registrera projektionens brister" — kallad "route-around-but-register". Den principen bar en outtalad premiss: att Airtable-basen var ett provisorium på väg att ersättas av Supabase, och att man därför inte skulle lägga 11/10-hantverk på "det döende". Den premissen är FALSK och rivs här öppet.

Airtable-basen är inte en byggnadsställning. Den är en **förstklassig leverabel i egen rätt**, vald som datakälla med avsikt:

1. **Den räcker för väldigt många — definitivt för en v1.** Airtable är en fullgod datakälla för en stor klass av användare/produkter, inte en kompromiss man uthärdar tills "den riktiga databasen" byggs.
2. **Den blir mall + övningsprojekt i Passionslyftet.** Slutprodukten är dubbel: en 11/10-app OCH en 11/10-Airtable-bas som tjänar som referensimplementation och pedagogiskt övningsprojekt.
3. **Den är datakälla NU för att avtäcka kraven.** Hela anledningen att bygga mot Airtable just nu är att bygget genererar kunskapen om vad en svinbra app behöver av sin datakälla — "se vad vi behöver från den". Defekt-registret ÄR den kunskapen, gjord durabel.

## Beslut

1. **Airtable-basen ska maxas till 11/10 / branschledarmässig / totalt maxad — som leverabel, ej ersättas.** Att fullända basen är inte slöseri på en döende artefakt; det är att bygga själva artefakten vi vill leverera.
2. **Resolution sker I BASEN.** Avtäckta brister (Airtable-skatten) löses ut genom att städa, fixa och optimera Airtable-basen själv — inte lappa provisoriskt, inte "designa bort" i en efterträdare. Maxa källan.
3. **Defekt-registret är KRAVSPECEN för bas-maximeringen.** data-model.md §Kända fällor + T16 + app↔Airtable-interaktions-registret är inte en lista över problem att gå runt — de är den kravspec, samlad genom att faktiskt bygga mot basen, som bas-maximeringen exekverar mot. "Register" är ett committat åtagande att lösa, inte en deferra-och-glöm-lista.
4. **App-sidans "beräkna från källan" (ADR-062 Beslut 2) står — dess motivering omframas.** Att appen läser källan-av-sanning (Deltaganden) i stället för en lossy projektion (rollupsen) är inte "att gå runt en brist man accepterar". Det är leverans + korrekthet NU, medan basen ännu inte är maxad — och precis vad branschledarna gör (beräkna från händelse-källan, lita aldrig på handunderhållna kumulativa flaggor). Alltså 11/10, ej kompromiss. Korrektheten överlever oavsett basens maximerings-tillstånd.
5. **Post-Fas-6-maximerings-milstolpe (namngiven, committad):** efter Fas 6 — (a) audita att ALLA app↔Airtable-interaktioner är registrerade KORREKT, (b) audita att HELA Airtable-skatten är registrerad KORREKT, (c) lösa ut allt: städa, fixa, optimera Airtable-basen till 11/10 / branschledarmässig / mall-redo. Inte en god intention — en milstolpe i roadmapen (byggplan.md) med ägare och kvitto.
6. **Supabase-migration är ett separat SENARE spår, INTE en ersättning av Airtable.** Airtable-basen lever vidare som referensimplementation/mall i Passionslyftet. Supabase-målmodell-researchen (06b) är inte "destinationen som ersätter Airtable" — ett senare separat spår. Migrations-tajming styr INTE bas-maximeringen; basen maxas som egen leverabel oavsett.

## Öppen rivning (kvitto, ej tyst radering)

ADR-062:s "route-around-but-register"-formulering + dess Migrationsväg-/Konsekvenser-framing bar premissen "Airtable dödsdömd → guldplätera inte det döende → resolution = designa bort i efterträdaren". **Den premissen stryks.** Korrekt: resolution = maxa basen som leverabel; registret = kravspec; route-around-nu = appen läser sanningen medan basen inte är maxad.

Premissen var Chats (Claude), införd i ADR-062:s författning utan förankring i Marcus intent — Marcus korrigerade den i Session 34-dialogen. Noteras explicit så framtida-vi ser VARFÖR ADR-062:s princip förfinades: en Chat-felpremiss, inte ett skifte i projektets riktning. ADR-062:s sak-beslut (1–7) står oförändrade; endast den Airtable-status-bärande framingen korrigeras.

## Konsekvenser

**Positiva:** projektets dubbla leverabel (11/10-app + 11/10-Airtable-bas-mall) är durabelt och kanoniskt; "route-around" missförstås ej längre som undvikande; defekt-registret har ett committat resolutions-hem (post-Fas-6-milstolpen); Airtable-arbete är ej längre felkategoriserat som "slöseri på det döende".

**Negativa / skuld:** bas-maximeringen är reellt arbete som tillkommer roadmapen (post-Fas-6); maximerings-estimatet är osatt (sätts vid milstolpens dekomponering); registret måste hållas KORREKT + KOMPLETT för att vara pålitlig kravspec (auditen i milstolpen säkrar det).

**Blast-radius-not (kvarstår oavsett framing):** Airtable-basen är delad prod (Psionautics gäst) och bär automationer A1–A11. Bas-maximeringen sker med samma försiktighet — eget pass med egen verifiering, ej sidoeffekt.

## Relaterat

- ADR-062 (segment-yta) — sak-besluten står; maximerings-principens framing förfinas av detta ADR (pekar-erratum infällt där).
- byggplan §4 — post-Fas-6-maximerings-milstolpe införs (Session 34 Landning 2).
- data-model.md §Kända fällor + T16 — omframas som kravspec (Session 34 Landning 4).
- L192 — omformuleras: register = committad förbättring (Session 34 Landning 5).
- Passionslyftet — Airtable-basen som mall + övningsprojekt (kontext-lagret, Session 34 Landning 3).
