# Pedal & Peak

Pedal & Peak is a personal cycling and hiking adventure journal. It documents rides, hikes, route stats, story cards, testimonials, quotes, and contact/privacy requests in one responsive static website.

## What The Site Is About

The site is built for sharing outdoor adventures: cycling loops, hikes, distances, elevation gain, moving time, route memories, and photos or illustrations connected to each trip. The homepage gives visitors a quick overview through a hero section, live stats, filterable adventure cards, testimonials, and a contact form.

## Main Features

- Fixed navigation bar with logo, menu links, avatar, and light/dark theme toggle.
- Full-screen homepage sections for Hero, Latest Adventures, Testimonials, and Contact.
- Light/dark theme support with theme preference saved in the browser.
- Section backgrounds with parallax behavior on desktop.
- Dynamic adventure cards loaded from `data/adventures-index.json`.
- Homepage stats calculated from the adventure data.
- Random hero quote loaded from `data/quotes.json`.
- Testimonial carousel loaded from `data/testimonials.json`.
- Contact section with a highlighted photo privacy removal notice.

## Project Files

- `index.html` - Main homepage structure, sections, templates, modal, and contact form.
- `about.html` - About page explaining the purpose of Pedal & Peak.
- `privacy.html` - Privacy policy and data-use notes.
- `rides.html` - Placeholder page for future ride logs.
- `hikes.html` - Placeholder page for future hike logs.
- `style.css` - All layout, theme, typography, responsive, parallax, card, form, and modal styles.
- `script.js` - Header/footer rendering, theme toggle, navigation, filters, cards, modal, stats, quotes, and testimonials.
- `data/adventures-index.json` - Lightweight ride/hike data used for homepage cards and stats.
- `adventures/activity_<id>/activity.json` - Full activity details, story, video URL, and gallery image list.
- `data/testimonials.json` - Story carousel data.
- `data/quotes.json` - Random homepage quote data.
- `assets/` - Logo, icons, charts, illustrations, and background images.

## Editing Data

To add a new adventure, create `adventures/activity_<id>/activity.json` for the full story/details, then add a matching summary item to `data/adventures-index.json`. Use `type: "ride"` or `type: "hike"` so filters and stats work correctly.

If the activity starts from a GPX file, run `tools/update-adventures.ps1` after adding the GPX. The script keeps the homepage index and per-activity JSON files in sync while preserving existing stories.

To add a quote, edit `data/quotes.json` and add an item inside the `quotes` array.

To add a testimonial, edit `data/testimonials.json` and add an item inside the `testimonials` array.

## Running Locally

Because the site loads JSON with `fetch`, open it through a local server instead of double-clicking `index.html`.

Example:

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

## Running Tests

Run the static site checks with PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/site-test.ps1
```

The test checks content JSON, adventure detail/GPX consistency, GPX-derived metrics, local asset references, and merge conflict markers.

## Notes

This is a static website, so the contact form currently runs client-side only. To receive real messages, connect the form to a backend or form service later.
