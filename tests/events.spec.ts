import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3000/api';

// Test user data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

const testAdmin = {
  email: 'admin@example.com',
  password: 'password123',
  name: 'Admin User',
  role: 'superAdmin'
};

const testEvent = {
  title: 'Test Event',
  description: 'Test Event Description',
  shortDescription: 'Short Description',
  startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  endDate: new Date(Date.now() + 172800000).toISOString(),  // Day after tomorrow
  location: 'Test Location',
  venue: 'Test Venue',
  address: '123 Test St',
  city: 'Test City',
  country: 'Test Country',
  status: 'draft',
  maxAttendees: 100,
  coverImage: 'https://example.com/image.jpg',
  categoryId: 1,
  organizationId: 15
};

let createdEventId: number;
let userToken: string;
let adminToken: string;

test.describe('Events API', () => {
  // Setup: Register and login users before tests
  test.beforeAll(async ({ request }) => {
    try {
      console.log('Starting test setup...');

      // Register regular user
      console.log('Registering regular user...');
      const userRegResponse = await request.post(`${API_URL}/auth/register`, {
        data: testUser
      });
      expect(userRegResponse.ok()).toBeTruthy();

      // Login regular user
      console.log('Logging in regular user...');
      const userLoginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });
      expect(userLoginResponse.ok()).toBeTruthy();
      const userData = await userLoginResponse.json();
      userToken = userData.token;
      expect(userToken).toBeDefined();
      console.log('User token obtained:', userToken ? 'Yes' : 'No');

      // Register admin user
      console.log('Registering admin user...');
      const adminRegResponse = await request.post(`${API_URL}/auth/register`, {
        data: testAdmin
      });
      expect(adminRegResponse.ok()).toBeTruthy();

      // Login admin user
      console.log('Logging in admin user...');
      const adminLoginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: testAdmin.email,
          password: testAdmin.password
        }
      });
      expect(adminLoginResponse.ok()).toBeTruthy();
      const adminData = await adminLoginResponse.json();
      adminToken = adminData.token;
      expect(adminToken).toBeDefined();
      console.log('Admin token obtained:', adminToken ? 'Yes' : 'No');

      console.log('Setup completed successfully');
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  // Test error cases first (these don't depend on event creation)
  test('should return 404 for non-existent event', async ({ request }) => {
    console.log('Testing non-existent event...');
    const response = await request.get(`${API_URL}/events/99999`);
    expect(response.status()).toBe(404);
    const error = await response.json();
    expect(error.error).toBe('Event not found');
  });

  test('should return 400 for invalid event creation', async ({ request }) => {
    console.log('Testing invalid event creation...');
    const invalidEvent = {
      title: 'Invalid Event'
      // Missing required fields
    };

    const response = await request.post(`${API_URL}/events`, {
      data: invalidEvent,
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
  });

  // Test getting all events (public route, doesn't depend on creation)
  test('should get events list with pagination', async ({ request }) => {
    console.log('Testing get events list...');
    const response = await request.get(`${API_URL}/events?page=1&limit=10`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    console.log('Events count:', data.events.length);
    expect(data.events).toBeInstanceOf(Array);
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('totalPages');
  });

  // Test getting events with status filter (public route, doesn't depend on creation)
  test('should get events filtered by status', async ({ request }) => {
    console.log('Testing events filter by status...');
    const response = await request.get(`${API_URL}/events?status=draft`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    console.log('Filtered events count:', data.events.length);
    data.events.forEach((event: any) => {
      expect(event.status).toBe('draft');
    });
  });

  // Create event and test dependent operations
  test.describe('Event CRUD operations', () => {
    test('should create a new event with authenticated user', async ({ request }) => {
      try {
        console.log('Testing event creation...');
        expect(userToken).toBeDefined();
        const response = await request.post(`${API_URL}/events`, {
          data: testEvent,
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Event creation response status:', response.status());
        expect(response.ok()).toBeTruthy();
        const event = await response.json();
        expect(event.title).toBe(testEvent.title);
        expect(event.slug).toBe('test-event');
        createdEventId = event.id;
        console.log('Created event ID:', createdEventId);
      } catch (error) {
        console.error('Create event error:', error);
        throw error;
      }
    });

    test('should get event by id', async ({ request }) => {
      console.log('Testing get single event...');
      expect(createdEventId).toBeDefined();
      const response = await request.get(`${API_URL}/events/${createdEventId}`);
      expect(response.ok()).toBeTruthy();
      const event = await response.json();
      console.log('Retrieved event ID:', event.id);
      expect(event.id).toBe(createdEventId);
      expect(event.title).toBe(testEvent.title);
    });

    test('should update an event as owner', async ({ request }) => {
      console.log('Testing event update as owner...');
      const updateData = {
        title: 'Updated Test Event',
        description: 'Updated Description'
      };

      expect(userToken).toBeDefined();
      expect(createdEventId).toBeDefined();
      const response = await request.put(`${API_URL}/events/${createdEventId}`, {
        data: updateData,
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Update response status:', response.status());
      expect(response.ok()).toBeTruthy();
      const event = await response.json();
      expect(event.title).toBe(updateData.title);
      expect(event.description).toBe(updateData.description);
    });

    test('should update any event as super-admin', async ({ request }) => {
      console.log('Testing event update as admin...');
      const updateData = {
        title: 'Admin Updated Event',
        description: 'Admin Updated Description'
      };

      expect(adminToken).toBeDefined();
      expect(createdEventId).toBeDefined();
      const response = await request.put(`${API_URL}/events/${createdEventId}`, {
        data: updateData,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Admin update response status:', response.status());
      expect(response.ok()).toBeTruthy();
      const event = await response.json();
      expect(event.title).toBe(updateData.title);
      expect(event.description).toBe(updateData.description);
    });

    test('should return 403 when unauthorized user tries to update event', async ({ request }) => {
      try {
        console.log('Testing unauthorized access...');
        // Create and login unauthorized user
        const unauthorizedUser = {
          email: 'unauthorized@example.com',
          password: 'password123',
          name: 'Unauthorized User'
        };

        await request.post(`${API_URL}/auth/register`, {
          data: unauthorizedUser
        });

        const loginResponse = await request.post(`${API_URL}/auth/login`, {
          data: {
            email: unauthorizedUser.email,
            password: unauthorizedUser.password
          }
        });

        const { token: unauthorizedToken } = await loginResponse.json();
        expect(unauthorizedToken).toBeDefined();

        const updateData = {
          title: 'Unauthorized Update'
        };

        const response = await request.put(`${API_URL}/events/${createdEventId}`, {
          data: updateData,
          headers: {
            'Authorization': `Bearer ${unauthorizedToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Unauthorized update response status:', response.status());
        expect(response.status()).toBe(403);
      } catch (error) {
        console.error('Unauthorized test error:', error);
        throw error;
      }
    });

    test('should delete an event as owner', async ({ request }) => {
      console.log('Testing event deletion...');
      expect(userToken).toBeDefined();
      expect(createdEventId).toBeDefined();
      const response = await request.delete(`${API_URL}/events/${createdEventId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Delete response status:', response.status());
      expect(response.status()).toBe(204);

      // Verify the event is deleted
      const getResponse = await request.get(`${API_URL}/events/${createdEventId}`);
      console.log('Verify deletion response status:', getResponse.status());
      expect(getResponse.status()).toBe(404);
    });
  });
});
