import mongoose from "mongoose";
import Payment from "@/models/payment.model";
import Order from "@/models/order.model";
import Customer from "@/models/customer.model";
import Refund from "@/models/refund.model";
import Settlement from "@/models/settlement.model";
import BankStatement from "@/models/bank-statement.model";
import Invoice from "@/models/invoice.model";
import { ApiError } from "@/utils/ApiError";

class PaymentService {
  /**
   * Create a new payment record and link it to the Order
   */
  async createPayment(data) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Create the Payment document
      const [payment] = await Payment.create([data], { session });

      // 2. Link payment to Order if order is provided
      if (data.order) {
        const order = await Order.findById(data.order).session(session);
        if (order) {
          order.payment = payment._id;
          await order.save({ session });

          // Auto-generate invoice
          const invoiceNumber = `INV-${order.orderNumber.split("-").pop()}`;
          let invoice = await Invoice.findOne({ invoiceNumber }).session(session);
          if (!invoice) {
            const dueDate = new Date(order.createdAt || new Date());
            dueDate.setDate(dueDate.getDate() + 15);
            let invStatus = "Sent";
            if (payment.status === "Paid") invStatus = "Paid";
            else if (payment.status === "Failed") invStatus = "Cancelled";

            [invoice] = await Invoice.create([{
              invoiceNumber,
              order: order._id,
              customer: order.customer,
              amount: order.totalAmount,
              dueDate,
              status: invStatus
            }], { session });
          }

          // Link Invoice to Payment
          payment.invoice = invoice._id;
          await payment.save({ session });
        }
      }

