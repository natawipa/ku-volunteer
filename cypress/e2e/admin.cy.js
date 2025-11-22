describe('Admin Features', () => {
  let PendingActivity, DeletionRequestActivity;
  let Students = [];
  let Student = null;

  beforeEach(() => {
    cy.loginAsAdmin()
    cy.window().then((win) => {
      const token = win.localStorage.getItem('access_token');
      console.log('Access token in localStorage:', token ? 'EXISTS' : 'MISSING');
    });

    cy.fixture('activities').then((activities) => {
      PendingActivity = activities.PendingActivity
      DeletionRequestActivity = activities.DeletionRequestActivity
    })

    cy.fixture('users').then((users) => {
      // Robust normalization: support array-shaped or object-shaped fixtures
      if (Array.isArray(users)) {
        Students = users.filter(u => u && u.role === 'student');
        Student = Students[0] || null;
      } else {
        // users may be an object with named exports or nested objects
        const values = Object.values(users).flat().filter(Boolean);
        Students = values.filter(u => u && u.role === 'student');
        // prefer explicit users.student if provided, otherwise first student found
        Student = users.student || Students[0] || null;
      }
    })
  })

  describe('Approve/Reject Activity Submissions', () => {
    beforeEach(() => {
      // intercept activities list endpoint
      cy.intercept('GET', 'http://localhost:8000/api/activities/list/', {
        statusCode: 200,
        body: {
          count: 1,
          next: null,
          previous: null,
          results: [PendingActivity]
        }
      }).as('getActivities')

      // intercept the activity detail endpoint
      cy.intercept('GET', 'http://localhost:8000/api/activities/16/', {
        statusCode: 200,
        body: PendingActivity
      }).as('getActivityDetail')

      // intercept moderation and return approved activity
      cy.intercept('POST', 'http://localhost:8000/api/activities/moderation/16/review/', (req) => {
        console.log('Moderation request:', req.body);
        
        req.reply({
          statusCode: 200,
          body: { 
            detail: 'Activity approved successfully',
            activity: {
              ...PendingActivity,
              status: 'open' // update from pending
            }
          }
        });
      }).as('moderateActivity')

      cy.intercept('GET', '**/api/activities/deletion-requests/**', {
        statusCode: 200,
        body: {
          count: 1,
          next: null,
          previous: null,
          results: [DeletionRequestActivity]
        }
      }).as('getDeletionRequests');

    })
    it('should display pending activities for review', () => {
      cy.visit('/admin/events/pending')
      cy.wait('@getActivities')
      
      cy.get('body', { timeout: 10000 }).should('be.visible')
      
      cy.contains('Pending Activity 1', { timeout: 10000 })
        .should('be.visible')
      
      cy.get('a[href*="/admin/approve/create/16"]', { timeout: 10000 })
        .first()
        .should('be.visible')
        .click({ force: true })
      
      cy.url().should('include', '/admin/approve/create/16')
    })

    it('should approve creation after clicking card', () => {
      cy.visit('/admin/approve/create/16')
      
      cy.wait('@getActivityDetail', { timeout: 15000 })
      
      // check loading disappearance
      cy.contains('Loading activity...', { timeout: 5000 }).should('not.exist')
      
      // check page content
      cy.contains('Pending Activity 1', { timeout: 15000 }).should('be.visible')
      cy.contains('Status:', { timeout: 15000 }).should('be.visible')
      cy.contains('pending', { timeout: 15000 }).should('be.visible')
      
      // check description
      cy.contains('Description', { timeout: 10000 }).should('be.visible')
      // check checkbox
      cy.get('#approveCheck', { timeout: 15000 })
        .should('exist')
        .should('be.visible')
        .should('not.be.disabled')
        .click({ force: true })
      
      cy.get('#approveCheck').should('be.checked')
      
      cy.wait(1000)
      
      cy.contains('button', 'Approve Creation', { timeout: 15000 })
        .should('exist')
        .should('be.visible')
        .should('not.be.disabled')
        .click({ force: true })
      
      cy.wait('@moderateActivity', { timeout: 15000 })
      
      // check success message
      cy.contains('Activity approved successfully', { timeout: 10000 })
        .should('be.visible')

      cy.wait(1000)

      // update intercept to return approved activities
      cy.intercept('GET', 'http://localhost:8000/api/activities/list/', {
        statusCode: 200,
        body: {
          count: 1,
          next: null,
          previous: null,
          results: [{
            ...PendingActivity,
            status: 'open' 
          }]
        }
      }).as('getApprovedActivities')

      cy.visit('/admin/events/approved')
      cy.wait('@getApprovedActivities')

      cy.get('body', { timeout: 10000 }).should('be.visible')
      
      // activity change to open and appear in approved list
      cy.contains('Pending Activity 1', { timeout: 10000 })
        .should('be.visible')
      
    })
    
    it('should reject creation after clicking card', () => {
      cy.intercept('POST', 'http://localhost:8000/api/activities/moderation/16/review/', (req) => {
        // Verify the request have rejection reason
        expect(req.body.action).to.equal('reject');
        expect(req.body.reason).to.exist;
        expect(req.body.reason).to.not.be.empty;
        
        req.reply({
          statusCode: 200,
          body: { 
            detail: 'Activity rejected successfully',
            activity: {
              ...PendingActivity,
              status: 'rejected',
              rejection_reason: req.body.reason
            }
          }
        });
      }).as('rejectActivity');

      cy.visit('/admin/approve/create/16')
      
      cy.wait('@getActivityDetail', { timeout: 15000 })
      cy.contains('Loading activity...', { timeout: 5000 }).should('not.exist')
      cy.contains('Pending Activity 1', { timeout: 15000 }).should('be.visible')
      cy.contains('Status:', { timeout: 15000 }).should('be.visible')
      cy.contains('pending', { timeout: 15000 }).should('be.visible')
      cy.contains('Description', { timeout: 10000 }).should('be.visible')
      
      // Click reject checkbox
      cy.get('#rejectCheck', { timeout: 15000 })
        .should('be.visible')
        .should('not.be.disabled')
        .click({ force: true })
      
      cy.get('#rejectCheck').should('be.checked')

      cy.get('[data-testid="reject-reason-textarea"]')
        .type('Rejection reason', { force: true })
      
      // Click confirm
      cy.contains('button', 'Reject Creation', { timeout: 15000 })
        .should('exist')
        .should('be.visible')
        .should('not.be.disabled')
        .click({ force: true })

      cy.wait('@rejectActivity', { timeout: 15000 })
      
      cy.contains('Activity rejected successfully', { timeout: 10000 })
        .should('be.visible')

      cy.wait(1000)

      cy.intercept('GET', 'http://localhost:8000/api/activities/list/', {
        statusCode: 200,
        body: {
          count: 1,
          next: null,
          previous: null,
          results: [{
            ...PendingActivity,
            status: 'rejected' 
          }]
        }
      }).as('getRejectActivities')

      cy.visit('/admin/events/rejected')
      cy.wait('@getRejectActivities')

      cy.get('body', { timeout: 10000 }).should('be.visible')
      
      cy.contains('Pending Activity 1', { timeout: 10000 })
        .should('be.visible')
    })

    it('should approve activity deletion request', () => {

      cy.intercept('POST', '**/api/activities/deletion-requests/1/review/', (req) => {
        expect(req.body.action).to.equal('approve');
        
        req.reply({
          statusCode: 200,
          body: { 
            detail: 'Deletion request approved and activity deleted.',
            count: 1,
            results: [
              {
                ...DeletionRequestActivity,
                activity: null,
                status: "approved",
                review_note: req.body.note || ""
              }
            ]
          }
        });
      }).as('reviewDeletionRequest');

      // list page
      cy.visit('/admin/events/request-delete');
      cy.wait('@getDeletionRequests');
      
      // click card
      cy.get('a[href*="/admin/approve/delete/1"]')
        .should('exist')
        .click({ force: true });

      // navigation
      cy.url().should('include', '/admin/approve/delete/1');
      
      // check detail page
      cy.wait(['@getDeletionRequests', '@getActivityDetail'], { timeout: 15000 });

      cy.contains('h1', 'Pending Activity 1').should('be.visible');
      cy.contains('Reason for Deletion').should('be.visible');

      // approve checkbox
      cy.contains('label', 'Approve Deletion')
        .should('be.visible')
        .find('input[type="checkbox"]')
        .click({ force: true });

      cy.contains('label', 'Approve Deletion', { timeout: 15000 }).find('input[type="checkbox"]').should('be.checked');
      
      cy.contains('button', 'Approve Deletion', { timeout: 15000 })
        .should('be.visible')
        .click({ force: true });
      
      cy.wait(1000);
      
      cy.wait('@reviewDeletionRequest').then((interception) => {
        // check API response has approved status
        expect(interception.response.body.detail).to.equal('Deletion request approved and activity deleted.');
        expect(interception.response.body.results[0].status).to.equal('approved');
      });
    });

    it('should reject activity deletion request', () => {
      cy.intercept('POST', '**/api/activities/deletion-requests/1/review/', (req) => {
        expect(req.body.action).to.equal('reject');
        expect(req.body.note).to.exist;
        expect(req.body.note).to.not.be.empty;
        
        req.reply({
          statusCode: 200,
          body: { 
            detail: 'Deletion request rejected.',
            count: 1,
            results: [
              {
                ...DeletionRequestActivity,
                status: "rejected",
                review_note: req.body.note || ""
              }
            ]
          }
        });
      }).as('reviewDeletionRequest');

      //  list page
      cy.visit('/admin/events/request-delete');
      cy.wait('@getDeletionRequests');
      
      // click card
      cy.get('a[href*="/admin/approve/delete/1"]')
        .should('exist')
        .click({ force: true });

      // navigation
      cy.url().should('include', '/admin/approve/delete/1');
      
      // detail page
      cy.wait(['@getDeletionRequests', '@getActivityDetail'], { timeout: 15000 });

      // check detail page
      cy.contains('h1', 'Pending Activity 1').should('be.visible');
      cy.contains('Reason for Deletion').should('be.visible');

      // reject checkbox
      cy.contains('label', 'Reject Deletion')
        .should('be.visible')
        .find('input[type="checkbox"]')
        .click({ force: true });

      cy.contains('label', 'Reject Deletion', { timeout: 15000 }).find('input[type="checkbox"]').should('be.checked');
      
      cy.get('[data-testid="reject-reason-textarea"]')
        .type('Rejection note for deletion request', { force: true });
      
      cy.contains('button', 'Reject Deletion', { timeout: 15000 })
        .should('be.visible')
        .click({ force: true });
      
      cy.wait(1000);
      
      cy.wait('@reviewDeletionRequest').then((interception) => {
        // check API response has rejected status
        expect(interception.response.body.detail).to.equal('Deletion request rejected.');
        expect(interception.response.body.results[0].status).to.equal('rejected');
      });
    })

    it('should delete a student', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');
        
        if (!token) {
          throw new Error('Access token not found in localStorage');
        }

        cy.request({
          method: 'GET',
          url: 'http://localhost:8000/api/users/list/',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then((response) => {
          const allStudents = response.body.results;
          
          // find John
          let john = allStudents.find(s => 
            s.first_name === 'John' && 
            s.last_name === 'Student' &&
            s.role === 'student'
          );

          // create john
          if (!john) {
            
            const johnData = {
              email: 'john.student.test@ku.ac.th',
              password: 'testpassword123',
              first_name: 'John',
              last_name: 'Student',
              title: 'Mr',
              role: 'student',
              student_id: '6610000099'
            };

            cy.request({
              method: 'POST',
              url: 'http://localhost:8000/api/users/register/',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: johnData
            }).then((createResponse) => {
              john = createResponse.body; 
              
              performDeletionTest(john, allStudents, token);
            });
          } else {
            performDeletionTest(john, allStudents, token);
          }
        });
      });

      // avoid code duplication
      function performDeletionTest(john, allStudents, token) {
        const alice = allStudents.find(s => s.first_name === 'Alice' && s.last_name === 'Student');

        const mockStudents = [
          {
            id: john.id,
            first_name: john.first_name,
            last_name: john.last_name,
            title: john.title || 'Mr',
            email: john.email,
            role: 'student',
            student_id: john.student_id || '6610000099'
          },
          alice ? {
            id: alice.id,
            first_name: alice.first_name,
            last_name: alice.last_name,
            title: alice.title || 'Ms',
            email: alice.email,
            role: 'student',
            student_id: alice.student_id
          } : null
        ].filter(Boolean);

        cy.intercept('GET', '**/api/users/list/**', {
          statusCode: 200,
          body: {
            count: mockStudents.length,
            next: null,
            previous: null,
            results: mockStudents
          }
        }).as('getStudents');

        cy.intercept('DELETE', `**/api/users/delete/${john.id}/`, {
          statusCode: 204
        }).as('deleteStudent');

        // Visit page
        cy.visit('/admin/student-list');
        
        cy.wait('@getStudents');
        cy.contains('Student Name').should('be.visible');
        
        cy.wait(1000);

        // find John and delete
        cy.contains(john.first_name)
          .parents('tr, div[data-testid="student-row"]')
          .within(() => {
            cy.get('button').contains(/delete/i).click();
          });
        
        // confirm deletion
        cy.get('[data-testid="confirm-delete-button"]')
          .should('be.visible')
          .click();
        
        cy.wait('@deleteStudent');
        
        // Verify John is removed
        cy.contains(john.first_name).should('not.exist');
      }
    });


   it('should delete organization name', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');

        // test organizer if doesn't exist
        const testOrganizerData = {
          email: 'test.org@external.com',
          password: 'testpassword123',
          first_name: 'External',
          last_name: 'Organizer',
          title: 'Mr',
          role: 'organizer',
          organization_name: 'Test External Organization',
          organization_type: 'external'
        };

        cy.request({
          method: 'POST',
          url: 'http://localhost:8000/api/users/register/',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: testOrganizerData,
          failOnStatusCode: false
        }).then(() => {
          
          cy.request({
            method: 'GET',
            url: 'http://localhost:8000/api/users/list/',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then((response) => {
            const allUsers = response.body.results;
            
            const testOrganizer = allUsers.find(o => 
              o.email === 'test.org@external.com' &&
              o.role === 'organizer'
            );

            cy.intercept('GET', '**/api/users/list/**', {
              statusCode: 200,
              body: {
                count: 1,
                next: null,
                previous: null,
                results: [testOrganizer]
              }
            }).as('getOrganizers');

            cy.intercept('DELETE', `**/api/users/delete/${testOrganizer.id}/`, {
              statusCode: 204
            }).as('deleteOrganizer');

            cy.visit('/admin/organization-list');
            
            cy.wait('@getOrganizers');
            cy.url().should('include', '/admin/organization-list');
            cy.contains('Organization Name').should('be.visible');
            
            cy.wait(1000);

            // find and delete the organization
            const orgName = testOrganizer.organizer_profile?.organization_name || 'Test External Organization';
            
            cy.contains('div[data-testid="organization-row"]', orgName)
              .within(() => {
                cy.get('[data-testid="delete-organization"]')
                  .should('be.visible')
                  .click();
              });
            cy.get('[data-testid="confirm-delete-organization"]')
              .should('be.visible')
              .click();

            cy.wait('@deleteOrganizer');

            // verify organization is removed
            cy.contains(orgName).should('not.exist');
          });
        });
      });
    });
  });
});