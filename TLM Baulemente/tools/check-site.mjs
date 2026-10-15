// Browser QA only, using Node built-ins and the installed Chrome. No packages.
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'.qa');
await fs.mkdir(output,{recursive:true});
const results=[];
const problems=[];
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.xml':'application/xml','.txt':'text/plain'};
let responseMode='success';let requestCount=0;
const server=http.createServer(async(req,res)=>{
 try{
  if(req.url==='/test-endpoint'&&req.method==='POST'){
   let body='';for await(const chunk of req)body+=chunk;
   const data=JSON.parse(body);requestCount++;
   if(!data.name||!data.email||!data.message)throw Error('Incomplete payload');
   res.writeHead(responseMode==='failure'?500:200,{'Content-Type':'application/json'});
   res.end(JSON.stringify({success:responseMode==='success'}));return;
  }
  let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name.endsWith('/'))name+='index.html';
  const target=path.resolve(root,'.'+name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const data=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4173,'127.0.0.1',resolve)});
const browserPath=process.env.TLM_QA_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chrome=spawn(browserPath,[
 '--headless=new','--disable-gpu','--disable-background-networking','--disable-extensions','--no-first-run','--no-default-browser-check',
 '--remote-debugging-port=9224',`--user-data-dir=${path.join(output,`chrome-profile-${Date.now()}`)}`,'about:blank'
],{stdio:['ignore','ignore','pipe'],windowsHide:true});
let browserDiagnostics='';chrome.stderr.on('data',chunk=>{browserDiagnostics+=chunk.toString()});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let ws;
try{
 let targets;
 for(let i=0;i<60;i++){try{targets=await fetch('http://127.0.0.1:9224/json',{signal:AbortSignal.timeout(500)}).then(r=>r.json());break}catch{await pause(200)}}
 if(!targets)throw Error('Browser debugging endpoint unavailable: '+browserDiagnostics.slice(-2000));
 const target=targets.find(t=>t.type==='page');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
 let sequence=0;const waiting=new Map();
 ws.onmessage=({data})=>{
  const msg=JSON.parse(data);
  if(msg.id){const pending=waiting.get(msg.id);if(pending){waiting.delete(msg.id);msg.error?pending.reject(Error(JSON.stringify(msg.error))):pending.resolve(msg.result)}}
  if(msg.method==='Runtime.exceptionThrown')problems.push(msg.params.exceptionDetails.text);
  if(msg.method==='Log.entryAdded'&&msg.params.entry.level==='error'&&!msg.params.entry.text.includes('500'))problems.push(msg.params.entry.text);
 };
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{waiting.delete(id);reject(Error(`Timed out: ${method}`))},15000);waiting.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{
  const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;
 };
 const check=(name,condition,details='')=>{results.push({name,pass:!!condition,details});if(!condition)console.log('FAIL',name,details)};
 const navigate=async url=>{await cdp('Page.navigate',{url});for(let i=0;i<100;i++){await pause(50);if(await evaluate('document.readyState === "complete"'))break}await pause(120)};
 const viewport=async width=>cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Log.enable');
 for(const lang of ['de','hr']){
  console.log(`Checking ${lang}…`);
  const url='http://127.0.0.1:4173/'+(lang==='hr'?'hr/':'');
  await navigate(url);
  check(`${lang}: static language and heading`,await evaluate(`document.documentElement.lang === '${lang}' && document.querySelectorAll('h1').length === 1`));
  check(`${lang}: honest unavailable form`,await evaluate(`document.querySelector('[type=submit]').disabled && !!document.querySelector('#form-notice').textContent.trim()`));
  check(`${lang}: proposals excluded`,await evaluate(`[...document.querySelectorAll('[data-service]')].every(e=>e.hidden)`));
  for(const width of [360,390,600,768,850,1024,1440,1920]){
   await viewport(width);await pause(80);
   const sizes=await evaluate(`({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth})`);
   check(`${lang}: no overflow at ${width}`,sizes.document<=width&&sizes.body<=width,JSON.stringify(sizes));
  }
  await viewport(390);
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  check(`${lang}: reduced motion respected`,await evaluate(`getComputedStyle(document.documentElement).scrollBehavior==='auto' && getComputedStyle(document.querySelector('.button')).transitionDuration==='0s'`));
  await cdp('Emulation.setEmulatedMedia',{features:[]});
  await evaluate(`document.querySelector('.menu-toggle').click()`);
  check(`${lang}: mobile menu opens`,await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true' && getComputedStyle(document.querySelector('#main-nav')).display!=='none'`));
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
  check(`${lang}: Escape closes and restores focus`,await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false' && document.activeElement===document.querySelector('.menu-toggle')`));
  await evaluate(`document.querySelector('.menu-toggle').click();document.querySelector('#main-nav a').click()`);
  check(`${lang}: section navigation closes menu`,await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false' && location.hash==='#leistungen'`));
  await evaluate(`location.hash='kontakt'`);await pause(80);
  check(`${lang}: language preserves section`,await evaluate(`[...document.querySelectorAll('[data-language-link]')].every(e=>new URL(e.href).hash==='#kontakt')`));
  // Load every lazy image before screenshot and verify intrinsic sizes.
  await evaluate(`document.querySelectorAll('img').forEach(i=>i.loading='eager');Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))`);
  check(`${lang}: all images available`,await evaluate(`[...document.images].every(i=>i.complete&&i.naturalWidth>0)`));
  for(const width of [390,1440]){
   await viewport(width);await evaluate(`document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)`);await pause(120);
   const metrics=await cdp('Page.getLayoutMetrics');
   const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:metrics.cssContentSize.height,scale:1}});
   await fs.writeFile(path.join(output,`${lang}-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  // Activate a local test endpoint only in this browser, never in site files.
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`window.addEventListener('DOMContentLoaded',()=>{});`});
  await evaluate(`window.TLM_CONFIG={formEndpoint:'http://127.0.0.1:4173/test-endpoint',confirmedServices:[]};document.querySelector('#project-form').replaceWith(document.querySelector('#project-form').cloneNode(true));document.querySelector('.menu-toggle').replaceWith(document.querySelector('.menu-toggle').cloneNode(true));`);
  const script=await fs.readFile(path.join(root,'assets/js/main.js'),'utf8');
  await evaluate(script);
  await evaluate(`document.querySelector('#project-form').requestSubmit()`);
  check(`${lang}: localized validation`,await evaluate(`document.querySelector('#name').getAttribute('aria-invalid')==='true' && document.activeElement.id==='name' && document.querySelector('#name-error').textContent.includes('${lang==='hr'?'Ispunite':'Bitte'}')`));
  const fill=`document.querySelector('#name').value='QA Test';document.querySelector('#email').value='qa@example.invalid';document.querySelector('#project-type').value='windows';document.querySelector('#message').value='Test project only';`;
  await evaluate(fill+`document.querySelector('#email').value='invalid';document.querySelector('#project-form').requestSubmit()`);
  check(`${lang}: invalid email rejected`,await evaluate(`document.querySelector('#email').getAttribute('aria-invalid')==='true'`));
  responseMode='failure';await evaluate(fill+`document.querySelector('#project-form').requestSubmit()`);await pause(200);
  check(`${lang}: failed submission preserves data`,await evaluate(`document.querySelector('#form-status').dataset.state==='error' && document.querySelector('#name').value==='QA Test' && !document.querySelector('[type=submit]').disabled`));
  responseMode='unconfirmed';await evaluate(`document.querySelector('#project-form').requestSubmit()`);await pause(200);
  check(`${lang}: 200 without confirmation rejected`,await evaluate(`document.querySelector('#form-status').dataset.state==='error' && document.querySelector('#message').value==='Test project only'`));
  responseMode='success';await evaluate(`document.querySelector('#project-form').requestSubmit()`);await pause(200);
  check(`${lang}: confirmed success clears form`,await evaluate(`document.querySelector('#form-status').dataset.state==='success' && document.querySelector('#name').value===''`));
  await navigate(url);
  await cdp('Emulation.setScriptExecutionDisabled',{value:true});await navigate(url);
  check(`${lang}: real HTML without JS`,await evaluate(`document.querySelector('h1').textContent.length>10 && document.querySelector('#main-nav').getBoundingClientRect().height>0 && document.querySelector('#leistungen').getBoundingClientRect().height>0 && document.querySelector('[type=submit]').disabled`));
  await viewport(360);
  check(`${lang}: mobile navigation without JS`,await evaluate(`document.querySelector('#main-nav').getBoundingClientRect().height>0 && document.documentElement.scrollWidth<=innerWidth && getComputedStyle(document.querySelector('.menu-toggle')).display==='none'`));
  await cdp('Emulation.setScriptExecutionDisabled',{value:false});
 }
 for(const page of ['impressum.html','datenschutz.html','hr/impressum.html','hr/datenschutz.html']){
  await navigate('http://127.0.0.1:4173/'+page);await viewport(360);
  check(`${page}: heading, draft and no overflow`,await evaluate(`document.querySelectorAll('h1').length===1 && !!document.querySelector('.legal-notice') && document.documentElement.scrollWidth<=innerWidth`));
 }
 check('No unexpected console errors',problems.length===0,JSON.stringify(problems));
 check('Mock endpoint received all six expected submissions',requestCount===6,String(requestCount));
 const report={date:'2026-10-14',browser:browserPath,results,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length};
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 await cdp('Browser.close').catch(()=>{});
 if(report.failed)process.exitCode=1;
}finally{ws?.close();chrome.kill();server.close();}
