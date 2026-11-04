import { CATEGORIES } from "./dados.js";
import { STORAGE_KEY, buildCommand, extractVariables, initialItems, normalizeItem, parseBackup, riskyCommand, serializeBackup } from "./engine.js";

const $ = id => document.getElementById(id);
const ICONS = {
  mail:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
  monitor:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="14" rx="2.5"/><path d="M9 22h6M12 18v4"/></svg>',
  github:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M9 19c-4 1-4-2-6-2m12 5v-3.5a3 3 0 0 0-.8-2.5c2.8-.3 5.8-1.4 5.8-6.1a4.8 4.8 0 0 0-1.3-3.3 4.5 4.5 0 0 0-.1-3.2S17 3 15 4.8a11 11 0 0 0-6 0C7 3 5.4 3.4 5.4 3.4a4.5 4.5 0 0 0-.1 3.2A4.8 4.8 0 0 0 4 9.9c0 4.7 3 5.8 5.8 6.1A3 3 0 0 0 9 18.5V22"/></svg>',
  folder:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
  terminal:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3m6 0h4"/></svg>',
  bookmark:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 4h12v17l-6-4-6 4Z"/></svg>',
  copy:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>'
};
const catIcon = category => ICONS[CATEGORIES.find(c => c.id === category)?.icon] || ICONS.bookmark;
const el = (tag, className="", text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
};

let storageFailed = false;
let items;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  items = stored ? parseBackup(stored) : initialItems();
} catch {
  items = initialItems();
  storageFailed = true;
}
const state = { tab:"all", category:"all", search:"", expanded:new Set(["monitor-intervalo"]), answers:Object.create(null) };
let toastTimer, editingId=null, confirmResolve=null;

function persist() {
  try { localStorage.setItem(STORAGE_KEY, serializeBackup(items)); }
  catch { toast("Armazenamento indisponível: exporte um backup para não perder alterações.",true); }
}
function toast(message, error=false) {
  const t=$("toast");
  t.textContent=message;
  t.className="toast show"+(error?" error":"");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.className="toast",3300);
}
function confirmAction(title, text, positive="Continuar") {
  return new Promise(resolve=>{
    const dialog=$("confirmDialog");
    $("confirmTitle").textContent=title;
    $("confirmDescription").textContent=text;
    $("confirmAccept").textContent=positive;
    if(dialog.open)dialog.close();
    confirmResolve=resolve;
    dialog.showModal();
  });
}
function closeConfirm(answer) {
  $("confirmDialog").close();
  const done=confirmResolve;
  confirmResolve=null;
  if(done)done(answer);
}
$("confirmAccept").addEventListener("click",()=>closeConfirm(true));
$("confirmCancel").addEventListener("click",()=>closeConfirm(false));
$("confirmDialog").addEventListener("cancel",e=>{e.preventDefault();closeConfirm(false);});

function selectedItems() {
  const query=state.search.toLocaleLowerCase("pt-BR").trim();
  return items.filter(item=>{
    if(state.tab==="favorites"&&!item.favorite)return false;
    if(state.category!=="all"&&item.category!==state.category)return false;
    if(!query)return true;
    return [item.title,item.description,item.command,item.category,...item.tags]
      .some(t=>String(t).toLocaleLowerCase("pt-BR").includes(query));
  });
}

