# Devon — Foydalanuvchi qo'llanmasi

> Rivolanish intizom bilan!

---

> **Hujjat turi:** Foydalanuvchi qo'llanmasi
> **Auditoriya:** Oxirgi foydalanuvchilar va administratorlar
> **Til:** O'zbek (lotin yozuvi); rus va ingliz tillari v1.1 rejasida
> **Versiya:** Devon v1.0 demo
>
> Demo versiyasini onlayn ko'rish mumkin: [sardorallaberganov.github.io/devon-landing/dashboard/](https://sardorallaberganov.github.io/devon-landing/dashboard/)

---

## Kirish

Devon — o'zbek tashkilotlari uchun ichki hujjat aylanmasini raqamlashtiruvchi korporativ platforma. U qog'ozbop "soglasovaniya" jarayonlarini — kelishuv zanjirlarini, elektron raqamli imzoni (ERI), topshiriqlarni va rasmiy xat-xabarlarni — yagona, tekshiriladigan raqamli tizimga birlashtiradi. Davlat idoralari, davlat korxonalari, banklar, xoldinglar va 50 dan ortiq xodimga ega boshqa tashkilotlar uchun mo'ljallangan Devon barcha ma'lumotlarni ichki serverda saqlaydi — tashqi bulut xizmatlariga bog'liqlik yo'q.

Ushbu qo'llanma tizimga yangi kirayotgan xodimlar, bo'linma boshliqlar va super administratorlar uchun yozilgan. Har bir foydalanuvchi o'ziga tegishli bobni mustaqil o'qib, vazifalariga tayyor bo'lishi mumkin. Texnik bilim talab etilmaydi; qo'llanma faqat tizim bilan ishlash tartibini tushuntiradi.

Qo'llanma Devon'ning 8 ta moduli bo'yicha tuzilgan — har bir bob alohida modulga bag'ishlangan bo'lib, ichida vazifaga yo'naltirilgan "Qadamlar" ko'rsatmalari berilgan. Yangi atamalar bilan birinchi marta uchrashganingizda [Atamalar lug'ati](glossary.md) sahifasiga murojaat qiling.

---

### Belgilar

Qo'llanma bo'ylab to'rt xil eslatma qutisi ishlatiladi:

| Belgi | Nomi | Ma'nosi |
|---|---|---|
| **Eslatma** | Eslatma | Qo'shimcha ma'lumot yoki kontekst — harakatni o'zgartirmaydi, lekin tushunishni osonlashtiradi. |
| **Maslahat** | Maslahat | Foydali maslahat — ish tezligini oshirish yoki xatolardan qochish uchun tavsiyalar. |
| **Diqqat** | Diqqat | Ehtiyot bo'ling — qaytarib bo'lmaydigan yoki muhim amal. Avval o'qib, keyin bosing. |
| 🟡 **Simulyatsiya** | Simulyatsiya | Demo rejimida taqlid qilingan xususiyat. Haqiqiy tizimda o'rnatilgan integratsiyalar bilan ishlaydi. |

---

### Skrinshotlar haqida

Ushbu qo'llanmadagi barcha skrinshotlar `images/user-manual/` papkasida joylashgan vaqtinchalik tasvir-joylovchilardir. Operatorlar ularni jonli demo muhitiga qarshi suratga olib, tashkilotga xos ko'rinish bilan almashtiradi.

---

## Mundarija

