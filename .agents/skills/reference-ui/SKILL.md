---
name: reference-ui
description: Analyze UI screenshots and visual references before adapting or redesigning existing React interfaces. Use when the user supplies a current UI and/or target reference, asks to match a composition, improve visual fidelity, create a minimal interface, perform a UI/UX redesign, or adapt an interface from an image without copying product-specific branding or functionality.
---

# Reference UI

Use visual references as design constraints. Preserve the product's identity and behavior while matching the reference's composition, proportions, density, and hierarchy as closely as the task permits.

## Scope First

Before editing, identify the smallest set of files needed. Inspect existing components and styles before deciding to add or change anything. For React projects, check `src/components/ui` before creating a new primitive. Do not install a library for layout or styling that the existing stack can handle.

When the request is visual, do not change business logic, auth flows, Supabase integration, APIs, routing, data models, or repository code unless the user explicitly asks for those changes.

## Analyze Before Implementing

Do not write code until the reference has been analyzed in this order:

1. Determine the full page frame and its relationship to the viewport.
2. Identify the main outer container.
3. Count the panels or columns and determine their roles.
4. Estimate panel width ratios.
5. Determine vertical alignment and the content's position inside the frame.
6. Estimate the content width inside each panel.
7. Infer the spacing system: outer margins, panel padding, section gaps, field gaps, and control spacing.
8. Establish the typography hierarchy: brand, page heading, labels, body text, and secondary actions.
9. Identify the radius language for the outer container, panels, fields, and buttons.
10. Determine the surface hierarchy through background, border, elevation, and contrast.
11. Determine CTA hierarchy and the relative visual weight of secondary actions.
12. Define responsive behavior for desktop, tablet, and mobile.

Record concrete observations or working measurements before implementation. When exact dimensions cannot be measured, use explicit estimates and validate the rendered result against the reference.

## Compare Current and Target

When both CURRENT and TARGET REFERENCE are supplied, compare them before editing. State the specific visual gaps that explain why the current result differs, such as:

- page frame or primary container is missing;
- current composition feels too empty or too dense;
- form or content is too small, too wide, or positioned incorrectly;
- panel count or panel ratio differs;
- whitespace distribution and visual density differ;
- CTA lacks the reference's visual weight;
- typography, control sizing, or vertical rhythm flatten the hierarchy;
- content does not occupy the part of the frame indicated by the reference.

Use this comparison to drive the implementation. Do not replace it with generic design advice.

## Fidelity Priorities

Resolve visual differences in this order:

1. Composition
2. Proportions
3. Sizing
4. Positioning
5. Spacing
6. Typography
7. Radii and borders
8. Colors
9. Decorative details

Do not compensate for a weak layout with shadows, gradients, extra cards, illustrations, or decorative elements. Fix the frame, ratios, alignment, and spacing first.

Do not default to a small white card centered in a large empty viewport when the reference shows a different composition.

## Minimal UI Principles

Minimalism means removing unnecessary elements while retaining deliberate composition, useful hierarchy, and enough visual structure.

Unless requested, do not add:

- marketing copy, feature lists, or benefits;
- technical explanations or extra footer links;
- decorative icons or illustrations;
- gradients;
- cards nested inside cards;
- multiple shadows;
- multiple competing primary actions.

Do not introduce extra design ideas when the user supplied a clear reference. Depart from the reference only to preserve product identity, accessibility, functionality, or responsive usability.

## Reference Adaptation

Do not automatically copy elements tied to another product, including:

- branding or logos;
- social login providers;
- crypto or finance UI;
- illustrations and distinctive backgrounds;
- consent checkboxes;
- product-specific copy or features.

Adapt these transferable qualities instead:

- structure and panel split;
- proportions and positioning;
- spacing and visual hierarchy;
- control sizing;
- surface treatment;
- content density;
- radius language.

If a referenced element has no equivalent purpose in the current product, omit it rather than inventing functionality.

## Life Progress OS Visual Direction

For Life Progress OS, default to a clean, restrained, modern, compact interface with low visual noise. Use a neutral gray or slate base. Reserve accent color for primary and active states. Avoid unnecessary colors, oversized cards, and dense decoration.

This direction does not override an explicit reference. Use it to translate the reference into the Life Progress OS visual language.

## Auth UI Rules

Apply these rules to login, signup, password recovery, and related auth states.

### Desktop

- A split layout is appropriate when supported by the reference.
- Use a clear outer container with a left auth panel and a right visual or neutral panel.
- Start with a `35–45% / 55–65%` panel ratio, then adjust to the reference.
- Keep the form narrower than the auth panel, usually `320–380px`.
- Large outer radii are acceptable when they match the reference's radius language.
- Do not stretch form controls across the full panel width.
- Match the reference's vertical placement instead of centering by habit.

### Auth Content

Keep the default content set focused:

- compact product branding;
- one heading;
- email field;
- password field;
- forgot-password action when applicable;
- one primary CTA;
- one compact secondary link for switching between login and signup.

Preserve existing loading, disabled, validation, recovery, configured/unconfigured, and authorized states. Do not add social login, consent checkboxes, long descriptions, feature lists, or onboarding content unless requested.

### Empty Visual Panel

If no visual content has been specified for the secondary panel, leave it as a calm neutral surface. Do not fill it with random decoration, generated imagery, placeholder charts, or product claims.

## Responsive Behavior

On desktop, preserve the reference composition and panel relationship.

On tablet, reduce outer gaps and panel padding while keeping the hierarchy and usable control sizes.

On mobile:

- reflow into one column rather than scaling the desktop layout like an image;
- hide a nonfunctional secondary visual panel when appropriate;
- make auth the primary surface;
- use `16–24px` horizontal padding;
- prevent horizontal overflow;
- retain accessible touch targets and readable type.

## Implementation

Reuse existing design tokens, components, and interaction patterns where they support the reference. Prefer a small, coherent change over broad refactoring. Keep semantic elements, labels, keyboard navigation, focus states, autocomplete attributes, contrast, and existing responsive behavior intact or improve them within scope.

After implementation, compare the rendered interface with the reference at a representative desktop viewport and at least one narrow mobile viewport. Iterate on the highest-priority mismatch first.

## Visual QA Checklist

Before considering the UI task complete, verify:

- the overall silhouette resembles the reference;
- panel count and width ratios are credible;
- the form or primary content is positioned correctly;
- content and form widths match the intended proportions;
- outer margins, panel padding, section gaps, and field spacing are coherent;
- no unnecessary cards, decorations, or text were introduced;
- the primary CTA has the correct visual weight;
- secondary actions are visibly quieter than the primary CTA;
- typography and radius language are consistent;
- desktop preserves the reference composition;
- mobile has no horizontal overflow and remains usable.

If several high-priority items still differ visibly from the reference, continue iterating. A passing build alone does not make the visual work complete.
