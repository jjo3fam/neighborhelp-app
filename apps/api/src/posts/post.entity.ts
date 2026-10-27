import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type PostStatus = 'open' | 'matched' | 'closed';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ default: 'open' })
  status!: PostStatus;

  // Public, approximate location only.
  @Column({ type: 'float' })
  approximateLatitude!: number;

  @Column({ type: 'float' })
  approximateLongitude!: number;

  @Column({ nullable: true })
  approximateLocationName?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
