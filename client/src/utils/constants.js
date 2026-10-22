// Ethiopian administrative cascade: Region -> Zone -> Woreda.
// Kebele options are a fixed 01–12 range in AddressDropdown (not stored per woreda).
//
// Scope: 9 regional states used by this app (excludes Addis Ababa, Dire Dawa,
// Benishangul-Gumuz, Gambella, Harari per original product scope).
// Zones aim for complete coverage of each region; woredas list documented
// administrative woredas/cities for each zone (not every rural kebele).
// Names follow common English transliterations used in government/CSA materials.

const w = (name) => ({ name, kebeles: [] }); // kebeles supplied by AddressDropdown 01–12

export const regionsData = {
  oromia: {
    name: 'Oromia',
    zones: {
      eastShewa: {
        name: 'East Shewa',
        woredas: {
          adama: w('Adama'),
          adea: w('Adea'),
          akaki: w('Akaki'),
          boset: w('Boset'),
          dugda: w('Dugda'),
          fantale: w('Fentale'),
          gedeoLume: w('Lume'),
          libenChukala: w('Liben Chukala'),
          bora: w('Bora'),
          gimbichu: w('Gimbichu'),
        },
      },
      westShewa: {
        name: 'West Shewa',
        woredas: {
          ambo: w('Ambo'),
          dendi: w('Dendi'),
          ejere: w('Ejere'),
          elfeta: w('Elfeta'),
          gelan: w('Gelan'),
          jeldu: w('Jeldu'),
          metaRobi: w('Meta Robi'),
          midakegn: w('Midakegn'),
          tokeKutaye: w('Toke Kutaye'),
          wenchi: w('Wenchi'),
        },
      },
      northShewaOromia: {
        name: 'North Shewa',
        woredas: {
          salale: w('Salale'),
          debrelibanos: w('Debre Libanos'),
          degem: w('Degem'),
          gerarJarso: w('Gerar Jarso'),
          hidabuAbote: w('Hidabu Abote'),
          kuyu: w('Kuyu'),
          waraJarso: w('Wara Jarso'),
          yayaGulele: w('Yaya Gulele'),
        },
      },
      southwestShewa: {
        name: 'Southwest Shewa',
        woredas: {
          waliso: w('Waliso'),
          ameya: w('Ameya'),
          becho: w('Becho'),
          dawo: w('Dawo'),
          goro: w('Goro'),
          ilu: w('Ilu'),
          sadenSodo: w('Seden Sodo'),
          tole: w('Tole'),
        },
      },
      arsi: {
        name: 'Arsi',
        woredas: {
          asella: w('Asella'),
          bekoji: w('Bekoji'),
          digelunaTijo: w('Digeluna Tijo'),
          dodota: w('Dodota'),
          inkoloWabe: w('Inkolo Wabe'),
          limuBilbilo: w('Limu Bilbilo'),
          munessa: w('Munessa'),
          robe: w('Robe'),
          shirka: w('Shirka'),
          tena: w('Tena'),
          tijo: w('Tijo'),
          ziwayDugda: w('Ziway Dugda'),
        },
      },
      westArsi: {
        name: 'West Arsi',
        woredas: {
          shashemene: w('Shashemene'),
          arsiNegele: w('Arsi Negele'),
          adaba: w('Adaba'),
          dodola: w('Dodola'),
          gedebAsasa: w('Gedeb Asasa'),
          kofele: w('Kofele'),
          kore: w('Kore'),
          nensebo: w('Nensebo'),
          shala: w('Shala'),
          siraro: w('Siraro'),
        },
      },
      bale: {
        name: 'Bale',
        woredas: {
          robeTown: w('Robe'),
          dinsho: w('Dinsho'),
          gasera: w('Gasera'),
          ginir: w('Ginir'),
          gohaTsion: w('Goba'),
          berbere: w('Berbere'),
          dellomena: w('Dellomena'),
          harenaBuluk: w('Harena Buluk'),
          medaWelabu: w('Meda Welabu'),
          sinana: w('Sinana'),
        },
      },
      eastBale: {
        name: 'East Bale',
        woredas: {
          ginnir: w('Ginnir'),
          daweKachen: w('Dawe Kachen'),
          legehida: w('Legehida'),
          rayitu: w('Rayitu'),
          sewenaber: w('Sewena'),
        },
      },
      borena: {
        name: 'Borena',
        woredas: {
          yabello: w('Yabello'),
          arero: w('Arero'),
          dire: w('Dire'),
          dhas: w('Dhas'),
          dillo: w('Dillo'),
          miyo: w('Miyo'),
          moyale: w('Moyale'),
          teltele: w('Teltele'),
        },
      },
      guji: {
        name: 'Guji',
        woredas: {
          negele: w('Negele'),
          adola: w('Adola'),
          annaSorra: w('Anna Sorra'),
          oddoShakiso: w('Oddo Shakiso'),
          uraga: w('Uraga'),
          bore: w('Bore'),
          liben: w('Liben'),
        },
      },
      westGuji: {
        name: 'West Guji',
        woredas: {
          buleHora: w('Bule Hora'),
          abaya: w('Abaya'),
          gelana: w('Gelana'),
          hageremariam: w('Hageremariam'),
          kercha: w('Kercha'),
          melkaSoda: w('Melka Soda'),
        },
      },
      jimma: {
        name: 'Jimma',
        woredas: {
          jimmaCity: w('Jimma'),
          agaro: w('Agaro'),
          dedo: w('Dedo'),
          gomma: w('Gomma'),
          kersa: w('Kersa'),
          limuKosa: w('Limu Kosa'),
          mana: w('Mana'),
          omenada: w('Omo Nada'),
          sekachokorsa: w('Seka Chekorsa'),
          sigmo: w('Sigmo'),
        },
      },
      illuAbaBora: {
        name: 'Illu Aba Bora',
        woredas: {
          mettu: w('Mettu'),
          bedele: w('Bedele'),
          alle: w('Alle'),
          bure: w('Bure'),
          chora: w('Chora'),
          daboHana: w('Dabo Hana'),
          darimu: w('Darimu'),
          didu: w('Didu'),
          gechi: w('Gechi'),
          hurumu: w('Hurumu'),
        },
      },
      bunnoBedelle: {
        name: 'Bunno Bedele',
        woredas: {
          bedeleTown: w('Bedele'),
          choraBb: w('Chora'),
          didessa: w('Didessa'),
          gechiBb: w('Gechi'),
        },
      },
      eastHararghe: {
        name: 'East Hararghe',
        woredas: {
          hararArea: w('Haramaya'),
          babile: w('Babile'),
          bedeno: w('Bedeno'),
          chinaksen: w('Chinaksen'),
          dederi: w('Deder'),
          fedis: w('Fedis'),
          girawa: w('Girawa'),
          gursum: w('Gursum'),
          jarso: w('Jarso'),
          kersaEh: w('Kersa'),
          kombolcha: w('Kombolcha'),
          meta: w('Meta'),
        },
      },
      westHararghe: {
        name: 'West Hararghe',
        woredas: {
          chiro: w('Chiro'),
          anchar: w('Anchar'),
          boke: w('Boke'),
          darmu: w('Darolebu'),
          gamachis: w('Gamachis'),
          habro: w('Habro'),
          mesela: w('Mesela'),
          miesso: w('Miesso'),
          tulo: w('Tulo'),
        },
      },
      horoGuduru: {
        name: 'Horo Guduru Welega',
        woredas: {
          shambu: w('Shambu'),
          abayChomen: w('Abay Chomen'),
          amuru: w('Amuru'),
          guduru: w('Guduru'),
          hababoGuduru: w('Hababo Guduru'),
          horo: w('Horo'),
          jimmaGenete: w('Jimma Genete'),
          jimmaRare: w('Jimma Rare'),
        },
      },
      eastWelega: {
        name: 'East Welega',
        woredas: {
          nekemte: w('Nekemte'),
          diga: w('Diga'),
          gidaAyana: w('Gida Ayana'),
          gobuSeyo: w('Gobu Seyo'),
          gutoGida: w('Guto Gida'),
          jimmaArjo: w('Jimma Arjo'),
          limu: w('Limu'),
          sasiga: w('Sasiga'),
          wayuTuka: w('Wayu Tuka'),
        },
      },
      westWelega: {
        name: 'West Welega',
        woredas: {
          gimbi: w('Gimbi'),
          ayra: w('Ayra'),
          begie: w('Begi'),
          bojiChekorsa: w('Boji Chekorsa'),
          genji: w('Genji'),
          guliso: w('Guliso'),
          manaSibu: w('Mana Sibu'),
          nejjo: w('Nejo'),
        },
      },
      kelemWelega: {
        name: 'Kelem Welega',
        woredas: {
          dambidolo: w('Dembi Dollo'),
          anfilo: w('Anfilo'),
          daleSadi: w('Dale Sadi'),
          gawoQebe: w('Gawo Qebe'),
          gidaHana: w('Gida Hana'),
          hawaGalan: w('Hawa Galan'),
          sayo: w('Sayo'),
          yemalogiWalal: w('Yemalogi Walal'),
        },
      },
      qellem: {
        name: 'Qellem Welega',
        woredas: {
          dambiDollo: w('Dambi Dollo'),
        },
      },
    },
  },

  amhara: {
    name: 'Amhara',
    zones: {
      northShewa: {
        name: 'North Shewa',
        woredas: {
          debreBirhan: w('Debre Birhan'),
          ankober: w('Ankober'),
          asagirt: w('Asagirt'),
          basonaWerana: w('Basona Werana'),
          ensaro: w('Ensaro'),
          efra: w('Efratana Gidim'),
          hagereMariam: w('Hagere Mariam'),
          moretnaJiru: w('Moretna Jiru'),
          tarmaber: w('Tarmaber'),
        },
      },
      southWollo: {
        name: 'South Wollo',
        woredas: {
          desie: w('Dessie'),
          ambassel: w('Ambassel'),
          debresina: w('Debre Sina'),
          kutaBer: w('Kutaber'),
          legambo: w('Legambo'),
          sayint: w('Sayint'),
          tehuledere: w('Tehuledere'),
          wereilu: w('Were Ilu'),
          wollo: w('Worebabu'),
        },
      },
      northWollo: {
        name: 'North Wollo',
        woredas: {
          weldiya: w('Weldiya'),
          bugna: w('Bugna'),
          dawunt: w('Dawunt'),
          gedebeb: w('Gidan'),
          habru: w('Habru'),
          kobo: w('Kobo'),
          lasta: w('Lasta'),
          meket: w('Meket'),
          wadla: w('Wadla'),
        },
      },
      southGondar: {
        name: 'South Gondar',
        woredas: {
          debreTabor: w('Debre Tabor'),
          ebnat: w('Ebnat'),
          esta: w('Esta'),
          fogera: w('Fogera'),
          farta: w('Farta'),
          liboKemkem: w('Libo Kemkem'),
          simada: w('Simada'),
          tachGayint: w('Tach Gayint'),
        },
      },
      northGondar: {
        name: 'North Gondar',
        woredas: {
          gondar: w('Gondar'),
          dangila: w('Dangila'),
          debark: w('Debark'),
          dembiya: w('Dembiya'),
          gonderZuria: w('Gonder Zuria'),
          janamora: w('Janamora'),
          metema: w('Metema'),
          wogera: w('Wogera'),
        },
      },
      centralGondar: {
        name: 'Central Gondar',
        woredas: {
          chilega: w('Chilga'),
          eastDembiya: w('East Dembiya'),
          layArmachiho: w('Lay Armachiho'),
          takusa: w('Takusa'),
          westBelessa: w('West Belessa'),
        },
      },
      westGondar: {
        name: 'West Gondar',
        woredas: {
          metemaWg: w('Metema'),
          quara: w('Quara'),
          westArmachiho: w('West Armachiho'),
        },
      },
      awi: {
        name: 'Awi',
        woredas: {
          injibara: w('Injibara'),
          ankesha: w('Ankesha'),
          banja: w('Banja'),
          dangilaAwi: w('Dangila'),
          fagitalekoma: w('Fagita Lekoma'),
          guwangwa: w('Guangua'),
          jawi: w('Jawi'),
        },
      },
      eastGojjam: {
        name: 'East Gojjam',
        woredas: {
          debreMarkos: w('Debre Markos'),
          awabel: w('Awabel'),
          basoliben: w('Baso Liben'),
          debayTilatgin: w('Debay Tilatgin'),
          dejen: w('Dejen'),
          enarjEnawga: w('Enarj Enawga'),
          enemay: w('Enemay'),
          gonchaSiso: w('Goncha Siso Enese'),
          huletEjEnese: w('Hulet Ej Enese'),
          shebelBerenta: w('Shebel Berenta'),
        },
      },
      westGojjam: {
        name: 'West Gojjam',
        woredas: {
          bahirDar: w('Bahir Dar'),
          adet: w('Adet'),
          bureWg: w('Bure'),
          dembecha: w('Dembecha'),
          jabitehnan: w('Jabi Tehnan'),
          mecha: w('Mecha'),
          northAchefer: w('North Achefer'),
          secela: w('Sekela'),
          southAchefer: w('South Achefer'),
          yilmanaDensa: w('Yilmana Densa'),
        },
      },
      wagHemra: {
        name: 'Wag Hemra',
        woredas: {
          sekeleka: w('Sekota'),
          abergele: w('Abergele'),
          dehana: w('Dehana'),
          gazGibla: w('Gazgibla'),
          sahala: w('Sahla'),
          zikuala: w('Zikuala'),
        },
      },
      oromiaZone: {
        name: 'Oromia Zone',
        woredas: {
          kemise: w('Kemise'),
          artumaFursi: w('Artuma Fursi'),
          deweHarewa: w('Dewe Harewa'),
          jileTimuga: w('Jile Timuga'),
        },
      },
    },
  },

  tigray: {
    name: 'Tigray',
    zones: {
      central: {
        name: 'Central',
        woredas: {
          mekelle: w('Mekelle'),
          adwa: w('Adwa'),
          ahferom: w('Ahferom'),
          axum: w('Axum'),
          kolaTembien: w('Kola Tembien'),
          laelayMaychew: w('Laelay Maychew'),
          merebLeke: w('Mereb Leke'),
          naederAdet: w('Naeder Adet'),
          werieLeke: w('Werie Leke'),
        },
      },
      eastern: {
        name: 'Eastern',
        woredas: {
          adigrat: w('Adigrat'),
          atsbiWenberta: w('Atsbi Wenberta'),
          gantaAfeshum: w('Ganta Afeshum'),
          gulomekeda: w('Gulomahda'),
          hawzen: w('Hawzen'),
          saesiTsaedaemba: w('Saesi Tsaedaemba'),
        },
      },
      northWestern: {
        name: 'North Western',
        woredas: {
          shire: w('Shire'),
          asgedeTsimbla: w('Asgede Tsimbla'),
          laelayAdiyabo: w('Laelay Adiyabo'),
          medebayZana: w('Medebay Zana'),
          tahtayAdiyabo: w('Tahtay Adiyabo'),
          tahtayKoraro: w('Tahtay Koraro'),
          tselemti: w('Tselemti'),
        },
      },
      southern: {
        name: 'Southern',
        woredas: {
          alamata: w('Alamata'),
          endamehoni: w('Endamehoni'),
          maychew: w('Maychew'),
          ofla: w('Ofla'),
          rame: w('Raya Azebo'),
        },
      },
      southEastern: {
        name: 'South Eastern',
        woredas: {
          hintaloWajirat: w('Hintalo Wajirat'),
          deguaTembien: w('Degua Tembien'),
          enderta: w('Enderta'),
          sehartiSamre: w('Seharti Samre'),
        },
      },
      western: {
        name: 'Western',
        woredas: {
          humera: w('Humera'),
          kaftaHumera: w('Kafta Humera'),
          tsegede: w('Tsegede'),
          wolqayt: w('Wolqayt'),
        },
      },
      mekelleSpecial: {
        name: 'Mekelle Special',
        woredas: {
          mekelleCity: w('Mekelle'),
        },
      },
    },
  },

  afar: {
    name: 'Afar',
    zones: {
      zone1: {
        name: 'Zone 1 (Awsi Rasu)',
        woredas: {
          asayita: w('Asayita'),
          afambo: w('Afambo'),
          dubti: w('Dubti'),
          elidar: w('Elidar'),
          kori: w('Kori'),
          mile: w('Mile'),
        },
      },
      zone2: {
        name: 'Zone 2 (Kilbet Rasu)',
        woredas: {
          abala: w('Abala'),
          afdera: w('Afdera'),
          berhale: w('Berahle'),
          dalol: w('Dalol'),
          erob: w('Erebti'),
          koneba: w('Koneba'),
        },
      },
      zone3: {
        name: 'Zone 3 (Gabi Rasu)',
        woredas: {
          amibara: w('Amibara'),
          argoba: w('Argoba'),
          awashFentale: w('Awash Fentale'),
          dulecha: w('Dulecha'),
          gewane: w('Gewane'),
        },
      },
      zone4: {
        name: 'Zone 4 (Fantena Rasu)',
        woredas: {
          awra: w('Awra'),
          ewa: w('Ewa'),
          gulina: w('Gulina'),
          teru: w('Teru'),
          yalo: w('Yalo'),
        },
      },
      zone5: {
        name: 'Zone 5 (Hari Rasu)',
        woredas: {
          dalifage: w('Dalifage'),
          dewe: w('Dewe'),
          hadeleEla: w('Hadele Ela'),
          simurobi: w('Simurobi Gele\'alo'),
          telalak: w('Telalak'),
        },
      },
    },
  },

  somali: {
    name: 'Somali',
    zones: {
      faafan: {
        name: 'Fafan',
        woredas: {
          jigjiga: w('Jigjiga'),
          awbare: w('Awbare'),
          babileSo: w('Babile'),
          gursumSo: w('Gursum'),
          harshin: w('Harshin'),
          kebribeyah: w('Kebribeyah'),
          tuliguled: w('Tuli Guled'),
        },
      },
      sitti: {
        name: 'Sitti',
        woredas: {
          erer: w('Erer'),
          afdem: w('Afdem'),
          ayisha: w('Ayisha'),
          dambel: w('Dembel'),
          miessoSo: w('Miesso'),
          shinile: w('Shinile'),
        },
      },
      nogob: {
        name: 'Nogob',
        woredas: {
          fiiq: w('Fiiq'),
          dihun: w('Dihun'),
          gerbo: w('Gerbo'),
          hamero: w('Hamero'),
          lagahida: w('Lagahida'),
          segeg: w('Segeg'),
        },
      },
      jarar: {
        name: 'Jarar',
        woredas: {
          degehabur: w('Degehabur'),
          arus: w('Ararso'),
          bilcil: w('Bilcilbur'),
          degehamedo: w('Degehamedo'),
          gunagado: w('Gunagado'),
          yogacale: w('Yocale'),
        },
      },
      korahay: {
        name: 'Korahe',
        woredas: {
          kebriDahar: w('Kebri Dahar'),
          debeweyin: w('Debeweyin'),
          shekosh: w('Shekosh'),
          shilabo: w('Shilabo'),
        },
      },
      shabelle: {
        name: 'Shabelle',
        woredas: {
          gode: w('Gode'),
          adadle: w('Adadle'),
          danan: w('Danan'),
          ferfer: w('Ferfer'),
          kelafo: w('Kelafo'),
          mustahil: w('Mustahil'),
        },
      },
      afder: {
        name: 'Afder',
        woredas: {
          hargele: w('Hargele'),
          bare: w('Bare'),
          chereti: w('Chereti'),
          dolobay: w('Dolobay'),
          elkere: w('Elkere'),
          goroBakan: w('Goro Baqaqsa'),
        },
      },
      libenSo: {
        name: 'Liben',
        woredas: {
          doollo: w('Dolo Odo'),
          filt: w('Filtu'),
          dekhahbur: w('Dekasuftu'),
          hoyamo: w('Hudet'),
          moyaleSo: w('Moyale'),
        },
      },
      dollo: {
        name: 'Dollo',
        woredas: {
          warder: w('Warder'),
          boh: w('Boh'),
          danot: w('Danot'),
          galadi: w('Galadi'),
        },
      },
      dhawa: {
        name: 'Dhawa',
        woredas: {
          hudetDh: w('Hudet'),
          mubarek: w('Mubarek'),
        },
      },
      ererZone: {
        name: 'Erer',
        woredas: {
          ererTown: w('Erer'),
        },
      },
    },
  },

  sidama: {
    name: 'Sidama',
    zones: {
      sidamaCentral: {
        name: 'Sidama',
        woredas: {
          hawassa: w('Hawassa'),
          aletaWendo: w('Aleta Wendo'),
          aposto: w('Aposto'),
          bille: w('Bensa'),
          borecha: w('Borecha'),
          bursa: w('Bursa'),
          chire: w('Chire'),
          dale: w('Dale'),
          dara: w('Dara'),
          gorche: w('Gorche'),
          hula: w('Hula'),
          lemo: w('Lemo'),
          malga: w('Malga'),
          shebedino: w('Shebedino'),
          wondoGenet: w('Wondo Genet'),
          yirgalem: w('Yirgalem'),
        },
      },
    },
  },

  southWestEthiopiaPeoples: {
    name: 'South West Ethiopia Peoples',
    zones: {
      keffa: {
        name: 'Keffa',
        woredas: {
          bonga: w('Bonga'),
          adiyo: w('Adiyo'),
          chena: w('Chena'),
          decha: w('Decha'),
          gesha: w('Gesha'),
          saylem: w('Saylem'),
          tello: w('Tello'),
        },
      },
      benchSheko: {
        name: 'Bench Sheko',
        woredas: {
          mizanAman: w('Mizan Aman'),
          guraferda: w('Guraferda'),
          menitGoldiya: w('Menit Goldiya'),
          menitShasha: w('Menit Shasha'),
          sheko: w('Sheko'),
          southBench: w('South Bench'),
        },
      },
      sheka: {
        name: 'Sheka',
        woredas: {
          masha: w('Masha'),
          andiracha: w('Anderacha'),
          yeki: w('Yeki'),
        },
      },
      westOmo: {
        name: 'West Omo',
        woredas: {
          jemu: w('Jemu'),
          menit: w('Menit'),
          surma: w('Surma'),
        },
      },
      dawuro: {
        name: 'Dawuro',
        woredas: {
          tarcha: w('Tarcha'),
          essa: w('Essera'),
          loma: w('Loma'),
          mareka: w('Mareka'),
          tocha: w('Tocha'),
        },
      },
      konta: {
        name: 'Konta',
        woredas: {
          ameyaKonta: w('Ameya'),
        },
      },
    },
  },

  centralEthiopia: {
    name: 'Central Ethiopia',
    zones: {
      gurage: {
        name: 'Gurage',
        woredas: {
          wolkite: w('Wolkite'),
          abeshge: w('Abeshge'),
          cheha: w('Cheha'),
          enemorEner: w('Enemor Ener'),
          ezha: w('Ezha'),
          gumer: w('Gumer'),
          meskan: w('Meskan'),
          muhurNaAklil: w('Muhur Na Aklil'),
          sodo: w('Sodo'),
        },
      },
      hadiya: {
        name: 'Hadiya',
        woredas: {
          hosaena: w('Hosaena'),
          anelemo: w('Anelemo'),
          duna: w('Duna'),
          gibe: w('Gibe'),
          gomibora: w('Gomibora'),
          lmo: w('Lemo'),
          misha: w('Misha'),
          shashogo: w('Shashogo'),
          sore: w('Soro'),
        },
      },
      kembata: {
        name: 'Kembata',
        woredas: {
          durame: w('Durame'),
          anlemo: w('Anlemo'),
          kedidaGamela: w('Kedida Gamela'),
          kachaBira: w('Kacha Bira'),
          tembaro: w('Tembaro'),
        },
      },
      silte: {
        name: 'Silte',
        woredas: {
          worabe: w('Worabe'),
          dalocha: w('Dalocha'),
          lanfuro: w('Lanfuro'),
          mirabAzernet: w('Mirab Azernet'),
          sankura: w('Sankura'),
          silti: w('Silti'),
        },
      },
      yem: {
        name: 'Yem',
        woredas: {
          saja: w('Saja'),
        },
      },
      halaba: {
        name: 'Halaba',
        woredas: {
          halabaKulito: w('Halaba Kulito'),
        },
      },
    },
  },

  southEthiopia: {
    name: 'South Ethiopia',
    zones: {
      wolayta: {
        name: 'Wolayta',
        woredas: {
          sodo: w('Sodo'),
          bolosoSore: w('Boloso Sore'),
          damotGale: w('Damot Gale'),
          damotPulasa: w('Damot Pulasa'),
          damotSore: w('Damot Sore'),
          damotWoyde: w('Damot Woyde'),
          dugunaFango: w('Duguna Fango'),
          humbo: w('Humbo'),
          kindoDidaye: w('Kindo Didaye'),
          kindoKoysha: w('Kindo Koysha'),
          ofa: w('Ofa'),
        },
      },
      gedeo: {
        name: 'Gedeo',
        woredas: {
          dilla: w('Dilla'),
          bule: w('Bule'),
          gedeb: w('Gedeb'),
          kochere: w('Kochere'),
          wonago: w('Wonago'),
          yirgachefe: w('Yirgachefe'),
        },
      },
      gamo: {
        name: 'Gamo',
        woredas: {
          arbaminch: w('Arba Minch'),
          bonke: w('Bonke'),
          boreda: w('Boreda'),
          chencha: w('Chencha'),
          dita: w('Dita'),
          gerese: w('Gerese'),
          kemba: w('Kemba'),
          kucha: w('Kucha'),
          mirabAbaya: w('Mirab Abaya'),
        },
      },
      gofa: {
        name: 'Gofa',
        woredas: {
          saula: w('Sawla'),
          dena: w('Dena'),
          gezeGofa: w('Geze Gofa'),
          melokoza: w('Melokoza'),
          ubadebretsehay: w('Ubadebretsehay'),
        },
      },
      southOmo: {
        name: 'South Omo',
        woredas: {
          jinka: w('Jinka'),
          bannaTsemay: w('Banna Tsemay'),
          dassenech: w('Dassenech'),
          gnangatom: w('Gnangatom'),
          hamilo: w('Hamer'),
          male: w('Male'),
          nyangatom: w('Nyangatom'),
          selamago: w('Selamago'),
        },
      },
      konso: {
        name: 'Konso',
        woredas: {
          karati: w('Karat'),
          kena: w('Kena'),
          sagan: w('Segen'),
        },
      },
      alleZone: {
        name: 'Alle',
        woredas: {
          alleTown: w('Alle'),
        },
      },
      amar: {
        name: 'Amaro',
        woredas: {
          kelle: w('Kelle'),
        },
      },
      burji: {
        name: 'Burji',
        woredas: {
          soyama: w('Soyama'),
        },
      },
      dirashe: {
        name: 'Dirashe',
        woredas: {
          gidole: w('Gidole'),
        },
      },
      basketo: {
        name: 'Basketo',
        woredas: {
          laskota: w('Laska'),
        },
      },
    },
  },
};

