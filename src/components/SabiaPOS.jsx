import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";

// ── CONFIG ────────────────────────────────────────────────
const API = "https://api.sabiasanalytics.com";
const DB_NAME = "SabiaPOS_Offline";
const DB_VER = 1;

// ── COLORS ───────────────────────────────────────────────
const C = {
  brown: "#3E1F00", gold: "#FFB800", orange: "#FF6B35",
  green: "#2D6A4F", red: "#C62828", bg: "#FFF8F0",
  white: "#FFFFFF", muted: "#888", border: "#FFE8D0",
  darkbg: "#1A0A00", blue: "#2980B9", purple: "#8E44AD",
};

// ── HELPERS ──────────────────────────────────────────────
const fmt = (n) => "MWK " + new Intl.NumberFormat().format(Math.round(n || 0));
const fmtDate = (d) => d ? new Date(d).toLocaleString() : "—";
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString() : "—";
const genRef = () => "POS" + Date.now().toString().slice(-9);

// ── INDEXEDDB OFFLINE STORE ───────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending_sales")) {
        db.createObjectStore("pending_sales", { keyPath: "offline_reference" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function savePending(tx) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const store = db.transaction("pending_sales", "readwrite").objectStore("pending_sales");
    store.put(tx).onsuccess = () => res();
  });
}
async function getPending() {
  const db = await openDB();
  return new Promise((res) => {
    const store = db.transaction("pending_sales", "readonly").objectStore("pending_sales");
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
  });
}
async function removePending(ref) {
  const db = await openDB();
  return new Promise((res) => {
    const store = db.transaction("pending_sales", "readwrite").objectStore("pending_sales");
    store.delete(ref).onsuccess = () => res();
  });
}

