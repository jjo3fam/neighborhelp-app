import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type SocialProvider = 'google' | 'facebook';

@Entity('social_identities')
@Unique(['provider', 'subject'])
export class SocialIdentity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  provider!: SocialProvider;

  @Column()
  subject!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
