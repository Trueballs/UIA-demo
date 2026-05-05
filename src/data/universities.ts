export type University = {
    name: string;
    domain: string;
    short?: string;
    aliases?: string[]; // Alternative search terms like ["Reading University", "Reading Uni"]
    folder: string; // folder name inside the country-specific root
    country: "United Kingdom" | "Norway";
    root: string; // Root folder for assets (e.g. "uk-universities" or "norske-universiteter")
    logoSearch: string; // Filename of the favicon/logo in the logo-search folder
    campuses?: string[]; // Optional list of campuses if a school has multiple bases
};

export const UK_UNIVERSITIES: University[] = [
    { name: "Imperial College London", domain: "imperial.ac.uk", short: "Imperial", folder: "Imperial", root: "uk-universities", country: "United Kingdom", aliases: ["Imperial London"], logoSearch: "imperial_college_london_logo.jpeg" },
    { name: "King's College London", domain: "kcl.ac.uk", short: "KCL", folder: "KCL", root: "uk-universities", country: "United Kingdom", aliases: ["Kings College", "Kings"], logoSearch: "kings_college_london_logo.jpeg" },
    { name: "London School of Economics", domain: "lse.ac.uk", short: "LSE", folder: "LSE", root: "uk-universities", country: "United Kingdom", aliases: ["London School of Economics and Political Science"], logoSearch: "london_school_of_economics_logo.jpeg" },
    { name: "University of Manchester", domain: "manchester.ac.uk", short: "Manchester", folder: "Manchester", root: "uk-universities", country: "United Kingdom", aliases: ["Manchester University"], logoSearch: "sdf.jpg" },
    { name: "University College London", domain: "ucl.ac.uk", short: "UCL", folder: "UCL", root: "uk-universities", country: "United Kingdom", aliases: ["UCL London"], logoSearch: "university_college_london_logo.jpeg" },
    { name: "University of Reading", domain: "reading.ac.uk", short: "Reading", folder: "Reading", root: "uk-universities", country: "United Kingdom", aliases: ["Reading University", "Reading Uni", "Henley", "Henley Business School"], logoSearch: "reading_icon.png", campuses: ["Reading University", "Henley Business School"] },
    { name: "University of Cambridge", domain: "cam.ac.uk", short: "Cambridge", folder: "University of Cambridge", root: "uk-universities", country: "United Kingdom", aliases: ["Cambridge"], logoSearch: "logo.png" },
    { name: "University of Oxford", domain: "ox.ac.uk", short: "Oxford", folder: "University of Oxford", root: "uk-universities", country: "United Kingdom", aliases: ["Oxford"], logoSearch: "logo.png" },
    { name: "University of St Andrews", domain: "st-andrews.ac.uk", short: "St Andrews", folder: "University of St Andrews", root: "uk-universities", country: "United Kingdom", aliases: ["St Andrews"], logoSearch: "logo.png" },
    { name: "Durham University", domain: "durham.ac.uk", short: "Durham", folder: "Durham University", root: "uk-universities", country: "United Kingdom", aliases: ["University of Durham"], logoSearch: "logo.png" },
    { name: "Loughborough University", domain: "lboro.ac.uk", short: "Loughborough", folder: "Loughborough University", root: "uk-universities", country: "United Kingdom", aliases: ["Lboro"], logoSearch: "logo.png" },
    { name: "University of Bath", domain: "bath.ac.uk", short: "Bath", folder: "University of Bath", root: "uk-universities", country: "United Kingdom", aliases: ["Bath University"], logoSearch: "logo.png" },
    { name: "University of Warwick", domain: "warwick.ac.uk", short: "Warwick", folder: "University of Warwick", root: "uk-universities", country: "United Kingdom", aliases: ["Warwick University"], logoSearch: "logo.png" },
    { name: "Lancaster University", domain: "lancaster.ac.uk", short: "Lancaster", folder: "Lancaster University", root: "uk-universities", country: "United Kingdom", aliases: ["University of Lancaster"], logoSearch: "logo.png" },
    { name: "University of Exeter", domain: "exeter.ac.uk", short: "Exeter", folder: "University of Exeter", root: "uk-universities", country: "United Kingdom", aliases: ["Exeter University"], logoSearch: "logo.png" },
    { name: "University of York", domain: "york.ac.uk", short: "York", folder: "University of York", root: "uk-universities", country: "United Kingdom", aliases: ["York University UK"], logoSearch: "logo.png" },
    { name: "University of Birmingham", domain: "bham.ac.uk", short: "Birmingham", folder: "University of Birmingham", root: "uk-universities", country: "United Kingdom", aliases: ["Birmingham University"], logoSearch: "logo.png" },
    { name: "University of Bristol", domain: "bristol.ac.uk", short: "Bristol", folder: "University of Bristol", root: "uk-universities", country: "United Kingdom", aliases: ["Bristol University"], logoSearch: "logo.png" },
    { name: "University of Sheffield", domain: "sheffield.ac.uk", short: "Sheffield", folder: "University of Sheffield", root: "uk-universities", country: "United Kingdom", aliases: ["Sheffield University"], logoSearch: "logo.png" },
    { name: "University of Southampton", domain: "soton.ac.uk", short: "Southampton", folder: "University of Southampton", root: "uk-universities", country: "United Kingdom", aliases: ["Southampton University"], logoSearch: "logo.png" },
    { name: "University of Edinburgh", domain: "ed.ac.uk", short: "Edinburgh", folder: "University of Edinburgh", root: "uk-universities", country: "United Kingdom", aliases: ["Edinburgh University"], logoSearch: "logo.png" },
    { name: "University of Surrey", domain: "surrey.ac.uk", short: "Surrey", folder: "University of Surrey", root: "uk-universities", country: "United Kingdom", aliases: ["Surrey University"], logoSearch: "logo.png" },
    { name: "University of Leeds", domain: "leeds.ac.uk", short: "Leeds", folder: "University of Leeds", root: "uk-universities", country: "United Kingdom", aliases: ["Leeds University"], logoSearch: "logo.png" },
    { name: "Cardiff University", domain: "cardiff.ac.uk", short: "Cardiff", folder: "Cardiff University", root: "uk-universities", country: "United Kingdom", aliases: ["University of Cardiff"], logoSearch: "logo.png" },
    { name: "University of Liverpool", domain: "liverpool.ac.uk", short: "Liverpool", folder: "University of Liverpool", root: "uk-universities", country: "United Kingdom", aliases: ["Liverpool University"], logoSearch: "logo.png" },
    { name: "Queen's University Belfast", domain: "qub.ac.uk", short: "QUB", folder: "Queen's University Belfast", root: "uk-universities", country: "United Kingdom", aliases: ["Queens University Belfast"], logoSearch: "logo.png" },
    { name: "Heriot-Watt University", domain: "hw.ac.uk", short: "Heriot-Watt", folder: "Heriot-Watt University", root: "uk-universities", country: "United Kingdom", aliases: ["Heriot Watt"], logoSearch: "logo.png" },
    { name: "University of East Anglia", domain: "uea.ac.uk", short: "UEA", folder: "University of East Anglia", root: "uk-universities", country: "United Kingdom", aliases: ["University of East Anglia (UEA)", "UEA"], logoSearch: "logo.png" },
    { name: "University of Nottingham", domain: "nottingham.ac.uk", short: "Nottingham", folder: "University of Nottingham", root: "uk-universities", country: "United Kingdom", aliases: ["Nottingham University"], logoSearch: "logo.png" },
    { name: "University of Essex", domain: "essex.ac.uk", short: "Essex", folder: "University of Essex", root: "uk-universities", country: "United Kingdom", aliases: ["Essex University"], logoSearch: "logo.png" },
    { name: "University of Aberdeen", domain: "abdn.ac.uk", short: "Aberdeen", folder: "University of Aberdeen", root: "uk-universities", country: "United Kingdom", aliases: ["Aberdeen University"], logoSearch: "logo.png" },
    { name: "University of Glasgow", domain: "gla.ac.uk", short: "Glasgow", folder: "University of Glasgow", root: "uk-universities", country: "United Kingdom", aliases: ["Glasgow University"], logoSearch: "logo.png" },
    { name: "Newcastle University", domain: "ncl.ac.uk", short: "Newcastle", folder: "Newcastle University", root: "uk-universities", country: "United Kingdom", aliases: ["University of Newcastle"], logoSearch: "logo.png" },
    { name: "University of Leicester", domain: "le.ac.uk", short: "Leicester", folder: "University of Leicester", root: "uk-universities", country: "United Kingdom", aliases: ["Leicester University"], logoSearch: "logo.png" },
    { name: "University of the Arts London", domain: "arts.ac.uk", short: "UAL", folder: "University of the Arts London", root: "uk-universities", country: "United Kingdom", aliases: ["UAL"], logoSearch: "logo.png" },
    { name: "Royal Holloway, University of London", domain: "rhul.ac.uk", short: "Royal Holloway", folder: "Royal Holloway, University of London", root: "uk-universities", country: "United Kingdom", aliases: ["Royal Holloway"], logoSearch: "logo.png" },
];

