const $=s=>document.querySelector(s),DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],DK=['Mo','Tu','We','Th','Fr','Sa','Su'];
const AREAS=[['Port of Spain',10.655,-61.517,8],['San Fernando',10.28,-61.468,7],['Chaguanas',10.516,-61.411,7],['Arima',10.637,-61.282,6],['Couva',10.419,-61.468,6],['Point Fortin',10.181,-61.676,6],['Sangre Grande',10.586,-61.126,7],['Princes Town',10.267,-61.373,6],['Diego Martin',10.716,-61.566,6],['Tunapuna',10.638,-61.389,6],['Penal',10.172,-61.465,6],['Siparia',10.137,-61.504,6],['Scarborough, Tobago',11.18,-60.737,8],['Crown Point, Tobago',11.15,-60.836,6]];
let ALL=[],me=null,db=null,RT={},lim=60;const WC={};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars=n=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n));
const say=(t,err)=>{$('#count').textContent=t;$('#count').className=err?'err':''};
const net=()=>$('#offline').hidden=navigator.onLine;
const fm=m=>{m%=1440;const h=Math.floor(m/60);return(h%12||12)+':'+String(m%60).padStart(2,'0')+(h<12?' AM':' PM')};
function nowTT(){const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Port_of_Spain',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t).value;return{d:DN.indexOf(g('weekday')),m:(+g('hour')%24)*60+ +g('minute')}}
function parseOH(s){
 if(!s)return null;s=s.trim();const w=Array.from({length:7},()=>[]);
 if(/^24\/7$/i.test(s)){w.forEach(x=>x.push([0,1440]));return w}
 for(let part of s.split(/;|(?<=\d),\s*(?=[A-Za-z])/)){part=part.trim();if(!part||/^(PH|SH)\b/i.test(part))continue;
  const m=part.match(/^([A-Za-z,\- ]*?)\s*(off|closed|\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}(?:\s*,\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})*)$/i);if(!m)return null;
  let days=[];const ds=m[1].trim();
  if(!ds)days=[0,1,2,3,4,5,6];else for(const x of ds.split(',')){const r=x.trim().split('-').map(y=>DK.indexOf(y.trim()));if(r.includes(-1))return null;if(r.length===1)days.push(r[0]);else for(let i=r[0];;i=(i+1)%7){days.push(i);if(i===r[1])break}}
  const rg=/^(off|closed)$/i.test(m[2])?[]:m[2].split(',').map(t=>{const[a,b]=t.split('-').map(z=>{const[h,mi]=z.trim().split(':');return+h*60+ +mi});return[a,b<=a?b+1440:b]});
  days.forEach(d=>w[d]=rg)}
 return w}
