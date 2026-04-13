const request = require('supertest');
const app = require('../app');

describe('Sika-Santé API', () => {
  test('GET /api/v1/health returns OK', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toEqual({ status: 'ok' });
  });

  test('POST /api/v1/auth/request-otp rejects invalid CMU', async () => {
    const response = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ cmuNumber: 'invalid' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toMatch(/cmuNumber/i);
  });
});
