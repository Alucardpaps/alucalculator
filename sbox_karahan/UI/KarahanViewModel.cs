using System;
using System.Collections.Generic;
using System.Linq;
using Sandbox;
using Karahan.Factory;
using Karahan.Worker;

namespace Karahan.UI;

public class KarahanViewModel
{
    private static KarahanViewModel _instance;
    public static KarahanViewModel Instance => _instance ??= new KarahanViewModel();

    // Raw game access properties
    private KarahanGame Game => KarahanGame.Current;

    public int Day => Game?.Day ?? 1;
    public int Hour => Game?.Hour ?? 8;
    public int Minute => Game?.Minute ?? 0;
    public string TimeFormatted => $"{Hour:D2}:{Minute:D2}";
    
    public int Money => Game?.Money ?? 0;
    public int Rating => Game?.Rating ?? 100;
    public int BossTrust => Game?.BossTrust ?? 0;
    public string BossTrustClass => BossTrust < 0 ? "danger" : BossTrust > 5 ? "success" : "warning";

    public bool CrunchTime => Game?.CrunchTime ?? false;
    public int CrunchTimer => Game?.CrunchTimer ?? 0;
    public int CrunchFails => Game?.CrunchFails ?? 0;

    public FactoryTemplate SelectedFactory => Game?.SelectedFactory;
    public List<WorkerComponent> Masters => Game?.Masters ?? new List<WorkerComponent>();
    public List<ActiveOrder> Orders => Game?.Orders ?? new List<ActiveOrder>();
    public List<AnimalItem> Animals => Game?.Animals ?? new List<AnimalItem>();
    public List<PreyItem> Preys => Game?.Preys ?? new List<PreyItem>();
    public List<string> Logs => Game?.Logs ?? new List<string>();
    public Dictionary<string, int> Inventory => Game?.Inventory ?? new Dictionary<string, int>();

    // Parity State Variables
    public int PersonalBalance => Game?.PersonalBalance ?? 0;
    public string CurrentZone => Game?.CurrentZone ?? "factory";
    
    public void SetZone(string zone)
    {
        if (Game != null) Game.CurrentZone = zone;
    }
    public Dictionary<string, bool> HomeUpgrades => Game?.HomeUpgrades ?? new Dictionary<string, bool>();
    public Dictionary<string, bool> PersonalVehicles => Game?.PersonalVehicles ?? new Dictionary<string, bool>();
    public Dictionary<string, int> WorkstationUpgrades => Game?.WorkstationUpgrades ?? new Dictionary<string, int>();
    public Dictionary<string, int> WorkerLevels => Game?.WorkerLevels ?? new Dictionary<string, int>();
    public bool CoffeeMachineOwned => Game?.CoffeeMachineOwned ?? false;
    public bool OrderSoftwareOwned => Game?.OrderSoftwareOwned ?? false;
    public bool AutoLoaderOwned => Game?.AutoLoaderOwned ?? false;
    public int MaxOrdersLimit => Game?.MaxOrdersLimit ?? 3;
    public int OrdersCompletedToday => Game?.OrdersCompletedToday ?? 0;
    public bool DayEndedAndSlept => Game?.DayEndedAndSlept ?? false;

    public string FactoryName => SelectedFactory?.Name ?? "Fabrika Seçilmedi";
    public string FactoryBadge => SelectedFactory?.Badge ?? "—";
    public string FactoryBadgeColor => SelectedFactory?.BadgeColor ?? "#666";

    /// <summary>
    /// Commands the UI to show the worker's chat modal.
    /// </summary>
    public void SelectWorker(WorkerComponent worker, Scene scene)
    {
        if (worker == null || scene == null) return;
        var chatModal = scene.GetAllComponents<ChatModal>().FirstOrDefault();
        chatModal?.Show(worker);
    }

    /// <summary>
    /// Assigns a worker to a specific blueprint stage.
    /// </summary>
    public void AssignWorker(string orderId, string bpName, string workerName)
    {
        if (Game == null) return;
        Game.do_assign(orderId, bpName, workerName);
    }

