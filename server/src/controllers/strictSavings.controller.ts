import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { StrictSavingsService } from "@/services/strictSavings.service";
import { ValidationError, ServiceUnavailableError } from "@/utils/errors";
import { logger } from "@/config/logger";

export class StrictSavingsController {
  public static async getStrict(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const account = await StrictSavingsService.getStrictAccount(userId);
      res.status(200).json({
        status: "success",
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deposit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { amount } = req.body;
      const account = await StrictSavingsService.deposit(userId, amount);
      res.status(200).json({
        status: "success",
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async withdraw(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { amount } = req.body;
      const result = await StrictSavingsService.initiateWithdrawal(userId, amount);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async uploadProof(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { requestId } = req.body;
      const file = req.file;

      if (!requestId) {
        throw new ValidationError("requestId is required");
      }
      if (!file) {
        throw new ValidationError("Proof document file is required");
      }

      const request = await StrictSavingsService.uploadProof(requestId, userId, {
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
      });

      // 1. OCR service reads the document.
      let ocrResponse: any;
      try {
        const formData = new URLSearchParams();
        formData.append("file_path", file.path);
        formData.append("default_amount", request.amount.toString());
        formData.append("original_name", file.originalname);
        const ocrRes = await fetch("http://localhost:5001/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });
        if (!ocrRes.ok) throw new Error(`OCR service returned ${ocrRes.status}`);
        ocrResponse = await ocrRes.json();
      } catch (ocrErr) {
        logger.error(ocrErr, "OCR service unavailable");
        throw new ServiceUnavailableError("Could not read the document right now. Your money was not moved. Please try again.");
      }

      // 2. If no text could be read, the withdrawal is not approved.
      let aiResponse: any;
      if (!ocrResponse.success) {
        aiResponse = {
          approved: false,
          essential: false,
          category: "Unreadable",
          confidence: 0,
          reason: "No readable text was found in the document, so the expense could not be verified.",
          model: "none",
        };
      } else {
        // 3. AI service classifies the expense (Gemini, or its own keyword rules if no API key).
        try {
          const aiRes = await fetch("http://localhost:5002/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rawText: ocrResponse.rawText || "",
              merchant: ocrResponse.fields?.merchant || "Unknown Merchant",
              date: ocrResponse.fields?.date || new Date().toISOString().split("T")[0],
              amount: ocrResponse.fields?.amount || request.amount.toString(),
              confidence: ocrResponse.confidence || 0.9,
              pages: ocrResponse.pages || 1,
              fields: ocrResponse.fields,
            }),
          });
          if (!aiRes.ok) throw new Error(`AI service returned ${aiRes.status}`);
          aiResponse = await aiRes.json();
          logger.info(`AI verification — approved: ${aiResponse.approved}, category: ${aiResponse.category}, model: ${aiResponse.model}`);
        } catch (aiErr) {
          logger.error(aiErr, "AI service unavailable");
          throw new ServiceUnavailableError("Could not check the document right now. Your money was not moved. Please try again.");
        }
      }

      // 4. The server makes the decision. The client never chooses the outcome.
      const decided = await StrictSavingsService.decideRequest(
        requestId,
        userId,
        aiResponse.approved ? "APPROVED" : "REJECTED",
        aiResponse.reason
      );

      res.status(200).json({
        status: "success",
        data: {
          request: { ...decided, documentUrl: undefined },
          ocr: ocrResponse,
          ai: aiResponse,
          decision: decided.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async decideRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { requestId, status, reasoning } = req.body;

      if (!requestId || !status) {
        throw new ValidationError("requestId and status are required");
      }

      // Approval only ever comes from the document check in uploadProof.
      // The client may only cancel (reject) its own pending request.
      if (status !== "REJECTED") {
        throw new ValidationError("Only REJECTED (cancel) is allowed here; approval comes from the document check.");
      }

      const request = await StrictSavingsService.decideRequest(requestId, userId, status, reasoning);
      res.status(200).json({
        status: "success",
        data: { request },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateThreshold(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { amount } = req.body;
      const account = await StrictSavingsService.updateThreshold(userId, amount);
      res.status(200).json({
        status: "success",
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }
}
