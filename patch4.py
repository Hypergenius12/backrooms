import re

with open('main.js', 'r') as f:
    code = f.read()

# Pointer lock listeners
pointer_listeners = """document.getElementById('startBtn').addEventListener('click',e=>{e.stopPropagation();sfx.init();gameStarted=true;doLock();});
overlayEl.addEventListener('click',()=>{sfx.init();gameStarted=true;doLock();});"""
pointer_new_listeners = """document.getElementById('startBtn').addEventListener('click',e=>{e.stopPropagation();sfx.init();gameStarted=true;gameState='playing';doLock();});
overlayEl.addEventListener('click',()=>{if(!gameStarted) return; sfx.init();gameStarted=true;gameState='playing';doLock();});"""
code = code.replace(pointer_listeners, pointer_new_listeners)

# In loadLevel, trigger flash overlay if lvl === -1
load_level_start = """function loadLevel(lvl) {"""
load_level_new_start = """function loadLevel(lvl) {
  if (lvl === -1) {
    flashOverlay.style.opacity = '1';
    setTimeout(() => { flashOverlay.style.opacity = '0'; }, 2000);
  }"""
code = code.replace(load_level_start, load_level_new_start)

with open('main.js', 'w') as f:
    f.write(code)

