extends PanelContainer

## MeetingPanel: Programmatic UI representing a messaging app chat for mid-week and weekend meetings.

signal meeting_finished

# UI Refs
var chat_list: VBoxContainer
var scroll_container: ScrollContainer
var options_container: VBoxContainer
var header_title: Label
var trust_status_label: Label

# Meeting State
var is_midweek: bool = false
var current_step: int = 0 # 0: Boss Ask, 1: Boss Reaction, 2: Customer Ask, 3: Customer Reaction, 4: Wrap-up
var selected_option: Dictionary = {}
var active_questions: Dictionary = {}

func _ready() -> void:
	custom_minimum_size = Vector2(1024, 576)
	set_anchors_preset(Control.PRESET_FULL_RECT)
	
	# Glassmorphism dark panel style
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color(0.04, 0.05, 0.08, 0.98) # Dark glossy chat client background
	panel_style.border_width_left = 4
	panel_style.border_width_right = 4
	panel_style.border_width_top = 4
	panel_style.border_width_bottom = 4
	panel_style.border_color = Color(0.95, 0.77, 0.25, 0.7) # Gold/Amber border
	panel_style.corner_radius_top_left = 18
	panel_style.corner_radius_top_right = 18
	panel_style.corner_radius_bottom_right = 18
	panel_style.corner_radius_bottom_left = 18
	add_theme_stylebox_override("panel", panel_style)
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 30)
	margin.add_theme_constant_override("margin_right", 30)
	margin.add_theme_constant_override("margin_top", 25)
	margin.add_theme_constant_override("margin_bottom", 25)
	add_child(margin)
	
	var main_vbox := VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 15)
	margin.add_child(main_vbox)
	
	# Header Layout
	var header_hbox := HBoxContainer.new()
	main_vbox.add_child(header_hbox)
	
	header_title = Label.new()
	header_title.text = "💬 SANAYİ İLETİŞİM GRUBU"
	header_title.add_theme_font_size_override("font_size", 18)
	header_title.add_theme_color_override("font_color", Color(0.95, 0.77, 0.25))
	header_hbox.add_child(header_title)
	
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header_hbox.add_child(spacer)
	
	trust_status_label = Label.new()
	trust_status_label.text = "Patron Güveni: %d" % GameManager.boss_trust
	trust_status_label.add_theme_font_size_override("font_size", 12)
	trust_status_label.add_theme_color_override("font_color", Color(0.24, 0.82, 0.93))
	header_hbox.add_child(trust_status_label)
	
	var sep := HSeparator.new()
	main_vbox.add_child(sep)
	
	# Scroll area for chat messages
	scroll_container = ScrollContainer.new()
	scroll_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll_container.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	main_vbox.add_child(scroll_container)
	
	chat_list = VBoxContainer.new()
	chat_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	chat_list.add_theme_constant_override("separation", 12)
	scroll_container.add_child(chat_list)
	
	var opt_sep := HSeparator.new()
	main_vbox.add_child(opt_sep)
	
	# Option Buttons stack at the bottom
	options_container = VBoxContainer.new()
	options_container.add_theme_constant_override("separation", 8)
	main_vbox.add_child(options_container)
	
	visible = false

func start_meeting(midweek: bool) -> void:
	is_midweek = midweek
	current_step = 0
	visible = true
	
	# Clear previous chat history
	for child in chat_list.get_children():
		child.queue_free()
	for child in options_container.get_children():
		child.queue_free()
		
	trust_status_label.text = "Patron Güveni: %d" % GameManager.boss_trust
	header_title.text = "💬 " + ("HAFTA ORTASI DEĞERLENDİRME TOPLANTISI" if midweek else "HAFTA SONU DURUM DEĞERLENDİRME TOPLANTISI")
	
	# Load specific questions database
	_load_questions()
	
	# Start first step (Boss asks question)
	_show_boss_question()

