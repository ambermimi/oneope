const moods=['ふわふわ','ねむねむ','ほっこり','ぽかぽか','のんびり','まんまる','ゆったり','すやすや','きらきら','にこにこ','ほんわか','もこもこ','うとうと','ころころ','おっとり','ほわほわ'];
const animals=['うさぎ','こあら','こねこ','こいぬ','ぱんだ','りす','こぐま','ひつじ','ことり','ぺんぎん','らっこ','あざらし','はりねずみ','ももんが','あるぱか','しろくま'];
export function displayName(id){
  let hash=2166136261;
  for(const char of String(id)){hash=Math.imul(hash^char.codePointAt(0),16777619)>>>0;}
  return moods[hash%moods.length]+animals[Math.floor(hash/moods.length)%animals.length];
}
