import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Created only when a poster accepts an offer. Holds the revealed exact location. */
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

  @Column({ type: 'float', nullable: true })
  exactLatitude?: number | null;

  @Column({ type: 'float', nullable: true })
  exactLongitude?: number | null;

  @Column({ type: 'varchar', nullable: true })
  exactLocationLabel?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
