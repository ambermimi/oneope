import {strict as assert} from 'node:assert';
import {displayName,displayNameParts,animals} from '../docs/names.js';
assert.equal(displayName('abc'),displayName('abc'));
const names=Array.from({length:1000},(_,i)=>displayName('user-'+i));
assert(names.every(n=>/^[ぁ-ゖ]+$/.test(n)&&animals.includes(n)));
assert.equal(new Set(names).size,32);
assert.equal(displayNameParts('abc').length,1);
assert.equal(displayNameParts('abc').join(''),displayName('abc'));
console.log('Animal-only nicknames are stable, hiragana and cover all 32 animals.');