    /// <summary>
    /// Purchases a workstation level upgrade (Kasa balance).
    /// </summary>
    public bool BuyWorkstationUpgrade(string wsId, int cost)
    {
        if (Game == null || Game.Money < cost) return false;

        Game.Money -= cost;
        int currentLvl = Game.WorkstationUpgrades.GetValueOrDefault(wsId, 0);
        Game.WorkstationUpgrades[wsId] = currentLvl + 1;
        var wsName = Game.SelectedFactory?.Workstations.GetValueOrDefault(wsId)?.Name ?? wsId;
        Game.AddLog($"🔧 {wsName} tezgahı Seviye {currentLvl + 1}'e yükseltildi! (-{cost:N0} ₺)");
        return true;
    }

    /// <summary>
    /// Trains a worker to upgrade their level (Kasa balance).
    /// </summary>
    public bool TrainWorker(WorkerComponent worker, int cost)
    {
        if (Game == null || worker == null || Game.Money < cost) return false;

        Game.Money -= cost;
        int currentLvl = Game.WorkerLevels.GetValueOrDefault(worker.MasterName, 1);
        Game.WorkerLevels[worker.MasterName] = currentLvl + 1;
        
        int maxMorale = Game.CoffeeMachineOwned ? 110 : 100;
        worker.Morale = Math.Min(maxMorale, worker.Morale + 10);
        Game.AddLog($"🎓 {worker.MasterName} mesleki eğitime katıldı ve Seviye {currentLvl + 1} oldu! (-{cost:N0} ₺)");
        return true;
    }

    /// <summary>
    /// Purchases a factory boost upgrade (Kasa balance).
    /// </summary>
    public bool BuyFactoryBoost(string boostId, int cost)
    {
        if (Game == null || Game.Money < cost) return false;

        Game.Money -= cost;
        if (boostId == "coffee")
        {
            Game.CoffeeMachineOwned = true;
            foreach (var w in Game.Masters)
            {
                int maxMorale = Game.CoffeeMachineOwned ? 110 : 100;
                w.Morale = Math.Clamp(w.Morale + 10, 0, maxMorale);
            }
            Game.AddLog($"🚀 Endüstriyel Kahve Makinesi satın alındı! Usta morali arttı. (-{cost:N0} ₺)");
        }
        else if (boostId == "software")
        {
            Game.OrderSoftwareOwned = true;
            Game.AddLog($"🚀 Gelişmiş Sipariş ve ERP Yazılımı satın alındı! Sipariş kazançları kalıcı olarak +%10 arttı. (-{cost:N0} ₺)");
        }
        else if (boostId == "loader")
        {
            Game.AutoLoaderOwned = true;
            Game.AddLog($"🚀 Otomatik Yükleme Rampası satın alındı! Yükleme süreleri kısaldı. (-{cost:N0} ₺)");
        }
        return true;
    }

    /// <summary>
    /// Purchases a home upgrade (Kişisel Bakiye balance).
    /// </summary>
    public bool BuyHomeUpgrade(string upgradeKey, int cost)
    {
        if (Game == null || Game.PersonalBalance < cost) return false;

        Game.PersonalBalance -= cost;
        Game.HomeUpgrades[upgradeKey] = true;
        
        string name = upgradeKey switch
        {
            "bed" => "Rahat Yatak",
            "tv" => "Akıllı TV",
            "coffee" => "Home Espresso Makinesi",
            "kitchen" => "Modern Mutfak",
            "pc" => "Hobi Bilgisayarı",
            _ => "Geliştirme"
        };
        Game.AddLog($"🏠 Evinizi geliştirdiniz: {name} satın alındı! (-{cost:N0} ₺)");
        if (upgradeKey == "pc")
        {
            Game.AddLog($"🎮 Hobi Bilgisayarı sayesinde maksimum itibar limiti {Game.GetMaxRating()} seviyesine yükseldi!");
        }
        return true;
    }

    /// <summary>
    /// Purchases a personal vehicle (Kişisel Bakiye balance).
    /// </summary>
    public bool BuyPersonalVehicle(string vehicleKey, int cost)
    {
        if (Game == null || Game.PersonalBalance < cost) return false;

        Game.PersonalBalance -= cost;
        Game.PersonalVehicles[vehicleKey] = true;
        
        string name = vehicleKey switch
        {
            "blue_sedan" => "Kişisel Sedan (Mavi)",
            "red_hatchback" => "Hızlı Hatchback (Kırmızı)",
            "yellow_suv" => "Heybetli SUV (Sarı)",
            "black_sport" => "Spor Araba (Siyah)",
            _ => "Araç"
        };
        Game.AddLog($"🚗 Yeni araç satın aldınız: {name}! Kasa: -{cost:N0} ₺");
        return true;
    }

