# UI-prototyp

Skapa **flera radikalt olika UI-varianter** på en enda route, växlingsbara från en flytande rad längst ned. Användaren växlar mellan varianterna i webbläsaren, väljer en eller tar delar från flera, och resten kastas sedan bort.

Gäller frågan logik eller tillstånd i stället för utseende är detta fel gren. Använd [LOGIC.md](LOGIC.md).

## När detta är rätt form

- ”Hur ska den här sidan se ut?”
- ”Jag vill se några alternativ för denna dashboard innan jag bestämmer mig.”
- ”Prova en annan layout för inställningssidan.”
- När användaren annars skulle lägga en dag på att välja mellan tre vaga mockups i huvudet.

## Två underformer — föredra starkt underform A

En UI-prototyp är enklare att bedöma när den **tar spjärn mot resten av appen** — riktig header, riktig sidebar, riktig data och riktig täthet. En fristående tillfällig route är ett vakuum: varje variant ser bra ut isolerat. Använd underform A som standard när det finns en rimlig befintlig sida att placera varianterna på. Använd B bara om prototypen verkligen saknar en närliggande hemvist.

### Underform A — justering av en befintlig sida (föredras)

Routen finns redan. Rendera varianterna **på samma route**, styrda av URL-sökparametern `?variant=`. Behåll befintlig datahämtning, parametrar och autentisering — byt bara rendering. Detta är standard; välj det om det inte finns ett specifikt skäl att låta bli.

Om prototypen gäller något som ännu saknar en sida men *naturligt skulle ligga i en befintlig* — en ny dashboardsektion, ett nytt kort i inställningar eller ett nytt steg i ett flöde — är det fortfarande underform A. Montera varianterna inne i värdsidan.

### Underform B — en ny sida (sista utvägen)

Använd bara detta när det prototypas verkligen saknar en befintlig sida att leva på, exempelvis en helt ny toppnivåyta eller ett flöde som inte kan bäddas in rimligt.

Skapa en **tillfällig route** enligt projektets befintliga routningskonvention. Hitta inte på en ny toppnivåstruktur. Namnge den så att den uppenbart är en prototyp, till exempel med ordet `prototype` i sökväg eller filnamn. Använd samma mönster med `?variant=`.

Gör en rimlighetskontroll innan du väljer B: finns det verkligen ingen befintlig sida där detta kan bäddas in? En tom route döljer designproblem som en befolkad sida skulle avslöja.

Den flytande raden längst ned är identisk i båda underformerna.

## Process

### 1. Ange frågan och välj N

Använd **tre varianter** som standard. Fler än fem slutar vara radikalt olika och blir brus — sätt taket där.

Skriv ned planen på en rad där prototypen ligger eller i en kommentar högst upp:

> ”Tre varianter av inställningssidan, växlingsbara via `?variant=`, på den befintliga routen `/settings`.”

Det fungerar oavsett om användaren är närvarande för att invända eller inte.

### 2. Skapa radikalt olika varianter

Skissa varje variant. Håll varje till:

- Sidans syfte och den data den kommer åt.
- Projektets komponentbibliotek och stylingsystem (TailwindCSS, shadcn, MUI, vanlig CSS eller vad som används).
- Ett tydligt exporterat komponentnamn, till exempel `VariantA`, `VariantB`, `VariantC`.

Varianterna måste vara **strukturellt olika** — annan layout, annan informationshierarki, annan primär handling — inte bara andra färger. Tre lite justerade kortrutnät är inte en UI-prototyp utan tapet. Blir två utkast för lika, gör om ett med tydlig vägledning som ”använd inte kortrutnät”.

### 3. Koppla ihop dem

Skapa en enda växlingskomponent på routen:

```tsx
// pseudokod — anpassa till projektets ramverk
const variant = searchParams.get('variant') ?? 'A';
return (
  <>
    {variant === 'A' && <VariantA {...data} />}
    {variant === 'B' && <VariantB {...data} />}
    {variant === 'C' && <VariantC {...data} />}
    <PrototypeSwitcher variants={['A','B','C']} current={variant} />
  </>
);
```

För underform A: behåll all befintlig datahämtning ovanför växlaren; bara det renderade underträdet ändras per variant.

För underform B: den tillfälliga routen under `/prototype/<name>` monterar samma växlare.

### 4. Bygg den flytande växlaren

En liten rad med fast position längst ned i mitten av skärmen, med tre delar:

- **Vänsterpil** — växlar till föregående variant och loopar runt.
- **Variantetikett** — visar aktuell variantsnyckel och, om varianten exporterar ett namn, även namnet. Exempel: `B — Sidebar layout`.
- **Högerpil** — växlar framåt och loopar runt.

Beteende:

- Klick på pil uppdaterar URL-sökparametern med ramverkets router — `router.replace` i Next, `navigate` i React Router och så vidare — så att varianten är delbar och stabil vid omladdning.
- Tangentbord: piltangenterna `←` och `→` växlar också. Fånga inte piltangenter när ett `<input>`, `<textarea>` eller `[contenteditable]` har fokus.
- Skilj den visuellt från sidan, exempelvis med en pill med hög kontrast och diskret skugga, så att den uppenbart inte är del av designen som utvärderas.
- Dölj den i produktionsbyggen — villkora med `process.env.NODE_ENV !== 'production'` eller motsvarande, så att en råkad prototypmerge inte kan leverera raden till användare.

Placera växlaren i en delad komponent så att båda underformerna kan använda den. Lägg den där projektet placerar delat UI.

### 5. Lämna över

Visa URL:en och nycklarna för `?variant=`. Användaren kan växla när det passar. Den intressanta återkopplingen är vanligen **”Jag vill ha headern från B och sidebaren från C”** — det är den design användaren faktiskt vill ha.

### 6. Fånga svaret och städa

När en variant vunnit, skriv ned vilken och varför (commit-meddelande, ADR, issue eller en `NOTES.md` bredvid prototypen om körningen är AFK och användaren inte svarat). Sedan:

- **Underform A** — radera förlorande varianter och växlaren; för in vinnaren i den befintliga sidan.
- **Underform B** — befordra vinnande variant till en riktig route och radera den tillfälliga routen och växlaren.

Låt inte variantkomponenter eller växlaren ligga kvar. De ruttnar fort och förvirrar nästa läsare.

## Antimönster

- **Varianter som bara skiljer i färg eller copy.** Det är en justering, inte en prototyp. Riktiga varianter är oense om struktur.
- **Dela för mycket kod mellan varianter.** En delad `<Header>` är bra; en delad `<Layout>` motverkar poängen. Varje variant ska vara fri att kasta bort layouten.
- **Koppla varianter till verkliga mutationer.** Skrivskyddade prototyper går bra. Behöver en variant mutera, rikta den mot en stub — frågan är ”hur ska detta se ut?”, inte ”fungerar backend?”.
- **Befordra prototypen direkt till produktion.** Variantkoden skrevs under prototypbegränsningar (inga tester, minimal felhantering). Skriv om den ordentligt när den förs in.
