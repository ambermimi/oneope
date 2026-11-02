import {createReactions} from './reactions.js';
import {displayName} from './names.js';
import {setupComposer} from './composer.js';
import {BOT_NAMES,botCount,botReplies} from './bots.js';
import {windows,poses} from './scene.js';
import {firebaseConfig} from './firebase-config.js';
const $=id=>document.getElementById(id);
let joined=false,currentStatus='眠れない',people={},messages=[],uid='',connected=false,ready=false,busy=false;
let db,api,myRef,disconnectHook,reactions,clockOffset=0;
const now=()=>Date.now()+clockOffset;
function error(text){$('chatError').textContent=text;}
function controls(){
  $('join').disabled=!ready||!connected||busy;
  $('send').disabled=!ready||!connected||busy;
  document.querySelectorAll('.chip').forEach(b=>b.disabled=!ready||!connected||busy);
}
function humanCount(){return Object.values(people).filter(p=>p.seen>now()-90000).length;}
function render(){
  windows.forEach(w=>{w.classList.remove('lit','mine','bot-window');w.setAttribute('aria-label','おやすみ中の窓');w.onclick=()=>{$('silhouetteLabel').textContent='この窓の灯りは、おやすみ中。';};});
  const count=ready&&connected?botCount(now(),humanCount()):0;
  const list=Object.entries(people).filter(([,p])=>p.seen>now()-90000).sort(([a],[b])=>a===uid?-1:b===uid?1:0);
  list.slice(0,windows.length).forEach(([id,p],i)=>{
    const w=windows[(i+18)%windows.length],pose=poses[p.status==='授乳中'?1:p.status==='寝かしつけ中'?2:0];
    w.innerHTML='<svg viewBox="0 0 44 56" aria-hidden="true">'+pose.svg+'</svg>';
    w.classList.add(id===uid?'mine':'lit');w.setAttribute('aria-label',(id===uid?'あなたの窓：':'')+p.status);
    w.onclick=()=>{$('silhouetteLabel').textContent=(id===uid?'あなたの窓：':'')+p.status+'。同じ夜を、ここで。';};
  });
  $('live').textContent=!ready?'今夜の灯りを、準備しています。':!connected?'接続を確認しています。':list.length?'いま、'+list.length+'人がここにいます':'今は、まだほかの灯りがありません。';
  for(let i=0;i<count;i++){
    // Bots use stars rather than mother-and-baby silhouettes.
    const offset=list.length+i;
    if(offset<windows.length){const w=windows[(offset+18)%windows.length];w.classList.add('lit','bot-window');w.innerHTML='<span aria-hidden="true">✦</span>';w.setAttribute('aria-label',BOT_NAMES[i]+'（自動応援ボット）');w.onclick=()=>{$('silhouetteLabel').textContent=BOT_NAMES[i]+'（自動応援ボット）。夜に、そっと応援を届けます。';};}
  }
  $('botStatus').textContent=count?'✦ 自動応援 '+count+'体 · '+BOT_NAMES.slice(0,count).join('・'):'自動応援は毎晩22:00〜翌5:00（日本時間）';
  if(count)$('live').textContent=list.length?'いま、'+list.length+'人がここにいます（ボットを除く）':'今は、ほかの参加者はいません。自動応援がそばにいます。';
  $('join').textContent=joined?'灯りを消して、おやすみ':'☾ 私も、起きてるよ';
  $('join').setAttribute('aria-pressed',String(joined));
  $('hint').textContent=joined?'あなたは「'+displayName(uid)+'」。ここで、ひと息。':'話さなくても、ここにいるだけで。';controls();
}
let lastMessageView='';
function renderMessages(){
  const box=$('messages'),near=box.scrollHeight-box.scrollTop-box.clientHeight<65;
  const replies=ready&&connected?botReplies(messages,now(),humanCount()):[];
  const recent=[...messages,...replies].filter(m=>m.created>now()-86400000).sort((a,b)=>a.created-b.created);
  const signature=JSON.stringify([ready,connected,uid,recent,reactions?.revision]);
  if(signature===lastMessageView)return;
  const focusKey=document.activeElement?.dataset.focusKey,oldScroll=box.scrollTop;
  lastMessageView=signature;box.replaceChildren();
  if(!recent.length){const p=document.createElement('p');p.className='chat-empty';p.textContent=ready?'まだ、ひとことはありません。あなたの「起きてるよ」から、どうぞ。':'灯りをつなぐ準備をしています。';box.append(p);}
  recent.forEach(m=>{const el=document.createElement('div');el.className='bubble'+(m.bot?' bot-msg':m.sender===uid?' mine-msg':'');const label=document.createElement('small');label.textContent=(m.bot?m.name+'（自動応援）→ '+(m.replyTo===uid?'あなた':displayName(m.replyTo)):m.sender===uid?'あなた':displayName(m.sender))+' · '+new Date(m.created).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});const p=document.createElement('p');p.textContent=m.body;el.append(label,p);reactions?.decorate(el,m);box.append(el);});
  if(near)box.scrollTop=box.scrollHeight;else box.scrollTop=oldScroll;
  if(focusKey){const target=[...box.querySelectorAll('[data-focus-key]')].find(el=>el.dataset.focusKey===focusKey);target?.focus({preventScroll:true});}
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
// Refresh the timed bot state without writing synthetic activity to Firebase.
setInterval(()=>{if(!document.hidden){render();renderMessages();}},2500);
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
    reactions=createReactions({api,db,uid,onChange:renderMessages,isConnected:()=>ready&&connected});
    api.onValue(api.ref(db,'.info/serverTimeOffset'),snap=>{clockOffset=snap.val()||0;});
    api.onValue(api.ref(db,'.info/connected'),snap=>{connected=snap.val()===true;$('connection').textContent=connected?'● つながっています':'再接続を待っています';render();if(connected)presence().catch(()=>error('灯りの接続を確認してください。'));});
    const failed=e=>{console.error('Tomori database:',e.code||e.message);ready=false;people={};messages=[];$('connection').textContent='接続できませんでした';error('接続できませんでした。時間をおいて再読み込みしてください。');render();renderMessages();};
    api.onValue(api.ref(db,'presence'),snap=>{people=snap.val()||{};render();renderMessages();},failed);
    let unsubscribe;
    function listen(){
      unsubscribe?.();
      const q=api.query(api.ref(db,'chat'),api.orderByChild('created'),api.startAt(Math.floor(now()/3600000)*3600000-82800000),api.limitToLast(100));
      unsubscribe=api.onValue(q,snap=>{ready=true;$('connection').textContent=connected?'● つながっています':'再接続を待っています';render();messages=[];snap.forEach(s=>{messages.push({...s.val(),id:s.key});});reactions.sync(messages);renderMessages();},failed);
    }
    listen();setInterval(()=>{if(!document.hidden){listen();render();}},60000);
    setInterval(()=>{if(!document.hidden)presence().catch(()=>{});render();renderMessages();},30000);
    document.addEventListener('visibilitychange',()=>{presence().catch(()=>{});});
    window.addEventListener('pagehide',()=>{api.goOffline(db);});
    window.addEventListener('pageshow',()=>{api.goOnline(db);});
  }catch(e){console.error('Tomori connection:',e.code||e.message);$('connection').textContent='接続できませんでした';error('接続できませんでした。時間をおいて再読み込みしてください。');ready=false;render();}
}
setupComposer();
void start();
