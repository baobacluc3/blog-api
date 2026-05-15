import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { makeSlug } from '../common/slug';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly categoriesRepository: Repository<Category>) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const slug = await this.createUniqueSlug(createCategoryDto.name);
    const category = this.categoriesRepository.create({ ...createCategoryDto, slug });
    return this.categoriesRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      category.name = updateCategoryDto.name;
      category.slug = await this.createUniqueSlug(updateCategoryDto.name, id);
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  private async createUniqueSlug(name: string, ignoreId?: number): Promise<string> {
    const baseSlug = makeSlug(name);
    let slug = baseSlug;
    let suffix = 1;

    while (await this.slugExists(slug, ignoreId)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    return slug;
  }

  private async slugExists(slug: string, ignoreId?: number): Promise<boolean> {
    const category = await this.categoriesRepository.findOne({ where: { slug } });
    if (!category) {
      return false;
    }
    if (ignoreId && category.id === ignoreId) {
      return false;
    }
    return true;
  }
}
