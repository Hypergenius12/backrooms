import re

with open('main.js', 'r') as f:
    code = f.read()

# 1. Update CSZ line
code = code.replace("const CSZ=24, CELL=4, WH=2.72; // 24x24 cells per chunk",
                    "const CSZ=24, CELL=4;\nlet WH=2.72;")

# 2. Add Warehouse Generation
gen_target = """function generateChunkData(cx, cz) {
  const prng = new PRNG(Math.abs(cx * 10000 + cz) ^ 12345);
  // Start solid (all false)
  const m = Array(CSZ).fill(0).map(() => Array(CSZ).fill(false));"""

warehouse_code = """function generateChunkData(cx, cz) {
  const prng = new PRNG(Math.abs(cx * 10000 + cz) ^ 12345);
  const m = Array(CSZ).fill(0).map(() => Array(CSZ).fill(false));

  if (currentLevel === -1) {
    for (let i = 0; i < 4; i++) {
      const w = 8 + Math.floor(prng.next() * 10);
      const h = 8 + Math.floor(prng.next() * 10);
      const x = 1 + Math.floor(prng.next() * (CSZ - w - 2));
      const y = 1 + Math.floor(prng.next() * (CSZ - h - 2));
      for (let r = y; r < y + h; r++) {
        for (let c = x; c < x + w; c++) m[r][c] = true;
      }
    }
    const mid = Math.floor(CSZ/2);
    for(let i=-3; i<=3; i++) {
      for(let r=0; r<CSZ; r++) m[r][mid+i] = true;
      for(let c=0; c<CSZ; c++) m[mid+i][c] = true;
    }
    for (let r = 2; r < CSZ-3; r+=5) {
      for (let c = 2; c < CSZ-3; c+=5) {
        if (m[r][c] && m[r+1][c+1] && prng.next() < 0.6) {
          m[r][c] = m[r+1][c] = m[r][c+1] = m[r+1][c+1] = false;
        }
      }
    }
    return { m, prng };
  }
  // Start solid (all false)"""

code = code.replace(gen_target, warehouse_code)

with open('main.js', 'w') as f:
    f.write(code)

