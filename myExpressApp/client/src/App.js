import React from "react";
import logo from './logo.svg';
import './App.css';

function App() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch("/estudiantes")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{!data ? "Loading..." : "Primer estudiante: " + data[0].nombre + " " + data[0].apellido1 + " " + data[0].apellido2}</p>
      </header>
    </div>
  );
}

export default App;
