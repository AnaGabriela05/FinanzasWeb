const { sequelize } = require('./models');

const CategoryRepository = require('./repositories/CategoryRepository');
const PaymentMethodRepository = require('./repositories/PaymentMethodRepository');
const TransactionRepository = require('./repositories/TransactionRepository');
const BudgetRepository = require('./repositories/BudgetRepository');
const ReportRepository = require('./repositories/ReportRepository');

const CategoryDependencyResolver = require('./domain/resolvers/CategoryDependencyResolver');
const PaymentMethodDependencyResolver = require('./domain/resolvers/PaymentMethodDependencyResolver');
const FinancialHealthAnalyzer = require('./domain/analyzers/FinancialHealthAnalyzer');
const ExcelReportExporter = require('./domain/exporters/ExcelReportExporter');
const PdfReportExporter = require('./domain/exporters/PdfReportExporter');

const CategoryService = require('./services/CategoryService');
const PaymentMethodService = require('./services/PaymentMethodService');
const TransactionService = require('./services/TransactionService');
const BudgetService = require('./services/BudgetService');
const ReportService = require('./services/ReportService');
const AuthService = require('./services/AuthService');

const CategoryController = require('./controllers/classes/CategoryController');
const PaymentMethodController = require('./controllers/classes/PaymentMethodController');
const TransactionController = require('./controllers/classes/TransactionController');
const BudgetController = require('./controllers/classes/BudgetController');
const ReportController = require('./controllers/classes/ReportController');
const AuthController = require('./controllers/classes/AuthController');

const categoryRepository = new CategoryRepository();
const paymentMethodRepository = new PaymentMethodRepository();
const transactionRepository = new TransactionRepository();
const budgetRepository = new BudgetRepository();
const reportRepository = new ReportRepository(transactionRepository);

const categoryDependencyResolver = new CategoryDependencyResolver({
  transactionRepository,
  budgetRepository,
  sequelize
});
const paymentMethodDependencyResolver = new PaymentMethodDependencyResolver({
  transactionRepository
});
const financialHealthAnalyzer = new FinancialHealthAnalyzer();
const excelReportExporter = new ExcelReportExporter();
const pdfReportExporter = new PdfReportExporter();

const categoryService = new CategoryService({
  categoryRepository,
  categoryDependencyResolver
});
const paymentMethodService = new PaymentMethodService({
  paymentMethodRepository,
  paymentMethodDependencyResolver
});
const transactionService = new TransactionService({
  transactionRepository,
  categoryRepository,
  paymentMethodRepository
});
const budgetService = new BudgetService({
  budgetRepository,
  categoryRepository
});
const reportService = new ReportService({
  reportRepository,
  financialHealthAnalyzer,
  excelReportExporter,
  pdfReportExporter
});
const authService = new AuthService();

module.exports = {
  authController: new AuthController(authService),
  categoryController: new CategoryController(categoryService),
  paymentMethodController: new PaymentMethodController(paymentMethodService),
  transactionController: new TransactionController(transactionService),
  budgetController: new BudgetController(budgetService),
  reportController: new ReportController(reportService)
};
