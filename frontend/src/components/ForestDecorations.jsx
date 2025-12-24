import './ForestDecorations.css';

/**
 * ForestDecorations Component
 * Adds decorative elements: vines, mushrooms, fireflies
 */
function ForestDecorations() {
  return (
    <div className="forest-decorations">
      {/* Corner vines with leaves */}
      <div className="vine vine-top-left">
        <svg viewBox="0 0 200 200" fill="none">
          <path
            d="M0,0 Q30,20 40,50 T60,100 T80,140"
            stroke="var(--moss)"
            strokeWidth="3"
            opacity="0.6"
          />
          {/* Leaves on vine */}
          <ellipse cx="35" cy="35" rx="12" ry="18" fill="var(--leaf-green)" opacity="0.7" transform="rotate(-30 35 35)"/>
          <ellipse cx="50" cy="75" rx="14" ry="20" fill="var(--spring-green)" opacity="0.6" transform="rotate(20 50 75)"/>
          <ellipse cx="70" cy="115" rx="13" ry="19" fill="var(--moss-light)" opacity="0.7" transform="rotate(-15 70 115)"/>
        </svg>
      </div>

      <div className="vine vine-top-right">
        <svg viewBox="0 0 200 200" fill="none">
          <path
            d="M200,0 Q170,20 160,50 T140,100 T120,140"
            stroke="var(--moss)"
            strokeWidth="3"
            opacity="0.6"
          />
          {/* Leaves on vine */}
          <ellipse cx="165" cy="35" rx="12" ry="18" fill="var(--leaf-green)" opacity="0.7" transform="rotate(30 165 35)"/>
          <ellipse cx="150" cy="75" rx="14" ry="20" fill="var(--spring-green)" opacity="0.6" transform="rotate(-20 150 75)"/>
          <ellipse cx="130" cy="115" rx="13" ry="19" fill="var(--moss-light)" opacity="0.7" transform="rotate(15 130 115)"/>
        </svg>
      </div>

      {/* Bottom mushrooms */}
      <div className="mushroom mushroom-left">
        <svg viewBox="0 0 60 80">
          {/* Stem */}
          <rect x="22" y="40" width="16" height="35" rx="8" fill="var(--cream)" opacity="0.8"/>
          {/* Cap */}
          <ellipse cx="30" cy="35" rx="28" ry="20" fill="var(--mystical)" opacity="0.7"/>
          <ellipse cx="30" cy="35" rx="20" ry="14" fill="var(--mystical-light)" opacity="0.5"/>
          {/* Spots */}
          <circle cx="18" cy="32" r="4" fill="white" opacity="0.6"/>
          <circle cx="35" cy="28" r="3" fill="white" opacity="0.6"/>
          <circle cx="42" cy="35" r="3.5" fill="white" opacity="0.6"/>
        </svg>
      </div>

      <div className="mushroom mushroom-right">
        <svg viewBox="0 0 60 80">
          {/* Stem */}
          <rect x="22" y="40" width="16" height="35" rx="8" fill="var(--cream)" opacity="0.8"/>
          {/* Cap */}
          <ellipse cx="30" cy="35" rx="28" ry="20" fill="var(--mystical-dark)" opacity="0.7"/>
          <ellipse cx="30" cy="35" rx="20" ry="14" fill="var(--mystical)" opacity="0.5"/>
          {/* Spots */}
          <circle cx="20" cy="30" r="3.5" fill="white" opacity="0.6"/>
          <circle cx="32" cy="26" r="4" fill="white" opacity="0.6"/>
          <circle cx="40" cy="33" r="3" fill="white" opacity="0.6"/>
        </svg>
      </div>

      {/* Fireflies */}
      <div className="firefly firefly-1">
        <svg viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="4" fill="var(--golden-light)" opacity="0.8"/>
          <circle cx="10" cy="10" r="6" fill="var(--sunshine)" opacity="0.3"/>
        </svg>
      </div>
      <div className="firefly firefly-2">
        <svg viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="4" fill="var(--golden-light)" opacity="0.8"/>
          <circle cx="10" cy="10" r="6" fill="var(--sunshine)" opacity="0.3"/>
        </svg>
      </div>
      <div className="firefly firefly-3">
        <svg viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="4" fill="var(--golden-light)" opacity="0.8"/>
          <circle cx="10" cy="10" r="6" fill="var(--sunshine)" opacity="0.3"/>
        </svg>
      </div>
      <div className="firefly firefly-4">
        <svg viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="4" fill="var(--golden-light)" opacity="0.8"/>
          <circle cx="10" cy="10" r="6" fill="var(--sunshine)" opacity="0.3"/>
        </svg>
      </div>
      <div className="firefly firefly-5">
        <svg viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="4" fill="var(--golden-light)" opacity="0.8"/>
          <circle cx="10" cy="10" r="6" fill="var(--sunshine)" opacity="0.3"/>
        </svg>
      </div>

      {/* Ferns framing content */}
      <div className="fern fern-left">
        <svg viewBox="0 0 100 200" fill="none">
          <path d="M50,200 Q45,150 50,100 T50,0" stroke="var(--forest-primary)" strokeWidth="2" opacity="0.5"/>
          {/* Fronds */}
          <ellipse cx="30" cy="40" rx="20" ry="8" fill="var(--moss)" opacity="0.4" transform="rotate(-30 30 40)"/>
          <ellipse cx="70" cy="70" rx="20" ry="8" fill="var(--moss-light)" opacity="0.4" transform="rotate(30 70 70)"/>
          <ellipse cx="25" cy="100" rx="22" ry="9" fill="var(--leaf-green)" opacity="0.4" transform="rotate(-35 25 100)"/>
          <ellipse cx="75" cy="130" rx="22" ry="9" fill="var(--moss)" opacity="0.4" transform="rotate(35 75 130)"/>
          <ellipse cx="30" cy="160" rx="20" ry="8" fill="var(--moss-light)" opacity="0.4" transform="rotate(-30 30 160)"/>
        </svg>
      </div>

      <div className="fern fern-right">
        <svg viewBox="0 0 100 200" fill="none">
          <path d="M50,200 Q55,150 50,100 T50,0" stroke="var(--forest-primary)" strokeWidth="2" opacity="0.5"/>
          {/* Fronds */}
          <ellipse cx="70" cy="40" rx="20" ry="8" fill="var(--moss)" opacity="0.4" transform="rotate(30 70 40)"/>
          <ellipse cx="30" cy="70" rx="20" ry="8" fill="var(--moss-light)" opacity="0.4" transform="rotate(-30 30 70)"/>
          <ellipse cx="75" cy="100" rx="22" ry="9" fill="var(--leaf-green)" opacity="0.4" transform="rotate(35 75 100)"/>
          <ellipse cx="25" cy="130" rx="22" ry="9" fill="var(--moss)" opacity="0.4" transform="rotate(-35 25 130)"/>
          <ellipse cx="70" cy="160" rx="20" ry="8" fill="var(--moss-light)" opacity="0.4" transform="rotate(30 70 160)"/>
        </svg>
      </div>
    </div>
  );
}

export default ForestDecorations;
