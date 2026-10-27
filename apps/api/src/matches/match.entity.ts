import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  postId!: string;

  @Column()
  offerId!: string;

  @Column()
  posterId!: string;

  @Column()
  workerId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
