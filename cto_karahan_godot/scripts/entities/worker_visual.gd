class_name WorkerVisual
extends Node2D

## Procedural 2.5D Isometric Worker Visualizer.
## Animates movement (bobbing), tools, helmets, tea breaks, and emotional status programmatically.
## Supports runtime Sprite2D/Polygon2D asset-skinning via joint Node2Ds and custom WorkerSkin Resources.

# Inner class representing a rigged joint node.
# If a joint node has custom CanvasItem assets (Sprite2D, Polygon2D, etc.) attached as children,
# it will skip drawing its procedural layout and let Godot render the custom assets automatically.
class JointNode extends Node2D:
	var visual: WorkerVisual
	var joint_name: String
	
	func _init(p_visual: WorkerVisual, p_name: String) -> void:
		visual = p_visual
		joint_name = p_name
		
	func _draw() -> void:
		if visual:
			visual.draw_joint(self, joint_name)

@onready var parent_worker: Worker = get_parent() as Worker

## Optional custom skin resource containing sprite textures for individual joints.
@export var skin_resource: WorkerSkin

# Animation variables
var _time_elapsed: float = 0.0
var _anim_state: float = 0.0

# Drawing Configs
const BODY_W: float = 24.0
const BODY_H: float = 32.0
const HEAD_R: float = 10.0

# Cached Tool Visual Drawers
var _tool_visuals: Dictionary = {}
var _fallback_visual: BaseToolVisual = WrenchVisual.new()

# Animation Player and Rigging Nodes
var anim_player: AnimationPlayer
var skeleton_root: Node2D
var torso_node: Node2D
var head_node: Node2D
var left_leg_node: Node2D
var right_leg_node: Node2D
var left_boot_node: Node2D
var right_boot_node: Node2D
var tool_anchor_node: Node2D

func _ready() -> void:
	set_process(true)
	position = Vector2.ZERO
	
	# Load custom skin automatically if assets exist
	if parent_worker:
		var w_name = parent_worker.worker_name.to_lower().replace("usta ", "").replace("usta", "").replace("sevkiyatçı ", "").replace("sevkiyātçı", "").strip_edges()
		var base_path = "res://assets/textures/characters/skins/" + w_name + "_"
		if ResourceLoader.exists(base_path + "head.png"):
			skin_resource = WorkerSkin.new()
			skin_resource.head_texture = load(base_path + "head.png")
			if ResourceLoader.exists(base_path + "torso.png"):
				skin_resource.torso_texture = load(base_path + "torso.png")
			if ResourceLoader.exists(base_path + "left_leg.png"):
				skin_resource.left_leg_texture = load(base_path + "left_leg.png")
			if ResourceLoader.exists(base_path + "right_leg.png"):
				skin_resource.right_leg_texture = load(base_path + "right_leg.png")
			if ResourceLoader.exists(base_path + "left_boot.png"):
				skin_resource.left_boot_texture = load(base_path + "left_boot.png")
			if ResourceLoader.exists(base_path + "right_boot.png"):
				skin_resource.right_boot_texture = load(base_path + "right_boot.png")
				
	_setup_skeleton()
	_setup_animation_player()
	_setup_visual_components()

func _setup_skeleton() -> void:
	skeleton_root = Node2D.new()
	skeleton_root.name = "SkeletonRoot"
	add_child(skeleton_root)

	torso_node = JointNode.new(self, "Torso")
	torso_node.name = "Torso"
	skeleton_root.add_child(torso_node)
	
	head_node = JointNode.new(self, "Head")
	head_node.name = "Head"
	torso_node.add_child(head_node)
	
	left_leg_node = JointNode.new(self, "LeftLeg")
	left_leg_node.name = "LeftLeg"
	skeleton_root.add_child(left_leg_node)
	
	right_leg_node = JointNode.new(self, "RightLeg")
	right_leg_node.name = "RightLeg"
	skeleton_root.add_child(right_leg_node)
	
	left_boot_node = JointNode.new(self, "LeftBoot")
	left_boot_node.name = "LeftBoot"
	left_leg_node.add_child(left_boot_node)
	
	right_boot_node = JointNode.new(self, "RightBoot")
	right_boot_node.name = "RightBoot"
	right_leg_node.add_child(right_boot_node)
	
	tool_anchor_node = JointNode.new(self, "ToolAnchor")
	tool_anchor_node.name = "ToolAnchor"
	torso_node.add_child(tool_anchor_node)

