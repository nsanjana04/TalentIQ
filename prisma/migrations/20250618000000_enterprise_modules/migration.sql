-- Performance & Succession
CREATE TYPE "PerformanceRating" AS ENUM ('EXCEPTIONAL', 'EXCEEDS', 'MEETS', 'DEVELOPING', 'UNSATISFACTORY');
CREATE TYPE "ManagerRecommendation" AS ENUM ('STRONG', 'RECOMMENDED', 'NEUTRAL', 'NOT_READY');
CREATE TYPE "SuccessionReadiness" AS ENUM ('READY_NOW', 'READY_6_MONTHS', 'READY_12_MONTHS', 'DEVELOPING');
CREATE TYPE "TalentOpportunityType" AS ENUM ('PROMOTION', 'LATERAL', 'CROSS_FUNCTIONAL', 'PROJECT');
CREATE TYPE "MobilityApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "ForecastModelType" AS ENUM ('XGBOOST', 'LIGHTGBM', 'RANDOM_FOREST');
CREATE TYPE "ForecastCategory" AS ENUM ('ATTRITION', 'HIRING', 'LEADERSHIP_GAP', 'CERTIFICATION_EXPIRATION', 'SKILL_DEMAND', 'WORKFORCE_GROWTH');

CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "rating" "PerformanceRating" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "manager_recommendation" "ManagerRecommendation" NOT NULL,
    "promotion_target" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "critical_roles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "job_role_id" TEXT,
    "department_id" TEXT,
    "holder_id" TEXT,
    "is_critical" BOOLEAN NOT NULL DEFAULT true,
    "retirement_risk_score" INTEGER NOT NULL DEFAULT 0,
    "attrition_risk_score" INTEGER NOT NULL DEFAULT 0,
    "bench_strength" INTEGER NOT NULL DEFAULT 0,
    "coverage_score" INTEGER NOT NULL DEFAULT 0,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "critical_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "succession_successors" (
    "id" TEXT NOT NULL,
    "critical_role_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "readiness" "SuccessionReadiness" NOT NULL,
    "readiness_score" INTEGER NOT NULL,
    "skill_gap_summary" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "succession_successors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_opportunities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "TalentOpportunityType" NOT NULL,
    "department_id" TEXT,
    "job_role_id" TEXT,
    "description" TEXT,
    "required_skills" JSONB,
    "learning_needed" TEXT,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "posted_by_id" TEXT NOT NULL,
    "closes_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "talent_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mobility_applications" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "match_score" INTEGER NOT NULL,
    "readiness_score" INTEGER NOT NULL,
    "status" "MobilityApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mobility_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_forecasts" (
    "id" TEXT NOT NULL,
    "category" "ForecastCategory" NOT NULL,
    "model_type" "ForecastModelType" NOT NULL,
    "department_id" TEXT,
    "skill_id" TEXT,
    "horizon_months" INTEGER NOT NULL,
    "predicted_value" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "drivers" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workforce_forecasts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "succession_successors_critical_role_id_candidate_id_key" ON "succession_successors"("critical_role_id", "candidate_id");
CREATE UNIQUE INDEX "mobility_applications_opportunity_id_applicant_id_key" ON "mobility_applications"("opportunity_id", "applicant_id");

CREATE INDEX "performance_reviews_user_id_idx" ON "performance_reviews"("user_id");
CREATE INDEX "performance_reviews_reviewer_id_idx" ON "performance_reviews"("reviewer_id");
CREATE INDEX "performance_reviews_period_end_idx" ON "performance_reviews"("period_end");
CREATE INDEX "performance_reviews_deleted_at_idx" ON "performance_reviews"("deleted_at");

CREATE INDEX "critical_roles_job_role_id_idx" ON "critical_roles"("job_role_id");
CREATE INDEX "critical_roles_department_id_idx" ON "critical_roles"("department_id");
CREATE INDEX "critical_roles_holder_id_idx" ON "critical_roles"("holder_id");
CREATE INDEX "critical_roles_deleted_at_idx" ON "critical_roles"("deleted_at");

CREATE INDEX "succession_successors_critical_role_id_idx" ON "succession_successors"("critical_role_id");
CREATE INDEX "succession_successors_candidate_id_idx" ON "succession_successors"("candidate_id");
CREATE INDEX "succession_successors_readiness_idx" ON "succession_successors"("readiness");
CREATE INDEX "succession_successors_deleted_at_idx" ON "succession_successors"("deleted_at");

CREATE INDEX "talent_opportunities_department_id_idx" ON "talent_opportunities"("department_id");
CREATE INDEX "talent_opportunities_job_role_id_idx" ON "talent_opportunities"("job_role_id");
CREATE INDEX "talent_opportunities_is_open_idx" ON "talent_opportunities"("is_open");
CREATE INDEX "talent_opportunities_posted_by_id_idx" ON "talent_opportunities"("posted_by_id");
CREATE INDEX "talent_opportunities_deleted_at_idx" ON "talent_opportunities"("deleted_at");

CREATE INDEX "mobility_applications_opportunity_id_idx" ON "mobility_applications"("opportunity_id");
CREATE INDEX "mobility_applications_applicant_id_idx" ON "mobility_applications"("applicant_id");
CREATE INDEX "mobility_applications_status_idx" ON "mobility_applications"("status");
CREATE INDEX "mobility_applications_deleted_at_idx" ON "mobility_applications"("deleted_at");

CREATE INDEX "workforce_forecasts_category_idx" ON "workforce_forecasts"("category");
CREATE INDEX "workforce_forecasts_model_type_idx" ON "workforce_forecasts"("model_type");
CREATE INDEX "workforce_forecasts_department_id_idx" ON "workforce_forecasts"("department_id");
CREATE INDEX "workforce_forecasts_skill_id_idx" ON "workforce_forecasts"("skill_id");
CREATE INDEX "workforce_forecasts_generated_at_idx" ON "workforce_forecasts"("generated_at");
CREATE INDEX "workforce_forecasts_deleted_at_idx" ON "workforce_forecasts"("deleted_at");

ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_holder_id_fkey" FOREIGN KEY ("holder_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "succession_successors" ADD CONSTRAINT "succession_successors_critical_role_id_fkey" FOREIGN KEY ("critical_role_id") REFERENCES "critical_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "succession_successors" ADD CONSTRAINT "succession_successors_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "talent_opportunities" ADD CONSTRAINT "talent_opportunities_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "talent_opportunities" ADD CONSTRAINT "talent_opportunities_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "talent_opportunities" ADD CONSTRAINT "talent_opportunities_posted_by_id_fkey" FOREIGN KEY ("posted_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mobility_applications" ADD CONSTRAINT "mobility_applications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "talent_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mobility_applications" ADD CONSTRAINT "mobility_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workforce_forecasts" ADD CONSTRAINT "workforce_forecasts_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "workforce_forecasts" ADD CONSTRAINT "workforce_forecasts_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
