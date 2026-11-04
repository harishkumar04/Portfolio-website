"use client";

/**
 * Phase 1 scaffold: proves the canvas, camera controller and render loop.
 * Replaced in Phase 2 by the real harbor (ocean, sky, terminal, cranes, ships).
 */
export function HarborEnvironment() {
  return (
    <>
      <color attach="background" args={["#f2a36b"]} />
      <fog attach="fog" args={["#e8946a", 80, 900]} />
      <ambientLight intensity={0.4} color="#8a7bb5" />
      <directionalLight position={[-40, 30, -120]} intensity={2.2} color="#ffb067" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardMaterial color="#1e2a4a" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[12, 8, 6]} />
        <meshStandardMaterial color="#c2562d" roughness={0.6} metalness={0.3} />
      </mesh>
    </>
  );
}
