import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const { customerName, items } = createOrderDto;

    const pendingOrder = await this.prisma.order.findFirst({
      where: { customerName, status: OrderStatus.PENDING },
    });

    if (pendingOrder) {
      throw new ConflictException('El cliente ya tiene un pedido en estado PENDING.');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new NotFoundException(`El producto con ID ${item.productId} no existe.`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity },
        });
      }

      return tx.order.create({
        data: {
          customerName,
          items: JSON.parse(JSON.stringify(items)),
          status: OrderStatus.PENDING,
        },
      });
    });
  }

  async sendOrder(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Pedido con ID ${id} no encontrado.`);
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('Solo pedidos PENDING.');

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.SENT, verificationCode },
    });
  }

  async receiveOrder(id: number, verificationCode: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Pedido con ID ${id} no encontrado.`);
    if (order.status !== OrderStatus.SENT) throw new BadRequestException('El pedido debe estar en SENT.');
    if (order.verificationCode !== verificationCode) throw new BadRequestException('Código incorrecto.');

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.RECEIVED },
    });
  }

  async findAll() { return this.prisma.order.findMany(); }
  
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Pedido con ID ${id} no encontrado.`);
    return order;
  }
}