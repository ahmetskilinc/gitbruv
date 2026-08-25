# Design consistency audit — clickable/interactive UI

Headless walkthrough of every major page + the new-repo modal, logged in as a seeded user (`designer/design-lab` with issues, labels, milestone, draft release, discussion). Screenshots in `./screenshots/` (numbered, referenced below). Viewport 2056×1128 (2×), dark theme.

Severity: **P1** = broken/regression, **P2** = clear cross-page inconsistency, **P3** = polish.

---

## A. Regressions introduced by the sidebar migration (fix first)

**A1 — P1 — Branch selector + Clone URL show on every repo sub-page.** `[06,07,10,12,13,14,15]`
The branch/`HTTPS` clone-URL row lives in the shared repo layout (`app/_main/$username/$repo.tsx`), so it now renders on Issues, Issue detail, PRs, Discussions, Projects, Releases, Milestones and **Settings** — where it's irrelevant (you can't clone from an issue). It also floats far-right with a **large empty gap on the left** because the tab bar that used to fill that row was removed.
→ Show the branch selector + clone URL **only on Code / tree / blob / commits** views (move them out of the shared layout into the Code route, or conditionally render on `pathname` being a code view). Rebalance the row.

**A2 — P1 — Topbar breadcrumb always says "Explore" off repo pages.** `[02,03,04,16,17]`
`AppTopbar` falls back to an "Explore" link on Home, Notifications, Explore, Profile and Settings. It's wrong/duplicative on all of them (the sidebar already has Explore).
→ Show the real page context (or nothing) when not in a repo; only render the `owner/repo` breadcrumb on repo routes.

**A3 — P1 — "New discussion" button is visually broken.** `[12]`
The `+` icon overlaps the wrapping "New discussion" label (no gap/flex on the button content), producing a two-line, overlapping button. Every other "New X" button is fine.
→ Fix the button's icon+label layout (use `Button` with `gap`/`data-icon`, don't hand-roll).

**A4 — P2 — Repo sub-page content misaligns with the repo header.** `[12,13]`
Discussions and Projects wrap content in `max-w-4xl mx-auto`, but the repo header (name/star/fork/clone) above them is full-width — so the page's right-edge CTA ("New discussion", "New project") doesn't line up with the header's controls.
→ Use one shared content width for all repo pages (see G).

---

## B. Tabs / filter controls — five different patterns for the same idea — P2

The "switch view / filter by state" control is styled differently on nearly every page:
- **Dark segmented pill**: Issues `2 Open / 0 Closed` `[06]`
- **Underline tabs**: Milestones Open/Closed `[10]`, Notifications All/Unread `[04]`
- **Full-width segmented**: Explore Repositories/Users `[03]`, Profile Repositories/Starred `[17]`
- **Centered segmented**: Settings Profile/Account/Security/OAuth `[16]`
- **Red-fill active pills**: Explore sort Most stars/Recently updated/Newest `[03]`

→ Pick ONE tabs component (the shadcn `Tabs`) and ONE "active" treatment; apply everywhere. Decide segmented vs underline once.

## C. Form controls — raw vs themed — P2

- **Raw browser checkboxes (blue accent)**: Repo Settings → Branch protection `[15]`, User Settings preferences.
- **Custom themed red radios**: New-repo modal Public/Private `[18]`.
So the same app mixes native blue checkboxes with themed red radios.
→ Add & adopt `Checkbox` + `RadioGroup` primitives; theme to `--primary`. The Public/Private radio-cards in repo settings `[15]` and the modal `[18]` should be the same component.

## D. Card component vs hand-rolled bordered boxes — P2

- **Uses `Card`** (rounded-lg + `ring-1 ring-foreground/10`): User Settings `[16]`, Repo Settings `[15]`.
- **Hand-rolled `border rounded-lg` divs**: Milestones `[10]`, Releases `[14]`, Notifications `[04]`, Discussions/Projects cards `[12,13]`, Home repo card `[02]`.
→ Standardize surfaces on the `Card` primitive (note base-mira Card uses a **ring**, not a border — the hand-rolled boxes use a border, so they read subtly differently).

## E. Empty states — three patterns — P2

- **Projects**: full box, centered icon, `text-xl` title, description, **action button inside** `[13]`
- **Notifications**: box, icon, `text-sm` text, **no action** `[04]`
- **Issues (empty)**: no box at all
→ Add & adopt one `Empty` component (icon + title + description + optional action) with fixed typography.

## F. Page titles / heading typography — P2

