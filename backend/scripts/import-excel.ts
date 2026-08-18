#!/usr/bin/env node
/**
 * Import data from legacy Excel files into PostgreSQL via Prisma.
 */
import 'dotenv/config';
import * as fs from 'fs';
import { PrismaClient, RequestStatus, MovementType, MovementStatus, CounterpartyType } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';

const WAREHOUSE_FILE =
  process.env.IMPORT_WAREHOUSE_FILE ??
  '/home/aloginov/Загрузки/Склад Old School v1.5b.xlsx';
const ORDERS_FILE =
  process.env.IMPORT_ORDERS_FILE ??
  '/home/aloginov/Загрузки/Заказ бумаги и расходников.xlsx';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function clean(value: unknown): string {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text || text === '#N/A' || text === 'None' || text === '-') return '';
  return text;
}

function parseNumber(value: unknown): number | null {
  const text = clean(value);
  if (!text) return null;
  const num = Number(text.replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

function excelDate(value: unknown): Date | null {
  const num = parseNumber(value);
  if (num == null || num < 40000) return null;
  const utcDays = Math.floor(num - 25569);
  return new Date(utcDays * 86400 * 1000);
}

function sheetRows(filePath: string, sheetName: string, headerRow = 1): Record<string, unknown>[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn(`Sheet not found: ${sheetName} in ${filePath}`);
    return [];
  }
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    range: headerRow - 1,
  });
}

function normalizeUnit(raw: string): string {
  const map: Record<string, string> = {
    'л': 'л',
    'уп': 'уп',
    'шт': 'шт',
    'м': 'м',
    'рул': 'рул',
    'пог. м': 'пог. м',
    'пог. м.': 'пог. м',
    'пог.м': 'пог. м',
    'пог.м.': 'пог. м',
    'п. м.': 'пог. м',
    'пог.мм': 'пог. м',
    'кв. м': 'кв. м',
    'кв.м.': 'кв. м',
  };
  return map[raw.trim()] ?? raw.trim();
}

const STATUS_MAP: Record<string, RequestStatus> = {
  'Новый': RequestStatus.SUBMITTED,
  'В работе': RequestStatus.IN_PROGRESS,
  'Заказано': RequestStatus.AWAITING_SUPPLY,
  'Приехало': RequestStatus.ISSUED,
  'Выполнено': RequestStatus.COMPLETED,
  'Отменён': RequestStatus.CANCELLED,
  'Отменен': RequestStatus.CANCELLED,
};

async function ensureReferences() {
  const categories = new Set<string>();
  const units = new Map<string, string>();
  const counterparties = new Set<string>();

  const materialsRows = sheetRows(WAREHOUSE_FILE, 'Материалы', 4);
  for (const row of materialsRows) {
    const category = clean(row['Материал'] ?? row['__EMPTY_10']);
    const supplier = clean(row['Поставщик'] ?? row['__EMPTY_11']);
    const unit = normalizeUnit(clean(row['Ед. изм'] ?? row['__EMPTY_13']));
    if (category) categories.add(category);
    if (supplier) counterparties.add(supplier);
    if (unit) units.set(unit, unit);
  }

  units.set('л', 'лист');
  units.set('уп', 'упаковка');
  units.set('шт', 'штука');
  units.set('пог. м', 'погонный метр');
  units.set('м', 'метр');
  units.set('рул', 'рулон');
  units.set('кв. м', 'квадратный метр');

  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const [shortName, name] of units) {
    await prisma.unit.upsert({
      where: { shortName },
      update: { name },
      create: { name, shortName },
    });
  }

  for (const name of counterparties) {
    await prisma.counterparty.upsert({
      where: { name },
      update: {},
      create: { name, type: CounterpartyType.SUPPLIER },
    });
  }

  console.log(
    `References: ${categories.size} categories, ${units.size} units, ${counterparties.size} counterparties`,
  );
}

