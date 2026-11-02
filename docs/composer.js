// Keep the complete composer inside the visual viewport when a mobile keyboard opens.
export function setupComposer(){
  const form=document.getElementById('chatForm'),input=document.getElementById('chatText');
  const slot=form.parentElement,close=document.getElementById('closeComposer');
  const mobile=window.matchMedia('(max-width: 700px)');
  let editing=false,frame;
  function reset(){
    editing=false;form.classList.remove('is-composing');
    for(const key of ['top','left','width'])form.style.removeProperty(key);
    slot.style.removeProperty('min-height');
  }
  function position(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      if(!editing||!mobile.matches){if(!mobile.matches)reset();return;}
      const viewport=window.visualViewport;
      const height=viewport?.height||window.innerHeight;
      form.style.width=Math.max(240,(viewport?.width||window.innerWidth)-24)+'px';
      form.style.left=((viewport?.offsetLeft||0)+12)+'px';
      form.style.top=Math.max(viewport?.offsetTop||0,(viewport?.offsetTop||0)+height-form.offsetHeight-12)+'px';
    });
  }
  input.addEventListener('focus',()=>{
    if(!mobile.matches)return;
    slot.style.minHeight=form.offsetHeight+'px';editing=true;
    form.classList.add('is-composing');position();
  });
  form.addEventListener('focusout',()=>requestAnimationFrame(()=>{
    if(!form.contains(document.activeElement))reset();
  }));
  close.addEventListener('click',()=>{input.blur();close.blur();reset();});
  window.visualViewport?.addEventListener('resize',position);
  window.visualViewport?.addEventListener('scroll',position);
  window.addEventListener('resize',position);
  new ResizeObserver(()=>{if(editing)position();}).observe(form);
  // Enter remains a newline; never submit while composing Japanese text.
  input.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&!event.isComposing){event.preventDefault();form.requestSubmit();}
  });
}
