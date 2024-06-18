import { Router, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Controller from "@/utils/interfaces/controller.interface";
import { logger } from "@/utils/logger/logger";
import {
  requestValidateBodyParams,
  requestValidateQueryParams,
} from "@/utils/zod/requestValidator";

import assignmentService from "../services/assignment.service";
import getContactDataSchema from "../validation/assignment.validation";
class assignmentController {
  private assignmentServices: assignmentService; // Define draftServices as an instance variable
  constructor() {
    this.assignmentServices = new assignmentService(); // Initialize draftServices in the constructor
    this.inspect = this.inspect.bind(this);
  }
  public async inspect(req: Request, res: Response) {
    const validateBodyParams = requestValidateBodyParams(
      req.body,
      getContactDataSchema
    );
    if (!validateBodyParams.success) {
      logger.error(validateBodyParams.errors[0]);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: validateBodyParams.errors[0] });
    }

    try {
      let result = await this.assignmentServices.inspect(
        validateBodyParams.object
      );
      return res.status(StatusCodes.OK).json({
        messsage: result,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}

export default assignmentController;
