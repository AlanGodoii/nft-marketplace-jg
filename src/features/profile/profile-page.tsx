import { useRef } from 'react'
import { ImagePlus } from 'lucide-react'
import { useWallets, useSaveWallet } from '@/features/wallets/queries'
import type { Wallet } from '@/contracts/wallet'
import { AccountLayout } from '@/components/layout/account-layout'
import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { avatarDataSchema, avatarMaxBytes, passwordFormSchema, profileUpdateSchema, type Profile, type ProfileUpdate } from '@/contracts/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorState, LoadingState } from '@/components/async-state'
import { ApiRequestError, apiErrorMessage } from '@/lib/api'
import { identityEpoch } from '@/lib/identity'
import { adoptSession } from '@/features/auth/lifecycle'
import { useChangePassword, useProfile, useSaveProfile } from './queries'

const labels = { name: 'Nome de exibição', email: 'E-mail', username: 'Nome de usuário', website: 'Website', bio: 'Biografia' } as const
function fields(profile: Profile): ProfileUpdate {
  return { name: profile.name, email: profile.email, username: profile.username, website: profile.website, bio: profile.bio, version: profile.version }
}
function ProfileEditor({ profile }: { profile: Profile }) {
  const [notice, setNotice] = useState('')
  const form = useForm<ProfileUpdate>({ resolver: zodResolver(profileUpdateSchema), defaultValues: fields(profile) })
  const save = useSaveProfile('data')
  return <form aria-label="Dados do perfil" noValidate className="commerce-panel auth-form" onSubmit={form.handleSubmit(values => {
    setNotice(''); save.mutate({ ...values, version: profile.version }, { onSuccess: updated => { form.reset(fields(updated)); setNotice('Perfil atualizado.') }, onError: error => {
      if (error instanceof ApiRequestError) for (const key of Object.keys(labels) as (keyof typeof labels)[]) if (error.fields?.[key]) form.setError(key, { message: error.fields[key][0] })
    } })
  })}>
    <h2 className="sr-only">Informações do colecionador</h2>
    <div className="profile-primary-fields commerce-form-grid">{(['name','username','email'] as const).map(key => <div key={key} className={`profile-field-${key} space-y-2`}><label htmlFor={`profile-${key}`}>{labels[key]}</label><Input id={`profile-${key}`} type={key === 'email' ? 'email' : 'text'} autoComplete={key === 'name' ? 'name' : key === 'email' ? 'email' : 'username'} {...form.register(key)} aria-invalid={!!form.formState.errors[key]} aria-describedby={`profile-${key}-error`} /><p id={`profile-${key}-error`} className="field-error">{form.formState.errors[key]?.message}</p></div>)}</div>
    <details className="profile-additional"><summary>Informações adicionais</summary><div className="commerce-form-grid">{(['website','bio'] as const).map(key=><div key={key}><label htmlFor={`profile-${key}`}>{labels[key]}</label>{key === 'bio' ? <textarea id="profile-bio" rows={4} {...form.register(key)} aria-invalid={!!form.formState.errors[key]} aria-describedby={`profile-${key}-error`} /> : <Input id="profile-website" type="url" {...form.register(key)} aria-invalid={!!form.formState.errors[key]} aria-describedby={`profile-${key}-error`} />}<p id={`profile-${key}-error`} className="field-error">{form.formState.errors[key]?.message}</p></div>)}</div></details>
    {save.isError && <p role="alert">{apiErrorMessage(save.error)}</p>}
    <p role="status">{notice}</p>
    <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar perfil'}</Button>
  </form>
}
function AvatarEditor({ profile }: { profile: Profile }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [reading, setReading] = useState(false)
  const save = useSaveProfile('avatar')
  async function choose(file?: File) {
    setError(''); setNotice(''); setSelected(null)
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > avatarMaxBytes || file.size === 0) { setError('Use PNG, JPEG ou WebP de até 256 KiB.'); return }
    setReading(true)
    try {
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
      setSelected(avatarDataSchema.parse(data))
    } catch { setError('Não foi possível ler a imagem.') } finally { setReading(false) }
  }
  function submit(avatar: string | null) {
    setError(''); setNotice('')
    save.mutate({ avatar, version: profile.version }, { onSuccess: () => { setSelected(null); setNotice(avatar ? 'Avatar atualizado.' : 'Avatar removido.') } })
  }
  return <section className="commerce-panel space-y-4" aria-labelledby="avatar-title">
    <h2 id="avatar-title" className="text-xl font-bold">Avatar</h2>
    {selected || profile.avatar ? <img className="profile-avatar" src={selected ?? profile.avatar!} width={112} height={112} alt={selected ? 'Prévia do avatar selecionado' : `Avatar de ${profile.name}`} /> : <div className="profile-avatar profile-avatar-empty" role="img" aria-label="Nenhum avatar cadastrado"><ImagePlus aria-hidden="true" /></div>}
    <label htmlFor="profile-avatar">Imagem do avatar</label>
    <Input ref={fileInput} id="profile-avatar" type="file" accept="image/png,image/jpeg,image/webp" aria-invalid={!!error} aria-describedby="avatar-help avatar-error" disabled={reading || save.isPending} onChange={event => void choose(event.target.files?.[0])} />
    <p id="avatar-help" className="text-sm text-muted-foreground">PNG, JPEG ou WebP. Até 256 KiB e 4096×4096 px. SVG não é aceito.</p>
    <p id="avatar-error" className="field-error" role="alert">{error || (save.isError ? apiErrorMessage(save.error) : '')}</p>
    <p role="status">{reading ? 'Lendo imagem…' : notice}</p>
    <div className="avatar-actions flex flex-wrap gap-3"><Button type="button" onClick={()=>fileInput.current?.click()}>Alterar</Button><Button type="button" disabled={!selected || save.isPending || reading} onClick={() => submit(selected)}>Salvar avatar</Button><Button type="button" variant="outline" disabled={!profile.avatar || save.isPending} onClick={() => submit(null)}>Remover avatar</Button></div>
  </section>
}
function PasswordEditor() {
  type Values = z.infer<typeof passwordFormSchema>
  const form = useForm<Values>({ resolver: zodResolver(passwordFormSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })
  const change = useChangePassword(); const router = useRouter(); const epoch = identityEpoch()
  return <form className="commerce-panel auth-form" aria-label="Alterar senha" noValidate onSubmit={form.handleSubmit(values => change.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword }, { onSuccess: async () => {
    if (epoch !== identityEpoch()) return
    form.reset(); await adoptSession(null, null); await router.invalidate(); await router.navigate({ to: '/login', search: { redirect: '/perfil' }, replace: true })
  }, onError: error => { if (error instanceof ApiRequestError && error.fields?.currentPassword) form.setError('currentPassword', { message: error.fields.currentPassword[0] }) } }))}>
    <h2 className="text-xl font-bold">Alterar senha</h2>
    <p className="text-sm text-muted-foreground">Após salvar, todas as sessões serão encerradas. Entre novamente com a nova senha. Sua coleção e seus pedidos serão preservados.</p>
    {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map(key => <div className="space-y-2" key={key}>
      <label htmlFor={`profile-${key}`}>{{ currentPassword: 'Senha atual', newPassword: 'Nova senha', confirmPassword: 'Confirmar nova senha' }[key]}</label>
      <Input id={`profile-${key}`} type="password" autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} {...form.register(key)} aria-invalid={!!form.formState.errors[key]} aria-describedby={`${key}-error`} />
      <p id={`${key}-error`} className="field-error">{form.formState.errors[key]?.message}</p>
    </div>)}
    {change.isError && <p role="alert">{apiErrorMessage(change.error)}</p>}
    <Button type="submit" disabled={change.isPending}>{change.isPending ? 'Alterando…' : 'Alterar senha e sair'}</Button>
  </form>
}
function LinkedWalletFields({ wallet }: {wallet:Wallet}) {
  const save = useSaveWallet()
  const form = useForm<{label:string;ens:string}>({defaultValues:{label:wallet.label,ens:wallet.collector.ensName}})
  return <form className="linked-wallet-form" aria-label="Carteira vinculada ao perfil" onSubmit={form.handleSubmit(values=>{
    const {id:_id,version:_version,...input}=wallet
    save.mutate({id:wallet.id,input:{...input,label:values.label,collector:{...input.collector,ensName:values.ens}}})
  })}>
    <div className="linked-wallet-ens"><label htmlFor="profile-wallet-ens">Nome ENS</label><Input id="profile-wallet-ens" {...form.register('ens')} /></div>
    <div className="linked-wallet-label"><label htmlFor="profile-wallet-label">Apelido da carteira</label><Input id="profile-wallet-label" {...form.register('label')} /></div>
    <Button type="submit" disabled={save.isPending}>Salvar carteira vinculada</Button>
    {save.isError && <p role="alert">{apiErrorMessage(save.error)}</p>}{save.isSuccess && <p role="status">Carteira vinculada atualizada.</p>}
  </form>
}
export function ProfilePage() {
  const profile = useProfile(); const wallets = useWallets()
  const primary = wallets.data?.items.find(wallet=>wallet.role === 'primary')
  return <AccountLayout><section className="profile-page space-y-8"><div><h1 className="text-3xl font-bold">Perfil do colecionador</h1></div>
    {profile.isPending ? <LoadingState label="Carregando perfil…" /> : profile.isError ? <ErrorState message={apiErrorMessage(profile.error)} retry={() => void profile.refetch()} /> : <div className="profile-layout" key={profile.data.id}>
      <ProfileEditor profile={profile.data} />
      {primary ? <LinkedWalletFields wallet={primary} key={`${primary.id}:${primary.version}`} /> : <p className="linked-wallet-form"><Link to="/carteiras">Cadastre uma carteira para adicionar ENS e apelido.</Link></p>}
      <AvatarEditor profile={profile.data} /><PasswordEditor />
    </div>}
  </section></AccountLayout>
}
