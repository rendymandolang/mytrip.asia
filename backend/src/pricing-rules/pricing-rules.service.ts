import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingRulesService {
  constructor(private prisma: PrismaService) {}

  private include = {
    property: true,
    roomType: true,
  };

  async findAll(propertyId?: string, actor?: any) {
    const where: any = {};

    if (propertyId) {
      where.propertyId = this.toNumber(
        propertyId,
        'propertyId',
      );
    }

    if (actor?.role === 'OWNER') {
      where.property = {
        ownerId: Number(actor.sub),
      };
    }

    return this.prisma.pricingRule.findMany({
      where,
      include: this.include,
      orderBy: [
        {
          propertyId: 'asc',
        },
        {
          roomTypeId: 'asc',
        },
        {
          rentalTerm: 'asc',
        },
      ],
    });
  }

  async create(data: any, actor?: any) {
    const ruleData =
      await this.normalizePricingRuleData(data);

    await this.assertPropertyAccess(
      ruleData.propertyId,
      actor,
    );

    return this.prisma.pricingRule.create({
      data: ruleData,
      include: this.include,
    });
  }

  async update(
    id: number,
    data: any,
    actor?: any,
  ) {
    const existing = await this.findOne(id);

    await this.assertPropertyAccess(
      existing.propertyId,
      actor,
    );

    const ruleData =
      await this.normalizePricingRuleData(
        {
          ...existing,
          ...data,
        },
        true,
      );

    await this.assertPropertyAccess(
      ruleData.propertyId,
      actor,
    );

    return this.prisma.pricingRule.update({
      where: { id },
      data: ruleData,
      include: this.include,
    });
  }

  async remove(id: number, actor?: any) {
    const existing = await this.findOne(id);

    await this.assertPropertyAccess(
      existing.propertyId,
      actor,
    );

    return this.prisma.pricingRule.delete({
      where: { id },
    });
  }

  async calculateQuote(params: {
    propertyId: number;
    roomTypeId?: number | null;
    rentalTerm: string;
    checkIn: Date;
    checkOut: Date;
    fallbackBasePrice?: string | number | null;
  }) {
    const nights = this.daysBetween(
      params.checkIn,
      params.checkOut,
    );

    if (nights <= 0) {
      throw new BadRequestException(
        'Check-out must be after check-in',
      );
    }

    const roomTypeWhere = params.roomTypeId
      ? {
          OR: [
            {
              roomTypeId: params.roomTypeId,
            },
            {
              roomTypeId: null,
            },
          ],
        }
      : {
          roomTypeId: null,
        };

    const rule =
      await this.prisma.pricingRule.findFirst({
        where: {
          propertyId: params.propertyId,
          rentalTerm: params.rentalTerm as any,
          active: true,
          ...roomTypeWhere,
        },
        orderBy: {
          roomTypeId: 'desc',
        },
      });

    const basePrice = Number(
      rule?.basePrice ??
        params.fallbackBasePrice ??
        0,
    );

    if (basePrice <= 0) {
      throw new BadRequestException(
        'Pricing rule is not configured',
      );
    }

    if (rule?.minStay && nights < rule.minStay) {
      throw new BadRequestException(
        `Minimum stay is ${rule.minStay} night(s)`,
      );
    }

    if (rule?.maxStay && nights > rule.maxStay) {
      throw new BadRequestException(
        `Maximum stay is ${rule.maxStay} night(s)`,
      );
    }

    const units = this.billingUnits(
      params.rentalTerm,
      nights,
    );
    const subtotal = basePrice * units;
    const serviceFee = Number(rule?.serviceFee || 0);
    const cleaningFee = Number(rule?.cleaningFee || 0);
    const deposit = Number(rule?.deposit || 0);
    const totalAmount =
      subtotal + serviceFee + cleaningFee + deposit;

    return {
      rentalTerm: params.rentalTerm,
      nights,
      units,
      basePrice,
      subtotal,
      serviceFee,
      cleaningFee,
      deposit,
      totalAmount,
      ruleId: rule?.id || null,
    };
  }

  private async findOne(id: number) {
    const rule =
      await this.prisma.pricingRule.findUnique({
        where: { id },
      });

    if (!rule) {
      throw new NotFoundException(
        'Pricing rule not found',
      );
    }

    return rule;
  }

  private async normalizePricingRuleData(
    data: any,
    partial = false,
  ) {
    const ruleData: any = {};

    if (!partial || data.propertyId !== undefined) {
      ruleData.propertyId = this.toNumber(
        data.propertyId,
        'propertyId',
      );
    }

    if (data.roomTypeId !== undefined) {
      ruleData.roomTypeId =
        data.roomTypeId === null ||
        data.roomTypeId === ''
          ? null
          : this.toNumber(
              data.roomTypeId,
              'roomTypeId',
            );
    }

    if (!partial || data.rentalTerm !== undefined) {
      ruleData.rentalTerm =
        data.rentalTerm || 'DAILY';
    }

    if (!partial || data.basePrice !== undefined) {
      ruleData.basePrice =
        data.basePrice?.toString();
    }

    for (const field of [
      'serviceFee',
      'cleaningFee',
      'deposit',
    ]) {
      if (data[field] !== undefined) {
        ruleData[field] =
          data[field] === null ||
          data[field] === ''
            ? '0'
            : data[field].toString();
      }
    }

    for (const field of ['minStay', 'maxStay']) {
      if (data[field] !== undefined) {
        ruleData[field] =
          data[field] === null ||
          data[field] === ''
            ? null
            : this.toNumber(data[field], field);
      }
    }

    if (data.active !== undefined) {
      ruleData.active = this.toBoolean(data.active);
    }

    return ruleData;
  }

  private async assertPropertyAccess(
    propertyId: number,
    actor?: any,
  ) {
    if (!actor || actor.role !== 'OWNER') {
      return;
    }

    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerId: Number(actor.sub),
        },
      });

    if (!property) {
      throw new ForbiddenException(
        'Owner cannot manage this property',
      );
    }
  }

  private daysBetween(checkIn: Date, checkOut: Date) {
    const start = Date.UTC(
      checkIn.getUTCFullYear(),
      checkIn.getUTCMonth(),
      checkIn.getUTCDate(),
    );
    const end = Date.UTC(
      checkOut.getUTCFullYear(),
      checkOut.getUTCMonth(),
      checkOut.getUTCDate(),
    );

    return Math.round(
      (end - start) / (24 * 60 * 60 * 1000),
    );
  }

  private billingUnits(
    rentalTerm: string,
    nights: number,
  ) {
    if (rentalTerm === 'MONTHLY') {
      return Math.max(Math.ceil(nights / 30), 1);
    }

    if (rentalTerm === 'YEARLY') {
      return Math.max(Math.ceil(nights / 365), 1);
    }

    return nights;
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

  private toBoolean(value: any) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    return Boolean(value);
  }
}
