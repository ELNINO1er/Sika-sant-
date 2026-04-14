const request = require('supertest');
const app = require('../app');

async function getCsrfSession() {
  const csrfResponse = await request(app).get('/api/v1/csrf-token');
  return {
    token: csrfResponse.body.data.csrfToken,
    cookies: csrfResponse.headers['set-cookie']
  };
}

describe('Sika-Sante API', () => {
  test('GET /api/v1/health returns service metadata', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'ok');
    expect(response.body.data).toHaveProperty('environment', 'test');
    expect(response.body.data).toHaveProperty('timestamp');
  });

  test('POST /api/v1/auth/request-otp rejects missing csrf token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ cmuNumber: '1234567890' });

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty('success', false);
  });

  test('POST /api/v1/auth/request-otp rejects invalid CMU with csrf token', async () => {
    const csrf = await getCsrfSession();
    const response = await request(app)
      .post('/api/v1/auth/request-otp')
      .set('Cookie', csrf.cookies)
      .set('x-xsrf-token', csrf.token)
      .send({ cmuNumber: 'invalid' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toMatch(/cmuNumber/i);
  });

  test('POST /api/v1/auth/login validates admin payload', async () => {
    const csrf = await getCsrfSession();
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Cookie', csrf.cookies)
      .set('x-xsrf-token', csrf.token)
      .send({
        loginType: 'admin',
        email: 'invalid-email',
        password: 'short'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });
});
