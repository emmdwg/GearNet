export type ManualType = "oem" | "workshop" | "owner" | "archive" | "tsb";

export function archiveSearch(make: string, model: string, start: number, end: number) {
  const range = start === end ? `${start}` : `${start}-${end}`;
  const query = `${make} ${model} ${range} factory service manual`;
  return `https://archive.org/search?query=${encodeURIComponent(query)}&and[]=mediatype%3A%22texts%22`;
}

export function haynesSearch(make: string, model: string) {
  return `https://www.haynes.com/en-us/t/search?query=${encodeURIComponent(`${make} ${model}`)}`;
}

export function chiltonSearch(make: string, model: string, start: number) {
  return `https://archive.org/search?query=${encodeURIComponent(`${make} ${model} ${start} chilton repair manual`)}`;
}

export function nhtsaRecalls(make: string, model: string, year: number) {
  return `https://www.nhtsa.gov/recalls?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
}

export function nhtsaTsbs(make: string, model: string, year: number) {
  return `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
}

const OEM_OWNER_PORTALS: Record<string, string> = {
  Acura: "https://owners.acura.com/vehicles/information/manuals",
  Audi: "https://www.audiusa.com/us/web/en/owners/audi-connect/audi-manuals.html",
  BMW: "https://www.bmwusa.com/owners-manuals.html",
  Buick: "https://www.gm.com/ownercenter/booklets",
  Cadillac: "https://www.gm.com/ownercenter/booklets",
  Chevrolet: "https://www.chevrolet.com/support/vehicle/manuals-guides",
  Chrysler: "https://www.mopar.com/en-us/my-vehicle/owners-manual.html",
  Dodge: "https://www.mopar.com/en-us/my-vehicle/owners-manual.html",
  Fiat: "https://www.fiat.com/en_US/owners/manuals",
  Ford: "https://www.ford.com/support/how-tos/owner-manuals/",
  GMC: "https://www.gm.com/ownercenter/booklets",
  Honda: "https://owners.honda.com/vehicles/information/manuals",
  Hyundai: "https://owners.hyundaiusa.com/content/myhyundai/us/en/resources/manuals-warranties.html",
  Infiniti: "https://www.infinitiusa.com/owners/sections/resources.html",
  Jaguar: "https://www.jaguarusa.com/owners/manuals/index.html",
  Jeep: "https://www.jeep.com/en/owners/manuals.html",
  Kia: "https://owners.kia.com/us/en/resources/manuals.html",
  Land: "https://www.landroverusa.com/owners/manuals/index.html",
  "Land Rover": "https://www.landroverusa.com/owners/manuals/index.html",
  Lexus: "https://www.lexus.com/My-Lexus/resources/owners-manuals",
  Lincoln: "https://www.lincoln.com/support/owner-manuals/",
  Mazda: "https://www.mazdausa.com/owners/how-to/owners-manual",
  "Mercedes-Benz": "https://www.mbusa.com/en/owners/manuals",
  Mercury: "https://www.ford.com/support/how-tos/owner-manuals/",
  Mini: "https://www.miniusa.com/owners/manuals.html",
  Mitsubishi: "https://www.mitsubishicars.com/owners/manuals",
  Nissan: "https://www.nissanusa.com/owners/sections/resources.html",
  Oldsmobile: "https://www.gm.com/ownercenter/booklets",
  Plymouth: "https://www.mopar.com/en-us/my-vehicle/owners-manual.html",
  Pontiac: "https://www.gm.com/ownercenter/booklets",
  Porsche: "https://www.porsche.com/usa/accessoriesandservices/porsche-service/owners-manuals/",
  Ram: "https://www.ramtrucks.com/en/owners/manuals.html",
  Subaru: "https://www.subaru.com/owners/vehicle-resources.html",
  Toyota: "https://www.toyota.com/owners/resources/warranty-owners-manuals",
  Volkswagen: "https://www.vw.com/en/owners-manuals.html",
  Volvo: "https://www.volvocars.com/us/support/manuals",
};

export function oemOwnerPortal(make: string) {
  return OEM_OWNER_PORTALS[make] ?? `https://archive.org/search?query=${encodeURIComponent(`${make} owner manual pdf`)}`;
}

export function helmInc(make: string, model: string) {
  return `https://www.helminc.com/helm/search?query=${encodeURIComponent(`${make} ${model}`)}`;
}

export function toyotaTechInfo() {
  return "https://techinfo.toyota.com/";
}

export function hondaServiceExpress() {
  return "https://techinfo.honda.com/rjanisis/pubs/";
}

export function fordServiceInfo() {
  return "https://www.fordservicecontent.com/Ford_Content/vdirsnet/OwnerManual/Home/Index";
}

/** Verified Archive.org collections for popular platforms */
export const ARCHIVE_DIRECT: Record<string, string> = {
  "Ford Mustang 1965-1973": "https://archive.org/search?query=ford%20mustang%201965%20shop%20manual",
  "Chevrolet Camaro 1967-1969": "https://archive.org/details/1967chevroletcamaro",
  "Chevrolet Corvette 1963-1967": "https://archive.org/search?query=corvette%20service%20manual%201963",
  "Ford Mustang 1979-1993": "https://archive.org/search?query=fox%20body%20mustang%20service%20manual",
  "Mazda MX-5 Miata 1990-1997": "https://archive.org/search?query=mazda%20miata%20workshop%20manual",
  "Toyota Supra 1986-1992": "https://archive.org/search?query=toyota%20supra%20mk3%20service%20manual",
  "Nissan 240SX 1989-1998": "https://archive.org/search?query=nissan%20240sx%20service%20manual",
  "Honda Civic 1992-1995": "https://archive.org/search?query=honda%20civic%20eg%20service%20manual",
  "Subaru Impreza WRX 2002-2007": "https://archive.org/search?query=subaru%20wrx%20service%20manual",
  "BMW 3 Series 1992-1998": "https://archive.org/search?query=bmw%20e36%20service%20manual",
  "Volkswagen Golf GTI 1975-1984": "https://archive.org/search?query=volkswagen%20rabbit%20gti%20manual",
  "Jeep CJ 1976-1986": "https://archive.org/search?query=jeep%20cj7%20service%20manual",
  "Porsche 911 1965-1989": "https://archive.org/search?query=porsche%20911%20workshop%20manual",
  "Dodge Charger 1968-1970": "https://archive.org/search?query=1969%20dodge%20charger%20shop%20manual",
  "Toyota Land Cruiser 1960-1984": "https://archive.org/search?query=toyota%20land%20cruiser%20fj40%20manual",
};

export function directArchiveKey(make: string, model: string, start: number, end: number) {
  return `${make} ${model} ${start}-${end}`;
}