func _load_questions() -> void:
	var f_type = GameManager.selected_factory_type
	active_questions = {}
	
	if f_type == "radiator":
		if is_midweek:
			active_questions["boss"] = {
				"sender": "👔 Patron Karahan",
				"text": "Şef, Alüminyum Radyatör fabrikamızdaki CAB lehimleme fırınının sıcaklık kararlılığı ne durumda? Azot saflığı düşerse ne olur?",
				"options": [
					{
						"text": "Azot saflığını %99.999 seviyesinde tutup oksijeni <10 ppm yapıyoruz efendim, oksitlenmeyi sıfırlıyoruz.",
						"correct": true,
						"reward_text": "Harika şef! Detaylara hakimiyetin beni mutlu ediyor. Devam et.",
						"trust_change": 2
					},
					{
						"text": "Azot saflığı çok önemli değil şefim, fırın sıcak olsun yeter diyoruz.",
						"correct": false,
						"reward_text": "Ne demek önemli değil? Oksitlenme olursa tüm petekler hurda olur şef! Dikkat et biraz.",
						"trust_change": -1
					},
					{
						"text": "Sıcaklık 500 derece civarında, azot vanasını arada kontrol ediyoruz.",
						"correct": false,
						"reward_text": "Fırın sıcaklığı en az 595 derece olmalı, el kitabını hiç okumuyor musun şef?",
						"trust_change": -1
					}
				]
			}
			active_questions["customer"] = {
				"sender": "💼 Müşteri (Cadillac Eldorado Restorasyonu)",
				"text": "Cadillac Eldorado projemiz için özel tasarım radyatör istiyoruz. Petek dokusunun inç başına fin sayısı (FPI) ne olmalıdır? Yüksek termal verimlilik arıyoruz.",
				"options": [
					{
						"text": "Klasik Cadillac için yüksek termal verimli 12 - 14 FPI (Fin Adımı) uygulayacağız.",
						"correct": true,
						"reward_text": "Müthiş! İşte aradığımız teknik yetkinlik. Size devasa bir özel sipariş veriyoruz!"
					},
					{
						"text": "Fark etmez, standart 6 FPI yapar geçeriz, hem daha ucuz ve kolay olur.",
						"correct": false,
						"reward_text": "6 FPI klasik oto için çok yetersiz kalır, motor hararet yapar. Bu vizyonla çalışamayız."
					}
				]
			}
		else: # Weekend
			active_questions["boss"] = {
				"sender": "👔 Patron Karahan",
				"text": "Şefim, ağır hizmet kamyon radyatörleri için sızdırmazlık test basıncımız nedir ve sızıntı limiti nedir?",
				"options": [
					{
						"text": "Ağır hizmet için 5.5 - 6.0 bar su altı kabarcık testi yapıyoruz, sızıntı hızı 10^-3 mbar·l/s altındadır.",
						"correct": true,
						"reward_text": "Çok iyi şef, kamyon radyatörlerinde sızdırmazlık hayati önem taşır. Aferin.",
						"trust_change": 2
					},
					{
						"text": "Normal binek araçlar gibi 1.5 bar yapıyoruz, delik yoksa sızıntı da yoktur.",
						"correct": false,
						"reward_text": "Kamyon radyatörleri yüksek basınçta çalışır, 1.5 bar yetersizdir! Müşteri şikayeti gelirse senden bilirim.",
						"trust_change": -2
					}
				]
			}
			active_questions["customer"] = {
				"sender": "💼 Müşteri (Milli Uzay Ajansı - Uydu Radyatörü)",
				"text": "Milli Uzay Ajansı için uydu radyatörü yaptıracağız. CAB fırınında flux kaplama miktarını ve çiy noktasını nasıl yöneteceksiniz?",
				"options": [
					{
						"text": "Flux yükünü 3 - 5 g/m² tutup çiy noktasını (Dew Point) <-40 °C altında nemden arındırılmış koruyucu azot altında fırınlayacağız.",
						"correct": true,
						"reward_text": "Mükemmel! Hassas toleransları mükemmel kavramışsınız. İşte milyon liralık havacılık özel siparişi!"
					},
					{
						"text": "Flux kullanmadan düz alüminyum eriteceğiz, çiy noktası oda sıcaklığıyla aynı kalabilir.",
						"correct": false,
						"reward_text": "Flux olmadan oksit çözülmez ve vakumda radyatör sızdırır. Üzgünüz, bu siparişi veremeyiz."
					}
				]
			}
	elif f_type == "gearbox":
		if is_midweek:
			active_questions["boss"] = {
				"sender": "👔 Patron Karahan",
				"text": "Şef, şanzıman mil komponentlerinde kullandığımız AISI 8620 çeliğinin ısıl işlem sementasyon derinliği kaç mm olmalıdır?",
				"options": [
					{
						"text": "Helisel dişli milleri için sementasyon derinliğini 0.8 - 1.2 mm aralığında tutup yüzey sertliğini 58-62 HRC yapacağız.",
						"correct": true,
						"reward_text": "Harika şef! Aşınma dayanımı için bu değerler tam isabet. Tebrikler.",
						"trust_change": 2
					},
					{
						"text": "Sertleşsin diye sadece fırına atıp kızartıyoruz, mm derinliğini ölçmüyoruz.",
						"correct": false,
						"reward_text": "Ölçmüyor muyuz? Rastgele üretim mi yapıyoruz şef! Güvenimi sarsıyorsun.",
						"trust_change": -2
					}
				]
			}
			active_questions["customer"] = {
				"sender": "💼 Müşteri (TCDD Hızlı Tren Grubu)",
				"text": "Hızlı tren lokomotifleri için dişli çark siparişi vereceğiz. Helisel dişli çarklarımızın azdırma aşamasındaki profil toleransı nedir?",
				"options": [
					{
						"text": "Azdırma tezgahında DIN 3962 standardına göre kalite sınıfı 6 hassasiyetinde profil toleransı sağlayacağız.",
						"correct": true,
						"reward_text": "İşte aradığımız standart! TCDD lokomotifleri için milyar liralık dişli grubu siparişimiz sizindir!"
					},
					{
						"text": "Toleransa gerek yok, montajda çekiçle oturtuyoruz, tıkır tıkır çalışır.",
						"correct": false,
						"reward_text": "Hızlı trende çekiçle montaj mı? Güvenlik riski alamayız. Görüşmemiz bitmiştir."
					}
				]
			}
		else: # Weekend
			active_questions["boss"] = {
				"sender": "👔 Patron Karahan",
				"text": "Şefim, temiz oda (Clean Room) montaj hattımızın partikül limit sınıfı nedir ve neden önemlidir?",
				"options": [
					{
						"text": "Akıllı dişli kutularının sızdırmazlığı ve hidrolik valf temizliği için ISO Class 7 temiz oda standartlarını uyguluyoruz.",
						"correct": true,
						"reward_text": "Doğru şef, elektro-hidrolik valflerde toz en büyük düşmandır. Titizliğin için teşekkürler.",
						"trust_change": 2
					},
					{
						"text": "Bizim atölye açık hava şefim, rüzgar estikçe tozlar temizleniyor zaten.",
						"correct": false,
						"reward_text": "Şaka mı yapıyorsun? Dişli kutularına toz kaçarsa hepsi kilitlenir! Kendine çeki düzen ver.",
						"trust_change": -2
					}
				]
			}
			active_questions["customer"] = {
				"sender": "💼 Müşteri (Savunma Sanayi Dişli Tedarikçisi)",
				"text": "Şanzıman montaj hattında döküm gövde sızdırmazlığını sağlamak için ne gibi test prosedürleriniz var?",
				"options": [
					{
						"text": "Montaj sonrası şanzıman yağ sızdırmazlığını helyum iz gazı sızıntı test cihazıyla 10^-5 mbar·l/s hassasiyetle test edeceğiz.",
						"correct": true,
						"reward_text": "Olağanüstü! Askeri standartlara tam uyum sağlıyorsunuz. Özel askeri şanzıman siparişini onaylıyorum!"
					},
					{
						"text": "İçine su doldurup dışarıdan sızıntı var mı diye gözle bakacağız.",
						"correct": false,
						"reward_text": "Su testiyle mikro sızıntılar bulunamaz. Askeri standartlarımıza uygun değilsiniz."
					}
				]
			}
	else: # armored
		if is_midweek:
			active_questions["boss"] = {
				"sender": "👔 Patron Karahan",
				"text": "Şef, zırh yan panellerinde kullandığımız Mil-A-46100 zırh çeliğinin kaynak sonrası Röntgen NDT (Tahribatsız Muayene) standardı nedir?",
				"options": [
					{
						"text": "Zırh kaynağında mikro çatlakları yakalamak için EN ISO 17636-1 Class B standardına göre röntgen çekip %100 NDT yapıyoruz.",
						"correct": true,
						"reward_text": "Harika şef, askeri gövdelerde kaynak kalitesi askerimizin can güvenliğidir. Çok iyi.",
						"trust_change": 2
					},
					{
						"text": "Gözle bakıyoruz şefim, kaynak kalın ve parlak duruyorsa sağlamdır diyoruz.",
						"correct": false,
						"reward_text": "Gözle kontrol mü? Zırhın arkasındaki kılcal çatlaklar füzeyle karşılaşınca patlar! Bu ne sorumsuzluk!",
						"trust_change": -2
					}
				]
			}
			active_questions["customer"] = {
				"sender": "💼 Müşteri (Kara Kuvvetleri Komutanlığı)",
				"text": "Yeni Taktik Tekerlekli Zırhlı Araç projemizin balistik camları için hangi seviye koruma standardı sağlayabilirsiniz?",
				"options": [
					{
						"text": "STANAG 4569 Level 3 koruma sınıfına uygun zırhlı balistik cam ve çerçeve entegrasyonu yapacağız.",
						"correct": true,
						"reward_text": "Tam da istediğimiz seviye. Ordumuzun yeni TTZA gövde üretim siparişi sizindir!"
					},
					{
						"text": "Sıradan oto camı üzerine film çekeceğiz şefim, maliyeti onda birine düşer.",
						"correct": false,
						"reward_text": "Bu askere ihanettir! Görüşme sonlandırılmıştır."
					}
				]
			}
		else: # Weekend
			active_questions["boss"] = {
				"sender": "👔 Patron Karahan",
				"text": "Şefim, balistik test atış kabul tünelimizin güvenlik duvarlarındaki kurşun zırh kaplama kalınlığı ne kadardır?",
				"options": [
					{
						"text": "Sekme ve radyasyon riskine karşı atış tüneli duvarlarını 50 mm kurşun plakalar ve 300 mm kalın betonla kaplıyoruz.",
						"correct": true,
						"reward_text": "Güvenlik standartlarına sadakatin harika şef. İş güvenliği bizim için her şeydir.",
						"trust_change": 2
					},
					{
						"text": "İnce sac panel çektik efendim, zaten kurşun sekmez oradan.",
						"correct": false,
						"reward_text": "Atış tünelinde sekme riski çok yüksektir! Sac panel kurşunu tutamaz. Tesisimizi kapatacak mısın?",
						"trust_change": -2
					}
				]
			}
			active_questions["customer"] = {
				"sender": "💼 Müşteri (Savunma Sanayii Başkanlığı)",
				"text": "SSB için üreteceğimiz taktik araç alt gövdesinde mayın koruması için hangi gövde geometrisini kullanacaksınız?",
				"options": [
					{
						"text": "Patlama enerjisini yanlara saptırmak için monoblok V-gövde sac yapısı ve pres bükümlü taban tasarımı kullanacağız.",
						"correct": true,
						"reward_text": "Harika! V-gövde geometrisi mayın dayanımı için tek çözümdür. 10 adet zırhlı araç gövdesi siparişini veriyorum!"
					},
					{
						"text": "Düz sac plaka kullanıp altına kauçuk döşeyeceğiz şefim, düz olunca daha konforlu sürülür.",
						"correct": false,
						"reward_text": "Düz taban mayın enerjisini doğrudan içeri alır ve askerlerimizi şehit eder. Sizinle çalışamayız."
					}
				]
			}

