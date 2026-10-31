import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyOrderDto } from './dto/verify-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) { return this.ordersService.create(createOrderDto); }
  @Get()
  findAll() { return this.ordersService.findAll(); }
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.ordersService.findOne(id); }
  @Patch(':id/send')
  sendOrder(@Param('id', ParseIntPipe) id: number) { return this.ordersService.sendOrder(id); }
  @Patch(':id/receive')
  receiveOrder(@Param('id', ParseIntPipe) id: number, @Body() verifyOrderDto: VerifyOrderDto) {
    return this.ordersService.receiveOrder(id, verifyOrderDto.verificationCode);
  }
}