const getW=r=>r.id in WC?WC[r.id]:(WC[r.id]=parseOH(r.h));
function isOpen(r){const w=getW(r);if(!w)return undefined;const{d,m}=nowTT();return w[d].some(([a,b])=>m>=a&&m<b)||w[(d+6)%7].some(([a,b])=>b>1440&&m+1440<b)}
const km=(a,b,c,d)=>{const q=Math.PI/180,x=Math.sin((c-a)*q/2)**2+Math.cos(a*q)*Math.cos(c*q)*Math.sin((d-b)*q/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const avg=r=>{const t=RT[r.id];return t&&t.n?t.sum/t.n:0};
const areaOf=(la,lo)=>{let ar=-1,best=1e9;AREAS.forEach((a,i)=>{const k=km(la,lo,a[1],a[2]);if(k<a[3]&&k<best){best=k;ar=i}});return ar};
const inTT=(la,lo)=>(la>=10.03&&la<=10.85&&lo>=-61.92&&lo<=-60.88&&(la<10.45||lo>=-61.8))||(la>=11.05&&la<=11.4&&lo>=-60.9&&lo<=-60.45);
let DATA=[],EX=[],ov={hide:[],fix:{},add:[]};
function build(){
 const hid=new Set(ov.hide.map(String)),seen={},out=[],dflt={a:'',p:'',h:'',w:'',f:'',i:'',wa:'',d:'',c:'Restaurant'};
 ALL.concat(ov.add.map(r=>Object.assign({},dflt,r)),EX.map(r=>Object.assign({},dflt,r)))
  .filter(r=>inTT(r.la,r.lo)&&!hid.has(r.id)&&!hid.has(r.id.slice(1)))
  .map(r=>Object.assign({},r,ov.fix[r.id]||ov.fix[r.id.slice(1)]||{},{ar:areaOf(r.la,r.lo)}))
  .forEach(r=>{let k=r.n.toLowerCase().replace(/[^a-z0-9]/g,'');const k2=k.replace(/restaurant|cafe|grill|bar|the|and/g,'');if(k2)k=k2;const a=seen[k]=seen[k]||[];if(a.some(x=>km(x.la,x.lo,r.la,r.lo)<0.1))return;a.push(r);out.push(r)});
 DATA=out}
function slim(e){
 const t=e.tags||{},la=e.lat!=null?e.lat:e.center&&e.center.lat,lo=e.lon!=null?e.lon:e.center&&e.center.lon;if(la==null||!t.name||!inTT(la,lo)||(t['addr:country']&&t['addr:country']!=='TT'))return null;
 const cu=(t.cuisine||'').split(';')[0].replace(/_/g,' ').trim(),cap=s=>s[0].toUpperCase()+s.slice(1);
 const url=(v,b)=>!v?'':/^https?:\/\//i.test(v)?v.replace(/^http:/i,'https:'):b+v.replace(/^@/,'');
 const web=t.website||t['contact:website']||'',wa=(t['contact:whatsapp']||'').replace(/[^\d]/g,'');
 const ar=areaOf(la,lo);
 return{d:(t.check_date||t['survey:date']||'').slice(0,10),id:e.type[0]+e.id,n:t.name,c:cu?cap(cu):({fast_food:'Fast food',cafe:'Cafe',food_court:'Food court',ice_cream:'Ice cream'}[t.amenity]||'Restaurant'),la,lo,ar,
  a:[t['addr:housenumber'],t['addr:street'],t['addr:suburb']||t['addr:city']].filter(Boolean).join(' '),p:t.phone||t['contact:phone']||'',h:t.opening_hours||'',
  w:url(web,'https://'),f:url(t.facebook||t['contact:facebook'],'https://facebook.com/'),i:url(t.instagram||t['contact:instagram'],'https://instagram.com/'),wa:wa?'https://wa.me/'+wa:''}}
async function fetchOSM(){
 const q='[out:json][timeout:90];area["ISO3166-1"="TT"]->.a;nwr(area.a)["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream)$"]["name"];out center tags qt;';
 for(const u of['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){try{const r=await fetch(u,{method:'POST',body:new URLSearchParams({data:q})});if(r.ok)return(await r.json()).elements}catch(e){}}
 throw 0}
async function loadData(){
 localStorage.removeItem('tt_osm');let c=null;try{c=JSON.parse(localStorage.getItem('tt_osm2'))}catch(e){}
 if(c&&c.d){ALL=c.d;ready()}
 if((!c||Date.now()-c.t>6048e5)&&navigator.onLine){
  say('Loading restaurants…');
  try{ALL=(await fetchOSM()).map(slim).filter(Boolean);try{localStorage.setItem('tt_osm2',JSON.stringify({t:Date.now(),d:ALL}))}catch(e){}ready()}
  catch(e){if(!ALL.length)say('Could not load restaurants. Check your connection and try again.',1)}
 }else if(!ALL.length)say('You are offline and nothing is saved yet. Connect once to download the list.',1)}
function ready(){
 build();const f=$('#food'),v=f.value,cnt={};DATA.forEach(r=>cnt[r.c]=(cnt[r.c]||0)+1);
 f.length=1;Object.keys(cnt).filter(k=>cnt[k]>1).sort((a,b)=>cnt[b]-cnt[a]).forEach(k=>f.add(new Option(k,k)));f.value=v;render()}
async function loadRT(){
 if(db){try{(await db.collection('restaurants').get()).forEach(d=>RT[d.id]=d.data())}catch(e){}}
 else for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('c_'))try{const a=JSON.parse(localStorage.getItem(k));RT[k.slice(2)]={sum:a.reduce((x,c)=>x+c.s,0),n:a.length}}catch(e){}}
 render()}
function render(){
 if(!DATA.length)return;
 const q=$('#q').value.trim().toLowerCase(),f=$('#food').value,a=$('#area').value,op=$('#open').checked,s=$('#sort').value;
 let l=DATA.filter(r=>(!f||r.c===f)&&(a===''||r.ar===+a)&&(!q||(r.n+' '+r.c+' '+r.a).toLowerCase().includes(q))&&(!op||isOpen(r)===true));
 if(me)l.forEach(r=>r.d=km(me.lat,me.lng,r.la,r.lo));
 l.sort(s==='near'&&me?(x,y)=>x.d-y.d:s==='rating'?(x,y)=>avg(y)-avg(x)||((RT[y.id]||{}).n||0)-((RT[x.id]||{}).n||0)||x.n.localeCompare(y.n):(x,y)=>x.n.localeCompare(y.n));
 say(l.length+' restaurant'+(l.length===1?'':'s')+(s==='near'&&me?' near you':''));
 $('#list').innerHTML=l.slice(0,lim).map((r,i)=>{const o=isOpen(r),v=avg(r);return`<button class="card ${o?'on':''}" data-i="${i}"><h2>${esc(r.n)}</h2><div class="meta">${v?`<span class="stars">${stars(v)} ${v.toFixed(1)}</span> (${RT[r.id].n})`:'No visitor ratings yet'}</div><div class="meta">${esc(r.c)}${r.d!=null&&me?` · <span class="dist">${r.d.toFixed(1)} km</span>`:''}</div><div class="meta">${esc(r.a)}</div>${o===undefined?'':`<span class="tag ${o?'on-t':'off-t'}">${o?'Open now':'Closed now'}</span>`}</button>`}).join('')+(l.length>lim?'<button id="more" class="btn alt">Show more</button>':'')||'<p style="padding:0 1rem">No restaurants match. Try clearing a filter.</p>';
 document.querySelectorAll('.card').forEach(b=>b.onclick=()=>show(l[+b.dataset.i]));
 const m=$('#more');if(m)m.onclick=()=>{lim+=60;render()}}
async function show(r){
 const v=avg(r),w=getW(r),t=nowTT().d,ok=u=>/^https:\/\//.test(u);
 const osm=/^[nwr]\d+$/.test(r.id),fx=osm?'https://www.openstreetmap.org/edit?editor=id&'+({n:'node',w:'way',r:'relation'}[r.id[0]])+'='+r.id.slice(1):'',nt='https://www.openstreetmap.org/note/new#map=19/'+r.la+'/'+r.lo;
 const dir='https://www.google.com/maps/dir/?api=1&destination='+r.la+','+r.lo,gm='https://www.google.com/maps/search/?api=1&query='+r.la+','+r.lo,sv='https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='+r.la+','+r.lo;
 $('#detail').innerHTML=`<h2>${esc(r.n)}</h2><div class="meta">${esc(r.c)}${r.a?' – '+esc(r.a):''}</div><div class="meta">${v?`<span class="stars">${stars(v)} ${v.toFixed(1)}</span> (${RT[r.id].n} visitor rating${RT[r.id].n>1?'s':''})`:'No visitor ratings yet'}</div>
 <div class="btns"><a class="btn" target="_blank" rel="noopener" href="${dir}">Get directions</a>${r.p?`<a class="btn alt" href="tel:${esc(r.p.replace(/[^\d+]/g,''))}">Call ${esc(r.p)}</a>`:''}${ok(r.f)?`<a class="btn alt" target="_blank" rel="noopener" href="${esc(r.f)}">Facebook</a>`:''}${ok(r.i)?`<a class="btn alt" target="_blank" rel="noopener" href="${esc(r.i)}">Instagram</a>`:''}${ok(r.wa)?`<a class="btn alt" target="_blank" rel="noopener" href="${esc(r.wa)}">WhatsApp</a>`:''}${ok(r.w)?`<a class="btn alt" target="_blank" rel="noopener" href="${esc(r.w)}">Website</a>`:''}<a class="btn alt" target="_blank" rel="noopener" href="${gm}">View on Google Maps</a><a class="btn alt" target="_blank" rel="noopener" href="${sv}">Street View</a></div>
 <p class="meta">${r.s==='o'?'From Overture Maps, not yet verified. Call ahead before you go. ':''}<small>ID: ${esc(r.id)}</small></p>
 ${osm?`<p class="meta">${r.d?'Last checked on OpenStreetMap: '+esc(r.d)+'. ':''}Closed or wrong? <a href="${fx}" target="_blank" rel="noopener">Fix it</a> or <a href="${nt}" target="_blank" rel="noopener">report a problem</a> on OpenStreetMap.</p>`:''}
 ${w?`<table>${w.map((x,i)=>`<tr class="${i===t?'today':''}"><td>${DN[i]}</td><td>${x.length?x.map(([a,b])=>fm(a)+' – '+fm(b)).join(', '):'Closed'}</td></tr>`).join('')}</table>`:`<p class="meta">${r.h?'Hours: '+esc(r.h):'Opening hours not listed. Call to confirm.'}</p>`}
 <h3>Visitor comments</h3><form id="cf"><input name="n" placeholder="Your name" maxlength="40" required><select name="s" aria-label="Your rating"><option value="5">★★★★★ 5</option><option value="4">★★★★ 4</option><option value="3">★★★ 3</option><option value="2">★★ 2</option><option value="1">★ 1</option></select><textarea name="c" placeholder="Share your experience" maxlength="500" rows="3" required></textarea><button class="btn">Post comment</button></form><div id="cl">Loading…</div>`;
 $('#dlg').showModal();
 const draw=a=>$('#cl').innerHTML=a.length?a.map(c=>`<div class="cm"><b>${esc(c.n)}</b> <span class="stars">${stars(c.s)}</span><br>${esc(c.c)}<br><small>${new Date(c.t).toLocaleDateString()}</small></div>`).join(''):'<p>No comments yet. Be the first.</p>';
 let list=await getC(r.id);draw(list);
 $('#cf').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),c={n:f.get('n').trim().slice(0,40),s:+f.get('s'),c:f.get('c').trim().slice(0,500),t:Date.now()};
  list=[c,...list];draw(list);addC(r.id,c,list);e.target.reset();render()}}
