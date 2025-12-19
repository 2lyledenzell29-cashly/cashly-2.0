import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category, Wallet } from '../types';

export interface ExportData {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  includeHeaders?: boolean;
  filename?: string;
}

export class ExportService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async exportTransactionsToCSV(
    transactions: Transaction[],
    categories: Category[],
    wallets: Wallet[],
    filename?: string
  ): Promise<string> {
    const csvFilename = filename || `transactions_export_${Date.now()}.csv`;
    const filePath = path.join(this.tempDir, csvFilename);

    // Create category and wallet lookup maps
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const walletMap = new Map(wallets.map(w => [w.id, w.name]));

    // Prepare CSV data
    const csvData = transactions.map(transaction => ({
      id: transaction.id,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: categoryMap.get(transaction.category_id || '') || 'Uncategorized',
      wallet: walletMap.get(transaction.wallet_id) || 'Unknown',
      created_at: transaction.created_at.toISOString(),
      created_by: transaction.created_by
    }));

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'Transaction ID' },
        { id: 'title', title: 'Title' },
        { id: 'amount', title: 'Amount' },
        { id: 'type', title: 'Type' },
        { id: 'category', title: 'Category' },
        { id: 'wallet', title: 'Wallet' },
        { id: 'created_at', title: 'Date Created' },
        { id: 'created_by', title: 'Created By' }
      ]
    });

    await csvWriter.writeRecords(csvData);
    return filePath;
  }

  async exportTransactionsToPDF(
    transactions: Transaction[],
    categories: Category[],
    wallets: Wallet[],
    summary?: {
      total_income: number;
      total_expense: number;
      net_amount: number;
      transaction_count: number;
    },
    filename?: string
  ): Promise<string> {
    const pdfFilename = filename || `transactions_report_${Date.now()}.pdf`;
    const filePath = path.join(this.tempDir, pdfFilename);

    // Create category and wallet lookup maps
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const walletMap = new Map(wallets.map(w => [w.id, w.name]));

    // Create PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('Transaction Report', 20, 20);

    // Add generation date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

    let yPosition = 50;

    // Add summary if provided
    if (summary) {
      doc.setFontSize(14);
      doc.text('Summary', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total Transactions: ${summary.transaction_count}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Total Income: $${summary.total_income.toFixed(2)}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Total Expense: $${summary.total_expense.toFixed(2)}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Net Amount: $${summary.net_amount.toFixed(2)}`, 20, yPosition);
      yPosition += 15;
    }

    // Prepare table data
    const tableData = transactions.map(transaction => [
      transaction.title,
      `$${transaction.amount.toFixed(2)}`,
      transaction.type,
      categoryMap.get(transaction.category_id || '') || 'Uncategorized',
      walletMap.get(transaction.wallet_id) || 'Unknown',
      new Date(transaction.created_at).toLocaleDateString()
    ]);

    // Add transactions table
    autoTable(doc, {
      head: [['Title', 'Amount', 'Type', 'Category', 'Wallet', 'Date']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    });

    // Save PDF
    doc.save(filePath);
    return filePath;
  }

  async exportCategoryBreakdownToCSV(
    breakdown: Array<{
      category_id: string | null;
      category_name: string;
      total_amount: number;
      transaction_count: number;
      percentage: number;
    }>,
    filename?: string
  ): Promise<string> {
    const csvFilename = filename || `category_breakdown_${Date.now()}.csv`;
    const filePath = path.join(this.tempDir, csvFilename);

    // Prepare CSV data
    const csvData = breakdown.map(item => ({
      category_name: item.category_name,
      total_amount: item.total_amount,
      transaction_count: item.transaction_count,
      percentage: item.percentage.toFixed(2)
    }));

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'category_name', title: 'Category' },
        { id: 'total_amount', title: 'Total Amount' },
        { id: 'transaction_count', title: 'Transaction Count' },
        { id: 'percentage', title: 'Percentage (%)' }
      ]
    });

    await csvWriter.writeRecords(csvData);
    return filePath;
  }

  async exportTrendsToCSV(
    trends: Array<{
      period: string;
      income: number;
      expense: number;
      net: number;
    }>,
    filename?: string
  ): Promise<string> {
    const csvFilename = filename || `trends_report_${Date.now()}.csv`;
    const filePath = path.join(this.tempDir, csvFilename);

    // Prepare CSV data
    const csvData = trends.map(trend => ({
      period: trend.period,
      income: trend.income,
      expense: trend.expense,
      net: trend.net
    }));

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'period', title: 'Period' },
        { id: 'income', title: 'Income' },
        { id: 'expense', title: 'Expense' },
        { id: 'net', title: 'Net Amount' }
      ]
    });

    await csvWriter.writeRecords(csvData);
    return filePath;
  }

  cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  // Clean up old files (older than 1 hour)
  cleanupOldFiles(): void {
    try {
      const files = fs.readdirSync(this.tempDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}