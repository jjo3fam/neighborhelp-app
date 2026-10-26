import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('post/:postId')
  findAllForPost(@Param('postId') postId: string) {
    return this.offersService.findAllForPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOfferDto) {
    return this.offersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.offersService.accept(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.offersService.reject(id);
  }
}
