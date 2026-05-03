-- CreateTable
CREATE TABLE "CompetencyAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseAssignmentId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "m1" TEXT,
    "m2" TEXT,
    "m3" TEXT,
    "letterGrade" TEXT,
    "observation" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompetencyAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetencyAssessment_courseAssignmentId_fkey" FOREIGN KEY ("courseAssignmentId") REFERENCES "CourseAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetencyAssessment_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetencyAssessment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CompetencyAssessment_courseAssignmentId_periodId_idx" ON "CompetencyAssessment"("courseAssignmentId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyAssessment_studentId_competencyId_periodId_key" ON "CompetencyAssessment"("studentId", "competencyId", "periodId");
