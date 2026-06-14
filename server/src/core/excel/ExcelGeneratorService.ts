import ExcelJS from 'exceljs';
import { Response } from 'express';
import { logger } from '../logger/logger.js';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export class ExcelGeneratorService {
  static async generate(
    res: Response,
    filename: string,
    sheetName: string,
    columns: ExcelColumn[],
    data: Record<string, unknown>[],
  ): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width || 20,
      }));

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      data.forEach((row) => {
        worksheet.addRow(row);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      logger.error('Excel generation failed:', error);
      throw error;
    }
  }

  static async generateStreaming(
    res: Response,
    filename: string,
    sheetName: string,
    columns: ExcelColumn[],
    rowIterator: AsyncIterable<Record<string, unknown>>,
  ): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width || 20,
      }));

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      for await (const row of rowIterator) {
        worksheet.addRow(row);
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      logger.error('Streaming Excel generation failed:', error);
      throw error;
    }
  }
}