class_name FactoryFloor
extends Node2D

## Isometric Factory Floor: Draws the 2.5D grid, room partitions, pathways, and room labels.
## Provides the canonical iso_to_screen coordinate conversion used by all entities.

# ─── Tile Geometry ───────────────────────────────────────────────────────────
const TILE_W: float = 128.0
const TILE_H: float = 64.0
const HALF_W: float = 64.0
const HALF_H: float = 32.0

# Origin offset so the factory is nicely centered/positioned
const ORIGIN: Vector2 = Vector2(900.0, 80.0)

# ─── Grid Dimensions ────────────────────────────────────────────────────────
const GRID_U: int = 40  # long axis (left→right visually)
const GRID_V: int = 6   # short axis (depth)

# ─── Room Layout ─────────────────────────────────────────────────────────────
# Each room spans 5 u-columns. Partition walls drawn at room boundaries.
const ROOM_BOUNDARIES: Array = [0, 5, 10, 15, 20, 25, 30, 35]
const ROOM_NAMES: Array = [
	"✂️ KESİM",
	"✏️ TASARIM",
	"🔥 ISIL İŞLEM",
	"🧪 KALİTE",
	"🔧 MONTAJ",
	"☕ SOSYAL",
	"📦 DEPO & AMBAR",
	"🚚 DIŞ SAHA",
]

# Corridor occupies the middle two rows (v=2 and v=3)
const CORRIDOR_V_MIN: int = 2
const CORRIDOR_V_MAX: int = 3

# ─── Workstation Placement Map ───────────────────────────────────────────────
# Maps workstation key → isometric cell (u, v) where it should be placed.
const WS_PLACEMENT: Dictionary = {
	"ws-lazer":     Vector2i(1, 1),
	"ws-abkant":    Vector2i(3, 4),
	"ws-arge":      Vector2i(6, 1),
	"ws-dokuma":    Vector2i(8, 4),
	"ws-firin":     Vector2i(11, 1),
	"ws-lehim":     Vector2i(13, 4),
	"ws-test":      Vector2i(16, 1),
	"ws-boya":      Vector2i(18, 4),
	"ws-ressam-wc": Vector2i(16, 4),
	"ws-montaj":    Vector2i(21, 1),
	"ws-cay":       Vector2i(26, 4),
	"ws-wc":        Vector2i(28, 1),
	"ws-ik":        Vector2i(31, 1),
	"ws-revir":     Vector2i(32, 4),
	"ws-depo":      Vector2i(36, 4),
}

# ─── Palette ─────────────────────────────────────────────────────────────────
const COLOR_FLOOR_A:       Color = Color(0.11, 0.125, 0.17, 1.0)
const COLOR_FLOOR_B:       Color = Color(0.125, 0.14, 0.185, 1.0)
const COLOR_CORRIDOR:      Color = Color(0.155, 0.175, 0.23, 1.0)
const COLOR_CORRIDOR_LINE: Color = Color(0.88, 0.78, 0.15, 0.65)
const COLOR_GRID_LINE:     Color = Color(0.22, 0.25, 0.32, 0.35)
const COLOR_WALL_FRONT:    Color = Color(0.30, 0.33, 0.40, 1.0)
const COLOR_WALL_SIDE:     Color = Color(0.22, 0.25, 0.32, 1.0)
const COLOR_WALL_TOP:      Color = Color(0.42, 0.45, 0.52, 1.0)
const COLOR_DOOR_FRAME:    Color = Color(0.88, 0.72, 0.22, 0.85)
const COLOR_ROOM_LABEL:    Color = Color(0.65, 0.68, 0.75, 0.55)

const WALL_HEIGHT: float = 55.0

# ─── Coordinate Conversion ──────────────────────────────────────────────────
## Convert isometric (u, v) cell coordinates to screen pixel position.
static func iso_to_screen(u: float, v: float) -> Vector2:
	return ORIGIN + Vector2((u - v) * HALF_W, (u + v) * HALF_H)

