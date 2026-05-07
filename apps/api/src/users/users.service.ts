import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '@postforge/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, name: string): Promise<ApiResponse<any>> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { name },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    return { success: true, data: user };
  }
}
