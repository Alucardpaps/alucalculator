using System;
using System.Linq;
using Sandbox;

namespace Karahan.Factory;

/// <summary>
/// Represents a stray animal (cat, dog, bird) that wanders the factory floor.
/// Attached to a 3D model prefab spawned by KarahanGame.
/// </summary>
public sealed class AnimalComponent : Component
{
    [Property] public string AnimalType { get; set; } // "kedi", "kopek", "kus"
    [Property] public string CurrentWS { get; set; }
    [Property] public int RemainingTicks { get; set; } = 40;

    /// <summary>
    /// How much trust this individual animal has accumulated.
    /// When an animal's personal trust reaches the threshold, it becomes a "factory pet".
    /// </summary>
    [Property] public int PersonalTrust { get; set; } = 0;
    [Property] public bool IsDomesticated { get; set; } = false;

    private float _wanderTimer = 0f;
    private const float WanderInterval = 8f; // seconds between wandering

    protected override void OnUpdate()
    {
        _wanderTimer += Time.Delta;

        if (_wanderTimer >= WanderInterval)
        {
            _wanderTimer = 0f;
            WanderToRandomStation();
        }

        // Domestication check — dogs that linger long enough become factory dogs
        if (!IsDomesticated && PersonalTrust >= 30)
        {
            Domesticate();
        }
    }

    /// <summary>
    /// Moves this animal to a random workstation's vicinity using NavMesh or direct placement.
    /// </summary>
    private void WanderToRandomStation()
    {
        if (KarahanGame.Current?.SelectedFactory == null) return;

        var wsKeys = KarahanGame.Current.SelectedFactory.Workstations.Keys.ToList();
        if (wsKeys.Count == 0) return;

        var nextWs = wsKeys[Random.Shared.Next(wsKeys.Count)];
        CurrentWS = nextWs;

        // Find the physical workstation in the scene
        var stations = Scene.GetAllComponents<Workstation>();
        var target = stations.FirstOrDefault(s => s.WorkstationId == nextWs);

        if (target != null)
        {
            var offset = new Vector3(
                Random.Shared.NextSingle() * 60f - 30f,
                Random.Shared.NextSingle() * 60f - 30f,
                0f
            );

            var agent = Components.Get<NavMeshAgent>();
            if (agent != null)
            {
                agent.MoveTo(target.WorldPosition + offset);
            }
            else
            {
                WorldPosition = target.WorldPosition + offset;
            }
        }

        // Small trust increment per wander — the animal is getting comfortable
        PersonalTrust++;

        // Reflect on global trust
        switch (AnimalType)
        {
            case "kedi":
                KarahanGame.Current.CatTrust = Math.Min(100, KarahanGame.Current.CatTrust + 1);
                break;
            case "kopek":
                KarahanGame.Current.DogTrust = Math.Min(100, KarahanGame.Current.DogTrust + 1);
                break;
        }
    }

    private void Domesticate()
    {
        IsDomesticated = true;
        RemainingTicks = int.MaxValue; // Never leaves

        string label = AnimalType switch
        {
            "kedi" => "🐱 Kedi",
            "kopek" => "🐶 Köpek",
            _ => "🐦 Kuş"
        };

        KarahanGame.Current.AddLog($"🏠 {label} fabrikayı benimsedi ve artık buranın sakini! Güven kazanıldı.");
    }

    /// <summary>
    /// Called by KarahanGame when a domesticated animal drops prey at a workstation.
    /// </summary>
    public void DropPrey()
    {
        if (!IsDomesticated) return;
        if (string.IsNullOrEmpty(CurrentWS)) return;

        var type = Random.Shared.NextSingle() < 0.5f ? "mouse" : "bird";

        KarahanGame.Current.Preys.Add(new PreyItem
        {
            Id = Guid.NewGuid().ToString(),
            Ws = CurrentWS,
            Type = type,
            Age = 0
        });

        string preyName = type == "mouse" ? "fare" : "kuş";
        KarahanGame.Current.AddLog($"🐁 Evcil {(AnimalType == "kedi" ? "kedi" : "köpek")}, yakaladığı bir {preyName} leşini {KarahanGame.Current.SelectedFactory.Workstations[CurrentWS].Name} bölgesine bıraktı!");
    }
}
