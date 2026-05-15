import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { Comment } from '../comments/comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180 })
  title: string;

  @Column({ unique: true, length: 220 })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  excerpt?: string;

  @Column({ nullable: true })
  coverImage?: string;

  @Column({ default: false })
  published: boolean;

  @ManyToOne(() => User, (user) => user.posts, { eager: true, onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => Category, (category) => category.posts, { eager: true, onDelete: 'SET NULL', nullable: true })
  category: Category | null;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
