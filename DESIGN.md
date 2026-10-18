# Humi design: dark and light mode

The reference for how Humi looks in dark mode (the original, "house at
night") and light mode, across the whole cloud-ui: the landing page
(`src/Landing.vue`, `src/landing/*`), the auth pages and the signed-in app.
When building or restyling a screen, use the values and shared classes here
rather than inventing new ones. If something you need is missing, add it
here (and to `theme.css` / `ui.css`) first, then use it.

The Appliance UI (`huemie-ui`) has its own companion guide,
[`huemie-ui/DESIGN.md`](../huemie-ui/DESIGN.md). It builds on this one:
`theme.css`, `ui.css`, `useTheme.js`, `ThemeToggle`, `BrandMark` and
`UserChip` are copied there unchanged, so change them here first and copy
them across. New tokens or colour meanings are added here first, even when
only the Appliance needs them.

Where things live:

| File | What |
|---|---|
| `src/theme.css` | Colour tokens for both themes |
| `src/ui.css` | Shared app UI: page, panel, buttons, fields, badges, alerts, rows, table, dialog, auth card |
| `src/components/` | `BrandMark`, `ThemeToggle`, `UserChip`, `AppTopBar` |
| `src/App.vue` | The three layouts (see section 8) |

## 1. Idea

**"Welcome home."** A house at night with its lights on. Dark, calm
surfaces. Warm light where things happen at home. A cooler blue for the
optional Cloud. Most of the screen is quiet, and colour and glow are kept
for what matters.

Three rules follow from that:

1. **Colour has meaning.** Amber is home/the Appliance, blue is the Cloud,
   green means "live / connected / OK". Don't use them as decoration.
2. **Glow is light, not decoration.** Things that are "on" (windows,
   active devices, the connected tunnel) glow. Things that are off don't.
3. **The Cloud is always secondary and optional.** Visually it is dashed,
   cooler and dimmer than home. Never give it more weight than the Appliance.

## 2. Colour tokens

All colours are tokens defined in **`src/theme.css`**, once per theme, keyed
by `data-theme="dark" | "light"` on `<html>`. Components must use the
tokens (`var(--warm)`, …) and never hard-code a themed colour.

- Translucent variants come from the token:
  `color-mix(in srgb, var(--warm) 15%, transparent)`. Don't write `rgba(…)`
  with literal channels.
- Accent colours used **as text** use the `-ink` variant (`--warm-ink`,
  `--green-ink`, `--cloud-ink`), which is darker in light mode for contrast.
- SVG `stop-color`/`fill` presentation *attributes* can't read CSS
  variables. Use `style="stop-color: var(--token)"` or a CSS rule instead.
- Exceptions that stay the same in both themes: the physical Appliance
  device (dark body `#26364a → #141e2b`, `#f3efe8` wordmark), the lit
  bulb, the doorway light, the switch knob (`#f8f7f4`) and data packets.
- Don't name animation variables after tokens. A scene phase called
  `--cloud` once silently replaced the colour inside that scene.

### Theme switching

- `useTheme()` (`src/composables/useTheme.js`) holds the theme and
  `toggleTheme()`. The toggle is `ThemeToggle.vue`, the round sun/moon
  button. It is in **every** layout's top bar, directly left of Log in /
  the user chip. It shows the theme you would switch *to*.
- A manual choice is saved in `localStorage` (`humi-theme`) and used on
  every later visit.
- With no saved choice, the **local time** decides: light from 07:00 to
  19:00, dark otherwise. While the page stays open it keeps following the
  clock (checked every minute).
- An inline script in `index.html` applies the theme before first paint,
  so the page never flashes the wrong one. It must use the same rule as
  `useTheme.js`.

### Light mode at a glance

Warm greys plus green, with deeper accents that stay clearly separate from
the background. Same meanings as dark mode.

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0b1119` | `#ebe9e5` |
| `--interior` | `#0f1620` | `#e2dfda` |
| `--surface` / `--surface-2` | `#121b27` / `#152030` | `#f8f7f4` |
| `--text` | `#f3efe8` | `#24221f` |
| `--muted` | `#9aa8b8` | `#5d5851` |
| `--faint` | `#5f6d7d` | `#8a847b` |
| `--ink` (base for lines/fills) | `#ffffff` | `#2b2722` |
| `--shadow-ink` | `#000000` | `#4a4033` |
| `--warm` / `--warm-ink` | `#ffc46b` / same | `#c98420` / `#8a560f` |
| `--green` / `--green-ink` | `#42b983` / same | `#2a9d68` / `#1d7a50` |
| `--cloud` / `--cloud-ink` | `#8fc7ff` / same | `#4f86bd` / `#2f5f8f` |
| `--danger` / `--danger-ink` | `#ff8a7a` / `#ff9c8f` | `#c4452f` / `#a3361f` |
| `--btn-primary-bg` | amber gradient `#ffd68f → #ffb547` | green gradient `#36b27b → #23865a` |
| `--btn-primary-text` | `#2a1a05` | `#ffffff` |
| `--humi-gradient` | amber → pale gold → green | ochre → green |
| `--ambient` (firefly strength) | `1` | `0.55` |

In light mode the **primary action is green**, not amber. The house and
other home accents keep a deeper ochre. The cloud loses its glow when off
(`--cloud-off-filter`) by fading out, not by darkening.

The tables below give the dark values and describe each role.

### Base

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b1119` | Page background ("night"). Also set on `html` while the page is shown. |
| `--interior` | `#0f1620` | Inside the house. The Appliance scene background, and the colour the hero fades to. |
| `--surface` | `#121b27` | Raised solid surfaces: house body, switch, icon discs (`#152030`). |
| — (surface, glass) | `rgba(21, 32, 48, 0.9)` | Floating chips/pills over scenes. |
| — (appliance) | `linear-gradient(160deg, #26364a, #141e2b 70%)` | The Appliance device itself. |

### Text

| Token | Value | Use |
|---|---|---|
| `--text` | `#f3efe8` | Primary text. Warm off-white, never pure `#fff` (light mode: warm charcoal, never pure `#000`). |
| `--muted` | `#9aa8b8` | Body copy, secondary labels, inactive nav. |
| `--faint` | `#5f6d7d` | Footer, fine print. |
| `--on-warm` | `#2a1a05` | Text on amber buttons/pills. |
| — (on-light) | `#0b1119` | Text on the off-white "Log in" button and avatar. |

### Meaning (accents)

| Token | Value | Meaning | Examples |
|---|---|---|---|
| `--warm` | `#ffc46b` | **Home / Appliance / local** | House outlines, windows, "Always" badge, Appliance kicker, home status |
| — (warm light) | `#ffd68f` → `#ffb547` | Lit things, primary CTA | `.btn-warm` gradient, lit bulb, doorway light (`#ffe6b3` → `#ffb547`) |
| `--green` | `#42b983` | **Live / connected / OK** (also the brand green of the older UI) | Appliance LED, wires, connected tunnel, switch "on", inbound data |
| `--cloud` | `#8fc7ff` | **Cloud / optional** | Cloud kicker, "Optional" badge, feature chips, hint text |
| — (cloud body) | `#eaf6ff` → `#9fb8cc` | The cloud shape when connected | |

Amber is also used for outbound commands (appliance → device) and green for
inbound readings (device → appliance).

**Danger** (`--danger`, a warm red) is only for destructive actions (Remove,
Revoke, Decline, Log out on hover) and errors. It is never decoration.

### Lines and translucent fills

Borders and fills are white or an accent at low alpha. Don't use solid greys.

| Use | Value |
|---|---|
| Hairline / dividers | `rgba(255,255,255,0.06)` |
| Card border | `rgba(255,255,255,0.08)` |
| Chip / control border | `rgba(255,255,255,0.10 – 0.16)` |
| Hover border | `rgba(255,255,255,0.35)` or the accent at `0.6` |
| Card fill | `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))` |
| Subtle fill (ghost button, chip) | `rgba(255,255,255,0.04 – 0.07)` |
| Accent tint (badge, tick) | accent at `0.12 – 0.15` |
| Accent border | accent at `0.25 – 0.4` |

Cloud things use a **dashed** border (`1px dashed rgba(143,199,255,0.25–0.5)`),
home things a solid one. This is part of the meaning, so keep it.

### Glow and shadow

- **Glow** (things that are on): `drop-shadow(0 0 6–12px <accent at 0.5–0.9>)`
  on SVG, `box-shadow: 0 0 <n> <accent at 0.2–0.45>` on boxes.
- **Ambient light**: big soft radial gradients, accent at `0.05 – 0.22`,
  e.g. `radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,181,71,0.16), transparent 70%)`.
- **Depth shadow** (floating objects): `0 8px 30px rgba(0,0,0,0.4–0.5)`.
- Coloured shadow under a primary button: `0 8px 30px rgba(255,181,71,0.25)`,
  rising to `0.45` on hover.

## 3. Typography

- **Font**: system stack:
  `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`.
  No web fonts.
- Headings are **heavy and tight**: 800 for the hero, 700 for the rest. The larger the text, the tighter the
  letter-spacing.

| Role | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| Hero headline | `clamp(3.4rem, 11vw, 9.5rem)` | 800 | `-0.055em` | 0.95 |
| Closing headline | `clamp(2.8rem, 8vw, 6rem)` | 700 | `-0.05em` | 1 |
| Section title | `clamp(2.2rem, 5vw, 3.8rem)` | 700 | `-0.04em` | — |
| Slide title | `clamp(2rem, 4vw, 3.2rem)` (mobile `clamp(1.6rem, 7vw, 2.2rem)`) | 700 | `-0.035em` | 1.05 |
| Card title | `1.6rem` | 700 | `-0.03em` | — |
| Lede / body | `clamp(1rem, 1.4vw, 1.2rem)` – `1.3rem` | 400 | 0 | 1.55–1.6 |
| Kicker / eyebrow | `0.8rem`, UPPERCASE | 600 | `0.12em` – `0.16em` | — |
| Badge | `0.72rem`, UPPERCASE | 700 | `0.12em` | — |

- Body copy: `--muted`, max width about `34–44ch`, `text-wrap: balance` on
  centred ledes.
- **"Humi." gradient**: `linear-gradient(100deg, #ffc46b, #ffe2a8 25%, #42b983 55%, #ffc46b 85%)`
  with `background-clip: text`, `background-size: 250%`, slowly
  animated (`shimmer`, 8s linear). Use it only on the word "Humi" in big
  headlines.
- Name: always **Humi**, with a capital H, in all user-facing text, logos and
  wordmarks.

## 4. Shape and spacing

| Thing | Radius |
|---|---|
| Buttons, chips, pills, badges, switches | `999px` (fully round) |
| Cards | `28px` |
| Appliance device | about `4.5cqw` (soft rectangle) |
| Small marks (progress dots, bars) | `2–3px` |

- Page content max width: `1100–1200px`, side padding `24px` (`16px` on
  phones).
- Top bar height: `64px`. Content on full-screen slides keeps clear of it.
- Grid gaps: `24px` between cards, `48px` between copy and visual.
- Breakpoints: `860px` (scenes stack: visual above copy), `760px` (card grid
  becomes one column), `640px` (top bar hides section links).

## 5. Components

- **Primary button** (`.btn-warm`): round, amber gradient, `#2a1a05` text,
  weight 600, padding `12px 26px` (`15px 32px` large), warm shadow; hover
  lifts `-2px`.
- **Secondary button** (`.btn-ghost`): round, `rgba(255,255,255,0.04)`
  fill, `0.16` white border, `--text` text; hover makes the border and fill
  brighter.
- **Top bar** (`TopBar.vue`): fixed. Transparent at the top of the page. Once
  scrolled: `rgba(11,17,25,0.62)` plus `backdrop-filter: blur(14px) saturate(140%)`
  and a hairline bottom border. A 2px amber → green gradient progress bar
  along the bottom. Right side: off-white **Log in** pill, or a user chip
  (gradient avatar with initials + name + green arrow) linking to `/home`.
- **Kicker**: numbered circle (`30px`, accent border at `0.4`) followed by
  uppercase label in the accent colour of the section (amber for home, blue
  for Cloud).
- **Badge**: pill, uppercase. Home: solid tint `rgba(255,196,107,0.15)` +
  amber text. Cloud: dashed blue border + blue text.
- **Chip** (floating label in scenes): glass surface, accent border at
  `0.35–0.4`, weight 600, round.
- **Card** (`.layer`): radius 28, card fill, hairline border, a soft
  radial glow of its accent from the top. Cloud cards have a dashed border.
- **Switch**: round track `#2a3747` → `#42b983` when on, off-white thumb
  with a slight overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`). The label
  says the state in words ("Connected" / "Off").
- **Icons**: simple stroke icons in a 24×24 box, `stroke-width 1.6`,
  round caps and joins, `fill: none`, in `#dfe6ee` on dark discs.
- **House mark**: the house outline (roof + walls, round joins, amber, glow)
  is the brand motif. The top-bar logo and the hero house share it. The
  hero door has an amber stroke **H**.

## 6. Motion

Motion should feel like **moving through a home**: smooth, unhurried, and
never jumpy.

### Easing

| Name | Curve | Use |
|---|---|---|
| Out (default enter) | `cubic-bezier(0.2, 0.8, 0.2, 1)` or `(0.16, 1, 0.3, 1)` | Things arriving: text, reveals |
| In-out | cubic in-out (`useScrollScene` `inOut`) | Timed scene phases, slide glides |
| In | cubic in | Accelerating moves (the zoom through the door) |
| Overshoot | `cubic-bezier(0.34, 1.4–1.56, 0.64, 1)` | Small playful pops only: chips, switch thumb |
| Draw | `cubic-bezier(0.6, 0, 0.3, 1)` | SVG line drawing |

### Durations

- Micro (hover, colour): `0.2 – 0.4s`.
- Text swap between slides: old text leaves in `~0.45s` (fade + blur 8px +
  move up 40px), new text enters in `0.9 – 1.1s` after a `0.25s` delay.
- Scene phases: `0.7 – 1.5s`, staggered by `90 – 140ms` (e.g. devices fly in
  one after another).
- Slide glide (one wheel step): `~0.75 – 1.3s`, eased in-out.
- Hero intro: `1.9s` forward, `1.4s` reverse.
- Ambient loops (LED breathing, cloud float, shimmer): `2.4 – 8s`, gentle.

### Scroll model

- The page is a sequence of **full-screen slides** (CSS scroll-snap,
  `y mandatory` on `html.landing-page`). One wheel gesture moves exactly one
  slide (`useSlideScroll`). A step never moves more than one screen.
- Snap points are **1px anchors** (`.snap`), not the tall sections
  themselves, because a snap area taller than the viewport scrolls freely.
- Arriving at a slide **triggers** its animations, which then run on time
  (`useScrollScene` "triggered" phases). They are not pinned to the scroll
  position.
- Animate with CSS custom properties (`--name: 0..1`) written by JS, and
  keep the visuals in CSS. Don't make Vue re-render on every frame.
- Things enter by rising (`translateY(+)`), unblurring and fading in. They
  leave upward. Devices fly in from outside the frame.

### Reduced motion

`prefers-reduced-motion: reduce` must always work: no zoom, no looping
animations, no travel. Simple opacity fades only. Every new animation needs
an entry in the component's reduced-motion block.

## 7. Layout of a scene slide

Copy on the left (`0.9fr`), visual on the right (`1.1fr`), vertically
centred, max width `1200px`. Below `860px` the visual moves above the copy.
Scene visuals are square SVG stages (`viewBox 0 0 600 600`) with HTML
overlays positioned in `%` and sized in `cqw` (container query units), so
they scale as one piece.

## 8. App pages

### Layouts (`src/App.vue`)

| Layout | Routes | Chrome |
|---|---|---|
| bare | `/` (landing) | The landing page brings its own `TopBar` |
| auth | public routes: login, register, forgot/reset password | Slim header: `BrandMark` (links to `/`) + `ThemeToggle`. Content is one centred `.auth-card` |
| app | everything else (signed in) | `AppTopBar`: brand, section links (Home, Groups, Appliances, Invitations), `ThemeToggle`, `UserChip` → `/account`, log out |

`AppTopBar` is sticky with the glass background. Below `760px` its section
links move to a second row you can swipe sideways. The app is mounted only
after the first route resolves, so the right layout renders from the start.

### Shared classes (`src/ui.css`)

| Class | Use |
|---|---|
| `.page` (`.page-narrow`) | Page column, max `820px` (`600px`), plus `.enter` for the rise-in |
| `.kicker`, `.page-title`, `.page-lede` | Page heading block |
| `.panel` (`.panel-cloud`) | Card: radius `24px`, card fill, hairline border. Cloud variant is dashed |
| `.panel-title`, `.panel-subtitle`, `.panel-header` | Inside panels. Subtitles are uppercase kicker-style |
| `.btn` + `.btn-primary` / `.btn-ghost` / `.btn-danger`, `.btn-sm`, `.btn-block` | All buttons. One primary action per area |
| `.field` + `label` + `.input`, `.inline-form`, `.form-actions`, `.check` | Forms. Inputs radius `12px`, green focus ring |
| `.badge` + `-owner`/`-pending`/`-warm`, `-admin`/`-active`/`-green`, `-member`/`-neutral`, `-revoked`/`-danger`, `-cloud` | Status/role pills |
| `.alert` + `-error` / `-success` / `-warning` | Messages. Warning is for "shown once, save it now" secrets |
| `.rows` / `.row` / `.row-main` / `.row-title` / `.row-meta` / `.row-actions` | Lists of things with actions |
| `.table` (in `.table-scroll`) | Tabular data, uppercase faint headers |
| `.details` | Key/value pairs (`dl`) |
| `.dialog-backdrop` / `.dialog` / `.dialog-title` / `.dialog-actions` | Modal: blurred backdrop, surface card, radius `24px` |
| `.auth-card`, `.auth-title`, `.auth-subtitle`, `.auth-links` | Auth pages. Radius `28px`, titles end with a full stop ("Welcome back.") |
| `.empty`, `.hint` | Quiet muted text |

Role and status colours follow the meanings in section 2: owner/pending =
warm, admin/active = green, member = neutral, revoked = danger.

Appliances in lists are shown as a small dark device with a status LED
(green breathing = active, amber = pending, dim = revoked), the same as the
landing page's Appliance.

### Page copy

- Titles are short nouns ("Groups", "Appliances"). Each page has a one-line
  lede that says what the page is about.
- Auth titles are short sentences ending with a full stop ("Welcome back.",
  "Create your account.").
- "Appliance" and "Humi Cloud" are capitalised as product names.

## 9. Quick checklist

- [ ] Only tokens from `src/theme.css` and classes from `src/ui.css`. Checked in **both** themes with the toggle.
- [ ] The page sits in one of the three layouts, so the theme toggle is always reachable.
- [ ] Accent text uses `-ink`. Translucency via `color-mix`, not literal `rgba`.
- [ ] No pure white or black for text and backgrounds.
- [ ] Amber = home, blue = Cloud (dashed), green = live/OK. Nothing else gets an accent.
- [ ] Borders are translucent white or accent, never solid grey.
- [ ] Buttons and chips are fully round. Cards are 28px.
- [ ] Headings 700–800 with negative letter-spacing. Kickers uppercase with wide spacing.
- [ ] Motion eases, staggers, and has a reduced-motion fallback.
- [ ] "Humi" with a capital H.
