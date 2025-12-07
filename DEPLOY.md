# How to Deploy CrewConnect

The app uses TypeScript and React, which means it **must be built** before it can run in a browser. You cannot simply upload the `.tsx` files to GitHub Pages.

## Step 1: Install Node.js
If you haven't already, install Node.js from [nodejs.org](https://nodejs.org/).

## Step 2: Install Dependencies
Open your terminal (Command Prompt or Terminal) in this project folder and run:
```bash
npm install
```

## Step 3: Build the Project
Run the build command to generate the static files:
```bash
npm run build
```
This will create a `dist` folder containing `index.html`, `.js` files, and assets. **This `dist` folder is what you need to publish.**

## Step 4: Deploy to GitHub Pages

### Option A: Manual Upload
1. Run `npm run build`
2. Go to the new `dist` folder.
3. Upload **only the contents of the `dist` folder** to your GitHub repository (or a `gh-pages` branch).

### Option B: Using Git (Recommended)
1. Commit all your changes (including the new package.json and config files).
2. Run the build:
   ```bash
   npm run build
   ```
3. Push the `dist` folder to a `gh-pages` branch:
   ```bash
   # If you have the 'gh-pages' package installed (optional):
   # npx gh-pages -d dist
   
   # OR manually:
   git add dist -f
   git commit -m "Deploy build"
   git subtree push --prefix dist origin gh-pages
   ```

4. Go to your GitHub Repository Settings -> Pages -> Select `gh-pages` branch (or whichever branch contains the *built* files).

## Step 5: Verify
Visit your GitHub Pages URL (e.g., `https://jckraus1.github.io/Tillman-Dashboard/`). It should now load correctly without the MIME type error.
