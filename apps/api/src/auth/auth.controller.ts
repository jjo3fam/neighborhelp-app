import { BadRequestException, Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { SocialTokenService } from './social-token.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly socialTokens: SocialTokenService) {}

  @Get('social/config')
  socialConfig() { return this.socialTokens.availability(); }

  @Post('social')
  social(@Body() body: SocialLoginDto, @Req() request: Request) {
    if (!request.secure) throw new BadRequestException('Social sign-in requires HTTPS');
    return this.authService.socialLogin(body.provider, body.token);
  }

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.displayName, body.phone);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
