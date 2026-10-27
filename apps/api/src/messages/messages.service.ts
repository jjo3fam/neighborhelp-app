import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../matches/match.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './message.entity';

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
    const match = await this.requireMatch(dto.postId, userId);
    const receiverId = match.posterId === userId ? match.workerId : match.posterId;
    return this.messages.save(
      this.messages.create({ postId: dto.postId, senderId: userId, receiverId, body: dto.body }),
    );
  }

  async findForPost(postId: string, userId: string) {
    await this.requireMatch(postId, userId);
    return this.messages.find({ where: { postId }, order: { createdAt: 'ASC' } });
  }
}
