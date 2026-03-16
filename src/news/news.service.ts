import { Injectable } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  async create(createNewsDto: CreateNewsDto) {
    return 'This action adds a new news';
  }

  async findAll() {
    return `This action returns all news`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} news`;
  }

  async update(id: number, updateNewsDto: UpdateNewsDto) {
    return `This action updates a #${id} news`;
  }

  async remove(id: number) {
    return `This action removes a #${id} news`;
  }
}
