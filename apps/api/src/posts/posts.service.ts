import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './post.entity';

const EARTH_RADIUS_MILES = 3958.8;

export function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

/** Removes any private exact-location fields before a post leaves the API. */
export function toPublicPost(post: Post) {
  const { exactLatitude: _a, exactLongitude: _b, exactLocationLabel: _c, ...rest } = post;
  return rest;
}

@Injectable()
export class PostsService {
  constructor(@InjectRepository(Post) private readonly repo: Repository<Post>) {}

  async create(userId: string, dto: CreatePostDto) {
    const saved = await this.repo.save(this.repo.create({ ...dto, userId, status: 'open' }));
    return toPublicPost(saved);
  }

  async findAll() {
    const posts = await this.repo.find({ where: { status: 'open' }, order: { createdAt: 'DESC' } });
    return posts.map(toPublicPost);
  }

  async findNearby(latitude: number, longitude: number, radiusMiles = 25) {
    const posts = await this.repo.find({ where: { status: 'open' } });
    return posts
      .map((p) => ({
        post: p,
        distance: distanceMiles(latitude, longitude, p.approximateLatitude, p.approximateLongitude),
      }))
      .filter((x) => x.distance <= radiusMiles)
      .sort((x, y) => x.distance - y.distance)
      .map((x) => ({ ...toPublicPost(x.post), distanceMiles: Math.round(x.distance * 10) / 10 }));
  }

  async findOne(id: string) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return toPublicPost(post);
  }

  async update(id: string, userId: string, dto: UpdatePostDto) {
    const post = await this.getOwned(id, userId);
    Object.assign(post, dto);
    return toPublicPost(await this.repo.save(post));
  }

  async remove(id: string, userId: string) {
    const post = await this.getOwned(id, userId);
    await this.repo.remove(post);
    return { deleted: true };
  }

  private async getOwned(id: string, userId: string) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('You do not own this post');
    return post;
  }
}
