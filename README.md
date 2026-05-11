This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Project Structure

```text
.
|-- assets/             # Shared extension assets, including the logo
|-- src/                # Plasmo extension source
|   |-- contents/       # Content scripts and injected UI
|   |-- background/     # Background handlers and messaging
|   |-- popup.tsx       # Extension popup
|   |-- options.tsx     # Extension settings page
|   `-- history.ts      # History storage helpers
`-- apps/
    `-- website/        # Astro official website project
```

## Extension

Run the extension development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for Chrome with manifest v3, use `build/chrome-mv3-dev`.

Build the extension:

```bash
pnpm build
# or
npm run build
```

## Website

The official website is an Astro app in `apps/website`.

```bash
npm run web:dev
npm run web:build
npm run web:preview
```

Run the website scripts from the repository root. The generated static site output is created in `apps/website/dist`.

## Submit to the Web Stores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Before using this action, build the extension and upload the first version to the store to establish the credentials. Then follow the [Plasmo submit workflow](https://docs.plasmo.com/framework/workflows/submit).
