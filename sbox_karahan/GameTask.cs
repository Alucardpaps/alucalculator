using System;
using System.Collections.Generic;
using System.Linq;
using Sandbox;
using Karahan.Factory;
using Karahan.Worker;

namespace Karahan;

public class ActiveBlueprint
{
    public string Name { get; set; }
    public List<string> Stages { get; set; } = new();
    public int StageIndex { get; set; } = 0;
    public int Need { get; set; }
    public List<string> Dependencies { get; set; } = new();
    public List<string> AssignedWorkers { get; set; } = new();
    public bool Done { get; set; }
    public bool Faulty { get; set; }
    public float Progress { get; set; }
}

public class ActiveOrder
{
    public string Id { get; set; }
    public string Desc { get; set; }
    public int Due { get; set; }
    public int Reward { get; set; }
    public int Penalty { get; set; }
    public bool Designed { get; set; }
    public int RndDays { get; set; }
    public List<ActiveBlueprint> Blueprints { get; set; } = new();
}

public class AnimalItem
{
    public string Id { get; set; }
    public string Type { get; set; } // kedi, kopek, kus
    public string Ws { get; set; }
    public int Duration { get; set; }
}

public class PreyItem
{
    public string Id { get; set; }
    public string Type { get; set; } // mouse, bird
    public string Ws { get; set; }
    public int Age { get; set; }
}

public sealed class KarahanGame : Component
{
    public static KarahanGame Current { get; private set; }

    [Property] public int Day { get; set; } = 1;
    [Property] public int Hour { get; set; } = 8;
    [Property] public int Minute { get; set; } = 0;
    [Property] public int Money { get; set; } = 75000;
    [Property] public int Rating { get; set; } = 100;
    [Property] public int BossTrust { get; set; } = 0;
    [Property] public int DogTrust { get; set; } = 0;
    [Property] public int CatTrust { get; set; } = 0;

    [Property] public bool Paused { get; set; }
    [Property] public string SelectedFactoryType { get; set; } = "radiator";
    [Property] public string PreviewFactoryType { get; set; } = "radiator";
    [Property] public FactoryTemplateResource FactoryResource { get; set; }
    public FactoryTemplate SelectedFactory { get; set; }
    public List<WorkerComponent> Masters { get; set; } = new();
    public List<ActiveOrder> Orders { get; set; } = new();
    public List<AnimalItem> Animals { get; set; } = new();
    public List<PreyItem> Preys { get; set; } = new();
    public Dictionary<string, int> Inventory { get; set; } = new();
    public List<string> Logs { get; set; } = new();
    public int CompletedOrdersCount { get; set; } = 0;

    [Property] public bool CrunchTime { get; set; }
    [Property] public int CrunchTimer { get; set; }
    [Property] public int CrunchFails { get; set; }

    // Parity State Variables with Godot
    [Property] public int PersonalBalance { get; set; } = 0;
    [Property] public string CurrentZone { get; set; } = "factory";
    [Property] public Dictionary<string, bool> HomeUpgrades { get; set; } = new()
    {
        { "bed", false },
        { "tv", false },
        { "coffee", false },
        { "kitchen", false },
        { "pc", false }
    };
    [Property] public Dictionary<string, bool> PersonalVehicles { get; set; } = new()
    {
        { "blue_sedan", true },
        { "red_hatchback", false },
        { "yellow_suv", false },
        { "black_sport", false }
    };
    [Property] public Dictionary<string, int> WorkstationUpgrades { get; set; } = new()
    {
        { "ws-lazer", 0 },
        { "ws-abkant", 0 },
        { "ws-dokuma", 0 },
        { "ws-firin", 0 },
        { "ws-lehim", 0 },
        { "ws-test", 0 },
        { "ws-boya", 0 },
        { "ws-montaj", 0 }
    };
    [Property] public Dictionary<string, int> WorkerLevels { get; set; } = new();
    [Property] public bool CoffeeMachineOwned { get; set; } = false;
    [Property] public bool OrderSoftwareOwned { get; set; } = false;
    [Property] public bool AutoLoaderOwned { get; set; } = false;
    [Property] public int MaxOrdersLimit { get; set; } = 3;
    [Property] public int OrdersCompletedToday { get; set; } = 0;
    [Property] public bool DayEndedAndSlept { get; set; } = false;

    public class PendingNotification
    {
        public int Hour { get; set; }
        public int Minute { get; set; }
        public bool Fired { get; set; }
        public string Type { get; set; } // technical, general
        public WorkerComponent Worker { get; set; }
        public string Body { get; set; }
        public List<ActionTemplate> Actions { get; set; }
    }

    public List<PendingNotification> PendingNotifications { get; set; } = new();

    private float _tickAccumulator = 0f;
    private const float TickInterval = 1.0f; // 1 second real-time = 1 tick

    protected override void OnAwake()
    {
        Current = this;
    }

    protected override void OnStart()
    {
        if (SelectedFactory == null)
        {
            if (FactoryResource != null)
            {
                SelectFactory(FactoryResource.FactoryName ?? PreviewFactoryType);
            }
            else
            {
                if (string.IsNullOrEmpty(SelectedFactoryType) && !string.IsNullOrEmpty(PreviewFactoryType))
                {
                    SelectedFactoryType = PreviewFactoryType;
                }
                if (!string.IsNullOrEmpty(SelectedFactoryType))
                {
                    SelectFactory(SelectedFactoryType);
                }
            }
        }
    }

    protected override void OnUpdate()
    {
        if (Paused || SelectedFactory == null) return;

        _tickAccumulator += Time.Delta;
        if (_tickAccumulator >= TickInterval)
        {
            _tickAccumulator -= TickInterval;
            GameTick();
        }
    }

