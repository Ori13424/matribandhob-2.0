"use client";
import Link from "next/link";
import { 
  ShieldCheck, Facebook, Twitter, Instagram, Linkedin, 
  Mail, Phone, MapPin, ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    portals: [
      { name: "Mother Portal", href: "/register?role=mother" },
      { name: "Doctor Dashboard", href: "/register?role=doctor" },
      { name: "Ambulance Network", href: "/register?role=driver" },
      { name: "Admin Login", href: "/login" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Our Mission", href: "/about#mission" },
      { name: "Success Stories", href: "/stories" },
      { name: "Contact Support", href: "/contact" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "HIPAA Compliance", href: "/compliance" },
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
              Empowering maternal healthcare with AI-driven insights, real-time emergency transport, and seamless doctor-patient connectivity.
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
            <h4 className="text-white font-semibold mb-6">Portals</h4>
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
            <h4 className="text-white font-semibold mb-6">Company</h4>
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
            <h4 className="text-white font-semibold mb-6">Stay Updated</h4>
            <p className="text-sm text-slate-400 mb-4">
              Subscribe to our newsletter for health tips and platform updates.
            </p>
            
            <div className="relative mb-8">
              <input 
                type="email" 
                placeholder="Enter your email" 
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
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © {currentYear} Matribandhob AI. All rights reserved.
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