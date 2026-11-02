// Server rules enforce the same cooldown, quota and exact-repeat limits.
export function spamProblem(body,previous,now){
  if(/(.)\1{11,}/u.test(body)||((body.match(/https?:\/\//gi)||[]).length>=3))return '同じ文字やリンクの繰り返しを少し減らしてね。';
  if(!previous)return '';
  if(now-previous.lastAt<1000)return 'ひと呼吸おいて、あと'+Math.max(1,Math.ceil((1000-now+previous.lastAt)/1000))+'秒待ってね。';
  if(now-previous.lastAt<15000&&body===previous.lastBody)return '同じメッセージは、あと'+Math.max(1,Math.ceil((15000-now+previous.lastAt)/1000))+'秒待ってね。';
  if(now-previous.windowStart<60000&&previous.count>=12)return '少しひと休み。あと'+Math.max(1,Math.ceil((60000-now+previous.windowStart)/1000))+'秒でまた送れます。';
  return '';
}
export function nextGuard(previous,body,messageId,now,timestamp){
  const reset=!previous||now-previous.windowStart>=60000;
  return {windowStart:reset?timestamp:previous.windowStart,count:reset?1:previous.count+1,lastAt:timestamp,lastBody:body,messageId};
}
