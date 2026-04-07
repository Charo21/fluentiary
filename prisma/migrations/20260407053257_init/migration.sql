-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "keyPoints" TEXT NOT NULL DEFAULT '',
    "freeWrite" TEXT NOT NULL DEFAULT '',
    "refinedText" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Record_date_key" ON "Record"("date");

-- CreateIndex
CREATE INDEX "Record_date_idx" ON "Record"("date");
