import axios from 'axios'
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
api.interceptors.response.use(response => response, (error: unknown) => {
  if (axios.isCancel(error)) return Promise.reject(error)
  if (axios.isAxiosError(error)) {
    const parsed = apiErrorSchema.safeParse(error.response?.data)
    if (parsed.success) {
      const { message, code, fields } = parsed.data.error
      return Promise.reject(new ApiRequestError(message, code, error.response?.status, fields))
    }
    return Promise.reject(new ApiRequestError(
      error.code === 'ECONNABORTED' ? 'A consulta demorou demais. Tente novamente.' : 'Não foi possível acessar o catálogo. Verifique a conexão e tente novamente.',
      error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR', error.response?.status,
    ))
  }
  return Promise.reject(error)
})

export function apiErrorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : 'A resposta do catálogo é inválida. Tente novamente.'
}
