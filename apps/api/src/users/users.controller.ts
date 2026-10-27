import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/location')
  async updateMyLocation(@Body() body: { location: string }, @Req() req: any) {
    const location = body?.location?.trim();
    if (!location || location.length > 100) {
      throw new BadRequestException('Location must be between 1 and 100 characters');
    }

    const user = await this.usersService.updateLocation(req.user.id, location);
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      location: user.location,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
