# Format för HTML-rapport

Arkitekturgranskningen renderas som en enda självständig HTML-fil i operativsystemets tillfälliga katalog. Tailwind och Mermaid hämtas båda från CDN:er. Mermaid hanterar grafformade diagram tillförlitligt; handbyggda divar och inline-SVG hanterar mer redaktionella visualiseringar som massdiagram och tvärsnitt. Blanda dem — använd inte Mermaid för allt, då blir rapporten generisk.

## Grundstruktur

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* litet speciallager för sådant Tailwind inte täcker rent:
         streckade skarvlinjer, handritade pilspetsar och liknande */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## Sidhuvud

Visa reponamn, datum och en kompakt förklaring: heldragen ruta = modul, streckad linje = skarv, röd pil = läckage, tjock mörk ruta = djup modul. Ingen introduktionstext — gå direkt till kandidaterna.

## Kandidatkort

Diagrammen bär huvudvikten. Prosan är sparsam, tydlig och använder ordlistetermerna från `/codebase-design` utan omskrivningar.

Varje kandidat är en `<article>`:

- **Titel** — kort och namnger fördjupningen, till exempel ”Collapse the Order intake pipeline”.
- **Badge-rad** — rekommendationsstyrka (`Strong` = smaragd, `Worth exploring` = amber, `Speculative` = skiffer) samt tagg för beroendekategori (`in-process`, `local-substitutable`, `ports & adapters`, `mock`).
- **Filer** — monospaced lista, `font-mono text-sm`.
- **Före-/efterdiagram** — mittpunkten. Två kolumner sida vid sida. Se mönster nedan.
- **Problem** — en mening om vad som gör ont.
- **Lösning** — en mening om vad som förändras.
- **Vinster** — punkter på högst sex ord, exempelvis ”Tests hit one interface”, ”Pricing logic stops leaking”, ”Delete 4 shallow wrappers”.
- **ADR-ruta**, om relevant — en rad i en ambertonad ruta.

Inga förklarande stycken. Behöver diagrammet ett stycke för att förstås, rita om diagrammet.

## Diagrammönster

Välj det mönster som passar kandidaten och blanda dem. Gör inte varje diagram likadant; variation är en del av poängen.

### Mermaid-graf — arbetshästen för beroenden och anropsflöden

Använd Mermaid `flowchart` eller `graph` när poängen är ”X anropar Y anropar Z — och se röran”. Omslut den med ett Tailwind-stylat kort så att den inte känns inklistrad. Styla med `classDef` för röda läckagekanter och mörk djup modul. Sekvensdiagram passar bra för ”före: sex tur-och-returer; efter: en”.

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### Handbyggda rutor och pilar — när Mermaids layout motarbetar dig

Skapa moduler som `<div>`-element med ramar och etiketter. Skapa pilar med inline-SVG, `<line>` eller `<path>`, absolut placerade över en relativ behållare. Använd detta när efterdiagrammet ska kännas som en djup modul med tjock ram och nedtonade interna delar; Mermaid ger inte rätt visuell tyngd.

### Tvärsnitt — bra för skiktad grundhet

Stapla horisontella band (`h-12 border-l-4`) för att visa lager ett anrop passerar. Före: sex tunna lager som knappt gör något. Efter: ett tjockt band märkt med det samlade ansvaret.

### Massdiagram — bra när gränssnittet är lika stort som implementationen

Rita två rektanglar per modul: en för gränssnittets yta och en för implementation. Före: gränssnittsrektangeln är nästan lika hög som implementationsrektangeln, alltså grund. Efter: gränssnittet är kort och implementationen hög, alltså djup.

### Kollapsad anropsgraf

Före: ett träd av funktionsanrop som kapslade rutor. Efter: samma träd kollapsat till en ruta, med nu interna anrop nedtonade inuti.

## Stilvägledning

- Luta åt redaktionell form, inte företagsdashboard. Generöst med luft. Serif fungerar gärna för rubriker; `font-serif` passar med sten- och skiffertoner.
- Använd färg sparsamt: en accent, smaragd eller indigo, plus rött för läckage och amber för varningar.
- Håll diagram ungefär 320 px höga så att före och efter ryms sida vid sida utan rullning.
- Använd `text-xs uppercase tracking-wider` för moduletiketter i diagram — de ska läsas som en skiss, inte UI.
- De enda skripten är Tailwind-CDN och Mermaid ESM-importen. Rapporten är i övrigt statisk: ingen appkod och ingen interaktivitet utöver Mermaids egen rendering.

## Avsnittet Top recommendation

Ett större kort: kandidatnamn, en mening om varför och ankarlänk till kandidatens kort. Inget mer.

## Ton

Rak engelska, kortfattad — men arkitekturens substantiv och verb kommer direkt från `/codebase-design`. Korthet är inte en ursäkt att glida i terminologi.

**Använd exakt:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

**Ersätt aldrig:** component, service, unit (för module) · API, signature (för interface) · boundary (för seam) · layer, wrapper (för module när du menar module).

**Formuleringar som passar stilen:**

- ”Order intake module is shallow — interface nearly matches the implementation.”
- ”Pricing leaks across the seam.”
- ”Deepen: one interface, one place to test.”
- ”Two adapters justify the seam: HTTP in prod, in-memory in tests.”

**Vinstpunkter** namnger vinsten i ordlistetermer: *”locality: bugs concentrate in one module”*, *”leverage: one interface, N call sites”*, *”interface shrinks; implementation absorbs the wrappers”*. Skriv inte *”easier to maintain”* eller *”cleaner code”* — de termerna finns inte i ordlistan och förtjänar inte platsen.
