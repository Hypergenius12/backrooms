import re

with open('main.js', 'r') as f:
    code = f.read()

# SFX: add screech
sfx_buzz = "buzz(v=1){if(this.ctx.state==='suspended')this.ctx.resume();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(50+Math.random()*10,this.ctx.currentTime);g.gain.setValueAtTime(v*SET.volume*.1,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+.5);o.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+.5)}"
sfx_screech = sfx_buzz + """
  screech(){
    if(this.ctx.state==='suspended')this.ctx.resume();
    const o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();
    o.type='square'; o.frequency.setValueAtTime(1000,this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(300,this.ctx.currentTime+1.5);
    f.type='bandpass'; f.frequency.value=2000; f.Q.value=5;
    g.gain.setValueAtTime(SET.volume,this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+2.0);
    o.connect(f); f.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime+2.0);
  }"""
code = code.replace(sfx_buzz, sfx_screech)

# Entity class updates
entity_init = "this.speed=1.8; this.chaseSpeed=4.5;"
entity_new_init = "this.speed=1.8; this.chaseSpeed = currentLevel === -1 ? 5.2 : 4.6;"
code = code.replace(entity_init, entity_new_init)

# Jumpscare collision in Entity update
entity_update = "if(dist < 18) {"
entity_new_update = """if(gameState === 'dead') return;
    if(dist < 0.8) {
      gameState = 'dead';
      document.body.classList.add('is-dead');
      deathScreen.style.display = 'flex';
      sfx.screech();
      // Snap camera
      const dir = new THREE.Vector3().subVectors(this.group.position, camera.position).normalize();
      dir.y = 0;
      const target = new THREE.Vector3().addVectors(camera.position, dir);
      camera.lookAt(target);
      return;
    }
    if(dist < 18) {"""
code = code.replace(entity_update, entity_new_update)

# Level Transition and Timer in main update() loop
update_loop = "requestAnimationFrame(update);"
update_new_loop = """
  if(gameState === 'playing') {
    levelTime += dt;
    if(levelTime > 180 && currentLevel === 0) {
      loadLevel(-1);
    }
  }
  requestAnimationFrame(update);"""
code = code.replace(update_loop, update_new_loop)

with open('main.js', 'w') as f:
    f.write(code)

