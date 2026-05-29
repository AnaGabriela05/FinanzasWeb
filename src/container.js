const { sequelize } = require('./models');
const authConfig = require('./config/auth');

const CategoryRepository = require('./repositories/CategoryRepository');
const PaymentMethodRepository = require('./repositories/PaymentMethodRepository');
const TransactionRepository = require('./repositories/TransactionRepository');
const BudgetRepository = require('./repositories/BudgetRepository');
const ReportRepository = require('./repositories/ReportRepository');
const UserRepository = require('./repositories/UserRepository');
const LearningStateRepository = require('./repositories/LearningStateRepository');
const ExportLogRepository = require('./repositories/ExportLogRepository');
const ConsejoIaRepository = require('./repositories/ConsejoIaRepository');
const QuizQuestionRepository = require('./repositories/QuizQuestionRepository');
const QuizAttemptRepository = require('./repositories/QuizAttemptRepository');
const QuizAnswerRepository = require('./repositories/QuizAnswerRepository');
const AdminRepository = require('./repositories/AdminRepository');

const CategoryDependencyResolver = require('./domain/resolvers/CategoryDependencyResolver');
const PaymentMethodDependencyResolver = require('./domain/resolvers/PaymentMethodDependencyResolver');
const FinancialHealthAnalyzer = require('./domain/analyzers/FinancialHealthAnalyzer');
const ExcelReportExporter = require('./domain/exporters/ExcelReportExporter');
const PdfReportExporter = require('./domain/exporters/PdfReportExporter');
const PasswordHasher = require('./domain/auth/PasswordHasher');
const TokenIssuer = require('./domain/auth/TokenIssuer');
const LoginAttemptPolicy = require('./domain/auth/LoginAttemptPolicy');
const MockAdvisor = require('./domain/ai/MockAdvisor');
const OpenAiAdvisor = require('./domain/ai/OpenAiAdvisor');
const LevelCalculator = require('./domain/quiz/LevelCalculator');

const CategoryService = require('./services/CategoryService');
const PaymentMethodService = require('./services/PaymentMethodService');
const TransactionService = require('./services/TransactionService');
const BudgetService = require('./services/BudgetService');
const ReportService = require('./services/ReportService');
const AuthService = require('./services/AuthService');
const LearningService = require('./services/LearningService');
const AdviceService = require('./services/AdviceService');
const QuizService = require('./services/QuizService');
const AdminService = require('./services/AdminService');

const CategoryController = require('./controllers/classes/CategoryController');
const PaymentMethodController = require('./controllers/classes/PaymentMethodController');
const TransactionController = require('./controllers/classes/TransactionController');
const BudgetController = require('./controllers/classes/BudgetController');
const ReportController = require('./controllers/classes/ReportController');
const AuthController = require('./controllers/classes/AuthController');
const LearningController = require('./controllers/classes/LearningController');
const AdviceController = require('./controllers/classes/AdviceController');
const QuizController = require('./controllers/classes/QuizController');
const AdminController = require('./controllers/classes/AdminController');

const categoryRepository = new CategoryRepository();
const paymentMethodRepository = new PaymentMethodRepository();
const transactionRepository = new TransactionRepository();
const budgetRepository = new BudgetRepository();
const reportRepository = new ReportRepository(transactionRepository);
const userRepository = new UserRepository();
const learningStateRepository = new LearningStateRepository();
const exportLogRepository = new ExportLogRepository();
const consejoIaRepository = new ConsejoIaRepository();
const quizQuestionRepository = new QuizQuestionRepository();
const quizAttemptRepository = new QuizAttemptRepository();
const quizAnswerRepository = new QuizAnswerRepository();
const adminRepository = new AdminRepository();

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
const passwordHasher = new PasswordHasher({ rounds: authConfig.passwordHashRounds });
const tokenIssuer = new TokenIssuer(authConfig.jwt);
const loginAttemptPolicy = new LoginAttemptPolicy({
  userRepository,
  maxAttempts: authConfig.loginAttempts.maxAttempts,
  lockMinutes: authConfig.loginAttempts.lockMinutes
});

// Seleccion automatica del advisor: usa OpenAI si hay API key configurada,
// si no, degrada a Mock con consejos pre-armados segun nivel de salud financiera.
const advisor = process.env.OPENAI_API_KEY
  ? new OpenAiAdvisor({ apiKey: process.env.OPENAI_API_KEY })
  : new MockAdvisor();

const levelCalculator = new LevelCalculator();

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
  categoryRepository,
  paymentMethodRepository,
  budgetRepository,
  exportLogRepository,
  financialHealthAnalyzer,
  excelReportExporter,
  pdfReportExporter
});
const authService = new AuthService({
  userRepository,
  passwordHasher,
  tokenIssuer,
  loginAttemptPolicy
});
const learningService = new LearningService({ learningStateRepository });
const adviceService = new AdviceService({
  consejoIaRepository,
  financialHealthAnalyzer,
  transactionRepository,
  categoryRepository,
  budgetRepository,
  advisor
});
const quizService = new QuizService({
  quizQuestionRepository,
  quizAttemptRepository,
  quizAnswerRepository,
  levelCalculator,
  sequelize
});
const adminService = new AdminService({
  adminRepository,
  categoryRepository,
  categoryDependencyResolver,
  sequelize
});

module.exports = {
  authController: new AuthController(authService),
  categoryController: new CategoryController(categoryService),
  paymentMethodController: new PaymentMethodController(paymentMethodService),
  transactionController: new TransactionController(transactionService),
  budgetController: new BudgetController(budgetService),
  reportController: new ReportController(reportService),
  learningController: new LearningController(learningService),
  adviceController: new AdviceController(adviceService),
  quizController: new QuizController(quizService),
  adminController: new AdminController(adminService),
  // Repositorios expuestos para scripts puntuales (seed).
  quizQuestionRepository
};
