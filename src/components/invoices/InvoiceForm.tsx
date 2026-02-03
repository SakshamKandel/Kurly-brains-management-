"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Printer, User, Calendar, FileText, AlertCircle, Hash, Mail, MapPin } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

interface InvoiceFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function InvoiceForm({ initialData, isEditing = false }: InvoiceFormProps) {
    const router = useRouter();

    // Client Info (Manual Entry)
    const [clientName, setClientName] = useState(initialData?.client?.name || initialData?.clientName || "");
    const [clientEmail, setClientEmail] = useState(initialData?.client?.email || initialData?.clientEmail || "");
    const [clientAddress, setClientAddress] = useState(initialData?.client?.address || initialData?.clientAddress || "");

    // Billed By Info
    const [billedByName, setBilledByName] = useState(initialData?.billedByName || "");
    const [billedByPosition, setBilledByPosition] = useState(initialData?.billedByPosition || "");

    // Form State
    const [issueDate, setIssueDate] = useState(
        initialData?.issueDate
            ? new Date(initialData.issueDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [dueDate, setDueDate] = useState(
        initialData?.dueDate
            ? new Date(initialData.dueDate).toISOString().split('T')[0]
            : ""
    );
    const [taxRate, setTaxRate] = useState(
        initialData?.taxRate
            ? initialData.taxRate * 100
            : 0
    );

    const [items, setItems] = useState<InvoiceItem[]>(
        initialData?.items && initialData.items.length > 0
            ? initialData.items.map((i: any) => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice
            }))
            : [{ description: "", quantity: 1, unitPrice: 0 }]
    );
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState("");

    // Status - only relevant for editing, defaulting to DRAFT/PENDING transition logic could be added here
    // For now we just pass 'DRAFT' or 'PENDING' based on button click if new, or keep status if editing?
    // Let's allow saving as DRAFT explicitly.