## Get the screen position for a workstation key.
static func get_ws_screen_pos(ws_key: String) -> Vector2:
	var cell: Vector2i = WS_PLACEMENT.get(ws_key, Vector2i(15, 3))
	return iso_to_screen(float(cell.x) + 0.5, float(cell.y) + 0.5)

## Convert 2D screen coordinate back to 3D world coordinate.
static func screen_to_3d(screen_pos: Vector2) -> Vector3:
	var dx := screen_pos.x - ORIGIN.x
	var dy := screen_pos.y - ORIGIN.y
	var u := 0.5 * (dx / HALF_W + dy / HALF_H)
	var v := 0.5 * (dy / HALF_H - dx / HALF_W)
	return Vector3(u * 2.0, 0.0, v * 2.0)

# ─── A* Navigation ──────────────────────────────────────────────────────────
var astar: AStar2D = AStar2D.new()

func _get_cell_id(u: int, v: int) -> int:
	return u * GRID_V + v

func _setup_astar() -> void:
	# Add points for all cells in the 30x6 grid
	for u in range(GRID_U):
		for v in range(GRID_V):
			var id := _get_cell_id(u, v)
			var pos := iso_to_screen(float(u) + 0.5, float(v) + 0.5)
			astar.add_point(id, pos)
			
	# Connect neighboring cells
	for u in range(GRID_U):
		for v in range(GRID_V):
			var id := _get_cell_id(u, v)
			
			# Check right neighbor (u + 1, v)
			if u + 1 < GRID_U:
				var next_u := u + 1
				var is_wall := false
				# Partition wall check
				if next_u in ROOM_BOUNDARIES:
					if v < CORRIDOR_V_MIN or v > CORRIDOR_V_MAX:
						is_wall = true
						
				if not is_wall:
					var right_id := _get_cell_id(next_u, v)
					astar.connect_points(id, right_id)
					
			# Check down neighbor (u, v + 1)
			if v + 1 < GRID_V:
				var down_id := _get_cell_id(u, v + 1)
				astar.connect_points(id, down_id)

## Returns a list of screen-space points using A* grid pathfinding.
func get_astar_path(from_pos: Vector2, to_pos: Vector2) -> Array[Vector2]:
	var from_id := astar.get_closest_point(from_pos)
	var to_id := astar.get_closest_point(to_pos)
	var path_pts := astar.get_point_path(from_id, to_id)
	
	var path: Array[Vector2] = []
	for p in path_pts:
		path.append(p)
		
	# Snap the last point exactly to the target destination
	if path.size() > 0:
		path[path.size() - 1] = to_pos
	return path

# ─── Lifecycle ───────────────────────────────────────────────────────────────
func _ready() -> void:
	z_index = -10
	_setup_astar()

func _draw() -> void:
	_draw_foundation()
	_draw_floor_tiles()
	_draw_corridor_markings()
	_draw_delivery_truck()
	_draw_garden_trees()
	_draw_partitions()
	_draw_room_labels()

