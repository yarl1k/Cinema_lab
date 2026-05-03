import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { logEvent } from "../services/logger.js";
import * as XLSX from "xlsx";

// ─── GET /api/buffet ────────────────────────────────────────────────
export const getBuffetItems = async (_req: Request, res: Response): Promise<void> => {
    try {
        const items = await prisma.buffetItems.findMany({ orderBy: { id: "asc" } });
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        console.error("getBuffetItems error:", error);
        res.status(500).json({ success: false, message: "Помилка отримання товарів буфету" });
    }
};

// ─── POST /api/buffet/import ────────────────────────────────────────
export const importBuffetItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            res.status(400).json({ success: false, message: "Файл не завантажено" });
            return;
        }

        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            res.status(400).json({ success: false, message: "Файл порожній — не знайдено жодного аркуша" });
            return;
        }

        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName]);

        const COL = {
            id: ["ID", "id"],
            name: ["Назва", "Name"],
            category: ["Категорія", "Category"],
            quantity: ["Кількість на складі", "Stock Quantity", "Кількість", "Quantity"],
            purchasePrice: ["Ціна закупівлі", "Purchase Price"],
            sellingPrice: ["Ціна продажу", "Selling Price"],
        };

        const findCol = (row: Record<string, any>, variants: string[]): any => {
            for (const v of variants) {
                if (row[v] !== undefined) return row[v];
            }
            return undefined;
        };

        let created = 0;
        let updated = 0;
        let deleted = 0;
        let skipped = 0;
        const errors: string[] = [];

        const seenIds = new Set<number>();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;

            const name = String(findCol(row, COL.name) ?? "").trim();
            const category = String(findCol(row, COL.category) ?? "").trim();
            const rawQty = findCol(row, COL.quantity);
            const rawPurchasePrice = findCol(row, COL.purchasePrice);
            const rawSellingPrice = findCol(row, COL.sellingPrice);
            const rawId = findCol(row, COL.id);
            const id = rawId ? Number(rawId) : undefined;

            // Validate
            if (!name) {
                errors.push(`Рядок ${rowNum}: пропущено назву`);
                skipped++;
                continue;
            }
            if (!category) {
                errors.push(`Рядок ${rowNum}: пропущено категорію для "${name}"`);
                skipped++;
                continue;
            }
            if (typeof rawQty !== 'number' || isNaN(rawQty) || rawQty < 0) {
                errors.push(`Рядок ${rowNum}: некоректна кількість для "${name}" (очікується число >= 0)`);
                skipped++;
                continue;
            }
            if (typeof rawPurchasePrice !== 'number' || isNaN(rawPurchasePrice) || rawPurchasePrice < 0) {
                errors.push(`Рядок ${rowNum}: некоректна ціна закупівлі для "${name}" (очікується число >= 0)`);
                skipped++;
                continue;
            }
            if (typeof rawSellingPrice !== 'number' || isNaN(rawSellingPrice) || rawSellingPrice < 0) {
                errors.push(`Рядок ${rowNum}: некоректна ціна продажу для "${name}" (очікується число >= 0)`);
                skipped++;
                continue;
            }

            try {
                if (id && !isNaN(id)) {
                    const existing = await prisma.buffetItems.findUnique({ where: { id } });
                    if (existing) {
                        await prisma.buffetItems.update({
                            where: { id },
                            data: {
                                name, // Allowing name to be updated!
                                category,
                                stockQuantity: rawQty,
                                purchasePrice: rawPurchasePrice,
                                sellingPrice: rawSellingPrice,
                                updatedAt: new Date(),
                            },
                        });
                        seenIds.add(id);
                        updated++;
                    } else {
                        const newItem = await prisma.buffetItems.create({
                            data: {
                                name,
                                category,
                                stockQuantity: rawQty,
                                purchasePrice: rawPurchasePrice,
                                sellingPrice: rawSellingPrice,
                            },
                        });
                        seenIds.add(newItem.id);
                        created++;
                    }
                } else {
                    const existingByName = await prisma.buffetItems.findUnique({ where: { name } });
                    if (existingByName) {
                        await prisma.buffetItems.update({
                            where: { id: existingByName.id },
                            data: {
                                category,
                                stockQuantity: rawQty,
                                purchasePrice: rawPurchasePrice,
                                sellingPrice: rawSellingPrice,
                                updatedAt: new Date(),
                            },
                        });
                        seenIds.add(existingByName.id);
                        updated++;
                    } else {
                        const newItem = await prisma.buffetItems.create({
                            data: {
                                name,
                                category,
                                stockQuantity: rawQty,
                                purchasePrice: rawPurchasePrice,
                                sellingPrice: rawSellingPrice,
                            },
                        });
                        seenIds.add(newItem.id);
                        created++;
                    }
                }
            } catch (err: any) {
                errors.push(`Рядок ${rowNum}: помилка збереження "${name}"`);
                skipped++;
            }
        }

        const allItems = await prisma.buffetItems.findMany({ select: { id: true } });
        const unusedIds = allItems.map((i) => i.id).filter((itemId) => !seenIds.has(itemId));
        if (unusedIds.length > 0) {
            await prisma.buffetItems.deleteMany({
                where: { id: { in: unusedIds } },
            });
            deleted = unusedIds.length;
        }

        await logEvent("IMPORT_BUFFET", null, "BuffetItems", undefined, { created, updated, deleted, skipped });

        res.status(200).json({
            success: true,
            data: { created, updated, deleted, skipped, errors },
            message: `Імпорт завершено: створено ${created}, оновлено ${updated}, видалено ${deleted}, пропущено ${skipped}`,
        });
    } catch (error) {
        console.error("importBuffetItems error:", error);
        res.status(500).json({ success: false, message: "Помилка імпорту файлу" });
    }
};

// ─── GET /api/buffet/export ─────────────────────────────────────────
export const exportBuffetItems = async (_req: Request, res: Response): Promise<void> => {
    try {
        const items = await prisma.buffetItems.findMany({ orderBy: { id: "asc" } });

        const data = items.map((item) => ({
            "ID": item.id,
            "Назва": item.name,
            "Категорія": item.category,
            "Кількість на складі": item.stockQuantity,
            "Ціна закупівлі": Number(item.purchasePrice),
            "Ціна продажу": Number(item.sellingPrice),
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Auto-size columns
        const colWidths = Object.keys(data[0] || {}).map((key) => ({
            wch: Math.max(key.length, ...data.map((r) => String((r as any)[key]).length)) + 2,
        }));
        worksheet["!cols"] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, "Інвентаризація");

        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        const today = new Date().toISOString().split("T")[0];

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="buffet-inventory-${today}.xlsx"`);
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("exportBuffetItems error:", error);
        res.status(500).json({ success: false, message: "Помилка експорту" });
    }
};
