// Mock DB connection before importing the app
jest.mock('../config/db', () => jest.fn());

const request = require('supertest');
const { app, server } = require('../index');

describe('API Health Check', () => {
    afterAll((done) => {
        server.close(done);
    });

    it('GET / should return 200 and welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Notinix API is running');
    });

    it('GET /api/notes (Unprotected) should return 401', async () => {
        const res = await request(app).get('/api/notes');
        expect(res.statusCode).toEqual(401);
    });
});
