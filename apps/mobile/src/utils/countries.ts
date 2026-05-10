// src/utils/countries.ts
export const countries: Record<
  string,
  { name: string; flag: string; code: string }
> = {
  Turkey: { name: "Türkiye", flag: "🇹🇷", code: "tr" },
  England: { name: "İngiltere", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "gb-eng" },
  Spain: { name: "İspanya", flag: "🇪🇸", code: "es" },
  Italy: { name: "İtalya", flag: "🇮🇹", code: "it" },
  Germany: { name: "Almanya", flag: "🇩🇪", code: "de" },
  France: { name: "Fransa", flag: "🇫🇷", code: "fr" },
  Netherlands: { name: "Hollanda", flag: "🇳🇱", code: "nl" },
  Portugal: { name: "Portekiz", flag: "🇵🇹", code: "pt" },
  Belgium: { name: "Belçika", flag: "🇧🇪", code: "be" },
  Brazil: { name: "Brezilya", flag: "🇧🇷", code: "br" },
  Argentina: { name: "Arjantin", flag: "🇦🇷", code: "ar" },
  USA: { name: "Amerika", flag: "🇺🇸", code: "us" },
  Mexico: { name: "Meksika", flag: "🇲🇽", code: "mx" },
  Greece: { name: "Yunanistan", flag: "🇬🇷", code: "gr" },
  Scotland: { name: "İskoçya", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", code: "gb-sct" },
  Wales: { name: "Galler", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", code: "gb-wls" },
  Israel: { name: "İsrail", flag: "🇮🇱", code: "il" },
  Austria: { name: "Avusturya", flag: "🇦🇹", code: "at" },
  Switzerland: { name: "İsviçre", flag: "🇨🇭", code: "ch" },
  Poland: { name: "Polonya", flag: "🇵🇱", code: "pl" },
  Russia: { name: "Rusya", flag: "🇷🇺", code: "ru" },
  Ukraine: { name: "Ukrayna", flag: "🇺🇦", code: "ua" },
  Croatia: { name: "Hırvatistan", flag: "🇭🇷", code: "hr" },
  Sweden: { name: "İsveç", flag: "🇸🇪", code: "se" },
  Denmark: { name: "Danimarka", flag: "🇩🇰", code: "dk" },
  Norway: { name: "Norveç", flag: "🇳🇴", code: "no" },
  Finland: { name: "Finlandiya", flag: "🇫🇮", code: "fi" },
  Ireland: { name: "İrlanda", flag: "🇮🇪", code: "ie" },
  Romania: { name: "Romanya", flag: "🇷🇴", code: "ro" },
  Bulgaria: { name: "Bulgaristan", flag: "🇧🇬", code: "bg" },
  Serbia: { name: "Sırbistan", flag: "🇷🇸", code: "rs" },
  "Czech Republic": { name: "Çekya", flag: "🇨🇿", code: "cz" },
  Slovakia: { name: "Slovakya", flag: "🇸🇰", code: "sk" },
  Hungary: { name: "Macaristan", flag: "🇭🇺", code: "hu" },
  Slovenia: { name: "Slovenya", flag: "🇸🇮", code: "si" },
  Cyprus: { name: "Kıbrıs", flag: "🇨🇾", code: "cy" },
  China: { name: "Çin", flag: "🇨🇳", code: "cn" },
  Japan: { name: "Japonya", flag: "🇯🇵", code: "jp" },
  "South Korea": { name: "Güney Kore", flag: "🇰🇷", code: "kr" },
  Australia: { name: "Avustralya", flag: "🇦🇺", code: "au" },
  "Saudi Arabia": { name: "Suudi Arabistan", flag: "🇸🇦", code: "sa" },
  Qatar: { name: "Katar", flag: "🇶🇦", code: "qa" },
  UAE: { name: "BAE", flag: "🇦🇪", code: "ae" },
  Egypt: { name: "Mısır", flag: "🇪🇬", code: "eg" },
  Morocco: { name: "Fas", flag: "🇲🇦", code: "ma" },
  Tunisia: { name: "Tunus", flag: "🇹🇳", code: "tn" },
  Algeria: { name: "Cezayir", flag: "🇩🇿", code: "dz" },
  Nigeria: { name: "Nijerya", flag: "🇳🇬", code: "ng" },
  "South Africa": { name: "Güney Afrika", flag: "🇿🇦", code: "za" },
};

export const getCountryInfo = (countryName: string) => {
  // Direkt eşleşme kontrolü
  if (countries[countryName]) {
    return countries[countryName];
  }

  // Büyük/küçük harf duyarlılığını kaldır
  const lowerKey = countryName.toLowerCase();
  for (const [key, value] of Object.entries(countries)) {
    if (key.toLowerCase() === lowerKey) {
      return value;
    }
  }

  // Bulunamazsa varsayılan
  return { name: countryName, flag: "🏁", code: "unknown" };
};
