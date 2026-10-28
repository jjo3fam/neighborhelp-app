process.env.JWT_SECRET = 'test-secret';

import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { SocialTokenService, SocialProfile } from './social-token.service';

describe('Social account identity and account protection', () => {
  let module: TestingModule;
  let auth: AuthService;
  const verify = jest.fn();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      TypeOrmModule.forRoot({ type: 'sqljs', autoLoadEntities: true, synchronize: true }),
      AuthModule,
    ] }).overrideProvider(SocialTokenService).useValue({ verify }).compile();
    auth = module.get(AuthService);
  });
  afterAll(async () => { await module.close(); });
  beforeEach(() => verify.mockReset());

  it('creates a social user and uses stable provider identity for later sign-ins', async () => {
    const profile: SocialProfile = { provider: 'google', subject: 'google-001', email: 'social@example.com', displayName: 'Social Neighbor' };
    verify.mockResolvedValue(profile);
    const first = await auth.socialLogin('google', 'verified-token');
    expect(first.accessToken).toEqual(expect.any(String));
    expect(first.user.email).toBe(profile.email);
    verify.mockResolvedValue({ ...profile, email: 'changed@example.com' });
    const returning = await auth.socialLogin('google', 'new-verified-token');
    expect(returning.user.id).toBe(first.user.id);
    await expect(auth.login(profile.email, 'anything')).rejects.toThrow('Invalid credentials');
  });

  it('never links a new social identity to an existing password account by email', async () => {
    const local = await auth.register('existing@example.com', 'password123');
    verify.mockResolvedValue({ provider: 'facebook', subject: 'fb-001', email: 'existing@example.com' });
    await expect(auth.socialLogin('facebook', 'verified-token')).rejects.toThrow('already uses this email');
    expect((await auth.login('existing@example.com', 'password123')).user.id).toBe(local.user.id);
  });

  it('does not merge different providers using the same email', async () => {
    verify.mockResolvedValue({ provider: 'google', subject: 'google-002', email: 'shared@example.com' });
    await auth.socialLogin('google', 'verified-google-token');
    verify.mockResolvedValue({ provider: 'facebook', subject: 'facebook-002', email: 'shared@example.com' });
    await expect(auth.socialLogin('facebook', 'verified-facebook-token')).rejects.toThrow('already uses this email');
  });

  it('creates no account when provider verification rejects the token', async () => {
    verify.mockRejectedValue(new Error('Unverified token'));
    await expect(auth.socialLogin('google', 'forged-token')).rejects.toThrow('Unverified token');
  });
});
