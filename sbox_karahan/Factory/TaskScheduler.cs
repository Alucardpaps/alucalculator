using System;
using System.Collections.Generic;
using System.Linq;
using Sandbox;

namespace Karahan.Factory;

public class TaskScheduler
{
    private static TaskScheduler _instance;
    public static TaskScheduler Instance => _instance ??= new TaskScheduler();

    private readonly Dictionary<string, List<string>> _stationReservations = new();
    private readonly Dictionary<string, int> _stationCapacities = new();

    private TaskScheduler()
    {
        // Define default workstation capacities
        // Machines usually have a capacity of 1 (single operator)
        // Rest areas, depots, design offices have higher capacity
        _stationCapacities["ws-lazer"] = 1;
        _stationCapacities["ws-abkant"] = 1;
        _stationCapacities["ws-dokuma"] = 2;
        _stationCapacities["ws-firin"] = 2;
        _stationCapacities["ws-lehim"] = 2;
        _stationCapacities["ws-test"] = 1;
        _stationCapacities["ws-boya"] = 1;
        _stationCapacities["ws-montaj"] = 3;
        
        // High capacity areas
        _stationCapacities["ws-arge"] = 5;
        _stationCapacities["ws-depo"] = 10;
        _stationCapacities["ws-cay"] = 6;
        _stationCapacities["ws-wc"] = 4;
        _stationCapacities["ws-ik"] = 3;
        _stationCapacities["ws-revir"] = 2;
        _stationCapacities["ws-ressam-wc"] = 2;
    }

    /// <summary>
    /// Attempts to book a slot at a workstation. Returns true if successful.
    /// </summary>
    public bool BookWorkstation(string workerName, string stationId)
    {
        if (string.IsNullOrEmpty(stationId)) return false;

        lock (_stationReservations)
        {
            // Release any previous reservation this worker had
            ReleaseAllForWorker(workerName);

            if (!_stationReservations.ContainsKey(stationId))
            {
                _stationReservations[stationId] = new List<string>();
            }

            int capacity = _stationCapacities.GetValueOrDefault(stationId, 1);
            if (_stationReservations[stationId].Count < capacity)
            {
                _stationReservations[stationId].Add(workerName);
                return true;
            }

            return false;
        }
    }

    /// <summary>
    /// Checks if a workstation has an available slot.
    /// </summary>
    public bool IsStationAvailable(string stationId)
    {
        if (string.IsNullOrEmpty(stationId)) return false;

        lock (_stationReservations)
        {
            int capacity = _stationCapacities.GetValueOrDefault(stationId, 1);
            int current = _stationReservations.ContainsKey(stationId) ? _stationReservations[stationId].Count : 0;
            return current < capacity;
        }
    }

    /// <summary>
    /// Releases a worker's booking from a specific workstation.
    /// </summary>
    public void ReleaseWorkstation(string workerName, string stationId)
    {
        if (string.IsNullOrEmpty(stationId)) return;

        lock (_stationReservations)
        {
            if (_stationReservations.ContainsKey(stationId))
            {
                _stationReservations[stationId].Remove(workerName);
            }
        }
    }

    /// <summary>
    /// Releases all workstation bookings for a given worker.
    /// </summary>
    public void ReleaseAllForWorker(string workerName)
    {
        lock (_stationReservations)
        {
            foreach (var kvp in _stationReservations)
            {
                kvp.Value.Remove(workerName);
            }
        }
    }

    /// <summary>
    /// Returns the list of workers currently reserved at a workstation.
    /// </summary>
    public List<string> GetReservedWorkers(string stationId)
    {
        lock (_stationReservations)
        {
            if (_stationReservations.TryGetValue(stationId, out var list))
            {
                return list.ToList();
            }
            return new List<string>();
        }
    }

    /// <summary>
    /// Clears all reservations (e.g. when resetting/switching factories).
    /// </summary>
    public void Reset()
    {
        lock (_stationReservations)
        {
            _stationReservations.Clear();
        }
    }
}
