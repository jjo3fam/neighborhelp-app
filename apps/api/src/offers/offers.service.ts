import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './offer.entity';
import { Match } from '../matches/match.entity';
import { Post } from '../posts/post.entity';
import { CreateOfferDto } from './dto/create-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  findAllForPost(postId: string) {
    return this.offersRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
  }

  create(dto: CreateOfferDto) {
    const offer = this.offersRepository.create({
      postId: dto.postId,
      userId: dto.userId,
      offerAmount: dto.offerAmount,
      message: dto.message,
      status: 'pending',
    });

    return this.offersRepository.save(offer);
  }

  async accept(id: string) {
    const offer = await this.offersRepository.findOne({ where: { id } });
    if (!offer) throw new Error('Offer not found');

    const post = await this.postsRepository.findOne({ where: { id: offer.postId } });
    if (!post) throw new Error('Task not found');

    offer.status = 'accepted';
    const savedOffer = await this.offersRepository.save(offer);

    const existing = await this.matchesRepository.findOne({
      where: { postId: offer.postId, workerUserId: offer.userId },
    });

    if (existing) {
      existing.status = 'accepted';
      existing.exactLocationRevealed = true;
      const updated = await this.matchesRepository.save(existing);
      return { offer: savedOffer, match: updated };
    }

    const match = this.matchesRepository.create({
      postId: offer.postId,
      posterUserId: post.userId,
      workerUserId: offer.userId,
      status: 'accepted',
      exactLocationRevealed: true,
    });

    const savedMatch = await this.matchesRepository.save(match);
    return { offer: savedOffer, match: savedMatch };
  }

  async reject(id: string) {
    const offer = await this.offersRepository.findOne({ where: { id } });
    if (!offer) throw new Error('Offer not found');

    offer.status = 'rejected';
    return this.offersRepository.save(offer);
  }
}
