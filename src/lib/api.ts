import axios from 'axios'
import { getGuestId, getToken, reportSessionExpired } from './identity'
import { apiErrorSchema } from '@/contracts/error'

export class ApiRequestError extends Error {
  status?: number
  code: string
  fields?: Record<string, string[]>
  constructor(message: string, code: string, status?: number, fields?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = code
    this.status = status
    this.fields = fields
  }
}

export const api = axios.create({ baseURL: '/api', timeout: 10_000, headers: { Accept: 'application/json' } })
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  config.headers.set('X-Guest-ID', getGuestId())
  return config
})
api.interceptors.response.use(response => response, (error: unknown) => {
  if (axios.isCancel(error)) return Promise.reject(error)
  if (axios.isAxiosError(error)) {
    const authorization = error.config?.headers?.Authorization
    if (error.response?.status === 401 && !['/auth/login', '/auth/register'].includes(error.config?.url ?? '')) {
      reportSessionExpired(typeof authorization === 'string' ? authorization.replace(/^Bearer /, '') : undefined)
    }
    const parsed = apiErrorSchema.safeParse(error.response?.data)
    if (parsed.success) {
      const { message, code, fields } = parsed.data.error
      return Promise.reject(new ApiRequestError(message, code, error.response?.status, fields))
    }
    return Promise.reject(new ApiRequestError(
      error.code === 'ECONNABORTED' ? 'A consulta demorou demais. Tente novamente.' : 'Não foi possível acessar o serviço. Verifique a conexão e tente novamente.',
      error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR', error.response?.status,
    ))
  }
  return Promise.reject(error)
})

export function apiErrorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : 'A resposta do serviço é inválida. Tente novamente.'
}
