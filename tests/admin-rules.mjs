import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:9000',ns='demo-tomori-default-rtdb';
async function call(path,method,body,uid,claims={}){
 const q=new URLSearchParams({ns});if(uid)q.set('auth_variable_override',JSON.stringify({uid,token:{sub:uid,...claims}}));
 return fetch(base+'/'+path+'.json?'+q,{method,headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
}
const rules=JSON.parse(fs.readFileSync('firebase/database.rules.json'));
assert.equal((await call('.settings/rules','PUT',rules)).status,200);
assert.equal((await call('','PUT',{operators:{operator:true},chat:{old:{sender:'reader',body:'old',created:1},new:{sender:'reader',body:'new',created:2}},reactions:{old:{reader:'💛'}},reports:{preserved:{reader:{messageId:'old',created:1}}},moderation:{preserved:{count:1}}})).status,200);
for(const uid of ['reader','operator']){
 assert.equal((await call('operators/'+uid,'GET',undefined,uid)).status,200);
 assert.equal((await call('operators/'+uid,'PUT',true,uid)).status,401,'cannot self-grant');
}
assert.equal((await call('operators/operator','GET',undefined,'reader')).status,401);
assert.equal((await call('chat','GET',undefined,'reader')).status,401);
assert.equal((await call('chat','GET',undefined,'operator')).status,200);
assert.equal((await call('chat/old','DELETE',undefined,'reader')).status,401);
assert.equal((await call('reactions/old','DELETE',undefined,'reader')).status,401);
assert.equal((await call('chat/old','PUT',{sender:'operator',body:'changed',created:1},'operator')).status,401);
assert.equal((await call('','PATCH',{'chat/old':null,'reactions/old':null},'operator')).status,200);
const data=await(await call('','GET')).json();assert.ok(!data.chat.old);assert.ok(data.chat.new);assert.ok(!data.reactions);assert.ok(data.reports.preserved);assert.equal(data.moderation.preserved.count,1);
assert.equal((await call('operators/operator','DELETE')).status,200);
assert.equal((await call('chat/new','DELETE',undefined,'operator')).status,401,'revoked operator denied');
console.log('PASS: operator deletion, ordinary-user denial, self-grant denial, write restrictions, retained new message and reports, revoked access');

await call('operatorConfig','PUT',{email:'operator@example.com'});await call('operatorAccess','PUT',true);
const verified={email:'operator@example.com',email_verified:true,firebase:{sign_in_provider:'google.com'}};
assert.equal((await call('operatorAccess','GET',undefined,'email-user',verified)).status,200);
assert.equal((await call('chat','GET',undefined,'email-user',verified)).status,200);
assert.equal((await call('operatorAccess','GET',undefined,'email-user',{...verified,email_verified:false})).status,401);
assert.equal((await call('operatorAccess','GET',undefined,'email-user',{...verified,email:'other@example.com'})).status,401);
assert.equal((await call('operatorAccess','GET',undefined,'email-user',{...verified,firebase:{sign_in_provider:'anonymous'}})).status,401);
assert.equal((await call('operatorConfig','PUT',{email:'other@example.com'},'email-user',verified)).status,401);
assert.equal((await call('operatorConfig','GET',undefined,'reader')).status,401);
assert.equal((await call('chat/new','DELETE',undefined,'email-user',verified)).status,200);
console.log('PASS: approved verified Google email only; private operator configuration');
