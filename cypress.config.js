const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: { baseUrl: 'http://localhost:5173', env: { apiUrl: 'http://localhost:4000/api' }, supportFile: false }
});