func _setup_animation_player() -> void:
	anim_player = AnimationPlayer.new()
	anim_player.name = "AnimationPlayer"
	# Standard default blend time for premium cross-fading transitions
	anim_player.playback_default_blend_time = 0.15
	add_child(anim_player)
	
	var library := AnimationLibrary.new()
	library.add_animation("idle", _create_idle_animation())
	library.add_animation("walk", _create_walk_animation())
	library.add_animation("work", _create_work_animation())
	library.add_animation("slack", _create_slack_animation())
	library.add_animation("anxious", _create_anxious_animation())
	
	anim_player.add_animation_library("", library)
	anim_player.play("idle")

func _setup_visual_components() -> void:
	var grinder := GrinderVisual.new()
	var welder := WelderVisual.new()
	var caliper := CaliperVisual.new()
	var blueprint := BlueprintVisual.new()
	var spray := SprayVisual.new()
	var drill := DrillVisual.new()
	var probe := ProbeVisual.new()
	var clipboard := ClipboardVisual.new()
	
	_tool_visuals["Sac Kesim"] = grinder
	_tool_visuals["Plazma Kesim"] = grinder
	_tool_visuals["Testere Kesim"] = grinder
	
	_tool_visuals["Ağır Kaynak"] = welder
	_tool_visuals["Sert Lehim"] = welder
	
	_tool_visuals["Büküm"] = caliper
	_tool_visuals["Ağır Büküm"] = caliper
	_tool_visuals["Tornalama"] = caliper
	_tool_visuals["Azdırma"] = caliper
	_tool_visuals["Taşlama"] = caliper
	
	_tool_visuals["Ar-Ge"] = blueprint
	_tool_visuals["Tasarım"] = blueprint
	
	_tool_visuals["Boya"] = spray
	_tool_visuals["Astar & Boya"] = spray
	
	_tool_visuals["Montaj"] = drill
	_tool_visuals["Entegrasyon"] = drill
	
	_tool_visuals["Sızdırmazlık"] = probe
	_tool_visuals["Test"] = probe
	_tool_visuals["Tahribatsız Muayene"] = probe
	_tool_visuals["Kabul Testi"] = probe
	
	_tool_visuals["Shipment"] = clipboard

func _process(delta: float) -> void:
	_time_elapsed += delta
	
	if parent_worker and skeleton_root and anim_player:
		var status: String = parent_worker.status
		var velocity_len: float = parent_worker.velocity.length()
		var is_walking: bool = velocity_len > 10.0
		
		# Animation state transition check
		var target_anim := "idle"
		var speed_scale := 1.0
		
		if is_walking:
			target_anim = "walk"
			speed_scale = 1.3
		elif status == "working":
			target_anim = "work"
			speed_scale = 1.2
		elif status == "anxious":
			target_anim = "anxious"
			speed_scale = 1.8
		elif status == "slacking":
			target_anim = "slack"
			speed_scale = 0.8
			
		if anim_player.current_animation != target_anim:
			anim_player.play(target_anim)
			
		anim_player.speed_scale = speed_scale
		
		# Update animation phase for procedural features (like tea steam bubbles)
		var speed_multiplier := 1.0
		if is_walking:
			speed_multiplier = 6.0
		elif status == "working":
			speed_multiplier = 8.0
		elif status == "anxious":
			speed_multiplier = 14.0
		_anim_state = wrapf(_anim_state + delta * speed_multiplier, 0.0, PI * 2.0)
		
		# Direction facing scale factor
		var scale_x: float = -1.0 if parent_worker.velocity.x < 0.0 else 1.0
		
		# Body stretch/squash mod (breathing effect)
		var scale_y_mod: float = 1.0
		if status == "slacking":
			scale_y_mod = 1.0 + sin(_anim_state * 0.5) * 0.03
		else:
			scale_y_mod = 1.0 + sin(_anim_state) * 0.02
			
		skeleton_root.scale = Vector2(scale_x, scale_y_mod)
		
		# Force redraw all joint nodes to update their drawing lines/shapes
		torso_node.queue_redraw()
		head_node.queue_redraw()
		left_leg_node.queue_redraw()
		right_leg_node.queue_redraw()
		left_boot_node.queue_redraw()
		right_boot_node.queue_redraw()
		tool_anchor_node.queue_redraw()
		
	queue_redraw()

