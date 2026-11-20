import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApplicationStatus, InterviewStatus } from '@recruitment/shared';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    // Real aggregations from PostgreSQL
    const [
      totalApplications,
      newApplications,
      underReview,
      shortlistedCandidates,
      rejectedCandidates,
      selectedCandidates,
      interviewsScheduled,
      interviewsCompleted,
      pendingFeedback,
      freshersCount,
      experiencedCount,
      allApps,
      educationBreakdown,
      jobsWithApps,
    ] = await Promise.all([
      this.prisma.jobApplication.count(),
      this.prisma.jobApplication.count({ where: { status: ApplicationStatus.NEW as any } }),
      this.prisma.jobApplication.count({ where: { status: ApplicationStatus.UNDER_REVIEW as any } }),
      this.prisma.jobApplication.count({ where: { status: ApplicationStatus.SHORTLISTED as any } }),
      this.prisma.jobApplication.count({ where: { status: ApplicationStatus.REJECTED as any } }),
      this.prisma.jobApplication.count({ where: { status: ApplicationStatus.SELECTED as any } }),
      this.prisma.interview.count({ where: { status: InterviewStatus.SCHEDULED as any } }),
      this.prisma.interview.count({ where: { status: InterviewStatus.COMPLETED as any } }),
      this.prisma.interview.count({
        where: {
          status: InterviewStatus.COMPLETED as any,
          feedbacks: { none: {} },
        },
      }),
      this.prisma.jobApplication.count({ where: { isFresher: true } }),
      this.prisma.jobApplication.count({ where: { isFresher: false } }),
      this.prisma.jobApplication.findMany({
        select: { createdAt: true, status: true },
      }),
      this.prisma.education.groupBy({
        by: ['qualificationType'],
        _count: { id: true },
      }),
      this.prisma.jobPosition.findMany({
        select: {
          title: true,
          _count: { select: { applications: true } },
        },
        orderBy: { applications: { _count: 'desc' } },
        take: 6,
      }),
    ]);

    // Calculate Real Monthly Trends from applications
    const monthCounts: Record<string, number> = {};
    for (const app of allApps) {
      const monthYear = app.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    }
    const monthlyTrends = Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count,
    }));

    // Status Distribution
    const statusCounts: Record<string, number> = {};
    for (const app of allApps) {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as ApplicationStatus,
      count,
    }));

    // Education Distribution
    const educationDistribution = educationBreakdown.map((e) => ({
      category: e.qualificationType as any,
      count: e._count.id,
    }));

    // Position Stats
    const positionStats = jobsWithApps.map((j) => ({
      position: j.title,
      count: j._count.applications,
    }));

    // Conversion rate: (Selected / Total Applications) * 100
    const conversionRatePercent =
      totalApplications > 0
        ? Number(((selectedCandidates / totalApplications) * 100).toFixed(1))
        : 0;

    return {
      totalApplications,
      newApplications,
      underReview,
      shortlistedCandidates,
      rejectedCandidates,
      selectedCandidates,
      interviewsScheduled,
      interviewsCompleted,
      pendingFeedback,
      monthlyTrends,
      statusDistribution,
      fresherVsExperienced: {
        freshers: freshersCount,
        experienced: experiencedCount,
      },
      educationDistribution,
      positionStats,
      conversionRatePercent,
    };
  }
}