function renderFilters() {
  const root=$("filters");root.replaceChildren();
  for(const option of [{id:"all",label:"Todos"},...CATEGORIES]){
    const btn=el("button","chip"+(state.category===option.id?" active":""),option.label);
    btn.type="button";
    btn.setAttribute("aria-pressed",String(state.category===option.id));
    btn.addEventListener("click",()=>{state.category=option.id;render();});
    root.append(btn);
  }
}
function getAnswers(item) {
  if(!state.answers[item.id]) state.answers[item.id]={};
  return state.answers[item.id];
}
function createCard(item) {
  const card=el("article","card");
  const head=el("div","card-head");
  const icon=el("div","card-icon");icon.innerHTML=catIcon(item.category);
  const body=el("div","card-content"),name=el("div","card-heading"),title=el("h3","",item.title);
  name.append(title);body.append(name,el("p","",item.description));
  const star=el("button","favorite"+(item.favorite?" is-fav":""),item.favorite?"★":"☆");
  star.type="button";star.title=item.favorite?"Remover dos favoritos":"Adicionar aos favoritos";
  star.setAttribute("aria-label",star.title);
  star.setAttribute("aria-pressed",String(item.favorite));
  star.addEventListener("click",()=>{item.favorite=!item.favorite;persist();render();toast(item.favorite?"Adicionado aos favoritos":"Removido dos favoritos");});
  head.append(icon,body,star);card.append(head);
  const badges=el("div","category-line");
  badges.append(el("span","category-badge",item.category));
  if(item.risk==="atencao"||riskyCommand(item.command))badges.append(el("span","warning-badge","Requer atenção"));
  card.append(badges);
  const bottom=el("div","card-bottom");
  const copy=el("button","copy-btn");copy.type="button";
  copy.innerHTML=ICONS.copy+"<span>Copiar comando</span>";
  const more=el("button","more-btn",state.expanded.has(item.id)?"Ocultar":"Detalhes");
  more.type="button";
  const details=el("div","details");
  details.hidden=!state.expanded.has(item.id);
  more.setAttribute("aria-expanded",String(!details.hidden));
  more.addEventListener("click",()=>{
    details.hidden=!details.hidden;
    if(details.hidden)state.expanded.delete(item.id);else state.expanded.add(item.id);
    more.textContent=details.hidden?"Detalhes":"Ocultar";
    more.setAttribute("aria-expanded",String(!details.hidden));
  });
  bottom.append(copy,more);card.append(bottom);

  const answers=getAnswers(item);
  const controls=el("div","variables");
  let code;
  function preview() {
    try {code.textContent=buildCommand(item,answers);copy.disabled=false;}
    catch(error){code.textContent="Preencha os campos acima: "+error.message;copy.disabled=true;}
  }
  for(const spec of item.variables||[]){
    const row=el("div","variable-row");
    const id="variable-"+item.id+"-"+spec.name;
    const label=el("label","",spec.label||spec.name);label.htmlFor=id;
    const numeric=spec.type==="number";
    const min=Number.isSafeInteger(spec.min)?spec.min:1;
    const max=Number.isSafeInteger(spec.max)?spec.max:100000;
    const slider=numeric&&max-min<=24;
    const input=el("input");input.id=id;input.type=slider?"range":numeric?"number":"text";
    input.autocomplete="off";input.spellcheck=false;
    if(numeric){input.min=String(min);input.max=String(max);input.step="1";}
    input.value=String(Object.hasOwn(answers,spec.name)?answers[spec.name]:spec.default ?? "");
    const hint=el("div","variable-help",slider?"Valor: "+input.value+" "+(input.value==="1"?"hora":"horas"):numeric?"Número inteiro":"O texto será protegido por aspas no comando final");
    input.addEventListener("input",()=>{
      answers[spec.name]=input.value;
      if(slider)hint.textContent="Valor: "+input.value+" "+(input.value==="1"?"hora":"horas");
      preview();
    });
    row.append(label,input,hint);
    if(item.id==="monitor-intervalo"&&spec.name==="horas"){
      const presets=el("div","presets");
      for(const hour of [1,3,5,8,12,24]){
        const b=el("button","",hour+"h");b.type="button";
        b.addEventListener("click",()=>{input.value=String(hour);input.dispatchEvent(new Event("input"));});
        presets.append(b);
      }
      row.append(presets);
    }
    controls.append(row);
  }
  details.append(controls,el("div","details-label","COMANDO GERADO"));
  code=el("pre","command-preview");details.append(code);
  const actions=el("div","card-actions");
  const edit=el("button","","Editar"),duplicate=el("button","","Duplicar");
  edit.type=duplicate.type="button";
  edit.addEventListener("click",()=>openEditor(item));
  duplicate.addEventListener("click",()=>{
    const clone=normalizeItem({...item,id:"custom-"+crypto.randomUUID().replaceAll("-",""),title:item.title+" (cópia)",favorite:false});
    items.push(clone);persist();state.expanded.add(clone.id);render();toast("Cópia criada.");
  });
  actions.append(edit,duplicate);details.append(actions);card.append(details);
  preview();

  copy.addEventListener("click",async()=>{
    let command;
    try{command=buildCommand(item,answers);}catch(error){toast(error.message,true);return;}
    if(item.risk==="atencao"||riskyCommand(command)){
      const ok=await confirmAction("Revise antes de copiar","Este comando pode alterar configurações ou arquivos no MacBook. Ele só será copiado; a execução é manual no Termius.","Copiar mesmo assim");
      if(!ok)return;
    }
    try{
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(command);
      else throw Error("Clipboard API indisponível");
      toast("Comando copiado. Cole no Termius.");
    }catch{
      try{
        const area=el("textarea");area.value=command;area.style.cssText="position:fixed;top:-9999px;opacity:0";document.body.append(area);area.select();area.setSelectionRange(0,command.length);
        const did=document.execCommand("copy");area.remove();
        if(!did)throw Error("Cópia não autorizada.");
        toast("Comando copiado. Cole no Termius.");
      }catch{toast("O navegador bloqueou a cópia. Abra Detalhes para selecionar o texto.",true);}
    }
  });
  return card;
}
function render() {
  renderFilters();
  const settings=state.tab==="settings";
  $("viewLibrary").hidden=settings;
  $("viewSettings").hidden=!settings;
  document.querySelectorAll(".tab").forEach(btn=>{
    const selected=btn.dataset.tab===state.tab;
    btn.classList.toggle("active",selected);
    btn.setAttribute("aria-current",selected?"page":"false");
  });
  $("totalCount").textContent=items.length+" comandos";
  if(settings)return;
  $("listSubtitle").textContent=state.tab==="favorites"?"COMANDOS SALVOS":"SUA BIBLIOTECA";
  $("listHeading").textContent=state.tab==="favorites"?"Seus favoritos":state.category==="all"?"Todos os comandos":state.category;
  const filtered=selectedItems();
  $("resultCount").textContent=String(filtered.length);
  const root=$("commandList");root.replaceChildren();
  for(const item of filtered)root.append(createCard(item));
  $("emptyState").hidden=filtered.length!==0;
}

