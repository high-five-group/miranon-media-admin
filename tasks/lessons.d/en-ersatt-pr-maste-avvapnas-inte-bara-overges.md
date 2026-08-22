# En ersatt PR måste avväpnas, inte bara överges

**En armerad PR som blivit ersatt är en laddad fälla: armeringen överlever att
arbetet underkänns, och en enda grön omkörning räcker för att landa det du
redan valt bort. Att sluta bry sig om en PR är inte att stänga den.**
`[UNIVERSAL]`

Mätt 2026-08-22 (S111). PR `#1831` bar anmälningssidans divergens-prototyp.
Marcus granskade den, valde variant B och beställde en ombyggnad — varpå PR:en
i praktiken var ersatt. Samtidigt fällde `Acceptance — tvåsidigt bevis
(hermetik-självtest)`, så den stod röd.

Tre egenskaper samtidigt gjorde den farlig, och ingen av dem syns om man bara
konstaterar "den där jobbar vi inte på längre":

1. **Fortfarande armerad.** `autoMergeRequest` var satt. Armeringen konsumeras
   av en `failed_checks`-dequeue, men den försvinner inte för att arbetet
   underkänts av en människa.
2. **Röd av en flake-kandidat, inte av ett trädfel.** En omkörning — av en
   annan session, av ett retry, av vem som helst — kunde gjort den grön.
3. **Grön + armerad = landar.** Kön hade tagit in den utan att fråga någon.

Nettot: den underkända formen hade landat på `main` medan ombyggnaden
fortfarande pågick, och nästa agent hade byggt vidare ovanpå den.

## Regeln

När en PR blir ersatt — av ett omtag, ett designbeslut, en ny riktning —
avväpna och stäng den **i samma andetag som beslutet fattas**, inte "sedan":

```bash
gh pr merge <nr> --disable-auto
gh pr close <nr> --comment "Ersatt av …, grenen bevaras därför att …"
```

Grenen finns kvar efter `close`, så ingenting går förlorat. Är arbetet grunden
för ombyggnaden — säg det i stängningskommentaren och peka ut grenen, annars
letar nästa läsare efter kod som ser raderad ut.

## Varför det inte upptäcks av sig självt

Ett heartbeat-svep larmar på RÖTT och på armerings-kandidater, men en PR som är
**både röd och armerad** ser ut som ett vanligt rött larm — precis det man
lärt sig att vänta ut. Larmet säger "något är rött", inte "något rött kan
landa". Skillnaden är hela risken, och den syns bara om man läser
armeringsfältet i samma andetag som rollup-statusen.

I det här fallet fångades den bara för att monitorn startades av ett annat skäl
(Marcus bad om vakter över natten) och dess första larm tvingade fram en
läsning av PR:ens fullständiga läge.

## Den generella formen

**Ett beslut som upphäver ett arbete upphäver inte automatiken som bär det.**
Samma klass finns överallt där en åtgärd är armerad i förväg och beslutet
fattas någon annanstans: schemalagda jobb, köade deploys, förberedda
migreringar. Frågan att ställa vid varje "vi gör om det här" är: *vad är
fortfarande laddat att göra det gamla?*