// ── API HELPER ────────────────────────────────────────────
async function api(method, path, body, token) {
  const authToken = token || localStorage.getItem("pos_token") || localStorage.getItem("token");
  if (!authToken) {
    console.error("No token available!");
    throw new Error("No token provided");
  }
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── QR CODE DISPLAY ────────────────────────────────────────
const QRCodeDisplay = ({ receipt, amount, reference }) => {
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    const receiptUrl = `https://sabiasanalytics.com/receipt?ref=${reference}&amount=${amount}&date=${Date.now()}`;
    QRCode.toDataURL(receiptUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#3E1F00", light: "#FFFFFF" }
    })
      .then(url => setQrCode(url))
      .catch(err => console.error("QR generation failed:", err));
  }, [reference, amount]);

  if (!qrCode) {
    return <div style={{ fontSize: 12, color: "#888", padding: 10 }}>Generating QR...</div>;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <img src={qrCode} alt="Receipt QR Code" style={{ width: 180, height: 180, borderRadius: 8 }} />
      <div style={{ fontSize: 10, color: "#888", marginTop: 6 }}>Scan to view receipt</div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
//  MAIN POS APP
// ══════════════════════════════════════════════════════════
export default function SabiaPOS() {
  // ── STATE ──────────────────────────────────────────────
  const [token, setToken] = useState(() => localStorage.getItem("pos_token") || localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pos_user") || "null"); } catch { return null; }
  });
  const [screen, setScreen] = useState("login");
  const [session, setSession] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // POS state
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [toast, setToast] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const barcodeRef = useRef(null);
  const printRef = useRef(null);

  // ── ADVANCED FEATURES STATE ──────────────────────────────
  // Loyalty
  const [loyaltyCustomer, setLoyaltyCustomer] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [showLoyalty, setShowLoyalty] = useState(false);

  // Reprint
  const [showReprint, setShowReprint] = useState(false);
  const [reprintSearch, setReprintSearch] = useState("");
  const [reprintResults, setReprintResults] = useState([]);
  // eslint-disable-next-line no-unused-vars
const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Branch Reports
  const [showBranchReports, setShowBranchReports] = useState(false);
  const [branchData, setBranchData] = useState([]);
  const [branchFilter, setBranchFilter] = useState("all");

  // Till Reports
  const [showTillReports, setShowTillReports] = useState(false);
  const [tillData, setTillData] = useState([]);

  // Reconciliation
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [reconciliationData, setReconciliationData] = useState(null);

  // Multi-Till Dashboard
  const [showMultiTill, setShowMultiTill] = useState(false);
  const [multiTillData, setMultiTillData] = useState([]);

  // ── CART PERSISTENCE ──────────────────────────────────
  useEffect(() => {
    const savedCart = localStorage.getItem("pos_cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pos_cart", JSON.stringify(cart));
  }, [cart]);

  // ── CHECK PENDING ──────────────────────────────────────
  const checkPending = useCallback(async () => {
    try {
      const p = await getPending();
      setPendingCount(p.length);
      return p.length;
    } catch { return 0; }
  }, []);

  // ── SYNC PENDING ──────────────────────────────────────
  const syncPending = useCallback(async () => {
    if (syncing) return;
    const pending = await getPending();
    if (pending.length === 0) return;
    setSyncing(true);
    let syncedCount = 0;
    for (const tx of pending) {
      try {
        const res = await api("POST", "/api/pos/transactions", tx, token);
        if (res.success) {
          await removePending(tx.offline_reference);
          syncedCount++;
        }
      } catch {}
    }
    setSyncing(false);
    const remaining = await checkPending();
    if (syncedCount > 0 && remaining === 0) {
      showToast(` ${syncedCount} offline sales synced!`, "green");
    } else if (syncedCount > 0 && remaining > 0) {
      showToast(` ${syncedCount} synced, ${remaining} remaining`, "orange");
    } else if (remaining > 0) {
      showToast(` Could not sync ${remaining} items. Check connection.`, "red");
    }
  }, [token, syncing, checkPending]);

  // ── SHOW TOAST ─────────────────────────────────────────
  const showToast = (msg, color = "green") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  // ── LOAD INVENTORY ──────────────────────────────────────
  const loadInventory = useCallback(async (tk) => {
    const authToken = tk || token;
    if (!authToken) return;
    try {
      const res = await api("GET", "/api/inventory", null, authToken);
      if (res.success) {
        setInventory(res.data);
        console.log("Products loaded:", res.data.length);
      }
    } catch (err) {
      console.error("Inventory error:", err);
    }
  }, [token]);

  // ── ONLINE/OFFLINE ──────────────────────────────────────
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  // ── SYNC WHEN ONLINE ────────────────────────────────────
  useEffect(() => {
    if (online && token) {
      checkPending().then(count => {
        if (count > 0 && !syncing) {
          syncPending();
        }
      });
    }
  }, [online, token, syncing, checkPending, syncPending]);

  // ── LOAD INVENTORY WHEN POS OPENS ──────────────────────
  useEffect(() => {
    if (token && screen === "pos") {
      loadInventory();
    }
  }, [screen, token, loadInventory]);

  // ── CHECK EXISTING SESSION ──────────────────────────
  const checkExistingSession = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api("GET", "/api/pos/sessions/active", null, token);
      if (res.success && res.data) {
        setSession(res.data);
        setScreen("pos");
        loadInventory();
        showToast("Continuing open session", "green");
      } else {
        setScreen("session");
      }
    } catch (err) {
      console.error("Check session error:", err);
      setScreen("session");
    }
  }, [token, loadInventory]);

  useEffect(() => {
    if (token) {
      checkExistingSession();
    }
  }, [token, checkExistingSession]);

  // ── LOAD SUMMARY ──────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [sumRes, txRes] = await Promise.all([
        api("GET", `/api/pos/summary?date=${today}`, null, token),
        api("GET", `/api/pos/transactions?session_id=${session?.id}`, null, token),
      ]);
      if (sumRes.success) {
        setSummaryData(sumRes.data);
      } else {
        setSummaryData({ total_transactions: 0, total_revenue: 0, cash_total: 0, airtel_total: 0, tnm_total: 0, total_discounts: 0 });
      }
      if (txRes.success) {
        setTransactions(txRes.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Load summary error:", err);
      showToast("Error loading summary", "red");
      setSummaryData({ total_transactions: 0, total_revenue: 0, cash_total: 0, airtel_total: 0, tnm_total: 0, total_discounts: 0 });
      setTransactions([]);
    }
  }, [token, session]);

  // ── PRINT ──────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    if (!printRef.current) {
      showToast("No receipt to print", "red");
      return;
    }
    const content = printRef.current;
    const html = content.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) {
      showToast("Please allow popups for printing", "orange");
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 350px; margin: 0 auto; }
            * { color: #3E1F00; }
            .text-center { text-align: center; }
            .border-bottom { border-bottom: 1px dashed #ddd; padding-bottom: 10px; margin-bottom: 10px; }
            .border-top { border-top: 1px dashed #ddd; padding-top: 10px; margin-top: 10px; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; }
            .muted { color: #888; }
            img { max-width: 150px; height: auto; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  }, []);

  // ── LOGIN ──────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginErr("");
    try {
      const res = await fetch(API + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("pos_token", data.token);
        localStorage.setItem("pos_user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        setLoginErr(data.message || "Login failed.");
      }
    } catch {
      setLoginErr("Cannot connect. Check internet.");
    }
    setLoginLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
    localStorage.removeItem("pos_cart");
    setToken("");
    setUser(null);
    setSession(null);
    setCart([]);
    setScreen("login");
  };

  // ── OPEN SESSION ──────────────────────────────────────
  const [openCash, setOpenCash] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);

  const openSession = async () => {
    setSessionLoading(true);
    try {
      const res = await api("POST", "/api/pos/sessions/open", { opening_cash: parseFloat(openCash) || 0 }, token);
      if (res.success) {
        setSession(res.data);
        setScreen("pos");
        loadInventory();
        showToast("Session opened!", "green");
      } else {
        showToast(res.error || "Failed to open session.", "red");
      }
    } catch {
      showToast("Cannot open session.", "red");
    }
    setSessionLoading(false);
  };

  // ── CLOSE SESSION ─────────────────────────────────────
  const [closeCash, setCloseCash] = useState("");
  const closeSession = async () => {
    if (!session) {
      showToast("No active session to close.", "red");
      return;
    }
    const cash = parseFloat(closeCash) || 0;
    if (cash <= 0) {
      showToast("Please enter closing cash amount.", "orange");
      return;
    }
    try {
      const res = await api("PUT", `/api/pos/sessions/${session.id}/close`, 
        { closing_cash: cash }, token
      );
      if (res.success) {
        showToast(`Session closed! Total revenue: ${fmt(res.data.total_revenue)}`, "green");
        setSession(null);
        await loadSummary();
        setScreen("summary");
      } else {
        showToast(res.error || "Failed to close session.", "red");
      }
    } catch (err) {
      console.error("Close session error:", err);
      showToast("Failed to close session.", "red");
    }
  };

  // ── BARCODE ────────────────────────────────────────────
  const handleBarcode = async (code) => {
    if (!code) return;
    const product = inventory.find(p => p.barcode === code || p.product.toLowerCase() === code.toLowerCase());
    if (product) {
      addToCart(product);
      setBarcodeInput("");
      showToast("Added: " + product.product, "green");
    } else {
      showToast("Product not found!", "red");
    }
    setBarcodeInput("");
  };

  // ── CART OPERATIONS ──────────────────────────────────
  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) {
        if (ex.quantity >= product.quantity_in_stock) {
          showToast("Not enough stock!", "red");
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    const prod = inventory.find(p => p.id === id);
    if (prod && qty > prod.quantity_in_stock) {
      showToast("Not enough stock!", "red");
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = subtotal - (parseFloat(discount) || 0);

  // ── LOYALTY ────────────────────────────────────────────
  const handleLoyaltyCheck = async (phone) => {
    if (!phone) {
      showToast("Enter customer phone number", "orange");
      return;
    }
    try {
      const res = await api("GET", `/api/loyalty/customer?phone=${phone}`, null, token);
      if (res.success && res.data) {
        setLoyaltyCustomer(res.data);
        setLoyaltyPoints(res.data.points || 0);
        setShowLoyalty(true);
        showToast(`Customer found! Points: ${res.data.points}`, "green");
      } else {
        showToast("Customer not found. New customer will be created.", "orange");
        setLoyaltyCustomer({ name: customerName || "Walk-in", phone, points: 0 });
        setLoyaltyPoints(0);
        setShowLoyalty(true);
      }
    } catch {
      showToast("Error checking loyalty", "red");
    }
  };

  // ── REPRINT ────────────────────────────────────────────
  const handleReprintSearch = async () => {
    if (!reprintSearch) {
      showToast("Enter receipt number or customer name", "orange");
      return;
    }
    try {
      const res = await api("GET", `/api/pos/receipts?search=${encodeURIComponent(reprintSearch)}`, null, token);
      if (res.success && res.data.length > 0) {
        setReprintResults(res.data);
        showToast(`Found ${res.data.length} receipts`, "green");
      } else {
        setReprintResults([]);
        showToast("No receipts found", "red");
      }
    } catch {
      showToast("Error searching receipts", "red");
    }
  };

  const handleReprint = (receipt) => {
    setSelectedReceipt(receipt);
    setScreen("receipt");
    setLastReceipt({
      ...receipt,
      reference: receipt.reference_number,
      items: receipt.items || [],
      total: receipt.total,
      subtotal: receipt.subtotal,
      customer_name: receipt.customer_name,
      payment_method: receipt.payment_method,
      cashier: receipt.cashier_name || "System"
    });
    setShowReprint(false);
  };

  // ── CHECKOUT ──────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const checkout = async () => {
    if (cart.length === 0) { showToast("Cart is empty!", "red"); return; }
    if (total < 0) { showToast("Discount too high!", "red"); return; }
    setCheckoutLoading(true);

    const txData = {
      session_id: session?.id,
      items: cart.map(i => ({
        product: i.product, category: i.category,
        barcode: i.barcode, quantity: i.quantity,
        unit_price: i.unit_price, unit_cost: i.unit_cost || 0,
      })),
      payment_method: payMethod,
      discount: parseFloat(discount) || 0,
      customer_name: customerName || "Walk-in",
      customer_phone: customerPhone,
      offline_reference: genRef(),
      loyalty_points_used: loyaltyPoints || 0,
    };

    if (online) {
      try {
        const res = await api("POST", "/api/pos/transactions", txData, token);
        if (res.success) {
          // Update loyalty points
          if (customerPhone) {
            await api("POST", "/api/loyalty/earn", { phone: customerPhone, amount: total }, token);
          }
          setLastReceipt({ ...txData, reference: res.reference || txData.offline_reference, total, subtotal, cashier: user?.name });
          setCart([]);
          setDiscount(0);
          setCustomerName("");
          setCustomerPhone("");
          setLoyaltyPoints(0);
          setLoyaltyCustomer(null);
          setShowLoyalty(false);
          localStorage.removeItem("pos_cart");
          setScreen("receipt");
          loadInventory();
          showToast("Sale recorded!", "green");
        } else {
          showToast(res.error || "Checkout failed.", "red");
        }
      } catch {
        await savePending(txData);
        setPendingCount(c => c + 1);
        setLastReceipt({ ...txData, reference: txData.offline_reference, total, subtotal, cashier: user?.name, offline: true });
        setCart([]);
        setDiscount(0);
        setCustomerName("");
        setCustomerPhone("");
        localStorage.removeItem("pos_cart");
        setScreen("receipt");
        showToast("Saved offline - will sync when online.", "orange");
      }
    } else {
      await savePending(txData);
      setPendingCount(c => c + 1);
      setLastReceipt({ ...txData, reference: txData.offline_reference, total, subtotal, cashier: user?.name, offline: true });
      setCart([]);
      setDiscount(0);
      setCustomerName("");
      setCustomerPhone("");
      localStorage.removeItem("pos_cart");
      setScreen("receipt");
      showToast("Saved offline - will sync when online.", "orange");
    }
    setCheckoutLoading(false);
  };

  // ── BRANCH REPORTS ────────────────────────────────────
  const loadBranchReports = async () => {
    try {
      const res = await api("GET", "/api/pos/branch-reports", null, token);
      if (res.success) {
        setBranchData(res.data);
        setShowBranchReports(true);
      } else {
        showToast("Error loading branch reports", "red");
      }
    } catch {
      showToast("Error loading branch reports", "red");
    }
  };

  // ── TILL REPORTS ──────────────────────────────────────
  const loadTillReports = async () => {
    try {
      const res = await api("GET", "/api/pos/till-reports", null, token);
      if (res.success) {
        setTillData(res.data);
        setShowTillReports(true);
      } else {
        showToast("Error loading till reports", "red");
      }
    } catch {
      showToast("Error loading till reports", "red");
    }
  };

  // ── RECONCILIATION ────────────────────────────────────
  const loadReconciliation = async () => {
    try {
      const res = await api("GET", "/api/pos/reconciliation", null, token);
      if (res.success) {
        setReconciliationData(res.data);
        setShowReconciliation(true);
      } else {
        showToast("Error loading reconciliation", "red");
      }
    } catch {
      showToast("Error loading reconciliation", "red");
    }
  };

  // ── MULTI-TILL DASHBOARD ──────────────────────────────
  const loadMultiTill = async () => {
    try {
      const res = await api("GET", "/api/pos/multi-till", null, token);
      if (res.success) {
        setMultiTillData(res.data);
        setShowMultiTill(true);
      } else {
        showToast("Error loading multi-till data", "red");
      }
    } catch {
      showToast("Error loading multi-till data", "red");
    }
  };

  // ── FILTER PRODUCTS ──────────────────────────────────
  const filteredProducts = inventory.filter(p =>
    p.product.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── STYLES ──────────────────────────────────────────────
  const styles = {
    app: { fontFamily: "Arial, sans-serif", background: C.bg, minHeight: "100vh", position: "relative" },
    toast: { position: "fixed", top: 16, right: 16, zIndex: 9999, background: toast?.color === "red" ? C.red : toast?.color === "orange" ? C.orange : C.green, color: C.white, padding: "12px 20px", borderRadius: 10, fontWeight: "bold", fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" },
    header: { background: C.brown, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { color: C.gold, fontWeight: "bold", fontSize: 22, letterSpacing: 3 },
    badge: { background: C.orange, color: C.white, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: "bold" },
    btn: (bg, color = C.white) => ({ background: bg, color, border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: "bold", cursor: "pointer", fontSize: 14, fontFamily: "Arial" }),
    input: { padding: "10px 14px", borderRadius: 8, border: "1.5px solid " + C.border, fontSize: 14, outline: "none", background: "#FFFDF8", width: "100%", boxSizing: "border-box" },
    card: { background: C.white, borderRadius: 12, padding: 16, border: "1px solid " + C.border },
    modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
    modalContent: { background: C.white, borderRadius: 16, padding: 24, maxWidth: 600, width: "90%", maxHeight: "80vh", overflowY: "auto" },
    miniBtn: (bg, color = C.white) => ({ background: bg, color, border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: "bold", cursor: "pointer", fontSize: 12, fontFamily: "Arial" }),
  };

  // ── RENDER ──────────────────────────────────────────────
  return (
    <div style={styles.app}>
      {toast && <div style={styles.toast}>{toast.msg}</div>}

      {/* ── LOGIN ── */}
      {screen === "login" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{ ...styles.card, width: "100%", maxWidth: 400 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ background: C.brown, borderRadius: 12, padding: "20px 0", marginBottom: 12 }}>
                <div style={{ color: C.gold, fontSize: 32, fontWeight: "bold", letterSpacing: 4 }}>SABIAS</div>
                <div style={{ color: C.orange, fontSize: 12 }}>Point of Sale</div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: C.muted, fontWeight: "bold" }}>Email</label>
              <input style={{ ...styles.input, marginTop: 4 }} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="your@email.com" type="email" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: C.muted, fontWeight: "bold" }}>Password</label>
              <input style={{ ...styles.input, marginTop: 4 }} value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="........" type="password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            {loginErr && <div style={{ background: "#FFEBEE", color: C.red, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{loginErr}</div>}
            <button style={{ ...styles.btn(C.brown), width: "100%", padding: "14px 0", fontSize: 16 }} onClick={handleLogin} disabled={loginLoading}>
              {loginLoading ? "Logging in..." : "Login to SabiaPOS"}
            </button>
          </div>
        </div>
      )}

      {/* ── OPEN SESSION ── */}
      {screen === "session" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{ ...styles.card, width: "100%", maxWidth: 420 }}>
            <div style={{ background: C.brown, borderRadius: 10, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
              <div style={{ color: C.gold, fontSize: 24, fontWeight: "bold", letterSpacing: 3 }}>SABIAS POS</div>
              <div style={{ color: C.orange, fontSize: 12, marginTop: 2 }}>Open Cashier Session</div>
            </div>
            <div style={{ marginBottom: 12, color: C.brown, fontWeight: "bold" }}>Welcome, {user?.name}</div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: C.muted, fontWeight: "bold" }}>Opening Cash (MWK)</label>
              <input style={{ ...styles.input, marginTop: 4 }} value={openCash} onChange={e => setOpenCash(e.target.value)} placeholder="0" type="number" />
            </div>
            <button style={{ ...styles.btn(C.green), width: "100%", padding: "14px 0", fontSize: 16 }} onClick={openSession} disabled={sessionLoading}>
              {sessionLoading ? "Opening..." : "Open Session & Start"}
            </button>
            <button style={{ ...styles.btn("transparent", C.muted), width: "100%", padding: "10px 0", marginTop: 8, fontSize: 13 }} onClick={logout}>Logout</button>
          </div>
        </div>
      )}

      {/* ── MAIN POS ── */}
      {screen === "pos" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <div style={styles.logo}>SABIAS POS</div>
              <div style={{ color: C.orange, fontSize: 11 }}>
                {user?.company} · {user?.name}
                <span style={{ color: C.muted, fontSize: 10, marginLeft: 8 }}>
                  ({user?.role === 'admin' ? 'All Sales' : 'My Sales'})
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ ...styles.badge, background: online ? C.green : C.red }}>{online ? "Online" : "Offline"}</div>
              {pendingCount > 0 && <div style={styles.badge}>{pendingCount} pending</div>}
              {syncing && <div style={{ color: C.gold, fontSize: 12 }}>Syncing...</div>}
              {pendingCount > 0 && !syncing && (
                <button style={styles.miniBtn(C.orange)} onClick={syncPending}>Sync</button>
              )}
              <button style={styles.miniBtn(C.gold, C.brown)} onClick={() => { loadSummary(); setScreen("summary"); }}>Summary</button>
              <button style={styles.miniBtn(C.blue)} onClick={loadBranchReports}>Branch</button>
              <button style={styles.miniBtn(C.purple)} onClick={loadTillReports}>Till</button>
              <button style={styles.miniBtn(C.orange)} onClick={loadReconciliation}>Reconcile</button>
              <button style={styles.miniBtn(C.green)} onClick={loadMultiTill}>All Tills</button>
              <button style={styles.miniBtn(C.brown)} onClick={() => setShowReprint(true)}>Reprint</button>
              <button style={styles.miniBtn(C.red)} onClick={() => { loadSummary(); setScreen("summary"); }}>Close</button>
            </div>
          </div>

          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* LEFT: Product grid */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input ref={barcodeRef} style={{ ...styles.input, maxWidth: 200 }} value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} placeholder="Scan barcode..." onKeyDown={e => e.key === "Enter" && handleBarcode(barcodeInput)} />
                <input style={{ ...styles.input, flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..." />
                <button style={styles.miniBtn(C.blue)} onClick={() => setShowLoyalty(!showLoyalty)}>
                  {showLoyalty ? "Hide Loyalty" : "Loyalty"}
                </button>
              </div>
              {/* Loyalty Panel */}
              {showLoyalty && (
                <div style={{ background: C.bg, padding: 8, borderRadius: 8, marginBottom: 10, border: "1px solid " + C.border }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input style={{ ...styles.input, flex: 1, fontSize: 13 }} placeholder="Customer phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                    <button style={styles.miniBtn(C.green)} onClick={() => handleLoyaltyCheck(customerPhone)}>Check</button>
                  </div>
                  {loyaltyCustomer && (
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      <strong>{loyaltyCustomer.name}</strong> · Points: <strong style={{ color: C.gold }}>{loyaltyPoints}</strong>
                      <button style={{ ...styles.miniBtn(C.orange), marginLeft: 8 }} onClick={() => setLoyaltyPoints(loyaltyPoints - 100)}>Use 100 pts</button>
                    </div>
                  )}
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, alignContent: "start" }}>
                {filteredProducts.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", color: C.muted, padding: 40 }}>
                    {inventory.length === 0 ? "No products in inventory" : "No matching products found"}
                  </div>
                )}
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} style={{ background: C.white, border: "1.5px solid " + C.border, borderRadius: 10, padding: 10, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.orange}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{p.category}</div>
                    <div style={{ fontWeight: "bold", color: C.brown, fontSize: 13, marginBottom: 6, lineHeight: 1.3 }}>{p.product}</div>
                    <div style={{ color: C.orange, fontWeight: "bold", fontSize: 15 }}>{fmt(p.unit_price)}</div>
                    <div style={{ fontSize: 11, color: p.quantity_in_stock <= (p.reorder_level || 5) ? C.red : C.green, marginTop: 4 }}>
                      Stock: {p.quantity_in_stock}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Cart */}
            <div style={{ width: 340, background: C.white, borderLeft: "1px solid " + C.border, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid " + C.border, fontWeight: "bold", color: C.brown, fontSize: 16 }}>
                Cart ({cart.length} items)
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
                {cart.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 40, fontSize: 14 }}>Cart is empty</div>}
                {cart.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: 13, color: C.brown }}>{item.product}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{fmt(item.unit_price)} each</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button style={{ ...styles.btn(C.brown, C.gold), padding: "4px 10px", fontSize: 16 }} onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
                      <span style={{ fontWeight: "bold", minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
                      <button style={{ ...styles.btn(C.brown, C.gold), padding: "4px 10px", fontSize: 16 }} onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div style={{ minWidth: 80, textAlign: "right", fontWeight: "bold", color: C.orange, fontSize: 13 }}>{fmt(item.quantity * item.unit_price)}</div>
                    <button style={{ ...styles.btn(C.red), padding: "4px 8px", fontSize: 12 }} onClick={() => removeFromCart(item.id)}>X</button>
                  </div>
                ))}
              </div>

              <div style={{ padding: "8px 12px", borderTop: "1px solid " + C.border }}>
                <input style={{ ...styles.input, marginBottom: 6, fontSize: 13 }} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (optional)" />
                <input style={{ ...styles.input, fontSize: 13 }} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone (optional)" />
              </div>

              <div style={{ padding: "10px 16px", background: C.bg, borderTop: "1px solid " + C.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: C.muted }}>Subtotal</span>
                  <span style={{ fontWeight: "bold" }}>{fmt(subtotal)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: C.muted, fontSize: 14 }}>Discount</span>
                  <input style={{ ...styles.input, width: 100, fontSize: 13, padding: "6px 10px" }} value={discount} onChange={e => setDiscount(e.target.value)} type="number" placeholder="0" />
                </div>
                {loyaltyPoints > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: C.gold }}>Loyalty Discount</span>
                    <span style={{ color: C.gold }}>- {fmt(loyaltyPoints * 0.1)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: "bold", fontSize: 16, color: C.brown }}>TOTAL</span>
                  <span style={{ fontWeight: "bold", fontSize: 18, color: C.orange }}>{fmt(total - (loyaltyPoints * 0.1))}</span>
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {["Cash", "Airtel Money", "TNM Mpamba", "Bank transfer", "Voucher"].map(m => (
                    <button key={m} style={{ ...styles.btn(payMethod === m ? C.brown : C.bg, payMethod === m ? C.gold : C.brown), flex: 1, padding: "8px 4px", fontSize: 11, border: "1px solid " + C.border }} onClick={() => setPayMethod(m)}>{m}</button>
                  ))}
                </div>

                <button style={{ ...styles.btn(C.green), width: "100%", padding: "14px 0", fontSize: 16 }} onClick={checkout} disabled={checkoutLoading || cart.length === 0}>
                  {checkoutLoading ? "Processing..." : "Charge " + fmt(total - (loyaltyPoints * 0.1))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIPT ── */}
      {screen === "receipt" && lastReceipt && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, background: C.bg }}>
          <div style={{ ...styles.card, width: "100%", maxWidth: 420 }}>
            <div ref={printRef} style={{ padding: 16 }}>
              <div style={{ background: C.brown, borderRadius: 10, padding: "16px 20px", textAlign: "center", marginBottom: 16 }}>
                <div style={{ color: C.gold, fontSize: 24, fontWeight: "bold", letterSpacing: 3 }}>SABIAS POS</div>
                <div style={{ color: C.orange, fontSize: 11 }}>{user?.company}</div>
              </div>
              {lastReceipt.offline && (
                <div style={{ background: "#FFF3E0", border: "1px solid " + C.orange, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: C.orange, fontWeight: "bold" }}>
                  Saved offline - will sync when online
                </div>
              )}
              <QRCodeDisplay receipt={lastReceipt} amount={lastReceipt.total} reference={lastReceipt.reference} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: C.muted }}>Receipt #</span>
                <span style={{ fontWeight: "bold", color: C.brown }}>{lastReceipt.reference}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: C.muted }}>Customer</span>
                <span>{lastReceipt.customer_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: C.muted }}>Cashier</span>
                <span>{lastReceipt.cashier}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: C.muted }}>Date</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div style={{ borderTop: "1px dashed " + C.border, margin: "12px 0" }} />
              {lastReceipt.items?.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span>{item.product} x {item.quantity}</span>
                  <span style={{ fontWeight: "bold" }}>{fmt(item.quantity * item.unit_price)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px dashed " + C.border, margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: C.muted }}>Subtotal</span>
                <span>{fmt(lastReceipt.subtotal)}</span>
              </div>
              {lastReceipt.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: C.red }}>Discount</span>
                  <span style={{ color: C.red }}>- {fmt(lastReceipt.discount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: "bold", fontSize: 16 }}>TOTAL</span>
                <span style={{ fontWeight: "bold", fontSize: 18, color: C.orange }}>{fmt(lastReceipt.total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 13 }}>
                <span style={{ color: C.muted }}>Payment</span>
                <span style={{ fontWeight: "bold", color: C.green }}>{lastReceipt.payment_method}</span>
              </div>
              <div style={{ textAlign: "center", color: C.muted, fontSize: 12, marginBottom: 16 }}>
                Thank you for shopping at {user?.company}!<br />Powered by SABIAS Analytics
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
              <button style={{ ...styles.btn(C.brown), flex: 1 }} onClick={handlePrint}>Print</button>
              <button style={{ ...styles.btn(C.green), flex: 1 }} onClick={() => setScreen("pos")}>New Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY SUMMARY ── */}
      {screen === "summary" && (
        <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
          <div style={{ background: C.brown, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: C.gold, fontSize: 20, fontWeight: "bold" }}>Daily Summary</div>
              <div style={{ color: C.orange, fontSize: 12 }}>{new Date().toLocaleDateString()}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.btn(C.orange)} onClick={() => setScreen("pos")}>Back</button>
              <button style={styles.btn(C.red)} onClick={logout}>Logout</button>
            </div>
          </div>
          {session && (
            <div style={{ ...styles.card, marginBottom: 16 }}>
              <div style={{ fontWeight: "bold", color: C.brown, marginBottom: 10 }}>Close Session</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...styles.input, flex: 1 }} value={closeCash} onChange={e => setCloseCash(e.target.value)} placeholder="Closing cash (MWK)" type="number" />
                <button style={styles.btn(C.red)} onClick={closeSession}>Close Session</button>
              </div>
            </div>
          )}
          {summaryData && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Transactions", value: summaryData.total_transactions || 0, color: C.brown },
                { label: "Total Revenue", value: fmt(summaryData.total_revenue || 0), color: C.green },
                { label: "Cash", value: fmt(summaryData.cash_total || 0), color: C.orange },
                { label: "Airtel Money", value: fmt(summaryData.airtel_total || 0), color: "#E65100" },
                { label: "TNM Mpamba", value: fmt(summaryData.tnm_total || 0), color: C.brown },
                { label: "Discounts", value: fmt(summaryData.total_discounts || 0), color: C.red },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ ...styles.card, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontWeight: "bold", color, fontSize: 16 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
          <div style={styles.card}>
            <div style={{ fontWeight: "bold", color: C.brown, marginBottom: 12 }}>Today's Transactions</div>
            {transactions.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 20 }}>No transactions yet</div>}
            {transactions.map(tx => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + C.border }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 13, color: C.brown }}>{tx.reference_number}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{tx.customer_name} · {tx.payment_method}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(tx.created_at)}</div>
                </div>
                <div style={{ fontWeight: "bold", color: C.orange, fontSize: 15 }}>{fmt(tx.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REPRINT MODAL ── */}
      {showReprint && (
        <div style={styles.modal} onClick={() => setShowReprint(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: C.brown, marginTop: 0 }}>Reprint Receipt</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input style={{ ...styles.input, flex: 1 }} placeholder="Receipt # or Customer name" value={reprintSearch} onChange={e => setReprintSearch(e.target.value)} />
              <button style={styles.btn(C.orange)} onClick={handleReprintSearch}>Search</button>
            </div>
            {reprintResults.length === 0 && (
              <div style={{ color: C.muted, textAlign: "center", padding: 20 }}>No receipts found. Try searching by receipt number or customer name.</div>
            )}
            {reprintResults.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 13 }}>{r.reference_number}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{r.customer_name} · {fmt(r.total)}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{fmtDateShort(r.created_at)}</div>
                </div>
                <button style={styles.miniBtn(C.orange)} onClick={() => handleReprint(r)}>Reprint</button>
              </div>
            ))}
            <button style={{ ...styles.btn(C.brown), width: "100%", marginTop: 16 }} onClick={() => setShowReprint(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ── BRANCH REPORTS MODAL ── */}
      {showBranchReports && (
        <div style={styles.modal} onClick={() => setShowBranchReports(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: C.brown, marginTop: 0 }}>Branch Reports</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <select style={styles.input} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                <option value="all">All Branches</option>
                {branchData.map((b, i) => (
                  <option key={i} value={b.branch}>{b.branch}</option>
                ))}
              </select>
            </div>
            {branchData.length === 0 && (
              <div style={{ color: C.muted, textAlign: "center", padding: 20 }}>No branch data available</div>
            )}
            {branchData.filter(b => branchFilter === "all" || b.branch === branchFilter).map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                <div>
                  <div style={{ fontWeight: "bold" }}>{b.branch}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{b.cashier_name || "N/A"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", color: C.green }}>{fmt(b.revenue || 0)}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{b.transactions || 0} txs</div>
                </div>
              </div>
            ))}
            <button style={{ ...styles.btn(C.brown), width: "100%", marginTop: 16 }} onClick={() => setShowBranchReports(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ── TILL REPORTS MODAL ── */}
      {showTillReports && (
        <div style={styles.modal} onClick={() => setShowTillReports(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: C.brown, marginTop: 0 }}>Till Reports</h3>
            {tillData.length === 0 && (
              <div style={{ color: C.muted, textAlign: "center", padding: 20 }}>No till data available</div>
            )}
            {tillData.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                <div>
                  <div style={{ fontWeight: "bold" }}>Till: {t.till_id || t.cashier_name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Cashier: {t.cashier_name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Status: {t.status}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", color: C.green }}>{fmt(t.total_revenue || 0)}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{t.total_transactions || 0} txs</div>
                </div>
              </div>
            ))}
            <button style={{ ...styles.btn(C.brown), width: "100%", marginTop: 16 }} onClick={() => setShowTillReports(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ── RECONCILIATION MODAL ── */}
      {showReconciliation && (
        <div style={styles.modal} onClick={() => setShowReconciliation(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: C.brown, marginTop: 0 }}>Reconciliation</h3>
            {reconciliationData ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                  <span>Expected Cash</span>
                  <span style={{ fontWeight: "bold" }}>{fmt(reconciliationData.expected_cash || 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                  <span>Actual Cash</span>
                  <span style={{ fontWeight: "bold" }}>{fmt(reconciliationData.actual_cash || 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                  <span>Variance</span>
                  <span style={{ fontWeight: "bold", color: reconciliationData.variance > 0 ? C.green : C.red }}>
                    {fmt(reconciliationData.variance || 0)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span>Status</span>
                  <span style={{ fontWeight: "bold", color: reconciliationData.variance === 0 ? C.green : C.orange }}>
                    {reconciliationData.variance === 0 ? "Balanced" : "Variance Detected"}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: C.muted, textAlign: "center", padding: 20 }}>No reconciliation data available</div>
            )}
            <button style={{ ...styles.btn(C.brown), width: "100%", marginTop: 16 }} onClick={() => setShowReconciliation(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ── MULTI-TILL DASHBOARD MODAL ── */}
      {showMultiTill && (
        <div style={styles.modal} onClick={() => setShowMultiTill(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: C.brown, marginTop: 0 }}>Multi-Till Dashboard</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
              {multiTillData.length === 0 && (
                <div style={{ color: C.muted, textAlign: "center", padding: 20, gridColumn: "1/-1" }}>No active tills</div>
              )}
              {multiTillData.map((t, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 10, padding: 12, border: "1px solid " + C.border }}>
                  <div style={{ fontWeight: "bold", color: C.brown }}>{t.cashier_name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Till: {t.till_id || "N/A"}</div>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: C.green }}>{fmt(t.total_revenue || 0)}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{t.total_transactions || 0} transactions</div>
                  <div style={{ fontSize: 11, color: t.status === "open" ? C.green : C.red }}>{t.status || "Unknown"}</div>
                </div>
              ))}
            </div>
            <button style={{ ...styles.btn(C.brown), width: "100%" }} onClick={() => setShowMultiTill(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}