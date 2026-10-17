window.LP = window.LP || {};

LP.CATEGORIES = {
  plan: { name: 'Toplu Planlama', color: '#0e7490', icon: '📋' },
  model: { name: 'Planlama Modeli', color: '#1d4e89', icon: '📐' },
  operasyon: { name: 'Operasyon Kararları', color: '#c2410c', icon: '📦' },
  uretim: { name: 'Üretim Kararları', color: '#6d28d9', icon: '⚖️' },
};

LP.PAWNS = [
  { id: 'tir', name: 'Tır', icon: '🚚' },
  { id: 'koli', name: 'Koli', icon: '📦' },
  { id: 'gemi', name: 'Gemi', icon: '🚢' },
  { id: 'ucak', name: 'Kargo Uçağı', icon: '✈️' },
  { id: 'tren', name: 'Yük Treni', icon: '🚆' },
  { id: 'vinc', name: 'Liman Vinci', icon: '🏗️' },
];

LP.TILE_TYPES = {
  start: 'Başlangıç',
  question: 'Soru',
  chance: 'Şanslı Soru',
  customs: 'Gümrüğe Takıldın',
  penalty: 'Ceza (1 Kare Geri)',
  finish: 'Varış',
};

// Kare düzeni değişince eski kayıtlı kareler bu sürüm numarasıyla yenilenir.
LP.TILES_VERSION = 4;
// Soru bankası değişince eski kayıtlı sorular ve vakalar bu sürümle yenilenir.
LP.CONTENT_VERSION = 3;
// Sınıf listesi değişince eski kayıtlı isimler bu sürümle yenilenir.
LP.PEOPLE_VERSION = 1;

// Tahta 24 kareden oluşur: 0 başlangıç, 23 varış. Tır her doğru cevapta bir kare ilerler.
LP.DEFAULT_TILES = [
  { type: 'start', name: 'Çıkış Deposu' },
  { type: 'question', name: 'Gelecek Ay', category: 'plan' },
  { type: 'question', name: 'Üretim Modeli', category: 'model' },
  { type: 'chance', name: 'Şanslı Soru' },
  { type: 'question', name: 'Vardiya Kararı', category: 'operasyon' },
  { type: 'question', name: 'Sezonluk Talep', category: 'uretim' },
  { type: 'customs', name: 'Gümrüğe Takıldın' },
  { type: 'question', name: 'Planlama Ofisi', category: 'plan' },
  { type: 'question', name: 'Karar Modeli', category: 'model' },
  { type: 'penalty', name: 'Evrak Eksik' },
  { type: 'question', name: 'Depo Kararı', category: 'operasyon' },
  { type: 'question', name: 'Üretim Hızı', category: 'uretim' },
  { type: 'chance', name: 'Şanslı Soru' },
  { type: 'question', name: 'Talep Masası', category: 'plan' },
  { type: 'question', name: 'Plan Tablosu', category: 'model' },
  { type: 'question', name: 'Maliyet Masası', category: 'operasyon' },
  { type: 'question', name: 'Dönem Planı', category: 'uretim' },
  { type: 'question', name: 'Karar Ofisi', category: 'plan' },
  { type: 'penalty', name: 'Yolda Arıza' },
  { type: 'chance', name: 'Şanslı Soru' },
  { type: 'question', name: 'Sayısal Model', category: 'model' },
  { type: 'question', name: 'Tedarik Kararı', category: 'operasyon' },
  { type: 'question', name: 'Dalgalı Talep', category: 'uretim' },
  { type: 'finish', name: 'Teslimat Noktası' },
];

