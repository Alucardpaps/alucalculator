using System.Collections.Generic;

namespace Karahan.Factory;

public record MasterTemplate(
    string Name,
    string Hometown,
    string Skill,
    string Trait,
    string Bg,
    List<string> Feuds
);

public record WorkstationTemplate(
    string Name,
    string Icon,
    string RequiredSkill
);

public class ActionTemplate
{
    public string Label { get; set; }
    public bool Correct { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public System.Action Callback { get; set; }

    public ActionTemplate() {}

    public ActionTemplate(string label, bool correct, System.Action callback = null)
    {
        Label = label;
        Correct = correct;
        Callback = callback;
    }
}

public class QuestionTemplate
{
    public string Body { get; set; }
    public List<ActionTemplate> Actions { get; set; } = new();
    public int ExpiresAtHour { get; set; }
    public int ExpiresAtMin { get; set; }

    public QuestionTemplate() {}

    public QuestionTemplate(string body, List<ActionTemplate> actions)
    {
        Body = body;
        Actions = actions;
    }
}

public record BlueprintTemplate(
    string Name,
    List<string> Stages,
    int Need,
    List<string> Dependencies
);

public record OrderTemplate(
    string Desc,
    int Due,
    int Reward,
    int Penalty,
    int RndDays,
    List<BlueprintTemplate> Blueprints
);

public class FactoryTemplate
{
    public string Name { get; set; }
    public string Badge { get; set; }
    public string BadgeColor { get; set; }
    public List<string> Materials { get; set; } = new();
    public Dictionary<string, int> MatCosts { get; set; } = new();
    public Dictionary<string, int> StartInventory { get; set; } = new();
    public Dictionary<string, WorkstationTemplate> Workstations { get; set; } = new();
    public List<MasterTemplate> Masters { get; set; } = new();
    public List<QuestionTemplate> QuestionPool { get; set; } = new();
    public List<OrderTemplate> OrderTemplates { get; set; } = new();
    public string Handbook { get; set; }
}

public static class FactoryConfig
{
    public static readonly Dictionary<string, FactoryTemplate> Templates = new()
    {
        {
            "radiator", new FactoryTemplate
            {
                Name = "Alüminyum Radyatör Fabrikası",
                Badge = "Hassas Lehimleme",
                BadgeColor = "#3b82f6",
                Materials = new() { "Alüminyum Rulo Sac", "Alüminyum Döküm Kazan", "Sert Lehim Dekapajı", "Petek Kalıp Şeridi", "Fan & Braket Kiti", "Silikon Hortum Seti" },
                MatCosts = new() { { "Alüminyum Rulo Sac", 4000 }, { "Alüminyum Döküm Kazan", 3000 }, { "Sert Lehim Dekapajı", 500 }, { "Petek Kalıp Şeridi", 1500 }, { "Fan & Braket Kiti", 2500 }, { "Silikon Hortum Seti", 1000 } },
                StartInventory = new() { { "Alüminyum Rulo Sac", 10 }, { "Alüminyum Döküm Kazan", 8 }, { "Sert Lehim Dekapajı", 15 }, { "Petek Kalıp Şeridi", 12 }, { "Fan & Braket Kiti", 6 }, { "Silikon Hortum Seti", 8 } },
                Workstations = new()
                {
                    { "ws-lazer", new("Lazer Kesim & Sac", "✂️", "Sac Kesim") },
                    { "ws-abkant", new("Abkant Büküm İstasyonu", "📐", "Büküm") },
                    { "ws-arge", new("Ar-Ge Tasarım Ofisi", "✏️", "Ar-Ge") },
                    { "ws-dokuma", new("Petek Kalıplama & Dokuma", "🕸️", "Petek Dokuma") },
                    { "ws-firin", new("CAB Lehimleme Fırını", "♨️", "Fırınlama") },
                    { "ws-ik", new("İnsan Kaynakları Ofisi", "💼", "İdari") },
                    { "ws-lehim", new("Kazan Sert Lehimleme", "🔥", "Sert Lehim") },
                    { "ws-test", new("Sızdırmazlık Test İstasyonu", "🧪", "Sızdırmazlık") },
                    { "ws-ressam-wc", new("Teknik Ressam WC", "🚾🎨", "RessamWC") },
                    { "ws-boya", new("Toz Boya Kabini", "🎨", "Boya") },
                    { "ws-montaj", new("Montaj & Son Kontrol", "🔧", "Montaj") },
                    { "ws-depo", new("Depo / Ambar", "📦", "Shipment") },
                    { "ws-cay", new("Çay Ocağı / Dinlenme", "☕", "Break") },
                    { "ws-wc", new("Genel WC / Lavabolar", "🚾", "Break") },
                    { "ws-revir", new("Sağlık Odası (Revir)", "🏥", "Medical") }
                },
                Masters = new()
                {
                    new("Usta Ahmet", "Trabzon", "Sac Kesim", "İnatçı", "30 yıllık giyotin sac makasçısı.", new() { "Usta Kadir" }),
                    new("Usta Kadir", "Adana", "Büküm", "Girişken", "CNC Abkant operatörü.", new() { "Usta Ahmet" }),
                    new("Usta Gizem", "İzmir", "Ar-Ge", "Yardımcıev", "Genç makine ressamı.", new()),
                    new("Usta Hasan", "Konya", "Petek Dokuma", "Asosyal", "Eski kalıp ustası.", new()),
                    new("Usta Selim", "Sivas", "Fırınlama", "İnatçı", "CAB lehim fırını uzmanı.", new() { "Usta Rıza" }),
                    new("Usta Rıza", "Amasya", "Sert Lehim", "Yardımcıev", "Oksi-asetilen şalomasıyla pirinç.", new() { "Usta Selim" }),
                    new("Usta Can", "Ankara", "Sızdırmazlık", "Girişken", "Su altı kabarcık dedektörü şefi.", new()),
                    new("Usta Orhan", "Bursa", "Boya", "Asosyal", "Kromat kaplama ve boyacı.", new()),
                    new("Usta Murat", "Kayseri", "Montaj", "Girişken", "Radyatör toplama ve braket vidalama.", new()),
                    new("Sevkiyatçı Selo", "Kırşehir", "Shipment", "Yardımcıev", "Malzeme taşıyıcısı ve dedikodu şefi.", new())
                },
                QuestionPool = new()
                {
                    new("CAB lehim fırını flux kaplama yükünü metrekare başına kaç gram ayarlayalım?", new() { new("3 - 5 g/m² (İdeal Oksit Çözme)", true), new("10 - 15 g/m²", false) }),
                    new("CAB lehimleme fırınındaki oksijen limitini kaç ppm altında tutalım?", new() { new("Oksijen seviyesi < 10 ppm olmalı", true), new("Oksijen seviyesi < 100 ppm", false) })
                },
                OrderTemplates = new()
                {
                    new("Ağır Hizmet Kamyon Radyatörü", 5, 95000, 25000, 1, new()
                    {
                        new("Petek Core Üretimi", new() { "Petek Dokuma", "Fırınlama" }, 2, new()),
                        new("Kazan Sac Gövdesi", new() { "Sac Kesim", "Büküm" }, 1, new()),
                        new("Radyatör Montaj & Bitiş", new() { "Sert Lehim", "Sızdırmazlık", "Boya", "Montaj" }, 2, new() { "Petek Core Üretimi", "Kazan Sac Gövdesi" })
                    })
                }
            }
        },
        {
            "gearbox", new FactoryTemplate
            {
                Name = "Dişli & Şanzıman Fabrikası",
                Badge = "Hassas Talaşlı İmalat",
                BadgeColor = "#ec4899",
                Materials = new() { "AISI 8620 Çelik", "Döküm Şanzıman Gövdesi", "Hassas Rulman Seti", "Keçe & Sızdırmazlık Kiti", "Şanzıman Yağı ATF" },
                MatCosts = new() { { "AISI 8620 Çelik", 5000 }, { "Döküm Şanzıman Gövdesi", 8000 }, { "Hassas Rulman Seti", 3500 }, { "Keçe & Sızdırmazlık Kiti", 1200 }, { "Şanzıman Yağı ATF", 800 } },
                StartInventory = new() { { "AISI 8620 Çelik", 12 }, { "Döküm Şanzıman Gövdesi", 6 }, { "Hassas Rulman Seti", 10 }, { "Keçe & Sızdırmazlık Kiti", 14 }, { "Şanzıman Yağı ATF", 12 } },
                Workstations = new()
                {
                    { "ws-lazer", new("Testere & Sac Kesim", "⚙️", "Testere Kesim") },
                    { "ws-abkant", new("CNC Torna İstasyonu", "🌀", "Tornalama") },
                    { "ws-arge", new("Tasarım & Projelendirme", "✏️", "Ar-Ge") },
                    { "ws-dokuma", new("Dişli Azdırma Tezgahı", "🎡", "Azdırma") },
                    { "ws-firin", new("Sementasyon Isıl İşlem", "🔥", "Isıl İşlem") },
                    { "ws-ik", new("İnsan Kaynakları Ofisi", "💼", "İdari") },
                    { "ws-lehim", new("Silindirik Taşlama", "💎", "Taşlama") },
                    { "ws-test", new("Dönüş & Sızdırmazlık Testi", "🧪", "Test") },
                    { "ws-ressam-wc", new("Teknik Ressam WC", "🚾🎨", "RessamWC") },
                    { "ws-boya", new("Astar & Koruyucu Boya", "🎨", "Boya") },
                    { "ws-montaj", new("Şanzıman Montaj Hattı", "🔧", "Montaj") }
                },
                Masters = new()
                {
                    new("Usta Kemal", "Karabük", "Testere Kesim", "İnatçı", "Çelik çubuk kesim ustası.", new() { "Usta Hasan" }),
                    new("Usta Hasan", "Kırıkkale", "Tornalama", "Asosyal", "CNC torna şefi.", new() { "Usta Kemal" }),
                    new("Usta Can", "Ankara", "Ar-Ge", "Yardımcıev", "Evolvent dişli profili analisti.", new()),
                    new("Usta Ahmet", "Tokat", "Azdırma", "Girişken", "Dişli azdırma tezgahı emektarı.", new())
                },
                QuestionPool = new()
                {
                    new("AISI 8620 çeliğinden dişliler için sementasyon sıcaklığını kaç derece ayarlayalım?", new() { new("900 - 930 °C (Karbürleme Aralığı)", true), new("550 - 600 °C", false) })
                },
                OrderTemplates = new()
                {
                    new("Helisel Dişli Hız Düşürücü Redüktör", 6, 135000, 30000, 2, new()
                    {
                        new("Mil Komponenti", new() { "Testere Kesim", "Tornalama", "Isıl İşlem", "Taşlama" }, 1, new()),
                        new("Helisel Dişli Çark", new() { "Testere Kesim", "Tornalama", "Azdırma", "Isıl İşlem", "Taşlama" }, 2, new()),
                        new("Şanzıman Montaj Hattı", new() { "Montaj", "Test", "Boya" }, 2, new() { "Mil Komponenti", "Helisel Dişli Çark" })
                    })
                }
            }
        },
        {
            "armored", new FactoryTemplate
            {
                Name = "Zırhlı Gövde & Kaynak Fabrikası",
                Badge = "Savunma Sanayi Ağır İmalat",
                BadgeColor = "#ef4444",
                Materials = new() { "Mil-A-46100 Zırh Çeliği", "ER80S-D2 Kaynak Teli", "Karışım Koruyucu Gaz", "Zırhlı Balistik Cam", "Taktik İletişim Kiti", "Epoksi Askeri Astar" },
                MatCosts = new() { { "Mil-A-46100 Zırh Çeliği", 12000 }, { "ER80S-D2 Kaynak Teli", 2000 }, { "Karışım Koruyucu Gaz", 1500 }, { "Zırhlı Balistik Cam", 10000 }, { "Taktik İletişim Kiti", 25000 }, { "Epoksi Askeri Astar", 3000 } },
                StartInventory = new() { { "Mil-A-46100 Zırh Çeliği", 8 }, { "ER80S-D2 Kaynak Teli", 15 }, { "Karışım Koruyucu Gaz", 10 }, { "Zırhlı Balistik Cam", 6 }, { "Taktik İletişim Kiti", 2 }, { "Epoksi Askeri Astar", 8 } },
                Workstations = new()
                {
                    { "ws-lazer", new("CNC Plazma Kesim", "⚡", "Plazma Kesim") },
                    { "ws-abkant", new("Ağır Pres & Büküm", "📐", "Ağır Büküm") },
                    { "ws-arge", new("Balistik Tasarım Lab", "✏️", "Tasarım") },
                    { "ws-dokuma", new("Ağır MIG/MAG Kaynak", "🔥", "Ağır Kaynak") },
                    { "ws-firin", new("Gerilim Giderme Fırını", "♨️", "Isıl İşlem") },
                    { "ws-ik", new("İnsan Kaynakları Ofisi", "💼", "İdari") },
                    { "ws-lehim", new("Tahribatsız Muayene (NDT)", "🔍", "Tahribatsız Muayene") },
                    { "ws-test", new("Atış & Kabul Test Alanı", "🎯", "Kabul Testi") },
                    { "ws-ressam-wc", new("Teknik Ressam WC", "🚾🎨", "RessamWC") },
                    { "ws-boya", new("Kumlama & Boyama Kabini", "🎨", "Astar & Boya") },
                    { "ws-montaj", new("Taktik Entegrasyon Hattı", "🔧", "Entegrasyon") },
                    { "ws-depo", new("Depo / Ambar", "📦", "Shipment") },
                    { "ws-cay", new("Çay Ocağı / Dinlenme", "☕", "Break") },
                    { "ws-wc", new("Genel WC / Lavabolar", "🚾", "Break") },
                    { "ws-revir", new("Sağlık Odası (Revir)", "🏥", "Medical") }
                },
                Masters = new()
                {
                    new("Usta Ahmet", "Adapazarı", "Plazma Kesim", "İnatçı", "30 yıllık ağır plazma kesimcisi. Çeliği tereyağı gibi keser.", new() { "Usta Cevdet" }),
                    new("Usta Kadir", "Mersin", "Ağır Büküm", "Girişken", "1000 tonluk ağır hidrolik pres şefi. V-taban bükme ustası.", new()),
                    new("Usta Gizem", "İstanbul", "Tasarım", "Yardımsever", "Balistik koruma analisti ve zırh açısı simülasyon mühendisi.", new()),
                    new("Usta Cevdet", "Kayseri", "Ağır Kaynak", "İnatçı", "Sertifikalı ağır kaynak ustası. Çok pasolu MIG/MAG kaynağında pirdir.", new() { "Usta Ahmet" }),
                    new("Usta Hasan", "Konya", "Isıl İşlem", "Asosyal", "Büyük gerilim giderme tavlama fırını şefi. Mikroyapı uzmanı.", new()),
                    new("Usta Selim", "Zonguldak", "Tahribatsız Muayene", "Yardımsever", "Ultrasonik NDT çatlak muayenesi uzmanı. EN ISO 5817 Seviye B arar.", new() { "Usta Orhan" }),
                    new("Usta Orhan", "Bilecik", "Astar & Boya", "Asosyal", "SA 2.5 kumlama ve askeri kamuflaj poliüretan boyacısı.", new() { "Usta Selim" }),
                    new("Usta Rıza", "Gaziantep", "Entegrasyon", "Yardımsever", "Balistik cam montajı ve taktik telsiz entegrasyonu baş ustası.", new()),
                    new("Usta Can", "Ankara", "Kabul Testi", "Girişken", "Fabrika son kabul atış testleri ve mayın dayanım simülasyoncusu.", new()),
                    new("Sevkiyatçı Selo", "Kırşehir", "Shipment", "Yardımsever", "Ağır askeri treyler yükleme ve gümrükleme evrakçısı. Dedikoducudur.", new())
                },
                QuestionPool = new()
                {
                    new("Mil-A-46100 sınıfı zırh çeliğini MIG/MAG kaynağına almadan önce çatlak oluşumunu önlemek için kaç derece ön ısıtmaya tabi tutalım?", new() { new("100 - 150 °C (Ön Isıtma Önerilen)", true), new("300 - 350 °C", false), new("20 - 30 °C", false) }),
                    new("Gövde kaynaklarında koruyucu gaz karışım oranını ne ayarlayalım? Nüfuziyetin yüksek ve sıçramanın az olması gerekiyor.", new() { new("%82 Argon + %18 CO2 karışımı", true), new("%100 Saf Karbondioksit", false), new("%50 Azot + %50 Helyum", false) }),
                    new("Zırh köşe kaynak dikişlerinin ultrasonik tahribatsız muayenesinde (NDT) hangi kalite sınıfı kabul kriterini uygulayacağız?", new() { new("Seviye B (Yüksek - Sıfır Hata)", true), new("Seviye D (Düşük Tolerans)", false), new("Seviye C (Orta Seviye)", false) })
                },
                OrderTemplates = new()
                {
                    new("Mayına Karşı Korumalı Zırhlı Gövde", 6, 145000, 35000, 2, new()
                    {
                        new("Alt V-Gövde Sacı", new() { "Plazma Kesim", "Ağır Büküm" }, 1, new()),
                        new("Zırh Yan Paneller", new() { "Plazma Kesim", "Ağır Büküm" }, 1, new()),
                        new("Gövde Kaynak & Montaj", new() { "Ağır Kaynak", "Tahribatsız Muayene", "Isıl İşlem", "Astar & Boya", "Entegrasyon", "Kabul Testi" }, 2, new() { "Alt V-Gövde Sacı", "Zırh Yan Paneller" })
                    }),
                    new("Taktik Tekerlekli Zırhlı Şasi", 8, 220000, 60000, 3, new()
                    {
                        new("Taşıyıcı Alt Şasi", new() { "Plazma Kesim", "Ağır Büküm" }, 2, new()),
                        new("Süspansiyon Kuleleri", new() { "Plazma Kesim", "Ağır Büküm" }, 1, new()),
                        new("Bütünleşik Şasi İmalat", new() { "Ağır Kaynak", "Tahribatsız Muayene", "Isıl İşlem", "Astar & Boya", "Entegrasyon", "Kabul Testi" }, 2, new() { "Taşıyıcı Alt Şasi", "Süspansiyon Kuleleri" })
                    })
                },
                Handbook = @"<b>🔄 FABRİKA AKIŞ VE TEZGAH ŞEMASI</b>
Akış 1 (V-Gövde & Taban): Zırh Çeliği ➔ CNC Plazma Kesim ➔ Ağır Pres Büküm
Akış 2 (Zırh Yan Plakaları): Zırh Çeliği ➔ CNC Plazma ➔ Büküm ➔ Kenar Hazırlama
Entegrasyon: Gövde + Yan Paneller ➔ Ağır MIG/MAG Kaynak ➔ Gerilim Giderme ➔ NDT Muayene ➔ Boya ➔ Taktik Entegrasyon ➔ Kabul Testi

<b>⚡ 1. CNC PLAZMA KESİM VE PRES BÜKÜM</b>
• Plazma Hızı: 30mm Balistik Plaka | 1200 - 1500 mm/dak
• Plazma Gaz Basınç: O2 / Azot Karışımı | 8.5 bar
• Bükme Sac Radyüsü: Zırh Çeliği (Mil-A-46100) | R = 5 x Sac Kalınlığı

<b>🔥 2. ZIRH ÇELİĞİ ÖN ISITMA & KAYNAK REÇETELERİ</b>
• Ön Isıtma Sıcaklık: Mil-A-46100 Zırh Çelik | 100 - 150 °C
• MIG Koruyucu Gaz: Gazaltı Kaynak Karışımı | %82 Argon + %18 CO2
• Kaynak Tel Sınıfı: Yüksek Mukavemet | ER80S-D2 Dolgu Teli
• Akım Aralığı: Dolgu Pasoları Amper | 240 - 280 A

<b>🔍 3. TAHRIBATSIZ MUAYENE (NDT) VE KABUL</b>
• Ultrasonik (UT): EN ISO 5817 Seviye B (Yüksek) | 2 MHz - 4 MHz Problar
• Sıvı Penetrant (PT): Yüzey Çatlak Kontrolü | Sıfır Yüzey Hatası
• Manyetik Parçacık: Köşe Kaynakları Hatası | Akma Çizgisi Boşluğu

<b>🔩 4. CIVATA TORK DEĞERLERİ VE KABUL</b>
• Balistik Zırh Plaka: M16 Grade 12.9 Çelik | 290 Nm
• Süspansiyon Salıncak: M20 Grade 12.9 Ağır Yük | 570 Nm
• Tekerlek Taktik: Flanşlı Somun Takımı | 180 Nm"
            }
        }
    };
}
