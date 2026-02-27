"use client";

import { useState } from "react";
import { X, Wallet, Calendar, Calculator, Gift, MinusCircle } from "lucide-react";

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
        taxDeduction?: number;
        otherDeductions?: number;
    } | null;
}

interface PaymentModalProps {
    payee: Payee;
    onClose: () => void;
    onSave: () => void;
}

export default function PaymentModal({ payee, onClose, onSave }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const salary = payee.salaryInfo;
    const currency = salary?.currency || "NPR";

    // Form state
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
    const [payPeriodStart, setPayPeriodStart] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split("T")[0];
    });
    const [payPeriodEnd, setPayPeriodEnd] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date.toISOString().split("T")[0];
    });
    const [baseSalary, setBaseSalary] = useState(salary?.baseSalary || 0);
    const [bonuses, setBonuses] = useState(0);
    const [deductions, setDeductions] = useState(
        (salary?.taxDeduction || 0) + (salary?.otherDeductions || 0)
    );
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("PENDING");

    // Calculate net pay
    const netPay = baseSalary + bonuses - deductions;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payeeId: payee.id,
                    paymentDate,
                    payPeriodStart,
                    payPeriodEnd,
                    baseSalary,
                    deductions,
                    bonuses,
                    notes: notes || null,
                    status,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create payment");
            }

            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!salary) {
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
                        maxWidth: "400px",
                        width: "90%",
                        padding: "32px",
                        textAlign: "center",
                        backgroundColor: "var(--notion-bg)",
                        borderRadius: "10px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        border: "1px solid var(--notion-border)",
                    }}
                >
                    <X size={48} style={{ color: "var(--notion-red)", marginBottom: "16px", opacity: 0.8 }} />
                    <h2 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600 }}>No Salary Info</h2>
                    <p style={{ color: "var(--notion-text-muted)", marginBottom: "20px", fontSize: "14px" }}>
                        Please set up salary information for {payee.firstName} before creating a payment.
                    </p>
                    <button onClick={onClose} className="btn-primary">
                        Close
                    </button>
                </div>
            </div>
        );
    }

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
                    maxWidth: "560px",
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
                            <Wallet size={18} />
                            Create Payment
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

                        {/* Pay Period */}
                        <div style={{
                            backgroundColor: "var(--notion-bg-secondary)",
                            border: "1px solid var(--notion-border)",
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "20px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                                <Calendar size={14} style={{ color: "var(--notion-text-muted)" }} />
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--notion-text-secondary)", textTransform: "uppercase" }}>Pay Period</span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={labelStyle}>Start Date</label>
                                    <input
                                        type="date"
                                        value={payPeriodStart}
                                        onChange={(e) => setPayPeriodStart(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>End Date</label>
                                    <input
                                        type="date"
                                        value={payPeriodEnd}
                                        onChange={(e) => setPayPeriodEnd(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Payment Date</label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Earnings */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Base Salary ({currency})</label>
                            <input
                                type="number"
                                value={baseSalary}
                                onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                                style={inputStyle}
                                min="0"
                                step="0.01"
                                required
                            />
                            <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", marginTop: "4px" }}>
                                Default from salary info: {currency} {salary.baseSalary.toLocaleString()}
                            </div>
                        </div>

                        {/* Bonuses & Deductions */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            <div>
                                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "6px" }}>
                                    Bonuses ({currency})
                                </label>
                                <div style={{ position: "relative" }}>
                                    <Gift size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--notion-green)" }} />
                                    <input
                                        type="number"
                                        value={bonuses}
                                        onChange={(e) => setBonuses(parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        style={{ ...inputStyle, paddingLeft: "32px" }}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "6px" }}>
                                    Deductions ({currency})
                                </label>
                                <div style={{ position: "relative" }}>
                                    <MinusCircle size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--notion-red)" }} />
                                    <input
                                        type="number"
                                        value={deductions}
                                        onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
                                        style={{ ...inputStyle, paddingLeft: "32px" }}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Payment Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                style={selectStyle}
                            >
                                <option value="PENDING">Pending</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes for this payment..."
                                style={{ ...inputStyle, minHeight: "80px", resize: "vertical", fontFamily: "inherit" }}
                            />
                        </div>

                        {/* Net Pay Preview */}
                        <div style={{
                            backgroundColor: netPay >= 0 ? "rgba(52, 211, 153, 0.1)" : "rgba(255, 80, 80, 0.1)",
                            border: `1px solid ${netPay >= 0 ? "rgba(52, 211, 153, 0.3)" : "rgba(255, 80, 80, 0.3)"}`,
                            borderRadius: "8px",
                            padding: "20px",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Calculator size={16} style={{ color: netPay >= 0 ? "var(--notion-green)" : "var(--notion-red)" }} />
                                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--notion-text-secondary)" }}>Payment Summary</span>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--notion-text-muted)" }}>Base Salary</span>
                                    <span style={{ fontFamily: "var(--font-mono)" }}>{currency} {baseSalary.toLocaleString()}</span>
                                </div>
                                {bonuses > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--notion-green)" }}>
                                        <span>+ Bonuses</span>
                                        <span style={{ fontFamily: "var(--font-mono)" }}>{currency} {bonuses.toLocaleString()}</span>
                                    </div>
                                )}
                                {deductions > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--notion-red)" }}>
                                        <span>- Deductions</span>
                                        <span style={{ fontFamily: "var(--font-mono)" }}>{currency} {deductions.toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={{ borderTop: "1px solid var(--notion-border)", paddingTop: "8px", marginTop: "4px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 600 }}>
                                        <span>Net Pay</span>
                                        <span style={{
                                            fontFamily: "var(--font-mono)",
                                            color: netPay >= 0 ? "var(--notion-green)" : "var(--notion-red)",
                                        }}>
                                            {currency} {netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
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
                        <button type="submit" className="btn-primary" disabled={loading || netPay <= 0}>
                            {loading ? "Creating..." : "Create Payment"}
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
