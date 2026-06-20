using System.Collections.Generic;
using Sandbox;

namespace Karahan.Factory;

public sealed class Workstation : Component
{
    [Property] public string WorkstationId { get; set; }
    [Property] public string RequiredSkill { get; set; }
    [Property] public string StationName { get; set; }

    /// <summary>
    /// Stand positions in the 3D world for workers to walk to.
    /// </summary>
    [Property] public List<Transform> StandPoints { get; set; } = new();

    /// <summary>
    /// Visual active state indicator (e.g., lighting or particle systems).
    /// </summary>
    [Property] public GameObject ActiveVfx { get; set; }

    [Property] public bool IsActive { get; set; }

    protected override void OnUpdate()
    {
        // Toggle VFX based on whether workers are actively working here
        if (ActiveVfx != null)
        {
            ActiveVfx.Enabled = IsActive;
        }
    }

    /// <summary>
    /// Retrieves a free slot position for a worker to stand in.
    /// </summary>
    public Vector3 GetWorkerPosition(int index)
    {
        if (StandPoints != null && StandPoints.Count > 0)
        {
            var point = StandPoints[index % StandPoints.Count];
            return point.Position;
        }
        return WorldPosition; // Fallback to center
    }
}
