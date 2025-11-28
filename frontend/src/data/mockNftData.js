// frontend/src/data/mockNftData.js

const baseThumbnails = [
  "/textures/planet_default.jpg",
  "/textures/earth.jpg",
  "/textures/mars.jpg",
  "/textures/neptune.jpg",
  "/textures/saturn.jpg",
  "/textures/venus.jpg",
  "/textures/jupiter.jpg",
  "/textures/uranus.jpg",
  "/textures/mercury.jpg",
  "/textures/sun.jpg",
];

const artistAliases = [
  "NovaExplorer",
  "StarSynth",
  "NebulaFox",
  "OrbitSmith",
  "LumenPilot",
  "GravityMuse",
  "AstroViolet",
  "QuasarKit",
];

const mockNftData = Array.from({ length: 18 }).map((_, index) => {
  const likes = Math.floor(500 + Math.random() * 4500);
  const views = Math.floor(2000 + Math.random() * 18000);
  const price = Number((2 + Math.random() * 18).toFixed(2));
  const createdAt = new Date(Date.now() - index * 86400000).toISOString();

  return {
    id: index + 1,
    title: `Celestia Planet #${index + 1}`,
    artist: artistAliases[index % artistAliases.length],
    likes,
    views,
    price,
    thumbnail: baseThumbnails[index % baseThumbnails.length],
    category: index % 2 === 0 ? "Planetary" : "Artifact",
    createdAt,
  };
});

export default mockNftData;

