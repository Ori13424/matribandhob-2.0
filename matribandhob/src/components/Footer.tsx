"use client";
import Link from "next/link";
import {
  ShieldCheck, Facebook, Twitter, Instagram, Linkedin,
  Mail, Phone, ArrowRight, Award, FolderCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslation();

  const footerLinks = {
    portals: [
      { name: t.footer.links.motherPortal, href: "/register?role=mother" },
      { name: t.footer.links.doctorDashboard, href: "/register?role=doctor" },
      { name: t.footer.links.ambulanceNetwork, href: "/register?role=driver" },
      { name: t.footer.links.adminLogin, href: "/login" },
    ],
    company: [
      { name: t.footer.links.aboutUs, href: "/about" },
      { name: t.footer.links.ourMission, href: "/about#mission" },
      { name: t.footer.links.successStories, href: "/stories" },
      { name: t.footer.links.contactSupport, href: "/contact" },
    ],
    legal: [
      { name: t.footer.links.privacyPolicy, href: "/privacy" },
      { name: t.footer.links.termsOfService, href: "/terms" },
      { name: t.footer.links.cookiePolicy, href: "/cookies" },
      { name: t.footer.links.hipaaCompliance, href: "/compliance" },
    ]
  };

  return (
    <footer className="relative bg-[#020817] border-t border-white/5 pt-20 pb-10 overflow-hidden">

      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">

          {/* Brand Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Matribandhob</span>
            </Link>

            <p className="text-slate-400 leading-relaxed text-sm pr-6">
              {t.footer.brandDesc}
            </p>

            <div className="flex items-center gap-4 pt-2">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, color: "#fff" }}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 transition-colors hover:bg-blue-600 hover:border-blue-500"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns (2 cols each) */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-6">{t.footer.headers.portals}</h4>
            <ul className="space-y-4">
              {footerLinks.portals.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-6">{t.footer.headers.company}</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Contact (4 cols) */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-semibold mb-6">{t.footer.headers.stayUpdated}</h4>
            <p className="text-sm text-slate-400 mb-4">
              {t.footer.newsletter.desc}
            </p>

            <div className="relative mb-8">
              <input
                type="email"
                placeholder={t.footer.newsletter.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
              />
              <button className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>support@matribandhob.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-blue-500" />
                <span>+880 1700-000000</span>
              </div>
            </div>

            {/* CERTIFICATIONS */}
            <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <FolderCheck className="w-4 h-4" /> HIPAA Compliant
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" /> MoH Approved
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © {currentYear} {t.footer.copyright}
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link key={link.name} href={link.href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}