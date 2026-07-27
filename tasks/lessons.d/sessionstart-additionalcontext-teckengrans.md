# `SessionStart`-hookens `additionalContext` har en gräns på 10 000 tecken

**Över gränsen degraderar injektionen tyst till sökväg + förhandsvisning. En hook
som "levererar" en stor fil levererar då en referens till den, inte innehållet.**

**Empiri (S91, 2026-07-27):** mätt vid bygget av `InstructionsLoaded`-hooken
(plugin 1.21.0). Gränsen är inte ett fel utan ett designval i harnesset — men den
är osynlig från hookens sida: skriptet lyckas, exit 0, och ingenting säger att
innehållet ersattes.

Detta träffar precis den klass av mekanismer som ska garantera **leverans av
instruktioner**, vilket är T100:s hela ämne. En hook som tror sig leverera en
konstitution men levererar en sökväg har samma utfall som ingen hook alls —
[[valideringsverktyg-som-inte-kors-ar-franvarande]] i en annan skepnad.

**Motmedlet:** håll injicerat innehåll under gränsen med marginal, och
**verifiera i mottagaränden** — att hooken kördes bevisar inte att innehållet
kom fram. Loggraden ska spegla vad som faktiskt injicerades, inte vad som
avsågs.
