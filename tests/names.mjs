import {strict as assert} from 'node:assert';
import {displayName,moods,animals} from '../docs/names.js';
assert.equal(displayName('abc'),displayName('abc'));
const names=Array.from({length:100},(_,i)=>displayName('user-'+i));
assert(names.every(n=>/^[ぁ-ゖ]+$/.test(n)));
assert(new Set(names).size>50);
console.log('Animal nicknames are stable, varied and entirely hiragana.');

assert.equal(new Set(moods.flatMap(m=>animals.map(a=>m+a))).size,1024);
