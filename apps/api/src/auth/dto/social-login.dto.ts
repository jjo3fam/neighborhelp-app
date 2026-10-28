import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { SocialProvider } from '../social-identity.entity';

export class SocialLoginDto {
  @IsIn(['google', 'facebook'])
  provider!: SocialProvider;

  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  token!: string;
}
