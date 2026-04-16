import { createHighlighter } from 'shiki'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const PUBLIC = 'public'
const THEME = 'gruvbox-dark-medium'
const RE = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g

function htmlUnescape(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

function findHtml(dir, out) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) findHtml(p, out)
    else if (p.endsWith('.html')) out.push(p)
  }
}

async function main() {
  const files = []
  findHtml(PUBLIC, files)

  if (!files.length) {
    console.log('No HTML files found in public/')
    return
  }

  const langs = new Set()
  for (const f of files) {
    const html = readFileSync(f, 'utf8')
    for (const m of html.matchAll(RE)) langs.add(m[1])
  }

  if (!langs.size) {
    console.log('No code blocks found')
    return
  }

  const highlighter = await createHighlighter({
    themes: [THEME],
    langs: [...langs],
  })

  let total = 0
  for (const f of files) {
    const html = readFileSync(f, 'utf8')
    const result = html.replace(RE, (_, lang, code) => {
      total++
      return highlighter.codeToHtml(htmlUnescape(code), { lang, theme: THEME })
    })
    if (result !== html) writeFileSync(f, result)
  }

  console.log(`Highlighted ${total} code block(s) in ${files.length} file(s)`)
}

main().catch(e => { console.error(e); process.exit(1) })
