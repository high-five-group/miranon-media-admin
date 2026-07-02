---
name: prototype
description: Bygg en tillfällig prototyp för att konkretisera en design — en körbar terminalapp för frågor om tillstånd och affärslogik, eller flera radikalt olika UI-varianter som kan växlas från en route.
disable-model-invocation: true
---

# Prototyp

En prototyp är **kod som kan kastas bort och som besvarar en fråga**. Frågan avgör formen.

## Välj gren

Identifiera vilken fråga som ska besvaras — från användarens prompt, omgivande kod eller genom att fråga om användaren är tillgänglig:

- **”Känns den här logiken eller tillståndsmodellen rätt?”** → [LOGIC.md](LOGIC.md). Bygg en liten interaktiv terminalapp som driver tillståndsmaskinen genom fall som är svåra att resonera om på papper.
- **”Hur ska detta se ut?”** → [UI.md](UI.md). Skapa flera radikalt olika UI-varianter på en route som kan växlas med en URL-sökparameter och en flytande rad längst ned.

Grenarna skapar mycket olika artefakter — att välja fel gör hela prototypen slösad. Är frågan genuint tvetydig och användaren inte går att nå, välj den gren som bäst matchar den omgivande koden (en backendmodul → logik; en sida eller komponent → UI) och ange antagandet högst upp i prototypen.

## Regler för båda grenarna

1. **Tillfällig från första dagen och tydligt märkt som sådan.** Placera prototypkoden nära där den faktiskt kommer användas, så att kontexten är uppenbar — men namnge den så att en tillfällig läsare ser att den är prototyp, inte produktion. För tillfälliga UI-routes: följ projektets befintliga routningskonvention, hitta inte på en ny toppnivåstruktur.
2. **Ett kommando för att köra.** Använd vad projektets befintliga task runner stöder — `pnpm <name>`, `python <path>`, `bun <path>` och så vidare. Användaren ska kunna starta utan att tänka.
3. **Ingen persistens som standard.** Tillstånd lever i minnet. Persistens är det prototypen *undersöker*, inte något den ska bero på. Om frågan uttryckligen gäller databas, använd en scratch-databas eller lokal fil med ett tydligt namn som ”PROTOTYPE — wipe me”.
4. **Hoppa över putsningen.** Inga tester, ingen felhantering utöver vad som gör prototypen *körbar*, inga abstraktioner. Poängen är att lära sig något snabbt och sedan radera den.
5. **Synliggör tillståndet.** Efter varje handling (logik) eller vid varje variantväxling (UI), skriv ut eller rendera hela relevanta tillståndet så att användaren ser förändringen.
6. **Radera eller absorbera när du är klar.** När prototypen har besvarat frågan, radera den eller för in det validerade beslutet i riktig kod — låt den inte ligga och ruttna i repot.

## När du är klar

Det enda som är värt att behålla från en prototyp är *svaret*. Fånga det på en hållbar plats (commit-meddelande, ADR, issue eller en `NOTES.md` bredvid prototypen), tillsammans med frågan den besvarade. Om användaren är tillgänglig är fångsten ett kort samtal; annars lämna platshållaren så att de, eller du vid nästa pass, kan fylla i domen innan prototypen raderas.
