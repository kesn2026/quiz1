// test-game-flow.js - Automated integration test for QuizPang
const http = require('http');

async function testApi() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/info', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ API /api/info test passed:', json);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

testApi()
  .then(() => {
    console.log('🎉 Server verification complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Server verification failed:', err);
    process.exit(1);
  });
