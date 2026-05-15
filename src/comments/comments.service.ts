import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { PostsService } from '../posts/posts.service';
import { User } from '../users/user.entity';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly commentsRepository: Repository<Comment>,
    private readonly postsService: PostsService,
  ) {}

  async findByPost(postId: number): Promise<Comment[]> {
    await this.postsService.findOne(postId);
    return this.commentsRepository.find({
      where: { post: { id: postId } },
      order: { createdAt: 'ASC' },
    });
  }

  async create(postId: number, createCommentDto: CreateCommentDto, author: User): Promise<Comment> {
    const post = await this.postsService.findOne(postId);
    const comment = this.commentsRepository.create({ ...createCommentDto, post, author });
    return this.commentsRepository.save(comment);
  }

  async remove(id: number, user: User): Promise<void> {
    const comment = await this.commentsRepository.findOne({ where: { id }, relations: { author: true } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (user.role !== UserRole.Admin && comment.author.id !== user.id) {
      throw new ForbiddenException('Only the comment author or an admin can delete this comment');
    }

    await this.commentsRepository.remove(comment);
  }
}
