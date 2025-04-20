import { Request, Response } from 'express';
import { getPerformanceMetrics } from '../lib/plantDisease';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const metrics = getPerformanceMetrics();
    res.json({
      status: 'healthy', 
      uptime: process.uptime(),
      metrics: {
        avgInferenceTime: metrics.avgInferenceTime,
        memoryUsage: metrics.peakMemoryUsage,
        modelStatus: metrics.loadTime > 0 ? 'loaded' : 'loading'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
};
