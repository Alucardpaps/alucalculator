class_name FactoryLayoutResource
extends Resource

## FactoryLayoutResource: Custom Resource class for data-driven factory room layouts and properties.

@export var length: float = 80.0
@export var width: float = 20.0
@export var height: float = 6.0
@export var z_offset: float = -4.0
@export var wall_material_type: String = "sandwich" # "sandwich", "concrete"

@export var ceiling_lights: Array[Vector3] = []
@export var partition_boundaries: Array[int] = []
@export var partition_corridor_gap: float = 2.0 # Half of the gap (e.g. 2.0 means 4.0m gap)
@export var partition_material_type: String = "glass" # "glass", "brick", "wall", "gearbox_mix"

# Custom visual decoration blocks (furniture, specialized rooms, etc.)
# Array of Dictionaries with keys: "pos" (Vector3), "size" (Vector3), "mat_type" (String)
@export var custom_decorations: Array[Dictionary] = []
