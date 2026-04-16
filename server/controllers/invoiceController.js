/**
 * Enterprise Invoice Controller
 * Enhanced with validation, logging, and audit trails
 */

const Invoice = require("../models/Invoice");
const TimeLog = require("../models/TimeLog");
const Client = require("../models/Client");
const AuditLog = require("../models/AuditLog");
const { ApiResponse, asyncHandler, sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { logger } = require('../config/logger');
const { validate, invoiceSchema } = require('../utils/validators');

/**
 * Get all invoices with pagination
 */
const getInvoices = asyncHandler(async (req, res) => {
  const { status, clientId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  const filter = { user: req.user.id };
  if (status) filter.status = status;
  if (clientId) filter.client = clientId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate("client", "name email company")
      .populate("project", "title")
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Invoice.countDocuments(filter)
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    hasNext: skip + invoices.length < total,
    hasPrev: parseInt(page) > 1
  };

  return sendPaginated(res, invoices, pagination, 'Invoices retrieved');
});

/**
 * Generate invoice from time logs (IMPLEMENTED)
 */
const generateFromTimeLogs = asyncHandler(async (req, res) => {
  const { clientId, projectId, startDate, endDate, taxRate, dueDate, notes, isGstInvoice, clientGstin, placeOfSupply } = req.body;

  // Validate client
  if (!clientId) {
    return sendError(res, 'Client is required', 400);
  }

  const client = await Client.findOne({ _id: clientId, user: req.user.id });
  if (!client) {
    return sendError(res, 'Client not found', 404);
  }

  // Build time log filter
  const timeLogFilter = { 
    user: req.user.id,
    client: clientId,
    billable: true,
    invoice: { $exists: false }
  };

  if (projectId) timeLogFilter.project = projectId;
  
  if (startDate || endDate) {
    timeLogFilter.date = {};
    if (startDate) timeLogFilter.date.$gte = new Date(startDate);
    if (endDate) timeLogFilter.date.$lte = new Date(endDate);
  }

  const timeLogs = await TimeLog.find(timeLogFilter).populate('project', 'title');

  if (timeLogs.length === 0) {
    return sendError(res, 'No billable time logs found for the selected period', 404);
  }

  // Group time logs by project
  const projectTotals = {};
  
  timeLogs.forEach(log => {
    const pid = log.project?._id?.toString() || 'unassigned';
    const rate = log.rate || req.user?.settings?.defaultRate || 500;
    
    if (!projectTotals[pid]) {
      projectTotals[pid] = {
        description: log.project?.title || 'Unassigned Project',
        hours: 0,
        rate,
        amount: 0
      };
    }
    
    projectTotals[pid].hours += log.duration || 0;
    projectTotals[pid].amount += (log.duration || 0) * rate;
  });

  // Convert to invoice items
  const items = Object.entries(projectTotals).map(([_, item]) => ({
    description: item.description,
    hours: Math.round(item.hours * 100) / 100,
    rate: item.rate,
    amount: Math.round(item.amount * 100) / 100
  }));

  // Create invoice
  const invoice = await Invoice.create({
    user: req.user.id,
    client: clientId,
    project: projectId || null,
    items,
    taxRate: Number(taxRate) || 0,
    dueDate: dueDate ? new Date(dueDate) : null,
    notes: notes || '',
    isGstInvoice: isGstInvoice || false,
    clientGstin: clientGstin || '',
    placeOfSupply: placeOfSupply || '',
    sourceTimeLogs: timeLogs.map(l => l._id)
  });

  // Mark time logs as invoiced
  await TimeLog.updateMany(
    { _id: { $in: timeLogs.map(l => l._id) } },
    { $set: { invoice: invoice._id } }
  );

  // Populate response
  const populated = await invoice.populate([
    { path: 'client', select: 'name email company phone gstin address' },
    { path: 'project', select: 'title' }
  ]);

  // Log audit
  await AuditLog.log({
    userId: req.user.id,
    action: 'INVOICE_CREATE',
    resource: 'Invoice',
    resourceId: invoice._id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata: { source: 'timelogs', itemCount: items.length }
  });

  logger.info({ userId: req.user.id, invoiceId: invoice._id, itemCount: items.length }, 'Invoice generated from time logs');

  return sendSuccess(res, populated, 'Invoice generated from time logs', 201);
});

/**
 * Create invoice with validation
 */
const createInvoice = [
  validate(invoiceSchema),
  asyncHandler(async (req, res) => {
    const { clientId, projectId, items, taxRate, dueDate, notes, isGstInvoice, clientGstin, placeOfSupply, upiTransactionId, paymentMethod } = req.body;

    const client = await Client.findOne({ _id: clientId, user: req.user.id });
    if (!client) {
      return sendError(res, 'Client not found', 404);
    }

    const processedItems = items.map(item => ({
      description: item.description || 'Service',
      hours: parseFloat(item.hours) || 0,
      rate: parseFloat(item.rate) || 0,
      amount: parseFloat((item.hours * item.rate).toFixed(2)) || 0
    }));

    const invoice = await Invoice.create({
      user: req.user.id,
      client: clientId,
      project: projectId || null,
      items: processedItems,
      taxRate: Number(taxRate) || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
      isGstInvoice: isGstInvoice || false,
      clientGstin: clientGstin || '',
      placeOfSupply: placeOfSupply || '',
      upiTransactionId: upiTransactionId || '',
      paymentMethod: paymentMethod || 'upi'
    });

    const populated = await invoice.populate([
      { path: 'client', select: 'name email company phone gstin address' },
      { path: 'project', select: 'title' }
    ]);

    // Log audit
    await AuditLog.log({
      userId: req.user.id,
      action: 'INVOICE_CREATE',
      resource: 'Invoice',
      resourceId: invoice._id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { clientId, itemCount: items.length, total: processedItems.reduce((s, i) => s + i.amount, 0) }
    });

    logger.info({ userId: req.user.id, invoiceId: invoice._id, itemCount: items.length }, 'Invoice created');

    return sendSuccess(res, populated, 'Invoice created successfully', 201);
  })
];

/**
 * Update invoice
 */
const updateInvoice = asyncHandler(async (req, res) => {
  const allowedFields = [
    'clientId', 'projectId', 'items', 'taxRate', 'dueDate', 'notes',
    'isGstInvoice', 'clientGstin', 'placeOfSupply', 'status',
    'upiTransactionId', 'paymentMethod'
  ];
  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      const modelField = field === 'clientId' ? 'client'
        : field === 'projectId' ? 'project'
        : field;
      updateData[modelField] = req.body[field];
    }
  });

  if (updateData.items) {
    updateData.items = updateData.items.map(item => ({
      description: item.description || 'Service',
      hours: parseFloat(item.hours) || 0,
      rate: parseFloat(item.rate) || 0,
      amount: parseFloat((item.hours * item.rate).toFixed(2)) || 0
    }));
  }
  if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
  if (updateData.taxRate !== undefined) updateData.taxRate = Number(updateData.taxRate);
  if (updateData.status) updateData.status = updateData.status;

  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate("client", "name email company")
    .populate("project", "title");
    
  if (!invoice) {
    return sendError(res, 'Invoice not found', 404);
  }

  // Log audit
  await AuditLog.log({
    userId: req.user.id,
    action: 'INVOICE_UPDATE',
    resource: 'Invoice',
    resourceId: invoice._id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata: { updated: Object.keys(updateData) }
  });

  return sendSuccess(res, invoice, 'Invoice updated');
});

