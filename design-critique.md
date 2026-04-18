# Design Critique: Madurai Murugan Tours & Travels — Homepage (index.html)

*Stage: Live / final polish · Scope: Full critique (usability, hierarchy, consistency, accessibility)*

## Overall Impression

The site does its core job — it tells a visitor what vehicles you rent, at what price, and gives them three ways to contact you (phone, WhatsApp, booking form). That is a genuinely solid foundation for a local travel business. The biggest opportunity is **brand clarity and focus**: three accent colors (navy, peach, bright yellow, bootstrap blue) are all fighting in the hero, the pricing is repeated three times in three slightly different formats, and a few small CSS choices (`scroll-snap`, `user-select: none`) actively work against your visitors.

---

## Usability

| Finding | Severity | Recommendation |
|---|---|---|
| `body { user-select: none }` prevents copying the phone number, address, GSTIN, email, and pricing. This is the single most costly UX bug on the site — people routinely long-press addresses/numbers to copy. | Critical | Remove `user-select: none` from `body`. If you want to prevent selection on a specific element (e.g., the hero headline), scope it there. |
| `body { scroll-snap-type: y mandatory }` forces the browser to snap scroll to sections. On a long page with variable-height sections, this feels jumpy, breaks "find in page", and makes mid-section content hard to read. | Critical | Remove scroll-snap from `body`. If you want a subtle snap on the hero only, use `scroll-snap-type: y proximity` on a container, not mandatory on body. |
| Hero has no clear primary CTA tied to a business action. "Explore →" just scrolls to the services list; the phone numbers and WhatsApp button are actually the conversions. | Moderate | Replace or pair "Explore" with a brand-coloured "Call Now" or "Book on WhatsApp" button. Make it the visually loudest thing in the hero. |
| Pricing appears in three places: per-card (nested mini-table per vehicle), the Tariff Comparison table, and implicitly in the FAQ. This creates scan fatigue and risk of drift when you edit prices. | Moderate | Pick one canonical view. Recommend: simplify the cards to show *one* headline price + "see full tariff ↓" link, and keep the comparison table as the source of truth. |
| Half the nav items are `style="display: none"` (Tour Package, Book Now, FAQ, Reviews, Address). Visitors cannot jump to Reviews, FAQ or Book Now from the menu. | Moderate | Decide the real navigation (Home / Services / Pricing / Book / Reviews / FAQ / Contact), remove the hidden `<li>` elements entirely instead of hiding them. |
| Book-now form uses `alert()` for validation and only checks name + phone client-side; car type and travelers silently pass through. | Moderate | Replace alerts with inline field errors. Validate phone format (Indian mobile), require car type, date in the future. |
| Known bug (issues.txt): "white background vanishes after click toggle button then scroll down and up". Cause: two scroll handlers (window.onscroll + `$(window).scroll`) plus the collapse handler all add/remove classes independently, so the menu-open state and the scroll-past-50 state can desync. | Moderate | Centralize navbar state: compute `shouldBeDark = scrollY > 50 \|\| menuIsOpen` once and add/remove the classes based on that boolean. Remove the duplicate scroll handlers. |
| WhatsApp floating icon is `height: 100px; bottom: 0; right: 5px` — it overlaps the bottom copyright text on every scroll and sits flush with the viewport edge. | Moderate | Shrink to 60–72px, set `bottom: 20px; right: 20px`, and add a subtle shadow so it reads as a floating action button, not a decal. |
| The CSS `.phone-icon` shake animation runs every 2s, infinitely, everywhere the class is used (nav phone, book-now buttons, nav email). That's several elements all wiggling at once. | Moderate | Run the shake on *one* attention-getting element (e.g., the header phone icon), and either stop after ~6 seconds or trigger only on hover. |
| Tempo Traveller 12-seater and 18-seater cards have the identical title "Tempo Traveller AC" — visually indistinguishable until you read the seat capacity. | Minor | Title them "Tempo Traveller AC — 12 Seater" / "— 18 Seater" (or "Force Urbania" for the larger). |
| Car type `<select>` first option is just "Select" with empty value, but it's selectable (not `disabled`). | Minor | `<option value="" disabled selected>Select a vehicle</option>`. |
| `.fallback-main-image` and `#bg-video` use `z-index: -1` with `position: absolute`. On some browsers/Android builds this can render *behind* the page background and disappear. | Minor | Use `z-index: 0` on the media and `position: relative; z-index: 1` on the foreground content in `.video-section`. |

