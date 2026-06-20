import os

base_path = r"c:\Users\apo_q\.gemini\antigravity\scratch\alucalculator\cto_karahan_godot"

files_to_create = [
    # Character skins
    r"assets\textures\characters\skins\selim_torso.png",
    r"assets\textures\characters\skins\selim_head.png",
    r"assets\textures\characters\skins\selim_left_leg.png",
    r"assets\textures\characters\skins\selim_right_leg.png",
    r"assets\textures\characters\skins\selim_left_boot.png",
    r"assets\textures\characters\skins\selim_right_boot.png",
    
    r"assets\textures\characters\skins\orhan_torso.png",
    r"assets\textures\characters\skins\orhan_head.png",
    r"assets\textures\characters\skins\orhan_left_leg.png",
    r"assets\textures\characters\skins\orhan_right_leg.png",
    r"assets\textures\characters\skins\orhan_left_boot.png",
    r"assets\textures\characters\skins\orhan_right_boot.png",
    
    r"assets\textures\characters\skins\riza_torso.png",
    r"assets\textures\characters\skins\riza_head.png",
    r"assets\textures\characters\skins\riza_left_leg.png",
    r"assets\textures\characters\skins\riza_right_leg.png",
    r"assets\textures\characters\skins\riza_left_boot.png",
    r"assets\textures\characters\skins\riza_right_boot.png",
    
    # UI
    r"assets\ui\tablet_background.png",
    r"assets\ui\factory_logo.png",
    
    # World Textures
    r"assets\textures\world\epoxy_floor_albedo.png",
    r"assets\textures\world\epoxy_floor_normal.png",
    r"assets\textures\world\brut_concrete_albedo.png",
    r"assets\textures\world\brut_concrete_normal.png",
    r"assets\textures\world\asphalt_road_albedo.png",
    r"assets\textures\world\asphalt_road_normal.png",
]

print("Starting placeholder creation...")
for rel_path in files_to_create:
    full_path = os.path.join(base_path, rel_path)
    dir_name = os.path.dirname(full_path)
    
    # Create directories if they don't exist
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)
        print(f"Created directory: {dir_name}")
        
    # Create empty file (0 KB)
    with open(full_path, "wb") as f:
        pass
    print(f"Created empty file: {full_path}")

print("All placeholders created successfully!")