# ─── Volumetric Foundation Slab ──────────────────────────────────────────────
func _draw_foundation() -> void:
	var slab_depth: float = 32.0
	var base_color_left: Color = Color(0.08, 0.09, 0.12)
	var base_color_right: Color = Color(0.06, 0.07, 0.10)
	var border_color: Color = Color(0.04, 0.04, 0.05)
	
	# 1. Bottom-left facing foundation wall (along v = GRID_V, u from 0 to GRID_U)
	for u: int in range(GRID_U):
		var p1 := iso_to_screen(float(u), float(GRID_V))
		var p2 := iso_to_screen(float(u + 1), float(GRID_V))
		var pts := PackedVector2Array([
			p1,
			p2,
			p2 + Vector2(0, slab_depth),
			p1 + Vector2(0, slab_depth)
		])
		draw_colored_polygon(pts, base_color_left)
		# Bottom edge outline
		draw_line(p1 + Vector2(0, slab_depth), p2 + Vector2(0, slab_depth), border_color, 1.5)
		# Vertical divider
		draw_line(p1, p1 + Vector2(0, slab_depth), border_color, 1.0)
	
	# 2. Bottom-right facing foundation wall (along u = GRID_U, v from 0 to GRID_V)
	for v: int in range(GRID_V):
		var p1 := iso_to_screen(float(GRID_U), float(v))
		var p2 := iso_to_screen(float(GRID_U), float(v + 1))
		var pts := PackedVector2Array([
			p1,
			p2,
			p2 + Vector2(0, slab_depth),
			p1 + Vector2(0, slab_depth)
		])
		draw_colored_polygon(pts, base_color_right)
		# Bottom edge outline
		draw_line(p1 + Vector2(0, slab_depth), p2 + Vector2(0, slab_depth), border_color, 1.5)
		# Vertical divider
		draw_line(p1, p1 + Vector2(0, slab_depth), border_color, 1.0)
		
	# Draw corner vertical line at the very bottom-center corner (u = GRID_U, v = GRID_V)
	var corner_p := iso_to_screen(float(GRID_U), float(GRID_V))
	draw_line(corner_p, corner_p + Vector2(0, slab_depth), border_color, 1.5)

# ─── Floor Tiles ─────────────────────────────────────────────────────────────
func _draw_floor_tiles() -> void:
	for u: int in range(GRID_U):
		for v: int in range(GRID_V):
			var center := iso_to_screen(float(u) + 0.5, float(v) + 0.5)
			var is_corridor := (v >= CORRIDOR_V_MIN and v <= CORRIDOR_V_MAX)
			var is_alt := ((u + v) % 2 == 0)

			var color: Color
			if u >= 35:
				# Room 8: Dış Saha / Outdoor Yard
				if is_corridor:
					color = Color(0.20, 0.21, 0.24) # Dark asphalt driveway for delivery truck
				elif is_alt:
					color = Color(0.18, 0.34, 0.20) # Alternating grass color A
				else:
					color = Color(0.21, 0.38, 0.23) # Alternating grass color B
			else:
				# Rooms 1-7: Indoor Factory Floor
				if is_corridor:
					color = COLOR_CORRIDOR
				elif is_alt:
					color = COLOR_FLOOR_A
				else:
					color = COLOR_FLOOR_B

			var pts := PackedVector2Array([
				center + Vector2(0, -HALF_H),
				center + Vector2(HALF_W, 0),
				center + Vector2(0, HALF_H),
				center + Vector2(-HALF_W, 0),
			])
			draw_colored_polygon(pts, color)
			draw_polyline(pts + PackedVector2Array([pts[0]]), COLOR_GRID_LINE, 1.0)

