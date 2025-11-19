describe('Student Features', () => {
  beforeEach(() => {
    cy.loginAsStudent()
  })

  describe('View Activity List', () => {
    it('should display list of available activities', () => {
      cy.visit('/')
      cy.wait('@getActivities')
      
      cy.get('[data-testid="activity-list"]').should('be.visible')
      cy.get('[data-testid="activity-card"]').should('have.length.greaterThan', 0)
      
      // Check activity card content
      cy.get('[data-testid="activity-card"]').first().within(() => {
        cy.get('[data-testid="activity-title"]').should('be.visible')
        cy.get('[data-testid="activity-date"]').should('be.visible')
        cy.get('[data-testid="activity-location"]').should('be.visible')
        cy.get('[data-testid="activity-category"]').should('be.visible')
        cy.get('[data-testid="participants-count"]').should('be.visible')
      })
    })

    it('should filter activities by category', () => {
      cy.visit('/')
      cy.wait('@getActivities')
      
      cy.get('[data-testid="category-filter"]').select('environment')
      cy.get('[data-testid="activity-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="activity-category"]').should('contain', 'environment')
      })
    })

    it('should search activities by title', () => {
      cy.visit('/')
      cy.wait('@getActivities')
      
      cy.get('[data-testid="search-input"]').type('Clean')
      cy.get('[data-testid="activity-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="activity-title"]').should('contain', 'Clean')
      })
    })

    it('should show no results message when no activities match filter', () => {
      cy.visit('/')
      cy.wait('@getActivities')
      
      cy.get('[data-testid="search-input"]').type('NonexistentActivity')
      cy.get('[data-testid="no-activities-message"]')
        .should('be.visible')
        .and('contain', 'No activities found')
    })

    it('should load more activities on pagination', () => {
      cy.visit('/')
      cy.wait('@getActivities')
      
      cy.get('[data-testid="activity-card"]').then(($cards) => {
        const initialCount = $cards.length
        
        cy.get('[data-testid="load-more-button"]').click()
        cy.wait('@getActivities')
        
        cy.get('[data-testid="activity-card"]').should('have.length.greaterThan', initialCount)
      })
    })
  })

  describe('View Activity Details', () => {
    it('should display complete activity information', () => {
      cy.visit('/')
      cy.wait('@getActivities')
      
      cy.get('[data-testid="activity-card"]').first().click()
      
      cy.url().should('match', /\/events\/\d+/)
      cy.get('[data-testid="activity-details"]').should('be.visible')
      
      // Check all activity details are displayed
      cy.get('[data-testid="activity-title"]').should('be.visible')
      cy.get('[data-testid="activity-description"]').should('be.visible')
      cy.get('[data-testid="activity-date-time"]').should('be.visible')
      cy.get('[data-testid="activity-location"]').should('be.visible')
      cy.get('[data-testid="activity-organizer"]').should('be.visible')
      cy.get('[data-testid="activity-capacity"]').should('be.visible')
      cy.get('[data-testid="activity-hours"]').should('be.visible')
      cy.get('[data-testid="activity-categories"]').should('be.visible')
    })

    it('should show apply button for open activities', () => {
      cy.intercept('GET', '**/api/activities/*', {
        fixture: 'activities',
        statusCode: 200
      }).as('getActivityDetails')
      
      cy.visit('/events/1')
      cy.wait('@getActivityDetails')
      
      cy.get('[data-testid="apply-button"]').should('be.visible').and('not.be.disabled')
      cy.get('[data-testid="activity-status"]').should('contain', 'Open for Registration')
    })

    it('should show full message for activities at capacity', () => {
      cy.intercept('GET', '**/api/activities/*', {
        body: {
          ...require('../fixtures/activities.json').validActivity,
          id: 1,
          status: 'full',
          current_participants: 25,
          max_participants: 25
        }
      }).as('getFullActivity')
      
      cy.visit('/events/1')
      cy.wait('@getFullActivity')
      
      cy.get('[data-testid="apply-button"]').should('be.disabled')
      cy.get('[data-testid="activity-status"]').should('contain', 'Full')
    })

    it('should show activity images if available', () => {
      cy.intercept('GET', '**/api/activities/*', {
        body: {
          ...require('../fixtures/activities.json').validActivity,
          id: 1,
          cover_image: '/media/activities/1/cover.jpg',
          poster_images: [
            { image: '/media/activities/1/poster1.jpg', order: 1 },
            { image: '/media/activities/1/poster2.jpg', order: 2 }
          ]
        }
      }).as('getActivityWithImages')
      
      cy.visit('/events/1')
      cy.wait('@getActivityWithImages')
      
      cy.get('[data-testid="activity-cover-image"]').should('be.visible')
      cy.get('[data-testid="activity-gallery"]').should('be.visible')
      cy.get('[data-testid="poster-image"]').should('have.length', 2)
    })
  })

  describe('Apply/Register for Activity', () => {
    it('should successfully apply for an activity', () => {
      cy.visit('/events/1')
      
      cy.intercept('GET', '**/api/activities/1', {
        fixture: 'activities',
        statusCode: 200
      }).as('getActivity')
      
      cy.wait('@getActivity')
      
      cy.get('[data-testid="apply-button"]').click()
      
      // Confirm application in modal
      cy.get('[data-testid="confirm-apply-modal"]').should('be.visible')
      cy.get('[data-testid="confirm-apply-button"]').click()
      
      cy.wait('@createApplication').its('response.statusCode').should('eq', 201)
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Application submitted successfully')
      
      // Button should now show "Applied"
      cy.get('[data-testid="apply-button"]').should('contain', 'Applied').and('be.disabled')
    })

    it('should show error if already applied', () => {
      cy.intercept('POST', '**/api/activities/applications/create/', {
        statusCode: 400,
        body: { error: 'You have already applied for this activity' }
      }).as('duplicateApplication')
      
      cy.visit('/events/1')
      cy.get('[data-testid="apply-button"]').click()
      cy.get('[data-testid="confirm-apply-button"]').click()
      
      cy.wait('@duplicateApplication')
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'already applied')
    })

    it('should prevent application for past activities', () => {
      cy.intercept('GET', '**/api/activities/1', {
        body: {
          ...require('../fixtures/activities.json').validActivity,
          id: 1,
          status: 'complete',
          start_at: '2023-01-01T09:00:00.000Z',
          end_at: '2023-01-01T16:00:00.000Z'
        }
      }).as('getPastActivity')
      
      cy.visit('/events/1')
      cy.wait('@getPastActivity')
      
      cy.get('[data-testid="apply-button"]').should('be.disabled')
      cy.get('[data-testid="activity-status"]').should('contain', 'Completed')
    })
  })

  describe('Cancel Application', () => {
    it('should successfully cancel application', () => {
      // First apply for activity
      cy.visit('/events/1')
      cy.get('[data-testid="apply-button"]').click()
      cy.get('[data-testid="confirm-apply-button"]').click()
      cy.wait('@createApplication')
      
      // Now cancel the application
      cy.get('[data-testid="cancel-application-button"]').click()
      
      cy.get('[data-testid="confirm-cancel-modal"]').should('be.visible')
      cy.get('[data-testid="confirm-cancel-button"]').click()
      
      cy.wait('@cancelApplication').its('response.statusCode').should('eq', 200)
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Application cancelled successfully')
      
      // Apply button should be enabled again
      cy.get('[data-testid="apply-button"]').should('not.be.disabled').and('contain', 'Apply')
    })

    it('should show cancel button only for pending applications', () => {
      cy.intercept('GET', '**/api/activities/applications/list/', {
        body: {
          results: [{
            id: 1,
            activity: 1,
            activity_title: 'Test Activity',
            status: 'approved',
            submitted_at: '2025-11-01T10:00:00Z'
          }]
        }
      }).as('getApprovedApplication')
      
      cy.visit('/profile')
      cy.wait('@getApprovedApplication')
      
      cy.get('[data-testid="application-card"]').first().within(() => {
        cy.get('[data-testid="application-status"]').should('contain', 'Approved')
        cy.get('[data-testid="cancel-application-button"]').should('not.exist')
      })
    })
  })

  describe('Check-in to Activity', () => {
    beforeEach(() => {
      // Mock approved application
      cy.intercept('GET', '**/api/activities/applications/list/', {
        body: {
          results: [{
            id: 1,
            activity: 1,
            activity_title: 'Test Activity',
            status: 'approved',
            submitted_at: '2025-11-01T10:00:00Z'
          }]
        }
      }).as('getApprovedApplications')
    })

    it('should successfully check-in with valid code', () => {
      cy.visit('/profile')
      cy.wait('@getApprovedApplications')
      
      cy.get('[data-testid="checkin-button"]').click()
      
      cy.get('[data-testid="checkin-modal"]').should('be.visible')
      cy.get('[data-testid="checkin-code-input"]').type('ABC123')
      cy.get('[data-testid="submit-checkin-button"]').click()
      
      cy.wait('@checkin').its('response.statusCode').should('eq', 200)
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Check-in successful')
      
      cy.get('[data-testid="application-status"]').should('contain', 'Checked In')
    })

    it('should show error for invalid check-in code', () => {
      cy.intercept('POST', '**/api/activities/*/checkin/', {
        statusCode: 400,
        body: { error: 'Invalid check-in code' }
      }).as('invalidCheckin')
      
      cy.visit('/profile')
      cy.wait('@getApprovedApplications')
      
      cy.get('[data-testid="checkin-button"]').click()
      cy.get('[data-testid="checkin-code-input"]').type('INVALID')
      cy.get('[data-testid="submit-checkin-button"]').click()
      
      cy.wait('@invalidCheckin')
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid check-in code')
    })

    it('should validate check-in code format', () => {
      cy.visit('/profile')
      cy.wait('@getApprovedApplications')
      
      cy.get('[data-testid="checkin-button"]').click()
      cy.get('[data-testid="checkin-code-input"]').type('12')
      cy.get('[data-testid="submit-checkin-button"]').click()
      
      cy.get('[data-testid="code-error"]')
        .should('be.visible')
        .and('contain', 'Check-in code must be 6 characters')
    })

    it('should only show check-in for approved applications during activity time', () => {
      cy.intercept('GET', '**/api/activities/applications/list/', {
        body: {
          results: [{
            id: 1,
            activity: 1,
            activity_title: 'Test Activity',
            status: 'pending',
            submitted_at: '2025-11-01T10:00:00Z'
          }]
        }
      }).as('getPendingApplication')
      
      cy.visit('/profile')
      cy.wait('@getPendingApplication')
      
      cy.get('[data-testid="checkin-button"]').should('not.exist')
      cy.get('[data-testid="application-status"]').should('contain', 'Pending')
    })
  })

  describe('View Application Status', () => {
    it('should display all user applications with correct status', () => {
      cy.intercept('GET', '**/api/activities/applications/list/', {
        body: {
          results: [
            {
              id: 1,
              activity: 1,
              activity_title: 'Community Clean Up',
              status: 'pending',
              submitted_at: '2025-11-01T10:00:00Z'
            },
            {
              id: 2, 
              activity: 2,
              activity_title: 'Blood Donation',
              status: 'approved',
              submitted_at: '2025-11-02T10:00:00Z'
            },
            {
              id: 3,
              activity: 3,
              activity_title: 'Math Tutoring',
              status: 'rejected',
              submitted_at: '2025-11-03T10:00:00Z',
              notes: 'Not enough experience'
            }
          ]
        }
      }).as('getAllApplications')
      
      cy.visit('/profile')
      cy.wait('@getAllApplications')
      
      cy.get('[data-testid="applications-section"]').should('be.visible')
      cy.get('[data-testid="application-card"]').should('have.length', 3)
      
      // Check pending application
      cy.get('[data-testid="application-card"]').first().within(() => {
        cy.get('[data-testid="application-title"]').should('contain', 'Community Clean Up')
        cy.get('[data-testid="application-status"]').should('contain', 'Pending')
        cy.get('[data-testid="cancel-application-button"]').should('be.visible')
      })
      
      // Check approved application
      cy.get('[data-testid="application-card"]').eq(1).within(() => {
        cy.get('[data-testid="application-title"]').should('contain', 'Blood Donation')
        cy.get('[data-testid="application-status"]').should('contain', 'Approved')
        cy.get('[data-testid="checkin-button"]').should('be.visible')
      })
      
      // Check rejected application
      cy.get('[data-testid="application-card"]').eq(2).within(() => {
        cy.get('[data-testid="application-title"]').should('contain', 'Math Tutoring')
        cy.get('[data-testid="application-status"]').should('contain', 'Rejected')
        cy.get('[data-testid="rejection-reason"]').should('contain', 'Not enough experience')
      })
    })

    it('should show empty state when no applications exist', () => {
      cy.intercept('GET', '**/api/activities/applications/list/', {
        body: { results: [] }
      }).as('getEmptyApplications')
      
      cy.visit('/profile')
      cy.wait('@getEmptyApplications')
      
      cy.get('[data-testid="no-applications-message"]')
        .should('be.visible')
        .and('contain', 'You have not applied for any activities yet')
      
      cy.get('[data-testid="browse-activities-button"]')
        .should('be.visible')
        .click()
      
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })

    it('should filter applications by status', () => {
      cy.intercept('GET', '**/api/activities/applications/list/', {
        body: {
          results: [
            { id: 1, activity: 1, activity_title: 'Activity 1', status: 'pending' },
            { id: 2, activity: 2, activity_title: 'Activity 2', status: 'approved' },
            { id: 3, activity: 3, activity_title: 'Activity 3', status: 'rejected' }
          ]
        }
      }).as('getAllApplications')
      
      cy.visit('/profile')
      cy.wait('@getAllApplications')
      
      // Filter by approved
      cy.get('[data-testid="status-filter"]').select('approved')
      cy.get('[data-testid="application-card"]').should('have.length', 1)
      cy.get('[data-testid="application-card"]').first()
        .find('[data-testid="application-status"]').should('contain', 'Approved')
    })
  })
})