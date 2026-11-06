import { useDesktop } from '@/lib/use-desktop'
import { AccountLayout } from '@/components/layout/account-layout'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { walletInputSchema, type Wallet, type WalletInput } from '@/contracts/wallet'
import { useSession } from '@/features/auth/api'
import { LoadingState, ErrorState } from '@/components/async-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiErrorMessage } from '@/lib/api'
import { CollectorFields } from './collector-fields'
import { useSaveWallet, useWallets } from './queries'
function WalletForm({ wallet, close }: { wallet?: Wallet; close: () => void }) {
  const session = useSession(); const save = useSaveWallet()
  const form = useForm<WalletInput>({ resolver: zodResolver(walletInputSchema), defaultValues: wallet ? { label: wallet.label, role: wallet.role, network: wallet.network, address: wallet.address, provider: wallet.provider, secondaryAddress: wallet.secondaryAddress, collector: wallet.collector } : {
    label: '', role: 'secondary', network: 'ethereum', address: '', provider: 'metamask', secondaryAddress: '',
    collector: { displayName: session.data?.user.name ?? '', username: '', profileName: '', email: session.data?.user.email ?? '', referralCode: '', ensName: '', notes: '' },
  } })
  return <form noValidate className="commerce-panel wallet-form space-y-6" aria-label={wallet ? 'Editar carteira' : 'Cadastrar carteira'} onSubmit={form.handleSubmit(values => save.mutate({ id: wallet?.id, input: values }, { onSuccess: close }))}>
    <h2 className="text-xl font-bold">{wallet?.role === 'primary' ? 'Carteira principal' : wallet ? 'Carteira secundária' : 'Cadastrar carteira'}</h2><p className="wallet-form-description">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados na simulação.</p>
    <CollectorFields form={form} prefix="wallet" />
    <div className="commerce-form-grid">
      <div><label htmlFor="wallet-label">Apelido da carteira</label><Input id="wallet-label" {...form.register('label')} aria-invalid={!!form.formState.errors.label} aria-describedby="wallet-label-error" /><p id="wallet-label-error" className="field-error">{form.formState.errors.label?.message}</p></div>
      <div><label htmlFor="wallet-role">Papel</label><select id="wallet-role" {...form.register('role')}><option value="primary">Principal</option><option value="secondary">Secundária</option></select></div>
      <div><label htmlFor="wallet-network">Rede</label><select id="wallet-network" {...form.register('network')}><option value="ethereum">Ethereum</option><option value="polygon">Polygon</option><option value="solana">Solana</option></select></div>
      <div><label htmlFor="wallet-provider">Tipo de carteira</label><select id="wallet-provider" {...form.register('provider')}><option value="metamask">MetaMask</option><option value="walletconnect">WalletConnect</option><option value="coinbase">Coinbase Wallet</option></select></div>
      <div className="commerce-wide"><label htmlFor="wallet-address">Endereço da carteira</label><Input id="wallet-address" {...form.register('address')} aria-invalid={!!form.formState.errors.address} aria-describedby="wallet-address-error" /><p id="wallet-address-error" className="field-error">{form.formState.errors.address?.message}</p></div>
      <div className="commerce-wide"><label htmlFor="wallet-secondary">ENS ou carteira secundária (opcional)</label><Input id="wallet-secondary" {...form.register('secondaryAddress')} /></div>
    </div>
    {save.isError && <p role="alert">{apiErrorMessage(save.error)}</p>}
    <div className="flex flex-wrap gap-4"><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar carteira'}</Button><Button type="button" variant="outline" onClick={close}>Cancelar</Button></div>
  </form>
}
export function WalletsPage() {
  const desktop = useDesktop()
  const query = useWallets(); const [editing, setEditing] = useState<Wallet | 'new' | null>(null)
  const defaultWallet = query.data?.items.find(wallet=>wallet.role === 'primary')
  const selectedWallet = editing === 'new' ? undefined : editing ?? (desktop ? defaultWallet : undefined)
  return <AccountLayout><section className="wallets-page space-y-8"><h1 className="text-3xl font-bold">Carteiras</h1><p>Gerencie sua carteira principal e secundária. A conexão é simulada, sem extensões.</p>
    {query.isPending ? <LoadingState label="Carregando carteiras" /> : query.isError ? <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} /> : <>
      <div className="wallet-list">{query.data.items.length ? query.data.items.map(wallet => <article className="commerce-panel space-y-3" data-testid="wallet-card" data-wallet-role={wallet.role} key={wallet.id}><h2 className="font-bold">{wallet.label} · {wallet.role === 'primary' ? 'Principal' : 'Secundária'}</h2><p>{wallet.network} · {wallet.provider}</p><p className="break-all">{wallet.address}</p><Button variant="outline" onClick={() => setEditing(wallet)}>Editar {wallet.label}</Button></article>) : <p role="status">Nenhuma carteira cadastrada.</p>}</div>
      {!editing && <Button onClick={() => setEditing('new')}>Adicionar carteira</Button>}
      {(editing || desktop) && <WalletForm wallet={selectedWallet} close={() => setEditing(null)} key={editing === 'new' ? 'new' : `${selectedWallet?.id ?? 'new'}-${selectedWallet?.version ?? 0}`} />}
    </>}
  </section></AccountLayout>
}
