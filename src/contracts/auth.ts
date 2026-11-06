import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(8, 'Use pelo menos 8 caracteres.').max(128),
}).strict()
export const registerSchema = loginSchema.extend({ name: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(80) })
export const registerFormSchema = registerSchema.extend({ confirmPassword: z.string() }).refine(value => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'As senhas devem ser iguais.' })
export const userSchema = z.object({ id: z.string(), name: z.string(), email: z.email() })
export const sessionSchema = z.object({ user: userSchema, expiresAt: z.iso.datetime() })
export const authResponseSchema = z.object({ token: z.string(), session: sessionSchema, notices: z.array(z.string()) })
export type User = z.infer<typeof userSchema>
export type Session = z.infer<typeof sessionSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
