export const moods=['ふわふわ','ねむねむ','ほっこり','ぽかぽか','のんびり','まんまる','ゆったり','すやすや','きらきら','にこにこ','ほんわか','もこもこ','うとうと','ころころ','おっとり','ほわほわ','ふんわり','にっこり','のびのび','まったり','ほのぼの','ゆるゆる','とことこ','てくてく','ちょこんと','ぬくぬく','るんるん','つやつや','やさしい','ちいさな','おちゃめな','ごきげんな'];
export const animals=['うさぎ','こあら','こねこ','こいぬ','ぱんだ','りす','こぐま','ひつじ','ことり','ぺんぎん','らっこ','あざらし','はりねずみ','ももんが','あるぱか','しろくま','きつね','たぬき','こじか','ひよこ','あひる','こがも','ふくろう','すずめ','つばめ','かぴばら','いるか','くじら','こぶた','りくがめ','こやぎ','おっとせい'];
export function displayNameParts(id){
  let hash=2166136261;
  for(const char of String(id)){hash=Math.imul(hash^char.codePointAt(0),16777619)>>>0;}
  return [moods[hash%moods.length],animals[Math.floor(hash/moods.length)%animals.length]];
}

export function displayName(id){return displayNameParts(id).join('');}