    /// <summary>
    /// Sleeps and advances to the next day.
    /// </summary>
    public void SleepAndStartNewDay()
    {
        if (Game == null) return;
        Game.StartNewDay();
    }

    /// <summary>
    /// Processes a technical or general question answer.
    /// </summary>
    public void AnswerQuestion(WorkerComponent worker, ActionTemplate action)
    {
        if (worker == null || action == null || Game == null) return;

        if (action.Correct)
        {
            Game.AddLog($"✅ {worker.MasterName}: \"Tamamdır şefim, doğru değer!\"");
            worker.Morale = Math.Min(Game.CoffeeMachineOwned ? 110 : 100, worker.Morale + 12);
            worker.Trust = Math.Min(100, worker.Trust + 6);
            Game.BossTrust = Math.Min(10, Game.BossTrust + 1);
        }
        else
        {
            Game.AddLog($"❌ Hatalı talimat! {worker.MasterName} yanlış teknik işlem yaptı!");
            worker.Morale = Math.Max(0, worker.Morale - 18);
            worker.Trust = Math.Max(0, worker.Trust - 12);
            if (worker.AssignedBlueprint != null) worker.AssignedBlueprint.Faulty = true;
            Game.BossTrust = Math.Max(-15, Game.BossTrust - 1);
            if (Game.CrunchTime) Game.CrunchFails++;
        }

        action.Callback?.Invoke();
        worker.ActiveQuestion = null;
    }

    /// <summary>
    /// Awards a morale/trust bonus to a worker.
    /// </summary>
    public bool GiveBonus(WorkerComponent worker)
    {
        if (worker == null || Game == null || Game.Money < 500) return false;

        Game.Money -= 500;
        int maxM = Game.CoffeeMachineOwned ? 110 : 100;
        worker.Morale = Math.Min(maxM, worker.Morale + 20);
        worker.Trust = Math.Min(100, worker.Trust + 10);
        Game.AddLog($"💰 {worker.MasterName}'e 500₺ prim verildi. Moral ve güven arttı!");
        return true;
    }

    /// <summary>
    /// Warns a worker for misconduct.
    /// </summary>
    public void GiveWarning(WorkerComponent worker, Scene scene)
    {
        if (worker == null || Game == null) return;

        worker.Warnings++;
        worker.Morale = Math.Max(0, worker.Morale - 25);
        worker.Trust = Math.Max(0, worker.Trust - 15);
        Game.AddLog($"⚠️ {worker.MasterName}'e yazılı uyarı verildi! ({worker.Warnings}/3)");

        if (worker.Warnings >= 3)
        {
            Game.Masters.Remove(worker);
            Game.AddLog($"🚪 {worker.MasterName} 3 uyarı hakkını doldurdu ve işten çıkarıldı!");
            
            // Close chat modal if it belongs to this worker
            if (scene != null)
            {
                var chatModal = scene.GetAllComponents<ChatModal>().FirstOrDefault();
                if (chatModal != null && chatModal.SelectedWorker == worker)
                {
                    chatModal.IsVisible = false;
                    chatModal.SelectedWorker = null;
                }
            }
        }
    }

    /// <summary>
    /// Purchases inventory materials.
    /// </summary>
    public bool BuyMaterial(string material, int cost, int amount)
    {
        if (Game == null || Game.Money < cost) return false;

        Game.Money -= cost;
        if (!Game.Inventory.ContainsKey(material))
        {
            Game.Inventory[material] = 0;
        }
        Game.Inventory[material] += amount;
        Game.AddLog($"🛒 {amount} adet {material} satın alındı. Kasa -{cost:N0} ₺");
        return true;
    }

    /// <summary>
    /// Cleans animal prey/debris to restore hygiene.
    /// </summary>
    public void CleanPrey(PreyItem prey)
    {
        if (Game == null || prey == null) return;

        Game.Preys.Remove(prey);
        string label = prey.Type == "mouse" ? "fare" : "kuş";
        Game.AddLog($"🧹 {label} leşi temizlendi. Hijyen sorunu çözüldü.");
    }
}
