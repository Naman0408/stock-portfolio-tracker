import React, { useState } from "react";
import axios from "axios";

function App() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [portfolio, setPortfolio] = useState([]);

  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  const sendOtp = async () => {
    await axios.post("http://localhost:3001/api/send-otp", { email });
    alert("OTP sent");
  };

  const verifyOtp = async () => {
    const res = await axios.post("http://localhost:3001/api/verify-otp", {
      email,
      otp
    });
    setToken(res.data.token);
    alert("Login success");
  };

  const getPortfolio = async () => {
    const res = await axios.get("http://localhost:3001/api/portfolio", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPortfolio(res.data);
  };

  const addStock = async () => {
    await axios.post("http://localhost:3001/api/buy", {
      symbol,
      quantity,
      buyPrice
    });
    alert("Stock added");
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>📊 Stock Portfolio</h1>

      {/* LOGIN */}
      <div style={{ border: "1px solid #ccc", padding: 20, marginBottom: 20 }}>
        <h2>Login</h2>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <button onClick={sendOtp}>Send OTP</button>

        <br /><br />

        <input
          placeholder="Enter OTP"
          onChange={(e) => setOtp(e.target.value)}
        />
        <br /><br />

        <button onClick={verifyOtp}>Verify OTP</button>
      </div>

      {/* ADD STOCK */}
      <div style={{ border: "1px solid #ccc", padding: 20, marginBottom: 20 }}>
        <h2>Add Stock</h2>

        <input placeholder="Symbol (AAPL)" onChange={(e) => setSymbol(e.target.value)} />
        <br /><br />

        <input placeholder="Quantity" onChange={(e) => setQuantity(e.target.value)} />
        <br /><br />

        <input placeholder="Buy Price" onChange={(e) => setBuyPrice(e.target.value)} />
        <br /><br />

        <button onClick={addStock}>Add Stock</button>
      </div>

      {/* PORTFOLIO */}
      <div style={{ border: "1px solid #ccc", padding: 20 }}>
        <h2>Your Portfolio</h2>

        <button onClick={getPortfolio}>Load Portfolio</button>

        <br /><br />

        {portfolio.map((item, index) => (
          <div key={index} style={{
            border: "1px solid #eee",
            padding: 10,
            marginBottom: 10,
            background: item.profitLoss >= 0 ? "#e6ffe6" : "#ffe6e6"
          }}>
            <b>{item.symbol}</b> <br />
            Qty: {item.quantity} <br />
            Buy: ₹{item.buyPrice} <br />
            Current: ₹{item.currentPrice} <br />
            Profit: ₹{item.profitLoss}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
