import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { ExportService } from '../services/ExportService';
import { ApiResponse } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class DashboardController {
  private dashboardService: DashboardService;
  private exportService: ExportService;

  constructor() {
    this.dashboardService = new DashboardService();
    this.exportService = new ExportService();
  }

  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'User not authenticated'
          }
        } as ApiResponse);
        return;
      }

      const summary = await this.dashboardService.getDashboardSummary(userId);

      res.json({
        success: true,
        data: summary
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get dashboard summary'
        }
      } as ApiResponse);
    }
  }

  async getTransactionReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'User not authenticated'
          }
        } as ApiResponse);
        return;
      }

      const {
        wallet_id,
        category_id,
        type,
        start_date,
        end_date,
        page = '1',
        limit = '10'
      } = req.query;

      const report = await this.dashboardService.getTransactionReport(userId, {
        wallet_id: wallet_id as string,
        category_id: category_id as string,
        type: type as 'Income' | 'Expense',
        start_date: start_date as string,
        end_date: end_date as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: report
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting transaction report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get transaction report'
        }
      } as ApiResponse);
    }
  }

  async getCategoryBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'User not authenticated'
          }
        } as ApiResponse);
        return;
      }

      const {
        wallet_id,
        type,
        start_date,
        end_date
      } = req.query;

      const breakdown = await this.dashboardService.getCategoryBreakdown(userId, {
        wallet_id: wallet_id as string,
        type: type as 'Income' | 'Expense',
        start_date: start_date as string,
        end_date: end_date as string
      });

      res.json({
        success: true,
        data: breakdown
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting category breakdown:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get category breakdown'
        }
      } as ApiResponse);
    }
  }

  async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'User not authenticated'
          }
        } as ApiResponse);
        return;
      }

      const {
        wallet_id,
        period = 'monthly',
        months = '12'
      } = req.query;

      const trends = await this.dashboardService.getTrends(userId, {
        wallet_id: wallet_id as string,
        period: period as 'monthly' | 'weekly',
        months: parseInt(months as string)
      });

      res.json({
        success: true,
        data: trends
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting trends:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get trends'
        }
      } as ApiResponse);
    }
  }

  async exportTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'User not authenticated'
          }
        } as ApiResponse);
        return;
      }

      const {
        format = 'csv',
        wallet_id,
        category_id,
        type,
        start_date,
        end_date,
        filename
      } = req.body;

      if (!['csv', 'pdf'].includes(format)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Format must be either csv or pdf'
          }
        } as ApiResponse);
        return;
      }

      // Get transaction data
      const report = await this.dashboardService.getTransactionReport(userId, {
        wallet_id: wallet_id as string,
        category_id: category_id as string,
        type: type as 'Income' | 'Expense',
        start_date: start_date as string,
        end_date: end_date as string,
        page: 1,
        limit: 10000 // Get all transactions for export
      });

      // Get additional data for export
      const [categories, wallets] = await Promise.all([
        this.dashboardService.getAccessibleCategories(userId),
        this.dashboardService.getAccessibleWallets(userId)
      ]);

      let filePath: string;
      let contentType: string;
      let downloadFilename: string;

      if (format === 'csv') {
        filePath = await this.exportService.exportTransactionsToCSV(
          report.transactions,
          categories,
          wallets,
          filename
        );
        contentType = 'text/csv';
        downloadFilename = filename || `transactions_${Date.now()}.csv`;
      } else {
        filePath = await this.exportService.exportTransactionsToPDF(
          report.transactions,
          categories,
          wallets,
          report.summary,
          filename
        );
        contentType = 'application/pdf';
        downloadFilename = filename || `transactions_report_${Date.now()}.pdf`;
      }

      // Send file
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Clean up file after sending
      fileStream.on('end', () => {
        this.exportService.cleanupFile(filePath);
      });

    } catch (error) {
      console.error('Error exporting transactions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export transactions'
        }
      } as ApiResponse);
    }
  }

  async exportCategoryBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'User not authenticated'
          }
        } as ApiResponse);
        return;
      }

      const {
        wallet_id,
        type,
        start_date,
        end_date,
        filename
      } = req.body;

      const breakdown = await this.dashboardService.getCategoryBreakdown(userId, {
        wallet_id: wallet_id as string,
        type: type as 'Income' | 'Expense',
        start_date: start_date as string,
        end_date: end_date as string
      });

      const filePath = await this.exportService.exportCategoryBreakdownToCSV(
        breakdown.breakdown,
        filename
      );

      const downloadFilename = filename || `category_breakdown_${Date.now()}.csv`;

      // Send file
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Clean up file after sending
      fileStream.on('end', () => {
        this.exportService.cleanupFile(filePath);
      });

    } catch (error) {
      console.error('Error exporting category breakdown:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export category breakdown'
        }
      } as ApiResponse);
    }
  }

  async exportTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'User not authenticated'
          }
        } as ApiResponse);
        return;
      }

      const {
        wallet_id,
        period = 'monthly',
        months = '12',
        filename
      } = req.body;

      const trends = await this.dashboardService.getTrends(userId, {
        wallet_id: wallet_id as string,
        period: period as 'monthly' | 'weekly',
        months: parseInt(months as string)
      });

      const filePath = await this.exportService.exportTrendsToCSV(
        trends.trends,
        filename
      );

      const downloadFilename = filename || `trends_report_${Date.now()}.csv`;

      // Send file
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Clean up file after sending
      fileStream.on('end', () => {
        this.exportService.cleanupFile(filePath);
      });

    } catch (error) {
      console.error('Error exporting trends:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export trends'
        }
      } as ApiResponse);
    }
  }

  async getChartData(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'User not authenticated'
          }
        } as ApiResponse);
        return;
      }

      const {
        chart_type,
        wallet_id,
        type,
        period = 'monthly',
        months = '6'
      } = req.query;

      if (!chart_type) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'chart_type is required'
          }
        } as ApiResponse);
        return;
      }

      let chartData;

      switch (chart_type) {
        case 'spending-trends':
          chartData = await this.dashboardService.getSpendingTrendsChartData(userId, {
            wallet_id: wallet_id as string,
            period: period as 'monthly' | 'weekly',
            months: parseInt(months as string)
          });
          break;

        case 'category-pie':
          chartData = await this.dashboardService.getCategoryPieChartData(userId, {
            wallet_id: wallet_id as string,
            type: (type as 'Income' | 'Expense') || 'Expense'
          });
          break;

        case 'income-expense-bar':
          chartData = await this.dashboardService.getIncomeExpenseBarChartData(userId, {
            wallet_id: wallet_id as string,
            months: parseInt(months as string)
          });
          break;

        case 'budget-progress':
          chartData = await this.dashboardService.getBudgetProgressChartData(userId, {
            wallet_id: wallet_id as string
          });
          break;

        default:
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Invalid chart_type. Supported types: spending-trends, category-pie, income-expense-bar, budget-progress'
            }
          } as ApiResponse);
          return;
      }

      res.json({
        success: true,
        data: chartData
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting chart data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get chart data'
        }
      } as ApiResponse);
    }
  }
}