func _show_boss_question() -> void:
	var q = active_questions["boss"]
	_add_message(q["sender"], q["text"], false)
	
	# Add option buttons
	for i in range(q["options"].size()):
		var opt = q["options"][i]
		var btn = _create_option_btn("Cevap %s: %s" % [char(65 + i), opt["text"]], func():
			_on_boss_answered(opt)
		)
		options_container.add_child(btn)

func _on_boss_answered(opt: Dictionary) -> void:
	# Clear options
	for child in options_container.get_children():
		child.queue_free()
		
	# Show player reply in chat
	_add_message("👤 Siz (Şef)", opt["text"], true)
	
	# Apply trust change
	var trust_diff = opt["trust_change"]
	GameManager.modify_boss_trust(trust_diff)
	trust_status_label.text = "Patron Güveni: %d" % GameManager.boss_trust
	
	# Add Boss reaction after a short delay
	(func():
		var q = active_questions["boss"]
		_add_message(q["sender"], opt["reward_text"] + " (Patron Güveni: %+d)" % trust_diff, false)
		
		# Show continue button to transition to customer
		var next_btn = _create_option_btn("💼 Müşteri Temsilcisi ile Mesajlaşmaya Geç", func():
			_start_customer_phase()
		)
		options_container.add_child(next_btn)
	).call_deferred()

