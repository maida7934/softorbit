import React from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <div className={styles.logoTop}>soft</div>
        <div className={styles.logoBottom}>orbit</div>
      </div>
      <div className={styles.navRight}>
        <span className={styles.navLink}>about us</span>
        <span className={styles.navLink}>menu</span>
        <button className={styles.hamburger}>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>
    </nav>
  );
}
