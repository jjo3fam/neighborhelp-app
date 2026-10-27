import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';

@Injectable()
export class MatchesService {
  constructor(@InjectRepository(Match) private readonly repo: Repository<Match>) {}

  findForUser(userId: string) {
    return this.repo.find({
      where: [{ posterId: userId }, { workerId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(id: string, userId: string) {
    const match = await this.repo.findOne({ where: { id } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.posterId !== userId && match.workerId !== userId) {
      throw new ForbiddenException('You are not part of this match');
    }
    return match;
  }
}
