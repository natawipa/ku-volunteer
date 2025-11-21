// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login Commands
Cypress.Commands.add('loginAsStudent', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email || Cypress.env('STUDENT_EMAIL'))
  cy.get('[data-testid="password-input"]').type(password || Cypress.env('STUDENT_PASSWORD'))
  cy.get('[data-testid="login-button"]').click()
  
  // Wait for successful login redirect
  cy.url().should('not.include', '/login')
  cy.get('[data-testid="user-menu"]', { timeout: 10000 }).should('be.visible')
})

Cypress.Commands.add('loginAsOrganizer', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email || Cypress.env('ORGANIZER_EMAIL'))
  cy.get('[data-testid="password-input"]').type(password || Cypress.env('ORGANIZER_PASSWORD'))
  cy.get('[data-testid="login-button"]').click()
  
  // Wait for successful login redirect
  cy.url().should('not.include', '/login')
  cy.get('[data-testid="user-menu"]', { timeout: 10000 }).should('be.visible')
})

Cypress.Commands.add('loginAsAdmin', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email || Cypress.env('ADMIN_EMAIL'))
  cy.get('[data-testid="password-input"]').type(password || Cypress.env('ADMIN_PASSWORD'))
  cy.get('[data-testid="login-button"]').click()
  
  // Wait for admin dashboard redirect
  cy.url().should('include', '/admin')
  cy.get('[data-testid="admin-dashboard"]', { timeout: 10000 }).should('be.visible')
})

// OAuth Login Command
Cypress.Commands.add('loginWithGoogle', () => {
  // Mock OAuth flow since we can't actually use Google OAuth in tests
  cy.window().then((win) => {
    // Simulate successful OAuth by setting tokens directly
    win.localStorage.setItem('access_token', 'mock_access_token')
    win.localStorage.setItem('refresh_token', 'mock_refresh_token')
    win.localStorage.setItem('user_data', JSON.stringify({
      id: 1,
      email: 'test@gmail.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'student'
    }))
  })
  cy.reload()
})

// Utility Commands
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

Cypress.Commands.add('waitForApiCall', (alias) => {
  cy.wait(alias).its('response.statusCode').should('eq', 200)
})

Cypress.Commands.add('createTestActivity', (activityData = {}) => {
  const defaultActivity = {
    title: 'Test Activity',
    description: 'This is a test activity for E2E testing',
    location: 'Test Location',
    start_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end_at: new Date(Date.now() + 90000000).toISOString(), // Day after tomorrow
    max_participants: 10,
    hours_awarded: 2,
    categories: ['volunteer']
  }
  
  const activity = { ...defaultActivity, ...activityData }
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/activities/create/`,
    body: activity,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

Cypress.Commands.add('deleteTestActivity', (activityId) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('API_URL')}/activities/delete/${activityId}/`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
    }
  })
})

// Clear all data command for test cleanup
Cypress.Commands.add('clearTestData', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
  cy.clearCookies()
})