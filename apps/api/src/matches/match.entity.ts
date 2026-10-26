import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  postId: string;

  @Column()
  posterUserId: string;

  @Column()
  workerUserId: string;

  @Column({ default: 'accepted' })
  status: 'accepted' | 'cancelled' | 'completed';

  @Column({ default: false })
  exactLocationRevealed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
