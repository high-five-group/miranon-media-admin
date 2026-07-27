# En repo-inställning kan vara låst tre nivåer upp

**En GitHub-inställning som presenteras som repo-lokal kan i själva verket vara
en kedja enterprise → org → repo, där varje nivå ärver nedåt och en restriktiv
nivå låser de lägre. Mutad kryssruta i repot betyder därför inte "saknar
rättighet" utan "värdet ägs högre upp" — och felsöker man på fel nivå letar man
efter något som inte finns där.** `[UNIVERSAL]`

Fångat 2026-07-27 (S91): baseline-workflowen failade på
`GitHub Actions is not permitted to create or approve pull requests`.
Workflowens eget filhuvud kallade förutsättningen en *repo-inställning* — och
det var fel, men bara märkbart efter att repot flyttats till en org på
Enterprise. Före flytten var repot personligt ägt och nivån sammanföll med
repot; flytten gjorde värdet ärvt, och kryssrutan mutades utan att något i
repot ändrats.

**Det som avgjorde frågan var ett skrivförsök, inte dokumentationen.** GitHub
Docs beskriver *ärvning* för denna inställning men stavar inte ut *låsningen* —
den meningen finns bara för grannsettingen. Två webbsidor lästa gav alltså en
stark hypotes men inget bevis. Ett `PUT` mot org-nivån gav svaret ordagrant:
`409 Conflict: "The enterprise does not allow GitHub Actions to approve pull
requests"`. Anropet avvisades i sin helhet — fail-closed, inget delvis satt
tillstånd.

**Generalisering:** när dokumentationen är tyst om huruvida en policy låser
nedåt, är ett avvisat skrivförsök mot den lägre nivån ett billigare och
ärligare svar än fler sidor dokumentation. Felmeddelandet namnger den nivå som
äger värdet.

**Praktisk följd:** sätt sådana kedjor uppifrån och ned med verifiering mellan
varje steg, och verifiera den lägsta nivån i stället för att sätta den — den
ärver. Läsning kan kräva ett scope (`admin:org`), skrivning på toppnivån ett
annat (`admin:enterprise`); att sakna scopet ger 403, vilket är en helt annan
signal än 409 och inte får läsas som "inställningen finns inte".

**Klassen är bredare än GitHub.** Samma form finns i molnplattformars
organisationspolicyer, MDM-profiler och koncernstyrda IdP-inställningar: en
lokal växel som ser tillgänglig ut men vars värde ägs av en nivå den lokala
administratören inte ser.
