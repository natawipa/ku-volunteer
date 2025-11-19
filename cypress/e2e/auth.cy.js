describe('Authentication Features', () => {
  
  describe('Register New Account', () => {
    beforeEach(() => {
      // Set up registration API intercept
      cy.intercept('POST', '**/api/users/register/').as('registerRequest')
      cy.visit('/role')
    })

    it('should register new student account successfully', () => {
      // Select student role
      cy.get('[data-testid="role-selector"]').click()
      cy.get('[data-testid="role-student"]').click()
      cy.get('[data-testid="next-button"]').click()
      
      // Fill student registration form
      cy.fixture('users').then((users) => {
        const student = users.student
        cy.get('[data-testid="email-input"]').type(student.email)
        cy.get('[data-testid="password-input"]').type(student.password)
        cy.get('[data-testid="confirm-password-input"]').type(student.password)
        cy.get('[data-testid="first-name-input"]').type(student.first_name)
        cy.get('[data-testid="last-name-input"]').type(student.last_name)
        cy.get('[data-testid="student-id-input"]').type(student.student_id_external)
        cy.get('[data-testid="year-select"]').type(student.year.toString())
        cy.get('[data-testid="faculty-input"]').type(student.faculty)
        cy.get('[data-testid="major-input"]').type(student.major)
        // Title is a custom dropdown — click to open and select option
        if (student.title) {
          cy.get('[data-testid="select-title"]').click()
          cy.get(`[data-testid="select-title-option-${student.title}"]`).click()
        }
        
        cy.get('[data-testid="register-button"]').click()
        
        cy.wait('@registerRequest').its('response.statusCode').should('eq', 201)
        
        cy.url().should('include', '/login')
        cy.get('[data-testid="success-message"]')
          .should('be.visible')
          .and('contain', 'Registration successful')
      })
    })

    it('should register new organizer account successfully', () => {
      // Select organizer role
      cy.get('[data-testid="role-selector"]').click()
      cy.get('[data-testid="role-organization"]').click()
      cy.get('[data-testid="next-button"]').click()
      
      // Fill organizer registration form
      cy.fixture('users').then((users) => {
        const organizer = users.organizer
        cy.get('[data-testid="email-input"]').type(organizer.email)
        cy.get('[data-testid="password-input"]').type(organizer.password)
        cy.get('[data-testid="confirm-password-input"]').type(organizer.password)
        cy.get('[data-testid="first-name-input"]').type(organizer.first_name)
        cy.get('[data-testid="last-name-input"]').type(organizer.last_name)
        cy.get('[data-testid="organization-input"]').type(organizer.organization)
        cy.get('[data-testid="organization-name-input"]').type(organizer.organization_name)
        
        cy.get('[data-testid="register-button"]').click()
        
        cy.wait('@registerRequest').its('response.statusCode').should('eq', 201)
        
        cy.url().should('include', '/login')
        cy.get('[data-testid="success-message"]')
          .should('be.visible')
          .and('contain', 'Registration successful')
      })
    })

    it('should show validation errors for invalid registration data', () => {
      // Select student role
      cy.get('[data-testid="role-selector"]').click()
      cy.get('[data-testid="role-student"]').click()
      cy.get('[data-testid="next-button"]').click()
      
      // Submit empty form
      cy.get('[data-testid="register-button"]').click()
      
      cy.get('[data-testid="email-error"]').should('be.visible')
      cy.get('[data-testid="password-error"]').should('be.visible')
      cy.get('[data-testid="student-id-error"]').should('be.visible')
    })

    it('should validate password confirmation', () => {
      cy.get('[data-testid="role-selector"]').click()
      cy.get('[data-testid="role-student"]').click()
      cy.get('[data-testid="next-button"]').click()
      
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="confirm-password-input"]').type('different123')
      cy.get('[data-testid="register-button"]').click()
      
      cy.get('[data-testid="confirm-password-error"]')
        .should('be.visible')
        .and('contain', 'Passwords do not match')
    })
  })

  describe('Login with Password', () => {
    beforeEach(() => {
      // Login intercept is already set up in global beforeEach in e2e.js
      cy.visit('/login')
    })
    it('should successfully login as student with valid credentials', () => {
      cy.fixture('users').then((users) => {
        cy.get('[data-testid="email-input"]').type(users.student.email)
        cy.get('[data-testid="password-input"]').type(users.student.password)
        cy.get('[data-testid="login-button"]').click()
        
        cy.wait('@loginRequest').its('response.statusCode').should('eq', 200)
        
        // Should redirect to home page
        cy.url().should('not.include', '/login')
        cy.get('[data-testid="user-menu"]').should('be.visible')
        cy.get('[data-testid="user-role"]').should('contain', 'Student')
      })
    })

    it('should successfully login as organizer with valid credentials', () => {
      cy.fixture('users').then((users) => {
        cy.get('[data-testid="email-input"]').type(users.organizer.email)
        cy.get('[data-testid="password-input"]').type(users.organizer.password)
        cy.get('[data-testid="login-button"]').click()
        
        cy.wait('@loginRequest').its('response.statusCode').should('eq', 200)
        
        cy.url().should('not.include', '/login')
        cy.get('[data-testid="user-menu"]').should('be.visible')
        cy.get('[data-testid="user-role"]').should('contain', 'Organizer')
      })
    })

    it('should successfully login as admin and redirect to admin dashboard', () => {
      cy.fixture('users').then((users) => {
        cy.get('[data-testid="email-input"]').type(users.admin.email)
        cy.get('[data-testid="password-input"]').type(users.admin.password)
        cy.get('[data-testid="login-button"]').click()
        
        cy.wait('@loginRequest').its('response.statusCode').should('eq', 200)
        
        cy.url().should('include', '/admin')
        cy.get('[data-testid="admin-dashboard"]').should('be.visible')
      })
    })

    it('should show error for invalid credentials', () => {
      cy.get('[data-testid="email-input"]').type('invalid@example.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-button"]').click()
      
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 401)
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid email or password')
      
      cy.url().should('include', '/login')
    })

    it('should validate email format', () => {
      cy.get('[data-testid="email-input"]').type('invalid-email')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', 'Please enter a valid email address')
    })

    it('should validate required fields', () => {
      cy.get('[data-testid="login-button"]').click()
      
      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', 'Email is required')
      
      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .and('contain', 'Password is required')
    })
  })

  describe('Login with OAuth (Google)', () => {
    beforeEach(() => {
      cy.visit('/login')
    })

    it('should redirect to Google OAuth when clicking Google login button', () => {
      // Mock the OAuth redirect
      cy.intercept('GET', '**/api/auth/google/login/', {
        statusCode: 302,
        headers: {
          location: 'https://accounts.google.com/oauth/authorize'
        }
      }).as('googleOAuth')
      
      cy.get('[data-testid="google-login-button"]').click()
      cy.wait('@googleOAuth')
    })

    it('should handle OAuth callback and create session', () => {
      // Simulate OAuth callback
      cy.visit('/auth/callback?access=mock_token&refresh=mock_refresh&email=test@gmail.com&role=student')
      
      cy.url().should('not.include', '/auth/callback')
      cy.get('[data-testid="user-menu"]').should('be.visible')
    })

    it('should handle OAuth error callback', () => {
      cy.visit('/auth/callback?error=authentication_failed')
      
      cy.url().should('include', '/login')
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Authentication failed')
    })
  })

  describe('Logout', () => {
    it('should logout successfully and redirect to login page', () => {
      cy.loginAsStudent()
      
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      cy.url().should('include', '/login')
      cy.get('[data-testid="user-menu"]').should('not.exist')
      
      // Verify tokens are cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.be.null
        expect(win.localStorage.getItem('refresh_token')).to.be.null
        expect(win.localStorage.getItem('user_data')).to.be.null
      })
    })

    it('should clear user session completely on logout', () => {
      cy.loginAsStudent()
      
      // Try to access protected route after logout
      cy.logout()
      cy.visit('/profile')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })
})