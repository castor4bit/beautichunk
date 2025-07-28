// ESM test
import { Beautichunk } from 'beautichunk';

console.log('Testing ESM import...');

const beautichunk = new Beautichunk({
  input: 'test.js',
  output: './output',
  verbose: true
});

console.log('✅ ESM import successful!');
console.log('Beautichunk instance:', beautichunk);

// Test that it throws the expected error
try {
  await beautichunk.process();
} catch (err) {
  console.log('✅ Expected error:', err.message);
}