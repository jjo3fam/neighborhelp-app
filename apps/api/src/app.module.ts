import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { OffersModule } from './offers/offers.module';
import { MatchesModule } from './matches/matches.module';
import { MessagesModule } from './messages/messages.module';
import { User } from './users/user.entity';
import { Post } from './posts/post.entity';
import { Offer } from './offers/offer.entity';
import { Match } from './matches/match.entity';
import { Message } from './messages/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'neighborhelp',
      entities: [User, Post, Offer, Match, Message],
      synchronize: true,
      logging: false,
    }),
    UsersModule,
    AuthModule,
    PostsModule,
    OffersModule,
    MatchesModule,
    MessagesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
