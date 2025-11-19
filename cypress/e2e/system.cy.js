describe('System Features', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Navigation and Access Control', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/student/dashboard')
      
      cy.url().should('include', '/auth/login')
      cy.get('[data-testid="login-required-message"]')
        .should('be.visible')
        .and('contain', 'Please log in to continue')
    })

    it('should display appropriate navigation for each user role', () => {
      // Test student navigation
      cy.loginAsStudent()
      cy.visit('/')
      
      cy.get('[data-testid="navigation-menu"]').should('be.visible')
      cy.get('[data-testid="nav-dashboard"]').should('be.visible')
      cy.get('[data-testid="nav-activities"]').should('be.visible')
      cy.get('[data-testid="nav-my-applications"]').should('be.visible')
      cy.get('[data-testid="nav-profile"]').should('be.visible')
      
      // Should not see organizer/admin links
      cy.get('[data-testid="nav-create-activity"]').should('not.exist')
      cy.get('[data-testid="nav-admin-panel"]').should('not.exist')
    })

    it('should display organizer navigation', () => {
      cy.loginAsOrganizer()
      cy.visit('/')
      
      cy.get('[data-testid="navigation-menu"]').should('be.visible')
      cy.get('[data-testid="nav-organizer-dashboard"]').should('be.visible')
      cy.get('[data-testid="nav-create-activity"]').should('be.visible')
      cy.get('[data-testid="nav-my-activities"]').should('be.visible')
      cy.get('[data-testid="nav-applications"]').should('be.visible')
      
      // Should not see admin links
      cy.get('[data-testid="nav-admin-panel"]').should('not.exist')
      cy.get('[data-testid="nav-manage-users"]').should('not.exist')
    })

    it('should display admin navigation', () => {
      cy.loginAsAdmin()
      cy.visit('/')
      
      cy.get('[data-testid="navigation-menu"]').should('be.visible')
      cy.get('[data-testid="nav-admin-panel"]').should('be.visible')
      cy.get('[data-testid="nav-manage-activities"]').should('be.visible')
      cy.get('[data-testid="nav-manage-users"]').should('be.visible')
      cy.get('[data-testid="nav-system-settings"]').should('be.visible')
      
      // Admin should also see organizer functionality
      cy.get('[data-testid="nav-create-activity"]').should('be.visible')
    })

    it('should enforce role-based access control', () => {
      cy.loginAsStudent()
      
      // Student should not access admin routes
      cy.intercept('GET', '**/api/admin/**', { statusCode: 403 }).as('adminAccess')
      
      cy.visit('/admin/activities', { failOnStatusCode: false })
      
      cy.url().should('not.include', '/admin')
      cy.get('[data-testid="access-denied-message"]')
        .should('be.visible')
        .and('contain', 'Access denied. Insufficient permissions.')
      
      // Student should not access organizer creation
      cy.visit('/organizer/activities/create', { failOnStatusCode: false })
      
      cy.get('[data-testid="access-denied-message"]')
        .should('be.visible')
        .and('contain', 'This page is for organizers only')
    })

    it('should handle mobile navigation', () => {
      cy.viewport('iphone-x')
      cy.loginAsStudent()
      cy.visit('/')
      
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
      cy.get('[data-testid="mobile-menu-button"]').click()
      
      cy.get('[data-testid="mobile-navigation-drawer"]').should('be.visible')
      cy.get('[data-testid="mobile-nav-dashboard"]').should('be.visible')
      cy.get('[data-testid="mobile-nav-activities"]').should('be.visible')
      
      // Close mobile menu
      cy.get('[data-testid="mobile-menu-close"]').click()
      cy.get('[data-testid="mobile-navigation-drawer"]').should('not.be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should display 404 page for non-existent routes', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false })
      
      cy.get('[data-testid="error-404"]').should('be.visible')
      cy.get('[data-testid="error-title"]').should('contain', 'Page Not Found')
      cy.get('[data-testid="error-description"]')
        .should('contain', 'The page you are looking for does not exist')
      
      cy.get('[data-testid="back-to-home-button"]').should('be.visible')
      cy.get('[data-testid="back-to-home-button"]').click()
      
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })

    it('should handle API errors gracefully', () => {
      cy.loginAsStudent()
      
      cy.intercept('GET', '**/api/activities/list/', { 
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('serverError')
      
      cy.visit('/all-events')
      cy.wait('@serverError')
      
      cy.get('[data-testid="api-error-message"]')
        .should('be.visible')
        .and('contain', 'Unable to load activities')
      
      cy.get('[data-testid="retry-button"]').should('be.visible')
      
      // Test retry functionality
      cy.intercept('GET', '**/api/activities/list/', {
        body: { results: [] }
      }).as('retrySuccess')
      
      cy.get('[data-testid="retry-button"]').click()
      cy.wait('@retrySuccess')
      
      cy.get('[data-testid="api-error-message"]').should('not.exist')
    })

    it('should handle network connectivity issues', () => {
      cy.loginAsStudent()
      
      cy.intercept('GET', '**/api/activities/list/', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/all-events')
      cy.wait('@networkError')
      
      cy.get('[data-testid="network-error-message"]')
        .should('be.visible')
        .and('contain', 'Network connection problem')
      
      cy.get('[data-testid="offline-indicator"]').should('be.visible')
    })

    it('should handle authentication token expiration', () => {
      cy.loginAsStudent()
      
      cy.intercept('GET', '**/api/**', { 
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('tokenExpired')
      
      cy.visit('/student/dashboard')
      cy.wait('@tokenExpired')
      
      cy.get('[data-testid="session-expired-modal"]').should('be.visible')
      cy.get('[data-testid="session-expired-message"]')
        .should('contain', 'Your session has expired')
      
      cy.get('[data-testid="login-again-button"]').click()
      cy.url().should('include', '/auth/login')
    })

    it('should show loading states appropriately', () => {
      cy.loginAsStudent()
      
      cy.intercept('GET', '**/api/activities/list/', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(res.send({ results: [] })), 2000)
          })
        })
      }).as('slowApiResponse')
      
      cy.visit('/all-events')
      
      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      cy.get('[data-testid="loading-message"]')
        .should('be.visible')
        .and('contain', 'Loading activities')
      
      cy.wait('@slowApiResponse')
      
      cy.get('[data-testid="loading-spinner"]').should('not.exist')
    })
  })

  describe('Search and Filtering', () => {
    beforeEach(() => {
      cy.fixture('activities').then((activities) => {
        cy.intercept('GET', '**/api/activities/list/', {
          body: { results: activities.allActivities }
        }).as('getActivities')
      })
      
      cy.loginAsStudent()
      cy.visit('/all-events')
      cy.wait('@getActivities')
    })

    it('should search activities by title', () => {
      cy.get('[data-testid="search-input"]').type('Community')
      
      cy.intercept('GET', '**/api/activities/list/?search=Community', {
        body: { 
          results: [
            {
              id: 1,
              title: 'Community Garden Project',
              description: 'Help build a community garden'
            }
          ]
        }
      }).as('searchResults')
      
      cy.wait('@searchResults')
      
      cy.get('[data-testid="activity-card"]').should('have.length', 1)
      cy.get('[data-testid="activity-title"]').should('contain', 'Community Garden')
    })

    it('should filter activities by category', () => {
      cy.get('[data-testid="category-filter"]').select('environment')
      
      cy.intercept('GET', '**/api/activities/list/?category=environment', {
        body: { 
          results: [
            {
              id: 1,
              title: 'Beach Cleanup',
              category: 'environment'
            }
          ]
        }
      }).as('categoryFilter')
      
      cy.wait('@categoryFilter')
      
      cy.get('[data-testid="activity-card"]').should('have.length', 1)
      cy.get('[data-testid="activity-category"]').should('contain', 'Environment')
    })

    it('should filter activities by date range', () => {
      cy.get('[data-testid="date-filter-toggle"]').click()
      cy.get('[data-testid="start-date-filter"]').type('2025-12-01')
      cy.get('[data-testid="end-date-filter"]').type('2025-12-31')
      cy.get('[data-testid="apply-date-filter"]').click()
      
      cy.intercept('GET', '**/api/activities/list/?start_date=2025-12-01&end_date=2025-12-31', {
        body: { 
          results: [
            {
              id: 1,
              title: 'December Activity',
              start_date: '2025-12-15'
            }
          ]
        }
      }).as('dateFilter')
      
      cy.wait('@dateFilter')
      
      cy.get('[data-testid="activity-card"]').should('have.length', 1)
    })

    it('should filter by volunteer hours', () => {
      cy.get('[data-testid="hours-filter"]').select('5+')
      
      cy.intercept('GET', '**/api/activities/list/?min_hours=5', {
        body: { 
          results: [
            {
              id: 1,
              title: 'Long Volunteer Activity',
              hours_awarded: 8
            }
          ]
        }
      }).as('hoursFilter')
      
      cy.wait('@hoursFilter')
      
      cy.get('[data-testid="activity-card"]').should('have.length', 1)
      cy.get('[data-testid="activity-hours"]').should('contain', '8 hours')
    })

    it('should combine multiple filters', () => {
      cy.get('[data-testid="category-filter"]').select('education')
      cy.get('[data-testid="hours-filter"]').select('3+')
      cy.get('[data-testid="search-input"]').type('workshop')
      
      cy.intercept('GET', '**/api/activities/list/?category=education&min_hours=3&search=workshop', {
        body: { 
          results: [
            {
              id: 1,
              title: 'Educational Workshop',
              category: 'education',
              hours_awarded: 4
            }
          ]
        }
      }).as('combinedFilters')
      
      cy.wait('@combinedFilters')
      
      cy.get('[data-testid="activity-card"]').should('have.length', 1)
    })

    it('should clear all filters', () => {
      cy.get('[data-testid="category-filter"]').select('education')
      cy.get('[data-testid="search-input"]').type('test')
      
      cy.get('[data-testid="clear-filters-button"]').click()
      
      cy.get('[data-testid="category-filter"]').should('have.value', '')
      cy.get('[data-testid="search-input"]').should('have.value', '')
      cy.get('[data-testid="hours-filter"]').should('have.value', '')
      
      cy.wait('@getActivities') // Should reload all activities
    })

    it('should show no results message when filters match nothing', () => {
      cy.get('[data-testid="search-input"]').type('nonexistentactivity123')
      
      cy.intercept('GET', '**/api/activities/list/?search=nonexistentactivity123', {
        body: { results: [] }
      }).as('noResults')
      
      cy.wait('@noResults')
      
      cy.get('[data-testid="no-results-message"]')
        .should('be.visible')
        .and('contain', 'No activities found')
      
      cy.get('[data-testid="clear-search-suggestion"]')
        .should('be.visible')
        .and('contain', 'Try adjusting your search criteria')
    })
  })

  describe('Accessibility and Usability', () => {
    it('should support keyboard navigation', () => {
      cy.loginAsStudent()
      cy.visit('/all-events')
      
      // Test tab navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'search-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'category-filter')
      
      // Test enter key functionality
      cy.get('[data-testid="activity-card"]').first().focus()
      cy.focused().type('{enter}')
      
      cy.url().should('include', '/activities/')
    })

    it('should have proper ARIA labels and roles', () => {
      cy.loginAsStudent()
      cy.visit('/all-events')
      
      cy.get('[data-testid="search-input"]')
        .should('have.attr', 'aria-label', 'Search activities')
      
      cy.get('[data-testid="activity-card"]').first()
        .should('have.attr', 'role', 'button')
        .and('have.attr', 'aria-label')
      
      cy.get('[data-testid="category-filter"]')
        .should('have.attr', 'aria-label', 'Filter by category')
    })

    it('should work with screen reader announcements', () => {
      cy.loginAsStudent()
      cy.visit('/all-events')
      
      cy.get('[data-testid="search-input"]').type('Community')
      
      cy.get('[data-testid="search-results-announcement"]')
        .should('have.attr', 'aria-live', 'polite')
        .and('contain', 'Found 1 activity')
    })

    it('should support high contrast mode', () => {
      cy.loginAsStudent()
      cy.visit('/')
      
      // Simulate high contrast mode
      cy.get('html').invoke('addClass', 'high-contrast')
      
      cy.get('[data-testid="activity-card"]')
        .should('have.css', 'border')
        .and('have.css', 'background-color')
      
      // Test that text is still readable
      cy.get('[data-testid="activity-title"]').should('be.visible')
    })

    it('should be responsive across different screen sizes', () => {
      cy.loginAsStudent()
      cy.visit('/all-events')
      
      // Test desktop view
      cy.viewport(1200, 800)
      cy.get('[data-testid="activity-grid"]').should('have.class', 'grid-cols-3')
      
      // Test tablet view  
      cy.viewport(768, 1024)
      cy.get('[data-testid="activity-grid"]').should('have.class', 'grid-cols-2')
      
      // Test mobile view
      cy.viewport(375, 667)
      cy.get('[data-testid="activity-grid"]').should('have.class', 'grid-cols-1')
      cy.get('[data-testid="mobile-filter-button"]').should('be.visible')
    })
  })

  describe('Performance and Caching', () => {
    it('should cache API responses appropriately', () => {
      cy.loginAsStudent()
      
      cy.intercept('GET', '**/api/activities/list/', {
        body: { results: [] },
        headers: { 'cache-control': 'max-age=300' }
      }).as('cachedResponse')
      
      cy.visit('/all-events')
      cy.wait('@cachedResponse')
      
      // Navigate away and back
      cy.visit('/student/dashboard')
      cy.visit('/all-events')
      
      // Should use cached response, not make new API call
      cy.get('@cachedResponse.all').should('have.length', 1)
    })

    it('should implement infinite scroll for large lists', () => {
      cy.loginAsStudent()
      
      cy.intercept('GET', '**/api/activities/list/?page=1', {
        body: { 
          results: Array(20).fill(0).map((_, i) => ({
            id: i + 1,
            title: `Activity ${i + 1}`
          })),
          next: 'https://localhost/api/activities/list/?page=2'
        }
      }).as('page1')
      
      cy.intercept('GET', '**/api/activities/list/?page=2', {
        body: { 
          results: Array(20).fill(0).map((_, i) => ({
            id: i + 21,
            title: `Activity ${i + 21}`
          })),
          next: null
        }
      }).as('page2')
      
      cy.visit('/all-events')
      cy.wait('@page1')
      
      cy.get('[data-testid="activity-card"]').should('have.length', 20)
      
      // Scroll to bottom
      cy.scrollTo('bottom')
      cy.wait('@page2')
      
      cy.get('[data-testid="activity-card"]').should('have.length', 40)
    })
  })
})