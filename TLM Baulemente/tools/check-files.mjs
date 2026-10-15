// Static project integrity and fixed-palette contrast. Node built-ins only.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages=['index.html','impressum.html','datenschutz.html','hr/index.html','hr/impressum.html','hr/datenschutz.html'];
const issues=[];let links=0,assets=0;
const content=new Map(await Promise.all(pages.map(async p=>[p,await fs.readFile(path.join(root,p),'utf8')])));
const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const [name,html] of content){
 const allIds=ids(html);
 if(new Set(allIds).size!==allIds.length)issues.push(`${name}: duplicate IDs`);
 if((html.match(/<h1\b/g)||[]).length!==1)issues.push(`${name}: H1 count`);
 if(html.includes('\uFFFD')||html.includes('Ã¼'))issues.push(`${name}: suspect encoding`);
 for(const m of html.matchAll(/\b(?:href|src)="([^"]*)"/g)){
  const value=m[1];if(/^(https?:|mailto:|tel:)/.test(value))continue;
  if(!value||value==='#'){issues.push(`${name}: empty destination`);continue;}
  const [file,fragment]=value.split('#');
  let target=file?path.posix.normalize(path.posix.join(path.posix.dirname(name),file)):name;
  if(target.endsWith('/'))target+='index.html';
  try{await fs.access(path.join(root,target));}catch{issues.push(`${name}: missing ${target}`);continue;}
  if(fragment&&content.has(target)&&!ids(content.get(target)).includes(fragment))issues.push(`${name}: missing ${fragment} in ${target}`);
  if(m[0].startsWith('href'))links++;else assets++;
 }
 for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const entry of m[1].split(',')){
  const file=entry.trim().split(/\s+/)[0];
  try{await fs.access(path.resolve(root,path.dirname(name),file));assets++;}catch{issues.push(`${name}: missing srcset ${file}`)}
 }
 for(const m of html.matchAll(/<img\b[^>]*>/g)){
  if(!/\balt="[^"]+"/.test(m[0])||!/\bwidth=/.test(m[0])||!/\bheight=/.test(m[0]))issues.push(`${name}: incomplete image attributes`);
 }
 for(const m of html.matchAll(/<(input|select|textarea)\b[^>]*\bid="([^"]+)"/g)){
  if(!html.includes(`for="${m[2]}"`))issues.push(`${name}: missing visible label ${m[2]}`);
 }
 const expected=name.startsWith('hr/')?'hr':'de';
 if(!html.includes(`<html lang="${expected}">`))issues.push(`${name}: incorrect language`);
 for(const locale of ['de','hr','x-default'])if(!html.includes(`hreflang="${locale}"`))issues.push(`${name}: missing hreflang ${locale}`);
}
function lum(hex){const rgb=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
const pairs=[
 ['body','#30383b','#faf9f6'],['muted','#626766','#faf9f6'],['muted on sand','#626766','#efede7'],
 ['wood','#875126','#faf9f6'],['wood on sand','#875126','#efede7'],['button','#ffffff','#875126'],
 ['CTA paragraph','#d0d3d1','#30383b'],['CTA eyebrow','#d5b99d','#30383b'],['error','#9a332b','#faf9f6'],
 ['notice','#4c534f','#efede7'],['disabled button','#595f58','#e6e5df'],['success','#286039','#faf9f6']
];
const contrast=pairs.map(([name,fg,bg])=>{const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<4.5)issues.push(`${name}: contrast ${ratio}`);return {name,ratio:Number(ratio.toFixed(2)),pass:ratio>=4.5}});
const report={pages:pages.length,links,assets,contrast,issues};
await fs.mkdir(path.join(root,'.qa'),{recursive:true});
await fs.writeFile(path.join(root,'.qa','static-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(issues.length)process.exitCode=1;
