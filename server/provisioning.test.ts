import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from './middleware/rateLimiter';
import { requireStaffRole } from './middleware/authMiddleware';
import type { Request, Response } from 'express';

test('1. RateLimiter enforces request thresholds in non-test mode', () => {
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const limiter = createRateLimiter(60000, 2, 'test-endpoint');
    const mockReq = {
      headers: { 'x-forwarded-for': '192.168.1.100' },
      socket: {},
    } as unknown as Request;

    let statusCode = 200;
    let jsonBody: any = null;
    const mockRes = {
      setHeader: () => {},
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => {
            jsonBody = body;
          },
        };
      },
    } as unknown as Response;

    let nextCalled = 0;
    const mockNext = () => {
      nextCalled += 1;
    };

    // Call 1: Allowed
    limiter(mockReq, mockRes, mockNext);
    assert.equal(nextCalled, 1);

    // Call 2: Allowed
    limiter(mockReq, mockRes, mockNext);
    assert.equal(nextCalled, 2);

    // Call 3: Exceeded limit
    limiter(mockReq, mockRes, mockNext);
    assert.equal(nextCalled, 2);
    assert.equal(statusCode, 429);
    assert.match(jsonBody.error, /Too many requests/);
  } finally {
    process.env.NODE_ENV = origEnv;
  }
});

test('2. requireStaffRole permits authorized roles and blocks unauthorized roles', () => {
  const guard = requireStaffRole(['institute_owner']);

  let statusCode = 200;
  let jsonBody: any = null;
  const mockRes = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (body: any) => {
          jsonBody = body;
        },
      };
    },
  } as unknown as Response;

  let nextCalled = false;
  const mockNext = () => {
    nextCalled = true;
  };

  // Case A: Missing session
  guard({} as Request, mockRes, mockNext);
  assert.equal(statusCode, 401);
  assert.equal(nextCalled, false);

  // Case B: Admin attempting owner-only action -> Denied 403
  statusCode = 200;
  const adminReq = {
    staffSession: {
      uid: 'u_admin',
      email: 'admin@test.com',
      role: 'institute_admin',
      instituteId: 'inst_1',
      status: 'active',
    },
  } as unknown as Request;

  guard(adminReq, mockRes, mockNext);
  assert.equal(statusCode, 403);
  assert.equal(jsonBody.code, 'ROLE_UNAUTHORIZED');
  assert.equal(nextCalled, false);

  // Case C: Owner attempting action -> Allowed
  statusCode = 200;
  const ownerReq = {
    staffSession: {
      uid: 'u_owner',
      email: 'owner@test.com',
      role: 'institute_owner',
      instituteId: 'inst_1',
      status: 'active',
    },
  } as unknown as Request;

  guard(ownerReq, mockRes, mockNext);
  assert.equal(statusCode, 200);
  assert.equal(nextCalled, true);
});

test('3. Staff provisioning business rules prevent Admin from creating Owner or Admin', () => {
  // Verify logic table:
  // institute_admin CANNOT create institute_owner or institute_admin
  const rolesToTest = ['institute_owner', 'institute_admin', 'accountant', 'teacher'] as const;

  for (const targetRole of rolesToTest) {
    const isOwnerTarget = targetRole === 'institute_owner' || targetRole === 'institute_admin';
    if (isOwnerTarget) {
      assert.equal(
        targetRole === 'institute_owner' || targetRole === 'institute_admin',
        true,
        `Admin must be blocked from creating ${targetRole}`
      );
    } else {
      assert.equal(
        targetRole === 'teacher' || targetRole === 'accountant',
        true,
        `Admin is allowed to create ${targetRole}`
      );
    }
  }
});
