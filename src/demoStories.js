/**
 * DongengKu — offline template storyteller (DEMO MODE only).
 *
 * Used ONLY when no Firebase config is present, so the app is fully
 * usable and demonstrable without a Firebase project. These stories are
 * original, deterministic template compositions — they are NEVER presented
 * as AI output: the UI labels them "Mode Demo" and the route badge says
 * "Demo — template offline".
 *
 * When Firebase IS configured, this module is bypassed entirely and all
 * stories come from Firebase AI Logic (see src/ai.js).
 *
 * Structure per theme: opening / adventure / twist / ending / moral, in
 * Indonesian and English, with a {name} placeholder for the chosen
 * character. Age band and length control which beats are included and how
 * they are phrased.
 */

export const THEMES = [
  { id: "forest", icon: "🌳", id_name: "Hutan Ajaib", en_name: "Magic Forest" },
  { id: "space", icon: "🚀", id_name: "Luar Angkasa", en_name: "Outer Space" },
  { id: "ocean", icon: "🌊", id_name: "Samudra Biru", en_name: "Blue Ocean" },
  { id: "market", icon: "🏮", id_name: "Pasar Malam", en_name: "Night Market" },
  { id: "mountain", icon: "⛰️", id_name: "Gunung Pelangi", en_name: "Rainbow Mountain" },
  { id: "city", icon: "🏙️", id_name: "Kota Masa Depan", en_name: "Future City" },
];

export const CHARACTERS = [
  { id: "kiki", icon: "🦌", id_name: "Kiki si Kancil", en_name: "Kiki the Mouse-deer" },
  { id: "bimo", icon: "🐻", id_name: "Bimo si Beruang", en_name: "Bimo the Bear" },
  { id: "lala", icon: "✨", id_name: "Lala si Kunang-kunang", en_name: "Lala the Firefly" },
  { id: "raka", icon: "🤖", id_name: "Raka si Robot Kecil", en_name: "Raka the Little Robot" },
  { id: "nala", icon: "🐉", id_name: "Nala si Naga Kecil", en_name: "Nala the Little Dragon" },
  { id: "sari", icon: "🧚", id_name: "Sari si Peri Hujan", en_name: "Sari the Rain Fairy" },
];

export const AGE_BANDS = [
  { id: "4-6", id_name: "4–6 tahun", en_name: "Ages 4–6" },
  { id: "7-9", id_name: "7–9 tahun", en_name: "Ages 7–9" },
  { id: "10-12", id_name: "10–12 tahun", en_name: "Ages 10–12" },
];

export const LENGTHS = [
  { id: "short", id_name: "Pendek", en_name: "Short" },
  { id: "medium", id_name: "Sedang", en_name: "Medium" },
  { id: "long", id_name: "Panjang", en_name: "Long" },
];

