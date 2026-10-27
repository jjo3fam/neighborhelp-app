import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  postId!: string;

  @Column()
  senderId!: string;

  @Column()
  receiverId!: string;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