# ─── Outdoor Decorations & Details ──────────────────────────────────────────
func _draw_delivery_truck() -> void:
	# Parked 2.5D delivery cargo truck at the end of Room 8 driveway
	var pos: Vector2 = iso_to_screen(38.0, 2.5)
	
	# Shadow
	draw_ellipse(pos + Vector2(0, 10.0), 75.0, 22.0, Color(0.05, 0.05, 0.08, 0.4))
	
	# Wheels (three axles for heavy truck)
	draw_ellipse(pos + Vector2(-35.0, 14.0), 10.0, 15.0, Color(0.08, 0.08, 0.1))
	draw_ellipse(pos + Vector2(-15.0, 18.0), 10.0, 15.0, Color(0.08, 0.08, 0.1))
	draw_ellipse(pos + Vector2(25.0, 24.0), 10.0, 15.0, Color(0.08, 0.08, 0.1))
	
	# Trailer Box (Isometric silver container box with steel ridges)
	var trailer_ctr: Vector2 = pos + Vector2(-10.0, -25.0)
	_draw_cuboid_at(trailer_ctr, 76.0, 26.0, 48.0, Color(0.85, 0.86, 0.9))
	
	# Draw container ridges/stripes for details
	for x_off: float in [-28.0, -14.0, 0.0, 14.0, 28.0]:
		draw_line(trailer_ctr + Vector2(x_off, -46.0), trailer_ctr + Vector2(x_off, 4.0), Color(0.72, 0.73, 0.77), 1.5)
	
	# Cabin (Vibrant Red Truck Cabin at front of trailer)
	var cabin_ctr: Vector2 = pos + Vector2(36.0, -10.0)
	_draw_cuboid_at(cabin_ctr, 24.0, 24.0, 32.0, Color(0.85, 0.12, 0.12))
	
	# Windshield / Cabin Windows (glowing blue screen-space polygons)
	var wind_bl: Vector2 = cabin_ctr + Vector2(4.0, -14.0)
	var wind_br: Vector2 = cabin_ctr + Vector2(10.0, -11.0)
	var wind_tl: Vector2 = wind_bl + Vector2(0, -9.0)
	var wind_tr: Vector2 = wind_br + Vector2(0, -9.0)
	var wind_pts: PackedVector2Array = PackedVector2Array([wind_bl, wind_tl, wind_tr, wind_br])
	draw_colored_polygon(wind_pts, Color(0.1, 0.7, 0.9, 0.85)) # Windshield
	
	var side_window_bl: Vector2 = cabin_ctr + Vector2(-8.0, -17.0)
	var side_window_br: Vector2 = cabin_ctr + Vector2(-1.0, -15.0)
	var side_window_tl: Vector2 = side_window_bl + Vector2(0, -8.0)
	var side_window_tr: Vector2 = side_window_br + Vector2(0, -8.0)
	var side_pts: PackedVector2Array = PackedVector2Array([side_window_bl, side_window_tl, side_window_tr, side_window_br])
	draw_colored_polygon(side_pts, Color(0.1, 0.7, 0.9, 0.85)) # Side window
 
func _draw_garden_trees() -> void:
	# Draw procedural garden trees along the borders of Room 8 (exterior yard)
	var tree_coords: Array[Vector2] = [
		Vector2(35.5, 0.4),
		Vector2(35.5, 5.3),
		Vector2(37.5, 0.4),
		Vector2(38.8, 5.4),
	]
	
	for coord in tree_coords:
		var pos: Vector2 = iso_to_screen(coord.x, coord.y)
		
		# Shadow
		draw_ellipse(pos, 14.0, 6.0, Color(0.0, 0.0, 0.0, 0.25))
		
		# Trunk
		draw_line(pos, pos + Vector2(0, -22.0), Color(0.42, 0.28, 0.14), 4.0)
		
		# Foliage (Layered animated-style circles with highlights)
		var f_ctr: Vector2 = pos + Vector2(0, -28.0)
		draw_circle(f_ctr + Vector2(-5.0, 3.0), 9.0, Color(0.12, 0.42, 0.18))
		draw_circle(f_ctr + Vector2(5.0, 3.0), 9.0, Color(0.14, 0.45, 0.2))
		draw_circle(f_ctr + Vector2(0, -6.0), 11.0, Color(0.16, 0.52, 0.24))
		draw_circle(f_ctr + Vector2(-1.0, -2.0), 8.0, Color(0.22, 0.62, 0.28)) # Highlight
 
func _draw_cuboid_at(center: Vector2, w: float, d: float, h: float, base_color: Color) -> void:
	var hw: float = w * 0.5
	var hd: float = d * 0.5
	
	# Shaded colors
	var left_color: Color = base_color * 0.82
	var right_color: Color = base_color * 0.62
	var top_color: Color = base_color * 1.05
	
	# Bottom points
	var b_ctr: Vector2 = center
	var b_front: Vector2 = b_ctr + Vector2(0, hd)
	var b_left: Vector2  = b_ctr + Vector2(-hw, 0)
	var b_right: Vector2 = b_ctr + Vector2(hw, 0)
	
	# Top points
	var t_ctr: Vector2 = center + Vector2(0, -h)
	var t_front: Vector2 = t_ctr + Vector2(0, hd)
	var t_back: Vector2  = t_ctr + Vector2(0, -hd)
	var t_left: Vector2  = t_ctr + Vector2(-hw, 0)
	var t_right: Vector2 = t_ctr + Vector2(hw, 0)
	
	# Polygons
	var face_left: PackedVector2Array = PackedVector2Array([b_left, t_left, t_front, b_front])
	var face_right: PackedVector2Array = PackedVector2Array([b_front, t_front, t_right, b_right])
	var face_top: PackedVector2Array = PackedVector2Array([t_front, t_left, t_back, t_right])
	
	draw_colored_polygon(face_left, left_color)
	draw_colored_polygon(face_right, right_color)
	draw_colored_polygon(face_top, top_color)
	
	# Outlines
	var borders: PackedVector2Array = PackedVector2Array([
		b_left, t_left, t_back, t_right, b_right, b_front, b_left
	])
	var border_color: Color = base_color * 0.4
	draw_polyline(borders, border_color, 1.0)
	draw_line(t_front, t_left, border_color, 1.0)
	draw_line(t_front, t_right, border_color, 1.0)
	draw_line(t_front, b_front, border_color, 1.0)

