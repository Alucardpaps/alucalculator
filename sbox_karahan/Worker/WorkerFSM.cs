using System;
using System.Linq;
using Sandbox;
using Karahan.Factory;

namespace Karahan.Worker;

public abstract class WorkerState
{
    protected WorkerComponent Worker;
    public WorkerState(WorkerComponent worker) => Worker = worker;

    public virtual void Enter() {}
    public virtual void Execute() {}
    public virtual void Exit() {}
}

public class IdleState : WorkerState
{
    private int _idleTicks = 0;
    public IdleState(WorkerComponent worker) : base(worker) {}

    public override void Enter()
    {
        Worker.Status = "idle";
        _idleTicks = 0;
        TaskScheduler.Instance.ReleaseAllForWorker(Worker.MasterName);
    }

    public override void Execute()
    {
        _idleTicks++;
        // Wander around workstations every 5 ticks in s&box NavMesh if they are free
        if (_idleTicks % 5 == 0)
        {
            var wsKeys = KarahanGame.Current.SelectedFactory.Workstations.Keys
                .Where(k => k != "ws-cay" && k != "ws-wc" && TaskScheduler.Instance.IsStationAvailable(k))
                .ToList();

            if (wsKeys.Count == 0)
            {
                wsKeys = KarahanGame.Current.SelectedFactory.Workstations.Keys.ToList();
            }

            var nextWs = wsKeys[Random.Shared.Next(wsKeys.Count)];
            Worker.CurrentWS = nextWs;
            Worker.MoveToWorkstation(nextWs);

            // Anxious state trigger
            if (_idleTicks >= 12 && Random.Shared.NextSingle() < 0.20f && Worker.ActiveQuestion == null && Worker.MasterName != "Sevkiyatçı Selo")
            {
                Worker.StateMachine.ChangeState(new AnxiousState(Worker));
            }
        }
    }
}

public class WorkingState : WorkerState
{
    public WorkingState(WorkerComponent worker) : base(worker) {}

    public override void Enter()
    {
        Worker.Status = "working";
        Worker.Slacking = false;
        AcquireWorkstationSlot();
    }

    public override void Execute()
    {
        if (Worker.AssignedBlueprint == null)
        {
            Worker.StateMachine.ChangeState(new IdleState(Worker));
            return;
        }

        bool hasSlot = AcquireWorkstationSlot();
        if (!hasSlot)
        {
            // Go idle and wait for the station to clear up
            Worker.StateMachine.ChangeState(new IdleState(Worker));
            return;
        }

        // Hygiene check
        if (!string.IsNullOrEmpty(Worker.CurrentWS))
        {
            bool preyHere = KarahanGame.Current.Preys.Any(p => p.Ws == Worker.CurrentWS);
            if (preyHere)
            {
                KarahanGame.Current.AddLog($"🤢 {Worker.MasterName}: \"Şefim, {Worker.CurrentWS} istasyonunda leş var! Temizlenmeden çalışmam!\"");
                Worker.StateMachine.ChangeState(new SlackingState(Worker));
                return;
            }
        }

        // Cat interaction
        if (!string.IsNullOrEmpty(Worker.CurrentWS))
        {
            bool catHere = KarahanGame.Current.Animals.Any(a => a.Type == "kedi" && a.Ws == Worker.CurrentWS);
            if (catHere && Random.Shared.NextSingle() < 0.20f)
            {
                Worker.Morale = Math.Min(100, Worker.Morale + 3);
            }
        }

        // Morale loss
        if (Random.Shared.NextSingle() < 0.03f)
        {
            Worker.Morale = Math.Max(0, Worker.Morale - 1);
        }

        // Slack trigger
        float slackChance = Worker.Morale < 60 ? 0.04f : 0.012f;
        if (Random.Shared.NextSingle() < slackChance && Worker.MasterName != "Sevkiyatçı Selo")
        {
            Worker.StateMachine.ChangeState(new SlackingState(Worker));
        }
    }

    public override void Exit()
    {
        TaskScheduler.Instance.ReleaseAllForWorker(Worker.MasterName);
    }

    private bool AcquireWorkstationSlot()
    {
        if (Worker.AssignedBlueprint == null) return false;

        var reqSkill = Worker.AssignedBlueprint.Stages[Worker.StageIdx];
        var wsKey = KarahanGame.Current.SelectedFactory.Workstations.FirstOrDefault(
            x => x.Value.RequiredSkill == reqSkill
        ).Key ?? "ws-depo";

        if (Worker.CurrentWS == wsKey)
        {
            return true;
        }

        // Try booking
        bool booked = TaskScheduler.Instance.BookWorkstation(Worker.MasterName, wsKey);
        if (booked)
        {
            Worker.CurrentWS = wsKey;
            Worker.MoveToWorkstation(wsKey);
            return true;
        }

        var wsName = KarahanGame.Current.SelectedFactory.Workstations.GetValueOrDefault(wsKey)?.Name ?? "İstasyon";
        KarahanGame.Current.AddLog($"⏳ {Worker.MasterName}: \"{wsName} tezgahı dolu, kuyrukta bekliyorum.\"");
        return false;
    }
}

public class SlackingState : WorkerState
{
    private int _slackTicks = 0;
    public SlackingState(WorkerComponent worker) : base(worker) {}