func _start_customer_phase() -> void:
	# Clear options
	for child in options_container.get_children():
		child.queue_free()
		
	var q = active_questions["customer"]
	_add_message(q["sender"], q["text"], false)
	
	# Add option buttons
	for i in range(q["options"].size()):
		var opt = q["options"][i]
		var btn = _create_option_btn("Cevap %s: %s" % [char(65 + i), opt["text"]], func():
			_on_customer_answered(opt)
		)
		options_container.add_child(btn)

func _on_customer_answered(opt: Dictionary) -> void:
	# Clear options
	for child in options_container.get_children():
		child.queue_free()
		
	# Show player reply
	_add_message("👤 Siz (Şef)", opt["text"], true)
	
	var success = opt["correct"]
	if success:
		_generate_special_order()
		
	# Add Customer reaction after delay
	(func():
		var q = active_questions["customer"]
		var order_log = "\n\n🚨 [color=green]ÖZEL SİPARİŞ KAZANILDI![/color] (Tablette Siparişler sekmesine eklendi.)" if success else ""
		_add_message(q["sender"], opt["reward_text"] + order_log, false)
		
		# Show close button
		var close_btn = _create_option_btn("❌ Toplantıyı Sonlandır ve Mesaiye Başla", func():
			_end_meeting()
		)
		options_container.add_child(close_btn)
	).call_deferred()