# ─── Corridor Markings ──────────────────────────────────────────────────────
func _draw_corridor_markings() -> void:
	# Dashed yellow center line
	for u in range(GRID_U):
		if u % 2 == 0:
			var s := iso_to_screen(float(u) + 0.15, 2.5)
			var e := iso_to_screen(float(u) + 0.85, 2.5)
			draw_line(s, e, COLOR_CORRIDOR_LINE, 2.0)

	# Subtle corridor border lines
	var border_alpha := Color(1, 1, 1, 0.25)
	for u in range(GRID_U + 1):
		var fu := float(u)
		var top_s := iso_to_screen(fu, float(CORRIDOR_V_MIN))
		var top_e := iso_to_screen(fu + 1.0, float(CORRIDOR_V_MIN))
		draw_line(top_s, top_e, COLOR_CORRIDOR_LINE * border_alpha, 1.0)

		var bot_s := iso_to_screen(fu, float(CORRIDOR_V_MAX + 1))
		var bot_e := iso_to_screen(fu + 1.0, float(CORRIDOR_V_MAX + 1))
		draw_line(bot_s, bot_e, COLOR_CORRIDOR_LINE * border_alpha, 1.0)

# ─── Partition Walls ────────────────────────────────────────────────────────
func _draw_partitions() -> void:
	for boundary_u in ROOM_BOUNDARIES:
		if boundary_u == 0:
			continue
		# Upper wall (v = 0 → CORRIDOR_V_MIN)
		for v in range(0, CORRIDOR_V_MIN):
			_draw_wall_segment(boundary_u, v)
		# Lower wall (v = CORRIDOR_V_MAX+1 → GRID_V)
		for v in range(CORRIDOR_V_MAX + 1, GRID_V):
			_draw_wall_segment(boundary_u, v)
		# Doorway frame at corridor
		_draw_doorway(boundary_u, CORRIDOR_V_MIN)
		_draw_doorway(boundary_u, CORRIDOR_V_MAX)

