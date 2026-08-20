# Halv åtgärd på två kopplade tillstånd gör läget värre

Chromes gamla appikon satt kvar. Jag tog bort Chromes ikoncache från
användarens profil — korrekt diagnos, cachen var verkligen problemet.

Men appen stod kvar som **installerad** i Chromes register, och det tog jag
inte bort. Följden: Chrome hade en installerad app vars ikonfiler saknades, och
enligt Chrome 144-regeln ingen anledning att hämta nya (manifestets `icons`-lista
var oförändrad). Den byggde en shim med macOS default-ikon.

**Före min åtgärd: gammal ikon. Efter: grå platshållarkub.** Sämre.

**Regeln:** när ett tillstånd bärs av två kopplade delar — data och registrering,
cache och index, fil och referens — river en halv åtgärd konsistensen utan att
lösa problemet. Antingen båda, eller ingen.

**Frågan att ställa innan:** vad HÅLLER ihop det här tillståndet, och rör jag
alla delar? Om svaret är "jag rör en av två" är följdfrågan vad den andra gör
när dess motpart försvinner.

Instans: S107 2026-08-20, PWA-ikonkedjan.
