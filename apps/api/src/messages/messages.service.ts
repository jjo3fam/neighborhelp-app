import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../matches/match.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './message.entity';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
  ) {}

  private async requireMatch(postId: string, userId: string) {
    const match = await this.matches.findOne({ where: { postId } });
    if (!match || (match.posterId !== userId && match.workerId !== userId)) {
      throw new ForbiddenException('Messaging is only available between matched users');
    }
    return match;
  }

  async send(userId: string, dto: CreateMessageDto) {
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('Enter a message');
    const match = await this.requireMatch(dto.postId, userId);
    const receiverId = match.posterId === userId ? match.workerId : match.posterId;
    return this.messages.save(
      this.messages.create({ postId: dto.postId, senderId: userId, receiverId, body }),
    );
  }

  async inbox(userId: string) {
    return this.matches.createQueryBuilder('acceptedMatch')
      .leftJoin(Post, 'post', 'CAST(post.id AS varchar) = acceptedMatch.postId')
      .leftJoin(User, 'person', 'CAST(person.id AS varchar) = CASE WHEN acceptedMatch.posterId = :userId THEN acceptedMatch.workerId ELSE acceptedMatch.posterId END')
      .select('acceptedMatch.postId', 'postId')
      .addSelect('post.title', 'postTitle')
      .addSelect('person.id', 'otherUserId')
      .addSelect('person.displayName', 'otherName')
      .addSelect('person.avatarUrl', 'otherAvatarUrl')
      .addSelect((query) => query.select('message.body').from(Message, 'message')
        .where('message.postId = acceptedMatch.postId')
        .orderBy('message.createdAt', 'DESC').addOrderBy('message.id', 'DESC').limit(1), 'lastMessage')
      .addSelect((query) => query.select('message.createdAt').from(Message, 'message')
        .where('message.postId = acceptedMatch.postId')
        .orderBy('message.createdAt', 'DESC').addOrderBy('message.id', 'DESC').limit(1), 'lastMessageAt')
      .where('acceptedMatch.posterId = :userId OR acceptedMatch.workerId = :userId', { userId })
      .orderBy('"lastMessageAt"', 'DESC', 'NULLS LAST')
      .addOrderBy('acceptedMatch.createdAt', 'DESC')
      .getRawMany();
  }

  async findForPost(postId: string, userId: string, before?: string) {
    await this.requireMatch(postId, userId);
    const query = this.messages.createQueryBuilder('message').where('message.postId = :postId', { postId });
    if (before) {
      const cursor = await this.messages.findOne({ where: { id: before, postId } });
      if (!cursor) throw new BadRequestException('Message cursor is invalid');
      // Compare stored timestamps directly so PostgreSQL microseconds are preserved.
      const cursorDate = this.messages.createQueryBuilder('cursor').select('cursor.createdAt')
        .where('cursor.id = :cursorId').getQuery();
      query.andWhere(`(message.createdAt < (${cursorDate}) OR (message.createdAt = (${cursorDate}) AND message.id < :cursorId))`, { cursorId: cursor.id });
    }
    const messages = await query.orderBy('message.createdAt', 'DESC').addOrderBy('message.id', 'DESC').take(100).getMany();
    return messages.reverse();
  }
}
