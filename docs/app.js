import {windows,poses} from './scene.js';
import {firebaseConfig} from './firebase-config.js';
const $=id=>document.getElementById(id);
let joined=false,currentStatus='眠れない',people={},messages=[],uid='',connected=false,ready=false,busy=false;
let db,api,myRef,disconnectHook,clockOffset=0;
const now=()=>Date.now()+clockOffset;
function error(text){$('chatError').textContent=text;}
function controls(){
  $('join').disabled=!ready||!connected||busy;
  $('send').disabled=!ready||!connected||busy;
  document.querySelectorAll('.chip').forEach(b=>b.disabled=!ready||!connected||busy);
}
function render(){
  windows.forEach(w=>{w.classList.remove('lit','mine');w.setAttribute('aria-label','おやすみ中の窓');w.onclick=()=>{$('silhouetteLabel').textContent='この窓の灯りは、おやすみ中。';};});
  const list=Object.entries(people).filter(([,p])=>p.seen>now()-90000).sort(([a],[b])=>a===uid?-1:b===uid?1:0);
  list.slice(0,windows.length).forEach(([id,p],i)=>{
    const w=windows[(i+18)%windows.length],pose=poses[p.status==='授乳中'?1:p.status==='寝かしつけ中'?2:0];
    w.innerHTML='<svg viewBox="0 0 44 56" aria-hidden="true">'+pose.svg+'</svg>';
    w.classList.add(id===uid?'mine':'lit');w.setAttribute('aria-label',(id===uid?'あなたの窓：':'')+p.status);
    w.onclick=()=>{$('silhouetteLabel').textContent=(id===uid?'あなたの窓：':'')+p.status+'。同じ夜を、ここで。';};
  });
  $('live').textContent=!ready?'今夜の灯りを、準備しています。':!connected?'接続を確認しています。':list.length?'いま、'+list.length+'人がここにいます':'今は、まだほかの灯りがありません。';
  $('join').textContent=joined?'灯りを消して、おやすみ':'☾ 私も、起きてるよ';
  $('join').setAttribute('aria-pressed',String(joined));
  $('hint').textContent=joined?'あなたも、ここにいます。':'話さなくても、ここにいるだけで。';controls();
}
function renderMessages(){
  const box=$('messages'),near=box.scrollHeight-box.scrollTop-box.clientHeight<65;
  box.replaceChildren();
  const recent=messages.filter(m=>m.created>now()-86400000);
  if(!recent.length){const p=document.createElement('p');p.className='chat-empty';p.textContent=ready?'まだ、ひとことはありません。あなたの「起きてるよ」から、どうぞ。':'灯りをつなぐ準備をしています。';box.append(p);}
  recent.forEach(m=>{const el=document.createElement('div');el.className='bubble'+(m.sender===uid?' mine-msg':'');const label=document.createElement('small');label.textContent=(m.sender===uid?'あなた':'ママ '+m.sender.slice(-4).toUpperCase())+' · '+new Date(m.created).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});const p=document.createElement('p');p.textContent=m.body;el.append(label,p);box.append(el);});
  if(near)box.scrollTop=box.scrollHeight;
}
async function presence(){
  if(!connected||!ready)return;
  if(joined&&!document.hidden){
    // Register server-side cleanup before announcing this session.
    disconnectHook=api.onDisconnect(myRef);await disconnectHook.remove();
    if(joined&&!document.hidden)await api.set(myRef,{status:currentStatus,seen:api.serverTimestamp()});
  }else await api.remove(myRef);
}
async function send(body){
  const text=body.trim();if(!text||text.length>300||busy||!connected||!ready)return;
  busy=true;controls();error('');
  try{
    const key=api.push(api.ref(db,'chat')).key;
    await api.update(api.ref(db),{['chat/'+key]:{sender:uid,body:text,created:api.serverTimestamp()},['limits/'+uid]:api.serverTimestamp()});
    $('chatText').value='';$('charCount').textContent='0 / 300';
    joined=true;await presence();$('messages').scrollTop=$('messages').scrollHeight;
  }catch{error('送信できませんでした。3秒ほど待って、接続を確認してからお試しください。');}
  finally{busy=false;render();}
}
$('join').onclick=async()=>{if(busy)return;busy=true;const previous=joined;joined=!joined;controls();try{await presence();error('');}catch{joined=previous;error('接続できませんでした。もう一度お試しください。');}finally{busy=false;render();}};
document.querySelectorAll('.chip').forEach(b=>b.onclick=async()=>{currentStatus=b.textContent;document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));await send(currentStatus);});
$('chatForm').onsubmit=e=>{e.preventDefault();void send($('chatText').value);};
$('chatText').oninput=e=>{$('charCount').textContent=e.target.value.length+' / 300';};
$('wave').onclick=()=>{$('toast').textContent='おつかれさま。あなたも、今日一日よく頑張りました。';};
$('about').onclick=()=>{$('info').showModal();};$('close').onclick=()=>{$('info').close();};
render();renderMessages();
async function start(){
  if(!firebaseConfig){$('connection').textContent='オープン準備中';$('live').textContent='もうすぐ、ここに灯りがともります。';$('hint').textContent='ただいま準備中です。公開まで、もう少しお待ちください。';return;}
  try{
    const [{initializeApp},authApi,databaseApi]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js')
    ]);
    api=databaseApi;const app=initializeApp(firebaseConfig),auth=authApi.getAuth(app);
    // Each tab has its own anonymous session, so closing one cannot remove another.
    await authApi.setPersistence(auth,authApi.inMemoryPersistence);
    uid=(await authApi.signInAnonymously(auth)).user.uid;db=api.getDatabase(app);myRef=api.ref(db,'presence/'+uid);ready=true;
    api.onValue(api.ref(db,'.info/serverTimeOffset'),snap=>{clockOffset=snap.val()||0;});
    api.onValue(api.ref(db,'.info/connected'),snap=>{connected=snap.val()===true;$('connection').textContent=connected?'● つながっています':'再接続を待っています';render();if(connected)presence().catch(()=>error('灯りの接続を確認してください。'));});
    const failed=e=>{console.error('Tomori database:',e.code||e.message);ready=false;people={};messages=[];$('connection').textContent='接続できませんでした';error('接続できませんでした。時間をおいて再読み込みしてください。');render();renderMessages();};
    api.onValue(api.ref(db,'presence'),snap=>{people=snap.val()||{};render();},failed);
    let unsubscribe;
    function listen(){
      unsubscribe?.();
      const q=api.query(api.ref(db,'chat'),api.orderByChild('created'),api.startAt(Math.floor(now()/3600000)*3600000-82800000),api.limitToLast(100));
      unsubscribe=api.onValue(q,snap=>{ready=true;$('connection').textContent=connected?'● つながっています':'再接続を待っています';render();messages=[];snap.forEach(s=>{messages.push(s.val());});renderMessages();},failed);
    }
    listen();setInterval(()=>{if(!document.hidden){listen();render();}},60000);
    setInterval(()=>{if(!document.hidden)presence().catch(()=>{});render();renderMessages();},30000);
    document.addEventListener('visibilitychange',()=>{presence().catch(()=>{});});
    window.addEventListener('pagehide',()=>{api.goOffline(db);});
    window.addEventListener('pageshow',()=>{api.goOnline(db);});
  }catch(e){console.error('Tomori connection:',e.code||e.message);$('connection').textContent='接続できませんでした';error('接続できませんでした。時間をおいて再読み込みしてください。');ready=false;render();}
}
void start();