Same "page H1" is sized differently, and some pages have none:
- `text-2xl`: Explore `[03]`, Projects `[13]`, Discussions `[12]`, Settings `[16]`, Profile name `[17]`
- `text-xl`: Releases `[14]`
- `text-lg`: Notifications `[04]`
- **none**: Issues list `[06]`, Milestones `[10]`
Also inconsistent icon-beside-title: Releases/Explore/Notifications have one; Issues/Milestones don't.
→ One `PageHeader` (title size/weight + optional icon + action slot) used on every list/detail page.

## G. Container width / centering — P2

Every page picks its own width: Explore = full-width `container` `[03]`; Settings & repo layout = `max-w-6xl` `[15,16]`; Discussions/Projects = `max-w-4xl mx-auto` `[12,13]`; Notifications = `max-w-3xl` `[04]`; Profile = `max-w-7xl` `[17]`. Under the sidebar this makes content jump around and mis-center between pages.
→ Route everything through the `PageContainer` helper (already created) with a small set of sizes; pick one per page-type.

## H. Badges / pills — P3

- Release **Draft** badge is `rounded-lg`, not the base-mira Badge `rounded-full` `[14]`.
- `PUBLIC` repo badge, issue/PR **state** badges, and inline pills are hand-rolled with varying radius/padding `[06,07,14]`.
→ Rebuild all pills on the `Badge` primitive (`rounded-full`, consistent padding/typography).

## I. Buttons — labeling & icon consistency — P3

- **Confusing duplicate naming**: Issues list has both **"Label"** (filter) and **"Labels"** (manage) buttons side by side `[06]`.
- **Duplicate CTA**: Projects empty state shows **"New project"** (header) and **"Create a project"** (in-box) doing the same thing `[13]`.
- **Icon inconsistency**: Issue-detail right rail — **"Close issue"** has no icon, **"Lock conversation"** has one `[07]`.
- **Cancel button** in the new-repo modal reads as a solid light/white fill rather than a quiet ghost/outline `[18]`.
→ Rename filter→"Filter by label", keep one CTA per empty state, give paired action buttons consistent icon treatment, and normalize the modal's Cancel to `variant="ghost"`.

## J. Icons — P3

Mostly disciplined (`size-4` default, `strokeWidth={2}`), but `w-N h-N` pairs persist in ~15 spots (file-tree, social links, profile, avatars) and a couple of one-off sizes (`size-7`, `size-12`).
→ Normalize `w-N h-N` → `size-N`.

---

## Screenshot index
01 home (logged out) · 02 home · 03 explore · 04 notifications · 05 repo code (empty) · 06 issues list · 07 issue detail · 08 new issue · 09 labels · 10 milestones · 11 pulls list · 12 discussions list · 13 projects · 14 releases · 15 repo settings · 16 user settings · 17 profile · 18 new-repo modal

## Status (2026-08-23)

All findings addressed on `audit-fixes`:

- **A1–A4** fixed (branch selector gated to code views, breadcrumb fixed, discussion button fixed, widths unified).
- **B** — shadcn `Tabs` everywhere (issues, milestones, notifications, profile, settings, explore).
- **C** — `Checkbox`/`RadioGroup` adopted (user settings, repo settings, releases, PR form); shared `VisibilityRadioGroup` used by both the new-repo modal and repo settings.
- **D** — `Card` (or its ring idiom) on releases, projects, labels, milestones forms, repository/user cards.
- **E** — one `Empty` component on explore, notifications, discussions, projects, releases, milestones, issues, labels.
- **F** — `PageHeader` (`components/layout/page-header.tsx`): text-xl semibold + size-5 primary icon + action slot, used on all list pages.
- **G** — `PageContainer` (max-w-6xl px-4 py-6) adopted on reworked pages; remaining pages use the identical hand-written idiom. Stragglers (3xl/4xl detail pages) normalized to the same px/py.
- **H** — `Badge` primitive for state badges, Draft/Pre-release, visibility pills.
- **I** — "Filter by label" rename, one CTA per empty state (header CTA hides when list is empty), Close issue got an icon, modal Cancel is ghost.
- Topbar now `bg-sidebar` (borderless) to match the inset sidebar variant.

## Mapping to the Phase 2 plan
Most of this is already in the approved Phase 2 sweep (tokens, Badge/Empty/Skeleton/Alert/Checkbox/RadioGroup adoption, container/typography normalization). **New items not in the plan** — fold in: **A1–A4** (sidebar-migration regressions), **B** (unify tabs/filters), **I** (button labeling/CTA dedupe). Recommend doing A1–A4 first (they're regressions), then the systemic sweep.
