import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── GET /api/reports/managerial ────────────────────────────────────
export const getManagerialReport = async (_req: Request, res: Response): Promise<void> => {
    try {
        // 1. Ticket revenue (PURCHASED only)
        const ticketAgg = await prisma.tickets.aggregate({
            _sum: { price: true },
            _count: { id: true },
            where: { status: "PURCHASED" },
        });
        const totalRevenue = Number(ticketAgg._sum.price ?? 0);
        const ticketsSold = ticketAgg._count.id;

        const totalTickets = await prisma.tickets.count();

        const sessions = await prisma.sessions.findMany({
            include: { Halls: { select: { rows: true, seatsPerRow: true } } },
        });
        const totalSeats = sessions.reduce((sum, s) => sum + s.Halls.rows * s.Halls.seatsPerRow, 0);

        const occupancyPercent = totalSeats > 0 ? ((ticketsSold / totalSeats) * 100).toFixed(1) : "0.0";

        const buffetItems = await prisma.buffetItems.findMany();
        const buffetItemsCount = buffetItems.length;
        const buffetStockCost = buffetItems.reduce(
            (sum, item) => sum + item.stockQuantity * Number(item.purchasePrice), 0
        );
        const buffetStockSellingValue = buffetItems.reduce(
            (sum, item) => sum + item.stockQuantity * Number(item.sellingPrice), 0
        );
        const buffetTotalQuantity = buffetItems.reduce((sum, item) => sum + item.stockQuantity, 0);

        const sessionCount = sessions.length;
        const movieCount = await prisma.movies.count();

        const now = new Date();
        const reportDate = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;

        const templatePath = path.join(process.cwd(), "templates", "report-template.docx");
        if (!fs.existsSync(templatePath)) {
            res.status(500).json({ success: false, message: "Шаблон звіту не знайдено" });
            return;
        }

        const templateContent = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(templateContent);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render({
            report_date: reportDate,
            total_ticket_revenue: totalRevenue.toFixed(2),
            tickets_sold_count: ticketsSold,
            occupancy_percent: occupancyPercent,
            total_seats: totalSeats,
            session_count: sessionCount,
            movie_count: movieCount,
            buffet_items_count: buffetItemsCount,
            buffet_total_quantity: buffetTotalQuantity,
            buffet_stock_cost: buffetStockCost.toFixed(2),
            buffet_stock_selling_value: buffetStockSellingValue.toFixed(2),
        });

        const outputBuffer = doc.getZip().generate({
            type: "nodebuffer",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const today = now.toISOString().split("T")[0];
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="managerial-report-${today}.docx"`);
        res.send(outputBuffer);
    } catch (error) {
        console.error("getManagerialReport error:", error);
        res.status(500).json({ success: false, message: "Помилка генерації звіту" });
    }
};
