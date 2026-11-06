import { useDesktop } from '@/lib/use-desktop'
import { Eye, EyeOff } from 'lucide-react'
import { AuthBackdrop } from './auth-backdrop'
import { SocialOptions } from './social-options'
import { useState } from 'react'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { loginSchema, registerFormSchema, type LoginInput } from '@/contracts/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { apiErrorMessage, ApiRequestError } from '@/lib/api'
import { login, register } from './api'
import { adoptSession } from './lifecycle'
import { safeReturnTo } from './redirect'

function useAuthDestination() {
  const search = useSearch({ strict: false }) as { redirect?: string }
  const router = useRouter()
  const destination = safeReturnTo(search.redirect)
  return { destination, finish: async (result: Awaited<ReturnType<typeof login>>) => {
    await adoptSession(result.token, result.session)
    await router.invalidate()
    await router.navigate({ href: destination, replace: true })
  } }
}
function FieldError({ id, message }: { id: string; message?: string }) { return message ? <p id={id} className="field-error">{message}</p> : null }
function LoginForm() {
  const { finish } = useAuthDestination()
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const [show, setShow] = useState(false)
  const [recovery,setRecovery] = useState('')
  const mutation = useMutation({ mutationFn: login, retry: false, onSuccess: finish, onError: error => {
    if (error instanceof ApiRequestError && error.fields?.email) form.setError('email', { message: error.fields.email[0] })
  } })
  return <form noValidate onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="auth-form" aria-label="Entrar na conta">
    <label htmlFor="login-email">E-mail</label><Input placeholder="contato@email.com" id="login-email" type="email" autoComplete="email" {...form.register('email')} aria-invalid={!!form.formState.errors.email} aria-describedby="login-email-error" />
    <FieldError id="login-email-error" message={form.formState.errors.email?.message} />
    <label htmlFor="login-password">Senha</label><div className="password-field"><Input placeholder="Senha" id="login-password" type={show ? 'text' : 'password'} autoComplete="current-password" {...form.register('password')} aria-invalid={!!form.formState.errors.password} aria-describedby="login-password-error" /><Button type="button" className="password-toggle" variant="ghost" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={()=>setShow(!show)}>{show ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</Button></div>
    <FieldError id="login-password-error" message={form.formState.errors.password?.message} />
    <button type="button" className="password-recovery" onClick={()=>setRecovery('Recuperação de senha indisponível nesta demonstração. Use as credenciais fictícias documentadas.')}>Esqueceu a senha?</button>{recovery && <p role="status" className="field-error">{recovery}</p>}
    {mutation.isError && <p role="alert">{apiErrorMessage(mutation.error)}</p>}
    <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Entrando…' : 'Entrar'}</Button>
  </form>
}
function RegisterForm() {
  const desktop = useDesktop()
  const { finish } = useAuthDestination()
  const [visible,setVisible] = useState<Record<string,boolean>>({})
  type Values = z.infer<typeof registerFormSchema>
  const form = useForm<Values>({ resolver: zodResolver(registerFormSchema), defaultValues: { name: '', email: '', password: '', confirmPassword: '' } })
  const mutation = useMutation({ mutationFn: (values: Values) => register({ name: values.name, email: values.email, password: values.password }), retry: false, onSuccess: finish, onError: error => {
    if (error instanceof ApiRequestError) for (const key of ['name', 'email', 'password'] as const) if (error.fields?.[key]) form.setError(key, { message: error.fields[key][0] })
  } })
  return <form noValidate onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="auth-form" aria-label="Criar conta">
    {(['name', 'email', 'password', 'confirmPassword'] as const).map(key => <div key={key} className="space-y-2">
      <label htmlFor={`register-${key}`}>{{ name: 'Nome', email: 'E-mail', password: 'Senha', confirmPassword: 'Confirmar senha' }[key]}</label>
      <div className={key.includes('assword') ? 'password-field' : undefined}><Input placeholder={{name:'Nome de colecionador',email:'Digite seu e-mail',password:'Senha',confirmPassword:'Confirmar senha'}[key]} id={`register-${key}`} type={key === 'email' ? 'email' : key.includes('assword') ? visible[key] ? 'text' : 'password' : 'text'} autoComplete={key.includes('assword') ? 'new-password' : key === 'name' ? 'name' : 'email'} {...form.register(key)} aria-invalid={!!form.formState.errors[key]} aria-describedby={`register-${key}-error`} />{key.includes('assword') && <Button type="button" className="password-toggle" variant="ghost" aria-label={`${visible[key] ? 'Ocultar' : 'Mostrar'} ${key === 'confirmPassword' ? 'confirmação da senha' : 'senha'}`} onClick={()=>setVisible({...visible,[key]:!visible[key]})}>{visible[key] ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</Button>}</div>
      <FieldError id={`register-${key}-error`} message={form.formState.errors[key]?.message} />
    </div>)}
    {mutation.isError && <p role="alert">{apiErrorMessage(mutation.error)}</p>}
    <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Criando conta…' : desktop ? 'Criar conta' : 'Criar perfil'}</Button>
  </form>
}
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { destination } = useAuthDestination()
  const router = useRouter(); const desktop = useDesktop()
  const title = mode === 'login' ? 'Entrar' : desktop ? 'Criar conta' : 'Criar perfil de colecionador'
  const form = mode === 'login' ? <LoginForm /> : <RegisterForm />
  const description = mode === 'login' ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.' : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
  const switchLink = <Link to={mode === 'login' ? '/cadastro' : '/login'} search={{ redirect: destination }}>{mode === 'login' ? 'Novo na Kurio? Crie uma conta' : 'Já tem uma conta? Entre'}</Link>
  if (!desktop) return <section className="mobile-auth-page"><Link className="auth-wordmark" to="/" aria-label="Kurio — início">KURIO</Link><h1>{title}</h1>{form}<SocialOptions /><div className="auth-switch">{switchLink}</div></section>
  return <><AuthBackdrop /><Dialog open onOpenChange={open => { if (!open) void router.navigate({ to: '/' }) }}>
      <DialogContent className="kurio-theme auth-card" initialFocus={()=>document.getElementById(mode === 'login' ? 'login-email' : 'register-name')}>
        <div className="auth-title-tabs">{mode === 'login' ? <DialogTitle>Entrar</DialogTitle> : <Link to="/login" search={{redirect:destination}}>Entrar</Link>}<span aria-hidden="true">|</span>{mode === 'register' ? <DialogTitle>Criar conta</DialogTitle> : <Link to="/cadastro" search={{redirect:destination}}>Criar conta</Link>}</div>
        <DialogDescription>{description}</DialogDescription>
        {form}<SocialOptions /><div className="auth-switch">{switchLink}</div>
      </DialogContent>
    </Dialog></>
}
export function LoginPage() { return <AuthPage mode="login" /> }
export function RegisterPage() { return <AuthPage mode="register" /> }
