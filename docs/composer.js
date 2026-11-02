// Keep conversation and controls in one viewport-sized panel, including above iOS keyboards.
export function setupComposer(){
  try{if(sessionStorage.getItem('tomori-has-posted'))document.body.classList.add('has-posted');}catch{}
  const chat=document.querySelector('.chat'),form=document.getElementById('chatForm');
  const input=document.getElementById('chatText');
  const messages=document.getElementById('messages'),header=document.querySelector('header');
  const mobile=matchMedia('(max-width:700px)');
  const holder=document.createElement('div');holder.className='chat-holder';chat.before(holder);holder.append(chat);
  let editing=false,frame,anchorY=0,panelWidth=0,panelLeft=0;
  function resizeInput(){
    input.style.height='44px';input.style.height=Math.min(84,Math.max(44,input.scrollHeight))+'px';
    form.classList.toggle('near-limit',input.value.length>=250);
  }
  function layout(){
    cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
      const near=messages.scrollHeight-messages.scrollTop-messages.clientHeight<70;
      const viewport=visualViewport,height=viewport?.height||innerHeight;
      const rect=holder.getBoundingClientRect();
      const inRoom=editing||(rect.top<innerHeight*.55&&rect.bottom>header.offsetHeight+40);
      document.body.classList.toggle('chat-in-view',inRoom);
      const roomHeight=Math.max(200,Math.min(800,height-header.offsetHeight-16));
      chat.style.setProperty('--room-height',roomHeight+'px');
      if(editing){
        chat.style.top=((viewport?.offsetTop||0)+header.offsetHeight+4)+'px';
        chat.style.left=panelLeft+'px';chat.style.width=panelWidth+'px';
      }
      if(near)messages.scrollTop=messages.scrollHeight;
    });
  }
  function startEditing(){
    if(!mobile.matches||editing)return;
    const rect=chat.getBoundingClientRect();anchorY=rect.top+scrollY;
    panelLeft=rect.left;panelWidth=rect.width;
    holder.style.minHeight=chat.offsetHeight+'px';editing=true;chat.classList.add('is-editing');layout();
  }
  function finishEditing(){
    if(!editing)return;
    editing=false;chat.classList.remove('is-editing');holder.style.removeProperty('min-height');
    for(const key of ['top','left','width'])chat.style.removeProperty(key);
    layout();
    // Restore the same room anchor, rather than jumping to the scene or composer.
    window.scrollTo({top:Math.max(0,anchorY-header.offsetHeight-8),behavior:'instant'});
  }
  input.addEventListener('focus',startEditing);
  input.addEventListener('input',()=>{resizeInput();layout();});
  // Tapping Send should not collapse/reopen the keyboard between messages.
  document.getElementById('send').addEventListener('pointerdown',event=>{if(document.activeElement===input)event.preventDefault();});
  form.addEventListener('message-sent',()=>{document.body.classList.add('has-posted');try{sessionStorage.setItem('tomori-has-posted','1');}catch{}resizeInput();messages.scrollTop=messages.scrollHeight;if(editing)input.focus({preventScroll:true});layout();});
  input.addEventListener('blur',()=>requestAnimationFrame(()=>{if(!form.contains(document.activeElement))finishEditing();}));
  visualViewport?.addEventListener('resize',layout);visualViewport?.addEventListener('scroll',layout);
  window.addEventListener('resize',()=>{if(!mobile.matches)finishEditing();layout();});
  window.addEventListener('scroll',()=>{if(!editing)layout();},{passive:true});
  new ResizeObserver(layout).observe(header);
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  resizeInput();layout();
}
