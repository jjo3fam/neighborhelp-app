import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/match.entity';
import { Post } from '../posts/post.entity';
import { Offer } from './offer.entity';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, Post, Match])],
  providers: [OffersService],
  controllers: [OffersController],
})
export class OffersModule {}
