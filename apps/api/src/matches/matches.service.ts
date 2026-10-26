import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { CreateMatchDto } from './dto/create-match.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
  ) {}

  findByUser(userId: string) {
    return this.matchesRepository.find({
      where: [{ posterUserId: userId }, { workerUserId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  findForUserAndPost(postId: string, userId: string) {
    return this.matchesRepository.findOne({
      where: [{ postId, posterUserId: userId }, { postId, workerUserId: userId }],
    });
  }

  create(dto: CreateMatchDto) {
    const match = this.matchesRepository.create({
      postId: dto.postId,
      posterUserId: dto.posterUserId,
      workerUserId: dto.workerUserId,
      status: 'accepted',
      exactLocationRevealed: !!dto.exactLocationRevealed,
    });

    return this.matchesRepository.save(match);
  }
}
