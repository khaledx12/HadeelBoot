const $=s=>document.querySelector(s),esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>(s||'').replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').trim().toLowerCase();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const D={ch:'',tok:'',bot:'',room:0,roomCh:'',pi:5,wmin:25,xp:10,xcd:15,wOn:1,fOn:1,
 tw:'@$(name) مرحبا نورت/ي يا ورده😍🌸🌷',tf:'@$(name) شكرا على المتابعة يا وردة🌸🌷',
 lv:[100,200,350,500,700,900,1200,1500,1900,2400],users:{},shop:[],timers:[],win:{s:0,p:[]},gr:{},buys:[]};
try{Object.assign(D,JSON.parse(localStorage.botD||'{}'))}catch(e){}
try{if(!D.ch)D.ch=localStorage.ch||''}catch(e){}
let ON=0,LOG=[],Q=[],busy=0,lastF='';
const save=()=>{try{localStorage.botD=JSON.stringify(D)}catch(e){}};
const slug=()=>String(D.ch||'').trim().toLowerCase().replace(/^.*kick\.com\//,'').replace(/[\/?#].*$/,'').replace(/_/g,'-');
const slugOf=u=>{try{return new URL(u).pathname.split('/')[1].toLowerCase()}catch(e){return''}};
const key=n=>String(n).toLowerCase();
const need=L=>D.lv[L-1]!=null?D.lv[L-1]:(D.lv[D.lv.length-1]||100)+(L-D.lv.length)*500;
function log(t){LOG.unshift(new Date().toLocaleTimeString('ar-EG')+'  '+t);LOG=LOG.slice(0,80);if(!$('#t-log').hidden)rLog()}

/* ===== الاتصال بإضافة Bridge (قراءة الشات والإرسال من تبويب Kick) ===== */
const KB={ready:0,seq:0,w:{},call(op,a){return new Promise(res=>{const id=++KB.seq;KB.w[id]=res;window.postMessage(Object.assign({kb:1,id,op},a),'*');setTimeout(()=>{if(KB.w[id]){delete KB.w[id];res({s:0,t:'الإضافة مش بترد — اتأكدي إنها مثبتة ومفعّل لها Allow access to file URLs'})}},op==='ensure'?20000:20000)})}};
window.addEventListener('message',e=>{const d=e.data;if(e.source!==window||!d)return;
 if(d.kb===2&&KB.w[d.id]){KB.w[d.id](d.res);delete KB.w[d.id]}
 else if(d.kb===9){KB.ready=1;$('#ext').hidden=true}
 else if(d.kb===3)onEv(d.ev)});
setInterval(()=>{if(!KB.ready)window.postMessage({kb:0},'*')},1500);window.postMessage({kb:0},'*');
const kf=(url,method,body,tok)=>KB.call('kf',{slug:slug(),url,method,body,tok:tok===undefined?D.tok:tok});
const ensure=()=>KB.call('ensure',{slug:slug()});
async function loadRoom(){
 if(D.room&&D.roomCh===slug())return 1;
 const r=await kf('https://kick.com/api/v2/channels/'+slug(),'GET');
 try{const j=JSON.parse(r.t);if(j.chatroom&&j.chatroom.id){D.room=j.chatroom.id;D.roomCh=slug();save();return 1}}catch(e){}
 log('❌ مقدرتش أجيب رقم الشات ('+r.s+') '+String(r.t).slice(0,80));return 0}
async function who(){
 const r=await kf('https://kick.com/api/v1/user','GET');
 try{const j=JSON.parse(r.t);if(j.username){D.bot=j.username;save();hdr();return 1}}catch(e){}
 log('⚠️ مقدرتش أعرف اسم حساب البوت ('+r.s+')');return 0}
const hdr=()=>{$('#bn').textContent=D.bot||'غير معروف — سجّلي دخول في kick.com أو اضغطي ✏️'};

/* ===== الإرسال (طابور بفاصل بين الرسائل) ===== */
function say(t){Q.push(t);pump()}
async function pump(){
 if(busy||!Q.length)return;busy=1;
 const t=Q.shift(),r=await kf('https://kick.com/api/v2/messages/send/'+D.room,'POST',{content:t,type:'message'});
 log((r.s>=200&&r.s<300?'✅ ':'❌ ('+r.s+') ')+t+(r.s>=300||!r.s?' — '+String(r.t).slice(0,120):''));
 setTimeout(()=>{busy=0;pump()},1300)}

/* ===== المنطق ===== */
function U(n){const k=key(n);return D.users[k]||(D.users[k]={n,p:0,l:1,x:0,t:0})}
function onChat(u,m,room){
 if(room&&(D.room!==room||D.roomCh!==slug())){D.room=room;D.roomCh=slug()}
 const k=key(u),n=Date.now();
 if(!ON||k===key(D.bot||'#'))return;
 const x=U(u);x.n=u;
 if(D.wOn&&(!D.gr[k]||n-D.gr[k]>43200000)){D.gr[k]=n;say(D.tw.split('$(name)').join(u))}
 if(!D.win.p.includes(k))D.win.p.push(k);
 if(n-x.t>=D.xcd*1000){x.t=n;x.x+=D.xp;while(x.x>=need(x.l)){x.x-=need(x.l);x.l++}}
 cmd(u,x,m);save()}
function cmd(u,x,m){
 const [c,...r]=m.trim().split(/\s+/),a=r.join(' ');
 if(['!نقاطي','!نقاط','!points'].includes(c))say(`@${u} نقاطك: ${x.p} ⭐ | المستوى: ${x.l} (${x.x}/${need(x.l)} XP)`);
 else if(['!متجر','!shop'].includes(c))say(D.shop.length?'🛒 '+D.shop.map(s=>`${s.name} (${s.price}⭐${s.lvl>1?' | مستوى '+s.lvl:''} | متاح ${s.qty})`).join(' • '):'المتجر فاضي حالياً');
 else if(['!شراء','!buy'].includes(c))buy(u,x,a)}
function buy(u,x,a){
 const q=norm(a);if(!q)return say(`@${u} اكتب !شراء واسم المنتج`);
 const s=D.shop.find(i=>norm(i.name)===q)||D.shop.find(i=>norm(i.name).startsWith(q));
 if(!s)return say(`@${u} المنتج ده مش موجود، اكتب !متجر`);
 if(s.qty<=0)return say(`@${u} ${s.name} خلص من المتجر ❌`);
 if(x.l<s.lvl)return say(`@${u} لازم تكون في مستوى ${s.lvl} عشان تشتري ${s.name} (مستواك ${x.l})`);
 if(x.p<s.price)return say(`@${u} نقاطك مش كفاية — محتاج ${s.price} ونقاطك ${x.p}`);
 x.p-=s.price;s.qty--;D.buys=[{t:Date.now(),u,i:s.name,p:s.price},...D.buys].slice(0,100);
 say(`@${u} تم شراء ${s.name} بـ ${s.price} نقطة ✅ (باقي ${x.p})`);log('🛒 '+u+' اشترى '+s.name)}
function onFollow(u){if(lastF===key(u))return;lastF=key(u);say(D.tf.split('$(name)').join(u));log('➕ متابعة جديدة: '+u)}
function onEv(m){
 if(!m||m.slug!==slug())return;
 if(m.k==='chat')onChat(m.u,m.m,m.r);
 else if(m.k==='follow'&&ON&&D.fOn)onFollow(m.u)}

/* ===== مؤقّت الدورة والرسائل المؤقتة ===== */
setInterval(()=>{
 const n=Date.now();
 if(ON){
  if(n-D.win.s>=D.wmin*60000){
   const g=Math.round(D.pi*D.wmin/5);
   D.win.p.forEach(k=>{if(D.users[k])D.users[k].p+=g});
   log(`⭐ توزيع النقاط: ${D.win.p.length} مستخدم × ${g}`);D.win={s:n,p:[]};save()}
  D.timers.forEach(t=>{if(t.on&&n-t.l>=t.min*60000){t.l=n;say(t.msg);save()}})}
 const left=ON?Math.max(0,D.win.s+D.wmin*60000-n):0;
 $('#cd').textContent=ON?String(Math.floor(left/60000)).padStart(2,'0')+':'+String(Math.floor(left/1000)%60).padStart(2,'0'):'--:--';
 $('#np').textContent=D.win.p.length},1000);

/* ===== الواجهة ===== */
function rShop(){
 $('#stb').innerHTML=D.shop.length?'<table><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>أقل مستوى</th><th></th></tr>'+D.shop.map((s,i)=>`<tr><td><input data-s="${i}" data-f="name" value="${esc(s.name)}"></td><td><input type="number" data-s="${i}" data-f="price" value="${s.price}"></td><td><input type="number" data-s="${i}" data-f="qty" value="${s.qty}"></td><td><input type="number" data-s="${i}" data-f="lvl" value="${s.lvl}"></td><td><button class="g" data-del="${i}">🗑</button></td></tr>`).join('')+'</table>':'<p class="m" style="margin-top:8px">المتجر فاضي — أضيفي منتج</p>';
 $('#sby').innerHTML=D.buys.slice(0,15).map(b=>`${new Date(b.t).toLocaleTimeString('ar-EG')} — <b>${esc(b.u)}</b> اشترى ${esc(b.i)} (${b.p}⭐)`).join('<br>')||'لسه مفيش مشتريات'}
function rUsr(){
 const q=key($('#uq').value.trim()),a=Object.entries(D.users).filter(([k])=>!q||k.includes(q)).sort((a,b)=>b[1].p-a[1].p).slice(0,100);
 $('#ut').innerHTML=a.length?'<table><tr><th>المستخدم</th><th>النقاط</th><th>المستوى</th><th>XP</th><th>تصفير</th></tr>'+a.map(([k,u])=>`<tr><td>${esc(u.n)}</td><td><input type="number" data-u="${esc(k)}" data-f="p" value="${u.p}"></td><td><input type="number" data-u="${esc(k)}" data-f="l" value="${u.l}" min="1"></td><td class="m">${u.x}/${need(u.l)}</td><td><select data-u="${esc(k)}" data-f="rs"><option value="">اختاري…</option><option value="p">تصفير النقاط</option><option value="l">تصفير المستوى</option><option value="b">تصفير الاثنين</option></select></td></tr>`).join('')+'</table>':'<p class="m" style="margin-top:8px">مفيش مستخدمين لسه — هيظهروا لما يكتبوا في الشات والبوت شغال</p>'}
function rTim(){
 $('#ttb').innerHTML=D.timers.length?'<table><tr><th>تشغيل</th><th>الرسالة</th><th>كل (دقيقة)</th><th></th></tr>'+D.timers.map((t,i)=>`<tr><td><input type="checkbox" data-t="${i}" data-f="on" ${t.on?'checked':''}></td><td><textarea rows="2" data-t="${i}" data-f="msg">${esc(t.msg)}</textarea></td><td><input type="number" data-t="${i}" data-f="min" value="${t.min}"></td><td><button class="g" data-del="${i}">🗑</button></td></tr>`).join('')+'</table>':'<p class="m" style="margin-top:8px">مفيش مؤقتات</p>'}
const rLog=()=>{$('#t-log').innerHTML='<div class="m">'+(LOG.map(esc).join('<br>')||'السجل فاضي')+'</div>'};
function bind(){document.querySelectorAll('[data-g]').forEach(el=>{const k=el.dataset.g;if(el.type==='checkbox')el.checked=!!D[k];else el.value=k==='lv'?D.lv.join('\n'):D[k]})}
const TABS={gen:()=>{},shop:rShop,usr:rUsr,tim:rTim,log:rLog};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('a',x===b));
 for(const k in TABS)$('#t-'+k).hidden=k!==b.dataset.tab;TABS[b.dataset.tab]()});