func _draw_wall_segment(u: int, v: int) -> void:
	var bl := iso_to_screen(float(u), float(v))
	var br := iso_to_screen(float(u), float(v + 1))
	var top_l := bl + Vector2(0, -WALL_HEIGHT)
	var top_r := br + Vector2(0, -WALL_HEIGHT)

	var dir := (br - bl).normalized() # Direction along the wall (towards bottom-left)
	var pillar_w: float = 6.0
	var offset := dir * pillar_w
	var rail_h: float = 5.0

	# Shading colors
	var metal_color := Color(0.28, 0.32, 0.40)
	var metal_dark := Color(0.18, 0.22, 0.28)
	var metal_light := Color(0.45, 0.50, 0.60)
	var glass_color := Color(0.18, 0.55, 0.75, 0.28)
	var glass_border := Color(0.30, 0.70, 0.90, 0.6)
	var glass_glint := Color(1.0, 1.0, 1.0, 0.15)

	# 1. Right Pillar (at bl / top_l)
	var r_p1 := bl
	var r_p2 := top_l
	var r_p3 := top_l + offset
	var r_p4 := bl + offset
	draw_colored_polygon(PackedVector2Array([r_p1, r_p2, r_p3, r_p4]), metal_color)
	draw_polyline(PackedVector2Array([r_p1, r_p2, r_p3, r_p4, r_p1]), metal_dark, 1.0)
	draw_line(r_p2, r_p1, metal_light, 1.0) # Vertical highlight

	# 2. Left Pillar (at br / top_r)
	var l_p1 := br - offset
	var l_p2 := top_r - offset
	var l_p3 := top_r
	var l_p4 := br
	draw_colored_polygon(PackedVector2Array([l_p1, l_p2, l_p3, l_p4]), metal_color)
	draw_polyline(PackedVector2Array([l_p1, l_p2, l_p3, l_p4, l_p1]), metal_dark, 1.0)
	draw_line(l_p3, l_p4, metal_light, 1.0) # Vertical highlight

	# 3. Top Rail
	var tr_p1 := top_l + offset
	var tr_p2 := top_l + offset + Vector2(0, rail_h)
	var tr_p3 := top_r - offset + Vector2(0, rail_h)
	var tr_p4 := top_r - offset
	draw_colored_polygon(PackedVector2Array([tr_p1, tr_p2, tr_p3, tr_p4]), metal_dark)
	draw_line(tr_p1, tr_p4, metal_light, 1.0)

	# 4. Bottom Rail
	var br_p1 := bl + offset
	var br_p2 := bl + offset - Vector2(0, rail_h)
	var br_p3 := br - offset - Vector2(0, rail_h)
	var br_p4 := br - offset
	draw_colored_polygon(PackedVector2Array([br_p1, br_p2, br_p3, br_p4]), metal_dark)

	# 5. Translucent Glass Panel
	var g_p1 := tr_p2
	var g_p2 := br_p2
	var g_p3 := br_p3
	var g_p4 := tr_p3
	draw_colored_polygon(PackedVector2Array([g_p1, g_p2, g_p3, g_p4]), glass_color)

	# Glass borders
	draw_line(g_p1, g_p4, glass_border, 1.0)
	draw_line(g_p2, g_p3, glass_border * 0.7, 1.0)

	# Diagonal reflection glint stripes across the glass pane
	var glint_top_1 := g_p1.lerp(g_p4, 0.3)
	var glint_bot_1 := g_p2.lerp(g_p3, 0.5)
	draw_line(glint_top_1, glint_bot_1, glass_glint, 2.0)

	var glint_top_2 := g_p1.lerp(g_p4, 0.5)
	var glint_bot_2 := g_p2.lerp(g_p3, 0.7)
	draw_line(glint_top_2, glint_bot_2, glass_glint, 1.0)

func _draw_doorway(u: int, v: int) -> void:
	var bl := iso_to_screen(float(u), float(v))
	var br := iso_to_screen(float(u), float(v + 1))
	var top_l := bl + Vector2(0, -WALL_HEIGHT)
	var top_r := br + Vector2(0, -WALL_HEIGHT)

	# Door posts and lintel (golden frame)
	draw_line(bl, top_l, COLOR_DOOR_FRAME, 3.0)
	draw_line(br, top_r, COLOR_DOOR_FRAME, 3.0)
	draw_line(top_l, top_r, COLOR_DOOR_FRAME, 3.0)

# ─── Room Labels ────────────────────────────────────────────────────────────
func _draw_room_labels() -> void:
	var font: Font = ThemeDB.fallback_font
	if not font:
		return
	for i in range(ROOM_BOUNDARIES.size()):
		if i >= ROOM_NAMES.size():
			break
		var room_u: float = float(ROOM_BOUNDARIES[i])
		var center_u: float = room_u + 2.5
		var label_pos := iso_to_screen(center_u, -0.8)
		draw_string(font, label_pos + Vector2(-50, 0), ROOM_NAMES[i],
			HORIZONTAL_ALIGNMENT_CENTER, 100, 12, COLOR_ROOM_LABEL)
