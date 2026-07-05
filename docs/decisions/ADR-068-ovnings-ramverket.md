# ADR-068: Övnings-ramverket — Experimentet (Vue), Övning 1, Övning 2 (epok-nivån ovanför fas/session)

- **Status:** Accepted
- **Datum:** 2026-07-05
- **Fas:** Projekt-grundande (ramar hela projektets historia + framtid; ADR-063-klassen)
- **Relation:** Kompletterar ADR-063 (dubbel leverabel; Supabase som separat senare spår) och ADR-012-precedensen (provenance bevaras); rör INTE ADR-040 (sessionsnumreringen) eller byggplanens fas-axel.

## Kontext

Projektets historia spänner tre epoker som hittills saknat namn: Vue-appen
(`~/Repon/miranon-media-os`, session 1–30 + datamodell-researchen +
conversion-plan-eran), React-repot (session 1–50 — byggde appen OCH sin egen
metod: sessionsdok-disciplinen ~S6–9, lifecycle-mekaniken S10–12,
Pocock-arbetssättet S47–50), och arbetet framåt med det uppdaterade
arbetssättet (issue-substratet + /to-prd → /to-issues → /do-work-kedjan).
Appen och Airtable-basen är dubbla leverabler med mall-/övningsroll i
Passionslyftet (ADR-063) — berättelsen om HUR de byggdes är del av
leverabeln.

Marcus-direktiv + kvittens 2026-07-05 (post-S50-close): rama historien som
ÖVNINGAR. De åtta ramverks-besluten kvitterades i Chat och säkrades i
tasks/todo.md § "Session 51 — scope" (S50-säkringspassets commit); de öppna
grenarna (terminologi-hemvist, Supabase-slutfasens beteckning,
referens-omdöpningens träffyta, mall-pekare) grillades till samsyn i dp10
(sessionsdok S51 Del 2). BUILD-LOG.md:37 ger repo-linjalens empiriska
ankare: "Vue-bygget var session 1–30 i `~/Repon/miranon-media-os/`".

## Beslut

1. **Epok-linjalen är repo-gränsen.** **Experimentet (Vue)** = allt före
   detta repo: Vue-appen `~/Repon/miranon-media-os` +
   datamodell-researchen + conversion-plan-eran. **Övning 1** = hela
   React-repots historia,
   session 1–50 — inklusive metodbygget som del av övningens berättelse
   ("började naken, byggde sin egen metod"). **Övning 2** = session 51 och
   framåt: UI + backend med det uppdaterade arbetssättet. Ingen app-kod
   ändras vid gränsen — Övning 2 tar vid där Övning 1 slutade.
2. **Nivå-hierarkin:** Experiment → Övningar → byggplanens faser →
   sessioner. "Övning" är epok-nivån OVANFÖR fas/session; den rör varken
   sessionsnumreringen (ADR-040) eller fas-axeln (byggplanen §2) —
   sessionsnummer och fas-beteckningar löper obrutna över epok-gränsen.
3. **Terminologin + hemvisterna:** kanoniska termer är **"Experimentet
   (Vue)"**, **"Övning 1"** och **"Övning 2"**; de används konsekvent i
   alla NYA dokument. Kanoniskt beslut + rationale bor HÄR; drift-lookup
   bor som EN samlad post "Övnings-ramverket" i
   `docs/reference/systemet.md` §0 (pekar hit); README bär berättelsen och
   pekar. ORDLISTA.md röres EJ — dess charter är Lottas produktdomän
   (S47 Del 7-snittet).
4. **Vue-repot refereras, röres aldrig.** `~/Repon/miranon-media-os`
   namnges och refereras härifrån (README-berättelsen, §0-posten, denna
   ADR) som fryst referens — inget arbete sker där.
5. **Fas E är Övning 2:s namngivna slutfas.** Byggplanens befintliga Fas E
   (Supabase-migration, DEFER, sist av alla byggplans-delar) ÄR slutfasen —
   ingen ny fas skapas. Fas E-raden + §4-prompten märks additivt;
   migrationens design pekas ut: "designas i egen ADR när fasen närmar
   sig". Airtable förblir datakällan fram till dess (ADR-063;
   adapter-gränsen är möjliggöraren, ADR-050-staging är befintligt
   Supabase-fotfäste).
