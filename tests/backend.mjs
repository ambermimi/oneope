// Explicit integration test against Tomori's dedicated backend; cleans up its fixtures.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {firebaseConfig as config} from '../docs/firebase-config.js';
assert.equal(process.env.TOMORI_TEST_PROJECT,config.projectId,'Set TOMORI_TEST_PROJECT to authorize integration fixtures.');
const authURL='https://identitytoolkit.googleapis.com/v1/accounts:';
async function auth(action,body){const r=await fetch(authURL+action+'?key='+config.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,action);return r.json();}
const users=[];const keys=[];let passed=0;
const timestamp={'.sv':'timestamp'};
function guarded(payload){for(const [path,msg] of Object.entries(payload)){if(path.startsWith('chat/')&&msg?.sender&&!payload['sendGuards/'+msg.sender])payload['sendGuards/'+msg.sender]={windowStart:timestamp,count:1,lastAt:timestamp,lastBody:msg.body,messageId:path.slice(5)};}return payload;}
async function call(path,method,body,token,query=''){
 const url=new URL(config.databaseURL+'/'+path+'.json');if(token)url.searchParams.set('auth',token);
 for(const [k,v] of new URLSearchParams(query))url.searchParams.set(k,v);
 return fetch(url,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(path===''&&method==='PATCH'?guarded(body):body)});
}
function check(r,status,label){assert.equal(r.status,status,label);console.log('PASS',label);passed++;}
try{
 const a=await auth('signUp',{returnSecureToken:true});users.push(a);
 const b=await auth('signUp',{returnSecureToken:true});users.push(b);
 check(await call('presence','GET'),401,'anonymous HTTP reader denied');
 check(await call('presence/'+a.localId,'PUT',{status:'眠れない',seen:timestamp},a.idToken),200,'own presence accepted');
 check(await call('presence/'+a.localId,'PUT',{status:'疲れたよ',seen:timestamp},b.idToken),401,'another user cannot alter presence');
 check(await call('presence/'+a.localId,'PUT',{status:'invalid',seen:timestamp},a.idToken),401,'invalid status denied');
 const key='test-'+crypto.randomUUID();keys.push(key);
 const payload={['chat/'+key]:{sender:a.localId,body:'接続テスト\nverification',created:timestamp},['limits/'+a.localId]:timestamp};
 check(await call('','PATCH',payload,a.idToken),200,'valid multiline message accepted');
 check(await call('chat/'+key,'PATCH',{body:'edited'},a.idToken),401,'message editing denied');
 const bad='test-'+crypto.randomUUID();keys.push(bad);
 check(await call('','PATCH',{['chat/'+bad]:{sender:b.localId,body:'x'.repeat(301),created:timestamp},['limits/'+b.localId]:timestamp},b.idToken),401,'oversized message denied');
 check(await call('','PATCH',{['chat/'+bad]:{sender:a.localId,body:'spoof',created:timestamp},['limits/'+b.localId]:timestamp},b.idToken),401,'sender spoofing denied');
 check(await call('chat','GET',undefined,b.idToken),401,'unbounded chat read denied');
 const q=new URLSearchParams({orderBy:'"created"',startAt:String(Math.floor(Date.now()/3600000)*3600000-82800000),limitToLast:'100'});
 const shared=await call('chat','GET',undefined,b.idToken,q.toString());check(shared,200,'bounded chat read accepted');assert.equal((await shared.json())[key].body,payload['chat/'+key].body);
 const rateKey='test-'+crypto.randomUUID();keys.push(rateKey);
 const p={['chat/'+bad]:{sender:b.localId,body:'first',created:timestamp},['limits/'+b.localId]:timestamp};
 check(await call('','PATCH',p,b.idToken),200,'second user can send');
 check(await call('','PATCH',{['chat/'+rateKey]:{sender:b.localId,body:'too fast',created:timestamp},['limits/'+b.localId]:timestamp},b.idToken),401,'rapid repeat message denied');

 check(await call('reactions/'+key+'/'+b.localId,'PUT','🫶',b.idToken),200,'positive reaction accepted');
 check(await call('reactions/'+key,'GET',undefined,a.idToken),200,'message author sees reactions');
 check(await call('reactions/'+key+'/'+b.localId,'PUT','👎',b.idToken),401,'negative emoji denied');
 check(await call('reactions/'+key+'/'+b.localId,'PUT','arbitrary text',b.idToken),401,'non-emoji reaction denied');
 check(await call('reactions/'+key+'/'+b.localId,'PUT','💛',a.idToken),401,'another user cannot change reaction');
 check(await call('reactions/'+key+'/'+a.localId,'PUT','💛',a.idToken),401,'self-reaction denied');
 check(await call('reactions/missing-message/'+b.localId,'PUT','💛',b.idToken),401,'reaction to missing message denied');
 check(await call('reactions/'+key+'/'+b.localId,'PUT','🌷',b.idToken),200,'own reaction can change');
 check(await call('reactions/'+key+'/'+b.localId,'DELETE',undefined,b.idToken),200,'own reaction can be removed');
 check(await call('reactions/'+key,'GET'),401,'unauthenticated reaction read denied');

 const guardPath='sendGuards/'+b.localId;
 const seed=state=>execFileSync('firebase',['database:update','/','--data',JSON.stringify({[guardPath]:state,['limits/'+b.localId]:Date.now()-5000}),'--force','--project',config.projectId],{stdio:'pipe'});
 const state={windowStart:Date.now()-20000,count:12,lastAt:Date.now()-5000,lastBody:'previous',messageId:bad};
 seed(state);
 check(await call('','PATCH',{['chat/'+rateKey]:{sender:b.localId,body:'quota bypass',created:timestamp},['limits/'+b.localId]:timestamp},b.idToken),401,'cannot reset an active quota window');
 check(await call(guardPath,'PUT',{...state,count:13,lastAt:timestamp},b.idToken),401,'thirteenth message quota denied');
 seed({...state,count:1,lastBody:'duplicate'});
 check(await call(guardPath,'PUT',{...state,count:2,lastBody:'duplicate',lastAt:timestamp},b.idToken),401,'exact duplicate within a minute denied');
 check(await call(guardPath,'DELETE',undefined,b.idToken),401,'cannot clear own spam history');
 check(await call(guardPath,'GET',undefined,a.idToken),401,'other users cannot read spam history');
 seed({...state,windowStart:Date.now()-70000,lastAt:Date.now()-65000});
 check(await call('','PATCH',{['chat/'+rateKey]:{sender:b.localId,body:'おつかれさま',anonymous:true,created:timestamp},['limits/'+b.localId]:timestamp},b.idToken),200,'quota resets after a minute and anonymous greeting accepted');

 // Use exactly the same nextGuard helper as the page for a normal second send.
 const {nextGuard}=await import('../docs/spam.js');
 const normalKey='test-'+crypto.randomUUID();keys.push(normalKey);
 const previous={windowStart:Date.now()-20000,count:1,lastAt:Date.now()-5000,lastBody:'older',messageId:bad};seed(previous);
 check(await call('','PATCH',{['chat/'+normalKey]:{sender:b.localId,body:'normal second message',created:timestamp},['limits/'+b.localId]:timestamp,['sendGuards/'+b.localId]:nextGuard(previous,'normal second message',normalKey,Date.now(),timestamp)},b.idToken),200,'normal sequential message preserves window and increments once');
 const c=await auth('signUp',{returnSecureToken:true});users.push(c);
 const d=await auth('signUp',{returnSecureToken:true});users.push(d);
 const languageKey='test-'+crypto.randomUUID();keys.push(languageKey);
 check(await call('','PATCH',{['chat/'+languageKey]:{sender:c.localId,body:'死ね',created:timestamp},['limits/'+c.localId]:timestamp},c.idToken),401,'Japanese abuse blocked by server');
 check(await call('','PATCH',{['chat/'+languageKey]:{sender:c.localId,body:'しんどい、死にたいくらい疲れた',created:timestamp},['limits/'+c.localId]:timestamp},c.idToken),200,'distress language remains allowed');
 async function report(user,count){return call('','PATCH',{['reports/'+a.localId+'/'+user.localId]:{messageId:key,created:timestamp},['moderation/'+a.localId+'/count']:count},user.idToken);}
 check(await report(b,1),200,'first report counted');
 check(await report(b,2),401,'duplicate reporter cannot increment count');
 check(await call('moderation/'+a.localId+'/count','PUT',3,c.idToken),401,'cannot fabricate report count');
 check(await call('moderation/'+a.localId+'/status','PUT','visible',a.idToken),401,'user cannot override moderation');
 check(await report(c,2),200,'second unique report counted');
 check(await report(d,3),200,'third unique report counted');
 check(await call('reports/'+a.localId+'/'+b.localId,'GET',undefined,c.idToken),401,'reporter identity private to reporter and administrator');
 check(await call('reports/'+a.localId+'/'+b.localId,'DELETE',undefined,b.idToken),401,'cannot erase report to vote again');
 const hiddenKey='test-'+crypto.randomUUID();keys.push(hiddenKey);
 execFileSync('firebase',['database:update','/','--data',JSON.stringify({['limits/'+a.localId]:Date.now()-5000,['sendGuards/'+a.localId]:null}),'--force','--project',config.projectId],{stdio:'pipe'});
 const hiddenPayload={['chat/'+hiddenKey]:{sender:a.localId,body:'review gate test',created:timestamp},['limits/'+a.localId]:timestamp};
 check(await call('','PATCH',hiddenPayload,a.idToken),401,'three reports prevent further posting pending review');
 execFileSync('firebase',['database:update','/','--data',JSON.stringify({['moderation/'+a.localId+'/status']:'visible'}),'--force','--project',config.projectId],{stdio:'pipe'});
 check(await call('','PATCH',hiddenPayload,a.idToken),200,'administrator can restore visibility and posting');
 console.log(passed+' checks passed');
}catch(e){console.error(e.message);process.exitCode=1;}finally{
 const cleanup=Object.fromEntries([...keys.flatMap(k=>[['chat/'+k,null],['reactions/'+k,null]]),...users.flatMap(u=>[['presence/'+u.localId,null],['limits/'+u.localId,null],['sendGuards/'+u.localId,null],['moderation/'+u.localId,null],['reports/'+u.localId,null]])]);
 execFileSync('firebase',['database:update','/','--data',JSON.stringify(cleanup),'--force','--project',config.projectId],{stdio:'pipe'});
 for(const u of users)await auth('delete',{idToken:u.idToken});
 console.log('Test messages, presence and anonymous test accounts removed.');
}
