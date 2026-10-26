import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  findAll() {
    return this.postsRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string) {
    return this.postsRepository.findOne({ where: { id } });
  }

  create(dto: CreatePostDto, userId: string) {
    const post = this.postsRepository.create({
      ...dto,
      userId,
      status: 'open',
    });
    return this.postsRepository.save(post);
  }

  update(id: string, dto: UpdatePostDto) {
    return this.postsRepository.update(id, dto);
  }

  remove(id: string) {
    return this.postsRepository.delete(id);
  }

  findNearby(latitude: number, longitude: number, radiusMiles = 25) {
    return this.postsRepository
      .createQueryBuilder('post')
      .where('post.status = :status', { status: 'open' })
      .orderBy('post.createdAt', 'DESC')
      .limit(50)
      .getMany();
  }
}
