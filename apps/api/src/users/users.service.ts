import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }

  /** Includes passwordHash (needed for login only). */
  findByEmail(email: string) {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async updateAvatar(id: string, avatarUrl: string) {
    const user = await this.findById(id);
    if (!user) return null;

    const previousAvatarUrl = user.avatarUrl;
    user.avatarUrl = avatarUrl;
    const updated = await this.repo.save(user);

    if (previousAvatarUrl?.startsWith('/uploads/avatars/')) {
      const previousFile = join(process.cwd(), 'uploads', 'avatars', basename(previousAvatarUrl));
      await unlink(previousFile).catch(() => undefined);
    }

    return updated;
  }
}
