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
  const mutation = useMutation({ mutationFn: login, retry: false, onSuccess: finish, onError: error => {
    if (error instanceof ApiRequestError && error.fields?.email) form.setError('email', { message: error.fields.email[0] })
  } })
  return <form noValidate onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="auth-form" aria-label="Entrar na conta">
    <label htmlFor="login-email">E-mail</label><Input id="login-email" type="email" autoComplete="email" {...form.register('email')} aria-invalid={!!form.formState.errors.email} aria-describedby="login-email-error" />
    <FieldError id="login-email-error" message={form.formState.errors.email?.message} />
    <label htmlFor="login-password">Senha</label><Input id="login-password" type={show ? 'text' : 'password'} autoComplete="current-password" {...form.register('password')} aria-invalid={!!form.formState.errors.password} aria-describedby="login-password-error" />
    <FieldError id="login-password-error" message={form.formState.errors.password?.message} />
    <Button type="button" variant="link" onClick={() => setShow(!show)}>{show ? 'Ocultar senha' : 'Mostrar senha'}</Button>
    {mutation.isError && <p role="alert">{apiErrorMessage(mutation.error)}</p>}
    <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Entrando…' : 'Entrar'}</Button>
  </form>
}
function RegisterForm() {
  const { finish } = useAuthDestination()
  type Values = z.infer<typeof registerFormSchema>
  const form = useForm<Values>({ resolver: zodResolver(registerFormSchema), defaultValues: { name: '', email: '', password: '', confirmPassword: '' } })
  const mutation = useMutation({ mutationFn: (values: Values) => register({ name: values.name, email: values.email, password: values.password }), retry: false, onSuccess: finish, onError: error => {
    if (error instanceof ApiRequestError) for (const key of ['name', 'email', 'password'] as const) if (error.fields?.[key]) form.setError(key, { message: error.fields[key][0] })
  } })
  return <form noValidate onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="auth-form" aria-label="Criar conta">
    {(['name', 'email', 'password', 'confirmPassword'] as const).map(key => <div key={key} className="space-y-2">
      <label htmlFor={`register-${key}`}>{{ name: 'Nome', email: 'E-mail', password: 'Senha', confirmPassword: 'Confirmar senha' }[key]}</label>
      <Input id={`register-${key}`} type={key === 'email' ? 'email' : key.includes('assword') ? 'password' : 'text'} autoComplete={key.includes('assword') ? 'new-password' : key === 'name' ? 'name' : 'email'} {...form.register(key)} aria-invalid={!!form.formState.errors[key]} aria-describedby={`register-${key}-error`} />
      <FieldError id={`register-${key}-error`} message={form.formState.errors[key]?.message} />
    </div>)}
    {mutation.isError && <p role="alert">{apiErrorMessage(mutation.error)}</p>}
    <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Criando conta…' : 'Criar conta'}</Button>
  </form>
}
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { destination } = useAuthDestination()
  const router = useRouter()
  return <><div className="py-12 text-center"><p className="text-primary">KURIO · COLECIONADORES</p></div>
    <Dialog open onOpenChange={open => { if (!open) void router.navigate({ to: '/' }) }}>
      <DialogContent className="kurio-theme auth-card">
        <DialogTitle>{mode === 'login' ? 'Login' : 'Cadastro'}</DialogTitle>
        <nav className="flex gap-4" aria-label="Acesso à conta"><Link to="/login" search={{ redirect: destination }}>Entrar</Link><Link to="/cadastro" search={{ redirect: destination }}>Criar conta</Link></nav>
        <DialogDescription>{mode === 'login' ? 'Entre para gerenciar sua carteira e coleção.' : 'Crie seu perfil de colecionador.'}</DialogDescription>
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        <p className="text-xs text-muted-foreground">Login social e recuperação de senha não estão disponíveis nesta etapa.</p>
      </DialogContent>
    </Dialog>
  </>
}
export function LoginPage() { return <AuthPage mode="login" /> }
export function RegisterPage() { return <AuthPage mode="register" /> }
