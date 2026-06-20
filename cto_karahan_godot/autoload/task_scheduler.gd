extends Node

## Capacity-based Workstation Slot Scheduler (TaskScheduler)
## Manages workstation capacities and prevents worker overlaps at stations.

var station_reservations: Dictionary = {}
var station_capacities: Dictionary = {}

func _ready() -> void:
	# Define default workstation capacities
	# Machines usually have a capacity of 1 (single operator)
	# Rest areas, depots, design offices have higher capacity
	station_capacities["ws-lazer"] = 1
	station_capacities["ws-abkant"] = 1
	station_capacities["ws-dokuma"] = 2
	station_capacities["ws-firin"] = 2
	station_capacities["ws-lehim"] = 2
	station_capacities["ws-test"] = 1
	station_capacities["ws-boya"] = 1
	station_capacities["ws-montaj"] = 3
	
	# High capacity areas
	station_capacities["ws-arge"] = 5
	station_capacities["ws-depo"] = 10
	station_capacities["ws-cay"] = 6
	station_capacities["ws-wc"] = 4
	station_capacities["ws-ik"] = 3
	station_capacities["ws-revir"] = 2
	station_capacities["ws-ressam-wc"] = 2

## Attempts to book a slot at a workstation. Returns true if successful.
func book_workstation(worker_name: String, station_id: String) -> bool:
	if station_id.is_empty():
		return false
		
	# Release any previous reservation this worker had
	release_all_for_worker(worker_name)
	
	if not station_reservations.has(station_id):
		station_reservations[station_id] = []
		
	var capacity = station_capacities.get(station_id, 1)
	if station_reservations[station_id].size() < capacity:
		station_reservations[station_id].append(worker_name)
		return true
		
	return false

## Checks if a workstation has an available slot.
func is_station_available(station_id: String) -> bool:
	if station_id.is_empty():
		return false
		
	var capacity = station_capacities.get(station_id, 1)
	var current = station_reservations.get(station_id, []).size()
	return current < capacity

## Releases a worker's booking from a specific workstation.
func release_workstation(worker_name: String, station_id: String) -> void:
	if station_id.is_empty() or not station_reservations.has(station_id):
		return
	station_reservations[station_id].erase(worker_name)

## Releases all workstation bookings for a given worker.
func release_all_for_worker(worker_name: String) -> void:
	for station_id in station_reservations.keys():
		station_reservations[station_id].erase(worker_name)

## Returns the list of workers currently reserved at a workstation.
func get_reserved_workers(station_id: String) -> Array:
	return station_reservations.get(station_id, [])

## Clears all reservations (e.g. when resetting/switching factories).
func reset() -> void:
	station_reservations.clear()