async function importCounterparties() {
  if (!fs.existsSync(ORDERS_FILE)) {
    console.warn(`Orders file not found, skipping counterparties: ${ORDERS_FILE}`);
    return;
  }

  let imported = 0;
  for (const row of sheetRows(ORDERS_FILE, 'ПОСТАВЩИКИ', 1)) {
    const name = clean(row['__EMPTY'] ?? row[',']);
    if (!name) continue;
    await prisma.counterparty.upsert({
      where: { name },
      update: {
        type: CounterpartyType.SUPPLIER,
        legalEntity: clean(row['ЮР ЛИЦО']) || undefined,
        contactInfo: clean(row['КОНТАКТЫ']) || undefined,
        address: clean(row['ДОСТАВКА']) || undefined,
        notes: clean(row['СТАТУС']) || clean(row['ТОВАР']) || undefined,
      },
      create: {
        name,
        type: CounterpartyType.SUPPLIER,
        legalEntity: clean(row['ЮР ЛИЦО']) || undefined,
        contactInfo: clean(row['КОНТАКТЫ']) || undefined,
        address: clean(row['ДОСТАВКА']) || undefined,
        notes: clean(row['СТАТУС']) || clean(row['ТОВАР']) || undefined,
      },
    });
    imported += 1;
  }

  for (const row of sheetRows(ORDERS_FILE, 'ПОДРЯДЧИКИ', 1)) {
    const name = clean(row['Название']);
    if (!name) continue;
    const existing = await prisma.counterparty.findUnique({ where: { name } });
    await prisma.counterparty.upsert({
      where: { name },
      update: {
        type: existing?.type === CounterpartyType.SUPPLIER ? CounterpartyType.BOTH : CounterpartyType.CONTRACTOR,
        legalEntity: clean(row['Юр лицо']) || undefined,
        contactInfo: clean(row['контакты']) || undefined,
        address: clean(row['Адрес']) || undefined,
        notes: [clean(row[' ']), clean(row['Конт лицо']), clean(row['__EMPTY_8'])]
          .filter(Boolean)
          .join('\n') || undefined,
      },
      create: {
        name,
        type: CounterpartyType.CONTRACTOR,
        legalEntity: clean(row['Юр лицо']) || undefined,
        contactInfo: clean(row['контакты']) || undefined,
        address: clean(row['Адрес']) || undefined,
        notes: [clean(row[' ']), clean(row['Конт лицо'])].filter(Boolean).join('\n') || undefined,
      },
    });
    imported += 1;
  }

  console.log(`Counterparties imported: ${imported}`);
}

async function importMaterials() {
  const categoryMap = new Map((await prisma.category.findMany()).map((item) => [item.name, item.id]));
  const unitMap = new Map((await prisma.unit.findMany()).map((item) => [item.shortName, item.id]));
  const counterpartyMap = new Map((await prisma.counterparty.findMany()).map((item) => [item.name, item.id]));

  const minStockByName = new Map<string, number>();
  const purchaseBatchByName = new Map<string, number>();
  const altByName = new Map<string, string>();

  for (const row of sheetRows(WAREHOUSE_FILE, 'Складские позиции', 3)) {
    const name = clean(row['Материал']);
    const min = parseNumber(row['Мин']);
    if (name && min != null) minStockByName.set(name, min);
    const purchaseBatch = parseNumber(row['Закуп']);
    if (name && purchaseBatch != null) purchaseBatchByName.set(name, purchaseBatch);
    if (name && clean(row['Тип']).toLowerCase() === 'алт' && clean(row['Поставщик'])) {
      altByName.set(name, clean(row['Поставщик']));
    }
  }

  const rows = sheetRows(WAREHOUSE_FILE, 'Материалы', 4);
  let imported = 0;
  let offers = 0;

  for (const row of rows) {
    const name = clean(row['Название']);
    if (!name) continue;

    const categoryId = categoryMap.get(clean(row['Материал']));
    const unitId = unitMap.get(normalizeUnit(clean(row['Ед. изм']))) ?? unitMap.get('л');
    if (!categoryId || !unitId) continue;

    const available = parseNumber(row['Свободно']) ?? 0;
    const reserved = parseNumber(row['Резерв']) ?? 0;
    const ordered = parseNumber(row['Заказано']) ?? 0;
    const price = parseNumber(row['Цена тек']) ?? 0;
    const supplierName = clean(row['Поставщик']);

    const data = {
      name,
      categoryId,
      unitId,
      series: clean(row['Серия']) || undefined,
      color: clean(row['Цвет']) || undefined,
      densityGsm: parseNumber(row['Плотность, г/м2']) ?? undefined,
      thicknessMicron: parseNumber(row['Толщина, мкм']) ?? undefined,
      texture: clean(row['Фактура']) || undefined,
      coating: clean(row['Покрытие']) || undefined,
      dimensions: clean(row['Размеры, мм']) || undefined,
      description: clean(row['Описание']) || undefined,
      minStock: minStockByName.get(name) ?? undefined,
      purchaseBatch: purchaseBatchByName.get(name) ?? undefined,
      isActive: true,
    };

    const existing = await prisma.material.findFirst({ where: { name } });
    const material = existing
      ? await prisma.material.update({ where: { id: existing.id }, data })
      : await prisma.material.create({ data });

    await prisma.stockBalance.upsert({
      where: { materialId: material.id },
      create: { materialId: material.id, available, reserved, ordered },
      update: { available, reserved, ordered },
    });

    const primaryId = supplierName ? counterpartyMap.get(supplierName) : undefined;
    if (primaryId) {
      await prisma.counterpartyOffer.upsert({
        where: { counterpartyId_materialId: { counterpartyId: primaryId, materialId: material.id } },
        update: { price, isPrimary: true },
        create: { counterpartyId: primaryId, materialId: material.id, price, isPrimary: true },
      });
      offers += 1;
    }

    const altName = altByName.get(name);
    const altId = altName ? counterpartyMap.get(altName) : undefined;
    if (altId && altId !== primaryId) {
      await prisma.counterpartyOffer.upsert({
        where: { counterpartyId_materialId: { counterpartyId: altId, materialId: material.id } },
        update: {},
        create: { counterpartyId: altId, materialId: material.id, price: 0, isPrimary: false },
      });
    }

    imported += 1;
  }

  console.log(`Materials imported: ${imported}, offers: ${offers}`);
}

