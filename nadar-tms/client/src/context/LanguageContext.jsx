import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const LanguageContext = createContext();

export const DICTIONARY = {
  en: {
    // Brand & General
    'TMHNU Fleet Console': 'TMHNU Fleet Console',
    'TMHNU Fleet': 'TMHNU Fleet',
    'Theni Central': 'Theni Central',
    'THENI CENTRAL': 'THENI CENTRAL',
    'Control Room': 'Control Room',
    'Executive': 'Executive',
    'Institution': 'Institution',
    'Campus Incharge': 'Campus Incharge',
    'Super Admin': 'Super Admin',
    'Administrator': 'Administrator',
    'Sign out': 'Sign out',
    'Sign out of TMS': 'Sign out of TMS',
    'Welcome': 'Welcome',
    'Language': 'Language',
    'English': 'English',
    'Tamil': 'Tamil',
    'Live Operations': 'Live Operations',
    'System Online': 'System Online',
    'FLEET ACTIVE': 'FLEET ACTIVE',
    'CAMPUS ACTIVE': 'CAMPUS ACTIVE',

    // Navigation items & Groups
    'Overview': 'Overview',
    'Dashboard': 'Dashboard',
    'Attendance & Reports': 'Attendance & Reports',
    'Attendance Report': 'Attendance Report',
    'All Reports': 'All Reports',
    'Reports': 'Reports',
    'Master Setup': 'Master Setup',
    'Master Data': 'Master Data',
    'Institutions': 'Institutions',
    'Buses': 'Buses',
    'Fleet & Buses': 'Fleet & Buses',
    'Spare': 'Spare',
    'Spare Buses': 'Spare Buses',
    'Drivers': 'Drivers',
    'Routes & Stops': 'Routes & Stops',
    'Routes (view)': 'Routes (view)',
    'Buses (view)': 'Buses (view)',
    'Drivers (view)': 'Drivers (view)',
    'Logins': 'Logins',
    'Operations': 'Operations',
    'Operations & Incharge': 'Operations & Incharge',
    'Assign Route': 'Assign Route',
    'Assign Incharge': 'Assign Incharge',
    'Driver Master Edit': 'Driver Master Edit',
    'Driver Salary': 'Driver Salary',
    'Students': 'Students',
    'Bus Incharge Logins': 'Bus Incharge Logins',
    'Fleet & Maintenance': 'Fleet & Maintenance',
    'Attendance & Audit': 'Attendance & Audit',
    'Diesel Usage': 'Diesel Usage',
    'Maintenance & Billing': 'Maintenance & Billing',
    'Job Cards (Bus-Wise)': 'Job Cards (Bus-Wise)',
    'Job Cards': 'Job Cards',
    'Spare Parts Inventory': 'Spare Parts Inventory',
    'Tyres': 'Tyres',
    'FC Alerts': 'FC Alerts',

    // Actions & Buttons
    'Print Bill': 'Print Bill',
    'Print': 'Print',
    'Print Job Card': 'Print Job Card',
    'Pink Job Card': 'Pink Job Card',
    'Print Date Summary Report': 'Print Date Summary Report',
    'Edit': 'Edit',
    'Delete': 'Delete',
    'Save': 'Save',
    'Cancel': 'Cancel',
    'Close': 'Close',
    'Submit': 'Submit',
    'Search': 'Search',
    'Filter': 'Filter',
    'Refresh': 'Refresh',
    'Refreshing...': 'Refreshing...',
    'View Cards': 'View Cards',
    'Add Service': 'Add Service',
    '+ Add Service': '+ Add Service',
    'Issue New Job Card': 'Issue New Job Card',
    '+ Issue New Job Card': '+ Issue New Job Card',
    'New Service & Bill': 'New Service & Bill',
    '+ New Service & Bill': '+ New Service & Bill',
    'Add Bus': 'Add Bus',
    '+ Add Bus': '+ Add Bus',
    'Add Driver': 'Add Driver',
    '+ Add Driver': '+ Add Driver',
    'Add Student': 'Add Student',
    '+ Add Student': '+ Add Student',
    'Add Route': 'Add Route',
    '+ Add Route': '+ Add Route',
    'Add Institution': 'Add Institution',
    '+ Add Institution': '+ Add Institution',
    'Export CSV': 'Export CSV',
    'Export Excel': 'Export Excel',
    'Fleet Report (PDF)': 'Fleet Report (PDF)',
    'Download': 'Download',
    'Back': 'Back',
    'Save Changes': 'Save Changes',
    'Update': 'Update',
    'Create': 'Create',
    'Confirm': 'Confirm',
    'OK': 'OK',
    'Yes': 'Yes',
    'No': 'No',

    // Table Headers
    'S.No': 'S.No',
    'S.NO': 'S.NO',
    'Bus Number': 'Bus Number',
    'Bus': 'Bus',
    'Driver Name': 'Driver Name',
    'Driver': 'Driver',
    'Institution': 'Institution',
    'Institution Name': 'Institution Name',
    'Route': 'Route',
    'Route Name': 'Route Name',
    'Capacity': 'Capacity',
    'Total Cards': 'Total Cards',
    'Total Job Cards': 'Total Job Cards',
    'Job Cards Have': 'Job Cards Have',
    'Job Card': 'Job Card',
    'Latest Service Date': 'Latest Service Date',
    'Total Maint Bill (₹)': 'Total Maint Bill (₹)',
    'No service yet': 'No service yet',
    'Status': 'Status',
    'Actions': 'Actions',
    'Action': 'Action',
    'Date': 'Date',
    'Work Done / Service': 'Work Done / Service',
    'Spare Parts Billed': 'Spare Parts Billed',
    'Labor (₹)': 'Labor (₹)',
    'Grand Total Bill': 'Grand Total Bill',
    'Total Bill': 'Total Bill',
    'Bill / Job Card': 'Bill / Job Card',
    'Bill No': 'Bill No',
    'Card #': 'Card #',
    'Phone': 'Phone',
    'Mobile': 'Mobile',
    'License Number': 'License Number',
    'Odometer': 'Odometer',
    'Kilometer (km)': 'Kilometer (km)',
    'Model': 'Model',
    'Type': 'Type',
    'Vehicle Type': 'Vehicle Type',
    'Part Name': 'Part Name',
    'Part Number': 'Part Number',
    'Quantity': 'Quantity',
    'Unit Price': 'Unit Price',
    'Total Amount': 'Total Amount',
    'Amount': 'Amount',
    'Mechanic': 'Mechanic',
    'Mechanic / Garage': 'Mechanic / Garage',

    // Filters, Dates & Intervals
    'All': 'All',
    'All Time': 'All Time',
    'Today': 'Today',
    'This Month': 'This Month',
    'Custom': 'Custom',
    'Active': 'Active',
    'Inactive': 'Inactive',
    'Maintenance': 'Maintenance',
    'In Service': 'In Service',
    'Under Repair': 'Under Repair',
    'All Fleet Buses': 'All Fleet Buses',
    'All Institutions': 'All Institutions',
    'All Campuses': 'All Campuses',

    // Page Titles & Headers
    'Fleet Job Cards & Maintenance Reports': 'Fleet Job Cards & Maintenance Reports',
    'Fleet Maintenance & Spare Parts Billing': 'Fleet Maintenance & Spare Parts Billing',
    'Maintenance Report by Date': 'Maintenance Report by Date',
    'Fleet Bus Directory & Job Card Logs': 'Fleet Bus Directory & Job Card Logs',
    'Click any bus row to inspect its full date-wise job card history, print slips, and manage bills': 'Click any bus row to inspect its full date-wise job card history, print slips, and manage bills',
    'Job Cards History': 'Job Cards History',
    'Billing & Store': 'Billing & Store',
    'Maintenance & Bills': 'Maintenance & Bills',
    'Total Fleet Spend': 'Total Fleet Spend',
    'Active Buses in Service': 'Active Buses in Service',
    'Duty Drivers': 'Duty Drivers',
    'Fleet Buses': 'Fleet Buses',
    'Service Records': 'Service Records',
    'Spare Parts Consumed': 'Spare Parts Consumed',
    'Labor & Workshop': 'Labor & Workshop',
    'Buses Serviced / In Maintenance': 'Buses Serviced / In Maintenance',
    'Maintenance Bill Total': 'Maintenance Bill Total',
    'All-Time Fleet Records': 'All-Time Fleet Records',

    // Search Placeholders & Messages
    'Search bus, driver, job card #...': 'Search bus, driver, job card #...',
    'Search bus, bill no, mechanic...': 'Search bus, bill no, mechanic...',
    'No records found.': 'No records found.',
    'No matching service records found.': 'No matching service records found.',
    'No maintenance jobs logged yet. Click "+ New Service & Bill" to create one!': 'No maintenance jobs logged yet. Click "+ New Service & Bill" to create one!',
    'No buses found matching your search or filters.': 'No buses found matching your search or filters.',
    'Loading data...': 'Loading data...',
    'Please wait...': 'Please wait...',

    // Portal / Incharge / Driver / Parent
    'Sign in': 'Sign in',
    'Login': 'Login',
    'Username': 'Username',
    'Password': 'Password',
    'Remember me': 'Remember me',
    'Student Attendance': 'Student Attendance',
    'Live Attendance & Boarding': 'Live Attendance & Boarding',
    'Shift Supervisor': 'Shift Supervisor',
    'Exit': 'Exit',
    'Exit session': 'Exit session',
    'Driver Trip Log': 'Driver Trip Log',
    'TMS Driver Portal': 'TMS Driver Portal',
    'Driver Info': 'Driver Info',
    'Live Bus Tracker': 'Live Bus Tracker',
    'TMS Parent App': 'TMS Parent App',
    'Work Details': 'Work Details',
    'Driver Sign': 'Driver Sign',
    'Mechanic Sign': 'Mechanic Sign',
    'Manager Sign': 'Manager Sign',
    'Secretary Sign': 'Secretary Sign'
  },

  ta: {
    // Brand & General
    'TMHNU Fleet Console': 'TMHNU வாகன கட்டுப்பாட்டு மையம்',
    'TMHNU Fleet': 'TMHNU வாகன நிர்வாகம்',
    'Theni Central': 'தேனி சென்ட்ரல்',
    'THENI CENTRAL': 'தேனி சென்ட்ரல்',
    'Control Room': 'கட்டுப்பாட்டு அறை',
    'Executive': 'நிர்வாக அதிகாரி',
    'Institution': 'கல்வி நிறுவனம்',
    'Campus Incharge': 'வளாக பொறுப்பாளர்',
    'Super Admin': 'முதன்மை நிர்வாகி',
    'Administrator': 'நிர்வாகி',
    'Sign out': 'வெளியேறு',
    'Sign out of TMS': 'கணக்கிலிருந்து வெளியேறு',
    'Welcome': 'நல்வரவு',
    'Language': 'மொழி',
    'English': 'English',
    'Tamil': 'தமிழ்',
    'Live Operations': 'நேரலை செயல்பாடுகள்',
    'System Online': 'அமைப்பு இயக்கத்தில் உள்ளது',
    'FLEET ACTIVE': 'வாகனங்கள் பயன்பாட்டில்',
    'CAMPUS ACTIVE': 'வளாகம் பயன்பாட்டில்',

    // Navigation items & Groups
    'Overview': 'கண்ணோட்டம்',
    'Dashboard': 'முகப்பு (டாஷ்போர்டு)',
    'Attendance & Reports': 'வருகை & அறிக்கைகள்',
    'Attendance Report': 'வருகை அறிக்கை',
    'All Reports': 'அனைத்து அறிக்கைகள்',
    'Reports': 'அறிக்கைகள்',
    'Master Setup': 'முதன்மை அமைப்புகள்',
    'Master Data': 'முதன்மை தரவு',
    'Institutions': 'கல்வி நிறுவனங்கள்',
    'Buses': 'பேருந்துகள்',
    'Fleet & Buses': 'பேருந்துகள் மேலாண்மை',
    'Spare': 'உதிரி பேருந்துகள்',
    'Spare Buses': 'உதிரி பேருந்துகள்',
    'Drivers': 'ஓட்டுநர்கள்',
    'Routes & Stops': 'வழித்தடங்கள் & நிறுத்தங்கள்',
    'Routes (view)': 'வழித்தடங்கள் (பார்வை)',
    'Buses (view)': 'பேருந்துகள் (பார்வை)',
    'Drivers (view)': 'ஓட்டுநர்கள் (பார்வை)',
    'Logins': 'பயனர் கணக்குகள்',
    'Operations': 'செயல்பாடுகள்',
    'Operations & Incharge': 'செயல்பாடுகள் & பொறுப்பாளர்கள்',
    'Assign Route': 'வழித்தட ஒதுக்கீடு',
    'Assign Incharge': 'பொறுப்பாளர் ஒதுக்கீடு',
    'Driver Master Edit': 'ஓட்டுநர் முழு திருத்தம்',
    'Driver Salary': 'ஓட்டுநர் சம்பளம்',
    'Students': 'மாணவர்கள்',
    'Bus Incharge Logins': 'பேருந்து பொறுப்பாளர் கணக்குகள்',
    'Fleet & Maintenance': 'வாகனங்கள் & பராமரிப்பு',
    'Attendance & Audit': 'வருகை & தணிக்கை',
    'Diesel Usage': 'டீசல் பயன்பாடு',
    'Maintenance & Billing': 'பராமரிப்பு & பில்லிங்',
    'Job Cards (Bus-Wise)': 'வேலை அட்டைகள் (பேருந்து வாரியாக)',
    'Job Cards': 'வேலை அட்டைகள் (Job Cards)',
    'Spare Parts Inventory': 'உதிரிபாகங்கள் இருப்பு',
    'Tyres': 'டயர்கள்',
    'FC Alerts': 'FC எச்சரிக்கைகள்',

    // Actions & Buttons
    'Print Bill': 'பில் அச்சிடு',
    'Print': 'அச்சிடு',
    'Print Job Card': 'வேலை அட்டை அச்சிடு',
    'Pink Job Card': 'பிங்க் வேலை அட்டை',
    'Print Date Summary Report': 'தேதி அறிக்கை அச்சிடு',
    'Edit': 'திருத்து',
    'Delete': 'நீக்கு',
    'Save': 'சேமி',
    'Cancel': 'ரத்து செய்',
    'Close': 'மூடு',
    'Submit': 'சமர்ப்பி',
    'Search': 'தேடுக',
    'Filter': 'வடிகட்டு',
    'Refresh': 'புதுப்பி',
    'Refreshing...': 'புதுப்பிக்கப்படுகிறது...',
    'View Cards': 'கார்டுகளைப் பார்',
    'Add Service': 'சர்வீஸ் சேர்',
    '+ Add Service': '+ சர்வீஸ் சேர்',
    'Issue New Job Card': 'புதிய வேலை அட்டை உருவாக்கு',
    '+ Issue New Job Card': '+ புதிய வேலை அட்டை',
    'New Service & Bill': 'புதிய சர்வீஸ் & பில்',
    '+ New Service & Bill': '+ புதிய சர்வீஸ் & பில்',
    'Add Bus': 'பேருந்து சேர்',
    '+ Add Bus': '+ புதிய பேருந்து',
    'Add Driver': 'ஓட்டுநர் சேர்',
    '+ Add Driver': '+ புதிய ஓட்டுநர்',
    'Add Student': 'மாணவர் சேர்',
    '+ Add Student': '+ புதிய மாணவர்',
    'Add Route': 'வழித்தடம் சேர்',
    '+ Add Route': '+ புதிய வழித்தடம்',
    'Add Institution': 'நிறுவனம் சேர்',
    '+ Add Institution': '+ புதிய நிறுவனம்',
    'Export CSV': 'CSV ஏற்றுமதி',
    'Export Excel': 'எக்செல் ஏற்றுமதி',
    'Fleet Report (PDF)': 'வாகன அறிக்கை (PDF)',
    'Download': 'பதிவிறக்கு',
    'Back': 'பின்செல்',
    'Save Changes': 'மாற்றங்களைச் சேமி',
    'Update': 'புதுப்பி',
    'Create': 'உருவாக்கு',
    'Confirm': 'உறுதி செய்',
    'OK': 'சரி',
    'Yes': 'ஆம்',
    'No': 'இல்லை',

    // Table Headers
    'S.No': 'வ.எண்',
    'S.NO': 'வ.எண்',
    'Bus Number': 'பேருந்து எண்',
    'Bus': 'பேருந்து',
    'Driver Name': 'ஓட்டுநர் பெயர்',
    'Driver': 'ஓட்டுநர்',
    'Institution': 'கல்வி நிறுவனம்',
    'Institution Name': 'நிறுவனத்தின் பெயர்',
    'Route': 'வழித்தடம்',
    'Route Name': 'வழித்தடப் பெயர்',
    'Capacity': 'இருக்கைகள்',
    'Total Cards': 'மொத்த கார்டுகள்',
    'Total Job Cards': 'மொத்த வேலை அட்டைகள்',
    'Job Cards Have': 'வேலை அட்டைகள் எண்ணிக்கை',
    'Job Card': 'வேலை அட்டை',
    'Latest Service Date': 'கடைசி சர்வீஸ் தேதி',
    'Total Maint Bill (₹)': 'மொத்த பராமரிப்பு பில் (₹)',
    'No service yet': 'சர்வீஸ் எதுவும் செய்யப்படவில்லை',
    'Status': 'நிலை',
    'Actions': 'செயல்கள்',
    'Action': 'செயல்',
    'Date': 'தேதி',
    'Work Done / Service': 'செய்த வேலை / சர்வீஸ்',
    'Spare Parts Billed': 'பயன்படுத்திய உதிரிபாகங்கள்',
    'Labor (₹)': 'கூலி (₹)',
    'Grand Total Bill': 'மொத்த பில் தொகை',
    'Total Bill': 'மொத்த பில்',
    'Bill / Job Card': 'பில் / வேலை அட்டை',
    'Bill No': 'பில் எண்',
    'Card #': 'அட்டை எண்',
    'Phone': 'தொலைபேசி',
    'Mobile': 'கைபேசி எண்',
    'License Number': 'ஓட்டுநர் உரிம எண்',
    'Odometer': 'ஓடோமீட்டர் (கி.மீ)',
    'Kilometer (km)': 'கிலோமீட்டர் (கி.மீ)',
    'Model': 'மாடல்',
    'Type': 'வகை',
    'Vehicle Type': 'வாகன வகை',
    'Part Name': 'உதிரிபாகம் பெயர்',
    'Part Number': 'பாக எண்',
    'Quantity': 'எண்ணிக்கை',
    'Unit Price': 'அலகு விலை (₹)',
    'Total Amount': 'மொத்த தொகை (₹)',
    'Amount': 'தொகை (₹)',
    'Mechanic': 'மெக்கானிக்',
    'Mechanic / Garage': 'மெக்கானிக் / பட்டறை',

    // Filters, Dates & Intervals
    'All': 'அனைத்தும்',
    'All Time': 'அனைத்து காலம்',
    'Today': 'இன்று',
    'This Month': 'இந்த மாதம்',
    'Custom': 'விருப்ப தேதி',
    'Active': 'இயக்கத்தில்',
    'Inactive': 'நிறுத்தப்பட்டது',
    'Maintenance': 'பராமரிப்பில்',
    'In Service': 'சேவையில்',
    'Under Repair': 'பழுதுநீக்கத்தில்',
    'All Fleet Buses': 'அனைத்து பேருந்துகள்',
    'All Institutions': 'அனைத்து கல்வி நிறுவனங்கள்',
    'All Campuses': 'அனைத்து வளாகங்கள்',

    // Page Titles & Headers
    'Fleet Job Cards & Maintenance Reports': 'வாகன வேலை அட்டைகள் & பராமரிப்பு அறிக்கைகள்',
    'Fleet Maintenance & Spare Parts Billing': 'வாகன பராமரிப்பு & உதிரிபாகங்கள் பில்லிங்',
    'Maintenance Report by Date': 'தேதி வாரியான பராமரிப்பு அறிக்கை',
    'Fleet Bus Directory & Job Card Logs': 'பேருந்து பட்டியல் & வேலை அட்டை பதிவுகள்',
    'Click any bus row to inspect its full date-wise job card history, print slips, and manage bills': 'தேதி வாரியான வேலை அட்டைகள், பில்கள் பார்க்க பேருந்து வரிசையைக் கிளிக் செய்யவும்',
    'Job Cards History': 'வேலை அட்டைகள் வரலாறு',
    'Billing & Store': 'பில்லிங் & கிடங்கு',
    'Maintenance & Bills': 'பராமரிப்பு & பில்கள்',
    'Total Fleet Spend': 'மொத்த பராமரிப்பு செலவு',
    'Active Buses in Service': 'பயணத்தில் உள்ள பேருந்துகள்',
    'Duty Drivers': 'பணியில் உள்ள ஓட்டுநர்கள்',
    'Fleet Buses': 'வாகன பேருந்துகள்',
    'Service Records': 'சர்வீஸ் பதிவுகள்',
    'Spare Parts Consumed': 'பயன்படுத்தப்பட்ட பாகங்கள்',
    'Labor & Workshop': 'கூலி & பட்டறை கட்டணம்',
    'Buses Serviced / In Maintenance': 'பராமரிப்பில் உள்ள பேருந்துகள்',
    'Maintenance Bill Total': 'பராமரிப்பு பில் மொத்தம்',
    'All-Time Fleet Records': 'அனைத்து வாகன பதிவுகள்',

    // Search Placeholders & Messages
    'Search bus, driver, job card #...': 'பேருந்து, ஓட்டுநர், அட்டை எண் தேடுக...',
    'Search bus, bill no, mechanic...': 'பேருந்து, பில் எண், மெக்கானிக் தேடுக...',
    'No records found.': 'பதிவுகள் எதுவும் இல்லை.',
    'No matching service records found.': 'பொருந்தும் சர்வீஸ் பதிவுகள் எதுவும் இல்லை.',
    'No maintenance jobs logged yet. Click "+ New Service & Bill" to create one!': 'பராமரிப்பு பணிகள் எதுவும் இன்னும் பதிவு செய்யப்படவில்லை. புதியதை உருவாக்க "+ புதிய சர்வீஸ் & பில்" என்பதை அழுத்தவும்!',
    'No buses found matching your search or filters.': 'தேடலுக்குரிய பேருந்துகள் எதுவும் கிடைக்கவில்லை.',
    'Loading data...': 'விவரங்கள் ஏற்றப்படுகின்றன...',
    'Please wait...': 'காத்திருக்கவும்...',

    // Portal / Incharge / Driver / Parent
    'Sign in': 'உள்நுழைக',
    'Login': 'உள்நுழைவு',
    'Username': 'பயனர் பெயர்',
    'Password': 'கடவுச்சொல்',
    'Remember me': 'என்னை நினைவில் கொள்',
    'Student Attendance': 'மாணவர் வருகை',
    'Live Attendance & Boarding': 'நேரலை வருகை & ஏறுதல்',
    'Shift Supervisor': 'ஷிப்ட் மேற்பார்வையாளர்',
    'Exit': 'வெளியேறு',
    'Exit session': 'அமர்வை முடிக்கவும்',
    'Driver Trip Log': 'ஓட்டுநர் பயண பதிவு',
    'TMS Driver Portal': 'TMS ஓட்டுநர் தளம்',
    'Driver Info': 'ஓட்டுநர் விவரங்கள்',
    'Live Bus Tracker': 'பேருந்து நேரலை கண்காணிப்பு',
    'TMS Parent App': 'TMS பெற்றோர் தளம்',
    'Work Details': 'வேலை விவரங்கள்',
    'Driver Sign': 'ஓட்டுநர் கையொப்பம்',
    'Mechanic Sign': 'மெக்கானிக் கையொப்பம்',
    'Manager Sign': 'மேலாளர் கையொப்பம்',
    'Secretary Sign': 'செயலாளர் கையொப்பம்'
  }
};