    // Calculations
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const handleAddItem = () => {
        setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...items];
        if (field === 'description') {
            newItems[index][field] = value as string;
        } else {
            newItems[index][field] = Number(value) || 0;
        }
        setItems(newItems);
    };

    const validateForm = (): boolean => {
        if (!clientName.trim()) {
            setValidationError("Please enter client name");
            return false;
        }
        if (items.every(item => !item.description.trim())) {
            setValidationError("Please add at least one item");
            return false;
        }
        setValidationError("");
        return true;
    };

    const handleSave = async (status: string = "DRAFT") => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const url = isEditing ? `/api/invoices/${initialData.id}` : "/api/invoices";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientName,
                    clientEmail,
                    clientAddress,
                    issueDate,
                    dueDate: dueDate || null,
                    items: items.filter(item => item.description.trim()),
                    status: isEditing ? status /* keep existing or update? rely on func arg */ : status,
                    notes,
                    billedByName,
                    billedByPosition,
                    taxRate: taxRate / 100
                })
            });

            if (res.ok) {
                router.push("/dashboard/invoices");
                router.refresh();
            } else {
                const data = await res.json();
                setValidationError(data.error || "Failed to save invoice");
            }
        } catch (e) {
            console.error(e);
            setValidationError("Network error. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fade-in" style={{ minHeight: "100vh", backgroundColor: "var(--notion-bg)" }}>

            {/* Clean Professional Header */}
            <div
                className="no-print invoice-header"
                style={{
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    borderBottom: "1px solid var(--notion-divider)",
                    backgroundColor: "var(--notion-bg-secondary)"
                }}
            >
                <Link href="/dashboard/invoices" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                    color: "var(--notion-text-secondary)",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    transition: "all 0.1s ease"
                }}>
                    <ArrowLeft size={14} />
                    Back
                </Link>

                <div style={{
                    height: "20px",
                    width: "1px",
                    backgroundColor: "var(--notion-divider)"
                }} />

                <h1 style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    margin: 0,
                    color: "var(--notion-text)",
                    flex: 1
                }}>
                    {isEditing ? "Edit Invoice" : "New Invoice"}
                </h1>

                {validationError && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--notion-red)",
                        fontSize: "12px",
                        padding: "6px 12px",
                        backgroundColor: "var(--notion-red-bg)",
                        borderRadius: "6px"
                    }}>
                        <AlertCircle size={12} />
                        {validationError}
                    </div>
                )}

                <button onClick={() => window.print()} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }}>
                    <Printer size={14} />
                    Print
                </button>

                {/* Save Options */}
                <button
                    onClick={() => handleSave("DRAFT")}
                    disabled={isSaving}
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                    <Save size={14} />
                    {isSaving ? "Saving..." : "Save Draft"}
                </button>

                <button
                    onClick={() => handleSave("COMPLETED")}
                    disabled={isSaving}
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                    <FileText size={14} />
                    {isSaving ? "Saving..." : "Save as Completed"}
                </button>
            </div>

            {/* Main Content - Split Layout */}
            <div className="invoice-layout" style={{
                display: "grid",
                gridTemplateColumns: "340px 1fr",
                gap: "0",
                minHeight: "calc(100vh - 56px)"
            }}>

                {/* LEFT PANEL - Form */}
                <div className="no-print invoice-sidebar" style={{
                    padding: "20px",
                    borderRight: "1px solid var(--notion-divider)",
                    backgroundColor: "var(--notion-bg-secondary)",
                    overflowY: "auto",
                    maxHeight: "calc(100vh - 56px)"
                }}>
                    {/* Client Section */}
                    <div style={{ marginBottom: "24px" }}>
                        <div style={sectionTitleStyle}>Client Details</div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={labelStyle}>
                                <User size={11} />
                                Name *
                            </label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Client name"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={labelStyle}>
                                <Mail size={11} />
                                Email
                            </label>
                            <input
                                type="email"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                placeholder="client@example.com"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <MapPin size={11} />
                                Address
                            </label>
                            <textarea
                                value={clientAddress}
                                onChange={(e) => setClientAddress(e.target.value)}
                                placeholder="Street, City, Country"
                                rows={2}
                                style={{ ...inputStyle, resize: "none" }}
                            />
                        </div>
                    </div>

                    {/* Invoice Details Section */}
                    <div style={{ marginBottom: "24px" }}>
                        <div style={sectionTitleStyle}>Invoice Details</div>

                        <div className="responsive-grid-2" style={{ gap: "10px", marginBottom: "12px" }}>
                            <div>
                                <label style={labelStyle}>
                                    <Calendar size={11} />
                                    Issue Date
                                </label>
                                <input
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    <Calendar size={11} />
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <Hash size={11} />
                                Tax Rate (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={taxRate}
                                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                                style={{ ...inputStyle, width: "100px" }}
                            />
                        </div>
                    </div>

                    {/* Line Items Section */}
                    <div style={{ marginBottom: "24px" }}>
                        <div style={sectionTitleStyle}>Line Items</div>

                        {items.map((item, index) => (
                            <div key={index} style={{
                                backgroundColor: "var(--notion-bg-tertiary)",
                                borderRadius: "6px",
                                padding: "10px",
                                marginBottom: "8px"
                            }}>
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                    placeholder="Description"
                                    style={{ ...inputStyle, marginBottom: "8px", fontSize: "13px" }}
                                />
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                        style={{ ...inputStyle, width: "50px", textAlign: "center", fontSize: "13px" }}
                                    />
                                    <span style={{ color: "var(--notion-text-muted)", fontSize: "12px" }}>×</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unitPrice || ""}
                                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                                        placeholder="0.00"
                                        style={{ ...inputStyle, flex: 1, fontSize: "13px" }}
                                    />
                                    <span style={{
                                        color: "var(--notion-text)",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        minWidth: "60px",
                                        textAlign: "right"
                                    }}>
                                        ${(item.quantity * item.unitPrice).toFixed(2)}
                                    </span>
                                    {items.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveItem(index)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "var(--notion-red)",
                                                cursor: "pointer",
                                                padding: "2px",
                                                opacity: 0.6
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleAddItem}
                            style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px dashed var(--notion-border)",
                                borderRadius: "6px",
                                background: "transparent",
                                color: "var(--notion-text-secondary)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                fontSize: "12px"
                            }}
                        >
                            <Plus size={12} />
                            Add Item
                        </button>
                    </div>

                    {/* Billed By Section */}
                    <div style={{ marginBottom: "24px" }}>
                        <div style={sectionTitleStyle}>Billed By</div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={labelStyle}>
                                <User size={11} />
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={billedByName}
                                onChange={(e) => setBilledByName(e.target.value)}
                                placeholder="Your name"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <FileText size={11} />
                                Position
                            </label>
                            <input
                                type="text"
                                value={billedByPosition}
                                onChange={(e) => setBilledByPosition(e.target.value)}
                                placeholder="e.g. Project Manager"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <div style={sectionTitleStyle}>Notes</div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Payment terms, thank you message..."
                            style={{ ...inputStyle, resize: "none" }}
                        />
                    </div>
                </div>

                {/* RIGHT PANEL - Invoice Preview */}
                <div className="invoice-preview-pane" style={{
                    padding: "24px",
                    backgroundColor: "var(--notion-bg)",
                    overflowY: "auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start"
                }}>
                    <div className="invoice-preview" style={{
                        width: "210mm",
                        minHeight: "297mm",
                        backgroundColor: "var(--notion-bg-secondary)",
                        border: "1px solid var(--notion-border)",
                        borderRadius: "10px",
                        padding: "48px",
                        color: "var(--notion-text)",
                        boxSizing: "border-box"
                    }}>
                        <div className="print-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
                            <div>
                                <img src="/logo-without-text.png" alt="Logo" className="print-logo" style={{ width: "36px", marginBottom: "10px", opacity: 0.9 }} />
                                <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>INVOICE</h1>
                                <div style={{ color: "var(--notion-text-muted)", marginTop: "4px", fontSize: "12px" }}>
                                    # {initialData?.invoiceNumber || "DRAFT"}
                                </div>
                            </div>
                            <div className="print-header-details" style={{ textAlign: "right", fontSize: "12px", color: "var(--notion-text-secondary)", lineHeight: 1.6 }}>
                                <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--notion-text)", marginBottom: "2px" }}>Kurly Brains</div>
                                <div>Dhapasi Height, Tokha-5</div>
                                <div>Kathmandu, Nepal 44600</div>
                                <div>tech@kurlybrains.com</div>
                                {billedByName && (
                                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--notion-divider)" }}>
                                        <div style={{ fontSize: "9px", color: "var(--notion-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Billed By</div>
                                        <div style={{ color: "var(--notion-text)", fontWeight: 500 }}>{billedByName}</div>
                                        {billedByPosition && <div>{billedByPosition}</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bill To & Dates */}
                        <div className="print-details" style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                            <div>
                                <div style={{ fontSize: "9px", color: "var(--notion-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Bill To
                                </div>
                                {clientName ? (
                                    <div style={{ lineHeight: 1.5 }}>
                                        <div style={{ fontWeight: 600, fontSize: "14px" }}>{clientName}</div>
                                        {clientEmail && <div style={{ fontSize: "12px", color: "var(--notion-text-secondary)" }}>{clientEmail}</div>}
                                        {clientAddress && <div style={{ fontSize: "12px", color: "var(--notion-text-secondary)", whiteSpace: "pre-line" }}>{clientAddress}</div>}
                                    </div>
                                ) : (
                                    <div style={{ color: "var(--notion-text-muted)", fontStyle: "italic", fontSize: "13px" }}>
                                        Enter client details
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ marginBottom: "10px" }}>
                                    <div style={{ fontSize: "9px", color: "var(--notion-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Issue Date
                                    </div>
                                    <div style={{ fontSize: "13px" }}>
                                        {issueDate ? new Date(issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "9px", color: "var(--notion-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Due Date
                                    </div>
                                    <div style={{ fontSize: "13px" }}>
                                        {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="print-table-container" style={{ marginBottom: "24px" }}>
                            <div className="print-table-header" style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 50px 70px 70px",
                                gap: "10px",
                                padding: "10px 0",
                                borderBottom: "2px solid var(--notion-border)",
                                fontSize: "9px",
                                color: "var(--notion-text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600
                            }}>
                                <div>Description</div>
                                <div style={{ textAlign: "center" }}>Qty</div>
                                <div style={{ textAlign: "right" }}>Price</div>
                                <div style={{ textAlign: "right" }}>Total</div>
                            </div>

                            {items.filter(item => item.description.trim() || item.unitPrice > 0).length > 0 ? (
                                items.filter(item => item.description.trim() || item.unitPrice > 0).map((item, index) => (
                                    <div key={index} className="print-table-row" style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 50px 70px 70px",
                                        gap: "10px",
                                        padding: "12px 0",
                                        borderBottom: "1px solid var(--notion-divider)",
                                        fontSize: "13px"
                                    }}>
                                        <div>{item.description || <span style={{ color: "var(--notion-text-muted)", fontStyle: "italic" }}>No description</span>}</div>
                                        <div style={{ textAlign: "center", color: "var(--notion-text-secondary)" }}>{item.quantity}</div>
                                        <div style={{ textAlign: "right", color: "var(--notion-text-secondary)" }}>${item.unitPrice.toFixed(2)}</div>
                                        <div style={{ textAlign: "right", fontWeight: 500 }}>${(item.quantity * item.unitPrice).toFixed(2)}</div>
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    padding: "20px",
                                    textAlign: "center",
                                    color: "var(--notion-text-muted)",
                                    fontStyle: "italic",
                                    fontSize: "13px"
                                }}>
                                    No items added
                                </div>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="print-totals" style={{ display: "flex", justifyContent: "flex-end" }}>
                            <div style={{ width: "180px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                                    <span style={{ color: "var(--notion-text-secondary)" }}>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                                    <span style={{ color: "var(--notion-text-secondary)" }}>Tax ({taxRate}%)</span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    paddingTop: "10px",
                                    borderTop: "2px solid var(--notion-border)",
                                    fontSize: "16px",
                                    fontWeight: 700
                                }}>
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {notes && (
                            <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--notion-divider)" }}>
                                <div style={{ fontSize: "9px", color: "var(--notion-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Notes
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--notion-text-secondary)", lineHeight: 1.5 }}>
                                    {notes}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ marginTop: "40px", textAlign: "center", opacity: 0.25 }}>
                            <img src="/logo-without-text.png" alt="Mark" style={{ width: "18px" }} />
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @page {
                    size: A4;
                    margin: 0mm !important;
                }
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #1a1a1a !important; /* Dark theme background */
                        color: #ffffff !important; /* Light text */
                        overflow: visible !important;
                    }
                    
                    /* Hide everything except the invoice-preview */
                    .no-print, .sidebar, .header, nav, button, .mobile-sidebar-toggle, .invoice-sidebar, .invoice-header { 
                        display: none !important; 
                    }
                    
                    /* Reset dashboard layout constraints */
                    .dashboard-layout, .main-content, .fade-in, .invoice-layout, .invoice-preview-pane {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #1a1a1a !important;
                        border: none !important;
                        box-shadow: none !important;
                    }

                    .invoice-preview {
                        width: 210mm !important;
                        min-height: 297mm !important;
                        padding: 20mm !important;
                        margin: 0 !important;
                        background: #1a1a1a !important;
                        color: #ffffff !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        box-sizing: border-box !important;
                        font-family: 'Inter', sans-serif !important;
                    }

                    /* Forces light elements on dark bg */
                    .invoice-preview h1, 
                    .invoice-preview .print-header-details div[style*="color: var(--notion-text)"],
                    .invoice-preview .print-details div[style*="font-weight: 600"],
                    .invoice-preview .print-totals div[style*="font-weight: 700"] {
                        color: #ffffff !important;
                    }

                    .invoice-preview div[style*="color: var(--notion-text-secondary)"],
                    .invoice-preview div[style*="color: var(--notion-text-muted)"] {
                        color: rgba(255, 255, 255, 0.6) !important;
                    }

                    .invoice-preview div[style*="border-top"],
                    .invoice-preview div[style*="border-bottom"] {
                        border-color: rgba(255, 255, 255, 0.1) !important;
                    }

                    /* Logo and icons visibility */
                    .print-logo {
                        opacity: 1 !important;
                        filter: none !important; /* Keep original logo visibility */
                    }

                    /* Layout restores */
                    .print-header, .print-details, .print-totals {
                        display: flex !important;
                        justify-content: space-between !important;
                    }

                    .print-table-header, .print-table-row {
                        display: grid !important;
                        grid-template-columns: 1fr 50px 80px 80px !important;
                        gap: 12px !important;
                        align-items: center !important;
                    }

                    .print-table-header {
                        border-bottom: 2px solid rgba(255, 255, 255, 0.2) !important;
                        font-weight: 700 !important;
                    }
                }
            `}</style>
        </div>
    );
}

// Styles
const sectionTitleStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--notion-text-muted)",
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
};

const labelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    color: "var(--notion-text-muted)",
    marginBottom: "6px",
    textTransform: "uppercase",
    fontWeight: 500,
    letterSpacing: "0.3px"
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    backgroundColor: "var(--notion-bg)",
    border: "1px solid var(--notion-border)",
    borderRadius: "5px",
    fontSize: "13px",
    color: "var(--notion-text)",
    outline: "none"
};