export const NORWAY_UNIVERSITIES: University[] = [
    { name: "NTNU", domain: "ntnu.no", short: "NTNU", folder: "NTNU", root: "norske-universiteter", country: "Norway", aliases: ["Norwegian University of Science and Technology", "Norges teknisk-naturvitenskapelige universitet", "Trondheim"], logoSearch: "ntnu_alt_versjon_uten_slagord.png", campuses: ["Ålesund", "Gjøvik", "Trondheim"], },
    { name: "UiT Norges arktiske universitet", domain: "uit.no", short: "UiT", folder: "UiT", root: "norske-universiteter", country: "Norway", aliases: ["The Arctic University of Norway", "University of Tromsø", "Tromsø", "Alta", "Narvik", "Harstad"], logoSearch: "uit-segl-eng-sort-960px1 bla copy.png", campuses: ["Alta", "Bardufoss", "Hammerfest"] },
    { name: "Universitetet i Sørøst-Norge", domain: "usn.no", short: "USN", folder: "USN", root: "norske-universiteter", country: "Norway", aliases: ["University of South-Eastern Norway", "USN", "Drammen", "Vestfold", "Kongsberg", "Porsgrunn", "Bø i Telemark"], logoSearch: "Logo_of_USN.svg 1.png", campuses: ["Bø", "Drammen", "Kongsberg", "Notodden", "Porsgrunn", "Rauland", "Ringerike", "Vestfold"] },
    { name: "Nord universitet", domain: "nord.no", short: "Nord", folder: "Nord", root: "norske-universiteter", country: "Norway", aliases: ["Bodø", "Levanger", "Steinkjer"], logoSearch: "Nord_University_logo.svg.png" },
    { name: "OsloMet", domain: "oslomet.no", short: "OsloMet", folder: "OsloMet", root: "norske-universiteter", country: "Norway", aliases: ["Oslo Metropolitan University", "Storbyuniversitetet", "Pilestredet", "Kjeller", "Sandvika"], logoSearch: "65b294d8e6618.png", campuses: ["Kjeller", "Oslo and Pilestredet", "Sandvika"] },
    { name: "Universitetet i Innlandet", domain: "inn.no", short: "HINN", folder: "HINN", root: "norske-universiteter", country: "Norway", aliases: ["Inland Norway University of Applied Sciences", "Lillehammer", "Hamar", "Elverum", "Rena"], logoSearch: "some-underordnet.png", campuses: ["Blæstad", "Elverum", "Evenstad", "Hamar", "Lillehammer", "Rena"] },
    { name: "BI - Handelshøyskolen", domain: "bi.no", short: "BI", folder: "BI", root: "norske-universiteter", country: "Norway", aliases: ["BI Norwegian Business School", "BI Business School", "Handelshøyskolen BI", "Handelshoyskolen BI", "Oslo", "Bergen", "Trondheim", "Stavanger"], logoSearch: "BI_Norwegian_Business_School_logo.svg1.png", campuses: ["Oslo", "Bergen", "Trondheim", "Stavanger"] },
    { name: "Universitetet i Oslo", domain: "uio.no", short: "UiO", folder: "UiO", root: "norske-universiteter", country: "Norway", aliases: ["University of Oslo", "Oslo", "Blindern"], logoSearch: "UiO_logo copy.png", campuses: ["Blindern", "Oslo"] },
    { name: "Universitetet i Bergen", domain: "uib.no", short: "UiB", folder: "UiB", root: "norske-universiteter", country: "Norway", aliases: ["University of Bergen", "Bergen"], logoSearch: "UiB_PositivEmblem.png", campuses: ["Bergen"] },
    { name: "Universitetet i Stavanger", domain: "uis.no", short: "UiS", folder: "UiS", root: "norske-universiteter", country: "Norway", aliases: ["University of Stavanger", "Stavanger"], logoSearch: "UiS_Logo.svg", campuses: ["Stavanger"] },
    { name: "Universitetet i Agder", domain: "uia.no", short: "UiA", folder: "UiA", root: "norske-universiteter", country: "Norway", aliases: ["University of Agder", "Kristiansand", "Grimstad"], logoSearch: "uia.png", campuses: ["Grimstad", "Kristiansand"] },
    { name: "Norges miljø- og biovitenskapelige universitet", domain: "nmbu.no", short: "NMBU", folder: "NMBU", root: "norske-universiteter", country: "Norway", aliases: ["Norwegian University of Life Sciences", "Ås"], logoSearch: "norwegian_university_of_life_sciences_logo.jpeg", campuses: ["Ås"] },
    { name: "NHH Norwegian School of Economics", domain: "nhh.no", short: "NHH", folder: "NHH", root: "norske-universiteter", country: "Norway", aliases: ["Norges Handelshøyskole", "NHH", "Bergen", "Norwegian School of Economics"], logoSearch: "NHH_White.png" },
];

