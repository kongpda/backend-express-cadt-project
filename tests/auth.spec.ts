import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3000/api';

const testUser = {
    email: 'testauth@example.com',
    password: 'password123',
    name: 'Test Auth User'
};

const testAdmin = {
    email: 'adminauth@example.com',
    password: 'password123',
    name: 'Test Admin User',
    role: 'superAdmin'
};

test.describe('Authentication API', () => {
    let userToken: string;
    let userId: number;

    test.beforeAll(async ({ request }) => {
        try {
            console.log('Setting up test environment...');
            console.log('Cleaning up test users...');

            // Clean up test users before running tests
            const cleanupResponse = await request.delete(`${API_URL}/auth/cleanup-test-users`, {
                data: {
                    emails: [testUser.email, testAdmin.email]
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Cleanup response status:', cleanupResponse.status());
            if (!cleanupResponse.ok()) {
                const errorText = await cleanupResponse.text();
                console.warn('Cleanup failed:', errorText);
            } else {
                console.log('Cleanup successful');
            }
        } catch (error) {
            console.warn('Cleanup error:', error);
            // Continue with tests even if cleanup fails
        }
    });

    test('should register a new user', async ({ request }) => {
        try {
            console.log('Attempting to register user:', testUser.email);
            const response = await request.post(`${API_URL}/auth/register`, {
                data: testUser,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Registration response status:', response.status());
            const responseText = await response.text();
            console.log('Registration response body:', responseText);

            if (!response.ok()) {
                console.error('Registration failed:', responseText);
            }

            expect(response.ok()).toBeTruthy();
            const data = JSON.parse(responseText);
            console.log('Registration data:', data);
            expect(data.token).toBeDefined();
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe(testUser.email);
            expect(data.user.name).toBe(testUser.name);
            expect(data.user.role).toBe('user'); // Default role
            userId = data.user.id;
            userToken = data.token; // Save token from registration
        } catch (error) {
            console.error('Test error:', error);
            throw error;
        }
    });

    test('should not register user with existing email', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/register`, {
            data: testUser,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.message).toBe('User already exists');
    });

    test('should not register user with invalid email', async ({ request }) => {
        const invalidUser = {
            ...testUser,
            email: 'invalid-email'
        };

        const response = await request.post(`${API_URL}/auth/register`, {
            data: invalidUser
        });

        expect(response.status()).toBe(400);
    });

    test('should login user with valid credentials', async ({ request }) => {
        try {
            console.log('Attempting to login user:', testUser.email);
            const response = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: testUser.email,
                    password: testUser.password
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Login response status:', response.status());
            const responseText = await response.text();
            console.log('Login response body:', responseText);

            expect(response.ok()).toBeTruthy();
            const data = JSON.parse(responseText);
            expect(data.token).toBeDefined();
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe(testUser.email);
            userToken = data.token; // Save token from login
            console.log('Token saved:', userToken);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    });

    test('should not login with incorrect password', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: {
                email: testUser.email,
                password: 'wrongpassword'
            }
        });

        expect(response.status()).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('Invalid credentials');
    });

    test('should not login with non-existent email', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: {
                email: 'nonexistent@example.com',
                password: testUser.password
            }
        });

        expect(response.status()).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('Invalid credentials');
    });

    test('should get current user profile with valid token', async ({ request }) => {
        try {
            console.log('Getting user profile with token:', userToken);
            expect(userToken).toBeDefined();

            const response = await request.get(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Profile response status:', response.status());
            const responseText = await response.text();
            console.log('Profile response body:', responseText);

            expect(response.ok()).toBeTruthy();
            const user = JSON.parse(responseText);
            expect(user.id).toBe(userId);
            expect(user.email).toBe(testUser.email);
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    });

    test('should not get profile without token', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/me`);
        expect(response.status()).toBe(401);
    });

    test('should not get profile with invalid token', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': 'Bearer invalid-token'
            }
        });
        expect(response.status()).toBe(401);
    });

    test('should register and login admin user', async ({ request }) => {
        // Register admin
        const registerResponse = await request.post(`${API_URL}/auth/register`, {
            data: testAdmin
        });

        expect(registerResponse.ok()).toBeTruthy();
        const regData = await registerResponse.json();
        expect(regData.user.role).toBe('superAdmin');

        // Login admin
        const loginResponse = await request.post(`${API_URL}/auth/login`, {
            data: {
                email: testAdmin.email,
                password: testAdmin.password
            }
        });

        expect(loginResponse.ok()).toBeTruthy();
        const loginData = await loginResponse.json();
        expect(loginData.token).toBeDefined();
        expect(loginData.user.role).toBe('superAdmin');
    });

    test('should validate required fields in registration', async ({ request }) => {
        const invalidUsers = [
            { email: testUser.email }, // Missing password and name
            { email: testUser.email, password: testUser.password }, // Missing name
            { password: testUser.password, name: testUser.name }, // Missing email
        ];

        for (const invalidUser of invalidUsers) {
            const response = await request.post(`${API_URL}/auth/register`, {
                data: invalidUser
            });
            expect(response.status()).toBe(400);
        }
    });

    test('should validate password length in registration', async ({ request }) => {
        const shortPasswordUser = {
            ...testUser,
            email: 'short@example.com',
            password: '12345' // Too short
        };

        const response = await request.post(`${API_URL}/auth/register`, {
            data: shortPasswordUser
        });
        expect(response.status()).toBe(400);
    });

    test('should handle concurrent login attempts', async ({ request }) => {
        const loginPromises = Array(3).fill(null).map(() =>
            request.post(`${API_URL}/auth/login`, {
                data: {
                    email: testUser.email,
                    password: testUser.password
                }
            })
        );

        const responses = await Promise.all(loginPromises);
        responses.forEach(response => {
            expect(response.ok()).toBeTruthy();
        });
    });
});
