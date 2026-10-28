import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';
import { createHmac } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { SocialProvider } from './social-identity.entity';

export type SocialProfile = { provider: SocialProvider; subject: string; email: string; displayName?: string; avatarUrl?: string };

@Injectable()
export class SocialTokenService {
  private readonly google = new OAuth2Client();
  constructor(private readonly config: ConfigService) {}

  private googleAudiences() {
    return (this.config.get<string>('GOOGLE_CLIENT_IDS') || '').split(',').map((id) => id.trim()).filter(Boolean);
  }

  availability() {
    return {
      google: this.googleAudiences().length > 0,
      facebook: Boolean(this.config.get('FACEBOOK_APP_ID') && this.config.get('FACEBOOK_APP_SECRET')),
    };
  }

  async verify(provider: SocialProvider, token: string): Promise<SocialProfile> {
    if (!this.availability()[provider]) throw new ServiceUnavailableException(`${provider === 'google' ? 'Google' : 'Facebook'} sign-in is not configured yet`);
    if (provider === 'google') {
      try {
        const ticket = await this.google.verifyIdToken({ idToken: token, audience: this.googleAudiences() });
        const profile = ticket.getPayload();
        if (!profile?.sub || !profile.email || !profile.email_verified || !isEmail(profile.email)) throw new Error('Invalid identity');
        return { provider, subject: profile.sub, email: profile.email.toLowerCase(), displayName: profile.name?.slice(0, 100), avatarUrl: profile.picture };
      } catch {
        throw new UnauthorizedException('Google could not verify this sign-in. Please try again.');
      }
    }

    const appId = this.config.get<string>('FACEBOOK_APP_ID')!;
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET')!;
    const version = this.config.get<string>('FACEBOOK_GRAPH_VERSION') || 'v24.0';
    if (!/^v\d+\.\d+$/.test(version)) throw new ServiceUnavailableException('Facebook API version is not configured correctly');
    const graph = `https://graph.facebook.com/${version}`;
    try {
      const debugUrl = new URL(`${graph}/debug_token`);
      debugUrl.searchParams.set('input_token', token);
      const response = await fetch(debugUrl, { headers: { Authorization: `Bearer ${appId}|${appSecret}` }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Token verification failed');
      const { data } = await response.json() as { data?: { is_valid: boolean; app_id: string; user_id: string; type: string; expires_at: number; data_access_expires_at?: number } };
      const now = Date.now() / 1000;
      if (!data?.is_valid || String(data.app_id) !== appId || data.type !== 'USER' || !data.user_id
        || (data.expires_at > 0 && data.expires_at <= now)
        || (data.data_access_expires_at && data.data_access_expires_at <= now)) throw new Error('Invalid token');

      const profileUrl = new URL(`${graph}/me`);
      profileUrl.searchParams.set('fields', 'id,name,email,picture.width(256).height(256)');
      profileUrl.searchParams.set('appsecret_proof', createHmac('sha256', appSecret).update(token).digest('hex'));
      const profileResponse = await fetch(profileUrl, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
      if (!profileResponse.ok) throw new Error('Profile verification failed');
      const profile = await profileResponse.json() as { id?: string; name?: string; email?: string; picture?: { data?: { url?: string } } };
      if (profile.id !== data.user_id) throw new Error('Identity mismatch');
      if (!profile.email || !isEmail(profile.email)) throw new UnauthorizedException('Facebook did not share an email address. Allow email access or sign up using email.');
      return { provider, subject: data.user_id, email: profile.email.toLowerCase(), displayName: profile.name?.slice(0, 100), avatarUrl: profile.picture?.data?.url };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Facebook could not verify this sign-in. Please try again.');
    }
  }
}
