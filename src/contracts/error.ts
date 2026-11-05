import { z } from 'zod'

export const apiErrorSchema = z.object({ error: z.object({
  code: z.enum(['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'CONFLICT', 'SERVER_ERROR']),
  message: z.string(), fields: z.record(z.string(), z.array(z.string())).optional(),
}) })
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>
export type ApiErrorCode = ApiErrorResponse['error']['code']