    public void GameTick()
    {
        Minute += 3;
        if (Minute >= 60)
        {
            Hour += Minute / 60;
            Minute %= 60;
        }

        // End of day trigger
        if (Hour >= 18)
        {
            EndOfDay();
            return;
        }

        // Process production
        ProcessProduction();

        // Check scheduled notifications
        CheckNotifications();

        // Verify active question deadlines
        foreach (var m in Masters)
        {
            if (m.ActiveQuestion != null)
            {
                var q = m.ActiveQuestion;
                if (Hour > q.ExpiresAtHour || (Hour == q.ExpiresAtHour && Minute >= q.ExpiresAtMin))
                {
                    m.ActiveQuestion = null;
                    m.Morale = Math.Max(0, m.Morale - 8);
                    m.Trust = Math.Max(0, m.Trust - 5);
                    AddLog($"⚠️ {m.MasterName}'in sorusunu zamanında yanıtlamadınız! Güven ve moral azaldı.");
                    if (m.Status == "idle")
                    {
                        m.StateMachine.ChangeState(new IdleState(m));
                    }
                }
            }
        }

        // Crunch time ticking
        if (CrunchTime)
        {
            CrunchTimer -= 3;
            if (CrunchTimer <= 0)
            {
                CrunchTime = false;
                if (CrunchFails == 0)
                {
                    BossTrust = Math.Min(10, BossTrust + 1);
                    Money += 5000;
                    AddLog("🎉 Tebrikler! Yoğun çalışma dönemini SIFIR hatayla tamamladınız! Kasa +5.000₺, Patron Güveni +1");
                }
                else
                {
                    BossTrust = Math.Max(-15, BossTrust - 2);
                    AddLog($"⚠️ Yoğun çalışma dönemini {CrunchFails} adet teknik hatayla kapattınız! Patron Güveni düştü.");
                }
            }
            else
            {
                // Crunch has a high chance (10%) to trigger technical questions
                if (Random.Shared.NextSingle() < 0.10f)
                {
                    var workingMasters = Masters.Where(m => m.Status == "working" && m.ActiveQuestion == null && m.MasterName != "Sevkiyatçı Selo").ToList();
                    if (workingMasters.Count > 0)
                    {
                        var w = workingMasters[Random.Shared.Next(workingMasters.Count)];
                        SpawnTechnicalQuestion(w);
                    }
                }
            }
        }
        else
        {
            // 0.3% chance of triggering crunch time between 9:00 and 15:00
            if (Hour >= 9 && Hour <= 15 && Random.Shared.NextSingle() < 0.003f)
            {
                TriggerCrunchTime();
            }
        }

        // Random bottlenecks and hiring checks
        if (Random.Shared.NextSingle() < 0.015f)
        {
            CheckBottlenecks();
        }

        // Random animal spawns
        if (Random.Shared.NextSingle() < 0.02f)
        {
            SpawnAnimal();
        }

        // Update animal durations
        for (int i = Animals.Count - 1; i >= 0; i--)
        {
            Animals[i].Duration--;
            if (Animals[i].Duration <= 0)
            {
                AddLog($"🐾 {Animals[i].Type.ToUpper()} fabrikadan çıktı.");
                Animals.RemoveAt(i);
            }
        }

        // Prey spawning
        if ((DogTrust >= 80 || CatTrust >= 80) && Random.Shared.NextSingle() < 0.015f)
        {
            SpawnPrey();
        }

        // Prey rot/hygiene ticking
        foreach (var p in Preys)
        {
            p.Age++;
            if (p.Age > 15) // 15 ticks = 45 game minutes
            {
                foreach (var m in Masters)
                {
                    m.Morale = Math.Max(0, m.Morale - 6);
                }
                AddLog($"⚠️ Ölü {p.Type.ToUpper()} leşi temizlenmediği için hijyen problemi yaratıyor! Ustaların morali düştü.");
                p.Age = 0;
            }
        }
    }

    public void AddLog(string message)
    {
        var timestamp = $"[{Hour:D2}:{Minute:D2}]";
        Logs.Insert(0, $"{timestamp} {message}");
    }

    public void ProcessProduction()
    {
        foreach (var m in Masters)
        {
            if (m.Status != "working" || m.Slacking || m.AssignedBlueprint == null) continue;

            // Feud check
            bool coWorkerFeud = false;
            foreach (var coW in Masters)
            {
                if (coW.AssignedBlueprint == m.AssignedBlueprint && coW != m)
                {
                    if (m.Feuds.Contains(coW.MasterName))
                    {
                        m.Status = "feud";
                        coWorkerFeud = true;
                        break;
                    }
                }
            }
            if (coWorkerFeud) continue;

            // Workers count check
            if (m.AssignedBlueprint.AssignedWorkers.Count < m.AssignedBlueprint.Need) continue;

            var stages = m.AssignedBlueprint.Stages;
            if (m.StageIdx >= stages.Count) continue;
            string reqSkill = stages[m.StageIdx];

            // Progress increment logic
            float speed = m.Skill == reqSkill ? 5f : 2f;

            // Apply worker level bonus (+15% speed per level) and training bonus
            int wLvl = WorkerLevels.GetValueOrDefault(m.MasterName, 1);
            float workerMult = 1.0f + (wLvl - 1) * 0.15f + m.TrainingSpeedBonus;

            // Apply workstation level bonus (+20% speed per level)
            int wsLvl = WorkstationUpgrades.GetValueOrDefault(m.CurrentWS ?? "", 0);
            float wsMult = 1.0f + wsLvl * 0.20f;

            float finalSpeed = speed * workerMult * wsMult * m.SpeedModifier;
            if (CrunchTime) finalSpeed *= 2;

            m.AssignedBlueprint.Progress += finalSpeed;

            if (m.AssignedBlueprint.Progress >= 100)
            {
                var bp = m.AssignedBlueprint;
                bp.StageIndex++;
                bp.Progress = 0;

                // Free workers
                var workersCopy = bp.AssignedWorkers.ToList();
                bp.AssignedWorkers.Clear();

                foreach (var wName in workersCopy)
                {
                    var worker = Masters.FirstOrDefault(x => x.MasterName == wName);
                    if (worker != null)
                    {
                        worker.AssignedBlueprint = null;
                        worker.Status = "idle";
                        worker.StageIdx = 0;
                        worker.StateMachine.ChangeState(new IdleState(worker));
                    }
                }

                if (bp.StageIndex >= bp.Stages.Count)
                {
                    bp.Done = true;
                    AddLog($"✅ \"{bp.Name}\" üretimi tamamlandı.");
                    CheckOrderCompletion();
                }
                else
                {
                    AddLog($"🔧 \"{bp.Name}\" bir sonraki aşamaya geçti: {bp.Stages[bp.StageIndex]}.");
                }
            }
        }
    }

    public void CheckOrderCompletion()
    {
        Orders = Orders.Where(o =>
        {
            if (o.Blueprints.All(b => b.Done))
            {
                bool hasFault = o.Blueprints.Any(b => b.Faulty);
                if (hasFault)
                {
                    Money -= o.Penalty;
                    Rating = Math.Max(0, Rating - 15);
                    BossTrust = Math.Max(-15, BossTrust - 2);
                    AddLog($"⚠️ {o.Id} hatalı imalat ile teslim edildi! -{o.Penalty:N0}₺ ceza.");
                }
                else
                {
                    int reward = o.Reward;
                    if (OrderSoftwareOwned) reward = (int)Math.Round(reward * 1.10);
                    Money += reward;
                    Rating = Math.Min(GetMaxRating(), Rating + 5);
                    BossTrust = Math.Min(10, BossTrust + 1);
                    AddLog($"🎉 {o.Id} başarıyla sevk edildi! +{reward:N0}₺ kasaya girdi.");
                }
                CompletedOrdersCount++;
                OrdersCompletedToday++;
                return false;
            }
            return true;
        }).ToList();
    }

