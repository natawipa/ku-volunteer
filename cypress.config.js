const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Environment variables
    env: {
      API_URL: 'http://localhost:8000/api',
      ADMIN_EMAIL: 'admin@ku.ac.th',
      ADMIN_PASSWORD: 'admin123',
      STUDENT_EMAIL: 'student@ku.ac.th', 
      STUDENT_PASSWORD: 'student123',
      ORGANIZER_EMAIL: 'organizer@ku.ac.th',
      ORGANIZER_PASSWORD: 'organizer123'
    },

    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message)
          return null
        }
      })
    },
  },
  
  // Enable Chrome web security since we're using HTTP now
  chromeWebSecurity: true,
  modifyObstructiveCode: false
})