func _end_meeting() -> void:
	visible = false
	meeting_finished.emit()

func _generate_special_order() -> void:
	var f_type = GameManager.selected_factory_type
	var order_id = "ÖZEL_Sipariş_%s" % str(GameManager.completed_orders + GameManager.orders.size() + 1).pad_zeros(3)
	
	var special_order := {}
	
	if f_type == "radiator":
		special_order = {
			"id": order_id,
			"desc": "🚀 [ÖZEL] Havacılık ve Uzay Sanayii İçin Yüksek Verimli Radyatör Grubu",
			"story": "Milli Uzay Ajansı'nın uyduları için aşırı sıcaklık dalgalanmalarına dayanıklı, özel alaşımlı ve sızdırmazlığı %100 test edilmiş havacılık radyatörleri.",
			"due": 60,
			"reward": 2000000, # 2.0M
			"penalty": 300000,
			"designed": true,
			"rnd_days": 0,
			"blueprints": [
				{ "name": "Petek Core Üretimi", "stages": ["Petek Dokuma", "Fırınlama"], "need": 4, "dependencies": [], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 },
				{ "name": "Kazan Sac Gövdesi", "stages": ["Sac Kesim", "Büküm"], "need": 2, "dependencies": [], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 },
				{ "name": "Radyatör Montaj & Bitiş", "stages": ["Sert Lehim", "Sızdırmazlık", "Boya", "Montaj"], "need": 4, "dependencies": ["Petek Core Üretimi", "Kazan Sac Gövdesi"], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 }
			]
		}
	elif f_type == "gearbox":
		special_order = {
			"id": order_id,
			"desc": "🚀 [ÖZEL] Hızlı Tren Lokomotif Şanzıman Dişli Grubu",
			"story": "TCDD hızlı tren lokomotifleri için yüksek tork ve aşınma direncine sahip helisel dişli takımları ve sementasyon uygulanmış mil komponentleri.",
			"due": 80,
			"reward": 3000000, # 3.0M
			"penalty": 400000,
			"designed": true,
			"rnd_days": 0,
			"blueprints": [
				{ "name": "Mil Komponenti", "stages": ["Torna", "Isıl İşlem"], "need": 4, "dependencies": [], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 },
				{ "name": "Helisel Dişli Çark", "stages": ["Azdırma", "Isıl İşlem"], "need": 4, "dependencies": [], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 },
				{ "name": "Şanzıman Montaj Hattı", "stages": ["Taşlama", "Montaj", "Test"], "need": 4, "dependencies": ["Mil Komponenti", "Helisel Dişli Çark"], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 }
			]
		}
	else: # armored
		special_order = {
			"id": order_id,
			"desc": "🚀 [ÖZEL] Taktik Tekerlekli Zırhlı Araç (TTZA) Gövde İmalatı",
			"story": "Savunma Sanayii Başkanlığı için Mil-A-46100 zırh çeliğinden imal edilmiş, V-gövde yapısına ve balistik korumalı camlara sahip taktik gövde.",
			"due": 100,
			"reward": 5000000, # 5.0M
			"penalty": 600000,
			"designed": true,
			"rnd_days": 0,
			"blueprints": [
				{ "name": "Alt V-Gövde Sacı", "stages": ["Plazma Kesim", "Pres Büküm"], "need": 4, "dependencies": [], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 },
				{ "name": "Zırh Yan Paneller", "stages": ["Plazma Kesim", "Pres Büküm"], "need": 4, "dependencies": [], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 },
				{ "name": "Gövde Kaynak & Montaj", "stages": ["Zırh Kaynağı", "Röntgen NDT", "Montaj", "Atış Testi"], "need": 4, "dependencies": ["Alt V-Gövde Sacı", "Zırh Yan Paneller"], "workers": [], "done": false, "faulty": false, "progress": 0, "target_progress": 1000 }
			]
		}
		
	GameManager.orders.append(special_order)
	GameManager.add_log("🌟 Özel sipariş portföyünüze eklendi: %s" % special_order["desc"])
	EventBus.orders_updated.emit()

