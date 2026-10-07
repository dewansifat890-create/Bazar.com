export interface LocationData {
  [department: string]: {
    [district: string]: {
      [upazila: string]: string[];
    };
  };
}

export const BANGLADESH_LOCATIONS: LocationData = {
  "Dhaka": {
    "Dhaka": {
      "Dhanmondi": ["Dhanmondi 15", "Dhanmondi 32", "Shankar", "Jigatola", "Jafrabad", "Hazaribagh"],
      "Mirpur": ["Mirpur 1", "Mirpur 2", "Mirpur 6", "Mirpur 7", "Mirpur 10", "Mirpur 11", "Mirpur 12", "Mirpur 13", "Mirpur 14", "Pallabi", "Rupnagar", "Shah Ali"],
      "Gulshan": ["Gulshan 1", "Gulshan 2", "Banani", "Baridhara", "Niketon", "Shahjadpur", "Kalachandpur"],
      "Uttara": ["Sector 1", "Sector 3", "Sector 4", "Sector 5", "Sector 7", "Sector 9", "Sector 10", "Sector 11", "Sector 12", "Sector 13", "Sector 14", "Diabari"],
      "Mohammadpur": ["Town Hall", "Asad Gate", "Lalmatia", "Kadirabad", "Japan Garden City", "Shekhartak", "Basila", "Adabor"],
      "Badda": ["Middle Badda", "South Badda", "North Badda", "Merul Badda", "Aftabnagar", "Vatara", "Satarkul"],
      "Tejgaon": ["Industrial Area", "Nakhalpara", "Shaheenbag", "Farmgate", "Karwan Bazar", "Begunbari"],
      "Savar": ["Savar Pourashava", "Ashulia", "Birulia", "Hemayetpur", "Pathalia", "Yarpur", "Shimulia", "Dhamsona"],
      "Keraniganj": ["South Keraniganj", "Aganagar", "Kalindi", "Shakta", "South Keraniganj Pourashava", "Jinjira", "Taranagar", "Bhakurta"],
      "Dhamrai": ["Dhamrai Pourashava", "Amta", "Balia", "Bhararia", "Chauhat", "Gangutia", "Jadir Char"],
      "Dohar": ["Dohar Pourashava", "Bilashpur", "Char Kushai", "Debinagar", "Joypara", "Narisha"],
      "Nawabganj": ["Nawabganj Pourashava", "Agla", "Bakshonagar", "Bandura", "Baruakhali", "Churain", "Galimpur"]
    },
    "Gazipur": {
      "Gazipur Sadar": ["Gazipur City", "Joydebpur", "Chowrasta", "Hotapara", "Basan", "Gacha", "Konabari", "Kashimpur"],
      "Kaliakair": ["Kaliakair Pourashava", "Mouchak", "Chapeyer", "Dhamrai", "Fulbaria", "Madhabpur"],
      "Sreepur": ["Sreepur Pourashava", "Maona", "Barmi", "Gosinga", "Kaoraid", "Teliati"],
      "Kaliganj": ["Kaliganj Pourashava", "Tumilia", "Muktarpur", "Bahadurshadi", "Jamalpur", "Nagori"],
      "Kapasia": ["Kapasia Sadar", "Tok", "Rayed", "Barishaba", "Chandpur", "Durbaer", "Ghashpur"]
    },
    "Narayanganj": {
      "Narayanganj Sadar": ["Narayanganj City", "Fatullah", "Enayetnagar", "Kutubpur", "Alirtek", "Gognagar"],
      "Bandar": ["Bandar Pourashava", "Madanpur", "Dhamgar", "Musapur"],
      "Rupganj": ["Tarabo Pourashava", "Kanchan Pourashava", "Bhulta", "Golakandail", "Murapara", "Kayetpara", "Rupganj Union"],
      "Sonargaon": ["Sonargaon Pourashava", "Mograpara", "Pirojpur", "Baradi", "Jampur", "Kachpur", "Sadipur"],
      "Araihazar": ["Araihazar Pourashava", "Gopaldi Pourashava", "Uchitpur", "Duaripara", "Fatehpur", "Haibatpur"]
    },
    "Narsingdi": {
      "Narsingdi Sadar": ["Narsingdi Pourashava", "Madhabdi Pourashava", "Amudia", "Chhaigharia", "Chinishpur"],
      "Belabo": ["Belabo Sadar", "Amlabo", "Narayanpur", "Patuli"],
      "Monohardi": ["Monohardi Pourashava", "Chandanbari", "Kanchampur"],
      "Raipura": ["Raipura Pourashava", "Alipura", "Amirganj", "Banshgari"]
    },
    "Tangail": {
      "Tangail Sadar": ["Tangail Pourashava", "Duliadanga", "Gala", "Katuli", "Mogra"],
      "Mirzapur": ["Mirzapur Pourashava", "Gorai", "Jamurki", "Banhata", "Bhaora"],
      "Kalihati": ["Kalihati Pourashava", "Elinga Pourashava", "Nagbari", "Bangra", "Dashkia"],
      "Madhupur": ["Madhupur Pourashava", "Aushnara", "Golgonda", "Arankhola"],
      "Gopalpur": ["Gopalpur Pourashava", "Almonagar", "Dhalaura"],
      "Sakhipur": ["Sakhipur Pourashava", "Baheratoil", "Dariapur"]
    },
    "Kishoreganj": {
      "Kishoreganj Sadar": ["Kishoreganj Pourashava", "Binati", "Latibpur", "Maijkhapan", "Yashodal"],
      "Bhairab": ["Bhairab Pourashava", "Shimulkandi", "Gajaria", "Srinagar"],
      "Kuliarchar": ["Kuliarchar Pourashava", "Faridpur", "Ramnagar", "Salua"],
      "Bajitpur": ["Bajitpur Pourashava", "Dilalpur", "Humayunpur"]
    },
    "Faridpur": {
      "Faridpur Sadar": ["Faridpur Pourashava", "Aliabad", "Ambikapur", "Decreer Char"],
      "Bhanga": ["Bhanga Pourashava", "Algi", "Azimnagar", "Gharua"],
      "Madhukhali": ["Madhukhali Pourashava", "Bagat", "Jahapur", "Megchami"]
    },
    "Gopalganj": {
      "Gopalganj Sadar": ["Gopalganj Pourashava", "Boultali", "Gopinathpur"],
      "Kashiani": ["Kashiani Sadar", "Bethuri", "Maheshpur"],
      "Kotalipara": ["Kotalipara Pourashava", "Bandhabari"]
    }
  },
  "Chattogram": {
    "Chattogram": {
      "Pahartali": ["North Pahartali", "South Pahartali", "Pahartali Ward 1"],
      "Panchlaish": ["Nasirabad", "East Sholashahar", "West Sholashahar", "Baizid Bostami"],
      "Kotwali": ["Andarkilla", "Firingi Bazar", "Alkaran", "Patherghata"],
      "Double Mooring": ["Agrabad", "Chowmuhani", "Matherbari", "Pathantooly"],
      "Halishahar": ["Halishahar H Block", "Block L", "Block A", "North Halishahar"],
      "Hathazari": ["Hathazari Pourashava", "Fatehabad", "Mekhal", "Burischar", "Chikondia"],
      "Patiya": ["Patiya Pourashava", "Koshail", "Ziri", "Bhatikhain", "Chanhara"],
      "Anwara": ["Anwara Sadar", "Bairag", "Barikkhair", "Chatari"],
      "Boalkhali": ["Boalkhali Pourashava", "Ahla Karaldenga", "Amuchia"],
      "Chandanaish": ["Chandanaish Pourashava", "Barkal", "Bailtali"],
      "Fatikchhari": ["Fatikchhari Pourashava", "Nazirhat Pourashava", "Baganbaria", "Bakkhali"]
    },
    "Cox's Bazar": {
      "Cox's Bazar Sadar": ["Cox's Bazar Pourashava", "Kolatoli", "Laboni", "Baharchhara", "Jhilwanja"],
      "Teknaf": ["Teknaf Pourashava", "Saint Martin", "Hnila", "Sabrang", "Baharchhara"],
      "Ukhia": ["Ukhia Sadar", "Ratna Palong", "Palong Khali", "Rajapalong", "Jhalupalong"],
      "Chakaria": ["Chakaria Pourashava", "Baraitoli", "Fasakhali", "Harbang", "Khutakhali"],
      "Ramu": ["Ramu Sadar", "Kachhapia", "Rajarkul", "South Mithachhari"]
    },
    "Cumilla": {
      "Cumilla Sadar": ["Cumilla City", "Kandirpar", "Badurtala", "Dharmapur", "Chawk Bazar"],
      "Laksam": ["Laksam Pourashava", "Gobindapur", "Kandirpar", "Bakai", "Mudafforganj"],
      "Daudkandi": ["Daudkandi Pourashava", "Gouripur", "Barpara", "Goalmari", "Mohammadpur"],
      "Chandina": ["Chandina Pourashava", "Barkait", "Iskhardia"],
      "Debidwar": ["Debidwar Pourashava", "Barkamta", "Dhamti"]
    },
    "Noakhali": {
      "Noakhali Sadar": ["Maijdee", "Sudharam", "Binodpur", "Dharmapur", "Noannai"],
      "Begumganj": ["Chowmuhani Pourashava", "Rajganj", "Eklashpur", "Gopalpur", "Mirwarishpur"],
      "Hatiya": ["Hatiya Pourashava", "Burir Char", "Jahajmara", "Nizum Dwip", "Sonadiya"],
      "Companiganj": ["Basurhat Pourashava", "Char Calcutta", "Musapur"]
    },
    "Feni": {
      "Feni Sadar": ["Feni Pourashava", "Dharmapur", "Kazirbag", "Kalidah", "Lemua"],
      "Daganbhuiyan": ["Daganbhuiyan Pourashava", "Jaylashkar", "Matubhuiyan", "Sindurpur"],
      "Chhagalnaiya": ["Chhagalnaiya Pourashava", "Gopal", "Radhanagar"]
    },
    "Lakshmipur": {
      "Lakshmipur Sadar": ["Lakshmipur Pourashava", "Basikpur", "Dalalbazar"],
      "Raipur": ["Raipur Pourashava", "Bamani", "Char Ababil"]
    }
  },
  "Rajshahi": {
    "Rajshahi": {
      "Boalia": ["Boalia Ward 1", "Hatem Khan", "Kadamtoli", "Ghoramara"],
      "Motihar": ["Kazla", "Binodpur", "Meherchandi", "Dharampur"],
      "Rajpara": ["Rajpara Sadar", "Damkur", "Haripur", "Karkhana"],
      "Godagari": ["Godagari Pourashava", "Kakonhat Pourashava", "Gogram", "Matikata"],
      "Bagmara": ["Bhowaniganj Pourashava", "Taherpur Pourashava", "Auchpara"]
    },
    "Bogra": {
      "Bogra Sadar": ["Bogra Pourashava", "Fultala", "Namuja", "Nishindara", "Rajapur"],
      "Sherpur": ["Sherpur Pourashava", "Bhabanipur", "Kusumbi", "Khanpur", "Garidaha"],
      "Shajahanpur": ["Majhira", "Amrul", "Ashekpur", "Madla", "Kharna"],
      "Gabtali": ["Gabtali Pourashava", "Baliadighi", "Durgahata"],
      "Shariakandi": ["Shariakandi Pourashava", "Bhelabari", "Chaluabari"]
    },
    "Pabna": {
      "Pabna Sadar": ["Pabna Pourashava", "Dogachi", "Gayeshpur", "Hemayetpur", "Malanchi"],
      "Ishwardi": ["Ishwardi Pourashava", "Paksey", "Dashuria", "Sahapur", "Lakshmikunda"],
      "Sujanagar": ["Sujanagar Pourashava", "Ahmedpur", "Dulai", "Raninagar"]
    },
    "Naogaon": {
      "Naogaon Sadar": ["Naogaon Pourashava", "Balia Chand", "Hapania", "Boalia"],
      "Sapahar": ["Sapahar Sadar", "Aihai", "Shiranti", "Goala"],
      "Mohadevpur": ["Mohadevpur Sadar", "Enayetpur", "Khajur"]
    }
  },
  "Khulna": {
    "Khulna": {
      "Khulna Sadar": ["Khulna City", "Tutpara", "Baniakhamar", "Boyra", "Sonadanga"],
      "Daulatpur": ["Daulatpur Station", "Maheshwarpasha", "Arongghata"],
      "Khalishpur": ["Khalishpur Area", "Goyeskali", "Relief Colony"],
      "Dumuria": ["Dumuria Sadar", "Atlantia", "Bhandarpara", "Dhamalia", "Raghunathpur"],
      "Rupsha": ["Rupsha Sadar", "Ghatbhog", "Ispur"]
    },
    "Jashore": {
      "Jashore Sadar": ["Jashore Pourashava", "Arabpur", "Chanchra", "Fatepur", "Ichali"],
      "Benapole": ["Benapole Pourashava", "Bahadurpur", "Putkhali", "Goga"],
      "Sharsha": ["Sharsha Sadar", "Baguri", "Dihi", "Lakshmanpur"],
      "Keshabpur": ["Keshabpur Pourashava", "Bidyanandapur", "Sufalakati"]
    },
    "Satkhira": {
      "Satkhira Sadar": ["Satkhira Pourashava", "Agardari", "Balli", "Banshdaha", "Fingri"],
      "Shyamnagar": ["Shyamnagar Sadar", "Burigoalini", "Munshiganj", "Gabura", "Padmapukur"]
    },
    "Bagerhat": {
      "Bagerhat Sadar": ["Bagerhat Pourashava", "Baruipara", "Bishnupur"],
      "Mongla": ["Mongla Pourashava", "Burirdanga", "Chila"]
    }
  },
  "Barishal": {
    "Barishal": {
      "Barishal Sadar": ["Barishal City", "Amanatganj", "Kashipur", "Chandmari", "Brown Compound"],
      "Bakerganj": ["Bakerganj Pourashava", "Bharpasha", "Dudhal", "Faridpur", "Kabarkali"],
      "Banaripara": ["Banaripara Pourashava", "Bisharkandi", "Iluhar", "Saidpur"],
      "Babuganj": ["Babuganj Sadar", "Dehergoti", "Madhabpasha"]
    },
    "Bhola": {
      "Bhola Sadar": ["Bhola Pourashava", "Bapta", "Dhania", "Kachia", "Shibpur"],
      "Char Fasson": ["Char Fasson Pourashava", "Aslamganj", "Aminabad", "Ewajpur"],
      "Lalmohan": ["Lalmohan Pourashava", "Badarpur", "Farashganj"]
    },
    "Patuakhali": {
      "Patuakhali Sadar": ["Patuakhali Pourashava", "Auliapur", "Badarpur", "Itbaria"],
      "Kuakata": ["Kuakata Beach", "Latachapli", "Dhulasar"],
      "Galachipa": ["Galachipa Pourashava", "Amkhola", "Bakulbaria"]
    }
  },
  "Sylhet": {
    "Sylhet": {
      "Sylhet Sadar": ["Zinda Bazar", "Bandar Bazar", "Amberkhana", "Shahjalal Uposhohor", "Akhalia", "Shibgonj"],
      "Beanibazar": ["Beanibazar Pourashava", "Alinagar", "Charkhai", "Dubag", "Kurar Bazar"],
      "Golapganj": ["Golapganj Pourashava", "Amura", "Budhberi", "Dhakadakshin", "Lakshmipasha"],
      "Bishwanath": ["Bishwanath Pourashava", "Alapur", "Dashghar"]
    },
    "Moulvibazar": {
      "Moulvibazar Sadar": ["Moulvibazar Pourashava", "Amtail", "Chandnighat", "Ekaishauto", "Kamalpur"],
      "Sreemangal": ["Sreemangal Pourashava", "Bhunabari", "Kalapur", "Rajghat", "Sindurkhan"],
      "Kulaura": ["Kulaura Pourashava", "Brahmanbazar", "Kadipur"]
    },
    "Habiganj": {
      "Habiganj Sadar": ["Habiganj Pourashava", "Gopaya", "Laskarpur", "Rajiar", "Shaistaganj Pourashava"],
      "Nabiganj": ["Nabiganj Pourashava", "Aushkandi", "Bausi", "Kaliajata"]
    }
  },
  "Rangpur": {
    "Rangpur": {
      "Rangpur Sadar": ["Rangpur City", "Dhap", "Mahiganj", "Modern Mor", "Cantonment", "Kellabandi"],
      "Badarganj": ["Badarganj Pourashava", "Damodarpur", "Gopalpur", "Lohani para"],
      "Pirganj": ["Pirganj Pourashava", "Chatra", "Shanbari", "Bhendabari", "Madanpur"]
    },
    "Dinajpur": {
      "Dinajpur Sadar": ["Dinajpur Pourashava", "Askarpur", "Fazilpur", "Sekhpur", "Shasthi Pur"],
      "Birganj": ["Birganj Pourashava", "Bhognagar", "Mohammadpur", "Paltapur"],
      "Parbatipur": ["Parbatipur Pourashava", "Habra", "Manmathpur"]
    },
    "Kurigram": {
      "Kurigram Sadar": ["Kurigram Pourashava", "Belgacha", "Mughalbasha", "Holokhana"],
      "Nageshwari": ["Nageshwari Pourashava", "Bhitorband", "Hasnabad"]
    },
    "Gaibandha": {
      "Gaibandha Sadar": ["Gaibandha Pourashava", "Badiakhali", "Boali"],
      "Govindaganj": ["Govindaganj Pourashava", "Kamardia", "Shakhahar"]
    }
  },
  "Mymensingh": {
    "Mymensingh": {
      "Mymensingh Sadar": ["Mymensingh City", "Akua", "Boyra", "Keotkhali", "Churkhai", "Bhabakhali"],
      "Muktagacha": ["Muktagacha Pourashava", "Basati", "Dulla", "Ghaura", "Kasher Char"],
      "Bhaluka": ["Bhaluka Pourashava", "Bhaluka Union", "Habirbari", "Mallikbari", "Uthura"],
      "Gaffargaon": ["Gaffargaon Pourashava", "Longair", "Panchua"]
    },
    "Netrokona": {
      "Netrokona Sadar": ["Netrokona Pourashava", "Amshari", "Challisha", "Madonpur"],
      "Durgapur": ["Durgapur Pourashava", "Bakaltala", "Gaokandia"],
      "Kendua": ["Kendua Pourashava", "Asitoli", "Bekaia"]
    },
    "Sherpur": {
      "Sherpur Sadar": ["Sherpur Pourashava", "Bajitkhila", "Char Sherpur", "Pakuria"],
      "Nalitabari": ["Nalitabari Pourashava", "Baghabaria", "Nayarabil"]
    }
  }
};