LP.DEFAULT_QUESTIONS = [
  // Toplu planlama
  { id: 'q1', category: 'plan', text: 'Bir işletme gelecek ay talebin artacağını öngörüyor. Ancak üretim kapasitesini aynı hızda artıramıyor. Bunun temel nedeni nedir?', options: ['Talep tahminlerinin her zaman yanlış olması', 'Kapasite ve işgücünün kısa sürede sınırsız artırılamaması', 'Stok tutmanın hiçbir maliyetinin olmaması', 'Üretim hızının talepten bağımsız olması'], answer: 1, hint: 'Kapasiteyi talep artar artmaz sınırsız biçimde artırabilir miyiz?', explanation: 'Yeni çalışan almak, makine kurmak veya tedarik kapasitesini artırmak zaman ve maliyet gerektirir. Bu nedenle kapasite önceden planlanmalıdır.' },
  { id: 'q2', category: 'plan', text: 'Talep mevcut üretim kapasitesini aştığında aşağıdakilerden hangisi uygun bir planlama alternatifi değildir?', options: ['Fazla mesai yapmak', 'Taşeron kullanmak', 'Önceden oluşturulmuş stoktan yararlanmak', 'Talebi ve kapasiteyi dikkate almadan üretimi rastgele belirlemek'], answer: 3, hint: 'Gerçek bir planlama kararı hangi bilgilere dayanmalıdır?', explanation: 'Fazla mesai, taşeronluk ve stok kullanımı talep artışına karşı uygulanabilecek yöntemlerdir. Rastgele üretim ise planlama ve maliyet kontrolünü bozar.' },
  { id: 'q3', category: 'plan', text: 'Gerçekçi bir toplu plan hazırlamak için hangi bilgi grubu birlikte değerlendirilmelidir?', options: ['Yalnızca geçmiş satışlar', 'Yalnızca çalışan ve makine sayısı', 'Yalnızca mevcut stok miktarı', 'Talep tahmini, maliyetler, kapasite, stok ve operasyonel kısıtlar'], answer: 3, hint: 'Bir planın hem uygulanabilir hem de ekonomik olması için hangi bilgiler gerekir?', explanation: 'Talep tahmini tek başına yeterli değildir. İşletmenin ne kadar üretebileceği, hangi maliyetlerle çalışacağı ve hangi kısıtlarla karşılaşacağı da bilinmelidir.' },
  { id: 'q4', category: 'plan', text: 'Bir işletme stok, fazla mesai ve karşılanamayan siparişler arasında karar verirken temel olarak neyi amaçlamalıdır?', options: ['Her koşulda en düşük stok seviyesini sağlamayı', 'Yalnızca üretim miktarını artırmayı', 'Toplam maliyetleri ve müşteri hizmet düzeyini birlikte dengelemeyi', 'Her dönemde aynı miktarda üretim yapmayı'], answer: 2, hint: 'Sadece stok maliyetini azaltmak, işletmenin bütün maliyetlerini azaltır mı?', explanation: 'Bir maliyeti azaltmak başka bir maliyeti artırabilir. Örneğin stokları düşürmek satış kaybı riskini artırabilir. Amaç, planlama dönemi boyunca toplam sonucu iyileştirmektir.' },
  { id: 'q5', category: 'plan', text: 'Bir işletmenin talep tahmini doğru olmasına rağmen toplu planı başarısız olabilir. Bunun en güçlü açıklaması hangisidir?', options: ['Talep tahmini tek başına yeterli değildir; maliyetler, kapasite ve kısıtlar da dikkate alınmalıdır', 'Doğru talep tahmini varsa planlama yapılamaz', 'Stok ve işgücü kararları arasında ilişki yoktur', 'Toplu planlama yalnızca geçmiş verilerle yapılır'], answer: 0, hint: 'Ne kadar talep geleceğini bilmek, bu talebi karşılayabilecek kaynaklara sahip olmakla aynı şey midir?', explanation: 'Talep doğru tahmin edilse bile işletmenin üretim kapasitesi yetersiz olabilir, maliyetleri yüksek kalabilir veya tedarik süreleri talebi karşılamaya yetmeyebilir.' },
  { id: 'q6', category: 'plan', text: 'Bir işletme, aynı talep tahminini karşılamak için iki farklı üretim planı hazırlamıştır. Birinci plan daha fazla stok tutarken ikinci plan daha fazla taşeronluk kullanmaktadır. İki planı karşılaştırırken en doğru yaklaşım hangisidir?', options: ['Her zaman daha fazla stok tutan planı seçmek', 'Her zaman daha fazla taşeronluk kullanan planı seçmek', 'Yalnızca üretim miktarına bakmak', 'İlgili maliyetleri ve operasyonel kısıtları birlikte değerlendirerek uygun planı seçmek'], answer: 3, hint: 'Stok ve taşeronluk farklı maliyetler doğurabilir; tek bir ölçüte bakmak yeterli değildir.', explanation: 'En uygun planı belirlemek için stok bulundurma ve taşeronluk maliyetleriyle birlikte kapasite ve diğer operasyonel kısıtlar değerlendirilmelidir.' },
  { id: 'q7', category: 'plan', text: 'Stanley Quencher örneğinde talep eylülde 10.000, ekimde 12.000 ve kasımda 30.000 birimdir. Bu talep yapısına göre hangi planlama mantığı daha doğrudur?', options: ['Her ayın üretimini önceki ayın talebiyle aynı tutmak', 'Talep azaldığında üretimi artırarak stok oluşturmak', 'Her ay mutlaka o ayın talebi kadar üretmek ve diğer seçenekleri değerlendirmemek', 'Talep, stok, kapasite ve ilgili maliyetleri birlikte değerlendirerek dönemler arasında üretimi dengelemek'], answer: 3, hint: 'Talep eylülden kasıma doğru belirgin biçimde artıyor; planlama tek bir aya göre yapılmamalıdır.', explanation: 'Üretim planı oluşturulurken dönemsel talep değişimleri, mevcut stok, üretim kapasitesi ve maliyetler birlikte ele alınır; böylece dönemler arasında uygun denge kurulabilir.' },
  { id: 'q8', category: 'plan', text: 'Bir işletmede talep dalgalanmalarının artması, mevcut toplu planın yeniden değerlendirilmesini gerektirebilir. Çünkü toplu planlamada en uygun karar, hangi ikili değiştikçe farklılaşabilir?', options: ['Ürün çeşitliliği ve marka bilinirliği', 'Maliyetler ve operasyonel koşullar', 'Reklam bütçesi ve müşteri yorumları', 'İşletme adı ve organizasyon şeması'], answer: 1, hint: 'Bir stratejinin bugün uygun olması, değişen koşullarda da en iyi seçenek olacağı anlamına gelmez.', explanation: 'Toplu planlamada en uygun karar maliyetlere, kapasiteye, talep değişimlerine ve diğer operasyonel koşullara bağlıdır. Koşullar değiştikçe plan yeniden değerlendirilmelidir.' },
  { id: 'q9', category: 'plan', text: 'Aşağıdakilerden hangisi toplu planlamanın uygulamada kullanılmasıyla ilgili vurgulanan ilkelerden biri değildir?', options: ['Talep tahminlerinde hata olabileceği kabul edilmelidir', 'Yeni bilgiler geldikçe plan güncellenmelidir', 'İşletmenin tek bir bölümü dikkate alınmalıdır', 'Kapasite kullanımı yükseldikçe planlamanın önemi artar'], answer: 2, hint: 'Toplu planlama yalnızca üretim bölümünü değil, tedarik zincirinin diğer süreçlerini de etkiler.', explanation: 'Toplu planlama mümkün olduğunca tüm tedarik zincirini dikkate almalıdır. Yalnızca tek bir bölüme odaklanmak, diğer süreçlerde maliyet ve kapasite sorunlarına neden olabilir.' },
  { id: 'q10', category: 'plan', text: 'Bir işletme için hazırlanan toplu planın değerlendirilmesinde en doğru yaklaşım hangisidir?', options: ['En az stok oluşturan plan her koşulda seçilmelidir', 'Yalnızca üretim miktarının talebe eşit olması yeterlidir', 'Planın işgücü, stok, müşteri hizmeti ve maliyet etkileri birlikte değerlendirilmelidir', 'En yüksek kapasite kullanımını sağlayan plan her zaman en iyisidir'], answer: 2, hint: 'En iyi toplu plan yalnızca tek bir maliyet kalemini veya performans göstergesini iyileştirmeyi hedeflemez.', explanation: 'Toplu planlamada işgücü, stok, kapasite, müşteri hizmet düzeyi ve toplam maliyet birlikte değerlendirilir. Bir alandaki iyileşme başka bir alanda olumsuz sonuç yaratabilir.' },

  // Doğrusal programlama
  { id: 'q11', category: 'model', text: 'Doğrusal programlama ile toplu planlama modelinin temel amacı aşağıdakilerden hangisidir?', options: ['Bütün çalışanların aynı saatlerde çalışmasını sağlamak', 'Her ay aynı miktarda ürün üretmek', 'Talep tahmini yapmadan üretime başlamak', 'Kısıtları dikkate alarak toplam maliyeti mümkün olduğunca azaltan planı bulmak'], answer: 3, hint: 'Modelin amacı, belirli sınırlar altında en uygun sonucu bulmaktır.', explanation: 'Doğrusal programlama, kapasite ve talep gibi kısıtları dikkate alarak toplam maliyeti en aza indiren planı bulmaya yardımcı olur.' },
  { id: 'q12', category: 'model', text: 'Aşağıdakilerden hangisi doğrusal programlama modelinde bir kısıt örneğidir?', options: ['Toplam maliyeti azaltmak istemek', 'Fabrikanın belirli bir ayda en fazla 3.000 ürün üretebilmesi', 'Daha fazla satış yapmayı hedeflemek', 'Müşteri memnuniyetini artırmayı istemek'], answer: 1, hint: 'Kısıt, işletmenin aşamayacağı bir sınır veya uyması gereken bir koşuldur.', explanation: 'Fabrikanın bir ayda en fazla 3.000 ürün üretebilmesi kapasite sınırıdır; bu nedenle modelde kısıt olarak yer alır.' },
  { id: 'q13', category: 'model', text: 'Bir işletme toplam maliyeti azaltmak istemekte ve fabrikasının ayda en fazla 3.000 ürün üretebildiğini bilmektedir. Doğrusal programlama modelinde bu iki bilgi nasıl sınıflandırılır?', options: ['Toplam maliyeti azaltmak amaç, üretim kapasitesi karar fonksiyonudur', 'Toplam maliyeti azaltmak amaç fonksiyonu, üretim kapasitesi kısıttır', 'Her iki bilgi de karar değişkenidir', 'Her iki bilgi de talep tahminidir'], answer: 1, hint: 'İşletmenin neyi başarmak istediği amaçtır; aşamayacağı sınır ise kısıttır.', explanation: 'Toplam maliyeti azaltmak amaç fonksiyonudur. Ayda en fazla 3.000 ürün üretilebilmesi ise kapasite kısıtıdır.' },
  { id: 'q14', category: 'model', text: 'Aşağıdaki ifadelerden yanlış olan hangisidir?', options: ['Stok bulundurmak, talebi sonraki dönemde karşılamaya yardımcı olabilir', 'Fazla mesai, üretim kapasitesini artırmanın yollarından biridir', 'Doğrusal programlamada bütün karar değişkenleri amaç fonksiyonunu en büyük yapmak için kullanılır', 'Dış kaynak kullanımı, işletmenin kendi üretimi dışında üretim yaptırmasını ifade eder'], answer: 2, hint: 'Amaç fonksiyonu her zaman en büyük değeri bulmak zorunda değildir; maliyetin azaltılması da hedeflenebilir.', explanation: 'Yanlış ifade üçüncü seçenektir. Amaç fonksiyonu probleme göre en küçük veya en büyük yapılabilir; maliyet minimizasyonunda hedef toplam maliyeti en aza indirmektir.' },
  { id: 'q15', category: 'model', text: 'Bir işletmenin üretim miktarını belirlerken hem talebi karşılaması hem de üretim kapasitesi sınırını aşmaması gerekir. Bu durum doğrusal programlama modelinde ne ile ifade edilir?', options: ['Yalnızca amaç fonksiyonuyla', 'Kapasite kısıtıyla', 'Yalnızca stok maliyetiyle', 'İşe alma kararıyla'], answer: 1, hint: 'Üretimin belirli bir üst sınırı aşmamasını sağlayan kavramı düşünün.', explanation: 'Üretim miktarının fabrikanın kapasitesini aşmaması, doğrusal programlama modelinde kapasite kısıtıyla ifade edilir.' },
  { id: 'q16', category: 'model', text: 'Üretim miktarının mevcut işgücü ve kullanılabilir normal ya da fazla mesai kapasitesini aşamaması, toplu planlama modelinde hangi kısıtla ifade edilir?', options: ['Stok dengesi', 'Üretim kapasitesi', 'İşgücü dengesi', 'Amaç fonksiyonu'], answer: 1, hint: 'Bu kısıt, işletmenin mevcut kaynaklarıyla en fazla ne kadar üretim yapabileceğini sınırlar.', explanation: 'Üretim kapasitesi kısıtı, planlanan üretimin mevcut işgücü, makine ve kullanılabilir çalışma süresiyle gerçekleştirilebilir olmasını sağlar.' },

  // İşgücü ve kapasite
  { id: 'q17', category: 'operasyon', text: 'Bir işletme artan talebi sürekli fazla mesai yaparak karşılıyor. Bu kararın olası sonucu hangisidir?', options: ['Stok maliyetinin kesinlikle sıfırlanması', 'Makine kapasitesinin otomatik olarak artması', 'Talep tahminine ihtiyaç kalmaması', 'İşçilik maliyetlerinin artması ve çalışanların zorlanması'], answer: 3, hint: 'Fazla mesai kapasiteyi artırırken işletmeye neye mal olur?', explanation: 'Fazla mesai üretimi artırabilir ancak ek işçilik maliyeti doğurur. Ayrıca çalışanların sürekli fazla çalışması sürdürülebilir olmayabilir.' },
  { id: 'q18', category: 'model', text: 'Bir işletme, gelecek dönemlerdeki talebe göre çalışan sayısını artırmayı veya azaltmayı değerlendiriyor. Bu karar hangi alanla ilgilidir?', options: ['Inventory – Stok', 'Workforce – İşgücü', 'Backlog – Ertelenmiş talep', 'Demand Forecast – Talep tahmini'], answer: 1, hint: 'Çalışan sayısıyla ilgili kararlar hangi kaynakla ilgilidir?', explanation: 'Workforce kararı, işletmenin ihtiyaç duyduğu çalışan sayısını ve gerektiğinde işe alma veya işten çıkarma durumlarını kapsar.' },
  { id: 'q19', category: 'operasyon', text: 'Bir işletme kendi üretim kapasitesiyle siparişleri karşılayamıyor ve üretimin bir kısmını başka bir firmaya yaptırıyor. Bu uygulama nedir?', options: ['Inventory Holding', 'Stockout', 'Subcontracting', 'Workforce Reduction'], answer: 2, hint: 'Üretimi kendi işletmen yerine başka bir firmaya yaptırıyorsan hangi yöntemi kullanıyorsun?', explanation: 'Subcontracting, işletmenin üretimin bir bölümünü dışarıdaki bir firmaya yaptırmasıdır. İç kapasiteyi destekler ancak ek maliyet yaratabilir.' },
  { id: 'q20', category: 'model', text: 'Normal zaman işçilik ücreti saatte 4 dolar, fazla mesai ücreti saatte 6 dolardır. Bir ürün 4 saat işçilik gerektiriyorsa, yalnızca işçilik açısından fazla mesaiyle üretilen bir ürünün maliyeti normal zaman işçiliğine göre ne kadar daha fazladır?', options: ['2 dolar', '4 dolar', '6 dolar', '8 dolar'], answer: 3, hint: 'Önce normal zaman ve fazla mesai arasındaki saatlik ücret farkını bulun, sonra 4 saatle çarpın.', explanation: 'Saatlik ücret farkı 6 − 4 = 2 dolardır. Ürün 4 saat gerektirdiği için ek işçilik maliyeti 2 × 4 = 8 dolardır.' },
  { id: 'q21', category: 'model', text: 'Bir işletmede geçen ay 40 çalışan bulunmaktadır. Yeni ayda 6 kişi işe alınmış, 3 kişi işten çıkarılmıştır. İşgücü dengesi kısıtına göre yeni aydaki çalışan sayısı kaçtır?', options: ['37', '40', '43', '49'], answer: 2, hint: 'İşgücü dengesi hesaplanırken önceki çalışan sayısına işe alınanlar eklenir, işten çıkarılanlar düşülür.', explanation: '40 + 6 − 3 = 43 çalışan. İşgücü dengesi kısıtı, dönemler arasındaki çalışan sayısı değişimini gösterir.' },
  { id: 'q22', category: 'model', text: 'Aylık normal üretim kapasitesi 1.000 birimdir. İlk iki ayın sonunda stok kalmamış, üçüncü ayda talep 1.500 birime yükselmiştir. Üçüncü aydaki 500 birimlik açığı, müşteri taleplerini ertelemeden kapatmak için aşağıdaki yöntemlerden hangisi kullanılamaz?', options: ['Fazla mesai uygulayarak mevcut işgücünün üretim kapasitesini artırmak', 'Karşılanamayan 500 birimlik talebi bir sonraki döneme aktarmak', 'Taşeron üretiminden yararlanarak ek üretim sağlamak', 'Ek işgücü veya makine kapasitesiyle normal üretim kapasitesini artırmak'], answer: 1, hint: 'Kapasite açığını kapatmak ile karşılanamayan talebi sonraki döneme ertelemek aynı şey değildir.', explanation: 'Talebi sonraki döneme aktarmak (backlog), 500 birimlik kapasite açığını mevcut dönemde kapatmaz; yalnızca karşılanamayan talebi erteler. Fazla mesai, taşeron üretimi ve kapasite artırımı ise açığı kapatmak için kullanılabilir.' },

  // Stok ve talep
  { id: 'q23', category: 'operasyon', text: 'Bir işletmenin gelecek ay talebinin artması bekleniyor. Şimdiden üretip stok oluşturması hangi durumda mantıklı olabilir?', options: ['Stok maliyeti her zaman sıfırsa', 'Gelecekteki talep kesinlikle artmayacaksa', 'Önceden stoklamanın toplam maliyeti, yoğun dönemdeki alternatiflerden daha düşükse', 'İşletme talep tahminini dikkate almıyorsa'], answer: 2, hint: 'Önceden üretmenin maliyetini, daha sonra üretmenin maliyetiyle karşılaştır.', explanation: 'Önceden üretim yapmak, yoğun dönemdeki fazla mesai veya taşeronluk maliyetini azaltabilir. Ancak stoklama da depolama ve fire maliyeti yaratır.' },
  { id: 'q24', category: 'operasyon', text: 'Bir işletme depolama maliyetini azaltmak amacıyla stoklarını çok düşük tutuyor. Talep beklenenden yüksek gerçekleşirse ne olabilir?', options: ['Karşılanamayan siparişler ve satış kaybı oluşabilir', 'Teslimat kapasitesi kendiliğinden artar', 'Müşteri memnuniyeti mutlaka yükselir', 'Üretim maliyetleri kesinlikle sıfırlanır'], answer: 0, hint: 'Depoda yeterli ürün yoksa müşteri siparişi nasıl karşılanır?', explanation: 'Düşük stok, depolama maliyetini azaltabilir. Ancak talep arttığında ürün bulunamaması, geciken siparişlere ve kaybedilen satışlara yol açabilir.' },
  { id: 'q25', category: 'operasyon', text: 'Toplu planlamada talep tahmininin yüksek çıkması, gerçek talep daha düşük olduğunda işletmenin gereğinden fazla üretim yapmasına ve hangi maliyetin artmasına neden olabilir?', options: ['Stok bulundurma maliyeti', 'İşe alma maliyetinin her koşulda sıfırlanması', 'Üretim kapasitesinin tamamen ortadan kalkması', 'Talep tahmininin gereksiz hale gelmesi'], answer: 0, hint: 'Gerçek talep tahmin edilenden düşükse üretilen ürünlerin bir kısmı satılmadan kalabilir.', explanation: 'Talep olduğundan yüksek tahmin edilirse işletme gereğinden fazla üretim yapabilir. Satılmayan ürünler depoda bekleyeceği için stok bulundurma maliyeti artabilir.' },
  { id: 'q26', category: 'operasyon', text: 'Çamlıca Gıda\'da hatalı talep tahminleri nedeniyle bazı siparişlerin planlanan tedarikle karşılanamaması hangi riski, gereğinden fazla ürün sipariş edilmesi ise hangi riski artırır?', options: ['Stok fazlası riskini ve kapasite artışı riskini', 'Backlog/stoksuzluk riskini ve stok fazlası riskini', 'Fazla mesai riskini ve işgücü azalması riskini', 'Kapasite kullanımı riskini ve taşeronluk riskini'], answer: 1, hint: 'Talebin altında ve üzerinde tedarik yapılmasının doğurabileceği iki farklı sorunu düşünün.', explanation: 'Yetersiz tedarik, siparişlerin ertelenmesine veya karşılanamamasına (backlog/stoksuzluk) neden olabilir. Fazla tedarik ise stok birikimine yol açar. Kısa raf ömürlü ürünlerde stok fazlası ayrıca bozulma riski taşır.' },
  { id: 'q27', category: 'operasyon', text: 'Çamlıca Gıda için hazırlanan karma planda her ay 950 ton temel tedarik yapılacağı varsayılmıştır. Şubat talebi 1.150 ton olduğuna göre talebin tamamını karşılamak için kaç ton ek tedarik planlanmalıdır?', options: ['100 ton', '150 ton', '200 ton', '250 ton'], answer: 2, hint: 'Ek tedarik ihtiyacını bulmak için toplam talepten planlanan temel tedarik miktarını çıkarın.', explanation: '1.150 − 950 = 200 ton. Örnek karma planda 950 ton temel tedarike ek olarak 200 ton tedarik planlanır.' },

  // Planlama stratejileri
  { id: 'q28', category: 'uretim', text: 'Stok tutma maliyetleri çok yüksek, ancak kapasiteyi veya iş gücünü kısa sürede değiştirmek görece düşük maliyetli ve kolay ise en uygun toplu planlama stratejisi hangisidir?', options: ['Sabit düzey stratejisi (level)', 'Kovalama stratejisi (chase)', 'Zaman esnekliği stratejisi (time flexibility)', 'Ertelenmiş talep stratejisi (backlog)'], answer: 1, hint: 'Depo ve stok maliyetini sıfırlamak adına üretimi ve iş gücünü doğrudan anlık talebe eşitleyen stratejiye odaklanın.', explanation: 'Kovalama stratejisinde temel kaldıraç kapasitedir. Stok tutma maliyeti yüksek, kapasiteyi ve iş gücünü değiştirme maliyeti düşük olduğunda üretimin talebi anlık olarak izlemesi en ekonomik çözümdür.' },
  { id: 'q29', category: 'uretim', text: 'Kovalama stratejisinde talep dalgalanmalarına uyum için sık sık işe alma ve işten çıkarma yapılması işletmede öncelikle neye yol açar?', options: ['Depo alanının yetersiz kalması ve yüksek stok taşıma maliyeti', 'Yüksek miktarda ertelenmiş sipariş ve ceza maliyetleri', 'Çalışan morali üzerinde olumsuz etki ve yüksek iş gücü değişim maliyeti', 'Makine kapasitesinin sürekli tam kullanımında oluşan aşırı yıpranma'], answer: 2, hint: 'İnsan kaynaklarında sürekli sirkülasyonun tazminat, eğitim ve organizasyonel iklim üzerindeki etkilerini değerlendirin.', explanation: 'Kovalama stratejisinde kapasiteyi sürekli değiştirmek; işe alma, eğitim, kıdem ve ihbar tazminatı maliyetleri yaratır ve çalışan moralini olumsuz etkiler.' },
  { id: 'q30', category: 'uretim', text: 'Zaman esnekliği stratejisinde iş gücü seviyesi olabildiğince sabit tutulurken talep dalgalanmaları hangi kaldıraçla karşılanır?', options: ['Güvenlik stoğu seviyelerini artırıp azaltmak', 'Çalışılan saatleri (fazla mesai / esnek çalışma) değiştirmek', 'Sürekli dış kaynak ve taşeron kullanımı', 'Talebi sonraki dönemlere ertelemek'], answer: 1, hint: 'Personel kadrosuna dokunulmadan yalnızca çalışma süreleri esnetilmektedir.', explanation: 'Zaman esnekliği stratejisinde temel kaldıraç çalışma süresi ve kullanım oranıdır; iş gücü kadrosu sabit tutularak vardiya saatleri ve fazla mesai esnetilir.' },
  { id: 'q31', category: 'uretim', text: 'Hangi koşulda zaman esnekliği stratejisi uygulanabilir ve mantıklı bir seçenek olur?', options: ['Stok taşıma maliyetinin çok düşük, makine kapasitesinin kısıtlı olması', 'Stok taşıma maliyetinin yüksek, kullanılabilir makine ve iş gücü kapasitesinin esnek ve ucuz olması', 'İşe alma ve işten çıkarma maliyetlerinin sıfıra yakın olması', 'Müşterilerin sipariş gecikmelerini sorunsuz kabul etmesi'], answer: 1, hint: 'Stok biriktirmenin maliyetli olduğu durumlarda eldeki esnek mesai ve makine kapasitesi öne çıkar.', explanation: 'Stok tutmak yüksek maliyetliyse stok biriktirmek mantıksızdır. Makine ve iş gücü kapasitesi fazla mesaiye uygunsa çalışma saatlerini esnetmek doğru seçimdir.' },
  { id: 'q32', category: 'uretim', text: 'Sabit düzey stratejisinde makine kapasitesi, iş gücü ve üretim hızı dönemler boyunca sabit tutulur. Dalgalı talepte en temel operasyonel sonuç nedir?', options: ['Düşük talep dönemlerinde yüksek stok, yüksek talep dönemlerinde stok tüketimi veya backlog birikmesi', 'Dönemler arasında sürekli değişen işçi sayısı ve yüksek tazminat giderleri', 'Fazla mesai ücretlerinin bütçe üzerinde yarattığı aşırı baskı', 'Üretim hattının sürekli dur-kalk yapması nedeniyle düşen makine verimliliği'], answer: 0, hint: 'Üretim miktarı talepten bağımsız sabit seyrettiğinde, talep düşüşlerinde fazla üretimin nereye gittiğini düşünün.', explanation: 'Sabit düzey stratejisinde temel kaldıraç stoktur. Üretim hızı sabit olduğu için talep düşüşlerinde fazla üretim depolanır, talep artışlarında ise bu stok tüketilir.' },
  { id: 'q33', category: 'uretim', text: 'Yüksek kurulum maliyetleri bulunan, makine ve çalışan istikrarına önem veren, stok tutma maliyeti ise nispeten düşük olan bir firma için en uygun strateji hangisidir?', options: ['Kovalama stratejisi', 'Sabit düzey stratejisi', 'Zaman esnekliği stratejisi', 'Taşeron ağırlıklı kovalama stratejisi'], answer: 1, hint: 'Üretim hattını durdurup açmanın maliyetli olduğu ve depolama giderlerinin tolere edilebildiği senaryoya odaklanın.', explanation: 'Üretim hattı istikrarı kritikse ve stok tutma maliyetleri görece düşükse, hattı bozmadan sabit hızda üretip stok biriktirmek en mantıklı karardır.' },
  { id: 'q34', category: 'uretim', text: 'Aşağıdaki eşleştirmelerden hangisi strateji ile ana kaldıracı açısından yanlıştır?', options: ['Kovalama: kapasite ve iş gücü değişimi', 'Zaman esnekliği: çalışma süresi ve kullanım oranı', 'Sabit düzey: stok ve backlog', 'Sabit düzey: işe alma ve işten çıkarma'], answer: 3, hint: 'Sabit düzey stratejisinin temel prensibi iş gücü ve üretim kapasitesinin sabit tutulmasıdır.', explanation: 'İşe alma ve işten çıkarma kararları kovalama stratejisinin temel kaldıracıdır. Sabit düzey stratejisinde iş gücü sabit tutulur, kaldıraç olarak stok kullanılır.' },
  { id: 'q35', category: 'operasyon', text: 'Bir işletme sabit işgücü ve kapasiteyle üretim yapmaktadır. Talebin düşük olduğu aylarda stok oluşturmakta, yüksek olduğu aylarda bu stokları kullanmaktadır. Bu yaklaşımın temel riski nedir?', options: ['Her ay çalışan sayısının zorunlu olarak değişmesi', 'İşe alım maliyetinin her ay sıfırlanması', 'Taşeronluk miktarının mutlaka artması', 'Yüksek stok bulundurma maliyeti veya talep karşılanamadığında backlog oluşması'], answer: 3, hint: 'Düşük talep döneminde biriktirilen ürünlerin depoda beklemesi de, talep karşılanamazsa siparişlerin gecikmesi de risk yaratır.', explanation: 'Sabit işgücü ve kapasiteyle stok oluşturarak talebi dengelemek, stok bulundurma maliyetini artırabilir. Stok yetersiz kalırsa karşılanamayan talep (backlog) oluşabilir.' },
  { id: 'q36', category: 'operasyon', text: 'Normal üretim kapasitesi aylık 1.000 birimdir. İlk ay talep 800, ikinci ay 1.200 birimdir. Başlangıç stoku sıfır ve stok kaybı yoksa, sabit düzey stratejisiyle her ay 1.000 birim üretilmesi sonucunda ikinci ay sonunda stok durumu ne olur?', options: ['200 birim stok fazlası', '200 birim karşılanamayan talep', 'Stok sıfır, talep tamamen karşılanır', '400 birim stok fazlası'], answer: 2, hint: 'İlk ayın sonunda oluşan stokun ikinci ayın talebini karşılamak için kullanılabileceğini unutmayın.', explanation: 'İlk ay 200 birim stok oluşur. İkinci ay 1.000 birim üretim ve 200 birim stokla toplam 1.200 birim talep karşılanır. Dönem sonunda stok sıfırdır.' },
  { id: 'q37', category: 'operasyon', text: 'Stok bulundurma maliyeti önemli ölçüde artarken fazla mesai maliyeti düşmektedir. Diğer koşullar sabitken hangi yorum daha uygundur?', options: ['Sabit düzey stratejisi kesinlikle daha avantajlı olur', 'İşgücü sayısının sürekli artırılması zorunludur', 'Zaman esnekliği yaklaşımı daha cazip hale gelebilir', 'Toplu planı güncellemeye gerek kalmaz'], answer: 2, hint: 'Stok tutmanın pahalı, çalışma saatlerini artırmanın daha ekonomik olduğu bir durumu düşünün.', explanation: 'Stok maliyeti arttığında sabit üretimle stok biriktirmek daha maliyetli olabilir. Fazla mesai ucuzladığında çalışma saatlerini talebe göre ayarlayan zaman esnekliği stratejisi daha avantajlı hale gelebilir.' },

  // Karma strateji
  { id: 'q38', category: 'uretim', text: 'İşletmelerin yalnızca tek bir stratejiye bağlı kalmak yerine karma strateji kullanmasının temel sebebi nedir?', options: ['Doğrusal programlama modellerinin tekli stratejileri çözmede yetersiz kalması', 'Tek bir stratejinin getirdiği yüksek risk ve maliyetleri; kapasite, stok ve fazla mesaiyi birlikte dengeleyerek optimize etmek', 'İş kanununun şirketleri tek bir üretim yöntemi kullanmaktan men etmesi', 'Müşteri talebinin her ay tamamen sabit ve öngörülebilir olması'], answer: 1, hint: 'Tek bir değişkene aşırı bağımlı olmanın yarattığı riskleri birden fazla araçla dengeleme ihtiyacını düşünün.', explanation: 'Tek bir seçeneğe tamamen bağlı kalmak ekstrem maliyetler yaratır. Karma strateji, birden fazla aracı birleştirerek en düşük toplam maliyetli çözümü sunar.' },
  { id: 'q39', category: 'uretim', text: 'Bir beyaz eşya üreticisi temel üretim seviyesini yıl boyunca sabit tutmakta, yazın talep patlamasında önce sınırlı fazla mesai yaptırmakta, kapasite yetmezse bazı parçaların üretimini dış tedarikçilere kaydırmaktadır. Bu yaklaşım hangisidir?', options: ['Saf kovalama stratejisi', 'Saf sabit düzey stratejisi', 'Karma strateji', 'Yalnızca zaman esnekliği stratejisi'], answer: 2, hint: 'İşletme tek bir yöntem yerine sabit üretim, fazla mesai ve taşeronluk kaldıraçlarını birlikte kullanmaktadır.', explanation: 'Temel üretimi sabit tutarken sezonsal artışlarda fazla mesai ve taşeronluğu bir arada kullanmak tipik bir karma strateji örneğidir.' },
  { id: 'q40', category: 'uretim', text: 'Planlaması ve uygulaması daha karmaşık olmasına rağmen bütünleşik toplam maliyeti en aza indirmeyi hedefleyen strateji hangisidir?', options: ['Sabit düzey stratejisi', 'Kovalama stratejisi', 'Karma strateji', 'Zaman esnekliği stratejisi'], answer: 2, hint: 'Çözüm kümesinde stok, mesai, taşeron ve iş gücü gibi birden fazla karar değişkeni içeren yapı değerlendirilmelidir.', explanation: 'Karma strateji birden fazla aracı bir arada kullandığı için planlaması daha karmaşıktır, ancak en dengeli ve optimal toplam maliyeti verir.' },
  { id: 'q41', category: 'uretim', text: 'Çamlıca Gıda siparişlerini iki gün önceden vermekte ve ürünleri depoda uzun süre tutmak istememektedir. En uygun yönetimsel öneri hangisidir?', options: ['Talep tahmininden vazgeçip tüm siparişleri acil karşılamak', 'Talep artışlarını önceden tahmin ederek temel ve ek tedariki birlikte planlamak', 'Tüm aylık talebi tek seferde depolamak', 'Her ay yalnızca sabit miktarda tedarik yapıp talep değişimlerini göz ardı etmek'], answer: 1, hint: 'Siparişlerin önceden verilmesi gerekiyorsa ve ürünlerin raf ömrü kısaysa, hangi yaklaşım iki sorunu birlikte yönetebilir?', explanation: 'İki günlük sipariş süresi ve kısa stoklama hedefi, talebin önceden tahmin edilmesini önemli hale getirir. Planlı temel tedarik ile ihtiyaçlara göre ek tedarikin birlikte kullanılması karma stratejiye uygundur.' },
];

