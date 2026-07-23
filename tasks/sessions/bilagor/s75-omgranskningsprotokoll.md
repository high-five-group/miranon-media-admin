# S75 — Omgransknings-protokoll: 21 skivor till Done-flipp

> Bilaga till Session 75 (review-vågens stängning). Producerad vid femte
> paus-landningen 2026-07-23; körs vid nästa resume. **Arbetsform:** Marcus
> kör `git pull` + startar om dev-servern, går igenom raderna nedan i
> browsern och kvitterar per kort — "NN ok" eller "NN: <kommentar>". Varje
> ok-rad är den explicita kort-kvittensen (ADR-071-amenderingens
> Done-flipp-grind); Code flippar Done + final-summary löpande.
> Fynd klassas som vanligt (FIX/FACIT-REVIDERING → ny fix-våg · ITERATION →
> ny skiva). Öppna frågor är markerade **[FRÅGA]** — de MÅSTE besvaras
> innan sitt korts flipp.

## Förkrav

- [ ] `git pull` på main (vågarna 2–5 = PR #91–#94 mergade)
- [ ] Dev-servern omstartad (5173) + hård reload (cache)
- [ ] Staging-EF:erna är redan färska (10/10 redeployade 2026-07-23)

## Yta 1 — Eventlistan `/event`

| Kort | Titta på | Våg-ändringar att omgranska |
|---|---|---|
| 17.1 | Period-toggeln Kommande/Tidigare (pilnavigering, radiogroup) | — |
| 17.2 | Listvyn: kortform, tomlägen, periodväxling | Vy-växlingshoppet borta (gutter ≥ 640) |
| 17.3 | Kursfärgs-legendens kulörer == plattornas (kalendern) | — |
| 17.4 | Kalendervyn: månadsnav, dag-flöde, idag-ring, summering | Växlingshoppet borta åt båda håll |
| 17.5 | Bor över-raden på listkorten (säng-glyf + antal) | — |
| 19.2 | Skapa-ingången på listan; Mer-ingången riven | — |

## Yta 2 — Skapa event `/event/skapa`

| Kort | Titta på | Våg-ändringar att omgranska |
|---|---|---|
| 19.1 | SlideToConfirm-draget: drag + tangentbord (Space), bocken | Armerad text i promptens vikt (p15) |
| 19.3 | Hela formklassen; **Skapa event-knappen: mörkgrå oarmerad → GRÖN när publicering armeras** (p13, dynamiska grön-regeln) | Knapp-intenten + miranon.se borta ur UI:t (p15) |
| 19.4 | Publiceringsflaggan: "Dra för att publicera" → "Publiceras" (p14/p15) | Prompt + armerad text kortade |

## Yta 3 — Eventsidan `/event/<id>` (välj ett event med data + ett Planerat)

| Kort | Titta på | Våg-ändringar att omgranska |
|---|---|---|
| 18.1 | Sidstruktur, Om eventet, redigeringsflöden; **datumspann "15–16 augusti 2026"** (p12-kollapsen) | Datumformen |
| 18.2 | Beläggningen (andra-läget, staplar) | — |
| 18.3 | Åtgärds-gruppen + check-in-ingång (chevron-koherensen) | — |
| 18.4 | Arbetskön: summeringsrader, flikar, accordions, filter | — |
| 18.5 | Personkorten: metayta, **Anmäld-raden understruken** (K62; no-op tills 18.17), **historikraden** ("N tidigare event…" — nu synlig med färska EF:er). **[FRÅGA]** pillarna ligger utanför person-länken (a11y-valet) — ok mot facit-DOM:en? | Underline + historik + rundning |
| 18.6 | Hantera-flödet: Skicka bekräftelse, **Bekräfta alla** (rundning 4 px + symmetriskt inset), kontrollfrågan | Rundning + inset |
| 18.7 | Bor över: kryss-läget, bas-fältet, summering | — |
| 18.8 | Betalningar: arbetsytan, slutbetalnings-vertikalen, deadline (start − 14 d) | — |
| 18.9 | Närvaro: registret (Genomfört) / **tomläget "Eventet är inte genomfört ännu"** centrerat gråat | Tomläget + höjd-paret |
| 18.10 | Gruppdynamik: mix, kurshistorik, motiveringar (färsk EF-data!) / **tomläget "Inget att visa ännu"** — samma korthöjd som Närvaro. **[FRÅGA]** erfarenhet-badge-chippet över facit + neutral vs blå skala? | Tomläget + höjd-paret |
| 18.11 | Anteckningar: composern **"Spara" + "Rensa"** (syns vid innehåll, fokus-återföring), strömmen, fas-etiketter / tomläget "Inga anteckningar ännu" | Composer-knapparna + tomläget |

## Yta 4 — Manuell anmälan `/event/<id>/ny-anmalan`

| Kort | Titta på | Våg-ändringar att omgranska |
|---|---|---|
| 18.12 | Sex-fälts-formen, skapandet (staging), bekräftelseläget. **[FRÅGA]** bekräftelse-copy vs beläggnings-modellen + required-märkningen (K84 vs "(obligatorisk)")? OBS: kontextraden under rubriken står KVAR rå — ersätts av eventväljaren (18.18), redan beslutat | — |

## Efter protokollet

Done-flippar per kvittens (tvåstegs-formen) → 18.13 A/B + kör → QA-korten
17.6/18.14/19.5 → **prod-deploy-vågen** (bas-fälten → EF-allowlistan →
verifiering; Marcus vid rodret) → session-end med full skörd (N+1).