$('#t-gen').onchange=e=>{const el=e.target,k=el.dataset.g;if(!k)return;
 if(el.type==='checkbox')D[k]=el.checked?1:0;
 else if(k==='lv'){const a=el.value.split(/\s+/).map(Number).filter(n=>n>=1);if(a.length)D.lv=a;el.value=D.lv.join('\n')}
 else if(el.type==='number')D[k]=Math.max(k==='wmin'?5:0,+el.value||0);
 else D[k]=el.value;save()};
$('#t-shop').onchange=e=>{const el=e.target,i=el.dataset.s;if(i==null||!D.shop[+i])return;const f=el.dataset.f;
 D.shop[+i][f]=f==='name'?el.value.trim():Math.max(f==='lvl'?1:0,Math.round(+el.value||0));save()};
$('#t-shop').onclick=e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.del!=null){D.shop.splice(+b.dataset.del,1);save();rShop()}
 else if(b.id==='sa'){const n=$('#sn').value.trim();if(!n)return;D.shop.push({name:n,price:Math.max(0,+$('#sp').value||0),qty:Math.max(0,+$('#sq').value||0),lvl:Math.max(1,+$('#sl').value||1)});$('#sn').value='';save();rShop()}};
$('#t-usr').onchange=e=>{const el=e.target,k=el.dataset.u;if(!k||!D.users[k])return;const u=D.users[k],f=el.dataset.f;
 if(f==='p')u.p=Math.max(0,Math.round(+el.value||0));
 else if(f==='l'){u.l=Math.max(1,Math.round(+el.value||1));u.x=0}
 else if(f==='rs'){if(el.value==='p'||el.value==='b')u.p=0;if(el.value==='l'||el.value==='b'){u.l=1;u.x=0}}
 save();rUsr()};