// Tahta sorularından ayrıdır. Gümrükte kalanları kurtarmak için oyun sonunda sorulan tek vaka.
LP.DEFAULT_CASES = [
  {
    id: 'koctas',
    title: 'Koçtaş Örneği',
    hint: 'Hacimli ürünlerin yarattığı depolama kısıtı, nitelikli personelden doğan iş gücü kısıtı ve pazardaki rekabet koşulları bir arada değerlendirilmelidir.',
    text: 'Koçtaş, bahar ve yazdaki bahçe mobilyası, dış mekan aydınlatma ve inşaat/boya talebini karşılamak için 6 aylık toplu plan hazırlıyor. Amaç, toplam maliyeti düşürmek ve ürün bulunurluğunu korumak.\n1. Ürünler depoda çok yer kaplıyor; stok tutma maliyeti yüksek.\n2. Montaj, depo ve teslimat personeli nitelikli. İşten çıkarmak tazminat ve prestij kaybı, yeni işçi almak ise uzun eğitim gerektiriyor.\n3. Pik dönemde kendi depoları ve araç filosu fiziki kapasite sınırına ulaşıyor.\nBu kısıtlara göre en uygun toplu planlama stratejisi hangisidir?',
    options: [
      'Saf kovalama stratejisi: Depolama maliyetinden kaçınmak için bahar sezonunda hızla binlerce geçici işçi işe alınmalı, sezon bitince bu işçiler derhal işten çıkarılmalıdır.',
      'Saf sabit düzey stratejisi: Kalifiye iş gücünü korumak için kıştan itibaren mağaza ve ana depolarda sabit hızda yüksek stok biriktirilmeli, yazın tüm satışlar bu stoktan karşılanmalıdır.',
      'Karma strateji: Çekirdek iş gücü ve temel depolama kapasitesi sabit tutulmalı; sezonsal artışta önce esnek fazla mesai yaptırılmalı, kapasitenin yetmediği tepe noktada ise dış kaynak lojistik (3PL) hizmeti kullanılmalıdır.',
      'Ertelenmiş talep stratejisi: Üretim ve tedarik sabit tutulmalı; sezonda ürünü bulamayan müşterilere teslimatın 2-3 ay sonra yapılacağı bildirilerek siparişler ertelenmelidir.',
    ],
    answer: 2,
    explanation: 'Personel nitelikli olduğu için sürekli işçi alıp çıkarmak yüksek tazminat ve eğitim maliyeti doğurur.\nBahçe mobilyaları çok yer kapladığı için aylarca önceden devasa stok biriktirmek depo kirası ve kilitlenen sermaye maliyetini tavan yaptırır.\nMüşteriye teslimatı ertelemek, müşterinin rakip yapı markete kaçmasına yol açar.\nÇekirdek kadroyu koruyup sezonda fazla mesai yaptırmak ve kapasitenin yetmediği uç noktada taşeron (3PL) kullanmak, maliyeti en aza indiren karma stratejidir.',
  },
];

