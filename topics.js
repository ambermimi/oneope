// Aggregate broad themes in memory. Never return message text, IDs, names or timestamps.
export const TOPICS=[
 ['sleep','夜泣き・寝かしつけ・睡眠',/夜泣|泣[いきく]|寝|眠|夜中.*起|起きちゃ|起こされ|睡眠/],
 ['feeding','授乳・ミルク・食事',/授乳|ミルク|おっぱい|母乳|離乳食|食事|ごはん|ご飯|ランチ|食べ/],
 ['development','赤ちゃんの成長・育児',/新生児|成長|発達|[ヶかカケ]月|歳|育児|子育て|赤ちゃん|娘|息子|おむつ|オムツ|抱っこ/],
 ['rest','疲れ・気持ち・休息',/疲|しんど|つら|辛|大変|不安|寂|さみし|孤独|鬱|うつ|ぼろぼろ|休|ひと息|息抜き|気持ち|限界/],
 ['support','励まし・共感・助言',/おつかれ|お疲れ|頑張|がんば|踏ん張|無理|大丈夫|頼って|甘やか|応援|わかる|分かる|ください|してね|しましょう/],
 ['greetings','あいさつ・感謝',/ありがと|おやすみ|おはよう|こんばんは|こんにちは|やほ|よろしく/],
 ['daily','日常の雑談',/テレビ|ドラマ|映画|見た|買[ういっ]|仕事|趣味|音楽|天気|買い物|出かけ/],
 ['other','その他・判別できない',null]
];
export function summarizeTopics(messages){
 const topics=Object.fromEntries(TOPICS.map(([key])=>[key,0]));let total=0;
 for(const m of messages){if(m.bot||typeof m.body!=='string')continue;total++;let found=false;
  const body=m.body.normalize('NFKC');
  for(const [key,,pattern] of TOPICS){if(pattern?.test(body)){topics[key]++;found=true;}}
  if(!found)topics.other++;
 }
 return {version:1,total,topics};
}
export function combineSummaries(summaries){
 const combined=summarizeTopics([]);
 for(const summary of summaries){if(summary?.version!==1)continue;combined.total+=summary.total||0;for(const [key] of TOPICS)combined.topics[key]+=summary.topics?.[key]||0;}
 return combined;
}
export function describeTopics(summary){return '対象 '+summary.total+'件\n'+TOPICS.map(([key,label])=>label+'：'+summary.topics[key]+'件').join('\n');}
