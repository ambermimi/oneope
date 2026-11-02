// Server rules enforce the same cooldown, quota and exact-repeat limits.
export function spamProblem(body,previous,now){
  if(/(.)\1{11,}/u.test(body)||((body.match(/https?:\/\//gi)||[]).length>=3))return '同じ文字やリンクの繰り返しを少し減らしてね。';
  if(!previous)return '';
  if(now-previous.lastAt<3000)return 'ひと呼吸おいて、3秒ほど待ってね。';
  if(now-previous.lastAt<60000&&body===previous.lastBody)return '同じメッセージは、1分ほど間をあけてね。';
  if(now-previous.windowStart<60000&&previous.count>=6)return '少しひと休み。1分に6通まで送れます。';
  return '';
}
export function nextGuard(previous,body,messageId,now,timestamp){
  const reset=!previous||now-previous.windowStart>=60000;
  return {windowStart:reset?timestamp:previous.windowStart,count:reset?1:previous.count+1,lastAt:timestamp,lastBody:body,messageId};
}
