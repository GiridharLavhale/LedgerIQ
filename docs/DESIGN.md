---
name: LedgerIQ Enterprise
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777f'
  outline-variant: '#c5c6cf'
  surface-tint: '#4e5e81'
  primary: '#031635'
  on-primary: '#ffffff'
  primary-container: '#1a2b4b'
  on-primary-container: '#8293b8'
  inverse-primary: '#b6c6ef'
  secondary: '#0050cc'
  on-secondary: '#ffffff'
  secondary-container: '#0266ff'
  on-secondary-container: '#f9f7ff'
  tertiary: '#001c10'
  on-tertiary: '#ffffff'
  tertiary-container: '#003320'
  on-tertiary-container: '#00a774'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#b6c6ef'
  on-primary-fixed: '#081b3a'
  on-primary-fixed-variant: '#364768'
  secondary-fixed: '#dae1ff'
  secondary-fixed-dim: '#b3c5ff'
  on-secondary-fixed: '#001849'
  on-secondary-fixed-variant: '#003fa4'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
  sidebar_width: 260px
  header_height: 64px
---

## Brand & Style

The design system is engineered for high-stakes financial operations where the workflow follows a strict "Evidence → Decision → Action" pipeline. The brand personality is rooted in institutional trust, mathematical precision, and professional rigor.

The visual style is **Corporate / Modern** with a lean toward **High-Density Minimalism**. It prioritizes information density without sacrificing clarity, using whitespace not just for aesthetics but as a functional separator between complex data sets. The interface should feel like a high-performance instrument—unobtrusive, reliable, and instantaneous.

**Key Principles:**
- **Clarity over Decoration:** Every visual element must serve a functional purpose in the decision-making process.
- **Data Integrity:** Use structured grids and consistent alignment to mirror the stability of the underlying financial data.
- **Actionable Hierarchy:** Primary actions are clearly demarcated to reduce cognitive load during high-volume transaction processing.

## Colors

The palette is anchored by **Deep Indigo (#1A2B4B)**, providing an authoritative "institutional" weight to global navigation and headers. **Professional Blue (#0066FF)** is reserved strictly for primary interactive elements to create a clear mental model for "Action."

The semantic palette is critical for rapid status scanning:
- **Success (Emerald):** Used for resolved states and reconciled balances.
- **Warning (Amber):** Indicates "Likely Matches" or items requiring human intervention.
- **Danger (Crimson):** Reserved for critical mismatches, exceptions, and security alerts.

The neutral scale uses high-quality grays to manage surface elevation and content grouping, ensuring that the background never competes with the data.

## Typography

This design system utilizes **Inter** for its exceptional legibility and extensive support for OpenType features. 

**Financial Data Standards:**
- All numerical values in tables, KPI cards, and reports must use **Tabular Figures (`tnum`)** to ensure decimal points and digits align vertically, facilitating rapid comparison.
- **Weight Contrast:** Use `SemiBold` (600) for labels and headers, and `Medium` (500) or `Regular` (400) for data values to create a clear "Field: Value" distinction.
- **Small Text:** The `body-sm` and `label-caps` roles are optimized for high-density sidebars and metadata without losing legibility.

## Layout & Spacing

The layout follows a **Desktop-First** philosophy, utilizing a global sidebar and fixed-header architecture. It employs a strict **4px/8px incremental grid** to maintain mathematical harmony across dense data views.

**Layout Structure:**
- **Global Sidebar:** Fixed at 260px. Collapsible to 64px (icon-only) for maximized data workspace.
- **Content Area:** Fluid width with a maximum container of 1600px for ultra-wide monitors to prevent excessive line lengths.
- **Density:** Standard padding for rows in data tables is 8px (vertical) to allow for high row counts per viewport, while maintaining a 16px horizontal "breathable" gutter between columns.

**Breakpoints:**
- Desktop: 1280px+ (Full sidebar)
- Tablet: 1024px (Collapsed sidebar)
- Mobile: 768px (Hidden sidebar, bottom navigation or drawer menu)

## Elevation & Depth

To maintain a "professional and flat" aesthetic, this design system avoids heavy drop shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines** to define hierarchy.

- **Level 0 (Background):** #F9FAFB — The canvas.
- **Level 1 (Cards/Tables):** White (#FFFFFF) with a 1px border (#E2E8F0). No shadow.
- **Level 2 (Modals/Drawers):** White (#FFFFFF) with a sophisticated ambient shadow: `0px 10px 15px -3px rgba(0, 0, 0, 0.05)`.
- **Focus States:** High-contrast 2px Professional Blue (#0066FF) rings with a 2px offset to ensure accessibility and clear keyboard navigation in fast-paced workflows.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern feel while maintaining the "structured" look required for enterprise software. 

- **Standard Elements (Inputs, Buttons):** 4px (0.25rem) radius.
- **Containers (Cards, Modals):** 8px (0.5rem) radius.
- **Status Badges:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components

### Data Tables & Status Badges
High-density tables are the core of the system. 
- **Rows:** Alternate background colors (Zebra striping) are optional but recommended for tables exceeding 20 columns.
- **Status Badges:** Use a "Light Fill" style. E.g., MATCHED: Emerald text on a 10% opacity Emerald background.
  - *Values:* MATCHED, LIKELY MATCH, PARTIAL MATCH, UNMATCHED, EXCEPTION, DUPLICATE, INVALID, RESOLVED, PENDING.
- **Severity Indicators:** Use a left-hand 4px "accent bar" within a cell to indicate HIGH or CRITICAL severity.

### KPI Cards
- Large tabular figures for primary metrics.
- Trend indicators: Use small green/red arrows with percentage changes.
- Sparklines should be simplified, monochromatic (using Primary or Neutral colors) to avoid visual noise.

### Navigation & Inputs
- **Sidebar:** Nested items use a chevron-down/right indicator. Active states use a Professional Blue left-border highlight (4px).
- **Segmented Controls:** Used for toggling views (e.g., "List" vs "Analytics"). Use a subtle grey background with a white "floating" active segment.
- **Inputs:** Default state uses a 1px #E2E8F0 border. Active/Focus state uses the Professional Blue border.

### Modals & Drawers
- Use **Drawers** (sliding from the right) for transaction investigation to keep the underlying list context visible. 
- Use **Modals** only for destructive actions (e.g., "Delete Batch") or system-wide configurations.