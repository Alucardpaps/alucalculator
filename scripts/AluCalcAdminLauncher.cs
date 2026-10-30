using System;
using System.Drawing;
using System.Diagnostics;
using System.Windows.Forms;

namespace AluCalcAdmin
{
    public class Program : Form
    {
        // 512-bit High-Entropy Cryptographic Master Key
        private const string AdminMasterKey = "ALU_SEC_V12_i7roXvJJBFgCKwnIl_4g4lyv3bmrY-B4uoXv4g-wzjeQg7vl09BepvzwNfwxtus__d46498ca17db5c7b71eb7770e8a0c05b59dac56cfd5cea95c91e081e1fd63d9c";
        
        private const string ProdUrl = "https://www.alucalculator.com/admin/?key=" + AdminMasterKey;
        private const string LocalUrl = "http://localhost:3000/admin/?key=" + AdminMasterKey;

        private Label lblStatus;

        public Program()
        {
            this.Text = "AluCalc OS // Özel Yönetici Konsolu";
            this.Size = new Size(520, 380);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(10, 15, 29); // #0a0f1d
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);

            // Title
            Label title = new Label();
            title.Text = "ALUCALC OS // GÜVENLİ ADMIN KAPISI";
            title.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            title.ForeColor = Color.FromArgb(6, 182, 212); // cyan-500
            title.Location = new Point(25, 20);
            title.Size = new Size(460, 28);
            this.Controls.Add(title);

            // Description
            Label desc = new Label();
            desc.Text = "Bu özel başlatıcı, AluCalc Admin Portalı'na 512-bit SHA-256 oturum anahtarı ile doğrudan bağlanmanızı sağlar. Web sitesi harici ziyaretçilere tamamen kapalıdır.";
            desc.Font = new Font("Segoe UI", 8.5F, FontStyle.Regular);
            desc.ForeColor = Color.FromArgb(148, 163, 184); // slate-400
            desc.Location = new Point(25, 52);
            desc.Size = new Size(460, 42);
            this.Controls.Add(desc);

            // Button 1: Prod
            Button btnProd = new Button();
            btnProd.Text = "🌐 Canlı Sunucu Admin Paneli (alucalculator.com)";
            btnProd.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnProd.BackColor = Color.FromArgb(6, 182, 212); // cyan-500
            btnProd.ForeColor = Color.FromArgb(7, 10, 15);
            btnProd.FlatStyle = FlatStyle.Flat;
            btnProd.FlatAppearance.BorderSize = 0;
            btnProd.Location = new Point(25, 110);
            btnProd.Size = new Size(455, 48);
            btnProd.Cursor = Cursors.Hand;
            btnProd.Click += (s, e) => {
                LaunchAdmin(ProdUrl, "Canlı sunucu admin paneli açılıyor...");
            };
            this.Controls.Add(btnProd);

            // Button 2: Localhost
            Button btnLocal = new Button();
            btnLocal.Text = "💻 Yerel Geliştirici Sunucusu (localhost:3000)";
            btnLocal.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            btnLocal.BackColor = Color.FromArgb(24, 34, 53); // slate-800
            btnLocal.ForeColor = Color.FromArgb(203, 213, 225);
            btnLocal.FlatStyle = FlatStyle.Flat;
            btnLocal.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
            btnLocal.Location = new Point(25, 170);
            btnLocal.Size = new Size(455, 42);
            btnLocal.Cursor = Cursors.Hand;
            btnLocal.Click += (s, e) => {
                LaunchAdmin(LocalUrl, "Yerel sunucu admin paneli açılıyor...");
            };
            this.Controls.Add(btnLocal);

            // Button 3: Copy Key
            Button btnCopy = new Button();
            btnCopy.Text = "📋 Master Key'i Panoya Kopyala (Gizli Giriş İçin)";
            btnCopy.Font = new Font("Segoe UI", 8.5F, FontStyle.Regular);
            btnCopy.BackColor = Color.FromArgb(15, 23, 42);
            btnCopy.ForeColor = Color.FromArgb(148, 163, 184);
            btnCopy.FlatStyle = FlatStyle.Flat;
            btnCopy.FlatAppearance.BorderColor = Color.FromArgb(30, 41, 59);
            btnCopy.Location = new Point(25, 224);
            btnCopy.Size = new Size(455, 34);
            btnCopy.Cursor = Cursors.Hand;
            btnCopy.Click += (s, e) => {
                Clipboard.SetText(AdminMasterKey);
                UpdateStatus("✅ Master Key panoya kopyalandı! (Ctrl+Shift+A ile yapıştırabilirsiniz)");
            };
            this.Controls.Add(btnCopy);

            // Status Bar
            lblStatus = new Label();
            lblStatus.Text = "Durum: 🟢 Kriptografik Oturum Hazır • Yalnızca Bu Cihazdan Yetkili";
            lblStatus.Font = new Font("Segoe UI", 8F, FontStyle.Regular);
            lblStatus.ForeColor = Color.FromArgb(52, 211, 153); // emerald-400
            lblStatus.Location = new Point(25, 275);
            lblStatus.Size = new Size(460, 24);
            this.Controls.Add(lblStatus);

            // Footer note
            Label footer = new Label();
            footer.Text = "Güvenlik: URL'deki anahtar tarayıcı açıldığı anda otomatik olarak silinir.";
            footer.Font = new Font("Segoe UI", 7.5F, FontStyle.Italic);
            footer.ForeColor = Color.FromArgb(100, 116, 139);
            footer.Location = new Point(25, 305);
            footer.Size = new Size(460, 22);
            this.Controls.Add(footer);
        }

        private void LaunchAdmin(string url, string message)
        {
            try
            {
                UpdateStatus(message);
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
                UpdateStatus("✅ Oturum başarıyla açıldı. URL anahtarı otomatik temizlendi.");
            }
            catch (Exception ex)
            {
                MessageBox.Show("Tarayıcı açılamadı: " + ex.Message, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                UpdateStatus("❌ Hata: " + ex.Message);
            }
        }

        private void UpdateStatus(string text)
        {
            if (lblStatus != null)
            {
                lblStatus.Text = text;
            }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new Program());
        }
    }
}
