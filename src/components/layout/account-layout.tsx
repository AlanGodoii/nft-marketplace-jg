import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { UserRound, Wallet, ShoppingBag, Heart, Tag, Download, CircleHelp } from 'lucide-react'
import { AuthActions } from '@/features/auth/auth-actions'
export function AccountLayout({ children }: { children: ReactNode }) {
  const [notice,setNotice] = useState('')
  return <div className="account-layout"><aside className="account-sidebar" aria-label="Meu perfil"><h2>Meu perfil</h2>
    <Link to="/perfil" activeProps={{className:'is-active'}}><UserRound aria-hidden="true" />Dados do perfil</Link>
    <Link to="/carteiras" activeProps={{className:'is-active'}}><Wallet aria-hidden="true" />Carteiras</Link>
    <Link to="/pedido/confirmacao" activeProps={{className:'is-active'}}><ShoppingBag aria-hidden="true" />Meus pedidos</Link>
    <Link to="/favoritos" activeProps={{className:'is-active'}}><Heart aria-hidden="true" />Lista de interesse</Link>
    {([[Tag,'Ofertas'],[Download,'Arquivos baixados'],[CircleHelp,'Suporte']] as const).map(([Icon,label])=><button key={label} type="button" onClick={()=>setNotice(`${label}: indisponível nesta demonstração.`)}><Icon aria-hidden="true" />{label}</button>)}
    <AuthActions showName={false} logoutLabel="Sair da conta" /><p role="status">{notice}</p>
  </aside><div className="account-content">{children}</div></div>
}