func _draw() -> void:
	if not parent_worker:
		return
		
	# Hips/Torso offsets for shadow size
	var velocity_len: float = parent_worker.velocity.length()
	var is_walking: bool = velocity_len > 10.0
	
	var bobbing_y: float = 0.0
	if is_walking:
		bobbing_y = abs(sin(_anim_state)) * -6.0
	elif parent_worker.status == "working":
		bobbing_y = sin(_anim_state * 2.0) * -2.0
	elif parent_worker.status == "anxious":
		bobbing_y = sin(_anim_state * 2.0) * 1.5
	elif parent_worker.status == "slacking":
		bobbing_y = sin(_anim_state * 0.5) * -1.5
	else:
		bobbing_y = sin(_anim_state) * -1.0
		
	# ─── Draw Shadow ─────────────────────────────────────────────────────────
	var shadow_alpha: float = 0.25 - (abs(bobbing_y) / 12.0) * 0.15
	var shadow_size: Vector2 = Vector2(28.0 - (abs(bobbing_y) * 0.5), 10.0)
	draw_ellipse(Vector2.ZERO, shadow_size.x, shadow_size.y, Color(0, 0, 0, shadow_alpha))

# Checks if a skeleton node has any CanvasItem assets (Sprite2D, Polygon2D, Line2D, etc.)
# attached as custom skins. If yes, procedural rendering is skipped for that node.
func _is_node_skinned(node: Node2D) -> bool:
	if not node:
		return false
	for child in node.get_children():
		if not (child is JointNode) and child is CanvasItem:
			return true
	return false

