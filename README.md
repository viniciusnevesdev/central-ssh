# Central SSH — PWA para Termius

Biblioteca pessoal de comandos para copiar e colar manualmente no Termius do iPhone. Estática, sem IA, sem backend, sem acesso ao MacBook e sem custos de operação.

## Recursos (v0.1.0)
- 20 comandos iniciais, organizados em MonitorEmail, Linux, GitHub, Projetos e Termius.
- Pesquisa por nome, descrição, categoria, tags e conteúdo.
- Categorias, favoritos e interface projetada para iPhone.
- Comandos variáveis com campos; o intervalo do MonitorEmail usa controle de 1 a 24 horas.
- Botão Copiar para a área de transferência do iPhone.
- Aviso para comandos que alteram configurações ou parecem arriscados. **Nunca executa automaticamente.**
- Novo, editar, duplicar e excluir comandos locais.
- Exportar/importar backup em JSON; restaurar modelos originais.
- Ícone próprio, manifest e service worker (funcionamento offline após a instalação).

## Uso no iPhone
1. Abra a URL da GitHub Pages no Safari.
2. Use o botão de compartilhar > **Adicionar à Tela de Início** > **Abrir como App da Web**.
3. No aplicativo, escolha o comando, ajuste os parâmetros, toque em **Copiar comando**.
4. Abra sua sessão SSH do MacBook no Termius, cole e execute.
5. O Termius pode permanecer fechado após concluir a execução; scripts agendados no MacBook continuam por conta própria.

## Alterar o MonitorEmail
A frequência padrão é **5 horas**. O comando gerado pelo primeiro cartão é:

\`\`\`bash
bash ~/Projetos/MonitorEmail/intervalo.sh 5
\`\`\`

Os campos de texto em modelos como \`gh repo view {{repositorio}}\` são protegidos por *shell quoting* para não executar separadores inesperados.

## Privacidade e riscos
- **O código-fonte e os modelos iniciais são públicos** no GitHub Pages.
- Seus comandos criados/editados e favoritos ficam no armazenamento local do navegador, não são enviados ao GitHub nem a um servidor.
- O site não possui autenticação, porque não acessa o MacBook; copie comandos sensíveis somente no terminal autorizado.
- **Nunca salve senhas, tokens, SSH private keys ou códigos pessoais** como parte de um comando.
- Não há sincronização entre dispositivos; instalações diferentes podem manter bibliotecas separadas.
- Dados locais podem desaparecer após limpeza do navegador; exporte backups JSON.
- Uma interface simples com alertas não substitui revisão antes de executar comandos de terminal.
- Conteúdo importado é validado e apresentado como texto, sem execução pelo site.

## Desenvolvimento
Sem dependências de produção:

\`\`\`bash
npm test
npm run check
python3 -m http.server 8768 --bind 127.0.0.1
\`\`\`

Abra \`http://127.0.0.1:8768\` no navegador local. Os arquivos estáticos devem ser servidos sobre HTTP(S), não abertos via \`file://\`.

## Hospedagem
GitHub Pages, diretório raiz da branch \`main\`. Sem Workers, Cloudflare Tunnel, IA ou serviços pagos.

## Arquivos
- \`index.html\`: estrutura
- \`style.css\`: estilos
- \`app.js\`: interface e interações
- \`engine.js\`: composição segura de comandos, validação e backups
- \`dados.js\`: biblioteca inicial
- \`sw.js\`: cache offline
- \`manifest.webmanifest\` e \`icons/\`: instalação
- \`tests/\`: testes automatizados

**Nota:** A prévia automatizada é feita em navegador de desktop no modo móvel. A validação real em Safari/iPhone permanece necessária.
