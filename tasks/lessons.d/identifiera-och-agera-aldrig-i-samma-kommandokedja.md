# Identifiera och agera aldrig i samma kommandokedja när åtgärden beror på identiteten

**En kedja som först räknar fram VAD som ska åtgärdas och sedan åtgärdar det i
samma andetag har inget läge där ett människo- eller modellöga kan pröva
urvalet. Blir identifieringen fel utförs åtgärden ändå — på fel mål, utan
signal. Dela alltid i två steg: hämta identiteten, LÄS den, agera sedan på det
lästa värdet.** `[UNIVERSAL]`

Instans (S102, 2026-08-17): armeringen av PR **#1511** utfördes i en kedja där
PR-numret härleddes och användes i samma kommando. Bokfört i Del 17-skörden som
"identifiera+agera aldrig i samma kedja när åtgärden beror på identiteten".

**Varför det är en egen klass och inte bara slarv:** felet är osynligt i
efterhand. En kedja som armerade fel PR ser i loggen ut som en lyckad
armering — exitkoden är noll, texten stämmer, och det enda som är fel är
argumentet. Samma familj som repots övriga "läs innan du bygger vidare"-regler
(vakt-event är väckarklocka, aldrig fakta), fast med kortare avstånd mellan
felet och verkan.

**Formen som håller:** `X=$(kommando som identifierar)`, skriv ut `X`, och kör
åtgärden som ett SEPARAT anrop med värdet inklistrat. Kostnaden är ett extra
tool-call; alternativet är en åtgärd mot ett mål ingen granskat.
