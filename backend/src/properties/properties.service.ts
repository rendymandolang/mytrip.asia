import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.property.findMany();
  }

  async findOne(id: number) {
    return this.prisma.property.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.property.update({
      where: { id },
      data,
    });
  }

  async create(data: any) {
    return this.prisma.property.create({
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.property.delete({
      where: { id },
    });
  }
}