function openEditor(item=null) {
  editingId=item?.id||null;
  $("editorTitle").textContent=item?"Editar comando":"Novo comando";
  $("editTitle").value=item?.title||"";
  $("editCategory").value=item?.category||"Pessoal";
  $("editDescription").value=item?.description||"";
  $("editCommand").value=item?.command||"";
  $("editTags").value=item?.tags?.join(", ")||"";
  $("editFavorite").checked=item?.favorite||false;
  $("editRisk").checked=item?.risk==="atencao";
  $("deleteBtn").hidden=!item;
  $("editorDialog").showModal();
}
function closeEditor() {$("editorDialog").close();}
$("editorCancel").addEventListener("click",closeEditor);
$("editorCancelTop").addEventListener("click",closeEditor);
$("editorDialog").addEventListener("cancel",()=>{editingId=null;});
$("editorForm").addEventListener("submit",e=>{
  e.preventDefault();
  const current=items.find(i=>i.id===editingId);
  const command=$("editCommand").value.trim();
  const variables=extractVariables(command).map(name=>{
    const old=current?.variables?.find(v=>v.name===name);
    return old||{name,label:name,type:"text",default:""};
  });
  try{
    const entry=normalizeItem({
      id:current?.id||"custom-"+crypto.randomUUID().replaceAll("-"),
      title:$("editTitle").value,category:$("editCategory").value,
      description:$("editDescription").value,command,
      tags:$("editTags").value.split(",").map(t=>t.trim()),
      favorite:$("editFavorite").checked,risk:$("editRisk").checked?"atencao":"normal",variables
    });
    if(current)items=items.map(x=>x.id===current.id?entry:x);
    else{if(items.length>=400)throw Error("Limite de 400 comandos atingido.");items.push(entry);}
    persist();closeEditor();state.expanded.add(entry.id);render();toast("Comando salvo.");
  }catch(error){toast(error.message,true);}
});
$("deleteBtn").addEventListener("click",async()=>{
  const current=items.find(x=>x.id===editingId);
  if(!current)return;
  closeEditor();
  const ok=await confirmAction("Excluir comando?","A exclusão de “"+current.title+"” não pode ser desfeita sem restaurar um backup.","Excluir");
  if(ok){items=items.filter(x=>x.id!==current.id);persist();render();toast("Comando excluído.");}
});
$("addCommand").addEventListener("click",()=>openEditor());
$("emptyAdd").addEventListener("click",()=>openEditor());
$("search").addEventListener("input",e=>{state.search=e.target.value;render();});
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
  state.tab=b.dataset.tab;
  if(state.tab==="favorites")state.category="all";
  state.search="";$("search").value="";render();window.scrollTo({top:0,behavior:"instant"});
}));
$("exportBtn").addEventListener("click",()=>{
  try{
    const blob=new Blob([serializeBackup(items)],{type:"application/json;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=el("a");a.href=url;a.download="Comandos_backup_"+new Date().toISOString().slice(0,10)+".json";
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    toast("Backup preparado para salvar.");
  }catch(error){toast("Não foi possível exportar: "+error.message,true);}
});
$("importBtn").addEventListener("click",()=>$("importFile").click());
$("importFile").addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    if(file.size>2000000)throw Error("Arquivo maior que 2 MB.");
    const incoming=parseBackup(await file.text());
    const ok=await confirmAction("Substituir biblioteca?","O backup contém "+incoming.length+" comandos. Sua biblioteca atual será substituída. Exporte um backup antes, se precisar.","Importar");
    if(ok){items=incoming;state.answers=Object.create(null);persist();state.tab="all";state.category="all";render();toast("Backup importado.");}
  }catch(error){toast(error.message,true);}
  finally{e.target.value="";}
});
$("resetBtn").addEventListener("click",async()=>{
  const ok=await confirmAction("Restaurar modelos originais?","Isso descarta todos os comandos e favoritos personalizados deste navegador. Faça um backup antes, se precisar.","Restaurar");
  if(ok){items=initialItems();state.answers=Object.create(null);persist();state.tab="all";state.category="all";render();toast("Modelos restaurados.");}
});
for(const cat of CATEGORIES){const option=el("option","",cat.label);option.value=cat.id;$("editCategory").append(option);}
render();
if(storageFailed)toast("Armazenamento local não disponível; faça backup das alterações.",true);
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
