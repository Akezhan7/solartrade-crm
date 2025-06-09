import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    // Проверяем, существует ли клиент
    const client = await this.prisma.client.findUnique({
      where: { id: createContactDto.clientId }
    });

    if (!client) {
      throw new NotFoundException(`Клиент с ID ${createContactDto.clientId} не найден`);
    }
      return this.prisma.contact.create({
      data: {
        firstName: createContactDto.firstName,
        lastName: createContactDto.lastName,
        phone: createContactDto.phone,
        email: createContactDto.email,
        birthDate: createContactDto.birthDate ? new Date(createContactDto.birthDate) : null,
        position: createContactDto.position,
        notes: createContactDto.notes,
        clientId: createContactDto.clientId
      }
    });
  }
  async findAll() {
    return this.prisma.contact.findMany();
  }

  async findByClient(clientId: string) {
    // Проверяем, существует ли клиент
    const client = await this.prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      throw new NotFoundException(`Клиент с ID ${clientId} не найден`);
    }
      return this.prisma.contact.findMany({
      where: { clientId }
    });
  }  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      throw new NotFoundException(`Контакт с ID ${id} не найден`);
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto) {
    // Проверяем существование контакта
    await this.findOne(id);

    // Если указан clientId, проверяем его существование
    if (updateContactDto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: updateContactDto.clientId }
      });

      if (!client) {
        throw new NotFoundException(`Клиент с ID ${updateContactDto.clientId} не найден`);
      }    }
    
    return this.prisma.contact.update({
      where: { id },
      data: {
        firstName: updateContactDto.firstName,
        lastName: updateContactDto.lastName,
        phone: updateContactDto.phone,
        email: updateContactDto.email,
        birthDate: updateContactDto.birthDate ? new Date(updateContactDto.birthDate) : undefined,
        position: updateContactDto.position,
        notes: updateContactDto.notes,
        clientId: updateContactDto.clientId
      }
    });
  }
  async remove(id: string) {
    // Проверяем существование контакта
    await this.findOne(id);    return this.prisma.contact.delete({
      where: { id }
    });
  }
}
