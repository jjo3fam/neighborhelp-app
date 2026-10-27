import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Match } from '../matches/match.entity';
import { Post } from '../posts/post.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Offer } from './offer.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer) private readonly offers: Repository<Offer>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateOfferDto) {
    const post = await this.posts.findOne({ where: { id: dto.postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId === userId) throw new BadRequestException('You cannot make an offer on your own post');
    if (post.status !== 'open') throw new BadRequestException('This post is no longer open');

    const existing = await this.offers.findOne({ where: { postId: post.id, userId } });
    if (existing) throw new ConflictException('You already made an offer on this post');

    return this.offers.save(this.offers.create({ postId: post.id, userId, message: dto.message }));
  }

  /** Poster sees all offers; an offer's author sees only their own. */
  async findAllForPost(postId: string, userId: string) {
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId === userId) {
      return this.offers.find({ where: { postId }, order: { createdAt: 'ASC' } });
    }
    return this.offers.find({ where: { postId, userId } });
  }

  async accept(offerId: string, userId: string) {
    return this.dataSource.transaction(async (em) => {
      const offer = await em.findOne(Offer, { where: { id: offerId } });
      if (!offer) throw new NotFoundException('Offer not found');

      const post = await em.findOne(Post, { where: { id: offer.postId } });
      if (!post) throw new NotFoundException('Post not found');
      if (post.userId !== userId) throw new ForbiddenException('Only the post owner can accept offers');
      if (post.status !== 'open') throw new BadRequestException('This post is no longer open');
      if (offer.status !== 'pending') throw new BadRequestException('This offer is no longer pending');

      offer.status = 'accepted';
      await em.save(offer);
      await em
        .createQueryBuilder()
        .update(Offer)
        .set({ status: 'rejected' })
        .where('postId = :postId AND id != :id AND status = :s', {
          postId: post.id,
          id: offer.id,
          s: 'pending',
        })
        .execute();

      post.status = 'matched';
      await em.save(post);

      const match = await em.save(
        em.create(Match, {
          postId: post.id,
          offerId: offer.id,
          posterId: post.userId,
          workerId: offer.userId,
        }),
      );
      return { offer, match };
    });
  }

  async reject(offerId: string, userId: string) {
    const offer = await this.offers.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    const post = await this.posts.findOne({ where: { id: offer.postId } });
    if (!post || post.userId !== userId) {
      throw new ForbiddenException('Only the post owner can reject offers');
    }
    if (offer.status !== 'pending') throw new BadRequestException('This offer is no longer pending');
    offer.status = 'rejected';
    return this.offers.save(offer);
  }
}
