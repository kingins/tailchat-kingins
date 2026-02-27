import { Types } from 'mongoose';
import FriendRequestService from '../../../services/core/user/friendRequest.service';
import { createTestServiceBroker } from '../../utils';

describe('Test "friend.request" service', () => {
  const { broker, insertTestData } =
    createTestServiceBroker<FriendRequestService>(FriendRequestService, {
      contextCallMockFn(actionName) {
        if (actionName === 'friend.checkIsFriend') {
          return false;
        }
        if (actionName === 'friend.buildFriendRelation') {
          return true;
        }
      },
    });

  test('Test "friend.request.add" - sends friend request', async () => {
    const fromId = String(new Types.ObjectId());
    const toId = String(new Types.ObjectId());

    const request: any = await broker.call(
      'friend.request.add',
      { to: toId, message: 'hello' },
      { meta: { userId: fromId, t: (s: string) => s } }
    );

    try {
      expect(request).toHaveProperty('from');
      expect(request).toHaveProperty('to');
      expect(String(request.from)).toBe(fromId);
      expect(String(request.to)).toBe(toId);
    } finally {
      await broker.call(
        'friend.request.cancel',
        { requestId: String(request._id) },
        { meta: { userId: fromId, t: (s: string) => s } }
      );
    }
  });

  test('Test "friend.request.add" - cannot send duplicate request', async () => {
    const fromId = String(new Types.ObjectId());
    const toId = String(new Types.ObjectId());

    const request: any = await broker.call(
      'friend.request.add',
      { to: toId },
      { meta: { userId: fromId, t: (s: string) => s } }
    );

    try {
      await expect(
        broker.call(
          'friend.request.add',
          { to: toId },
          { meta: { userId: fromId, t: (s: string) => s } }
        )
      ).rejects.toThrow();
    } finally {
      await broker.call(
        'friend.request.cancel',
        { requestId: String(request._id) },
        { meta: { userId: fromId, t: (s: string) => s } }
      );
    }
  });

  test('Test "friend.request.allRelated" - returns all requests for user', async () => {
    const fromId = String(new Types.ObjectId());
    const toId = String(new Types.ObjectId());

    const request: any = await broker.call(
      'friend.request.add',
      { to: toId },
      { meta: { userId: fromId, t: (s: string) => s } }
    );

    try {
      const list: any[] = await broker.call(
        'friend.request.allRelated',
        {},
        { meta: { userId: fromId } }
      );

      expect(Array.isArray(list)).toBe(true);
      expect(list.find((r) => String(r._id) === String(request._id))).toBeDefined();
    } finally {
      await broker.call(
        'friend.request.cancel',
        { requestId: String(request._id) },
        { meta: { userId: fromId, t: (s: string) => s } }
      );
    }
  });

  test('Test "friend.request.accept" - accepts request and builds relation', async () => {
    const fromId = String(new Types.ObjectId());
    const toId = String(new Types.ObjectId());

    const request: any = await broker.call(
      'friend.request.add',
      { to: toId },
      { meta: { userId: fromId, t: (s: string) => s } }
    );

    await broker.call(
      'friend.request.accept',
      { requestId: String(request._id) },
      { meta: { userId: toId, t: (s: string) => s } }
    );

    // Request should be removed after acceptance
    const list: any[] = await broker.call(
      'friend.request.allRelated',
      {},
      { meta: { userId: fromId } }
    );
    expect(list.find((r) => String(r._id) === String(request._id))).toBeUndefined();
  });

  test('Test "friend.request.deny" - rejects request and removes it', async () => {
    const fromId = String(new Types.ObjectId());
    const toId = String(new Types.ObjectId());

    const request: any = await broker.call(
      'friend.request.add',
      { to: toId },
      { meta: { userId: fromId, t: (s: string) => s } }
    );

    await broker.call(
      'friend.request.deny',
      { requestId: String(request._id) },
      { meta: { userId: toId, t: (s: string) => s } }
    );

    const list: any[] = await broker.call(
      'friend.request.allRelated',
      {},
      { meta: { userId: fromId } }
    );
    expect(list.find((r) => String(r._id) === String(request._id))).toBeUndefined();
  });

  test('Test "friend.request.cancel" - cancels own request', async () => {
    const fromId = String(new Types.ObjectId());
    const toId = String(new Types.ObjectId());

    const request: any = await broker.call(
      'friend.request.add',
      { to: toId },
      { meta: { userId: fromId, t: (s: string) => s } }
    );

    await broker.call(
      'friend.request.cancel',
      { requestId: String(request._id) },
      { meta: { userId: fromId, t: (s: string) => s } }
    );

    const list: any[] = await broker.call(
      'friend.request.allRelated',
      {},
      { meta: { userId: fromId } }
    );
    expect(list.find((r) => String(r._id) === String(request._id))).toBeUndefined();
  });

  test('Test "friend.request.deny" - only recipient can deny', async () => {
    const fromId = String(new Types.ObjectId());
    const toId = String(new Types.ObjectId());
    const thirdId = String(new Types.ObjectId());

    const request: any = await broker.call(
      'friend.request.add',
      { to: toId },
      { meta: { userId: fromId, t: (s: string) => s } }
    );

    try {
      await expect(
        broker.call(
          'friend.request.deny',
          { requestId: String(request._id) },
          { meta: { userId: thirdId, t: (s: string) => s } }
        )
      ).rejects.toThrow();
    } finally {
      await broker.call(
        'friend.request.cancel',
        { requestId: String(request._id) },
        { meta: { userId: fromId, t: (s: string) => s } }
      );
    }
  });
});