async function importMovements(adminId: string) {
  const materialMap = new Map(
    (await prisma.material.findMany({ select: { id: true, name: true } })).map((item) => [item.name, item.id]),
  );
  const movementLimit = parseNumber(process.env.IMPORT_MOVEMENTS_LIMIT ?? '') ?? undefined;
  const rows = sheetRows(WAREHOUSE_FILE, 'Сводка', 1);
  const limitedRows = movementLimit ? rows.slice(0, movementLimit) : rows;
  let imported = 0;

  for (const row of limitedRows) {
    const operation = clean(row['Операция']);
    const materialName = clean(row['Название']);
    const qty = Math.abs(parseNumber(row['Кол-во']) ?? 0);
    if (!operation || !materialName || qty <= 0) continue;
    const materialId = materialMap.get(materialName);
    if (!materialId) continue;

    const type =
      operation === 'Поступило'
        ? MovementType.RECEIPT
        : operation === 'Выдано'
          ? MovementType.ISSUE
          : null;
    if (!type) continue;

    const postedAt = excelDate(row['Дата']) ?? new Date();
    await prisma.movementDocument.create({
      data: {
        type,
        status: MovementStatus.POSTED,
        userId: adminId,
        postedAt,
        createdAt: postedAt,
        lines: { create: [{ materialId, quantity: qty }] },
      },
    });
    imported += 1;
  }

  console.log(`Movements imported: ${imported}`);
}

async function importOrders(adminId: string) {
  const materialMap = new Map(
    (await prisma.material.findMany({ select: { id: true, name: true } })).map((item) => [item.name, item.id]),
  );
  const orderLimit = parseNumber(process.env.IMPORT_ORDERS_LIMIT ?? '') ?? undefined;
  const rows = sheetRows(ORDERS_FILE, 'СТОЛ ЗАКАЗОВ', 2);
  const limitedRows = orderLimit ? rows.slice(0, orderLimit) : rows;
  let imported = 0;

  for (const row of limitedRows) {
    const materialName = clean(row['Название / Ссылка']);
    const qty = parseNumber(row['Кол-во']);
    if (!materialName || !qty || qty <= 0) continue;
    const materialId = materialMap.get(materialName);
    if (!materialId) continue;

    const status = STATUS_MAP[clean(row['Статус'])] ?? RequestStatus.SUBMITTED;
    const clientInfo = clean(row['Клиент, Заказ, Комментарии']);
    const dealMatch = clientInfo.match(/\d{6,}/);
    const createdAt = excelDate(row['__EMPTY']) ?? new Date();

    await prisma.managerRequest.create({
      data: {
        managerId: adminId,
        status,
        dealNumber: dealMatch?.[0],
        clientInfo: clientInfo || undefined,
        expectedDate: excelDate(row['Жел. дата']) ?? undefined,
        createdAt,
        lines: { create: [{ materialId, quantity: qty }] },
        statusLog: { create: { status, userId: adminId, createdAt } },
      },
    });
    imported += 1;
  }

  console.log(`Orders imported: ${imported}`);
}

async function main() {
  if (!fs.existsSync(WAREHOUSE_FILE)) {
    throw new Error(`Warehouse file not found: ${WAREHOUSE_FILE}`);
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    throw new Error('Admin user not found. Run seed first.');
  }

  const importOnly = process.env.IMPORT_ONLY?.trim().toLowerCase();
  console.log('Starting import...');

  if (!importOnly) {
    await ensureReferences();
    await importCounterparties();
    await importMaterials();
    await importMovements(admin.id);
    if (fs.existsSync(ORDERS_FILE)) {
      await importOrders(admin.id);
    }
  } else if (importOnly === 'references') {
    await ensureReferences();
  } else if (importOnly === 'counterparties' || importOnly === 'suppliers') {
    await importCounterparties();
  } else if (importOnly === 'materials') {
    await importMaterials();
  } else if (importOnly === 'movements') {
    await importMovements(admin.id);
  } else if (importOnly === 'orders') {
    if (fs.existsSync(ORDERS_FILE)) await importOrders(admin.id);
  } else {
    throw new Error(`Unknown IMPORT_ONLY value: ${importOnly}`);
  }

  console.log('Import completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
