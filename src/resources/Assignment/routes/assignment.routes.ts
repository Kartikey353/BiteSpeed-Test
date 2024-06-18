import { Router, Request, Response } from "express";
import assignmentController from "../controllers/assignment.controllers";

class asignmentRoutes {
  public path = "/inspect";
  public router = Router();
  private assignment = new assignmentController();
  constructor() {
    this.initialiseRoutes();
  }
  private initialiseRoutes(): void {
    this.router.post(`${this.path}`, this.assignment.inspect);
  }
}
export default asignmentRoutes;
