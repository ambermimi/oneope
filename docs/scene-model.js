export const OWN_WINDOW=19; // Central building, first row, middle column.
export const OTHER_WINDOWS=[18,20,21,22,23,24,25,26,...Array.from({length:9},(_,i)=>9+i),...Array.from({length:9},(_,i)=>27+i),...Array.from({length:9},(_,i)=>i),...Array.from({length:9},(_,i)=>36+i)];
// Simple, connected silhouettes. Warm baby wraps separate the two bodies at window size.
const head=(x,y)=>`<circle cx="${x}" cy="${y}" r="5.5"/><circle cx="${x-5}" cy="${y-1}" r="2.8"/><path d="M${x-2} ${y+4}v6h5v-6Z"/>`;
const chair='<path d="M8 27v16h23M10 43v8M29 43v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
const seated='<path d="M13 23Q18 20 22 25L22 37L31 40Q33 42 32 46L31 51H27V45L16 44Q10 43 11 37Z"/>';
const standing='<path d="M13 23Q18 19 23 24L26 42H12Z"/><path d="M14 41v10h4l1-9 2 9h4l-2-11Z"/>';
const arm=path=>`<path d="${path}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
const baby=(x,y,body)=>`<path d="${body}" fill="#bfa27e" stroke="currentColor" stroke-width="1.1"/><circle cx="${x}" cy="${y}" r="3.4" fill="#e5c79b" stroke="currentColor" stroke-width="1"/>`;
export const poses={
'授乳中':{label:'椅子に座り、赤ちゃんを胸元で支えて授乳する',svg:chair+head(17,12)+seated+baby(24,25,'M24 28Q29 27 33 34Q34 37 29 38L22 32Z')+arm('M14 26Q12 35 29 37')},
'夜泣き中':{label:'立って赤ちゃんを横抱きし、あやす',svg:head(17,11)+standing+baby(31,25,'M28 27Q31 29 28 33L20 36Q16 34 19 31Z')+arm('M14 25Q13 36 23 37Q30 37 33 31')},
'寝かしつけ中':{label:'赤ちゃんを肩に寄せ、背中とお尻を支える',svg:head(17,11)+standing+baby(28,21,'M25 24Q30 23 32 29L31 36Q26 39 23 34L23 28Z')+arm('M14 25Q14 38 28 37')+arm('M23 25L31 30')},
'眠れない':{label:'椅子に座り、持ち手に手を添えてカップを持つ',svg:chair+head(17,12)+seated+arm('M17 27L22 33L27 30')+'<path d="M29 26H37V33Q33 37 29 33Z"/><path d="M29 28H27Q24 28 25 31Q26 33 29 31" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M31 22q-2-2 0-4M35 22q-2-2 0-4" fill="none" stroke="currentColor" stroke-width=".8" opacity=".45"/>'},
'疲れたよ':{label:'椅子に座り、ひじを膝に置いて頬を手に預ける',svg:chair+head(23,16)+'<path d="M17 24Q22 23 23 29L20 37L30 40Q33 41 32 46L31 51H27V45L16 44Q10 43 11 37L12 29Z"/>'+arm('M16 29L25 36L28 23')+'<circle cx="27" cy="22" r="2.2"/>'}
};
export const poseForStatus=status=>poses[status]||poses['眠れない'];