export const ALL_UNIVERSITIES = [...UK_UNIVERSITIES, ...NORWAY_UNIVERSITIES];

export function searchUniversities(query: string, country?: string, limit = 6): University[] {
    try {
        const trimmed = query?.trim()?.toLowerCase() || "";
        let currentCountry = country;
        if (!country && typeof window !== "undefined") {
            try {
                const savedData = localStorage.getItem("lnbg_user_data");
                if (savedData && typeof savedData === "string") {
                    const parsed = JSON.parse(savedData);
                    if (parsed && typeof parsed === "object" && parsed.country) {
                        currentCountry = parsed.country;
                    }
                }
            } catch (e) {
                console.debug("Failed to parse user data from localStorage");
            }
        }

        // Strictly filter the pool by the selected country
        const pool = currentCountry 
            ? ALL_UNIVERSITIES.filter(u => u.country === currentCountry)
            : ALL_UNIVERSITIES;

        if (!trimmed) {
            return pool.slice(0, limit);
        }

        const queryWords = trimmed.split(/\s+/).filter(Boolean);

        const results = pool.filter(u => {
            try {
                const searchableText = [
                    u?.name || "",
                    u?.short || "",
                    u?.domain || "",
                    u?.country || "",
                    u?.root || "",
                    ...(u?.aliases || []),
                    ...(u?.campuses || [])
                ].join(" ").toLowerCase();
                
                return queryWords.every(word => searchableText.includes(word));
            } catch (e) {
                console.debug("Error filtering university:", e);
                return false;
            }
        });

        // Sort logic:
        // 1. Exact match on short name (abbreviation)
        // 2. Exact match on full name
        // 3. Country priority
        // 4. Alphabetical
        return results.sort((a, b) => {
            try {
                const aShortLower = a?.short?.toLowerCase() || "";
                const bShortLower = b?.short?.toLowerCase() || "";
                const aNameLower = a?.name?.toLowerCase() || "";
                const bNameLower = b?.name?.toLowerCase() || "";

                // Exact short match
                const aExactShort = aShortLower === trimmed;
                const bExactShort = bShortLower === trimmed;
                if (aExactShort && !bExactShort) return -1;
                if (!aExactShort && bExactShort) return 1;

                // Exact name match
                const aExactName = aNameLower === trimmed;
                const bExactName = bNameLower === trimmed;
                if (aExactName && !bExactName) return -1;
                if (!aExactName && bExactName) return 1;

                return aNameLower.localeCompare(bNameLower);
            } catch (e) {
                console.debug("Error sorting universities:", e);
                return 0;
            }
        }).slice(0, limit);
    } catch (e) {
        console.error("searchUniversities error:", e);
        return [];
    }
}
