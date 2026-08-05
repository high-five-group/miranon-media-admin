# Plattformens svar är inte applikationens bevis

**Ett grönt svar från gatewayen kan betyda att din kod aldrig kördes. Ett
CORS-, auth- eller rate-limit-bevis måste NÅ applikationslagret för att bevisa
något om det — annars mäter du plattformens default och kallar det din
konfiguration.** `[UNIVERSAL]`

Datum: 2026-08-05 (S96, femte resumen) | Klass: bevis som mäter fel lager

## Instansen

CORS-utökningen till `admin.miranon.dev` skulle verifieras mot prod. Första
mätningen:

```text
curl -H "Origin: https://admin.miranon.dev" .../functions/v1/get-events
→ 401
→ access-control-allow-origin: *
```

Headern SÅG ut som ett tillåtande svar. Men vår `corsHeadersFor()` sätter
aldrig `*` — den sätter den exakta origin-strängen eller ingen header alls.
`*` kom från Supabases gateway, som avvisade på JWT-nivå **innan vår funktion
kördes**. Svaret sa exakt ingenting om allowlisten.

Med anon-nyckeln passerade anropet gatewayen och nådde vår kod:

```text
→ 401
→ access-control-allow-origin: https://admin.miranon.dev
```

Samma statuskod, helt annat bevisvärde. 401:an är nu vår egen auth-kontroll,
och headern kan bara komma från vår funktion.

## Det generella mönstret

Varje plattform med ett gateway-lager — Supabase, Vercel, Cloudflare, API
Gateway, en ingress-controller — svarar på egen hand i vissa lägen. Deras
default-svar bär ofta *permissiva* headers, eftersom de är generiska. Det gör
dem farligt lika ett lyckat svar.

Två frågor skiljer lagren åt:

1. **Är svaret unikt för min konfiguration?** `*` är generiskt; den exakta
   origin-strängen kan bara min kod ha satt.
2. **Kan jag skilja lagren med samma anrop två gånger?** Här: utan nyckel
   (gateway svarar) mot med nyckel (koden svarar). Skillnaden i headern är
   beviset.

## Regeln

Innan ett infrastruktur-bevis bokförs som grönt: **peka ut vilken rad kod som
producerade svaret.** Kan du inte det, har du inte bevisat din ändring — du har
bevisat att tjänsten är uppe.
