const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toDateOnly(value) {
  const date = new Date(value);

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function getNightDates(checkIn, checkOut) {
  const dates = [];
  const cursor = toDateOnly(checkIn);
  const end = toDateOnly(checkOut);

  while (cursor < end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

async function refreshRoomTypeTotals() {
  const roomTypes = await prisma.roomType.findMany();

  for (const roomType of roomTypes) {
    const totalRooms = await prisma.room.count({
      where: {
        roomTypeId: roomType.id,
      },
    });

    await prisma.roomType.update({
      where: {
        id: roomType.id,
      },
      data: {
        totalRooms,
      },
    });
  }
}

async function backfillAllocations() {
  const bookings = await prisma.booking.findMany({
    where: {
      status: {
        not: 'CANCELLED',
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  let allocationCount = 0;

  for (const booking of bookings) {
    const dates = getNightDates(
      booking.checkIn,
      booking.checkOut,
    );

    if (dates.length === 0) {
      continue;
    }

    const result =
      await prisma.roomAllocation.createMany({
        data: dates.map((date) => ({
          bookingId: booking.id,
          roomId: booking.roomId,
          date,
        })),
        skipDuplicates: true,
      });

    allocationCount += result.count;
  }

  return allocationCount;
}

async function refreshDailyAvailability() {
  const roomTypes = await prisma.roomType.findMany({
    include: {
      rooms: {
        select: {
          id: true,
        },
      },
    },
  });

  if (roomTypes.length === 0) {
    return 0;
  }

  const firstAllocation =
    await prisma.roomAllocation.findFirst({
      orderBy: {
        date: 'asc',
      },
    });

  const lastAllocation =
    await prisma.roomAllocation.findFirst({
      orderBy: {
        date: 'desc',
      },
    });

  const firstBlock =
    await prisma.availabilityBlock.findFirst({
      orderBy: {
        startDate: 'asc',
      },
    });

  const lastBlock =
    await prisma.availabilityBlock.findFirst({
      orderBy: {
        endDate: 'desc',
      },
    });

  const starts = [
    firstAllocation?.date,
    firstBlock?.startDate,
  ].filter(Boolean);

  const ends = [
    lastAllocation?.date,
    lastBlock?.endDate,
  ].filter(Boolean);

  if (starts.length === 0 || ends.length === 0) {
    return 0;
  }

  const startDate = new Date(
    Math.min(
      ...starts.map((date) =>
        toDateOnly(date).getTime(),
      ),
    ),
  );

  const endDate = new Date(
    Math.max(
      ...ends.map((date) =>
        toDateOnly(date).getTime(),
      ),
    ),
  );
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  const dates = [];
  const cursor = new Date(startDate);

  while (cursor < endDate) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  let dailyCount = 0;

  for (const roomType of roomTypes) {
    const physicalRooms =
      roomType.totalRooms || roomType.rooms.length;

    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);

      const allotment =
        await prisma.allotment.findUnique({
          where: {
            date_roomTypeId: {
              date,
              roomTypeId: roomType.id,
            },
          },
        });

      const totalRooms = allotment
        ? allotment.closed
          ? 0
          : allotment.totalRooms
        : physicalRooms;

      const bookedRooms =
        await prisma.roomAllocation.count({
          where: {
            date,
            room: {
              roomTypeId: roomType.id,
            },
          },
        });

      const blockedRooms =
        await prisma.availabilityBlock.count({
          where: {
            room: {
              roomTypeId: roomType.id,
            },
            startDate: {
              lt: nextDate,
            },
            endDate: {
              gt: date,
            },
          },
        });

      const availableRooms = Math.max(
        totalRooms - bookedRooms - blockedRooms,
        0,
      );

      await prisma.dailyAvailability.upsert({
        where: {
          date_roomTypeId: {
            date,
            roomTypeId: roomType.id,
          },
        },
        create: {
          date,
          roomTypeId: roomType.id,
          totalRooms,
          bookedRooms,
          blockedRooms,
          availableRooms,
        },
        update: {
          totalRooms,
          bookedRooms,
          blockedRooms,
          availableRooms,
        },
      });

      dailyCount += 1;
    }
  }

  return dailyCount;
}

async function main() {
  await refreshRoomTypeTotals();

  const allocationCount =
    await backfillAllocations();

  const dailyCount =
    await refreshDailyAvailability();

  console.log(
    `Backfilled ${allocationCount} room allocations`,
  );
  console.log(
    `Refreshed ${dailyCount} daily availability rows`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
