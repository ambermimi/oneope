// Local encouragement, varied by the random Firebase message ID and stable across redraws.
export const BOT_NAMES=['ともり','こはる'];
const HOUR=3600000;
export function nightStart(time){
  const jst=new Date(time+9*HOUR);
  const hour=jst.getUTCHours();
  if(hour>=5&&hour<21)return null;
  const midnight=Date.UTC(jst.getUTCFullYear(),jst.getUTCMonth(),jst.getUTCDate())-9*HOUR;
  return midnight+(hour<5?-3:21)*HOUR;
}
export function botCount(time,humans){return nightStart(time)===null?0:humans>=5?2:1;}
function hash(text){let n=0;for(const c of text)n=(n*31+c.codePointAt(0))>>>0;return n;}
const sensitive=body=>/死にたい|消えたい|自傷|傷つけそう|殴りそう/.test(body);
export function encouragement(body,seed=0){
  if(sensitive(body))return 'ひとりで抱えず、今は身近な人に連絡してね 🫶';
  let choices;
  if(/授乳|ミルク|おっぱい/.test(body))choices=['授乳おつかれさま 🍼','水分もとってね 🫶','ひと息つけますように 🌷','夜のお世話、ほんとおつかれさま 🌙'];
  else if(/夜泣き|泣き止|泣いて|寝かしつけ|寝ない/.test(body))choices=['大変だ〜、白目 🫠','寝かしつけ、おつかれさま 🌷','そろそろ寝てくれ〜ってなるよね 🥹','肩の力、ちょっと抜いてね 🫶'];
  else if(/疲れ|しんど|つら|辛|限界|不安|孤独|さみし|寂し/.test(body))choices=['ほんと、おつかれさま 🫶','無理しすぎないでね 🌷','今日はもう十分頑張ってるよ 🥹','ここでひと息つこう ☕'];
  else if(/眠れ|寝れ/.test(body))choices=['なかなか眠れないよね 🌙','寝たいのに目がさえちゃうよね 🫠','少しでも休めますように 🌷','ひとまず、ゆっくりしよ 🫶'];
  else if(/おやすみ|寝ます|寝るね/.test(body))choices=['ゆっくり休んでね 🌙','おやすみ、今日もおつかれさま 🫶','ぐっすり眠れますように 🌷','あたたかくして休んでね 🥰'];
  else if(/ありがと|うれし|嬉し|できた|寝た/.test(body))choices=['よかった〜 🥰','ほっとするね 🌷','そのひと息、大事にしてね ☕','うれしいね 🫶'];
  else choices=['ぼちぼち頑張ろう 🫶','今日もおつかれさま 🌷','ひと息つこうね ☕','無理せずいこうね 🌙','自分にもやさしくね 🥰','ゆるりと過ごそう 🫶'];
  return choices[seed%choices.length];
}
export function conversationBusy(messages,at){
  const recent=messages.filter(m=>!m.bot&&typeof m.sender==='string'&&Number.isFinite(m.created)&&m.created>at-120000&&m.created<=at);
  return recent.length>=4&&new Set(recent.map(m=>m.sender)).size>=2;
}
function eligible(message,time){
  const start=nightStart(time);
  return start!==null&&!message.bot&&!message.anonymous&&typeof message.body==='string'&&typeof message.sender==='string'&&Number.isFinite(message.created)&&message.created>=start;
}
export function botLike(message,time){return eligible(message,time)&&!sensitive(message.body)&&message.created+20000<=time;}
export function nextBotDelay(messages,time){
  const future=messages.filter(m=>eligible(m,time)).flatMap(m=>[m.created+20000,...(sensitive(m.body)?[]:[m.created+20000])]).filter(t=>t>time);
  return future.length?Math.min(...future)-time:null;
}
export function botReplies(messages,time,humans){
  const count=botCount(time,humans);if(!count)return [];
  return messages.filter(m=>eligible(m,time)&&m.created+20000<=time&&!conversationBusy(messages,m.created+20000))
    .slice().sort((a,b)=>a.created-b.created||a.sender.localeCompare(b.sender)||a.body.localeCompare(b.body))
    .map(m=>{const seed=hash(m.id||m.sender+m.created+m.body),bot=seed%count;
      return {sender:'bot:'+bot,bot:true,name:BOT_NAMES[bot],body:encouragement(m.body,seed),created:m.created+20000,replyTo:m.sender};});
}