const BEATS = {
  forest: {
    title: { id: "{name} dan Pohon yang Bisa Bicara", en: "{name} and the Talking Tree" },
    opening: {
      id: "Di tengah Hutan Ajaib yang hijau, tinggal {name} yang suka sekali bertualang. Setiap pagi, {name} menyapa bunga-bunga dan mendengarkan burung bernyanyi.",
      en: "In the middle of the green Magic Forest lived {name}, who loved adventures. Every morning, {name} greeted the flowers and listened to the birds sing.",
    },
    adventure: {
      id: "Suatu hari, {name} menemukan jalan setapak yang belum pernah dilewati. Di ujung jalan itu berdiri pohon besar yang daunnya berkilau seperti bintang. \"Tolong aku,\" kata pohon itu pelan. \"Akar-aku haus sekali.\"",
      en: "One day, {name} found a little path never walked before. At its end stood a great tree whose leaves sparkled like stars. \"Please help me,\" the tree whispered. \"My roots are so thirsty.\"",
    },
    twist: {
      id: "Ternyata sumur di dekat pohon itu tertutup batu besar. {name} tidak bisa mendorongnya sendiri, jadi {name} memanggil teman-teman hutan. Bersama-sama mereka mendorong, satu, dua, tiga! Batu itu pun bergeser.",
      en: "It turned out the well near the tree was blocked by a huge stone. {name} could not push it alone, so {name} called the forest friends. Together they pushed — one, two, three! The stone moved at last.",
    },
    rich: {
      id: "Air segar mengalir seperti pita perak, dan pohon itu menghela napas lega. Daun-daunnya bernyanyi, dan kunang-kunang menari di antara ranting-rantingnya.",
      en: "Fresh water flowed like a silver ribbon, and the tree sighed with relief. Its leaves sang, and fireflies danced between its branches.",
    },
    ending: {
      id: "Sejak hari itu, pohon itu selalu menyapa {name} setiap kali lewat. Hutan pun menjadi lebih hijau, dan semua penghuninya hidup rukun.",
      en: "From that day on, the tree always greeted {name} whenever they passed by. The forest grew greener, and all who lived there lived in harmony.",
    },
    moral: {
      id: "menolong dengan hati yang tulus membuat dunia menjadi lebih indah.",
      en: "helping with a sincere heart makes the world more beautiful.",
    },
  },
  space: {
    title: { id: "{name} dan Bintang yang Kehilangan Cahaya", en: "{name} and the Star That Lost Its Light" },
    opening: {
      id: "Jauh di atas langit, di antara planet-planet yang berputar pelan, tinggal {name} yang punya pesawat kecil berwarna perak. Setiap malam, {name} menghitung bintang satu per satu.",
      en: "Far above the sky, among planets turning slowly, lived {name}, who owned a small silver spaceship. Every night, {name} counted the stars one by one.",
    },
    adventure: {
      id: "Suatu malam, satu bintang kecil tidak bersinar lagi. Bintang itu sedih karena cahayanya hilang. {name} pun terbang mendekat dan bertanya, \"Apa yang terjadi?\"",
      en: "One night, one little star stopped shining. The star was sad because its light was gone. {name} flew closer and asked, \"What happened?\"",
    },
    twist: {
      id: "\"Aku lelah,\" kata bintang itu. \"Aku bersinar setiap malam tanpa istirahat.\" {name} tersenyum. \"Kalau begitu, kita cari cahaya baru bersama-sama.\" Mereka pun mengumpulkan debu bintang yang berkilau di angkasa.",
      en: "\"I am tired,\" said the star. \"I shine every night without rest.\" {name} smiled. \"Then let us find you a new light together.\" So they gathered sparkling stardust floating in space.",
    },
    rich: {
      id: "Debu bintang itu hangat dan lembut, seperti pelukan. Ketika ditempelkan ke bintang kecil itu, langit seketika berkilau lebih terang dari sebelumnya.",
      en: "The stardust was warm and soft, like a hug. When it touched the little star, the whole sky sparkled brighter than ever before.",
    },
    ending: {
      id: "Bintang kecil itu bersinar lagi, lebih cerah dan lebih bahagia. Sejak itu, {name} selalu mengingatkan semua bintang untuk beristirahat dengan cukup.",
      en: "The little star shone again, brighter and happier. From then on, {name} always reminded every star to rest enough.",
    },
    moral: {
      id: "beristirahat itu penting, dan teman yang baik selalu mau membantu.",
      en: "rest matters, and a good friend is always willing to help.",
    },
  },
  ocean: {
    title: { id: "{name} dan Permata Karang", en: "{name} and the Coral Jewel" },
    opening: {
      id: "Di bawah Samudra Biru yang tenang, tinggal {name} yang suka berenang di antara terumbu karang. Ikan-ikan kecil selalu mengikuti {name} ke mana pun pergi.",
      en: "Under the calm Blue Ocean lived {name}, who loved swimming among the coral reefs. Little fish always followed {name} wherever they went.",
    },
    adventure: {
      id: "Suatu pagi, {name} melihat cahaya berkilau di dalam gua karang. Di sana ada permata biru yang sangat indah. Tapi gua itu dijaga oleh arus yang kuat.",
      en: "One morning, {name} saw a sparkling light inside a coral cave. There was a beautiful blue jewel. But the cave was guarded by a strong current.",
    },
    twist: {
      id: "{name} tidak memaksa masuk. {name} menunggu sampai air tenang, lalu meminta bantuan ikan-ikan kecil untuk menunjukkan jalan yang aman. Perlahan, mereka berenang masuk bersama.",
      en: "{name} did not force the way in. {name} waited until the water calmed, then asked the little fish to show the safe path. Slowly, they swam in together.",
    },
    rich: {
      id: "Di dalam gua, permata itu bersinar seperti bulan di malam hari. Cahayanya membuat seluruh gua tampak seperti istana kaca.",
      en: "Inside the cave, the jewel shone like the moon at night. Its light made the whole cave look like a glass palace.",
    },
    ending: {
      id: "{name} membawa permata itu ke tengah desa laut, supaya semua bisa menikmati cahayanya. Sejak itu, samudra tidak pernah gelap lagi.",
      en: "{name} brought the jewel to the middle of the sea village, so everyone could enjoy its light. From then on, the ocean was never dark again.",
    },
    moral: {
      id: "kesabaran dan kerja sama bisa membuka jalan yang paling sulit sekalipun.",
      en: "patience and teamwork can open even the hardest path.",
    },
  },
  market: {
    title: { id: "{name} dan Lampion yang Hilang", en: "{name} and the Lost Lantern" },
    opening: {
      id: "Saat malam tiba, Pasar Malam menjadi ramai dan penuh warna. Lampion-lampion merah bergoyang di atas kios, dan aroma kue hangat memenuhi udara. {name} berjalan sambil memegang tangan ibunya.",
      en: "When night came, the Night Market grew busy and full of colour. Red lanterns swayed above the stalls, and the smell of warm cakes filled the air. {name} walked along, holding their mother's hand.",
    },
    adventure: {
      id: "Tiba-tiba, {name} melihat seorang pedagang tua yang kebingungan. Lampion kesayangannya — lampion yang ia buat sendiri — hilang tertiup angin.",
      en: "Suddenly, {name} saw an old seller looking worried. His favourite lantern — one he had made himself — had blown away in the wind.",
    },
    twist: {
      id: "{name} mengajak teman-teman pasar mencari bersama. Mereka memeriksa gang demi gang sampai akhirnya menemukan lampion itu tersangkut di pohon mangga, masih menyala hangat.",
      en: "{name} asked the market friends to search together. They checked alley after alley until they found the lantern caught in a mango tree, still glowing warmly.",
    },
    rich: {
      id: "Pedagang tua itu tersenyum lebar. Ia menyalakan lampion itu kembali, dan cahayanya membuat seluruh pasar tampak seperti langit yang turun ke bumi.",
      en: "The old seller smiled widely. He lit the lantern again, and its light made the whole market look like the sky had come down to earth.",
    },
    ending: {
      id: "Malam itu, pedagang tua itu membagikan kue gratis untuk semua anak yang membantu. Pasar pun semakin meriah sampai larut malam.",
      en: "That night, the old seller shared free cakes with all the children who had helped. The market stayed joyful until late at night.",
    },
    moral: {
      id: "kebaikan kecil bisa menyalakan kebahagiaan yang besar.",
      en: "a small kindness can light up a great happiness.",
    },
  },
  mountain: {
    title: { id: "{name} Mendaki Gunung Pelangi", en: "{name} Climbs Rainbow Mountain" },
    opening: {
      id: "Di kaki Gunung Pelangi, awan-awan berwarna-warni mengapung rendah. {name} sudah lama ingin melihat pelangi dari dekat, dari puncak gunung itu.",
      en: "At the foot of Rainbow Mountain, colourful clouds floated low. {name} had long wished to see a rainbow up close, from the very top of that mountain.",
    },
    adventure: {
      id: "Pagi-pagi sekali, {name} mulai mendaki dengan bekal air dan roti. Jalannya menanjak dan berbatu, tapi {name} terus berjalan sambil bernyanyi pelan.",
      en: "Very early in the morning, {name} began to climb, carrying water and bread. The path was steep and rocky, but {name} kept walking while humming softly.",
    },
    twist: {
      id: "Di tengah jalan, {name} bertemu seekor anak kambing yang tersesat. {name} berhenti sejenak, menenangkan kambing itu, lalu mengantarnya pulang ke kandangnya. Perjalanan pun tertunda, tapi hati {name} terasa hangat.",
      en: "Halfway up, {name} met a lost baby goat. {name} stopped a while, calmed the goat, and led it back home to its pen. The climb was delayed, but {name}'s heart felt warm.",
    },
    rich: {
      id: "Ketika {name} akhirnya sampai di puncak, langit berubah menjadi tujuh warna sekaligus. Pelangi itu begitu dekat sampai {name} bisa menyentuhnya dengan ujung jari.",
      en: "When {name} finally reached the top, the sky turned into seven colours at once. The rainbow was so close that {name} could touch it with a fingertip.",
    },
    ending: {
      id: "{name} pulang dengan hati penuh warna. Di rumah, {name} menceritakan semuanya, dan semua orang tersenyum mendengarnya.",
      en: "{name} went home with a heart full of colour. At home, {name} told the whole tale, and everyone smiled as they listened.",
    },
    moral: {
      id: "menolong orang lain di tengah jalan tidak pernah membuat kita terlambat sampai pada impian.",
      en: "helping others along the way never makes us late to reach our dreams.",
    },
  },
  city: {
    title: { id: "{name} dan Taman di Atas Awan", en: "{name} and the Garden Above the Clouds" },
    opening: {
      id: "Di Kota Masa Depan, gedung-gedung tinggi menyentuh langit dan kereta melayang melintas tanpa suara. Tapi di antara semua itu, {name} merindukan sesuatu yang hijau: sebuah taman.",
      en: "In the Future City, tall buildings touched the sky and silent floating trains glided by. But among all of it, {name} missed something green: a garden.",
    },
    adventure: {
      id: "{name} menemukan atap kosong di atas sebuah gedung tua. \"Di sinilah taman kita,\" kata {name} sambil menanam benih pertama. Teman-teman pun datang membawa pot, tanah, dan air.",
      en: "{name} found an empty rooftop above an old building. \"Here is our garden,\" said {name}, planting the first seed. Friends arrived carrying pots, soil, and water.",
    },
    twist: {
      id: "Awalnya tanaman itu tumbuh lambat. Tapi {name} tidak menyerah — setiap hari disiram, diberi cahaya, dan diajak bicara. Perlahan, daun pertama pun muncul, lalu bunga.",
      en: "At first the plants grew slowly. But {name} did not give up — every day they were watered, given light, and spoken to. Slowly, the first leaf appeared, then a flower.",
    },
    rich: {
      id: "Tidak lama kemudian, atap itu berubah menjadi taman terapung yang indah. Kupu-kupu datang, burung-burung singgah, dan seluruh kota bisa melihat taman itu dari bawah.",
      en: "Soon the rooftop became a beautiful floating garden. Butterflies came, birds stopped by, and the whole city could see the garden from below.",
    },
    ending: {
      id: "Sejak itu, setiap gedung di kota berlomba membuat taman di atapnya. Kota Masa Depan pun menjadi kota yang hijau dan ramah.",
      en: "From then on, every building in the city raced to make a rooftop garden. The Future City became a green and friendly city.",
    },
    moral: {
      id: "satu benih kecil yang dirawat dengan sabar bisa mengubah seluruh kota.",
      en: "one small seed, cared for patiently, can change a whole city.",
    },
  },
};