LP.BOX_TYPES = {
  help: { label: 'Yardım Al', icon: '🤝' },
  fifty: { label: '2 Yanlış Şık Elenir', icon: '✂️' },
  hint: { label: 'İpuçlu Soru', icon: '💡' },
  advance: { label: '2 Kare İlerle', icon: '🚚' },
};

// Yalnızca son şans karesinde açılır. İlk şans karelerinin kutusuna konmaz.
LP.ADVANCE_BOX = {
  id: 'b-advance',
  type: 'advance',
  text: 'Soruyu cevaplamadan 2 kare ilerleme hakkı kazandın, tebrikler!',
};

LP.DEFAULT_BOXES = [
  { id: 'b1', type: 'help', text: 'Sınıftan istediğin bir arkadaşından yardım alabilirsin!' },
  { id: 'b2', type: 'fifty', text: 'Şanslısın! İki yanlış şık elenecek.' },
  { id: 'b3', type: 'hint', text: 'İpuçlu soru! Soruyla birlikte bir ipucu göreceksin.' },
  { id: 'b4', type: 'help', text: 'Sınıfa danış! Arkadaşlarınla birlikte tartışabilirsin.' },
  { id: 'b5', type: 'fifty', text: 'Yarı yarıya! İki yanlış şık elenecek.' },
];

