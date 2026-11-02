
let joined=false,empty=false;const town=document.getElementById('town');let windows=[];
const poses=[
{label:'赤ちゃんを抱っこしてる',svg:'<circle cx="19" cy="15" r="6"/><path d="M14 14Q9 17 12 24L19 22Z"/><path d="M15 23Q23 20 25 30L29 51H10L12 32Z"/><circle cx="29" cy="27" r="4.5"/><path d="M25 29Q34 28 33 36Q26 42 20 34Z"/><path d="M16 28Q21 35 29 33" fill="none" stroke="#493f41" stroke-width="5" stroke-linecap="round"/>'},
{label:'ミルクをあげてる',svg:'<circle cx="17" cy="15" r="6"/><path d="M12 14Q7 19 12 24L18 21Z"/><path d="M13 23Q21 20 23 29L22 39 34 43 34 51H12L10 35Z"/><circle cx="30" cy="29" r="4"/><path d="M23 32Q30 28 34 34L30 39 20 35Z"/><path d="M17 27L23 32 29 32" fill="none" stroke="#493f41" stroke-width="4" stroke-linecap="round"/><path d="M32 25l4-5 3 2-4 5Z"/><path d="M7 31V47H27" fill="none" stroke="#493f41" stroke-width="3"/>'},
{label:'肩にもたれて、ねんね',svg:'<circle cx="22" cy="14" r="6"/><path d="M17 11Q11 14 14 23L22 20Z"/><path d="M17 23Q27 20 29 31L32 51H12L14 31Z"/><circle cx="12" cy="23" r="4.5"/><path d="M9 28Q15 25 19 30L19 39 9 38Z"/><path d="M24 28Q25 37 14 37" fill="none" stroke="#493f41" stroke-width="5" stroke-linecap="round"/>'}
];
[235,270,250,280,230].forEach((h,b)=>{let house=document.createElement('div');house.className='house';house.style.height=h+'px';for(let i=0;i<9;i++){let w=document.createElement('button');let pose=poses[(i+b)%3];w.className='window';w.type='button';w.dataset.on=((i*7+b*3)%11<5)?'1':'0';w.dataset.pose=String((i+b)%3);w.setAttribute('aria-label',pose.label+'（サンプルの窓）');w.innerHTML='<svg viewBox="0 0 44 56" aria-hidden="true">'+pose.svg+'</svg>';w.onclick=()=>{document.getElementById('silhouetteLabel').textContent=w.classList.contains('lit')||w.classList.contains('mine')?pose.label+'。同じ夜を、ここで。':'この窓の灯りは、おやすみ中。';};house.append(w);windows.push(w)}town.append(house)});

const scene=document.querySelector('.scene');
for(let i=0;i<28;i++){const star=document.createElement('i');star.className='star';star.style.left=((i*37)%98)+'%';star.style.top=((i*23)%58)+'%';scene.append(star)}
export {windows,poses};
