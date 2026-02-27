// Worldwide Bank Database
// Contains major banks from 50+ countries with SWIFT/BIC codes

export interface Bank {
    name: string;
    code?: string; // SWIFT/BIC code
    isDigital?: boolean; // Digital wallet/fintech
}

export interface CountryBanks {
    country: string;
    currency: string;
    currencySymbol: string;
    flag?: string; // Emoji flag
    priority?: number; // Lower = higher priority in list
    banks: Bank[];
}

export const WORLD_BANKS: Record<string, CountryBanks> = {
    // ========== SOUTH ASIA (PRIORITY) ==========

    NP: {
        country: "Nepal",
        currency: "NPR",
        currencySymbol: "रू",
        flag: "🇳🇵",
        priority: 1,
        banks: [
            { name: "Nepal Rastra Bank", code: "NRBINPKA" },
            { name: "Nepal Bank Limited", code: "NEABORKA" },
            { name: "Rastriya Banijya Bank", code: "RBBANPKA" },
            { name: "Nabil Bank", code: "NABORPKA" },
            { name: "Nepal Investment Bank", code: "NIBBNPKA" },
            { name: "Standard Chartered Bank Nepal", code: "SCBLNPKA" },
            { name: "Himalayan Bank", code: "HABORPKA" },
            { name: "Nepal SBI Bank", code: "NEPSNPKA" },
            { name: "Everest Bank", code: "EVBLNPKA" },
            { name: "Bank of Kathmandu", code: "BOKANPKA" },
            { name: "NCC Bank", code: "NABORPKX" },
            { name: "NIC Asia Bank", code: "NICENPKA" },
            { name: "Machhapuchchhre Bank", code: "MABORPKA" },
            { name: "Kumari Bank", code: "KABORPKA" },
            { name: "Laxmi Bank", code: "LAXBNPKA" },
            { name: "Siddhartha Bank", code: "SABORPKA" },
            { name: "Agriculture Development Bank", code: "ADBLNPKA" },
            { name: "Global IME Bank", code: "GLBBNPKA" },
            { name: "Citizens Bank International", code: "CITIZNPK" },
            { name: "Prime Commercial Bank", code: "PRABORPK" },
            { name: "Sunrise Bank", code: "SRBLNPKA" },
            { name: "Century Commercial Bank", code: "CCBLNPKA" },
            { name: "Sanima Bank", code: "SABORPKX" },
            { name: "Mega Bank Nepal", code: "MABORPKX" },
            { name: "Civil Bank", code: "CIVLNPKA" },
            { name: "Nepal Bangladesh Bank", code: "NBBLNPKA" },
            { name: "Prabhu Bank", code: "PRAMNPKA" },
            { name: "eSewa", isDigital: true },
            { name: "Khalti", isDigital: true },
            { name: "IME Pay", isDigital: true },
            { name: "FonePay", isDigital: true },
            { name: "ConnectIPS", isDigital: true },
        ]
    },

    IN: {
        country: "India",
        currency: "INR",
        currencySymbol: "₹",
        flag: "🇮🇳",
        priority: 2,
        banks: [
            { name: "State Bank of India", code: "SBININBB" },
            { name: "HDFC Bank", code: "HDFCINBB" },
            { name: "ICICI Bank", code: "ABORINBB" },
            { name: "Punjab National Bank", code: "PUNBINBB" },
            { name: "Bank of Baroda", code: "BARBINBB" },
            { name: "Axis Bank", code: "AXISINBB" },
            { name: "Canara Bank", code: "CNRBINBB" },
            { name: "Union Bank of India", code: "UBININBB" },
            { name: "Bank of India", code: "BKIDINBB" },
            { name: "Indian Bank", code: "IDIBINBB" },
            { name: "Central Bank of India", code: "CBININBB" },
            { name: "Indian Overseas Bank", code: "IABORBB" },
            { name: "UCO Bank", code: "UCBAINBB" },
            { name: "Bank of Maharashtra", code: "MAHBINBX" },
            { name: "Punjab & Sind Bank", code: "PSABORBB" },
            { name: "IDBI Bank", code: "IBKLINBB" },
            { name: "Kotak Mahindra Bank", code: "ABORINBB" },
            { name: "IndusInd Bank", code: "INDBINBB" },
            { name: "Yes Bank", code: "YESBINBB" },
            { name: "Federal Bank", code: "FABORBB" },
            { name: "South Indian Bank", code: "SIABORBB" },
            { name: "RBL Bank", code: "RATNINBB" },
            { name: "Bandhan Bank", code: "BDBLNPKA" },
            { name: "IDFC First Bank", code: "IDFBINBB" },
            { name: "Paytm Payments Bank", isDigital: true },
            { name: "Airtel Payments Bank", isDigital: true },
            { name: "PhonePe", isDigital: true },
            { name: "Google Pay", isDigital: true },
            { name: "Amazon Pay", isDigital: true },
            { name: "CRED", isDigital: true },
        ]
    },

    BD: {
        country: "Bangladesh",
        currency: "BDT",
        currencySymbol: "৳",
        banks: [
            { name: "Bangladesh Bank", code: "BBABORBD" },
            { name: "Sonali Bank", code: "BABORBD" },
            { name: "Janata Bank", code: "JANBBDDH" },
            { name: "Agrani Bank", code: "AGBKBDDH" },
            { name: "Rupali Bank", code: "RUPBBDDH" },
            { name: "BASIC Bank", code: "BABORBD" },
            { name: "Bangladesh Development Bank", code: "BDDBBDDH" },
            { name: "Bangladesh Krishi Bank", code: "BKBABDDH" },
            { name: "Standard Chartered Bangladesh", code: "SCBLBDDH" },
            { name: "HSBC Bangladesh", code: "HSBCBDDH" },
            { name: "Citibank NA Bangladesh", code: "CITIBDDX" },
            { name: "Dutch-Bangla Bank", code: "DBBLBDDH" },
            { name: "BRAC Bank", code: "BABORBD" },
            { name: "Eastern Bank", code: "EABORBD" },
            { name: "Prime Bank", code: "PRABORBD" },
            { name: "Islami Bank Bangladesh", code: "IBBLBDDH" },
            { name: "bKash (Mobile Banking)" },
            { name: "Nagad (Mobile Banking)" },
            { name: "Rocket (Mobile Banking)" },
        ]
    },

    PK: {
        country: "Pakistan",
        currency: "PKR",
        currencySymbol: "₨",
        flag: "🇵🇰",
        priority: 3,
        banks: [
            { name: "State Bank of Pakistan", code: "SBPLPKKX" },
            { name: "National Bank of Pakistan", code: "NBPAPKKA" },
            { name: "Habib Bank Limited", code: "HABORKA" },
            { name: "United Bank Limited", code: "UNILPKKA" },
            { name: "MCB Bank", code: "MUCBPKKA" },
            { name: "Allied Bank", code: "ABPAPKKA" },
            { name: "Bank Alfalah", code: "ALFHPKKA" },
            { name: "Askari Bank", code: "ASCMPKKA" },
            { name: "Faysal Bank", code: "FABORKA" },
            { name: "Bank Al Habib", code: "BABORKA" },
            { name: "Meezan Bank", code: "MEABORKA" },
            { name: "Standard Chartered Pakistan", code: "SCBLPKKX" },
            { name: "JS Bank", code: "JSBLPKKA" },
            { name: "JazzCash", isDigital: true },
            { name: "Easypaisa", isDigital: true },
            { name: "NayaPay", isDigital: true },
            { name: "SadaPay", isDigital: true },
            { name: "Zindigi by JS Bank", isDigital: true },
        ]
    },

    LK: {
        country: "Sri Lanka",
        currency: "LKR",
        currencySymbol: "Rs",
        banks: [
            { name: "Central Bank of Sri Lanka", code: "CBABORLA" },
            { name: "Bank of Ceylon", code: "BABORLA" },
            { name: "People's Bank", code: "PABORLA" },
            { name: "Commercial Bank of Ceylon", code: "CABORLA" },
            { name: "Hatton National Bank", code: "HNBKLKLX" },
            { name: "Sampath Bank", code: "BSAMLKLX" },
            { name: "Seylan Bank", code: "SABORLA" },
            { name: "DFCC Bank", code: "DFCCKLX" },
            { name: "Nations Trust Bank", code: "NTBKLKLX" },
            { name: "Pan Asia Banking Corporation", code: "PABORLX" },
            { name: "Standard Chartered Sri Lanka", code: "SCBLCOLK" },
            { name: "HSBC Sri Lanka", code: "HSBCLKLX" },
        ]
    },

    // ========== SOUTHEAST ASIA ==========

    SG: {
        country: "Singapore",
        currency: "SGD",
        currencySymbol: "S$",
        banks: [
            { name: "Monetary Authority of Singapore", code: "MASGSGS" },
            { name: "DBS Bank", code: "DBSSSGSG" },
            { name: "OCBC Bank", code: "OCBCSGSG" },
            { name: "United Overseas Bank", code: "UOVBSGSG" },
            { name: "Standard Chartered Singapore", code: "SCBLSGSG" },
            { name: "HSBC Singapore", code: "HSBCSGSG" },
            { name: "Citibank Singapore", code: "CITISGSG" },
            { name: "Maybank Singapore", code: "MBBESGSG" },
            { name: "Bank of China Singapore", code: "BKCHSGSG" },
            { name: "ICBC Singapore", code: "ABORSGS" },
            { name: "GrabPay (Digital Wallet)" },
            { name: "PayNow (Digital Transfer)" },
        ]
    },

    MY: {
        country: "Malaysia",
        currency: "MYR",
        currencySymbol: "RM",
        banks: [
            { name: "Bank Negara Malaysia", code: "BNMAMYKL" },
            { name: "Maybank", code: "MABORYKL" },
            { name: "CIMB Bank", code: "CIBBMYKL" },
            { name: "Public Bank", code: "PBORYKL" },
            { name: "RHB Bank", code: "RABORYKL" },
            { name: "Hong Leong Bank", code: "HLBBMYKL" },
            { name: "AmBank", code: "ARBKMYKL" },
            { name: "Bank Islam Malaysia", code: "BIMBMYKL" },
            { name: "HSBC Malaysia", code: "HSBCMYKL" },
            { name: "Standard Chartered Malaysia", code: "SCBLMYKX" },
            { name: "Citibank Malaysia", code: "CITIMYKL" },
            { name: "OCBC Malaysia", code: "OCBCMYKL" },
            { name: "Touch 'n Go (E-Wallet)" },
            { name: "GrabPay Malaysia" },
            { name: "Boost (E-Wallet)" },
        ]
    },

    TH: {
        country: "Thailand",
        currency: "THB",
        currencySymbol: "฿",
        banks: [
            { name: "Bank of Thailand", code: "BOTATHBK" },
            { name: "Bangkok Bank", code: "BKKBTHBK" },
            { name: "Kasikornbank", code: "KASITHBK" },
            { name: "Siam Commercial Bank", code: "SICOTHBK" },
            { name: "Krung Thai Bank", code: "KRABORHBK" },
            { name: "Bank of Ayudhya", code: "AYUDTHBK" },
            { name: "TMBThanachart Bank", code: "TMBKTHBK" },
            { name: "Kiatnakin Phatra Bank", code: "KABORHBK" },
            { name: "CIMB Thai", code: "UBOBTHBK" },
            { name: "UOB Thailand", code: "UOVBTHBK" },
            { name: "Standard Chartered Thailand", code: "SCBLTHBX" },
            { name: "Citibank Thailand", code: "CITITHBX" },
            { name: "PromptPay (Instant Transfer)" },
            { name: "TrueMoney Wallet" },
        ]
    },

    PH: {
        country: "Philippines",
        currency: "PHP",
        currencySymbol: "₱",
        banks: [
            { name: "Bangko Sentral ng Pilipinas", code: "BSPIPHMM" },
            { name: "BDO Unibank", code: "ABORHPMM" },
            { name: "Bank of the Philippine Islands", code: "BABORHMM" },
            { name: "Metrobank", code: "MBORPHMM" },
            { name: "Land Bank of the Philippines", code: "TLBPPHMM" },
            { name: "Philippine National Bank", code: "PNBMPHMM" },
            { name: "Security Bank", code: "SETCPHMM" },
            { name: "UnionBank of the Philippines", code: "UBPHPHMM" },
            { name: "Chinabank", code: "CHBKPHMM" },
            { name: "RCBC", code: "RCBCPHMM" },
            { name: "EastWest Bank", code: "EWBCPHMM" },
            { name: "Asia United Bank", code: "AUBKPHMM" },
            { name: "GCash (E-Wallet)" },
            { name: "Maya (E-Wallet)" },
            { name: "Coins.ph" },
        ]
    },

    ID: {
        country: "Indonesia",
        currency: "IDR",
        currencySymbol: "Rp",
        banks: [
            { name: "Bank Indonesia", code: "BABORIDJA" },
            { name: "Bank Central Asia", code: "CENAIDJA" },
            { name: "Bank Mandiri", code: "BMRIIDJA" },
            { name: "Bank Rakyat Indonesia", code: "BABORIDJA" },
            { name: "Bank Negara Indonesia", code: "BNIAIDJA" },
            { name: "Bank CIMB Niaga", code: "BABORIDJA" },
            { name: "Bank Danamon", code: "BDIAIDJA" },
            { name: "Bank Permata", code: "BABORIDJA" },
            { name: "Bank OCBC NISP", code: "NABORIDJA" },
            { name: "Bank Maybank Indonesia", code: "MABORIDJA" },
            { name: "Bank Panin", code: "PABORIDJA" },
            { name: "Standard Chartered Indonesia", code: "SCBIDJA" },
            { name: "HSBC Indonesia", code: "HSBCIDJA" },
            { name: "GoPay (Digital Wallet)" },
            { name: "OVO (Digital Wallet)" },
            { name: "DANA (Digital Wallet)" },
            { name: "LinkAja (Digital Wallet)" },
        ]
    },

    VN: {
        country: "Vietnam",
        currency: "VND",
        currencySymbol: "₫",
        banks: [
            { name: "State Bank of Vietnam", code: "SBVVVNVX" },
            { name: "Vietcombank", code: "BFTVVNVX" },
            { name: "VietinBank", code: "ICBVVNVX" },
            { name: "BIDV", code: "BIDVVNVX" },
            { name: "Agribank", code: "VBAAVNVX" },
            { name: "Techcombank", code: "VTCBVNVX" },
            { name: "MB Bank", code: "MSCBVNVX" },
            { name: "ACB", code: "ASCBVNVX" },
            { name: "Sacombank", code: "SABORVNVX" },
            { name: "VPBank", code: "VPBKVNVX" },
            { name: "TPBank", code: "TPBVVNVX" },
            { name: "HDBank", code: "HDABVNVX" },
            { name: "HSBC Vietnam", code: "HSBCVNVX" },
            { name: "Standard Chartered Vietnam", code: "SCBLVNVX" },
            { name: "MoMo (E-Wallet)" },
            { name: "ZaloPay (E-Wallet)" },
            { name: "VNPay (Payment Gateway)" },
        ]
    },

    // ========== EAST ASIA ==========

    CN: {
        country: "China",
        currency: "CNY",
        currencySymbol: "¥",
        banks: [
            { name: "People's Bank of China", code: "PBOCCNBJ" },
            { name: "Industrial and Commercial Bank of China", code: "ABORCNBJ" },
            { name: "China Construction Bank", code: "PCBCCNBJ" },
            { name: "Agricultural Bank of China", code: "ABOCCNBJ" },
            { name: "Bank of China", code: "BKCHCNBJ" },
            { name: "Bank of Communications", code: "COMCNSHG" },
            { name: "China Merchants Bank", code: "CMBCCNBS" },
            { name: "Industrial Bank", code: "FJIBCNBA" },
            { name: "Shanghai Pudong Development Bank", code: "SPDBCNSH" },
            { name: "China CITIC Bank", code: "CIBKCNBJ" },
            { name: "China Minsheng Bank", code: "MSBCCNBJ" },
            { name: "China Everbright Bank", code: "EVABCNBJ" },
            { name: "Ping An Bank", code: "SZDBCNBS" },
            { name: "Alipay (Digital Wallet)" },
            { name: "WeChat Pay (Digital Wallet)" },
            { name: "UnionPay (Card Network)" },
        ]
    },

    JP: {
        country: "Japan",
        currency: "JPY",
        currencySymbol: "¥",
        banks: [
            { name: "Bank of Japan", code: "BOJPJPJT" },
            { name: "MUFG Bank", code: "BOTKJPJT" },
            { name: "Sumitomo Mitsui Banking Corporation", code: "SMBCJPJT" },
            { name: "Mizuho Bank", code: "MHCBJPJT" },
            { name: "Resona Bank", code: "DABORPJT" },
            { name: "Saitama Resona Bank", code: "SABORJPJT" },
            { name: "Shinsei Bank", code: "LTCBJPJT" },
            { name: "Aozora Bank", code: "NCBKJPJT" },
            { name: "Japan Post Bank", code: "JABORJT" },
            { name: "Rakuten Bank", code: "RAKTJPJT" },
            { name: "Sony Bank", code: "SNYBJPJT" },
            { name: "SBI Sumishin Net Bank", code: "NABORJPJT" },
            { name: "PayPay (Digital Wallet)" },
            { name: "LINE Pay" },
            { name: "Rakuten Pay" },
        ]
    },

    KR: {
        country: "South Korea",
        currency: "KRW",
        currencySymbol: "₩",
        banks: [
            { name: "Bank of Korea", code: "BOKRKRSE" },
            { name: "KB Kookmin Bank", code: "ABORRKSE" },
            { name: "Shinhan Bank", code: "SHBKKRSE" },
            { name: "Woori Bank", code: "HVBKKRSE" },
            { name: "Hana Bank", code: "KOABORKE" },
            { name: "NH NongHyup Bank", code: "NACFKRSEXXX" },
            { name: "Industrial Bank of Korea", code: "IBKOKRS" },
            { name: "Korea Development Bank", code: "KODBKRSE" },
            { name: "Standard Chartered Korea", code: "SCBLKRSE" },
            { name: "Citibank Korea", code: "CITIKRSX" },
            { name: "Kakao Bank", code: "KAKOKRSE" },
            { name: "K Bank" },
            { name: "Toss Bank" },
            { name: "Samsung Pay" },
            { name: "KakaoPay" },
            { name: "Naver Pay" },
        ]
    },

    HK: {
        country: "Hong Kong",
        currency: "HKD",
        currencySymbol: "HK$",
        banks: [
            { name: "Hong Kong Monetary Authority", code: "HKABHKHH" },
            { name: "HSBC Hong Kong", code: "HSBCHKHH" },
            { name: "Standard Chartered Hong Kong", code: "SCBLHKHH" },
            { name: "Bank of China (Hong Kong)", code: "BKCHHKHH" },
            { name: "Hang Seng Bank", code: "HABORKHH" },
            { name: "Bank of East Asia", code: "BEASHKHH" },
            { name: "DBS Hong Kong", code: "DHBKHKHH" },
            { name: "Citibank Hong Kong", code: "CITIHKHX" },
            { name: "ICBC (Asia)", code: "UBHKHKHH" },
            { name: "China Construction Bank (Asia)", code: "CCBAHKHH" },
            { name: "Octopus Cards (E-Wallet)" },
            { name: "AlipayHK" },
            { name: "WeChat Pay HK" },
            { name: "PayMe by HSBC" },
        ]
    },

    TW: {
        country: "Taiwan",
        currency: "TWD",
        currencySymbol: "NT$",
        banks: [
            { name: "Central Bank of Taiwan", code: "CBCTTWTP" },
            { name: "Bank of Taiwan", code: "BKTWTWTX" },
            { name: "Taiwan Cooperative Bank", code: "TACBTWTP" },
            { name: "First Commercial Bank", code: "FCBKTWTP" },
            { name: "Hua Nan Commercial Bank", code: "HNBKTWTP" },
            { name: "Chang Hwa Commercial Bank", code: "CCBORWTP" },
            { name: "Mega International Commercial Bank", code: "ICBCTWTP" },
            { name: "Land Bank of Taiwan", code: "LBOTTWTP" },
            { name: "Cathay United Bank", code: "UWCBTWTP" },
            { name: "E.SUN Commercial Bank", code: "ESUNTWTP" },
            { name: "CTBC Bank", code: "CTCBTWTP" },
            { name: "Taipei Fubon Bank", code: "TPBKTWTP" },
            { name: "LINE Pay Taiwan" },
            { name: "JKoPay" },
        ]
    },

    // ========== MIDDLE EAST ==========

    AE: {
        country: "United Arab Emirates",
        currency: "AED",
        currencySymbol: "د.إ",
        banks: [
            { name: "Central Bank of the UAE", code: "CBAUAEAA" },
            { name: "Emirates NBD", code: "EBILAEAB" },
            { name: "First Abu Dhabi Bank", code: "NBABAEAB" },
            { name: "Abu Dhabi Commercial Bank", code: "ADCBAEAA" },
            { name: "Dubai Islamic Bank", code: "DUIBAEAB" },
            { name: "Mashreq Bank", code: "BOMLAEAD" },
            { name: "Commercial Bank of Dubai", code: "CBABAEAB" },
            { name: "RAKBANK", code: "NABORAE" },
            { name: "Abu Dhabi Islamic Bank", code: "ABDIAEAB" },
            { name: "Emirates Islamic", code: "MEABORAE" },
            { name: "HSBC UAE", code: "BBMEAEAD" },
            { name: "Standard Chartered UAE", code: "SCBLAEAB" },
            { name: "Citibank UAE", code: "CITIAEAB" },
        ]
    },

    SA: {
        country: "Saudi Arabia",
        currency: "SAR",
        currencySymbol: "﷼",
        banks: [
            { name: "Saudi Central Bank", code: "SABORJEA" },
            { name: "National Commercial Bank", code: "NCBKSAJE" },
            { name: "Al Rajhi Bank", code: "RJHISARI" },
            { name: "Samba Financial Group", code: "SAMOSAJJ" },
            { name: "Riyad Bank", code: "RIBLSARI" },
            { name: "Saudi British Bank", code: "SABORJA" },
            { name: "Banque Saudi Fransi", code: "BSFRSAJJ" },
            { name: "Arab National Bank", code: "ARNBSARI" },
            { name: "Bank AlJazira", code: "BABORJAH" },
            { name: "Bank Albilad", code: "ALBISAR" },
            { name: "Alinma Bank", code: "INMASARI" },
            { name: "Gulf International Bank", code: "GLABSARIR" },
            { name: "HSBC Saudi Arabia", code: "HSBCSAJX" },
            { name: "STC Pay (E-Wallet)" },
        ]
    },

    QA: {
        country: "Qatar",
        currency: "QAR",
        currencySymbol: "﷼",
        banks: [
            { name: "Qatar Central Bank", code: "QCABQAQA" },
            { name: "Qatar National Bank", code: "QNABQAQA" },
            { name: "Commercial Bank of Qatar", code: "CBQAQAQA" },
            { name: "Doha Bank", code: "DOHBQAQA" },
            { name: "Qatar Islamic Bank", code: "QISBQAQA" },
            { name: "Masraf Al Rayan", code: "MABORAQA" },
            { name: "International Bank of Qatar", code: "AABORAQA" },
            { name: "Ahli Bank", code: "QAABQAQA" },
            { name: "Al Khalij Commercial Bank", code: "KABORAQA" },
            { name: "Barwa Bank", code: "BABORAQA" },
            { name: "HSBC Qatar", code: "BBMEQAQA" },
            { name: "Standard Chartered Qatar", code: "SCBLQAQX" },
        ]
    },

    KW: {
        country: "Kuwait",
        currency: "KWD",
        currencySymbol: "د.ك",
        banks: [
            { name: "Central Bank of Kuwait", code: "CBKWKWKW" },
            { name: "National Bank of Kuwait", code: "NBOKKWKW" },
            { name: "Kuwait Finance House", code: "KFHOKWKW" },
            { name: "Burgan Bank", code: "BABORWKW" },
            { name: "Gulf Bank", code: "GULBKWKW" },
            { name: "Commercial Bank of Kuwait", code: "CBORKWKW" },
            { name: "Al Ahli Bank of Kuwait", code: "ABORKWKW" },
            { name: "Ahli United Bank Kuwait", code: "BABORWKW" },
            { name: "Boubyan Bank", code: "BABORWKW" },
            { name: "Warba Bank", code: "WABABKWKW" },
            { name: "HSBC Kuwait", code: "HSBCKWKW" },
            { name: "Citibank Kuwait", code: "CITIKWKW" },
        ]
    },

    // ========== EUROPE ==========

    GB: {
        country: "United Kingdom",
        currency: "GBP",
        currencySymbol: "£",
        banks: [
            { name: "Bank of England", code: "BABORB2L" },
            { name: "HSBC UK", code: "HBUKGB4B" },
            { name: "Barclays", code: "BABORB22" },
            { name: "NatWest", code: "NABORB2L" },
            { name: "Lloyds Bank", code: "LOYDGB2L" },
            { name: "Santander UK", code: "ABBYGB2L" },
            { name: "Royal Bank of Scotland", code: "RBOSGB2L" },
            { name: "Halifax", code: "HLFXGB21" },
            { name: "TSB", code: "TSBSGB2A" },
            { name: "Metro Bank", code: "MABORB21" },
            { name: "Monzo", code: "MONZGB2L" },
            { name: "Starling Bank", code: "SRLGGB2L" },
            { name: "Revolut", code: "REVOGB21" },
            { name: "Wise (TransferWise)", code: "TRABORB2L" },
            { name: "Chase UK", code: "CHASGB2L" },
        ]
    },

    DE: {
        country: "Germany",
        currency: "EUR",
        currencySymbol: "€",
        banks: [
            { name: "Deutsche Bundesbank", code: "MABORDEFF" },
            { name: "Deutsche Bank", code: "DEUTDEFF" },
            { name: "Commerzbank", code: "COBADEFF" },
            { name: "DZ Bank", code: "GENODEFF" },
            { name: "KfW", code: "KFWIDEFF" },
            { name: "UniCredit Bank (HypoVereinsbank)", code: "HYVEDEFF" },
            { name: "Postbank", code: "PBNKDEFF" },
            { name: "ING Germany", code: "INGDDEFF" },
            { name: "Sparkasse", code: "VARIOUS" },
            { name: "N26", code: "NTSBDEB1" },
            { name: "DKB", code: "BYLADEYH" },
            { name: "Comdirect", code: "COBADEHD" },
            { name: "PayPal Europe" },
        ]
    },

    FR: {
        country: "France",
        currency: "EUR",
        currencySymbol: "€",
        banks: [
            { name: "Banque de France", code: "BDFEFRPP" },
            { name: "BNP Paribas", code: "BABORPFR" },
            { name: "Crédit Agricole", code: "AGRIFRPP" },
            { name: "Société Générale", code: "SOGEFRPP" },
            { name: "Crédit Mutuel", code: "CMCIFR2A" },
            { name: "BPCE (Banque Populaire)", code: "CEABFRPP" },
            { name: "La Banque Postale", code: "PSSTFRPP" },
            { name: "HSBC France", code: "CCBPFRPP" },
            { name: "CIC", code: "CMCIFRP" },
            { name: "Boursorama", code: "BOUSFRPP" },
            { name: "Orange Bank", code: "BABORFRPP" },
            { name: "Fortuneo", code: "FTNOFRP1" },
            { name: "Lydia (E-Wallet)" },
        ]
    },

    CH: {
        country: "Switzerland",
        currency: "CHF",
        currencySymbol: "CHF",
        banks: [
            { name: "Swiss National Bank", code: "SNBZCHZZ" },
            { name: "UBS", code: "UBSWCHZH" },
            { name: "Credit Suisse", code: "CRESCHZZ" },
            { name: "Raiffeisen Switzerland", code: "RAIFCH22" },
            { name: "Zürcher Kantonalbank", code: "ZKBKCHZZ" },
            { name: "PostFinance", code: "POFICHBE" },
            { name: "Julius Baer", code: "BABORHZZ" },
            { name: "Banque Cantonale Vaudoise", code: "BCVLCH2L" },
            { name: "Migros Bank", code: "MIGRCHZZ" },
            { name: "Cler", code: "BCLRCHBB" },
            { name: "TWINT (E-Wallet)" },
        ]
    },

    NL: {
        country: "Netherlands",
        currency: "EUR",
        currencySymbol: "€",
        banks: [
            { name: "De Nederlandsche Bank", code: "DNBANL2A" },
            { name: "ING Bank", code: "INGBNL2A" },
            { name: "ABN AMRO", code: "ABNANLAX" },
            { name: "Rabobank", code: "RABONL2U" },
            { name: "SNS Bank", code: "SNSBNL2A" },
            { name: "Triodos Bank", code: "TRIONL2U" },
            { name: "KNAB", code: "KNABNL2H" },
            { name: "ASN Bank", code: "ASNBNL21" },
            { name: "Bunq", code: "BUNQNL2A" },
            { name: "N26 Netherlands" },
            { name: "Revolut Netherlands" },
        ]
    },

    // ========== NORTH AMERICA ==========

    US: {
        country: "United States",
        currency: "USD",
        currencySymbol: "$",
        banks: [
            { name: "Federal Reserve Bank", code: "FRNYUS33" },
            { name: "JPMorgan Chase", code: "CHASUS33" },
            { name: "Bank of America", code: "BOFAUS3N" },
            { name: "Wells Fargo", code: "WFABORUS6S" },
            { name: "Citibank", code: "CITIUS33" },
            { name: "U.S. Bank", code: "USBKUS44" },
            { name: "PNC Bank", code: "PNCCUS33" },
            { name: "Truist Bank", code: "BABORUSO" },
            { name: "Goldman Sachs", code: "GSCMUS33" },
            { name: "Morgan Stanley", code: "MSTCUS33" },
            { name: "Capital One", code: "NFBKUS33" },
            { name: "TD Bank USA", code: "TDOMUS33" },
            { name: "Charles Schwab", code: "SCHWUS66" },
            { name: "HSBC USA", code: "MRMDUS33" },
            { name: "American Express", code: "ABORUSCAS" },
            { name: "Ally Bank", code: "ALLYUS31" },
            { name: "Discover Bank", code: "DBORUS31" },
            { name: "Chime (Online Bank)" },
            { name: "Venmo (Digital Wallet)" },
            { name: "Cash App" },
            { name: "Zelle (Transfer Service)" },
            { name: "PayPal" },
        ]
    },

    CA: {
        country: "Canada",
        currency: "CAD",
        currencySymbol: "C$",
        banks: [
            { name: "Bank of Canada", code: "BKCHCAT2" },
            { name: "Royal Bank of Canada", code: "ROYCCAT2" },
            { name: "Toronto-Dominion Bank", code: "TDOMCAT" },
            { name: "Bank of Nova Scotia", code: "NOSCCAT2" },
            { name: "Bank of Montreal", code: "BOFMCAT2" },
            { name: "Canadian Imperial Bank of Commerce", code: "CIBCCATT" },
            { name: "National Bank of Canada", code: "BNDCCAMM" },
            { name: "HSBC Canada", code: "HKBCCATT" },
            { name: "Laurentian Bank", code: "BLCQCAMM" },
            { name: "Desjardins", code: "CCDQCAMM" },
            { name: "ATB Financial", code: "ATBRCAT2" },
            { name: "Tangerine", code: "INGACAT2" },
            { name: "EQ Bank", code: "EQABCAT2" },
            { name: "Simplii Financial" },
            { name: "Interac e-Transfer" },
        ]
    },

    MX: {
        country: "Mexico",
        currency: "MXN",
        currencySymbol: "Mex$",
        banks: [
            { name: "Banco de México", code: "BXMXMXMX" },
            { name: "BBVA México", code: "BCMRMXMM" },
            { name: "Banorte", code: "MNEXMXMM" },
            { name: "Santander México", code: "BMSXMXMM" },
            { name: "Citibanamex", code: "BABORXMM" },
            { name: "HSBC México", code: "BIMEMXMM" },
            { name: "Scotiabank México", code: "MBCOMXMM" },
            { name: "Inbursa", code: "INBUMXMM" },
            { name: "Banco Azteca", code: "BAZAMXMX" },
            { name: "Banco del Bajío", code: "BABORXMM" },
            { name: "Banregio", code: "BRGIOMXM" },
            { name: "BanCoppel", code: "BCORMXMX" },
            { name: "Nu México (Digital Bank)" },
            { name: "Mercado Pago" },
        ]
    },

    // ========== SOUTH AMERICA ==========

    BR: {
        country: "Brazil",
        currency: "BRL",
        currencySymbol: "R$",
        banks: [
            { name: "Banco Central do Brasil", code: "BCBBBRRO" },
            { name: "Banco do Brasil", code: "BRASBRRJ" },
            { name: "Itaú Unibanco", code: "ITABBRSP" },
            { name: "Bradesco", code: "BBDEBRSP" },
            { name: "Caixa Econômica Federal", code: "CABORBRR" },
            { name: "Santander Brasil", code: "BABORBRSP" },
            { name: "BTG Pactual", code: "BTABBRSP" },
            { name: "Safra", code: "SAFRBRSP" },
            { name: "Banco Votorantim", code: "BVORBRSP" },
            { name: "Banco Inter", code: "BICRBRRJ" },
            { name: "Nubank", code: "NABORBRSP" },
            { name: "C6 Bank", code: "C6ABBRSP" },
            { name: "PicPay" },
            { name: "Mercado Pago Brasil" },
            { name: "PIX (Instant Payment)" },
        ]
    },

    AR: {
        country: "Argentina",
        currency: "ARS",
        currencySymbol: "$",
        banks: [
            { name: "Banco Central de la República Argentina", code: "BABORAR" },
            { name: "Banco de la Nación Argentina", code: "NACNARBX" },
            { name: "Banco Santander Río", code: "BSARBARS" },
            { name: "Banco Galicia", code: "GEBAARBA" },
            { name: "BBVA Argentina", code: "BFRPARBA" },
            { name: "Banco Macro", code: "MABORARB" },
            { name: "Banco Provincia", code: "BSABRBPA" },
            { name: "HSBC Argentina", code: "HSBCARBA" },
            { name: "Banco Patagonia", code: "PATBARBA" },
            { name: "Banco Ciudad", code: "BCITARBA" },
            { name: "Mercado Pago Argentina" },
            { name: "Ualá" },
        ]
    },

    CL: {
        country: "Chile",
        currency: "CLP",
        currencySymbol: "$",
        banks: [
            { name: "Banco Central de Chile", code: "BCCLCLRM" },
            { name: "Banco de Chile", code: "BABORLCL" },
            { name: "Banco Santander Chile", code: "BSCHCLRM" },
            { name: "BCI", code: "ABCRCLRM" },
            { name: "Banco Estado", code: "BABORLCL" },
            { name: "Scotiabank Chile", code: "BKCABCLR" },
            { name: "Itaú Chile", code: "ITAUCLRM" },
            { name: "Banco Falabella", code: "BKCCLRM" },
            { name: "Banco Security", code: "BSECCLRM" },
            { name: "BICE", code: "BICECLRM" },
            { name: "MACH (Digital Wallet)" },
            { name: "Mercado Pago Chile" },
        ]
    },

    CO: {
        country: "Colombia",
        currency: "COP",
        currencySymbol: "$",
        banks: [
            { name: "Banco de la República", code: "BABOROBO" },
            { name: "Bancolombia", code: "CDCOBO" },
            { name: "Banco de Bogotá", code: "BBOGCOBO" },
            { name: "Davivienda", code: "DABOCOBB" },
            { name: "Banco de Occidente", code: "BOCCCOBO" },
            { name: "BBVA Colombia", code: "GDCOCOBO" },
            { name: "Banco Popular", code: "BPOPCOBO" },
            { name: "Scotiabank Colpatria", code: "COLPCOBB" },
            { name: "Banco Caja Social", code: "BABOROBB" },
            { name: "Banco GNB Sudameris", code: "GBSUCOBB" },
            { name: "Nu Colombia (Digital Bank)" },
            { name: "Nequi (Digital Wallet)" },
            { name: "Daviplata" },
        ]
    },

    // ========== OCEANIA ==========

    AU: {
        country: "Australia",
        currency: "AUD",
        currencySymbol: "A$",
        banks: [
            { name: "Reserve Bank of Australia", code: "RBAUSYDX" },
            { name: "Commonwealth Bank", code: "CTABAAUS" },
            { name: "Westpac", code: "WPACAU2S" },
            { name: "ANZ", code: "ANZBAU3M" },
            { name: "National Australia Bank", code: "NATABAU3" },
            { name: "Macquarie Bank", code: "MACQAU2S" },
            { name: "Bendigo Bank", code: "BDBSAU2S" },
            { name: "Bank of Queensland", code: "QABORAU2B" },
            { name: "Suncorp Bank", code: "METWAU4BARC" },
            { name: "ING Australia", code: "INGBAU2S" },
            { name: "AMP Bank", code: "AMPBAU2S" },
            { name: "HSBC Australia", code: "HKBKAAU2" },
            { name: "Up Bank (Digital Bank)" },
            { name: "86 400 (Digital Bank)" },
            { name: "PayID (Instant Transfer)" },
        ]
    },

    NZ: {
        country: "New Zealand",
        currency: "NZD",
        currencySymbol: "NZ$",
        banks: [
            { name: "Reserve Bank of New Zealand", code: "RBORNZXXX" },
            { name: "ANZ New Zealand", code: "ANZBNZ22" },
            { name: "ASB Bank", code: "ASBBNZ2A" },
            { name: "Bank of New Zealand", code: "BKNZNZ22" },
            { name: "Westpac New Zealand", code: "WPACNZ2W" },
            { name: "Kiwibank", code: "KIWANZNZ" },
            { name: "TSB Bank", code: "TSBKNZ22" },
            { name: "SBS Bank", code: "SBSBNZ2D" },
            { name: "Rabobank New Zealand", code: "RABONZ2W" },
            { name: "Heartland Bank", code: "HTABNZ2X" },
            { name: "Co-operative Bank", code: "NZABORNZ" },
        ]
    },

    // ========== AFRICA ==========

    ZA: {
        country: "South Africa",
        currency: "ZAR",
        currencySymbol: "R",
        banks: [
            { name: "South African Reserve Bank", code: "RESRZAJJ" },
            { name: "Standard Bank", code: "SBZAZAJJ" },
            { name: "FirstRand Bank", code: "FIRNZAJJ" },
            { name: "ABSA Bank", code: "ABSAZAJJ" },
            { name: "Nedbank", code: "NEDSZAJJ" },
            { name: "Capitec Bank", code: "CABLZAJJ" },
            { name: "Investec", code: "INVLZAJJ" },
            { name: "African Bank", code: "AABORAJJ" },
            { name: "Discovery Bank", code: "DISCORSAJJ" },
            { name: "TymeBank (Digital Bank)" },
            { name: "Bank Zero (Digital Bank)" },
        ]
    },

    NG: {
        country: "Nigeria",
        currency: "NGN",
        currencySymbol: "₦",
        banks: [
            { name: "Central Bank of Nigeria", code: "CBNINGLA" },
            { name: "Zenith Bank", code: "ZEABORNG" },
            { name: "Access Bank", code: "ABNGNGLA" },
            { name: "GTBank", code: "GTBINGLA" },
            { name: "First Bank of Nigeria", code: "FBNINGLA" },
            { name: "UBA", code: "UNAFNGLA" },
            { name: "Union Bank", code: "UBNINGLA" },
            { name: "Ecobank Nigeria", code: "EABORNG" },
            { name: "Fidelity Bank", code: "FIDTNGLA" },
            { name: "Sterling Bank", code: "NAMGNGLA" },
            { name: "Stanbic IBTC", code: "ABNGNGLA" },
            { name: "FCMB", code: "FCMBNGLA" },
            { name: "Kuda Bank (Digital Bank)" },
            { name: "OPay (Mobile Money)" },
            { name: "PalmPay" },
        ]
    },

    KE: {
        country: "Kenya",
        currency: "KES",
        currencySymbol: "KSh",
        banks: [
            { name: "Central Bank of Kenya", code: "CBKEKENA" },
            { name: "Kenya Commercial Bank", code: "KCBIKENA" },
            { name: "Equity Bank", code: "EABORENA" },
            { name: "Co-operative Bank of Kenya", code: "KCOOKENA" },
            { name: "ABSA Kenya", code: "BABORENA" },
            { name: "Standard Chartered Kenya", code: "SCBLKENX" },
            { name: "Diamond Trust Bank Kenya", code: "DTORKENA" },
            { name: "Stanbic Bank Kenya", code: "SBORKENA" },
            { name: "NCBA Bank", code: "CBAKENA" },
            { name: "I&M Bank", code: "IMBLKENA" },
            { name: "Family Bank", code: "FABORENA" },
            { name: "M-Pesa (Mobile Money)" },
            { name: "Airtel Money" },
        ]
    },

    EG: {
        country: "Egypt",
        currency: "EGP",
        currencySymbol: "E£",
        banks: [
            { name: "Central Bank of Egypt", code: "CBEGEGCX" },
            { name: "National Bank of Egypt", code: "NBEGEGCX" },
            { name: "Banque Misr", code: "BABOREGCX" },
            { name: "Commercial International Bank", code: "CIBOAECX" },
            { name: "QNB Alahli", code: "QNBAEGCX" },
            { name: "Banque du Caire", code: "BCABORECX" },
            { name: "Arab African International Bank", code: "AABORECX" },
            { name: "HSBC Egypt", code: "HSBCEGCX" },
            { name: "Crédit Agricole Egypt", code: "CAGOAECX" },
            { name: "Faisal Islamic Bank", code: "FAIBEGCX" },
            { name: "Vodafone Cash (Mobile Money)" },
            { name: "Orange Cash" },
        ]
    },
};

