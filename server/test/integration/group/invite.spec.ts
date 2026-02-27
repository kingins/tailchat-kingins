import { Types } from 'mongoose';
import GroupInviteService from '../../../services/core/group/invite.service';
import { createTestServiceBroker } from '../../utils';
import { PERMISSION } from 'tailchat-server-sdk';

describe('Test "group.invite" service', () => {
  const { broker, insertTestData } =
    createTestServiceBroker<GroupInviteService>(GroupInviteService, {
      contextCallMockFn(actionName) {
        if (actionName === 'group.getUserAllPermissions') {
          return [PERMISSION.core.owner];
        }
        if (actionName === 'group.joinGroup') {
          return true;
        }
        if (actionName === 'user.getUserInfo') {
          return { nickname: 'test-creator' };
        }
        if (actionName === 'chat.message.addGroupSystemMessage') {
          return null;
        }
      },
    });

  const testGroupId = String(new Types.ObjectId());
  const testUserId = String(new Types.ObjectId());

  test('Test "group.invite.createGroupInvite" - normal type', async () => {
    const res: any = await broker.call(
      'group.invite.createGroupInvite',
      { groupId: testGroupId, inviteType: 'normal' },
      { meta: { userId: testUserId, t: (s: string) => s } }
    );

    try {
      expect(res).toHaveProperty('code');
      expect(res).toHaveProperty('groupId');
      expect(res.expiredAt).toBeDefined(); // normal invite has expiry
    } finally {
      await broker.call(
        'group.invite.deleteInvite',
        { groupId: testGroupId, inviteId: String(res._id) },
        { meta: { userId: testUserId, t: (s: string) => s } }
      );
    }
  });

  test('Test "group.invite.createGroupInvite" - permanent type', async () => {
    const res: any = await broker.call(
      'group.invite.createGroupInvite',
      { groupId: testGroupId, inviteType: 'permanent' },
      { meta: { userId: testUserId, t: (s: string) => s } }
    );

    try {
      expect(res).toHaveProperty('code');
      expect(res.expiredAt).toBeUndefined(); // permanent invite has no expiry
    } finally {
      await broker.call(
        'group.invite.deleteInvite',
        { groupId: testGroupId, inviteId: String(res._id) },
        { meta: { userId: testUserId, t: (s: string) => s } }
      );
    }
  });

  test('Test "group.invite.getAllGroupInviteCode" - returns list for group', async () => {
    const invite: any = await broker.call(
      'group.invite.createGroupInvite',
      { groupId: testGroupId, inviteType: 'normal' },
      { meta: { userId: testUserId, t: (s: string) => s } }
    );

    try {
      const list: any[] = await broker.call(
        'group.invite.getAllGroupInviteCode',
        { groupId: testGroupId },
        { meta: { userId: testUserId, t: (s: string) => s } }
      );

      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.find((item) => item.code === invite.code)).toBeDefined();
    } finally {
      await broker.call(
        'group.invite.deleteInvite',
        { groupId: testGroupId, inviteId: String(invite._id) },
        { meta: { userId: testUserId, t: (s: string) => s } }
      );
    }
  });

  test('Test "group.invite.findInviteByCode" - find by code', async () => {
    const invite: any = await broker.call(
      'group.invite.createGroupInvite',
      { groupId: testGroupId, inviteType: 'normal' },
      { meta: { userId: testUserId, t: (s: string) => s } }
    );

    try {
      const found: any = await broker.call('group.invite.findInviteByCode', {
        code: invite.code,
      });

      expect(found).toBeDefined();
      expect(found.code).toBe(invite.code);
      expect(String(found.groupId)).toBe(testGroupId);
    } finally {
      await broker.call(
        'group.invite.deleteInvite',
        { groupId: testGroupId, inviteId: String(invite._id) },
        { meta: { userId: testUserId, t: (s: string) => s } }
      );
    }
  });

  test('Test "group.invite.editGroupInvite" - update expiredAt', async () => {
    const invite: any = await broker.call(
      'group.invite.createGroupInvite',
      { groupId: testGroupId, inviteType: 'normal' },
      { meta: { userId: testUserId, t: (s: string) => s } }
    );

    try {
      const newExpiry = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days

      const result = await broker.call(
        'group.invite.editGroupInvite',
        {
          code: invite.code,
          groupId: testGroupId,
          expiredAt: newExpiry,
        },
        { meta: { userId: testUserId, t: (s: string) => s } }
      );

      expect(result).toBe(true);
    } finally {
      await broker.call(
        'group.invite.deleteInvite',
        { groupId: testGroupId, inviteId: String(invite._id) },
        { meta: { userId: testUserId, t: (s: string) => s } }
      );
    }
  });

  test('Test "group.invite.deleteInvite" - deleted invite not found', async () => {
    const invite: any = await broker.call(
      'group.invite.createGroupInvite',
      { groupId: testGroupId, inviteType: 'normal' },
      { meta: { userId: testUserId, t: (s: string) => s } }
    );

    await broker.call(
      'group.invite.deleteInvite',
      { groupId: testGroupId, inviteId: String(invite._id) },
      { meta: { userId: testUserId, t: (s: string) => s } }
    );

    const found: any = await broker.call('group.invite.findInviteByCode', {
      code: invite.code,
    });

    expect(found).toBeNull();
  });
});
