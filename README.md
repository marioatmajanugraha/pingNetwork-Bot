# PingNetwork-Bot 🤖

Script ini digunakan untuk mengotomatiskan tugas di Ping Network, termasuk koneksi WebSocket, pengiriman ping otomatis.

![photo_2025-05-07_13-28-44](https://github.com/user-attachments/assets/0340451d-2bda-4738-9163-eef8e0d11be2)

---

## 📌 Fitur
- ✅ Koneksi WebSocket otomatis ke server Ping Network dengan retry hingga 10 kali jika gagal
- 🔄 Pengiriman ping otomatis setiap 60 detik untuk menjaga koneksi tetap aktif
- 📊 Pengiriman analytics event untuk melacak aktivitas koneksi
- 📝 Membaca `user_id` dan `device_id` dari file `ids.txt` dengan format `user_id|device_id`
- 📈 Menampilkan status poin (client points atau referral points) dalam tabel yang rapi

---

## 🚀 Cara Penggunaan

1. **Clone repository ini**
```sh
git clone https://github.com/marioatmajanugraha/pingNetwork-Bot.git
cd pingNetwork-Bot
```

---

2. **Install Dependencies**
```sh
npm install axios ws uuid user-agents cli-table3 chalk cfonts
```

---

3. **Siapkan file `ids.txt`**
   
- Buat file `ids.txt` di direktori proyek dan isi dengan `user_id` dan `device_id` dalam format berikut (satu baris):
```sh
user_id|device_id
```
Contoh:
```sh
50000|12e067f1-66ab-5274-a1d0-47244005129d
```

---

4. **Jalankan Script**
```sh
node index.js
```

Script akan otomatis:
- Membaca `user_id` dan `device_id` dari `ids.txt`
- Menghubungkan ke server WebSocket
- Mengirim ping secara berkala
- Menampilkan log aktivitas (koneksi, poin, error) dalam tabel

---

## ⚠️ Disclaimer
Gunakan script ini dengan bijak dan sesuai aturan Ping Network. 

Developer tidak bertanggung jawab atas penyalahgunaan atau konsekuensi seperti banned akun.

---

## 🤝 Kontribusi
Jika ingin berkontribusi, silakan fork repo ini dan ajukan pull request! Kami terbuka untuk ide baru, perbaikan bug, atau fitur tambahan.

---

## 📞 Kontak
Jika ada pertanyaan, hubungi: [@balveerxyz](https://t.me/balveerxyz)

Join channel Telegram gratis: [t.me/airdroplocked](https://t.me/airdroplocked)
