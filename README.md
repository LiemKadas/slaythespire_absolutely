# Liem Kadas Portfolio Site

This is a modular static one-page portfolio prototype.

## File structure

- `index.html` - page structure and section containers
- `styles.css` - visual system, layout, animation, responsive behavior
- `script.js` - carousel, PDF modal, reveal effects, contact mailto prototype
- `site-data.js` - editable content, links, PDF/card metadata, credentials
- `assets/images/` - headshot and logos
- `assets/pdfs/` - portfolio PDFs and resume
- `assets/previews/` - first-page PNG previews for carousel cards

## Local preview

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Common edits

Most routine edits should happen in `site-data.js`:

- headline and hero body copy
- PDF titles, descriptions, filenames, and preview filenames
- LinkedIn / CMU / featured article links
- contact email
- credential bullets

## Contact form note

The current form opens the visitor's email client with a prefilled message. Before launch, this can be replaced with Formspree, Netlify Forms, or a private backend endpoint.