/**
 * Mark invoice as paid
 */
const markPaid = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { status: 'paid', paidAt: new Date() },
    { new: true }
  ).populate("client", "name email company");

  if (!invoice) {
    return sendError(res, 'Invoice not found', 404);
  }

  // Log audit
  await AuditLog.log({
    userId: req.user.id,
    action: 'PAYMENT_MARK_PAID',
    resource: 'Invoice',
    resourceId: invoice._id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata: { amount: invoice.total }
  });

  logger.info({ userId: req.user.id, invoiceId: invoice._id }, 'Invoice marked as paid');

  return sendSuccess(res, invoice, 'Invoice marked as paid');
});

/**
 * Delete invoice
 */
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  
  if (!invoice) {
    return sendError(res, 'Invoice not found', 404);
  }

  // Log audit
  await AuditLog.log({
    userId: req.user.id,
    action: 'INVOICE_DELETE',
    resource: 'Invoice',
    resourceId: req.params.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  return sendSuccess(res, null, 'Invoice deleted');
});

/**
 * Download invoice PDF
 */
const downloadPDF = asyncHandler(async (req, res) => {
  const PDFDocument = require("pdfkit");
  
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id })
    .populate("client", "name email company phone")
    .populate("project", "title");

  if (!invoice) {
    return sendError(res, 'Invoice not found', 404);
  }

  // Log audit
  await AuditLog.log({
    userId: req.user.id,
    action: 'INVOICE_DOWNLOAD',
    resource: 'Invoice',
    resourceId: invoice._id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoice.invoiceNumber || invoice._id}.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 42, compress: true });
  doc.pipe(res);

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const M = 42;
  const R = pageW - 42;
  const contentW = R - M;

  // Header
  doc.roundedRect(M, doc.y, contentW, 140, 14).fill("#0b1020");
  doc.rect(M, doc.y, contentW, 54).fill("#6c63ff");
  doc.rect(M, doc.y + 54, contentW, 18).fill("#ff6584");
  doc.rect(M, doc.y + 72, contentW, 68).fill("#0b1020");

  const headerY = doc.y;
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text("FreelanceFlow", M + 16, headerY + 16);
  doc.font("Helvetica").fontSize(10).fillColor("rgba(255,255,255,0.85)").text("Premium Invoice", M + 16, headerY + 36);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("INVOICE", M + 16, headerY + 86);
  doc.font("Helvetica").fontSize(11).fillColor("rgba(255,255,255,0.9)").text(`#${invoice.invoiceNumber || invoice._id}`, M + 16, headerY + 112);

  const metaX = M + contentW * 0.62;
  const metaW = R - 16 - metaX;
  const metaRow = (label, value, y) => {
    doc.fillColor("rgba(255,255,255,0.80)").font("Helvetica-Bold").fontSize(9).text(label, metaX, y, { width: metaW, align: "right" });
    doc.fillColor("#ffffff").font("Helvetica").fontSize(10).text(value, metaX, y + 12, { width: metaW, align: "right" });
  };
  metaRow("Issue date", invoice.createdAt?.toISOString().slice(0, 10) || "", headerY + 20);
  metaRow("Due date", invoice.dueDate?.toISOString().slice(0, 10) || "N/A", headerY + 54);
  metaRow("Status", (invoice.status || "draft").toUpperCase(), headerY + 88);

  doc.y = headerY + 140 + 16;

  // Bill to / From
  const colW = (contentW - 12) / 2;
  const boxY = doc.y;
  const drawBox = (x, title, lines) => {
    doc.roundedRect(x, boxY, colW, 88, 12).fill("#ffffff");
    doc.roundedRect(x, boxY, colW, 88, 12).strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10).text(title, x + 14, boxY + 12);
    doc.font("Helvetica").fontSize(11);
    let y = boxY + 32;
    lines.filter(Boolean).forEach(ln => { doc.text(ln, x + 14, y, { width: colW - 28 }); y += 14; });
  };
  drawBox(M, "BILL TO", [invoice.client?.name || "Client", invoice.client?.email || "", invoice.client?.company || ""]);
  drawBox(M + colW + 12, "FROM", ["FreelanceFlow", ""]);
  doc.y = boxY + 88 + 16;

  // Items table
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(11).text("Items", M, doc.y);
  doc.moveDown(0.6);

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const startY = doc.y;
  const col1 = M + 12;
  const col2 = M + contentW * 0.55;
  const col3 = M + contentW * 0.68;
  const col4 = M + contentW * 0.82;

  doc.roundedRect(M, startY - 6, contentW, 38, 12).fill("#f8fafc");
  doc.roundedRect(M, startY - 6, contentW, 38, 12).strokeColor("#e5e7eb").lineWidth(1).stroke();
  doc.fillColor("#475569").font("Helvetica-Bold").fontSize(9);
  doc.text("DESCRIPTION", col1, startY + 4, { width: contentW * 0.5 });
  doc.text("HRS", col2, startY + 4, { width: 50, align: "right" });
  doc.text("RATE", col3, startY + 4, { width: 70, align: "right" });
  doc.text("AMOUNT", col4, startY + 4, { width: R - col4 - 12, align: "right" });
  doc.y = startY + 38;

  doc.font("Helvetica").fontSize(10).fillColor("#111827");
  items.forEach((it, idx) => {
    const y = doc.y;
    doc.rect(M, y - 4, contentW, 24).fill(idx % 2 === 0 ? "#ffffff" : "#fbfdff");
    doc.fillColor("#111827");
    doc.text(it.description || "—", col1, y, { width: contentW * 0.5 });
    doc.text(String(it.hours || 0), col2, y, { width: 50, align: "right" });
    doc.text("Rs." + Number(it.rate || 0).toLocaleString("en-IN"), col3, y, { width: 70, align: "right" });
    doc.text("Rs." + Number(it.amount || 0).toLocaleString("en-IN"), col4, y, { width: R - col4 - 12, align: "right" });
    doc.y = y + 20;
  });

  doc.roundedRect(M, startY - 6, contentW, doc.y - startY + 10, 12).strokeColor("#e5e7eb").lineWidth(1).stroke();
  doc.moveDown(0.8);

  // Totals
  const subtotal = items.reduce((s, it) => s + (it.amount || 0), 0);
  const taxRate = Number(invoice.taxRate || 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const totalsW = 260;
  const totalsX = R - totalsW;
  const totalsY = doc.y;
  doc.roundedRect(totalsX, totalsY, totalsW, 118, 12).fill("#0b1020");
  doc.roundedRect(totalsX, totalsY, totalsW, 118, 12).strokeColor("#222a44").lineWidth(1).stroke();
  doc.y = totalsY + 14;

  const tRow = (label, value) => {
    const y = doc.y;
    doc.fillColor("rgba(255,255,255,0.70)").font("Helvetica-Bold").fontSize(9).text(label, totalsX + 14, y, { width: totalsW - 28, align: "left" });
    doc.fillColor("#ffffff").font("Helvetica").fontSize(10).text(value, totalsX + 14, y, { width: totalsW - 28, align: "right" });
    doc.y = y + 18;
  };

  tRow("Subtotal", "Rs." + subtotal.toLocaleString("en-IN"));
  if (taxRate > 0) tRow(`GST (${taxRate}%)`, "Rs." + taxAmount.toLocaleString("en-IN"));
  doc.moveTo(totalsX + 14, doc.y + 2).lineTo(totalsX + totalsW - 14, doc.y + 2).strokeColor("rgba(255,255,255,0.14)").lineWidth(1).stroke();
  doc.y += 10;
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text("Total Due", totalsX + 14, doc.y, { width: totalsW - 28, align: "left" });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text("Rs." + total.toLocaleString("en-IN"), totalsX + 14, doc.y, { width: totalsW - 28, align: "right" });

  if (invoice.notes) {
    doc.y = totalsY + 130;
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10).text("Notes", M, doc.y);
    doc.fillColor("#334155").font("Helvetica").fontSize(10).text(String(invoice.notes), M, doc.y + 14);
  }

  doc.fillColor("#64748b").font("Helvetica").fontSize(9);
  doc.text("Generated by FreelanceFlow", M, pageH - 42, { width: contentW, align: "center" });

  doc.end();

  logger.info({ userId: req.user.id, invoiceId: invoice._id }, 'Invoice PDF downloaded');
});

module.exports = { 
  getInvoices, 
  createInvoice, 
  generateFromTimeLogs, 
  updateInvoice, 
  markPaid, 
  deleteInvoice, 
  downloadPDF 
};