    public void EndOfDay()
    {
        Paused = true;
        DayEndedAndSlept = false;

        // Pay wages
        int wages = Masters.Count * 280;
        Money -= wages;
        AddLog($"💰 Günlük usta yevmiyeleri ödendi: -{wages:N0}₺");

        // Penalties for overdue orders
        int overduePenalty = 0;
        int overdueCount = 0;
        foreach (var o in Orders)
        {
            o.Due--;
            if (o.Due <= 0 && !o.Blueprints.All(b => b.Done))
            {
                Money -= o.Penalty;
                overduePenalty += o.Penalty;
                overdueCount++;
                Rating = Math.Max(0, Rating - 20);
                BossTrust = Math.Max(-15, BossTrust - 3);
                AddLog($"🚨 {o.Id} teslim süresi aşıldı! -{o.Penalty:N0}₺ gecikme cezası.");
            }
        }
        Orders = Orders.Where(o => o.Due > 0 || o.Blueprints.All(b => b.Done)).ToList();

        // Design R&D progress
        foreach (var o in Orders)
        {
            if (!o.Designed)
            {
                o.RndDays--;
                if (o.RndDays <= 0)
                {
                    o.Designed = true;
                    AddLog($"📐 {o.Id} tasarımı onaylandı ve üretime açıldı.");
                }
            }
        }

        // Ticking and cleaning up worker event durations
        foreach (var m in Masters)
        {
            if (m.EventDaysRemaining > 0)
            {
                m.EventDaysRemaining--;
                if (m.EventDaysRemaining <= 0)
                {
                    bool wasTraining = m.EventStatus == "training";
                    m.EventStatus = "";
                    m.SpeedModifier = 1.0f;
                    m.EventDescription = "";
                    if (wasTraining)
                    {
                        m.TrainingSpeedBonus += 0.15f;
                        AddLog($"🌟 {m.MasterName} eğitim seminerinden döndü! Hızı kalıcı olarak +%15 arttı.");
                    }
                    else
                    {
                        AddLog($"ℹ️ {m.MasterName} üzerindeki geçici durum sona erdi.");
                    }

                    if (m.Status == "leave" || m.Status == "sick" || m.Status == "injured" || m.Status == "offsite")
                    {
                        m.Status = "idle";
                        m.StateMachine.ChangeState(new IdleState(m));
                    }
                }
            }

            if (m.Status == "leave" || m.Status == "sick" || m.Status == "injured" || m.Status == "offsite")
            {
                m.ActiveQuestion = null;
            }
            else
            {
                if (m.Slacking)
                {
                    m.Slacking = false;
                    m.Status = m.AssignedBlueprint != null ? "working" : "idle";
                    m.ReturnToWorkOrIdle();
                }
                m.ActiveQuestion = null;
            }
        }

        Animals.Clear();
        Preys.Clear();

        // Spawn a new order occasionally (60% chance)
        if (Orders.Count < MaxOrdersLimit && Random.Shared.NextSingle() < 0.60f)
        {
            GenerateNewOrder();
        }

        // Daily Score Calculation
        int baseScore = 100;
        int completedTodayPoints = OrdersCompletedToday * 50;
        int avgMorale = 0;
        int avgTrust = 0;
        if (Masters.Count > 0)
        {
            avgMorale = (int)Math.Round(Masters.Average(m => m.Morale));
            avgTrust = (int)Math.Round(Masters.Average(m => m.Trust));
        }
        int warningPenalty = Masters.Sum(m => m.Warnings) * 15;
        int dailyScore = baseScore + completedTodayPoints + avgMorale + avgTrust - warningPenalty - (overdueCount * 25);
        dailyScore = Math.Clamp(dailyScore, 10, 500);

        int personalEarned = dailyScore * 10;
        PersonalBalance += personalEarned;

        // Max orders limit adjustments
        bool performanceGood = dailyScore >= 250;
        int maxCap = OrderSoftwareOwned ? 8 : 6;
        if (performanceGood)
        {
            MaxOrdersLimit = Math.Clamp(MaxOrdersLimit + 1, 1, maxCap);
            AddLog($"📈 Günlük performans iyi olduğu için aktif sipariş limiti 1 artırıldı! Yeni Limit: {MaxOrdersLimit}");
        }
        else
        {
            MaxOrdersLimit = Math.Clamp(MaxOrdersLimit - 1, 1, maxCap);
            AddLog($"📉 Günlük performans yetersiz olduğu için aktif sipariş limiti 1 azaltıldı. Yeni Limit: {MaxOrdersLimit}");
        }

        AddLog($"🌙 Gün {Day} sona erdi. Puan ve Ev Geliştirme ekranı açılıyor...");
    }

    public void CheckBottlenecks()
    {
        foreach (var o in Orders)
        {
            if (!o.Designed) continue;
            foreach (var bp in o.Blueprints)
            {
                if (bp.Done || bp.AssignedWorkers.Count >= bp.Need) continue;

                // Dependencies check
                bool ready = bp.Dependencies.All(depName =>
                {
                    var depBp = o.Blueprints.FirstOrDefault(b => b.Name == depName);
                    return depBp != null && depBp.Done;
                });
                if (!ready) continue;

                var reqSkill = bp.Stages[bp.StageIndex];
                var skillWorkers = Masters.Where(m => m.Skill == reqSkill).ToList();
                if (skillWorkers.Count == 0) continue;

                bool allBusy = skillWorkers.All(m => m.Status != "idle");
                if (allBusy)
                {
                    var worker = skillWorkers.FirstOrDefault(m => m.ActiveQuestion == null);
                    if (worker != null)
                    {
                        TriggerHiringQuestion(worker, reqSkill);
                    }
                }
            }
        }
    }

    private void TriggerHiringQuestion(WorkerComponent worker, string reqSkill)
    {
        int hireCost = 4000;
        worker.ActiveQuestion = new QuestionTemplate(
            $"Şefim, {reqSkill} bölümünde siparişler birikti ve hepimiz doluyuz! Yanımıza yeni bir usta alalım mı? (İşe alım: {hireCost:N0} ₺, Günlük: 280 ₺)",
            new List<ActionTemplate>
            {
                new($"Evet, usta işe al (-{hireCost:N0} ₺)", true, () => ApproveHire(worker, reqSkill, hireCost)),
                new("Hayır, böyle devam edelim", false, () => DenyHire(worker, reqSkill))
            }
        );
        AddLog($"📣 {worker.MasterName}: \"{reqSkill} departmanı çok sıkıştı, eleman lazım!\" (Ustanın üzerine tıklayarak yanıtlayın)");
    }

    private void ApproveHire(WorkerComponent wComp, string reqSkill, int cost)
    {
        if (Money < cost)
        {
            AddLog("❌ Yetersiz kasa bakiyesi! Usta işe alınamadı.");
            wComp.Morale = Math.Max(0, wComp.Morale - 10);
            wComp.StateMachine.ChangeState(wComp.AssignedBlueprint == null ? new IdleState(wComp) : new WorkingState(wComp));
            return;
        }

        Money -= cost;
        string newName = GenerateCandidateName();
        string newHometown = GetRandomHometown();
        string newTrait = GetRandomTrait();

        var wGo = Scene.CreateObject();
        wGo.Name = $"Worker_{newName}";
        var newWComp = wGo.Components.Create<WorkerComponent>();
        newWComp.MasterName = newName;
        newWComp.Hometown = newHometown;
        newWComp.Skill = reqSkill;
        newWComp.Trait = newTrait;
        newWComp.Bg = $"{newName}, {reqSkill} departmanındaki iş yığılması nedeniyle ekibe katıldı.";
        newWComp.Morale = 80;
        newWComp.Trust = 70;
        newWComp.Warnings = 0;
        newWComp.Status = "idle";
        wGo.WorldPosition = wComp.GameObject.WorldPosition + new Vector3(50f, 0f, 0f);

        Masters.Add(newWComp);

        AddLog($"👷 {newName} ({reqSkill}) başarıyla işe alındı! Kasa -{cost:N0} ₺");
        wComp.Morale = Math.Min(100, wComp.Morale + 15);
        wComp.Trust = Math.Min(100, wComp.Trust + 10);
        wComp.StateMachine.ChangeState(wComp.AssignedBlueprint == null ? new IdleState(wComp) : new WorkingState(wComp));
    }

