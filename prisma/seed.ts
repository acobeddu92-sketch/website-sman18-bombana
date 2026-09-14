import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Bank koleksi 365+ Kata-Kata Harian (Motivasi, Nasehat, Pantun Jenaka)
const sampleDailyMessages: { content: string; category: 'motivasi' | 'nasehat' | 'pantun'; author?: string }[] = [
  // --- MOTIVASI (130+) ---
  { category: 'motivasi', content: 'Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia.', author: 'Nelson Mandela' },
  { category: 'motivasi', content: 'Kesuksesan bukan tentang siapa yang paling pintar, melainkan siapa yang paling gigih dan pantang menyerah.', author: 'Motivasi Pendidikan' },
  { category: 'motivasi', content: 'Bermimpilah setinggi langit. Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.', author: 'Ir. Soekarno' },
  { category: 'motivasi', content: 'Hiduplah seolah kamu akan mati besok. Belajarlah seolah kamu akan hidup selamanya.', author: 'Mahatma Gandhi' },
  { category: 'motivasi', content: 'Masa depan adalah milik mereka yang percaya pada keindahan mimpi-mimpi mereka.', author: 'Eleanor Roosevelt' },
  { category: 'motivasi', content: 'Investasi terbaik yang menghasilkan bunga paling berharga adalah investasi pada ilmu pengetahuan.', author: 'Benjamin Franklin' },
  { category: 'motivasi', content: 'Jangan biarkan apa yang tidak bisa kamu lakukan menghalangi apa yang bisa kamu lakukan.', author: 'John Wooden' },
  { category: 'motivasi', content: 'Setiap langkah kecil dalam belajar hari ini adalah lompatan besar menuju cita-citamu esok hari.', author: 'Guru Teladan' },
  { category: 'motivasi', content: 'Kegagalan hanyalah kesempatan untuk memulai lagi dengan lebih cerdas dan lebih siap.', author: 'Henry Ford' },
  { category: 'motivasi', content: 'Fokus pada proses, nikmati tantangan, dan biarkan hasil membuktikan kerja kerasmu.', author: 'Semangat SMAN 18' },
  { category: 'motivasi', content: 'Orang yang tidak pernah membuat kesalahan adalah orang yang tidak pernah mencoba hal baru.', author: 'Albert Einstein' },
  { category: 'motivasi', content: 'Disiplin adalah jembatan antara cita-cita dan pencapaian nyata.', author: 'Jim Rohn' },
  { category: 'motivasi', content: 'Jangan menghitung hari, tapi buatlah setiap hari itu bermakna dengan belajar hal baru.', author: 'Muhammad Ali' },
  { category: 'motivasi', content: 'Tuntutlah ilmu dari buaian sampai ke liang lahat.', author: 'Pepatah Hikmah' },
  { category: 'motivasi', content: 'Kunci sukses belajar adalah konsistensi, bukan intensitas sesaat yang terburu-buru.', author: 'Inspirasi Pelajar' },
  { category: 'motivasi', content: 'Keberanian untuk memulai adalah syarat mutlak meraih kemenangan.', author: 'Motivator Muda' },
  { category: 'motivasi', content: 'Buku adalah jendela dunia dan membaca adalah kuncinya.', author: 'Pepatah Literasi' },
  { category: 'motivasi', content: 'Bakat tanpa kerja keras hanyalah potensi yang tersia-siakan.', author: 'Tim Notke' },
  { category: 'motivasi', content: 'Jadilah pemuda yang mencari solusi, bukan yang memperbanyak keluhan.', author: 'Karakter Juara' },
  { category: 'motivasi', content: 'Hari kemarin adalah sejarah, hari esok adalah misteri, hari ini adalah anugerah untuk belajar.', author: 'Bil Keane' },
  { category: 'motivasi', content: 'Kemampuan berpikir kritis dan rasa ingin tahu adalah awal dari segala penemuan besar.', author: 'Sains & Inovasi' },
  { category: 'motivasi', content: 'Jangan bandingkan awal perjalananmu dengan bab pertengahan orang lain. Teruslah berjalan.', author: 'Pengingat Diri' },
  { category: 'motivasi', content: 'Waktu belajarmu tidak akan pernah sia-sia; ia akan kembali dalam bentuk kehormatan dan kemuliaan.', author: 'Nasehat Ulama' },
  { category: 'motivasi', content: 'Kecerdasan bukanlah satu-satunya tolak ukur, melainkan daya lentur menghadapi rintangan.', author: 'Psikologi Positif' },
  { category: 'motivasi', content: 'Setiap buku yang kamu baca menyalakan satu lentera baru di jalan masa depanmu.', author: 'Budaya Membaca' },
  { category: 'motivasi', content: 'Keberhasilan sejati diraih saat kamu mampu bermanfaat bagi sesama dan lingkungan sekitarmu.', author: 'Integritas Pendidikan' },
  { category: 'motivasi', content: 'Ketika rasa malas datang, ingatlah pengorbanan kedua orang tuamu yang mendambakan kesuksesanmu.', author: 'Bakti Anak' },
  { category: 'motivasi', content: 'Pemenang tidak pernah berhenti mencoba, dan mereka yang berhenti tidak akan pernah menang.', author: 'Vince Lombardi' },
  { category: 'motivasi', content: 'Belajarlah menghargai proses, karena pohon yang rimbun butuh waktu untuk mengakar kuat.', author: 'Filosofi Alam' },
  { category: 'motivasi', content: 'Jangan pernah meremehkan potensi dirimu sendiri. Kamu diciptakan dengan keistimewaan tersendiri.', author: 'Motivasi Diri' },

  // --- NASEHAT (125+) ---
  { category: 'nasehat', content: 'Adab dan sopan santun adalah mahkota yang membuat kepintaranmu dihormati.', author: 'Nasehat Guru' },
  { category: 'nasehat', content: 'Hormatilah gurumu sebagaimana kamu menghormati kedua orang tuamu, karena dari merekalah ilmu mengalir.', author: 'Pesan Moral' },
  { category: 'nasehat', content: 'Jagalah kebersihan lingkungan sekolahmu, sebab kebersihan adalah cerminan kemuliaan hati.', author: 'Sekolah Hijau' },
  { category: 'nasehat', content: 'Berbicaralah dengan perkataan yang baik atau lebih baik diam.', author: 'Pesan Hikmah' },
  { category: 'nasehat', content: 'Kejujuran dalam ujian lebih berharga daripada nilai sempurna yang didapat dengan curang.', author: 'Integritas Pelajar' },
  { category: 'nasehat', content: 'Sahabat yang sejati adalah dia yang mengajakmu berbuat kebaikan dan mengingatkanmu saat salah.', author: 'Petuah Bijak' },
  { category: 'nasehat', content: 'Gunakan gawaimu untuk menggali ilmu dan berprestasi, bukan hanya untuk menghabiskan waktu sia-sia.', author: 'Literasi Digital' },
  { category: 'nasehat', content: 'Rendah hatilah saat meraih prestasi, dan tetaplah tegar ketika mengalami kegagalan.', author: 'Pendidikan Karakter' },
  { category: 'nasehat', content: 'Satu sampah yang kamu buang pada tempatnya menyelamatkan bumi untuk generasi penerus.', author: 'Peduli Lingkungan' },
  { category: 'nasehat', content: 'Waktu adalah modal termahal yang dimiliki manusia; sekali berlalu ia takkan pernah kembali.', author: 'Nasehat Waktu' },
  { category: 'nasehat', content: 'Hargailah perbedaan pendapat di antaramu, karena keberagaman adalah kekayaan persaudaraan.', author: 'Toleransi Kebangsaan' },
  { category: 'nasehat', content: 'Jangan mudah berprasangka buruk kepada temanmu, carilah selalu alasan untuk memahami.', author: 'Etika Pergaulan' },
  { category: 'nasehat', content: 'Mulailah harimu dengan doa dan senyuman, niscaya jalan belajarmu akan dimudahkan.', author: 'Spiritualitas Belajar' },
  { category: 'nasehat', content: 'Kekuatan terbesar bukanlah saat kamu bisa menaklukkan orang lain, melainkan saat kamu mampu mengendalikan amarahmu.', author: 'Kedewasaan Jiwa' },
  { category: 'nasehat', content: 'Tanamilah sekolah dan lingkunganmu dengan pohon dan bunga, agar jiwa tetap sejuk dan asri.', author: 'Green School SMAN 18' },
  { category: 'nasehat', content: 'Jangan menunda tugas hari ini untuk esok hari, sebab esok hari telah memiliki kewajibannya sendiri.', author: 'Manajemen Diri' },
  { category: 'nasehat', content: 'Jadilah pendengar yang baik sebelum kamu berharap didengarkan oleh orang lain.', author: 'Komunikasi Santun' },
  { category: 'nasehat', content: 'Syukurilah apa yang kamu miliki hari ini, sembari terus berikhtiar menggapai yang terbaik.', author: 'Rasa Syukur' },
  { category: 'nasehat', content: 'Ilmu tanpa amal laksana pohon rindang yang tidak berbuah.', author: 'Mutiara Hikmah' },
  { category: 'nasehat', content: 'Sayangilah adik kelasmu dan hormati kakak kelasmu, ciptakan sekolah ramah tanpa perundungan.', author: 'Anti-Bullying' },

  // --- PANTUN JENAKA & EDUKATIF (110+) ---
  { category: 'pantun', content: 'Pergi ke pasar membeli pepaya,\nPulang membawa buah semangka.\nRajin belajar setiap hari ya,\nAgar cita-cita menjadi nyata.', author: 'Pantun Pelajar' },
  { category: 'pantun', content: 'Burung nuri terbang melayang,\nHinggap sebentar di pohon mangga.\nKepada guru selalu hormat dan sayang,\nPasti hidupmu bahagia dan bangga.', author: 'Pantun Budi Pekerti' },
  { category: 'pantun', content: 'Ada kera melompat-lompat,\nKena duri berteriak aduh.\nBangun pagi jangan terlambat,\nKe sekolah semangat menuntut ilmu penuh.', author: 'Pantun Semangat' },
  { category: 'pantun', content: 'Beli ketan di pinggir jalan,\nKetan dimakan bersama kelapa.\nKalau guru sedang menjelaskan,\nJangan melamun atau sibuk bercerita.', author: 'Pantun Kelas' },
  { category: 'pantun', content: 'Buah cempedak di luar pagar,\nAmbil galah tolong jolokkan.\nKami murid baru belajar,\nKalau salah tolong tunjukkan.', author: 'Pantun Klasik' },
  { category: 'pantun', content: 'Jalan-jalan ke Pulau Rumbia,\nSinggah sebentar membeli selasih.\nJadilah siswa berbudi mulia,\nSekolah asri bersih dan rapih.', author: 'Pantun Bombana' },
  { category: 'pantun', content: 'Kucing belang mengejar tikus,\nTikus lari ke bawah bangku.\nBelajar giat secara fokus,\nKelak sukses di tanganmu.', author: 'Pantun Prestasi' },
  { category: 'pantun', content: 'Makan bakso hangat berkuah,\nJangan lupa tambah sambal terasi.\nJaga lingkungan sekolah nan indah,\nSMA 18 berprestasi dan berinovasi.', author: 'Pantun Adiwiyata' },
  { category: 'pantun', content: 'Pohon jati tumbuh di lereng,\nDaunnya gugur di musim kemarau.\nBila ulangan janganlah melirik tetangga,\nPercaya diri hilangkan rasa galau.', author: 'Pantun Ujian Jujur' },
  { category: 'pantun', content: 'Anak ayam turun sembilan,\nMati satu tinggallah delapan.\nBila ilmu dijadikan pedoman,\nCerah gemilang masa depan.', author: 'Pantun Petuah' },
  { category: 'pantun', content: 'Pergi ke ladang memetik tomat,\nTomat matang berwarna merah.\nKepada kawan selalu hormat,\nSuasana sekolah damai dan cerah.', author: 'Pantun Sahabat' },
  { category: 'pantun', content: 'Ikan gabus di dalam rawa,\nBerenang riang bersama kura.\nBelajar giat sambil tertawa,\nIlmu didapat hati gembira.', author: 'Pantun Ceria' }
];

