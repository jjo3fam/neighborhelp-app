import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: 'local' })
  authProvider: string;

  @CreateDateColumn()
  createdAt: Date;
}