    private void DenyHire(WorkerComponent wComp, string reqSkill)
    {
        var skillWorkers = Masters.Where(w => w.Skill == reqSkill).ToList();
        foreach (var w in skillWorkers)
        {
            w.Morale = Math.Max(0, w.Morale - 12);
            w.Trust = Math.Max(0, w.Trust - 6);
        }
        AddLog($"⚠️ {reqSkill} bölümünde usta alım talebi reddedildi. Çalışan morali düştü.");
        wComp.StateMachine.ChangeState(wComp.AssignedBlueprint == null ? new IdleState(wComp) : new WorkingState(wComp));
    }

    private string GenerateCandidateName()
    {
        var firstNames = new List<string> { "Usta Selami", "Usta Veli", "Usta Recai", "Usta Fatma", "Usta Şükrü", "Usta Hatice", "Usta Salih", "Usta Bekir", "Usta Kazım", "Usta Niyazi", "Usta İsmail", "Usta Fadime", "Usta Şerife" };
        var existing = Masters.Select(m => m.MasterName).ToList();
        var unused = firstNames.Where(n => !existing.Contains(n)).ToList();
        if (unused.Count > 0)
        {
            return unused[Random.Shared.Next(unused.Count)];
        }
        return $"Yardımcı Usta {Random.Shared.Next(100)}";
    }

    private string GetRandomHometown()
    {
        var towns = new[] { "Samsun", "Erzurum", "Balıkesir", "Manisa", "Kütahya", "Çanakkale", "Denizli", "Sinop", "Bartın", "Giresun", "Rize", "Ordu" };
        return towns[Random.Shared.Next(towns.Length)];
    }

    private string GetRandomTrait()
    {
        var traits = new[] { "İnatçı", "Girişken", "Asosyal", "Yardımcıev" };
        return traits[Random.Shared.Next(traits.Length)];
    }

    private void SpawnAnimal()
    {
        var types = new[] { "kedi", "kopek", "kus" };
        var type = types[Random.Shared.Next(types.Length)];
        var wsKeys = SelectedFactory.Workstations.Keys.ToList();
        var ws = wsKeys[Random.Shared.Next(wsKeys.Count)];
        Animals.Add(new AnimalItem { Id = Guid.NewGuid().ToString(), Type = type, Ws = ws, Duration = 40 });
        AddLog($"🐾 Sürpriz Misafir! Fabrikayı bir {type.ToUpper()} ziyaret ediyor. ({SelectedFactory.Workstations[ws].Name} bölgesinde)");
    }

    private void SpawnPrey()
    {
        var wsKeys = SelectedFactory.Workstations.Keys.ToList();
        var ws = wsKeys[Random.Shared.Next(wsKeys.Count)];
        var type = Random.Shared.NextSingle() < 0.5f ? "mouse" : "bird";
        Preys.Add(new PreyItem { Id = Guid.NewGuid().ToString(), Ws = ws, Type = type, Age = 0 });
        AddLog($"🐁 Av Getirildi! Evcilleşen kedi/köpeklerden biri yakaladığı bir {type.ToUpper()} leşini {SelectedFactory.Workstations[ws].Name} bölgesine bıraktı.");
    }

    // ─── CALLBACKS AND HELPERS FOR EVENT DIALOGS ───

    public void GenerateNewOrder()
    {
        if (SelectedFactory == null) return;
        var templates = SelectedFactory.OrderTemplates;
        if (templates.Count == 0) return;
        var t = templates[Random.Shared.Next(templates.Count)];
        var orderId = $"Sipariş_{(CompletedOrdersCount + Orders.Count + 1):D3}";

        var order = new ActiveOrder
        {
            Id = orderId,
            Desc = t.Desc,
            Due = t.Due,
            Reward = t.Reward,
            Penalty = t.Penalty,
            Designed = false,
            RndDays = t.RndDays
        };

        foreach (var bp in t.Blueprints)
        {
            order.Blueprints.Add(new ActiveBlueprint
            {
                Name = bp.Name,
                Stages = bp.Stages.ToList(),
                StageIndex = 0,
                Need = bp.Need,
                Dependencies = bp.Dependencies.ToList(),
                AssignedWorkers = new(),
                Done = false,
                Faulty = false,
                Progress = 0
            });
        }

        Orders.Add(order);
        AddLog($"📣 Yeni sipariş talebi geldi: {t.Desc}");
    }

    public void OpenPurchaseModal()
    {
        var pm = Scene.GetAllComponents<PurchaseModal>().FirstOrDefault();
        pm?.Show();
    }

    public void OnAllowClinic(WorkerComponent worker)
    {
        worker.ActiveQuestion = null;
        worker.Morale = Math.Clamp(worker.Morale + 5, 0, 100);
        worker.StateMachine.ChangeState(new SlackingState(worker));
    }

    public void OnDenyClinic(WorkerComponent worker)
    {
        worker.ActiveQuestion = null;
        worker.Morale = Math.Clamp(worker.Morale - 8, 0, 100);
        worker.Trust = Math.Clamp(worker.Trust - 4, 0, 100);
        worker.StateMachine.ChangeState(worker.AssignedBlueprint != null ? new WorkingState(worker) : new IdleState(worker));
    }

    public void OnOpenPurchase(WorkerComponent worker)
    {
        worker.ActiveQuestion = null;
        OpenPurchaseModal();
        worker.StateMachine.ChangeState(worker.AssignedBlueprint != null ? new WorkingState(worker) : new IdleState(worker));
    }

    public void OnCloseDialog(WorkerComponent worker)
    {
        worker.ActiveQuestion = null;
        worker.StateMachine.ChangeState(worker.AssignedBlueprint != null ? new WorkingState(worker) : new IdleState(worker));
    }

    public void OnReplaceTooling(WorkerComponent worker)
    {
        worker.ActiveQuestion = null;
        int cost = 2500;
        if (Money >= cost)
        {
            Money -= cost;
            AddLog("Yeni kesici uçlar alındı. -2500₺");
        }
        else
        {
            AddLog("Yetersiz bakiye - takım değiştirilemedi!");
        }
        worker.StateMachine.ChangeState(worker.AssignedBlueprint != null ? new WorkingState(worker) : new IdleState(worker));
    }

