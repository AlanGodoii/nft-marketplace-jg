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
    <h2 className="text-xl font-bold">Informações do colecionador</h2>
    <div className="commerce-form-grid">{(Object.keys(labels) as (keyof typeof labels)[]).map(key => <div className={key === 'bio' ? 'profile-wide space-y-2' : 'space-y-2'} key={key}>
      <label htmlFor={`profile-${key}`}>{labels[key]}</label>
      {key === 'bio' ? <textarea id="profile-bio" rows={4} {...form.register(key)} aria-invalid={!!form.formState.errors[key]} aria-describedby={`profile-${key}-error`} /> : <Input id={`profile-${key}`} type={key === 'email' ? 'email' : key === 'website' ? 'url' : 'text'} autoComplete={key === 'name' ? 'name' : key === 'email' ? 'email' : key === 'username' ? 'username' : 'url'} {...form.register(key)} aria-invalid={!!form.formState.errors[key]} aria-describedby={`profile-${key}-error`} />}
      <p id={`profile-${key}-error`} className="field-error">{form.formState.errors[key]?.message}</p>
    </div>)}</div>
    {save.isError && <p role="alert">{apiErrorMessage(save.error)}</p>}
    <p role="status">{notice}</p>
    <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar perfil'}</Button>
  </form>
}
function AvatarEditor({ profile }: { profile: Profile }) {
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
    {selected || profile.avatar ? <img className="profile-avatar" src={selected ?? profile.avatar!} width={112} height={112} alt={selected ? 'Prévia do avatar selecionado' : `Avatar de ${profile.name}`} /> : <div className="profile-avatar profile-avatar-empty" role="img" aria-label="Nenhum avatar cadastrado">{profile.name.slice(0, 1).toUpperCase()}</div>}
    <label htmlFor="profile-avatar">Imagem do avatar</label>
    <Input id="profile-avatar" type="file" accept="image/png,image/jpeg,image/webp" aria-invalid={!!error} aria-describedby="avatar-help avatar-error" disabled={reading || save.isPending} onChange={event => void choose(event.target.files?.[0])} />
    <p id="avatar-help" className="text-sm text-muted-foreground">PNG, JPEG ou WebP. Até 256 KiB e 4096×4096 px. SVG não é aceito.</p>
    <p id="avatar-error" className="field-error" role="alert">{error || (save.isError ? apiErrorMessage(save.error) : '')}</p>
    <p role="status">{reading ? 'Lendo imagem…' : notice}</p>
    <div className="flex flex-wrap gap-3"><Button type="button" disabled={!selected || save.isPending || reading} onClick={() => submit(selected)}>Salvar avatar</Button><Button type="button" variant="outline" disabled={!profile.avatar || save.isPending} onClick={() => submit(null)}>Remover avatar</Button></div>
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
export function ProfilePage() {
  const profile = useProfile()
  return <section className="space-y-8"><div><h1 className="text-3xl font-bold">Perfil</h1><p className="mt-3 text-muted-foreground">Sua identidade de colecionador na Kurio.</p></div>
    {profile.isPending ? <LoadingState label="Carregando perfil…" /> : profile.isError ? <ErrorState message={apiErrorMessage(profile.error)} retry={() => void profile.refetch()} /> : <div className="profile-layout" key={profile.data.id}>
      <div className="space-y-6"><ProfileEditor profile={profile.data} /><PasswordEditor /></div><aside className="space-y-6"><AvatarEditor profile={profile.data} /><Link to="/carteiras" className="inline-block underline">Gerenciar carteiras</Link></aside>
    </div>}
  </section>
}
