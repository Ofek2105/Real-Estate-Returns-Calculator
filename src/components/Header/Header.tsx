// src/components/Header/Header.tsx

import "./Header.css";
import RNLogo from "../../assets/RN_logo.svg";

export default function Header() {
    return (
        <header className="header">
            <div className="header-content">
                <img src={RNLogo} alt="RN Logo" className="header-logo" />
                <h1 className="header-title">INVESTMENTS SRL</h1>
            </div>
        </header>
    );
}
