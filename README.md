# Morgen Developer Docs

This repository hosts the Morgen documentation for developers.

## AI-readable static files

Use Node.js 20.19+ and npm:

```sh
npm ci
npm run test:ai-docs
npm run build
npm run check:ai-docs
```

After the existing Next.js static export succeeds, `postbuild` reads the same
`content/*.mdx` using pinned alpha [next-ai-ready](https://github.com/mustcanbedo/next-ai-ready)
build modules and adds `/llms.txt`, `/llms-full.txt`, and ten `.md` files to `out/`.
`/index.md` represents `/`; `/events.md` represents `/events`, and so on.

`PUBLIC_PAGES` in `scripts/build-ai-docs.mjs` explicitly selects public pages.
Hidden drafts, archives and `JwtContent` children are excluded. Add new pages to
that list only when they are ready for public discovery. Tables and code remain;
interactive components become text. Each Markdown file cites its HTML canonical.

Firebase sets `text/markdown` and `X-Robots-Tag: noindex` for `.md` files. HTML
URLs still return HTML for `Accept: text/markdown`: this is static hosting, not
server content negotiation. No MCP, service, credentials or analytics are added.
The generated files are available after `npm run build`, not in `npm run dev`.
Deployment remains `npm run deploy`; rankings and AI citations are not guaranteed.

To roll back, revert the integration commit, run `npm ci` and `npm run build`,
then deploy through the existing workflow. A fresh export removes generated files.
