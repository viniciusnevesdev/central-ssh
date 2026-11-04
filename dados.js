export const CATEGORIES = [
  { id: "MonitorEmail", label: "MonitorEmail", icon: "mail" },
  { id: "Linux", label: "Linux", icon: "monitor" },
  { id: "GitHub", label: "GitHub", icon: "github" },
  { id: "Projetos", label: "Projetos", icon: "folder" },
  { id: "Termius", label: "Termius", icon: "terminal" },
  { id: "Pessoal", label: "Pessoal", icon: "bookmark" }
];

export const SEED_COMMANDS = [
  { id:"monitor-intervalo", title:"Alterar frequência", category:"MonitorEmail", description:"Escolha de 1 a 24 horas entre as verificações.", command:"bash ~/Projetos/MonitorEmail/intervalo.sh {{horas}}", tags:["frequência","timer","horas"], favorite:true, risk:"normal", variables:[{name:"horas",label:"Intervalo",type:"number",min:1,max:24,default:5}] },
  { id:"monitor-verificar", title:"Verificar e-mails agora", category:"MonitorEmail", description:"Inicia uma verificação sem esperar o agendamento.", command:"systemctl --user start monitor-email.service", tags:["verificar","agora"], favorite:true, risk:"normal" },
  { id:"monitor-status", title:"Status do monitor", category:"MonitorEmail", description:"Mostra a situação e o próximo horário agendado.", command:"systemctl --user status monitor-email.timer --no-pager; systemctl --user list-timers monitor-email.timer --no-pager", tags:["status","próxima"], favorite:true, risk:"normal" },
  { id:"monitor-pausar", title:"Pausar monitoramento", category:"MonitorEmail", description:"Desativa verificações automáticas até você retomar.", command:"systemctl --user disable --now monitor-email.timer", tags:["pausar","desligar"], favorite:false, risk:"atencao" },
  { id:"monitor-retomar", title:"Retomar monitoramento", category:"MonitorEmail", description:"Reativa o timer com o intervalo configurado.", command:"systemctl --user enable --now monitor-email.timer", tags:["retomar","ligar"], favorite:false, risk:"normal" },
  { id:"monitor-historico", title:"Histórico de verificações", category:"MonitorEmail", description:"Exibe os registros mais recentes do monitor.", command:"journalctl --user -u monitor-email.service -n 30 --no-pager", tags:["histórico","logs"], favorite:false, risk:"normal" },
  { id:"monitor-testes", title:"Testar regras do monitor", category:"MonitorEmail", description:"Executa os testes locais sem acessar seu Gmail.", command:"python3 ~/Projetos/MonitorEmail/testes.py", tags:["teste","python"], favorite:false, risk:"normal" },

  { id:"linux-espaco", title:"Espaço em disco", category:"Linux", description:"Verifica quanto espaço há disponível nos discos.", command:"df -h", tags:["disco","armazenamento"], favorite:true, risk:"normal" },
  { id:"linux-memoria", title:"Memória RAM", category:"Linux", description:"Mostra memória usada e disponível.", command:"free -h", tags:["ram","memória"], favorite:false, risk:"normal" },
  { id:"linux-uptime", title:"Tempo ligado", category:"Linux", description:"Mostra há quanto tempo o Linux está em execução.", command:"uptime -p", tags:["sistema","tempo"], favorite:false, risk:"normal" },
  { id:"linux-servicos", title:"Serviços com erro", category:"Linux", description:"Lista serviços de usuário em estado de falha.", command:"systemctl --user --failed --no-pager", tags:["systemd","serviço"], favorite:false, risk:"normal" },
  { id:"linux-ip", title:"Endereço IP local", category:"Linux", description:"Identifica o endereço IP local do MacBook.", command:"hostname -I", tags:["rede","ip"], favorite:false, risk:"normal" },

  { id:"github-status", title:"Status do GitHub", category:"GitHub", description:"Confere o login do GitHub CLI.", command:"gh auth status", tags:["login","gh"], favorite:false, risk:"normal" },
  { id:"github-repos", title:"Listar repositórios", category:"GitHub", description:"Lista os repositórios da conta configurada.", command:"gh repo list --limit 30", tags:["repositórios","gh"], favorite:true, risk:"normal" },
  { id:"github-repo", title:"Consultar repositório", category:"GitHub", description:"Exibe informações de um repositório pelo nome.", command:"gh repo view {{repositorio}}", tags:["repositório","consulta"], favorite:false, risk:"normal", variables:[{name:"repositorio",label:"Usuário/repositório",type:"text",default:"viniciusnevesdev/comandos"}] },

  { id:"projetos-listar", title:"Listar projetos", category:"Projetos", description:"Mostra as pastas dos seus projetos locais.", command:"ls -lah ~/Projetos", tags:["pastas","arquivos"], favorite:false, risk:"normal" },
  { id:"projetos-biblio", title:"Status do BiblioPromptos", category:"Projetos", description:"Confere alterações no projeto local, sem publicar.", command:"git -C ~/Projetos/bibliopromptos status --short --branch", tags:["bibliopromptos","git"], favorite:true, risk:"normal" },
  { id:"projetos-extrator", title:"Status do ExtratorDeChats", category:"Projetos", description:"Confere alterações locais do projeto ExtratorDeChats.", command:"git -C ~/Projetos/ExtratorDeChats status --short --branch", tags:["extrator","git"], favorite:false, risk:"normal" },

  { id:"termius-copiar", title:"Copiar saída do terminal", category:"Termius", description:"Exemplo usando a função copiar_saida, já instalada no MacBook.", command:"source ~/.bash_aliases && copiar_saida df -h", tags:["clipboard","osc52","copiar"], favorite:true, risk:"normal" },
  { id:"termius-tmux", title:"Ver sessões tmux", category:"Termius", description:"Lista as sessões de terminal que continuam executando.", command:"tmux ls", tags:["tmux","sessões"], favorite:false, risk:"normal" }
];
