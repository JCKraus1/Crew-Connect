# Deployment Guide (Local CLI)

Since you have Node.js installed, you can deploy directly from your command prompt.

## Prerequisites

1. Open your terminal / command prompt.
2. Navigate to this project folder.
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```

## How to Deploy

To publish your app to GitHub Pages, simply run:

```bash
npm run deploy
```

### What this command does:
1. It runs `npm run build` to compile your app into the `dist` folder.
2. It uses the `gh-pages` tool to push the contents of `dist` to a branch named `gh-pages` on your GitHub repository.

## After Deployment

1. Go to your GitHub Repository Settings > **Pages**.
2. Ensure "Source" is set to **Deploy from a branch**.
3. Select the **gh-pages** branch (root folder).
4. Your live site URL will be displayed at the top (e.g., `https://jckraus1.github.io/Crew-Connect/`).

## Troubleshooting

- **Blank Screen?** 
  Ensure the `base` property in `vite.config.ts` matches your repository name exactly (e.g., `'/Crew-Connect/'`).
- **Permissions Error?**
  Make sure you are logged into git locally (`git config user.name` / `git config user.email`).
