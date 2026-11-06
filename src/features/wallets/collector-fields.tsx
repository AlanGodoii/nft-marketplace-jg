import type { UseFormReturn } from 'react-hook-form'
import type { WalletInput } from '@/contracts/wallet'
import { Input } from '@/components/ui/input'
export function CollectorFields({ form, prefix }: { form: UseFormReturn<WalletInput>; prefix: string }) {
  const labels = { displayName: 'Nome de exibição', username: 'Nome de usuário', profileName: 'Nome do perfil', email: 'E-mail', referralCode: 'Código de indicação', ensName: 'Nome ENS' } as const
  return <div className="commerce-form-grid">{(Object.keys(labels) as (keyof typeof labels)[]).map(key => <div className="space-y-2" key={key}>
    <label htmlFor={`${prefix}-${key}`}>{labels[key]}</label>
    <Input id={`${prefix}-${key}`} type={key === 'email' ? 'email' : 'text'} {...form.register(`collector.${key}`)} aria-invalid={!!form.formState.errors.collector?.[key]} aria-describedby={`${prefix}-${key}-error`} />
    <p id={`${prefix}-${key}-error`} className="field-error">{form.formState.errors.collector?.[key]?.message}</p>
  </div>)}</div>
}
