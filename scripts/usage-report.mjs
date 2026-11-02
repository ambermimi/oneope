// Read-only production audit; persist aggregates only, never IDs or message contents.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const run=promisify(execFile),project='tomori-oneope-20261102';
const root=fileURLToPath(new URL('..',import.meta.url));
async function get(path){const {stdout}=await run('firebase',['database:get',path,'--project',project],{maxBuffer:8*1024*1024});return JSON.parse(stdout);}
const [chat,presence,visits,started]=await Promise.all(['/chat','/presence','/visitDays','/visitorStatsStartedAt'].map(get));
const now=Date.now(),half=1800000;
const jst=t=>new Date(t+9*3600000).toISOString().slice(0,16).replace('T',' ');
const buckets=new Map();
for(const m of Object.values(chat||{})){
 if(m.bot||!Number.isFinite(m.created))continue;
 const key=Math.floor(m.created/half)*half;
 if(!buckets.has(key))buckets.set(key,{messages:0,senders:new Set()});
 const b=buckets.get(key);b.messages++;if(typeof m.sender==='string')b.senders.add(m.sender);
}
const summary={sampledAt:new Date(now).toISOString(),sampledAtJST:jst(now),trackingStartedAtJST:typeof started==='number'?jst(started):null,activeConnections:Object.values(presence||{}).filter(p=>p.seen>now-90000).length,dailyVisitors:Object.entries(visits||{}).map(([day,v])=>({dayJST:new Date(Number(day)*86400000).toISOString().slice(0,10),browserIdentities:v.count||0})),halfHours:[...buckets].sort((a,b)=>a[0]-b[0]).map(([t,b])=>({startJST:jst(t),messages:b.messages,senderSessions:b.senders.size,complete:t+half<=now}))};
const directory=root+'/metrics';await mkdir(directory,{recursive:true});const path=directory+'/production-usage-2026-11-02.json';
let previous=[];try{previous=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
previous.push(summary);await writeFile(path,JSON.stringify(previous,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
