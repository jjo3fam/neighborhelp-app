import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('ratings')
@Unique('UQ_rating_match_rater', ['matchId', 'raterId'])
@Index('IDX_rating_rated_user', ['ratedUserId'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  matchId!: string;

  @Column()
  postId!: string;

  @Column()
  raterId!: string;

  @Column()
  ratedUserId!: string;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  feedback?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
