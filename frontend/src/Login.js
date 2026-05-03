import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const navigate = useNavigate();

  const sendOtp = async () => {
    await axios.post("http://localhost:3001/api/send-otp", { email });
    alert("OTP sent (check terminal)");
  };

  const verifyOtp = async () => {
    const res = await axios.post("http://localhost:3001/api/verify-otp", {
      email,
      otp
    });

    localStorage.setItem("token", res.data.token);

    alert("Login success");

    navigate("/dashboard"); // ✅ redirect
  };

  return (
    <div>
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
  );
}

export default Login;