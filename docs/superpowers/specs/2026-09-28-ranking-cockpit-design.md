# Ranking cockpit concept

## Goal

Improve the presentation of Rankovo's existing popularity ranking so visitors can
understand the current result set quickly, see why an item is ranked highly, and
change filters without losing the ranking context.

The ranking model stays the same. This is a presentation and interaction concept,
not a recommendation-system redesign.

## Direction

Use a ranking cockpit that combines:

- A visible query context, result count, freshness note, active filter chips, and
  a small sort/lens control.
- Three top-pick cards that highlight the same first three ranking results.
- A denser evidence-first list for the remaining rows.
- A compact filter rail on desktop and a bottom-sheet equivalent on mobile.
- A detail view that explains a row's rating, review volume, location, and review
  freshness without taking the user to a new page.

## Concept examples

The visual concept page uses real Rankovo examples:

- Cheeseburger at Burger Lounge in Hamburg.
- Döner (Sylter Fladenbrot) at Kebab House in Hamburg.
- Pizza Margherita at Pizzeria Napoli in Berlin.

It includes interactive examples for:

- Popular, highest rated, and most reviewed ranking lenses.
- Removing active filter chips.
- Opening a "why this ranks" detail panel.
- Switching between the cockpit view and a simplified full-list view.

## Visual principles

- Make the rating and rank position the fastest things to scan.
- Keep product, venue, city, and review count in one visual cluster.
- Show evidence beside claims rather than hiding it in a drawer.
- Use stronger hierarchy for the top three without making the rest feel
  unimportant.
- Preserve the warm Rankovo palette while adding a dark ink panel for contrast.
- Use progressive density: spacious top picks, compact long list.

## Out of scope

- Changing the ranking query or popularity calculation.
- Adding personalization or a new recommendation model.
- Implementing the concept in the production homepage.
- Fixing the existing development hydration overlay.
