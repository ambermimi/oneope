import {setupSky} from './sky.js?v=20261102-room4';
const town=document.getElementById('town');
const windows=[];
[280,310,295,320,280].forEach(height=>{
  const house=document.createElement('div');house.className='house';house.style.setProperty('--building-height',height+'px');
  for(let i=0;i<9;i++){
    const window=document.createElement('button');window.className='window';window.type='button';window.setAttribute('aria-label','おやすみ中の窓');house.append(window);windows.push(window);
  }
  town.append(house);
});
setupSky();
export {windows};
