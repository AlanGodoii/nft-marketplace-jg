import { z } from 'zod'
import { loginSchema } from './auth'

export const avatarMaxBytes = 256 * 1024
export const profileFieldsSchema = z.object({
  name: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(80),
  email: loginSchema.shape.email,
  username: z.string().trim().regex(/^$|^[a-zA-Z0-9_-]{3,40}$/, 'Use de 3 a 40 letras, números, _ ou -.'),
  bio: z.string().trim().max(500, 'Use até 500 caracteres.'),
  website: z.union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Informe uma URL http ou https válida.' })]),
}).strict()
export const avatarDataSchema = z.string().max(350000, 'A imagem deve ter até 256 KiB.').regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, 'Use uma imagem PNG, JPEG ou WebP válida.').nullable()
export const profileSchema = profileFieldsSchema.extend({ id: z.string(), version: z.number().int().positive(), avatar: avatarDataSchema })
export const profileUpdateSchema = profileFieldsSchema.extend({ version: z.number().int().positive() })
export const avatarUpdateSchema = z.object({ avatar: avatarDataSchema, version: z.number().int().positive() }).strict()
export const passwordChangeSchema = z.object({ currentPassword: loginSchema.shape.password, newPassword: loginSchema.shape.password }).strict().refine(value => value.currentPassword !== value.newPassword, { path: ['newPassword'], message: 'Escolha uma senha diferente da atual.' })
export const passwordFormSchema = z.object({ currentPassword: loginSchema.shape.password, newPassword: loginSchema.shape.password, confirmPassword: z.string() }).refine(value => value.currentPassword !== value.newPassword, { path: ['newPassword'], message: 'Escolha uma senha diferente da atual.' }).refine(value => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'As senhas devem ser iguais.' })
export type Profile = z.infer<typeof profileSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type AvatarUpdate = z.infer<typeof avatarUpdateSchema>
export type PasswordChange = z.infer<typeof passwordChangeSchema>
