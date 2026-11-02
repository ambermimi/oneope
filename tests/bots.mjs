import {strict as assert} from 'node:assert';
import {botCount,botReplies,botLike,nextBotDelay,encouragement,conversationBusy} from '../docs/bots.js';
const t=s=>Date.parse(s+'+09:00');
assert.equal(botCount(t('2026-11-02T20:59:59'),0),0);
assert.equal(botCount(t('2026-11-02T21:00:00'),0),1);
assert.equal(botCount(t('2026-11-03T04:59:59'),4),1);
assert.equal(botCount(t('2026-11-03T05:00:00'),50),0);
assert.equal(botCount(t('2026-11-02T23:00:00'),5),2);
const created=t('2026-11-02T21:00:00'),m={id:'a',sender:'person',body:'夜泣き中',created};
assert.equal(botReplies([m],created+19999,1).length,0);
assert.equal(botReplies([m],created+20000,1).length,1);
assert.equal(botReplies([m],created+20000,1)[0].created,created+20000);
assert.equal(botLike(m,created+19999),false);
assert.equal(botLike(m,created+20000),true);
assert.equal(nextBotDelay([m],created),20000);
assert.equal(nextBotDelay([m],created+20000),null);
assert.equal(nextBotDelay([m],created+20000),null);
const messages=[m,{...m,id:'b',sender:'second',created:created+1000}];
assert.equal(botReplies(messages,created+21000,5).length,1);
assert.deepEqual(botReplies([...messages].reverse(),created+21000,5),botReplies(messages,created+21000,5));
assert.equal(botReplies([{...m,anonymous:true},{...m,bot:true}],created+20000,1).length,0);
assert.equal(botLike({...m,anonymous:true},created+20000),false);
assert.equal(botReplies([m],t('2026-11-03T05:00:00'),1).length,0);
assert.equal(botLike(m,t('2026-11-03T05:00:00')),false);
assert.equal(botReplies([{...m,created:created-1}],created+20000,1).length,0);
assert.equal(botLike({...m,body:'死にたい'},created+20000),false);
assert.match(encouragement('死にたい'),/連絡/);
for(const body of ['授乳中','夜泣き中','疲れた','眠れない','おやすみ','ありがとう','頑張ろう','死にたい']){
 for(let seed=0;seed<6;seed++){
  const text=encouragement(body,seed);
  assert.equal([...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(text)].filter(s=>/\p{Extended_Pictographic}/u.test(s.segment)).length,1,text);
  assert(text.length<45,text);
 }
}
console.log('PASS 21–05 JST, replies and likes at 20s, scheduling, stable ordering, exclusions and one-emoji short replies');

const lively=[0,1000,2000,3000].map((offset,i)=>({...m,id:'busy-'+i,sender:i%2?'second':'first',created:created+offset}));
assert.equal(conversationBusy(lively,created+23000),true);
assert.equal(botReplies(lively,created+23000,2).length,0);
assert.equal(botReplies(lively,created+240000,2).length,0,'suppressed replies must not arrive in a backlog');
assert.equal(conversationBusy(lively.map(m=>({...m,sender:'one'})),created+23000),false);
assert.equal(conversationBusy(lively.slice(0,3),created+23000),false);
assert.equal(conversationBusy(lively,created+123001),false);
const later={...m,id:'quiet-later',created:created+240000};
assert.equal(botReplies([...lively,later],created+260000,2).length,1,'resume for a new post after chat quiets');
const future=lively.map(m=>({...m,created:m.created+30000}));
assert.equal(botReplies([m,...future],created+60000,2).some(r=>r.created===created+20000),true,'later chatter must not erase an earlier reply');
const choices=Array.from({length:40},(_,i)=>botReplies([{...m,id:'random-message-'+i}],created+20000,1)[0].body);
assert(new Set(choices).size>=3,'random message IDs vary short replies');
assert.equal(botReplies([m],created+20000,1)[0].body,botReplies([m],created+30000,1)[0].body,'redraws retain the chosen reply');
console.log('PASS busy conversations suppress replies without a backlog; new quiet posts resume and replies vary stably');

const quietPosts=Array.from({length:30},(_,i)=>({...m,id:"quiet-"+i,created:created+i*180000}));
assert.equal(botReplies(quietPosts,created+30*180000,5).length,1,"only one bot reply in the entire rendered conversation");
assert.equal(botReplies(quietPosts,created+30*180000,5)[0].created,quietPosts.at(-1).created+20000);
