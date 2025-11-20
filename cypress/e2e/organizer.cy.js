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

  //   it('should validate required fields', () => {
  //     cy.visit('/new-event')
      
  //     cy.get('[data-testid="create-activity-button"]').click()
      
  //     cy.get('[data-testid="title-error"]').should('be.visible')
  //     cy.get('[data-testid="description-error"]').should('be.visible')
  //     cy.get('[data-testid="location-error"]').should('be.visible')
  //     cy.get('[data-testid="start-date-error"]').should('be.visible')
  //     cy.get('[data-testid="end-date-error"]').should('be.visible')
  //   })

  //   it('should validate date logic (end after start)', () => {
  //     cy.visit('/new-event')
      
  //     cy.get('[data-testid="start-date-input"]').type('2025-12-02')
  //     cy.get('[data-testid="start-time-input"]').type('10:00')
  //     cy.get('[data-testid="end-date-input"]').type('2025-12-01')
  //     cy.get('[data-testid="end-time-input"]').type('16:00')
      
  //     cy.get('[data-testid="create-activity-button"]').click()
      
  //     cy.get('[data-testid="date-error"]')
  //       .should('be.visible')
  //       .and('contain', 'End date must be after start date')
  //   })

  //   it('should validate participants count', () => {
  //     cy.visit('/new-event')
      
  //     cy.get('[data-testid="max-participants-input"]').clear().type('0')
  //     cy.get('[data-testid="create-activity-button"]').click()
      
  //     cy.get('[data-testid="participants-error"]')
  //       .should('be.visible')
  //       .and('contain', 'Must have at least 1 participant')
  //   })

  //   it('should handle file upload validation', () => {
  //     cy.visit('/new-event')
      
  //     // Try uploading invalid file type
  //     cy.get('[data-testid="cover-image-input"]').selectFile('cypress/fixtures/test-document.txt', { force: true })
      
  //     cy.get('[data-testid="file-error"]')
  //       .should('be.visible')
  //       .and('contain', 'Only JPEG, PNG, and WebP images are supported')
  //   })

  //   it('should save as draft', () => {
  //     cy.visit('/new-event')
      
  //     cy.fixture('activities').then((activities) => {
  //       cy.get('[data-testid="activity-title-input"]').type(activities.validActivity.title)
  //       cy.get('[data-testid="activity-description-textarea"]').type(activities.validActivity.description)
        
  //       cy.intercept('POST', '**/api/activities/create/', {
  //         statusCode: 201,
  //         body: { id: 1, status: 'pending', ...activities.validActivity }
  //       }).as('saveDraft')
        
  //       cy.get('[data-testid="save-draft-button"]').click()
        
  //       cy.wait('@saveDraft')
        
  //       cy.get('[data-testid="success-message"]')
  //         .should('be.visible')
  //         .and('contain', 'Activity saved as draft')
  //     })
  //   })
  // })

  // describe('Edit Event', () => {
  //   beforeEach(() => {
  //     // Mock existing activity
  //     cy.intercept('GET', '**/api/activities/1', {
  //       fixture: 'activities',
  //       statusCode: 200
  //     }).as('getActivity')
  //   })

  //   it('should successfully edit activity details', () => {
  //     cy.visit('/events/1/edit')
  //     cy.wait('@getActivity')
      
  //     // Update activity details
  //     cy.get('[data-testid="activity-title-input"]').clear().type('Updated Activity Title')
  //     cy.get('[data-testid="activity-description-textarea"]').clear().type('Updated description')
  //     cy.get('[data-testid="max-participants-input"]').clear().type('30')
      
  //     cy.get('[data-testid="update-activity-button"]').click()
      
  //     cy.wait('@updateActivity').its('response.statusCode').should('eq', 200)
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('be.visible')
  //       .and('contain', 'Activity updated successfully')
  //   })

  //   it('should not allow editing past activities', () => {
  //     cy.intercept('GET', '**/api/activities/1', {
  //       body: {
  //         ...require('../fixtures/activities.json').validActivity,
  //         id: 1,
  //         status: 'complete',
  //         start_at: '2023-01-01T09:00:00.000Z'
  //       }
  //     }).as('getPastActivity')
      
  //     cy.visit('/events/1/edit')
  //     cy.wait('@getPastActivity')
      
  //     cy.get('[data-testid="edit-disabled-message"]')
  //       .should('be.visible')
  //       .and('contain', 'Cannot edit completed activities')
      
  //     cy.get('[data-testid="activity-title-input"]').should('be.disabled')
  //   })

  //   it('should handle concurrent edit conflicts', () => {
  //     cy.visit('/events/1/edit')
  //     cy.wait('@getActivity')
      
  //     cy.intercept('PUT', '**/api/activities/1/update/', {
  //       statusCode: 409,
  //       body: { error: 'Activity has been modified by another user' }
  //     }).as('conflictUpdate')
      
  //     cy.get('[data-testid="activity-title-input"]').clear().type('Conflicted Update')
  //     cy.get('[data-testid="update-activity-button"]').click()
      
  //     cy.wait('@conflictUpdate')
      
  //     cy.get('[data-testid="error-message"]')
  //       .should('be.visible')
  //       .and('contain', 'modified by another user')
  //   })

  //   it('should update poster images', () => {
  //     cy.visit('/events/1/edit')
  //     cy.wait('@getActivity')
      
  //     // Add new poster image
  //     cy.get('[data-testid="add-poster-button"]').click()
  //     cy.get('[data-testid="poster-image-input"]').selectFile('cypress/fixtures/poster.jpg', { force: true })
      
  //     cy.intercept('POST', '**/api/activities/1/posters/', {
  //       statusCode: 201,
  //       body: { id: 1, image: '/media/activities/1/poster.jpg', order: 1 }
  //     }).as('uploadPoster')
      
  //     cy.get('[data-testid="upload-poster-button"]').click()
      
  //     cy.wait('@uploadPoster')
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('be.visible')
  //       .and('contain', 'Poster uploaded successfully')
  //   })
  // })

  // describe('Delete Event', () => {
  //   it('should successfully delete activity with confirmation', () => {
  //     cy.visit('/events/1')
      
  //     cy.get('[data-testid="activity-menu"]').click()
  //     cy.get('[data-testid="delete-activity-button"]').click()
      
  //     // Confirm deletion in modal
  //     cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible')
  //     cy.get('[data-testid="delete-reason-textarea"]').type('Event cancelled due to weather')
  //     cy.get('[data-testid="confirm-delete-button"]').click()
      
  //     cy.wait('@deleteActivity').its('response.statusCode').should('eq', 204)
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('be.visible')
  //       .and('contain', 'Activity deleted successfully')
      
  //     // Should redirect to organizer dashboard
  //     cy.url().should('include', '/organizer')
  //   })

  //   it('should not allow deletion of activities with approved applications', () => {
  //     cy.intercept('GET', '**/api/activities/1/applications/', {
  //       body: {
  //         results: [
  //           { id: 1, status: 'approved', user_name: 'John Student' }
  //         ]
  //       }
  //     }).as('getApplicationsWithApproved')
      
  //     cy.visit('/events/1')
  //     cy.wait('@getApplicationsWithApproved')
      
  //     cy.get('[data-testid="activity-menu"]').click()
  //     cy.get('[data-testid="delete-activity-button"]').should('be.disabled')
      
  //     cy.get('[data-testid="delete-disabled-tooltip"]')
  //       .should('contain', 'Cannot delete activity with approved applications')
  //   })

  //   it('should require admin approval for deletion request', () => {
  //     cy.intercept('POST', '**/api/activities/request-delete/1/', {
  //       statusCode: 201,
  //       body: { message: 'Deletion request submitted for admin review' }
  //     }).as('requestDeletion')
      
  //     cy.visit('/events/1')
      
  //     cy.get('[data-testid="activity-menu"]').click()
  //     cy.get('[data-testid="request-delete-button"]').click()
      
  //     cy.get('[data-testid="deletion-request-modal"]').should('be.visible')
  //     cy.get('[data-testid="deletion-reason-textarea"]').type('Budget constraints')
  //     cy.get('[data-testid="submit-request-button"]').click()
      
  //     cy.wait('@requestDeletion')
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('be.visible')
  //       .and('contain', 'Deletion request submitted for admin review')
  //   })
  // })

  // describe('Approve Student Application', () => {
  //   beforeEach(() => {
  //     cy.intercept('GET', '**/api/activities/1/applications/', {
  //       body: {
  //         results: [
  //           {
  //             id: 1,
  //             user_name: 'John Student',
  //             user_email: 'john@ku.ac.th',
  //             student_id: '6610000001',
  //             status: 'pending',
  //             submitted_at: '2025-11-15T10:00:00Z'
  //           },
  //           {
  //             id: 2,
  //             user_name: 'Jane Student', 
  //             user_email: 'jane@ku.ac.th',
  //             student_id: '6610000002',
  //             status: 'pending',
  //             submitted_at: '2025-11-15T11:00:00Z'
  //           }
  //         ]
  //       }
  //     }).as('getPendingApplications')
  //   })

  //   it('should successfully approve application', () => {
  //     cy.visit('/events/1/applications')
  //     cy.wait('@getPendingApplications')
      
  //     cy.get('[data-testid="application-card"]').first().within(() => {
  //       cy.get('[data-testid="approve-button"]').click()
  //     })
      
  //     cy.get('[data-testid="approve-confirmation-modal"]').should('be.visible')
  //     cy.get('[data-testid="approval-notes-textarea"]').type('Meets all requirements')
  //     cy.get('[data-testid="confirm-approve-button"]').click()
      
  //     cy.wait('@reviewApplication').its('response.statusCode').should('eq', 200)
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('be.visible')
  //       .and('contain', 'Application approved successfully')
      
  //     // Application status should update
  //     cy.get('[data-testid="application-card"]').first()
  //       .find('[data-testid="application-status"]').should('contain', 'Approved')
  //   })

  //   it('should bulk approve multiple applications', () => {
  //     cy.visit('/events/1/applications')
  //     cy.wait('@getPendingApplications')
      
  //     // Select multiple applications
  //     cy.get('[data-testid="select-application"]').eq(0).check()
  //     cy.get('[data-testid="select-application"]').eq(1).check()
      
  //     cy.get('[data-testid="bulk-approve-button"]').click()
      
  //     cy.get('[data-testid="bulk-approve-modal"]').should('be.visible')
  //     cy.get('[data-testid="confirm-bulk-approve-button"]').click()
      
  //     cy.wait('@reviewApplication')
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('be.visible')
  //       .and('contain', '2 applications approved successfully')
  //   })

  //   it('should show application details before approval', () => {
  //     cy.visit('/events/1/applications')
  //     cy.wait('@getPendingApplications')
      
  //     cy.get('[data-testid="view-application-button"]').first().click()
      
  //     cy.get('[data-testid="application-details-modal"]').should('be.visible')
  //     cy.get('[data-testid="student-name"]').should('contain', 'John Student')
  //     cy.get('[data-testid="student-email"]').should('contain', 'john@ku.ac.th')
  //     cy.get('[data-testid="student-id"]').should('contain', '6610000001')
  //     cy.get('[data-testid="application-date"]').should('be.visible')
  //   })

  //   it('should prevent approval when at capacity', () => {
  //     cy.intercept('GET', '**/api/activities/1', {
  //       body: {
  //         ...require('../fixtures/activities.json').validActivity,
  //         id: 1,
  //         max_participants: 2,
  //         current_participants: 2
  //       }
  //     }).as('getFullActivity')
      
  //     cy.visit('/events/1/applications')
  //     cy.wait('@getPendingApplications')
  //     cy.wait('@getFullActivity')
      
  //     cy.get('[data-testid="approve-button"]').should('be.disabled')
  //     cy.get('[data-testid="capacity-warning"]')
  //       .should('be.visible')
  //       .and('contain', 'Activity is at maximum capacity')
  //   })
  // })

  // describe('Reject Application', () => {
  //   beforeEach(() => {
  //     cy.intercept('GET', '**/api/activities/1/applications/', {
  //       body: {
  //         results: [
  //           {
  //             id: 1,
  //             user_name: 'John Student',
  //             status: 'pending',
  //             submitted_at: '2025-11-15T10:00:00Z'
  //           }
  //         ]
  //       }
  //     }).as('getPendingApplications')
  //   })

  //   it('should successfully reject application with reason', () => {
  //     cy.visit('/events/1/applications')
  //     cy.wait('@getPendingApplications')
      
  //     cy.get('[data-testid="application-card"]').first().within(() => {
  //       cy.get('[data-testid="reject-button"]').click()
  //     })
      
  //     cy.get('[data-testid="reject-confirmation-modal"]').should('be.visible')
  //     cy.get('[data-testid="rejection-reason-textarea"]').type('Does not meet experience requirements')
  //     cy.get('[data-testid="confirm-reject-button"]').click()
      
  //     cy.wait('@reviewApplication').its('response.statusCode').should('eq', 200)
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('be.visible')
  //       .and('contain', 'Application rejected')
      
  //     cy.get('[data-testid="application-card"]').first()
  //       .find('[data-testid="application-status"]').should('contain', 'Rejected')
  //   })

  //   it('should require rejection reason', () => {
  //     cy.visit('/events/1/applications') 
  //     cy.wait('@getPendingApplications')
      
  //     cy.get('[data-testid="reject-button"]').first().click()
  //     cy.get('[data-testid="confirm-reject-button"]').click()
      
  //     cy.get('[data-testid="reason-error"]')
  //       .should('be.visible')
  //       .and('contain', 'Rejection reason is required')
  //   })

  //   it('should allow bulk rejection', () => {
  //     cy.visit('/events/1/applications')
  //     cy.wait('@getPendingApplications')
      
  //     cy.get('[data-testid="select-application"]').check({ multiple: true })
  //     cy.get('[data-testid="bulk-reject-button"]').click()
      
  //     cy.get('[data-testid="bulk-reject-modal"]').should('be.visible')
  //     cy.get('[data-testid="bulk-rejection-reason-textarea"]').type('Event cancelled')
  //     cy.get('[data-testid="confirm-bulk-reject-button"]').click()
      
  //     cy.wait('@reviewApplication')
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('contain', 'applications rejected successfully')
  //   })
  // })

  // describe('Organizer Check-in Flow', () => {
  //   it('should generate and display check-in code', () => {
  //     cy.intercept('GET', '**/api/activities/1/checkin-code/', {
  //       body: { code: 'ABC123' }
  //     }).as('getCheckinCode')
      
  //     cy.visit('/events/1/checkin')
  //     cy.wait('@getCheckinCode')
      
  //     cy.get('[data-testid="checkin-code-display"]').should('contain', 'ABC123')
  //     cy.get('[data-testid="qr-code"]').should('be.visible')
      
  //     // Should be able to refresh code
  //     cy.get('[data-testid="refresh-code-button"]').click()
  //     cy.wait('@getCheckinCode')
  //   })

  //   it('should display real-time check-in list', () => {
  //     cy.intercept('GET', '**/api/activities/1/checkin-list/', {
  //       body: [
  //         {
  //           id: 1,
  //           user_name: 'John Student',
  //           student_id: '6610000001',
  //           checked_in_at: '2025-11-20T09:15:00Z',
  //           status: 'checked_in'
  //         }
  //       ]
  //     }).as('getCheckinList')
      
  //     cy.visit('/events/1/checkin')
  //     cy.wait('@getCheckinList')
      
  //     cy.get('[data-testid="checkin-list"]').should('be.visible')
  //     cy.get('[data-testid="checkin-entry"]').should('have.length', 1)
      
  //     cy.get('[data-testid="checkin-entry"]').first().within(() => {
  //       cy.get('[data-testid="student-name"]').should('contain', 'John Student')
  //       cy.get('[data-testid="student-id"]').should('contain', '6610000001')
  //       cy.get('[data-testid="checkin-time"]').should('contain', '09:15')
  //       cy.get('[data-testid="checkin-status"]').should('contain', 'Checked In')
  //     })
  //   })

  //   it('should show statistics of check-ins', () => {
  //     cy.intercept('GET', '**/api/activities/1/checkin-list/', {
  //       body: [
  //         { id: 1, status: 'checked_in' },
  //         { id: 2, status: 'checked_in' },
  //         { id: 3, status: 'absent' }
  //       ]
  //     }).as('getCheckinList')
      
  //     cy.visit('/events/1/checkin')
  //     cy.wait('@getCheckinList')
      
  //     cy.get('[data-testid="checkin-stats"]').should('be.visible')
  //     cy.get('[data-testid="checked-in-count"]').should('contain', '2')
  //     cy.get('[data-testid="absent-count"]').should('contain', '1')
  //     cy.get('[data-testid="total-approved"]').should('contain', '3')
  //   })

  //   it('should allow manual check-in for participants', () => {
  //     cy.intercept('GET', '**/api/activities/1/applications/', {
  //       body: {
  //         results: [
  //           { id: 1, user_name: 'Jane Student', status: 'approved' }
  //         ]
  //       }
  //     }).as('getApprovedApplications')
      
  //     cy.visit('/events/1/checkin')
  //     cy.wait('@getApprovedApplications')
      
  //     cy.get('[data-testid="manual-checkin-button"]').click()
  //     cy.get('[data-testid="manual-checkin-modal"]').should('be.visible')
      
  //     cy.get('[data-testid="participant-search"]').type('Jane')
  //     cy.get('[data-testid="participant-option"]').first().click()
  //     cy.get('[data-testid="confirm-manual-checkin"]').click()
      
  //     cy.wait('@checkin')
      
  //     cy.get('[data-testid="success-message"]')
  //       .should('be.visible')
  //       .and('contain', 'Manual check-in successful')
  //   })

  //   it('should export check-in data', () => {
  //     cy.visit('/events/1/checkin')
      
  //     cy.get('[data-testid="export-checkin-button"]').click()
      
  //     cy.get('[data-testid="export-options-modal"]').should('be.visible')
  //     cy.get('[data-testid="export-csv-button"]').click()
      
  //     // Verify download was triggered
  //     cy.readFile('cypress/downloads/checkin-data.csv').should('exist')
  //   })
  })
})