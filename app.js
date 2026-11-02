import {setupVisits} from './visits.js?v=20261102-visits1';
import {languageProblem,isHidden} from './moderation.js?v=20261102-room5';
import {spamProblem,nextGuard} from './spam.js?v=20261102-room5';
import {setupMusic} from './music.js?v=20261102-room5';
import {createReactions} from './reactions.js?v=20261102-room5';
import {displayName,displayNameParts} from './names.js?v=20261102-animals1';
import {setupComposer} from './composer.js?v=20261102-panel1';
import {BOT_NAMES,botCount,botReplies} from './bots.js?v=20261102-21h';
import {windows} from './scene.js?v=20261102-room5';
import {OWN_WINDOW,OTHER_WINDOWS,poseForStatus} from './scene-model.js?v=20261102-necks1';
import {firebaseConfig} from './firebase-config.js?v=20261102-room5';
const $=id=>document.getElementById(id);
let joined=false,currentStatus='眠れない',people={},messages=[],uid='',connected=false,ready=false,busy=false;
let moderation={};
let db,api,myRef,disconnectHook,reactions,clockOffset=0;
const now=()=>Date.now()+clockOffset;
function error(text){$('chatError').textContent=text;}
function controls(){
  $('join').disabled=!ready||!connected||busy;
  $('wave').disabled=!ready||!connected||busy;
  $('send').disabled=!ready||!connected||busy;
  document.querySelectorAll('.chip').forEach(b=>b.disabled=!ready||!connected||busy);
}
function humanCount(){return Object.values(people).filter(p=>p.seen>now()-90000).length;}
function render(){
  $('connection').classList.toggle('online',ready&&connected);
  windows.forEach(w=>{w.replaceChildren();w.classList.remove('lit','mine','bot-window');w.setAttribute('aria-label','おやすみ中の窓');w.onclick=()=>{$('silhouetteLabel').textContent='この窓の灯りは、おやすみ中。';};});
  const count=ready&&connected?botCount(now(),humanCount()):0;
  const list=Object.entries(people).filter(([,p])=>p.seen>now()-90000).sort(([a],[b])=>a===uid?-1:b===uid?1:0);
  const own=windows[OWN_WINDOW];own.classList.add('reserved-window');
  const ownMarker=document.createElement('span');ownMarker.className='own-window-label';ownMarker.textContent='あなた';own.append(ownMarker);
  own.setAttribute('aria-label','あなたの窓（中央の建物・最上段の真ん中）');
  own.onclick=()=>{$('silhouetteLabel').textContent='ここは、あなたの窓。「私も、起きてるよ」で灯りがともります。';};
  function lightWindow(window,status,isYou=false){
    const pose=poseForStatus(status);
    window.querySelector('svg')?.remove();
    window.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 44 56" preserveAspectRatio="xMidYMax meet" aria-hidden="true">'+pose.svg+'</svg>');
    window.classList.add(isYou?'mine':'lit');window.setAttribute('aria-label',(isYou?'あなたの窓：':'')+status+' — '+pose.label);
    window.onclick=()=>{$('silhouetteLabel').textContent=(isYou?'あなたの窓：':'')+status+'。'+pose.label+'姿を表すイラストです。';};
  }
  const others=list.filter(([id])=>id!==uid);
  others.slice(0,OTHER_WINDOWS.length-count).forEach(([,person],index)=>lightWindow(windows[OTHER_WINDOWS[index]],person.status));
  if(joined&&ready&&connected&&list.some(([id])=>id===uid))lightWindow(own,currentStatus,true);
  $('live').textContent=!ready?'今夜の灯りを、準備しています。':!connected?'接続を確認しています。':list.length?'いま、'+list.length+'人のママが起きています':'今は、まだほかの灯りがありません。';
  for(let i=0;i<count;i++){
    // Bots use stars rather than mother-and-baby silhouettes.
    const offset=Math.min(others.length,OTHER_WINDOWS.length-count)+i;
    if(offset<OTHER_WINDOWS.length){const w=windows[OTHER_WINDOWS[offset]];w.classList.add('lit','bot-window');w.innerHTML='<span aria-hidden="true">✦</span>';w.setAttribute('aria-label',BOT_NAMES[i]+'（自動応援ボット）');w.onclick=()=>{$('silhouetteLabel').textContent=BOT_NAMES[i]+'（自動応援ボット）。夜に、そっと応援を届けます。';};}
  }
  $('botStatus').textContent=count?'✦ 自動応援 '+count+'体 · '+BOT_NAMES.slice(0,count).join('・'):'';
  if(count)$('live').textContent=list.length?'いま、'+list.length+'人のママが起きています（ボットを除く）':'今は、ほかの参加者はいません。自動応援がそばにいます。';
  $('join').textContent=joined?'灯りを消して、おやすみ':'☾ 私も、起きてるよ';
  $('join').setAttribute('aria-pressed',String(joined));
  $('hint').textContent=joined?'あなたは「'+displayName(uid)+'」。ここで、ひと息。':'話さなくても、ここにいるだけで。';controls();
}
let lastMessageView='';
function renderMessages(){
  const box=$('messages'),near=box.scrollHeight-box.scrollTop-box.clientHeight<65;
  const visibleMessages=messages.filter(m=>!isHidden(moderation[m.sender]));
  const replies=ready&&connected?botReplies(visibleMessages.filter(m=>!m.anonymous),now(),humanCount()):[];
  const recent=[...visibleMessages,...replies].filter(m=>m.created>now()-86400000).sort((a,b)=>a.created-b.created);
  const signature=JSON.stringify([ready,connected,uid,recent,reactions?.revision]);
  if(signature===lastMessageView)return;
  const focusKey=document.activeElement?.dataset.focusKey,oldScroll=box.scrollTop;
  lastMessageView=signature;box.replaceChildren();
  if(!recent.length){const p=document.createElement('p');p.className='chat-empty';p.textContent=ready?'まだ、ひとことはありません。あなたの「起きてるよ」から、どうぞ。':'灯りをつなぐ準備をしています。';box.append(p);}
  recent.forEach(m=>{const el=document.createElement('div');el.className='bubble'+(m.bot?' bot-msg':m.sender===uid?' mine-msg':'');const label=document.createElement('small');label.className='message-meta';const name=document.createElement('span');if(!m.anonymous&&!m.bot&&m.sender!==uid){name.className='animal-name';for(const part of displayNameParts(m.sender)){const line=document.createElement('span');line.textContent=part;name.append(line);}}else name.textContent=m.anonymous?'だれかより':m.bot?m.name+'（自動）':'あなた';const stamp=document.createElement('time');stamp.dateTime=new Date(m.created).toISOString();el.title=new Date(m.created).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})+'（日本時間）';stamp.textContent=new Date(m.created).toLocaleTimeString('ja-JP',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit'});label.append(name);stamp.className='message-time';if(m.bot)label.title=(m.replyTo===uid?'あなた':displayName(m.replyTo))+'への自動応援';const p=document.createElement('p');p.textContent=m.body;el.append(label,p,stamp);reactions?.decorate(el,m);box.append(el);});
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
async function reportMessage(message){
  if(!ready||!connected||message.sender===uid)return;
  if(!window.confirm('この投稿を不適切な内容として報告しますか？ 同じ相手への報告は1回だけです。'))return;
  try{
    const path='reports/'+message.sender+'/'+uid;
    if((await api.get(api.ref(db,path))).exists()){error('この相手はすでに報告済みです。');return;}
    await api.update(api.ref(db),{[path]:{messageId:message.id,created:api.serverTimestamp()},['moderation/'+message.sender+'/count']:api.increment(1)});
    error('報告を受け付けました。ご協力ありがとうございます。');
  }catch{error('報告できませんでした。接続を確認して、もう一度お試しください。');}
}
async function send(body,anonymous=false){
  const text=body.trim();if(!text||text.length>300||busy||!connected||!ready)return;
  const wording=languageProblem(text);if(wording){error(wording);return;}
  if(isHidden(moderation[uid])){error('投稿は確認待ちです。管理者の確認までお待ちください。');return;}
  busy=true;controls();error('');
  try{
    const previous=(await api.get(api.ref(db,'sendGuards/'+uid))).val();
    const problem=spamProblem(text,previous,now());if(problem){error(problem);if(anonymous)$('toast').textContent=problem;return;}
    const key=api.push(api.ref(db,'chat')).key;
    await api.update(api.ref(db),{['chat/'+key]:{sender:uid,body:text,created:api.serverTimestamp(),...(anonymous?{anonymous:true}:{})},['limits/'+uid]:api.serverTimestamp(),['sendGuards/'+uid]:nextGuard(previous,text,key,now(),api.serverTimestamp())});
    if(!anonymous){$('chatText').value='';$('charCount').textContent='0 / 300';}
    $('chatForm').dispatchEvent(new Event('message-sent'));
    if(anonymous){$('toast').replaceChildren(document.createTextNode('匿名で「おつかれさま」を届けました。'),document.createElement('br'),document.createTextNode('おつかれさま。あなたも、今日一日よく頑張りました。'));}
    else {joined=true;presence().catch(()=>error('メッセージは届きました。灯りの接続を確認しています。'));}
    $('messages').scrollTop=$('messages').scrollHeight;
  }catch{error('送信できませんでした。少し待って、接続を確認してからお試しください。');}
  finally{busy=false;render();}
}
$('join').onclick=async()=>{if(busy)return;busy=true;const previous=joined;joined=!joined;controls();try{await presence();error('');}catch{joined=previous;error('接続できませんでした。もう一度お試しください。');}finally{busy=false;render();}};
document.querySelectorAll('.chip').forEach(b=>b.onclick=async()=>{currentStatus=b.textContent;document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));await send(currentStatus);});
$('chatForm').onsubmit=e=>{e.preventDefault();void send($('chatText').value);};
$('chatText').oninput=e=>{$('charCount').textContent=e.target.value.length+' / 300';};
$('wave').onclick=()=>{void send('おつかれさま',true);};
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
    api=databaseApi;void setupVisits({initializeApp,authApi,api,config:firebaseConfig});const app=initializeApp(firebaseConfig),auth=authApi.getAuth(app);
    // Each tab has its own anonymous session, so closing one cannot remove another.
    await authApi.setPersistence(auth,authApi.inMemoryPersistence);
    uid=(await authApi.signInAnonymously(auth)).user.uid;db=api.getDatabase(app);myRef=api.ref(db,'presence/'+uid);ready=true;
    reactions=createReactions({api,db,uid,onChange:renderMessages,isConnected:()=>ready&&connected,onReport:reportMessage});
    api.onValue(api.ref(db,'moderation'),snap=>{moderation=snap.val()||{};renderMessages();},()=>error('投稿の確認状態を読み込めませんでした。再読み込みしてください。'));
    api.onValue(api.ref(db,'.info/serverTimeOffset'),snap=>{clockOffset=snap.val()||0;});
    api.onValue(api.ref(db,'.info/connected'),snap=>{connected=snap.val()===true;$('connection').textContent=connected?'オンライン中':'再接続を待っています';render();if(connected)presence().catch(()=>error('灯りの接続を確認してください。'));});
    const failed=e=>{console.error('Tomori database:',e.code||e.message);ready=false;people={};messages=[];$('connection').textContent='接続できませんでした';error('接続できませんでした。時間をおいて再読み込みしてください。');render();renderMessages();};
    api.onValue(api.ref(db,'presence'),snap=>{people=snap.val()||{};render();renderMessages();},failed);
    let unsubscribe;
    function listen(){
      unsubscribe?.();
      const q=api.query(api.ref(db,'chat'),api.orderByChild('created'),api.startAt(Math.floor(now()/3600000)*3600000-82800000),api.limitToLast(100));
      unsubscribe=api.onValue(q,snap=>{ready=true;$('connection').textContent=connected?'オンライン中':'再接続を待っています';render();messages=[];snap.forEach(s=>{messages.push({...s.val(),id:s.key});});reactions.sync(messages);renderMessages();},failed);
    }
    listen();setInterval(()=>{if(!document.hidden){listen();render();}},60000);
    setInterval(()=>{if(!document.hidden)presence().catch(()=>{});render();renderMessages();},30000);
    document.addEventListener('visibilitychange',()=>{presence().catch(()=>{});});
    window.addEventListener('pagehide',()=>{api.goOffline(db);});
    window.addEventListener('pageshow',()=>{api.goOnline(db);});
  }catch(e){console.error('Tomori connection:',e.code||e.message);$('connection').textContent='接続できませんでした';error('接続できませんでした。時間をおいて再読み込みしてください。');ready=false;render();}
}
setupComposer();
setupMusic();
void start();
