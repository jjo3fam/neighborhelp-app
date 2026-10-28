import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';

@Injectable()
export class MatchesService {
  constructor(@InjectRepository(Match) private readonly repo: Repository<Match>) {}

  findForUser(userId: string) {
    return this.repo.createQueryBuilder('acceptedMatch')
      // Reference columns are text in the existing schema; primary keys are UUIDs.
      .leftJoin(Post, 'post', 'CAST(post.id AS varchar) = acceptedMatch.postId')
      .leftJoin(User, 'poster', 'CAST(poster.id AS varchar) = acceptedMatch.posterId')
      .leftJoin(User, 'worker', 'CAST(worker.id AS varchar) = acceptedMatch.workerId')
      .select('acceptedMatch.id', 'id')
      .addSelect('acceptedMatch.postId', 'postId')
      .addSelect('acceptedMatch.offerId', 'offerId')
      .addSelect('acceptedMatch.posterId', 'posterId')
      .addSelect('acceptedMatch.workerId', 'workerId')
      .addSelect('acceptedMatch.createdAt', 'createdAt')
      .addSelect('post.title', 'postTitle')
      .addSelect('poster.displayName', 'posterName')
      .addSelect('poster.avatarUrl', 'posterAvatarUrl')
      .addSelect('worker.displayName', 'workerName')
      .addSelect('worker.avatarUrl', 'workerAvatarUrl')
      .where('acceptedMatch.posterId = :userId OR acceptedMatch.workerId = :userId', { userId })
      .orderBy('acceptedMatch.createdAt', 'DESC')
      .getRawMany();
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
