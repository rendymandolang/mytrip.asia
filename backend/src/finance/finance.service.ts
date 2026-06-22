import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  private invoiceInclude = {
    booking: {
      include: {
        guest: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        room: {
          include: {
            property: true,
            roomType: true,
          },
        },
      },
    },
    payments: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
  };

  async summary() {
    const invoices =
      await this.prisma.invoice.findMany({
        select: {
          status: true,
          totalAmount: true,
          paidAmount: true,
          balanceDue: true,
        },
      });

    return invoices.reduce(
      (summary, invoice) => {
        summary.totalInvoices += 1;
        summary.totalAmount += Number(
          invoice.totalAmount || 0,
        );
        summary.paidAmount += Number(
          invoice.paidAmount || 0,
        );
        summary.balanceDue += Number(
          invoice.balanceDue || 0,
        );
        summary.byStatus[invoice.status] =
          (summary.byStatus[invoice.status] || 0) +
          1;

        return summary;
      },
      {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        balanceDue: 0,
        byStatus: {} as Record<string, number>,
      },
    );
  }

  async findInvoices(filters: any = {}) {
    const where: any = {};

    if (filters.status && filters.status !== 'ALL') {
      where.status = String(filters.status).toUpperCase();
    }

    if (filters.bookingId) {
      where.bookingId = this.toNumber(
        filters.bookingId,
        'bookingId',
      );
    }

    return this.prisma.invoice.findMany({
      where,
      include: this.invoiceInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createInvoiceForBooking(bookingId: number) {
    const booking =
      await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          invoice: true,
          room: {
            include: {
              property: true,
              roomType: true,
            },
          },
        },
      });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const pricing =
      (booking.pricingSnapshot || {}) as any;
    const totalAmount = this.money(
      pricing.totalAmount ?? booking.totalAmount,
    );
    const subtotal = this.money(
      pricing.subtotal ?? totalAmount,
    );
    const serviceFee = this.money(
      pricing.serviceFee ?? 0,
    );
    const cleaningFee = this.money(
      pricing.cleaningFee ?? 0,
    );
    const deposit = this.money(pricing.deposit ?? 0);
    const paidAmount = booking.invoice
      ? Number(booking.invoice.paidAmount || 0)
      : 0;
    const balanceDue = Math.max(
      totalAmount - paidAmount,
      0,
    );

    const invoice =
      await this.prisma.invoice.upsert({
        where: {
          bookingId,
        },
        create: {
          bookingId,
          invoiceNumber:
            this.invoiceNumber(bookingId),
          subtotal: subtotal.toString(),
          serviceFee: serviceFee.toString(),
          cleaningFee: cleaningFee.toString(),
          deposit: deposit.toString(),
          totalAmount: totalAmount.toString(),
          paidAmount: paidAmount.toString(),
          balanceDue: balanceDue.toString(),
          status:
            balanceDue <= 0 ? 'PAID' : 'ISSUED',
          dueDate: booking.checkIn,
          paidAt:
            balanceDue <= 0 ? new Date() : null,
        },
        update: {
          subtotal: subtotal.toString(),
          serviceFee: serviceFee.toString(),
          cleaningFee: cleaningFee.toString(),
          deposit: deposit.toString(),
          totalAmount: totalAmount.toString(),
          balanceDue: balanceDue.toString(),
          status:
            balanceDue <= 0
              ? 'PAID'
              : paidAmount > 0
                ? 'PARTIAL'
                : 'ISSUED',
          paidAt:
            balanceDue <= 0 ? new Date() : null,
        },
        include: this.invoiceInclude,
      });

    return invoice;
  }

  async recordPayment(invoiceId: number, data: any) {
    const invoice =
      await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Invoice not found',
      );
    }

    if (invoice.status === 'VOID') {
      throw new BadRequestException(
        'Cannot record payment for void invoice',
      );
    }

    const amount = this.money(data.amount);

    if (amount <= 0) {
      throw new BadRequestException(
        'Payment amount must be greater than zero',
      );
    }

    await this.prisma.payment.create({
      data: {
        invoiceId,
        bookingId: invoice.bookingId,
        amount: amount.toString(),
        method: data.method || 'OTHER',
        status: data.status || 'PAID',
        reference:
          String(data.reference || '').trim() ||
          null,
        notes:
          String(data.notes || '').trim() || null,
        paidAt: data.paidAt
          ? new Date(data.paidAt)
          : new Date(),
      },
    });

    return this.reconcileInvoice(invoiceId);
  }

  async voidInvoice(
    invoiceId: number,
    reason?: string,
  ) {
    const invoice =
      await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Invoice not found',
      );
    }

    await this.prisma.payment.create({
      data: {
        invoiceId,
        bookingId: invoice.bookingId,
        amount: '0',
        method: 'OTHER',
        status: 'FAILED',
        notes:
          String(reason || '').trim() ||
          'Invoice voided',
      },
    });

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'VOID',
        balanceDue: '0',
      },
      include: this.invoiceInclude,
    });
  }

  private async reconcileInvoice(invoiceId: number) {
    const invoice =
      await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: true,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Invoice not found',
      );
    }

    const paidAmount = invoice.payments
      .filter((payment) =>
        ['PAID', 'PARTIAL'].includes(
          payment.status,
        ),
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.amount || 0),
        0,
      );
    const totalAmount = Number(
      invoice.totalAmount || 0,
    );
    const balanceDue = Math.max(
      totalAmount - paidAmount,
      0,
    );
    const status =
      balanceDue <= 0
        ? 'PAID'
        : paidAmount > 0
          ? 'PARTIAL'
          : 'ISSUED';

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: paidAmount.toString(),
        balanceDue: balanceDue.toString(),
        status,
        paidAt:
          status === 'PAID' ? new Date() : null,
      },
      include: this.invoiceInclude,
    });
  }

  private invoiceNumber(bookingId: number) {
    const now = new Date();
    const dateKey = now
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    return `INV-${dateKey}-${String(bookingId).padStart(5, '0')}`;
  }

  private money(value: any) {
    const numberValue = Number(value || 0);

    if (Number.isNaN(numberValue)) {
      throw new BadRequestException(
        'Invalid money amount',
      );
    }

    return Math.round(numberValue * 100) / 100;
  }

  private toNumber(value: any, field: string) {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      throw new BadRequestException(
        `Invalid ${field}`,
      );
    }

    return numberValue;
  }
}
