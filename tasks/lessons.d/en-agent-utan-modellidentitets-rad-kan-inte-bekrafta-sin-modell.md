# En agent vars systemprompt saknar modellidentitets-raden kan inte bekräfta vilken modell den kör på

**Uppdragsformen kräver att agenten rapporterar sin faktiska modell-identitet
ur den egna systemprompten ("You are powered by the model named X. The exact
model ID is Y."). Den raden är inte garanterad att finnas. Saknas den kan
agenten INTE svara på frågan — och ett svar som ändå ges är en gissning ur
träningsdata, inte en mätning. Rätt utfall är att rapportera raden som
SAKNAD, inte att fylla i det troliga.** `[UNIVERSAL]`

Instans (S102, 2026-08-16/17): `task-243.3`-agentens slutrapport kunde inte
bära modellidentitets-raden — den fanns inte i dess systemprompt. Bokfört som
lesson-kandidat i sjunde pausens carry-block ("agent utan modellidentitets-rad
i systemprompt (243.3-agentens rapport)").

**Varför kravet ändå står kvar:** raden är motmedlet mot att
frontmatter-fältet `model` tyst ignoreras — ett dokumenterat harness-beteende
med ≥8 GitHub-issues bakom sig (`ADR-089` § 7). Kravet är alltså rätt; det
som saknades var ett definierat utfall när källan inte finns. Det utfallet är
nu skrivet: **rapportera "modellidentitets-raden saknas i min systemprompt"**
— en ärlig lucka i verifikationskedjan är läsbar, en gissning som ser ut som
en mätning är det inte.
