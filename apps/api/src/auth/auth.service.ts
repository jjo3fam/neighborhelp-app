import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, displayName?: string, phone?: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new UnauthorizedException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      passwordHash,
      displayName,
      phone,
      authProvider: 'local',
    });

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken, user: { id: user.id, email: user.email, displayName: user.displayName } };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken, user: { id: user.id, email: user.email, displayName: user.displayName } };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
