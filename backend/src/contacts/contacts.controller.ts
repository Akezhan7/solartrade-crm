import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @ApiOperation({ summary: 'Создание нового контакта' })
  @ApiResponse({ status: 201, description: 'Контакт успешно создан' })
  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @ApiOperation({ summary: 'Получение всех контактов' })
  @ApiResponse({ status: 200, description: 'Список контактов' })
  @Get()
  findAll() {
    return this.contactsService.findAll();
  }

  @ApiOperation({ summary: 'Получение контактов клиента' })
  @ApiResponse({ status: 200, description: 'Список контактов клиента' })
  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.contactsService.findByClient(clientId);
  }

  @ApiOperation({ summary: 'Получение контакта по ID' })
  @ApiResponse({ status: 200, description: 'Данные контакта' })
  @ApiResponse({ status: 404, description: 'Контакт не найден' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновление данных контакта' })
  @ApiResponse({ status: 200, description: 'Данные контакта обновлены' })
  @ApiResponse({ status: 404, description: 'Контакт не найден' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, updateContactDto);
  }

  @ApiOperation({ summary: 'Удаление контакта' })
  @ApiResponse({ status: 200, description: 'Контакт удален' })
  @ApiResponse({ status: 404, description: 'Контакт не найден' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
