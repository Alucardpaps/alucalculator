class_name FactoryData
extends RefCounted

## Static game configuration and factory templates.
## Handbooks are translated to Godot BBCode for native UI rendering.

const MINUTES_PER_TICK: int = 3
const TICK_MS: float = 1.0
const DAY_START_HOUR: int = 8
const DAY_END_HOUR: int = 18

const TRAITS = {
	"Stubborn": "İnatçı",
	"Helpful": "Yardımsever",
	"Outgoing": "Girişken",
	"Asocial": "Asosyal"
}

const SKILL_COLORS = {
	# Radiator
	"Sac Kesim": "#3b82f6", "Büküm": "#f97316", "Ar-Ge": "#f43f5e", 
	"Petek Dokuma": "#ec4899", "Fırınlama": "#eab308", "Sert Lehim": "#84cc16", 
	"Sızdırmazlık": "#06b6d4", "Boya": "#a78bfa", "Montaj": "#10b981", 
	"Shipment": "#64748b", "Break": "#94a3b8", "Medical": "#ef4444",
	# Gearbox additionals
	"Testere Kesim": "#3b82f6", "Tornalama": "#f59e0b", "Azdırma": "#ec4899", 
	"Isıl İşlem": "#ef4444", "Taşlama": "#84cc16", "Test": "#06b6d4",
	# Armored additionals
	"Plazma Kesim": "#3b82f6", "Ağır Büküm": "#f97316", "Tasarım": "#f43f5e",
	"Ağır Kaynak": "#f59e0b", "Tahribatsız Muayene": "#06b6d4", "Astar & Boya": "#a78bfa",
	"Entegrasyon": "#10b981", "Kabul Testi": "#14b8a6", "RessamWC": "#c084fc", "İdari": "#94a3b8"
}

const IDLE_ACTIVITIES = {
	"Usta Ahmet": "Çay bardağını tezgahına koyup gazete okuyor",
	"Usta Kadir": "Kumpasını kalibre edip yağlıyor",
	"Usta Gizem": "Yeni Z-aks modülünün teknik resmini inceliyor",
	"Usta Kemal": "Kulaklığını takmış eski çizimleri düzenliyor",
	"Usta Hasan": "Tezgahındaki metal tozlarını hava tabancasıyla temizliyor",
	"Usta Selim": "Memleket havaları mırıldanarak aleti siliyor",
	"Usta Can": "Tasarım kılavuzundan standart toleransları inceliyor",
	"Usta Mehmet": "Boya tabancasının tinerle temizliğini yapıyor",
	"Usta Murat": "Çekmece cıvatalarını tasnif ediyor",
	"Usta Rıza": "Radyoda Ege türküleri arıyor",
	"Usta Cevdet": "Torç ucunu çapak temizleyiciyle siliyor",
	"Usta Orhan": "Boya kabinini süpürüyor",
	"Sevkiyatçı Selo": "Depodaki malzemeleri paletlere yüklüyor"
}

