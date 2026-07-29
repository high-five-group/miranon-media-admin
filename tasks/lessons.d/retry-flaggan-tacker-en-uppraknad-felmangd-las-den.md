# En retry-flagga täcker en uppräknad felmängd — läs den, anta den inte

**En mitigering kan vara rimlig, landa grön och ändå inte täcka felet den skrevs
för. Verifiera fixen mot den uppmätta fel*koden*, inte mot felets kategori.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-29, `TASK-83`):** lint-jobbets `curl`-hämtning av
shellcheck föll på **exit 35** (`CURLE_SSL_CONNECT_ERROR`) efter 0,13 s. Kortet
föreslog som minsta-ändrings-alternativ:

```bash
curl --retry N --retry-connrefused --retry-delay S
```

Den formen hade inte fixat någonting.

`curl --retry` definierar "transient" som en **uppräknad mängd**: *a timeout, an
FTP 4xx response code or an HTTP 408, 429, 500, 502, 503, 504, 522 or 524
response code*. Ett TLS-connect-fel finns inte i den mängden.
`--retry-connrefused` adderar **enbart** `ECONNREFUSED`. Flaggan som faktiskt
täcker exit 35 är `--retry-all-errors` (curl 7.71.0+).

Det farliga är inte att förslaget var fel — det är att det hade **sett rätt ut i
efterhand**. En PR med `--retry` landar grön, kortet stängs, och nästa fällning
läses som "det där fixade vi ju, alltså är detta något annat". En verkningslös
mitigering är dyrare än ingen mitigering, eftersom den tar bort frågan.

**Beviset som skilde formerna åt** var en lokal harness med en TLS-server som
bryter handskakningen för de N första anslutningarna — alltså samma felkod, inte
samma felkategori:

| form | utfall |
|---|---|
| `-sL` (dåvarande) | exit 35 |
| `-sL --retry 5 --retry-connrefused` (kortets förslag) | exit 35 |
| `-fsSL --retry 5 --retry-all-errors` (valdes) | exit 0, efter 2 återförsök |

Först den tredje raden är ett bevis. De två första hade båda passerat en
verifiering som bara frågade "fungerar nedladdningen i normalfallet?".

**Formen:** när en fix riktas mot ett *uppmätt* fel — reproducera den exakta
felkoden och kör fixen mot den. "Nätverksfel" är en kategori; `35` är felet. En
flaggas räckvidd läses i dess manual, aldrig ur dess namn: `--retry` låter som
"försök igen vid fel" och betyder något smalare.

Släkt med
[[verifiera-stodet-i-den-pinnade-versionen-inte-i-dokumentationen]] — samma
disciplin, en nivå in: där gäller det om beroendet har funktionen, här om
flaggan täcker vårt fall.