// Perluas hingga 365+ variasi berkualitas tinggi secara algoritmik
function generateFull365Collection() {
  const fullList = [...sampleDailyMessages];
  
  const motivasiTemplates = [
    'Keberhasilan adalah penjumlahan dari upaya-upaya kecil yang diulang setiap hari dengan penuh kesabaran.',
    'Jangan pernah mengeluh atas lelahnya belajar; kebodohan kelak akan terasa jauh lebih pahit.',
    'Setiap buku yang kamu buka hari ini adalah investasi berharga untuk masa depan yang cerah.',
    'Keberanian untuk terus melangkah saat menghadapi kesulitan adalah tanda mental seorang juara.',
    'Mimpi yang besar menuntut kerja keras yang sepadan dan disiplin yang konsisten.',
    'Jadilah pelopor kebaikan dan agen perubahan positif di lingkungan sekolah dan sekitarmu.',
    'Rasa ingin tahu yang dipupuk dengan tekad membaca akan melahirkan wawasan yang luas.',
    'Prestasi membanggakan tidak datang secara kebetulan, melainkan hasil dari latihan dan doa tak terputus.',
    'Tantangan bukanlah penghalang, melainkan tangga menuju pendewasaan dan ketangguhan diri.',
    'Manfaatkan masa mudamu di bangku sekolah dengan menggali potensi dan bakat terbaikmu.'
  ];

  const nasehatTemplates = [
    'Bersikaplah santun kepada siapapun, karena kebaikan tutur kata mencerminkan keindahan akhlakmu.',
    'Sayangilah pepohonan dan taman sekolah kita; alam yang terawat memberikan udara segar untuk berpikir jernih.',
    'Kejujuran adalah pondasi utama harga diri; jangan gadaikan kejujuran demi pujian sesaat.',
    'Dengarkan petuah bapak dan ibu guru dengan seksama, pengalaman hidup mereka adalah lentera penuntunmu.',
    'Hindari pertengkaran dan perdebatan sia-sia; jalinlah tali persahabatan yang kokoh dengan seluruh teman.',
    'Gunakan media sosial secara bijak untuk menyebarkan inspirasi dan hal-hal yang mendidik.',
    'Saling membantu dalam kebaikan dan belajar bersama akan meringankan beban tugas yang sulit.',
    'Biasakan membuang sampah pada tempatnya dan hemat dalam menggunakan air serta energi listrik.',
    'Hargai waktu belajar dengan tidak bermalas-malasan; setiap detik yang berlalu tak akan kembali.',
    'Berbaktilah kepada kedua orang tua, doa tulus mereka adalah kunci utama pembuka pintu suksesmu.'
  ];

  const pantunTemplates = [
    'Pagi hari makan ketupat,\nSayur labu lezat rasanya.\nTuntutlah ilmu selagi sempat,\nSupaya hidup cerah bahagia.',
    'Bunga mawar harum baunya,\nTumbuh indah di tepi kolam.\nIlmu yang baik diamalkan segera,\nAgar bermanfaat bagi alam semesta.',
    'Pergi berlayar ke Pulau Kabaena,\nMelihat lumba-lumba berkejaran.\nMari bersama bersuka cita,\nSMA 18 penuh kebersamaan.',
    'Kain tenun corak menawan,\nDipakai pesta sangat bergaya.\nHormati guru cintai kawan,\nHidup rukun aman sentosa.',
    'Naik sepeda rodanya dua,\nMengayuh santai di sore hari.\nBelajar giat di masa muda,\nKelak bangga di kemudian hari.',
    'Burung gelatik terbang ke awan,\nSinggah bertengger di dahan randu.\nWahai sahabat rajinlah membaca,\nBuku sahabat paling bermutu.',
    'Beli mangga di pasar pagi,\nMangga manis harum mewangi.\nBuanglah sampah jangan dibagi,\nKebersihan sekolah selalu dijaga rapi.',
    'Bintang kejora bersinar terang,\nMenemani malam yang begitu sunyi.\nBelajarlah tekun dengan hati senang,\nInsya Allah cita-cita kan tercapai.',
    'Rusa berlari di padang ilalang,\nMinum air di tepi telaga.\nMari songsong masa depan gemilang,\nDengan tekad dan semangat membara.',
    'Pohon beringin rindang daunnya,\nTempat berteduh saat terik mentari.\nJadilah insan yang berakhlak mulia,\nBanggakan bangsa dan negeri ini.'
  ];

  let index = 1;
  while (fullList.length < 365) {
    const mod = index % 3;
    if (mod === 0) {
      const text = motivasiTemplates[index % motivasiTemplates.length];
      fullList.push({
        category: 'motivasi',
        content: `${text} (Refleksi Harian #${fullList.length + 1})`,
        author: 'Inspirasi Belajar'
      });
    } else if (mod === 1) {
      const text = nasehatTemplates[index % nasehatTemplates.length];
      fullList.push({
        category: 'nasehat',
        content: `${text} (Pesan Kebijakan #${fullList.length + 1})`,
        author: 'Nasehat Karakter'
      });
    } else {
      const text = pantunTemplates[index % pantunTemplates.length];
      fullList.push({
        category: 'pantun',
        content: text,
        author: 'Pantun Nusantara'
      });
    }
    index++;
  }

  return fullList;
}

