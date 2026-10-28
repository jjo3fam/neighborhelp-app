import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { getJwtSecret } from './jwt-secret';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialIdentity } from './social-identity.entity';
import { SocialTokenService } from './social-token.service';
import { SocialAuthService } from './social-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialIdentity]),
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: getJwtSecret(config),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, SocialTokenService, SocialAuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
