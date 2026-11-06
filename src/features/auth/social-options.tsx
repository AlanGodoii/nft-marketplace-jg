import { useState } from 'react'
export function SocialOptions() {
  const [notice,setNotice] = useState('')
  return <div className="social-options"><p>Ou continue com</p>{['Google','Facebook'].map(provider=><button type="button" key={provider} onClick={()=>setNotice(`Login com ${provider} indisponível nesta demonstração. Utilize e-mail e senha.`)}><img src={`/assets/figma/common/${provider.toLowerCase()}.webp`} alt="" width="20" height="20" />Continuar com {provider}</button>)}<span role="status">{notice}</span></div>
}
