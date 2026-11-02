export const animals=['うさぎ','こあら','こねこ','こいぬ','ぱんだ','りす','こぐま','ひつじ','ことり','ぺんぎん','らっこ','あざらし','はりねずみ','ももんが','あるぱか','しろくま','きつね','たぬき','こじか','ひよこ','あひる','こがも','ふくろう','すずめ','つばめ','かぴばら','いるか','くじら','こぶた','りくがめ','こやぎ','おっとせい'];
export function displayNameParts(id){
  let hash=2166136261;
  for(const char of String(id)){hash=Math.imul(hash^char.codePointAt(0),16777619)>>>0;}
  return [animals[Math.floor(hash/32)%animals.length]];
}

export function displayName(id){return displayNameParts(id).join('');}
