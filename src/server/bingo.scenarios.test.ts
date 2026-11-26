/**
 * Scenarios for every devvit.json trigger, the menu item and the scheduler task,
 * on the shared virtual-Reddit harness. The last test asserts full coverage.
 */
import { describe, expect } from 'vitest';
import { redis } from '@devvit/web/server';
import { createApp } from './app';
import { createModTest, expectAllEndpointsCovered, type ScenarioRunner } from './test-harness';

const test = createModTest({ appFactory: createApp });

const events = async (gameId: string) =>
  (await redis.zRange(`bot:bingo:game:${gameId}:events`, 0, -1)).map(
    (e) => JSON.parse(e.member) as { type: string; postId: string; author?: string; meta?: string }
  );
const currentGame = async () =>
  JSON.parse((await redis.get('bot:bingo:current-game')) ?? 'null') as { gameId: string } | null;

async function startGame(
  runner: ScenarioRunner,
  world: { mod: (u: string) => unknown; subreddit: () => { id: string } }
) {
  world.mod('modsy');
  const res = await runner
    .as('modsy')
    .menu('create-bingo-post', { location: 'subreddit', targetId: world.subreddit().id });
  const game = await currentGame();
  if (!game) throw new Error('no game started');
  return { res, gameId: game.gameId };
}

describe('menu: create-bingo-post', () => {
  test('a moderator creates the custom post and starts a game', async ({ world, runner }) => {
    const { res, gameId } = await startGame(runner, world);
    expect(res).toEqual({ showToast: { text: 'Bingo post created!', appearance: 'success' } });
    expect(world.describeActions()).toEqual([
      `test-app submitCustomPost ${gameId} title=LLMPhysics Bingo! entry=default`,
    ]);
    expect(world.post(gameId)?.custom?.entry).toBe('default');
    expect(await redis.get(`bot:bingo:game:${gameId}:won`)).toBe('0');
  });

  test('the menu is moderator-only, and the endpoint refuses non-mods too', async ({
    world,
    runner,
  }) => {
    const target = { location: 'subreddit', targetId: world.subreddit().id };
    await expect(runner.as('alice').menu('create-bingo-post', target)).rejects.toThrow(
      /moderator-only/
    );
    const direct = await runner.as('alice').postJson('/internal/menu/create-bingo-post', target);
    expect(direct).toEqual({
      showToast: { text: 'Only moderators can create a bingo post.', appearance: 'neutral' },
    });
    expect(world.actions).toEqual([]);
  });
});

describe('triggers feed the current game', () => {
  test('posts, comments, reports and mod actions are captured as bingo events', async ({
    runner,
  }) => {
    await runner
      .scenario('a busy hour in the subreddit')
      .given('a bingo game is running', ({ runner: r, world: w }) => startGame(r, w))
      .when(
        'alice posts, bob comments, both are reported and a mod removes the comment',
        async ({ runner: r }) => {
          const post = await r.userPosts('alice', {
            id: 't3_toe',
            title: 'My theory of everything',
            selftext: 'E=mc^3',
          });
          const c = await r.userComments('bob', post.id, 'This is not even wrong.');
          await r.report(post.id, 'Low effort');
          await r.report(c.id, 'Rude');
          await r.modRemoves('modsy', c.id);
        }
      )
      .then('every event lands in the game log', async () => {
        const game = await currentGame();
        const log = await events(game!.gameId);
        // Events are scored by Date.now(); same-millisecond events sort by member, so compare as a set.
        expect(log.map((e) => e.type).sort()).toEqual(
          ['comment_create', 'comment_report', 'mod_action', 'post_report', 'post_submit'].sort()
        );
        const byType = Object.fromEntries(log.map((e) => [e.type, e]));
        expect(log.every((e) => e.postId === 't3_toe')).toBe(true);
        expect(byType.post_submit?.author).toBe('alice');
        expect(byType.post_report?.meta).toBe('Low effort');
        expect(byType.mod_action?.meta).toBe('removecomment');
        expect(await redis.hGet(`bot:bingo:game:${game!.gameId}:posts`, 't3_toe')).toBe('1');
      })
      .and('the app itself took no Reddit actions beyond the game post', ({ actions }) => {
        expect(actions).toEqual([]);
      })
      .run();
  });

  test('with no game running every trigger is acknowledged and ignored', async ({
    world,
    runner,
  }) => {
    const post = await runner.userPosts('alice', { title: 'quiet', selftext: '' });
    const c = await runner.userComments('bob', post.id, 'hi');
    await runner.report(post.id, 'x');
    await runner.report(c.id, 'y');
    await runner.modApproves('modsy', post.id);
    expect(world.actions).toEqual([]);
    expect(await redis.get('bot:bingo:current-game')).toBeUndefined();
  });
});

describe('scheduler: bingo-batch-check (hourly cron)', () => {
  test('announces the first bingo on the game post at the top of the hour', async ({
    world,
    runner,
    clock,
  }) => {
    clock.set('2026-11-25T12:30:00Z');
    const { gameId } = await startGame(runner, world);
    const winner = world.user('carol');
    // Carol's card: top row of five tiles, already marked by other users' activity.
    const squares = Array.from({ length: 25 }, (_, i) =>
      i === 12
        ? {
            label: 'FREE',
            displayName: 'FREE',
            gameDescription: '',
            valueKey: 'free',
            marked: true,
            free: true,
          }
        : {
            label: `t${i}`,
            displayName: `t${i}`,
            gameDescription: '',
            valueKey: `k${i}`,
            marked: false,
          }
    );
    await redis.set(`bot:bingo:card:${gameId}:${winner.id}`, JSON.stringify(squares));
    await redis.hSet(`bot:bingo:game:${gameId}:users`, { [winner.id]: '1' });
    for (const i of [0, 1, 2, 3, 4]) await redis.set(`bot:bingo:game:${gameId}:value:k${i}`, '1');

    expect(await runner.advance('29m')).toEqual([]);
    expect(await runner.advance('1m')).toEqual(['bingo-batch-check']);

    const [announcement] = world.commentsOn(gameId as `t3_${string}`);
    expect(announcement?.body).toBe(
      '🎉 **FIRST BINGO!** Congrats to u/carol for being the first to win!'
    );
    expect(await redis.get(`bot:bingo:game:${gameId}:won`)).toBe('1');

    // The next hourly run does not announce again.
    await runner.advance('1h');
    expect(world.commentsOn(gameId as `t3_${string}`)).toHaveLength(1);
  });

  test('resets the round once bingoRoundDurationDays has passed', async ({
    world,
    runner,
    clock,
  }) => {
    clock.set('2026-11-25T00:00:00Z');
    const { gameId } = await startGame(runner, world);
    await redis.set('settings:bingoRoundDurationDays', '7');

    clock.advance('7d1h');
    expect(await runner.runTask('bingo-batch-check')).toEqual({ status: 'round reset' });
    expect((await currentGame())?.gameId).not.toBe(gameId);

    // The game key has an 8-day TTL, so a round longer than that just expires
    // ("no active game") instead of resetting.
    clock.advance('8d');
    expect(await runner.runTask('bingo-batch-check')).toEqual({ status: 'no active game' });
  });
});

// Keep last.
test('every devvit.json endpoint has a scenario', () => {
  expectAllEndpointsCovered();
});
