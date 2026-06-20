class_name WorkerSkin
extends Resource

## Custom Godot Resource for Worker Skinning.
## Equips the skeletal joint rigging system with custom sprite textures and color tints.

@export_group("Joint Textures")
@export var torso_texture: Texture2D
@export var head_texture: Texture2D
@export var left_leg_texture: Texture2D
@export var right_leg_texture: Texture2D
@export var left_boot_texture: Texture2D
@export var right_boot_texture: Texture2D

@export_group("Accessory Textures")
@export var glasses_texture: Texture2D
@export var mustache_texture: Texture2D

@export_group("Visual Overrides")
## Overall color tint applied to the torso jacket.
@export var costume_tint: Color = Color.WHITE

## Optional helmet color override. If set to transparent (alpha = 0), uses the default skill-based color.
@export var helmet_color_override: Color = Color(0, 0, 0, 0)
