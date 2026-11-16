import { HubConfig, HubId, User } from './types';

export const SYSTEM_USERS: Record<string, User> = {
  '1001': {
    id: '00000000-0000-0000-0000-000000001001',
    pin: '1001',
    name: 'Hasibul Munim',
    role: 'admin',
    hub: 'ALL',
    phone: '+8801941646278',
  },
  '1002': {
    id: '00000000-0000-0000-0000-000000001002',
    pin: '1002',
    name: 'Co-Owner (Admin)',
    role: 'admin',
    hub: 'ALL',
    phone: '+8801941646279',
  },
  '3001': {
    id: '00000000-0000-0000-0000-000000003001',
    pin: '3001',
    name: 'Caller 1 (Eastern Hub)',
    role: 'telecaller',
    hub: 'CALLER_1',
    phone: '+8801700000002',
  },
  '3002': {
    id: '00000000-0000-0000-0000-000000003002',
    pin: '3002',
    name: 'Caller 2 (Northern Hub)',
    role: 'telecaller',
    hub: 'CALLER_2',
    phone: '+8801700000003',
  },
  '3003': {
    id: '00000000-0000-0000-0000-000000003003',
    pin: '3003',
    name: 'Caller 3 (Southern Hub)',
    role: 'telecaller',
    hub: 'CALLER_3',
    phone: '+8801700000004',
  },
};

export const CALLER_HUBS: Record<HubId, HubConfig> = {
  ALL: {
    id: 'ALL',
    name: '🌐 সমগ্র বাংলাদেশ',
    desc: 'সারাদেশের ৪৯টি জেলা (৮৫৯টি সেন্টার)',
    districts: [],
  },
  CALLER_1: {
    id: 'CALLER_1',
    name: '👩‍💼 কলার ১: ইস্টার্ন হাব',
    callerPin: '3001',
    desc: 'সিলেট, কুমিল্লা, নোয়াখালী, ময়মনসিংহ',
    districts: [
      'Cumilla', 'Feni', 'Noakhali', 'Brahmanbaria', 'Chandpur', 'Laxmipur', 'CoxsBazar',
      'Moulvibazar', 'Habiganj', 'Sunamganj', 'Kishoreganj', 'Mymensingh', 'Jamalpur', 'Sherpur', 'Netrokona'
    ],
  },
  CALLER_2: {
    id: 'CALLER_2',
    name: '👩‍💼 কলার ২: নর্দার্ন হাব',
    callerPin: '3002',
    desc: 'রাজশাহী, বগুড়া, রংপুর, দিনাজপুর',
    districts: [
      'Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Natore', 'Naogaon', 'Joypurhat',
      'Rangpur', 'Dinajpur', 'Thakurgaon', 'Nilphamari', 'Gaibandha', 'Panchagarh', 'Kurigram', 'Lalmonirhat'
    ],
  },
  CALLER_3: {
    id: 'CALLER_3',
    name: '👩‍💼 কলার ৩: সাউদার্ন হাব',
    callerPin: '3003',
    desc: 'খুলনা, বরিশাল, কুষ্টিয়া, যশোর, ফরিদপুর',
    districts: [
      'Khulna', 'Kushtia', 'Jashore', 'Jhenaidah', 'Bagerhat', 'Narail', 'Chuadanga', 'Satkhira', 'Magura',
      'Barishal', 'Madaripur', 'Gopalganj', 'Pirojpur', 'Shariatpur', 'Bhola', 'Faridpur', 'Barguna', 'Patuakhali', 'Tangail'
    ],
  },
};

export const QUICK_NOTE_CHIPS = [
  'হোয়াটসঅ্যাপে বিস্তারিত অফার চেয়েছে',
  'মালিকের সাথে কথা বলতে হবে, স্টাফ রিসিভ করেছেন',
  'কোরিয়া ও ইউকে ব্যাচে ২০+ স্টুডেন্ট আছে',
  'সাইপ্রাস ও রোমানিয়া অফারে আগ্রহী',
  'পরে কল ব্যাক করতে বলেছে',
  'নম্বর ব্যস্ত / রিং বাজে কিন্তু ধরে না',
  'ভুল নম্বর / সেন্টার বন্ধ হয়ে গেছে',
  'ডিরেক্টর সরাসরি মিটিং করতে চান',
];

export const POPULAR_DISTRICTS = [
  'Cumilla', 'Rajshahi', 'Khulna', 'Rangpur', 'Kushtia',
  'Mymensingh', 'Dinajpur', 'Kishoreganj', 'Sirajganj', 'Jashore', 'Moulvibazar', 'Bogura'
];

