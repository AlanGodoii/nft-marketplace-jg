import { test as base, expect } from '@playwright/test'
import { X509Certificate, createHash } from 'node:crypto'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

function varint(value: number) {
  const bytes: number[] = []
  do { const next = value & 127; value >>>= 7; bytes.push(next | (value ? 128 : 0)) } while (value)
  return Buffer.from(bytes)
}
function field(tag: number, bytes: Buffer) { return Buffer.concat([Buffer.from([tag]), varint(bytes.length), bytes]) }

// Optional trust for managed/corporate proxies. This creates only a disposable
// Chrome profile, never modifies the user's NSS/system store or disables TLS.
function prepareProxyTrust(profile: string, host: string) {
  const certFile = process.env.KURIO_TEST_CA_CERT
  if (!certFile) return
  const cert = new X509Certificate(readFileSync(certFile))
  if (!cert.ca) throw new Error('KURIO_TEST_CA_CERT must be a CA certificate.')
  const directory = join(profile, 'Default'); mkdirSync(directory, { recursive: true })
  const database = new DatabaseSync(join(directory, 'ServerCertificate'))
  database.exec('CREATE TABLE meta(key LONGVARCHAR NOT NULL UNIQUE PRIMARY KEY,value LONGVARCHAR); CREATE TABLE certificates(sha256hash_hex TEXT PRIMARY KEY,der_cert BLOB NOT NULL,trust_settings BLOB NOT NULL);')
  const meta = database.prepare('INSERT INTO meta VALUES (?,?)')
  for (const [key, value] of [['version', '1'], ['last_compatible_version', '1'], ['mmap_status', '-1']]) meta.run(key, value)
  // Chromium CertificateMetadata: trusted CA (enum3), constrained to this DNS.
  const trust = field(0x0a, Buffer.from([0x08, 0x03]))
  const constraints = field(0x12, field(0x0a, Buffer.from(host)))
  database.prepare('INSERT INTO certificates VALUES (?,?,?)').run(createHash('sha256').update(cert.raw).digest('hex'), cert.raw, Buffer.concat([trust, constraints]))
  database.close()
}

export const test = base.extend({
  context: async ({ playwright, baseURL, viewport, isMobile, hasTouch }, provide, testInfo) => {
    if (!baseURL || new URL(baseURL).protocol !== 'https:') throw new Error('Published validation requires an HTTPS TEST_BASE_URL.')
    const profile = testInfo.outputPath('browser-profile')
    mkdirSync(profile, { recursive: true }); prepareProxyTrust(profile, new URL(baseURL).hostname)
    const proxyUrl = process.env.KURIO_USE_ENV_PROXY === 'true' ? process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY : undefined
    const parsed = proxyUrl ? new URL(proxyUrl) : null
    const proxy = parsed ? { server: parsed.origin, ...(parsed.username ? { username: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password) } : {}) } : undefined
    const context = await playwright.chromium.launchPersistentContext(profile, {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      proxy, baseURL, viewport, isMobile, hasTouch, ignoreHTTPSErrors: false,
    })
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true })
    try { await provide(context) } finally {
      if (testInfo.status !== testInfo.expectedStatus) {
        const path = testInfo.outputPath('trace.zip'); await context.tracing.stop({ path }); await testInfo.attach('trace', { path, contentType: 'application/zip' })
      } else await context.tracing.stop()
      await context.close()
    }
  },
})
export { expect }
