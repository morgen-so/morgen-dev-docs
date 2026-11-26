import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile, parseMdx, renderMarkdown } from '@next-ai-ready/mdx'
import { buildGraph } from '@next-ai-ready/semantic'
import { renderLlmsFullTxt, renderLlmsTxt } from '@next-ai-ready/llms'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const SITE = {
  name: 'Morgen Developer Documentation',
  baseUrl: 'https://docs.morgen.so',
  description: 'Documentation for the Morgen calendar and task API.',
}

// Opt in public docs only; hidden navigation entries and archived pages are not exported.
export const PUBLIC_PAGES = [
  'index',
  'introduction',
  'authentication',
  'rate-limits',
  'integrations',
  'calendars',
  'events',
  'tasks',
  'tags',
  'changelog',
]

function publicMarkdown(source, canonicalUrl) {
  const { tree } = parseMdx(source)
  function visit(node) {
    if (node.children) {
      node.children = node.children.flatMap((child) => {
        if (child.name === 'JwtContent') return []
        visit(child)
        if (!['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(child.type)) return [child]
        const href = child.attributes?.find((attribute) => attribute.name === 'href')?.value
        if (child.name === 'a' && typeof href === 'string') {
          const link = { type: 'link', url: new URL(href, canonicalUrl).href, children:
            child.children.flatMap((item) => item.type === 'paragraph' ? item.children : [item]) }
          return [child.type === 'mdxJsxFlowElement' ? { type: 'paragraph', children: [link] } : link]
        }
        if (child.name === 'br') return [{ type: 'break' }]
        // Hoist blocks as blocks: wrapping Steps in a paragraph collapses its headings.
        return child.children
      })
    }
    if (['link', 'image', 'definition'].includes(node.type)) {
      node.url = new URL(node.url, canonicalUrl).href
    }
  }
  // Remove conditional content before summary, FAQ and body extraction, not just rendering.
  visit(tree)
  return renderMarkdown(tree)
}

export async function buildArtifacts({ contentDir = join(ROOT, 'content') } = {}) {
  const pages = await Promise.all(PUBLIC_PAGES.map(async (slug) => {
    const route = slug === 'index' ? '/' : `/${slug}`
    const file = join(contentDir, `${slug}.mdx`)
    const canonicalUrl = new URL(route, SITE.baseUrl).href
    const compiled = compile({
      source: publicMarkdown(await readFile(file, 'utf8'), canonicalUrl),
      route,
      file,
      site: SITE,
    })
    compiled.page.citeUrl = canonicalUrl
    if (compiled.page.summary) {
      compiled.page.summary = compiled.page.summary.replace(/\s+/g, ' ').trim()
    }
    return compiled
  }))
  const graph = buildGraph({ site: SITE, pages })
  const artifacts = new Map()
  const discoveryNodes = { ...graph.nodes }

  for (const slug of PUBLIC_PAGES) {
    const route = slug === 'index' ? '/' : `/${slug}`
    const id = graph.routes[route]
    const page = graph.nodes[id]
    const metadata = {
      title: page.title,
      description: page.summary,
      canonical_url: page.citeUrl,
      url: page.citeUrl,
    }
    // JSON-quoted values are valid YAML even when prose contains colons or newlines.
    const header = Object.entries(metadata).filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')
    artifacts.set(`${slug}.md`, `---\n${header}\n---\n\n${page.body}\n`)
    discoveryNodes[id] = { ...page, citeUrl: new URL(`/${slug}.md`, SITE.baseUrl).href }
  }

  artifacts.set('llms.txt', renderLlmsTxt({ ...graph, nodes: discoveryNodes }) +
    `\n## Optional\n\n- [All public documentation](${SITE.baseUrl}/llms-full.txt): Combined Markdown with canonical page URLs.\n`)
  artifacts.set('llms-full.txt', renderLlmsFullTxt(graph))
  return artifacts
}

export async function writeArtifacts({ outputDir = join(ROOT, 'out'), contentDir } = {}) {
  // Only add files to a successful Next.js export; do not create a partial deployable site.
  await readFile(join(outputDir, 'index.html'))
  const artifacts = await buildArtifacts({ contentDir })
  for (const [file, content] of artifacts) {
    await writeFile(join(outputDir, file), content, 'utf8')
  }
  return artifacts
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const artifacts = await buildArtifacts()
    for (const [file, expected] of artifacts) {
      if (await readFile(join(ROOT, 'out', file), 'utf8') !== expected) {
        throw new Error(`Stale export: ${file}. Run npm run build.`)
      }
    }
    const exported = (await readdir(join(ROOT, 'out'))).filter((file) => file.endsWith('.md')).sort()
    const expected = [...artifacts.keys()].filter((file) => file.endsWith('.md')).sort()
    if (JSON.stringify(exported) !== JSON.stringify(expected)) throw new Error('Unexpected Markdown files in out/')
    for (const slug of PUBLIC_PAGES) await readFile(join(ROOT, 'out', `${slug}.html`))
    console.log(`[ai-docs] Verified ${artifacts.size} files against the current public content.`)
  } else {
    const artifacts = await writeArtifacts()
    console.log(`[ai-docs] Wrote ${artifacts.size} static files from ${PUBLIC_PAGES.length} public pages.`)
  }
}
