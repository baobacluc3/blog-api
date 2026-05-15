import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { UserRole } from '../common/enums/user-role.enum';
import { makeSlug } from '../common/slug';
import { User } from '../users/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postsRepository: Repository<Post>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const category = createPostDto.categoryId ? await this.categoriesService.findOne(createPostDto.categoryId) : null;
    const post = this.postsRepository.create({
      ...createPostDto,
      slug: await this.createUniqueSlug(createPostDto.title),
      author,
      category,
    });

    return this.postsRepository.save(post);
  }

  async findAll(query: QueryPostsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.andWhere(
        new Brackets((where) => {
          where.where('post.title ILIKE :search', { search: `%${query.search}%` }).orWhere('post.content ILIKE :search', {
            search: `%${query.search}%`,
          });
        }),
      );
    }

    if (query.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    }

    if (query.published !== undefined) {
      qb.andWhere('post.published = :published', { published: query.published });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id }, relations: { comments: true } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { slug }, relations: { comments: true } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, user: User): Promise<Post> {
    const post = await this.findOne(id);
    this.ensureAuthorOrAdmin(post, user);

    if (updatePostDto.title && updatePostDto.title !== post.title) {
      post.title = updatePostDto.title;
      post.slug = await this.createUniqueSlug(updatePostDto.title, post.id);
    }

    if (updatePostDto.categoryId !== undefined) {
      post.category = updatePostDto.categoryId ? await this.categoriesService.findOne(updatePostDto.categoryId) : null;
    }

    Object.assign(post, {
      content: updatePostDto.content ?? post.content,
      excerpt: updatePostDto.excerpt ?? post.excerpt,
      coverImage: updatePostDto.coverImage ?? post.coverImage,
      published: updatePostDto.published ?? post.published,
    });

    return this.postsRepository.save(post);
  }

  async remove(id: number, user: User): Promise<void> {
    const post = await this.findOne(id);
    this.ensureAuthorOrAdmin(post, user);
    await this.postsRepository.remove(post);
  }

  private ensureAuthorOrAdmin(post: Post, user: User): void {
    if (user.role !== UserRole.Admin && post.author.id !== user.id) {
      throw new ForbiddenException('Only the author or an admin can modify this post');
    }
  }

  private async createUniqueSlug(title: string, ignoreId?: number): Promise<string> {
    const baseSlug = makeSlug(title);
    let slug = baseSlug;
    let suffix = 1;

    while (await this.slugExists(slug, ignoreId)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    return slug;
  }

  private async slugExists(slug: string, ignoreId?: number): Promise<boolean> {
    const post = await this.postsRepository.findOne({ where: { slug } });
    if (!post) {
      return false;
    }
    if (ignoreId && post.id === ignoreId) {
      return false;
    }
    return true;
  }
}
