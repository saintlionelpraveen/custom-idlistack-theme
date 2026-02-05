# How to Deploy Your Ghost Blog for Free

Your Ghost blog has been converted to a static site in the folder: `ghost/static_site`.

## Option 1: Netlify (Recommended - Fast & Easiest)
1.  Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2.  Drag and drop the `static_site` folder onto the page.
3.  **Done!** Your site is live. You can claim the site to keep it online permanently.

## Option 2: GitHub Pages
1.  Create a new repository on GitHub (e.g., `my-ghost-blog`).
2.  Push the contents of `static_site` to this repository.
3.  Go to **Settings > Pages** in your repository.
4.  Select `main` branch and `/` root folder, then click **Save**.
5.  **Note**: Since we used root-relative links, basic GitHub Pages (subdirectory) might have broken images. **Netlify is better for this specific export.**

## Option 3: Vercel
1.  Install Vercel CLI (`npm i -g vercel`) or go to [vercel.com](https://vercel.com).
2.  Run `vercel` inside the `static_site` folder or drag-and-drop on the dashboard.
