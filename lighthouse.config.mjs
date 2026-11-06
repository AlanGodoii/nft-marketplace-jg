import { screenEmulationMetrics, throttling, userAgents } from 'lighthouse/core/config/constants.js'

const profile = process.env.KURIO_LH_PROFILE === 'desktop' ? 'desktop' : 'mobile'
export default {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: profile,
    screenEmulation: screenEmulationMetrics[profile],
    throttling: profile === 'desktop' ? throttling.desktopDense4G : throttling.mobileSlow4G,
    emulatedUserAgent: userAgents[profile],
    throttlingMethod: 'simulate',
    locale: 'pt-BR',
    disableStorageReset: false,
  },
}
