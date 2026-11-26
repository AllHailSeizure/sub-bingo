import { describe, expect } from 'vitest';
import type { T3 } from '@devvit/web/shared';
import { createApp } from './app';
import { createModTest } from './test-harness';

const test = createModTest({ appFactory: createApp });

describe('sub-bingo routes', () => {
  for (const slug of [
    'post-submit',
    'comment-create',
    'post-report',
    'comment-report',
    'mod-action',
  ]) {
    test(`${slug} trigger acknowledges with no active game`, async ({ world, runner }) => {
      const postId = 't3_route1' as T3;
      world.seedPost({ id: postId, title: 'A post' });

      const res = await runner.trigger(slug, {
        type: 'Unknown',
        post: { id: postId, title: 'A post', authorId: 't2_author' },
        comment: { id: 't1_c1', body: 'hello', author: 'user1', postId },
        author: { name: 'user1' },
      });

      expect(res).toEqual({ status: 'ok' });
      expect(world.commentsOn(postId)).toHaveLength(0);
    });
  }
});
