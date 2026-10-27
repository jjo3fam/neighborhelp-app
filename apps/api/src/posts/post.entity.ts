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

  // Public, approximate location
  @Column({ type: 'float' })
  approximateLatitude!: number;

  @Column({ type: 'float' })
  approximateLongitude!: number;

  @Column({ nullable: true })
  approximateLocationName?: string;

  // Private exact location: select:false keeps it out of every default query.
  // It is revealed only through an accepted Match.
  @Column({ type: 'float', nullable: true, select: false })
  exactLatitude?: number | null;

  @Column({ type: 'float', nullable: true, select: false })
  exactLongitude?: number | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  exactLocationLabel?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