function fill(text, name) {
  return text.split("{name}").join(name);
}

/**
 * Compose a demo story from template beats.
 * @returns {{title, body, moral}}
 */
export function generateDemoStory({ theme, character, ageBand, length, lang }) {
  const beats = BEATS[theme] || BEATS.forest;
  const charList = CHARACTERS.find((c) => c.id === character) || CHARACTERS[0];
  const name = lang === "id" ? charList.id_name : charList.en_name;
  const L = lang === "id" ? "id" : "en";

  const parts = [beats.opening[L], beats.adventure[L]];
  if (length !== "short") parts.push(beats.twist[L]);
  if (length === "long" || ageBand === "10-12") parts.push(beats.rich[L]);
  parts.push(beats.ending[L]);

  let body = parts.map((p) => fill(p, name)).join("\n\n");

  // Youngest readers: shorter sentences, gentle repetition.
  if (ageBand === "4-6") {
    const repeat =
      L === "id"
        ? `\n\n${name} tersenyum. ${name} senang sekali!`
        : `\n\n${name} smiled. ${name} was so happy!`;
    body += repeat;
  }

  return {
    title: fill(beats.title[L], name),
    body,
    moral: fill(beats.moral[L], name),
  };
}

export function themeName(themeId, lang) {
  const t = THEMES.find((x) => x.id === themeId);
  return t ? (lang === "id" ? t.id_name : t.en_name) : themeId;
}

export function characterName(characterId, lang) {
  const c = CHARACTERS.find((x) => x.id === characterId);
  return c ? (lang === "id" ? c.id_name : c.en_name) : characterId;
}
