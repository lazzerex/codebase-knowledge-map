const JavaScriptParser = require('./src/parser/javascript-parser');
const path = require('path');


const parser = new JavaScriptParser();


console.log('🔍 Parsing single file...\n');
const result = parser.parseFile('./test-code/sample.js');

if (result) {
    console.log(`📁 File: ${result.fileName}`);
    console.log(`🔧 Functions found: ${result.functions.length}`);
    console.log(`🔗 Dependencies: ${result.dependencies.length}\n`);

    console.log('📋 Functions:');
    result.functions.forEach(func => {
        console.log(`  • ${func.name} (${func.type}) - Line ${func.line}`);
        console.log(`    Parameters: [${func.params.join(', ')}]`);
        console.log(`    Complexity: ${func.complexity}`);
    });

    console.log('\n🔗 Dependencies:');
    result.dependencies.forEach(dep => {
        console.log(`  • ${dep.from} → ${dep.to} (${dep.type}) - Line ${dep.line}`);
    });
}


console.log('\n' + '='.repeat(50));
console.log('🗂️  Parsing directory...\n');

const dirResult = parser.parseDirectory('./test-code');
console.log(`📊 Summary:`);
console.log(`  Files processed: ${dirResult.stats.totalFiles}`);
console.log(`  Total functions: ${dirResult.stats.totalFunctions}`);
console.log(`  Total lines: ${dirResult.stats.totalLines}`);

console.log('\n🎯 Hotspot Analysis:');
const complexFunctions = dirResult.allFunctions
    .filter(f => f.complexity > 2)
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 5);

if (complexFunctions.length > 0) {
    console.log('Most complex functions:');
    complexFunctions.forEach(func => {
        console.log(`  🔥 ${func.name} (complexity: ${func.complexity}) in ${func.file}`);
    });
} else {
    console.log('No complex functions found (all have complexity ≤ 2)');
}