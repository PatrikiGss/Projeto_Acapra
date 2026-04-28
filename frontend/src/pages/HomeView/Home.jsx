import { useEffect, useState } from "react";
import "./Home.css"

function Home() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then(res => res.json())
      .then(data => setMsg(data.message));
  }, []);

  return (
    <div className="main">
      <h1>Home</h1>
      <p>{msg}</p>
    </div>
  );
}

export default Home;