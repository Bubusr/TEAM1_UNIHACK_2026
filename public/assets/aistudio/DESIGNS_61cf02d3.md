# DESIGN.md — Hand-Drawn Pet Sanctuary & Photo Scrapbook UI

## 1. CRITICAL ANTI-SLOP OVERRIDES
- **STRICTLY LIGHT CREAM & PAPER UI:** Every UI pill, button, and card MUST use Warm Marshmallow Cream (`#FFFDF7`) or Scrapbook Parchment (`#F9F3E5`).
- **ZERO DARK MODE:** NEVER use black, dark brown, or translucent dark overlays (`rgba(0,0,0,...)`) as a background fill for any UI container, pill, or screen.
- **SHOW, DON'T WRITE:** Maximum 2–3 words per button or pill. Represent game states (Streak Fence, Roaming Pets, Pet Needs) as physical illustrated objects in the garden, NEVER as floating text notifications or progress bar walls.

## 2. Color Palette (Hand-Drawn Storybook Vibe)
- **UI Pill & Card Fill:** Marshmallow Cream (`#FFFDF7`) with a warm biscuit bottom inner bevel (`#EFE0C9`).
- **Hand-Drawn Outlines (Stroke ONLY, never background fill):** Warm Caramel-Latte Ink (`#8C6239`), `3px solid` with slightly organic, rounded joins.
- **Primary Text & Numbers:** Roasted Cocoa (`#5E3A22`).
- **Primary Action / Camera CTA / 80+ Gold Tier:** Sunny Buttercup (`#FFD460`) with a honey bottom lip (`#F2AC38`).
- **Streak Flame / Alert / Lure Warning:** Coral Tangerine (`#FF6B4A`).
- **Web3 / Avalanche Mint Accent:** Soft Berry Pink (`#FF7EB6`) or Crystal Sky (`#68C5F8`) — styled like a cute wax seal or enamel pin, never like a dark crypto wallet button.

## 3. Typography & Shapes
- **Font:** `Fredoka` or `Baloo 2` (ExtraBold, rounded, bubbly).
- **Top HUD Pills:** Full stadium capsules (`border-radius: 999px`), `#FFFDF7` fill, `#8C6239` `3px` outline, with hand-drawn icons popping 20% outside the left edge.
- **Bottom Dock Buttons:** Soft squircles (`border-radius: 22px`), `#FFFDF7` fill, `#8C6239` `3px` outline, large illustrated icon protruding from the top, 1-word label below.
- **Scrapbook Cards (AI Judge Screen):** Styled like physical cream cardstock with masking tape corners, Polaroid photo frames, and rubber ink stamps (`SCORE: 92 - ADOPTED!`).
- **Elevation:** Solid `0px 4px 0px rgba(140, 98, 57, 0.3)` hard offset shadow. Zero soft CSS blur shadows.