import type { AxiosRequestConfig } from 'axios'
import { api, ApiRequestError } from './api'
import { identityEpoch, registerSessionCleanup } from './identity'
export async function scopedRequest(config: AxiosRequestConfig, expectedEpoch: number) {
  if (identityEpoch() !== expectedEpoch) throw new ApiRequestError('A sessão mudou. Tente novamente.', 'SESSION_CHANGED')
  const controller = new AbortController()
  const unregister = registerSessionCleanup(() => controller.abort())
  try { return await api.request<unknown>({ ...config, signal: controller.signal }) }
  finally { unregister() }
}
