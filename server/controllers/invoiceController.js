const Invoice = require("../models/Invoice");
const TimeLog = require("../models/TimeLog");
const Client = require("../models/Client");

const getInvoices = async (req, res) => {
  try {
    const { status, clientId } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (clientId) filter.client = clientId;
    const invoices = await Invoice.find(filter)
      .populate("client", "name email company")
      .populate("project", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    console.error("GET INVOICES ERROR:", error.message);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

const generateFromTimeLogs = async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
};

const createInvoice = async (req, res) => {
  try {
    const { _id, id, clientId, projectId, items, taxRate, dueDate, notes, isGstInvoice, clientGstin, placeOfSupply, upiTransactionId, paymentMethod } = req.body;

    if (!clientId) return res.status(400).json({ error: "Client is required" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "At least one item is required" });

    const client = await Client.findOne({ _id: clientId, user: req.user.id });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const processedItems = items.map(item => {
      const hours = parseFloat(item.hours) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        description: item.description || "Service",
        hours,
        rate,
        amount: parseFloat((hours * rate).toFixed(2)),
      };
    });

    const invoice = await Invoice.create({
      user: req.user.id,
      client: clientId,
      project: projectId || null,
      items: processedItems,
      taxRate: Number(taxRate) || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || "",
      isGstInvoice: isGstInvoice || false,
      clientGstin: clientGstin || "",
      placeOfSupply: placeOfSupply || "",
      upiTransactionId: upiTransactionId || "",
      paymentMethod: paymentMethod || "upi",
    });

    const populated = await invoice.populate([
      { path: "client", select: "name email company phone gstin address" },
      { path: "project", select: "title" },
    ]);

    res.status(201).json({ success: true, invoice: populated });
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error.message);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};
    });

    const invoice = await Invoice.create({
      user: req.user.id,
      client: clientId,
      project: projectId || null,
      items: processedItems,
      taxRate: Number(taxRate) || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || "",
    });

    const populated = await invoice.populate([
      { path: "client", select: "name email company" },
      { path: "project", select: "title" },
    ]);

    console.log("INVOICE CREATED:", invoice.invoiceNumber);
    res.status(201).json({ success: true, invoice: populated });
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error.message);
    console.error(error.stack);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    // Remove local_ _id from body before updating
    const { _id, id, ...updateData } = req.body;
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updateData,
      { new: true }
    )
      .populate("client", "name email company")
      .populate("project", "title");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

const markPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: "paid", paidAt: new Date() },
      { new: true }
    ).populate("client", "name email company");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const PDFDocument = require("pdfkit");
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id })
      .populate("client", "name email company phone")
      .populate("project", "title");

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

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
    doc.text("Generated by FreelanceFlow · Thank you for your business.", M, pageH - 42, { width: contentW, align: "center" });

    doc.end();
  } catch (error) {
    console.error("PDF ERROR:", error.message);
    res.status(500).json({ error: "Failed to generate PDF", message: error.message });
  }
};

module.exports = { getInvoices, createInvoice, generateFromTimeLogs, updateInvoice, markPaid, deleteInvoice, downloadPDF };