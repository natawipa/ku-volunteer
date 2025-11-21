// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global before hook
beforeEach(() => {
  // Clear any existing data
  cy.clearTestData()
  
  // Intercept common API calls
  cy.intercept('POST', '**/api/users/login/').as('loginRequest')
  cy.intercept('GET', '**/api/activities/list/').as('getActivities')
  cy.intercept('POST', '**/api/activities/create/').as('createActivity')
  cy.intercept('PUT', '**/api/activities/*/update/').as('updateActivity')
  cy.intercept('DELETE', '**/api/activities/delete/*').as('deleteActivity')
  cy.intercept('POST', '**/api/activities/applications/create/').as('createApplication')
  cy.intercept('POST', '**/api/activities/applications/*/cancel/').as('cancelApplication')
  cy.intercept('GET', '**/api/activities/*/applications/').as('getApplications')
  cy.intercept('POST', '**/api/activities/applications/*/review/').as('reviewApplication')
  cy.intercept('GET', '**/api/activities/*/checkin-code/').as('getCheckinCode')
  cy.intercept('POST', '**/api/activities/*/checkin/').as('checkin')
})

// Global after hook for cleanup
afterEach(() => {
  cy.clearTestData()
})