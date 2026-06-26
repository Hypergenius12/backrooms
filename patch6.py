import re

with open('main.js', 'r') as f:
    code = f.read()

# Change materials inside buildChunk
mat_dec = """const matFloor=new THREE.MeshStandardMaterial({map:floorMap,roughness:.8,metalness:.1});
  const matCeil=new THREE.MeshLambertMaterial({map:ceilMap});
  const matWall=new THREE.MeshLambertMaterial({map:realWallTex});"""

mat_new_dec = """let matFloor=new THREE.MeshStandardMaterial({map:floorMap,roughness:.8,metalness:.1});
  let matCeil=new THREE.MeshLambertMaterial({map:ceilMap});
  let matWall=new THREE.MeshLambertMaterial({map:realWallTex});
  if (currentLevel === -1) {
    matFloor = new THREE.MeshStandardMaterial({color:0x333333,roughness:.9,metalness:.1});
    matCeil = new THREE.MeshLambertMaterial({color:0x111111});
    matWall = new THREE.MeshStandardMaterial({color:0x445566,roughness:.5,metalness:.6});
  }"""

code = code.replace(mat_dec, mat_new_dec)

# Change walk cycle animation to not crash if arms/legs are empty (for Level -1 entity)
walk_cycle = """this.arms[0].rotation.x=walkCycle; this.arms[1].rotation.x=-walkCycle;
    this.legs[0].rotation.x=-walkCycle; this.legs[1].rotation.x=walkCycle;"""
walk_new_cycle = """if(this.arms.length>0){this.arms[0].rotation.x=walkCycle; this.arms[1].rotation.x=-walkCycle;}
    if(this.legs.length>0){this.legs[0].rotation.x=-walkCycle; this.legs[1].rotation.x=walkCycle;}"""

code = code.replace(walk_cycle, walk_new_cycle)

with open('main.js', 'w') as f:
    f.write(code)