    public void OnKeepTooling(WorkerComponent worker)
    {
        worker.ActiveQuestion = null;
        AddLog($"{worker.MasterName} eski uçla devam ediyor, hata riski arttı.");
        if (worker.AssignedBlueprint != null)
        {
            worker.AssignedBlueprint.Faulty = true;
        }
        worker.StateMachine.ChangeState(worker.AssignedBlueprint != null ? new WorkingState(worker) : new IdleState(worker));
    }

    public void ScheduleNotifications()
    {
        PendingNotifications.Clear();
        if (SelectedFactory == null) return;

        var pool = SelectedFactory.QuestionPool;
        if (pool.Count == 0) return;

        // Schedule 2-3 notifications today
        int count = 2 + Random.Shared.Next(2);

        for (int i = 0; i < count; i++)
        {
            int triggerHour = 9 + Random.Shared.Next(8); // 9 to 16
            int triggerMin = Random.Shared.Next(60);

            // Find a random worker who isn't Selo
            var workerCandidates = Masters.Where(w => w.MasterName != "Sevkiyatçı Selo").ToList();
            if (workerCandidates.Count == 0) continue;
            var w = workerCandidates[Random.Shared.Next(workerCandidates.Count)];

            bool isTech = Random.Shared.NextSingle() < 0.50f;
            if (isTech)
            {
                var randQ = pool[Random.Shared.Next(pool.Count)];
                PendingNotifications.Add(new PendingNotification
                {
                    Hour = triggerHour,
                    Minute = triggerMin,
                    Fired = false,
                    Type = "technical",
                    Worker = w,
                    Body = randQ.Body,
                    Actions = randQ.Actions.Select(act => new ActionTemplate(act.Label, act.Correct)).ToList()
                });
            }
            else
            {
                // Select a general question
                int qIdx = Random.Shared.Next(3);
                if (qIdx == 0)
                {
                    PendingNotifications.Add(new PendingNotification
                    {
                        Hour = triggerHour,
                        Minute = triggerMin,
                        Fired = false,
                        Type = "general",
                        Worker = w,
                        Body = "Şefim, elime kıymık/metal çapağı battı. 15 dakika revire gidip pansuman yaptırsam olur mu?",
                        Actions = new List<ActionTemplate>
                        {
                            new ActionTemplate("Tabii usta, hemen git (+3 moral)", true, () => OnAllowClinic(w)),
                            new ActionTemplate("Hafif sıyrık o, çalışmaya devam!", false, () => OnDenyClinic(w))
                        }
                    });
                }
                else if (qIdx == 1)
                {
                    PendingNotifications.Add(new PendingNotification
                    {
                        Hour = triggerHour,
                        Minute = triggerMin,
                        Fired = false,
                        Type = "general",
                        Worker = w,
                        Body = "Şefim, depoda malzeme stoklarımız az gözüküyor. Tedarik edelim mi?",
                        Actions = new List<ActionTemplate>
                        {
                            new ActionTemplate("Evet, malzeme satın al", true, () => OnOpenPurchase(w)),
                            new ActionTemplate("İdare ederiz şimdilik", false, () => OnCloseDialog(w))
                        }
                    });
                }
                else
                {
                    PendingNotifications.Add(new PendingNotification
                    {
                        Hour = triggerHour,
                        Minute = triggerMin,
                        Fired = false,
                        Type = "general",
                        Worker = w,
                        Body = "Şefim, bu parçanın takım uçları çok yıpranmış. Değiştirmezsek yüzey pürüzlülüğü artar.",
                        Actions = new List<ActionTemplate>
                        {
                            new ActionTemplate("Değiştir (2500₺)", true, () => OnReplaceTooling(w)),
                            new ActionTemplate("Bu parti bitsin, öyle", false, () => OnKeepTooling(w))
                        }
                    });
                }
            }
        }
    }

    public void CheckNotifications()
    {
        foreach (var n in PendingNotifications)
        {
            if (!n.Fired && (Hour > n.Hour || (Hour == n.Hour && Minute >= n.Minute)))
            {
                n.Fired = true;
                var w = n.Worker;
                // Ensure worker exists and has no active question
                if (w != null && Masters.Contains(w) && w.ActiveQuestion == null)
                {
                    int expHour = Hour;
                    int expMin = Minute + (n.Type == "technical" ? 45 : 60);
                    if (expMin >= 60)
                    {
                        expHour += expMin / 60;
                        expMin %= 60;
                    }

                    w.ActiveQuestion = new QuestionTemplate(n.Body, n.Actions);
                    w.ActiveQuestion.ExpiresAtHour = expHour;
                    w.ActiveQuestion.ExpiresAtMin = expMin;
                    AddLog($"📣 {w.MasterName} bir konuda fikrinizi soruyor! (Üzerine tıklayın)");
                }
            }
        }
    }

    public void SpawnTechnicalQuestion(WorkerComponent worker)
    {
        if (SelectedFactory == null || worker == null) return;
        var pool = SelectedFactory.QuestionPool;
        if (pool.Count == 0) return;

        var q = pool[Random.Shared.Next(pool.Count)];
        int expHour = Hour;
        int expMin = Minute + 30; // urgent during crunch time
        if (expMin >= 60)
        {
            expHour += expMin / 60;
            expMin %= 60;
        }

        worker.ActiveQuestion = new QuestionTemplate(
            q.Body,
            q.Actions.Select(act => new ActionTemplate(act.Label, act.Correct)).ToList()
        );
        worker.ActiveQuestion.ExpiresAtHour = expHour;
        worker.ActiveQuestion.ExpiresAtMin = expMin;
        AddLog($"📣 {worker.MasterName} acil bir teknik soru sordu! El kitabından değerleri kontrol edin.");
    }

    public void TriggerCrunchTime()
    {
        CrunchTime = true;
        CrunchTimer = 180;
        CrunchFails = 0;
        AddLog("🚨 ACİL ALARM! Yoğun çalışma (Crunch) başladı! Üretim hızı 2x, ancak teknik sorular peş peşe gelecektir!");
    }

