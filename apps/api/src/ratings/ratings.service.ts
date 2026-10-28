import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../matches/match.entity';
import { User } from '../users/user.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private readonly ratings: Repository<Rating>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
  ) {}

  async create(raterId: string, dto: CreateRatingDto) {
    const match = await this.matches.findOne({ where: { id: dto.matchId } });
    if (!match) throw new NotFoundException('Accepted task not found');

    let ratedUserId: string;
    if (match.posterId === raterId) ratedUserId = match.workerId;
    else if (match.workerId === raterId) ratedUserId = match.posterId;
    else throw new ForbiddenException('Only people in this accepted task can leave a rating');

    if (await this.ratings.findOne({ where: { matchId: match.id, raterId } })) {
      throw new ConflictException('You have already rated this accepted task');
    }

    const feedback = dto.feedback?.trim() || null;
    if (feedback && feedback.split(/\s+/).length > 20) {
      throw new BadRequestException('Feedback must be 20 words or fewer');
    }

    try {
      return await this.ratings.save(this.ratings.create({
        matchId: match.id,
        postId: match.postId,
        raterId,
        ratedUserId,
        score: dto.score,
        feedback,
      }));
    } catch (error) {
      const code = (error as { driverError?: { code?: string }; code?: string }).driverError?.code
        ?? (error as { code?: string }).code;
      if (code === '23505') throw new ConflictException('You have already rated this accepted task');
      throw error;
    }
  }

  findAuthoredByUser(userId: string) {
    return this.ratings.find({
      where: { raterId: userId },
      select: { id: true, matchId: true, score: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getProfileRatings(userId: string) {
    const [ratings, summary] = await Promise.all([
      this.ratings.createQueryBuilder('rating')
        // Reference columns are text in the existing schema; primary keys are UUIDs.
        .leftJoin(User, 'rater', 'CAST(rater.id AS varchar) = rating.raterId')
        .select('rating.id', 'id')
        .addSelect('rating.score', 'score')
        .addSelect('rating.feedback', 'feedback')
        .addSelect('rating.createdAt', 'createdAt')
        .addSelect('rater.displayName', 'raterName')
        .addSelect('rater.avatarUrl', 'raterAvatarUrl')
        .where('rating.ratedUserId = :userId', { userId })
        .orderBy('rating.createdAt', 'DESC')
        .limit(20)
        .getRawMany(),
      this.ratings.createQueryBuilder('rating')
        .select('AVG(rating.score)', 'average')
        .addSelect('COUNT(rating.id)', 'count')
        .where('rating.ratedUserId = :userId', { userId })
        .getRawOne(),
    ]);

    return {
      ratingAverage: Number(summary?.average ?? 0),
      ratingCount: Number(summary?.count ?? 0),
      ratings: ratings.map((rating) => ({
        id: rating.id,
        score: Number(rating.score),
        feedback: rating.feedback || null,
        createdAt: rating.createdAt,
        from: {
          displayName: rating.raterName || 'NeighborHelp member',
          avatarUrl: rating.raterAvatarUrl || null,
        },
      })),
    };
  }
}
