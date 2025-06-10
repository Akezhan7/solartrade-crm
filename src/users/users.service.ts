import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(`Пользователь с email ${createUserDto.email} уже существует`);
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Создаем нового пользователя (по умолчанию с ролью SALES, если не указана другая роль)
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        role: createUserDto.role || UserRole.SALES,
        isActive: true,
      },
    });
  }
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Проверяем, существует ли пользователь
    await this.findOne(id);

    // Если меняем email, проверяем, не занят ли он
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`Пользователь с email ${updateUserDto.email} уже существует`);
      }
    }

    // Если указан пароль, хешируем его
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }  async remove(id: string): Promise<{ success: boolean; message: string; type: string }> {
    // Проверяем, существует ли пользователь
    const user = await this.findOne(id);

    // Проверяем, есть ли связанные записи
    const tasksAssigned = await this.prisma.task.count({
      where: { assigneeId: id },
    });

    const tasksCreated = await this.prisma.task.count({
      where: { createdById: id },
    });

    const dealsManaged = await this.prisma.deal.count({
      where: { managerId: id },
    });

    const clientsManaged = await this.prisma.client.count({
      where: { managerId: id },
    });

    // Если есть связанные записи, используем soft delete
    if (tasksAssigned > 0 || tasksCreated > 0 || dealsManaged > 0 || clientsManaged > 0) {
      await this.prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`, // Чтобы освободить email для нового пользователя
        },
      });

      return {
        success: true,
        message: 'Пользователь деактивирован (есть связанные записи)',
        type: 'deactivated'
      };
    } else {
      // Если нет связанных записей, можем полностью удалить
      await this.prisma.user.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Пользователь полностью удален',
        type: 'deleted'
      };
    }
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}