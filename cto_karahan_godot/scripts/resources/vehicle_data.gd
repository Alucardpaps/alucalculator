class_name VehicleData
extends Resource

## VehicleData: Custom Resource class for vehicle configuration.

@export var vehicle_name: String = "Kişisel Sedan"
@export var vehicle_type: String = "sedan" # "sedan", "hatchback", "suv", "sport", "truck"
@export var top_speed: float = 20.0
@export var color: Color = Color(0.18, 0.52, 0.88)
