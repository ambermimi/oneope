// Preserve the inline position, moving only when the keyboard would cover Send.
export function setupComposer(){
  const form=document.getElementById('chatForm'),input=document.getElementById('chatText');
  const slot=form.parentElement,close=document.getElementById('closeComposer');
  const mobile=window.matchMedia('(max-width: 700px)');
  let editing=false,frame;
  function undock(){
    form.classList.remove('is-composing');
    for(const key of ['top','left','width'])form.style.removeProperty(key);
    slot.style.removeProperty('min-height');
  }
  function reset(){editing=false;undock();}
  function position(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      if(!editing||!mobile.matches){if(!mobile.matches)reset();return;}
      const viewport=window.visualViewport,rect=slot.getBoundingClientRect();
      const top=viewport?.offsetTop||0,bottom=top+(viewport?.height||innerHeight)-8;
      const height=form.offsetHeight;
      if(rect.top>=top&&rect.top+height<=bottom){undock();return;}
      slot.style.minHeight=height+'px';
      form.style.width=rect.width+'px';form.style.left=rect.left+'px';
      form.style.top=Math.max(top,Math.min(rect.top,bottom-height))+'px';
      form.classList.add('is-composing');
    });
  }
  input.addEventListener('focus',()=>{if(mobile.matches){editing=true;position();}});
  form.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(!form.contains(document.activeElement))reset();}));
  form.addEventListener('message-sent',()=>{
    // Release the keyboard without scrolling the page to a different chat section.
    document.activeElement?.blur();reset();
  });
  close.addEventListener('click',()=>{input.blur();close.blur();reset();});
  window.visualViewport?.addEventListener('resize',position);
  window.visualViewport?.addEventListener('scroll',position);
  window.addEventListener('resize',position);
  new ResizeObserver(()=>{if(editing)position();}).observe(form);
  input.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&!event.isComposing){event.preventDefault();form.requestSubmit();}
  });
}
