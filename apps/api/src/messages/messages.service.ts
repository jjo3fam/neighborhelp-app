import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  findByPost(postId: string) {
    return this.messagesRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
  }

  create(dto: CreateMessageDto) {
    const message = this.messagesRepository.create({
      postId: dto.postId,
      senderId: dto.senderId,
      receiverId: dto.receiverId,
      content: dto.content,
    });

    return this.messagesRepository.save(message);
  }
}
