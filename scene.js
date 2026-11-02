const town=document.getElementById('town');
const windows=[];
[280,310,295,320,280].forEach(height=>{
  const house=document.createElement('div');house.className='house';house.style.setProperty('--building-height',height+'px');
  for(let i=0;i<9;i++){
    const window=document.createElement('button');window.className='window';window.type='button';window.setAttribute('aria-label','おやすみ中の窓');house.append(window);windows.push(window);
  }
  town.append(house);
});
const scene=document.querySelector('.scene');
for(let i=0;i<28;i++){const star=document.createElement('i');star.className='star';star.setAttribute('aria-hidden','true');star.style.left=((i*37)%98)+'%';star.style.top=((i*23)%48)+'%';scene.append(star);}
export {windows};
