import React, { useContext } from "react";
import { useNavigate} from "react-router-dom";
import axios from 'axios';
import './Header.css';
import { ReactComponent as Logo } from './icons/LogoBlanco.svg';
import { LoginContext } from "./App";

function Header() {

    const navigate = useNavigate();
    axios.defaults.withCredentials = true;

    const [loggedIn, setLoggedIn] = useContext(LoginContext)
    
    async function logout(){
        await axios.get("/api/logout").then((response) => {
            setLoggedIn(false)
            navigate('/')
        })
    }

    return (
        <div className="header">
            <a href="/"><Logo /></a>
            {loggedIn? <button className="btn" onClick={logout}>Cerrar sesión</button>:<></>}
        </div>
    )
}

export default Header;