LP.DEFAULT_PEOPLE = [
  'Ahmet Kerem YILMAZ',
  'Alperen BALAHORLU',
  'Ensar ÇAPAN',
  'Hüseyin Cahit ŞEN',
  'İclal Hatice TEMEL',
  'Hümeyra BEYHAN',
  'Faruk BAYRAKTAR',
  'Simay Çağla İLGÜNER',
  'Fatih SUNA',
  'Zeynep YURDAER',
  'Emirhan BAYRAKAL',
  'Alperen KALAFAT',
  'Muhammed Enes GÜRSOY',
  'Beyza TEMİZ',
  'Muhammed Yahya YILDIRIM',
  'Muhammed Emin POYRAZ',
  'Eyyüb Ensar YALDIZ',
  'Mikail MARAŞ',
  'Emrincan GÖKTAŞ',
  'Mustafa Ediz KAÇMAZ',
  'Emin KOÇ',
  'Yunus Emre GENÇ',
  'Berke Doğu TÜRKER',
  'Türkay ÖZER',
  'Bakhytgul JAILAUBAI',
  'Tamimou Yari DRAMANE',
  'Ahmet Sadık AYDOĞAN',
  'Neslihan KARACİMŞİTOĞLU',
  'Şakir ACAR',
  'Meryem GÖK',
  'Reyhan YILDIRAN',
  'Esmanur CİVİL',
  'Ahmet Nihat Sami BADEM',
  'Emir Can AKINCI',
  'Sude ŞAKAR',
  'Yasemin KOCA',
  'Zeynep AVCI',
  'Yusuf Kaan ÇAĞLAR',
  'Polen SEÇKİN',
  'Mehmet ARDA',
  'Oğuzhan NARMANLI',
  'Nazife Elanur GÜNEŞ',
  'Ahmet Bera SEVER',
  'Melin ÇAKIR',
  'Emin YETİŞ',
  'Hamza UZÇİRCİ',
  'Enes ASAROĞLU',
  'Hümeyra Nur AKTAŞ',
  'Yasemin VAZOĞLU',
  'Fatma Gizem ŞEN',
  'İlayda KAVZAN',
  'Mertcan ŞAHİN',
  'Merve KELER',
  'Nisa BAYRAK',
  'Ayşe Nur KARATAŞ',
  'Yunuscan TAŞDEMİR',
  'Eren KESKİN',
  'Güllü SOLAK',
  'Abdollahim RIKI',
  'Samira Jemal JIBRIL',
  'Yıldız Şevval YARDIMCI',
  'Sudenaz ERBEN',
  'Rahman MAMMADOV',
  'Rafiya ZHORABEK',
  'Emira OSMANI',
  'Daouda CISSE',
  'Mukhamammadamin ZOKIROV',
  'Hüsnanur TAŞTAN',
  'Ömer Faruk SEZGİN',
  'Emir İPEK',
];

LP.DEFAULT_SETTINGS = {
  pawn: 'tir',
  boxCount: 3,
  adminPassword: 'logipoly',
};
