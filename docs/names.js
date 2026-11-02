export const moods=['ふわふわ','ねむねむ','ほっこり','ぽかぽか','のんびり','まんまる','ゆったり','すやすや','きらきら','にこにこ','ほんわか','もこもこ','うとうと','ころころ','おっとり','ほわほわ','ふんわり','にっこり','のびのび','まったり','ほのぼの','ゆるゆる','とことこ','てくてく','ちょこんと','ぬくぬく','るんるん','つやつや','やさしい','ちいさな','おちゃめな','ごきげんな'];
export const animals=['うさぎ','こあら','こねこ','こいぬ','ぱんだ','りす','こぐま','ひつじ','ことり','ぺんぎん','らっこ','あざらし','はりねずみ','ももんが','あるぱか','しろくま','きつね','たぬき','こじか','ひよこ','あひる','こがも','ふくろう','すずめ','つばめ','かぴばら','いるか','くじら','こぶた','りくがめ','こやぎ','おっとせい'];
export function nicknameCode(id){
  let hash=2166136261;
  for(const char of String(id)){hash=Math.imul(hash^char.codePointAt(0),16777619)>>>0;}
  return hash%(moods.length*animals.length);
}

export const validNickname=code=>Number.isInteger(code)&&code>=0&&code<moods.length*animals.length;
export function displayNameParts(id,code){const n=validNickname(code)?code:nicknameCode(id);return [moods[n%moods.length],animals[Math.floor(n/moods.length)]];}
export function displayName(id,code){return displayNameParts(id,code).join('');}
export function readNicknameCookie(cookie){const value=cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith('okitell_nickname='))?.split('=')[1];if(!value||!/^\d{1,4}$/.test(value))return null;const code=Number(value);return validNickname(code)?code:null;}
export function nicknameCookie(code,remember){return 'okitell_nickname='+(remember?code:'')+'; Path=/; Max-Age='+(remember?31536000:0)+'; SameSite=Lax; Secure';}

