# Design System Document

## 1. Overview & Creative North Star: "The Resonant Monolith"

This design system is built to evoke the precision of a high-end recording studio and the tactile warmth of a vintage brass instrument. We are moving away from the "app-as-a-utility" look toward an "app-as-an-instrument" philosophy. 

**The Creative North Star: The Resonant Monolith.**
The interface should feel solid, dark, and deep, but punctuated by "glows" of amber light that signify rhythm and life. We break the standard grid by using **intentional asymmetry**: large, editorial display type should bleed off-center, while content cards use varying heights to create a visual "beat" as the user scrolls. Elements don't just sit on the screen; they resonate within it.

---

## 2. Colors & Tonal Depth

The palette is a sophisticated interplay between deep charcoal and a vibrant, "liquid-gold" amber. 

### Core Palette (Material Design Tokens)
*   **Surface / Background:** `#131313` (The void of the studio)
*   **Primary:** `#ffe2ab` (Soft highlights)
*   **Primary Container (The Hero):** `#ffbf00` (The Amber/Orange-Yellow pulse)
*   **On-Primary / On-Secondary:** Deep darks (`#402d00`, `#432c00`) to ensure legibility against the glow.
*   **Surface Tiers:** From `surface_container_lowest` (`#0e0e0e`) for background depth to `surface_container_highest` (`#353534`) for elevated interactive cards.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. We define space through **Tonal Shifts**. 
*   To separate a diary entry from the background, shift the background color from `surface` to `surface_container_low`. 
*   Use `surface_variant` for subtle structural separation.

### The "Glass & Gradient" Rule
To achieve a premium "instrument" feel, utilize **Glassmorphism** for floating playback controls or navigation bars.
*   **Apply:** `surface_container` at 70% opacity + 20px Backdrop Blur.
*   **Gradients:** Use a subtle linear gradient on primary buttons (from `primary_container` to `secondary_container`) to simulate the curved surface of a brass horn.

---

## 3. Typography: The Editorial Rhythm

We use **Manrope** for its technical precision and modern, open apertures. It feels like a high-end brand mark.

*   **Display (lg/md/sm):** These are your "solos." Use `display-lg` (3.5rem) with tight tracking (-2%) for impactful diary headers or date highlights.
*   **Headline & Title:** Use `headline-md` (1.75rem) for section headers. These should be set in Medium or Bold weights to provide a rhythmic anchor.
*   **Body (lg/md/sm):** `body-md` (0.875rem) is the workhorse for diary entries. High line-height (1.6) is required to maintain a "journal" feel.
*   **Labels:** `label-md` (0.75rem) in all-caps with increased letter-spacing (5%) for metadata like "BPM" or "Key Signature."

---

## 4. Elevation & Depth: Tonal Layering

We avoid the "floating card" look of the early web. Instead, we use **Stacking**.

*   **The Layering Principle:** Place a `surface_container_high` card on a `surface_container_low` background. The 4-tone difference creates a "soft lift" that feels architectural.
*   **Ambient Shadows:** For elements that must float (e.g., a "Record" button), use a diffused shadow: `box-shadow: 0 10px 40px rgba(255, 191, 0, 0.06);`. The shadow color is a faint Amber tint, not black, creating an "inner glow" effect.
*   **The Ghost Border Fallback:** If high-density data requires containment, use `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components: Tactile & Rhythmic

### Buttons
*   **Primary:** High-gloss. Background: `primary_container`. Text: `on_primary_container`. Shape: `xl` (0.75rem).
*   **Tertiary (The "Ghost"):** No container. Text: `primary`. Subtle underline or Amber dot on hover to signify activity.

### The "Waveform" Card
*   For diary entries, avoid dividers. Use vertical white space (`2rem`) and a subtle `surface_container_lowest` background. 
*   **Shape:** `lg` (0.5rem) roundness. The "subtle" roundness keeps the app feeling professional rather than "bubbly."

### Input Fields
*   **State:** The "Active" state shouldn't just change color; it should increase the `surface_container` tier by one level and add a 1px `primary` "Ghost Border" (20% opacity).
*   **Typography:** User-input text should always be `title-md` for a premium feel.

### Music-Specific Components
*   **Playback Scrubber:** The track (rail) is `surface_container_highest`. The progress bar is `primary_container` with a `primary` outer glow.
*   **Rhythm Tags:** Use Chips with `sm` (0.125rem) roundness—nearly square to mimic keys on a piano—using `surface_variant`.

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use extreme contrast in type sizes to create an editorial hierarchy.
*   **Do** use `primary_container` sparingly. It is a spotlight, not a floodlight.
*   **Do** allow elements to overlap (e.g., a play button slightly overlapping a cover art card) to create depth.

### Don't:
*   **Don't** use Purple. All tones must be derived from the Amber, Charcoal, or Neutral-Gold scales.
*   **Don't** use 1px solid white or grey borders. This breaks the "Resonant Monolith" immersion.
*   **Don't** use standard "drop shadows." If it doesn't look like an ambient light glow, remove it.
*   **Don't** crowd the interface. Music needs "air." Use the `xl` spacing scale between disparate modules.

---

**Director's Note:**
Junior designers should remember that this system is about the *vibration* between the deep blacks and the warm ambers. If a screen feels "flat," check your surface-container nesting. If it feels "cheap," you likely have too many borders. Let the typography and the color do the heavy lifting.