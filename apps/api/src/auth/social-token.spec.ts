import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { SocialTokenService } from './social-token.service';

describe('Social token verification', () => {
  afterEach(() => jest.restoreAllMocks());

  it('requires configuration before accepting a token', async () => {
    const service = new SocialTokenService(new ConfigService({ GOOGLE_CLIENT_IDS: '', FACEBOOK_APP_ID: '', FACEBOOK_APP_SECRET: '' }));
    expect(service.availability()).toEqual({ google: false, facebook: false });
    await expect(service.verify('google', 'token')).rejects.toThrow('not configured');
  });

  it('uses the Google verifier with the configured audience and requires a verified email', async () => {
    const check = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
    check.mockResolvedValue({ getPayload: () => ({ sub: '123', email: 'test@example.com', email_verified: true }) } as never);
    const service = new SocialTokenService(new ConfigService({ GOOGLE_CLIENT_IDS: 'web-client' }));
    expect((await service.verify('google', 'signed-token')).subject).toBe('123');
    expect(check).toHaveBeenCalledWith({ idToken: 'signed-token', audience: ['web-client'] });
    check.mockResolvedValue({ getPayload: () => ({ sub: '123', email: 'test@example.com', email_verified: false }) } as never);
    await expect(service.verify('google', 'unverified-email')).rejects.toThrow('could not verify');
    check.mockRejectedValue(new Error('Invalid signature or expired token') as never);
    await expect(service.verify('google', 'forged-token')).rejects.toThrow('could not verify');
  });

  it('rejects Facebook tokens issued to another app before retrieving a profile', async () => {
    const request = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: { is_valid: true, app_id: 'another-app', user_id: '123', type: 'USER', expires_at: 9999999999 } }) } as Response);
    const service = new SocialTokenService(new ConfigService({ FACEBOOK_APP_ID: 'our-app', FACEBOOK_APP_SECRET: 'server-secret' }));
    await expect(service.verify('facebook', 'wrong-app-token')).rejects.toThrow('could not verify');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('requires the Facebook profile to match the inspected token subject', async () => {
    const request = jest.spyOn(global, 'fetch');
    request.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { is_valid: true, app_id: 'our-app', user_id: '123', type: 'USER', expires_at: 9999999999 } }) } as Response);
    request.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'different-user', email: 'test@example.com' }) } as Response);
    const service = new SocialTokenService(new ConfigService({ FACEBOOK_APP_ID: 'our-app', FACEBOOK_APP_SECRET: 'server-secret' }));
    await expect(service.verify('facebook', 'token')).rejects.toThrow('could not verify');
  });
});