# Joint drawing router executed within the _draw() phase of each JointNode.
func draw_joint(joint_node: JointNode, joint_name: String) -> void:
	if not parent_worker:
		return
		
	if _is_node_skinned(joint_node):
		return
		
	var status: String = parent_worker.status
	var name_lower: String = parent_worker.worker_name.to_lower()
	
	match joint_name:
		"Torso":
			var use_procedural := true
			if skin_resource and skin_resource.torso_texture:
				var tex: Texture2D = skin_resource.torso_texture
				var tint: Color = skin_resource.costume_tint
				var rect := Rect2(-tex.get_size() * 0.5, tex.get_size())
				joint_node.draw_texture_rect(tex, rect, false, tint)
				use_procedural = false
				
			if use_procedural:
				var body_color := Color(0.25, 0.45, 0.85)  # Default blue overall
				if status == "slacking":
					body_color = Color(0.20, 0.65, 0.45) # Comfy green slacker
				elif status == "anxious":
					body_color = Color(0.85, 0.25, 0.25) # Stressful red
				if skin_resource:
					body_color = skin_resource.costume_tint
					
				var torso_rect := Rect2(Vector2(-BODY_W * 0.5, -BODY_H), Vector2(BODY_W, BODY_H - 10.0))
				joint_node.draw_style_box(get_stylebox_flat(body_color, 8), torso_rect)
			
		"Head":
			var use_procedural := true
			if skin_resource and skin_resource.head_texture:
				var tex: Texture2D = skin_resource.head_texture
				var rect := Rect2(-tex.get_size() * 0.5, tex.get_size())
				joint_node.draw_texture(tex, rect.position)
				use_procedural = false
				
			if use_procedural:
				var skin_color := Color(0.96, 0.80, 0.69)
				joint_node.draw_circle(Vector2.ZERO, HEAD_R, skin_color)
				
				# Eyes
				var eye_offset := Vector2(3.0, -1.0)
				joint_node.draw_circle(eye_offset, 1.8, Color(0.1, 0.1, 0.15))
				joint_node.draw_circle(eye_offset + Vector2(4.0, 0), 1.8, Color(0.1, 0.1, 0.15))
				
				# Mustache
				var has_mustache: bool = ("usta" in name_lower or "selo" in name_lower) and not ("gizem" in name_lower)
				if has_mustache:
					var mustache_color: Color = Color(0.15, 0.15, 0.15) if not ("ahmet" in name_lower or "selim" in name_lower) else Color(0.45, 0.45, 0.45)
					var b1_start: Vector2 = Vector2(1.0, 2.5)
					var b1_end: Vector2 = Vector2(8.0, 5.0)
					var b1_mid: Vector2 = Vector2(5.0, 4.0)
					joint_node.draw_line(b1_start, b1_mid, mustache_color, 2.2)
					joint_node.draw_line(b1_mid, b1_end, mustache_color, 2.2)
					joint_node.draw_line(b1_end, b1_end + Vector2(2.0, -1.0), mustache_color, 1.8)
					
				# Glasses
				var has_glasses: bool = "gizem" in name_lower or "can" in name_lower or parent_worker.skill == "Ar-Ge" or parent_worker.skill == "Tasarım"
				if has_glasses:
					var frame_color: Color = Color(0.12, 0.12, 0.15)
					joint_node.draw_arc(Vector2(3.0, -1.0), 3.0, 0, PI * 2, 8, frame_color, 1.0)
					joint_node.draw_arc(Vector2(7.0, -1.0), 3.0, 0, PI * 2, 8, frame_color, 1.0)
					joint_node.draw_line(Vector2(4.5, -1.0), Vector2(5.5, -1.0), frame_color, 1.0)
			
			# Accessory textures if defined
			if skin_resource and skin_resource.mustache_texture:
				var tex: Texture2D = skin_resource.mustache_texture
				joint_node.draw_texture(tex, -tex.get_size() * 0.5)
			if skin_resource and skin_resource.glasses_texture:
				var tex: Texture2D = skin_resource.glasses_texture
				joint_node.draw_texture(tex, -tex.get_size() * 0.5)

			# Helmet
			var helmet_color: Color
			if skin_resource and skin_resource.helmet_color_override.a > 0.0:
				helmet_color = skin_resource.helmet_color_override
			else:
				var skill_color_hex: String = FactoryData.SKILL_COLORS.get(parent_worker.skill, "#f97316")
				helmet_color = Color(skill_color_hex)
			
			var helmet_y_top: float = -HEAD_R * 0.4 - 5.0
			var helmet_rect := Rect2(Vector2(-HEAD_R - 2.0, helmet_y_top), Vector2((HEAD_R + 2.0) * 2.0, HEAD_R))
			joint_node.draw_style_box(get_stylebox_flat(helmet_color, 6), helmet_rect)
			
			var visor_y: float = -HEAD_R * 0.4 + 1.0
			joint_node.draw_line(Vector2(-HEAD_R - 2.0, visor_y), Vector2(HEAD_R + 5.0, visor_y), helmet_color * 1.2, 3.0)
			
			# Anxiety sign
			if status == "anxious":
				var sign_pos := Vector2(0, -HEAD_R - 15.0 + sin(_anim_state * 3.0) * 2.0)
				joint_node.draw_string(ThemeDB.fallback_font, sign_pos + Vector2(-4, 0), "⚠️",
					HORIZONTAL_ALIGNMENT_CENTER, 30, 14, Color.WHITE)
					
		"LeftLeg", "RightLeg":
			var boot_node: Node2D = left_boot_node if joint_name == "LeftLeg" else right_boot_node
			var boot_pos := boot_node.position if boot_node else Vector2(0, 12.0)
			
			var use_procedural := true
			var leg_tex: Texture2D = skin_resource.left_leg_texture if joint_name == "LeftLeg" else (skin_resource.right_leg_texture if skin_resource else null)
			if skin_resource and leg_tex:
				var angle := Vector2.ZERO.angle_to_point(boot_pos)
				var dist := Vector2.ZERO.distance_to(boot_pos)
				joint_node.draw_set_transform(Vector2.ZERO, angle - PI/2, Vector2(1.0, dist / leg_tex.get_height()))
				var rect := Rect2(Vector2(-leg_tex.get_width() * 0.5, 0), Vector2(leg_tex.get_width(), leg_tex.get_height()))
				joint_node.draw_texture(leg_tex, rect.position)
				joint_node.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
				use_procedural = false
				
			if use_procedural:
				var body_color := Color(0.25, 0.45, 0.85)
				if status == "slacking":
					body_color = Color(0.20, 0.65, 0.45)
				elif status == "anxious":
					body_color = Color(0.85, 0.25, 0.25)
				if skin_resource:
					body_color = skin_resource.costume_tint
				var leg_color: Color = body_color.darkened(0.2)
				joint_node.draw_line(Vector2.ZERO, boot_pos, leg_color, 6.0)
			
		"LeftBoot", "RightBoot":
			var use_procedural := true
			var boot_tex: Texture2D = skin_resource.left_boot_texture if joint_name == "LeftBoot" else (skin_resource.right_boot_texture if skin_resource else null)
			if skin_resource and boot_tex:
				var rect := Rect2(-boot_tex.get_size() * 0.5, boot_tex.get_size())
				joint_node.draw_texture(boot_tex, rect.position)
				use_procedural = false
				
			if use_procedural:
				var boot_color := Color(0.12, 0.12, 0.15)
				joint_node.draw_ellipse(Vector2(1.0, 0.0), 5.0, 3.0, boot_color)
			
		"ToolAnchor":
			if status == "working":
				var skill: String = parent_worker.skill
				var tool_drawer: BaseToolVisual = _tool_visuals.get(skill, _fallback_visual)
				if tool_drawer:
					var skill_color_hex: String = FactoryData.SKILL_COLORS.get(skill, "#f97316")
					var helmet_color: Color = Color(skill_color_hex)
					var body_color := Color(0.25, 0.45, 0.85)
					if status == "slacking":
						body_color = Color(0.20, 0.65, 0.45)
					elif status == "anxious":
						body_color = Color(0.85, 0.25, 0.25)
						
					var state: Dictionary = {
						"time_elapsed": _time_elapsed,
						"anim_state": _anim_state,
						"helmet_color": helmet_color,
						"body_color": body_color
					}
					tool_drawer.draw_tool(joint_node, state)
			elif status == "slacking":
				# Hold tea cup
				var cup_rect := Rect2(Vector2(0, 3.2), Vector2(8, 8))
				joint_node.draw_style_box(get_stylebox_flat(Color.WHITE, 2), cup_rect)
				joint_node.draw_line(Vector2(8, 5.2), Vector2(10, 7.2), Color.WHITE, 1.5)
				# Steaming tea particles
				if int(_time_elapsed * 4.0) % 2 == 0:
					var steam_y := -0.8 - sin(_anim_state) * 3.0
					joint_node.draw_line(Vector2(4.0, steam_y), Vector2(4.0, steam_y - 3.0), Color(1, 1, 1, 0.4), 1.0)

