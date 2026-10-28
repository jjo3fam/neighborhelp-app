import { BadRequestException, Controller, Get, NotFoundException, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { diskStorage } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { RatingsService } from '../ratings/ratings.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly ratingsService: RatingsService) {}

  @Get('me')
  async getMe(@CurrentUser() userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const ratings = await this.ratingsService.getProfileRatings(userId);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      homeLocationName: user.homeLocationName,
      ...ratings,
    };
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: `${process.cwd()}/uploads/avatars`,
      filename: (_req, _file, callback) => callback(null, `${randomUUID()}.jpg`),
    }),
    limits: { fileSize: 1_500_000, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (file.mimetype !== 'image/jpeg') {
        callback(new BadRequestException('Please upload a JPEG photo.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  async uploadAvatar(@CurrentUser() userId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose a photo to upload.');
    const user = await this.usersService.updateAvatar(userId, `/uploads/avatars/${file.filename}`);
    if (!user) throw new NotFoundException('User not found');
    return { avatarUrl: user.avatarUrl };
  }

  /** Public profile: never includes email, phone or credentials. */
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const ratings = await this.ratingsService.getProfileRatings(id);
    return { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, homeLocationName: user.homeLocationName, ...ratings };
  }
}
