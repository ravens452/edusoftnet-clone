-- CreateTable
CREATE TABLE "GradingWindow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "opensAt" DATETIME NOT NULL,
    "closesAt" DATETIME NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "level" TEXT,
    "gradeId" TEXT,
    "sectionId" TEXT,
    "courseId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'AUTO',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GradingWindow_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GradingWindow_periodId_idx" ON "GradingWindow"("periodId");

-- CreateIndex
CREATE INDEX "GradingWindow_opensAt_closesAt_idx" ON "GradingWindow"("opensAt", "closesAt");
