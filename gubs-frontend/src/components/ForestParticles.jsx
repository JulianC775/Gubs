import './ForestParticles.css';

/**
 * ForestParticles Component
 * Creates floating particles (light orbs, leaves, dust motes)
 */
function ForestParticles() {
  // Generate particle data with random positions and delays
  const particles = [
    { type: 'orb', left: '10%', top: '20%', delay: 0, duration: 15 },
    { type: 'orb', left: '85%', top: '40%', delay: -5, duration: 18 },
    { type: 'orb', left: '30%', top: '60%', delay: -10, duration: 16 },
    { type: 'orb', left: '65%', top: '25%', delay: -3, duration: 17 },
    { type: 'dust', left: '20%', top: '35%', delay: -2, duration: 12 },
    { type: 'dust', left: '75%', top: '55%', delay: -8, duration: 14 },
    { type: 'dust', left: '45%', top: '15%', delay: -12, duration: 13 },
    { type: 'dust', left: '90%', top: '70%', delay: -6, duration: 11 },
    { type: 'leaf', left: '15%', top: '45%', delay: -4, duration: 20 },
    { type: 'leaf', left: '60%', top: '30%', delay: -15, duration: 22 },
    { type: 'leaf', left: '40%', top: '65%', delay: -9, duration: 19 },
    { type: 'leaf', left: '80%', top: '20%', delay: -7, duration: 21 },
  ];

  return (
    <div className="forest-particles">
      {particles.map((particle, index) => (
        <div
          key={index}
          className={`particle particle-${particle.type}`}
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default ForestParticles;
