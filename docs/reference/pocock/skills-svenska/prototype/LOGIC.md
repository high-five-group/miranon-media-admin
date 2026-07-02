# Logikprototyp

En liten interaktiv terminalapp som låter användaren driva en tillståndsmodell för hand. Använd den när frågan gäller **affärslogik, tillståndsövergångar eller dataform** — sådant som ser rimligt ut på papper men känns fel först när det pressas genom verkliga fall.

## När detta är rätt form

- ”Jag är inte säker på att den här tillståndsmaskinen hanterar gränsfallet X följt av Y.”
- ”Kan den här datamodellen verkligen representera fallet där …?”
- ”Jag vill känna mig fram till hur API:t ska se ut innan jag skriver det.”
- Allt där användaren vill **trycka på knappar och se tillståndet förändras**.

Om frågan är ”hur ska detta se ut?” är detta fel gren. Använd [UI.md](UI.md).

## Process

### 1. Ange frågan

Innan du skriver kod, skriv ned vilken tillståndsmodell och vilken fråga som prototypas. Ett stycke i prototypens README eller en kommentar högst upp i filen. En logikprototyp som besvarar fel fråga är rent slöseri — gör frågan explicit så att den kan kontrolleras senare, oavsett om användaren ser på nu eller återkommer AFK.

### 2. Välj språk

Använd samma språk som värdprojektet. Om projektet saknar tydlig runtime, till exempel ett dokumentationsrepo, fråga.

Följ projektets befintliga verktygskonventioner — lägg inte till en ny pakethanterare eller runtime bara för prototypen.

### 3. Isolera logiken i en portabel modul

Placera själva logiken — delen som besvarar frågan — bakom ett litet, rent gränssnitt som senare kan lyftas ut och läggas i den verkliga kodbasen. TUI:n runt den är tillfällig; logikmodulen ska inte vara det.

Rätt form beror på frågan:

- **En ren reducer** — `(state, action) => state`. Bra när handlingar är diskreta händelser och tillståndet är ett enda värde.
- **En tillståndsmaskin** — explicita tillstånd och övergångar. Bra när ”vilka handlingar är ens giltiga just nu?” är en del av frågan.
- **En liten uppsättning rena funktioner** över en enkel datatyp. Bra när det saknas implicit aktuellt tillstånd och bara transformationer finns.
- **En klass eller modul med en tydlig metodyta** när logiken verkligen äger ett fortlöpande internt tillstånd.

Välj den form som bäst svarar på frågan, *inte* den som är enklast att koppla till en TUI. Håll den ren: ingen I/O, ingen terminalkod och inga `console.log` för kontrollflöde. TUI:n importerar modulen och anropar den; inget flödar i motsatt riktning.

Det är detta som gör prototypen användbar efter sin egen livstid. När frågan är besvarad kan den validerade reducern, maskinen eller funktionsuppsättningen lyftas in i den verkliga modulen; TUI-skalet raderas.

### 4. Bygg den minsta TUI som synliggör tillståndet

Bygg en **lättviktig TUI** — vid varje tick, rensa skärmen (`console.clear()` / `print("\033[2J\033[H")` / motsvarande) och rendera om hela ramen. Användaren ska alltid se en stabil vy, inte en växande scrollback.

Varje ruta har två delar i denna ordning:

1. **Aktuellt tillstånd**, snyggt utskrivet och diff-vänligt (ett fält per rad eller formaterad JSON). Använd **fetstil** för fältnamn eller sektionsrubriker och **nedtonat** för mindre viktig kontext (tidsstämplar, ID:n och härledda värden). Inbyggda ANSI-escape-koder fungerar: `\x1b[1m` för fetstil, `\x1b[2m` för nedtonat, `\x1b[0m` för återställning. Hämta inte ett stylingbibliotek om projektet inte redan har ett.
2. **Kortkommandon**, listade längst ned: `[a] add user  [d] delete user  [t] tick clock  [q] quit`. Gör tangenten fet och beskrivningen nedtonad, eller tvärtom — välj det som läser rent.

Beteende:

1. **Initiera tillståndet** — ett enda minnesbaserat objekt eller struct. Rendera första rutan vid start.
2. **Läs en tangenttryckning, eller en rad,** i taget och skicka den till en hanterare som ändrar tillståndet.
3. **Rendera om** hela rutan efter varje handling — lägg inte till, ersätt.
4. **Loopa tills avslut.**

Hela rutan ska rymmas på en skärm.

### 5. Gör den körbar med ett kommando

Lägg till ett skript i projektets befintliga task runner (`package.json`-skript, `Makefile`, `justfile` eller `pyproject.toml`). Användaren ska köra `pnpm run <prototype-name>` eller motsvarande — aldrig behöva minnas en sökväg.

Om värdprojektet saknar task runner, skriv bara kommandot högst upp i prototypens README.

### 6. Lämna över

Ge användaren körkommandot. De kör den själva; de intressanta ögonblicken är när de säger ”vänta, det där borde inte vara möjligt” eller ”jag trodde att X skulle vara annorlunda” — det är buggar i *idén*, vilket är hela poängen. Lägg till nya handlingar om de vill det. Prototyper utvecklas.

### 7. Fånga svaret

När prototypen har gjort sitt är svaret på frågan det enda som är värt att behålla. Om användaren är tillgänglig, fråga vad den lärde dem. Om inte, lämna en `NOTES.md` bredvid prototypen så att svaret kan fyllas i — av användaren eller av dig om du följt sessionen — innan prototypen raderas.

## Antimönster

- **Lägg inte till tester.** En prototyp som behöver tester är inte längre en prototyp.
- **Koppla den inte till den riktiga databasen.** Använd minneslagring om frågan inte specifikt gäller persistens.
- **Generalisera inte.** Ingen ”tänk om vi vill stödja X senare”. Prototypen besvarar en fråga.
- **Blanda inte ihop logiken och TUI:n.** Om reducern eller tillståndsmaskinen refererar till `console.log`, prompts eller terminalens escape-koder är den inte längre portabel. Håll TUI:n som ett tunt skal över en ren modul.
- **Leverera inte TUI-skalet till produktion.** Skalet är optimerat för manuell körning i en terminal. Logikmodulen bakom är delen som är värd att behålla.
