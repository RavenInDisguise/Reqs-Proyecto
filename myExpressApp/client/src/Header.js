import React, { useEffect, useState } from "react";
import './Header.css';
import { ReactComponent as Logo } from './icons/LogoBlanco.svg';

function Header() {
    return (
        <div className="header">
            <a href="/"><Logo /></a>
        </div>
    )
}

export default Header;