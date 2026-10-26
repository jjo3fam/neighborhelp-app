import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  categoryId: string;

  @Column({ default: 'need_help' })
  postType: 'need_help' | 'available_for_work';

  @Column({ default: 'fixed' })
  priceType: 'fixed' | 'open_to_offers' | 'accept_offers';

  @Column({ type: 'decimal', nullable: true })
  priceAmount?: number;

  @Column({ type: 'double precision' })
  approximateLatitude: number;

  @Column({ type: 'double precision' })
  approximateLongitude: number;

  @Column({ nullable: true })
  approximateLocationName?: string;

  @Column({ default: 25 })
  radiusMiles: number;

  @Column()
  userId: string;

  @Column({ default: 'open' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
