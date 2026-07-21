import paymentService from "@/services/payment.service";
import { ApiResponse } from "@/utils/ApiResponse";
import { ApiError } from "@/utils/ApiError";
import { 
  createPaymentSchema, 
  updatePaymentSchema, 
  createRefundSchema, 
  createSettlementSchema, 
  createBankStatementSchema 
} from "@/schemas/payment.schema";

class PaymentController {
  async createPayment(request) {
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);
    const payment = await paymentService.createPayment(validatedData);
    return new ApiResponse(201, payment, "Payment transaction created successfully.");
  }

  async updatePayment(request, id) {
    const body = await request.json();
    const validatedData = updatePaymentSchema.parse(body);
    const payment = await paymentService.updatePayment(id, validatedData);
    return new ApiResponse(200, payment, "Payment details updated successfully.");
  }

  async getPayment(request, id) {
    const payment = await paymentService.getPayment(id);
    return new ApiResponse(200, payment, "Payment record fetched successfully.");
  }

  async getAllPayments(request) {
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "10", 10), 1), 100);
    const search = searchParams.get("search");
    const paymentStatus = searchParams.get("paymentStatus");
    const paymentMethod = searchParams.get("paymentMethod");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const result = await paymentService.getAllPayments({
      page,
      limit,
      search,
      paymentStatus,
      paymentMethod,
      type,
      startDate,
      endDate
    });

    return new ApiResponse(200, result, "Payments fetched successfully.");
  }

  async deletePayment(request, id) {
    const { searchParams } = new URL(request.url);
    const actor = searchParams.get("actor") || "System";
    const payment = await paymentService.softDeletePayment(id, actor);
    return new ApiResponse(200, payment, "Payment transaction soft-deleted successfully.");
  }

  async getStats(request) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const stats = await paymentService.getStats({ startDate, endDate });
    return new ApiResponse(200, stats, "Payment statistics aggregated successfully.");
  }

  async refundPayment(request, id) {
    const body = await request.json();
    const validatedData = createRefundSchema.parse(body);
    const refund = await paymentService.createRefund(id, validatedData);
    return new ApiResponse(200, refund, "Refund processed successfully.");
  }

  async createSettlement(request) {
    const body = await request.json();
    const validatedData = createSettlementSchema.parse(body);
    const settlement = await paymentService.createSettlement(validatedData);
    return new ApiResponse(201, settlement, "Settlement logged successfully.");
  }

  async getAllSettlements(request) {
    const settlements = await paymentService.getAllSettlements();
    return new ApiResponse(200, settlements, "Settlements fetched successfully.");
  }

  async createBankStatement(request) {
    const body = await request.json();
    const validatedData = createBankStatementSchema.parse(body);
    const statement = await paymentService.createBankStatement(validatedData);
    return new ApiResponse(201, statement, "Bank statement entry recorded successfully.");
  }

  async getAllBankStatements(request) {
    const statements = await paymentService.getAllBankStatements();
    return new ApiResponse(200, statements, "Bank statements fetched successfully.");
  }

  async reconcileStatement(request, statementId) {
    const { paymentId } = await request.json();
    if (!paymentId) {
      throw new ApiError(400, "paymentId is required for reconciliation");
    }

    const result = await paymentService.reconcileStatement(statementId, paymentId);
    return new ApiResponse(200, result, "Bank statement entry reconciled successfully.");
  }

  async getAllRefunds(request) {
    const refunds = await paymentService.getAllRefunds();
    return new ApiResponse(200, refunds, "Refunds fetched successfully.");
  }

  async getAllInvoices(request) {
    const invoices = await paymentService.getAllInvoices();
    return new ApiResponse(200, invoices, "Invoices fetched successfully.");
  }
}

export default new PaymentController();
