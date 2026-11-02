// An original, gentle music-box loop, synthesized locally. No autoplay/downloads.
const MELODY=[60,64,67,64,62,65,69,65,64,67,71,67,62,67,69,67,60,64,69,64,60,65,69,65,62,67,71,69,67,64,62,60];
export function setupMusic(){
  const button=document.getElementById('musicToggle'),status=document.getElementById('musicStatus');
  let context,master,timer,playing=false,starting=false,next=0,step=0;
  const voices=new Set();
  function label(){button.setAttribute('aria-pressed',String(playing));button.textContent=playing?'♫ オルゴールを止める':'♫ オルゴールを聴く';button.disabled=starting;}
  function note(midi,at,duration,volume){
    const envelope=context.createGain();envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(volume,at+.008);envelope.gain.exponentialRampToValueAtTime(.0001,at+duration+1.3);envelope.connect(master);
    let remaining=3;
    [1,2.76,5.4].forEach((harmonic,index)=>{
      const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=440*Math.pow(2,(midi+12-69)/12)*harmonic;gain.gain.value=[.88,.09,.03][index];oscillator.connect(gain);gain.connect(envelope);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();if(!--remaining)envelope.disconnect();};oscillator.start(at);oscillator.stop(at+duration+1.4);
    });
  }
  function schedule(){
    if(!playing)return;
    while(next<context.currentTime+.4){
      note(MELODY[step%MELODY.length],next,.85,.25);
      if(step%4===0)note([48,53,52,55,45,53,55,48][Math.floor(step/4)%8],next,1.6,.10);
      next+=.95;step++;
    }
  }
  function stop(){playing=false;clearInterval(timer);if(context&&master){master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(0,context.currentTime,.02);for(const voice of voices){try{voice.stop(context.currentTime+.08);}catch{}}}label();}
  button.addEventListener('click',async()=>{
    if(playing){stop();status.textContent='オルゴールを止めました。';return;}
    if(starting)return;starting=true;label();
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw Error('unsupported');
      if(!context){context=new Audio();master=context.createGain();master.gain.value=0;master.connect(context.destination);}
      await context.resume();
      if(document.hidden)return;
      playing=true;master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(.11,context.currentTime,.15);next=context.currentTime+.1;step=0;schedule();timer=setInterval(schedule,200);status.textContent='小さな音でオルゴールを流しています。';
    }catch{status.textContent='このブラウザーでは音を再生できませんでした。';stop();}
    finally{starting=false;label();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();status.textContent='ページを離れたため、音を止めました。';}});
  window.addEventListener('pagehide',stop);label();
}
