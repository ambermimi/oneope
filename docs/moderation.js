export const REPORT_THRESHOLD=3;
export function isHidden(record){return record?.status==='hidden'||(record?.status!=='visible'&&(record?.count||0)>=REPORT_THRESHOLD);}
// Deliberately narrow: do not suppress ordinary distress or incidental しね in sentences.
export function languageProblem(body){
  const text=body.normalize('NFKC').trim();
  return /死ね|くたばれ|クタバレ|殺すぞ|ころすぞ|コロスゾ|くそ野郎|クソ野郎|くそやろう|クソヤロウ|糞野郎|きちがい|キチガイ/.test(text)||/^[しシ][ねネ][!！。…]*$/.test(text)?'相手を傷つける言葉を避けて、気持ちを言い換えてみてね。':'';
}
