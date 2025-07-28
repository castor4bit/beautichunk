// CommonJS test
const { Beautichunk } = require('beautichunk');

console.log('Testing CommonJS import...');

const beautichunk = new Beautichunk({
  input: 'test.js',
  output: './output',
  verbose: true
});

console.log('✅ CommonJS import successful!');
console.log('Beautichunk instance:', beautichunk);

// Test that it throws the expected error
beautichunk.process().catch(err => {
  console.log('✅ Expected error:', err.message);
});