# En slutsats som bara vilar på egen empiri räcker inte när ADR-baren nås

**Egen mätning är stark grund för ett arbetssteg och otillräcklig grund för ett
ADR-permanent beslut. När baren nås ska branschprecedent hämtas — och en tom
precedent-rymd deklareras öppet i stället för att fyllas ut.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** en rekommendation formulerades på vår egen mätning
av staging-flaskhalsen. Marcus fråga *"om du rekommenderar B så antar jag att det
är på väl underbyggda grunder"* träffade en verklig lucka: konstitutionen kräver
3+ branschledar-precedent vid arkitekturbeslut med ADR-permanens, och den hade
inte hämtats. Grillningen **pausades** och passet kördes.

**Svaret ändrade ramen, inte bara underlaget.** Branschen väger determinism
högst — men köper den genom att göra backend **efemär**, inte genom att mocka
bort den. Vår delade muterbara staging är lägst rankad i Googles SUT-ranking och
HOLD-listad hos Thoughtworks, så att komma därifrån har brett stöd; det är
**formen** som avviker. Ghost är vår manöver exakt (81 hermetiska acceptance-filer
i eget jobb + 82 skarpa i docker-stack, med en 418-vakt).

**Och där precedenten faktiskt tog slut sades det rakt ut:** Ghost, Supabase och
cal.com kan alla duplicera sin backend gratis. Precedent för efemär backend mot
**icke-självhostbar SaaS** är genuint tomt. Den tomheten skrevs in i ADR:n i
stället för att räkningen fejkades — vilket är hela poängen med kravet.
