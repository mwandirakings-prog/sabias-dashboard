import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";

// ── CONFIG ────────────────────────────────────────────────
const API = "https://api.sabiasanalytics.com";
const DB_NAME = "SabiaPOS_Offline";
const DB_VER = 1;

// ── COLORS ───────────────────────────────────────────────
const C = {
  brown: "#3E1F00", gold: "#FFB800", orange: "#FF6B35",
  green: "#2D6A4F", red: "#C62828", bg: "#FFF8F0",
  white: "#FFFFFF", muted: "#888", border: "#FFE8D0",
  darkbg: "#1A0A00",
};

// ── HELPERS ──────────────────────────────────────────────
const fmt = (n) => "MWK " + new Intl.NumberFormat().format(Math.round(n || 0));
const fmtDate = (d) => d ? new Date(d).toLocaleString() : "—";
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

// ── QR CODE DISPLAY COMPONENT ─────────────────────────────
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
    if (syncing) {
      console.log("Sync already in progress, skipping...");
      return;
    }
    const pending = await getPending();
    if (pending.length === 0) {
      console.log("No pending items to sync");
      return;
    }
    console.log(`Syncing ${pending.length} pending items...`);
    setSyncing(true);
    let syncedCount = 0;

    for (const tx of pending) {
      try {
        const res = await api("POST", "/api/pos/transactions", tx, token);
        if (res.success) {
          await removePending(tx.offline_reference);
          syncedCount++;
          console.log(`Synced: ${tx.offline_reference}`);
        }
      } catch (err) {
        console.error("Sync failed for:", tx.offline_reference, err);
      }
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
    if (!authToken) {
      console.error("No token available for inventory load");
      return;
    }
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

  // ── AFTER LOGIN, CHECK FOR SESSION ──────────────────────
  useEffect(() => {
    if (token) {
      checkExistingSession();
    }
  }, [token]);

  // ── PRINT ──────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page { margin: 10mm; }
      body { font-family: Arial, sans-serif; background: white; }
      * { color: #3E1F00; }
    `
  });

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
    if (!session) return;
    try {
      await api("PUT", `/api/pos/sessions/${session.id}/close`, { closing_cash: parseFloat(closeCash) || 0 }, token);
      await loadSummary();
      setScreen("summary");
    } catch {
      showToast("Failed to close session.", "red");
    }
  };

  // ── LOAD SUMMARY ──────────────────────────────────────
  const loadSummary = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [sumRes, txRes] = await Promise.all([
        api("GET", `/api/pos/summary?date=${today}`, null, token),
        api("GET", `/api/pos/transactions?session_id=${session?.id}`, null, token),
      ]);
      if (sumRes.success) setSummaryData(sumRes.data);
      if (txRes.success) setTransactions(txRes.data);
    } catch {}
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
    };

    if (online) {
      try {
        const res = await api("POST", "/api/pos/transactions", txData, token);
        if (res.success) {
          setLastReceipt({ ...txData, reference: res.reference || txData.offline_reference, total, subtotal, cashier: user?.name });
          setCart([]);
          setDiscount(0);
          setCustomerName("");
          setCustomerPhone("");
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
    plain: { fontWeight: "bold", color: C.brown },
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
          <div style={styles.header}>
            <div>
              <div style={styles.logo}>SABIAS POS</div>
              <div style={{ color: C.orange, fontSize: 11 }}>{user?.company} · {user?.name}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ ...styles.badge, background: online ? C.green : C.red }}>{online ? "Online" : "Offline"}</div>
              {pendingCount > 0 && <div style={styles.badge}>{pendingCount} pending</div>}
              {syncing && <div style={{ color: C.gold, fontSize: 12 }}>Syncing...</div>}
              {pendingCount > 0 && !syncing && (
                <button style={styles.btn(C.orange)} onClick={syncPending}>Sync Now</button>
              )}
              <button style={styles.btn(C.orange)} onClick={loadSummary}>Summary</button>
              <button style={styles.btn(C.red)} onClick={() => { loadSummary(); setScreen("summary"); }}>Close</button>
            </div>
          </div>

          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* LEFT: Product grid */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input ref={barcodeRef} style={{ ...styles.input, maxWidth: 200 }} value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} placeholder="Scan barcode..." onKeyDown={e => e.key === "Enter" && handleBarcode(barcodeInput)} />
                <input style={{ ...styles.input, flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..." />
              </div>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: "bold", fontSize: 16, color: C.brown }}>TOTAL</span>
                  <span style={{ fontWeight: "bold", fontSize: 18, color: C.orange }}>{fmt(total)}</span>
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {["Cash", "Airtel Money", "TNM Mpamba", "Bank transfer", "Voucher"].map(m => (
                    <button key={m} style={{ ...styles.btn(payMethod === m ? C.brown : C.bg, payMethod === m ? C.gold : C.brown), flex: 1, padding: "8px 4px", fontSize: 11, border: "1px solid " + C.border }} onClick={() => setPayMethod(m)}>{m}</button>
                  ))}
                </div>

                <button style={{ ...styles.btn(C.green), width: "100%", padding: "14px 0", fontSize: 16 }} onClick={checkout} disabled={checkoutLoading || cart.length === 0}>
                  {checkoutLoading ? "Processing..." : "Charge " + fmt(total)}
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
            {/* ── PRINTABLE CONTENT ── */}
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
                Thank you for shopping at {user?.company}!<br />
                Powered by SABIAS Analytics
              </div>
            </div>

            {/* ── BUTTONS ── */}
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
              <button style={styles.btn(C.orange)} onClick={() => setScreen("pos")}>Back to POS</button>
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
                { label: "Transactions", value: summaryData.total_transactions, color: C.brown },
                { label: "Total Revenue", value: fmt(summaryData.total_revenue), color: C.green },
                { label: "Cash", value: fmt(summaryData.cash_total), color: C.orange },
                { label: "Airtel Money", value: fmt(summaryData.airtel_total), color: "#E65100" },
                { label: "TNM Mpamba", value: fmt(summaryData.tnm_total), color: C.brown },
                { label: "Discounts", value: fmt(summaryData.total_discounts), color: C.red },
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
    </div>
  );
}