    public override void Enter()
    {
        Worker.Status = "slacking";
        Worker.Slacking = true;
        _slackTicks = 6 + Random.Shared.Next(6);

        var breakSpots = new[] { "ws-cay", "ws-wc", "ws-ik" };
        string targetSpot = null;

        foreach (var spot in breakSpots)
        {
            if (TaskScheduler.Instance.BookWorkstation(Worker.MasterName, spot))
            {
                targetSpot = spot;
                break;
            }
        }

        if (targetSpot == null)
        {
            targetSpot = "ws-cay";
            TaskScheduler.Instance.BookWorkstation(Worker.MasterName, targetSpot);
        }

        Worker.CurrentWS = targetSpot;
        Worker.MoveToWorkstation(targetSpot);

        var spotName = KarahanGame.Current.SelectedFactory.Workstations.GetValueOrDefault(targetSpot)?.Name ?? "Mola Alanı";
        KarahanGame.Current.AddLog($"☕ {Worker.MasterName} çalışmaktan sıkıldı, {spotName} bölgesine kaçtı.");
    }

    public override void Execute()
    {
        _slackTicks--;
        int moraleIncrement = KarahanGame.Current.CoffeeMachineOwned ? 6 : 4;
        int maxMorale = KarahanGame.Current.CoffeeMachineOwned ? 110 : 100;
        Worker.Morale = Math.Min(maxMorale, Worker.Morale + moraleIncrement);

        // Dog barking/chasing back to work
        if (!string.IsNullOrEmpty(Worker.CurrentWS))
        {
            bool dogHere = KarahanGame.Current.Animals.Any(a => a.Type == "kopek" && a.Ws == Worker.CurrentWS);
            if (dogHere && KarahanGame.Current.DogTrust >= 50 && Worker.AssignedBlueprint != null)
            {
                KarahanGame.Current.AddLog($"🐶 Karabaş, {Worker.MasterName}'i dinlenme alanında yakalayıp havladı ve işinin başına dönmeye zorladı!");
                Worker.StateMachine.ChangeState(new WorkingState(Worker));
                return;
            }
        }

        if (_slackTicks <= 0)
        {
            Worker.StateMachine.ChangeState(new IdleState(Worker));
        }
    }

    public override void Exit()
    {
        Worker.Slacking = false;
        TaskScheduler.Instance.ReleaseAllForWorker(Worker.MasterName);
    }
}

public class AnxiousState : WorkerState
{
    public AnxiousState(WorkerComponent worker) : base(worker) {}

    public override void Enter()
    {
        Worker.Status = "idle";
        
        string targetSpot = "ws-arge";
        if (TaskScheduler.Instance.BookWorkstation(Worker.MasterName, targetSpot))
        {
            Worker.CurrentWS = targetSpot;
            Worker.MoveToWorkstation(targetSpot);
        }
        else
        {
            Worker.CurrentWS = "ws-depo";
            Worker.MoveToWorkstation("ws-depo");
        }

        Worker.ActiveQuestion = new QuestionTemplate(
            "Şefim, çok boş kaldım. Kendimi köreltmek istemiyorum. Bana acil yapacak bir iş verin!",
            new List<ActionTemplate>
            {
                new ActionTemplate("Hemen yeni sipariş alalım (+5 Moral)", true, OnAcceptOrder),
                new ActionTemplate("Git depoyu düzenle (-3 Güven)", false, OnRejectOrder)
            }
        );

        KarahanGame.Current.AddLog($"📣 {Worker.MasterName} boş kalmaktan şikayetçi ve iş bekliyor!");
    }

    public override void Execute()
    {
        if (Worker.ActiveQuestion == null)
        {
            Worker.StateMachine.ChangeState(new IdleState(Worker));
        }
    }

    public override void Exit()
    {
        TaskScheduler.Instance.ReleaseAllForWorker(Worker.MasterName);
    }

    private void OnAcceptOrder()
    {
        Worker.Morale = Math.Clamp(Worker.Morale + 5, 0, 100);
        KarahanGame.Current.GenerateNewOrder();
        KarahanGame.Current.AddLog($"{Worker.MasterName} için yeni sipariş oluşturuldu.");
        Worker.ActiveQuestion = null;
        Worker.StateMachine.ChangeState(new IdleState(Worker));
    }

    private void OnRejectOrder()
    {
        Worker.Trust = Math.Clamp(Worker.Trust - 3, 0, 100);
        KarahanGame.Current.AddLog($"{Worker.MasterName} depoyu düzenlemeye gönderildi.");
        Worker.ActiveQuestion = null;
        Worker.StateMachine.ChangeState(new IdleState(Worker));
    }
}

public class EventState : WorkerState
{
    public EventState(WorkerComponent worker) : base(worker) {}

    public override void Enter()
    {
        Worker.Slacking = false;

        // Clear active blueprint and remove worker from its assignment
        if (Worker.AssignedBlueprint != null)
        {
            Worker.AssignedBlueprint.AssignedWorkers.Remove(Worker.MasterName);
            Worker.AssignedBlueprint = null;
        }

        // Release bookings
        TaskScheduler.Instance.ReleaseAllForWorker(Worker.MasterName);

        // Position them based on status
        string targetSpot;
        switch (Worker.Status)
        {
            case "sick":
            case "injured":
                targetSpot = "ws-revir"; // Clinic
                break;
            case "leave":
            case "training":
                targetSpot = "ws-cay"; // Tea break
                break;
            case "offsite":
                targetSpot = "ws-depo"; // Shipment dock
                break;
            default:
                targetSpot = "ws-cay";
                break;
        }

        if (TaskScheduler.Instance.BookWorkstation(Worker.MasterName, targetSpot))
        {
            Worker.CurrentWS = targetSpot;
            Worker.MoveToWorkstation(targetSpot);
        }
    }

    public override void Execute()
    {
        // Just stay at the booked workstation, no wandering or idle tick logic
    }

    public override void Exit()
    {
        TaskScheduler.Instance.ReleaseAllForWorker(Worker.MasterName);
    }
}