6. **Lins-noten (två skikt — läsregeln för historiskt material):**
   (i) Ramverket infördes 2026-07-05. Historiska dokument — sessionsdok
   1–50, ADR-001–067, arkiv, BUILD-LOG-poster t.o.m. S50, stängda
   tråd-rader — nämner INTE övningarna; frånvaron är FÖRVÄNTAD, inte ett
   hål. De läses genom denna lins och röres ALDRIG retroaktivt
   (ADR-023-immutabilitet; ADR-012-precedens: provenance bevaras).
   (ii) Historiska "ADR-068"-referenser i sådant material avser
   TVÅ-AKTÖRS-ADR:n (aktör-modellen/Pocock-integrationen, WIP sedan S47) —
   numret var "nästa lediga vid S47" och reserverades aldrig; DENNA ADR
   tar 068, och två-aktörs-ADR:n tar nästa lediga vid sin gradering
   (S47:s egen re-verifieringsregel). Levande referenser är omdöpta
   nummer-neutralt till "två-aktörs-ADR:n (WIP)" i S51-svepet; citat-klass
   och stängda ytor står orörda (klassning: sessionsdok S51 Del 2).
7. **Målytorna där ramen syns** (levande ytor, S51-svepet): README
   (berättelsen överst), byggplanen (ramrubrik "byggplanen är Övning 2:s
   karta" + Fas E-märkningen), systemet.md §0-posten, BUILD-LOG:s S51-post
   (inleds "Övning 2 börjar här" — ENGÅNGS-gränsnot, ingen mall-ändring)
   samt todo-/tråd-register-huvudena. Inga framåt-pekare i mallar
   (hub-mallarna är multi-spoke-mekanik, epok-agnostiska per design).

## Alternativ som övervägdes

- **Terminologi-hemvist:** egen projektterm-sektion i ORDLISTA.md
  (avvisad — charter-vidgning av ett S47-låst snitt för tre termer);
  enbart denna ADR (avvisad — ADR-katalogen är beslutsarkiv, inte
  term-register; svag drift-upptäckbarhet); README som definitionshem
  (avvisad — berättelse-yta, inte term-register). Vald: §0-post + ADR
  (kanonisk-plats-paret).
- **Gräns-linjal:** metodbyggets start (~S6–9) eller Pocock-skiftet (S47)
  som epok-gräns (avvisade — repo-gränsen är den enda mekaniskt entydiga
  linjalen, BUILD-LOG:37-ankaret; metod-epokerna är delar av Övning 1:s
  berättelse, inte egna övningar).
- **Ny byggplans-fas för Supabase-slutfasen** (avvisad — Fas E finns
  redan, sist och DEFER; en ny fas hade skapat två sanningskällor,
  ADR-012-klassen).
- **Retroaktiv märkning av historiska dokument** (avvisad — immutabilitet
  ADR-023 + provenance ADR-012; lins-noten bär frånvaron i stället).

## Konsekvenser

**Positiva:** projektets berättelse har en kanonisk ram
(README-onboarding + Passionslyft-mallen); termerna är definierade en gång
med tydlig drift-hemvist; historiken förblir orörd men läsbar genom
linsen; "ADR-068"-tvetydigheten är upplöst (levande ytor nummer-neutrala,
numret taget av denna ADR).

**Negativa / åtaganden:** alla nya dokument bär termerna konsekvent
(BUILD-LOG:s S51-post inleder "Övning 2 börjar här"); två-aktörs-ADR:n
måste re-verifiera nästa lediga nummer vid sin gradering; §0-posten och
denna ADR är ett kanonisk-plats-par — förfinas ramen sker det via ny
ADR/supersedering, inte tyst redigering.

**Verifiering:** count-grinden 67→68 på alla tre bärare i SAMMA commit
(ADR-fil + decisions/README-katalograd + rot-README-räkneraden;
`scripts/check-adr-count.sh` grön lokalt + i CI). Post-svep-grep:
"ADR-068" i levande ytor = endast citat-klass + denna ADR:s eget nummer;
tråd-registrets T57-rad (closed), sessionsdok 46–50 och BUILD-LOG-posterna
bär historiska referenser per lins-notens skikt ii.
