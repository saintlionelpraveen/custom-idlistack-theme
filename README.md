Custom Ghost theme (modern design)

Structure:
- Left-aligned header with logo and navigation
- Asymmetrical hero: left content, right featured image
- Responsive posts grid showing cards (image, title, excerpt, date)

How to use:
1. Zip `ghost-theme/` and upload to Ghost admin > Design > Upload theme, or copy folder into your Ghost installation's `content/themes/` directory.
2. Activate the theme in Ghost admin.
3. Replace placeholder images in `assets/images/` with production images (logo.png, hero-bg.jpg, section-bg.jpg, favicon.ico).

Notes:
- Fonts are loaded from Google Fonts in `default.hbs` (Poppins for headings, Inter for body).
- Colors are defined in `assets/css/style.css` as CSS variables.
- All dynamic content uses Ghost Handlebars helpers (e.g. `{{#foreach posts}}`, `{{@site.title}}`, `{{feature_image}}`).
- For additional pages, add templates and partials as needed.

Deploy checklist:
- Replace placeholder images in `assets/images/`.
- Update `package.json` metadata if desired.
- Test posts, featured images and site metadata in Ghost admin.
