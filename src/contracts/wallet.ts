import { z } from 'zod'
export const walletNetworkSchema = z.enum(['ethereum', 'polygon', 'solana'])
export const collectorSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.').max(80),
  username: z.string().trim().regex(/^[a-zA-Z0-9_-]{3,40}$/, 'Use de 3 a 40 letras, números, _ ou -.'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.').max(80),
  email: z.email('Informe um e-mail válido.'),
  referralCode: z.string().trim().min(2, 'Informe o código de indicação.').max(40),
  ensName: z.string().trim().regex(/^[a-z0-9-]{3,40}\.eth$/, 'Informe um nome ENS terminado em .eth.'),
  notes: z.string().max(1000),
})
export const walletFieldsSchema = z.object({
  label: z.string().trim().min(2, 'Informe o apelido da carteira.').max(60),
  role: z.enum(['primary', 'secondary']), network: walletNetworkSchema,
  address: z.string().trim(), provider: z.enum(['metamask', 'walletconnect', 'coinbase']),
  secondaryAddress: z.string().trim().max(100), collector: collectorSchema,
}).strict()
export const walletInputSchema = walletFieldsSchema.superRefine((value, ctx) => {
  const valid = value.network === 'solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.address) : /^0x[0-9a-fA-F]{40}$/.test(value.address)
  if (!valid) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Endereço inválido para a rede selecionada.' })
})
export const walletSchema = walletFieldsSchema.extend({ id: z.string(), version: z.number().int().positive() })
export const walletsSchema = z.object({ items: z.array(walletSchema) })
export const connectionSchema = z.object({ status: z.enum(['connected', 'refused', 'disconnected']), walletId: z.string(), network: walletNetworkSchema, connectionId: z.string().nullable() })
export type Wallet = z.infer<typeof walletSchema>
export type WalletInput = z.infer<typeof walletInputSchema>
export type Collector = z.infer<typeof collectorSchema>
export type WalletConnection = z.infer<typeof connectionSchema>
