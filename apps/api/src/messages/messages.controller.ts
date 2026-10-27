import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser() userId: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.send(userId, dto);
  }

  @Get('post/:postId')
  forPost(@Param('postId') postId: string, @CurrentUser() userId: string) {
    return this.messagesService.findForPost(postId, userId);
  }
}