const FACTORY_TEMPLATES = {
	"radiator": {
		"name": "Alüminyum Radyatör Fabrikası",
		"badge": "Hassas Lehimleme",
		"badgeColor": "#3b82f6",
		"materials": [
			"Alüminyum Rulo Sac", "Alüminyum Döküm Kazan", "Sert Lehim Dekapajı", 
			"Petek Kalıp Şeridi", "Fan & Braket Kiti", "Silikon Hortum Seti"
		],
		"matCosts": {
			"Alüminyum Rulo Sac": 4000, "Alüminyum Döküm Kazan": 3000, "Sert Lehim Dekapajı": 500, 
			"Petek Kalıp Şeridi": 1500, "Fan & Braket Kiti": 2500, "Silikon Hortum Seti": 1000
		},
		"startInventory": {
			"Alüminyum Rulo Sac": 10, "Alüminyum Döküm Kazan": 8, "Sert Lehim Dekapajı": 15, 
			"Petek Kalıp Şeridi": 12, "Fan & Braket Kiti": 6, "Silikon Hortum Seti": 8
		},
		"workstations": {
			"ws-lazer": { "name": "Lazer Kesim & Sac", "icon": "✂️", "requiredSkill": "Sac Kesim" },
			"ws-abkant": { "name": "Abkant Büküm İstasyonu", "icon": "📐", "requiredSkill": "Büküm" },
			"ws-arge": { "name": "Ar-Ge Tasarım Ofisi", "icon": "✏️", "requiredSkill": "Ar-Ge" },
			"ws-dokuma": { "name": "Petek Kalıplama & Dokuma", "icon": "🕸️", "requiredSkill": "Petek Dokuma" },
			"ws-firin": { "name": "CAB Lehimleme Fırını", "icon": "♨️", "requiredSkill": "Fırınlama" },
			"ws-ik": { "name": "İnsan Kaynakları Ofisi", "icon": "💼", "requiredSkill": "İdari" },
			"ws-lehim": { "name": "Kazan Sert Lehimleme", "icon": "🔥", "requiredSkill": "Sert Lehim" },
			"ws-test": { "name": "Sızdırmazlık Test İstasyonu", "icon": "🧪", "requiredSkill": "Sızdırmazlık" },
			"ws-ressam-wc": { "name": "Teknik Ressam WC", "icon": "🚾🎨", "requiredSkill": "RessamWC" },
			"ws-boya": { "name": "Toz Boya Kabini", "icon": "🎨", "requiredSkill": "Boya" },
			"ws-montaj": { "name": "Montaj & Son Kontrol", "icon": "🔧", "requiredSkill": "Montaj" },
			"ws-depo": { "name": "Depo / Ambar", "icon": "📦", "requiredSkill": "Shipment" },
			"ws-cay": { "name": "Çay Ocağı / Dinlenme", "icon": "☕", "requiredSkill": "Break" },
			"ws-wc": { "name": "Genel WC / Lavabolar", "icon": "🚾", "requiredSkill": "Break" },
			"ws-revir": { "name": "Sağlık Odası (Revir)", "icon": "🏥", "requiredSkill": "Medical" }
		},
		"masters": [
			{ "name": "Usta Ahmet", "hometown": "Trabzon", "skill": "Sac Kesim", "trait": "İnatçı", "bg": "30 yıllık giyotin sac makasçısı. Lazer kesim çıksa da büküm paylarını ezbere bilir.", "feuds": ["Usta Kadir"], "trust": 75, "morale": 70 },
			{ "name": "Usta Kadir", "hometown": "Adana", "skill": "Büküm", "trait": "Girişken", "bg": "CNC Abkant operatörü. Ahmet Usta'nın kestiği saclara 'bunun bükümü yamuk' demeyi sever.", "feuds": ["Usta Ahmet"], "trust": 80, "morale": 85 },
			{ "name": "Usta Gizem", "hometown": "İzmir", "skill": "Ar-Ge", "trait": "Yardımsever", "bg": "Genç makine ressamı. SolidWorks ve CATIA'da termal analiz uzmanı.", "feuds": [], "trust": 90, "morale": 90 },
			{ "name": "Usta Hasan", "hometown": "Konya", "skill": "Petek Dokuma", "trait": "Asosyal", "bg": "Eski kalıp ustası. İnç başına fin adımını (FPI) gözüyle ölçecek kadar keskin.", "feuds": [], "trust": 85, "morale": 65 },
			{ "name": "Usta Selim", "hometown": "Sivas", "skill": "Fırınlama", "trait": "İnatçı", "bg": "CAB lehim fırını uzmanı. Azot saflık seviyesini fırının kokusundan anlar.", "feuds": ["Usta Rıza"], "trust": 70, "morale": 80 },
			{ "name": "Usta Rıza", "hometown": "Amasya", "skill": "Sert Lehim", "trait": "Yardımsever", "bg": "Oksi-asetilen şalomasıyla pirinç ve alüminyum lehimlemede tek tabancadır.", "feuds": ["Usta Selim"], "trust": 85, "morale": 75 },
			{ "name": "Usta Can", "hometown": "Ankara", "skill": "Sızdırmazlık", "trait": "Girişken", "bg": "Su altı kabarcık ve helyum kaçak dedektörü ustası. Delikleri affetmez.", "feuds": [], "trust": 95, "morale": 80 },
			{ "name": "Usta Orhan", "hometown": "Bursa", "skill": "Boya", "trait": "Asosyal", "bg": "Kromat kaplama ve elektrostatik boyacı. Boya kalınlığı 80 mikron şaşmaz.", "feuds": [], "trust": 75, "morale": 70 },
			{ "name": "Usta Murat", "hometown": "Kayseri", "skill": "Montaj", "trait": "Girişken", "bg": "Radyatör toplama ve fan braketi vidalama şefi. Hızlı ama prim sever.", "feuds": [], "trust": 80, "morale": 75 },
			{ "name": "Sevkiyatçı Selo", "hometown": "Kırşehir", "skill": "Shipment", "trait": "Yardımsever", "bg": "Malzeme taşıyıcısı ve dedikodu şefi. Fabrikadaki tüm dedikoduları o taşır.", "feuds": [], "trust": 100, "morale": 95 }
		],
		"questionPool": [
			{
				"body": "Şefim, alüminyum radyatör peteklerini CAB lehim fırınına vermeden önce flux kaplama yükünü metrekare başına kaç gram ayarlayalım?",
				"actions": [
					{ "label": "3 - 5 g/m² (İdeal Oksit Çözme)", "correct": true },
					{ "label": "10 - 15 g/m² (Kalın Kaplama)", "correct": false },
					{ "label": "0.5 - 1.0 g/m² (Hafif Kaplama)", "correct": false }
				]
			},
			{
				"body": "Şefim, CAB lehimleme fırınındaki oksijen limitini kaç ppm altında tutalım? Yoksa alüminyum yüzeyde oksitlenme başlıyor.",
				"actions": [
					{ "label": "Oksijen seviyesi < 10 ppm olmalı", "correct": true },
					{ "label": "Oksijen seviyesi < 100 ppm olmalı", "correct": false },
					{ "label": "Oksijen seviyesi < 1000 ppm olmalı", "correct": false }
				]
			},
			{
				"body": "Şefim, CAB fırınında lehimlemenin sağlıklı gerçekleşmesi için çiy noktasını (Dew Point) kaç dereceye ayarlamamız gerekir?",
				"actions": [
					{ "label": "-40 °C'nin altında olmalı (Kuru Azot)", "correct": true },
					{ "label": "0 °C ile +10 °C arası olmalı", "correct": false },
					{ "label": "-10 °C'nin altında olmalı", "correct": false }
				]
			},
			{
				"body": "Şefim, ağır hizmet kamyon radyatörü sızdırmazlık su altı basınç testini kaç barda gerçekleştirelim?",
				"actions": [
					{ "label": "5.5 - 6.0 bar", "correct": true },
					{ "label": "1.5 - 2.5 bar", "correct": false },
					{ "label": "12 - 15 bar", "correct": false }
				]
			}
		],
		"orderTemplates": [
			{
				"desc": "Ağır Hizmet Kamyon Radyatörü",
				"story": "Çukurova'daki pancar kooperatifinin kamyonları zorlu tarla yollarında hararet yapıyor. Yüksek soğutma kapasiteli radyatörler gerekiyor.",
				"due": 5,
				"reward": 95000,
				"penalty": 25000,
				"rndDays": 1,
				"blueprints": [
					{ "name": "Petek Core Üretimi", "stages": ["Petek Dokuma", "Fırınlama"], "need": 2, "dependencies": [] },
					{ "name": "Kazan Sac Gövdesi", "stages": ["Sac Kesim", "Büküm"], "need": 1, "dependencies": [] },
					{ "name": "Radyatör Montaj & Bitiş", "stages": ["Sert Lehim", "Sızdırmazlık", "Boya", "Montaj"], "need": 2, "dependencies": ["Petek Core Üretimi", "Kazan Sac Gövdesi"] }
				]
			},
			{
				"desc": "Yüksek Performans Oto Radyatörü",
				"story": "Klasik bir Cadillac Eldorado restorasyonu için özel tasarım ve maksimum termal verimliliğe sahip alüminyum radyatör siparişi.",
				"due": 6,
				"reward": 120000,
				"penalty": 30000,
				"rndDays": 2,
				"blueprints": [
					{ "name": "Petek Core Üretimi", "stages": ["Petek Dokuma", "Fırınlama"], "need": 2, "dependencies": [] },
					{ "name": "Kazan Sac Gövdesi", "stages": ["Sac Kesim", "Büküm"], "need": 1, "dependencies": [] },
					{ "name": "Radyatör Montaj & Bitiş", "stages": ["Sert Lehim", "Sızdırmazlık", "Boya", "Montaj"], "need": 2, "dependencies": ["Petek Core Üretimi", "Kazan Sac Gövdesi"] }
				]
			}
		],
		"handbook": "[b][color=#eab308]🔄 FABRİKA AKIŞ VE TEZGAH ŞEMASI[/color][/b]\n" + 
			"[font_size=13][b]Akış 1 (Petek Üretimi):[/b] Rulo Şerit ➔ Dokuma Makinesi ➔ CAB Lehimleme Fırını\n" +
			"[b]Akış 2 (Sac & Gövde):[/b] Alüminyum Rulo Sac ➔ CNC Lazer Kesim ➔ Abkant Büküm\n" +
			"[b]Entegrasyon:[/b] Akış 1 + 2 ➔ Kazan Sert Lehimleme ➔ Sızdırmazlık Testi ➔ Toz Boya ➔ Montaj[/font_size]\n\n" +
			"[b][color=#eab308]✂️ 1. CNC LAZER & ABKANT BÜKÜM (SAC GRUBU)[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]İşlem[/b][/cell][cell][b]Tezgah / Parametre[/b][/cell][cell][b]Değer[/b][/cell]\n" +
			"[cell]CNC Lazer Kesim[/cell][cell]Fiber Odak Çapı (Alüminyum)[/cell][cell]ø 0.15 mm[/cell]\n" +
			"[cell]Abkant Büküm[/cell][cell]Sac Bükme Radyüsü (Alüminyum)[/cell][cell]R = 1.5 x Kalınlık[/cell]\n" +
			"[cell]Gövde Toleransı[/cell][cell]Kazan Yan Duvar Paralelliği[/cell][cell]± 0.25 mm[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#eab308]🕸️ 2. PETEK DOKUMA VE FPI STANDARTLARI[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Ölçü[/b][/cell][cell][b]Açıklama[/b][/cell][cell][b]Ölçü Değeri[/b][/cell]\n" +
			"[cell]Fin Adımı (FPI)[/cell][cell]İnç Başına Kanatçık Sayısı[/cell][cell]12 - 14 FPI[/cell]\n" +
			"[cell]Fin Yükseklik[/cell][cell]Kanal Arası Mesafe[/cell][cell]8.0 mm[/cell]\n" +
			"[cell]Şerit Kalınlık[/cell][cell]Alüminyum Şerit Sac rulo[/cell][cell]0.08 - 0.12 mm[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#eab308]♨️ 3. CAB FIRIN EĞRİSİ VE AZOT HESABI[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Parametre[/b][/cell][cell][b]Uygulama Alanı[/b][/cell][cell][b]Hedef Değer[/b][/cell]\n" +
			"[cell]Zirve Sıcaklık[/cell][cell]Petek Lehimleme (CAB)[/cell][cell]595 - 610 °C[/cell]\n" +
			"[cell]Azot Saflığı[/cell][cell]Fırın Atmosferi Koruma[/cell][cell]%99.999 saflık[/cell]\n" +
			"[cell]Oksijen Limit[/cell][cell]Oksitlenme Engelleme[/cell][cell]< 10 ppm[/cell]\n" +
			"[cell]Çiy Noktası[/cell][cell]Dew Point (Nem Limit)[/cell][cell]< -40 °C[/cell]\n" +
			"[cell]Flux Yükü[/cell][cell]Yüzey Oksit Çözme[/cell][cell]3 - 5 g/m²[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#eab308]🧪 4. SIZDIRMAZLIK VE BASINÇ TESTİ[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Test Türü[/b][/cell][cell][b]Çalışma Koşulu[/b][/cell][cell][b]Basınç / Kaçak[/b][/cell]\n" +
			"[cell]Su Altı Kabarcık[/cell][cell]Oto Radyatör Standart[/cell][cell]1.5 - 2.5 bar[/cell]\n" +
			"[cell]Ağır Hizmet[/cell][cell]Kamyon & İş Makinesi[/cell][cell]5.5 - 6.0 bar[/cell]\n" +
			"[cell]Sızıntı Hızı[/cell][cell]Maksimum Kabul Limit[/cell][cell]< 10^-3 mbar·l/s[/cell]\n" +
			"[/table]"
	},
	"gearbox": {
		"name": "Dişli & Şanzıman Fabrikası",
		"badge": "Hassas Talaşlı İmalat",
		"badgeColor": "#ec4899",
		"materials": [
			"AISI 8620 Çelik", "Döküm Şanzıman Gövdesi", "Hassas Rulman Seti", 
			"Keçe & Sızdırmazlık Kiti", "Şanzıman Yağı ATF", "Civata & Fastener Paketi"
		],
		"matCosts": {
			"AISI 8620 Çelik": 5000, "Döküm Şanzıman Gövdesi": 8000, "Hassas Rulman Seti": 3500, 
			"Keçe & Sızdırmazlık Kiti": 1200, "Şanzıman Yağı ATF": 800, "Civata & Fastener Paketi": 500
		},
		"startInventory": {
			"AISI 8620 Çelik": 12, "Döküm Şanzıman Gövdesi": 6, "Hassas Rulman Seti": 10, 
			"Keçe & Sızdırmazlık Kiti": 14, "Şanzıman Yağı ATF": 12, "Civata & Fastener Paketi": 20
		},
		"workstations": {
			"ws-lazer": { "name": "Testere & Sac Kesim", "icon": "⚙️", "requiredSkill": "Testere Kesim" },
			"ws-abkant": { "name": "CNC Torna İstasyonu", "icon": "🌀", "requiredSkill": "Tornalama" },
			"ws-arge": { "name": "Tasarım & Projelendirme", "icon": "✏️", "requiredSkill": "Ar-Ge" },
			"ws-dokuma": { "name": "Dişli Azdırma Tezgahı", "icon": "🎡", "requiredSkill": "Azdırma" },
			"ws-firin": { "name": "Sementasyon Isıl İşlem", "icon": "🔥", "requiredSkill": "Isıl İşlem" },
			"ws-ik": { "name": "İnsan Kaynakları Ofisi", "icon": "💼", "requiredSkill": "İdari" },
			"ws-lehim": { "name": "Silindirik Taşlama", "icon": "💎", "requiredSkill": "Taşlama" },
			"ws-test": { "name": "Dönüş & Sızdırmazlık Testi", "icon": "🧪", "requiredSkill": "Test" },
			"ws-ressam-wc": { "name": "Teknik Ressam WC", "icon": "🚾🎨", "requiredSkill": "RessamWC" },
			"ws-boya": { "name": "Astar & Koruyucu Boya", "icon": "🎨", "requiredSkill": "Boya" },
			"ws-montaj": { "name": "Şanzıman Montaj Hattı", "icon": "🔧", "requiredSkill": "Montaj" },
			"ws-depo": { "name": "Depo / Ambar", "icon": "📦", "requiredSkill": "Shipment" },
			"ws-cay": { "name": "Çay Ocağı / Dinlenme", "icon": "☕", "requiredSkill": "Break" },
			"ws-wc": { "name": "Genel WC / Lavabolar", "icon": "🚾", "requiredSkill": "Break" },
			"ws-revir": { "name": "Sağlık Odası (Revir)", "icon": "🏥", "requiredSkill": "Medical" }
		},
		"masters": [
			{ "name": "Usta Kemal", "hometown": "Karabük", "skill": "Testere Kesim", "trait": "İnatçı", "bg": "Çelik çubuk kesim ustası. AISI 8620 çeliği testere sesinden tanır.", "feuds": ["Usta Hasan"], "trust": 70, "morale": 75 },
			{ "name": "Usta Hasan", "hometown": "Kırıkkale", "skill": "Tornalama", "trait": "Asosyal", "bg": "CNC torna şefi. Kaba torna çaplarını mikron düzeyinde çıkarır.", "feuds": ["Usta Kemal"], "trust": 80, "morale": 70 },
			{ "name": "Usta Can", "hometown": "Ankara", "skill": "Ar-Ge", "trait": "Yardımsever", "bg": "Evolvent dişli profili kaydırma analisti. CAD ustası.", "feuds": [], "trust": 90, "morale": 85 },
			{ "name": "Usta Ahmet", "hometown": "Tokat", "skill": "Azdırma", "trait": "Girişken", "bg": "Dişli azdırma (hobbing) tezgahı emektarı. Helisel diş profilcisi.", "feuds": [], "trust": 85, "morale": 80 },
			{ "name": "Usta Selim", "hometown": "Yozgat", "skill": "Isıl İşlem", "trait": "İnatçı", "bg": "Karbürleme fırını piri. Çeliğe martenzitik sertlik kazandırır.", "feuds": ["Usta Murat"], "trust": 75, "morale": 70 },
			{ "name": "Usta Murat", "hometown": "Aksaray", "skill": "Taşlama", "trait": "Yardımsever", "bg": "Hassas silindirik dış taşlama uzmanı. Rulman yataklarını parlatır.", "feuds": ["Usta Selim"], "trust": 80, "morale": 75 },
			{ "name": "Usta Rıza", "hometown": "Adana", "skill": "Test", "trait": "Girişken", "bg": "Dinamometre ve backlash diş boşluğu test cihazı şefi.", "feuds": [], "trust": 90, "morale": 80 },
			{ "name": "Usta Orhan", "hometown": "Eskişehir", "skill": "Boya", "trait": "Asosyal", "bg": "Korozyon önleyici epoksi astar boyacısı. Titizdir.", "feuds": [], "trust": 75, "morale": 80 },
			{ "name": "Usta Kadir", "hometown": "Gaziantep", "skill": "Montaj", "trait": "Girişken", "bg": "Rulman çakma ve şanzıman cıvatalarını torklama şefi.", "feuds": [], "trust": 80, "morale": 75 },
			{ "name": "Sevkiyatçı Selo", "hometown": "Kırşehir", "skill": "Shipment", "trait": "Yardımsever", "bg": "Palet yükleme ve sevk kamyonlarını organize etme şefi.", "feuds": [], "trust": 100, "morale": 90 }
		],
		"questionPool": [
			{
				"body": "Şefim, AISI 8620 çeliğinden üreteceğimiz dişliler için gaz karbürleme (sementasyon) sıcaklığını kaç derece ayarlayalım?",
				"actions": [
					{ "label": "900 - 930 °C (Karbürleme Aralığı)", "correct": true },
					{ "label": "550 - 600 °C (Temperleme Aralığı)", "correct": false },
					{ "label": "1200 - 1250 °C (Dövme Aralığı)", "correct": false }
				]
			},
			{
				"body": "Şefim, helisel dişli milimizin rulman yatağını taşlarken hangi ISO geçme tolerans sınıfını uygulayalım? Rulman sıkı geçmeli olmalı.",
				"actions": [
					{ "label": "ISO h5 toleransı (0 ile -9 mikron)", "correct": true },
					{ "label": "ISO h6 toleransı (0 ile -13 mikron)", "correct": false },
					{ "label": "ISO g6 toleransı (Boşluklu)", "correct": false }
				]
			},
			{
				"body": "Şefim, sementasyon fırınındaki karbon potansiyeli (Cp) yüzdesini kaç seviyesinde tutalım? Dişlilerin yüzeyi çok gevrek olmasın.",
				"actions": [
					{ "label": "%0.80 - %0.95 C", "correct": true },
					{ "label": "%1.40 - %1.60 C", "correct": false },
					{ "label": "%0.20 - %0.30 C", "correct": false }
				]
			},
			{
				"body": "Şefim, şanzıman ana gövde bağlantısındaki M12 12.9 mukavemetli cıvataların tork değerini kaç Nm sıkalım?",
				"actions": [
					{ "label": "120 Nm", "correct": true },
					{ "label": "50 Nm", "correct": false },
					{ "label": "290 Nm", "correct": false }
				]
			}
		],
		"orderTemplates": [
			{
				"desc": "Helisel Dişli Hız Düşürücü Redüktör",
				"story": "Zonguldak'taki yer altı kömür madeni asansörünün tahrik mekanizması için yüksek emniyet katsayılı helisel dişli redüktör siparişi.",
				"due": 6,
				"reward": 135000,
				"penalty": 30000,
				"rndDays": 2,
				"blueprints": [
					{ "name": "Mil Komponenti", "stages": ["Testere Kesim", "Tornalama", "Isıl İşlem", "Taşlama"], "need": 1, "dependencies": [] },
					{ "name": "Helisel Dişli Çark", "stages": ["Testere Kesim", "Tornalama", "Azdırma", "Isıl İşlem", "Taşlama"], "need": 2, "dependencies": [] },
					{ "name": "Şanzıman Montaj Hattı", "stages": ["Montaj", "Test", "Boya"], "need": 2, "dependencies": ["Mil Komponenti", "Helisel Dişli Çark"] }
				]
			},
			{
				"desc": "Ağır Hizmet Kamyon Transmisyonu",
				"story": "Ağır şantiye koşullarında çalışacak BMC Tuğra çekicileri için yüksek tork dayanımlı senkromeçli şanzıman siparişi.",
				"due": 7,
				"reward": 180000,
				"penalty": 45000,
				"rndDays": 3,
				"blueprints": [
					{ "name": "Mil Komponenti", "stages": ["Testere Kesim", "Tornalama", "Isıl İşlem", "Taşlama"], "need": 1, "dependencies": [] },
					{ "name": "Helisel Dişli Çark", "stages": ["Testere Kesim", "Tornalama", "Azdırma", "Isıl İşlem", "Taşlama"], "need": 2, "dependencies": [] },
					{ "name": "Şanzıman Montaj Hattı", "stages": ["Montaj", "Test", "Boya"], "need": 2, "dependencies": ["Mil Komponenti", "Helisel Dişli Çark"] }
				]
			}
		],
		"handbook": "[b][color=#ec4899]🔄 FABRİKA AKIŞ VE TEZGAH ŞEMASI[/color][/b]\n" + 
			"[font_size=13][b]Akış 1 (Dişli Grubu):[/b] AISI 8620 Çelik ➔ CNC Torna ➔ Azdırma ➔ Sementasyon Isıl İşlem\n" +
			"[b]Akış 2 (Mil & Aks):[/b] AISI 8620 Çelik ➔ Testere Kesim ➔ CNC Torna ➔ Isıl İşlem ➔ Silindirik Taşlama\n" +
			"[b]Entegrasyon:[/b] Gövde + Dişli + Mil ➔ Şanzıman Montaj ➔ Dönüş/Boşluk Testi ➔ Koruyucu Astar Boya[/font_size]\n\n" +
			"[b][color=#ec4899]🔩 1. CNC TORNA VE DİŞLİ AZDIRMA (TOLERANSLAR)[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]İşlem[/b][/cell][cell][b]Tezgah / Parametre[/b][/cell][cell][b]Değer[/b][/cell]\n" +
			"[cell]CNC Kaba Torna[/cell][cell]Kesme Hızı (Vc - Karbür Kesici)[/cell][cell]180 - 220 m/dak[/cell]\n" +
			"[cell]Azdırma (Hobbing)[/cell][cell]Helis Açısı Limitleri (Beta)[/cell][cell]15° - 25° Helisel[/cell]\n" +
			"[cell]Dişli Modülü[/cell][cell]Standart Diş Profil Modülü[/cell][cell]M = 2.0 - 4.5 mm[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#ec4899]🔥 2. SEMENTASYON ISIL İŞLEM REÇETELERİ[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Parametre[/b][/cell][cell][b]Malzeme Sınıfı[/b][/cell][cell][b]Hedef Değer[/b][/cell]\n" +
			"[cell]Karbürleme Sıcaklık[/cell][cell]AISI 8620 Çelik[/cell][cell]900 - 930 °C[/cell]\n" +
			"[cell]Karbon Potansiyeli[/cell][cell]Atmosfer Cp Kontrolü[/cell][cell]0.80% - 0.95% C[/cell]\n" +
			"[cell]Yağ Banyo Sıcaklık[/cell][cell]Su Verme Hızlı Soğutma[/cell][cell]60 - 80 °C[/cell]\n" +
			"[cell]Sementasyon Derinlik[/cell][cell]Spur / Helisel Dişli[/cell][cell]0.8 - 1.2 mm[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#ec4899]🎡 3. DİŞLİ VE MİL HASSAS TAŞLAMA[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Geçme Sınıfı[/b][/cell][cell][b]Uygulama Alanı[/b][/cell][cell][b]Sapma Toleransı[/b][/cell]\n" +
			"[cell]ISO h5 (Sıkı Yuva)[/cell][cell]Hassas Şanzıman Rulmanı[/cell][cell]0 ile -9 mikron[/cell]\n" +
			"[cell]ISO h6 (Normal)[/cell][cell]Transmisyon Mil Çapı[/cell][cell]0 ile -13 mikron[/cell]\n" +
			"[cell]Diş Backlash[/cell][cell]Diş Dişli Aşınma Boşluğu[/cell][cell]0.05 - 0.12 mm[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#ec4899]🔧 4. CIVATA SIKMA VE TEST KILAVUZU[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Bağlantı Elemanı[/b][/cell][cell][b]Kalite Sınıfı[/b][/cell][cell][b]Tork / Test Değeri[/b][/cell]\n" +
			"[cell]M10 Gövde Cıvatası[/cell][cell]10.9 Sınıf Yüksek Akma[/cell][cell]70 Nm[/cell]\n" +
			"[cell]M12 Ağır Yük Mili[/cell][cell]12.9 Ağır Sanayi Çeliği[/cell][cell]120 Nm[/cell]\n" +
			"[cell]Dişli Titreşim Limit[/cell][cell]Rulman Hasar Frekansı[/cell][cell]< 2.5 mm/s (RMS)[/cell]\n" +
			"[/table]"
	},
	"armored": {
		"name": "Zırhlı Gövde & Kaynak Fabrikası",
		"badge": "Savunma Sanayi Ağır İmalat",
		"badgeColor": "#ef4444",
		"materials": [
			"Mil-A-46100 Zırh Çeliği", "ER80S-D2 Kaynak Teli", "Karışım Koruyucu Gaz", 
			"Zırhlı Balistik Cam", "Taktik İletişim Kiti", "Epoksi Askeri Astar"
		],
		"matCosts": {
			"Mil-A-46100 Zırh Çeliği": 12000, "ER80S-D2 Kaynak Teli": 2000, "Karışım Koruyucu Gaz": 1500, 
			"Zırhlı Balistik Cam": 10000, "Taktik İletişim Kiti": 25000, "Epoksi Askeri Astar": 3000
		},
		"startInventory": {
			"Mil-A-46100 Zırh Çeliği": 8, "ER80S-D2 Kaynak Teli": 15, "Karışım Koruyucu Gaz": 10, 
			"Zırhlı Balistik Cam": 6, "Taktik İletişim Kiti": 2, "Epoksi Askeri Astar": 8
		},
		"workstations": {
			"ws-lazer": { "name": "CNC Plazma Kesim", "icon": "⚡", "requiredSkill": "Plazma Kesim" },
			"ws-abkant": { "name": "Ağır Pres & Büküm", "icon": "📐", "requiredSkill": "Ağır Büküm" },
			"ws-arge": { "name": "Balistik Tasarım Lab", "icon": "✏️", "requiredSkill": "Tasarım" },
			"ws-dokuma": { "name": "Ağır MIG/MAG Kaynak", "icon": "🔥", "requiredSkill": "Ağır Kaynak" },
			"ws-firin": { "name": "Gerilim Giderme Fırını", "icon": "♨️", "requiredSkill": "Isıl İşlem" },
			"ws-ik": { "name": "İnsan Kaynakları Ofisi", "icon": "💼", "requiredSkill": "İdari" },
			"ws-lehim": { "name": "Tahribatsız Muayene (NDT)", "icon": "🔍", "requiredSkill": "Tahribatsız Muayene" },
			"ws-test": { "name": "Atış & Kabul Test Alanı", "icon": "🎯", "requiredSkill": "Kabul Testi" },
			"ws-ressam-wc": { "name": "Teknik Ressam WC", "icon": "🚾🎨", "requiredSkill": "RessamWC" },
			"ws-boya": { "name": "Kumlama & Boyama Kabini", "icon": "🎨", "requiredSkill": "Astar & Boya" },
			"ws-montaj": { "name": "Taktik Entegrasyon Hattı", "icon": "🔧", "requiredSkill": "Entegrasyon" },
			"ws-depo": { "name": "Depo / Ambar", "icon": "📦", "requiredSkill": "Shipment" },
			"ws-cay": { "name": "Çay Ocağı / Dinlenme", "icon": "☕", "requiredSkill": "Break" },
			"ws-wc": { "name": "Genel WC / Lavabolar", "icon": "🚾", "requiredSkill": "Break" },
			"ws-revir": { "name": "Sağlık Odası (Revir)", "icon": "🏥", "requiredSkill": "Medical" }
		},
		"masters": [
			{ "name": "Usta Ahmet", "hometown": "Adapazarı", "skill": "Plazma Kesim", "trait": "İnatçı", "bg": "30 yıllık ağır plazma kesimcisi. Çeliği tereyağı gibi keser.", "feuds": ["Usta Cevdet"], "trust": 75, "morale": 70 },
			{ "name": "Usta Kadir", "hometown": "Mersin", "skill": "Ağır Büküm", "trait": "Girişken", "bg": "1000 tonluk ağır hidrolik pres şefi. V-taban bükme ustası.", "feuds": [], "trust": 80, "morale": 80 },
			{ "name": "Usta Gizem", "hometown": "İstanbul", "skill": "Tasarım", "trait": "Yardımsever", "bg": "Balistik koruma analisti ve zırh açısı simülasyon mühendisi.", "feuds": [], "trust": 90, "morale": 90 },
			{ "name": "Usta Cevdet", "hometown": "Kayseri", "skill": "Ağır Kaynak", "trait": "İnatçı", "bg": "Sertifikalı ağır kaynak ustası. Çok pasolu MIG/MAG kaynağında pirdir.", "feuds": ["Usta Ahmet"], "trust": 70, "morale": 75 },
			{ "name": "Usta Hasan", "hometown": "Konya", "skill": "Isıl İşlem", "trait": "Asosyal", "bg": "Büyük gerilim giderme tavlama fırını şefi. Mikroyapı uzmanı.", "feuds": [], "trust": 85, "morale": 65 },
			{ "name": "Usta Selim", "hometown": "Zonguldak", "skill": "Tahribatsız Muayene", "trait": "Yardımsever", "bg": "Ultrasonik NDT çatlak muayenesi uzmanı. EN ISO 5817 Seviye B arar.", "feuds": ["Usta Orhan"], "trust": 85, "morale": 80 },
			{ "name": "Usta Orhan", "hometown": "Bilecik", "skill": "Astar & Boya", "trait": "Asosyal", "bg": "SA 2.5 kumlama ve askeri kamuflaj poliüretan boyacısı.", "feuds": ["Usta Selim"], "trust": 70, "morale": 75 },
			{ "name": "Usta Rıza", "hometown": "Gaziantep", "skill": "Entegrasyon", "trait": "Yardımsever", "bg": "Balistik cam montajı ve taktik telsiz entegrasyonu baş ustası.", "feuds": [], "trust": 90, "morale": 85 },
			{ "name": "Usta Can", "hometown": "Ankara", "skill": "Kabul Testi", "trait": "Girişken", "bg": "Fabrika son kabul atış testleri ve mayın dayanım simülasyoncusu.", "feuds": [], "trust": 95, "morale": 80 },
			{ "name": "Sevkiyatçı Selo", "hometown": "Kırşehir", "skill": "Shipment", "trait": "Yardımsever", "bg": "Ağır askeri treyler yükleme ve gümrükleme evrakçısı. Dedikoducudur.", "feuds": [], "trust": 100, "morale": 95 }
		],
		"questionPool": [
			{
				"body": "Şefim, Mil-A-46100 sınıfı zırh çeliğini MIG/MAG kaynağına almadan önce çatlak oluşumunu önlemek için kaç derece ön ısıtmaya tabi tutalım?",
				"actions": [
					{ "label": "100 - 150 °C (Ön Isıtma Önerilen)", "correct": true },
					{ "label": "300 - 350 °C (Yüksek Tavlama)", "correct": false },
					{ "label": "20 - 30 °C (Oda Sıcaklığı)", "correct": false }
				]
			},
			{
				"body": "Şefim, gövde kaynaklarında koruyucu gaz karışım oranını ne ayarlayalım? Nüfuziyetin yüksek ve sıçramanın az olması gerekiyor.",
				"actions": [
					{ "label": "%82 Argon + %18 CO2 karışımı", "correct": true },
					{ "label": "%100 Saf Karbondioksit", "correct": false },
					{ "label": "%50 Azot + %50 Helyum", "correct": false }
				]
			},
			{
				"body": "Şefim, zırh köşe kaynak dikişlerinin ultrasonik tahribatsız muayenesinde (NDT) hangi kalite sınıfı kabul kriterini uygulayacağız?",
				"actions": [
					{ "label": "Seviye B (Yüksek - Sıfır Hata)", "correct": true },
					{ "label": "Seviye D (Düşük Tolerans)", "correct": false },
					{ "label": "Seviye C (Orta Seviye)", "correct": false }
				]
			}
		],
		"orderTemplates": [
			{
				"desc": "Mayına Karşı Korumalı Zırhlı Gövde",
				"story": "Sınır güvenliği devriye görevleri için mayın ve el yapımı patlayıcı (EYP) tehditlerine karşı mukavemetli alt V-gövde zırh sacı imalatı.",
				"due": 6,
				"reward": 145000,
				"penalty": 35000,
				"rndDays": 2,
				"blueprints": [
					{ "name": "Alt V-Gövde Sacı", "stages": ["Plazma Kesim", "Ağır Büküm"], "need": 1, "dependencies": [] },
					{ "name": "Zırh Yan Paneller", "stages": ["Plazma Kesim", "Ağır Büküm"], "need": 1, "dependencies": [] },
					{ "name": "Gövde Kaynak & Montaj", "stages": ["Ağır Kaynak", "Tahribatsız Muayene", "Isıl İşlem", "Astar & Boya", "Entegrasyon", "Kabul Testi"], "need": 2, "dependencies": ["Alt V-Gövde Sacı", "Zırh Yan Paneller"] }
				]
			},
			{
				"desc": "Taktik Tekerlekli Zırhlı Şasi",
				"story": "Engebeli arazide ve yüksek hızlarda stabilite sağlayan bağımsız süspansiyonlu taktik zırhlı muharebe aracı şasisi siparişi.",
				"due": 8,
				"reward": 220000,
				"penalty": 60000,
				"rndDays": 3,
				"blueprints": [
					{ "name": "Taşıyıcı Alt Şasi", "stages": ["Plazma Kesim", "Ağır Büküm"], "need": 2, "dependencies": [] },
					{ "name": "Süspansiyon Kuleleri", "stages": ["Plazma Kesim", "Ağır Büküm"], "need": 1, "dependencies": [] },
					{ "name": "Bütünleşik Şasi İmalat", "stages": ["Ağır Kaynak", "Tahribatsız Muayene", "Isıl İşlem", "Astar & Boya", "Entegrasyon", "Kabul Testi"], "need": 2, "dependencies": ["Taşıyıcı Alt Şasi", "Süspansiyon Kuleleri"] }
				]
			}
		],
		"handbook": "[b][color=#ef4444]🔄 FABRİKA AKIŞ VE TEZGAH ŞEMASI[/color][/b]\n" + 
			"[font_size=13][b]Akış 1 (V-Gövde & Taban):[/b] Zırh Çeliği ➔ CNC Plazma Kesim ➔ Ağır Pres Büküm\n" +
			"[b]Akış 2 (Zırh Yan Plakaları):[/b] Zırh Çeliği ➔ CNC Plazma ➔ Büküm ➔ Kenar Hazırlama\n" +
			"[b]Entegrasyon:[/b] Gövde + Yan Paneller ➔ Ağır MIG/MAG Kaynak ➔ Gerilim Giderme ➔ NDT Muayene ➔ Boya ➔ Taktik Entegrasyon ➔ Kabul Testi[/font_size]\n\n" +
			"[b][color=#ef4444]⚡ 1. CNC PLAZMA KESİM VE PRES BÜKÜM[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]İşlem[/b][/cell][cell][b]Parametre[/b][/cell][cell][b]Hedef Değer[/b][/cell]\n" +
			"[cell]Plazma Hızı[/cell][cell]30mm Balistik Plaka[/cell][cell]1200 - 1500 mm/dak[/cell]\n" +
			"[cell]Plazma Gaz Basınç[/cell][cell]O2 / Azot Karışımı[/cell][cell]8.5 bar[/cell]\n" +
			"[cell]Bükme Sac Radyüsü[/cell][cell]Zırh Çeliği (Mil-A-46100)[/cell][cell]R = 5 x Sac Kalınlığı[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#ef4444]🔥 2. ZIRH ÇELİĞİ ÖN ISITMA & KAYNAK REÇETELERİ[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Parametre[/b][/cell][cell][b]Malzeme Sınıfı[/b][/cell][cell][b]Hedef Değer[/b][/cell]\n" +
			"[cell]Ön Isıtma Sıcaklık[/cell][cell]Mil-A-46100 Zırh Çelik[/cell][cell]100 - 150 °C[/cell]\n" +
			"[cell]MIG Koruyucu Gaz[/cell][cell]Gazaltı Kaynak Karışımı[/cell][cell]%82 Argon + %18 CO2[/cell]\n" +
			"[cell]Kaynak Tel Sınıfı[/cell][cell]Yüksek Mukavemet[/cell][cell]ER80S-D2 Dolgu Teli[/cell]\n" +
			"[cell]Akım Aralığı[/cell][cell]Dolgu Pasoları Amper[/cell][cell]240 - 280 A[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#ef4444]🔍 3. TAHRIBATSIZ MUAYENE (NDT) VE KABUL[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Test Metodu[/b][/cell][cell][b]Kabul Kriteri[/b][/cell][cell][b]Frekans / Uygulama[/b][/cell]\n" +
			"[cell]Ultrasonik (UT)[/cell][cell]EN ISO 5817 Seviye B (Yüksek)[/cell][cell]2 MHz - 4 MHz Problar[/cell]\n" +
			"[cell]Sıvı Penetrant (PT)[/cell][cell]Yüzey Çatlak Kontrolü[/cell][cell]Sıfır Yüzey Hatası[/cell]\n" +
			"[cell]Manyetik Parçacık[/cell][cell]Köşe Kaynakları Hatası[/cell][cell]Akma Çizgisi Boşluğu[/cell]\n" +
			"[/table]\n\n" +
			"[b][color=#ef4444]🔩 4. CIVATA TORK DEĞERLERİ VE KABUL[/color][/b]\n" +
			"[table=3]\n" +
			"[cell][b]Bağlantı Bölgesi[/b][/cell][cell][b]Cıvata Kalite & Çap[/b][/cell][cell][b]Torklama Gücü[/b][/cell]\n" +
			"[cell]Balistik Zırh Plaka[/cell][cell]M16 Grade 12.9 Çelik[/cell][cell]290 Nm[/cell]\n" +
			"[cell]Süspansiyon Salıncak[/cell][cell]M20 Grade 12.9 Ağır Yük[/cell][cell]570 Nm[/cell]\n" +
			"[cell]Tekerlek Taktik[/cell][cell]Flanşlı Somun Takımı[/cell][cell]180 Nm[/cell]\n" +
			"[/table]"
	}
}
