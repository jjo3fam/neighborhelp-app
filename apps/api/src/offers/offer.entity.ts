import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  postId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ default: 'pending' })
  status!: OfferStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
