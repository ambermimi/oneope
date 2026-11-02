import assert from 'node:assert/strict';
import {summarizeTopics,combineSummaries} from '../docs/topics.js';
const summary=summarizeTopics([{body:'授乳と夜泣き、おつかれさま',sender:'private',created:123},{body:'xyz'},{body:'ありがとう',bot:true}]);
assert.equal(summary.total,2);assert.equal(summary.topics.feeding,1);assert.equal(summary.topics.sleep,1);assert.equal(summary.topics.support,1);assert.equal(summary.topics.other,1);
assert.deepEqual(Object.keys(summary).sort(),['topics','total','version']);
assert(!/private|授乳|created|sender/.test(JSON.stringify(summary)));
assert.equal(combineSummaries([summary,summary]).total,4);
console.log('PASS aggregate-only topics, multiple themes, bot exclusion and totals');
