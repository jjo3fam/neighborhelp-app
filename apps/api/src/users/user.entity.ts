import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ nullable: true })
  displayName?: string;

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