---

## Visual Hierarchy

- **What draws the eye first**: the typing animation "TRAVEL LIKE NEVER BEFORE!" with the yellow "TRAVEL" — but the brand name (*Madurai Murugan*) and the value prop (reliable South India tours from Madurai) are nowhere in the hero. The eye catches a slogan instead of "what is this business and why should I trust it?"
- **Reading flow**: hero → 7 vehicle cards → tourist places (Madurai + nearby) → tariff table → booking form → reviews → FAQ → map → footer. The order is reasonable, but **reviews should come before the booking form**, not after. Social proof is what persuades someone to fill out the form.
- **Emphasis is flat**: every `<h2>` section heading uses the same plain `text-center mb-4`. There's no rhythm — nothing signals "this is the important one". Consider an accent rule, eyebrow text ("OUR FLEET"), or a background shade on alternating sections so the page has a pulse.
- **Cards look identical**: all seven vehicle cards have the same image height, same nested price mini-table, same button. Users can't quickly tell "which car should I pick for 4 people?" or "what's the cheapest option?". Consider a prominent per-card badge (e.g., "Best value", "Most popular", "Largest group") or at least a visible "From ₹14/km" headline price at the top of each card.

---

## Consistency

| Element | Issue | Recommendation |
|---|---|---|
| **Color palette** | Four accent colors in use: primary navy `#1a2d6d`, secondary peach `#f08261`, hero yellow `#ffc300`, Explore-button blue `#007bff`, plus `--app-mosgreen-color: #8b8b02`. | Pick two brand colors (navy + peach). Retire `#ffc300` and `#007bff`. Use the CSS custom properties you already defined — currently half the file ignores them. |
| **Typography** | `.headline` class is defined with `font-family: "Arial"` while the rest of the site is Poppins. | Delete `.headline` or change it to Poppins. It's an orphaned style. |
| **Card hover** | Global `.card:hover { transform: scale(1.05) }`. The booking-form card also hovers (overridden to none inside `#bookNow`), FAQ cards scale at 1.01. Three different hover behaviors. | Standardize: only interactive cards (services, tour places) should grow on hover. Form and FAQ cards should not transform at all. |
| **Table borders** | `.below-300-price-table` uses plain `border: 1px solid black` inside the vehicle cards; the Tariff Comparison uses Bootstrap's `table-bordered`. Different visual languages in the same concept. | Use a single table style. Replace the inline mini-tables with simple "Rent ₹2600/day · Fuel ₹16/km" strings to remove the table noise from cards. |
| **Accordion `data-parent` bug** | The "When should I book my trip in advance?" card sits visually in the *left* accordion but its `data-parent="#faqAccordionRight"`. Bootstrap's exclusive-open behavior will therefore misbehave — opening it won't close siblings in the left column, and vice versa. | Fix the `data-parent` to match the column the card is in. |
| **Footer contact links** | Phone and email in footer are white `<a>` tags with no underline on default state but the copy is "click to call" — not obvious they are links. | Either underline on hover, or preface with small labels ("Call", "Email"). |
| **"Tempo Traveller" duplicated card title** | Two cards both labeled "Tempo Traveller AC" with different seat capacity. | See usability section — distinguish them. |
| **Footer logo size (known issue)** | `.logo-image` sets the footer logo to 100×100, but inline `width="50" height="50"` attrs are also on the `<img>`. CSS wins, so the image renders at 100×100, but the `.footer-logo-img` class (which has the `margin-top` correction) is never applied in the markup. So the logo *is* the right size but appears visually misaligned with the big "Madurai Murugan" heading. | Add `class="footer-logo-img"` to the footer `<img>`, or remove the inline `width/height="50"` if you want it at 100×100, and use flex vertical centering instead of `margin-top`. |
| **Footer img missing `alt`** | `<img src=".../logo.png" width="50" height="50" class="logo-image" />` — no `alt`. | Add `alt="Madurai Murugan Tours and Travels logo"`. |

---

## Accessibility (WCAG 2.1 AA, quick pass)

