import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
}