# Helper function to generate StyleBoxFlat programmatically
func get_stylebox_flat(color: Color, corner_radius: int) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = color
	sb.set_corner_radius_all(corner_radius)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = color.darkened(0.25)
	return sb



# Helper methods to dynamically construct value tracks for the AnimationPlayer.
func _create_value_track(anim: Animation, path: String, keys: Array[float], values: Array) -> void:
	var track_idx := anim.add_track(Animation.TYPE_VALUE)
	anim.track_set_path(track_idx, NodePath(path))
	anim.value_track_set_update_mode(track_idx, Animation.UPDATE_CONTINUOUS)
	for i in range(keys.size()):
		anim.track_insert_key(track_idx, keys[i], values[i])

func _create_idle_animation() -> Animation:
	var anim := Animation.new()
	anim.length = 1.0
	anim.loop_mode = Animation.LOOP_LINEAR
	
	var keys: Array[float] = [0.0, 0.5, 1.0]
	_create_value_track(anim, "SkeletonRoot/Torso:position", keys, [
		Vector2(0, -12.0),
		Vector2(0, -13.0),
		Vector2(0, -12.0)
	])
	_create_value_track(anim, "SkeletonRoot/Torso:rotation", keys, [0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/Torso/Head:rotation", keys, [0.0, 0.02, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg:rotation", keys, [0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/RightLeg:rotation", keys, [0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg/LeftBoot:position", keys, [Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0)])
	_create_value_track(anim, "SkeletonRoot/RightLeg/RightBoot:position", keys, [Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0)])
	_create_value_track(anim, "SkeletonRoot/Torso/ToolAnchor:rotation", keys, [0.0, 0.0, 0.0])
	
	return anim

