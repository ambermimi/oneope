// Count one anonymous browser identity per Japanese calendar day, separately from chat identities.
export const visitDay=time=>Math.floor((time+9*3600000)/86400000);
export async function setupVisits({initializeApp,authApi,api,config}){
 const output=document.getElementById('yesterdayVisitors');
 try{
  const app=initializeApp(config,'visitor-statistics'),auth=authApi.getAuth(app),db=api.getDatabase(app);
  await authApi.setPersistence(auth,authApi.browserLocalPersistence);
  await auth.authStateReady();
  const user=auth.currentUser||(await authApi.signInAnonymously(auth)).user;
  let day=null,stop=null,busy=false,offset=0;
  api.onValue(api.ref(db,'.info/serverTimeOffset'),snap=>{offset=snap.val()||0;});
  async function refresh(){
   if(document.hidden||busy)return;busy=true;
   try{
    const current=visitDay(Date.now()+offset);
    if(day!==current){
     stop?.();day=current;output.textContent='昨日の来訪人数は集計準備中です';
     const started=(await api.get(api.ref(db,'visitorStatsStartedAt'))).val();
     if(typeof started==='number'&&current-1>=visitDay(started)){
      stop=api.onValue(api.ref(db,'visitDays/'+(current-1)+'/count'),snapshot=>{output.textContent='昨日は'+(snapshot.val()||0)+'人のママが来ました';},()=>{output.textContent='昨日の来訪人数を読み込めませんでした';});
     }
    }
    const base='visitDays/'+current,member=base+'/members/'+user.uid;
    if(!(await api.get(api.ref(db,member))).exists()){
     // Rules couple this increment to the first visit for this identity and day.
     try{await api.update(api.ref(db),{[member]:true,[base+'/count']:api.increment(1)});}
     catch(e){if(!(await api.get(api.ref(db,member))).exists())throw e;}
    }
   }catch{ /* Statistics failure must never interrupt participation. */ }
   finally{busy=false;}
  }
  await refresh();setInterval(refresh,60000);
  document.addEventListener('visibilitychange',refresh);
 }catch{output.textContent='昨日の来訪人数は集計準備中です';}
}