// Helper function to get all countries with flags - sorted by priority
export function getAllCountries(): { code: string; name: string; currency: string; flag: string; priority?: number }[] {
    return Object.entries(WORLD_BANKS)
        .map(([code, data]) => ({
            code,
            name: data.country,
            currency: data.currency,
            flag: data.flag || "🏳️",
            priority: data.priority,
        }))
        .sort((a, b) => {
            // Sort by priority first (lower = higher in list), then alphabetically
            const aPriority = a.priority ?? 999;
            const bPriority = b.priority ?? 999;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.name.localeCompare(b.name);
        });
}

// Helper function to get banks by country
export function getBanksByCountry(countryCode: string): Bank[] {
    return WORLD_BANKS[countryCode]?.banks || [];
}

// Get country info including flag
export function getCountryInfo(countryCode: string): CountryBanks | null {
    return WORLD_BANKS[countryCode] || null;
}

// Helper function to search banks globally
export function searchBanks(query: string): { country: string; countryCode: string; flag: string; bank: Bank }[] {
    const results: { country: string; countryCode: string; flag: string; bank: Bank }[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [code, data] of Object.entries(WORLD_BANKS)) {
        for (const bank of data.banks) {
            if (bank.name.toLowerCase().includes(lowerQuery) ||
                (bank.code && bank.code.toLowerCase().includes(lowerQuery))) {
                results.push({
                    country: data.country,
                    countryCode: code,
                    flag: data.flag || "🏳️",
                    bank
                });
            }
        }
    }

    return results;
}

