import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();
if(branch==='main'||branch==='master')throw Error('Switch to codex/uat or a feature branch before deploying UAT');
execFileSync(process.execPath,['scripts/build-uat.mjs'],{stdio:'inherit'});
execFileSync('firebase',['deploy','--only','hosting,database,auth','--project','okitell-uat-20261102','--non-interactive'],{stdio:'inherit'});
