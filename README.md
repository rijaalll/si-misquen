Si-Misquen 💰💸
Halo bro/sis! 👋 Ini dia aplikasi koperasi yang bikin transaksi simpan pinjam jadi lebih asyik. Dibangun pake teknologi kekinian: Next.js, dibootstrap pake create-next-app. Kita juga pake Tailwind CSS buat styling yang ngebut dan Firebase Realtime DB buat nyimpen data anti ribet.
Gaspol, Siapin Dulu! 🚀
Sebelum kita ngoding, pastiin lo udah punya:

Node.js (versi rekomendasi: sesuai package.json atau paling baru yang stabil)
npm/yarn/pnpm/bun (pilih salah satu yang paling lo suka!)
Firebase Project yang udah disetup (penting banget buat database-nya!)

FYI: Jangan lupa bikin file firebaseConfig.js di root project lo. Isinya kayak gini ya:
// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
  databaseURL: "YOUR_DATABASE_URL", // Ini penting banget buat Realtime Database
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };

Ganti YOUR_... itu sama credential Firebase project lo ya! Ini super duper penting biar aplikasi bisa nyambung ke database. Jangan sampai salah ketik!
Cara Install (Anti Pusing) 🛠️
Oke, sekarang waktunya install dependensi. Gampang banget kok:
npm install
# atau kalo lo anak yarn:
yarn install
# atau pnpm:
pnpm install
# atau bun (paling ngebut katanya):
bun install

Pilih satu aja ya, jangan maruk! 😂
Biar Keliatan di Browser (Ngeng!) 🏎️💨
Setelah semua dependensi keinstall, saatnya nyalain server development:
npm run dev
# atau
yarn dev
# atau
pnpm dev
# atau
bun dev

Abis itu, buka browser kesayangan lo dan ketik alamat ini: http://localhost:4321. Taraaa! Aplikasi koperasi lo udah nongol!
Lo bisa langsung cus ngedit-ngedit di app/page.js. Jangan khawatir, begitu lo save, perubahannya langsung update otomatis di browser. Mantap kan?
Kita juga udah pake next/font biar font-nya makin kece dan dioptimasi otomatis. Pake font Geist dari Vercel lho!
Pengguna Dummy (Buat Tes-tes) 🧪
Di project ini, ada beberapa user dummy buat lo coba-coba. Lo bisa intip di lib/dummyUser.json. Ini detailnya:



Username
Password
Role



admin
adminpassword
admin


miskin
miskin123
user


panjul
panjul123
teller


Catatan: Password di sini cuma buat demo ya! Di real world, jangan pernah nyimpen password plain text kayak gini. Bahaya bro!
Struktur Database (Biar Ngerti) 📊
Buat lo yang kepo sama struktur data di Firebase, kita udah siapin lib/dbStruct.json. Isinya kira-kira kayak gini:
[
  {
    "koperasi": {
      "user": {
        "(unique id)": {
          "id": "(unique id)",
          "userName": "(username)",
          "fullName": "(full name)",
          "password": "(password)",
          "role": "(admin, teller, user)",
          "detail": {
            // if role = teller or user
            "nik": "(nomor induk kependudukan)",
            "nkk": "(nomor kartu keluarga)",
            "hari": "(hari lahir)",
            "tanggal": "(tanggal lahir)",
            "bulan": "(bulan lahir)",
            "tahun": "(tahun lahir)",
            "gender": "laki-laki, perempuan dan other",
            "provinsi": "(provinsi)",
            "kota": "(kabupaten / kota)",
            "kecamatan": "(kecamatan)",
            "desa": "(desa)",
            "rw": "(rw)",
            "rt": "(rt)",
            "anggota": {
              // if role = user
              "pekerjaan": "(pekerjaan)",
              "pendapatan": "(pendapatan /bln)"
            }
          }
        }
      },
      "data": {
        "transaksi": {
          "simpan": {
            "(unique id)": {
              "userId": "(user id anggota)",
              "total": "(total saldo)",
              "detail": {
                "(unique id)": {
                  "status": "(tarik / simpan)",
                  "nominal": "(nominal transaksi jika status = simpan maka total saldo + nominal, jika status = tarik maka total saldo - nominal)",
                  "detail": {
                    "tanggal": "(tanggal transaksi)",
                    "bulan": "(bulan transaksi)",
                    "tahun": "(tahun transaksi)",
                    "jam": "(jam transaksi)"
                  }
                }
              }
            }
          },
          "pinjam": {
            "(unique id)": {
              "userId": "(user id anggota peminjam)",
              "total": "(jumlah pinjaman)",
              "status": "(pending, disetujui, ditolak)",
              "tenor": {
                "bulan": "(jumlah bulan tenor)",
                "bunga": "(bunga per bulan)"
              },
              "detail": {
                //misal tenor 3 bulan
                "(unique id bulan ke 1)": {
                  "status": "(belum bayar, sudah bayar)",
                  "totalTagihan": "(total tagihan hasil bagi total pinjaman + bunga per bulan)",
                  "tempo": {
                    "tanggal": "(tanggal tempo)",
                    "bulan": "(bulan tempo)",
                    "tahun": "(tahun tempo)"
                  }
                },
                "(unique id bulan ke 2)": {
                  "status": "(belum bayar, sudah bayar)",
                  "totalTagihan": "(total tagihan hasil bagi total pinjaman + bunga per bulan)",
                  "tempo": {
                    "tanggal": "(tanggal tempo)",
                    "bulan": "(bulan tempo)",
                    "tahun": "(tahun tempo)"
                  }
                },
                "(unique id bulan ke 3)": {
                  "status": "(belum bayar, sudah bayar)",
                  "totalTagihan": "(total tagihan hasil bagi total pinjaman + bunga per bulan)",
                  "tempo": {
                    "tanggal": "(tanggal tempo)",
                    "bulan": "(bulan tempo)",
                    "tahun": "(tahun tempo)"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
]

Belajar Lebih Lanjut (Biar Makin Jago) 🧠
Pengen lebih jago Next.js? Sikat aja resource di bawah ini:

Next.js Documentation - Pelajari fitur-fitur keren Next.js dan API-nya.
Learn Next.js - Tutorial interaktif buat lo yang suka belajar sambil praktik.

Jangan lupa cek juga the Next.js GitHub repository buat ngasih feedback atau kontribusi. Welcome banget!
Deploy ke Vercel (Biar Online Terus) ☁️
Cara paling gampang biar aplikasi lo online dan bisa diakses siapa aja itu pake Vercel Platform. Mereka ini yang bikin Next.js lho!
Cek Next.js deployment documentation buat panduan lebih lengkapnya.
Happy ngoding! Jangan lupa ngopi! ☕✨