- [Boshlash](#boshlash)
- [Foydalanuvchilar va profil](#foydalanuvchilar-va-profil)
- [Tarkibiy tuzilma](#tarkibiy-tuzilma)
- [Hujjatlarni boshqarish](#hujjatlarni-boshqarish)
- [Kelishuv jarayoni](#kelishuv-jarayoni)
- [Elektron raqamli imzo (ERI)](#elektron-raqamli-imzo-eri)
- [Vazifalar va topshiriqlar](#vazifalar-va-topshiriqlar)
- [Kiruvchi va chiquvchi xatlar](#kiruvchi-va-chiquvchi-xatlar)
- [Audit va xavfsizlik](#audit-va-xavfsizlik)
- [Demo rejimi](#demo-rejimi)
- [Ilova](#ilova)

---

## Boshlash

Ushbu bob Devon platformasini birinchi marta ishga tushiruvchi barcha foydalanuvchilar uchun: tizimga kirish, asosiy ekran bilan tanishish, rollar va bildirishnomalar.

---

### Tizimga kirish

Tizimga kirish uchun internet-brauzer va tashkilot tomonidan berilgan korporativ pochta manzili hamda parol kerak bo'ladi.

**Qadamlar:**

1. Brauzerda tashkilotingizning Devon manzilini oching (masalan, `https://devon.tashkilot.uz/`).
2. **Korporativ pochta** maydoniga email manzilingizni kiriting.
3. **Parol** maydoniga parolingizni kiriting.
4. **Kirish** tugmasini bosing.

> **Eslatma:** Demo tizimiga kirish uchun foydalaniladigan sinov ma'lumotlari [Demo rejimi](#demo-rejimi) bobida keltirilgan.

![Tizimga kirish ekrani](images/user-manual/login.png)

---

### Asosiy ekran bilan tanishish

Muvaffaqiyatli kirgandan so'ng Devon sizni asosiy ekranga yo'naltiradi. Ekran uch asosiy qismdan iborat.

**Yon panel (chap tomonda):**

Barcha sahifalarga o'tish uchun yon panel ishlatiladi. U ikki guruhga bo'lingan:

- **BOSHQARUV** guruhi: Bosh sahifa, Tarkibiy tuzilma, Xodimlar, ERI kalitlari, Audit jurnali.
- **HUJJAT AYLANMASI** guruhi: Hujjatlar, Kelishuvlar, Xatlar, Topshiriqlar.
- **SHAXSIY** bo'lim: Mening profilim.

**Yuqori panel (tepada):**

- Qidiruv maydoni — xodim, bo'linma yoki sertifikat bo'yicha qidirish uchun.
- Bildirishnomalar qo'ng'irog'i — o'qilmagan bildirishnomalar soni ko'rsatiladi.
- Foydalanuvchi menyusi — profil va tizimdan chiqish.

**Bosh sahifa:**

- Kirganingizda yuqorida "Salom, {{name}}!" ko'rinishdagi salomlashuv va "Bugun nima qilamiz?" sarlavhasi chiqadi.
- Statistika kartochkalari: **Faol xodimlar**, **Tarkibiy bo'linmalar**, **Faol ERI kalitlari**, **Kelishuv kutilmoqda**, **Hujjatlar**, **Muddati o'tgan xatlar**.
- **Tezkor harakatlar** bo'limi: Yangi xodim, Hujjat yaratish, Xat ro'yxatga olish, Tuzilmani boshqarish, ERI yuklash, Audit jurnali, Topshiriq berish.

![Asosiy ekran](images/user-manual/home.png)

---

### Rollar va ruxsatlar

Devon tizimida uchta asosiy rol mavjud:

- **Bosh administrator** (`Super Admin`) — tizimning to'liq boshqaruviga ega: tashkiliy tuzilmani sozlash, foydalanuvchilarni qo'shish va o'chirish, tizim konfiguratsiyasi.
- **Bo'linma rahbari** (`Department Head`) — o'z bo'linmasini boshqaradi, topshiriqlar beradi, kelishuv zanjirlarini boshlaydi va ularda ishtirok etadi, hujjatlarni imzolaydi.
- **Xodim** (`Employee`) — o'ziga biriktirilgan hujjatlar va topshiriqlarni ko'radi, natijalarni yuklaydi, kelishuv zanjirlari va imzolashda vakolatiga ko'ra ishtirok etadi.

Kirish huquqlari har bir hujjat va topshiriq darajasida tekshiriladi: xodim o'z bo'linmasidan tashqaridagi hujjatlarni ko'ra olmaydi, agar ularga alohida ruxsat berilmagan bo'lsa.

---

### Bildirishnomalar

Devon tizimidagi har qanday muhim o'zgarish — hujjat kelishuvga yuborilganda, topshiriq biriktirilganda yoki xat yo'naltirilganda — Bildirishnoma sifatida ko'rsatiladi.

**Qadamlar:**

1. Yuqori paneldagi **Bildirishnomalarni ochish** tugmasini (qo'ng'iroq belgisi) bosing — o'qilmagan bildirishnomalar soni ko'rsatiladi.
2. Ro'yxatda paydo bo'lgan bildirishnomalarni ko'ring.
3. Kerakli bildirishnomani bosing — u avtomatik ravishda tegishli hujjat, xat yoki topshiriq sahifasiga yo'naltiradi.
4. Barcha bildirishnomalarni o'qilgan deb belgilash uchun **Barchasini o'qilgan deb belgilash** tugmasini bosing.

> **Eslatma:** Bildirishnomalar joriy faol persona nomidan ko'rsatiladi. Demo rejimida turli foydalanuvchilar nomidan kirish imkoni mavjud — batafsil ma'lumot uchun [Demo rejimi](#demo-rejimi) bobiga qarang.

---

## Foydalanuvchilar va profil

Ushbu bob xodim profillarini yaratish, tahrirlash va boshqarish tartibini tushuntiradi: yangi xodimni ro'yxatga olishdan tortib boshqa bo'linmaga ko'chirishgacha va ishdan bo'shatishgacha.

---

### Yangi xodim yaratish

Yangi xodimni tizimga qo'shish kadrlar administratori yoki Super Admin tomonidan amalga oshiriladi. Bu to'rt bosqichli ro'yxatga olish sehrgari orqali bajariladi.

**Qadamlar:**

1. Yon paneldagi **Xodimlar** bo'limiga o'ting.
2. Sahifaning o'ng yuqori burchagidagi **Yangi xodim** tugmasini bosing — ro'yxatga olish sehrgari ochiladi.

**1-bosqich — Shaxsiy ma'lumotlar:**

3. **Familiya**, **Ism** va **Sharif** maydonlarini to'ldiring.
4. **Jinsi** ro'yxatidan xodimning jinsini tanlang (**Erkak** yoki **Ayol**).
5. **Tug'ilgan sanasi** maydoniga tug'ilgan sanani kiriting (xodim 18 yoshdan katta bo'lishi shart).
6. **JSHShIR** maydoniga 14 raqamli shaxsiy identifikatsiya raqamini kiriting — tizim raqam kiritilishi bilan takrorlanishni avtomatik tekshiradi (✓ yashil belgisi yoki ✗ xato belgisi chiqadi).
7. **Keyingisi** tugmasini bosing.

**2-bosqich — Aloqa:**

8. **Ish telefoni** va ixtiyoriy **Ichki raqam** maydonlarini to'ldiring.
9. **Mobil telefon** raqamini kiriting.
10. **Korporativ pochta** maydoniga `@devon.uz` bilan tugaydigan email manzilni kiriting — tizim takrorlanishni tekshiradi.
11. Ixtiyoriy ravishda **Shaxsiy pochta** ni kiriting.
12. **Keyingisi** tugmasini bosing.

**3-bosqich — Ish o'rni:**

13. **Tarkibiy bo'linma** ro'yxatidan bo'linmani tanlang (qidirish maydoni mavjud).
14. **Lavozim** ro'yxatidan xodimning lavozimini tanlang (bo'linma tanlanmasa maydoni faol bo'lmaydi).
15. **Ish turi** ro'yxatidan birini tanlang: **To'liq stavka**, **Yarim stavka**, **Shartnoma** yoki **Stajyor**.
16. **Ishga qabul sanasi** maydoniga xodimning rasmiy ish boshlagan sanasini kiriting.
17. **Tizimdagi roli** ni belgilang.
18. **Buyruqdan ko'chirma** maydonida **Fayl tanlash** tugmasini bosib, direktor tomonidan imzolangan ishga qabul qilish buyrug'ining tasdiqlangan ko'chirmasi faylini yuklang (PDF, JPG yoki PNG, maks. 10 MB).
19. **Lavozim yo'riqnomasi** maydonida **Fayl tanlash** tugmasini bosib, xodimning lavozim majburiyatlari yozilgan yo'riqnoma hujjati faylini yuklang (PDF, JPG yoki PNG, maks. 10 MB).
20. **Keyingisi** tugmasini bosing.

> **Diqqat:** **Buyruqdan ko'chirma** va **Lavozim yo'riqnomasi** — ikkalasi ham xodimni yaratishda majburiy hujjatlar ([Atamalar lug'ati](glossary.md) ga qarang). Ular yuklanmasa keyingi bosqichga o'tib bo'lmaydi.

**4-bosqich — Kirish ma'lumotlari:**

21. **Login** maydoni korporativ pochtadan avtomatik olinadi. Kerak bo'lsa qo'lda o'zgartiring.
22. **Parol** maydonida tizim tomonidan yaratilgan parolni ko'ring yoki **Yangi parol yaratish** tugmasini bosib yangi parol hosil qiling — parol kuchi ko'rsatkichi (juda zaif / zaif / o'rtacha / kuchli / juda kuchli) jonli yangilanadi.
23. Yangi xodimga login va parolni yuborish usulini belgilang: **SMS orqali yuborish** va/yoki **Email orqali yuborish**.

**Ko'rib chiqish:**

24. Barcha kiritilgan ma'lumotlarni ko'rib chiqing — xato bo'lsa tegishli bosqichga qaytib tahrirlang.
25. **Xodimni yaratish** tugmasini bosing — xodim tizimga muvaffaqiyatli qo'shiladi.

![Xodim yaratish sehrgari](images/user-manual/employee-wizard-step1.png)

---

### O'z profilini boshqarish

Tizimga kirgan har qanday foydalanuvchi o'z profil ma'lumotlarini boshqarishi mumkin. Profil sahifasiga yon panelning **SHAXSIY** bo'limidagi **Mening profilim** havolasini bosib o'tish mumkin.

Profil sahifasi uchta tabdan iborat:

- **Asosiy ma'lumotlar** — FIO, lavozim, bo'linma, telefon va pochta ma'lumotlari. Kadrlar administratori tomonidan kiritilgan o'zgarishlar darhol qo'llaniladi; oddiy xodim tomonidan yuborilgan o'zgarishlar so'rov sifatida kadrlar bo'limiga yo'naltiriladi.
- **Parolni o'zgartirish** — joriy va yangi parolni kiritib parolni yangilash.
- **Tahrirlash so'rovlari** — oddiy xodimlar yuborgan, hali kadrlar bo'limi tomonidan ko'rib chiqilmagan yoki ko'rib chiqilgan so'rovlar jurnali.

**Maydon tahrirlash qadamlari:**

1. **Asosiy ma'lumotlar** tabiga o'ting.
2. **Tahrirlash** tugmasini bosing — tahrirlash oynasi ochiladi.
3. **Mobil telefon** va/yoki **Shaxsiy pochta** maydonlarini yangilang.
4. **Saqlash** tugmasini bosing.
   - Agar siz kadrlar administratori bo'lsangiz: ma'lumotlar darhol yangilanadi.
   - Agar siz oddiy xodim bo'lsangiz: so'rov yuboriladi va **Tahrirlash so'rovlari** tabida **Kutilmoqda** holati bilan ko'rinadi.

**Parolni o'zgartirish qadamlari:**

1. **Parolni o'zgartirish** tabiga o'ting.
2. **Joriy parol** maydoniga amaldagi parolni kiriting.
3. **Yangi parol** maydoniga yangi parol kiriting. Yangi parol kamida 8 belgi, katta va kichik harf, raqam va maxsus belgini o'z ichiga olishi shart.
4. **Yangi parolni qaytaring** maydoniga yangi parolni yana kiriting.
5. **Parolni o'zgartirish** tugmasini bosing.

> **Maslahat:** Parolni birinchi kirishda o'zgartirishni tavsiya etamiz — tizim standart paroldan foydalanilayotgan bo'lsa bu haqda ogohlantiruvchi xabar ko'rsatadi.

![Profil sahifasi](images/user-manual/profile.png)

---

### Xodimni boshqa bo'linmaga o'tkazish

Xodimni boshqa bo'linmaga ko'chirish kadrlar administratori yoki Super Admin tomonidan amalga oshiriladi. Bu amal xodimning mavjud biriktirmasini o'zgartiradi yoki unga qo'shimcha biriktirma qo'shadi.

**Qadamlar:**

1. Yon paneldagi **Xodimlar** bo'limiga o'ting.
2. Ro'yxatdan kerakli xodimni topib uning profiliga o'ting.
3. Profil sahifasining o'ng yuqori qismidagi **Boshqa bo'linmaga ko'chirish** tugmasini bosing — ko'chirish sahifasi ochiladi.
4. **Yangi bo'linma** ro'yxatidan manzil bo'linmani tanlang.
5. **Yangi lavozim** ro'yxatidan yangi lavozimni tanlang.
6. **Ko'chirish sanasi** maydoniga xodimning yangi bo'linmada ish boshlash sanasini kiriting.
7. **Ish yuki** maydoniga ish yuki foizini kiriting (masalan, 100%).
8. **Biriktirma turi** ro'yxatidan birini tanlang: **Asosiy**, **Kombinatsiya**, **Vazifani bajaruvchi** yoki **Vaqtinchalik**.
9. Eski asosiy biriktirmani yopish kerak bo'lsa **Eski biriktirmani yopish** belgisini qo'ying.
10. Ixtiyoriy ravishda **Sabab yoki buyruq raqami** maydoniga izoh yoki buyruq raqamini kiriting (masalan: `25.05.2026 sonli buyruq`).
11. **Ko'chirishni saqlash** tugmasini bosing.

> **Eslatma:** Xodimning barcha faol biriktirmalari bo'yicha umumiy ish yuki 150% dan oshmasligi kerak. Tizim bu chegarani avtomatik tekshiradi va oshib ketsa saqlashni bloklaydi.

---

### Xodimni ishdan bo'shatish

Xodimni tizimdan o'chirish kadrlar administratori yoki Super Admin tomonidan amalga oshiriladi. Bu amalni bajarish uchun rasmiy hujjat talab qilinadi.

**Qadamlar:**

1. Yon paneldagi **Xodimlar** bo'limiga o'ting.
2. Ro'yxatdan kerakli xodimni topib uning profiliga o'ting.
3. Profil sahifasidagi **Ishdan bo'shatish** tugmasini bosing — tasdiqlash oynasi ochiladi.
4. **Ishdan bo'shatish buyrug'idan ko'chirma** maydonida **Fayl tanlash** tugmasini bosib, direktor tomonidan imzolangan ishdan bo'shatish buyrug'ining tasdiqlangan ko'chirmasi faylini yuklang (PDF, JPG yoki PNG, maks. 10 MB).
5. **Ha, bo'shatish** tugmasini bosib amalni tasdiqlang.

> **Diqqat:** Xodimni ishdan bo'shatish qaytarib bo'lmaydigan amal. Ishdan bo'shatish amalga oshirilishi bilan xodimning barcha faol ERI kalitlari avtomatik bekor qilinadi ([Elektron raqamli imzo (ERI)](#elektron-raqamli-imzo-eri) bobiga qarang). Ushbu amalni bajarishdan oldin to'g'ri xodim tanlanganiga ishonch hosil qiling.

---

## Tarkibiy tuzilma

Ushbu bo'lim Devon tizimida tashkilotning bo'linmalar tuzilmasini qanday boshqarish mumkinligini tushuntiradi.

### Bo'linmalarni boshqarish

Bo'linmalarni yaratish, tahrirlash va arxivlash **Super Admin** tomonidan amalga oshiriladi.

Devon tashkilotning to'rt bosqichli iyerarxiyasini to'liq modellashtiradi:

- **Departament** — eng yuqori daraja; odatda direktor yoki direktor o'rinbosari boshchiligidagi yirik tarkibiy birlik.
- **Boshqarma** — ikkinchi daraja; Departament tarkibiga kiradi. Boshqarma boshlig'i tomonidan boshqariladi.
- **Bo'lim** — uchinchi daraja; Boshqarma tarkibiga kiradi. Bo'lim boshlig'i tomonidan boshqariladi.
- **Sho'ba** — to'rtinchi (eng quyi) daraja; Bo'lim tarkibiga kiradi. Xodimlar bevosita Sho'baga biriktiriladi.

**Qadamlar:**

1. Yon paneldan **Tarkibiy tuzilma** bo'limiga o'ting.
2. Kerakli bo'linmani topish uchun yuqoridagi qidiruv maydoniga bo'linma nomi yoki kodi bo'yicha qidiring, yoki holatni filtrlash uchun filtrdan foydalaning.
3. Yangi bo'linma yaratish uchun **Yangi bo'linma** tugmasini bosing — bo'linma yaratish oynasi ochiladi.
4. Formani to'ldiring:
   - **Nomi** — bo'linmaning to'liq rasmiy nomi.
   - **Qisqartma** — qisqartirilgan nomi (ixtiyoriy).
   - **Ichki kod** — noyob identifikator; bo'sh qoldirsangiz tizim avtomatik yaratadi.
   - **Ota-bo'linma** — ushbu bo'linma qaysi bo'linma tarkibiga kirishini tanlang; eng yuqori darajadagi bo'linma uchun **Ildiz (ota yo'q)** ni tanlang.
   - **Turi** — bo'linma turini tanlang: **Departament**, **Boshqarma**, **Bo'lim** yoki **Sho'ba**.
5. **Saqlash** tugmasini bosing.

Mavjud bo'linmani tahrirlash uchun daraxtda bo'linmani toping va uning ustida paydo bo'luvchi **Tahrirlash** tugmasini bosing — xuddi shu forma ochiladi.

Bo'linmani arxivlash uchun bo'linmani toping va **Arxivlash** tugmasini bosing. Arxivlangan bo'linmalar ro'yxatda **Arxivlangan** holat bilan ko'rsatiladi va yangi xodim biriktirishga yopiladi.

![Tarkibiy tuzilma daraxti](images/user-manual/units-tree.png)

> **Eslatma:** Bo'linmani arxivlash uchun uning tarkibida **faol** (ishdan bo'shatilmagan) xodimlar bo'lmasligi kerak. Avval barcha xodimlarni boshqa bo'linmaga ko'chiring yoki ularni tizimdan chiqaring.

> **Diqqat:** Bo'linma **Turi** ota-bo'linma turiga mos kelishi shart — masalan, Sho'ba faqat Bo'lim ostiga joylashishi mumkin. Noto'g'ri kombinatsiyalarni tanlash mumkin emas: forma bunday holatda xatolik ko'rsatadi va saqlashni bloklaydi.

---

## Hujjatlarni boshqarish

Ushbu bo'lim Devon tizimida ichki hujjatlarni yaratish, ko'rish, yuborish va arxivlash jarayonlarini tushuntiradi.

### Shablon asosida hujjat yaratish

Departament boshlig'i yoki xodim standart shakllarga asoslangan hujjatlarni shablon orqali yaratadi. Bu usul tashkilot ichidagi rasmiy hujjatlarni tezda tayyorlash imkonini beradi.

**Qadamlar:**

1. Yon paneldagi **Hujjatlar** bo'limiga o'ting.
2. Sahifaning yuqori o'ng burchagidagi **Hujjat yaratish** tugmasini bosing — hujjat yaratish sehrgari ochiladi.

**1-bosqich — Turi:**

3. **Shablon asosida** variantini tanlang.
4. Galereyadagi shablonlar ro'yxatidan kerakli shablonni tanlang va **Keyingisi** tugmasini bosing.

**2-bosqich — Mazmun:**

5. **Sarlavha** maydoniga hujjat sarlavhasini kiriting.
6. **Kimga** maydonida hujjat kimga yo'naltirilishini ko'rsating.
7. **Kim imzolaydi** maydonidan imzolovchi xodimni tanlang. Agar bu maydon bo'sh qoldirilsa, ERI imzo talab qilinmaydi.
8. **Maxfiylik** ro'yxatidan maxfiylik darajasini tanlang: **Oddiy** yoki **Maxfiy**.
9. **Shablon maydonlari** bo'limida shablon uchun belgilangan barcha maydonlarni to'ldiring — o'ng tomondagi jonli **Hujjat ko'rinishi** maydonlar to'ldirilgan sari avtomatik yangilanib boradi.
10. **Keyingisi** tugmasini bosing.

**3-bosqich — Kelishuv varaqasi:**

11. Kelishuv varaqasini qanday shakllantirish haqida batafsil ma'lumot keyingi bobda keltirilgan. Ushbu bosqichni to'ldirib, **Keyingisi** tugmasini bosing.

**4-bosqich — Ko'rib chiqish:**

12. Barcha kiritilgan ma'lumotlarni tekshiring — turi, mazmun, qatnashchilar va yo'naltirish.

**Saqlash:**

13. **Qoralama sifatida saqlash** tugmasini bosib hujjatni qoralama holida saqlang.

> **Eslatma:** Har bir hujjatga avtomatik ravishda `HJ-2026/NNNN` ko'rinishidagi noyob raqam beriladi.

![Hujjat yaratish sehrgari](images/user-manual/document-wizard.png)

---

### Tayyor faylni yuklash

Tashqaridan tayyorlangan hujjatni (masalan, skanerlangan xat yoki Word faylini) tizimga biriktirish uchun ushbu usuldan foydalaning.

**Qadamlar:**

1. Yon paneldagi **Hujjatlar** bo'limiga o'ting.
2. **Hujjat yaratish** tugmasini bosing — hujjat yaratish sehrgari ochiladi.

**1-bosqich — Turi:**

3. **Tayyor faylni yuklash** variantini tanlang.
4. **Fayl tanlash** tugmasini bosib kompyuteringizdan fayl tanlang. Qabul qilinuvchi formatlar: PDF, DOC yoki DOCX; fayl hajmi 10 MB dan oshmasligi kerak.
5. **Keyingisi** tugmasini bosing va qolgan bosqichlarni to'ldiring.

---

### Hujjatni ko'rish, chop etish va PDF saqlash

Hujjat tafsilotlari sahifasida hujjatning A4 ko'rinishini to'liq ko'rish, chop etish yoki PDF sifatida saqlash mumkin.

**Qadamlar:**

1. Yon paneldagi **Hujjatlar** bo'limiga o'ting.
2. Ro'yxatdan kerakli hujjatni topib ustiga bosing — hujjat tafsilotlari sahifasi ochiladi.
3. Sahifaning o'ng tomonidagi hujjat ko'rinishida **Chop etish / PDF saqlash** tugmasini bosing.
4. Brauzer chop etish oynasi ochiladi — printerga yuborish yoki **PDF sifatida saqlash** variantini tanlang.

> 🟡 **Simulyatsiya:** DOCX (Word) formatida eksport demo rejimda mavjud emas; faqat ko'rinishning brauzer orqali chop etish va PDF saqlash imkoniyati ishlaydi.

---

### Hujjatni e-pochta orqali yuborish

Imzolangan yoki yopilgan hujjatni tashqi manzilga e-pochta orqali yuborish mumkin.

**Qadamlar:**

1. Yon paneldagi **Hujjatlar** bo'limiga o'ting.
2. Ro'yxatdan imzolangan yoki yopilgan hujjatni toping va ustiga bosing.
3. Hujjat tafsilotlari sahifasida **Emailga yuborish** tugmasini bosing — yuborish oynasi ochiladi.
4. **Email manzili** maydoniga qabul qiluvchining e-pochta manzilini kiriting.
5. **Yuborish** tugmasini bosing.

> 🟡 **Simulyatsiya:** Demo rejimda haqiqiy e-pochta xabari yuborilmaydi; amal muvaffaqiyatli bo'lganda faqat "Yuborildi (demo)" tasdiq xabari ko'rsatiladi.

---

### Arxiv

Imzolangan va yopilgan hujjatlar har kuni kun yakunida arxivga o'tkaziladi. Arxivdagi hujjatlar o'qish uchun ochiq qoladi, lekin faol ish to'plamidan ajratiladi.

Arxivga kirish uchun yon paneldagi **Hujjatlar** bo'limiga o'ting va sahifa yuqorisidagi **Arxiv** tabini tanlang. Hujjatlar arxivlangan sana bo'yicha guruhlanib ko'rsatiladi.

> 🟡 **Simulyatsiya:** Demo rejimda tungi rejalashtiruvchi ishlamaydi — hujjat imzolangan yoki yopilgan zahoti "arxivlangan" vaqt tamg'asi qo'yiladi va Arxiv tabida darhol ko'rinadi.

---

## Kelishuv jarayoni

Kelishuv jarayoni — hujjatni bir nechta mas'ul xodimlar tomonidan ketma-ket ko'rib chiqish va tasdiqlash mexanizmi. Devon an'anaviy qog'oz asosidagi "soglasovaniya"ni to'liq raqamli shaklga o'tkazadi: barcha qarorlar, izohlar va vaqt tamg'alari avtomatik saqlanadi.

---

### Hujjatni kelishuvga yuborish

Hujjat yaratuvchisi hujjatni kelishuvga yuborishdan oldin **Kelishuv varaqasi**ni shakllantiradi — ya'ni kelishuv ishtirokchilarini belgilaydi va ularning navbatini tartib bilan o'rnatadi.

**Qadamlar:**

1. Yon paneldagi **Hujjatlar** bo'limiga o'ting.
2. **Hujjat yaratish** tugmasini bosing — hujjat yaratish sehrgari ochiladi.
3. **1-bosqich (Turi)** va **2-bosqich (Mazmun)** bosqichlarini to'ldirib, **Keyingisi** tugmasini bosing.

**3-bosqich — Kelishuv varaqasi:**

4. **Kelishuv varaqasi kerakmi?** kalitini yoqing.
5. **Ishtirokchi qo'shish** tugmasini bosib, birinchi ishtirokchini tanlang. Kerakli sondagi ishtirokchilarni qo'shing.
6. Ishtirokchilar tartibini sozlash uchun har bir qator yonidagi **Yuqoriga ko'tarish** yoki **Pastga tushirish** tugmalaridan foydalaning. Ishtirokchini ro'yxatdan olib tashlash uchun **Ro'yxatdan olib tashlash** tugmasini bosing.
7. **Keyingisi** tugmasini bosing.

**4-bosqich — Ko'rib chiqish:**

8. Kiritilgan barcha ma'lumotlarni tekshiring.
9. **Kelishuvga yuborish** tugmasini bosing.

> **Eslatma:** Kelishuv ketma-ket boradi — navbatdagi ishtirokchi hujjatni faqat oldingi ishtirokchi o'z qarorini bildirgandan keyin ko'ra oladi. Ishtirokchilar navbat tartibida ro'yxatda ko'rsatilganidek ketma-ket qatnashadi.

Shuningdek, allaqachon qoralama holida saqlangan hujjatni kelishuvga yuborish mumkin: hujjat tafsilotlari sahifasini oching va **Kelishuvga yuborish** tugmasini bosing.

---

### Kelishuvda ishtirok etish

Navbat kelgan ishtirokchi **Kelishuvlar** navbatidan o'z hujjatlarini topadi va qaror bildiradi.

**Qadamlar:**

1. Yon paneldagi **Kelishuvlar** bo'limiga o'ting — navbatingizni kutayotgan hujjatlar ro'yxati ko'rsatiladi.
2. Kerakli hujjat qatorini bosing — hujjat tafsilotlari sahifasi ochiladi.
3. Hujjatni diqqat bilan o'qib chiqing.
4. Sahifaning o'ng tomonidagi amallar panelida quyidagi uchta variantdan birini tanlang:
   - **Tasdiqlash** — hujjatni izohsiz tasdiqlash.
   - **Izoh bilan tasdiqlash** — hujjatni tasdiqlab, izoh qoldirish.
   - **Rad etish** — hujjatni rad etish (bu holda izoh kiritish majburiy).
5. **Qarorni yuborish** tugmasini bosing.

> **Diqqat:** Rad etish hujjatning joriy kelishuv davrasini to'xtatadi. Hujjat yaratuvchiga qayta ishlash uchun qaytariladi va navbatdagi ishtirokchilar qaror bildira olmaydi — jarayon boshidan boshlanishi kerak.

![Kelishuvlar navbati](images/user-manual/approvals-queue.png)

---

### Kelishuv varaqasi va uning tarixi

Har bir ishtirokchi qaror bildirgan zahoti **Kelishuv varaqasi** avtomatik yangilanadi: qatnashchining ismi, qabul qilgan qarori (Kelishildi / Izoh bilan kelishildi / Rad etildi), izohi (mavjud bo'lsa) va vaqt tamg'asi saqlanadi.

Agar hujjat rad etilgan bo'lsa va yaratuvchi uni qayta ishlab, yana kelishuvga yuborsa, yangi davra boshlanadi. Oldingi davralarning yozuvlari o'chirilmaydi — hujjat tafsilotlari sahifasidagi **Kelishuv varaqasi** bo'limida davra tanlash imkoniyati orqali barcha o'tgan davralarni ko'rish mumkin.

---

### Hujjatni qayta ishlash

Hujjat rad etilganda yoki qoralama holida qolganda, yaratuvchi uni tahrirlaydi va qayta kelishuvga yuboradi.

**Qadamlar:**

1. Yon paneldagi **Hujjatlar** bo'limiga o'ting.
2. Rad etilgan yoki qoralama hujjatni topib, ustiga bosing — hujjat tafsilotlari sahifasi ochiladi.
3. Amallar panelida tahrirlash tugmasini bosing — hujjat yaratish sehrgari tahrirlash rejimida ochiladi.
4. Kerakli o'zgartirishlarni kiriting.
5. **Kelishuvga yuborish** tugmasini bosib, hujjatni qayta yuboring — bu yangi kelishuv davrasini boshlaydi.

> **Eslatma:** Faqat hujjat yaratuvchisi hujjatni tahrirlay oladi. Imzolangan hujjatni hech qachon tahrirlash mumkin emas — imzolangan hujjat o'zgartirishlardan himoyalangan.

---

## Elektron raqamli imzo (ERI)

ERI — Elektron Raqamli Imzo — O'zbekistonda qonuniy tan olingan elektron imzo standarti. Devon hujjatlarni ERI bilan imzolash va sertifikatlarni boshqarish imkonini beradi.

---

### Hujjatni ERI bilan imzolash

Tasdiqlangan hujjatning belgilangan imzolovchisi hujjatni ERI bilan imzolaydi. Imzo qo'yilgandan so'ng hujjat o'zgartirishlardan himoyalangan holga keladi.

**Qadamlar:**

1. Yon paneldagi **Hujjatlar** bo'limiga o'ting va tasdiqlangan hujjatni toping.
2. Hujjat qatorini bosing — hujjat tafsilotlari sahifasi ochiladi.
3. Amallar panelida **ERI bilan imzolash** tugmasini bosing — imzolash oynasi ochiladi.
4. Faol sertifikatlar ro'yxatidan kerakli sertifikatni tanlang.
5. **PIN-kod** maydoniga 6 xonali PIN-kodni kiriting.
6. **Imzolash** tugmasini bosing.

> 🟡 **Simulyatsiya:** Demo rejimda E-IMZO bilan taxminan 1,5 soniyalik simulyatsiya o'tkaziladi — haqiqiy E-IMZO plagini ishlatilmaydi.

> **Eslatma:** Imzo qo'yilgandan so'ng voqea **Imzolar tarixi** bo'limiga yoziladi: imzolovchining ismi, sertifikat ma'lumotlari va vaqt tamg'asi saqlanadi.

![Hujjatni imzolash](images/user-manual/document-sign.png)

---

### ERI sertifikatlarini boshqarish

**ERI sertifikatlari** sahifasi barcha xodimlarning sertifikatlarini kanban ko'rinishida ko'rsatadi. Har bir ustun sertifikatning joriy holatini bildiradi:

| Ustun | Tavsif |
|---|---|
| **Tasdiqlash kutilmoqda** | Yangi yuklangan, lekin hali tasdiqlanmagan sertifikatlar |
| **Faol** | Tasdiqlangan va amal qilish muddati o'tmagan sertifikatlar |
| **Muddati tugagan** | Amal qilish muddati o'tgan sertifikatlar |
| **Bekor qilingan** | Bekor qilingan sertifikatlar |

**Yangi ERI sertifikatini yuklash:**

1. Yon paneldagi **ERI kalitlari** bo'limiga o'ting.
2. Sahifa yuqorisidagi **Yangi ERI yuklash** tugmasini bosing — yuklash sahifasi ochiladi.
3. **Sertifikat egasini tanlang** bosqichida kerakli xodimni tanlang.
4. **PFX faylni tanlang** bosqichida **Fayl tanlash** tugmasini bosib, xodimning PFX yoki P12 faylini tanlang.
5. **Fayl parolini kiriting** bosqichida faylning parolini kiriting.
6. **Faylni o'qish** tugmasini bosing — sertifikat ma'lumotlari o'qib olinadi.
7. **Ma'lumotlarni tasdiqlang** bosqichida ko'rsatilgan ma'lumotlarni (egasi, sertifikat markazi, amal qilish muddati, sertifikat turi) tekshiring.
8. **Sertifikatni saqlash** tugmasini bosing.

> 🟡 **Simulyatsiya:** Demo rejimda PFX faylni o'qish simulyatsiya qilinadi — fayl paroli serverga uzatilmaydi va haqiqiy kriptografik tahlil amalga oshirilmaydi.

**Sertifikatni tasdiqlash yoki rad etish:**

Tasdiqlash kutilmoqda ustunidagi sertifikatni bosing — tafsilotlar paneli ochiladi. **Tasdiqlash** tugmasini bosib sertifikatni faollashtiring, yoki **Rad etish** tugmasini bosib sabab kiriting. Bir nechta sertifikatni bir vaqtda tasdiqlash uchun ularni belgilang va **Tanlanganlarni tasdiqlash** tugmasini bosing.

**Faol sertifikatni bekor qilish:**

Faol ustunidagi sertifikatni bosing va **Bekor qilish** tugmasini tanlang. Bekor qilish sababini ko'rsating (**Muddati tugadi** / **Buzilgan kalit** / **Almashtirildi** / **Qo'lda bekor qilingan**), so'ng **Ha, bekor qiling** tugmasini bosing. Bekor qilingandan keyin sertifikatni qaytarib bo'lmaydi.

> **Diqqat:** Xodim ishdan bo'shatilganda uning barcha faol ERI sertifikatlari avtomatik ravishda bekor qilinadi.

---

## Vazifalar va topshiriqlar

Vazifalar va topshiriqlar moduli rahbar tomonidan bo'linma xodimiga rasmiy topshiriq berish, ijrochi tomonidan natijani topshirish va rahbarning natijani ko'rib chiqish jarayonlarini boshqaradi. Barcha topshiriqlar to'rtta ustunli **Vazifa doskasi** orqali kuzatiladi.

---

### Topshiriq berish

Topshiriq berish huquqi **Bo'lim boshlig'i** va **Rahbar** rollariga tegishli xodimlarga berilgan. Topshiriq faqat o'z bo'linmasi ichidagi xodimlarga berilishi mumkin.

**Qadamlar:**

1. Yon paneldagi **Topshiriqlar** bo'limiga o'ting — Vazifa doskasi ochiladi.
2. Sahifa yuqorisidagi **Yangi topshiriq** tugmasini bosing — topshiriq yaratish sahifasi ochiladi.
3. Quyidagi maydonlarni to'ldiring:
   - **Sarlavha** — topshiriqning qisqa nomi.
   - **Tavsif** — topshiriq mazmunini batafsil yozing.
   - **Muhimlik darajasi** — uchta variantdan birini tanlang: **Yuqori**, **O'rta** yoki **Oddiy**.
   - **Ijrochi** — ro'yxatdan o'z bo'linmangizdagi xodimni tanlang.
   - **Muddat** — topshiriqni bajarish muddatini belgilang.
   - **Fayl ilova (ixtiyoriy)** — zarur bo'lsa qo'shimcha fayl birikting (PDF, JPG yoki PNG, 10 MB gacha).
4. **Yaratish** tugmasini bosing.

> **Eslatma:** Har bir yangi topshiriqqa avtomatik raqam beriladi, masalan: `TOP-2026/0001`. Bu raqam orqali topshiriqni tezda qidirib topish mumkin.

> **Diqqat:** Ijrochi sifatida faqat o'z bo'linmangiz ichidagi xodimlarni tanlash mumkin. Boshqa bo'linma xodimiga topshiriq berish tizim tomonidan cheklab qo'yilgan.

![Topshiriq berish](images/user-manual/task-create.png)

---

### Topshiriqni bajarish va natijani topshirish

Ijrochi biriktirilgan topshiriqni ochib, ishni boshlaydi va bajargan ishini natija sifatida topshiradi.

**Qadamlar:**

1. Yon paneldagi **Topshiriqlar** bo'limiga o'ting va **Menga biriktirilgan** ko'rinishini tanlang.
2. Kerakli topshiriqni bosing — topshiriq tafsilotlari sahifasi ochiladi.
3. Amallar panelida **Boshlash** tugmasini bosing — topshiriq holati **Yangi** dan **Ijroda** ga o'tadi.
4. Ishni bajaring.
5. Natijani topshirish uchun **Topshirish** tugmasini bosing — **Ijroni topshirish** oynasi ochiladi:
   - **Bajarilgan ish bayoni** maydoniga nima qilinganini qisqacha yozing (majburiy).
   - **Ilova turi** bo'limida quyidagilardan birini tanlang:
     - **Fayl yuklash** — natija faylini birikting (PDF, JPG yoki PNG, 10 MB gacha).
     - **Hujjatni biriktirish** — Devon tizimidagi hujjatni tanlang.
     - **Ilovasiz** — yozma bayon bilan topshirish (tasdiqlash talab etiladi).
6. **Topshirish** tugmasini bosing — topshiriq holati **Ko'rib chiqilmoqda** ga o'tadi va rahbarga xabar yuboriladi.

Topshiriq bo'yicha savollaringiz bo'lsa, topshiriq tafsilotlari sahifasidagi **Izoh so'rash** tugmasidan foydalaning. Rahbar javob berganida xabar keladi va siz **Javob berish** orqali muhokamani davom ettirishingiz mumkin.

---

### Natijani ko'rib chiqish

Topshiriq beruvchi ijrochi topshirgan natijani ko'rib chiqadi va qaror qabul qiladi.

**Qadamlar:**

1. Yon paneldagi **Topshiriqlar** bo'limiga o'ting va **Men bergan** ko'rinishini tanlang.
2. **Ko'rib chiqilmoqda** ustunidagi topshiriqni bosing — topshiriq tafsilotlari sahifasi ochiladi.
3. Ijrochi topshirgan **Ijro natijasi** va **Bajarilgan ish bayoni** ni ko'rib chiqing.
4. Amallar panelida **Ijroni ko'rib chiqish** tugmasini bosing — **Ijroni ko'rib chiqish** oynasi ochiladi.
5. Quyidagi to'rtta variantdan birini tanlang:

   | Qaror | Ta'siri |
   |---|---|
   | **Qabul qilish** | Topshiriq bajarilgan deb belgilanadi va **Bajarildi** ustuniga o'tadi. |
   | **Izoh bilan qabul qilish** | Qabul qilinadi; izoh ijrochiga yetkaziladi. |
   | **Qayta ishlashga qaytarish** | Ijrochi qayta ishlashi uchun qaytariladi (sabab kiritish majburiy). |
   | **Rad etish** | Topshiriq yakuniy rad etiladi (sabab kiritish majburiy). |

6. **Tasdiqlash** tugmasini bosing.

> **Eslatma:** **Qayta ishlashga qaytarish** tanlanganda topshiriqning "Tur" ko'rsatkichi bir birlikka oshadi va topshiriq ijrochiga qayta yuboriladi. Ijrochi yangi natijani topshirgach, jarayon yana **Ko'rib chiqilmoqda** bosqichidan davom etadi.

---

### Vazifa doskasi va statistika

**Vazifa doskasi** topshiriqlarni to'rtta ustunda ko'rsatadi:

| Ustun | Ma'nosi |
|---|---|
| **Yangi** | Biriktirilgan, lekin hali boshlanmagan topshiriqlar. |
| **Ijroda** | Ijrochi tomonidan boshlangan va bajarilayotgan topshiriqlar. |
| **Ko'rib chiqilmoqda** | Ijrochi natijani topshirgan, rahbar ko'rib chiqishi kutilmoqda. |
| **Bajarildi** | Qabul qilingan topshiriqlar. Rad etilgan topshiriqlar ham shu ustunda ko'rsatiladi — ular **Rad etilgan** belgisi bilan ajratiladi. |

Ish stoli qurilmasida topshiriq kartasini bir ustundan boshqasiga sudrab ko'chirishingiz mumkin — bu holat o'zgarishini qayd etadi.

Sahifaning yuqori qismida **Statistika** paneli mavjud (faqat rahbarlar uchun). Unda quyidagi ma'lumotlar ko'rsatiladi:

- Har bir holatdagi topshiriqlar soni.
- **Muddati o'tgan** topshiriqlar soni.
- Xodimlar bo'yicha **Yuklama** — har bir ijrochiga nechta faol topshiriq biriktirilgani.

> **Eslatma:** Demo versiyada statistika panelida asosiy ko'rsatkichlar (soni, muddati o'tganlar, yuklama) mavjud. Kengaytirilgan hisobot va grafiklar Devon v1.0 demo versiyasiga kirmaydi.

> **Maslahat:** Mobil qurilmada Vazifa doskasi bir ustunli ko'rinishga o'tadi — bir vaqtda faqat bitta holat ustuni ko'rsatiladi. Ustunlar orasida almashtirish uchun yuqoridagi holat tugmalaridan foydalaning.

---

## Kiruvchi va chiquvchi xatlar

Ushbu bo'lim tashkilotning rasmiy yozishmalarini — Devonxona orqali kiritiladigan kiruvchi xatlar va jo'natiladigan chiquvchi xatlarni — boshqarish tartibini tushuntiradi.

---

### Kiruvchi xatni ro'yxatga olish

Kiruvchi xatni ro'yxatga olish Devonxona xodimi tomonidan amalga oshiriladi. Ro'yxatga olingan xat keyingi bosqichlarda rahbar va ijrochilarga yo'naltiriladi.

**Qadamlar:**

1. Yon paneldagi **Xatlar** bo'limiga o'ting — **Kiruvchi va chiquvchi yozishmalar reestri** sahifasi ochiladi.
2. Sahifa yuqori qismidagi **Xat ro'yxatga olish** tugmasini bosing.
3. Ochilgan sahifada quyidagi maydonlarni to'ldiring:

   | Maydon | Izoh |
   |---|---|
   | **Yuboruvchi tashkilot** | Xatni yuborgan tashkilotning nomi (masalan: Toshkent shahar hokimligi) |
   | **Mavzu** | Xatning qisqacha mazmuni |
   | **Kelish kanali** | Qabul qilish usuli: **Pochta**, **Elektron pochta**, **Kuryer** yoki **Qog'oz (qo'lda)** |
   | **Kelgan sana** | Xat qabul qilingan sana |
   | **Ijro muddati** | Javob tayyorlash muddati (ixtiyoriy) |
   | **Javobga rahbar imzosi talab qilinadi** | Zarur bo'lsa belgilang |
   | **Skan nusxasi** | Xatning skanerlangan nusxasi (PDF, JPG yoki PNG, 10 MB gacha; ixtiyoriy) |

4. **Ro'yxatga olish** tugmasini bosing.

> **Eslatma:** Har bir kiruvchi xatga avtomatik raqam beriladi, masalan: `K-2026/0001`. Bu raqam orqali xatni reestrdagi **Raqam, tashkilot yoki mavzu bo'yicha qidirish** maydoni yordamida tezda topish mumkin.

![Xat ro'yxatga olish](images/user-manual/letter-register.png)

---

### Xatni yo'naltirish va ijrochi tayinlash

Ro'yxatga olingan xat rahbar tomonidan mas'ul bo'linmaga **Yo'naltirish** qilinadi. So'ngra bo'linma boshlig'i o'z xodimlari ichidan **Ijrochi** tayinlaydi.

**Qadamlar:**

1. Yon paneldagi **Xatlar** bo'limiga o'ting va kerakli xatni bosing — xat tafsilotlari sahifasi ochiladi.
2. **Rahbar** sifatida amallar panelidagi **Bo'linmaga yo'naltirish** tugmasini bosing.
3. **Bo'linma** maydonidan mas'ul bo'linmani tanlang va **Yo'naltirish** tugmasini bosing — xat bo'linmaga yo'naltirildi deb belgilanadi.
4. **Bo'lim boshlig'i** sifatida xat tafsilotlari sahifasiga o'ting va amallar panelidagi **Ijrochi tayinlash** tugmasini bosing.
5. **Ijrochi** maydonidan o'z bo'linmangiz xodimlaridan birini tanlang va **Tayinlash** tugmasini bosing.

> **Eslatma:** Ijrochi sifatida faqat mas'ul bo'linma ichidagi xodimlarni tanlash mumkin. Boshqa bo'linma xodimiga tayinlash tizim tomonidan cheklab qo'yilgan.

---

### Xatga javob tayyorlash

Tayinlangan **Ijrochi** xatni ko'rib chiqadi va javob tayyorlaydi. Javob bo'linma boshlig'i tomonidan qabul qilinadi; agar rahbar imzosi talab etilgan bo'lsa, rahbar javobni ERI bilan imzolaydi.

**Qadamlar:**

1. Yon paneldagi **Xatlar** bo'limiga o'ting va sizga tayinlangan xatni bosing.
2. Amallar panelidagi **Ijroni boshlash** tugmasini bosing — ijro jarayoni boshlanadi.
3. Javob tayyor bo'lgach, **Ijroni topshirish** tugmasini bosing — **Ijroni topshirish** oynasi ochiladi:
   - Javob turini tanlang:
     - **Javob xati biriktirish** — tayyor javob faylini yuklang (PDF yoki DOC) yoki Devon tizimidagi hujjatni tanlang.
     - **Izoh bilan yakunlash** — rasmiy javob xati talab etilmasa, ijro izohini kiriting.
   - **Topshirish** tugmasini bosing.
4. **Bo'lim boshlig'i** amallar panelidagi **Ijroni qabul qilish** tugmasini bosing va qabul qilish variantini tanlang.
5. Agar **Javobga rahbar imzosi talab qilinadi** belgilangan bo'lsa, **Rahbar** amallar panelidagi **ERI bilan imzolash** tugmasini bosib, javobni raqamli imzo bilan tasdiqlaydi.

---

### Chiquvchi xatni jo'natish

Imzolangan (yoki qabul qilingan) javob xatini jo'natish Devonxona tomonidan amalga oshiriladi.

**Qadamlar:**

1. Xat tafsilotlari sahifasiga o'ting.
2. Amallar panelidagi **Jo'natish va ro'yxatga olish** tugmasini bosing — **Javobni jo'natish** oynasi ochiladi.
3. **Jo'natish kanali** ni tanlang (masalan: **Elektron pochta**, **Kuryer** va boshqalar).
4. **Jo'natish** tugmasini bosing.

Jarayon yakunida avtomatik ravishda bog'liq chiquvchi xat yaratiladi va unga `CH-2026/0001` ko'rinishidagi raqam beriladi; asl kiruvchi xat yopiladi va arxivlanadi.

> **Eslatma:** Muddati o'tgan xatlar reestrdagi **Muddat** ustunida ogohlantiruv belgisi (ikon va **Muddati o'tgan** yorlig'i) bilan ajratib ko'rsatiladi — bu holat faqat rangga emas, belgi va matn yorlig'iga ham tayanadi.

---

## Audit va xavfsizlik

Ushbu bo'lim Devon tizimdagi barcha o'zgarishlarni qanday kuzatib borishini va hujjatlar hamda ma'lumotlar himoyasini qanday ta'minlashini tushuntiradi.

---

### Audit jurnalini o'qish

**Audit jurnali** — tizimdagi barcha muhim harakatlarning to'liq tarixini saqlaydi. Har bir yozuv kim, nima qilgani, qachon va qaysi resursda amalga oshirgani haqida ma'lumot beradi; tegishli hollarda maydon darajasidagi o'zgarishlar ham ko'rsatiladi.

**Qadamlar:**

1. Yon paneldagi **Audit jurnali** bo'limiga o'ting — **Audit jurnali** sahifasi ochiladi (sarlavha: *Tizimdagi barcha o'zgarishlar tarixi*).
2. Kerakli yozuvlarni topish uchun filtrlardan foydalaning:

   | Filtr | Izoh |
   |---|---|
   | **Resurs turi** | Qaysi turdagi ob'ekt: **Hujjat**, **Xat**, **Xodim**, **Bo'linma** va boshqalar |
   | **Aktor** | Harakatni amalga oshirgan foydalanuvchi |
   | **Sanadan** / **Sanagacha** | Vaqt oralig'ini cheklash uchun |

3. Filtrlarni bekor qilish uchun **Filtrlarni tozalash** tugmasini bosing.
4. Jadval quyidagi ustunlarni ko'rsatadi:

   | Ustun | Mazmun |
   |---|---|
   | **Vaqt** | Harakat amalga oshirilgan sana va vaqt |
   | **Aktor** | Harakatni bajargan foydalanuvchi |
   | **Harakat** | Bajarilgan amal (masalan: *hujjat yaratdi*, *hujjatni imzoladi*) |
   | **Resurs** | Harakat qaysi ob'ektga tegishli ekanligi |
   | **Tafsilot** | Maydon darajasidagi o'zgarishlar (eski qiymat → yangi qiymat) |

> **Eslatma:** Alohida hujjat yoki xatning o'z tarixini ko'rish uchun tafsilotlar sahifasini oching — u yerda ham o'sha resursga tegishli barcha audit yozuvlari ko'rsatiladi.

![Audit jurnali](images/user-manual/audit-log.png)

---

### Imzolangan hujjatlar himoyasi

Hujjat ERI bilan imzolangandan so'ng unga hech qanday rol tomonidan o'chirish yoki yashirin ravishda o'zgartirish amali bajarilishi mumkin emas — bu Super Admin uchun ham amal qiladi. Imzolangan hujjatda keyinchalik yuzaga keladigan har qanday holat o'zgarishi avtomatik ravishda **Audit jurnali**da qayd etiladi va to'liq iz saqlanadi.

> **Diqqat:** Imzolangan hujjatni o'chirib bo'lmaydi. Agar hujjat bekor qilinishi kerak bo'lsa, tegishli ish jarayonini boshqaruvchi xodim bilan bog'laning.

---

### Maxfiylik va ruxsatlar

Devon tizimdagi ruxsatlar har bir hujjat va har bir topshiriq uchun alohida tekshiriladi. Xodim faqat o'z bo'linmasiga tegishli yoki unga maxsus ulashilgan hujjatlar va topshiriqlarnigina ko'ra oladi; boshqa bo'linmaning hujjatlariga kirish huquqi avtomatik ravishda tizim tomonidan cheklanadi — bu faqat interfeys darajasida emas, tizimning ichki qoidalari orqali ta'minlanadi.

**Audit yozuvlari** to'liq himoyalangan: ularni hech kim — Super Admin ham — tahrir qila olmaydi yoki o'chira olmaydi. Bu Devon'ning auditga yaroqlilik kafolatidir.

---

## Demo rejimi

Devon-ning demo versiyasi tizimni haqiqiy server va ma'lumotlarsiz sinab ko'rish imkonini beradi. Barcha ma'lumotlar oldindan to'ldirilgan (soxta) ma'lumotlar bo'lib, o'zgarishlar faqat brauzeringizda saqlanadi.

---

### Demo haqida

Bu — namoyish versiyasi. Haqiqiy server yo'q; tizimga kiritilgan barcha o'zgarishlar faqat brauzeringizda saqlanadi va sahifa yangilanganidan so'ng yoki demo qayta tiklangandan so'ng yo'qoladi. Barcha hujjatlar, xatlar, topshiriqlar va xodimlar ma'lumotlari oldindan to'ldirilgan namunaviy ma'lumotlardir — ular haqiqiy tashkilotni aks ettirmaydi.

---

### Kirish ma'lumotlari

Demo versiyasiga kirish uchun quyidagi ma'lumotlardan foydalaning (ular kirish sahifasida ham ko'rsatilgan):

| Maydon | Qiymat |
|---|---|
| **Elektron pochta** | `admin@devon.uz` |
| **Parol** | `Demo2026!` |

---

### Rol almashtirish

Demo rejimida turli ishtirokchilar nuqtai nazaridan tizimni sinab ko'rish uchun **Rol almashtirish** xususiyatidan foydalaning.

**Qadamlar:**

1. Ekranning yuqori o'ng burchagidagi foydalanuvchi menyusini oching.
2. **Rol almashtirish** bandini tanlang.
3. Quyidagi besh personajdan birini tanlang:

   | Persona | Rol |
   |---|---|
   | **Kadrlar bo'yicha admin** | HR_ADMIN — xodimlarni boshqaradi, profil yaratadi va o'chiradi |
   | **Tashkilot rahbari** | Rahbar — yuqori darajadagi Departament boshlig'i; hujjat va topshiriqlarni ko'rib chiqadi |
   | **Bo'lim boshlig'i** | Bo'lim darajasidagi boshliq; bo'linma ichidagi ish oqimini boshqaradi |
   | **Devonxona xodimi** | Kiruvchi va chiquvchi xatlarni ro'yxatdan o'tkazadi va yo'naltiradi |
   | **Xodim** | Oddiy xodim; o'ziga biriktirilgan topshiriqlar va hujjatlar bilan ishlaydi |

> **Eslatma:** Faol persona nomi yuqori panelda chip sifatida ko'rsatiladi (masalan: *Siz: Tashkilot rahbari sifatida*). Chipning yonidagi **×** tugmasi orqali o'z rolingizga qaytishingiz mumkin.

> **Maslahat:** Rol almashtirish xususiyati yordamida kelishuv, xatlar va topshiriqlar kabi ko'p ishtirokchili jarayonlarni boshdan-oyoq — har tomondan — sinab ko'rishingiz mumkin.

![Rol almashtirish](images/user-manual/pov-switcher.png)

---

### Demoni qayta tiklash

Agar demo ma'lumotlarini boshlang'ich holatga qaytarmoqchi bo'lsangiz:

**Qadamlar:**

1. Yuqori o'ng burchakdagi foydalanuvchi menyusini oching.
2. **Demo ma'lumotlarni qayta tiklash** bandini tanlang.
3. Tizim dastlabki namunaviy ma'lumotlarni qayta yuklaydi va sahifa yangilanadi.

> **Diqqat:** Demo sessiyasi davomida yaratgan barcha ma'lumotlaringiz (hujjatlar, topshiriqlar, xatlar) o'chiriladi. Bu amalni bekor qilib bo'lmaydi.

---

### Nimalar simulyatsiya qilingan

Quyidagi funksiyalar demo rejimida simulyatsiya qilinadi (ishlab chiqarish muhitida esa haqiqiy ishlaydi):

- **ERI imzolash** — imzolash jarayoni taqlidiy E-IMZO yordamida amalga oshiriladi; haqiqiy sertifikat va PFX fayl talab etilmaydi.
- **Elektron pochta jo'natish** — xabarnomalar va xatlar yuborilgandek ko'rsatiladi, lekin haqiqiy e-pochta jo'natilmaydi.
- **Hujjatlarni arxivlash va tungi zaxira nusxalash** — arxivlash va jadval bo'yicha zaxira nusxalash demo muhitida avtomatik ravishda ishlamaydi.
- **PFX faylni o'qish** — imzolash uchun PFX fayl yuklanishi simulyatsiya qilinadi; haqiqiy kriptografik amal bajarilmaydi.
- **DOCX (Word) formatida eksport** — hujjatni faqat brauzer orqali chop etish va PDF saqlash mumkin; Word formatida eksport demo doirasiga kirmaydi.

---

## Ilova

---

### Atamalar

Quyida Devon tizimida eng ko'p ishlatiladigan atamalar va ularning qisqacha izohi keltirilgan:

| Atama | Ta'rif |
|---|---|
| **Kelishuv varaqasi** | Kelishuv zanjiri yakunlanganda Devon avtomatik ravishda shakllantiruvchi bir sahifali hujjat; har bir ishtirokchining qarori, izohi va vaqt tamg'asi ko'rsatilgan bo'lib, hujjatga doimiy biriktiriladi. |
| **Devonxona** | Tashkilotda kiruvchi va chiquvchi rasmiy xat-xabarlarni ro'yxatga olish va yo'naltirish bilan shug'ullanuvchi bo'linma; raqamlashni boshqaradi. |
| **Topshiriq** | Rahbar yoki bo'lim boshlig'i tomonidan bitta xodimga yuklatilgan rasmiylashtirilgan ish topshirig'i; `TOP-{yil}/{NNNN}` ko'rinishida avtomatik raqamlanadi. |
| **Ijrochi** | Kiruvchi xatni ko'rib chiqish yoki topshiriqni bajarish uchun mas'ul tayinlangan xodim. |
| **ERI** | Elektron Raqamli Imzo — O'zbekistonda qonuniy kuchga ega bo'lgan elektron imzo standarti; Devon mahalliy PKI infratuzilmasi bilan integratsiya qilinadi. |
| **Maxfiylik darajasi** | Hujjatga belgilanadigan ko'rish huquqi darajasi. Joriy demo versiyada ikki daraja mavjud: **Oddiy** yoki **Maxfiy**. |
| **Buyruqdan ko'chirma** | Direktor imzolagan buyruqning tasdiqlangan ko'chirmasi — xodim profili yaratilganda talab etiladigan hujjat. |

To'liq atamalar lug'ati uchun: [Atamalar lug'ati](glossary.md)

---

### Yordam olish

Yordam kerak bo'lganda quyidagi usullardan foydalaning:

- **Tizim administratori:** Texnik muammolar, ruxsatlar yoki tizimdan foydalanish bo'yicha savollar uchun tashkilotingizning Devon administratoriga murojaat qiling.
- **Qo'llab-quvvatlash xizmati:** Texnik muammolar yoki savollar uchun `support@yourorg.uz` manziliga murojaat qiling.
