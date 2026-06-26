import re

with open('main.js', 'r') as f:
    code = f.read()

# Add setVisuals to Entity
entity_class_start = """class Entity{
  constructor(){
    this.group=new THREE.Group();
    const bodyMat=new THREE.MeshLambertMaterial({color:0x0a0a0a});
    const shadowMat=new THREE.MeshLambertMaterial({color:0x0a0a0a,transparent:true,opacity:.85});
    const torso=new THREE.Mesh(new THREE.BoxGeometry(.4,1.1,.25),bodyMat); torso.position.y=1.3;this.group.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),bodyMat); head.position.y=2.05;head.scale.y=1.3;this.group.add(head);
    const eyeMat=new THREE.MeshStandardMaterial({color:0xff2200,emissive:0xff2200,emissiveIntensity:0.8});
    const eyeL=new THREE.Mesh(new THREE.SphereGeometry(.03,4,4),eyeMat); eyeL.position.set(-.06,2.08,.15);this.group.add(eyeL);
    const eyeR=new THREE.Mesh(new THREE.SphereGeometry(.03,4,4),eyeMat); eyeR.position.set(.06,2.08,.15);this.group.add(eyeR);
    const armL=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),shadowMat); armL.position.set(-.3,1.1,0);armL.rotation.z=.08;this.group.add(armL);
    const armR=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),shadowMat); armR.position.set(.3,1.1,0);armR.rotation.z=-.08;this.group.add(armR);
    const legL=new THREE.Mesh(new THREE.BoxGeometry(.14,.8,.14),shadowMat); legL.position.set(-.1,.4,0);this.group.add(legL);
    const legR=new THREE.Mesh(new THREE.BoxGeometry(.14,.8,.14),shadowMat); legR.position.set(.1,.4,0);this.group.add(legR);
    this.glow=new THREE.PointLight(0xff1100,.3,8,2); this.glow.position.y=1.8;this.group.add(this.glow);
    this.arms=[armL,armR]; this.legs=[legL,legR];
    scene.add(this.group);"""

entity_new_class_start = """class Entity{
  constructor(){
    this.group=new THREE.Group();
    scene.add(this.group);
    this.setVisuals(0);
"""

code = code.replace(entity_class_start, entity_new_class_start)

# Add setVisuals method
entity_pos = """this.pos=new THREE.Vector2();"""
entity_new_pos = """this.pos=new THREE.Vector2();"""

method_code = """
  setVisuals(lvl) {
    while(this.group.children.length > 0){ 
      this.group.remove(this.group.children[0]); 
    }
    
    if (lvl === 0) {
      const bodyMat=new THREE.MeshLambertMaterial({color:0x0a0a0a});
      const shadowMat=new THREE.MeshLambertMaterial({color:0x0a0a0a,transparent:true,opacity:.85});
      const torso=new THREE.Mesh(new THREE.BoxGeometry(.4,1.1,.25),bodyMat); torso.position.y=1.3;this.group.add(torso);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),bodyMat); head.position.y=2.05;head.scale.y=1.3;this.group.add(head);
      const eyeMat=new THREE.MeshStandardMaterial({color:0xff2200,emissive:0xff2200,emissiveIntensity:0.8});
      const eyeL=new THREE.Mesh(new THREE.SphereGeometry(.03,4,4),eyeMat); eyeL.position.set(-.06,2.08,.15);this.group.add(eyeL);
      const eyeR=new THREE.Mesh(new THREE.SphereGeometry(.03,4,4),eyeMat); eyeR.position.set(.06,2.08,.15);this.group.add(eyeR);
      const armL=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),shadowMat); armL.position.set(-.3,1.1,0);armL.rotation.z=.08;this.group.add(armL);
      const armR=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),shadowMat); armR.position.set(.3,1.1,0);armR.rotation.z=-.08;this.group.add(armR);
      const legL=new THREE.Mesh(new THREE.BoxGeometry(.14,.8,.14),shadowMat); legL.position.set(-.1,.4,0);this.group.add(legL);
      const legR=new THREE.Mesh(new THREE.BoxGeometry(.14,.8,.14),shadowMat); legR.position.set(.1,.4,0);this.group.add(legR);
      this.glow=new THREE.PointLight(0xff1100,.3,8,2); this.glow.position.y=1.8;this.group.add(this.glow);
      this.arms=[armL,armR]; this.legs=[legL,legR];
    } else if (lvl === -1) {
      // The Smiler
      const cloudMat=new THREE.MeshLambertMaterial({color:0x000000, transparent:true, opacity:0.95});
      const cloud=new THREE.Mesh(new THREE.SphereGeometry(.5,16,16),cloudMat); cloud.position.y=1.8;
      this.group.add(cloud);
      const eyeMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:1.0});
      const eyeL=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),eyeMat); eyeL.position.set(-.15,1.9,.45);this.group.add(eyeL);
      const eyeR=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),eyeMat); eyeR.position.set(.15,1.9,.45);this.group.add(eyeR);
      const smile=new THREE.Mesh(new THREE.TorusGeometry(.2,.03,8,16,Math.PI),eyeMat);
      smile.position.set(0,1.7,.45); smile.rotation.z=Math.PI; this.group.add(smile);
      this.glow=new THREE.PointLight(0xffffff,.5,12,2); this.glow.position.y=1.8;this.group.add(this.glow);
      this.arms=[]; this.legs=[];
    }
  }
  
  this.pos=new THREE.Vector2();"""

code = code.replace(entity_pos, method_code)

with open('main.js', 'w') as f:
    f.write(code)