    public void SelectFactory(string type)
    {
        FactoryTemplate template = null;
        if (FactoryResource != null)
        {
            template = FactoryResource.ToTemplate();
            SelectedFactoryType = FactoryResource.FactoryName ?? type;
        }
        else
        {
            if (!FactoryConfig.Templates.TryGetValue(type, out template))
            {
                Log.Warning($"Factory template {type} not found!");
                return;
            }
            SelectedFactoryType = type;
        }

        SelectedFactory = template;

        Day = 1;
        Hour = 8;
        Minute = 0;
        Money = 75000;
        Rating = 100;
        BossTrust = 0;
        CatTrust = 0;
        DogTrust = 0;
        CrunchTime = false;
        CrunchTimer = 0;
        CrunchFails = 0;
        CompletedOrdersCount = 0;

        // Reset upgrades & custom states
        PersonalBalance = 0;
        HomeUpgrades = new()
        {
            { "bed", false },
            { "tv", false },
            { "coffee", false },
            { "kitchen", false },
            { "pc", false }
        };
        PersonalVehicles = new()
        {
            { "blue_sedan", true },
            { "red_hatchback", false },
            { "yellow_suv", false },
            { "black_sport", false }
        };
        WorkstationUpgrades = new()
        {
            { "ws-lazer", 0 },
            { "ws-abkant", 0 },
            { "ws-dokuma", 0 },
            { "ws-firin", 0 },
            { "ws-lehim", 0 },
            { "ws-test", 0 },
            { "ws-boya", 0 },
            { "ws-montaj", 0 }
        };
        WorkerLevels.Clear();
        CoffeeMachineOwned = false;
        OrderSoftwareOwned = false;
        AutoLoaderOwned = false;
        MaxOrdersLimit = 3;
        OrdersCompletedToday = 0;
        DayEndedAndSlept = false;

        Inventory.Clear();
        foreach (var mat in SelectedFactory.Materials)
        {
            Inventory[mat] = SelectedFactory.StartInventory.GetValueOrDefault(mat, 10);
        }

        Logs.Clear();

        // Instantiate Workstations
        var existingStations = Scene.GetAllComponents<Workstation>().ToList();
        foreach (var ws in existingStations)
        {
            ws.GameObject.Destroy();
        }

        int index = 0;
        foreach (var kvp in SelectedFactory.Workstations)
        {
            var wsKey = kvp.Key;
            var wsData = kvp.Value;
            
            var wsGo = Scene.CreateObject();
            wsGo.Name = $"Workstation_{wsKey}";
            var comp = wsGo.Components.Create<Workstation>();
            comp.WorkstationId = wsKey;
            comp.RequiredSkill = wsData.RequiredSkill;
            comp.StationName = wsData.Name;
            
            int cols = 5;
            float spacingX = 240f;
            float spacingY = 160f;
            float startX = 140f;
            float startY = 160f;
            int col = index % cols;
            int row = index / cols;
            wsGo.WorldPosition = new Vector3(startX + col * spacingX, startY + row * spacingY, 0f);
            index++;
        }

        // Instantiate Workers
        var existingWorkers = Scene.GetAllComponents<WorkerComponent>().ToList();
        foreach (var w in existingWorkers)
        {
            w.GameObject.Destroy();
        }
        Masters.Clear();

        foreach (var mData in SelectedFactory.Masters)
        {
            var wGo = Scene.CreateObject();
            wGo.Name = $"Worker_{mData.Name}";
            var wComp = wGo.Components.Create<WorkerComponent>();
            wComp.MasterName = mData.Name;
            wComp.Hometown = mData.Hometown;
            wComp.Skill = mData.Skill;
            wComp.Trait = mData.Trait;
            wComp.Bg = mData.Bg;
            wComp.Morale = 80;
            wComp.Trust = 70;
            wComp.Warnings = 0;
            wComp.Status = "idle";
            wComp.Feuds = mData.Feuds != null ? mData.Feuds.ToList() : new();
            
            wGo.WorldPosition = new Vector3(640f + Random.Shared.Next(-100, 100), 480f + Random.Shared.Next(-30, 30), 0f);
            
            Masters.Add(wComp);
        }

        // Spawn starting orders
        Orders.Clear();
        for (int i = 0; i < 2; i++)
        {
            var t = SelectedFactory.OrderTemplates[i % SelectedFactory.OrderTemplates.Count];
            var order = new ActiveOrder
            {
                Id = $"Baslangic_{(i + 1)}",
                Desc = t.Desc,
                Due = t.Due + 1,
                Reward = t.Reward,
                Penalty = t.Penalty,
                Designed = true,
                RndDays = 0
            };

            foreach (var bp in t.Blueprints)
            {
                order.Blueprints.Add(new ActiveBlueprint
                {
                    Name = bp.Name,
                    Stages = bp.Stages.ToList(),
                    StageIndex = 0,
                    Need = bp.Need,
                    Dependencies = bp.Dependencies.ToList(),
                    AssignedWorkers = new(),
                    Done = false,
                    Faulty = false,
                    Progress = 0
                });
            }
            Orders.Add(order);
        }

        AddLog($"🏭 {SelectedFactory.Name} yönetimi devralındı!");
        AddLog("📋 Üretime hazır 2 başlangıç siparişi depoya eklendi.");

        ScheduleNotifications();

        Paused = false;
    }

    public void do_assign(string orderId, string bpName, string workerName)
    {
        var order = Orders.FirstOrDefault(o => o.Id == orderId);
        if (order == null) return;

        var bp = order.Blueprints.FirstOrDefault(b => b.Name == bpName);
        if (bp == null) return;

        var m = Masters.FirstOrDefault(x => x.MasterName == workerName);
        if (m == null) return;

        string reqSkill = bp.Stages[bp.StageIndex];

        // Verify raw materials at starting stage 0 and first worker assignment
        string neededMaterial = "";
        if (bp.StageIndex == 0 && bp.AssignedWorkers.Count == 0)
        {
            if (SelectedFactoryType == "radiator")
            {
                if (bpName == "Petek Core Üretimi") neededMaterial = "Petek Kalıp Şeridi";
                else if (bpName == "Kazan Sac Gövdesi") neededMaterial = "Alüminyum Rulo Sac";
                else if (bpName == "Radyatör Montaj & Bitiş") neededMaterial = "Alüminyum Döküm Kazan";
            }
            else if (SelectedFactoryType == "gearbox")
            {
                if (bpName == "Mil Komponenti") neededMaterial = "AISI 8620 Çelik";
                else if (bpName == "Helisel Dişli Çark") neededMaterial = "AISI 8620 Çelik";
                else if (bpName == "Şanzıman Montaj Hattı") neededMaterial = "Döküm Şanzıman Gövdesi";
            }
            else if (SelectedFactoryType == "armored")
            {
                if (bpName == "Alt V-Gövde Sacı") neededMaterial = "Mil-A-46100 Zırh Çeliği";
                else if (bpName == "Zırh Yan Paneller") neededMaterial = "Mil-A-46100 Zırh Çeliği";
                else if (bpName == "Gövde Kaynak & Montaj") neededMaterial = "Zırhlı Balistik Cam";
            }
        }

        if (!string.IsNullOrEmpty(neededMaterial))
        {
            int stock = Inventory.GetValueOrDefault(neededMaterial, 0);
            if (stock <= 0)
            {
                AddLog($"❌ Yetersiz malzeme! Depoda en az 1 adet \"{neededMaterial}\" bulunmalı.");
                return;
            }
            Inventory[neededMaterial] = stock - 1;
            AddLog($"📦 1x {neededMaterial} üretim için depodan çekildi.");
        }

        // Skill match verification
        if (m.Skill != reqSkill)
        {
            if (m.Trait == "İnatçı")
            {
                AddLog($"❌ {m.MasterName}: \"Bu benim işim değil şefim!\" Reddedildi.");
                return;
            }
            else if (m.Trait == "Yardımsever" || m.Trait == "Yardımcıev")
            {
                // Pass to idle worker with correct skill if available
                var correct = Masters.FirstOrDefault(w => w.Skill == reqSkill && w.Status == "idle");
                if (correct != null)
                {
                    assign_direct(bp, correct.MasterName);
                    AddLog($"{m.MasterName}: \"Bana verdin ama hayrına {correct.MasterName}'e pasladım.\"");
                    return;
                }
            }
            AddLog($"⚠️ {m.MasterName} uzmanlığı dışı işe başladı. Hata riski yüksek!");
            bp.Faulty = true;
        }
        else
        {
            AddLog($"{m.MasterName}: \"{bpName}\" üretimine başlıyorum şefim.");
        }

        assign_direct(bp, m.MasterName);
    }

