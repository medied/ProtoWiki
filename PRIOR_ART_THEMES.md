# Prior art: Codex “real product” feel vs real data

This document groups the same resources as [REPORT_PRIOR_ART.md](REPORT_PRIOR_ART.md) and [PRIOR_ART.md](PRIOR_ART.md) under **two** prototyping themes:

1. **Real look and feel with Codex** — UIs that aim to look and behave as close as practical to **production** expectations and to **Figma** specs, using **Wikimedia Codex** (design tokens, icons, components) rather than ad-hoc styling. Chrome may also combine Codex with **real article HTML and ResourceLoader CSS** from production to match reader surfaces.
2. **Real data** — Content and signals that come from **actual wikis**, either **live** (APIs on each run) or **pulled once** and then used from static files, as opposed to fully **hand-authored** or **mock** page content.

Many entries support **both** themes to some degree; a few are strong on one and weak on the other, and some are **not UI prototypes** at all (docs or agent skills).

---

## Theme 1: Real look and feel with Codex

**What it means in practice (for this document):** The project is built around **Vue (or a documented HTML/JS app)** and **Codex** as the primary design system for **app UI**; documentation or rules may require **Figma** alignment, **token-first** CSS, and shared Wikipedia header/footer components. A prototype can still **embed** non-Codex layers (e.g. `.mw-parser-output` article HTML, **VisualEditor/OOUI** bundles) to match **production** article or editor surfaces—that is a deliberate mix of “Codex for our chrome” and “production assets for the core reading/editing surface.”

| Resource | Relation to this theme | Notes |
|----------|-------------------------|--------|
| **Wikipedia Article Template** (bmartinezcalvo) | **Strong** | README centers **Codex**; `codex-ux-prototyping-rules.md` makes **Figma** the top priority and Codex the single source of truth for design-system styling. Explicitly for **UX validation**, not production code. |
| **Amin’s monorepo** (`wikimedia-prototypes`) | **Strong** | Root `CLAUDE.md` and boilerplate require **Codex** components, **Codex icons**, and **design tokens**; shared **`WikipediaHeader` / `WikipediaFooter` / `AdminPanel`**; rules against duplicating or bypassing the system. |
| **Wikihack starter** (Eric Gardner) | **Strong for app + hybrid article** | **Codex** for app-level UI and tokens; article body uses **real HTML** and **ResourceLoader** styling so the **content** area matches production reader rendering while the shell is Codex. |
| **FakeMediaWiki — host** (todepond) | **Strong, with mixed stacks** | **Vue + Codex** for the demo shell and most prototypes; **wrappers** (Special, Chrome, Fullscreen, Mobile, Component) frame experiments in **Wikipedia-like** layouts. The vendored **VisualEditor** and **OOUI** under `public/ve/` are **not** Codex but are **real production editor** assets used where editor fidelity matters. |
| **`fakewiki` (npm package)** | **Partial** (supports Codex UIs) | The library is **data + hooks + small styles** (e.g. `fakewiki/style/delta.css`); it lists **`@wikimedia/codex-icons` as a peer** and ships **`docs/CODEX_REFERENCE.md`**, `ICON_REFERENCE.md`, etc. It does not **render** a full Codex app by itself—consumers build the UI with Codex. |
| **Wiki Agent Skills** (Wiki Skills) | **Partial** (meta) | **Not a runnable UI.** The **`codex-design-tokens`** skill helps agents build UIs with Codex tokens; other skills are unrelated to a pixel-perfect app. |
| **FakeMediaWiki — Wiki signals** (folder) | **Not applicable** | **Documentation only** on using real data in prototypes; no components or Figma. |
| **Wikipedia UX Prototyping System** (`boiler_plate`, Sudhanshugtm) | **Weak as “Codex-first”** | README emphasizes **vendored Wikipedia CSS/JS** and static HTML to mirror **production** skin and layout. It is **not** positioned as a Codex design-system prototype; the “real” feel comes from **mirrored site CSS**, not from tokens and components. README §1.5 also describes a **separate** VE-style editor opened via **`?editor=1`** or edit links (`assets/js/editor.js`, `assets/css/editor.css`)—a **stand-in** for editing, not the full production VisualEditor bundle. |