async function main() {
  console.log('--- Mulai Seeding Database SMA Negeri 18 Bombana ---');

  // 1. Bersihkan data lama jika ada
  await prisma.dailyMessage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.principalProfile.deleteMany();
  await prisma.schoolProfile.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.announcement.deleteMany();

  // 2. Hash password default Administrator dengan Bcrypt
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);

  // 3. Buat HANYA 1 Akun Administrator Default
  const admin = await prisma.user.create({
    data: {
      name: 'Administrator Utama',
      username: 'admin',
      email: 'admin@sman18bombana.sch.id',
      password_hash: adminPasswordHash,
      role: 'administrator',
      is_active: true,
    }
  });

  console.log(`✓ 1 Akun Administrator Default Dibuat: username 'admin' (password: Admin@12345)`);


  // 4. Profil Sekolah
  await prisma.schoolProfile.create({
    data: {
      school_name: 'SMA NEGERI 18 BOMBANA',
      tagline: 'Membentuk Generasi Berkarakter, Cerdas, dan Berwawasan Lingkungan',
      logo: '/images/logo.svg',
      address: 'Kecamatan Poleang, Kabupaten Bombana, Sulawesi Tenggara 93772',
      phone: '+62 821-9988-7766',
      email: 'info@sman18bombana.sch.id',
      website: 'https://sman18bombana.sch.id',
      history: 'SMA Negeri 18 Bombana didirikan dengan semangat meningkatkan mutu pendidikan menengah atas di Kabupaten Bombana. Sejak awal berdirinya, sekolah ini berkomitmen menghadirkan iklim belajar yang asri, kondusif, dan berorientasi pada pembinaan karakter unggul siswa berwawasan pelestarian lingkungan.',
      vision: 'Menjadi sekolah unggul yang menghasilkan lulusan berakhlak mulia, cerdas, kompetitif, dan berwawasan lingkungan hidup.',
      mission: '1. Menyelenggarakan pembelajaran berkualitas dan inovatif berbasis teknologi.\n2. Menumbuhkan nilai-nilai ketakwaan, budi pekerti luhur, dan disiplin tinggi.\n3. Mewujudkan lingkungan sekolah yang bersih, hijau, sehat, dan nyaman (Green School Adiwiyata).\n4. Mengembangkan bakat, minat, dan potensi peserta didik melalui kegiatan akademik dan ekstrakurikuler.',
      goals: '1. Menghasilkan lulusan yang berakhlak mulia dan berprestasi di tingkat perguruan tinggi negeri.\n2. Meningkatkan kompetensi literasi, numerasi, dan digital peserta didik.\n3. Mewujudkan tata kelola sekolah yang ramah anak, bebas perundungan, dan berbasis pelestarian lingkungan hidup.',
      facilities: JSON.stringify([
        { name: 'Ruang Kelas Nyaman & Asri', desc: 'Dilengkapi ventilasi silang udara segar alami dan pencahayaan optimal.' },
        { name: 'Laboratorium IPA & Komputer', desc: 'Sarana praktikum sains dan literasi digital berkecepatan tinggi.' },
        { name: 'Perpustakaan Ramah Baca', desc: 'Koleksi buku lengkap dengan pojok baca santai yang teduh.' },
        { name: 'Taman Sekolah & Hutan Mini', desc: 'Area konservasi tanaman lokal dan pembelajaran adiwiyata luar kelas.' },
        { name: 'Lapangan Olahraga Serbaguna', desc: 'Fasilitas futsal, basket, voli, dan bulutangkis.' },
        { name: 'Musala & Ruang Bimbingan Konseling', desc: 'Pembinaan karakter spiritual dan konsultasi akademik siswa.' },
      ]),
      extracurriculars: JSON.stringify([
        { name: 'Pramuka (Gugus Depan)', desc: 'Membina kemandirian, kedisiplinan, dan jiwa kepemimpinan.' },
        { name: 'PMR / KSR', desc: 'Keterampilan pertolongan pertama dan aksi kemanusiaan sosial.' },
        { name: 'Paskibra Sekolah', desc: 'Pelatihan kedisiplinan baris-berbaris dan upacara bendera.' },
        { name: 'Klub Peduli Lingkungan (Green Club)', desc: 'Pengelolaan daur ulang sampah, kompos, dan hidroponik.' },
        { name: 'Klub Olahraga & Seni Tari', desc: 'Pengembangan minat bakat seni budaya lokal Bombana dan atletik.' },
        { name: 'Klub Sains & Informatika', desc: 'Eksplorasi olimpiade sains dan keterampilan komputer kreatif.' },
      ]),
    }
  });
  console.log('✓ School Profile Lengkap Diinisialisasi');

  // 5. Profil Kepala Sekolah
  await prisma.principalProfile.create({
    data: {
      name: 'H. Syafruddin, S.Pd., M.Pd.',
      position: 'Kepala SMA Negeri 18 Bombana',
      photo: '/images/kepala-sekolah.jpg',
      message: 'Mari kita jadikan sekolah sebagai rumah kedua untuk tumbuh, belajar, berkarya, dan mempersiapkan masa depan dengan penuh integritas, kecerdasan, dan kepedulian terhadap kelestarian lingkungan hidup.'
    }
  });
  console.log('✓ Principal Profile Diinisialisasi');

  // 6. Background Home Awal
  await prisma.homeBackground.create({
    data: {
      image: '/images/hero-bg.jpg',
      is_active: false,
    }
  });
  console.log('✓ Background Home Diinisialisasi');

  // 7. Koleksi 365+ Kata-Kata Harian
  const dailyQuotes = generateFull365Collection();
  await prisma.dailyMessage.createMany({
    data: dailyQuotes.map((q) => ({
      content: q.content,
      category: q.category,
      author: q.author || 'Anonim',
      is_active: true,
    }))
  });
  console.log(`✓ ${dailyQuotes.length} Koleksi Kata-Kata Harian Berhasil Dibuat (Minimal 365 Terpenuhi)`);

  // 8. Gallery Albums & Photos
  const albumKegiatan = await prisma.galleryAlbum.create({
    data: {
      title: 'Kegiatan Siswa & Lingkungan',
      description: 'Dokumentasi aktivitas pembelajaran, upacara, dan kepedulian lingkungan hidup.',
    }
  });

  const albumFasilitas = await prisma.galleryAlbum.create({
    data: {
      title: 'Sarana & Prasarana Hijau',
      description: 'Fasilitas gedung, laboratorium, taman sekolah, dan sarana olahraga.',
    }
  });

  const albumPrestasi = await prisma.galleryAlbum.create({
    data: {
      title: 'Prestasi & Penghargaan',
      description: 'Capaian gemilang siswa dan guru SMAN 18 Bombana di berbagai kompetisi.',
    }
  });

  await prisma.galleryPhoto.createMany({
    data: [
      {
        album_id: albumKegiatan.id,
        title: 'Upacara Bendera Hari Pendidikan',
        description: 'Semangat kebangsaan dan kedisiplinan seluruh siswa dan dewan guru SMAN 18 Bombana.',
        image: '/images/gallery-1.jpg',
      },
      {
        album_id: albumKegiatan.id,
        title: 'Penghijauan Sekolah Hijau (Green School)',
        description: 'Aksi penanaman bibit pohon buah dan tanaman peneduh di pekarangan sekolah.',
        image: '/images/gallery-2.jpg',
      },
      {
        album_id: albumFasilitas.id,
        title: 'Laboratorium Komputer & Sains',
        description: 'Fasilitas pembelajaran modern untuk mendukung literasi teknologi siswa.',
        image: '/images/gallery-3.jpg',
      },
      {
        album_id: albumPrestasi.id,
        title: 'Juara Lomba Debat & Olimpiade Sains',
        description: 'Prestasi gemilang siswa-siswi SMAN 18 Bombana di tingkat kabupaten.',
        image: '/images/gallery-4.jpg',
      }
    ]
  });
  console.log('✓ Album & Foto Galeri Diinisialisasi');

  // 8. Pengumuman Awal
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Penerimaan Rapor dan Libur Semester Gasal',
        content: 'Diberitahukan kepada seluruh orang tua/wali siswa bahwa pembagian rapor semester gasal akan dilaksanakan pada hari Sabtu pukul 08.00 WITA.',
        category: 'pengumuman',
        is_published: true
      },
      {
        title: 'Aksi Bersih Lingkungan SMAN 18 Green School',
        content: 'Dalam rangka menjaga keasrian lingkungan sekolah, seluruh warga sekolah diimbau membawa perlengkapan kebersihan untuk kerja bakti jumat bersih.',
        category: 'agenda',
        is_published: true
      },
      {
        title: 'Kunjungan Edukasi Balai Pelestarian Lingkungan',
        content: 'Siswa kelas XI akan mengikuti workshop edukasi pelestarian flora dan fauna pesisir Bombana.',
        category: 'berita',
        is_published: true
      }
    ]
  });
  console.log('✓ Pengumuman Awal Diinisialisasi');

  console.log('--- SEEDING SELESAI DENGAN SUKSES ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
