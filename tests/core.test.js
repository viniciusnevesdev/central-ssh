import test from "node:test";
import assert from "node:assert/strict";
import { initialItems, extractVariables, shellQuote, buildCommand, validateNumber,
  riskyCommand, parseBackup, serializeBackup, normalizeItem } from "../engine.js";

test("biblioteca inicial com categorias e comandos prontos",()=>{
  const items=initialItems();
  assert.equal(items.length,20);
  assert.equal(new Set(items.map(x=>x.id)).size,20);
  assert.equal(items.filter(x=>x.category==="MonitorEmail").length,7);
  assert.ok(items.every(x=>x.command&&x.title));
});
test("intervalo de horas renderiza comando válido",()=>{
  const item=initialItems().find(x=>x.id==="monitor-intervalo");
  assert.equal(buildCommand(item), "bash ~/Projetos/MonitorEmail/intervalo.sh 5");
  assert.equal(buildCommand(item,{horas:3}), "bash ~/Projetos/MonitorEmail/intervalo.sh 3");
  assert.equal(buildCommand(item,{horas:24}), "bash ~/Projetos/MonitorEmail/intervalo.sh 24");
  assert.throws(()=>buildCommand(item,{horas:25}),/entre 1 e 24/);
  assert.throws(()=>buildCommand(item,{horas:"5; reboot"}),/inteiro/);
  assert.throws(()=>buildCommand(item,{horas:"1.2"}),/inteiro/);
});
test("texto variável é colocado entre aspas para evitar injeção",()=>{
  const item=initialItems().find(x=>x.id==="github-repo");
  const out=buildCommand(item,{repositorio:"teste/ola'; echo invadido"});
  assert.equal(out, "gh repo view 'teste/ola'\"'\"'; echo invadido'");
  assert.equal(shellQuote("abc"), "'abc'");
  assert.throws(()=>shellQuote("abc\nrm -rf"),/quebra/);
});
test("validação de campo numérico",()=>{
  assert.equal(validateNumber(4), "4");
  assert.throws(()=>validateNumber(0),/entre 1 e 24/);
  assert.throws(()=>validateNumber(1.5),/inteiro/);
});
test("campos {{}} únicos são detectados",()=>{
  assert.deepEqual(extractVariables("x {{repo}} y {{repo}} {{horas}}"),["repo","horas"]);
  assert.deepEqual(extractVariables("nada"),[]);
});
test("detector de comandos que exigem atenção",()=>{
  assert.equal(riskyCommand("rm -rf ~/coisas"),true);
  assert.equal(riskyCommand("git push --force origin main"),true);
  assert.equal(riskyCommand("git reset --hard HEAD"),true);
  assert.equal(riskyCommand("df -h"),false);
  assert.equal(riskyCommand("systemctl --user start monitor-email.service"),false);
});
test("backup exportado reimportado sem perda",()=>{
  const items=initialItems();
  const json=serializeBackup(items);
  assert.equal(parseBackup(json).length,20);
  assert.deepEqual(parseBackup(json),items);
});
test("backup malformado e duplicado rejeitados",()=>{
  assert.throws(()=>parseBackup("invalid"),/JSON inválido/);
  assert.throws(()=>parseBackup(JSON.stringify({version:9,items:[]})),/incompatível/);
  const sample=initialItems()[0];
  assert.throws(()=>parseBackup(JSON.stringify({version:1,items:[sample,sample]})),/duplicados/);
});
test("comando importado perigoso recebe aviso obrigatório",()=>{
  const n=normalizeItem({id:"test-risk",title:"Risco",category:"Linux",command:"git reset --hard HEAD",risk:"normal"});
  assert.equal(n.risk,"atencao");
});
test("categoria não reconhecida vai para Pessoal",()=>{
  const n=normalizeItem({id:"test-new",title:"Teste",category:"Outro",command:"echo ola"});
  assert.equal(n.category,"Pessoal");
});
test("sem variáveis não altera o comando original",()=>{
  const sample=initialItems().find(x=>x.id==="monitor-verificar");
  assert.equal(buildCommand(sample),sample.command);
});