    public void assign_direct(ActiveBlueprint bp, string workerName)
    {
        var m = Masters.FirstOrDefault(x => x.MasterName == workerName);
        if (m != null)
        {
            m.AssignedBlueprint = bp;
            m.StageIdx = bp.StageIndex;
            m.Status = "working";
            m.StateMachine.ChangeState(new WorkingState(m));
            if (!bp.AssignedWorkers.Contains(workerName))
            {
                bp.AssignedWorkers.Add(workerName);
            }
        }
    }

    public int GetMaxRating()
    {
        return HomeUpgrades.GetValueOrDefault("pc", false) ? 110 : 100;
    }

    public void ApplyHomeBonuses()
    {
        int moraleBonus = HomeUpgrades.GetValueOrDefault("tv", false) ? 5 : 0;
        int trustBonus = HomeUpgrades.GetValueOrDefault("bed", false) ? 5 : 0;
        int ratingBonus = HomeUpgrades.GetValueOrDefault("coffee", false) ? 5 : 0;
        int trustBossBonus = HomeUpgrades.GetValueOrDefault("kitchen", false) ? 1 : 0;

        if (moraleBonus > 0 || trustBonus > 0 || ratingBonus > 0 || trustBossBonus > 0)
        {
            int maxM = CoffeeMachineOwned ? 110 : 100;
            foreach (var m in Masters)
            {
                if (moraleBonus > 0) m.Morale = Math.Clamp(m.Morale + moraleBonus, 0, maxM);
                if (trustBonus > 0) m.Trust = Math.Clamp(m.Trust + trustBonus, 0, 100);
            }
            if (ratingBonus > 0) Rating = Math.Clamp(Rating + ratingBonus, 0, GetMaxRating());
            if (trustBossBonus > 0) BossTrust = Math.Clamp(BossTrust + trustBossBonus, -15, 10);

            AddLog("🏠 Ev geliştirmeleri güne zinde başlamanızı sağladı! Aktif bonuslar uygulandı.");
        }
    }

    public void StartNewDay()
    {
        // 1. Apply home upgrade starting bonuses
        ApplyHomeBonuses();

        AddLog("🛌 Evinizde uyudunuz ve yeni güne dinç başladınız...");

        // 2. Increment day
        Day++;
        Hour = 8;
        Minute = 0;
        OrdersCompletedToday = 0;

        // 3. 25% chance of starting in crunch time
        if (Random.Shared.NextSingle() < 0.25f)
        {
            TriggerCrunchTime();
        }
        else
        {
            CrunchTime = false;
        }

        ScheduleNotifications();

        // Trigger weekly narrative event at the start of Day 8, 15, 22...
        if (Day > 1 && (Day - 1) % 7 == 0)
        {
            TriggerWeeklyNarrativeEvent();
        }

        DayEndedAndSlept = true;
        Paused = false;
    }

    public void TriggerWeeklyNarrativeEvent()
    {
        var candidates = Masters.Where(c => c.MasterName != "Sevkiyatçı Selo" && c.EventStatus == "" && c.ActiveQuestion == null).ToList();
        if (candidates.Count == 0) return;

        var w = candidates[Random.Shared.Next(candidates.Count)];
        int eventType = Random.Shared.Next(5);

        switch (eventType)
        {
            case 0:
                w.ActiveQuestion = new QuestionTemplate(
                    "Şefim, müjde! Bugün sabaha karşı bir bebeğimiz dünyaya geldi. Eşimin yanında olmam gerekiyor, 3 gün babalık izni alabilir miyim?",
                    new List<ActionTemplate>
                    {
                        new("Tebrikler usta! İzinli sayılırsın (3 gün Maaşlı, Moral +15, Güven +10)", true, () => OnPaternityLeaveApprove(w)),
                        new("Usta işler çok yoğun, çalışmalısın (Moral -20, Güven -15, %70 Hız)", false, () => OnPaternityLeaveDeny(w))
                    }
                );
                AddLog($"👶 {w.MasterName} babalık izni talep ediyor! (Görüşmek için üzerine tıklayın)");
                break;
            case 1:
                w.ActiveQuestion = new QuestionTemplate(
                    "Şefim, dün akşam eve giderken ufak bir kaza geçirdim, bileğimi burktum. Çalışabilirim ama hızım yarıya düşer. Ya da 2 gün istirahat etmemi önerir misiniz?",
                    new List<ActionTemplate>
                    {
                        new("Geçmiş olsun usta, revire geç ve dinlen (2 gün, Moral +10, Güven +5)", true, () => OnAccidentRevir(w)),
                        new("Sana ihtiyacımız var, hafif tempoda devam et (2 gün %50 Hız, Güven -5)", false, () => OnAccidentWork(w))
                    }
                );
                AddLog($"🩹 {w.MasterName} bir kaza geçirmiş! (Görüşmek için üzerine tıklayın)");
                break;
            case 2:
                w.ActiveQuestion = new QuestionTemplate(
                    "Şefim, ailemden biri aniden hastalandı, hastaneye götürmem ve refakat etmem gerekiyor. 2 gün izin rica edebilir miyim?",
                    new List<ActionTemplate>
                    {
                        new("Tabii ki usta, ailen her şeyden önemli (2 gün İzin, Moral +12, Güven +8)", true, () => OnFamilySickLeave(w)),
                        new("Sen kal çalış, biz eve özel bakıcı gönderelim (1500₺, %90 Hız, Güven +12)", true, () => OnFamilySickHelp(w)),
                        new("Şu an izin veremem, işin başında durmalısın (Moral -15, Güven -10, %60 Hız)", false, () => OnFamilySickDeny(w))
                    }
                );
                AddLog($"🏥 {w.MasterName} ailevi bir acil durum bildiriyor! (Görüşmek için üzerine tıklayın)");
                break;
            case 3:
                w.ActiveQuestion = new QuestionTemplate(
                    "Şefim, organize sanayideki komşu atölyenin ustası rahatsızlanmış. 1 günlüğüne oradaki darboğazı çözmek için benden destek istiyorlar. Gideyim mi? Günlük 2000₺ kasa geliri sağlayacaklar.",
                    new List<ActionTemplate>
                    {
                        new("Git usta, komşumuza yardım edelim (+2000₺ Kasa, 1 gün yok)", true, () => OnOffsiteApprove(w)),
                        new("İşimiz başımızdan aşkın, gidemezsin (Güven -2)", false, () => OnOffsiteDeny(w))
                    }
                );
                AddLog($"🚚 {w.MasterName} komşu atölyeden destek talebi getirdi! (Görüşmek için üzerine tıklayın)");
                break;
            case 4:
                w.ActiveQuestion = new QuestionTemplate(
                    "Şefim, belediyenin düzenlediği 2 günlük yeni nesil sanayi ve üretim teknolojileri semineri var. Katılmamı onaylar mısınız? Hızım kalıcı olarak artabilir.",
                    new List<ActionTemplate>
                    {
                        new("Onaylıyorum, kendini geliştir (1000₺ Ücret, 2 gün yok, Kalıcı +15% Hız)", true, () => OnTrainingApprove(w)),
                        new("Fabrikada yapacak iş çok, gidemezsin (Moral -5)", false, () => OnTrainingDeny(w))
                    }
                );
                AddLog($"📚 {w.MasterName} eğitim seminerine katılmak istiyor! (Görüşmek için üzerine tıklayın)");
                break;
        }
    }

