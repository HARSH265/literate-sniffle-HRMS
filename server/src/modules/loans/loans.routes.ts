import { Router } from 'express';
import { loansController } from './loans.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createLoanTypeSchema, updateLoanTypeSchema, applyLoanSchema, approveLoanSchema, disburseLoanSchema } from './loans.validation.js';

const router = Router();

router.use(authenticate);

router.get('/loan-types', authorize('view-loans'), loansController.listLoanTypes);
router.get('/loan-types/:id', authorize('view-loans'), loansController.getLoanType);
router.post('/loan-types', authorize('manage-loans'), validate(createLoanTypeSchema), loansController.createLoanType);
router.patch('/loan-types/:id', authorize('manage-loans'), validate(updateLoanTypeSchema), loansController.updateLoanType);
router.delete('/loan-types/:id', authorize('manage-loans'), loansController.deleteLoanType);

router.post('/apply', authorize('apply-loan'), validate(applyLoanSchema), loansController.applyLoan);

router.get('/', authorize('view-loans'), loansController.listLoans);
router.get('/:id', authorize('view-loans'), loansController.getLoan);
router.patch('/:id/approve', authorize('manage-loans'), validate(approveLoanSchema), loansController.approveLoan);
router.patch('/:id/disburse', authorize('manage-loans'), validate(disburseLoanSchema), loansController.disburseLoan);
router.patch('/:id/cancel', authorize('apply-loan'), loansController.cancelLoan);

router.get('/employee/:employeeId/summary', authorize('view-loans'), loansController.getEmployeeLoanSummary);

export default router;
