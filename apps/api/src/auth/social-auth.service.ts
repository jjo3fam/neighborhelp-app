import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { SocialIdentity, SocialProvider } from './social-identity.entity';
import { SocialTokenService } from './social-token.service';

@Injectable()
export class SocialAuthService {
  constructor(private readonly database: DataSource, private readonly tokens: SocialTokenService) {}

  async signIn(provider: SocialProvider, token: string) {
    const profile = await this.tokens.verify(provider, token);
    try {
      return await this.database.transaction(async (manager) => {
        const identity = await manager.findOne(SocialIdentity, { where: { provider, subject: profile.subject } });
        if (identity) {
          const user = await manager.findOne(User, { where: { id: identity.userId } });
          if (!user) throw new UnauthorizedException('This account is no longer available');
          return user;
        }
        // Provider email equality alone must never grant access to an existing account.
        const existing = await manager.createQueryBuilder(User, 'user').where('LOWER(user.email) = :email', { email: profile.email }).getOne();
        if (existing) throw new ConflictException('An account already uses this email. Please sign in using its existing login method.');
        const user = await manager.save(User, manager.create(User, {
          email: profile.email, displayName: profile.displayName, avatarUrl: profile.avatarUrl, authProvider: provider,
        }));
        await manager.save(SocialIdentity, manager.create(SocialIdentity, { userId: user.id, provider, subject: profile.subject }));
        return user;
      });
    } catch (error) {
      if ((error as { driverError?: { code?: string } }).driverError?.code === '23505') {
        const identity = await this.database.getRepository(SocialIdentity).findOne({ where: { provider, subject: profile.subject } });
        if (identity) {
          const user = await this.database.getRepository(User).findOne({ where: { id: identity.userId } });
          if (user) return user;
        }
        throw new ConflictException('An account already uses this email. Please sign in using its existing login method.');
      }
      throw error;
    }
  }
}
