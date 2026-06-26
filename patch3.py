import re

with open('main.js', 'r') as f:
    code = f.read()

# Player speed adjustment
player_speed = "const spd=sprint?8.4:4.2;"
player_new_speed = "const spd=sprint?5.0:2.5;"
code = code.replace(player_speed, player_new_speed)

# Add loadLevel logic right before Game Loop
level_logic = """/* ═══════ SETTINGS ═══════ */"""
load_level = """
/* ═══════ LEVEL LOGIC ═══════ */
function loadLevel(lvl) {
  currentLevel = lvl;
  levelTime = 0;
  
  // Clear chunks
  for (const [key, chunk] of activeChunks.entries()) {
    scene.remove(chunk.group);
  }
  activeChunks.clear();
  chunkData.clear();
  globalFixtures = [];

  if (lvl === 0) {
    scene.fog.color.setHex(0x0a0800);
    scene.background.setHex(0x0a0800);
    scene.children.forEach(c => {
      if(c instanceof THREE.AmbientLight) c.color.setHex(0xd4aa18);
      if(c instanceof THREE.HemisphereLight) { c.color.setHex(0xd4a010); c.groundColor.setHex(0x5a4800); }
    });
    entity.speed = 1.8;
    entity.chaseSpeed = 4.6;
    WH = 2.72;
  } else if (lvl === -1) {
    scene.fog.color.setHex(0x020511);
    scene.fog.density = 0.055;
    scene.background.setHex(0x020511);
    scene.children.forEach(c => {
      if(c instanceof THREE.AmbientLight) c.color.setHex(0x223344);
      if(c instanceof THREE.HemisphereLight) { c.color.setHex(0x224466); c.groundColor.setHex(0x050510); }
    });
    entity.speed = 2.5;
    entity.chaseSpeed = 5.2; // Fast!
    WH = 8.0; // Taller ceiling
  }
  
  // Reset player
  camera.position.set(48, 1.64, 48);
  entity.group.position.set(-1000, 0, -1000);
  entity.state = 'idle';
  
  updateChunks(camera.position.x, camera.position.z);
}

/* ═══════ SETTINGS ═══════ */"""

code = code.replace(level_logic, load_level)

with open('main.js', 'w') as f:
    f.write(code)