    public void OnPaternityLeaveApprove(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.EventStatus = "leave";
        w.EventDaysRemaining = 3;
        w.SpeedModifier = 0.0f;
        w.Status = "leave";
        int maxM = CoffeeMachineOwned ? 110 : 100;
        w.Morale = Math.Clamp(w.Morale + 15, 0, maxM);
        w.Trust = Math.Clamp(w.Trust + 10, 0, 100);
        w.EventDescription = "Babalık izninde (3 gün)";
        w.StateMachine.ChangeState(new EventState(w));
        AddLog($"👶 {w.MasterName} babalık iznine ayrıldı (3 gün).");
    }

    public void OnPaternityLeaveDeny(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.EventStatus = "distracted";
        w.EventDaysRemaining = 3;
        w.SpeedModifier = 0.7f;
        int maxM = CoffeeMachineOwned ? 110 : 100;
        w.Morale = Math.Clamp(w.Morale - 20, 0, maxM);
        w.Trust = Math.Clamp(w.Trust - 15, 0, 100);
        w.EventDescription = "Uykusuz ve kafası dağınık (%70 Hız, 3 gün)";
        w.ReturnToWorkOrIdle();
        AddLog($"⚠️ {w.MasterName} babalık izni alamadı. Uykusuz ve moralsiz çalışıyor (%70 Hız).");
    }

    public void OnAccidentRevir(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.EventStatus = "injured";
        w.EventDaysRemaining = 2;
        w.SpeedModifier = 0.0f;
        w.Status = "injured";
        int maxM = CoffeeMachineOwned ? 110 : 100;
        w.Morale = Math.Clamp(w.Morale + 10, 0, maxM);
        w.Trust = Math.Clamp(w.Trust + 5, 0, 100);
        w.EventDescription = "Revirde istirahatte (2 gün)";
        w.StateMachine.ChangeState(new EventState(w));
        AddLog($"🩹 {w.MasterName} revirde dinlenmeye gönderildi (2 gün).");
    }

    public void OnAccidentWork(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.EventStatus = "injured_working";
        w.EventDaysRemaining = 2;
        w.SpeedModifier = 0.5f;
        w.Trust = Math.Clamp(w.Trust - 5, 0, 100);
        w.EventDescription = "Burkulmuş bilekle çalışıyor (%50 Hız, 2 gün)";
        w.ReturnToWorkOrIdle();
        AddLog($"⚠️ {w.MasterName} burkulmuş bilekle çalışmaya devam ediyor (%50 Hız).");
    }

    public void OnFamilySickLeave(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.EventStatus = "leave";
        w.EventDaysRemaining = 2;
        w.SpeedModifier = 0.0f;
        w.Status = "leave";
        int maxM = CoffeeMachineOwned ? 110 : 100;
        w.Morale = Math.Clamp(w.Morale + 12, 0, maxM);
        w.Trust = Math.Clamp(w.Trust + 8, 0, 100);
        w.EventDescription = "Aile refakat izninde (2 gün)";
        w.StateMachine.ChangeState(new EventState(w));
        AddLog($"🏥 {w.MasterName} aile refakat iznine ayrıldı (2 gün).");
    }

    public void OnFamilySickHelp(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        int cost = 1500;
        if (Money >= cost)
        {
            Money -= cost;
            w.EventStatus = "homecare";
            w.EventDaysRemaining = 2;
            w.SpeedModifier = 0.9f;
            int maxM = CoffeeMachineOwned ? 110 : 100;
            w.Morale = Math.Clamp(w.Morale + 5, 0, maxM);
            w.Trust = Math.Clamp(w.Trust + 12, 0, 100);
            w.EventDescription = "Aile bakıcısı destekli çalışıyor (%90 Hız, 2 gün)";
            w.ReturnToWorkOrIdle();
            AddLog($"💖 {w.MasterName} ailesine evde bakım desteği sağlandı (-1.500₺). Usta yüksek moralle çalışıyor (%90 Hız).");
        }
        else
        {
            AddLog("Yetersiz bakiye - aileye nakdi yardım yapılamadı!");
            OnFamilySickDeny(w);
        }
    }

    public void OnFamilySickDeny(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.EventStatus = "worried";
        w.EventDaysRemaining = 2;
        w.SpeedModifier = 0.6f;
        int maxM = CoffeeMachineOwned ? 110 : 100;
        w.Morale = Math.Clamp(w.Morale - 15, 0, maxM);
        w.Trust = Math.Clamp(w.Trust - 10, 0, 100);
        w.EventDescription = "Ailesi için endişeli (%60 Hız, 2 gün)";
        w.ReturnToWorkOrIdle();
        AddLog($"⚠️ {w.MasterName} izin talebi reddedildi. Ailesi için endişeli ve yavaş çalışıyor (%60 Hız).");
    }

    public void OnOffsiteApprove(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.EventStatus = "offsite";
        w.EventDaysRemaining = 1;
        w.SpeedModifier = 0.0f;
        w.Status = "offsite";
        w.EventDescription = "Komşu atölyede geçici görevde (1 gün)";
        w.StateMachine.ChangeState(new EventState(w));
        Money += 2000;
        AddLog($"🚚 {w.MasterName} komşu atölyeye desteğe gönderildi. Kasa +2.000₺");
    }

    public void OnOffsiteDeny(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.Trust = Math.Clamp(w.Trust - 2, 0, 100);
        w.ReturnToWorkOrIdle();
        AddLog($"⚠️ {w.MasterName} komşu atölyeye gönderilmedi.");
    }

    public void OnTrainingApprove(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        w.EventStatus = "training";
        w.EventDaysRemaining = 2;
        w.SpeedModifier = 0.0f;
        w.Status = "leave";
        w.EventDescription = "Seminer eğitiminde (2 gün)";
        w.StateMachine.ChangeState(new EventState(w));
        Money -= 1000;
        AddLog($"📚 {w.MasterName} eğitim seminerine gönderildi. Kasa -1.000₺");
    }

    public void OnTrainingDeny(WorkerComponent w)
    {
        w.ActiveQuestion = null;
        int maxM = CoffeeMachineOwned ? 110 : 100;
        w.Morale = Math.Clamp(w.Morale - 5, 0, maxM);
        w.ReturnToWorkOrIdle();
        AddLog($"⚠️ {w.MasterName} seminer talebi reddedildi.");
    }
}
