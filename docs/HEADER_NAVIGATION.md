# Navegação do header desktop

Base main1945001 (PR8 integrado pelo proprietário). Branch fix/navegacao-header-home.

Relato: clicar nas abas superiores parecia não produzir efeito. Em Chromium foi possível reproduzir a rolagem original das âncoras, sem reproduzir bloqueio geral dos cliques. Foi confirmado que o indicador visual permanecia incorretamente fixo em Início.

Correção: links Mercado/Criadores/Aprenda passam pelo TanStack Router, preservando search params e usando hashScrollIntoView explícito; aria-current e indicador laranja acompanham o hash. Início retorna ao topo preservando filtros. Clicar novamente na seção atual repete a rolagem sem criar entrada extra no histórico. Ctrl/Cmd/cliques modificados mantêm navegação nativa. Sem animação nova ou mudança de layout/mobile.

Destinos reais: Mercado→catálogo, Criadores→bloco informativo do footer, Aprenda→Diário da Cunhagem. São seções da Home, não novas páginas. Páginas editoriais/criadores independentes não foram implementadas nem apresentadas como completas; o escopo oficial não exige essas páginas. Perfil/carteiras/favoritos/pedidos continuam no menu da conta.

Verificação: typecheck,lint,build e build:demo aprovados; dois avisos FastRefresh preexistentes.8/8 testes da Home em20.8s, com imagens/AXE/overflow em1280/1440/1920, busca/conta/carrinho e novo caso de rolagem/seleção/preservação deURL/refresh/histórico/repetição. Logs em reports/header-navigation. Comparações visuais finais:12/12em22.5s +3/3desktop em8.6s, estritas e sem atualizar snapshots. A suíte integral e Lighthouse não foram repetidos nesta correção de navegação.
