import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cpus, platform, release } from 'node:os'

const base = process.env.LIGHTHOUSE_BASE_URL ?? 'http://127.0.0.1:4190'
const output = resolve(process.env.LIGHTHOUSE_OUTPUT_DIR ?? 'reports/lighthouse')
const root = fileURLToPath(new URL('../', import.meta.url))
const binary = fileURLToPath(new URL('../node_modules/lighthouse/cli/index.js', import.meta.url))
await mkdir(output, { recursive: true })
const samples = []
for (const [name, path] of [['home', '/'], ['detail', '/nfts/nft-002']]) {
  for (const profile of ['mobile', 'desktop']) {
    for (let run = 1; run <= 3; run++) {
      const prefix = resolve(output, `${name}-${profile}-${run}`)
      const env = { ...process.env, KURIO_LH_PROFILE: profile }
      if (!env.CHROME_PATH && existsSync('/usr/bin/chromium')) env.CHROME_PATH = '/usr/bin/chromium'
      const args = [binary, new URL(path, base).href, '--config-path=lighthouse.config.mjs', '--output=json', '--output=html', `--output-path=${prefix}`, '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage', '--quiet']
      const code = await new Promise((resolveExit, reject) => {
        const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit' })
        child.on('error', reject); child.on('exit', resolveExit)
      })
      if (code !== 0) throw new Error(`Lighthouse ${name}/${profile}/${run}: código ${code}`)
      const lhr = JSON.parse(await readFile(`${prefix}.report.json`, 'utf8'))
      if (lhr.runtimeError) throw new Error(JSON.stringify(lhr.runtimeError))
      // Normalize whitespace-only lines in generated markup, retaining all
      // embedded report data and the original JSON results unchanged.
      const htmlPath = `${prefix}.report.html`
      await writeFile(htmlPath, (await readFile(htmlPath, 'utf8')).replace(/^[\t ]+$/gm, ''))
      const sample = { page: name, profile, run, url: lhr.finalDisplayedUrl ?? lhr.finalUrl,
        lighthouseVersion: lhr.lighthouseVersion, userAgent: lhr.userAgent,
        categories: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])),
        metrics: Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map(id => [id, lhr.audits[id].numericValue])),
        settings: lhr.configSettings, warnings: lhr.runWarnings,
        failedAudits: Object.entries(lhr.audits).filter(([, a]) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative').map(([id, audit]) => ({ id, title: audit.title, score: audit.score, displayValue: audit.displayValue })),
        json: `${name}-${profile}-${run}.report.json`, html: `${name}-${profile}-${run}.report.html`,
      }
      samples.push(sample)
      await writeFile(resolve(output, 'samples.json'), JSON.stringify(samples, null, 2) + '\n')
      console.log(JSON.stringify({ page: name, profile, run, categories: sample.categories, metrics: sample.metrics }))
    }
  }
}
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const medians = []
const targets = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }
for (const page of ['home', 'detail']) for (const profile of ['mobile', 'desktop']) {
  const group = samples.filter(s => s.page === page && s.profile === profile)
  const categories = Object.fromEntries(Object.keys(targets).map(key => [key, median(group.map(s => s.categories[key]))]))
  medians.push({ page, profile, categories, metrics: Object.fromEntries(Object.keys(group[0].metrics).map(key => [key, median(group.map(s => s.metrics[key]))])), meetsTargets: Object.entries(targets).every(([key, target]) => categories[key] >= target) })
}
const summary = { measuredAt: new Date().toISOString(), base, sourceCommit: process.env.LIGHTHOUSE_SOURCE_COMMIT ?? null,
  environment: { node: process.version, platform: platform(), release: release(), cpu: cpus()[0]?.model, cpuCount: cpus().length },
  conditions: 'Build otimizado com mocks padrão e todas as funcionalidades; processos de auditoria sequenciais, armazenamento resetado por medição; sem baselines/E2E simultâneos. Assets originais ainda indisponíveis.',
  targets, medians,
}
await writeFile(resolve(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
const rows = medians.map(m => `| ${m.page} | ${m.profile} | ${Object.values(m.categories).join(' | ')} | ${m.metrics['largest-contentful-paint'].toFixed(0)} | ${m.metrics['cumulative-layout-shift'].toFixed(4)} | ${m.metrics['total-blocking-time'].toFixed(0)} | ${m.meetsTargets ? 'Sim' : 'Não'} |`).join('\n')
await writeFile(resolve(output, 'README.md'), `# Lighthouse — 12 medições reais\n\nConfiguração: lighthouse.config.mjs. Execução: npm run lighthouse (preview otimizado em execução). Versões/ambiente/configuração efetiva e falhas por amostra em samples.json e summary.json; cada medição possui HTML e JSON completos.\n\n| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms | Todas as metas? |\n|---|---|---|---|---|---|---|---|---|---|\n${rows}\n\nMedianas de três execuções por cenário. Ambiente local, não deploy público. Assets originais ausentes continuam nos slots reais; nenhuma funcionalidade foi removida para medição. Repetir após incorporar assets e publicar a versão final.\n`)
console.log(JSON.stringify(summary.medians))