func _create_walk_animation() -> Animation:
	var anim := Animation.new()
	anim.length = 0.8
	anim.loop_mode = Animation.LOOP_LINEAR
	
	var keys: Array[float] = [0.0, 0.2, 0.4, 0.6, 0.8]
	_create_value_track(anim, "SkeletonRoot/Torso:position", keys, [
		Vector2(0, -12.0),
		Vector2(0, -18.0),
		Vector2(0, -12.0),
		Vector2(0, -18.0),
		Vector2(0, -12.0)
	])
	_create_value_track(anim, "SkeletonRoot/Torso:rotation", keys, [0.0, 0.12, 0.0, -0.12, 0.0])
	_create_value_track(anim, "SkeletonRoot/Torso/Head:rotation", keys, [0.0, 0.03, 0.0, -0.03, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg:rotation", keys, [0.0, 0.4, 0.0, -0.4, 0.0])
	_create_value_track(anim, "SkeletonRoot/RightLeg:rotation", keys, [0.0, -0.4, 0.0, 0.4, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg/LeftBoot:position", keys, [
		Vector2(0, 9.5),
		Vector2(0, 12.0),
		Vector2(0, 9.5),
		Vector2(0, 12.0),
		Vector2(0, 9.5)
	])
	_create_value_track(anim, "SkeletonRoot/RightLeg/RightBoot:position", keys, [
		Vector2(0, 12.0),
		Vector2(0, 9.5),
		Vector2(0, 12.0),
		Vector2(0, 9.5),
		Vector2(0, 12.0)
	])
	_create_value_track(anim, "SkeletonRoot/Torso/ToolAnchor:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	
	return anim

func _create_work_animation() -> Animation:
	var anim := Animation.new()
	anim.length = 0.6
	anim.loop_mode = Animation.LOOP_LINEAR
	
	var keys: Array[float] = [0.0, 0.15, 0.3, 0.45, 0.6]
	_create_value_track(anim, "SkeletonRoot/Torso:position", keys, [
		Vector2(0, -12.0),
		Vector2(0, -14.0),
		Vector2(0, -12.0),
		Vector2(0, -14.0),
		Vector2(0, -12.0)
	])
	_create_value_track(anim, "SkeletonRoot/Torso:rotation", keys, [0.10, 0.20, 0.10, 0.20, 0.10])
	_create_value_track(anim, "SkeletonRoot/Torso/Head:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/RightLeg:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg/LeftBoot:position", keys, [Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0)])
	_create_value_track(anim, "SkeletonRoot/RightLeg/RightBoot:position", keys, [Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0)])
	_create_value_track(anim, "SkeletonRoot/Torso/ToolAnchor:rotation", keys, [-0.2, 0.4, -0.2, 0.4, -0.2])
	
	return anim

func _create_slack_animation() -> Animation:
	var anim := Animation.new()
	anim.length = 2.0
	anim.loop_mode = Animation.LOOP_LINEAR
	
	var keys: Array[float] = [0.0, 0.5, 1.0, 1.5, 2.0]
	_create_value_track(anim, "SkeletonRoot/Torso:position", keys, [
		Vector2(0, -12.0),
		Vector2(0, -13.5),
		Vector2(0, -12.0),
		Vector2(0, -10.5),
		Vector2(0, -12.0)
	])
	_create_value_track(anim, "SkeletonRoot/Torso:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/Torso/Head:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/RightLeg:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg/LeftBoot:position", keys, [Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0)])
	_create_value_track(anim, "SkeletonRoot/RightLeg/RightBoot:position", keys, [Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0)])
	_create_value_track(anim, "SkeletonRoot/Torso/ToolAnchor:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	
	return anim

func _create_anxious_animation() -> Animation:
	var anim := Animation.new()
	anim.length = 0.3
	anim.loop_mode = Animation.LOOP_LINEAR
	
	var keys: Array[float] = [0.0, 0.075, 0.15, 0.225, 0.3]
	_create_value_track(anim, "SkeletonRoot/Torso:position", keys, [
		Vector2(0, -10.5),
		Vector2(0, -13.5),
		Vector2(0, -10.5),
		Vector2(0, -13.5),
		Vector2(0, -10.5)
	])
	_create_value_track(anim, "SkeletonRoot/Torso:rotation", keys, [-0.08, 0.08, -0.08, 0.08, -0.08])
	_create_value_track(anim, "SkeletonRoot/Torso/Head:rotation", keys, [0.08, -0.08, 0.08, -0.08, 0.08])
	_create_value_track(anim, "SkeletonRoot/LeftLeg:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/RightLeg:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	_create_value_track(anim, "SkeletonRoot/LeftLeg/LeftBoot:position", keys, [Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0)])
	_create_value_track(anim, "SkeletonRoot/RightLeg/RightBoot:position", keys, [Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0), Vector2(0, 12.0)])
	_create_value_track(anim, "SkeletonRoot/Torso/ToolAnchor:rotation", keys, [0.0, 0.0, 0.0, 0.0, 0.0])
	
	return anim
