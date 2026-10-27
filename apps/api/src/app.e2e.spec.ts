process.env.JWT_SECRET = 'test-secret';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AuthModule } from './auth/auth.module';
import { MatchesModule } from './matches/matches.module';
import { MessagesModule } from './messages/messages.module';
import { OffersModule } from './offers/offers.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';

type Account = { token: string; id: string; email: string };

describe('NeighborHelp API (in-memory DB)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let seq = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          synchronize: true,
          autoLoadEntities: true,
        }),
        AuthModule,
        UsersModule,
        PostsModule,
        OffersModule,
        MatchesModule,
        MessagesModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    // Same pipe options as main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  async function register(name = 'user'): Promise<Account> {
    const email = `${name}${++seq}@example.com`;
    const res = await http
      .post('/auth/register')
      .send({ email, password: 'password123', displayName: name })
      .expect(201);
    return { token: res.body.accessToken, id: res.body.user.id, email };
  }

  const auth = (a: Account) => ({ Authorization: `Bearer ${a.token}` });

  const postBody = (extra: Record<string, unknown> = {}) => ({
    title: 'Help moving a couch',
    description: 'Two flights of stairs',
    approximateLatitude: 40.0,
    approximateLongitude: -75.0,
    approximateLocationName: 'Near Main St',
    exactLatitude: 40.0012,
    exactLongitude: -75.0034,
    exactLocationLabel: '12 Oak Lane',
    ...extra,
  });

  async function createPost(owner: Account, extra: Record<string, unknown> = {}) {
    const res = await http.post('/posts').set(auth(owner)).send(postBody(extra)).expect(201);
    return res.body as { id: string };
  }

  describe('ValidationPipe + DTOs', () => {
    it('rejects an invalid registration', async () => {
      await http.post('/auth/register').send({ email: 'nope', password: 'x' }).expect(400);
    });

    it('accepts valid DTO fields (not stripped by whitelist)', async () => {
      const owner = await register('dto');
      const res = await http.post('/posts').set(auth(owner)).send(postBody()).expect(201);
      expect(res.body.title).toBe('Help moving a couch');
      expect(res.body.approximateLocationName).toBe('Near Main St');
    });

    it('rejects a post missing required fields', async () => {
      const owner = await register('dto');
      await http.post('/posts').set(auth(owner)).send({ description: 'no title' }).expect(400);
    });

    it('rejects a duplicate registration with 409', async () => {
      const a = await register('dup');
      await http
        .post('/auth/register')
        .send({ email: a.email, password: 'password123' })
        .expect(409);
    });
  });

  describe('users', () => {
    it('never leaks passwordHash and hides email on public profiles', async () => {
      const a = await register('me');
      const b = await register('other');
      const me = await http.get('/users/me').set(auth(a)).expect(200);
      expect(me.body.email).toBe(a.email);
      expect(me.body.passwordHash).toBeUndefined();

      const other = await http.get(`/users/${a.id}`).set(auth(b)).expect(200);
      expect(other.body.passwordHash).toBeUndefined();
      expect(other.body.email).toBeUndefined();
      expect(other.body.phone).toBeUndefined();
    });

    it('requires authentication', async () => {
      await http.get('/users/me').expect(401);
    });
  });

  describe('posts', () => {
    it('never exposes exact location publicly', async () => {
      const owner = await register('poster');
      const post = await createPost(owner);

      const list = await http.get('/posts').expect(200);
      const one = await http.get(`/posts/${post.id}`).expect(200);
      for (const p of [...list.body, one.body]) {
        expect(p.exactLatitude).toBeUndefined();
        expect(p.exactLongitude).toBeUndefined();
        expect(p.exactLocationLabel).toBeUndefined();
      }
      expect(JSON.stringify(list.body)).not.toContain('Oak Lane');
    });

    it('lets only the owner update or delete, and ignores status changes', async () => {
      const owner = await register('poster');
      const stranger = await register('stranger');
      const post = await createPost(owner);

      await http.patch(`/posts/${post.id}`).set(auth(stranger)).send({ title: 'hacked' }).expect(403);
      await http.delete(`/posts/${post.id}`).set(auth(stranger)).expect(403);

      const res = await http
        .patch(`/posts/${post.id}`)
        .set(auth(owner))
        .send({ title: 'Updated title', status: 'closed', userId: stranger.id })
        .expect(200);
      expect(res.body.title).toBe('Updated title');
      expect(res.body.status).toBe('open');
      expect(res.body.userId).toBe(owner.id);
    });

    it('filters nearby posts by distance', async () => {
      const owner = await register('geo');
      const near = await createPost(owner, { title: 'Near post', approximateLatitude: 10, approximateLongitude: 10 });
      await createPost(owner, { title: 'Far post', approximateLatitude: 50, approximateLongitude: 50 });

      const res = await http
        .get('/posts/nearby')
        .query({ latitude: 10.01, longitude: 10.01, radiusMiles: 25 })
        .expect(200);
      const ids = res.body.map((p: { id: string }) => p.id);
      expect(ids).toContain(near.id);
      expect(res.body.every((p: { title: string }) => p.title !== 'Far post')).toBe(true);
    });
  });

  describe('offers and matches', () => {
    it('blocks offers on your own post and duplicate offers', async () => {
      const owner = await register('poster');
      const worker = await register('worker');
      const post = await createPost(owner);

      await http.post('/offers').set(auth(owner)).send({ postId: post.id }).expect(400);
      await http.post('/offers').set(auth(worker)).send({ postId: post.id }).expect(201);
      await http.post('/offers').set(auth(worker)).send({ postId: post.id }).expect(409);
    });

    it('only the post owner can accept; acceptance reveals exact location to the match', async () => {
      const owner = await register('poster');
      const worker = await register('worker');
      const other = await register('other');
      const stranger = await register('stranger');
      const post = await createPost(owner);

      const offer = (await http.post('/offers').set(auth(worker)).send({ postId: post.id }).expect(201)).body;
      const otherOffer = (await http.post('/offers').set(auth(other)).send({ postId: post.id }).expect(201)).body;

      // Not the owner: worker cannot accept their own offer, nor can a stranger
      await http.patch(`/offers/${offer.id}/accept`).set(auth(worker)).expect(403);
      await http.patch(`/offers/${offer.id}/accept`).set(auth(stranger)).expect(403);

      const accepted = await http.patch(`/offers/${offer.id}/accept`).set(auth(owner)).expect(200);
      expect(accepted.body.match.workerId).toBe(worker.id);
      expect(accepted.body.match.posterId).toBe(owner.id);
      expect(accepted.body.match.exactLocationLabel).toBe('12 Oak Lane');

      // Post is no longer open and the competing offer was rejected
      const postAfter = await http.get(`/posts/${post.id}`).expect(200);
      expect(postAfter.body.status).toBe('matched');
      const offers = await http.get(`/offers/post/${post.id}`).set(auth(owner)).expect(200);
      const byId = Object.fromEntries(offers.body.map((o: any) => [o.id, o.status]));
      expect(byId[offer.id]).toBe('accepted');
      expect(byId[otherOffer.id]).toBe('rejected');

      // Cannot accept twice or make new offers
      await http.patch(`/offers/${offer.id}/accept`).set(auth(owner)).expect(400);
      await http.post('/offers').set(auth(stranger)).send({ postId: post.id }).expect(400);

      // Match visibility: parties only
      const matchId = accepted.body.match.id;
      await http.get(`/matches/${matchId}`).set(auth(worker)).expect(200);
      await http.get(`/matches/${matchId}`).set(auth(owner)).expect(200);
      await http.get(`/matches/${matchId}`).set(auth(stranger)).expect(403);
      await http.get(`/matches/${matchId}`).set(auth(other)).expect(403);
      const mine = await http.get('/matches/me').set(auth(stranger)).expect(200);
      expect(mine.body).toEqual([]);
    });

    it('shows an offer author only their own offers', async () => {
      const owner = await register('poster');
      const w1 = await register('w1');
      const w2 = await register('w2');
      const post = await createPost(owner);
      await http.post('/offers').set(auth(w1)).send({ postId: post.id }).expect(201);
      await http.post('/offers').set(auth(w2)).send({ postId: post.id }).expect(201);

      const res = await http.get(`/offers/post/${post.id}`).set(auth(w1)).expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].userId).toBe(w1.id);
    });

    it('has no public endpoint to create matches', async () => {
      const a = await register('a');
      await http.post('/matches').set(auth(a)).send({ postId: 'x' }).expect(404);
      await http.get(`/matches/user/${a.id}`).set(auth(a)).expect(403).catch(() => undefined);
    });
  });

  describe('messages', () => {
    it('is limited to matched parties, with sender/receiver derived server-side', async () => {
      const owner = await register('poster');
      const worker = await register('worker');
      const stranger = await register('stranger');
      const post = await createPost(owner);
      const offer = (await http.post('/offers').set(auth(worker)).send({ postId: post.id }).expect(201)).body;

      // Before acceptance nobody can message
      await http.post('/messages').set(auth(worker)).send({ postId: post.id, body: 'hi' }).expect(403);
      await http.post('/messages').set(auth(owner)).send({ postId: post.id, body: 'hi' }).expect(403);

      await http.patch(`/offers/${offer.id}/accept`).set(auth(owner)).expect(200);

      // Spoofed sender/receiver are ignored
      const sent = await http
        .post('/messages')
        .set(auth(worker))
        .send({ postId: post.id, body: 'On my way', senderId: stranger.id, receiverId: stranger.id })
        .expect(201);
      expect(sent.body.senderId).toBe(worker.id);
      expect(sent.body.receiverId).toBe(owner.id);

      await http.post('/messages').set(auth(stranger)).send({ postId: post.id, body: 'spam' }).expect(403);
      await http.get(`/messages/post/${post.id}`).set(auth(stranger)).expect(403);

      const thread = await http.get(`/messages/post/${post.id}`).set(auth(owner)).expect(200);
      expect(thread.body).toHaveLength(1);
      expect(thread.body[0].body).toBe('On my way');
    });

    it('requires authentication', async () => {
      await http.get('/messages/post/00000000-0000-0000-0000-000000000000').expect(401);
    });
  });
});