---

## Theme 2: Real data (live or fetch-once)

**What it means in practice (for this document):** The UI is driven (fully or in part) by **real wiki** pages, revisions, search, or signals—either by calling **public APIs** on each use (**live**), or by running a **one-off import** and shipping **static** HTML/CSS/JS for offline or repeatable demos (**pulled once**). **Mock** or **hand-edited** content in source is the opposite extreme for this theme.

| Resource | Relation to this theme | Data mode | Notes |
|----------|-------------------------|-----------|--------|
| **Wikihack starter** | **Strong (live)** | **Live** | **REST** article HTML, **opensearch**, **ResourceLoader** for styles; no snapshot step in the documented flow. |
| **`fakewiki` + FakeMediaWiki demos** | **Strong (live)** | **Live** | **`FakeWiki`** and hooks call **Wikimedia REST**, **MediaWiki REST**, and **Action API** (see package README and reference). The host app’s **Wiki signals** interactive demo and API playground also exercise **real** responses. |
| **Wiki signals** (`real-data-signals/`) | **Meta (enables real data)** | **N/A (docs)** | Explains how to use **inference, analytics, links, curation** signals with real MediaWiki; does not fetch data by itself. |
| **Wikipedia UX Prototyping System** (`boiler_plate`) | **Strong (snapshot + limitations)** | **Pulled once** (then static) | **`fetch_page.py`** downloads any page; **vendored CSS/JS**; README **limits** search and save to **non-production** behavior after fetch. |
| **Wikipedia Article Template** | **Weak (mock by design)** | **Mock** | **No real APIs** per `codex-ux-prototyping-rules.md`; content lives in `WikipediaPage.vue` for **fidelity to Figma**, not for arbitrary live articles. |
| **Amin’s monorepo** | **Varies by app** | **Typically live in practice** | The monorepo’s **documented** focus is **Codex** and **shared shell**; individual apps (e.g. article flows) are expected to use real APIs as needed, but the **default contract** in `CLAUDE.md` is not “always live data”—it is “consistent prototype structure.” |
| **Wiki Agent Skills** | **N/A for runnable data in a browser** | **N/A** | Teaches agents **REST API**, **Wikidata**, **DB**, **extensions**—useful for **writing** data-backed code, not for shipping a pre-built data UI. |
| **FakeMediaWiki — VisualEditor** (vendored `public/ve/`) | **Orthogonal to “wiki content data”** | **N/A** | Brings **real editor** client behavior; it does not replace **page** or **revision** APIs for content—those still come from **`fakewiki`** or other app logic. |

---

## Combined view: both themes

Rough positioning (not a scorecard—**many projects deliberately choose one theme over the other**):

| | Strong on **Codex / Figma-style product feel** | Strong on **real data** (live or fetch-once) |
|--|-----------------------------------------------|---------------------------------------------|
| **Wikipedia Article Template** | Yes | No (mock) |
| **Amin’s monorepo** | Yes | Often yes (per app) |
| **Wikihack starter** | Yes (hybrid: Codex + prod article skin) | Yes (live) |
| **FakeMediaWiki host + `fakewiki`** | Yes (plus VE/OOUI where needed) | Yes (live via APIs) |
| **`boiler_plate`** | No (vendored skin, not Codex-first) | Yes (snapshots) |
| **Wiki signals** | No (docs) | N/A (reference for real data) |
| **Wiki Agent Skills** | Partial (token skill) | N/A (agent assist, not a host) |

**Overlap called out in [REPORT_PRIOR_ART.md](REPORT_PRIOR_ART.md):** Several stacks aim at **“real Wikipedia”**; **Wikihack** and **FakeMediaWiki/`fakewiki`** lean on **live** APIs, while **`boiler_plate`** leans on **static mirrors** after **`fetch_page.py`**. **Wikipedia Article Template** inverts the tradeoff: **maximum Codex + Figma** control with **synthetic** article content.

---

## References

- [REPORT_PRIOR_ART.md](REPORT_PRIOR_ART.md) — per-repo facts and source links.
- [PRIOR_ART.md](PRIOR_ART.md) — list of repositories and local paths.
