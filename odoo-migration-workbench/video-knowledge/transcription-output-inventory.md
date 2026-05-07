# Transcription Output Inventory

Källa: `/Users/marcus/Repon/marcus-system/odoo-events-transcripts-openai`

| fil/sökväg | källa/video/lektion | format | innehållstyp | käll-URL | timestamps finns | råtext-risk | bör committas | relevans | verifieringsstatus | kommentarer |
|---|---|---|---|---|---|---|---|---|---|---|
| `INDEX.md` | Playlist inventory | md | metadata/index | YouTube playlist | Nej | Låg | Ja, sammanfattad referens ok | High | Lästs | Innehåller 17 video-titlar och durations. |
| `QUALITY_REPORT.md` | Export QA | md | quality report + transcript samples | OpenAI transcription job | Nej | Medium pga samples | Nej som råkopia | High | Lästs, ej kopierad | Visar 17/17 complete, errors 0. |
| `manifest.json` | Playlist/video metadata | json | metadata | YouTube video URLs | Nej | Låg | Nej, extern output | High | Lästs | 17 items med video-id, title, url, duration. |
| `summaries/*.md` | 17 video summaries | md | sammanfattningar | YouTube videos | Nej | Låg | Ja om egna korta referat, men original lämnas externt | High | Lästs | Används som primär tutorialintegration. |
| `transcripts/*.md` | 17 raw-ish transcripts | md | råtranskript | YouTube/OpenAI transcription | Delvis/nej | Hög | Nej | High | Inventerat, inte committat | Behandlas som tredjepartsmaterial. |
| `api_raw/*.json` | 17 API outputs | json | råoutput | OpenAI transcription | Okänt | Hög | Nej | Medium | Inventerat | Ska inte committas. |
| `captions_raw/` | none | dir | tom katalog | n/a | n/a | Låg | Nej | Low | Inventerat | Inga captionfiler. |

## Kompletthet

Outputen är komplett enligt `QUALITY_REPORT.md`: 17/17 videos, 0 errors, total duration 2:01:11. Integration är klar på sammanfattningsnivå. Råtranskript committas inte.