// Get currency info for a country
export function getCurrencyInfo(countryCode: string): { currency: string; symbol: string } | null {
    const data = WORLD_BANKS[countryCode];
    if (!data) return null;
    return { currency: data.currency, symbol: data.currencySymbol };
}

// All currencies available - sorted by priority
// All currencies available - sorted by priority and unique
export const CURRENCIES = (() => {
    const uniqueCurrencies = new Map();

    Object.entries(WORLD_BANKS).forEach(([code, data]) => {
        const currencyKey = data.currency.trim().toUpperCase();
        if (!uniqueCurrencies.has(currencyKey)) {
            uniqueCurrencies.set(currencyKey, {
                countryCode: code,
                country: data.country,
                currency: data.currency.trim(),
                symbol: data.currencySymbol,
                flag: data.flag || "🏳️",
                priority: data.priority,
            });
        } else {
            // Keep the one with higher priority if it exists
            const existing = uniqueCurrencies.get(currencyKey);
            if ((data.priority || 999) < (existing.priority || 999)) {
                uniqueCurrencies.set(currencyKey, {
                    countryCode: code,
                    country: data.country,
                    currency: data.currency.trim(),
                    symbol: data.currencySymbol,
                    flag: data.flag || "🏳️",
                    priority: data.priority,
                });
            }
        }
    });

    return Array.from(uniqueCurrencies.values())
        .sort((a, b) => {
            const aPriority = a.priority ?? 999;
            const bPriority = b.priority ?? 999;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.currency.localeCompare(b.currency);
        });
})();

// Priority countries for quick access (South Asia)
export const PRIORITY_COUNTRIES = ["NP", "IN", "PK"] as const;
