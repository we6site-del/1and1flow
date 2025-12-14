const zod = require('zod');
if (zod.safeParseAsync) {
    console.log('safeParseAsync exists');
} else {
    console.log('safeParseAsync MISSING');
}
console.log('Zod version:', require('zod/package.json').version);
