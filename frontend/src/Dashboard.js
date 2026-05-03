import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [portfolio, setPortfolio] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // 📊 Totals
  const totalInvestment = portfolio.reduce(
    (sum, item) => sum + item.investment,
    0
  );

  const totalProfit = portfolio.reduce(
    (sum, item) => sum + item.profitLoss,
    0
  );

  // 🔒 Protect page
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // ➕ Add Stock
  const addStock = async () => {
    if (!symbol || !quantity || !buyPrice) {
      alert("Fill all fields ❌");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setAdding(true);

      await new Promise((resolve) => setTimeout(resolve, 300));

      await axios.post(
        "http://localhost:3001/api/buy",
        { symbol, quantity, buyPrice },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Stock added ✅");

      loadPortfolio();
    } catch (err) {
      console.log(err);
      alert("Error adding stock ❌");
    } finally {
      setAdding(false);
    }
  };

  // 📥 Load Portfolio
  const loadPortfolio = async () => {
    const token = localStorage.getItem("token");

    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:3001/api/portfolio",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPortfolio(res.data);
    } catch (err) {
      console.log(err);
      alert("Error loading portfolio ❌");
    } finally {
      setLoading(false);
    }
  };

  // 🔓 Logout
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: "#f5f6fa",
        paddingTop: "40px",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <button onClick={logout} style={{ float: "right" }}>
          Logout
        </button>

        <h2 style={{ textAlign: "center" }}>Dashboard</h2>

        <button
          onClick={loadPortfolio}
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Loading..." : "Load Portfolio"}
        </button>

        <hr />

        <h3>Add Stock</h3>

        <input
          placeholder="Symbol (AAPL)"
          onChange={(e) => setSymbol(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <input
          placeholder="Quantity"
          onChange={(e) => setQuantity(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <input
          placeholder="Buy Price"
          onChange={(e) => setBuyPrice(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <button
          onClick={addStock}
          disabled={adding}
          style={{ width: "100%" }}
        >
          {adding ? "Adding..." : "Add Stock"}
        </button>

        <hr />

        <h3>Portfolio</h3>

        <div style={{ marginBottom: "15px" }}>
          <h4>Total Investment: ₹{totalInvestment.toFixed(2)}</h4>
          <h4 style={{ color: totalProfit >= 0 ? "green" : "red" }}>
            Total Profit: ₹{totalProfit.toFixed(2)}
          </h4>
        </div>

        {/* 📦 Portfolio Cards */}
        {portfolio.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              backgroundColor:
                item.profitLoss >= 0 ? "#e6ffed" : "#ffe6e6",
            }}
          >
            <h4>{item.symbol}</h4>

            <button onClick={() => setSelectedStock(item.symbol)}>
              View Chart
            </button>

            <p>Qty: {item.quantity}</p>
            <p>Buy: ₹{item.buyPrice.toFixed(2)}</p>
            <p>Current: ₹{item.currentPrice.toFixed(2)}</p>
            <p>Profit: ₹{item.profitLoss.toFixed(2)}</p>
          </div>
        ))}

        {/* 📈 Chart Section */}
        {selectedStock && (
          <div style={{ marginTop: "20px" }}>
            <h3>Chart: {selectedStock}</h3>

            <button onClick={() => setSelectedStock(null)}>
              Close Chart
            </button>

            <iframe
              src={`https://www.tradingview.com/widgetembed/?symbol=${selectedStock}`}
              width="100%"
              height="400"
              frameBorder="0"
              title="stock-chart"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;