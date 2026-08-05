# Regeln måste bo på den yta som levererar signalen — annars når den bara den som redan gjort fel

**En regel som levereras enbart på fel-vägen når aldrig den som lyckas undvika
felet. Ju försiktigare aktören är, desto säkrare missar den instruktionen.**
[UNIVERSAL]

**Datum:** 2026-08-05 (S93)
**Klass:** mekanism-design / instruktionsleverans

## Vad som hände

Katalogägarskaps-mekanismen bär regeln för vad en session ska göra när
huvudkatalogen är upptagen. Regeln fanns nedskriven, korrekt och otvetydig, i
`scripts/deny-frammande-huvudkatalog.sh` § ÄGARSKAP-TAGANDE — verbatim:
*"ARBETA I DIN EGEN WORKTREE I STÄLLET … eskalera det INTE till Marcus, du har
all information som krävs för att välja rätt katalog."*

Den texten är `permissionDecisionReason` på ett **deny**. Den levereras alltså
**bara till en session som faktiskt försökt en git-skrivning och blivit nekad.**

En resume-session läste i stället `SessionStart`-rapporten, konstaterade att
huvudkatalogen hade en främmande lapp, och drog sin slutsats **i förväg** — utan
att provocera fram en deny. Den nådde därför aldrig regeln. Den stoppade hela
arbetet och eskalerade en fråga den hade fullt mandat att avgöra själv.

## Den kontraintuitiva delen

Sessionen gjorde det som normalt är rätt: den försökte inte en operation den
trodde skulle nekas. **Just den försiktigheten kringgick den enda ytan som bar
regeln.** En slarvigare session — en som bara kört på — hade blivit nekad, fått
regeln, och gjort rätt.

Det är värt att generalisera: **när en regel bara sitter på felvägen belönar
systemet den som gör fel och straffar den som är försiktig.** Det är baklänges,
och det upptäcks inte av tester som bara prövar felvägen.

## Bidragande orsak — samma regel, två grenar, en tappade den

`katalogagarskap-markor.sh` hade två rapportvägar för samma tillstånd. Bara den
ena bar worktree-regeln; stale-grenen nämnde `rm` som enda handling. Lappen råkade
vara över tidströskeln, så sessionen fick just den grenen — vilket ramade om
situationen från "vilken katalog jobbar jag i?" till "är ägaren död, ska jag
radera?". Två grenar av samma budskap divergerade tyst eftersom ingen delade
källa band dem.

Testsviten prövade att hooken inte **skrev** lappen, aldrig vad den
**rapporterade**. Innehållsluckan var därför osynlig för grinden.

## Regel

1. **Placera regeln på den yta som levererar SIGNALEN, inte bara på den som
   levererar AVSLAGET.** Ankomst-ytan (rapport, statusrad, SessionStart) och
   handlings-ytan (deny, felutskrift) ska bära samma regel.
2. **En regel som finns i två utflöden ska komma ur EN sträng.** Duplicerad
   prosa divergerar; den delade källan gör divergensen omöjlig i stället för
   osannolik.
3. **Testa vad mekanismen SÄGER, inte bara vad den GÖR.** En hook vars utdata
   styr en agents beteende har sitt innehåll som kontrakt.
4. **Fråga vid varje ny regel: kan någon nå detta tillstånd utan att passera
   den yta där regeln står?** Kan de det, står regeln på fel ställe.

## Samma familj

Detta är strukturellt samma fel som `[[code-role-discipline-ej-laddad]]`: en
artefakt som bara pekas på i prosa levereras aldrig. ADR-079 rev den en gång
genom att flytta Code-rollen till output-stylen (alltid i systemprompten). Här
återuppstod klassen i en annan mekanism — vilket antyder att mönstret behöver
kontrolleras aktivt vid varje ny regel, inte bara rivas där det hittas.

Åtgärdat i samma landning: delad regel-sträng i båda rapportvägarna, sex
innehållstester (fyra bevisat röd-kapabla mot gamla koden), och regeln inlinad
i `session-resume`-skillen i stället för pekad på.
