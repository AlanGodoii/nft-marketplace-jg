import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
export function HomeFooter() {
  const [message, setMessage] = useState('')
  const unavailable = () => setMessage('Recurso fora do escopo desta demonstração; nenhum envio ou navegação externa foi realizado.')
  return <footer className="home-footer desktop-home-only">
    <section className="footer-information kurio-container" aria-label="Informações da Kurio">
      <div><span className="footer-medallion" aria-hidden="true">W</span><h2>Segurança da carteira</h2><p>Proteja sua carteira e colecione arte digital verificada com confiança.</p></div>
      <div id="criadores"><span className="footer-medallion" aria-hidden="true">C</span><h2>Criadores em destaque</h2><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p></div>
      <div><span className="footer-medallion" aria-hidden="true">D</span><h2>Alertas de lançamentos</h2><p>Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.</p></div>
      <div><h2>Antecipe-se ao próximo lançamento</h2><form onSubmit={event => { event.preventDefault(); setMessage('Inscrição indisponível nesta demonstração. Nenhum e-mail foi enviado ou armazenado.') }}><label className="sr-only" htmlFor="newsletter-email">E-mail para novidades</label><Input id="newsletter-email" type="email" required placeholder="digite seu e-mail..." /><Button type="submit">Enviar</Button></form><p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p><small>Newsletter ilustrativa, sem envio.</small></div>
    </section>
    <div className="footer-contact"><div className="kurio-container"><Link to="/">KURIO</Link><p>Feito para colecionadores,<br />criadores e cultura</p><p>contato@email.com<small>Contato ilustrativo do layout</small></p><p>+55 11 4002 8922<small>Telefone ilustrativo do layout</small></p></div></div>
    <div className="footer-links kurio-container">
      <div><h2>Meu perfil</h2><Link to="/perfil">Meu perfil</Link><Link to="/favoritos">Minha coleção / lista de interesse</Link><Link to="/pedido/confirmacao">Meus pedidos</Link><button onClick={unavailable}>Atividade · indisponível</button><button onClick={unavailable}>Estúdio do criador · indisponível</button></div>
      <div><h2>Central de ajuda</h2>{['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'].map(text => <button key={text} onClick={unavailable} aria-label={`${text} (indisponível nesta demonstração)`}>{text}</button>)}</div>
      <div><h2>Coleções</h2>{[['genesis','Genesis'],['nomads','Nomads'],['signals','Signals']].map(([collection,name]) => <Link key={collection} to="/" search={previous => ({ ...previous, collection, page: 1 })} hash="catalogo">{name}</Link>)}</div>
      <div><h2>Redes sociais</h2><div className="footer-socials">{[['f','Facebook'],['◎','Instagram'],['𝕏','𝕏 / Twitter'],['in','in / LinkedIn'],['▶','YouTube']].map(([symbol,label]) => <button key={label} onClick={unavailable} aria-label={`${label} (link indisponível)`}><span aria-hidden="true">{symbol}</span></button>)}</div><h2 className="compatible-title">Carteiras compatíveis</h2><p className="compatible-wallets">METAMASK · WALLETCONNECT · COINBASE</p><small>Conexões simuladas, sem extensões.</small></div>
    </div>
    <p role="status" aria-live="polite" className="footer-feedback kurio-container">{message}</p>
    <div className="footer-copyright">© 2026 Kurio. Propriedade digital para todos.</div>
  </footer>
}
