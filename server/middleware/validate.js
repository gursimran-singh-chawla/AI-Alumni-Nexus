import { validationResult } from "express-validator";

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    message: "Validation failed",
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
  });
};

export const parsePagination = (req, _res, next) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};
