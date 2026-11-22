import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.PAWCARE_JWT_SECRET = 'pawcare-test-secret-for-isolated-test-only';
process.env.UPLOAD_DIR = 'server/uploads';

const [{ default: app }, { User }, { AnimalReport }] = await Promise.all([
  import('../src/app.js'),
  import('../src/models/User.js'),
  import('../src/models/AnimalReport.js'),
]);

async function jsonRequest(base, path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { response, data };
}

async function login(base, email) {
  const { response, data } = await jsonRequest(base, '/api/auth/login', {
    method: 'POST',
    body: { email, password: 'PawCare-test-123!' },
  });
  assert.equal(response.status, 200, data.message);
  return data.token;
}

test('report -> volunteer accepts -> in progress -> resolved', async (t) => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'pawcare-flow-test' });
  const password = await bcrypt.hash('PawCare-test-123!', 10);
  await User.create([
    {
      name: 'Flow Admin',
      email: 'flow-admin@pawcare.test',
      phone: '+1 555 0100',
      password,
      role: 'admin',
    },
    {
      name: 'Flow Volunteer',
      email: 'flow-volunteer@pawcare.test',
      phone: '+1 555 0101',
      password,
      role: 'volunteer',
    },
    {
      name: 'Flow Reporter',
      email: 'flow-user@pawcare.test',
      phone: '+1 555 0102',
      password,
      role: 'user',
    },
    {
      name: 'Flow Shelter',
      email: 'flow-shelter@pawcare.test',
      phone: '+1 555 0103',
      password,
      role: 'shelter',
    },
  ]);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    await mongoose.disconnect();
    await mongo.stop();
  });

  const adminToken = await login(base, 'flow-admin@pawcare.test');
  const volunteerToken = await login(base, 'flow-volunteer@pawcare.test');
  const reporterToken = await login(base, 'flow-user@pawcare.test');
  const shelterToken = await login(base, 'flow-shelter@pawcare.test');

  const initialAdoptions = await jsonRequest(base, '/api/adoptions?status=all', {
    token: shelterToken,
  });
  assert.equal(initialAdoptions.response.status, 200);
  assert.deepEqual(initialAdoptions.data.adoptions, []);
  const shelterProfile = await jsonRequest(base, '/api/shelters', {
    token: shelterToken,
    method: 'POST',
    body: {
      name: 'Flow Test Shelter',
      address: '1 Test Road',
      phone: '+1 555 0104',
      email: 'shelter@pawcare.test',
      description: 'An isolated shelter onboarding test profile.',
      location: { lat: 12.97, lng: 77.59, address: 'Test neighborhood' },
    },
  });
  assert.equal(shelterProfile.response.status, 201);

  const form = new FormData();
  form.set('animalType', 'Dog');
  form.set('description', 'A dog with a hurt paw is resting near the community park.');
  form.set('assistanceRequired', 'Safe pickup and a veterinary check');
  form.set('priority', 'Emergency');
  form.set(
    'location',
    JSON.stringify({ lat: 12.9716, lng: 77.5946, address: 'Community park entrance' })
  );
  const createResponse = await fetch(`${base}/api/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${reporterToken}` },
    body: form,
  });
  const created = await createResponse.json();
  assert.equal(createResponse.status, 201, created.message);
  assert.equal(created.report.status, 'Pending');
  assert.equal(created.report.verified, false);

  const verify = await jsonRequest(base, `/api/reports/${created.report._id}/verify`, {
    token: adminToken,
    method: 'PATCH',
    body: { verified: true },
  });
  assert.equal(verify.response.status, 200);
  assert.equal(verify.data.report.verified, true);

  const queue = await jsonRequest(base, '/api/volunteers/requests', { token: volunteerToken });
  assert.equal(queue.response.status, 200);
  assert.equal(queue.data.reports[0]._id, created.report._id);
  assert.equal(queue.data.reports[0].priority, 'Emergency');

  const accepted = await jsonRequest(base, `/api/reports/${created.report._id}/accept`, {
    token: volunteerToken,
    method: 'POST',
  });
  assert.equal(accepted.response.status, 200, accepted.data.message);
  assert.equal(accepted.data.report.status, 'Accepted');
  assert.equal(accepted.data.report.reporterId.phone, '+1 555 0102');
  assert.equal(accepted.data.report.reporterId.email, 'flow-user@pawcare.test');

  const inProgress = await jsonRequest(base, `/api/reports/${created.report._id}/status`, {
    token: volunteerToken,
    method: 'PATCH',
    body: { status: 'In Progress' },
  });
  assert.equal(inProgress.response.status, 200);
  assert.equal(inProgress.data.report.status, 'In Progress');

  const resolved = await jsonRequest(base, `/api/reports/${created.report._id}/status`, {
    token: volunteerToken,
    method: 'PATCH',
    body: { status: 'Resolved' },
  });
  assert.equal(resolved.response.status, 200);
  assert.equal(resolved.data.report.status, 'Resolved');

  const mine = await jsonRequest(base, '/api/reports/mine', { token: reporterToken });
  assert.equal(mine.response.status, 200);
  assert.equal(mine.data.reports[0].status, 'Resolved');

  const reporter = await User.findOne({ email: 'flow-user@pawcare.test' });
  await AnimalReport.create(
    Array.from({ length: 13 }, (_, index) => ({
      animalType: 'Cat',
      description: `Additional admin monitoring case ${index + 1}`,
      assistanceRequired: 'Community check-in',
      location: { lat: 12.97, lng: 77.59, address: 'Test neighborhood' },
      reporterId: reporter._id,
    }))
  );
  const overview = await jsonRequest(base, '/api/admin/overview', { token: adminToken });
  assert.equal(overview.response.status, 200);
  assert.equal(overview.data.recentReports.length, 14);
  assert.equal(overview.data.usersList.length, 4);
});
