import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import React from "react";

const Homepage: React.FC = () => {
  return (
    <div className="bg-[#080910] text-[#e3e1ea] font-sans selection:bg-primary selection:text-on-primary-container min-h-screen">
      <main className="pt-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 mb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
            >
              Find any file,<br />
              <span className="text-primary">anywhere.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-on-surface-variant max-w-lg mb-10 leading-relaxed"
            >
              ZenXplor aggregates your local disk, cloud drives, and email attachments into a single, lightning-fast command bar. Stop digging, start finding.
            </motion.p>
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="flex flex-wrap gap-4 mb-12"
            >
              <Link to="/login" className="signature-glow text-on-primary-fixed px-8 py-4 rounded-xl font-bold text-base hover:shadow-[0_0_30px_rgba(135,129,255,0.3)] transition-all">Start for free</Link>
              <a href="https://github.com/Servesh21/file_search1/releases/latest/download/zenxplor-agent.exe" className="ghost-border text-primary px-8 py-4 rounded-xl font-bold text-base bg-surface-container-low/50 hover:bg-surface-container-high transition-all flex items-center gap-2">
                 <span className="material-symbols-outlined text-[20px]">download</span> Download Agent
              </a>
            </motion.div>
            
            {/* Typewriter Search Demo Mockup */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.6, delay: 0.4 }}
               className="surface-container-lowest ghost-border rounded-xl p-4 max-w-md shadow-2xl relative overflow-hidden bg-surface-container-lowest"
            >
              <div className="flex items-center gap-3 text-on-surface-variant mb-2">
                <span className="material-symbols-outlined text-primary scale-75">search</span>
                <span className="font-mono text-sm">Searching for "Q4 Financials..."</span>
              </div>
              <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3 animate-pulse"></div>
              </div>
            </motion.div>
          </div>
          
          <div className="relative">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.8 }}
               transition={{ duration: 1, delay: 0.3 }}
               className="aspect-square rounded-full overflow-hidden mix-blend-lighten grayscale"
            >
              <img className="w-full h-full object-cover" data-alt="atmospheric dark globe from space with glowing data networks and soft blue illumination against a black background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjZ9n4F-EdS91RocWTyCWJO4tqbAj7_xfBkaLpEPJ1pytB9YuYrtuzQ_M3AzdvkOa0C__4q8Jdv6-tfOhKEn2apASOJxY7CpTj5Zv5qskZuOjw83X4eQjHCaWOO1mlWaiCidhqqDyH1TpAmxM3Th7cXry4GOwi7Ahft-u1EYSvw3CIGPheute_bZLgqMWumy8suLjEkxHBqUJg-A7up6ugKDVXCFkDBXc5FmMv3Ta0tTjbwbYmb5cZ5Vk-R-hC5eOQ-UxSky57Yok" alt="Globe" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#080910] via-transparent to-transparent"></div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="mb-32 overflow-hidden py-8 bg-surface-container-lowest/30">
          <div className="flex whitespace-nowrap gap-24 items-center justify-center opacity-30 grayscale hover:grayscale-0 transition-all">
            <div className="text-xl font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined">drive_eta</span> Google Drive</div>
            <div className="text-xl font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined">mail</span> Gmail</div>
            <div className="text-xl font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined">cloud</span> Dropbox</div>
            <div className="text-xl font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined">event_note</span> Notion</div>
            <div className="text-xl font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined">forum</span> Slack</div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="max-w-7xl mx-auto px-8 mb-32">
          <h2 className="text-3xl font-semibold mb-12 text-center text-white">Engineered for Precision</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Row 1 */}
            <div className="md:col-span-2 bg-surface-container-low rounded-xl p-8 flex flex-col justify-between min-h-[320px]">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-primary font-bold mb-4 block">Centralized Control</span>
                <h3 className="text-2xl font-bold mb-4 text-white">One bar. Every file.</h3>
                <p className="text-on-surface-variant leading-relaxed">The only interface you'll ever need. Access millions of documents across 15+ integrations in one unified view.</p>
              </div>
              <div className="mt-8 flex gap-2">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined text-primary">description</span></div>
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined text-primary">image</span></div>
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined text-primary">table_chart</span></div>
              </div>
            </div>
            
            <div className="bg-surface-container-high rounded-xl p-8 flex flex-col justify-center items-center text-center">
              <span className="text-6xl font-mono font-bold text-primary mb-2 text-primary">50ms</span>
              <h3 className="text-xl font-bold text-white">search</h3>
              <p className="text-sm text-on-surface-variant mt-2">Faster than the human eye can blink. Instant indexing.</p>
            </div>
            
            {/* Row 2 */}
            <div className="md:col-span-3 bg-surface-container-lowest ghost-border rounded-xl p-12 overflow-hidden relative group">
              <div className="relative z-10 max-w-2xl">
                <span className="text-[11px] uppercase tracking-widest text-primary font-bold mb-4 block">Infinite Connectivity</span>
                <h3 className="text-3xl font-bold mb-6 text-white">Unified local, cloud, and email.</h3>
                <p className="text-on-surface-variant text-lg">No more switching tabs. ZenXplor builds a semantic bridge between your PC, your Google Drive, and your Outlook attachments.</p>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none group-hover:from-primary/20 transition-all"></div>
            </div>
            
            {/* Row 3 */}
            <div className="bg-surface-container-low rounded-xl p-8">
              <span className="material-symbols-outlined text-4xl text-primary mb-6">shield</span>
              <h3 className="text-xl font-bold mb-3 text-white">Privacy focus</h3>
              <p className="text-on-surface-variant text-sm">End-to-end encryption. Your metadata stays on your device. We never see your files.</p>
            </div>
            
            <div className="md:col-span-2 bg-surface-container-high rounded-xl p-8 flex items-center justify-between">
              <div className="max-w-xs">
                <h3 className="text-xl font-bold mb-3 text-white">Multi-account support</h3>
                <p className="text-on-surface-variant text-sm">Switch between work, personal, and side-hustle accounts seamlessly without logging out.</p>
              </div>
              <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full border-4 border-surface-container-high bg-slate-700 flex items-center justify-center font-bold text-white">JD</div>
                <div className="w-12 h-12 rounded-full border-4 border-surface-container-high bg-primary/40 flex items-center justify-center font-bold text-white">ZB</div>
                <div className="w-12 h-12 rounded-full border-4 border-surface-container-high bg-indigo-900 flex items-center justify-center font-bold text-white">+3</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="max-w-7xl mx-auto px-8 mb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 text-white">Architected for Speed</h2>
            <p className="text-on-surface-variant">Three steps to a cleaner workflow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-16 relative">
            <div className="relative">
              <span className="absolute -top-12 -left-4 text-9xl font-black text-white/5 pointer-events-none">01</span>
              <h4 className="text-xl font-bold mb-4 relative text-white">Connect Sources</h4>
              <p className="text-on-surface-variant leading-relaxed">Securely authorize your drives and local folders. ZenXplor begins mapping your data architecture in the background.</p>
            </div>
            <div className="relative">
              <span className="absolute -top-12 -left-4 text-9xl font-black text-white/5 pointer-events-none">02</span>
              <h4 className="text-xl font-bold mb-4 relative text-white">Semantic Indexing</h4>
              <p className="text-on-surface-variant leading-relaxed">Our engine builds an index database. It doesn't just store names; it understands context and file relationships.</p>
            </div>
            <div className="relative">
              <span className="absolute -top-12 -left-4 text-9xl font-black text-white/5 pointer-events-none">03</span>
              <h4 className="text-xl font-bold mb-4 relative text-white">Search Anywhere</h4>
              <p className="text-on-surface-variant leading-relaxed">Hit `Cmd + K` from any application. Type anything. Find exactly what you need in under 50 milliseconds.</p>
            </div>
          </div>
          
          <div className="mt-24 bg-surface-container-low rounded-2xl p-4 shadow-2xl border border-white/5">
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-white/5">
              <div className="bg-surface-container-high px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="mx-auto text-[11px] font-mono opacity-40 text-white">ZENXPLOR_SEARCH_UI</div>
              </div>
              <img className="w-full aspect-video object-cover opacity-60" data-alt="sleek dashboard interface showing data visualizations and search results in a dark minimalist aesthetic with violet accents" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzTvO42lZ-LDSp6M4ghpqRfz3SCizThnLxWYMo_IQdGeD_atuvXQ7jgZXUWT1mLY_Yq5aenPMhKnPWa1EIlxiuuQBCdzzDFFlJ7ZU5DcecsKZDSTTfrSEAkPEKBIzxISaCSwFiKYcxS7tAzs38RR24C9XRCNZxZMhKgFg39IKTXy79JCOKWiAn3WM-oI-sBP9SbEZ2OIwpmoGXjSVeV89kiIUrA-3cjootJs2k91HSsXVFDFE4K2WAx_BwQf9ViJbuetzEEsZt-3A" alt="Dashboard Mockup" />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-7xl mx-auto px-8 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">Simple, Transparent Pricing</h2>
            <div className="inline-flex items-center bg-surface-container-lowest p-1 rounded-lg ghost-border">
              <button className="px-6 py-2 rounded-md bg-surface-container-high text-sm font-bold text-white">Monthly</button>
              <button className="px-6 py-2 rounded-md text-sm font-bold opacity-40 text-white">Annual <span className="text-primary">-20%</span></button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-surface-container-low p-10 rounded-xl flex flex-col">
              <h3 className="text-xl font-bold mb-2 text-white">Free</h3>
              <div className="mb-6"><span className="text-4xl font-black text-white">$0</span><span className="text-on-surface-variant text-sm">/mo</span></div>
              <p className="text-on-surface-variant text-sm mb-8">Essential search for individuals getting started.</p>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-3 text-sm opacity-80 text-white"><span className="material-symbols-outlined text-primary scale-75">check_circle</span> 2 Cloud Integrations</li>
                <li className="flex items-center gap-3 text-sm opacity-80 text-white"><span className="material-symbols-outlined text-primary scale-75">check_circle</span> Local Disk Search</li>
                <li className="flex items-center gap-3 text-sm opacity-80 text-white"><span className="material-symbols-outlined text-primary scale-75">check_circle</span> 1GB Metadata Index</li>
              </ul>
              <Link to="/login" className="ghost-border w-full py-3 rounded-lg font-bold hover:bg-surface-container-high transition-all text-center text-white">Get Started</Link>
            </div>
            
            {/* Pro */}
            <div className="bg-surface-container-low p-10 rounded-xl flex flex-col relative border-2 border-primary/40 shadow-[0_0_50px_rgba(135,129,255,0.1)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 signature-glow text-on-primary-fixed text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">Most popular</div>
              <h3 className="text-xl font-bold mb-2 text-white">Pro</h3>
              <div className="mb-6"><span className="text-4xl font-black text-white">$12</span><span className="text-on-surface-variant text-sm">/mo</span></div>
              <p className="text-on-surface-variant text-sm mb-8">Advanced search for power users and creators.</p>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Unlimited Integrations</li>
                <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Priority Indexing</li>
                <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Advanced Filters</li>
                <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Multi-account Link</li>
              </ul>
              <button className="signature-glow text-on-primary-fixed w-full py-3 rounded-lg font-bold">Start Pro Trial</button>
            </div>
            
            {/* Team */}
            <div className="bg-surface-container-low p-10 rounded-xl flex flex-col">
              <h3 className="text-xl font-bold mb-2 text-white">Team</h3>
              <div className="mb-6"><span className="text-4xl font-black text-white">$49</span><span className="text-on-surface-variant text-sm">/mo</span></div>
              <p className="text-on-surface-variant text-sm mb-8">Collaborative intelligence for small teams.</p>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-3 text-sm opacity-80 text-white"><span className="material-symbols-outlined text-primary scale-75">check_circle</span> Up to 10 Members</li>
                <li className="flex items-center gap-3 text-sm opacity-80 text-white"><span className="material-symbols-outlined text-primary scale-75">check_circle</span> Shared Knowledge Base</li>
                <li className="flex items-center gap-3 text-sm opacity-80 text-white"><span className="material-symbols-outlined text-primary scale-75">check_circle</span> Admin Controls</li>
              </ul>
              <button className="ghost-border w-full py-3 rounded-lg font-bold hover:bg-surface-container-high transition-all text-white">Contact Sales</button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-8 mb-32">
          <div className="bg-[#6C63FF] rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <img className="w-full h-full object-cover" data-alt="abstract flowing 3d shapes and dynamic lines in a minimalist aesthetic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTbLi7fjB2phZV2ClJh17P0LccGMv5SK1DZ-M0_KZceLdmv7akhl-qxx0Vj0ZqPeCElJliqXvlfjVDLrt_HQTH9NodjBnFxm_2CV6_B6Z3DCLeGx-TNEUfPHr3mwzEvfbX6Ple82uOvc-CnU9ZEqJO2Us2e7xBJXedxtdsh7nrH1k4xDpwKJkN_FntzMgt2VdeUvx1me7nHebqRrRZQ5zPNsRny3BsF6Sj3a3iXhJPekPNokCO1lhmp_KT7ucUMzpVKE95lK5qu5A" alt="Abstract Background" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">Ready to never lose a file again?</h2>
              <p className="text-indigo-100 text-lg mb-12 max-w-2xl mx-auto">Join professionals who trust ZenXplor to organize their digital life.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/login" className="bg-white text-[#6C63FF] px-10 py-5 rounded-xl font-black text-lg hover:bg-indigo-50 transition-colors shadow-xl">Get started free</Link>
                <button className="bg-indigo-700/30 text-white border border-white/20 backdrop-blur-md px-10 py-5 rounded-xl font-black text-lg hover:bg-indigo-700/50 transition-colors">Book a demo</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Homepage;