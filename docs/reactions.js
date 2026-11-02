export const POSITIVE_REACTIONS=[['🫶','応援してるよ'],['💛','共感したよ'],['🌷','おつかれさま'],['👏','がんばったね'],['✨','すてきだね'],['🥰','ありがとう']];
export function createReactions({api,db,uid,onChange,isConnected,onReport,autoLike=()=>false}){
  const values=new Map(),subscriptions=new Map();let selected=null,pending=false,problem='',revision=0;
  const changed=()=>{revision++;onChange();};
  document.addEventListener('click',event=>{if(selected&&!event.target.closest('.bubble')){selected=null;changed();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&selected){selected=null;changed();}});
  function sync(messages){
    const ids=new Set(messages.map(m=>m.id).filter(Boolean));
    for(const [id,stop] of subscriptions){if(!ids.has(id)){stop();subscriptions.delete(id);values.delete(id);}}
    for(const id of ids){if(!subscriptions.has(id)){
      const stop=api.onValue(api.ref(db,'reactions/'+id),snapshot=>{values.set(id,snapshot.val()||{});changed();},()=>{values.delete(id);if(selected===id){problem='リアクションを読み込めませんでした。';changed();}});
      subscriptions.set(id,stop);
    }}
  }
  async function react(id,emoji){
    if(pending||!isConnected())return;
    pending=true;problem='';changed();
    try{const ref=api.ref(db,'reactions/'+id+'/'+uid);if(values.get(id)?.[uid]===emoji)await api.remove(ref);else await api.set(ref,emoji);selected=null;}
    catch{problem='送れませんでした。接続を確認して、もう一度お試しください。';}
    finally{pending=false;changed();}
  }
  function decorate(el,message){
    if(message.bot||!message.id)return;
    const id=message.id,other=message.sender!==uid,chosen=selected===id;
    if(other){
      const paragraph=el.querySelector('p'),button=document.createElement('button');
      button.type='button';button.className='message-select';button.textContent=message.body;button.dataset.focusKey=id+'-select';
      button.setAttribute('aria-expanded',String(chosen));button.setAttribute('aria-label',message.body+' — タップしてリアクション');
      button.onclick=()=>{selected=chosen?null:id;problem='';changed();if(!chosen)requestAnimationFrame(()=>document.querySelector('.reaction-picker')?.scrollIntoView({block:'center',inline:'nearest'}));};paragraph.replaceWith(button);
      el.classList.toggle('message-highlight',chosen);
    }
    const reactions=values.get(id)||{};
    const summary=document.createElement('div');summary.className='reaction-summary';
    for(const [emoji,label] of POSITIVE_REACTIONS){
      const count=Object.values(reactions).filter(r=>r===emoji).length;if(!count)continue;
      const item=document.createElement(other?'button':'span');item.className='reaction-total';item.textContent=emoji+(count>1?' '+count:'');
      item.setAttribute('aria-label',label+' '+count+'件');
      if(other){item.type='button';item.dataset.focusKey=id+emoji+'-count';item.setAttribute('aria-pressed',String(reactions[uid]===emoji));item.disabled=pending||!isConnected();item.onclick=()=>{void react(id,emoji);};}
      summary.append(item);
    }
    if(autoLike(message)){const item=document.createElement('span');item.className='reaction-total auto-like';item.textContent='👍';item.title='応援係（自動）のいいね';item.setAttribute('aria-label','応援係（自動）のいいね 1件');const mark=document.createElement('small');mark.textContent='自動';item.append(mark);summary.append(item);}
    const content=document.createElement('div');content.className='message-content'+(summary.childElementCount?' has-reactions':'');
    content.append(el.querySelector('.message-select')||el.querySelector('p'));el.append(content,summary);
    if(chosen&&other){
      const picker=document.createElement('div');picker.className='reaction-picker';picker.setAttribute('role','group');picker.setAttribute('aria-label','やさしいリアクションを選ぶ');
      for(const [emoji,label] of POSITIVE_REACTIONS){
        const button=document.createElement('button');button.type='button';button.textContent=emoji;button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(reactions[uid]===emoji));button.dataset.focusKey=id+emoji;button.disabled=pending||!isConnected();button.onclick=()=>{void react(id,emoji);};picker.append(button);
      }

      const close=document.createElement('button');close.type='button';close.className='reaction-close';close.textContent='×';close.setAttribute('aria-label','リアクションを閉じる');close.onclick=()=>{selected=null;changed();};
      picker.append(close);
      if(onReport){const report=document.createElement('button');report.type='button';report.className='report-message';report.textContent='報告';report.onclick=()=>{selected=null;changed();void onReport(message);};picker.append(report);}
      el.append(picker);
      if(problem){const error=document.createElement('p');error.className='reaction-error';error.setAttribute('role','status');error.textContent=problem;el.append(error);}
    }
  }
  return {sync,decorate,get revision(){return revision;}};
}
