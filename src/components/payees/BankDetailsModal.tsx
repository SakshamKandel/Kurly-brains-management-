"use client";

import { useState } from "react";
import { X, Search, Building2, CreditCard, ChevronDown, Plus, Smartphone, Globe } from "lucide-react";
import { getAllCountries, getBanksByCountry, getCountryInfo, PRIORITY_COUNTRIES, type Bank } from "@/data/banks";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CustomBank {
    id: string;
    country: string;
    name: string;
    code?: string;
    isDigital: boolean;
}

interface Payee {
    id: string;
    firstName: string;
    lastName: string;
    bankDetails?: {
        id: string;
        bankName: string;
        bankCode?: string;
        branchName?: string;
        branchCode?: string;
        accountNumber: string;
        accountHolder: string;
        accountType: string;
        country: string;
    } | null;
}

interface BankDetailsModalProps {
    payee: Payee;
    onClose: () => void;
    onSave: () => void;
}

export default function BankDetailsModal({ payee, onClose, onSave }: BankDetailsModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [country, setCountry] = useState(payee.bankDetails?.country || "NP");
    const [bankName, setBankName] = useState(payee.bankDetails?.bankName || "");
    const [bankCode, setBankCode] = useState(payee.bankDetails?.bankCode || "");
    const [branchName, setBranchName] = useState(payee.bankDetails?.branchName || "");
    const [branchCode, setBranchCode] = useState(payee.bankDetails?.branchCode || "");
    const [accountNumber, setAccountNumber] = useState(payee.bankDetails?.accountNumber || "");
    const [accountHolder, setAccountHolder] = useState(
        payee.bankDetails?.accountHolder ||
        ((payee.firstName || "") + " " + (payee.lastName || "")).trim()
    );
    const [accountType, setAccountType] = useState(payee.bankDetails?.accountType || "SAVINGS");
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [bankSearch, setBankSearch] = useState("");
    const [countrySearch, setCountrySearch] = useState("");

    // Custom bank form
    const [showAddBank, setShowAddBank] = useState(false);
    const [newBankName, setNewBankName] = useState("");
    const [newBankCode, setNewBankCode] = useState("");
    const [newBankIsDigital, setNewBankIsDigital] = useState(false);
    const [addingBank, setAddingBank] = useState(false);

    // Fetch custom banks
    const { data: customBanks, mutate: mutateCustomBanks } = useSWR<CustomBank[]>(
        `/api/banks?country=${country}`,
        fetcher
    );

    const countries = getAllCountries();
    const countryInfo = getCountryInfo(country);
    const staticBanks = getBanksByCountry(country);

    // Combine static and custom banks
    const allBanks: Bank[] = [
        ...staticBanks,
        ...(customBanks?.map(cb => ({ name: cb.name, code: cb.code, isDigital: cb.isDigital })) || []),
    ];

    // Filter by search
    const filteredBanks = allBanks.filter(
        (bank) =>
            bank.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
            (bank.code && bank.code.toLowerCase().includes(bankSearch.toLowerCase()))
    );

    // Filter countries by search
    const filteredCountries = countries.filter(
        (c) =>
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.code.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const handleBankSelect = (bank: Bank) => {
        setBankName(bank.name);
        setBankCode(bank.code || "");
        setShowBankDropdown(false);
        setBankSearch("");
    };

    const handleCountrySelect = (code: string) => {
        setCountry(code);
        setBankName("");
        setBankCode("");
        setShowCountryDropdown(false);
        setCountrySearch("");
    };

    const handleAddCustomBank = async () => {
        if (!newBankName.trim()) return;

        setAddingBank(true);
        try {
            const response = await fetch("/api/banks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    country,
                    name: newBankName.trim(),
                    code: newBankCode.trim() || null,
                    isDigital: newBankIsDigital,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to add bank");
            }

            // Refresh custom banks and select the new one
            await mutateCustomBanks();
            setBankName(newBankName.trim());
            setBankCode(newBankCode.trim());
            setNewBankName("");
            setNewBankCode("");
            setNewBankIsDigital(false);
            setShowAddBank(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add bank");
        } finally {
            setAddingBank(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`/api/payees/${payee.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bankDetails: {
                        bankName,
                        bankCode: bankCode || null,
                        branchName: branchName || null,
                        branchCode: branchCode || null,
                        accountNumber,
                        accountHolder,
                        accountType,
                        country,
                    },
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save bank details");
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
                    maxWidth: "580px",
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
                            <CreditCard size={18} />
                            Bank Details
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

                        {/* Country Selection with Flags */}
                        <div style={{ marginBottom: "20px", position: "relative" }}>
                            <label style={labelStyle}>Country</label>

                            {/* Priority Countries Quick Select */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                {PRIORITY_COUNTRIES.map((code) => {
                                    const c = getCountryInfo(code);
                                    if (!c) return null;
                                    return (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => handleCountrySelect(code)}
                                            style={{
                                                flex: 1,
                                                padding: "10px 12px",
                                                borderRadius: "8px",
                                                border: country === code
                                                    ? "1px solid var(--notion-blue)"
                                                    : "1px solid var(--notion-border)",
                                                backgroundColor: country === code
                                                    ? "rgba(35, 131, 226, 0.05)"
                                                    : "transparent",
                                                cursor: "pointer",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "4px",
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            <span style={{ fontSize: "20px" }}>{c.flag}</span>
                                            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--notion-text-secondary)" }}>
                                                {c.country}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Other Countries Dropdown */}
                            <div style={{ position: "relative" }}>
                                <div
                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                    className="hover-border"
                                    style={{
                                        ...inputStyle,
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "18px" }}>{countryInfo?.flag || "🏳️"}</span>
                                        <span>{countryInfo?.country || "Select country"}</span>
                                        <span style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>
                                            ({countryInfo?.currency})
                                        </span>
                                    </span>
                                    <ChevronDown size={14} style={{ opacity: 0.5 }} />
                                </div>

                                {showCountryDropdown && (
                                    <div style={dropdownStyle}>
                                        <div style={{ padding: "8px", borderBottom: "1px solid var(--notion-border)" }}>
                                            <div style={{ position: "relative" }}>
                                                <Globe size={14} style={{
                                                    position: "absolute",
                                                    left: "10px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    color: "var(--notion-text-muted)",
                                                }} />
                                                <input
                                                    type="text"
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    placeholder="Search countries..."
                                                    style={{ ...inputStyle, paddingLeft: "32px", fontSize: "13px" }}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div style={{ maxHeight: "200px", overflow: "auto" }}>
                                            {filteredCountries.map((c) => (
                                                <div
                                                    key={c.code}
                                                    onClick={() => handleCountrySelect(c.code)}
                                                    className="hover-bg"
                                                    style={{
                                                        padding: "8px 12px",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "16px" }}>{c.flag}</span>
                                                    <span style={{ flex: 1 }}>{c.name}</span>
                                                    <span style={{ fontSize: "11px", color: "var(--notion-text-muted)", fontFamily: "var(--font-mono)" }}>
                                                        {c.currency}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bank Selection */}
                        <div style={{ marginBottom: "20px", position: "relative" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>Bank Name</label>
                                <button
                                    type="button"
                                    onClick={() => setShowAddBank(!showAddBank)}
                                    className="btn-ghost"
                                    style={{ fontSize: "11px", padding: "4px 8px", color: "var(--notion-blue)" }}
                                >
                                    <Plus size={12} style={{ marginRight: "4px" }} /> Add New Bank
                                </button>
                            </div>

                            {/* Add Custom Bank Form */}
                            {showAddBank && (
                                <div style={{
                                    backgroundColor: "var(--notion-bg-secondary)",
                                    border: "1px solid var(--notion-border)",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    marginBottom: "12px",
                                }}>
                                    <div style={{ marginBottom: "10px" }}>
                                        <input
                                            type="text"
                                            value={newBankName}
                                            onChange={(e) => setNewBankName(e.target.value)}
                                            placeholder="Bank name"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                        <input
                                            type="text"
                                            value={newBankCode}
                                            onChange={(e) => setNewBankCode(e.target.value.toUpperCase())}
                                            placeholder="SWIFT/BIC (optional)"
                                            style={{ ...inputStyle, flex: 1 }}
                                        />
                                        <label style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                            padding: "0 8px",
                                            border: "1px solid var(--notion-border)",
                                            borderRadius: "6px",
                                            backgroundColor: "var(--notion-bg)",
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={newBankIsDigital}
                                                onChange={(e) => setNewBankIsDigital(e.target.checked)}
                                            />
                                            <Smartphone size={14} />
                                            Digital
                                        </label>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddBank(false)}
                                            className="btn-ghost"
                                            style={{ fontSize: "12px", padding: "6px 12px" }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddCustomBank}
                                            className="btn-primary"
                                            disabled={!newBankName.trim() || addingBank}
                                            style={{ fontSize: "12px", padding: "6px 12px" }}
                                        >
                                            {addingBank ? "Adding..." : "Add Bank"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ position: "relative" }}>
                                <div
                                    onClick={() => setShowBankDropdown(!showBankDropdown)}
                                    className="hover-border"
                                    style={{
                                        ...inputStyle,
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span style={{
                                        color: bankName ? "var(--notion-text)" : "var(--notion-text-muted)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}>
                                        {bankName ? (
                                            <>
                                                <Building2 size={16} />
                                                {bankName}
                                            </>
                                        ) : (
                                            "Select a bank..."
                                        )}
                                    </span>
                                    <ChevronDown size={14} style={{ opacity: 0.5 }} />
                                </div>

                                {showBankDropdown && (
                                    <div style={dropdownStyle}>
                                        <div style={{ padding: "8px", borderBottom: "1px solid var(--notion-border)" }}>
                                            <div style={{ position: "relative" }}>
                                                <Search size={14} style={{
                                                    position: "absolute",
                                                    left: "10px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    color: "var(--notion-text-muted)",
                                                }} />
                                                <input
                                                    type="text"
                                                    value={bankSearch}
                                                    onChange={(e) => setBankSearch(e.target.value)}
                                                    placeholder="Search banks..."
                                                    style={{ ...inputStyle, paddingLeft: "32px", fontSize: "13px" }}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div style={{ maxHeight: "220px", overflow: "auto" }}>
                                            {filteredBanks.length > 0 ? (
                                                filteredBanks.map((bank, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleBankSelect(bank)}
                                                        className="hover-bg"
                                                        style={{
                                                            padding: "8px 12px",
                                                            cursor: "pointer",
                                                            fontSize: "13px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "10px",
                                                        }}
                                                    >
                                                        {bank.isDigital ? (
                                                            <Smartphone size={16} style={{ color: "var(--notion-blue)" }} />
                                                        ) : (
                                                            <Building2 size={16} style={{ color: "var(--notion-text-muted)" }} />
                                                        )}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 500 }}>{bank.name}</div>
                                                            {bank.code && (
                                                                <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", fontFamily: "var(--font-mono)" }}>
                                                                    {bank.code}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {bank.isDigital && (
                                                            <span style={{
                                                                fontSize: "10px",
                                                                padding: "2px 6px",
                                                                backgroundColor: "rgba(0, 120, 255, 0.15)",
                                                                color: "var(--notion-blue)",
                                                                borderRadius: "4px",
                                                            }}>
                                                                Digital
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: "16px", textAlign: "center", color: "var(--notion-text-muted)", fontSize: "13px" }}>
                                                    No banks found.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SWIFT/BIC Code */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>SWIFT/BIC Code (Optional)</label>
                            <input
                                type="text"
                                value={bankCode}
                                onChange={(e) => setBankCode(e.target.value.toUpperCase())}
                                placeholder="e.g., NABORPKA"
                                style={inputStyle}
                            />
                        </div>

                        {/* Branch Info */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            <div>
                                <label style={labelStyle}>Branch Name (Optional)</label>
                                <input
                                    type="text"
                                    value={branchName}
                                    onChange={(e) => setBranchName(e.target.value)}
                                    placeholder="e.g., Kathmandu"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Branch Code (Optional)</label>
                                <input
                                    type="text"
                                    value={branchCode}
                                    onChange={(e) => setBranchCode(e.target.value)}
                                    placeholder="e.g., 001"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Account Details */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Account Holder Name</label>
                            <input
                                type="text"
                                value={accountHolder}
                                onChange={(e) => setAccountHolder(e.target.value)}
                                placeholder="Full name as on bank account"
                                style={inputStyle}
                                required
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            <div>
                                <label style={labelStyle}>Account Number</label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    placeholder="Enter account number"
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Account Type</label>
                                <select
                                    value={accountType}
                                    onChange={(e) => setAccountType(e.target.value)}
                                    style={selectStyle}
                                >
                                    <option value="SAVINGS">Savings</option>
                                    <option value="CURRENT">Current</option>
                                    <option value="SALARY">Salary</option>
                                </select>
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
                        <button type="submit" className="btn-primary" disabled={loading || !bankName || !accountNumber}>
                            {loading ? "Saving..." : "Save Bank Details"}
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

const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "var(--notion-bg)",
    border: "1px solid var(--notion-border)",
    borderRadius: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 100,
    marginTop: "4px",
    maxHeight: "260px",
    overflow: "hidden",
};