async function getC(id){
 if(db){try{return(await db.collection('restaurants').doc(id).collection('comments').orderBy('t','desc').limit(50).get()).docs.map(d=>d.data())}catch(e){}}
 return JSON.parse(localStorage.getItem('c_'+id)||'[]')}
function addC(id,c,list){
 const t=RT[id]||{sum:0,n:0};RT[id]={sum:t.sum+c.s,n:t.n+1};
 if(db){const f=firebase.firestore.FieldValue.increment,d=db.collection('restaurants').doc(id);d.collection('comments').add(c).catch(()=>{});d.set({sum:f(c.s),n:f(1)},{merge:true}).catch(()=>{});return}
 try{localStorage.setItem('c_'+id,JSON.stringify(list))}catch(e){}}
function init(){
 const c=window.FIREBASE_CONFIG;if(c&&c.apiKey&&window.firebase){try{firebase.initializeApp(c);db=firebase.firestore()}catch(e){}}
 AREAS.forEach((a,i)=>$('#area').add(new Option(a[0],i)));
 ['food','area','sort','open'].forEach(k=>$('#'+k).onchange=()=>{lim=60;render()});
 $('#sf').onsubmit=e=>{e.preventDefault();lim=60;render()};$('#q').oninput=()=>{lim=60;render()};
 $('#close').onclick=()=>$('#dlg').close();
 $('#near').onclick=()=>{if(!navigator.geolocation)return say('This browser cannot share your location.',1);say('Finding your location…');
  navigator.geolocation.getCurrentPosition(p=>{me={lat:p.coords.latitude,lng:p.coords.longitude};$('#sort').querySelector('[value=near]').disabled=false;$('#sort').value='near';$('#area').value='';lim=60;render()},
   e=>say(e.code===1?'Location is blocked for this site. Click the icon at the left of the address bar, set Location to Allow, then tap Near me again.':e.code===2?'Your device could not work out where you are. Turn on Location services in your device settings, then tap Near me again.':'Finding your location took too long. Tap Near me again, or pick a location from the list.',1),{enableHighAccuracy:false,timeout:20000,maximumAge:300000})};
 addEventListener('online',()=>{net();loadData()});addEventListener('offline',net);net();
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
 fetch('overrides.json').then(r=>r.json()).then(o=>{ov=Object.assign(ov,o);if(ALL.length)ready()}).catch(()=>{});
 fetch('extra-places.json').then(r=>r.json()).then(o=>{if(Array.isArray(o)){EX=o;if(ALL.length)ready()}}).catch(()=>{});
 loadData();loadRT()}
init();
