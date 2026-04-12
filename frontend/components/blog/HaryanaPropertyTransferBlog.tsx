'use client';

import React, { useState, useEffect } from "react";

/* ── colour tokens matching the site's tailwind primary palette ── */
const C = {
  primary:     "#2563eb",  // primary-600
  primaryDark: "#1e3a8a",  // primary-900
  primaryMid:  "#1d4ed8",  // primary-700
  primaryBg:   "#eff6ff",  // primary-50
  primaryRing: "#bfdbfe",  // primary-200
  accent:      "#f97316",  // orange-500
  accentWarm:  "#f59e0b",  // amber-500
  text:        "#0f172a",  // slate-900
  muted:       "#475569",  // slate-600
  border:      "#e2e8f0",  // slate-200
  surface:     "#f8fafc",  // slate-50
  surface2:    "#eff6ff",  // primary-50
  white:       "#ffffff",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .blog-root { box-sizing: border-box; font-family: 'Outfit', sans-serif; background: ${C.white}; color: ${C.text}; min-height: 100vh; }
  .blog-root * { box-sizing: border-box; }

  /* Progress bar */
  .br-progress { position: fixed; top: 0; left: 0; width: 100%; height: 3px; z-index: 1000; background: transparent; }
  .br-progress-bar { height: 100%; background: linear-gradient(90deg, ${C.primary}, ${C.accent}); transition: width 0.1s ease-out; }

  /* Lang banner */
  .br-lang-banner {
    background: ${C.primaryDark};
    padding: 8px 24px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
  }
  .br-lang-label { color: rgba(255,255,255,0.55); font-size: 12px; font-weight: 500; }
  .br-lang-toggle { display: flex; border-radius: 100px; overflow: hidden; border: 1.5px solid rgba(255,255,255,0.2); }
  .br-lang-btn {
    padding: 5px 16px;
    font-size: 12px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    border: none;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    background: transparent;
    color: rgba(255,255,255,0.55);
  }
  .br-lang-btn.active { background: ${C.primary}; color: #fff; }
  .br-lang-btn:not(.active):hover { background: rgba(255,255,255,0.08); color: #fff; }

  /* Hero */
  .br-hero { position: relative; height: 460px; overflow: hidden; }
  @media(max-width:640px){ .br-hero { height: 360px; } }
  .br-hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .br-hero-scrim {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(30,58,138,0.93) 0%, rgba(30,58,138,0.5) 55%, transparent 100%);
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 44px 40px;
  }
  @media(max-width:640px){ .br-hero-scrim { padding: 28px 20px; } }
  .br-hero-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: ${C.accent};
    color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; padding: 5px 14px; border-radius: 100px;
    margin-bottom: 14px; width: fit-content;
  }
  .br-hero h1 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(22px, 4vw, 38px);
    color: #fff; line-height: 1.2; max-width: 700px; margin-bottom: 18px;
  }
  .br-meta-row { display: flex; flex-wrap: wrap; gap: 10px; }
  .br-meta-pill {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 500;
    padding: 4px 12px; border-radius: 100px;
    display: flex; align-items: center; gap: 5px;
  }
  .br-meta-dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.accentWarm}; flex-shrink: 0; }

  /* Layout */
  .br-body { max-width: 1080px; margin: 0 auto; padding: 40px 24px 80px; display: grid; grid-template-columns: 1fr 252px; gap: 44px; align-items: start; }
  @media(max-width:768px){ .br-body { grid-template-columns: 1fr; } .br-sidebar { order: -1; } }

  /* Intro box */
  .br-intro {
    border-left: 4px solid ${C.primary};
    background: ${C.primaryBg};
    padding: 18px 22px;
    border-radius: 0 12px 12px 0;
    font-size: 15px; line-height: 1.85; color: ${C.muted};
    margin-bottom: 32px;
  }
  .br-intro strong { color: ${C.primary}; font-weight: 700; }

  /* Quick actions */
  .br-quick-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 36px; }
  .br-quick-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 8px 16px;
    border: 1.5px solid ${C.primary};
    border-radius: 100px;
    background: #fff; color: ${C.primary};
    font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.2s;
  }
  .br-quick-btn:hover { background: ${C.primary}; color: #fff; }

  /* Section */
  .br-section { margin-bottom: 44px; scroll-margin-top: 40px; }
  .br-section-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 18px; padding-bottom: 14px;
    border-bottom: 2px solid ${C.primaryBg};
  }
  .br-sec-num {
    width: 34px; height: 34px; border-radius: 50%;
    background: ${C.primary}; color: #fff;
    font-size: 13px; font-weight: 800;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .br-section h2 { font-family: 'DM Serif Display', serif; font-size: 21px; color: ${C.primaryDark}; }
  .br-section p { font-size: 15px; line-height: 1.85; color: ${C.muted}; margin-bottom: 14px; }

  /* Section image */
  .br-img-wrap { width: 100%; height: 210px; overflow: hidden; border-radius: 12px; margin-bottom: 18px; border: 1px solid ${C.border}; }
  .br-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* Route cards */
  .br-route-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
  @media(max-width:500px){ .br-route-grid { grid-template-columns: 1fr; } }
  .br-route-card {
    background: ${C.surface};
    border: 1.5px solid ${C.border};
    border-radius: 14px; padding: 18px;
    cursor: default; transition: border-color 0.2s, transform 0.15s;
  }
  .br-route-card:hover { border-color: ${C.primary}; transform: translateY(-2px); }
  .br-route-tag { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: ${C.accent}; margin-bottom: 5px; }
  .br-route-title { font-size: 15px; font-weight: 700; color: ${C.primaryDark}; margin-bottom: 7px; }
  .br-route-desc { font-size: 13px; color: ${C.muted}; line-height: 1.6; }

  /* Accordion */
  .br-accordion { border: 1px solid ${C.border}; border-radius: 14px; overflow: hidden; margin: 18px 0; }
  .br-acc-item { border-bottom: 1px solid ${C.border}; }
  .br-acc-item:last-child { border-bottom: none; }
  .br-acc-btn {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 15px 20px; background: #fff; border: none; cursor: pointer;
    font-family: 'Outfit', sans-serif; transition: background 0.15s; text-align: left; gap: 10px;
  }
  .br-acc-btn:hover { background: ${C.primaryBg}; }
  .br-acc-left { display: flex; align-items: center; gap: 11px; }
  .br-acc-circle {
    width: 28px; height: 28px; border-radius: 50%;
    background: ${C.primaryBg}; border: 1.5px solid ${C.primary};
    color: ${C.primary}; font-size: 12px; font-weight: 800;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .br-acc-title { font-size: 14px; font-weight: 700; color: ${C.text}; }
  .br-acc-arrow { font-size: 18px; color: ${C.muted}; transition: transform 0.25s; flex-shrink: 0; }
  .br-acc-arrow.open { transform: rotate(180deg); }
  .br-acc-body { overflow: hidden; transition: max-height 0.35s ease; background: ${C.surface}; max-height: 0; }
  .br-acc-body.open { max-height: 400px; }
  .br-acc-inner { padding: 16px 20px 16px 59px; font-size: 14px; line-height: 1.85; color: ${C.muted}; }
  .br-faq-inner { padding: 16px 20px; font-size: 14px; line-height: 1.85; color: ${C.muted}; background: #fff; }

  /* Doc table */
  .br-table-wrap { overflow-x: auto; margin: 18px 0; border-radius: 12px; border: 1px solid ${C.border}; }
  .br-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .br-table th {
    background: ${C.primary}; color: #fff;
    font-weight: 700; padding: 11px 16px; text-align: left;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;
  }
  .br-table td { padding: 11px 16px; border-bottom: 1px solid ${C.border}; color: ${C.muted}; vertical-align: top; }
  .br-table tr:last-child td { border-bottom: none; }
  .br-table tr:nth-child(even) td { background: ${C.surface}; }
  .br-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; }
  .br-badge-req { background: #fee2e2; color: #991b1b; }
  .br-badge-opt { background: #d1fae5; color: #065f46; }

  /* Warn box */
  .br-warn {
    display: flex; gap: 11px; align-items: flex-start;
    background: #fffbeb; border: 1px solid ${C.accentWarm};
    border-radius: 12px; padding: 13px 16px; margin-bottom: 10px;
    font-size: 14px; line-height: 1.75; color: #78350f;
  }
  .br-warn-icon { font-size: 15px; flex-shrink: 0; margin-top: 2px; }

  /* Portal cards */
  .br-portal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin-top: 18px; }
  @media(max-width:500px){ .br-portal-grid { grid-template-columns: 1fr; } }
  .br-portal-card {
    background: #fff; border: 1.5px solid ${C.border};
    border-radius: 12px; padding: 15px; cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s; text-decoration: none; display: block;
  }
  .br-portal-card:hover { border-color: ${C.primary}; box-shadow: 0 4px 16px rgba(37,99,235,0.1); }
  .br-portal-tag { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: ${C.accent}; margin-bottom: 4px; }
  .br-portal-name { font-size: 14px; font-weight: 700; color: ${C.primary}; margin-bottom: 3px; }
  .br-portal-desc { font-size: 12px; color: ${C.muted}; line-height: 1.5; }

  /* CTA button */
  .br-cta {
    width: 100%; margin-top: 28px;
    padding: 15px;
    background: ${C.primary}; color: #fff;
    font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;
    border: none; border-radius: 14px; cursor: pointer;
    transition: background 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .br-cta:hover { background: ${C.primaryMid}; }

  /* Sidebar TOC */
  .br-toc {
    background: ${C.primaryBg}; border: 1px solid ${C.primaryRing};
    border-radius: 16px; padding: 20px; position: sticky; top: 24px;
  }
  .br-toc-heading {
    font-family: 'DM Serif Display', serif; font-size: 16px; color: ${C.primaryDark};
    margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid ${C.primaryRing};
  }
  .br-toc-btn {
    display: flex; align-items: flex-start; gap: 9px;
    padding: 7px 0; background: none; border: none;
    font-family: 'Outfit', sans-serif; font-size: 13px; color: ${C.muted};
    cursor: pointer; text-align: left; width: 100%; transition: color 0.15s; line-height: 1.4;
  }
  .br-toc-btn:hover, .br-toc-btn.active { color: ${C.primary}; }
  .br-toc-btn.active { font-weight: 700; }
  .br-toc-num { font-size: 11px; font-weight: 800; color: ${C.accent}; min-width: 18px; margin-top: 1px; }
  .br-share-label {
    font-size: 11px; font-weight: 700; color: ${C.muted};
    text-transform: uppercase; letter-spacing: 0.8px; margin: 18px 0 8px;
  }
  .br-share-row { display: flex; flex-direction: column; gap: 7px; }
  .br-share-btn {
    padding: 8px 12px; border: 1px solid ${C.border};
    border-radius: 10px; background: #fff;
    font-size: 12px; font-weight: 600; font-family: 'Outfit', sans-serif;
    color: ${C.primary}; cursor: pointer; transition: background 0.15s; text-align: left;
  }
  .br-share-btn:hover { background: ${C.primaryBg}; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

/* ── Content ─────────────────────────────────────────────────────────────── */
const EN = {
  heroTitle: "How to Transfer Property After Death in Haryana — Legal Process",
  chip: "Property Law · Haryana",
  metas: ["April 2025", "10 min read", "Legal Guide"],
  intro: (<>When a property owner passes away, their property does not transfer automatically. In Haryana, the legal process to transfer inherited property involves multiple steps — from obtaining a <strong>Death Certificate</strong> to finally updating the <strong>Jamabandi</strong> (land records). This guide explains every step clearly.</>),
  s1Title: "Understanding the two routes",
  s1Body: "In Haryana, property can be transferred after death through two primary routes, depending on whether the deceased left a valid will or not.",
  routes: [
    { tag: "Route 1", title: "Testamentary Succession", desc: "The deceased left a registered will. Property is distributed per its terms through Probate Court." },
    { tag: "Route 2", title: "Intestate Succession", desc: "No will exists. Property is divided according to personal law — Hindu Succession Act, Muslim Personal Law, etc." },
  ],
  s1Body2: "Both routes eventually require Mutation (Intaqal) — the official update of revenue records to reflect the new owner's name in Haryana's land registry.",
  s2Title: "Step-by-step legal process",
  steps: [
    { num: "1", title: "Obtain Death Certificate", body: "Apply at the Municipal Corporation / Gram Panchayat within 21 days of death. Use Antyodaya Saral portal online. A hospital discharge slip or doctor's certificate is needed. This document is mandatory for all subsequent steps." },
    { num: "2", title: "Gather succession documents", body: "For a will — get it probated in Civil Court. For intestate — obtain a Legal Heir Certificate (Varisan Praman Patra) from the Tehsildar or SDM office in Haryana. A Succession Certificate from Civil Court may also be required for financial assets." },
    { num: "3", title: "Apply for Mutation (Intaqal)", body: "File at the local Patwari office (rural) or Urban Local Body (city). For instance, if the property is located in Palwal, the mutation request must be submitted to the Municipal Council Palwal or the local Tehsildar office. After verification, Jamabandi is updated with the new owner's name." },
    { num: "4", title: "Pay stamp duty & register", body: "Mutation among Class-I legal heirs is generally exempt from stamp duty in Haryana. However, subsequent transfers via Gift Deed or Relinquishment Deed attract stamp duty (though blood relation transfers have concessions). Registration fees for mutation only are nominal." },
    { num: "5", title: "Update utility & tax records", body: "After mutation, update municipal tax records (Property ID), electricity board, water supply, and bank records. This ensures property tax receipts are issued in the heir's name going forward." },
  ],
  s3Title: "Documents required",
  docs: [
    ["Death Certificate", "Proof of owner's death", "req"],
    ["Legal Heir Certificate", "Establishes who the heirs are", "req"],
    ["Original Sale Deed / Title Deed", "Proof of deceased's ownership", "req"],
    ["Jamabandi Nakal (land record copy)", "Current revenue record", "req"],
    ["Aadhaar & PAN of all heirs", "Identity verification", "req"],
    ["Registered Will", "If will exists — for probate", "opt"],
    ["NOC / Relinquishment Deed", "When one heir takes full property", "opt"],
    ["Succession Certificate (court)", "For complex / disputed estates", "opt"],
  ],
  s4Title: "Important notices & pitfalls",
  warns: [
    { icon: "⚠️", text: (<><strong>Time limit:</strong> Haryana Revenue Code requires mutation to be filed within 3 months of death. Delays can lead to disputes, penalties, or complications in future sales.</>) },
    { icon: "⚠️", text: (<><strong>Heir disputes:</strong> If heirs disagree, the matter goes to Revenue Court. A Civil Court suit may follow if unresolved.</>) },
    { icon: "⚠️", text: (<><strong>Agricultural land:</strong> Transfer of agricultural land is subject to the Haryana Ceiling on Land Holdings Act. Non-agriculturists may face restrictions on inheriting agricultural land.</>) },
  ],
  s5Title: "Frequently Asked Questions",
  faqs: [
    { q: "Do I need to be physically present for Mutation?", a: "Yes, typically all legal heirs must present themselves before the Tehsildar/Revenue Officer to give their statement. If someone cannot attend, they must issue a registered Special Power of Attorney (SPOA)." },
    { q: "How long does the entire process take?", a: "If all documents are in order and there are no objections from other heirs, obtaining the Legal Heir certificate and finalizing the mutation usually takes between 30 to 45 days in Haryana." },
    { q: "Is a Relinquishment Deed mandatory?", a: "No. It is only required if one or more legal heirs wish to give up their share of the inherited property in favor of another heir (e.g., sisters giving up their share to their brother or mother). It must be registered to be valid." },
  ],
  s6Title: "Useful Haryana government portals",
  portals: [
    { tag: "Portal 1", name: "Jamabandi.nic.in", desc: "View & apply for land records, Nakal, mutation status online.", url: "https://jamabandi.nic.in" },
    { tag: "Portal 2", name: "Saral Haryana", desc: "Apply for Death Certificate, Legal Heir Certificate & 500+ services.", url: "https://saralharyana.gov.in" },
    { tag: "Portal 3", name: "ULB Haryana", desc: "Urban property tax mutation & municipal services for city properties.", url: "https://ulbhryndc.org" },
    { tag: "Help", name: "Track mutation ↗", desc: "Ask MyPalwal to guide you through tracking your mutation application.", url: null },
  ],
  toc: ["Two routes to transfer", "Step-by-step process", "Documents required", "Pitfalls to avoid", "FAQs", "Govt portals"],
  ctaText: "Ask a personalised legal question about your property ↗",
  quickBtns: ["📋 Summarise this", "📄 Documents needed", "⏳ Timeline"],
};

const HI = {
  heroTitle: "हरियाणा में मृत्यु के बाद संपत्ति कैसे स्थानांतरित करें — कानूनी प्रक्रिया",
  chip: "संपत्ति कानून · हरियाणा",
  metas: ["अप्रैल 2025", "10 मिनट पढ़ें", "कानूनी मार्गदर्शिका"],
  intro: (<>जब किसी संपत्ति के मालिक का निधन होता है, तो संपत्ति स्वतः स्थानांतरित नहीं होती। हरियाणा में विरासत में मिली संपत्ति को स्थानांतरित करने की कानूनी प्रक्रिया में कई चरण शामिल हैं — <strong>मृत्यु प्रमाण पत्र</strong> प्राप्त करने से लेकर <strong>जमाबंदी</strong> (भूमि अभिलेख) को अपडेट करने तक। यह मार्गदर्शिका हर चरण को स्पष्ट रूप से समझाती है।</>),
  s1Title: "दो मार्गों को समझना",
  s1Body: "हरियाणा में, मृत्यु के बाद संपत्ति मुख्य रूप से दो मार्गों से स्थानांतरित की जा सकती है — यह इस बात पर निर्भर करता है कि मृतक ने वैध वसीयत छोड़ी है या नहीं।",
  routes: [
    { tag: "मार्ग 1", title: "वसीयती उत्तराधिकार", desc: "मृतक ने एक पंजीकृत वसीयत छोड़ी है। संपत्ति प्रोबेट कोर्ट के माध्यम से वसीयत की शर्तों के अनुसार वितरित की जाती है।" },
    { tag: "मार्ग 2", title: "निर्वसीयती उत्तराधिकार", desc: "कोई वसीयत नहीं है। संपत्ति व्यक्तिगत कानून के अनुसार विभाजित होती है — हिंदू उत्तराधिकार अधिनियम, मुस्लिम पर्सनल लॉ आदि।" },
  ],
  s1Body2: "दोनों मार्गों के लिए अंततः म्यूटेशन (इंतकाल) जरूरी है — हरियाणा के भूमि रजिस्ट्री में नए मालिक का नाम दर्ज करना।",
  s2Title: "चरण-दर-चरण कानूनी प्रक्रिया",
  steps: [
    { num: "1", title: "मृत्यु प्रमाण पत्र प्राप्त करें", body: "मृत्यु के 21 दिनों के भीतर नगर निगम / ग्राम पंचायत में आवेदन करें। अंत्योदय सरल पोर्टल का उपयोग ऑनलाइन करें। यह दस्तावेज सभी अगले कानूनी चरणों के लिए अनिवार्य है।" },
    { num: "2", title: "उत्तराधिकार दस्तावेज एकत्रित करें", body: "वसीयत के लिए — इसे सिविल कोर्ट में प्रोबेट करवाएं। निर्वसीयती के लिए — तहसीलदार या SDM कार्यालय से कानूनी वारिस प्रमाण पत्र प्राप्त करें।" },
    { num: "3", title: "म्यूटेशन (इंतकाल) के लिए आवेदन करें", body: "स्थानीय पटवारी कार्यालय (ग्रामीण) या अर्बन लोकल बॉडी (शहर) में आवेदन दें। सत्यापन के बाद जमाबंदी में नए मालिक का नाम दर्ज होता है।" },
    { num: "4", title: "स्टांप शुल्क और पंजीकरण", body: "हरियाणा में प्रथम श्रेणी के कानूनी वारिसों के बीच म्यूटेशन आमतौर पर स्टांप शुल्क से मुक्त है। केवल म्यूटेशन के लिए पंजीकरण शुल्क नाममात्र है।" },
    { num: "5", title: "उपयोगिता और कर रिकॉर्ड अपडेट करें", body: "म्यूटेशन पूरा होने के बाद, नगरपालिका कर रिकॉर्ड, बिजली बोर्ड, जल आपूर्ति और बैंक रिकॉर्ड अपडेट करें।" },
  ],
  s3Title: "आवश्यक दस्तावेज",
  docs: [
    ["मृत्यु प्रमाण पत्र", "मालिक की मृत्यु का प्रमाण", "req"],
    ["कानूनी वारिस प्रमाण पत्र", "वारिस कौन हैं यह स्थापित करता है", "req"],
    ["मूल बिक्री विलेख / टाइटल डीड", "मृतक के स्वामित्व का प्रमाण", "req"],
    ["जमाबंदी नकल (भूमि रिकॉर्ड)", "वर्तमान राजस्व रिकॉर्ड", "req"],
    ["सभी वारिसों का आधार और पैन", "पहचान सत्यापन", "req"],
    ["पंजीकृत वसीयत", "यदि वसीयत है — प्रोबेट के लिए", "opt"],
    ["NOC / त्याग पत्र", "जब एक वारिस पूरी संपत्ति लेता है", "opt"],
    ["उत्तराधिकार प्रमाण पत्र (कोर्ट)", "जटिल या विवादित संपदा के लिए", "opt"],
  ],
  s4Title: "महत्वपूर्ण सूचनाएं और सामान्य गलतियां",
  warns: [
    { icon: "⚠️", text: (<><strong>समय सीमा:</strong> हरियाणा राजस्व संहिता के अनुसार मृत्यु के 3 महीने के भीतर म्यूटेशन दाखिल करना जरूरी है।</>) },
    { icon: "⚠️", text: (<><strong>वारिस विवाद:</strong> यदि वारिस असहमत हों, मामला राजस्व न्यायालय में जाता है।</>) },
    { icon: "⚠️", text: (<><strong>कृषि भूमि:</strong> गैर-कृषक लोगों को कृषि भूमि विरासत में लेने में हरियाणा भूमि जोत सीमा अधिनियम के तहत प्रतिबंध का सामना हो सकता है।</>) },
  ],
  s5Title: "अक्सर पूछे जाने वाले प्रश्न",
  faqs: [
    { q: "क्या म्यूटेशन के लिए शारीरिक रूप से उपस्थित होना आवश्यक है?", a: "हां, आमतौर पर सभी कानूनी उत्तराधिकारियों को तहसीलदार/राजस्व अधिकारी के समक्ष उपस्थित होना पड़ता है।" },
    { q: "पूरी प्रक्रिया में कितना समय लगता है?", a: "यदि सभी दस्तावेज सही हैं, तो म्यूटेशन को अंतिम रूप देने में आमतौर पर हरियाणा में 30 से 45 दिन लगते हैं।" },
    { q: "क्या हक त्याग विलेख अनिवार्य है?", a: "नहीं। यह केवल तभी आवश्यक है जब एक या अधिक वारिस किसी अन्य वारिस के पक्ष में अपना हिस्सा छोड़ना चाहते हैं।" },
  ],
  s6Title: "उपयोगी हरियाणा सरकारी पोर्टल",
  portals: [
    { tag: "पोर्टल 1", name: "Jamabandi.nic.in", desc: "भूमि रिकॉर्ड, नकल, म्यूटेशन स्थिति ऑनलाइन देखें।", url: "https://jamabandi.nic.in" },
    { tag: "पोर्टल 2", name: "सरल हरियाणा", desc: "मृत्यु प्रमाण पत्र, कानूनी वारिस प्रमाण पत्र के लिए आवेदन करें।", url: "https://saralharyana.gov.in" },
    { tag: "पोर्टल 3", name: "ULB हरियाणा", desc: "शहरी संपत्ति कर म्यूटेशन और नगरपालिका सेवाएं।", url: "https://ulbhryndc.org" },
    { tag: "सहायता", name: "म्यूटेशन ट्रैक करें ↗", desc: "म्यूटेशन आवेदन ट्रैक करने के लिए MyPalwal से मार्गदर्शन लें।", url: null },
  ],
  toc: ["दो मार्गों को समझें", "चरण-दर-चरण प्रक्रिया", "आवश्यक दस्तावेज", "सामान्य गलतियां", "FAQs", "सरकारी पोर्टल"],
  ctaText: "अपनी संपत्ति के बारे में व्यक्तिगत कानूनी प्रश्न पूछें ↗",
  quickBtns: ["📋 सारांश", "📄 आवश्यक दस्तावेज", "⏳ समय-सीमा"],
};

const images = {
  hero: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
  s1: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80",
  s2: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80",
  s3: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80",
};

export default function HaryanaPropertyTransferBlog() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState("0%");

  const t = lang === "en" ? EN : HI;

  useEffect(() => {
    const handle = () => {
      const scrolled = document.documentElement.scrollTop || document.body.scrollTop;
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(`${(scrolled / total) * 100}%`);
    };
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const scrollToSection = (idx: number) => {
    const el = document.getElementById(`br-section-${idx}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(idx);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="blog-root">

        {/* Progress bar */}
        <div className="br-progress">
          <div className="br-progress-bar" style={{ width: scrollProgress }} />
        </div>

        {/* Language banner */}
        <div className="br-lang-banner">
          <span className="br-lang-label">{lang === "en" ? "Language:" : "भाषा:"}</span>
          <div className="br-lang-toggle">
            <button className={`br-lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>English</button>
            <button className={`br-lang-btn ${lang === "hi" ? "active" : ""}`} onClick={() => setLang("hi")}>हिंदी</button>
          </div>
        </div>

        {/* Hero */}
        <div className="br-hero">
          <img className="br-hero-img" src={images.hero} alt="Property in Haryana" />
          <div className="br-hero-scrim">
            <span className="br-hero-chip">{t.chip}</span>
            <h1>{t.heroTitle}</h1>
            <div className="br-meta-row">
              {t.metas.map((m, i) => (
                <span className="br-meta-pill" key={i}><span className="br-meta-dot" />{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="br-body">
          <div>

            {/* Intro */}
            <div className="br-intro">{t.intro}</div>

            {/* Quick actions */}
            <div className="br-quick-row">
              {t.quickBtns.map((b, i) => (
                <button key={i} className="br-quick-btn">{b}</button>
              ))}
            </div>

            {/* S1 */}
            <div className="br-section" id="br-section-0">
              <div className="br-section-header">
                <div className="br-sec-num">1</div>
                <h2>{t.s1Title}</h2>
              </div>
              <div className="br-img-wrap"><img src={images.s1} alt="Legal documents" /></div>
              <p>{t.s1Body}</p>
              <div className="br-route-grid">
                {t.routes.map((r, i) => (
                  <div className="br-route-card" key={i}>
                    <div className="br-route-tag">{r.tag}</div>
                    <div className="br-route-title">{r.title}</div>
                    <div className="br-route-desc">{r.desc}</div>
                  </div>
                ))}
              </div>
              <p>{t.s1Body2}</p>
            </div>

            {/* S2 */}
            <div className="br-section" id="br-section-1">
              <div className="br-section-header">
                <div className="br-sec-num">2</div>
                <h2>{t.s2Title}</h2>
              </div>
              <div className="br-img-wrap"><img src={images.s2} alt="Court process" /></div>
              <div className="br-accordion">
                {t.steps.map((s, i) => (
                  <div className="br-acc-item" key={i}>
                    <button className="br-acc-btn" onClick={() => setOpenStep(openStep === i ? null : i)}>
                      <span className="br-acc-left">
                        <span className="br-acc-circle">{s.num}</span>
                        <span className="br-acc-title">{s.title}</span>
                      </span>
                      <span className={`br-acc-arrow ${openStep === i ? "open" : ""}`}>⌄</span>
                    </button>
                    <div className={`br-acc-body ${openStep === i ? "open" : ""}`}>
                      <div className="br-acc-inner">{s.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* S3 */}
            <div className="br-section" id="br-section-2">
              <div className="br-section-header">
                <div className="br-sec-num">3</div>
                <h2>{t.s3Title}</h2>
              </div>
              <div className="br-img-wrap"><img src={images.s3} alt="Documents" /></div>
              <div className="br-table-wrap">
                <table className="br-table">
                  <thead>
                    <tr>
                      <th>{lang === "en" ? "Document" : "दस्तावेज"}</th>
                      <th>{lang === "en" ? "Purpose" : "उद्देश्य"}</th>
                      <th>{lang === "en" ? "Status" : "स्थिति"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.docs.map(([doc, purpose, status], i) => (
                      <tr key={i}>
                        <td>{doc}</td>
                        <td>{purpose}</td>
                        <td>
                          <span className={`br-badge ${status === "req" ? "br-badge-req" : "br-badge-opt"}`}>
                            {status === "req" ? (lang === "en" ? "Required" : "अनिवार्य") : (lang === "en" ? "If applicable" : "यदि लागू हो")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* S4 */}
            <div className="br-section" id="br-section-3">
              <div className="br-section-header">
                <div className="br-sec-num">4</div>
                <h2>{t.s4Title}</h2>
              </div>
              {t.warns.map((w, i) => (
                <div className="br-warn" key={i}>
                  <span className="br-warn-icon">{w.icon}</span>
                  <span>{w.text}</span>
                </div>
              ))}
            </div>

            {/* S5 FAQs */}
            <div className="br-section" id="br-section-4">
              <div className="br-section-header">
                <div className="br-sec-num">5</div>
                <h2>{t.s5Title}</h2>
              </div>
              <div className="br-accordion">
                {t.faqs.map((faq, i) => (
                  <div className="br-acc-item" key={i}>
                    <button className="br-acc-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span className="br-acc-left">
                        <span className="br-acc-title">{faq.q}</span>
                      </span>
                      <span className={`br-acc-arrow ${openFaq === i ? "open" : ""}`}>⌄</span>
                    </button>
                    <div className={`br-acc-body ${openFaq === i ? "open" : ""}`}>
                      <div className="br-faq-inner">{faq.a}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* S6 Portals */}
            <div className="br-section" id="br-section-5">
              <div className="br-section-header">
                <div className="br-sec-num">6</div>
                <h2>{t.s6Title}</h2>
              </div>
              <div className="br-portal-grid">
                {t.portals.map((p, i) => (
                  <a key={i} className="br-portal-card" href={p.url || "#"} target={p.url ? "_blank" : undefined} rel="noopener noreferrer">
                    <div className="br-portal-tag">{p.tag}</div>
                    <div className="br-portal-name">{p.name}</div>
                    <div className="br-portal-desc">{p.desc}</div>
                  </a>
                ))}
              </div>
            </div>

            <button className="br-cta">{t.ctaText}</button>
          </div>

          {/* Sidebar */}
          <div className="br-sidebar">
            <div className="br-toc">
              <div className="br-toc-heading">{lang === "en" ? "Contents" : "विषय-सूची"}</div>
              {t.toc.map((item, i) => (
                <button key={i} className={`br-toc-btn ${activeSection === i ? "active" : ""}`} onClick={() => scrollToSection(i)}>
                  <span className="br-toc-num">{String(i + 1).padStart(2, "0")}</span>
                  {item}
                </button>
              ))}
              <div className="br-share-label">{lang === "en" ? "Quick actions" : "त्वरित कार्य"}</div>
              <div className="br-share-row">
                {t.quickBtns.map((b, i) => (
                  <button key={i} className="br-share-btn">{b}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
