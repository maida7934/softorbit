import React from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      {/* Left: logo */}
      <div className={styles.logo}>
        <div className={styles.logoTop}> SOFT </div>
        <div className={styles.logoBottom}>ORBIT</div>
      </div>

      {/* Center: links */}
      <div className={styles.navCenter}>
        <span className={styles.navLink}>HOME</span>
        <span className={styles.navLink}>STORY</span>
        <span className={styles.navLink}>PROJECTS</span>
        <span className={styles.navLink}>CONTACT</span>
      </div>

      {/* Right: CTA */}
      <button className={styles.navCta}>MENU</button>
    </nav>
  );
}
