-- CreateTable
CREATE TABLE "DayRecord" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bulletPoints" TEXT,

    CONSTRAINT "DayRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" TEXT NOT NULL,
    "dayRecordId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefineVersion" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "versionNum" INTEGER NOT NULL DEFAULT 1,
    "llmModel" TEXT,
    "promptTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefineVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DayRecord_userId_date_key" ON "DayRecord"("userId", "date");

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_dayRecordId_fkey" FOREIGN KEY ("dayRecordId") REFERENCES "DayRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefineVersion" ADD CONSTRAINT "RefineVersion_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "ContentBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefineVersion" ADD CONSTRAINT "RefineVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "RefineVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
