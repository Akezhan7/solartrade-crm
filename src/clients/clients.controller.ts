import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @ApiOperation({ summary: 'Создание нового клиента' })
  @ApiResponse({ status: 201, description: 'Клиент успешно создан' })
  @Post()
  create(@Body() createClientDto: CreateClientDto, @Req() req) {
    return this.clientsService.create(createClientDto, req.user.id);
  }
  @ApiOperation({ summary: 'Получение списка всех клиентов' })
  @ApiResponse({ status: 200, description: 'Список клиентов' })
  @Get()
  findAll(@Req() req) {
    return this.clientsService.findAll(req.user);
  }
  @ApiOperation({ summary: 'Получение клиента по ID' })
  @ApiResponse({ status: 200, description: 'Данные клиента' })
  @ApiResponse({ status: 404, description: 'Клиент не найден' })
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.clientsService.findOne(id, req.user);
  }
  @ApiOperation({ summary: 'Обновление данных клиента' })
  @ApiResponse({ status: 200, description: 'Данные клиента обновлены' })
  @ApiResponse({ status: 404, description: 'Клиент не найден' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: any, @Req() req) {
    return this.clientsService.update(id, updateClientDto, req.user);
  }
  @ApiOperation({ summary: 'Удаление клиента' })
  @ApiResponse({ status: 200, description: 'Клиент удален' })
  @ApiResponse({ status: 404, description: 'Клиент не найден' })
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.clientsService.remove(id, req.user);
  }

  @ApiOperation({ summary: 'Добавление взаимодействия с клиентом' })
  @ApiResponse({ status: 201, description: 'Взаимодействие добавлено' })
  @ApiResponse({ status: 404, description: 'Клиент не найден' })  @Post(':id/interactions')
  addInteraction(@Param('id') id: string, @Body() data: any, @Req() req) {
    return this.clientsService.addInteraction(id, data, req.user.id, req.user);
  }
  @ApiOperation({ summary: 'Получение истории взаимодействий с клиентом' })
  @ApiResponse({ status: 200, description: 'История взаимодействий' })
  @ApiResponse({ status: 404, description: 'Клиент не найден' })  
  @Get(':id/interactions')
  getInteractions(@Param('id') id: string, @Req() req) {
    return this.clientsService.getInteractions(id, req.user);
  }
  @ApiOperation({ summary: 'Получение контактов клиента' })
  @ApiResponse({ status: 200, description: 'Список контактов клиента' })
  @ApiResponse({ status: 404, description: 'Клиент не найден' })
  @Get(':id/contacts')
  getContacts(@Param('id') id: string, @Req() req) {
    return this.clientsService.getContacts(id, req.user);
  }
}