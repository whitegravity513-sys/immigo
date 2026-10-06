import { ApiError } from "../utils/apiError.js";

export const validateExpense = (req, res, next) => {
  const { amount, date, name } = req.body;
  const errors = [];

  if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    errors.push("A valid expense amount greater than 0 is required");
  }

  if (!date) {
    errors.push("Expense date is required");
  }

  if (!name || !name.trim()) {
    errors.push("Expense title or name is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export default {
  validateExpense,
};
