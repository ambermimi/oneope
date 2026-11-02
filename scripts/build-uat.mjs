import {cp,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const config=await readFile('environments/uat.js','utf8');
if(!config.includes('okitell-uat-20261102')||config.includes('tomori-oneope-20261102'))throw Error('UAT configuration is not isolated');
await rm('.uat-dist',{recursive:true,force:true});
await cp('docs','.uat-dist',{recursive:true});
await writeFile('.uat-dist/firebase-config.js',config);
await writeFile('.uat-dist/environment.js','export const IS_UAT=true;\n');
await writeFile('.uat-dist/robots.txt','User-agent: *\nDisallow: /\n');
console.log('Built isolated UAT with five synthetic bot fixtures');

const admin=await readFile('.uat-dist/admin.html','utf8');
await writeFile('.uat-dist/admin.html',admin.replace('<body>','<body><p style="background:#623c16;color:white;padding:12px;text-align:center">UAT・テスト環境 — 本番データはありません</p>'));
