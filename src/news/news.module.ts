import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { PublicNewsController } from './controllers/public.news.controller';
import { AdminNewsController } from './controllers/admin.news.controller';

@Module({
  controllers: [PublicNewsController, AdminNewsController],
  providers: [NewsService],
})
export class NewsModule {}