- **`user-select: none` on body**: blocks copy-paste. Not a strict WCAG failure but a real usability barrier, particularly for users relying on assistive tech that reads selected text.
- **Map iframe has no `title`**: `<iframe src="...maps/embed..." />` — screen readers announce this as "frame". **Add `title="Location of Madurai Murugan Tours on Google Maps"`**. This is a WCAG 2.4.1 failure.
- **Footer logo missing `alt`**: WCAG 1.1.1 failure.
- **Hero headline is an animated `h1`** starting at `width: 0ch`. Screen readers may pick it up fine (text is in the DOM), but the visual reveal means sighted users with low cognitive bandwidth see a line appear character by character for 4 seconds before they can read it. Consider making the animation trigger on scroll/load once, and leave the text statically present for repeat visitors.
- **Color contrast** — spot checks:
  - Navbar brand text `#555` on white: ~7.5:1 ✅
  - Yellow `#ffc300` on hero image: varies; **likely fails on lighter regions of `main.jpg`**. Add a text shadow or a dark gradient overlay on the hero image.
  - `.card-text` mosgreen `#8b8b02` on white card: ~6.2:1 ✅
  - FAQ card header white on `#1a2d6d`: ~12:1 ✅
- **Touch targets**: phone/email links in the dense navbar are small and close together — <44×44 CSS px. Give the tel: links more padding.
- **Form validation**: `alert()` is not accessible to screen-reader users in a predictable way, and the form has no `aria-describedby` error pattern. Move to inline errors.
- **Form `<label>` bug**: the Phone label has `for="name"` (should be `for="phone"`): `<label for="name">Phone Number</label>`. Clicking the label focuses the Name field. WCAG 1.3.1.
- **Navigation ARIA**: the navbar-toggler has `aria-controls` and `aria-expanded="false"` static — the `aria-expanded` state isn't being toggled by your collapse handler. Add a line in the `show.bs.collapse` / `hide.bs.collapse` handlers to toggle it.

---

## What Works Well

- **Clear business model and conversion paths**: price + phone + WhatsApp + form — a local visitor has everything they need, and WhatsApp is exactly the right channel for this audience in Madurai.
- **Strong social proof**: 6 five-star reviews with names and photos. Carousel is implemented twice for mobile/desktop — that's thoughtful.
- **Useful SEO hygiene**: meta description, keywords, Open Graph, Twitter cards, robots, favicons across sizes. Better than most small-business sites.
- **Smart WhatsApp pre-fill**: the form stitches the user's answers into a formatted message — reduces friction for the business and the customer.
- **Sensible responsive breakpoints**: 768 / 576 / 478 with specific adjustments for card image height, logo size, and navbar font size. The dedicated small-screen reviews carousel shows you're testing on mobile.
- **Tariff Comparison table**: genuinely useful for price-conscious buyers; keep this.
- **Consistent navy/peach in system-defined places**: the CSS custom properties are well set up — you just need to actually use them everywhere.

---

## Priority Recommendations

1. **Remove `user-select: none` and `scroll-snap-type: mandatory` from `body` today.** These two lines are silently costing you conversions. Customers can't copy your phone number, and the snap scrolling fights their scroll wheel. One-line fixes, biggest impact.

2. **Collapse the accent-color set to navy + peach, and rebuild the hero.** Replace the yellow "TRAVEL" and blue Explore button with your brand colors. Add a one-line tagline under the headline ("Madurai's most trusted South India tour operator since YYYY") and make the CTA a real conversion button — "Book on WhatsApp" going to the same `wa.me` URL as the floating icon.

3. **Fix the navbar state bug + move Reviews above Book Now.** Centralize the navbar dark/light state into one handler (see usability table). Reorder sections so reviews → booking, so social proof primes the form fill.

4. **Simplify vehicle cards and promote the tariff table.** Drop the nested `below-300-price-table` mini-tables from each card. Show a single headline price per card ("From ₹14/km · 4 seater"), a "View full tariff ↓" link, and a badge ("Best value" / "Largest group"). This makes the 7 cards actually scannable.

5. **Pass the accessibility quick-fixes in one commit**: add `alt` to footer logo, add `title` to map iframe, fix the Phone `<label for>`, replace `alert()` validation with inline errors, sync `aria-expanded` on the toggler. Small diff, meaningful improvement for screen-reader users and SEO (Google rewards accessible markup).

---

*File reviewed: `index.html` (1,450+ lines) and `css/style.css`. Screenshots were not provided; critique is based on source analysis. To make this more concrete, share a screenshot and I can mark up exact regions, or re-run after you deploy the priority 1–2 fixes.*
