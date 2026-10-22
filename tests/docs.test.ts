import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { expect, it } from 'vitest'

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory()
      ? markdownFiles(path)
      : entry.name.endsWith('.md')
        ? [path]
        : []
  })
}
it('keeps planning links and every agent task format valid', () => {
  const files = ['AGENTS.md', 'PLAN.md', 'README.md', ...markdownFiles('docs')]
  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1]
      if (link.includes('://') || link.startsWith('#')) continue
      expect(
        existsSync(resolve(dirname(file), link.split('#')[0])),
        `${file}: ${link}`,
      ).toBe(true)
    }
    if (/T\d\d\.md$/.test(file)) {
      expect(content).toMatch(/Status: (ready|in_progress|blocked|review|done)/)
      for (const field of [
        'Owner:',
        'Branch:',
        'Plan revision:',
        'Contract revision:',
        'Dependencies:',
        'Allowed files:',
        '## Requirements',
        '## Acceptance criteria',
        '## Verification',
        '## Handoff',
      ])
        expect(content, `${file}: ${field}`).toContain(field)
    }
  }
})
