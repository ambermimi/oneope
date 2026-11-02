import {strict as assert} from 'node:assert';
import {OWN_WINDOW,OTHER_WINDOWS,poses,poseForStatus} from '../docs/scene-model.js';
assert.equal(Math.floor(OWN_WINDOW/9),2);assert.equal(OWN_WINDOW%9,1);
assert.equal(OTHER_WINDOWS.length,44);assert.equal(new Set(OTHER_WINDOWS).size,44);assert(!OTHER_WINDOWS.includes(OWN_WINDOW));assert(OTHER_WINDOWS.every(i=>i>=0&&i<45));
assert.equal(Object.keys(poses).length,5);assert.equal(new Set(Object.values(poses).map(p=>p.svg)).size,5);
assert.equal(poseForStatus('unknown'),poses['眠れない']);
console.log('Reserved top-middle window, allocation and five distinct status graphics verified.');
