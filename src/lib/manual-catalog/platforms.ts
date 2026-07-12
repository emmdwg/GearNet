/** Vehicle platforms with model-year spans from 1965 onward */
export type PlatformSpan = { start: number; end: number };

export type VehiclePlatform = {
  make: string;
  model: string;
  spans: PlatformSpan[];
};

function spans(from: number, to: number, step = 8): PlatformSpan[] {
  const out: PlatformSpan[] = [];
  for (let y = from; y <= to; ) {
    const end = Math.min(y + step - 1, to);
    out.push({ start: y, end });
    y = end + 1;
  }
  return out;
}

function every(from: number, to: number): PlatformSpan[] {
  return spans(from, to, to - from + 1);
}

export const VEHICLE_PLATFORMS: VehiclePlatform[] = [
  // Ford
  { make: "Ford", model: "Mustang", spans: [...spans(1965, 1973, 9), ...spans(1974, 1978, 5), ...spans(1979, 1993, 15), ...spans(1994, 2004, 11), ...spans(2005, 2014, 10), ...spans(2015, 2025, 11)] },
  { make: "Ford", model: "F-150", spans: spans(1965, 2025, 7) },
  { make: "Ford", model: "Bronco", spans: [...spans(1966, 1977, 12), ...spans(1978, 1996, 19), ...spans(2021, 2025, 5)] },
  { make: "Ford", model: "Thunderbird", spans: spans(1965, 1997, 8) },
  { make: "Ford", model: "Galaxie", spans: spans(1965, 1974, 10) },
  { make: "Ford", model: "Fairlane", spans: spans(1965, 1970, 6) },
  { make: "Ford", model: "Torino", spans: spans(1968, 1976, 9) },
  { make: "Ford", model: "Escort", spans: spans(1981, 2003, 11) },
  { make: "Ford", model: "Focus", spans: spans(2000, 2018, 19) },
  { make: "Ford", model: "Fusion", spans: spans(2006, 2020, 15) },
  { make: "Ford", model: "Explorer", spans: spans(1991, 2025, 7) },
  { make: "Ford", model: "Ranger", spans: spans(1983, 2025, 8) },
  { make: "Ford", model: "GT", spans: every(2005, 2006) },
  { make: "Mercury", model: "Cougar", spans: spans(1967, 2002, 9) },
  { make: "Lincoln", model: "Continental", spans: spans(1965, 2020, 8) },

  // GM
  { make: "Chevrolet", model: "Camaro", spans: [...spans(1967, 1969, 3), ...spans(1970, 1981, 12), ...spans(1982, 1992, 11), ...spans(1993, 2002, 10), ...spans(2010, 2024, 15)] },
  { make: "Chevrolet", model: "Corvette", spans: [...spans(1965, 1967, 3), ...spans(1968, 1982, 15), ...spans(1984, 1996, 13), ...spans(1997, 2004, 8), ...spans(2005, 2013, 9), ...spans(2014, 2025, 12)] },
  { make: "Chevrolet", model: "Chevelle", spans: spans(1965, 1977, 13) },
  { make: "Chevrolet", model: "Nova", spans: spans(1965, 1979, 15) },
  { make: "Chevrolet", model: "Impala", spans: spans(1965, 2020, 8) },
  { make: "Chevrolet", model: "Silverado", spans: spans(1999, 2025, 7) },
  { make: "Chevrolet", model: "C/K Pickup", spans: spans(1965, 1998, 8) },
  { make: "Chevrolet", model: "El Camino", spans: spans(1965, 1987, 23) },
  { make: "Chevrolet", model: "Malibu", spans: spans(1965, 1983, 19) },
  { make: "Chevrolet", model: "Blazer", spans: spans(1969, 2025, 8) },
  { make: "Chevrolet", model: "Suburban", spans: spans(1965, 2025, 10) },
  { make: "Chevrolet", model: "Corvair", spans: spans(1965, 1969, 5) },
  { make: "Pontiac", model: "Firebird", spans: spans(1967, 2002, 9) },
  { make: "Pontiac", model: "GTO", spans: spans(1965, 1974, 10) },
  { make: "Pontiac", model: "Trans Am", spans: spans(1969, 2002, 8) },
  { make: "Buick", model: "Grand National", spans: every(1984, 1987) },
  { make: "Buick", model: "Regal", spans: spans(1965, 2004, 10) },
  { make: "Oldsmobile", model: "442", spans: spans(1965, 1971, 7) },
  { make: "Cadillac", model: "DeVille", spans: spans(1965, 2005, 10) },
  { make: "GMC", model: "Sierra", spans: spans(1999, 2025, 7) },

  // Mopar
  { make: "Dodge", model: "Charger", spans: [...spans(1966, 1978, 13), ...spans(2006, 2025, 10)] },
  { make: "Dodge", model: "Challenger", spans: [...spans(1970, 1974, 5), ...spans(2008, 2025, 18)] },
  { make: "Dodge", model: "Dart", spans: [...spans(1965, 1976, 12), ...spans(2013, 2016, 4)] },
  { make: "Dodge", model: "Coronet", spans: spans(1965, 1976, 12) },
  { make: "Dodge", model: "Viper", spans: spans(1992, 2017, 26) },
  { make: "Dodge", model: "Ram", spans: spans(1981, 2025, 8) },
  { make: "Plymouth", model: "Barracuda", spans: spans(1965, 1974, 10) },
  { make: "Plymouth", model: "Road Runner", spans: spans(1968, 1980, 13) },
  { make: "Chrysler", model: "300", spans: spans(1965, 2025, 10) },
  { make: "Jeep", model: "Wrangler", spans: [...spans(1987, 1995, 9), ...spans(1997, 2006, 10), ...spans(2007, 2018, 12), ...spans(2018, 2025, 8)] },
  { make: "Jeep", model: "Cherokee", spans: spans(1974, 2025, 8) },
  { make: "Jeep", model: "CJ", spans: spans(1965, 1986, 22) },
  { make: "Jeep", model: "Grand Cherokee", spans: spans(1993, 2025, 8) },

  // Toyota
  { make: "Toyota", model: "Corolla", spans: spans(1966, 2025, 7) },
  { make: "Toyota", model: "Camry", spans: spans(1983, 2025, 7) },
  { make: "Toyota", model: "Supra", spans: [...spans(1978, 1986, 9), ...spans(1986, 1992, 7), ...spans(1993, 2002, 10), ...spans(2019, 2025, 7)] },
  { make: "Toyota", model: "Celica", spans: spans(1971, 2005, 7) },
  { make: "Toyota", model: "Land Cruiser", spans: spans(1965, 2025, 10) },
  { make: "Toyota", model: "4Runner", spans: spans(1984, 2025, 8) },
  { make: "Toyota", model: "Tacoma", spans: spans(1995, 2025, 10) },
  { make: "Toyota", model: "Tundra", spans: spans(2000, 2025, 13) },
  { make: "Toyota", model: "MR2", spans: spans(1985, 2007, 11) },
  { make: "Toyota", model: "86/GR86", spans: [...spans(2013, 2020, 8), ...spans(2022, 2025, 4)] },
  { make: "Lexus", model: "LS", spans: spans(1990, 2025, 9) },
  { make: "Lexus", model: "IS", spans: spans(1999, 2025, 9) },

  // Honda
  { make: "Honda", model: "Civic", spans: spans(1973, 2025, 7) },
  { make: "Honda", model: "Accord", spans: spans(1976, 2025, 7) },
  { make: "Honda", model: "Prelude", spans: spans(1978, 2001, 8) },
  { make: "Honda", model: "S2000", spans: spans(2000, 2009, 10) },
  { make: "Honda", model: "CRX", spans: spans(1984, 1991, 8) },
  { make: "Honda", model: "Integra", spans: spans(1986, 2006, 10) },
  { make: "Honda", model: "NSX", spans: [...spans(1991, 2005, 15), ...spans(2016, 2022, 7)] },
  { make: "Acura", model: "Integra", spans: [...spans(1986, 2006, 10), ...spans(2023, 2025, 3)] },
  { make: "Acura", model: "NSX", spans: spans(1991, 2022, 16) },

  // Nissan / Infiniti
  { make: "Nissan", model: "240SX", spans: spans(1989, 1998, 10) },
  { make: "Nissan", model: "300ZX", spans: spans(1984, 2000, 17) },
  { make: "Nissan", model: "350Z", spans: spans(2003, 2009, 7) },
  { make: "Nissan", model: "370Z", spans: spans(2009, 2020, 12) },
  { make: "Nissan", model: "GT-R", spans: spans(2009, 2025, 17) },
  { make: "Nissan", model: "Skyline", spans: spans(1969, 2002, 8) },
  { make: "Nissan", model: "Sentra", spans: spans(1982, 2025, 7) },
  { make: "Nissan", model: "Maxima", spans: spans(1981, 2025, 8) },
  { make: "Nissan", model: "Datsun 510", spans: spans(1965, 1973, 9) },
  { make: "Nissan", model: "Z", spans: spans(1970, 2025, 8) },
  { make: "Infiniti", model: "G35/G37", spans: spans(2003, 2013, 11) },

  // Mazda
  { make: "Mazda", model: "MX-5 Miata", spans: [...spans(1990, 1997, 8), ...spans(1998, 2005, 8), ...spans(2006, 2015, 10), ...spans(2016, 2025, 10)] },
  { make: "Mazda", model: "RX-7", spans: [...spans(1978, 1985, 8), ...spans(1986, 1991, 6), ...spans(1992, 2002, 11)] },
  { make: "Mazda", model: "RX-8", spans: spans(2003, 2012, 10) },
  { make: "Mazda", model: "3", spans: spans(2004, 2025, 11) },
  { make: "Mazda", model: "6", spans: spans(2003, 2021, 19) },

  // Subaru
  { make: "Subaru", model: "Impreza WRX", spans: spans(2002, 2025, 8) },
  { make: "Subaru", model: "Impreza STI", spans: spans(2004, 2021, 18) },
  { make: "Subaru", model: "BRZ", spans: [...spans(2013, 2020, 8), ...spans(2022, 2025, 4)] },
  { make: "Subaru", model: "Legacy", spans: spans(1990, 2025, 9) },
  { make: "Subaru", model: "Outback", spans: spans(1995, 2025, 10) },

  // Mitsubishi
  { make: "Mitsubishi", model: "Lancer Evolution", spans: spans(1992, 2015, 24) },
  { make: "Mitsubishi", model: "3000GT", spans: spans(1991, 1999, 9) },

  // BMW / Mercedes / VW / Audi / Porsche
  { make: "BMW", model: "3 Series", spans: spans(1975, 2025, 7) },
  { make: "BMW", model: "5 Series", spans: spans(1972, 2025, 8) },
  { make: "BMW", model: "M3", spans: spans(1986, 2025, 8) },
  { make: "BMW", model: "2002", spans: spans(1968, 1976, 9) },
  { make: "Mercedes-Benz", model: "SL", spans: spans(1965, 2025, 10) },
  { make: "Mercedes-Benz", model: "E-Class", spans: spans(1986, 2025, 8) },
  { make: "Mercedes-Benz", model: "C-Class", spans: spans(1994, 2025, 8) },
  { make: "Volkswagen", model: "Golf/GTI", spans: spans(1975, 2025, 8) },
  { make: "Volkswagen", model: "Jetta", spans: spans(1980, 2025, 9) },
  { make: "Volkswagen", model: "Beetle", spans: [...spans(1965, 1979, 15), ...spans(1998, 2019, 22)] },
  { make: "Audi", model: "Quattro", spans: spans(1980, 1991, 12) },
  { make: "Audi", model: "A4", spans: spans(1996, 2025, 10) },
  { make: "Porsche", model: "911", spans: spans(1965, 2025, 10) },
  { make: "Porsche", model: "944", spans: spans(1982, 1991, 10) },
  { make: "Porsche", model: "Boxster/Cayman", spans: spans(1997, 2025, 14) },

  // British / Italian
  { make: "Jaguar", model: "E-Type", spans: spans(1965, 1974, 10) },
  { make: "Jaguar", model: "XJ", spans: spans(1968, 2019, 10) },
  { make: "Land Rover", model: "Defender", spans: spans(1983, 2025, 14) },
  { make: "Mini", model: "Cooper", spans: spans(1965, 2025, 10) },
  { make: "Alfa Romeo", model: "Spider", spans: spans(1966, 1994, 14) },
  { make: "Fiat", model: "124 Spider", spans: spans(1966, 1985, 20) },

  // Korean
  { make: "Hyundai", model: "Elantra", spans: spans(1991, 2025, 8) },
  { make: "Hyundai", model: "Genesis Coupe", spans: spans(2010, 2016, 7) },
  { make: "Kia", model: "Stinger", spans: spans(2018, 2023, 6) },

  // Volvo
  { make: "Volvo", model: "240", spans: spans(1975, 1993, 19) },
  { make: "Volvo", model: "Amazon", spans: spans(1965, 1970, 6) },
];
