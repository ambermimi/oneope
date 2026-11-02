import assert from 'node:assert/strict';
import {languageProblem,isHidden} from '../docs/moderation.js';
for(const text of ['死ね','しね！','クソ野郎','殺すぞ','くたばれ'])assert(languageProblem(text),text);
for(const text of ['しんどい','死にたい','楽しいしね','寝かしつけ中','おつかれさま'])assert.equal(languageProblem(text),'',text);
assert(!isHidden({count:2}));assert(isHidden({count:3}));assert(!isHidden({count:3,status:'visible'}));assert(isHidden({count:0,status:'hidden'}));
console.log('Japanese wording and moderation review states verified.');
