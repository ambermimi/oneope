// Local, deterministic encouragement. Never creates Firebase users or messages.
export const BOT_NAMES=['ともり','こはる'];
const HOUR=3600000;
export function nightStart(time){
  const jst=new Date(time+9*HOUR);
  const hour=jst.getUTCHours();
  if(hour>=5&&hour<22)return null;
  const midnight=Date.UTC(jst.getUTCFullYear(),jst.getUTCMonth(),jst.getUTCDate())-9*HOUR;
  return midnight+(hour<5?-2:22)*HOUR;
}
export function botCount(time,humans){return nightStart(time)===null?0:humans>=5?2:1;}
function hash(text){let n=0;for(const c of text)n=(n*31+c.codePointAt(0))>>>0;return n;}
export function encouragement(body,seed=0){
  if(/死にたい|消えたい|自傷|傷つけそう|殴りそう/.test(body))return 'ひとりで抱えなくて大丈夫。今は身近な人に連絡して、そばにいてもらってね。危険が迫っているときは、地域の緊急窓口に助けを求めてください。';
  if(/授乳|ミルク|おっぱい/.test(body))return ['🍼 夜のお世話、おつかれさま。あなたも、ひと息つけますように。','🌷 赤ちゃんのお世話をしているあなたにも、やさしい時間がありますように。'][seed%2];
  if(/夜泣き|泣き止|泣いて|寝かしつけ|寝ない/.test(body))return ['🌙 長い夜のお世話、おつかれさま。全部うまくできなくても大丈夫。','🫶 少しでも肩の力を抜ける時間が、ありますように。'][seed%2];
  if(/疲れ|疲れた|しんど|つら|辛|限界|不安|孤独|さみし|寂し/.test(body))return ['🫶 しんどい気持ち、ここに置いていってね。頼れる人に「手伝って」と伝えてもいいんだよ。','🌷 今夜は、できたことをひとつだけ。自分にもやさしくしてあげてね。'][seed%2];
  if(/眠れ|寝れ/.test(body))return '☾ 眠れない夜もあるよね。ここで、少しひと息ついていってね。';
  if(/おやすみ|寝ます|寝るね/.test(body))return '🌙 おやすみなさい。穏やかな時間になりますように。';
  if(/ありがと|うれし|嬉し|できた|寝た/.test(body))return '🌷 🫶';
  return ['🫶 今夜も、おつかれさま。返事はしなくて大丈夫だよ。','🌙 あなたにも、ほっとできる時間がありますように。','☾ 🫶'][seed%3];
}
export function botReplies(messages,time,humans){
  const count=botCount(time,humans),start=nightStart(time);
  if(!count)return [];
  const sorted=messages.filter(m=>typeof m.body==='string'&&typeof m.sender==='string'&&Number.isFinite(m.created)&&m.created>=start&&m.created+2500<=time)
    .slice().sort((a,b)=>a.created-b.created||a.sender.localeCompare(b.sender)||a.body.localeCompare(b.body));
  const result=[];let last=-Infinity;
  for(const m of sorted){
    // At most one reply per minute for the entire room; both bots share this limit.
    if(m.created-last<60000)continue;
    last=m.created;
    const seed=hash(m.sender+m.created+m.body),bot=result.length%count;
    result.push({sender:'bot:'+bot,bot:true,name:BOT_NAMES[bot],body:encouragement(m.body,seed),created:m.created+2500,replyTo:m.sender});
  }
  return result;
}
