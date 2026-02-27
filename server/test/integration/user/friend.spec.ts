import { Types } from 'mongoose';
import FriendService from '../../../services/core/user/friend.service';
import { createTestServiceBroker } from '../../utils';

describe('Test "friend" service', () => {
  const { broker, insertTestData } =
    createTestServiceBroker<FriendService>(FriendService);

  test('Test "friend.getAllFriends" - empty list', async () => {
    const userId = String(new Types.ObjectId());

    const res: any[] = await broker.call(
      'friend.getAllFriends',
      {},
      { meta: { userId } }
    );

    expect(res).toEqual([]);
  });

  test('Test "friend.getAllFriends" - with friends', async () => {
    const userId = String(new Types.ObjectId());
    const friendId = String(new Types.ObjectId());

    await insertTestData({ from: userId, to: friendId });

    const res: any[] = await broker.call(
      'friend.getAllFriends',
      {},
      { meta: { userId } }
    );

    expect(res.length).toBeGreaterThanOrEqual(1);
    const found = res.find((r) => r.id === friendId);
    expect(found).toBeDefined();
  });

  test('Test "friend.buildFriendRelation" - creates bidirectional relation', async () => {
    const user1 = String(new Types.ObjectId());
    const user2 = String(new Types.ObjectId());

    await broker.call('friend.buildFriendRelation', { user1, user2 });

    const user1Friends: any[] = await broker.call(
      'friend.getAllFriends',
      {},
      { meta: { userId: user1 } }
    );
    const user2Friends: any[] = await broker.call(
      'friend.getAllFriends',
      {},
      { meta: { userId: user2 } }
    );

    expect(user1Friends.find((r) => r.id === user2)).toBeDefined();
    expect(user2Friends.find((r) => r.id === user1)).toBeDefined();
  });

  test('Test "friend.removeFriend" - removed friend no longer in list', async () => {
    const userId = String(new Types.ObjectId());
    const friendId = String(new Types.ObjectId());

    await broker.call('friend.buildFriendRelation', {
      user1: userId,
      user2: friendId,
    });

    // confirm relation exists
    const before: any[] = await broker.call(
      'friend.getAllFriends',
      {},
      { meta: { userId } }
    );
    expect(before.find((r) => r.id === friendId)).toBeDefined();

    await broker.call(
      'friend.removeFriend',
      { friendUserId: friendId },
      { meta: { userId } }
    );

    const after: any[] = await broker.call(
      'friend.getAllFriends',
      {},
      { meta: { userId } }
    );
    expect(after.find((r) => r.id === friendId)).toBeUndefined();
  });

  test('Test "friend.checkIsFriend" - returns true for existing friend', async () => {
    const userId = String(new Types.ObjectId());
    const friendId = String(new Types.ObjectId());

    await broker.call('friend.buildFriendRelation', {
      user1: userId,
      user2: friendId,
    });

    const isFriend = await broker.call(
      'friend.checkIsFriend',
      { targetId: friendId },
      { meta: { userId } }
    );

    expect(isFriend).toBeTruthy();
  });

  test('Test "friend.checkIsFriend" - returns false for non-friend', async () => {
    const userId = String(new Types.ObjectId());
    const strangerUserId = String(new Types.ObjectId());

    const isFriend = await broker.call(
      'friend.checkIsFriend',
      { targetId: strangerUserId },
      { meta: { userId } }
    );

    expect(isFriend).toBeFalsy();
  });

  test('Test "friend.setFriendNickname" - nickname visible in getAllFriends', async () => {
    const userId = String(new Types.ObjectId());
    const friendId = String(new Types.ObjectId());

    await broker.call('friend.buildFriendRelation', {
      user1: userId,
      user2: friendId,
    });

    await broker.call(
      'friend.setFriendNickname',
      { targetId: friendId, nickname: 'BestFriend' },
      { meta: { userId, t: (s: string) => s } }
    );

    const friends: any[] = await broker.call(
      'friend.getAllFriends',
      {},
      { meta: { userId } }
    );
    const found = friends.find((r) => r.id === friendId);
    expect(found).toBeDefined();
    expect(found.nickname).toBe('BestFriend');
  });
});
