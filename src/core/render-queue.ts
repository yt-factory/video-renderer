import { logger } from '../utils/logger';

export interface RenderJob {
  id: string;
  projectId: string;
  type: 'main_video' | 'shorts' | 'thumbnail';
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class RenderQueue {
  private jobs: RenderJob[] = [];

  addJob(job: Omit<RenderJob, 'status'>): RenderJob {
    const fullJob: RenderJob = { ...job, status: 'queued' };
    this.jobs.push(fullJob);
    logger.info('Job queued', { jobId: job.id, type: job.type });
    return fullJob;
  }

  startJob(jobId: string): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = 'rendering';
      job.startedAt = new Date();
      logger.info('Job started', { jobId });
    }
  }

  completeJob(jobId: string): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = 'completed';
      job.completedAt = new Date();
      logger.info('Job completed', { jobId });
    }
  }

  failJob(jobId: string, error: string): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = new Date();
      logger.error('Job failed', { jobId, error });
    }
  }

  getStatus(): { total: number; queued: number; rendering: number; completed: number; failed: number } {
    return {
      total: this.jobs.length,
      queued: this.jobs.filter((j) => j.status === 'queued').length,
      rendering: this.jobs.filter((j) => j.status === 'rendering').length,
      completed: this.jobs.filter((j) => j.status === 'completed').length,
      failed: this.jobs.filter((j) => j.status === 'failed').length,
    };
  }
}