export const ALL_DISTRICTS = [
  'Bagerhat', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur',
  'Chuadanga', 'CoxsBazar', 'Cumilla', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha',
  'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhenaidah', 'Joypurhat', 'Khulna',
  'Kishoreganj', 'Kurigram', 'Kushtia', 'Lalmonirhat', 'Laxmipur', 'Madaripur', 'Magura',
  'Moulvibazar', 'Mymensingh', 'Naogaon', 'Narail', 'Natore', 'Netrokona', 'Nilphamari',
  'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajshahi', 'Rangpur',
  'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Tangail', 'Thakurgaon'
];

export function generateProposalCopy(centerName: string, directorName?: string, customPdfUrl?: string): string {
  const salutation = directorName ? `শ্রদ্ধেয় ${directorName} স্যার` : 'আসসালামু আলাইকুম স্যার';
  const pdfUrl = customPdfUrl || 'https://crm.keystoneeducations.com/Keystone_IELTS_Center_Partnership_Proposal.pdf';
  return `${salutation},
Keystone Overseas (ধানমন্ডি, ঢাকা) থেকে আমাদের ফোনালাপের প্রেক্ষিতে ${centerName}-এর সাথে প্রাতিষ্ঠানিক পার্টনারশিপের সংক্ষিপ্ত বিবরণ নিচে দেওয়া হলো:

📌 পার্টনার বেনিফিট সামারি:
1. প্রতি স্টুডেন্ট ফাইল অনবোর্ডিংয়ে: ৳২,০০০ অগ্রিম নিশ্চিত কমিশন (২৪ ঘণ্টার মধ্যে ব্যাংক/বিকাশ)।
2. প্রতি সফল ভিসাপ্রাপ্তিতে: ৳১৫,০০০ – ৳২৫,০০০ পোস্ট-ভিসা সাকসেস বোনাস।
3. স্পেশাল করিডোর: সাইপ্রাস (No IELTS, No India Visit) ও রোমানিয়া (Schengen Area, 1-Year Prep Year) সহ সাউথ কোরিয়া ও মালয়েশিয়া।
4. আপনার সেন্টারের স্টুডেন্টদের জন্য বিনামূল্যে ইউরোপিয়ান ক্যারিয়ার সেমিনার ও ফাইল প্রসেসিং সাপোর্ট।

📄 আমাদের অফিশিয়াল পার্টনারশিপ প্রপোজাল ও চুক্তিপত্রটি দেখতে নিচের লিংকে ক্লিক করুন:
${pdfUrl}

🌐 ওয়েবসাইট: https://www.keystoneeducations.com
📍 হেড অফিস: House - 5/4, Sobhanbag, Road No. 16, Dhanmondi, Dhaka 1207.

স্যার, অফারটি পর্যালোচনা করে আপনার সুবিধাজনক সময়ে জানাবেন। ধন্যবাদ!
— হাসিবুল মুনিম
ব্যবস্থাপনা পরিচালক, Keystone Overseas (01941-646278)`;
}

