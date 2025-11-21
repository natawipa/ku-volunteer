describe('Organizer Features', () => {
  beforeEach(() => {
    cy.loginAsOrganizer()
  })

  describe('Create Event/Activity', () => {
    it('should successfully create a new activity', () => {
      cy.visit('/new-event')
      
      cy.fixture('activities').then((activities) => {
        const activity = activities.validActivity
        
        cy.get('[data-testid="activity-title-input"]').type(activity.title)
        cy.get('[data-testid="activity-description-textarea"]').type(activity.description)
        cy.get('[data-testid="activity-location-input"]').type(activity.location)
        
        // Set dates
        cy.get('[data-testid="start-date-input"]').type('2025-12-01')
        cy.get('[data-testid="start-time-input"]').type('09:00')
        cy.get('[data-testid="end-date-input"]').type('2025-12-01')
        cy.get('[data-testid="end-time-input"]').type('16:00')
        
        cy.get('[data-testid="max-participants-input"]').type(activity.max_participants.toString())
        cy.get('[data-testid="hours-awarded-input"]').type(activity.hours_awarded.toString())
        
        // Open category dropdown
        cy.get('[data-testid="category-dropdown-toggle"]').click()
        // Select categories
        cy.get('[data-testid="category-university-activities"]').click()
        cy.get('[data-testid="category-development-of-morality-and-ethics"]').click()
        
        // Upload cover image
        cy.get('[data-testid="cover-image-input"]').selectFile('backend/sample_images/activity_1.jpg', { force: true })
        
        // Close the dropdown by clicking outside
        cy.get('body').click(0, 0); // Click on the top-left corner of the page

        // Proceed to click the create activity button
        cy.get('[data-testid="create-activity-button"]').click()
        
        cy.wait('@createActivity').its('response.statusCode').should('eq', 201)
        
        cy.get('[data-testid="success-message"]')
          .should('be.visible')
          .and('contain', 'Activity created successfully')
        
        // Should redirect to home page
        cy.url().should('eq', Cypress.config().baseUrl + '/')
      })
    })

    it('should validate required fields', () => {
      cy.visit('/new-event')
      
      cy.get('[data-testid="create-activity-button"]').click()
      
      cy.get('[data-testid="title-error"]').should('be.visible')
      cy.get('[data-testid="description-error"]').should('be.visible')
      cy.get('[data-testid="location-error"]').should('be.visible')
      cy.get('[data-testid="start-date-error"]').should('be.visible')
      cy.get('[data-testid="end-date-error"]').should('be.visible')
    })

    it('should validate date logic (end after start)', () => {
      cy.visit('/new-event')

      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - 1) // Past date
      const end = new Date(start)
      end.setDate(end.getDate() - 2) // Earlier date

      const formatDate = (d) => d.toISOString().split('T')[0]
      const formatTime = (d) => d.toTimeString().slice(0, 5)
      
      // Set invalid start and end dates
      cy.get('[data-testid="start-date-input"]').type(formatDate(start))
      cy.get('[data-testid="start-time-input"]').type(formatTime(start))

      cy.get('[data-testid="end-date-input"]').type(formatDate(end))
      cy.get('[data-testid="end-time-input"]').type(formatTime(end))
      
      cy.get('[data-testid="create-activity-button"]').click()

      // Check for start date error
      cy.get('[data-testid="start-date-error"]')
        .should('be.visible')
        .and('contain', 'Start date can not be in the past')

      // Check for end date error  
      cy.get('[data-testid="end-date-error"]')
        .should('be.visible')
        .and('contain', 'End date and time must be after start date and time')
    })
  })

  describe('Edit Event', () => {
    beforeEach(() => {
      cy.loginAsOrganizer()

      // Visit home page to see real activities from database
      cy.visit('/')
    })

    it('should successfully edit activity details', () => {
      // Mock update activity API
      cy.intercept('PUT', '**/api/activities/*/update/', {
        statusCode: 200,
        body: { 
          id: 1, 
          title: 'Updated Activity Title',
          success: true
        }
      }).as('updateActivity')

      // Wait for page to load and look for any clickable activity card
      cy.get('body').should('be.visible')
      
      // Use a more robust selector - look for any element with activity title
      cy.get('h3').contains('Community Clean Up Day').click()

      // It should go to event detail page
      cy.url().should('include', '/event-detail/')

      // Click the edit button
      cy.get('[data-testid="edit-event-button"]').click()
      cy.url().should('include', '/new-event?edit=')

      // Wait for form to load - check if title input exists and has some value
      cy.get('[data-testid="activity-title-input"]')
        .should('be.visible')
        .and('have.length', 1)

      // Update activity details
      cy.get('[data-testid="activity-title-input"]')
        .clear()
        .type('Updated Activity Title')

      // Click update activity button
      cy.get('[data-testid="create-activity-button"]').click()
      cy.wait('@updateActivity')

      // Should redirect away from edit page
      cy.url().should('not.include', '/new-event?edit=')
    })

    it('should update poster images', () => {
      // Mock APIs
      cy.intercept('POST', '**/api/activities/*/posters/', {
        statusCode: 201,
        body: { 
          id: 1, 
          image: '/media/activities/1/poster.jpg', 
          order: 1 
        }
      }).as('uploadPoster')
      
      cy.intercept('DELETE', '**/api/activities/*/posters/*', {
        statusCode: 204
      }).as('deletePoster')

      // Navigate to an activity detail page
      cy.get('h3').contains('Community Clean Up Day').click()
      cy.url().should('include', '/event-detail/')
      
      // Click edit button to go to edit form
      cy.get('[data-testid="edit-event-button"]').click()
      cy.url().should('include', '/new-event?edit=')
      
      // Add new poster image
      cy.get('[data-testid="poster-image-input"]').selectFile('backend/sample_images/activity_1.jpg', { force: true })
      
      // Upload poster (if upload button exists)
      cy.get('body').then($body => {
        if ($body.find('[data-testid="upload-poster-button"]').length > 0) {
          cy.get('[data-testid="upload-poster-button"]').click()
          cy.wait('@uploadPoster')
        }
      })
      
      // Check for success feedback
      cy.get('[data-testid="success-message"]').should('be.visible')
    })
  })

  describe('Delete Event', () => {
    beforeEach(() => {
      cy.loginAsOrganizer()
    })

    it('should successfully delete pending activity without admin approval', () => {
      // Mock delete API
      cy.intercept('DELETE', '**/api/activities/*/delete/', {
        statusCode: 204
      }).as('deleteActivity')
      
      // Navigate to activity detail page
      cy.visit('/')
      cy.get('h3').contains('Community Clean Up Day').click()
      cy.url().should('include', '/event-detail/')
      
      // Click delete button (in the edit form)
      cy.get('[data-testid="edit-event-button"]').click()
      cy.get('[data-testid="delete-activity-button"]').click()
      
      // Confirm deletion in modal
      cy.get('button').contains('Confirm').click()
      
      cy.wait('@deleteActivity')
      
      // Should redirect to all-events page after successful deletion
      cy.url().should('include', '/all-events')
    })
  })
})