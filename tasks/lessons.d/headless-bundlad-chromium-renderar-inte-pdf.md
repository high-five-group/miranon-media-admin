# Playwrights bundlade Chromium renderar inte PDF i iframe — facit-bilder av en PDF-yta kräver `chrome`-kanalen

**Playwrights medföljande Chromium saknar den proprietära PDF-visaren. En yta
vars innehåll ÄR en PDF (overlay-förhandsvisning, inbäddad `<iframe>`) blir
därför blank i skärmdumpen — bilden ser ut som en trasig komponent fast koden
är korrekt. Kör den bild-tagningen mot systemets riktiga Chrome
(`channel: 'chrome'`), inte mot den bundlade binären.**

Instans (S102, 2026-08-16): facit-låset för dokument-konvergensen
(`s102-dokument-konvergens`, PR **#1437**, `2253fa61`) behövde fem äkta
bilder i `tasks/sessions/bilagor/`. Overlay-bilderna gick inte att ta med
standarduppsättningen — headless bundlad Chromium renderade inte PDF:en — och
löstes med chrome-kanalen. Bokfört i sessionsdokets Del 14 och buret som
carry-kandidat genom tre pauser.

**Det generella:** en blank skärmdump är inte i sig ett bevis för en trasig
yta. Fråga först om RENDERAREN kan visa innehållsformatet alls. Klassen
gäller varje format som webbläsaren delegerar till en inbyggd visare —
PDF är den vi mätt, men resonemanget är detsamma för allt som inte är
HTML/CSS/bild.
