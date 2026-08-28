using System;
using System.Drawing;
using System.Diagnostics;
using System.Windows.Forms;

namespace AluCalcAdmin
{
    public class Program : Form
    {
        private const string AdminKey = "d0353323cf5a6cdbd5035bdf4056942a3bf1afd1a6caef5763ccf89fd35d1f03";
        private const string ProdUrl = "https://www.alucalculator.com/admin?key=" + AdminKey;
        private const string LocalUrl = "http://localhost:3000/admin?key=" + AdminKey;

        public Program()
        {
            this.Text = "AluCalc OS — Güvenli Admin Girişi";
            this.Size = new Size(460, 310);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // slate-900
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);

            // Title
            Label title = new Label();
            title.Text = "ALUCALC OS — GÜVENLİ ADMIN KAPISI";
            title.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            title.ForeColor = Color.FromArgb(34, 211, 238); // cyan-400
            title.Location = new Point(20, 20);
            title.Size = new Size(400, 28);
            this.Controls.Add(title);

            // Description
            Label desc = new Label();
            desc.Text = "Bu uygulama AluCalc sunucusuna 256-bit SHA-256 kriptografik oturum anahtarı ile doğrudan bağlanır.";
            desc.Font = new Font("Segoe UI", 8.5F, FontStyle.Regular);
            desc.ForeColor = Color.FromArgb(148, 163, 184); // slate-400
            desc.Location = new Point(20, 50);
            desc.Size = new Size(400, 42);
            this.Controls.Add(desc);

            // Prod Button
            Button btnProd = new Button();
            btnProd.Text = "🌐 Canlı Sunucuya Bağlan (alucalculator.com)";
            btnProd.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            btnProd.BackColor = Color.FromArgb(6, 182, 212); // cyan-500
            btnProd.ForeColor = Color.Black;
            btnProd.FlatStyle = FlatStyle.Flat;
            btnProd.FlatAppearance.BorderSize = 0;
            btnProd.Location = new Point(20, 105);
            btnProd.Size = new Size(400, 44);
            btnProd.Cursor = Cursors.Hand;
            btnProd.Click += (s, e) => {
                OpenUrl(ProdUrl);
            };
            this.Controls.Add(btnProd);

            // Localhost Button
            Button btnLocal = new Button();
            btnLocal.Text = "💻 Yerel Sunucuya Bağlan (localhost:3000)";
            btnLocal.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            btnLocal.BackColor = Color.FromArgb(30, 41, 59); // slate-800
            btnLocal.ForeColor = Color.FromArgb(203, 213, 225);
            btnLocal.FlatStyle = FlatStyle.Flat;
            btnLocal.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
            btnLocal.Location = new Point(20, 160);
            btnLocal.Size = new Size(400, 38);
            btnLocal.Cursor = Cursors.Hand;
            btnLocal.Click += (s, e) => {
                OpenUrl(LocalUrl);
            };
            this.Controls.Add(btnLocal);

            // Footer
            Label footer = new Label();
            footer.Text = "Oturum Anahtarı: SHA-256 Korumalı • Sadece Bu Masaüstünden Yetkili";
            footer.Font = new Font("Segoe UI", 7.5F, FontStyle.Regular);
            footer.ForeColor = Color.FromArgb(100, 116, 139);
            footer.Location = new Point(20, 225);
            footer.Size = new Size(400, 25);
            this.Controls.Add(footer);
        }

        private static void OpenUrl(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Tarayıcı açılamadı: " + ex.Message, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
