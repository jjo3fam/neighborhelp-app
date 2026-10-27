import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateOfferDto) {
    return this.offersService.create(userId, dto);
  }

  @Get('post/:postId')
  forPost(@Param('postId') postId: string, @CurrentUser() userId: string) {
    return this.offersService.findAllForPost(postId, userId);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.offersService.accept(id, userId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.offersService.reject(id, userId);
  }
}
