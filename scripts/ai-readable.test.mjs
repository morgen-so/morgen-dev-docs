import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { parseMdx } from '@next-ai-ready/mdx'
import { buildArtifacts, PUBLIC_PAGES, SITE, writeArtifacts } from './build-ai-docs.mjs'

function nodes(tree) {
  return [tree, ...(tree.children ?? []).flatMap(nodes)]
}

async function fixture(t, authentication) {
  const root = await mkdtemp(join(tmpdir(), 'morgen-ai-docs-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const slug of PUBLIC_PAGES) {
    await writeFile(join(root, `${slug}.mdx`), slug === 'authentication' ? authentication : `# ${slug}\n\nPublic documentation.`)
  }
  await writeFile(join(root, 'events-rsvp-draft.mdx'), '# PrivateDraftSentinel')
  return root
}

test('public artifacts are deterministic, citable, and discoverable', async () => {
  const artifacts = await buildArtifacts()
  assert.deepEqual([...artifacts], [...await buildArtifacts()])
  assert.equal(artifacts.size, 12)
  for (const slug of PUBLIC_PAGES) {
    const canonical = new URL(slug === 'index' ? '/' : `/${slug}`, SITE.baseUrl).href
    const metadata = parseMdx(artifacts.get(`${slug}.md`)).frontmatter
    assert.equal(metadata.canonical_url, canonical)
    assert.equal(metadata.url, canonical)
    assert.ok(metadata.title)
  }
  const links = [...artifacts.get('llms.txt').matchAll(/\]\((https:\/\/docs\.morgen\.so\/[^)]*)\)/g)]
  assert.equal(links.length, 11)
  for (const [, url] of links) assert.ok(artifacts.has(new URL(url).pathname.slice(1)))
  const corpus = [...artifacts.values()].join('\n')
  assert.doesNotMatch(corpus, /JWT Token|500 points|events-rsvp-draft|videoconferencing-draft|cw-sdk|archived_pages/)
  assert.match(artifacts.get('rate-limits.md'), /API Key\s*\|\s*300 points/)
  const source = await readFile(new URL('../content/authentication.mdx', import.meta.url), 'utf8')
  for (const [block] of source.matchAll(/```[^\n]*\n[\s\S]*?```/g)) {
    assert.ok(artifacts.get('authentication.md').includes(block))
  }
  const headings = nodes(parseMdx(artifacts.get('authentication.md')).tree)
    .filter((node) => node.type === 'heading' && node.depth === 3)
    .map((node) => node.children.map((child) => child.value).join(''))
  assert.deepEqual(headings, ['Sign in to Morgen platform', 'Get your API key', 'Copy your API key'])
  const homeLinks = nodes(parseMdx(artifacts.get('index.md')).tree).filter((node) => node.type === 'link')
  assert.ok(homeLinks.some((link) => link.url.startsWith('mailto:connect@morgen.so?body=')))
})

test('hidden JSX is removed before metadata and FAQ extraction; public prose and links remain', async (t) => {
  const contentDir = await fixture(t, `import { Callout } from 'nextra/components'

# Authentication: "API keys"

<JwtContent>
PrivateSummarySentinel
## How does PrivateFaqSentinel work?
PrivateAnswerSentinel
</JwtContent>

Public documentation
with a colon:

<Callout>VisibleCalloutText <JwtContent>PrivateNestedSentinel</JwtContent></Callout>

[Events](./events#list-events)
[Email](mailto:connect@morgen.so)
`)
  const artifacts = await buildArtifacts({ contentDir })
  assert.doesNotMatch([...artifacts.values()].join('\n'), /Private\w*Sentinel|JwtContent|nextra\/components/)
  const markdown = artifacts.get('authentication.md')
  const metadata = parseMdx(markdown).frontmatter
  assert.equal(metadata.title, 'Authentication: "API keys"')
  assert.equal(metadata.description, 'Public documentation with a colon:')
  assert.ok(markdown.includes('VisibleCalloutText'))
  assert.ok(markdown.includes('[Events](https://docs.morgen.so/events#list-events)'))
  assert.ok(markdown.includes('[Email](mailto:connect@morgen.so)'))
})

test('writer requires a successful export and preserves HTML files', async (t) => {
  const contentDir = await fixture(t, '# Authentication\n\nPublic documentation.')
  const outputDir = join(contentDir, 'out')
  await assert.rejects(writeArtifacts({ contentDir, outputDir }), { code: 'ENOENT' })
  await mkdir(outputDir)
  await writeFile(join(outputDir, 'index.html'), '<html>Existing site</html>')
  const artifacts = await writeArtifacts({ contentDir, outputDir })
  for (const [file, expected] of artifacts) assert.equal(await readFile(join(outputDir, file), 'utf8'), expected)
  assert.equal(await readFile(join(outputDir, 'index.html'), 'utf8'), '<html>Existing site</html>')
})

test('Firebase keeps static hosting and limits Markdown headers to .md files', async () => {
  const { hosting } = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'))
  assert.equal(hosting.public, 'out')
  assert.equal(hosting.cleanUrls, true)
  assert.deepEqual(hosting.headers, [{ source: '**/*.md', headers: [
    { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
    { key: 'X-Robots-Tag', value: 'noindex' },
  ] }])
})
