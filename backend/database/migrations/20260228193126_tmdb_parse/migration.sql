-- CreateTable
CREATE TABLE "EventLogs" (
    "id" SERIAL NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(100),
    "entityId" INTEGER,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "EventLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Halls" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "rows" INTEGER NOT NULL,
    "seatsPerRow" INTEGER NOT NULL,

    CONSTRAINT "Halls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movies" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "rating" DOUBLE PRECISION,
    "releaseDate" DATE,
    "endDate" DATE,
    "genres" TEXT,
    "posterUrl" VARCHAR(255),
    "backgroundUrl" VARCHAR(255),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seats" (
    "id" SERIAL NOT NULL,
    "hallId" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "seatNumber" INTEGER NOT NULL,

    CONSTRAINT "Seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "hallId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tickets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "hallId" INTEGER NOT NULL,
    "seatId" INTEGER NOT NULL,
    "status" VARCHAR(10),
    "reservedUntil" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "role" VARCHAR(20) DEFAULT 'user',
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "passwordHash" VARCHAR(100) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Movies_tmdbId_key" ON "Movies"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- AddForeignKey
ALTER TABLE "EventLogs" ADD CONSTRAINT "EventLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Seats" ADD CONSTRAINT "Seats_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Halls"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Halls"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Halls"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