// --- Other app constants (preserved) ---

export const cropTypes = [
  'Teff', 'Wheat', 'Barley', 'Maize', 'Sorghum', 'Coffee', 'Sesame',
  'Chickpea', 'Haricot Bean', 'Fava Bean', 'Peanut', 'Potato', 'Onion',
  'Tomato', 'Pepper', 'Cabbage', 'Banana', 'Mango', 'Avocado', 'Other',
];

export const cropVarieties = {
  Teff: ['Quncho', 'Magna', 'Kuncho', 'Other'],
  Wheat: ['Kakaba', 'Danda\'a', 'Ogolcho', 'Other'],
  Barley: ['HB1307', 'Shege', 'Other'],
  Maize: ['BH540', 'BH660', 'Melkassa', 'Other'],
  Sorghum: ['Melkam', 'Girana', 'Other'],
  Coffee: ['Sidama', 'Yirgacheffe', 'Harar', 'Limu', 'Other'],
  Sesame: ['Humera', 'Gondar', 'Other'],
};

export const cropTypeToCategory = {
  Teff: 'Cereals', Wheat: 'Cereals', Barley: 'Cereals', Maize: 'Cereals', Sorghum: 'Cereals',
  Coffee: 'Cash Crops', Sesame: 'Oilseeds',
  Chickpea: 'Pulses', 'Haricot Bean': 'Pulses', 'Fava Bean': 'Pulses', Peanut: 'Oilseeds',
  Potato: 'Vegetables', Onion: 'Vegetables', Tomato: 'Vegetables', Pepper: 'Vegetables', Cabbage: 'Vegetables',
  Banana: 'Fruits', Mango: 'Fruits', Avocado: 'Fruits',
  Other: 'Other',
};

export const productUnits = ['Quintal', 'Kg', 'Liter'];
export const productGrades = ['Grade A', 'Grade B', 'Grade C'];

export const supportCategories = ['Technical Issue', 'Payment Issue', 'General Inquiry'];
export const languageOptions = ['English', 'Amharic', 'Afaan Oromoo'];

export const userRoles = ['farmer', 'buyer', 'extension', 'admin'];
export const listingStatuses = ['Active', 'Sold Out'];
export const paymentMethods = ['Chapa', 'Telebirr'];
export const orderStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

// Regions used by logistics: the 9 regional states plus federal cities.
export const logisticsRegions = [
  ...Object.values(regionsData).map((r) => r.name),
  'Addis Ababa',
  'Dire Dawa',
];

export const vehicleTypes = [
  'Pickup Car',
  'Isuzu Truck',
  'Heavy Truck',
  'Motorbike/Tricycle',
  'Animal Cart',
];