export const CALLING_SCRIPTS = {
  director: {
    title: 'ডিরেক্টর-টু-ডিরেক্টর পার্টনারশিপ স্ক্রিপ্ট (১ম কল)',
    tip: '💡 স্বাভাবিকের চেয়ে ১৫% ধীরে এবং শান্ত আত্মবিশ্বাসের সাথে কথা বলুন।',
    text: `[শুরুর ১৫ সেকেন্ড]
"আসসালামু আলাইকুম স্যার, আমি কি [Center Name]-এর সম্মানিত পরিচালক স্যারের সাথে কথা বলছি?
...স্যার, আমি Keystone Overseas (ধানমন্ডি, ঢাকা) থেকে প্রতিষ্ঠাতা হাসিবুল মুনিম স্যারের পক্ষ থেকে কল করেছি। আপনাদের সেন্টারের সাথে একটা পারস্পরিক লাভজনক পার্টনারশিপের বিষয়ে মাত্র ২ মিনিট সময় চেয়ে নিচ্ছি।"

[মূল প্রস্তাবনা - ৩০ সেকেন্ড]
"স্যার, আপনারা অত্যন্ত সুনামের সাথে IELTS করাচ্ছেন। কিন্তু আমরা জানি ব্যাচের প্রায় ৫০% স্টুডেন্ট কাঙ্ক্ষিত স্কোর না পেয়ে বা স্টাডি গ্যাপের কারণে ড্রপআউট হয়ে যায় এবং ঢাকার বিভিন্ন জায়গায় চলে যায়।
Keystone Overseas সরাসরি ইউরোপিয়ান কান্ট্রি—যেমন সাইপ্রাস (No IELTS, No India Interview) এবং রোমানিয়া (১ বছরের অফিসিয়াল প্রেপ ইয়ার, Schengen) সহ কোরিয়া ও মালয়েশিয়া প্রসেসিং করে।
আমরা আপনাদের সাথে একটা রেভিনিউ-শেয়ার পার্টনারশিপ করতে চাই—যেখানে আপনার রেফার করা প্রতি ফাইলে পাচ্ছেন:
১. স্টুডেন্ট ফাইল অনবোর্ডিংয়েই ৳২,০০০ অগ্রিম কমিশন।
২. ভিসা প্রাপ্তির পর প্রতি স্টুডেন্টে ৳১৫,০০০ থেকে ৳২৫,০০০ পোস্ট-ভিসা বোনাস।"

[সমাপ্তি / হোয়াটসঅ্যাপ পারমিশন]
"স্যার, সম্পূর্ণ প্রসেসিং আমাদের হেড অফিস থেকে হবে। আমি কি আপনার এই অফিশিয়াল হোয়াটসঅ্যাপ নাম্বারে আমাদের ১-পেজের B2B পার্টনার প্রোফাইল ও এগ্রিমেন্ট সামারি পাঠিয়ে দিতে পারি স্যার?"`,
  },
  objection: {
    title: 'আপত্তি হ্যান্ডেলিং (Top 3 Objections)',
    tip: '💡 কখনোই তর্কে জড়াবেন না। "আপনার সন্দেহ ১০০% যৌক্তিক" বলে একমত হয়ে রিফ্রেম করুন।',
    text: `১. "আমরা শুধু IELTS করাই, স্টাডি অ্যাব্রোড জড়াতে চাই না।"
উত্তর: "অত্যন্ত সঠিক সিদ্ধান্ত স্যার। আমরাও চাই না আপনারা প্রসেসিংয়ে জড়ান। প্রসেসিংয়ের পুরো দায়িত্ব আমাদের। যে স্টুডেন্টরা ড্রপআউট হয়ে যাচ্ছিল, তাদেরকে একটি জেনুইন আন্তর্জাতিক সমাধান দিয়ে আপনার ব্র্যান্ড ভ্যালু ব্যবহার করে প্রতি মাসে অতিরিক্ত ৫০,০০০ থেকে ১ লাখ টাকা আয় নিশ্চিত হচ্ছে।"

২. "ঢাকার অনেক এজেন্সি তো বলে টাকা দিবে, পরে আর ফোন ধরে না।"
উত্তর: "স্যার, আপনার এই সন্দেহ ১০০% যৌক্তিক। বাজারে অনেকে এই ধরণের অসততা করে বলেই আমরা পলিসি বদলেছি। Keystone Overseas একমাত্র প্রতিষ্ঠান যারা স্টুডেন্ট রেজিস্ট্রেশন করার সাথে সাথে—ভিসা হওয়ার আগেই—আপনার একাউন্টে ৳২,০০০ আপফ্রন্ট ট্রান্সফার করে দেয়।"

৩. "আমাদের স্টুডেন্টরা সবাই ইউকে, কানাডা বা ইউএসএ যেতে চায়।"
উত্তর: "যাদের ভালো স্কোর ও ব্যাংক ফান্ড আছে, তাদের জন্য ইউকে/কানাডা প্রোগ্রাম আমাদেরও আছে। কিন্তু যাদের স্টাডি গ্যাপ বেশি বা বারবার পরীক্ষা দিয়েও স্কোর আসছে না, তাদের জন্য সাইপ্রাস ও রোমানিয়া ৯৫%+ নিশ্চিত বিকল্প।"`,
  },
  gatekeeper: {
    title: 'রিসেপশনিস্ট / স্টাফ রিসিভ করলে কথা বলার টেকনিক',
    tip: '💡 সম্মানজনক কিন্তু কর্পোরেট দৃঢ়তার সাথে ডিরেক্টরের সরাসরি নাম্বার চেয়ে নিন।',
    text: `"শুভ সকাল। আমি Keystone Overseas ঢাকা হেড অফিস থেকে হাসিবুল মুনিম স্যারের পক্ষ থেকে সরাসরি ডিরেক্টর স্যারের সাথে ইনস্টিটিউশনাল পার্টনারশিপ নিয়ে কথা বলতে চাচ্ছিলাম। স্যার কি এই মুহূর্তে অফিসে আছেন?

...যদি বলে 'মেইলে পাঠান':
"আমি বুঝতে পারছি, তবে জেনারেল ইনফো মেইলে শত শত স্টুডেন্ট ইনকোয়ারি আসে। ডিরেক্টর স্যারের ব্যক্তিগত হোয়াটসঅ্যাপ নাম্বারটা কি একটু দেওয়া যাবে? আমি সরাসরি ওনার কাছে আমাদের ১-পেজের অফার সামারিটি পাঠিয়ে রাখছি। ধন্যবাদ!"`,
  },
};