// Create a fast case-insensitive lookup table for Tamil
const TA_LOWER_MAP = {};
Object.keys(DICTIONARY.ta).forEach(k => {
  TA_LOWER_MAP[k.toLowerCase().trim()] = DICTIONARY.ta[k];
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('tms_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = useCallback((newLang) => {
    const validLang = newLang === 'ta' ? 'ta' : 'en';
    setLangState(validLang);
    try {
      localStorage.setItem('tms_lang', validLang);
      document.documentElement.lang = validLang;
    } catch (e) {
      console.warn('Could not persist language to localStorage', e);
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'ta' : 'en');
  }, [lang, setLang]);

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
      if (lang === 'ta') {
        document.body.classList.add('lang-ta');
      } else {
        document.body.classList.remove('lang-ta');
      }
    } catch {}
  }, [lang]);

  // Translate helper function
  const t = useCallback((key, fallback) => {
    if (!key && key !== 0) return '';
    if (typeof key !== 'string') return key;

    const trimmed = key.trim();
    if (lang === 'en') {
      return DICTIONARY.en[trimmed] || fallback || key;
    }

    // Tamil requested
    if (DICTIONARY.ta[trimmed]) {
      return DICTIONARY.ta[trimmed];
    }

    // Check lowercase match
    const lower = trimmed.toLowerCase();
    if (TA_LOWER_MAP[lower]) {
      return TA_LOWER_MAP[lower];
    }

    return fallback || key;
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    toggleLang,
    t,
    isTamil: lang === 'ta',
    isEnglish: lang === 'en'
  }), [lang, setLang, toggleLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: 'en',
      setLang: () => {},
      toggleLang: () => {},
      t: (k, fb) => fb || k,
      isTamil: false,
      isEnglish: true
    };
  }
  return context;
}
