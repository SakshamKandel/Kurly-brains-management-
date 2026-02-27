"use client";

import { useState } from "react";
import { X, DollarSign, Calculator } from "lucide-react";
import { CURRENCIES } from "@/data/banks";

interface Payee {
    id: string;
    firstName: string;
    lastName: string;
    salaryInfo?: {
        id: string;
        baseSalary: number;
        currency: string;
        payFrequency: string;
        paymentMethod: string;
        type?: string;
        taxDeduction?: number;
        otherDeductions?: number;
        deductionNotes?: string;
    } | null;
}

interface SalaryModalProps {
    payee: Payee;
    onClose: () => void;
    onSave: () => void;
}

export default function SalaryModal({ payee, onClose, onSave }: SalaryModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [baseSalary, setBaseSalary] = useState(payee.salaryInfo?.baseSalary || 0);
    const [currency, setCurrency] = useState(payee.salaryInfo?.currency || "NPR");
    const [payFrequency, setPayFrequency] = useState(payee.salaryInfo?.payFrequency || "MONTHLY");
    const [paymentMethod, setPaymentMethod] = useState(payee.salaryInfo?.paymentMethod || "BANK_TRANSFER");
    const [type, setType] = useState(payee.salaryInfo?.type || "FIXED");
    const [taxDeduction, setTaxDeduction] = useState(payee.salaryInfo?.taxDeduction || 0);
    const [otherDeductions, setOtherDeductions] = useState(payee.salaryInfo?.otherDeductions || 0);
    const [deductionNotes, setDeductionNotes] = useState(payee.salaryInfo?.deductionNotes || "");

    // Calculate net pay
    const netPay = baseSalary - taxDeduction - otherDeductions;

    // Get currency symbol
    const currencyInfo = CURRENCIES.find((c) => c.currency === currency);
    const currencySymbol = currencyInfo?.symbol || currency;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`/api/payees/${payee.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    salaryInfo: {
                        baseSalary,
                        currency,
                        payFrequency,
                        paymentMethod,
                        type,
                        taxDeduction,
                        otherDeductions,
                        deductionNotes: deductionNotes || null,
                    },
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save salary info");
            }

            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "520px",
                    width: "90%",
                    maxHeight: "90vh",
                    overflow: "auto",
                    backgroundColor: "var(--notion-bg)",
                    borderRadius: "10px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    border: "1px solid var(--notion-border)",
                }}
            >
                {/* Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--notion-border)",
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                            <DollarSign size={18} />
                            Salary Information
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--notion-text-muted)" }}>
                            For {payee.firstName} {payee.lastName}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: "6px", color: "var(--notion-text-muted)" }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ padding: "24px" }}>
                        {error && (
                            <div style={{
                                padding: "12px 16px",
                                backgroundColor: "rgba(255, 80, 80, 0.1)",
                                border: "1px solid rgba(255, 80, 80, 0.3)",
                                borderRadius: "6px",
                                color: "var(--notion-red)",
                                marginBottom: "20px",
                                fontSize: "13px",
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Compensation Type & Pay Frequency */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            <div>
                                <label style={labelStyle}>Compensation Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => {
                                        setType(e.target.value);
                                        if (e.target.value === "PROJECT") setPayFrequency("PER_PROJECT");
                                    }}
                                    style={selectStyle}
                                >
                                    <option value="FIXED">Fixed Salary</option>
                                    <option value="PROJECT">Project Based</option>
                                    <option value="HOURLY">Hourly</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Pay Frequency</label>
                                <select
                                    value={payFrequency}
                                    onChange={(e) => setPayFrequency(e.target.value)}
                                    style={selectStyle}
                                >
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="BIWEEKLY">Bi-Weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="QUARTERLY">Quarterly</option>
                                    <option value="PER_PROJECT">Per Project</option>
                                    <option value="ONE_TIME">One Time</option>
                                </select>
                            </div>
                        </div>

                        {/* Base Salary/Rate & Currency */}
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            <div>
                                <label style={labelStyle}>
                                    {type === "PROJECT" ? "Default Project Rate" : type === "HOURLY" ? "Hourly Rate" : "Base Salary"}
                                </label>
                                <div style={{ position: "relative" }}>
                                    <span style={{
                                        position: "absolute",
                                        left: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "var(--notion-text-muted)",
                                        fontSize: "14px",
                                    }}>
                                        {currencySymbol}
                                    </span>
                                    <input
                                        type="number"
                                        value={baseSalary}
                                        onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        style={{ ...inputStyle, paddingLeft: "40px" }}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    style={selectStyle}
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c.currency} value={c.currency}>
                                            {c.currency} ({c.symbol})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={selectStyle}
                            >
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CASH">Cash</option>
                                <option value="CHECK">Check</option>
                                <option value="UPI">UPI</option>
                                <option value="WALLET">Digital Wallet</option>
                            </select>
                        </div>

                        {/* Deductions Section */}
                        <div style={{
                            backgroundColor: "var(--notion-bg-secondary)",
                            border: "1px solid var(--notion-border)",
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "20px",
                        }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 600, color: "var(--notion-text-secondary)" }}>
                                Deductions
                            </h3>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div>
                                    <label style={labelStyle}>Tax Deduction</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={{
                                            position: "absolute",
                                            left: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "var(--notion-text-muted)",
                                            fontSize: "14px",
                                        }}>
                                            {currencySymbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={taxDeduction}
                                            onChange={(e) => setTaxDeduction(parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            style={{ ...inputStyle, paddingLeft: "40px" }}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Other Deductions</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={{
                                            position: "absolute",
                                            left: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "var(--notion-text-muted)",
                                            fontSize: "14px",
                                        }}>
                                            {currencySymbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={otherDeductions}
                                            onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            style={{ ...inputStyle, paddingLeft: "40px" }}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Deduction Notes (Optional)</label>
                                <input
                                    type="text"
                                    value={deductionNotes}
                                    onChange={(e) => setDeductionNotes(e.target.value)}
                                    placeholder="e.g., PF contribution, insurance, etc."
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Net Pay Preview */}
                        <div style={{
                            backgroundColor: "rgba(52, 211, 153, 0.1)",
                            border: "1px solid rgba(52, 211, 153, 0.3)",
                            borderRadius: "8px",
                            padding: "16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Calculator size={16} style={{ color: "var(--notion-green)" }} />
                                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--notion-text-secondary)" }}>Net Pay (per {payFrequency.toLowerCase()})</span>
                            </div>
                            <div style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                fontFamily: "var(--font-mono)",
                                color: "var(--notion-green)",
                            }}>
                                {currencySymbol} {netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px",
                        padding: "16px 24px",
                        borderTop: "1px solid var(--notion-border)",
                        backgroundColor: "var(--notion-bg-secondary)",
                        borderBottomLeftRadius: "10px",
                        borderBottomRightRadius: "10px",
                    }}>
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading || baseSalary <= 0}>
                            {loading ? "Saving..." : "Save Salary Info"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--notion-text-muted)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid var(--notion-border)",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "var(--notion-text)",
    outline: "none",
    transition: "border-color 0.1s ease",
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    backgroundColor: "var(--notion-bg)",
};
