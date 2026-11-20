"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  FileCheck,
  Brain,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  Scale,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/shared/Cards";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Typography";
import { VerificationStatus } from "@/components/shared/AIComponents";
import { useSmartSaveStore } from "@/store/use-smartsave-store";
import { IS_DEMO } from "@/lib/demo";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { staggerContainer } from "@/lib/animations";

export default function DocumentUploadPage() {
  const router = useRouter();
  const { currentVerificationRequest, uploadProofDocument } = useSmartSaveStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [resultType, setResultType] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [resultReasoning, setResultReasoning] = useState("");
  const [resultCategory, setResultCategory] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  // Snapshot the request amount/id BEFORE the store clears currentVerificationRequest on success
  const [snapshotAmount, setSnapshotAmount] = useState<number>(0);
  const [snapshotId, setSnapshotId] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const runVerification = async () => {
    if (!selectedFile || !currentVerificationRequest) return;

    // Snapshot the request data NOW — the store will clear it after a successful decide call
    const reqAmount = currentVerificationRequest.amount;
    const reqId = currentVerificationRequest.id;
    setSnapshotAmount(reqAmount);
    setSnapshotId(reqId);

    setIsVerifying(true);
    setCurrentStepIndex(0);
    setApiError(null);

    // Show OCR step animation (0.8s before we know)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCurrentStepIndex(1);

    const result = await uploadProofDocument(selectedFile);
    setCurrentStepIndex(2);
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (result) {
      setResultReasoning(result.reasoning || result.ai?.reason || "Check complete.");
      setResultCategory(result.ai?.category || "");
      setResultType(result.status);
    } else {
      // No silent fake result: if the check fails, say so and leave the money where it is.
      setApiError("The document could not be checked. Your money was not moved. Please try again.");
      setCurrentStepIndex(0);
    }
    setIsVerifying(false);
  };

  // Step definition for status animations
  const simulationSteps = [
    {
      id: "ocr",
      label: "Read the document",
      description: selectedFile ? `Reading "${selectedFile.name}"` : "Reading document text",
      icon: FileText,
      status: currentStepIndex > 0 ? ("completed" as const) : currentStepIndex === 0 ? ("active" as const) : ("pending" as const),
    },
    {
      id: "ai",
      label: "Classify the expense",
      description: "Classifying expense as essential/non-essential",
      icon: Brain,
      status: currentStepIndex > 1 ? ("completed" as const) : currentStepIndex === 1 ? ("active" as const) : ("pending" as const),
    },
    {
      id: "decision",
      label: "Decision",
      description: "Applying smart money rules",
      icon: Scale,
      status: resultType !== null ? ("completed" as const) : currentStepIndex === 2 ? ("active" as const) : ("pending" as const),
    },
  ];

  // ── Show "No Active Request" only when there's no result yet ──────
  if (!currentVerificationRequest && resultType === null) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <AlertCircle size={40} className="text-text-tertiary" />
        <div>
          <h2 className="text-lg font-bold text-text-primary">No Active Request</h2>
          <p className="text-sm text-text-secondary mt-1">Please initiate a withdrawal request first.</p>
        </div>
        <Link href="/savings/strict/withdraw" className="mt-2">
          <Button variant="primary">Go to Withdraw</Button>
        </Link>
      </div>
    );
  }

  if (resultType !== null) {
    const isApproved = resultType === "APPROVED";

    return (
      <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[80vh] text-center gap-6">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center",
            isApproved
              ? "bg-success/20 text-success ring-4 ring-success/20"
              : "bg-error/20 text-error ring-4 ring-error/20"
          )}
        >
          {isApproved ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className={cn(
            "text-2xl font-semibold tracking-tight",
            isApproved ? "text-success" : "text-error"
          )}>
            {isApproved ? "Withdrawal approved" : "Withdrawal blocked"}
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            {isApproved
              ? "Your money has been transferred back to your Main Wallet."
              : "This bill looks like non-essential spending, so the money stays locked."}
          </p>
        </motion.div>

        {/* Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-sm"
        >
          <GlassCard
            padding="lg"
            className={cn(
              "border",
              isApproved ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"
            )}
          >
            <div className="flex flex-col gap-3">
              {/* Amount */}
              <div className="text-center pb-3 border-b border-white/5">
                <p className="text-2xs text-text-tertiary uppercase tracking-wider font-semibold">Amount</p>
                <p className={cn(
                  "text-4xl font-extrabold number-font mt-1",
                  isApproved ? "text-success" : "text-error"
                )}>
                  {formatCurrency(snapshotAmount || (currentVerificationRequest?.amount ?? 0))}
                </p>
              </div>

              {/* Badge + Category */}
              <div className="flex justify-center gap-2">
                <Badge variant={isApproved ? "success" : "error"}>
                  {isApproved ? "Essential" : "Non-essential"}
                </Badge>
                {resultCategory && (
                  <Badge variant="ai">{resultCategory}</Badge>
                )}
              </div>

              {/* AI Reasoning */}
              <p className="text-xs text-text-secondary bg-bg-surface/60 p-3 rounded-xl leading-relaxed border border-border-subtle text-left">
                <span className="font-semibold text-text-primary block mb-1">Why:</span>
                {resultReasoning || (
                  isApproved
                    ? "Document verified as an essential expense. Funds transferred to your wallet."
                    : "Document classified as non-essential spending. Withdrawal blocked to protect your savings."
                )}
              </p>

              {/* What happened */}
              <div className={cn(
                "flex items-start gap-2 p-3 rounded-xl text-xs",
                isApproved ? "bg-success/10 text-success" : "bg-error/10 text-error"
              )}>
                {isApproved
                  ? <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                  : <XCircle size={14} className="flex-shrink-0 mt-0.5" />}
                <span>
                  {isApproved
                    ? `${formatCurrency(snapshotAmount)} has been moved from Protected Savings to your Main Wallet.`
                    : `The ${formatCurrency(snapshotAmount)} withdrawal was blocked. Your savings remain protected.`}
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col gap-3 w-full max-w-sm"
        >
          <Link href={isApproved ? "/wallet" : "/savings/strict"} className="w-full">
            <Button className="w-full" variant="primary" size="lg">
              {isApproved ? "View Main Wallet" : "Back to strict savings"}
            </Button>
          </Link>
          {!isApproved && (
            <Link href="/savings/strict/withdraw" className="w-full">
              <Button className="w-full" variant="ghost" size="lg">
                Try Again with Different Document
              </Button>
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[80vh] gap-8">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary-light mx-auto mb-4"
          >
            <Brain size={28} />
          </motion.div>
          <h1 className="text-xl font-bold text-text-primary">Checking your document</h1>
          <p className="text-xs text-text-tertiary mt-1">Analyzing expense validity in real-time</p>
        </div>

        <GlassCard padding="md" className="w-full max-w-sm border border-border-subtle bg-bg-surface/50">
          <VerificationStatus steps={simulationSteps} />
        </GlassCard>

        <p className="text-2xs text-text-tertiary animate-pulse">This usually takes around 3 seconds...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="px-4 py-4 flex flex-col gap-6"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-1">
        <Link
          href="/savings/strict/withdraw"
          className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary"
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Upload a bill</h1>
          <p className="text-xs text-text-tertiary">Show what the money is for</p>
        </div>
      </div>

      {/* ── Request Details ─────────────────────────────────────── */}
      <GlassCard padding="sm" className="border border-border-subtle bg-bg-surface/50 flex justify-between items-center">
        <div>
          <p className="text-3xs text-text-tertiary uppercase tracking-wider font-semibold">Verification Request</p>
          <p className="text-lg font-bold text-text-primary number-font mt-0.5">
            {formatCurrency(currentVerificationRequest?.amount ?? 0)}
          </p>
        </div>
      </GlassCard>

      {/* ── Dropzone area ───────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">
          Select or Drop Document
        </p>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
          className={cn(
            "border-2 border-dashed border-border-default rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:border-accent-primary hover:bg-accent-primary/5 transition-all duration-200",
            selectedFile && "border-accent-primary bg-accent-primary/5"
          )}
        >
          <input
            id="file-input"
            type="file"
            accept={IS_DEMO ? "image/*,application/pdf,.txt,text/plain" : "image/*,application/pdf"}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-text-secondary">
            {selectedFile ? <FileCheck className="text-accent-primary-light" /> : <Upload />}
          </div>

          <div>
            {selectedFile ? (
              <>
                <p className="text-sm font-semibold text-text-primary">{selectedFile.name}</p>
                <p className="text-2xs text-text-tertiary mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Tap to replace
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-primary">Drag & drop receipt/bill</p>
                <p className="text-2xs text-text-tertiary mt-0.5">
                  {IS_DEMO
                    ? "Demo: try a sample bill from the repo's demo/ folder (.txt), or any file whose name describes the bill"
                    : "Supports JPG, PNG, PDF up to 10MB"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Branded Info Box ────────────────────────────────────── */}
      <GlassCard padding="sm" className="border border-border-subtle bg-bg-surface/30">
        <h4 className="text-xs font-semibold text-text-secondary mb-1">What gets approved</h4>
        <ul className="list-disc pl-4 text-2xs text-text-tertiary space-y-1 mt-1.5">
          <li>Approved: medical, rent, school fees, utilities, insurance, groceries, transport, repairs.</li>
          <li>Blocked: dining out, gaming, streaming, shopping, travel, luxury items.</li>
          <li>If the bill is blocked, the money stays in strict savings.</li>
        </ul>
      </GlassCard>

      {apiError && (
        <p role="alert" className="text-xs text-error text-center">{apiError}</p>
      )}

      <Button
        disabled={!selectedFile}
        onClick={runVerification}
        variant="primary"
        size="lg"
        className="w-full mt-2"
        leftIcon={<Brain size={18} />}
      >
        Check document
      </Button>
    </motion.div>
  );
}
