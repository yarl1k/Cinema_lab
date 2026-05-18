-- AlterTable
ALTER TABLE "Movies" ADD COLUMN     "ageRestriction" VARCHAR(10),
ADD COLUMN     "cast" TEXT,
ADD COLUMN     "director" VARCHAR(100),
ADD COLUMN     "language" VARCHAR(50) DEFAULT 'українська',
ADD COLUMN     "originalTitle" VARCHAR(150),
ADD COLUMN     "studio" VARCHAR(150);
