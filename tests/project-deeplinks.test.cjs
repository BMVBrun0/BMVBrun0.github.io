const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root,'assets/js/project-deeplinks.js'),'utf8');
const langs = ['pt-BR','en','es'];
const catalogs = Object.fromEntries(langs.map(l => [l,JSON.parse(fs.readFileSync(path.join(root,`assets/languages/${l}.json`),'utf8')).projects]));
const expects = ['settasynk','accessibility-plugin','xtremefut','aletheia','whitelabel-booking','truco-game','radar-publico','support-circle','media-forge','pocket-links','imobly','garimpei','realtime-messaging'];

function createDom(urlString, locale = 'pt-BR') {
 let url = new URL(urlString);
 const stack = [{url:url.href,state:null}];
 let cursor=0;
 const listeners={};
 let currentProject=null;
 let promptCall=null;
 let copied=null;
 class Element {
   constructor(tag='div') { this.tagName=tag.toUpperCase();this.hidden=false;this.attrs={};this.events={};this.children=[];this.style={};this.textContent='';this.title=''; }
   setAttribute(k,v){this.attrs[k]=String(v);}
   getAttribute(k){return this.attrs[k]??null;}
   addEventListener(ev,fn){this.events[ev]=fn;}
   insertBefore(child){this.children.unshift(child);}
   prepend(child){this.children.unshift(child);}
   querySelector(selector){if(selector==='.project-deeplink-copy__label') return this.label ||= new Element('span');return null;}
   set innerHTML(value){this.html=value;}
 }
 const headAction=new Element();
 const main=new Element();
 const metaSelectors=['meta[name="description"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]','meta[name="twitter:title"]','meta[name="twitter:description"]','link[rel="canonical"]'];
 const metas={};
 for(const sel of metaSelectors){metas[sel]=new Element(sel.startsWith('link')?'link':'meta');metas[sel].setAttribute(sel.startsWith('link')?'href':'content','initial '+sel);}
 const document={title:'Original portfolio title',createElement:tag=>new Element(tag),querySelector(selector){if(selector==='#image-modal .image-modal-header-actions')return headAction;if(selector==='main')return main;return metas[selector]||null;}};
 const emit=ev=>(listeners[ev]||[]).forEach(f=>f());
 const history={
   get state(){return stack[cursor].state;},
   pushState(state,_unused,url){stack.splice(cursor+1);stack.push({url,state});cursor++;location.href=url;},
   replaceState(state,_unused,url){stack[cursor]={url,state};location.href=url;},
   back(){if(cursor>0){cursor--;location.href=stack[cursor].url;emit('popstate');}},
   forward(){if(cursor<stack.length-1){cursor++;location.href=stack[cursor].url;emit('popstate');}},
 };
 const location={get href(){return url.href;},set href(next){url=new URL(next);}};
 const window={location,addEventListener:(name,fn)=>((listeners[name]||=[]).push(fn)),prompt:(label,value)=>promptCall={label,value}};
 const navigator={clipboard:{writeText:async value=>{copied=value;}}};
 const ctx={window,document,history,location,navigator,URL,console};
 vm.runInNewContext(source,ctx);
 const controller=window.PortfolioProjectLinks.createController({
   projects:catalogs[locale],locale,
   openView:(project)=>{currentProject=project;},
   closeView:()=>{currentProject=null;},
   getOpenProject:()=>currentProject
 });
 const btn=headAction.children[0];
 return {window,document,history,location,controller,headAction,main,btn,metaSelectors,metas,stack,getOpen:()=>currentProject,getCopied:()=>copied,getPrompt:()=>promptCall};
}

let passed=0;
function check(name,fn){fn();passed++;console.log('PASS',name);}

check('Exactly 13 stable unique slugs in three translations',()=>{
 for(const lang of langs){
   const env=createDom('http://127.0.0.1:8765/library.html',lang);
   assert.equal(catalogs[lang].length,13);
   assert.deepEqual(catalogs[lang].map(env.window.PortfolioProjectLinks.slugFor),expects);
 }
});
for(const lang of langs){
 check(`All 13 direct links open & close in-place (${lang})`,()=>{
   for(const [index,slug] of expects.entries()){
     const e=createDom(`http://127.0.0.1:8765/library.html?lang=${lang}&project=${slug}`,lang);
     e.controller.sync();
     assert.equal(e.getOpen(),catalogs[lang][index]);
     assert.equal(e.btn.hidden,false);
     assert.equal(e.document.title.startsWith(catalogs[lang][index].title),true);
     assert.equal(e.metas['link[rel="canonical"]'].getAttribute('href'),`https://bmvbrun0.github.io/library.html?project=${slug}`);
     e.controller.close();
     assert.equal(e.getOpen(),null);
     assert.equal(new URL(e.location.href).searchParams.has('project'),false);
     assert.equal(new URL(e.location.href).searchParams.get('lang'),lang);
   }
 });
}
check('Home card click, history back/forward, close via back',()=>{
 const e=createDom('http://127.0.0.1:8765/#projects');const p=catalogs['pt-BR'][0];e.controller.open(p,{});
 assert.equal(new URL(e.location.href).searchParams.get('project'),'settasynk');
 assert.equal(new URL(e.location.href).hash,'#projects');
 assert.equal(e.getOpen(),p);
 assert.equal(e.stack.length,2);
 e.history.back(); assert.equal(e.getOpen(),null);
 assert.equal(e.document.title,'Original portfolio title');
 e.history.forward(); assert.equal(e.getOpen(),p);
 e.controller.close(); assert.equal(e.getOpen(),null);
 assert.equal(e.location.href,'http://127.0.0.1:8765/#projects');
});
check('Invalid slug is graceful and visible (without changing URL)',()=>{
 const e=createDom('http://127.0.0.1:8765/library.html?project=bogus');
 e.controller.sync();assert.equal(e.getOpen(),null);
 assert.equal(e.main.children.length,1);
 assert.equal(e.main.children[0].hidden,false);
 assert.match(e.main.children[0].textContent,/não encontrado/);
});
check('Locale update keeps correct link and translated title',()=>{
 const e=createDom('http://127.0.0.1:8765/?project=xtremefut');
 e.controller.sync();
 e.controller.restoreMetadata();
 e.controller.setCatalog(catalogs.en,'en');e.controller.sync();
 assert.equal(e.getOpen(),catalogs.en[2]);
 assert.match(e.document.title,/XtremeFut/);
});
check('Non-project params survive and direct close does not leave page',()=>{
 const e=createDom('http://127.0.0.1:8765/library.html?lang=en&test=1&project=aletheia#projects','en');
 e.controller.sync();e.controller.close();
 assert.equal(e.location.href,'http://127.0.0.1:8765/library.html?lang=en&test=1#projects');
 assert.equal(e.stack.length,1);
});
(async()=>{
 const e=createDom('http://127.0.0.1:8765/library.html?project=settasynk');e.controller.sync();
 await e.btn.events.click();
 assert.equal(e.getCopied(),'https://bmvbrun0.github.io/library.html?project=settasynk');
 assert.match(e.btn.getAttribute('aria-label'),/copiado/);
 passed++;console.log('PASS Clipboard copy and accessible confirmation');
 console.log(`TOTAL ${passed} passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
