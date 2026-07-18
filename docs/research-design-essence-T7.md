# Research: The Design Essence of Excellent App UI (Wayfinder T7 supporting research)

**Date:** 11 July 2026 · **Feeds:** T7 flagship theme direction
**Question:** The first member-portal prototype read "too simple, too cartoonish" against a HeyTea-class expectation. What do benchmark apps actually do that makes them feel premium — and what are the buildable rules?

## The benchmarks and what each one teaches

**HeyTea (the stated aspiration).** Its app is consistently praised for a clean, intuitive interface reflecting a minimalist brand identity — but look closer at *how*: the minimalism is carried by high-quality product images on every surface, clearly organized categories, and smooth transitions. HeyTea's premium repositioning strategy leans on refined, culturally intelligent partnerships (e.g. Marimekko-style minimalist premium aesthetics) rather than cartoon IP tie-ins. **Lesson: HeyTea is not "simple" — it is *rich but ordered*. The luxury is carried by imagery and craft, and the layout stays calm around it.**

**Chagee (the sibling benchmark, arguably closer to the expectation).** Deliberately blends tea heritage with premium, minimalist aesthetics — calm colours, minimalist lines, soft lighting, ritual — and is explicitly contrasted against Mixue's bright cartoon-mascot cheerfulness. Its digital tiered loyalty program and consistent visual system (logo, packaging, palette identical across markets) turn a drink into "participating in something." **Lesson: premium = calm palette + heritage cues (a serif accent, ritual language) + relentless visual consistency. Cartoon reads cheap-and-cheerful; that's Mixue's lane, not this product's.**

**Apple Design Awards standard (the craft bar).** Apple's Visuals & Graphics category rewards "stunning imagery, skillfully drawn interfaces, and high-quality animations with a distinctive and cohesive theme." Its praise for the app *Vocabulary* is practically a spec for our flagship: "charming, consistent illustrations that create a clean visual style and rhythm throughout. Typography and iconography feel modern and balanced… an app that quietly does everything right." **Lesson: the difference between charming and cartoonish is *consistency and craft* — one illustration system, one icon stroke weight, one rhythm. And never emoji as UI icons: emoji are the fastest possible signal of low craft.**

**Apple Wallet & premium fintech (Revolut-class card rendering).** The gold standard for "card as object": cards get material treatment — gradients with direction, subtle texture/grain, soft layered shadows, light behaving like light. **Lesson: our hero member card should feel like a physical premium object you'd be pleased to own, not a rounded rectangle with a background color.**

**Starbucks (the loyalty UX benchmark).** Warm photography-led surfaces and the star progress meter as the emotional centerpiece. **Lesson: the progress visualization is the retention engine — it deserves as much craft as the card.**

## The essence, distilled into eight buildable rules

1. **Imagery is the luxury.** Flat color fields read as templates; photographic/material surfaces read as brands. The card's cover should be a *photo or photo-like material* (the tenant's signature drink, or a crafted abstract material as fallback) — which also means the wizard should push cover-photo upload hard, with beautiful presets.
2. **Never emoji.** One consistent stroke-icon system (single weight, single corner radius) for rewards, history, and navigation. Custom or from one library — never mixed, never emoji.
3. **Depth is real.** Two shadow layers (tight+soft), subtle top-light gradients on cards, optional glass/blur chips over imagery. Flat = cheap; layered = made.
4. **Type does the talking.** Oversized balance numerals with tight tracking; letter-spaced small-caps labels; and one serif display accent for heritage/premium warmth (the Chagee move). Three sizes are not a hierarchy — build a real scale.
5. **Rich but ordered.** Don't equate premium with empty. Sections have generous rhythm, but each surface carries content confidently — the first prototype's sparseness read "unfinished," not "minimal."
6. **Color discipline.** Calm neutral base (porcelain/ivory), deep ink for text, tenant brand color used sparingly but *materially* (in the cover gradient, the progress fill, one chip) — plus at most one metallic/warm accent (champagne gold) for tier language.
7. **Motion is craft's signature.** Count-up on the points number, a gentle sheen on the card, eased sheet transitions. Small, few, physical.
8. **Words carry ritual.** Copy tone matters: "120 points to Gold" is inventory; "You're 120 points from Gold ✦" is progress toward belonging. Chagee sells connection, not tea — the microcopy should sell membership, not point arithmetic.

## Implication for the theme system

The flagship theme = rules 1–8 applied strictly (working name: **"Atelier"** — porcelain base, ink, serif accent, photographic card material, gold tier language). The first prototype's Variant B survives as a *separate, second* theme for tenants who want playful (its market exists — it's just not the flagship). This keeps the launch gallery honestly diverse: Atelier (premium minimal), Playful (cream/sticker), and one more distinct direction.

### Sources
Apple Design Awards 2025/2026 winners & category criteria (developer.apple.com, apple.com newsroom); Apple's Vocabulary citation (developer.apple.com/design/awards); HeyTea app store presence and interface analyses (App Store MY, heyteas.com overview, MWM listing analysis); HeyTea premiumization strategy (China Skinny, Jul 2025); Chagee brand deep-dives (ContentGrip Jun 2025; kathrynread.com Jan 2026, incl. the Mixue cartoon-contrast point). Apple Wallet/fintech card-material and Starbucks loyalty patterns from established design practice (no single source; industry-standard references).
