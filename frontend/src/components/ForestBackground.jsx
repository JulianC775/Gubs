import './ForestBackground.css';

/**
 * ForestBackground Component
 * Creates layered tree silhouettes and fog for depth
 */
function ForestBackground() {
  return (
    <div className="forest-background">
      {/* Layer 1: Far distant trees */}
      <div className="forest-layer forest-layer-far">
        <svg className="tree-silhouette" viewBox="0 0 100 200" preserveAspectRatio="none">
          <polygon points="50,0 30,60 40,60 20,100 30,100 10,150 50,150 90,150 70,100 80,100 60,60 70,60"
                   fill="currentColor" opacity="0.15"/>
        </svg>
        <svg className="tree-silhouette" viewBox="0 0 100 200" preserveAspectRatio="none" style={{left: '20%'}}>
          <polygon points="50,0 35,50 45,50 25,90 35,90 15,140 50,140 85,140 65,90 75,90 55,50 65,50"
                   fill="currentColor" opacity="0.12"/>
        </svg>
        <svg className="tree-silhouette" viewBox="0 0 100 200" preserveAspectRatio="none" style={{left: '75%'}}>
          <polygon points="50,10 30,70 40,70 20,110 30,110 10,160 50,160 90,160 70,110 80,110 60,70 70,70"
                   fill="currentColor" opacity="0.15"/>
        </svg>
      </div>

      {/* Layer 2: Mid-distance trees */}
      <div className="forest-layer forest-layer-mid">
        <svg className="tree-silhouette" viewBox="0 0 80 180" preserveAspectRatio="none">
          <path d="M40,0 L25,50 L30,50 L15,90 L20,90 L5,140 L40,140 L75,140 L60,90 L65,90 L50,50 L55,50 Z"
                fill="currentColor" opacity="0.25"/>
        </svg>
        <svg className="tree-silhouette" viewBox="0 0 80 180" preserveAspectRatio="none" style={{left: '40%'}}>
          <path d="M40,5 L28,55 L33,55 L18,95 L23,95 L8,145 L40,145 L72,145 L57,95 L62,95 L47,55 L52,55 Z"
                fill="currentColor" opacity="0.3"/>
        </svg>
        <svg className="tree-silhouette" viewBox="0 0 80 180" preserveAspectRatio="none" style={{left: '85%'}}>
          <path d="M40,0 L26,52 L31,52 L16,92 L21,92 L6,142 L40,142 L74,142 L59,92 L64,92 L49,52 L54,52 Z"
                fill="currentColor" opacity="0.28"/>
        </svg>
      </div>

      {/* Layer 3: Foreground foliage (partial view, like looking through leaves) */}
      <div className="forest-layer forest-layer-near">
        <div className="foliage-blur foliage-left">
          <svg viewBox="0 0 200 200" preserveAspectRatio="none">
            <ellipse cx="100" cy="100" rx="80" ry="120" fill="var(--forest-floor)" opacity="0.4"/>
            <ellipse cx="60" cy="80" rx="50" ry="70" fill="var(--moss)" opacity="0.3"/>
          </svg>
        </div>
        <div className="foliage-blur foliage-right">
          <svg viewBox="0 0 200 200" preserveAspectRatio="none">
            <ellipse cx="100" cy="100" rx="80" ry="120" fill="var(--forest-floor)" opacity="0.4"/>
            <ellipse cx="140" cy="80" rx="50" ry="70" fill="var(--moss)" opacity="0.3"/>
          </svg>
        </div>
      </div>

      {/* Layer 4: Animated fog/mist */}
      <div className="forest-fog">
        <div className="fog-layer fog-1"></div>
        <div className="fog-layer fog-2"></div>
        <div className="fog-layer fog-3"></div>
      </div>
    </div>
  );
}

export default ForestBackground;
