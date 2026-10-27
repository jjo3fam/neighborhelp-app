import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  postId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'decimal', nullable: true })
  offerAmount?: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'accepted' | 'rejected';

  @CreateDateColumn()
  createdAt!: Date;
}
