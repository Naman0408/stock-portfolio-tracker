import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>Stock Portfolio App</h1>
      <button onClick={() => navigate("/login")}>
        Get Started
      </button>
    </div>
  );
}

export default Landing;