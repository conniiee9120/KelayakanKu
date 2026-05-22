// Simple BM/EN copy used by the global language switcher.
export type Language = "en" | "bm";

export const translations = {
  en: {
    nav: {
      brand: "KelayakanKu",
      subtitle: "Check Your Financial Support Eligibility with AI",
      howItWorks: "How It Works",
      whoItHelps: "Who It Helps",
      faq: "FAQ",
      check: "Check My Eligibility"
    },
    buttons: {
      learnHow: "Learn How It Works",
      readFaq: "Read full FAQ",
      next: "Next",
      back: "Back",
      review: "Review My Details",
      edit: "Edit Details",
      find: "Find My Matches",
      start: "Start Eligibility Form",
      viewProgram: "View Program Details",
      official: "Open Official Source",
      backResults: "Back to Results"
    },
    landing: {
      title: "Check Your Financial Support Eligibility with AI",
      tagline: "Tuntut hak anda. Jangan biar bantuan terlepas.",
      subtitle: "Answer a few simple household-focused questions. KelayakanKu gives you an eligibility snapshot, required documents, trusted official sources, and next steps.",
      trust: "No application is submitted. No approval is guaranteed.",
      journeyTitle: "Your Eligibility Journey",
      journeySubtitle: "Auto preview of what the user will do",
      howTitle: "Understand your next step in minutes",
      howDesc: "KelayakanKu keeps the B40 household journey short, guided, and easy to understand.",
      whoTitle: "Built for B40 households with real household responsibilities",
      whoDesc: "Friendly guidance for households that may not know where to start or what documents are needed.",
      faqTitle: "Questions before you begin"
    },
    common: {
      important: "Important",
      disclaimer: "KelayakanKu does not approve applications, submit forms, or guarantee eligibility. Final eligibility depends on the official agency.",
      guidance: "KelayakanKu provides guidance only. It does not approve, reject, or submit applications."
    },
    form: {
      eyebrow: "Eligibility check",
      title: "Check possible B40 household support in a few minutes",
      desc: "This MVP focuses on B40 household guidance. It asks enough to guide you, without feeling like an official application.",
      checksTitle: "What KelayakanKu checks",
      privacyTitle: "Privacy and guidance",
      privacyDesc: "KelayakanKu only uses your answers to generate possible matches. It does not submit applications for you.",
      formTitle: "Answer a few simple questions",
      formDesc: "You do not need exact answers. Choose the option that best describes your household situation.",
      fields: {
        citizen: "Are you a Malaysian citizen?",
        ageGroup: "What is your age group?",
        state: "Which state do you live in?",
        household: "What best describes your household?",
        dependents: "How many people depend on your household income?",
        work: "What is your current work situation?",
        income: "What is your estimated monthly household income?",
        stability: "Is your income fixed every month?",
        contribution: "Do you currently contribute to EPF/KWSP or SOCSO/PERKESO?",
        support: "What kind of support do you want to check?",
        situations: "Do any of these situations apply to you or your household?",
        situationsHelp: "Optional and gentle: choose what you are comfortable sharing.",
        extra: "Optional: Anything else KelayakanKu should know?"
      }
    },
    review: {
      eyebrow: "Review details",
      title: "Confirm your details",
      desc: "Review your information before KelayakanKu prepares your eligibility snapshot.",
      emptyTitle: "No saved answers yet",
      emptyDesc: "Start the eligibility form so KelayakanKu can prepare a mock snapshot.",
      summary: "Profile summary",
      helper: "You can go back and edit your answers anytime.",
      ready: "Ready to find matches?",
      readyDesc: "KelayakanKu will simulate matching against curated eligibility rules and source placeholders.",
      notProvided: "Not provided"
    },
    processing: {
      title: "Preparing your eligibility snapshot",
      desc: "KelayakanKu is checking your profile against curated eligibility rules and trusted official sources.",
      note: "This usually takes a few seconds."
    },
    results: {
      eyebrow: "Eligibility Snapshot",
      title: "Your Eligibility Snapshot",
      summary: "Based on your B40 household profile, KelayakanKu found support programs that are most relevant to you. Please verify details with the official agency.",
      recommended: "Recommended for You",
      recommendedDesc: "High-match programs with strong relevance based on your submitted profile.",
      needInfo: "Need More Info",
      needInfoDesc: "Relevant programs that require private, sensitive, or official information KelayakanKu should not collect in this MVP.",
      checklistReady: "Checklist ready",
      documents: "Documents preview",
      source: "Official source placeholder",
      whatCheck: "What to check",
      officialPortal: "Check Official Portal",
      match: "Match"
    },
    checklist: {
      eyebrow: "Program details",
      title: "Program Details",
      match: "Match strength",
      actions: "Actions",
      why: "Why this may match your profile",
      confirm: "Information that may still need confirmation",
      source: "Trusted official source",
      sourceLabel: "Source:",
      portal: "Official portal",
      sourceNote: "External source link will be connected later.",
      documents: "Required documents checklist",
      next: "Next steps"
    },
    faq: {
      eyebrow: "FAQ",
      title: "Frequently Asked Questions",
      cta: "Ready to check your eligibility?"
    },
    footer: {
      desc: "Check B40 household financial support eligibility with clear guidance, mock results, and practical next steps.",
      explore: "Explore",
      important: "Important",
      home: "Home",
      eligibility: "Eligibility Check",
      snapshot: "Sample Snapshot"
    }
  },
  bm: {
    nav: {
      brand: "KelayakanKu",
      subtitle: "Semak Kelayakan Sokongan Kewangan Anda dengan AI",
      howItWorks: "Cara Ia Berfungsi",
      whoItHelps: "Untuk Siapa",
      faq: "Soalan Lazim",
      check: "Semak Kelayakan"
    },
    buttons: {
      learnHow: "Ketahui Cara Ia Berfungsi",
      readFaq: "Baca Soalan Lazim",
      next: "Seterusnya",
      back: "Kembali",
      review: "Semak Butiran Saya",
      edit: "Edit Butiran",
      find: "Cari Padanan Saya",
      start: "Mula Borang Kelayakan",
      viewProgram: "Lihat Butiran Program",
      official: "Buka Sumber Rasmi",
      backResults: "Kembali ke Keputusan"
    },
    landing: {
      title: "Semak Kelayakan Sokongan Kewangan Anda dengan AI",
      tagline: "Tuntut hak anda. Jangan biar bantuan terlepas.",
      subtitle: "Jawab beberapa soalan mudah berfokuskan isi rumah. KelayakanKu memberi ringkasan kelayakan, dokumen diperlukan, sumber rasmi dipercayai, dan langkah seterusnya.",
      trust: "Tiada permohonan dihantar. Kelulusan tidak dijamin.",
      journeyTitle: "Perjalanan Kelayakan Anda",
      journeySubtitle: "Pratonton automatik perkara yang pengguna akan lakukan",
      howTitle: "Fahami langkah seterusnya dalam beberapa minit",
      howDesc: "KelayakanKu menjadikan perjalanan isi rumah B40 ringkas, berpandu, dan mudah difahami.",
      whoTitle: "Dibina untuk isi rumah B40 dengan tanggungjawab isi rumah sebenar",
      whoDesc: "Panduan mesra untuk isi rumah yang mungkin tidak tahu di mana perlu bermula atau dokumen apa yang diperlukan.",
      faqTitle: "Soalan sebelum anda bermula"
    },
    common: {
      important: "Penting",
      disclaimer: "KelayakanKu tidak meluluskan permohonan, menghantar borang, atau menjamin kelayakan. Kelayakan akhir bergantung kepada agensi rasmi.",
      guidance: "KelayakanKu hanya memberi panduan. Ia tidak meluluskan, menolak, atau menghantar permohonan."
    },
    form: {
      eyebrow: "Semakan kelayakan",
      title: "Semak sokongan isi rumah B40 dalam beberapa minit",
      desc: "MVP ini berfokus pada panduan isi rumah B40. Ia bertanya maklumat yang cukup untuk membantu, tanpa rasa seperti permohonan rasmi.",
      checksTitle: "Apa yang KelayakanKu semak",
      privacyTitle: "Privasi dan panduan",
      privacyDesc: "KelayakanKu hanya menggunakan jawapan anda untuk menjana padanan yang mungkin. Ia tidak menghantar permohonan untuk anda.",
      formTitle: "Jawab beberapa soalan mudah",
      formDesc: "Anda tidak perlu jawapan yang tepat. Pilih pilihan yang paling menggambarkan situasi isi rumah anda.",
      fields: {
        citizen: "Adakah anda warganegara Malaysia?",
        ageGroup: "Apakah kumpulan umur anda?",
        state: "Di negeri manakah anda tinggal?",
        household: "Apakah yang paling menggambarkan isi rumah anda?",
        dependents: "Berapa ramai bergantung pada pendapatan isi rumah anda?",
        work: "Apakah situasi kerja anda sekarang?",
        income: "Berapakah anggaran pendapatan bulanan isi rumah anda?",
        stability: "Adakah pendapatan anda tetap setiap bulan?",
        contribution: "Adakah anda mencarum kepada EPF/KWSP atau SOCSO/PERKESO?",
        support: "Apakah jenis sokongan yang ingin anda semak?",
        situations: "Adakah situasi ini berkaitan dengan anda atau isi rumah anda?",
        situationsHelp: "Pilihan ini lembut dan tidak wajib: pilih perkara yang anda selesa kongsikan.",
        extra: "Pilihan: Ada perkara lain yang KelayakanKu perlu tahu?"
      }
    },
    review: {
      eyebrow: "Semak butiran",
      title: "Sahkan butiran anda",
      desc: "Semak maklumat anda sebelum KelayakanKu menyediakan ringkasan kelayakan.",
      emptyTitle: "Belum ada jawapan disimpan",
      emptyDesc: "Mulakan borang kelayakan supaya KelayakanKu boleh menyediakan ringkasan contoh.",
      summary: "Ringkasan profil",
      helper: "Anda boleh kembali dan mengedit jawapan pada bila-bila masa.",
      ready: "Bersedia untuk cari padanan?",
      readyDesc: "KelayakanKu akan mensimulasikan padanan berdasarkan peraturan kelayakan terpilih dan sumber contoh.",
      notProvided: "Tidak diberikan"
    },
    processing: {
      title: "Menyediakan ringkasan kelayakan anda",
      desc: "KelayakanKu sedang menyemak profil anda berdasarkan peraturan kelayakan terpilih dan sumber rasmi dipercayai.",
      note: "Ini biasanya mengambil beberapa saat."
    },
    results: {
      eyebrow: "Ringkasan Kelayakan",
      title: "Ringkasan Kelayakan Anda",
      summary: "Berdasarkan profil isi rumah B40 anda, KelayakanKu menemui program sokongan yang paling relevan. Sila sahkan butiran dengan agensi rasmi.",
      recommended: "Disyorkan untuk Anda",
      recommendedDesc: "Program padanan tinggi yang sangat relevan berdasarkan profil yang dihantar.",
      needInfo: "Perlu Maklumat Lanjut",
      needInfoDesc: "Program yang mungkin relevan tetapi memerlukan maklumat peribadi, sensitif, atau rasmi yang tidak patut dikumpul dalam MVP ini.",
      checklistReady: "Senarai semak sedia",
      documents: "Pratonton dokumen",
      source: "Sumber rasmi contoh",
      whatCheck: "Apa yang perlu disemak",
      officialPortal: "Semak Portal Rasmi",
      match: "Padanan"
    },
    checklist: {
      eyebrow: "Butiran program",
      title: "Butiran Program",
      match: "Kekuatan padanan",
      actions: "Tindakan",
      why: "Mengapa ini mungkin sepadan dengan profil anda",
      confirm: "Maklumat yang masih perlu disahkan",
      source: "Sumber rasmi dipercayai",
      sourceLabel: "Sumber:",
      portal: "Portal rasmi",
      sourceNote: "Pautan sumber luar akan disambungkan kemudian.",
      documents: "Senarai semak dokumen diperlukan",
      next: "Langkah seterusnya"
    },
    faq: {
      eyebrow: "Soalan Lazim",
      title: "Soalan Lazim",
      cta: "Bersedia untuk semak kelayakan anda?"
    },
    footer: {
      desc: "Semak kelayakan sokongan kewangan isi rumah B40 dengan panduan jelas, keputusan contoh, dan langkah praktikal.",
      explore: "Teroka",
      important: "Penting",
      home: "Utama",
      eligibility: "Semakan Kelayakan",
      snapshot: "Ringkasan Contoh"
    }
  }
};
