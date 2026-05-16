import puppeteer from 'puppeteer';
import { logger } from '../logger/logger.js';
import { Response } from 'express';

export class PDFGeneratorService {
  static async generate(
    html: string,
    res: Response,
    filename: string,
  ): Promise<void> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error('PDF generation failed:', error);
      throw error;
    }
  }
}