$('#uq').oninput=rUsr;$('#ur').onclick=rUsr;
$('#t-tim').onclick=e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.del!=null){D.timers.splice(+b.dataset.del,1);save();rTim()}
 else if(b.id==='ta'){const m=$('#tmsg').value.trim(),v=Math.round(+$('#tv').value*($('#tu').value==='h'?60:1));
  if(!m)return;if(!(v>=5&&v<=1440)){alert('المدة لازم تكون بين 5 دقائق و24 ساعة');return}
  D.timers.push({msg:m,min:v,on:1,l:Date.now()});$('#tmsg').value='';save();rTim()}};
$('#t-tim').onchange=e=>{const el=e.target,i=el.dataset.t;if(i==null||!D.timers[+i])return;const t=D.timers[+i],f=el.dataset.f;
 if(f==='msg')t.msg=el.value;else if(f==='on')t.on=el.checked?1:0;else if(f==='min')t.min=Math.max(5,Math.min(1440,Math.round(+el.value||5)));save()};
$('#ed').onclick=()=>{$('#tkp').hidden=!$('#tkp').hidden;$('#tk').value=D.tok};
$('#tks').onclick=async()=>{D.tok=$('#tk').value.trim();D.bot='';save();hdr();if(await who())$('#tkp').hidden=true;else alert('ماقدرتش أجيب اسم الحساب — اتأكدي من التوكن وإن تبويب kick.com مفتوح')};
$('#on').onclick=async()=>{
 if(ON){ON=0;$('#on').textContent='▶ تشغيل البوت';$('#on').classList.remove('on');log('⏹ البوت اتوقف');return}
 D.ch=$('#ch').value.trim();if(!slug()){alert('اكتبي اسم قناة البث الأول');return}
 try{localStorage.ch=slug()}catch(e){}
 log('⏳ بجهّز تبويب القناة...');await ensure();
 if(!await loadRoom())return;
 if(!D.bot)await who();
 const n=Date.now();if(!D.win.s||n-D.win.s>=D.wmin*60000)D.win={s:n,p:[]};
 D.timers.forEach(t=>t.l=n);save();ON=1;
 $('#on').textContent='⏹ إيقاف البوت';$('#on').classList.add('on');log('▶ البوت اشتغل على '+slug())};
$('#ch').value=D.ch;hdr();bind();
