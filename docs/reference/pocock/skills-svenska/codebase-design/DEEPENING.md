# Fördjupning

Så här fördjupar du säkert ett kluster av grunda moduler utifrån dess beroenden. Förutsätter vokabulären i [SKILL.md](SKILL.md): **modul**, **gränssnitt**, **skarv** och **adapter**.

## Beroendekategorier

Klassificera beroendena när du bedömer en kandidat för fördjupning. Kategorin avgör hur den fördjupade modulen testas över sin skarv.

### 1. I processen

Ren beräkning, minnesbaserat tillstånd och ingen I/O. Kan alltid fördjupas — slå ihop modulerna och testa direkt genom det nya gränssnittet. Ingen adapter behövs.

### 2. Lokalt utbytbar

Beroenden med lokala testdubbletter (PGLite för Postgres, minnesbaserat filsystem). Fördjupa om dubbletten finns. Testa den fördjupade modulen med dubbletten i testsviten. Skarven är intern; inget portgränssnitt ska ligga i modulens externa gränssnitt.

### 3. Fjärransluten men ägd (Ports & Adapters)

Dina egna tjänster över en nätverksgräns (mikrotjänster, interna API:er). Definiera en **port** (ett gränssnitt) vid skarven. Den djupa modulen äger logiken; transporten injiceras som en **adapter**. Tester använder en minnesbaserad adapter. Produktion använder en HTTP-, gRPC- eller köadapter.

Rekommenderad form: *”Definiera en port vid skarven, implementera en HTTP-adapter för produktion och en minnesbaserad adapter för test, så att logiken ligger i en djup modul trots att den distribueras över ett nätverk.”*

### 4. Verkligt externt (mock)

Tredjepartstjänster som du inte styr över (Stripe, Twilio och liknande). Låt den fördjupade modulen ta emot det externa beroendet som en injicerad port; tester tillhandahåller en mock-adapter.

## Skarvdisciplin

- **En adapter betyder en hypotetisk skarv. Två adaptrar betyder en verklig.** Inför inte en port om minst två adaptrar inte är motiverade (vanligen produktion + test). En skarv med bara en adapter är enbart indirektion.
- **Interna kontra externa skarvar.** En djup modul kan ha interna skarvar (privata för implementationen och använda av dess egna tester) samt den externa skarven vid gränssnittet. Exponera inte interna skarvar genom gränssnittet bara för att tester använder dem.

## Teststrategi: ersätt, stapla inte

- Gamla enhetstester för grunda moduler blir överflödiga när tester vid den fördjupade modulens gränssnitt finns — ta bort dem.
- Skriv nya tester vid den fördjupade modulens gränssnitt. **Gränssnittet är testytan.**
- Låt testerna verifiera observerbara resultat genom gränssnittet, inte internt tillstånd.
- Låt testerna överleva interna refaktoreringar: de ska beskriva beteende, inte implementation. Om ett test måste ändras när implementationen ändras testar det förbi gränssnittet.
