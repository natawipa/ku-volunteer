describe('Admin Features', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
  })

  describe('Create Activity', () => {
    it('should successfully create activity as admin', () => {
      cy.visit('/admin/activities/create')
      
      cy.fixture('activities').then((activities) => {
        const activity = activities.validActivity
        
        cy.get('[data-testid="activity-title-input"]').type(activity.title)
        cy.get('[data-testid="activity-description-textarea"]').type(activity.description)
        cy.get('[data-testid="activity-location-input"]').type(activity.location)
        
        // Set organizer
        cy.get('[data-testid="organizer-select"]').select('Computer Engineering Department')
        
        // Set dates
        cy.get('[data-testid="start-date-input"]').type('2025-12-01')
        cy.get('[data-testid="start-time-input"]').type('09:00')
        cy.get('[data-testid="end-date-input"]').type('2025-12-01')
        cy.get('[data-testid="end-time-input"]').type('16:00')
        
        cy.get('[data-testid="max-participants-input"]').type(activity.max_participants.toString())
        cy.get('[data-testid="hours-awarded-input"]').type(activity.hours_awarded.toString())
        
        // Auto-approve setting
        cy.get('[data-testid="auto-approve-checkbox"]').check()
        
        cy.get('[data-testid="create-activity-button"]').click()
        
        cy.wait('@createActivity').its('response.statusCode').should('eq', 201)
        
        cy.get('[data-testid="success-message"]')
          .should('be.visible')
          .and('contain', 'Activity created successfully')
        
        cy.url().should('include', '/admin/activities')
      })
    })

    it('should set activity status as admin', () => {
      cy.visit('/admin/activities/create')
      
      cy.fixture('activities').then((activities) => {
        cy.get('[data-testid="activity-title-input"]').type(activities.validActivity.title)
        cy.get('[data-testid="activity-description-textarea"]').type(activities.validActivity.description)
        
        // Admin can set initial status
        cy.get('[data-testid="activity-status-select"]').select('open')
        
        cy.get('[data-testid="create-activity-button"]').click()
        
        cy.wait('@createActivity')
        
        cy.get('[data-testid="success-message"]')
          .should('contain', 'Activity created and published')
      })
    })

    it('should assign activity to specific organizer', () => {
      cy.intercept('GET', '**/api/users/list/?role=organizer', {
        body: [
          { id: 1, name: 'John Organizer', email: 'john.org@ku.ac.th', organization: 'KU Engineering' },
          { id: 2, name: 'Jane Organizer', email: 'jane.org@redcross.org', organization: 'Red Cross' }
        ]
      }).as('getOrganizers')
      
      cy.visit('/admin/activities/create')
      cy.wait('@getOrganizers')
      
      cy.get('[data-testid="assign-organizer-select"]').select('john.org@ku.ac.th')
      
      cy.fixture('activities').then((activities) => {
        cy.get('[data-testid="activity-title-input"]').type(activities.validActivity.title)
        cy.get('[data-testid="activity-description-textarea"]').type(activities.validActivity.description)
        
        cy.get('[data-testid="create-activity-button"]').click()
        
        cy.wait('@createActivity')
        
        // Verify organizer assignment
        cy.get('[data-testid="assigned-organizer"]').should('contain', 'John Organizer')
      })
    })
  })

  describe('Approve/Reject Activity Submissions', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/activities/list/?status=pending', {
        body: {
          results: [
            {
              id: 1,
              title: 'Pending Activity 1',
              organizer_name: 'John Organizer',
              status: 'pending',
              submitted_at: '2025-11-15T10:00:00Z',
              description: 'This activity needs approval'
            },
            {
              id: 2,
              title: 'Pending Activity 2', 
              organizer_name: 'Jane Organizer',
              status: 'pending',
              submitted_at: '2025-11-15T11:00:00Z',
              description: 'Another activity for review'
            }
          ]
        }
      }).as('getPendingActivities')
    })

    it('should display pending activities for review', () => {
      cy.visit('/admin/activities/pending')
      cy.wait('@getPendingActivities')
      
      cy.get('[data-testid="pending-activities-list"]').should('be.visible')
      cy.get('[data-testid="pending-activity-card"]').should('have.length', 2)
      
      cy.get('[data-testid="pending-activity-card"]').first().within(() => {
        cy.get('[data-testid="activity-title"]').should('contain', 'Pending Activity 1')
        cy.get('[data-testid="organizer-name"]').should('contain', 'John Organizer')
        cy.get('[data-testid="submission-date"]').should('be.visible')
        cy.get('[data-testid="review-button"]').should('be.visible')
        cy.get('[data-testid="quick-approve-button"]').should('be.visible')
        cy.get('[data-testid="quick-reject-button"]').should('be.visible')
      })
    })

    it('should successfully approve activity submission', () => {
      cy.visit('/admin/activities/pending')
      cy.wait('@getPendingActivities')
      
      cy.get('[data-testid="pending-activity-card"]').first().within(() => {
        cy.get('[data-testid="review-button"]').click()
      })
      
      // Review activity details
      cy.get('[data-testid="activity-review-modal"]').should('be.visible')
      cy.get('[data-testid="activity-details"]').should('be.visible')
      
      cy.get('[data-testid="admin-notes-textarea"]').type('Activity approved - meets all guidelines')
      cy.get('[data-testid="approve-activity-button"]').click()
      
      cy.intercept('POST', '**/api/activities/moderation/1/review/', {
        statusCode: 200,
        body: { status: 'approved', message: 'Activity approved successfully' }
      }).as('approveActivity')
      
      cy.wait('@approveActivity')
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Activity approved successfully')
      
      // Activity should be removed from pending list
      cy.get('[data-testid="pending-activity-card"]').should('have.length', 1)
    })

    it('should successfully reject activity submission with reason', () => {
      cy.visit('/admin/activities/pending')
      cy.wait('@getPendingActivities')
      
      cy.get('[data-testid="pending-activity-card"]').first().within(() => {
        cy.get('[data-testid="review-button"]').click()
      })
      
      cy.get('[data-testid="activity-review-modal"]').should('be.visible')
      
      cy.get('[data-testid="admin-notes-textarea"]')
        .type('Activity description is insufficient. Please provide more details about objectives and requirements.')
      
      cy.get('[data-testid="reject-activity-button"]').click()
      
      cy.intercept('POST', '**/api/activities/moderation/1/review/', {
        statusCode: 200,
        body: { status: 'rejected', message: 'Activity rejected' }
      }).as('rejectActivity')
      
      cy.wait('@rejectActivity')
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Activity rejected')
    })

    it('should require admin notes for rejection', () => {
      cy.visit('/admin/activities/pending')
      cy.wait('@getPendingActivities')
      
      cy.get('[data-testid="review-button"]').first().click()
      cy.get('[data-testid="reject-activity-button"]').click()
      
      cy.get('[data-testid="notes-error"]')
        .should('be.visible')
        .and('contain', 'Rejection reason is required')
    })

    it('should bulk approve multiple activities', () => {
      cy.visit('/admin/activities/pending')
      cy.wait('@getPendingActivities')
      
      // Select multiple activities
      cy.get('[data-testid="select-activity-checkbox"]').check({ multiple: true })
      
      cy.get('[data-testid="bulk-actions-menu"]').click()
      cy.get('[data-testid="bulk-approve-button"]').click()
      
      cy.get('[data-testid="bulk-approve-modal"]').should('be.visible')
      cy.get('[data-testid="bulk-admin-notes"]').type('Bulk approval - all activities meet standards')
      cy.get('[data-testid="confirm-bulk-approve"]').click()
      
      cy.intercept('POST', '**/api/activities/bulk/approve/', {
        statusCode: 200,
        body: { approved_count: 2, message: '2 activities approved successfully' }
      }).as('bulkApprove')
      
      cy.wait('@bulkApprove')
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', '2 activities approved successfully')
    })

    it('should filter activities by organization type', () => {
      cy.visit('/admin/activities/pending')
      cy.wait('@getPendingActivities')
      
      cy.get('[data-testid="organization-filter"]').select('internal')
      
      cy.intercept('GET', '**/api/activities/list/?status=pending&org_type=internal', {
        body: {
          results: [
            {
              id: 1,
              title: 'Internal Activity',
              organizer_name: 'KU Engineering',
              organization_type: 'internal'
            }
          ]
        }
      }).as('getInternalActivities')
      
      cy.wait('@getInternalActivities')
      
      cy.get('[data-testid="pending-activity-card"]').should('have.length', 1)
      cy.get('[data-testid="organizer-name"]').should('contain', 'KU Engineering')
    })

    it('should search activities by title or organizer', () => {
      cy.visit('/admin/activities/pending')
      cy.wait('@getPendingActivities')
      
      cy.get('[data-testid="admin-search-input"]').type('John')
      
      cy.get('[data-testid="pending-activity-card"]')
        .should('have.length', 1)
        .and('contain', 'John Organizer')
    })
  })

  describe('Delete Activity', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/activities/list/', {
        body: {
          results: [
            { 
              id: 1, 
              title: 'Test Activity', 
              status: 'open',
              organizer_name: 'John Organizer',
              current_participants: 0
            }
          ]
        }
      }).as('getAllActivities')
    })

    it('should successfully delete activity as admin', () => {
      cy.visit('/admin/activities')
      cy.wait('@getAllActivities')
      
      cy.get('[data-testid="activity-row"]').first().within(() => {
        cy.get('[data-testid="activity-actions-menu"]').click()
        cy.get('[data-testid="delete-activity-option"]').click()
      })
      
      cy.get('[data-testid="admin-delete-modal"]').should('be.visible')
      cy.get('[data-testid="deletion-reason-textarea"]')
        .type('Activity violates community guidelines')
      
      cy.get('[data-testid="confirm-admin-delete"]').click()
      
      cy.wait('@deleteActivity').its('response.statusCode').should('eq', 204)
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Activity deleted successfully')
    })

    it('should handle deletion of activity with participants', () => {
      cy.intercept('GET', '**/api/activities/list/', {
        body: {
          results: [
            { 
              id: 1, 
              title: 'Activity with Participants',
              current_participants: 5,
              max_participants: 10
            }
          ]
        }
      }).as('getActivityWithParticipants')
      
      cy.visit('/admin/activities')
      cy.wait('@getActivityWithParticipants')
      
      cy.get('[data-testid="delete-activity-option"]').click()
      
      cy.get('[data-testid="admin-delete-modal"]').should('be.visible')
      cy.get('[data-testid="participants-warning"]')
        .should('be.visible')
        .and('contain', 'This activity has 5 registered participants')
      
      cy.get('[data-testid="notify-participants-checkbox"]').should('be.visible').check()
      cy.get('[data-testid="participant-message-textarea"]')
        .type('We apologize for the inconvenience. This activity has been cancelled.')
      
      cy.get('[data-testid="deletion-reason-textarea"]')
        .type('Organizer safety concerns')
      
      cy.get('[data-testid="confirm-admin-delete"]').click()
      
      cy.wait('@deleteActivity')
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Activity deleted and participants notified')
    })

    it('should process deletion requests from organizers', () => {
      cy.intercept('GET', '**/api/activities/deletion-requests/', {
        body: {
          results: [
            {
              id: 1,
              activity_title: 'Activity to Delete',
              reason: 'Budget constraints',
              requested_at: '2025-11-15T10:00:00Z',
              status: 'pending',
              organizer_name: 'John Organizer'
            }
          ]
        }
      }).as('getDeletionRequests')
      
      cy.visit('/admin/deletion-requests')
      cy.wait('@getDeletionRequests')
      
      cy.get('[data-testid="deletion-request-card"]').should('have.length', 1)
      
      cy.get('[data-testid="deletion-request-card"]').first().within(() => {
        cy.get('[data-testid="activity-title"]').should('contain', 'Activity to Delete')
        cy.get('[data-testid="deletion-reason"]').should('contain', 'Budget constraints')
        cy.get('[data-testid="approve-deletion-button"]').should('be.visible')
        cy.get('[data-testid="reject-deletion-button"]').should('be.visible')
      })
    })

    it('should approve organizer deletion request', () => {
      cy.intercept('GET', '**/api/activities/deletion-requests/', {
        body: { results: [{ id: 1, activity_title: 'Test Activity' }] }
      }).as('getDeletionRequests')
      
      cy.visit('/admin/deletion-requests')
      cy.wait('@getDeletionRequests')
      
      cy.get('[data-testid="approve-deletion-button"]').first().click()
      
      cy.get('[data-testid="approve-deletion-modal"]').should('be.visible')
      cy.get('[data-testid="admin-review-notes"]').type('Deletion approved - valid reason provided')
      cy.get('[data-testid="confirm-approve-deletion"]').click()
      
      cy.intercept('POST', '**/api/activities/deletion-requests/1/review/', {
        statusCode: 200,
        body: { status: 'approved' }
      }).as('approveDeletion')
      
      cy.wait('@approveDeletion')
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Deletion request approved')
    })
  })

  describe('Manage Users', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/users/list/', {
        body: [
          {
            id: 1,
            email: 'student@ku.ac.th',
            first_name: 'John',
            last_name: 'Student',
            role: 'student',
            is_active: true,
            created_at: '2025-01-01T00:00:00Z'
          },
          {
            id: 2,
            email: 'organizer@ku.ac.th',
            first_name: 'Jane', 
            last_name: 'Organizer',
            role: 'organizer',
            is_active: true,
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      }).as('getAllUsers')
    })

    it('should display all users in admin panel', () => {
      cy.visit('/admin/users')
      cy.wait('@getAllUsers')
      
      cy.get('[data-testid="users-table"]').should('be.visible')
      cy.get('[data-testid="user-row"]').should('have.length', 2)
      
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="user-email"]').should('contain', 'student@ku.ac.th')
        cy.get('[data-testid="user-name"]').should('contain', 'John Student')
        cy.get('[data-testid="user-role"]').should('contain', 'Student')
        cy.get('[data-testid="user-status"]').should('contain', 'Active')
        cy.get('[data-testid="user-actions"]').should('be.visible')
      })
    })

    it('should successfully delete a user', () => {
      cy.visit('/admin/users')
      cy.wait('@getAllUsers')
      
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="user-actions-menu"]').click()
        cy.get('[data-testid="delete-user-option"]').click()
      })
      
      cy.get('[data-testid="delete-user-modal"]').should('be.visible')
      cy.get('[data-testid="delete-reason-textarea"]')
        .type('Account violation - inappropriate behavior')
      
      cy.get('[data-testid="confirm-delete-user"]').click()
      
      cy.intercept('DELETE', '**/api/users/delete/1/', {
        statusCode: 204
      }).as('deleteUser')
      
      cy.wait('@deleteUser')
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'User deleted successfully')
      
      // User should be removed from list
      cy.get('[data-testid="user-row"]').should('have.length', 1)
    })

    it('should deactivate/reactivate user account', () => {
      cy.visit('/admin/users')
      cy.wait('@getAllUsers')
      
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="user-actions-menu"]').click()
        cy.get('[data-testid="deactivate-user-option"]').click()
      })
      
      cy.get('[data-testid="deactivate-user-modal"]').should('be.visible')
      cy.get('[data-testid="deactivation-reason-textarea"]')
        .type('Temporary suspension - under investigation')
      
      cy.get('[data-testid="confirm-deactivate-user"]').click()
      
      cy.intercept('PATCH', '**/api/users/1/update/', {
        statusCode: 200,
        body: { is_active: false, message: 'User deactivated successfully' }
      }).as('deactivateUser')
      
      cy.wait('@deactivateUser')
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'User deactivated successfully')
      
      cy.get('[data-testid="user-status"]').first().should('contain', 'Inactive')
    })

    it('should filter users by role', () => {
      cy.visit('/admin/users')
      cy.wait('@getAllUsers')
      
      cy.get('[data-testid="role-filter"]').select('student')
      
      cy.intercept('GET', '**/api/users/list/?role=student', {
        body: [
          { id: 1, email: 'student@ku.ac.th', role: 'student' }
        ]
      }).as('getStudentUsers')
      
      cy.wait('@getStudentUsers')
      
      cy.get('[data-testid="user-row"]').should('have.length', 1)
      cy.get('[data-testid="user-role"]').should('contain', 'Student')
    })

    it('should search users by email or name', () => {
      cy.visit('/admin/users')
      cy.wait('@getAllUsers')
      
      cy.get('[data-testid="user-search-input"]').type('john')
      
      // Should filter results in real-time
      cy.get('[data-testid="user-row"]')
        .should('have.length', 1)
        .and('contain', 'John Student')
    })

    it('should view user details and activity history', () => {
      cy.visit('/admin/users')
      cy.wait('@getAllUsers')
      
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="view-user-details"]').click()
      })
      
      cy.intercept('GET', '**/api/users/1/', {
        body: {
          id: 1,
          email: 'student@ku.ac.th',
          profile: { student_id_external: '6610000001', year: 3 },
          applications: [
            { activity_title: 'Community Service', status: 'approved' }
          ]
        }
      }).as('getUserDetails')
      
      cy.wait('@getUserDetails')
      
      cy.get('[data-testid="user-details-modal"]').should('be.visible')
      cy.get('[data-testid="user-profile-info"]').should('be.visible')
      cy.get('[data-testid="user-applications-list"]').should('be.visible')
      
      cy.get('[data-testid="application-item"]')
        .should('have.length', 1)
        .and('contain', 'Community Service')
    })

    it('should bulk manage users', () => {
      cy.visit('/admin/users')
      cy.wait('@getAllUsers')
      
      // Select multiple users
      cy.get('[data-testid="select-user-checkbox"]').check({ multiple: true })
      
      cy.get('[data-testid="bulk-actions-dropdown"]').click()
      cy.get('[data-testid="bulk-deactivate-option"]').click()
      
      cy.get('[data-testid="bulk-deactivate-modal"]').should('be.visible')
      cy.get('[data-testid="bulk-reason-textarea"]').type('Maintenance period - temporary deactivation')
      cy.get('[data-testid="confirm-bulk-deactivate"]').click()
      
      cy.intercept('PATCH', '**/api/users/bulk/deactivate/', {
        statusCode: 200,
        body: { deactivated_count: 2, message: '2 users deactivated successfully' }
      }).as('bulkDeactivate')
      
      cy.wait('@bulkDeactivate')
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', '2 users deactivated successfully')
    })
  })
})