      await session.commitTransaction();
      session.endSession();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Update Payment details and record status changes in history
   */
  async updatePayment(id, data) {
    const payment = await Payment.findOne({ _id: id, isArchived: false });
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    const previousStatus = payment.status;
    const nextStatus = data.status;

    // Apply updates
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        payment[key] = data[key];
      }
    });

    // Log status history transition
    if (nextStatus && nextStatus !== previousStatus) {
      payment.statusHistory.push({
        status: nextStatus,
        changedAt: new Date(),
        changedBy: data.updatedBy || "System",
        remarks: data.remarks || `Status updated from ${previousStatus} to ${nextStatus}`
      });

      // Propagate status change to Invoice if linked
      if (payment.invoice) {
        let invStatus = "Sent";
        if (nextStatus === "Paid") invStatus = "Paid";
        else if (nextStatus === "Failed" || nextStatus === "Cancelled") invStatus = "Cancelled";

        await Invoice.findByIdAndUpdate(payment.invoice, { status: invStatus });
      }
    }

    await payment.save();
    return payment;
  }

  /**
   * Fetch a single Payment record by ID
   */
  async getPayment(id) {
    const payment = await Payment.findOne({ _id: id, isArchived: false })
      .populate({ path: "customer", select: "name email phone" })
      .populate({ path: "order", select: "orderNumber totalAmount createdAt" });
    
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }
    return payment;
  }

  /**
   * Retrieve all non-archived Payment records with filters, search, and pagination
   */
  async getAllPayments(queryParams) {
    const { page = 1, limit = 10, search, paymentStatus, paymentMethod, type, startDate, endDate } = queryParams;
    const filter = { isArchived: false };

    if (paymentStatus) filter.status = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (type) filter.type = type;

    // Date range filter
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    // Search query on order number, customer name, payment ID or transaction ID
    if (search?.trim()) {
      const query = search.trim();
      const matchingCustomers = await Customer.find({
        name: { $regex: query, $options: "i" }
      }).select("_id").lean();

      const customerIds = matchingCustomers.map((c) => c._id);

      const matchingOrders = await Order.find({
        orderNumber: { $regex: query, $options: "i" }
      }).select("_id").lean();

      const orderIds = matchingOrders.map((o) => o._id);

      filter.$or = [
        { paymentNumber: { $regex: query, $options: "i" } },
        { transactionId: { $regex: query, $options: "i" } },
        { gatewayTransactionId: { $regex: query, $options: "i" } },
        { customer: { $in: customerIds } },
        { order: { $in: orderIds } }
      ];
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate({ path: "customer", select: "name email" })
        .populate({ path: "order", select: "orderNumber" })
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter)
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Soft-delete (archive) a payment record to retain financial audit trails
   */
  async softDeletePayment(id, updatedBy = "System") {
    const payment = await Payment.findOne({ _id: id, isArchived: false });
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    payment.isArchived = true;
    payment.statusHistory.push({
      status: "Cancelled",
      changedAt: new Date(),
      changedBy,
      remarks: "Payment record archived"
    });

    await payment.save();
    return payment;
  }

  /**
   * Fetch aggregate payments statistics for the dashboard
   */
  async getStats(queryParams) {
    const { startDate, endDate } = queryParams;
    const matchFilter = { isArchived: false };

    if (startDate || endDate) {
      matchFilter.paymentDate = {};
      if (startDate) matchFilter.paymentDate.$gte = new Date(startDate);
      if (endDate) matchFilter.paymentDate.$lte = new Date(endDate);
    }

    // 1. Status aggregates (Incoming Paid, Incoming Pending, Incoming Failed counts & amounts)
    const statusAggs = await Payment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { type: "$type", status: "$status" },
          count: { $sum: 1 },
          amount: { $sum: "$amount" }
        }
      }
    ]);

    let totalPaid = 0;
    let totalPending = 0;
    let totalFailed = 0;
    let totalPaidAmount = 0;
    let totalPendingAmount = 0;
    let totalFailedAmount = 0;

    let revenueTotal = 0;
    let expenseTotal = 0;

    statusAggs.forEach((item) => {
      const { type, status } = item._id;
      if (type === "Incoming") {
        if (status === "Paid") {
          totalPaid += item.count;
          totalPaidAmount += item.amount;
          revenueTotal += item.amount;
        } else if (status === "Pending") {
          totalPending += item.count;
          totalPendingAmount += item.amount;
        } else if (status === "Failed") {
          totalFailed += item.count;
          totalFailedAmount += item.amount;
        }
      } else if (type === "Outgoing" && status === "Paid") {
        expenseTotal += item.amount;
      }
    });

    // 2. Payment Method Summary
    const methodAggs = await Payment.aggregate([
      { $match: { ...matchFilter, status: "Paid" } },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const methodsSummary = {};
    methodAggs.forEach((item) => {
      methodsSummary[item._id] = { amount: item.amount, count: item.count };
    });

    // 3. Monthly Trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAggs = await Payment.aggregate([
      { 
        $match: { 
          ...matchFilter, 
          status: "Paid", 
          paymentDate: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
            type: "$type"
          },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlySummary = [];
    // Populate structure for last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthlySummary.push({
        month: label,
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        revenue: 0,
        expense: 0
      });
    }

    monthlyAggs.forEach((item) => {
      const match = monthlySummary.find(
        (m) => m.year === item._id.year && m.monthNum === item._id.month
      );
      if (match) {
        if (item._id.type === "Incoming") {
          match.revenue = item.amount;
        } else {
          match.expense = item.amount;
        }
      }
    });

    // 4. Weekly Trend (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    fourWeeksAgo.setHours(0, 0, 0, 0);

    const weeklyAggs = await Payment.aggregate([
      { 
        $match: { 
          ...matchFilter, 
          status: "Paid", 
          paymentDate: { $gte: fourWeeksAgo } 
        } 
      },
      {
        $group: {
          _id: {
            week: { $week: "$paymentDate" },
            type: "$type"
          },
          amount: { $sum: "$amount" }
        }
      }
    ]);

    const weeklySummary = weeklyAggs.map((w) => ({
      week: `Week ${w._id.week}`,
      type: w._id.type,
      amount: w.amount
    }));

    return {
      totalPaid,
      totalPending,
      totalFailed,
      totalPaidAmount,
      totalPendingAmount,
      totalFailedAmount,
      revenueTotal,
      expenseTotal,
      methodsSummary,
      monthlySummary,
      weeklySummary
    };
  }

  /**
   * Process refund, supporting partial and full refund aggregates
   */
  async createRefund(paymentId, refundData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const payment = await Payment.findOne({ _id: paymentId, isArchived: false }).session(session);
      if (!payment) {
        throw new ApiError(404, "Payment record not found");
      }
      if (payment.status !== "Paid" && payment.status !== "Partially Refunded") {
        throw new ApiError(400, "Refund can only be initiated on a successfully Paid or Partially Refunded transaction");
      }

      const currentRefundableLimit = payment.amount - payment.refundedAmount;
      if (refundData.refundAmount > currentRefundableLimit) {
        throw new ApiError(400, `Refund amount ₹${refundData.refundAmount} exceeds maximum refundable amount of ₹${currentRefundableLimit}`);
      }

      // Create Refund document
      const [refund] = await Refund.create(
        [{ ...refundData, payment: paymentId, status: "Processed", processedDate: new Date() }],
        { session }
      );

      // Accumulate refund in payment record
      payment.refundedAmount += refundData.refundAmount;
      const nextStatus = payment.refundedAmount === payment.amount ? "Refunded" : "Partially Refunded";
      
      payment.status = nextStatus;
      payment.statusHistory.push({
        status: nextStatus,
        changedAt: new Date(),
        changedBy: refundData.approvedBy || "System",
        remarks: `Refund of ₹${refundData.refundAmount} processed. Total Refunded: ₹${payment.refundedAmount}`
      });

      await payment.save({ session });

      await session.commitTransaction();
      session.endSession();
      return refund;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Create Settlement log matching multiple payments
   */
  async createSettlement(data) {
    // Confirm payments exist
    const count = await Payment.countDocuments({
      _id: { $in: data.payments },
      isArchived: false
    });
    if (count !== data.payments.length) {
      throw new ApiError(400, "One or more payment references inside settlement are invalid or archived.");
    }

    const settlement = await Settlement.create(data);
    return settlement;
  }

  /**
   * List Settlements
   */
  async getAllSettlements() {
    return await Settlement.find({ isArchived: false })
      .populate("payments")
      .sort({ settlementDate: -1 })
      .lean();
  }

  /**
   * Create manual bank statement log
   */
  async createBankStatement(data) {
    return await BankStatement.create(data);
  }

  /**
   * List Bank Statements
   */
  async getAllBankStatements() {
    return await BankStatement.find({ isArchived: false })
      .populate("linkedPayment")
      .sort({ date: -1 })
      .lean();
  }

  /**
   * Reconcile statement reference with payment
   */
  async reconcileStatement(statementId, paymentId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const statement = await BankStatement.findOne({ _id: statementId, isArchived: false }).session(session);
      if (!statement) {
        throw new ApiError(404, "Bank statement record not found");
      }
      if (statement.status === "Matched") {
        throw new ApiError(400, "Bank statement entry is already fully reconciled");
      }

      const payment = await Payment.findOne({ _id: paymentId, isArchived: false }).session(session);
      if (!payment) {
        throw new ApiError(404, "Payment record not found");
      }

      const amountToMatch = statement.credit > 0 ? statement.credit : statement.debit;
      let matchStatus = "Matched";
      if (amountToMatch !== payment.amount) {
        matchStatus = "Partially Matched";
      }

      // Link them together
      statement.linkedPayment = payment._id;
      statement.status = matchStatus;
      await statement.save({ session });

      payment.remarks = (payment.remarks ? payment.remarks + ". " : "") + 
        `Reconciled with statement Ref: ${statement.transactionReference} (${matchStatus})`;
      await payment.save({ session });

      await session.commitTransaction();
      session.endSession();
      
      return { statement, matchStatus };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getAllRefunds() {
    return await Refund.find({ isArchived: false })
      .populate({
        path: "payment",
        populate: { path: "order", select: "orderNumber" }
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAllInvoices() {
    return await Invoice.find()
      .populate({ path: "customer", select: "name email phone" })
      .populate({ path: "order" })
      .sort({ createdAt: -1 })
      .lean();
  }
}

export default new PaymentService();
