import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', select: false, nullable: true })
  passwordHash?: string | null;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  homeLocationName?: string;

  @Column({ type: 'int', default: 10 })
  locationRadiusBlocks!: number;

  @Column({ default: 'local' })
  authProvider!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