func _add_message(sender: String, text: String, is_player: bool) -> void:
	var bubble := PanelContainer.new()
	var bubble_style := StyleBoxFlat.new()
	
	if is_player:
		bubble_style.bg_color = Color(0.18, 0.44, 0.7, 0.8) # Player bubble (Neon blueish)
		bubble_style.border_width_right = 3
		bubble_style.border_color = Color(0.24, 0.82, 0.93)
		bubble.size_flags_horizontal = Control.SIZE_SHRINK_END
	else:
		bubble_style.bg_color = Color(0.11, 0.13, 0.17, 0.8) # Boss/Customer bubble (Dark grey)
		bubble_style.border_width_left = 3
		bubble_style.border_color = Color(0.95, 0.77, 0.25) if "Patron" in sender else Color(0.24, 0.81, 0.45)
		bubble.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
		
	bubble_style.corner_radius_top_left = 8
	bubble_style.corner_radius_top_right = 8
	bubble_style.corner_radius_bottom_right = 8
	bubble_style.corner_radius_bottom_left = 8
	bubble.add_theme_stylebox_override("panel", bubble_style)
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 12)
	margin.add_theme_constant_override("margin_right", 12)
	margin.add_theme_constant_override("margin_top", 8)
	margin.add_theme_constant_override("margin_bottom", 8)
	bubble.add_child(margin)
	
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	margin.add_child(vbox)
	
	var sender_lbl := Label.new()
	sender_lbl.text = sender
	sender_lbl.add_theme_font_size_override("font_size", 10)
	sender_lbl.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8))
	vbox.add_child(sender_lbl)
	
	var body_lbl := RichTextLabel.new()
	body_lbl.text = text
	body_lbl.bbcode_enabled = true
	body_lbl.fit_content = true
	body_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	body_lbl.add_theme_font_size_override("normal_font_size", 12)
	body_lbl.custom_minimum_size = Vector2(400, 0)
	vbox.add_child(body_lbl)
	
	chat_list.add_child(bubble)
	
	# Scroll to bottom dynamically
	(func(): if is_instance_valid(scroll_container): scroll_container.scroll_vertical = 99999).call_deferred()

func _create_option_btn(text: String, callback: Callable) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.custom_minimum_size = Vector2(0, 36)
	btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	btn.add_theme_font_size_override("font_size", 12)
	
	var style_normal := StyleBoxFlat.new()
	style_normal.bg_color = Color(0.12, 0.15, 0.20, 0.8)
	style_normal.border_width_left = 3
	style_normal.border_color = Color(0.4, 0.45, 0.5)
	style_normal.corner_radius_top_left = 6
	style_normal.corner_radius_top_right = 6
	style_normal.corner_radius_bottom_right = 6
	style_normal.corner_radius_bottom_left = 6
	btn.add_theme_stylebox_override("normal", style_normal)
	btn.add_theme_stylebox_override("focus", style_normal)
	
	var style_hover := StyleBoxFlat.new()
	style_hover.bg_color = Color(0.18, 0.22, 0.30, 0.95)
	style_hover.border_width_left = 4
	style_hover.border_color = Color(0.95, 0.77, 0.25)
	style_hover.corner_radius_top_left = 6
	style_hover.corner_radius_top_right = 6
	style_hover.corner_radius_bottom_right = 6
	style_hover.corner_radius_bottom_left = 6
	btn.add_theme_stylebox_override("hover", style_hover)
	btn.add_theme_stylebox_override("pressed", style_hover)
	
	btn.pressed.connect(callback)
	return btn
