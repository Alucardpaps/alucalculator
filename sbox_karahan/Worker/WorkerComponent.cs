using System;
using System.Linq;
using Sandbox;
using Karahan.Factory;

namespace Karahan.Worker;

public class WorkerStateMachine
{
    public WorkerState CurrentState { get; private set; }

    public void ChangeState(WorkerState newState)
    {
        CurrentState?.Exit();
        CurrentState = newState;
        CurrentState?.Enter();
    }

    public void Update()
    {
        CurrentState?.Execute();
    }
}

public sealed class WorkerComponent : Component
{
    [Property] public string MasterName { get; set; }
    [Property] public string Hometown { get; set; }
    [Property] public string Skill { get; set; }
    [Property] public string Trait { get; set; }
    [Property] public string Bg { get; set; }

    [Property] public string Status { get; set; } = "idle";
    [Property] public int Morale { get; set; } = 80;
    [Property] public int Trust { get; set; } = 70;
    [Property] public int Warnings { get; set; } = 0;
    [Property] public int StageIdx { get; set; } = 0;
    [Property] public bool Slacking { get; set; } = false;

    [Property] public string CurrentWS { get; set; }
    public ActiveBlueprint AssignedBlueprint { get; set; }
    public QuestionTemplate ActiveQuestion { get; set; }

    // Event & Stat Boost Modifiers matching Godot
    public float SpeedModifier { get; set; } = 1.0f;
    public string EventStatus { get; set; } = "";
    public int EventDaysRemaining { get; set; } = 0;
    public string EventDescription { get; set; } = "";
    public float TrainingSpeedBonus { get; set; } = 0.0f;
    public List<string> Feuds { get; set; } = new();

    public void ReturnToWorkOrIdle()
    {
        if (AssignedBlueprint != null)
        {
            Status = "working";
            StateMachine.ChangeState(new WorkingState(this));
        }
        else
        {
            Status = "idle";
            StateMachine.ChangeState(new IdleState(this));
        }
    }

    public WorkerStateMachine StateMachine { get; private set; }

    protected override void OnStart()
    {
        StateMachine = new WorkerStateMachine();
        StateMachine.ChangeState(new IdleState(this));
    }

    protected override void OnUpdate()
    {
        StateMachine?.Update();
    }

    /// <summary>
    /// Commands the worker to navigate to a specific workstation's position in s&box.
    /// </summary>
    public void MoveToWorkstation(string wsKey)
    {
        var stations = Scene.GetAllComponents<Workstation>();
        var targetStation = stations.FirstOrDefault(x => x.WorkstationId == wsKey);

        if (targetStation != null)
        {
            var position = targetStation.GetWorkerPosition(MasterName.GetHashCode());
            
            // In s&box, use NavMeshAgent.MoveTo() to navigate
            var agent = Components.Get<NavMeshAgent>();
            if (agent != null)
            {
                agent.MoveTo(position);
            }
            else
            {
                WorldPosition = position; // Instant move if nav agent isn't found
            }
        }
    }
}
