import SunCalc from './vendor/suncalc.js?v=20261102-room4';
// Tokyo reference; date selection is explicitly JST, independent of device timezone.
export function skyState(date=new Date()){
  const day=new Date(+date+9*3600000).toISOString().slice(0,10);
  const times=SunCalc.getTimes(new Date(day+'T12:00:00+09:00'),35.6762,139.6503);
  const t=+date,minute=60000,clamp=x=>Math.max(0,Math.min(1,x));
  const morning=clamp((t-(+times.sunrise-45*minute))/(75*minute));
  const evening=clamp((+times.sunset+35*minute-t)/(65*minute));
  const daylight=Math.min(morning,evening);
  const glow=clamp(1-Math.abs(t-+times.sunrise)/(60*minute));
  return {sunrise:times.sunrise,sunset:times.sunset,daylight,glow,stars:1-daylight};
}
export function setupSky(){
  const scene=document.querySelector('.scene');
  const sky=document.createElementNS('http://www.w3.org/2000/svg','svg');
  sky.classList.add('constellation-sky');sky.setAttribute('viewBox','0 0 800 220');sky.setAttribute('preserveAspectRatio','xMidYMid meet');sky.setAttribute('aria-hidden','true');
  // Original schematic drawings of Cassiopeia's W and Orion's main stars.
  // Relative figures are recognizable; this composition is not a directional sky chart.
  const figures=[{points:[[116,45,1.7],[143,84,2],[173,57,2.2],[205,89,1.6],[233,38,1.5]],lines:[[0,1,2,3,4]]},{points:[[563,37,2.5],[641,47,2.1],[589,101,1.7],[607,105,1.9],[625,109,1.6],[574,163,1.7],[646,169,2.6],[606,132,1.1],[604,145,1]],lines:[[0,1,4,6,5,2,0],[2,3,4],[3,7,8]]}];
  let markup='<defs><radialGradient id="starHalo"><stop stop-color="#f4e6c8" stop-opacity=".34"/><stop offset="1" stop-color="#f4e6c8" stop-opacity="0"/></radialGradient></defs>';
  for(let i=0;i<62;i++){const x=(i*137.508+23)%800,y=(i*73.17+13)%215;markup+='<circle cx="'+x+'" cy="'+y+'" r="'+(.45+(i%3)*.2)+'" fill="#c6d6ec" opacity="'+(.25+(i%5)*.1)+'"/>';}
  for(const figure of figures){for(const ids of figure.lines)markup+='<polyline points="'+ids.map(i=>figure.points[i].slice(0,2).join(',')).join(' ')+'" fill="none" stroke="#b8cce0" stroke-width=".7" opacity=".2"/>';
    for(const [x,y,r] of figure.points)markup+='<circle cx="'+x+'" cy="'+y+'" r="'+r*5+'" fill="url(#starHalo)"/><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#f2e9d9"/>';
  }
  sky.innerHTML=markup;scene.prepend(sky);
  const note=document.createElement('div');note.className='sky-note';scene.after(note);
  function update(){const state=skyState();scene.style.setProperty('--daylight',state.daylight.toFixed(3));scene.style.setProperty('--dawn-glow',state.glow.toFixed(3));scene.style.setProperty('--star-opacity',state.stars.toFixed(3));note.textContent='東京の日の出 '+state.sunrise.toLocaleTimeString('ja-JP',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit'})+' · 日本で見える星座をモチーフに';}
  update();setInterval(update,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
}
